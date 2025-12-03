/* integrad-dashboard/src/api/safeFetch.ts */
// Helper de fetch con timeout, manejo de errores centralizado, y AUTENTICACIÓN.

// ⚠️ ASUNCIÓN: Esta función debe obtener el token JWT del almacenamiento o estado global.
import { getAuthToken } from "../store/authStore"; // ⬅️ DEBE EXISTIR ESTA UTILIDAD

export interface SafeFetchResult<T> {
  ok: boolean;
  data: T | null;
  error: string | null;
  status: number | undefined;
}

/**
 * Función central de fetching que inyecta el token y maneja errores.
 * @param input URL o Request.
 * @param init Opciones de fetch, incluyendo timeoutMs.
 */
export async function safeFetch<T>(
  input: RequestInfo,
  init?: (RequestInit & { timeoutMs?: number }) | undefined
): Promise<SafeFetchResult<T>> {
  const token = getAuthToken(); // 🛡️ Obtiene el token
  const { timeoutMs = 10000, ...restInit } = init ?? {};
  
  // 1. Inyección del Token JWT en los headers
  const authHeaders: Record<string, string> = {};
  if (token) {
    authHeaders["Authorization"] = `Bearer ${token}`;
  }

  // Combinación de headers existentes con los de autenticación
  const headers = new Headers(restInit.headers);
  Object.keys(authHeaders).forEach(key => headers.set(key, authHeaders[key]));

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(input, {
      ...restInit,
      headers, // ⬅️ Headers con el token inyectado
      signal: controller.signal,
    });

    const status = res.status;

    if (!res.ok) {
      let errorMsg: string | undefined;
      let errorBody: any;
      
      // 2. Manejo avanzado de errores HTTP (4xx, 5xx)
      try {
        // Intentar leer el JSON. Si falla, leer como texto.
        const clone = res.clone();
        errorBody = await clone.json();
        // 🛡️ Priorizar el mensaje de error enviado por nuestro backend (ej: { error: "..." })
        errorMsg = errorBody.error || errorBody.message;
      } catch {
        try {
          // Si no es JSON, intentar leer el texto plano
          errorMsg = await res.text();
        } catch {
          // ignore
        }
      }

      const finalError = errorMsg || `Error HTTP ${status}`;
      
      return {
        ok: false,
        data: null,
        error: finalError,
        status,
      };
    }

    // 3. Parseo exitoso de JSON
    let json: T;
    try {
      json = (await res.json()) as T;
    } catch {
      // Manejar caso donde el servidor devuelve 200/201 sin body (ej. no content)
      return {
        ok: false,
        data: null,
        error: "Error interpretando la respuesta del servidor (JSON inválido o vacío).",
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
    // 4. Manejo de errores de red (timeout o conexión)
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
      error: "No se pudo conectar con el servidor. Revisa tu conexión a internet.",
      status: undefined,
    };
  } finally {
    clearTimeout(id);
  }
}