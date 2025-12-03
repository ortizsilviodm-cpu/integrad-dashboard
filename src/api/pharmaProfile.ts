/* integrad-dashboard/src/api/pharmaProfile.ts */

import { safeFetch } from "./safeFetch";
import { API_URL } from "../config/api";

/**
 * Perfil por medicamento, alineado al backend
 * (src/modules/patients/pharmaProfile.service.ts)
 */
export interface DrugProfile {
  drugCode: string;
  drugName: string;
  fills: number;
  totalQuantity: number;
  daysCovered: number;
  firstDispenseDate: string; // ISO
  lastDispenseDate: string; // ISO
  lastChannel: string | null;
  lastStatus: string | null;
  chronic: boolean;
  adherencePercentApprox: number;
}

export interface PatientPharmaProfile {
  patientId: string;
  windowDays: number;
  summary: {
    totalDrugs: number;
    chronicDrugs: number;
    occasionalDrugs: number;
  };
  drugs: DrugProfile[];
}

/**
 * GET /patients/:patientId/pharma-profile?windowDays=...
 *
 * Devuelve el perfil farmacológico del paciente
 * listo para usar en la ficha (tabla/cards).
 */
export async function fetchPharmaProfile(
  patientId: string,
  windowDays = 365
): Promise<PatientPharmaProfile> {
  if (!patientId) {
    throw new Error("Falta el identificador de paciente.");
  }

  const endpoint = `${API_URL}/patients/${encodeURIComponent(
    patientId
  )}/pharma-profile?windowDays=${windowDays}`;

  // safeFetch devuelve { ok, data, error }
  const result = await safeFetch<{ data: PatientPharmaProfile }>(endpoint);

  if (!result.ok || !result.data) {
    throw new Error(
      result.error ??
        "No se pudo cargar el perfil farmacológico. Intente nuevamente."
    );
  }

  // El backend responde { data: profile }, acá devolvemos solo el profile
  return result.data.data;
}
