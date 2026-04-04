// integrad-dashboard/src/store/authStore.ts
// Store mínimo de autenticación para IntegraD Dashboard.
// Maneja el token JWT en localStorage y helpers de lectura.

const TOKEN_KEY = "integrad_auth_token";
const LEGACY_TOKEN_KEYS = ["auth_token", "token", "userToken"] as const;

function cleanupLegacyTokenKeys(): void {
  if (typeof window === "undefined") return;

  try {
    for (const legacyKey of LEGACY_TOKEN_KEYS) {
      window.localStorage.removeItem(legacyKey);
    }
  } catch {
    // noop
  }
}

function readFirstLegacyToken(): string | null {
  if (typeof window === "undefined") return null;

  try {
    for (const legacyKey of LEGACY_TOKEN_KEYS) {
      const token = window.localStorage.getItem(legacyKey);
      if (token) return token;
    }

    return null;
  } catch {
    return null;
  }
}

function migrateLegacyTokenIfNeeded(): string | null {
  if (typeof window === "undefined") return null;

  try {
    const currentToken = window.localStorage.getItem(TOKEN_KEY);
    if (currentToken) {
      cleanupLegacyTokenKeys();
      return currentToken;
    }

    const legacyToken = readFirstLegacyToken();
    if (!legacyToken) {
      cleanupLegacyTokenKeys();
      return null;
    }

    window.localStorage.setItem(TOKEN_KEY, legacyToken);
    cleanupLegacyTokenKeys();
    return legacyToken;
  } catch {
    return null;
  }
}

/**
 * Obtiene el token JWT almacenado.
 * Devuelve null si no existe o si estamos en un entorno sin window (SSR).
 */
export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;

  try {
    const token = migrateLegacyTokenIfNeeded();
    return token || null;
  } catch {
    return null;
  }
}

/**
 * Guarda o limpia el token en localStorage.
 * Si token es null, elimina la clave.
 */
export function setAuthToken(token: string | null): void {
  if (typeof window === "undefined") return;

  try {
    cleanupLegacyTokenKeys();

    if (token) {
      window.localStorage.setItem(TOKEN_KEY, token);
    } else {
      window.localStorage.removeItem(TOKEN_KEY);
    }

    notifyAuthChange(token);
  } catch {
    // noop
  }
}

/**
 * Elimina explícitamente el token (por ejemplo, en logout).
 */
export function clearAuthToken(): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(TOKEN_KEY);
    cleanupLegacyTokenKeys();
    notifyAuthChange(null);
  } catch {
    // noop
  }
}

/**
 * Ejecuta inicialización defensiva del store al iniciar la app.
 * Migra tokens legacy al token oficial si fuese necesario.
 */
export function initializeAuthStore(): void {
  migrateLegacyTokenIfNeeded();
}

/**
 * Helper: saber si hay un usuario autenticado (token presente).
 */
export function isAuthenticated(): boolean {
  return getAuthToken() !== null;
}

/* ------------------------------------------------------------------ */
/* Extras (UI/Diagnóstico)                                            */
/* ------------------------------------------------------------------ */

export type JwtPayloadLite = {
  userId?: string;
  role?: string;
  appContext?: string;
  exp?: number;
  iat?: number;
};

/**
 * Decodifica el payload del JWT (sin verificar firma).
 * Útil para UI/diagnóstico (NO reemplaza validación del backend).
 */
export function decodeJwtPayload(token: string): JwtPayloadLite | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "=",
    );

    const json = atob(padded);
    return JSON.parse(json) as JwtPayloadLite;
  } catch {
    return null;
  }
}

/**
 * Devuelve info rápida del token actual (si existe).
 */
export function getSessionInfo(): JwtPayloadLite | null {
  const token = getAuthToken();
  if (!token) return null;
  return decodeJwtPayload(token);
}

/* ------------------------------------------------------------------ */
/* Suscripción a cambios (opcional)                                   */
/* ------------------------------------------------------------------ */

type AuthChangeListener = (token: string | null) => void;
const listeners = new Set<AuthChangeListener>();

export function onAuthChange(listener: AuthChangeListener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notifyAuthChange(token: string | null) {
  for (const fn of listeners) {
    try {
      fn(token);
    } catch {
      // noop
    }
  }
}