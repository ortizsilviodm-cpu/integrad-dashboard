/* integrad-dashboard/src/api/enrollments.ts */

import { safeFetch } from "./safeFetch";
import { API_URL } from "../config/api";

export type EnrollmentRow = {
  id: string;
  patientId: string;
  patientName: string;
  document: string;
  payerCode: string | null;
  membershipCode: string | null;
  planCode: string | null;
  programType: string;
  status: string;
  enrollmentDate: string | null;
  mainProvider: string | null;
};

export type EnrollmentsPageMeta = {
  limit: number | null;
  hasNext: boolean;
  hasPrev: boolean;
  nextCursor: string | null;
};

export type FetchEnrollmentsPageResult = {
  ok: boolean;
  data: EnrollmentRow[];
  error: string | null;
  meta: EnrollmentsPageMeta;
};

interface EnrollmentsApiRow {
  id: string;
  patientId: string;
  fullName: string;
  documentNumber: string;
  payerCode: string | null;
  // Estos dos campos los podremos usar más adelante (multi-obra social)
  membershipCode?: string | null;
  planCode?: string | null;
  programType: string;
  status: string;
  enrollmentDate: string | null;
  mainProvider: string | null;
}

interface EnrollmentsApiMeta {
  limit?: number;
  hasNext?: boolean;
  hasPrev?: boolean;
  nextCursor?: string | null;
}

interface EnrollmentsApiResponse {
  data: EnrollmentsApiRow[];
  meta?: EnrollmentsApiMeta;
}

function mapApiRowToEnrollmentRow(row: EnrollmentsApiRow): EnrollmentRow {
  return {
    id: row.id,
    patientId: row.patientId,
    patientName: row.fullName || "Sin nombre",
    document: row.documentNumber || "—",
    payerCode: row.payerCode,
    membershipCode: row.membershipCode ?? null,
    planCode: row.planCode ?? null,
    programType: row.programType,
    status: row.status,
    enrollmentDate: row.enrollmentDate,
    mainProvider: row.mainProvider,
  };
}

function getDefaultMeta(): EnrollmentsPageMeta {
  return {
    limit: null,
    hasNext: false,
    hasPrev: false,
    nextCursor: null,
  };
}

/**
 * Carga una página de enrolamientos:
 *  - limit, cursor
 *  - filtros opcionales: programType, payerCode, status
 */
export async function fetchEnrollmentsPage(params?: {
  limit?: number;
  cursor?: string | null;
  programType?: string;
  payerCode?: string;
  status?: string;
}): Promise<FetchEnrollmentsPageResult> {
  const { limit, cursor, programType, payerCode, status } = params ?? {};

  const query = new URLSearchParams();

  if (typeof limit === "number" && Number.isFinite(limit) && limit > 0) {
    query.set("limit", String(limit));
  }
  if (cursor) query.set("cursor", cursor);
  if (programType) query.set("programType", programType);
  if (payerCode) query.set("payerCode", payerCode);
  if (status) query.set("status", status);

  const qs = query.toString();
  const endpoint = qs
    ? `${API_URL}/patients/enrollments?${qs}`
    : `${API_URL}/patients/enrollments`;

  const result = await safeFetch<EnrollmentsApiResponse>(endpoint);

  if (!result.ok || !result.data || !Array.isArray(result.data.data)) {
    return {
      ok: false,
      data: [],
      error:
        result.error ??
        "No se pudieron cargar los enrolamientos. Intente nuevamente.",
      meta: getDefaultMeta(),
    };
  }

  try {
    const apiRows = result.data.data;
    const mapped = apiRows.map(mapApiRowToEnrollmentRow);

    const meta = result.data.meta;
    const metaOut: EnrollmentsPageMeta = {
      limit: meta?.limit ?? null,
      hasNext: Boolean(meta?.hasNext),
      hasPrev: Boolean(meta?.hasPrev),
      nextCursor: meta?.nextCursor ?? null,
    };

    return { ok: true, data: mapped, error: null, meta: metaOut };
  } catch (err) {
    console.error("Error mapeando enrolamientos:", err);
    return {
      ok: false,
      data: [],
      error: "Error interno procesando los datos de enrolamientos.",
      meta: getDefaultMeta(),
    };
  }
}
