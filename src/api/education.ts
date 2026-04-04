// integrad-dashboard/src/api/education.ts

import { API_URL } from "../config/api";
import { getAuthToken, setAuthToken } from "../store/authStore";

export type EducationInteractionType = "CALL" | "MESSAGE" | "VISIT";

export interface EducationInteractionRow {
  id: string;
  patientId: string;
  educatorUserId: string;
  type: EducationInteractionType;
  note: string;
  createdAt: string;
  educator: {
    id: string;
    email: string;
    role: string;
  } | null;
}

export interface EducationInteractionsResponse {
  data: EducationInteractionRow[];
}

export interface CreateEducationInteractionBody {
  patientId: string;
  educatorUserId?: string;
  type: EducationInteractionType;
  note: string;
}

export interface CreateEducationInteractionResponse {
  ok: true;
  data: {
    id: string;
    patientId: string;
    educatorUserId: string;
    type: EducationInteractionType;
    note: string;
    createdAt: string;
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

export async function fetchEducationInteractions(
  patientId: string,
): Promise<EducationInteractionsResponse> {
  const qs = new URLSearchParams();
  qs.set("patientId", patientId);

  const res = await fetch(`${API_URL}/education/interactions?${qs.toString()}`, {
    headers: authHeaders(),
  });

  await handleAuthErrors(res);

  if (!res.ok) {
    const message = await extractErrorMessage(
      res,
      "No se pudo cargar el historial educativo.",
    );
    throw new Error(message);
  }

  return res.json();
}

export async function createEducationInteraction(
  body: CreateEducationInteractionBody,
): Promise<CreateEducationInteractionResponse> {
  const payload = {
    patientId: body.patientId,
    type: body.type,
    note: body.note,
    ...(body.educatorUserId ? { educatorUserId: body.educatorUserId } : {}),
  };

  const res = await fetch(`${API_URL}/education/interactions`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  await handleAuthErrors(res);

  if (!res.ok) {
    const message = await extractErrorMessage(
      res,
      "No se pudo registrar la interacción educativa.",
    );
    throw new Error(message);
  }

  return res.json();
}