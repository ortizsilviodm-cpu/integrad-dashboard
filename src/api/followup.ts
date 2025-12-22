// integrad-dashboard/src/api/followup.ts

import { API_URL } from "../config/api";
import { getAuthToken, setAuthToken } from "../store/authStore";

export type FollowupEventStatus = "OPEN" | "IN_PROGRESS" | "CLOSED" | "ESCALATED";
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

export interface FollowupEventRow {
  id: string;
  patientId: string;
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
  occurredAt: string;
  openedAt: string;
  slaDueAt: string | null;
  assignedToUserId: string | null;
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
    throw new Error("Sesión expirada. Volvé a iniciar sesión.");
  }
}

async function readErrorText(res: Response) {
  try {
    return await res.text();
  } catch {
    return "";
  }
}

/* ----------------------------- */
/* API                           */
/* ----------------------------- */

export async function fetchFollowupEvents(
  params: FetchFollowupParams = {}
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
    const t = await readErrorText(res);
    throw new Error(`Error cargando seguimiento (${res.status}): ${t}`);
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
    const t = await readErrorText(res);
    throw new Error(`No se pudo tomar el evento (${res.status}): ${t}`);
  }

  return res.json();
}

export async function closeFollowupEvent(eventId: string, note?: string) {
  const res = await fetch(`${API_URL}/followup/events/${eventId}/close`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(note ? { note } : {}),
  });

  await handleAuthErrors(res);

  if (!res.ok) {
    const t = await readErrorText(res);
    throw new Error(`No se pudo cerrar el evento (${res.status}): ${t}`);
  }

  return res.json();
}

/* ----------------------------- */
/* Actions API                   */
/* ----------------------------- */

export async function fetchFollowupEventActions(
  eventId: string
): Promise<FollowupEventActionsResponse> {
  const res = await fetch(`${API_URL}/followup/events/${eventId}/actions`, {
    headers: authHeaders(),
  });

  await handleAuthErrors(res);

  if (!res.ok) {
    const t = await readErrorText(res);
    throw new Error(`Error obteniendo acciones (${res.status}): ${t}`);
  }

  return res.json();
}

export async function createFollowupEventAction(
  eventId: string,
  body: CreateFollowupEventActionBody
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
    const t = await readErrorText(res);
    throw new Error(`Error creando acción (${res.status}): ${t}`);
  }

  return res.json();
}
