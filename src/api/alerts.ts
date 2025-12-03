/* integrad-dashboard/src/api/alerts.ts */

import { safeFetch } from "./safeFetch";
import { API_URL } from "../config/api";

// --- Definiciones de Tipos de Datos de la API ---

/**
 * Representa una fila de alerta “global” tal como se recibe directamente del backend
 * desde /readings/alerts.
 */
interface AlertsApiRow {
  id: string;
  patientId: string;
  patientName?: string;
  kind: string; // Ej: 'hipo', 'hiper', 'riesgo_ia'
  value: number | null; // Valor de glucemia o score de riesgo
  detectedAt: string; // Timestamp ISO de detección
  resolvedAt: string | null;
  status?: string | null; // Ej: 'open', 'resolved'
}

/**
 * Fila para el endpoint /patients/:id/alerts
 * (puede traer más metadata que las alertas globales).
 *
 * OJO: el backend nos manda a veces "severity" y otras "level"
 * (low | medium | high | critical). Usamos ambos.
 */
interface PatientAlertsApiRow extends AlertsApiRow {
  severity?: string | null; // 'low' | 'medium' | 'high' | etc.
  level?: string | null; // fallback cuando no viene "severity"
  title?: string | null;
  description?: string | null;
}

/**
 * Respuesta esperada del endpoint de alertas globales (/readings/alerts)
 * Suponemos que el backend devuelve: { data: AlertsApiRow[] }
 */
interface AlertsApiResponse {
  data: AlertsApiRow[];
}

/**
 * Respuesta esperada del endpoint /patients/:id/alerts
 */
interface PatientAlertsApiResponse {
  data: PatientAlertsApiRow[];
}

// --- Definiciones de Tipos de Datos para el Frontend (Mapeados) ---

/**
 * Representa una fila de alerta ya formateada para su visualización
 * en una tabla “global” de alertas.
 */
export type AlertRow = {
  id: string;
  patientName: string;
  typeLabel: string;
  valueLabel: string;
  createdAtLabel: string;
  statusLabel: string;
};

/**
 * Representa una alerta asociada a UN paciente,
 * pensada para la ficha clínica del paciente.
 */
export type SeverityCode = "low" | "medium" | "high" | "critical" | "unknown";

export type PatientAlertRow = {
  id: string;
  kindCode: string;
  kindLabel: string;
  severityLabel: string;
  severityCode: SeverityCode;
  title: string;
  description: string | null;
  detectedAt: string;
  detectedAtLabel: string;
  resolvedAt: string | null;
  resolvedAtLabel: string | null;
};

// --- Helpers de mapeo y formato comunes ---

/**
 * Mapea el tipo crudo de alerta a una etiqueta amigable.
 */
function mapAlertType(rawType: string | null | undefined): string {
  if (!rawType) return "—";

  const t = rawType.toLowerCase();

  // Glucemias
  if (t === "hipo" || t === "hypo" || t === "hipoglucemia") return "Hipoglucemia";
  if (t === "hiper" || t === "hyper" || t === "hiperglucemia") return "Hiperglucemia";

  // Riesgo IA
  if (t === "riesgo_ia" || t === "ia_risk") return "Riesgo IA";

  // Indicadores clínicos derivados
  if (t === "hba1c_high" || t === "hba1c_alta") return "HbA1c elevada";
  if (t === "bmi_high" || t === "imc_alto") return "IMC elevado";
  if (t === "bp_high" || t === "pa_alta" || t === "bp_elevated")
    return "Presión arterial elevada";

  // Adherencia / programa
  if (t === "adherence_low" || t === "adherencia_baja") return "Adherencia baja";

  // fallback: capitalizar lo que venga
  return rawType.charAt(0).toUpperCase() + rawType.slice(1);
}

/**
 * Mapea el tipo crudo a un código “estable”.
 */
function mapAlertKindCode(rawType: string | null | undefined): string {
  if (!rawType) return "unknown";
  const t = rawType.toLowerCase();
  if (t.startsWith("hipo")) return "HYPO";
  if (t.startsWith("hiper") || t.startsWith("hyper")) return "HYPER";
  if (t === "riesgo_ia" || t === "ia_risk") return "IA_RISK";
  return rawType.toUpperCase();
}

/**
 * Normaliza la severidad cruda a:
 *  - code estable (low/medium/high/critical/unknown)
 *  - label en español para mostrar
 */
function normalizeSeverity(
  raw: string | null | undefined
): { code: SeverityCode; label: string } {
  if (!raw) return { code: "unknown", label: "Sin clasificar" };

  const t = raw.toLowerCase().trim();

  if (t === "low" || t === "baja") return { code: "low", label: "Baja" };
  if (t === "medium" || t === "moderada" || t === "media")
    return { code: "medium", label: "Moderada" };

  // Muchos backends usan "warning" para algo parecido a 'medium'
  if (t === "warning") return { code: "medium", label: "Moderada" };

  if (t === "high" || t === "alta") return { code: "high", label: "Alta" };
  if (t === "critical" || t === "crítica" || t === "critica")
    return { code: "critical", label: "Crítica" };

  if (t === "sin clasificar" || t === "sin_clasificar")
    return { code: "unknown", label: "Sin clasificar" };

  // fallback: no lo conocemos, pero lo mostramos tal cual
  return {
    code: "unknown",
    label: raw.charAt(0).toUpperCase() + raw.slice(1),
  };
}

/**
 * Formatea fecha+hora local (Argentina).
 */
function formatDateTimeLabel(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

/**
 * Formatea el valor de la alerta según el tipo.
 * - Para hipo/hiper → mg/dL.
 * - Para riesgo IA → "score / 100".
 */
function formatAlertValue(
  rawType: string | null | undefined,
  valueRaw: number | null,
  unit: string
): string {
  if (valueRaw == null) return "—";

  const t = rawType?.toLowerCase();

  if (t === "riesgo_ia" || t === "ia_risk") {
    return `${valueRaw} / 100`;
  }

  return `${valueRaw} ${unit}`;
}

// --- Mapeo para la tabla global de alertas ---

/**
 * Mapea una fila cruda de la API a un objeto AlertRow amigable para la UI.
 */
function mapApiRowToAlertRow(a: AlertsApiRow): AlertRow {
  const rawType = a.kind ?? null;
  const typeLabel = mapAlertType(rawType);

  // Nombre del paciente
  const rawPatientName = a.patientName ?? "";
  const normalizedName = rawPatientName.trim().replace(/\s+/g, " ");
  const patientName = normalizedName || "—";

  // Valor y unidad
  const rawValue = a.value;
  const isRiskIa =
    rawType?.toLowerCase() === "riesgo_ia" ||
    rawType?.toLowerCase() === "ia_risk";
  const valueUnit = !isRiskIa ? "mg/dL" : ""; // Solo mostramos mg/dL para glucemias

  let numericValue: number | null = null;
  if (typeof rawValue === "number") {
    numericValue = rawValue;
  } else if (rawValue !== null) {
    const n = Number(rawValue);
    numericValue = Number.isNaN(n) ? null : n;
  }

  const valueLabel = formatAlertValue(rawType, numericValue, valueUnit);

  // Fecha de creación
  const createdAtLabel = formatDateTimeLabel(a.detectedAt);

  // Estado
  const statusLabel = a.status ? String(a.status) : a.resolvedAt ? "Resuelta" : "En alerta";

  return {
    id: String(a.id),
    patientName,
    typeLabel,
    valueLabel,
    createdAtLabel,
    statusLabel,
  };
}

// --- Función de Fetch Principal (global) ---

/**
 * Obtiene la lista de alertas abiertas del backend.
 * Retorna datos ya listos para usar en la vista de alertas globales.
 */
export async function fetchOpenAlerts(): Promise<{
  ok: boolean;
  data: AlertRow[];
  error: string | null;
}> {
  const endpoint = `${API_URL}/readings/alerts?status=open`;

  const result = await safeFetch<AlertsApiResponse>(endpoint);

  if (!result.ok || !result.data || !Array.isArray(result.data.data)) {
    return {
      ok: false,
      data: [],
      error:
        result.error ??
        "No se pudieron cargar las alertas debido a un error de red o formato.",
    };
  }

  try {
    const apiRows = result.data.data;
    const mappedData = apiRows.map(mapApiRowToAlertRow);
    return { ok: true, data: mappedData, error: null };
  } catch (e) {
    console.error("Error mapeando datos de alertas:", e);
    return {
      ok: false,
      data: [],
      error: "Error interno procesando los datos de alertas.",
    };
  }
}

// --- Alertas por paciente (para ficha clínica) ---

/**
 * Mapea una fila cruda de /patients/:id/alerts a PatientAlertRow.
 */
function mapPatientApiRow(a: PatientAlertsApiRow): PatientAlertRow {
  const kindCode = mapAlertKindCode(a.kind);
  const kindLabel = mapAlertType(a.kind);

  const { code: severityCode, label: severityLabel } = normalizeSeverity(
    a.severity ?? a.level ?? null
  );

  const hasRealKind = !!a.kind;

  // Título automático por defecto
  const autoTitle = hasRealKind
    ? `Alerta de ${kindLabel.toLowerCase()}`
    : "Alerta clínica";

  // Descripción automática por defecto
  const autoDescription = hasRealKind
    ? "Alerta generada automáticamente, revisar indicadores clínicos recientes (HbA1c, glucemia, PA, IMC, etc.)."
    : "Alerta clínica generada automáticamente.";

  const finalTitle = a.title ?? autoTitle;
  const finalDescription = a.description ?? autoDescription;

  const detectedAt = a.detectedAt;
  const resolvedAt = a.resolvedAt ?? null;

  const detectedAtLabel = formatDateTimeLabel(detectedAt);
  const resolvedAtLabel = resolvedAt ? formatDateTimeLabel(resolvedAt) : null;

  return {
    id: String(a.id),
    kindCode,
    kindLabel,
    severityLabel,
    severityCode,
    title: finalTitle,
    description: finalDescription,
    detectedAt,
    detectedAtLabel,
    resolvedAt,
    resolvedAtLabel,
  };
}

/**
 * Obtiene las alertas clínicas de un paciente.
 * status:
 *  - "open"     → solo abiertas (por defecto)
 *  - "resolved" → solo resueltas
 *  - "all"      → todas
 */
export async function fetchPatientAlerts(
  patientId: string,
  status: "open" | "resolved" | "all" = "open"
): Promise<{
  ok: boolean;
  data: PatientAlertRow[];
  error: string | null;
}> {
  const query =
    status === "all" ? "" : `?status=${encodeURIComponent(status)}`;
  const endpoint = `${API_URL}/patients/${patientId}/alerts${query}`;

  const result = await safeFetch<PatientAlertsApiResponse>(endpoint);

  if (!result.ok || !result.data || !Array.isArray(result.data.data)) {
    return {
      ok: false,
      data: [],
      error:
        result.error ??
        "No se pudieron cargar las alertas clínicas del paciente.",
    };
  }

  try {
    const apiRows = result.data.data;
    const mapped = apiRows.map(mapPatientApiRow);
    return { ok: true, data: mapped, error: null };
  } catch (e) {
    console.error("Error mapeando alertas del paciente:", e);
    return {
      ok: false,
      data: [],
      error: "Error interno procesando las alertas del paciente.",
    };
  }
}
