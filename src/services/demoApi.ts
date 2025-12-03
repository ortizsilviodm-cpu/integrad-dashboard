/* integrad-dashboard/src/services/demoApi.ts */
// Servicio de API demo — IntegraD Dashboard
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
const DEMO_MODE = (import.meta.env.VITE_DEMO_MODE || "true").toLowerCase() === "true";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

export async function getAposAfiliados() {
  if (!DEMO_MODE) throw new Error("DEMO_MODE deshabilitado en front");
  const json = await fetchJson<{ data: any[] }>(`${API_URL}/integrations/apos/afiliados`);
  return json.data;
}

export async function getAposNomenclador() {
  if (!DEMO_MODE) throw new Error("DEMO_MODE deshabilitado en front");
  const json = await fetchJson<{ data: any[] }>(`${API_URL}/integrations/apos/nomenclador`);
  return json.data;
}

export async function getAposDispensas() {
  if (!DEMO_MODE) throw new Error("DEMO_MODE deshabilitado en front");
  const json = await fetchJson<{ data: any[] }>(`${API_URL}/integrations/apos/dispensas`);
  return json.data;
}
