// integrad-dashboard/src/config/api.ts

/**
 * 🔗 Configuración de API IntegraD (Dashboard web)
 *
 * - Centraliza la URL del backend.
 * - Usa variable de entorno VITE_API_URL cuando está disponible.
 * - Permite forzar entorno por VITE_API_TARGET = "local" | "prod".
 * - Fallback:
 *    - Si Vercel (.vercel.app) → backend Render.
 *    - Caso contrario → http://localhost:4000
 */

// 1) URL explícita por variable de entorno (prioridad máxima)
const ENV_API = (import.meta.env.VITE_API_URL as string | undefined)?.trim();

// 2) Selector manual de entorno
//    Valores posibles: "local" | "prod" | "production"
const ENV_TARGET = (import.meta.env.VITE_API_TARGET as string | undefined)?.trim() ?? "";

const DEFAULT_PROD_API = "https://integrad-backend-1.onrender.com";
const DEFAULT_LOCAL_API = "http://localhost:4000";

/**
 * Heurística para decidir la API por defecto cuando no hay VITE_API_URL:
 *
 * 1. Si VITE_API_TARGET = "local"        → backend local
 * 2. Si VITE_API_TARGET = "prod"         → backend producción
 * 3. Si hostname termina en ".vercel.app" → backend producción
 * 4. Caso contrario                       → backend local
 */
function inferDefaultApi(): string {
  const target = ENV_TARGET.toLowerCase();

  if (target === "local") {
    return DEFAULT_LOCAL_API;
  }

  if (target === "prod" || target === "production") {
    return DEFAULT_PROD_API;
  }

  if (typeof window !== "undefined") {
    const host = window.location.hostname || "";
    if (host.endsWith(".vercel.app")) {
      return DEFAULT_PROD_API;
    }
  }

  return DEFAULT_LOCAL_API;
}

// URL final que usará todo el dashboard
export const API_URL = ENV_API || inferDefaultApi();
