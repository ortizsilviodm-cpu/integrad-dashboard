/* integrad-dashboard/src/api/dispenses.ts */

import { safeFetch } from "./safeFetch";
import { API_URL } from "../config/api";

// --- Definiciones de Tipos de Datos que vienen del backend ---

interface DispenseApiRow {
  id: string;
  patientId: string;
  patientName: string;
  medication: string;
  dispenseDate: string;
  expectedDate: string;
  channel: string;
  isDelayed: boolean;
  delayDays: number;
  status: "A tiempo" | "Retrasado" | "Pendiente";
}

interface DispensesApiMeta {
  limit?: number;
  hasNext?: boolean;
  hasPrev?: boolean;
  nextCursor?: string;
}

interface DispensesApiResponse {
  data: DispenseApiRow[];
  meta?: DispensesApiMeta;
}

// --- Tipos de Datos Mapeados para la UI ---

export type DispenseRow = {
  id: string;
  patientName: string;
  medication: string;
  dispenseDate: string;
  channel: string;
  delayDays: number;
  status: "A tiempo" | "Retrasado" | "Pendiente";
};

export type DispensesPageMeta = {
  limit: number | null;
  hasNext: boolean;
  hasPrev: boolean;
  nextCursor: string | null;
};

export type FetchDispensesPageResult = {
  ok: boolean;
  data: DispenseRow[];
  error: string | null;
  meta: DispensesPageMeta;
};

// --- Funciones auxiliares ---

function formatDate(label: string): string {
  if (!label) return "—";
  const d = new Date(label);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-AR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function mapApiRowToDispenseRow(d: DispenseApiRow): DispenseRow {
  let channelLabel = d.channel;
  const c = d.channel.toLowerCase();
  if (c.includes("pharmacy")) channelLabel = "Farmacia";
  else if (c.includes("hospital")) channelLabel = "Hospital";
  else if (c.includes("self")) channelLabel = "Autogestión";

  return {
    id: String(d.id),
    patientName: d.patientName,
    medication: d.medication,
    dispenseDate: formatDate(d.dispenseDate),
    channel: channelLabel,
    delayDays: d.delayDays,
    status: d.status,
  };
}

function getDefaultMeta(): DispensesPageMeta {
  return {
    limit: null,
    hasNext: false,
    hasPrev: false,
    nextCursor: null,
  };
}

// --- FETCH PÁGINA COMPLETA (limit + cursor) ---

export async function fetchDispensesPage(params?: {
  limit?: number;
  cursor?: string | null;
}): Promise<FetchDispensesPageResult> {
  const { limit, cursor } = params ?? {};

  const q = new URLSearchParams();
  if (typeof limit === "number" && limit > 0) {
    q.set("limit", String(limit));
  }
  if (cursor) {
    q.set("cursor", cursor);
  }

  const url = q.toString()
    ? `${API_URL}/dispenses?${q.toString()}`
    : `${API_URL}/dispenses`;

  const result = await safeFetch<DispensesApiResponse>(url);

  if (!result.ok || !result.data || !Array.isArray(result.data.data)) {
    return {
      ok: false,
      data: [],
      error:
        result.error ??
        "No se pudieron cargar las dispensas debido a un error de red o formato.",
      meta: getDefaultMeta(),
    };
  }

  try {
    const mappedData = result.data.data.map(mapApiRowToDispenseRow);

    const meta = result.data.meta ?? {};
    const metaOut: DispensesPageMeta = {
      limit: meta.limit ?? null,
      hasNext: Boolean(meta.hasNext),
      hasPrev: Boolean(meta.hasPrev),
      nextCursor: meta.nextCursor ?? null,
    };

    return { ok: true, data: mappedData, error: null, meta: metaOut };
  } catch (e) {
    console.error("Error mapeando datos de dispensas:", e);
    return {
      ok: false,
      data: [],
      error: "Error interno procesando los datos de dispensas.",
      meta: getDefaultMeta(),
    };
  }
}

/**
 * Wrapper temporal para no romper DispensesPage.tsx mientras migramos la UI.
 * Devuelve la primera página, sin paginación del frontend.
 */
export async function fetchDispenses() {
  const r = await fetchDispensesPage();
  return { ok: r.ok, data: r.data, error: r.error };
}
