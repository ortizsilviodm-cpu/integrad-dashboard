// integrad-dashboard/src/utils/patientClinical/history.ts

import type {
  ClinicalIndicatorHistoryRow,
  ClinicalIndicatorCode,
} from "../../api/clinicalHistory";
import type { SparklinePoint } from "./sparkline";

/**
 * Códigos que usamos para series en la vista clínica.
 * NOTA:
 * - Backend suele devolver BP_SYSTOLIC / BP_DIASTOLIC.
 * - Algunos módulos legacy usan SYSTOLIC_BP / DIASTOLIC_BP.
 * - Normalizamos a SYSTOLIC_BP / DIASTOLIC_BP para que la UI sea consistente.
 */
export type SeriesCode = ClinicalIndicatorCode | "SYSTOLIC_BP" | "DIASTOLIC_BP";

export function normalizeSeriesCode(code: SeriesCode): SeriesCode {
  if (code === "BP_SYSTOLIC") return "SYSTOLIC_BP";
  if (code === "BP_DIASTOLIC") return "DIASTOLIC_BP";
  return code;
}

/**
 * Agrupa el historial por código de indicador y arma las series de tendencia.
 */
export function buildSeriesByCode(history: ClinicalIndicatorHistoryRow[]) {
  const byCode = new Map<SeriesCode, SparklinePoint[]>();

  history
    .filter((row) => row.valueNumber !== null && row.valueNumber !== undefined)
    .sort(
      (a, b) =>
        new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime()
    )
    .forEach((row) => {
      const normalized = normalizeSeriesCode(row.code as SeriesCode);
      const existing = byCode.get(normalized) ?? [];
      existing.push({
        timestamp: row.measuredAt,
        value: row.valueNumber as number,
      });
      byCode.set(normalized, existing);
    });

  return byCode;
}

/**
 * Devuelve el último registro de un indicador dado.
 * Acepta códigos normalizados y legacy.
 */
export function getLastValueForCode(
  history: ClinicalIndicatorHistoryRow[],
  code: SeriesCode
) {
  const normalizedTarget = normalizeSeriesCode(code);

  const filtered = history
    .filter((row) => normalizeSeriesCode(row.code as SeriesCode) === normalizedTarget)
    .slice()
    .sort(
      (a, b) =>
        new Date(b.measuredAt).getTime() - new Date(a.measuredAt).getTime()
    );

  return filtered[0] ?? null;
}