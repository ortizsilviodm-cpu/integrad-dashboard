// integrad-dashboard/src/api/auth.ts
// Lógica de autenticación del Dashboard IntegraD

import { safeFetch, type SafeFetchResult } from "./safeFetch";
import { setAuthToken, clearAuthToken, getAuthToken } from "../store/authStore";

// URL del backend centralizada
import { API_URL } from "../config/api";

// Credenciales que envía el formulario de login
export interface LoginCredentials {
  email: string;
  password: string;
}

// Usuario que devuelve el backend en /auth/login
export interface LoginUser {
  id: string;
  email: string;
  role: "ADMIN" | "PROFESSIONAL" | "OPERATOR";
}

// Contrato esperado del backend tras un login exitoso
export interface LoginResponse {
  token: string;
  user: LoginUser;
}

/**
 * Contrato esperado del backend para /auth/me
 * Nota: evitamos asumir campos no garantizados. Si el backend expone
 * fullName/specialty, se aprovechan en el frontend.
 */
export interface MeResponse {
  id: string;
  email?: string;
  role: "ADMIN" | "PROFESSIONAL" | "OPERATOR";
  fullName?: string;
  specialty?: string;

  // Backends a veces exponen "name" en lugar de "fullName"
  name?: string;
}

/** Utilidades internas */
function withAuthHeader(
  headers: Record<string, string> = {}
): Record<string, string> {
  const token = getAuthToken();
  return {
    ...headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function isUnauthorized(result: unknown): boolean {
  const r = result as { status?: number; statusCode?: number };
  const s = r.status ?? r.statusCode;
  return s === 401 || s === 403;
}

/**
 * Realiza el intento de login contra el backend.
 * Usa siempre API_URL, que viene del sistema de entornos del proyecto.
 */
export async function login(
  credentials: LoginCredentials
): Promise<SafeFetchResult<LoginResponse>> {
  const result = await safeFetch<LoginResponse>(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "Cache-Control": "no-store",
    },
    cache: "no-store",
    body: JSON.stringify(credentials),
  });

  if (result.ok && result.data?.token) {
    setAuthToken(result.data.token);
  } else {
    if (isUnauthorized(result)) {
      clearAuthToken();
    }
  }

  return result;
}

/**
 * Obtiene la identidad real del usuario autenticado.
 */
export async function fetchMe(): Promise<SafeFetchResult<MeResponse>> {
  const result = await safeFetch<MeResponse>(`${API_URL}/auth/me`, {
    method: "GET",
    headers: withAuthHeader({
      Accept: "application/json",
      "Cache-Control": "no-store",
    }),
    cache: "no-store",
  });

  if (!result.ok && isUnauthorized(result)) {
    clearAuthToken();
    sessionStorage.setItem("auth_expired", "1");
  }

  return result;
}

/**
 * Logout: elimina token local (persistencia).
 */
export function logout(): void {
  clearAuthToken();
}
