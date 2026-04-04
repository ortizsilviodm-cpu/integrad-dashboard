/* integrad-dashboard\src\services\clinicalSignals.service.ts */

import { apiFetch } from "../api/client";

export async function getClinicalSignals() {
  return apiFetch("/api/clinical/signals");
}

export async function getPatientSignals(patientId: string) {
  return apiFetch(`/api/clinical/patients/${patientId}/signals`);
}

export async function getPatientSignalHistory(patientId: string) {
  return apiFetch(`/api/clinical/patients/${patientId}/signals/history`);
}