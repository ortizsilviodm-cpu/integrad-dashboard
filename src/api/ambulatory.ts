/* integrad-dashboard/src/api/ambulatory.ts */

import { safeFetch } from "./safeFetch";
import { API_URL } from "../config/api";

/**
 * Fila cruda que devuelve el backend en /external/ambulatory
 * (mapeada desde APOS).
 */
export interface AmbulatoryEpisodeApiRow {
  payer: string; // "APOS"
  membershipCode: string; // código de afiliado
  externalTicket: string;
  providerName: string;
  centerName: string;
  performedAt: string | null; // ISO string o null
  rawStatus: string; // código directamente desde APOS
}

/**
 * Respuesta del backend.
 * Ejemplo actual:
 * {
 *   "data": [...],
 *   "meta": {
 *     "payer": "APOS",
 *     "membershipCode": "0000019955995500",
 *     "year": 2024,
 *     "count": 0
 *   }
 * }
 */
export interface AmbulatoryEpisodesResponse {
  data: AmbulatoryEpisodeApiRow[];
  meta: {
    payer: string;
    membershipCode: string;
    year: number;
    count: number;
  };
}

/**
 * Fila formateada para mostrar en la tabla de la UI.
 */
export type AmbulatoryRow = {
  id: string;
  date: string;
  provider: string;
  center: string;
  status: string;
};

function formatDate(performedAt: string | null): string {
  if (!performedAt) return "—";

  const d = new Date(performedAt);
  if (Number.isNaN(d.getTime())) return "—";

  return d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Mapea la fila cruda a algo amigable para la tabla.
 */
function mapApiRowToUiRow(row: AmbulatoryEpisodeApiRow): AmbulatoryRow {
  return {
    id: row.externalTicket,
    date: formatDate(row.performedAt),
    provider: row.providerName || "-",
    center: row.centerName || "-",
    status: row.rawStatus || "-",
  };
}

export async function fetchAmbulatoryEpisodes(params: {
  payer: string; // por ahora siempre "APOS"
  membershipCode: string;
  year: number;
}): Promise<{
  ok: boolean;
  data: AmbulatoryRow[];
  error: string | null;
  meta: AmbulatoryEpisodesResponse["meta"] | null;
}> {
  const { payer, membershipCode, year } = params;

  const url = new URL(`${API_URL}/external/ambulatory`);
  url.searchParams.set("payer", payer);
  url.searchParams.set("membershipCode", membershipCode);
  url.searchParams.set("year", String(year));

  const result = await safeFetch<AmbulatoryEpisodesResponse>(
    url.toString(),
    { method: "GET" }
  );

  if (!result.ok || !result.data) {
    return {
      ok: false,
      data: [],
      error:
        result.error ??
        "No se pudieron obtener los consumos ambulatorios desde la obra social.",
      meta: null,
    };
  }

  const apiRows = Array.isArray(result.data.data) ? result.data.data : [];
  const mapped = apiRows.map(mapApiRowToUiRow);

  return {
    ok: true,
    data: mapped,
    error: null,
    meta: result.data.meta ?? null,
  };
}
