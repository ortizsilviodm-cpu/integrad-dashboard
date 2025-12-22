/* integrad-dashboard/src/api/patients.ts */

import { safeFetch } from "./safeFetch";
import { API_URL } from "../config/api";

/**
 * Fila cruda que viene del backend (/dashboard/followup-patients).
 */
interface PatientsApiRow {
  patientId: string;
  fullName: string;
  documentNumber: string;
  lastGlucoseValue: number | null;
  lastGlucoseUnit: string | null;
  lastGlucoseAt: string | null;
  adherencePercent: number | null;
  statusLabel: string;
  openAlerts: number;

  // Enrolamiento (puede venir completo o parcial según el backend)
  enrolled?: boolean;
  programType?: string | null;
  programStatus?: string | null;
  enrollmentDate?: string | null;
  mainProvider?: string | null;
}

/**
 * Metadatos de paginación entregados por el backend.
 */
interface PatientsApiMeta {
  windowDays: number;
  limit: number;
  total?: number;
  hasNext?: boolean;
  hasPrev?: boolean;
  nextCursor?: string;
}

/**
 * Respuesta esperada del backend.
 */
interface PatientsApiResponse {
  data: PatientsApiRow[];
  meta?: PatientsApiMeta;
}

/**
 * Tipo que usa la tabla del dashboard.
 */
export type PatientRow = {
  id: string;
  name: string;
  document: string;
  lastGlucose: string;
  adherence: string;
  status: string;

  enrolled: boolean;
  programType: string | null;
  programStatus: string | null;
  enrollmentDate: string | null;
  mainProvider: string | null;
};

/**
 * Metadatos limpios hacia la UI.
 */
export type PatientsPageMeta = {
  windowDays: number | null;
  limit: number | null;
  hasNext: boolean;
  hasPrev: boolean;
  nextCursor: string | null;
};

export type FetchPatientsPageResult = {
  ok: boolean;
  data: PatientRow[];
  error: string | null;
  meta: PatientsPageMeta;
};

/**
 * Formato de glucemia reciente.
 */
function formatLastGlucose(row: PatientsApiRow): string {
  if (row.lastGlucoseValue == null || !row.lastGlucoseUnit) {
    return "Sin datos recientes";
  }

  const base = `${row.lastGlucoseValue} ${row.lastGlucoseUnit}`;

  if (!row.lastGlucoseAt) return base;

  const d = new Date(row.lastGlucoseAt);
  if (Number.isNaN(d.getTime())) return base;

  const fecha = d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
  });

  return `${base} • ${fecha}`;
}

/**
 * Formato de adherencia.
 */
function formatAdherence(row: PatientsApiRow): string {
  if (row.adherencePercent == null) return "—";
  return `${row.adherencePercent.toFixed(0)} %`;
}

/**
 * Determina enrolled de forma robusta:
 * - Si backend manda `enrolled`, se respeta (fuente de verdad).
 * - Si no lo manda, inferimos desde programStatus.
 */
function computeEnrolled(row: PatientsApiRow): boolean {
  if (typeof row.enrolled === "boolean") return row.enrolled;

  const status = (row.programStatus ?? "").toLowerCase().trim();

  // Se aceptan variantes comunes
  if (status === "active") return true;
  if (status === "activo") return true;
  if (status === "enrolled") return true;
  if (status === "enrolado") return true;

  return false;
}

/**
 * Mapea crudo → UI.
 */
function mapApiRowToPatientRow(row: PatientsApiRow): PatientRow {
  return {
    id: row.patientId,
    name: row.fullName || "Sin nombre",
    document: row.documentNumber || "—",
    lastGlucose: formatLastGlucose(row),
    adherence: formatAdherence(row),
    status: row.statusLabel || "En seguimiento",

    enrolled: computeEnrolled(row),
    programType: row.programType ?? null,
    programStatus: row.programStatus ?? null,
    enrollmentDate: row.enrollmentDate ?? null,
    mainProvider: row.mainProvider ?? null,
  };
}

/**
 * Meta default para errores.
 */
function getDefaultMeta(): PatientsPageMeta {
  return {
    windowDays: null,
    limit: null,
    hasNext: false,
    hasPrev: false,
    nextCursor: null,
  };
}

/**
 * Carga paginada desde /dashboard/followup-patients.
 */
export async function fetchPatientsPage(params?: {
  limit?: number;
  cursor?: string | null;
}): Promise<FetchPatientsPageResult> {
  const { limit, cursor } = params ?? {};

  const query = new URLSearchParams();
  if (typeof limit === "number" && limit > 0) {
    query.set("limit", String(limit));
  }
  if (cursor) {
    query.set("cursor", cursor);
  }

  const qs = query.toString();
  const endpoint = qs
    ? `${API_URL}/dashboard/followup-patients?${qs}`
    : `${API_URL}/dashboard/followup-patients`;

  const result = await safeFetch<PatientsApiResponse>(endpoint);

  if (!result.ok || !result.data || !Array.isArray(result.data.data)) {
    return {
      ok: false,
      data: [],
      error:
        result.error ??
        "No se pudieron cargar los pacientes. Intente nuevamente.",
      meta: getDefaultMeta(),
    };
  }

  try {
    const apiRows = result.data.data;
    const mapped = apiRows.map(mapApiRowToPatientRow);

    const meta = result.data.meta;
    const metaOut: PatientsPageMeta = {
      windowDays: meta?.windowDays ?? null,
      limit: meta?.limit ?? null,
      hasNext: Boolean(meta?.hasNext),
      hasPrev: Boolean(meta?.hasPrev),
      nextCursor: meta?.nextCursor ?? null,
    };

    return { ok: true, data: mapped, error: null, meta: metaOut };
  } catch (_err) {
    return {
      ok: false,
      data: [],
      error: "Error interno procesando los datos de pacientes.",
      meta: getDefaultMeta(),
    };
  }
}

/**
 * Wrapper compatibilidad.
 */
export async function fetchPatientsForTable(): Promise<{
  ok: boolean;
  data: PatientRow[];
  error: string | null;
}> {
  const r = await fetchPatientsPage();
  return { ok: r.ok, data: r.data, error: r.error };
}

/* =======================================================================
 * API — Resumen 360° del paciente
 * =====================================================================*/

interface PatientSummaryApiResponse {
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    documentId: string;
    documentNumber: string;
    phone: string | null;
    affiliateNumber: string | null;
    healthPlan: string | null;
    payerCode: string | null;

    // Tolerancia a naming inconsistente
    memberShipCode?: string | null;
    membershipCode?: string | null;
  };
  adherence: {
    patientId: string;
    windowDays: number;
    daysCovered: number;
    adherencePercent: number;
  } | null;
  kpis90d: {
    dispenses: number;
    ambulatoryEpisodes: number;
    readings: number;
    alerts: number;
  };
}

export interface PatientTimelineEventApi {
  id: string;
  patientId: string;
  type: string;
  date: string;
  title: string;
  description: string;
  sourceTable: string;
  sourceId: string;
}

interface PatientTimelineApiResponse {
  data: PatientTimelineEventApi[];
}

export type PatientSummary = {
  id: string;
  name: string;
  document: string;
  phone: string | null;
  affiliateNumber: string | null;
  healthPlan: string | null;
  payerCode: string | null;

  adherencePercent: number | null;
  adherenceLabel: string;
  windowDays: number | null;
  daysCovered: number | null;

  kpis90d: {
    dispenses: number;
    ambulatoryEpisodes: number;
    readings: number;
    alerts: number;
  };
};

export type FetchPatientSummaryResult = {
  ok: boolean;
  data: PatientSummary | null;
  error: string | null;
};

export type PatientTimelineItem = {
  id: string;
  type: string;
  date: string;
  dateLabel: string;
  title: string;
  description: string;
  sourceTable: string;
  sourceId: string;
};

export type FetchPatientTimelineResult = {
  ok: boolean;
  data: PatientTimelineItem[];
  error: string | null;
};

function formatTimelineDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;

  return d.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function mapSummaryApiToUi(payload: PatientSummaryApiResponse): PatientSummary {
  const p = payload.patient;
  const a = payload.adherence;

  const adherencePercent = a?.adherencePercent ?? null;
  const windowDays = a?.windowDays ?? null;
  const daysCovered = a?.daysCovered ?? null;

  const adherenceLabel =
    adherencePercent == null
      ? "Sin datos de adherencia"
      : `${adherencePercent.toFixed(0)} % en ${windowDays ?? "?"} días`;

  return {
    id: p.id,
    name: p.fullName || `${p.firstName} ${p.lastName}`.trim() || "Sin nombre",
    document: p.documentNumber || p.documentId,
    phone: p.phone,
    affiliateNumber: p.affiliateNumber,
    healthPlan: p.healthPlan,
    payerCode: p.payerCode,

    adherencePercent,
    adherenceLabel,
    windowDays,
    daysCovered,

    kpis90d: {
      dispenses: payload.kpis90d.dispenses ?? 0,
      ambulatoryEpisodes: payload.kpis90d.ambulatoryEpisodes ?? 0,
      readings: payload.kpis90d.readings ?? 0,
      alerts: payload.kpis90d.alerts ?? 0,
    },
  };
}

function mapTimelineApiToUi(
  events: PatientTimelineEventApi[]
): PatientTimelineItem[] {
  return events
    .slice()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map((e) => ({
      id: e.id,
      type: e.type,
      date: e.date,
      dateLabel: formatTimelineDate(e.date),
      title: e.title,
      description: e.description,
      sourceTable: e.sourceTable,
      sourceId: e.sourceId,
    }));
}

export async function fetchPatientSummary(
  patientId: string
): Promise<FetchPatientSummaryResult> {
  if (!patientId) {
    return {
      ok: false,
      data: null,
      error: "Falta el identificador de paciente.",
    };
  }

  const endpoint = `${API_URL}/patients/${encodeURIComponent(patientId)}/summary`;
  const result = await safeFetch<PatientSummaryApiResponse>(endpoint);

  if (!result.ok || !result.data) {
    return {
      ok: false,
      data: null,
      error:
        result.error ??
        "No se pudo cargar el resumen del paciente. Intente nuevamente.",
    };
  }

  try {
    const mapped = mapSummaryApiToUi(result.data);
    return { ok: true, data: mapped, error: null };
  } catch (_err) {
    return {
      ok: false,
      data: null,
      error: "Error procesando el resumen.",
    };
  }
}

export async function fetchPatientTimeline(
  patientId: string
): Promise<FetchPatientTimelineResult> {
  if (!patientId) {
    return {
      ok: false,
      data: [],
      error: "Falta el identificador de paciente.",
    };
  }

  const endpoint = `${API_URL}/patients/${encodeURIComponent(
    patientId
  )}/timeline`;
  const result = await safeFetch<PatientTimelineApiResponse>(endpoint);

  if (!result.ok || !result.data || !Array.isArray(result.data.data)) {
    return {
      ok: false,
      data: [],
      error:
        result.error ?? "No se pudo cargar el timeline. Intente nuevamente.",
    };
  }

  try {
    const mapped = mapTimelineApiToUi(result.data.data);
    return { ok: true, data: mapped, error: null };
  } catch (_err) {
    return {
      ok: false,
      data: [],
      error: "Error procesando el timeline.",
    };
  }
}

/* =======================================================================
 * API de Medicación del Paciente
 * =====================================================================*/

/**
 * Fila de medicación del paciente (mapea 1:1 al backend)
 */
export type PatientMedicationRow = {
  id: string;
  patientId: string;
  medicationId: string;

  medicationCode: string;
  medicationName: string;
  therapeuticFamily: string | null;

  type: "CRONICO" | "OCASIONAL";

  dose: string;
  frequency: string;
  schedulePattern: string | null;
  route: string | null;

  startDate: string;
  endDate: string | null;
  isActive: boolean;

  prescriberName: string | null;
  notes: string | null;
};

export type FetchPatientMedicationsResult = {
  ok: boolean;
  data: PatientMedicationRow[];
  error: string | null;
};

/**
 * GET /patients/:id/medications
 */
export async function fetchPatientMedications(
  patientId: string
): Promise<FetchPatientMedicationsResult> {
  if (!patientId) {
    return {
      ok: false,
      data: [],
      error: "Falta el identificador del paciente",
    };
  }

  const endpoint = `${API_URL}/patients/${encodeURIComponent(
    patientId
  )}/medications`;

  const result = await safeFetch<{ data: PatientMedicationRow[] }>(endpoint);

  if (!result.ok || !result.data || !Array.isArray(result.data.data)) {
    return {
      ok: false,
      data: [],
      error:
        result.error ??
        "No se pudo cargar la medicación del paciente. Intente nuevamente.",
    };
  }

  return { ok: true, data: result.data.data, error: null };
}

/* =======================================================================
 * API de Adherencia Real del Paciente (PDC)
 * =====================================================================*/

export interface PatientAdherenceApiResponse {
  patientId: string;
  windowDays: number;
  daysCovered: number;
  daysUncovered: number;
  adherencePercent: number;
  lastPickupDate: string | null;
  delayedDispenses: number;
  missedDispenses: number;
  maxGap: number;
}

export type FetchPatientAdherenceResult = {
  ok: boolean;
  data: PatientAdherenceApiResponse | null;
  error: string | null;
};

/**
 * GET /patients/:id/adherence?windowDays=90
 */
export async function fetchPatientAdherence(
  patientId: string,
  windowDays: number = 90
): Promise<FetchPatientAdherenceResult> {
  if (!patientId) {
    return {
      ok: false,
      data: null,
      error: "Falta el identificador de paciente.",
    };
  }

  const params = new URLSearchParams();
  params.set("windowDays", String(windowDays));

  const endpoint = `${API_URL}/patients/${encodeURIComponent(
    patientId
  )}/adherence?${params.toString()}`;

  const result = await safeFetch<PatientAdherenceApiResponse>(endpoint);

  if (!result.ok || !result.data) {
    return {
      ok: false,
      data: null,
      error:
        result.error ??
        "No se pudo calcular la adherencia del paciente. Intente nuevamente.",
    };
  }

  return {
    ok: true,
    data: result.data,
    error: null,
  };
}

/* =======================================================================
 * M5 — IA Predictiva (Risk Snapshots)
 * =====================================================================*/

export type M5RiskLevel = "low" | "medium" | "high" | "critical";

export type M5SuggestedActionPriority = "low" | "medium" | "high" | "critical";

/**
 * Acciones sugeridas por IA.
 * Campos opcionales para tolerar evolución del backend.
 */
export type M5SuggestedAction = {
  priority?: M5SuggestedActionPriority | string;
  title?: string;
  reason?: string;

  actionType?: string;
  category?: string;
  code?: string;
};

export type PatientRiskSnapshot = {
  id: string;
  patientId: string;

  windowDays: number;
  modelVersion: string;
  generatedAt: string;

  riskScore: number;
  riskLevel: M5RiskLevel;

  clinicalRisk: number;
  adherenceRisk: number;
  operationalRisk: number;

  reasons: string[];
  flags: {
    needsContact: boolean;
    dataIncomplete: boolean;
    needsClinicalReview: boolean;
    highPriorityCaseload: boolean;
  };

  dataCompleteness: {
    readingsPresent: boolean;
    dispensesSignal: boolean;
    alertsSignal: boolean;
  };

  suggestedActions?: M5SuggestedAction[];
};

type PatientRiskSnapshotApiResponse =
  | {
      patientId: string;
      snapshot: PatientRiskSnapshot;
    }
  | PatientRiskSnapshot;

export type FetchPatientRiskSnapshotResult = {
  ok: boolean;
  data: PatientRiskSnapshot | null;
  error: string | null;
};

function normalizeRiskSnapshot(
  payload: PatientRiskSnapshotApiResponse
): PatientRiskSnapshot | null {
  if (!payload) return null;

  // Caso A: { patientId, snapshot }
  const maybeObj = payload as { snapshot?: unknown };
  if (maybeObj.snapshot && typeof maybeObj.snapshot === "object") {
    return maybeObj.snapshot as PatientRiskSnapshot;
  }

  // Caso B: snapshot directo
  if ((payload as any).patientId && (payload as any).riskScore != null) {
    return payload as PatientRiskSnapshot;
  }

  return null;
}

/**
 * GET /patients/:id/risk
 * GET /patients/:id/risk?windowDays=90&modelVersion=m5_v1
 */
export async function fetchPatientRiskSnapshot(params: {
  patientId: string;
  windowDays?: number;
  modelVersion?: string;
}): Promise<FetchPatientRiskSnapshotResult> {
  const patientId = (params.patientId || "").trim();
  if (!patientId) {
    return {
      ok: false,
      data: null,
      error: "Falta el identificador de paciente.",
    };
  }

  const qs = new URLSearchParams();
  if (typeof params.windowDays === "number" && params.windowDays > 0) {
    qs.set("windowDays", String(params.windowDays));
  }
  if (params.modelVersion && params.modelVersion.trim()) {
    qs.set("modelVersion", params.modelVersion.trim());
  }

  const endpoint = qs.toString()
    ? `${API_URL}/patients/${encodeURIComponent(patientId)}/risk?${qs.toString()}`
    : `${API_URL}/patients/${encodeURIComponent(patientId)}/risk`;

  const result = await safeFetch<PatientRiskSnapshotApiResponse>(endpoint);

  if (!result.ok || !result.data) {
    return {
      ok: false,
      data: null,
      error:
        result.error ??
        "No se pudo cargar el snapshot de riesgo (M5). Intente nuevamente.",
    };
  }

  const snapshot = normalizeRiskSnapshot(result.data);
  if (!snapshot) {
    return {
      ok: false,
      data: null,
      error: "Respuesta inválida del backend para snapshot de riesgo (M5).",
    };
  }

  return { ok: true, data: snapshot, error: null };
}

export type M5StatusResponse = {
  windowDays: number;
  modelVersion: string;
  latestGeneratedAt: string | null;
  snapshotsCount: number;
};

export type FetchM5StatusResult = {
  ok: boolean;
  data: M5StatusResponse | null;
  error: string | null;
};

/**
 * GET /m5/status?windowDays=90&modelVersion=m5_v1
 */
export async function fetchM5Status(params?: {
  windowDays?: number;
  modelVersion?: string;
}): Promise<FetchM5StatusResult> {
  const qs = new URLSearchParams();
  if (typeof params?.windowDays === "number" && params.windowDays > 0) {
    qs.set("windowDays", String(params.windowDays));
  }
  if (params?.modelVersion && params.modelVersion.trim()) {
    qs.set("modelVersion", params.modelVersion.trim());
  }

  const endpoint = qs.toString()
    ? `${API_URL}/m5/status?${qs.toString()}`
    : `${API_URL}/m5/status`;

  const result = await safeFetch<M5StatusResponse>(endpoint);

  if (!result.ok || !result.data) {
    return {
      ok: false,
      data: null,
      error:
        result.error ?? "No se pudo consultar el estado de M5. Intente nuevamente.",
    };
  }

  return { ok: true, data: result.data, error: null };
}
