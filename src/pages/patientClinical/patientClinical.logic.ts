/*integrad-dashboard\src\pages\patientClinical\patientClinical.logic.ts*/
import type { ClinicalValue } from "../../api/patientSummary";

/**
 * Formatter puro (sin React).
 * Sprint: NO cambiar comportamiento visual.
 */
export function formatClinicalValue(v?: ClinicalValue | null): string {
  if (!v) return "Sin dato";

  if (typeof v.valueNumeric === "number") {
    const num = Number.isInteger(v.valueNumeric)
      ? v.valueNumeric.toString()
      : v.valueNumeric.toFixed(1);

    return v.unit ? `${num} ${v.unit}` : num;
  }

  if (v.valueText) return v.valueText;

  return "Sin dato";
}
