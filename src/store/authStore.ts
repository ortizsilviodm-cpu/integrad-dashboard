// integrad-dashboard/src/store/authStore.ts
// Store mínimo de autenticación para IntegraD Dashboard
// Maneja el token JWT en localStorage y lo expone a safeFetch.

const TOKEN_KEY = "integrad_auth_token";

/**
 * Obtiene el token JWT almacenado.
 * Devuelve null si no existe o si estamos en un entorno sin window (SSR).
 */
export function getAuthToken(): string | null {
  // 🛡️ Seguridad SSR
  if (typeof window === "undefined") return null;

  try {
    const token = window.localStorage.getItem(TOKEN_KEY);
    return token || null;
  } catch (err) {
    // ⚠️ Advertencia si localStorage falla (ej. almacenamiento lleno o desactivado)
    console.warn("[authStore] No se pudo leer el token desde localStorage:", err);
    return null;
  }
}

/**
 * Guarda o limpia el token en localStorage.
 * Si token es null, elimina la clave.
 */
export function setAuthToken(token: string | null): void {
  // 🛡️ Seguridad SSR
  if (typeof window === "undefined") return;

  try {
    if (token) {
      window.localStorage.setItem(TOKEN_KEY, token);
    } else {
      window.localStorage.removeItem(TOKEN_KEY);
    }
  } catch (err) {
    // ⚠️ Advertencia si localStorage falla
    console.warn("[authStore] No se pudo escribir el token en localStorage:", err);
  }
}

/**
 * Elimina explícitamente el token (por ejemplo, en logout).
 */
export function clearAuthToken(): void {
  setAuthToken(null);
}

/**
 * Helper opcional: saber si hay un usuario autenticado.
 */
export function isAuthenticated(): boolean {
  return getAuthToken() !== null;
}