/* integrad-dashboard/src/api/audit.ts */

import { safeFetch } from "./safeFetch";
import { API_URL } from "../config/api";

// --- Definiciones de Tipos de Datos de la API ---

/**
 * Representa una fila de auditoría tal como se recibe del backend.
 */
interface AuditApiRow {
  id: string;
  userId: string;
  userName: string; // Nombre del usuario que realizó la acción
  actionType: string; // Ej: 'LOGIN', 'PATIENT_UPDATE', 'ALERT_RESOLVE'
  targetEntity: string; // Ej: 'Patient', 'Alert', 'User'
  targetId: string; // ID de la entidad afectada
  details: string; // Detalles adicionales de la acción
  timestamp: string; // ISO Date y hora del evento
}

/**
 * Respuesta esperada del endpoint /audit
 * Suponemos: { data: AuditApiRow[] }
 */
interface AuditApiResponse {
  data: AuditApiRow[];
}

// --- Definiciones de Tipos de Datos para el Frontend (Mapeados) ---

/**
 * Representa una fila de auditoría ya formateada para su visualización en la tabla.
 */
export type AuditRow = {
  id: string;
  userLabel: string; // Nombre de usuario y ID
  actionLabel: string; // Tipo de acción y entidad afectada
  timestampLabel: string; // Fecha y hora formateadas
  details: string; // Detalles de la acción
};

// --- Lógica de Mapeo y Formateo ---

/**
 * Mapea una fila cruda de la API a un objeto AuditRow amigable para la UI.
 */
function mapApiRowToAuditRow(a: AuditApiRow): AuditRow {
  // Etiqueta de Usuario
  const userLabel = `${a.userName} (ID: ${a.userId.substring(0, 8)}...)`;

  // Etiqueta de Acción
  const actionTypeNormalized = a.actionType.replace(/_/g, " ").toLowerCase();
  const actionLabel = `${actionTypeNormalized} en ${a.targetEntity} (ID: ${a.targetId.substring(
    0,
    8
  )}...)`;

  // Fecha y hora
  let timestampLabel = "—";
  if (a.timestamp) {
    const d = new Date(a.timestamp);
    if (!Number.isNaN(d.getTime())) {
      timestampLabel = d.toLocaleString("es-AR", {
        dateStyle: "short",
        timeStyle: "medium",
      });
    }
  }

  return {
    id: String(a.id),
    userLabel,
    actionLabel,
    timestampLabel,
    details: a.details,
  };
}

// --- Función de Fetch Principal ---

/**
 * Obtiene el registro de auditoría del backend.
 */
export async function fetchAuditLogs(): Promise<{
  ok: boolean;
  data: AuditRow[];
  error: string | null;
}> {
  const endpoint = `${API_URL}/audit`;

  const result = await safeFetch<AuditApiResponse>(endpoint);

  if (!result.ok || !result.data || !Array.isArray(result.data.data)) {
    return {
      ok: false,
      data: [],
      error: result.error ?? "No se pudo cargar el registro de auditoría.",
    };
  }

  try {
    const apiRows = result.data.data;
    const mappedData = apiRows.map(mapApiRowToAuditRow);
    return { ok: true, data: mappedData, error: null };
  } catch (e) {
    console.error("Error mapeando datos de auditoría:", e);
    return {
      ok: false,
      data: [],
      error: "Error interno procesando los datos de auditoría.",
    };
  }
}
