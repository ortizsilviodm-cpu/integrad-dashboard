/* integradd-dashboard/src/services/patientContext.service.ts */

import { API_URL } from "../config/api";
import { getAuthToken, setAuthToken } from "../store/authStore";

export type PatientContextEventType = "MEAL" | "EXERCISE" | "MEDICATION";
export type PatientContextNoteType = "SOCIAL" | "CLINICAL";

export interface GlucosePoint {
  value: number;
  timestamp: string;
}

export interface PatientContextEvent {
  type: PatientContextEventType;
  description: string;
  timestamp: string;
}

export interface PatientContextNote {
  type: PatientContextNoteType;
  text: string;
  createdAt: string;
}

export interface PatientContextResponse {
  patientId: string;
  glucoseSeries: GlucosePoint[];
  events: PatientContextEvent[];
  notes: PatientContextNote[];
}

async function authFetch(input: RequestInfo | URL, init?: RequestInit) {
  const token = getAuthToken();

  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const nextToken = response.headers.get("x-access-token");
  if (nextToken) {
    setAuthToken(nextToken);
  }

  if (response.status === 401) {
    setAuthToken(null);
  }

  return response;
}

export async function fetchPatientContext(
  patientId: string
): Promise<PatientContextResponse> {
  const response = await authFetch(
    `${API_URL}/patient-context/${encodeURIComponent(patientId)}`
  );

  if (!response.ok) {
    let message = "No se pudo obtener el contexto del paciente";

    try {
      const errorData = await response.json();
      if (typeof errorData?.error === "string" && errorData.error.trim()) {
        message = errorData.error;
      }
    } catch {
      // sin acción
    }

    throw new Error(message);
  }

  return response.json() as Promise<PatientContextResponse>;
}