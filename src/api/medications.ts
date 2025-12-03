/* integrad-dashboard/src/api/medications.ts */

import { safeFetch } from "./safeFetch";
import { API_URL } from "../config/api";

/**
 * Fila cruda que viene del backend.
 * Más adelante podemos ajustar los nombres según el endpoint real.
 */
interface MedicationApiRow {
  id: string;
  patientName: string;
  medicationName: string;
  dosage: string;      // Ej: "850 mg"
  frequency: string;   // Ej: "2 veces al día"
  startDate: string;   // ISO string
  status: "Activa" | "Suspendida" | "Finalizada";
}

interface MedicationsApiResponse {
  data: MedicationApiRow[];
}

/**
 * Tipo usado por la vista (ya formateado).
 */
export type MedicationRow = {
  id: string;
  patientName: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  startDate: string; // fecha formateada
  status: "Activa" | "Suspendida" | "Finalizada";
};

/**
 * Formatea la fecha de inicio en formato corto es-AR.
 */
function formatStartDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";

  return d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Mapea fila cruda → fila para la UI.
 */
function mapApiRowToMedicationRow(row: MedicationApiRow): MedicationRow {
  return {
    id: row.id,
    patientName: row.patientName || "Sin nombre",
    medicationName: row.medicationName || "—",
    dosage: row.dosage || "—",
    frequency: row.frequency || "—",
    startDate: formatStartDate(row.startDate),
    status: row.status ?? "Activa",
  };
}

/**
 * Obtiene los esquemas de medicación.
 * Endpoint tentativo: /medications (ajustar cuando el backend esté listo).
 */
export async function fetchMedications(): Promise<{
  ok: boolean;
  data: MedicationRow[];
  error: string | null;
}> {
  const endpoint = `${API_URL}/medications`; // TODO: ajustar al endpoint real

  const result = await safeFetch<MedicationsApiResponse>(endpoint);

  if (!result.ok || !result.data || !Array.isArray(result.data.data)) {
    return {
      ok: false,
      data: [],
      error:
        result.error ??
        "No se pudieron cargar los esquemas de medicación. Intente nuevamente.",
    };
  }

  try {
    const mapped = result.data.data.map(mapApiRowToMedicationRow);
    return { ok: true, data: mapped, error: null };
  } catch (err) {
    console.error("Error mapeando esquemas de medicación:", err);
    return {
      ok: false,
      data: [],
      error: "Error interno procesando los datos de medicación.",
    };
  }
}
