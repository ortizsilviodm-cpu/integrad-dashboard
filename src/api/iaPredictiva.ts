/* integrad-dashboard/src/api/iaPredictiva.ts */
/**
 * Cliente para consumir la API de IA Predictiva integrada al backend IntegraD
 *
 * Endpoint:
 * - GET /ia/risk/summary?windowDays=90
 *
 * Contrato backend (M5 estabilizado):
 * {
 *   data: {
 *     patients: [...],
 *     summary: { bajo, medio, alto },
 *     totalPatients: number
 *   },
 *   meta: { windowDays, generatedAt, modelVersion? }
 * }
 */

import { API_URL } from "../config/api";

// -------------------------
// Tipos públicos (Dashboard)
// -------------------------

/** Nivel de riesgo que mostramos en el dashboard (en español) */
export type RiskLevel = "bajo" | "medio" | "alto";

/** Tipo que usa el dashboard para cada paciente con riesgo calculado */
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

/** Resumen agregando cantidad de pacientes por nivel de riesgo */
export interface IAPreviewSummary {
  bajo: number;
  medio: number;
  alto: number;
}

/** Estructura que consume la vista de IA Predictiva */
export interface IAPreviewResponse {
  ok: boolean;
  summary: IAPreviewSummary;
  totalPatients: number;
  patients: IAPatientRisk[];
}

// --------------------------------------
// Tipos internos (respuesta backend IA)
// --------------------------------------

/**
 * Niveles de riesgo que puede devolver el backend.
 * Soporta inglés y español para compatibilidad.
 *
 * Nota:
 * - "critical" existe en algunas implementaciones; en dashboard v1 se mapea a "alto".
 */
type BackendRiskLevel =
  | "low"
  | "medium"
  | "high"
  | "critical"
  | "bajo"
  | "medio"
  | "alto";

/**
 * Estructura mínima esperada desde el backend en:
 * GET /ia/risk/summary
 *
 * patients: lista de pacientes con riesgo calculado.
 * summary: conteo por nivel.
 * totalPatients: total.
 */
interface IARiskApiPatient {
  patientId: string;
  fullName: string;

  riskScore: number; // 0–1 o 0–100 según implementación
  riskLevel: BackendRiskLevel;

  clinicalRisk: number;
  adherenceRisk: number;

  reasons?: string[];

  // opcional si el backend ya entrega en 0–100
  riskScorePercent?: number;

  modelVersion?: string;
}

interface IARiskSummaryData {
  patients: IARiskApiPatient[];
  summary: IAPreviewSummary;
  totalPatients: number;
}

interface IARiskApiResponse {
  data: IARiskSummaryData;
  meta: {
    windowDays: number;
    generatedAt: string;
    modelVersion?: string;
  };
}

// -------------------------
// Config
// -------------------------

const IA_BASE_URL = `${API_URL}/ia`;
const DEFAULT_WINDOW_DAYS = 90;

// -------------------------
// Helpers
// -------------------------

/** Mapea el nivel de riesgo del backend al nivel usado en el dashboard (en español). */
function mapBackendLevelToRiskLevel(level: BackendRiskLevel): RiskLevel {
  switch (level) {
    case "critical":
    case "high":
    case "alto":
      return "alto";
    case "medium":
    case "medio":
      return "medio";
    case "low":
    case "bajo":
    default:
      return "bajo";
  }
}

/**
 * Normaliza un riskScore que puede venir en 0–1 o 0–100
 * a un valor en 0–100 (entero) para mostrar en la UI.
 */
function normalizeRiskScore(
  rawScore: number | undefined,
  rawPercent?: number
): number {
  if (typeof rawPercent === "number" && !Number.isNaN(rawPercent)) {
    return Math.round(rawPercent);
  }

  if (typeof rawScore !== "number" || Number.isNaN(rawScore)) {
    return 0;
  }

  // Si viene en 0–1, lo convertimos; si viene >1 asumimos 0–100.
  if (rawScore <= 1) {
    return Math.round(rawScore * 100);
  }

  return Math.round(rawScore);
}

function safeString(value: unknown): string {
  if (typeof value === "string") return value;
  return "";
}

function safeNumber(value: unknown): number {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  return 0;
}

function safeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  for (const v of value) {
    if (typeof v === "string" && v.trim().length > 0) out.push(v.trim());
  }
  return out;
}

/**
 * Defensa leve de contrato:
 * - evita crashear si backend aún no está en el contrato nuevo
 * - pero no intenta “arreglar” mezcla de entidades (eso es backend)
 */
function normalizeApiResponseShape(apiData: any): IARiskApiResponse {
  // Si ya viene en el contrato nuevo, lo devolvemos
  if (apiData && apiData.data && Array.isArray(apiData.data.patients)) {
    return apiData as IARiskApiResponse;
  }

  // Fallback (contrato viejo): { data: [...], meta: {...} }
  // Convertimos a estructura nueva de forma conservadora.
  const legacyData = Array.isArray(apiData?.data) ? (apiData.data as any[]) : [];

  const patients: IARiskApiPatient[] = legacyData.map((p) => ({
    patientId: safeString(p.patientId),
    fullName: safeString(p.fullName),
    riskScore: safeNumber(p.riskScore),
    riskLevel: (safeString(p.riskLevel) as BackendRiskLevel) || "low",
    clinicalRisk: safeNumber(p.clinicalRisk),
    adherenceRisk: safeNumber(p.adherenceRisk),
    reasons: safeStringArray(p.reasons),
    riskScorePercent:
      typeof p.riskScorePercent === "number" ? p.riskScorePercent : undefined,
    modelVersion: typeof p.modelVersion === "string" ? p.modelVersion : undefined,
  }));

  const summary: IAPreviewSummary = patients.reduce(
    (acc, p) => {
      const lvl = mapBackendLevelToRiskLevel(p.riskLevel);
      acc[lvl] += 1;
      return acc;
    },
    { bajo: 0, medio: 0, alto: 0 }
  );

  const meta = apiData?.meta ?? {};
  const windowDays =
    typeof meta.windowDays === "number" ? meta.windowDays : DEFAULT_WINDOW_DAYS;
  const generatedAt =
    typeof meta.generatedAt === "string" ? meta.generatedAt : new Date().toISOString();

  return {
    data: {
      patients,
      summary,
      totalPatients: patients.length,
    },
    meta: {
      windowDays,
      generatedAt,
      modelVersion: typeof meta.modelVersion === "string" ? meta.modelVersion : undefined,
    },
  };
}

// -------------------------
// API
// -------------------------

/**
 * Llama al endpoint de resumen de riesgo de IA Predictiva.
 * Integra datos reales de la base de datos (vía backend IntegraD).
 *
 * Lanza Error si la respuesta HTTP no es ok.
 */
export async function fetchIAPredictivaPreview(): Promise<IAPreviewResponse> {
  const url = `${IA_BASE_URL}/risk/summary?windowDays=${DEFAULT_WINDOW_DAYS}`;

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Error al consultar IA Predictiva (status ${res.status})`);
  }

  const raw = await res.json();
  const apiData = normalizeApiResponseShape(raw);

  const patients: IAPatientRisk[] = (apiData.data.patients ?? []).map((p) => ({
    patientId: safeString(p.patientId),
    fullName: safeString(p.fullName),
    riskScore: normalizeRiskScore(p.riskScore, p.riskScorePercent),
    riskLevel: mapBackendLevelToRiskLevel(p.riskLevel),
    clinicalRisk: Math.round(safeNumber(p.clinicalRisk)),
    adherenceRisk: Math.round(safeNumber(p.adherenceRisk)),
    reasons: safeStringArray(p.reasons),
  }));

  // Preferimos summary backend (ya viene computado); si faltara, recalculamos.
  const summary: IAPreviewSummary =
    apiData.data.summary ??
    patients.reduce(
      (acc, p) => {
        acc[p.riskLevel] = acc[p.riskLevel] + 1;
        return acc;
      },
      { bajo: 0, medio: 0, alto: 0 } as IAPreviewSummary
    );

  const totalPatients =
    typeof apiData.data.totalPatients === "number"
      ? apiData.data.totalPatients
      : patients.length;

  return {
    ok: true,
    totalPatients,
    summary,
    patients,
  };
}
