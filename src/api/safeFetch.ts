/* integrad-dashboard/src/api/safeFetch.ts */
// Helper de fetch con timeout y manejo de errores centralizado.

export interface SafeFetchResult<T> {
  ok: boolean;
  data: T | null;
  error: string | null;
  status?: number;
}

export async function safeFetch<T>(
  input: RequestInfo,
  init?: (RequestInit & { timeoutMs?: number }) | undefined
): Promise<SafeFetchResult<T>> {
  const { timeoutMs = 10000, ...restInit } = init ?? {};
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(input, {
      ...restInit,
      signal: controller.signal,
    });

    const status = res.status;

    if (!res.ok) {
      let text: string | undefined;
      try {
        text = await res.text();
      } catch {
        // ignore
      }
      return {
        ok: false,
        data: null,
        error: text || `Error HTTP ${status}`,
        status,
      };
    }

    let json: T;
    try {
      json = (await res.json()) as T;
    } catch {
      return {
        ok: false,
        data: null,
        error: "Error interpretando la respuesta del servidor.",
        status,
      };
    }

    return {
      ok: true,
      data: json,
      error: null,
      status,
    };
  } catch (err: any) {
    if (err?.name === "AbortError") {
      return {
        ok: false,
        data: null,
        error: "La solicitud tardó demasiado y fue cancelada.",
        status: undefined,
      };
    }
    return {
      ok: false,
      data: null,
      error: "No se pudo conectar con el servidor.",
      status: undefined,
    };
  } finally {
    clearTimeout(id);
  }
}
