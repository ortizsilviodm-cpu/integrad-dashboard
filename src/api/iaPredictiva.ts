/* integrad-dashboard/src/api/iaPredictiva.ts */
// Cliente para consumir la API de IA Predictiva integrada al backend real IntegraD

import { API_URL } from "../config/api";

// Nivel de riesgo que vamos a mostrar en el dashboard (en español)
export type RiskLevel = "bajo" | "medio" | "alto";

// Tipo que usa el dashboard para cada paciente con riesgo calculado
export interface IAPatientRisk {
  patientId: string;
  fullName: string;
  /**
   * Score global de riesgo (0–100).
   * Es una combinación de riesgo clínico + riesgo de adherencia.
   */
  riskScore: number;
  /**
   * Nivel de riesgo en español, derivado del score:
   * - bajo / medio / alto
   */
  riskLevel: RiskLevel;
  /**
   * Componente de riesgo clínico (0–100).
   * Ej: hipo/hiper frecuentes, variabilidad alta, etc.
   */
  clinicalRisk: number;
  /**
   * Componente de riesgo de adherencia (0–100).
   * Ej: pocas lecturas, dispensa retrasada, etc.
   */
  adherenceRisk: number;
  /**
   * Razones explicables del riesgo (para soporte al equipo clínico).
   * Ej: "Tiene 2 alertas clínicas abiertas", "Muy pocos días con lecturas registradas".
   */
  reasons: string[];
}

// Resumen agregando cantidad de pacientes por nivel de riesgo
export interface IAPreviewSummary {
  bajo: number;
  medio: number;
  alto: number;
}

// Estructura que consume la vista de IA Predictiva
export interface IAPreviewResponse {
  ok: boolean;
  summary: IAPreviewSummary;
  totalPatients: number;
  patients: IAPatientRisk[];
}

// --- Tipos internos para la respuesta del backend IntegraD --- //

/**
 * Niveles de riesgo que devuelve el backend (en inglés, por ejemplo).
 * Estos se mapearán a los niveles en español para el dashboard.
 */
type BackendRiskLevel = "low" | "medium" | "high";

/**
 * Estructura mínima esperada desde el backend en:
 * GET /ia/risk/summary
 *
 * data: lista de pacientes con riesgo calculado.
 * meta: info adicional (ventana de días, fecha de generación, etc.).
 */
interface IARiskApiPatient {
  patientId: string;
  fullName: string;
  riskScore: number;
  riskLevel: BackendRiskLevel;
  clinicalRisk: number;
  adherenceRisk: number;
  reasons: string[];
}

interface IARiskApiResponse {
  data: IARiskApiPatient[];
  meta: {
    windowDays: number;
    generatedAt: string;
  };
}

// Base URL de IA: usamos el mismo backend que el resto del proyecto
// y colgamos los endpoints bajo /ia.
const IA_BASE_URL = `${API_URL}/ia`;

// Ventana de análisis (ej: últimos 90 días)
const DEFAULT_WINDOW_DAYS = 90;

/**
 * Mapea el nivel de riesgo del backend (en inglés) al nivel usado en el dashboard (en español).
 */
function mapBackendLevelToRiskLevel(level: BackendRiskLevel): RiskLevel {
  switch (level) {
    case "high":
      return "alto";
    case "medium":
      return "medio";
    case "low":
    default:
      return "bajo";
  }
}

/**
 * Llama al endpoint de resumen de riesgo de IA Predictiva.
 * Integra datos reales de la base de datos (vía backend IntegraD).
 *
 * Lanzará un error si la respuesta HTTP no es ok.
 */
export async function fetchIAPredictivaPreview(): Promise<IAPreviewResponse> {
  const url = `${IA_BASE_URL}/risk/summary?windowDays=${DEFAULT_WINDOW_DAYS}`;

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(
      `Error al consultar IA Predictiva (status ${res.status})`
    );
  }

  const apiData = (await res.json()) as IARiskApiResponse;

  // Mapeo de pacientes del backend al modelo que usa el dashboard
  const patients: IAPatientRisk[] = apiData.data.map((p) => ({
    patientId: p.patientId,
    fullName: p.fullName,
    riskScore: p.riskScore,
    riskLevel: mapBackendLevelToRiskLevel(p.riskLevel),
    clinicalRisk: p.clinicalRisk,
    adherenceRisk: p.adherenceRisk,
    reasons: p.reasons ?? [],
  }));

  // Cálculo de resumen por nivel de riesgo
  const summary: IAPreviewSummary = patients.reduce(
    (acc, p) => {
      acc[p.riskLevel] = acc[p.riskLevel] + 1;
      return acc;
    },
    { bajo: 0, medio: 0, alto: 0 } as IAPreviewSummary
  );

  return {
    ok: true,
    totalPatients: patients.length,
    summary,
    patients,
  };
}
