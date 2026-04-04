/* integrad-dashboard/src/api/patients.ts */

import { safeFetch } from "./safeFetch";
import { API_URL } from "../config/api";

/**
 * =========================================================================
 * LISTADO — Fuente de verdad: Prisma IntegraD DB (/patients)
 * =========================================================================
 *
 * Motivo:
 * - En local / demo, los pacientes Ana/Luis están en Prisma (seed).
 * - El listado FHIR (/fhir/Patient) solo muestra recursos existentes en HAPI,
 *   por eso en UI se veía "Juan Perez" pero no Ana/Luis.
 *
 * Estrategia:
 * - Listado se arma desde GET /patients (backend IntegraD).
 * - Soporta paginación por cursor (base64) igual que backend.
 * - El resto de endpoints (summary/timeline/medications/etc) se mantiene.
 */

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
 * Respuesta esperada desde backend IntegraD:
 * GET /patients?limit=25&cursor=...
 */
type PatientsListApiRow = {
  id: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  documentId: string;
  documentNumber?: string;
  phone?: string | null;

  enrolled: boolean;
  programType: string | null;
  programStatus: string | null;
  enrollmentDate: string | null;
  mainProvider: string | null;
};

type PatientsListApiResponse = {
  data: PatientsListApiRow[];
  meta: {
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
    nextCursor?: string | null;
  };
};

/**
 * =========================================================================
 * LISTADO (PRISMA REAL) — /patients
 * =========================================================================
 */
export async function fetchPatientsPage(params?: {
  limit?: number;
  cursor?: string | null;
}): Promise<FetchPatientsPageResult> {
  const limit =
    typeof params?.limit === "number" && params.limit > 0 ? params.limit : 25;
  const cursor = params?.cursor ?? null;

  const qs = new URLSearchParams();
  qs.set("limit", String(limit));
  if (cursor) qs.set("cursor", cursor);

  const endpoint = `${API_URL}/patients?${qs.toString()}`;

  const result = await safeFetch<PatientsListApiResponse>(endpoint);

  if (!result.ok || !result.data) {
    return {
      ok: false,
      data: [],
      error: result.error ?? "No se pudieron cargar los pacientes.",
      meta: getDefaultMeta(),
    };
  }

  const rows = Array.isArray(result.data.data) ? result.data.data : [];

  const mapped: PatientRow[] = rows.map((p) => ({
    id: p.id,
    name: p.fullName || `${p.firstName} ${p.lastName}`.trim() || "Sin nombre",
    document: p.documentNumber || p.documentId || "—",

    // MVP: estos campos pueden venir de otras fuentes en próximos sprints
    lastGlucose: "Sin datos recientes",
    adherence: "—",
    status: "En seguimiento",

    enrolled: Boolean(p.enrolled),
    programType: p.programType ?? null,
    programStatus: p.programStatus ?? null,
    enrollmentDate: p.enrollmentDate ?? null,
    mainProvider: p.mainProvider ?? null,
  }));

  const meta = result.data.meta ?? {
    limit,
    hasNext: false,
    hasPrev: false,
    nextCursor: null,
  };

  return {
    ok: true,
    data: mapped,
    error: null,
    meta: {
      windowDays: null,
      limit: meta.limit ?? limit,
      hasNext: Boolean(meta.hasNext),
      hasPrev: Boolean(meta.hasPrev),
      nextCursor: meta.nextCursor ?? null,
    },
  };
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

function mapTimelineApiToUi(events: PatientTimelineEventApi[]): PatientTimelineItem[] {
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

  const endpoint = `${API_URL}/patients/${encodeURIComponent(patientId)}/timeline`;
  const result = await safeFetch<PatientTimelineApiResponse>(endpoint);

  if (!result.ok || !result.data || !Array.isArray(result.data.data)) {
    return {
      ok: false,
      data: [],
      error: result.error ?? "No se pudo cargar el timeline. Intente nuevamente.",
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

  const endpoint = `${API_URL}/patients/${encodeURIComponent(patientId)}/medications`;
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

  const endpoint = `${API_URL}/patients/${encodeURIComponent(patientId)}/adherence?${params.toString()}`;
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

  const maybeObj = payload as { snapshot?: unknown };
  if (maybeObj.snapshot && typeof maybeObj.snapshot === "object") {
    return maybeObj.snapshot as PatientRiskSnapshot;
  }

  if ((payload as any).patientId && (payload as any).riskScore != null) {
    return payload as PatientRiskSnapshot;
  }

  return null;
}

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

  if (snapshot === null) {
    return {
      ok: true,
      data: null,
      error: null,
    };
  }

  return {
    ok: true,
    data: snapshot,
    error: null,
  };
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
        result.error ??
        "No se pudo consultar el estado de M5. Intente nuevamente.",
    };
  }

  return { ok: true, data: result.data, error: null };
}