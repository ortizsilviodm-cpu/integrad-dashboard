// integrad-dashboard/src/utils/patientClinical/history.ts

import type {
  ClinicalIndicatorHistoryRow,
  ClinicalIndicatorCode,
} from "../../api/clinicalHistory";
import type { SparklinePoint } from "./sparkline";

/**
 * Códigos que usamos para series en la vista clínica.
 * Extendemos el ClinicalIndicatorCode original para incluir PA sistólica/diastólica.
 */
export type SeriesCode = ClinicalIndicatorCode | "SYSTOLIC_BP" | "DIASTOLIC_BP";

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
      const existing = byCode.get(row.code as SeriesCode) ?? [];
      existing.push({
        timestamp: row.measuredAt,
        value: row.valueNumber as number,
      });
      byCode.set(row.code as SeriesCode, existing);
    });

  return byCode;
}

/**
 * Devuelve el último registro de un indicador dado.
 */
export function getLastValueForCode(
  history: ClinicalIndicatorHistoryRow[],
  code: SeriesCode
) {
  const filtered = history
    .filter((row) => row.code === code)
    .sort(
      (a, b) =>
        new Date(b.measuredAt).getTime() - new Date(a.measuredAt).getTime()
    );
  return filtered[0] ?? null;
}
