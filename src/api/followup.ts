// integrad-dashboard/src/api/followup.ts

import { API_URL } from "../config/api";
import { getAuthToken, setAuthToken } from "../store/authStore";

export type FollowupEventStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "CLOSED"
  | "ESCALATED";

export type FollowupAssigned = "any" | "me" | "none";
export type FollowupSla = "any" | "overdue" | "due_48h";

export interface FetchFollowupParams {
  status?: FollowupEventStatus;
  assigned?: FollowupAssigned;
  sla?: FollowupSla;
  limit?: number;
  cursor?: string;
}

/* ----------------------------- */
/* Tipos de respuesta            */
/* ----------------------------- */

export interface FollowupClinicalContext {
  description: string;
  probableCause?: string | null;
}

export type FollowupAdherenceStatus = "OK" | "WARNING" | "CRITICAL";

export interface FollowupAdherenceContext {
  daysRemaining: number | null;
  status: FollowupAdherenceStatus;
  operationalMessage: string;
}

export type FollowupMedicationRisk = "NONE" | "FOLLOWUP" | "URGENT";

export interface FollowupOperationalSignals {
  medicationRisk: FollowupMedicationRisk;
}

export interface FollowupEventRow {
  id: string;
  patientId: string;
  clinicalSignalId: string | null;
  patient: {
    id: string;
    fullName: string;
    documentId: string;
    payerCode?: string | null;
    diabetesSetupSummary: {
      completionState: "COMPLETE" | "DEFERRED" | "LEGACY_MISSING";
      hasPersistedRow: boolean;
      diabetesType: "T1" | "T2" | "OTHER" | null;
      usesInsulin: boolean | null;
      insulinMode:
        | "NONE"
        | "BASAL"
        | "BASAL_BOLUS"
        | "MIXED"
        | "PUMP"
        | "UNKNOWN"
        | null;
      source: "PROFESSIONAL" | "PATIENT" | "INTEGRATION" | null;
    };
  };
  category: string;
  type: string;
  severity: string;
  status: FollowupEventStatus;
  priorityBase: number | null;
  clinicalContext: FollowupClinicalContext;
  adherenceContext: FollowupAdherenceContext;
  operationalSignals: FollowupOperationalSignals;
  occurredAt: string;
  openedAt: string;
  slaDueAt: string | null;
  assignedToUserId: string | null;
  assignedTo?: {
    userId: string;
    displayName: string;
  } | null;

  closedAt: string | null;
  closedByUserId: string | null;
  resolutionType: "STABILIZED" | "DERIVED" | "FOLLOW_UP" | null;
  resolutionNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FollowupEventsResponse {
  data: FollowupEventRow[];
  meta: {
    limit: number;
    hasNext: boolean;
    nextCursor?: string;
  };
}

/* ----------------------------- */
/* Actions (intervenciones)      */
/* ----------------------------- */

export type FollowupEventActionType =
  | "CALL"
  | "WHATSAPP"
  | "EDUCATION"
  | "DERIVATION"
  | "NOTE"
  | "CLOSE"
  | "ESCALATE";

export type FollowupEventActionOutcome =
  | "CONTACTED"
  | "NO_RESPONSE"
  | "RESOLVED"
  | "ESCALATED"
  | "INFO";

export interface FollowupEventActionRow {
  id: string;
  followupEventId: string;
  actionType: FollowupEventActionType;
  outcome: FollowupEventActionOutcome;
  note: string | null;
  createdByUserId: string | null;
  createdAt: string;
}

export interface FollowupEventActionsResponse {
  data: FollowupEventActionRow[];
}

export type FollowupHistoryTraceEntryKind = "LIFECYCLE" | "ACTION" | "EDUCATION";

export interface FollowupHistoryTraceEntry {
  id: string;
  kind: FollowupHistoryTraceEntryKind;
  occurredAt: string;
  title: string;
  detail: string | null;
  actor: {
    userId: string | null;
    displayName: string | null;
  } | null;
  sourceMeta?: {
    actionType?: string;
    outcome?: string;
    resolutionType?: string;
  };
}

export interface FollowupHistoryTraceResponse {
  data: FollowupHistoryTraceEntry[];
}

export interface CreateFollowupEventActionBody {
  actionType: FollowupEventActionType;
  outcome: FollowupEventActionOutcome;
  note?: string;
}

export interface CreateFollowupEventActionResponse {
  ok: true;
  action: FollowupEventActionRow;
}

/* ----------------------------- */
/* Close event                   */
/* ----------------------------- */

export type FollowupResolutionType = "STABILIZED" | "DERIVED" | "FOLLOW_UP";

export interface CloseFollowupEventBody {
  resolutionType: FollowupResolutionType;
  note?: string;
}

export interface CloseFollowupEventResponse {
  ok: true;
  data: {
    id: string;
    status: FollowupEventStatus;
    assignedToUserId: string | null;
    updatedAt: string;
    resolutionType: FollowupResolutionType;
    note: string | null;
  };
}

export interface FollowupEventByIdResponse {
  data: FollowupEventRow;
}

/* ----------------------------- */
/* Risk stratification           */
/* ----------------------------- */

export type RiskStratificationBand = "LOW" | "MEDIUM" | "HIGH";
export type DynamicRiskStratificationBand =
  | RiskStratificationBand
  | "CRITICAL";
export type RiskStratificationSourceType =
  | "real"
  | "proxy"
  | "future-missing";
export type RiskStratificationInputStatus = "used" | "missing";
export type RiskStratificationDimension = "baseline" | "dynamic";
export type RiskStratificationPriorityHint =
  | "KEEP_CURRENT"
  | "PRIORITIZE_REVIEW"
  | "ESCALATE_NOW";
export type RiskStratificationSuggestedRole =
  | "PROFESSIONAL"
  | "OPERATOR"
  | "EDUCATION"
  | "UNASSIGNED";
export type RiskStratificationConsumer = "FOLLOWUP_PANEL";
export type BaselineProfileFactorKey =
  | "insulin-therapy"
  | "renal-risk-summary"
  | "retinopathy-risk-summary"
  | "years-since-diagnosis"
  | "medication-coverage"
  | "pickup-pattern";
export type MissingBaselineFactorKey =
  | "dialysis"
  | "diabetic-foot"
  | "visual-impairment"
  | "self-management-barriers";

export interface RiskStratificationReason {
  code: string;
  label: string;
  dimension: RiskStratificationDimension;
  sourceType: RiskStratificationSourceType;
}

export interface RiskStratificationTriggeredRule {
  code: string;
  label: string;
  effect: string;
}

export interface RiskStratificationOverride {
  code: string;
  reason: string;
  replaced: RiskStratificationPriorityHint;
}

export interface RiskStratificationInputSource {
  key: string;
  sourceType: RiskStratificationSourceType;
  status: RiskStratificationInputStatus;
}

export interface BaselineProfileFactor {
  key: BaselineProfileFactorKey;
  label: string;
  value: string | number | boolean | null;
  sourceType: Extract<RiskStratificationSourceType, "real" | "proxy">;
  status: RiskStratificationInputStatus;
  provenance: RiskStratificationInputSource[];
}

export interface BaselineProfileRuleBand {
  code: string;
  label: string;
  band: RiskStratificationBand;
  sourceType: RiskStratificationSourceType;
  factorKeys: BaselineProfileFactorKey[];
}

export interface BaselineProfileMissingFactor {
  key: MissingBaselineFactorKey;
  label: string;
  sourceType: "future-missing";
  status: "missing";
  provenance: RiskStratificationInputSource[];
}

export interface BaselineProfile {
  factors: BaselineProfileFactor[];
  ruleBands: BaselineProfileRuleBand[];
  missingFactors: BaselineProfileMissingFactor[];
  overrides: Array<{
    code: string;
    label: string;
    status: "read-only";
  }>;
}

export interface RiskStratificationV1 {
  version: string;
  computedAt: string;
  context: {
    patientId: string;
    eventId: string;
    sourceConsumer: RiskStratificationConsumer;
  };
  baselineRiskBand: RiskStratificationBand;
  dynamicRiskBand: DynamicRiskStratificationBand;
  operationalPriorityHint: RiskStratificationPriorityHint;
  suggestedInitialRole: RiskStratificationSuggestedRole;
  explainabilityReasons: RiskStratificationReason[];
  triggeredRules: RiskStratificationTriggeredRule[];
  overrides: RiskStratificationOverride[];
  inputSourcesUsed: RiskStratificationInputSource[];
  baselineProfile?: BaselineProfile;
}

/* ----------------------------- */
/* Helpers                       */
/* ----------------------------- */

function authHeaders() {
  const token = getAuthToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleAuthErrors(res: Response) {
  if (res.status === 401 || res.status === 403) {
    setAuthToken(null);

    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }

    throw new Error("Sesión expirada. Redirigiendo a login...");
  }
}

async function extractErrorMessage(
  res: Response,
  fallback: string,
): Promise<string> {
  try {
    const contentType = res.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const data = await res.json();

      if (typeof data?.error === "string" && data.error.trim()) {
        return data.error.trim();
      }

      if (typeof data?.message === "string" && data.message.trim()) {
        return data.message.trim();
      }

      return fallback;
    }

    const text = await res.text();
    return text.trim() || fallback;
  } catch {
    return fallback;
  }
}

/* ----------------------------- */
/* API                           */
/* ----------------------------- */

export async function fetchFollowupEvents(
  params: FetchFollowupParams = {},
): Promise<FollowupEventsResponse> {
  const qs = new URLSearchParams();

  if (params.status) qs.set("status", params.status);
  if (params.assigned) qs.set("assigned", params.assigned);
  if (params.sla) qs.set("sla", params.sla);
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.cursor) qs.set("cursor", params.cursor);

  const res = await fetch(`${API_URL}/followup/events?${qs.toString()}`, {
    headers: authHeaders(),
  });

  await handleAuthErrors(res);

  if (!res.ok) {
    const message = await extractErrorMessage(
      res,
      "No se pudo cargar la bandeja de seguimiento.",
    );
    throw new Error(message);
  }

  return res.json();
}

export async function fetchFollowupEventById(
  eventId: string,
): Promise<FollowupEventByIdResponse> {
  const res = await fetch(`${API_URL}/followup/events/${eventId}`, {
    headers: authHeaders(),
  });

  await handleAuthErrors(res);

  if (!res.ok) {
    const message = await extractErrorMessage(
      res,
      "No se pudo cargar el evento solicitado.",
    );
    throw new Error(message);
  }

  return res.json();
}

export async function takeFollowupEvent(eventId: string) {
  const res = await fetch(`${API_URL}/followup/events/${eventId}/take`, {
    method: "PATCH",
    headers: authHeaders(),
  });

  await handleAuthErrors(res);

  if (!res.ok) {
    const message = await extractErrorMessage(
      res,
      "No se pudo tomar el evento.",
    );
    throw new Error(message);
  }

  return res.json();
}

export async function closeFollowupEvent(
  eventId: string,
  body: CloseFollowupEventBody,
): Promise<CloseFollowupEventResponse> {
  const payload = {
    resolutionType: body.resolutionType,
    ...(body.note ? { note: body.note } : {}),
  };

  const res = await fetch(`${API_URL}/followup/events/${eventId}/close`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  await handleAuthErrors(res);

  if (!res.ok) {
    const message = await extractErrorMessage(
      res,
      "No se pudo cerrar el evento.",
    );
    throw new Error(message);
  }

  return res.json();
}

/* ----------------------------- */
/* Actions API                   */
/* ----------------------------- */

export async function fetchFollowupEventActions(
  eventId: string,
): Promise<FollowupEventActionsResponse> {
  const res = await fetch(`${API_URL}/followup/events/${eventId}/actions`, {
    headers: authHeaders(),
  });

  await handleAuthErrors(res);

  if (!res.ok) {
    const message = await extractErrorMessage(
      res,
      "No se pudieron obtener las acciones del evento.",
    );
    throw new Error(message);
  }

  return res.json();
}

export async function fetchFollowupHistoryTrace(
  eventId: string,
): Promise<FollowupHistoryTraceResponse> {
  const res = await fetch(`${API_URL}/followup/events/${eventId}/history-trace`, {
    headers: authHeaders(),
  });

  await handleAuthErrors(res);

  if (!res.ok) {
    const message = await extractErrorMessage(
      res,
      "No se pudo obtener la trazabilidad del evento.",
    );
    throw new Error(message);
  }

  return res.json();
}

export async function createFollowupEventAction(
  eventId: string,
  body: CreateFollowupEventActionBody,
): Promise<CreateFollowupEventActionResponse> {
  const payload = {
    actionType: body.actionType,
    outcome: body.outcome,
    ...(body.note ? { note: body.note } : {}),
  };

  const res = await fetch(`${API_URL}/followup/events/${eventId}/actions`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  await handleAuthErrors(res);

  if (!res.ok) {
    const message = await extractErrorMessage(
      res,
      "No se pudo registrar la acción.",
    );
    throw new Error(message);
  }

  return res.json();
}

export async function fetchEventRiskStratification(
  eventId: string,
): Promise<RiskStratificationV1> {
  const res = await fetch(
    `${API_URL}/followup/events/${eventId}/risk-stratification`,
    {
      headers: authHeaders(),
    },
  );

  await handleAuthErrors(res);

  if (!res.ok) {
    const message = await extractErrorMessage(
      res,
      "No se pudo obtener la estratificación de riesgo.",
    );
    throw new Error(message);
  }

  return res.json();
}
