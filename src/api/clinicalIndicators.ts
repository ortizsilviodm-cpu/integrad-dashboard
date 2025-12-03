/* integrad-dashboard/src/api/clinicalIndicators.ts */

import { safeFetch } from "./safeFetch";
import { API_URL } from "../config/api";

/**
 * Debe matchear el enum ClinicalIndicatorType del backend:
 * GLUCOSE_FASTING, GLUCOSE_POSTPRANDIAL, HBA1C, etc.
 */
export type ClinicalIndicatorType =
  | "GLUCOSE_FASTING"
  | "GLUCOSE_POSTPRANDIAL"
  | "HBA1C"
  | "TOTAL_CHOLESTEROL"
  | "HDL_C"
  | "LDL_C"
  | "TRIGLYCERIDES"
  | "BMI"
  | "SYSTOLIC_BP"
  | "DIASTOLIC_BP"
  | "MICROALBUMINURIA"
  | "PROTEINURIA"
  | "SMOKING_STATUS";

export type ClinicalIndicatorSource = "MANUAL" | "IMPORTED" | "DEVICE";

export interface ClinicalIndicatorInput {
  type: ClinicalIndicatorType;
  valueNumeric?: number | null;
  valueText?: string | null;
  unit?: string | null;
  takenAt: string; // ISO (ej: new Date().toISOString())
  source?: ClinicalIndicatorSource;
}

/**
 * Payload “alto nivel” que usa el enrolamiento:
 * { indicators: ClinicalIndicatorInput[] }
 */
export interface SaveClinicalIndicatorsRequest {
  indicators: ClinicalIndicatorInput[];
}

/**
 * POST “bajo nivel”: solo recibe el array de indicadores.
 * Útil si querés usarlo directo desde otros módulos.
 */
export async function postClinicalIndicators(
  patientId: string,
  indicators: ClinicalIndicatorInput[]
) {
  return safeFetch(`${API_URL}/patients/${patientId}/clinical-indicators`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ indicators }),
  });
}

/**
 * Wrapper pensado para el formulario de enrolamiento.
 *
 * - Recibe un payload { indicators: [...] }
 * - Llama internamente a postClinicalIndicators
 * - Si el backend responde con error, lanza throw Error(...)
 *
 * Esto matchea exactamente lo que importa PatientEnrollmentPage:
 *   saveClinicalIndicators + SaveClinicalIndicatorsRequest
 */
export async function saveClinicalIndicators(
  patientId: string,
  payload: SaveClinicalIndicatorsRequest
): Promise<void> {
  const res = await postClinicalIndicators(patientId, payload.indicators);

  if (!res.ok) {
    // safeFetch no expone .text(), así que usamos un mensaje fijo
    throw new Error("Error guardando indicadores clínicos del paciente.");
  }
}

/* ============================= */
/*  Resumen de riesgo clínico    */
/* ============================= */

export type ClinicalRiskLevel = "low" | "medium" | "high";

export interface ClinicalRiskSummary {
  retinopathyRisk: ClinicalRiskLevel;
  renalRisk: ClinicalRiskLevel;
  macrovascularRisk: ClinicalRiskLevel;
  neuropathyRisk: ClinicalRiskLevel;
  lastValues: {
    hba1c: {
      valueNumeric: number | null;
      unit: string | null;
      takenAt: string | null;
    } | null;
    bloodPressure: {
      systolic: number | null;
      diastolic: number | null;
      unit: string;
      takenAt: string | null;
    } | null;
    triglycerides: {
      valueNumeric: number | null;
      unit: string | null;
      takenAt: string | null;
    } | null;
    totalCholesterol: {
      valueNumeric: number | null;
      unit: string | null;
      takenAt: string | null;
    } | null;
    bmi: {
      valueNumeric: number | null;
      unit: string | null;
      takenAt: string | null;
    } | null;
    microalbuminuria: {
      valueNumeric: number | null;
      valueText: string | null;
      unit: string | null;
      takenAt: string | null;
    } | null;
    proteinuria: {
      valueNumeric: number | null;
      valueText: string | null;
      unit: string | null;
      takenAt: string | null;
    } | null;
    glucoseFasting: {
      valueNumeric: number | null;
      unit: string | null;
      takenAt: string | null;
    } | null;
    smokingStatus: {
      valueText: string | null;
      takenAt: string | null;
    } | null;
    yearsSinceDiagnosis: number | null;
  };
}

/**
 * GET /patients/:patientId/clinical-risk-summary
 *
 * OJO: hoy tus pantallas de riesgo clínico ya usan la versión
 * de patientSummary.ts — este helper puede quedar para uso futuro
 * o lo podemos limpiar más adelante si decidís unificar.
 */
export async function fetchClinicalRiskSummary(patientId: string) {
  return safeFetch<ClinicalRiskSummary>(
    `${API_URL}/patients/${patientId}/clinical-risk-summary`
  );
}
