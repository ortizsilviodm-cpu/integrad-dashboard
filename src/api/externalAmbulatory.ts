/* integrad-dashboard/src/api/externalAmbulatory.ts */

import { safeFetch } from "./safeFetch";
import { API_URL } from "../config/api";

/**
 * Episodio ambulatorio tal como viene del backend IntegraD.
 * (El backend ya adaptó APOS → modelo interno.)
 */
export interface AmbulatoryEpisodeApi {
  payer: string;
  membershipCode: string;
  externalTicket: string;
  providerName: string;
  centerName: string;
  performedAt: string | null; // ISO string o null
  rawStatus: string;
  raw: unknown; // JSON crudo para auditoría
}

export interface AmbulatoryApiResponse {
  data: AmbulatoryEpisodeApi[];
  meta: {
    payer: string;
    membershipCode: string;
    year: number;
    count: number;
  };
}

/**
 * Fila que usará la tabla en el frontend.
 */
export type AmbulatoryRow = {
  id: string;
  ticket: string;
  provider: string;
  center: string;
  date: string;
  status: string;
};

export type AmbulatoryMeta = AmbulatoryApiResponse["meta"];

export interface AmbulatoryQueryParams {
  payer?: string; // por ahora APOS
  membershipCode: string;
  year: number;
}

/**
 * Formatea una fecha ISO a dd/MM/yyyy (es-AR).
 */
function formatDate(iso: string | null): string {
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
 * Mapea episodio crudo → fila para la UI.
 */
function mapEpisodeToRow(e: AmbulatoryEpisodeApi): AmbulatoryRow {
  return {
    id: e.externalTicket || `${e.membershipCode}-${e.performedAt || "sin-fecha"}`,
    ticket: e.externalTicket,
    provider: e.providerName || "—",
    center: e.centerName || "—",
    date: formatDate(e.performedAt),
    status: e.rawStatus || "—",
  };
}

/**
 * Llama al backend IntegraD:
 *
 *   GET /external/ambulatory?payer=APOS&membershipCode=...&year=...
 *
 * y devuelve filas ya mapeadas + meta.
 */
export async function fetchAmbulatoryEpisodes(
  params: AmbulatoryQueryParams
): Promise<{
  ok: boolean;
  rows: AmbulatoryRow[];
  meta: AmbulatoryMeta | null;
  error: string | null;
}> {
  const payer = params.payer ?? "APOS";
  const year = params.year;

  const query = new URLSearchParams({
    payer,
    membershipCode: params.membershipCode,
    year: String(year),
  });

  const endpoint = `${API_URL}/external/ambulatory?${query.toString()}`;

  const result = await safeFetch<AmbulatoryApiResponse>(endpoint, {
    method: "GET",
  });

  if (!result.ok || !result.data) {
    return {
      ok: false,
      rows: [],
      meta: null,
      error:
        result.error ??
        "No se pudieron obtener los consumos ambulatorios. Verificá los datos y la conexión.",
    };
  }

  try {
    const rows = result.data.data.map(mapEpisodeToRow);
    return {
      ok: true,
      rows,
      meta: result.data.meta,
      error: null,
    };
  } catch (err) {
    console.error("Error mapeando episodios ambulatorios:", err);
    return {
      ok: false,
      rows: [],
      meta: null,
      error: "Error interno procesando los datos de consumos ambulatorios.",
    };
  }
}
