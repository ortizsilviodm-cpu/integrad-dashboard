/* integrad-dashboard/src/api/dashboard.ts */

import { safeFetch } from "./safeFetch";
import { API_URL } from "../config/api";

/**
 * Fila cruda que viene del backend en /dashboard/followup-patients.
 * Estos nombres deben matchear el JSON que responde el backend.
 */
interface DashboardApiRow {
  patientId: string;
  fullName: string;
  documentNumber: string | null;

  lastGlucoseValue: number | null;
  lastGlucoseUnit: string | null;
  lastGlucoseAt: string | null;

  adherencePercent: number | null;
  statusLabel: string | null;
  openAlerts: number | null;
}

/**
 * Metadatos crudos que devuelve el backend.
 */
interface DashboardApiMeta {
  windowDays?: number;
  limit?: number;
  generatedAt?: string;
  hasNext?: boolean;
  hasPrev?: boolean;
  nextCursor?: string | null;
}

/**
 * Respuesta cruda del backend.
 */
interface DashboardApiResponse {
  data: DashboardApiRow[];
  meta?: DashboardApiMeta;
}

/**
 * Fila que usa el Dashboard (tabla + KPIs).
 * Incluye:
 *  - Campos formateados para la tabla.
 *  - Campos numéricos crudos para las tarjetas KPI.
 */
export interface PatientFollowUpRow {
  // Identificación básica
  patientId: string;
  fullName: string;
  documentNumber: string;

  // Labels formateados para la tabla
  lastGlucose: string;
  adherence: string;
  statusLabel: string;
  openAlerts: number;

  // Campos crudos usados por las tarjetas KPI
  lastGlucoseValue: number | null;
  lastGlucoseUnit: string | null;
  lastGlucoseAt: string | null;
  adherencePercent: number | null;
}

/**
 * Metadatos que usa el Dashboard para mostrar info de ventana/paginación.
 */
export interface DashboardPageMeta {
  windowDays: number | null;
  limit: number | null;
  generatedAt: string | null;
  hasNext: boolean;
  hasPrev: boolean;
  nextCursor: string | null;
}

/**
 * Resultado estándar que devuelve fetchFollowUpPatientsPage.
 */
export interface FetchFollowUpPatientsPageResult {
  ok: boolean;
  data: PatientFollowUpRow[];
  error: string | null;
  meta: DashboardPageMeta;
}

/**
 * Formatea la última glucemia con unidad y fecha (si existe).
 */
function formatLastGlucose(
  value: number | null,
  unit: string | null,
  at: string | null
): string {
  if (value == null || !unit) {
    return "Sin datos recientes";
  }

  const base = `${value} ${unit}`;

  if (!at) return base;

  const d = new Date(at);
  if (Number.isNaN(d.getTime())) return base;

  const fecha = d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
  });

  return `${base} • ${fecha}`;
}

/**
 * Formatea la adherencia en porcentaje.
 */
function formatAdherence(percent: number | null): string {
  if (percent == null) return "—";
  return `${percent.toFixed(0)} %`;
}

/**
 * Meta por defecto si el backend no devuelve nada o hay error.
 */
function getDefaultMeta(): DashboardPageMeta {
  return {
    windowDays: null,
    limit: null,
    generatedAt: null,
    hasNext: false,
    hasPrev: false,
    nextCursor: null,
  };
}

/**
 * Mapea fila cruda → fila para el Dashboard (tabla + KPIs).
 */
function mapApiRowToFollowUpRow(row: DashboardApiRow): PatientFollowUpRow {
  const lastGlucoseLabel = formatLastGlucose(
    row.lastGlucoseValue,
    row.lastGlucoseUnit,
    row.lastGlucoseAt
  );

  const adherenceLabel = formatAdherence(row.adherencePercent);

  return {
    patientId: row.patientId,
    fullName: row.fullName,
    documentNumber: row.documentNumber ?? "—",

    lastGlucose: lastGlucoseLabel,
    adherence: adherenceLabel,
    statusLabel: row.statusLabel || "En seguimiento",
    openAlerts: row.openAlerts ?? 0,

    lastGlucoseValue: row.lastGlucoseValue,
    lastGlucoseUnit: row.lastGlucoseUnit,
    lastGlucoseAt: row.lastGlucoseAt,
    adherencePercent: row.adherencePercent,
  };
}

/**
 * Carga una página de pacientes para el Dashboard Clínico,
 * usando el endpoint /dashboard/followup-patients con paginación por cursor.
 *
 * - limit: cantidad máxima de pacientes
 * - days: ventana de días para el cálculo de adherencia
 * - cursor: cursor de paginación (null = primera página)
 */
export async function fetchFollowUpPatientsPage(params?: {
  limit?: number;
  days?: number;
  cursor?: string | null;
}): Promise<FetchFollowUpPatientsPageResult> {
  const { limit, days, cursor } = params ?? {};

  const query = new URLSearchParams();

  if (typeof limit === "number" && Number.isFinite(limit) && limit > 0) {
    query.set("limit", String(limit));
  }

  if (typeof days === "number" && Number.isFinite(days) && days > 0) {
    query.set("days", String(days));
  }

  if (cursor) {
    query.set("cursor", cursor);
  }

  const queryString = query.toString();
  const endpoint = queryString
    ? `${API_URL}/dashboard/followup-patients?${queryString}`
    : `${API_URL}/dashboard/followup-patients`;

  const result = await safeFetch<DashboardApiResponse>(endpoint);

  if (!result.ok || !result.data || !Array.isArray(result.data.data)) {
    return {
      ok: false,
      data: [],
      error:
        result.error ??
        "No se pudieron cargar los pacientes en seguimiento. Intente nuevamente.",
      meta: getDefaultMeta(),
    };
  }

  try {
    const apiRows = result.data.data;
    const mapped = apiRows.map(mapApiRowToFollowUpRow);

    const metaApi = result.data.meta ?? {};
    const meta: DashboardPageMeta = {
      windowDays: metaApi.windowDays ?? null,
      limit: metaApi.limit ?? null,
      generatedAt: metaApi.generatedAt ?? null,
      hasNext: Boolean(metaApi.hasNext),
      hasPrev: Boolean(metaApi.hasPrev),
      nextCursor: metaApi.nextCursor ?? null,
    };

    return {
      ok: true,
      data: mapped,
      error: null,
      meta,
    };
  } catch (err) {
    console.error("Error mapeando followup-patients:", err);
    return {
      ok: false,
      data: [],
      error: "Error interno procesando los datos del dashboard.",
      meta: getDefaultMeta(),
    };
  }
}

/**
 * Wrapper de compatibilidad (si en algún lugar viejo se llamaba
 * fetchFollowUpPatients() sin paginación ni meta).
 */
export async function fetchFollowUpPatients() {
  return fetchFollowUpPatientsPage();
}
