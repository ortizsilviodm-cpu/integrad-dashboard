/* integrad-dashboard/src/api/clinicalHistory.ts */

import { safeFetch } from "./safeFetch";
import { API_URL } from "../config/api";

/**
 * Códigos estándar de indicadores clínicos
 * (alineados al modelo IntegraD — HbA1c, glucemia, PA, IMC, etc.).
 *
 * NOTA:
 * - En backend tu mapeo devuelve BP_SYSTOLIC / BP_DIASTOLIC.
 * - En algunos módulos legacy se usa SYSTOLIC_BP / DIASTOLIC_BP.
 * - El frontend soporta ambos para no romper historial viejo.
 */
export type ClinicalIndicatorCode =
  | "HBA1C"
  | "GLUCOSE_FASTING"
  | "BP_SYSTOLIC"
  | "BP_DIASTOLIC"
  | "SYSTOLIC_BP"
  | "DIASTOLIC_BP"
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
  createdAt?: string | null;
  source?: string | null; // Ej: "manual", "app", "integración APOS", etc.
}

export interface ClinicalHistoryResult {
  ok: boolean;
  data: ClinicalIndicatorHistoryRow[];
  error?: string;
}

/**
 * Contrato del backend (según tu patients/router.ts):
 * GET /patients/:id/clinical-indicators  -> { data: ClinicalIndicatorHistoryRow[] }
 */
type ClinicalHistoryApiResponse = {
  data: ClinicalIndicatorHistoryRow[];
  meta?: any;
};

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

  const res = await safeFetch<ClinicalHistoryApiResponse>(url);

  if (!res.ok) {
    return {
      ok: false,
      data: [],
      error: res.error ?? "No se pudo obtener el historial clínico.",
    };
  }

  const rows = res.data?.data ?? [];

  return {
    ok: true,
    data: Array.isArray(rows) ? rows : [],
  };
}