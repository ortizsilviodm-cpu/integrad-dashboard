import { API_URL } from "../config/api";
import { getAuthToken } from "../store/authStore";

export type OperationalCaseStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "STABILIZED"
  | "RESOLVED"
  | "REOPENED";

export type OperationalCasePriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type OperationalCaseMotive =
  | "THERAPEUTIC_ABANDONMENT_RISK"
  | "GLUCOSE_RISK"
  | "NEEDS_EDUCATION"
  | "CONTACT_DIFFICULTY"
  | "INTERDISCIPLINARY_INTERVENTION_REQUIRED";

export type OperationalCaseSummary = {
  id: string;
  patientId: string;
  operationalMotive: OperationalCaseMotive;
  priority: OperationalCasePriority;
  status: OperationalCaseStatus;
  contextualSummary: string | null;
  reopenedCount: number;
  updatedAt: string;
};

type OperationalCasesResponse = {
  data: OperationalCaseSummary[];
};

function authHeaders() {
  const token = getAuthToken();

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function fetchOperationalCases(): Promise<OperationalCaseSummary[]> {
  const res = await fetch(`${API_URL}/operational-cases`, {
    headers: authHeaders(),
  });

  if (!res.ok) {
    throw new Error("No se pudo cargar operational cases");
  }

  const json: OperationalCasesResponse = await res.json();
  return json.data ?? [];
}
