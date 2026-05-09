/* integrad-dashboard/src/api/safeFetch.ts */
// Helper de fetch con timeout, manejo de errores centralizado, y AUTENTICACIÓN.

import { getAuthToken } from "../store/authStore";

export interface SafeFetchResult<T> {
  ok: boolean;
  data: T | null;
  error: string | null;
  status: number | undefined;
}

/**
 * Helper semántico: identifica errores de autenticación
 */
export function isAuthError(
  result: Pick<SafeFetchResult<any>, "status">
): boolean {
  return result.status === 401 || result.status === 403;
}

function getBearerToken(): string | null {
  return getAuthToken();
}

/**
 * Función central de fetching que inyecta el token y maneja errores.
 */
export async function safeFetch<T>(
  input: RequestInfo,
  init?: (RequestInit & { timeoutMs?: number }) | undefined
): Promise<SafeFetchResult<T>> {
  const token = getBearerToken();
  const { timeoutMs = 10000, ...restInit } = init ?? {};

  // 1) Inyección del Token JWT en los headers
  const headers = new Headers(restInit.headers);

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // Content negotiation default (no pisa si ya viene)
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(input, {
      ...restInit,
      headers,
      signal: controller.signal,
    });

    const status = res.status;

    if (!res.ok) {
      let errorMsg: string | undefined;

      // 2) Manejo avanzado de errores HTTP
      try {
        const clone = res.clone();
        const errorBody = await clone.json();
        errorMsg = errorBody?.error || errorBody?.message;
      } catch {
        try {
          errorMsg = await res.text();
        } catch {
          // ignore
        }
      }

      const finalError = errorMsg || `Error HTTP ${status}`;

      // (Opcional) marca de sesión expirada para UI
      if (status === 401) {
        try {
          sessionStorage.setItem("auth_expired", "true");
        } catch {
          // ignore
        }
      }

      return {
        ok: false,
        data: null,
        error: finalError,
        status,
      };
    }

    // 3) Parseo exitoso de JSON
    try {
      const json = (await res.json()) as T;
      return {
        ok: true,
        data: json,
        error: null,
        status,
      };
    } catch {
      return {
        ok: false,
        data: null,
        error:
          "Error interpretando la respuesta del servidor (JSON inválido o vacío).",
        status,
      };
    }
  } catch (err: any) {
    // 4) Manejo de errores de red (timeout o conexión)
    if (err?.name === "AbortError") {
      return {
        ok: false,
        data: null,
        error: `La solicitud tardó demasiado y fue cancelada (${timeoutMs}ms).`,
        status: undefined,
      };
    }

    return {
      ok: false,
      data: null,
      error:
        "No se pudo conectar con el servidor. Revisa tu conexión a internet.",
      status: undefined,
    };
  } finally {
    clearTimeout(id);
  }
}
