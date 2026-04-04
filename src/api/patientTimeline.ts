/* integrad-dashboard\src\api\patientTimeline.ts */

import { getAuthToken } from "../store/authStore";

export type PatientTimelineItemType = "EVENT" | "INDICATOR";

export interface PatientTimelineItem {
  type: PatientTimelineItemType;
  date: string;
  title: string;
  metadata?: Record<string, unknown>;
}

type PatientTimelineResponse = {
  data: PatientTimelineItem[];
};

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

function resolveAccessToken(): string | null {
  const tokenFromStore = getAuthToken();
  if (tokenFromStore) return tokenFromStore;

  const tokenFromSession = sessionStorage.getItem("integrad_access_token");
  if (tokenFromSession) return tokenFromSession;

  const tokenFromLocal = localStorage.getItem("integrad_access_token");
  if (tokenFromLocal) return tokenFromLocal;

  return null;
}

export async function fetchPatientTimeline(
  patientId: string
): Promise<PatientTimelineItem[]> {
  if (!patientId?.trim()) {
    throw new Error("patientId es obligatorio");
  }

  const token = resolveAccessToken();

  if (!token) {
    throw new Error("No hay token de autenticación disponible");
  }

  const response = await fetch(
    `${API_BASE_URL}/patients/${encodeURIComponent(patientId)}/timeline`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("No se pudo obtener el timeline del paciente");
  }

  const payload = (await response.json()) as PatientTimelineResponse;

  return Array.isArray(payload.data) ? payload.data : [];
}