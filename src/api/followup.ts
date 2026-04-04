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