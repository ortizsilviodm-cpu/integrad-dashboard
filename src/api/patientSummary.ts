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

/**
 * =========================
 * ✅ Contrato CANÓNICO (UI)
 * =========================
 * Este es el tipo que consume el dashboard.
 * La UI puede asumir que adherence existe y tiene defaults razonables.
 */
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

    /** ✅ Campo canónico usado por la UI */
    membershipCode?: string | null;

    healthPlan?: string | null;
    planCode?: string | null;
  };

  /** ✅ En UI NO debe ser null */
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
 * ============================
 * 🛡️ Contrato TOLERANTE (API)
 * ============================
 * Lo que podría venir del backend sin romper la UI:
 * - adherence puede venir null
 * - membership puede venir con nombres alternativos
 */
type PatientSummaryApiResponse = {
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    documentId: string;
    documentNumber: string;
    phone?: string | null;
    payerCode?: string | null;

    // variantes posibles desde backend
    membershipCode?: string | null;
    memberShipCode?: string | null; // visto en otros mappers
    memberShipCodeAlt?: string | null; // defensivo, por si aparece otra variante

    healthPlan?: string | null;
    planCode?: string | null;
  };

  adherence:
    | {
        daysWindow?: number;
        coveragePercent?: number;
        gapDays?: number;
        isLowAdherence?: boolean;
      }
    | null;

  kpis90d: {
    dispenses?: number;
    ambulatoryEpisodes?: number;
    readings?: number;
    alerts?: number;
  };
};

function normalizePatientSummary(payload: PatientSummaryApiResponse): PatientSummaryResponse {
  const p = payload.patient;

  const membershipCode =
    (p.membershipCode ?? null) ||
    (p.memberShipCode ?? null) ||
    (p.memberShipCodeAlt ?? null);

  const a = payload.adherence;

  // Defaults seguros para UI (evita crashes si adherence viene null o parcial)
  const daysWindow =
    typeof a?.daysWindow === "number" && a.daysWindow > 0 ? a.daysWindow : 90;

  const coveragePercent =
    typeof a?.coveragePercent === "number" && Number.isFinite(a.coveragePercent)
      ? a.coveragePercent
      : 0;

  const gapDays =
    typeof a?.gapDays === "number" && Number.isFinite(a.gapDays) ? a.gapDays : 0;

  const isLowAdherence = Boolean(a?.isLowAdherence);

  return {
    patient: {
      id: p.id,
      firstName: p.firstName ?? "",
      lastName: p.lastName ?? "",
      fullName: p.fullName ?? `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim(),
      documentId: p.documentId ?? "",
      documentNumber: p.documentNumber ?? "",
      phone: p.phone ?? null,
      payerCode: p.payerCode ?? null,
      membershipCode,
      healthPlan: p.healthPlan ?? null,
      planCode: p.planCode ?? null,
    },
    adherence: {
      daysWindow,
      coveragePercent,
      gapDays,
      isLowAdherence,
    },
    kpis90d: {
      dispenses: payload.kpis90d?.dispenses ?? 0,
      ambulatoryEpisodes: payload.kpis90d?.ambulatoryEpisodes ?? 0,
      readings: payload.kpis90d?.readings ?? 0,
      alerts: payload.kpis90d?.alerts ?? 0,
    },
  };
}

/**
 * GET /patients/:id/summary
 * Devuelve { ok, data, error } usando safeFetch.
 *
 * ✅ Importante:
 * - Normaliza el payload para que el dashboard tenga un contrato estable.
 * - Evita `any` y evita crashes por nulls.
 */
export async function fetchPatientSummary(patientId: string) {
  const endpoint = `${API_URL}/patients/${encodeURIComponent(patientId)}/summary`;

  const res = await safeFetch<PatientSummaryApiResponse>(endpoint);

  if (!res.ok || !res.data) {
    return { ok: false as const, data: null, error: res.error ?? "No se pudo cargar el resumen del paciente." };
  }

  try {
    const normalized = normalizePatientSummary(res.data);
    return { ok: true as const, data: normalized, error: null };
  } catch (_err) {
    return { ok: false as const, data: null, error: "Respuesta inválida del backend en /patients/:id/summary." };
  }
}

/**
 * GET /patients/:id/clinical-risk-summary
 * Devuelve { ok, data, error } usando safeFetch.
 */
export async function fetchClinicalRiskSummary(patientId: string) {
  return safeFetch<ClinicalRiskSummary>(
    `${API_URL}/patients/${encodeURIComponent(patientId)}/clinical-risk-summary`
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
