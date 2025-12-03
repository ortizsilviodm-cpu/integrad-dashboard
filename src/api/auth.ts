/* integrad-dashboard/src/api/auth.ts */
// Lógica de autenticación del Dashboard IntegraD

import { safeFetch, type SafeFetchResult } from "./safeFetch";
import { setAuthToken, clearAuthToken } from "../store/authStore";

// URL base del backend
// Asegurate de que VITE_API_URL apunte a algo como: http://localhost:4000
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

// Credenciales que envía el formulario de login
export interface LoginCredentials {
  email: string;
  password: string;
}

// Usuario que devuelve el backend en /auth/login
// (según tu router: id, email, role)
export interface LoginUser {
  id: string;
  email: string;
  role: "ADMIN" | "PROFESSIONAL" | "OPERATOR";
}

// Contrato esperado del backend tras un login exitoso
// ver: src/modules/auth/router.ts
export interface LoginResponse {
  token: string;
  user: LoginUser;
}

/**
 * Realiza el intento de login contra el backend.
 * Si es exitoso, guarda el token y devuelve los datos del usuario.
 */
export async function login(
  credentials: LoginCredentials
): Promise<SafeFetchResult<LoginResponse>> {
  const result = await safeFetch<LoginResponse>(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  // Si el login fue exitoso (ok: true) y recibimos el token:
  if (result.ok && result.data?.token) {
    // 🛡️ PERSISTENCIA: Guardamos el token para futuras peticiones
    setAuthToken(result.data.token);
  }

  // Devolvemos el resultado (con el token si fue exitoso, o el error)
  return result;
}

/**
 * Realiza el logout del usuario, eliminando el token de persistencia.
 */
export function logout(): void {
  clearAuthToken();
  // Opcional: si en el futuro agregás un endpoint /auth/logout en el backend,
  // podés llamarlo acá usando safeFetch.
}
