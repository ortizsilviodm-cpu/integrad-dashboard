/* integrad-dashboard/src/api/clinicalHistory.ts */

import { safeFetch } from "./safeFetch";
import { API_URL } from "../config/api";

/**
 * Códigos estándar de indicadores clínicos
 * (alineados al modelo IntegraD — HbA1c, glucemia, PA, IMC, etc.).
 */
export type ClinicalIndicatorCode =
  | "HBA1C"
  | "GLUCOSE_FASTING"
  | "BP_SYSTOLIC"
  | "BP_DIASTOLIC"
  | "BMI"
  | "MICROALBUMINURIA"
  | "PROTEINURIA"
  | "SMOKING_STATUS";

/**
 * Una medición puntual de un indicador clínico.
 * Puede ser numérica (HbA1c, PA, IMC, etc.) o categórica (tabaquismo).
 */
export interface ClinicalIndicatorHistoryRow {
  id: string;
  patientId: string;
  code: ClinicalIndicatorCode;
  label: string;
  valueNumber: number | null;
  valueText: string | null;
  unit: string | null;
  measuredAt: string; // ISO string de la fecha de medición
  createdAt?: string;
  source?: string | null; // Ej: "manual", "app", "integración APOS", etc.
}

export interface ClinicalHistoryResult {
  ok: boolean;
  data: ClinicalIndicatorHistoryRow[];
  error?: string;
}

/**
 * Obtiene el historial completo de indicadores clínicos de un paciente.
 * GET /patients/:id/clinical-indicators
 */
export async function fetchClinicalHistory(
  patientId: string
): Promise<ClinicalHistoryResult> {
  if (!patientId) {
    return {
      ok: false,
      data: [],
      error: "patientId es requerido",
    };
  }

  const url = `${API_URL}/patients/${encodeURIComponent(
    patientId
  )}/clinical-indicators`;

  const res = await safeFetch<ClinicalIndicatorHistoryRow[]>(url);

  if (!res.ok) {
    return {
      ok: false,
      data: [],
      error: res.error ?? "No se pudo obtener el historial clínico.",
    };
  }

  return {
    ok: true,
    data: res.data ?? [],
  };
}
