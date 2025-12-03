/* integrad-dashboard/src/api/patientAlerts.ts */

import { safeFetch } from "./safeFetch";
import { API_URL } from "../config/api";
import type { PatientAlertRow } from "../views/PatientAlertsView";

/**
 * Fila cruda que viene del backend para alertas por paciente.
 */
interface PatientAlertApiRow {
  id: string;
  kind: string; // "hipo", "hiper", "ia_risk", etc.
  value: number | null;
  unit?: string | null;
  detectedAt: string;
  status: string;
  reason?: string | null;
}

interface PatientAlertsApiResponse {
  data: PatientAlertApiRow[];
}

/**
 * Mapea tipo crudo → etiqueta amigable.
 */
function mapAlertType(rawType: string | null | undefined): string {
  if (!rawType) return "—";
  const t = rawType.toLowerCase();
  if (t === "hipo" || t === "hipoglucemia") return "Hipo";
  if (t === "hiper" || t === "hiperglucemia") return "Hiper";
  if (t === "riesgo_ia" || t === "ia_risk") return "Riesgo IA";
  return rawType.charAt(0).toUpperCase() + rawType.slice(1);
}

/**
 * Formatea valor según tipo.
 */
function formatAlertValue(
  rawType: string | null | undefined,
  valueRaw: number | null,
  unit?: string | null
): string {
  if (valueRaw == null) return "—";

  const t = rawType?.toLowerCase();
  if (t === "riesgo_ia" || t === "ia_risk") {
    return `${valueRaw} / 100`;
  }

  const safeUnit = unit || "mg/dL";
  return `${valueRaw} ${safeUnit}`;
}

/**
 * Formatea fecha/hora de detección.
 */
function formatDetectedAt(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";

  return d.toLocaleString("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

/**
 * Mapea API → fila para la vista.
 * Coincide exactamente con PatientAlertRow.
 */
function mapApiRowToPatientAlertRow(a: PatientAlertApiRow): PatientAlertRow {
  const typeLabel = mapAlertType(a.kind);
  const valueLabel = formatAlertValue(a.kind, a.value, a.unit ?? undefined);
  const detectedAt = formatDetectedAt(a.detectedAt);
  const statusLabel = a.status || "En alerta";

  return {
    id: String(a.id),
    typeLabel,
    valueLabel,
    detectedAt,
    statusLabel,
    reason: a.reason ?? null,
  };
}

/**
 * Obtiene alertas de un paciente específico.
 */
export async function fetchPatientAlerts(
  patientId: string
): Promise<{
  ok: boolean;
  data: PatientAlertRow[];
  error: string | null;
}> {
  // Endpoint tentativo: /patients/:id/alerts (ajustar al backend real)
  const endpoint = `${API_URL}/patients/${patientId}/alerts`;

  const result = await safeFetch<PatientAlertsApiResponse>(endpoint);

  if (!result.ok || !result.data || !Array.isArray(result.data.data)) {
    return {
      ok: false,
      data: [],
      error:
        result.error ??
        "No se pudieron cargar las alertas del paciente. Intente nuevamente.",
    };
  }

  try {
    const mapped = result.data.data.map(mapApiRowToPatientAlertRow);
    return { ok: true, data: mapped, error: null };
  } catch (err) {
    console.error("Error mapeando alertas del paciente:", err);
    return {
      ok: false,
      data: [],
      error: "Error interno procesando las alertas del paciente.",
    };
  }
}
