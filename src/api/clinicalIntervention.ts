// integrad-dashboard/src/api/clinicalIntervention.ts

import { API_URL } from "../config/api";
import { getAuthToken, setAuthToken } from "../store/authStore";

export type ClinicalInterventionType = "MANUAL";
export type ClinicalInterventionStatus = "PENDING";

export interface CreateClinicalInterventionBody {
  patientId: string;
  signalId: string;
  createdBy: string;
  type: ClinicalInterventionType;
  status: ClinicalInterventionStatus;
  note?: string;
}

export interface ClinicalInterventionRow {
  id: string;
  patientId: string;
  signalId: string;
  createdBy: string;
  type: string;
  status: string;
  note: string | null;
  createdAt: string;
}

export interface CreateClinicalInterventionResponse {
  data: ClinicalInterventionRow;
}

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

export async function createIntervention(
  body: CreateClinicalInterventionBody,
): Promise<CreateClinicalInterventionResponse> {
  const payload = {
    patientId: body.patientId,
    signalId: body.signalId,
    createdBy: body.createdBy,
    type: body.type,
    status: body.status,
    ...(body.note ? { note: body.note } : {}),
  };

  const res = await fetch(`${API_URL}/clinical-interventions`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  await handleAuthErrors(res);

  if (!res.ok) {
    const text = await readErrorText(res);
    throw new Error(`Error creando intervención clínica (${res.status}): ${text}`);
  }

  return res.json();
}