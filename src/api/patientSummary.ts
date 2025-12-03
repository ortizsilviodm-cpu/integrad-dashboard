// integrad-dashboard/src/api/patientSummary.ts

import { safeFetch } from "./safeFetch";
import { API_URL } from "../config/api";

export interface ClinicalValue {
  type: string;
  valueNumeric?: number | null;
  valueText?: string | null;
  unit?: string | null;
  takenAt?: string | null;
}

export interface ClinicalRiskSummary {
  retinopathyRisk: "low" | "medium" | "high";
  renalRisk: "low" | "medium" | "high";
  macrovascularRisk: "low" | "medium" | "high";
  neuropathyRisk: "low" | "medium" | "high";
  lastValues: {
    hba1c?: ClinicalValue | null;
    bloodPressure?: ClinicalValue | null;
    triglycerides?: ClinicalValue | null;
    totalCholesterol?: ClinicalValue | null;
    bmi?: ClinicalValue | null;
    microalbuminuria?: ClinicalValue | null;
    proteinuria?: ClinicalValue | null;
    glucoseFasting?: ClinicalValue | null;
    smokingStatus?: ClinicalValue | null;
    yearsSinceDiagnosis?: ClinicalValue | null;
  };
}

export interface PatientSummaryResponse {
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    documentId: string;
    documentNumber: string;
    phone?: string | null;
    payerCode?: string | null;
    membershipCode?: string | null;
    healthPlan?: string | null;
    planCode?: string | null;
  };
  adherence: {
    daysWindow: number;
    coveragePercent: number;
    gapDays: number;
    isLowAdherence: boolean;
  };
  kpis90d: {
    dispenses: number;
    ambulatoryEpisodes: number;
    readings: number;
    alerts: number;
  };
}

/**
 * GET /patients/:id/summary
 * Devuelve { ok, data, error } usando safeFetch.
 */
export async function fetchPatientSummary(patientId: string) {
  return safeFetch<PatientSummaryResponse>(
    `${API_URL}/patients/${patientId}/summary`
  );
}

/**
 * GET /patients/:id/clinical-risk-summary
 * Devuelve { ok, data, error } usando safeFetch.
 */
export async function fetchClinicalRiskSummary(patientId: string) {
  return safeFetch<ClinicalRiskSummary>(
    `${API_URL}/patients/${patientId}/clinical-risk-summary`
  );
}

/* ========================================================================
 * 🆕 Adherencia Real del Paciente (PDC)
 *    GET /patients/:id/adherence?windowDays=90
 * ===================================================================== */

export interface PatientAdherenceResponse {
  patientId: string;
  windowDays: number;
  daysCovered: number;
  daysUncovered: number;
  adherencePercent: number | null;
  lastPickupDate: string | null;
  delayedDispenses: number;
  missedDispenses: number;
  maxGap: number;
}

/**
 * Calcula adherencia real (PDC) del paciente en una ventana de días.
 *
 * Ejemplo:
 *   fetchPatientAdherence(idPaciente, 90)
 */
export async function fetchPatientAdherence(
  patientId: string,
  windowDays: number = 90
) {
  const params = new URLSearchParams();
  if (windowDays) {
    params.set("windowDays", String(windowDays));
  }

  const url = `${API_URL}/patients/${encodeURIComponent(
    patientId
  )}/adherence?${params.toString()}`;

  return safeFetch<PatientAdherenceResponse>(url);
}
