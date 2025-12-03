/* integrad-dashboard/src/services/economicsDemo.ts */
// ⚠️ DEMO—cálculo económico estimado basado en datos mock APOS.
// No usar para decisiones clínicas. No diagnostica.

import { API_URL } from "../config/api";
import { safeFetch } from "../api/safeFetch";

// Tipos (coinciden con los JSON mock)
export type AposAfiliado = {
  id: string;
  firstName: string;
  lastName: string;
  documentId?: string;
  plan?: string;
  adherence?: number;     // ej: 0.82 (82%)
  openAlerts?: number;    // ej: 0, 1...
};

export type AposNomenItem = {
  code: string;
  genericName: string;
  presentation?: string;
  ppu?: number;           // precio público unitario (demo)
};

export type AposDispensa = {
  id: string;
  affiliateId: string;
  code: string;
  scheduledAt: string;
  pickedAt?: string | null;
};

// Resultado económico por afiliado
export type EconomicsRow = {
  affiliateId: string;
  afiliadoLabel: string;
  adherencePct: number;
  alertsOpen: number;
  costoDispensas: number;
  ahorroPotencial: number;
  ahorroNeto: number;
  roiPct: number; // -100..+∞
};

export async function loadEconomicsDemo() {
  const [afRes, nomRes, diRes] = await Promise.all([
    safeFetch<{ data: AposAfiliado[] }>(`${API_URL}/integrations/apos/afiliados`),
    safeFetch<{ data: AposNomenItem[] }>(`${API_URL}/integrations/apos/nomenclador`),
    safeFetch<{ data: AposDispensa[] }>(`${API_URL}/integrations/apos/dispensas`),
  ]);

  if (!afRes.ok || !afRes.data) throw new Error(afRes.error || "Afiliados DEMO no disponibles");
  if (!nomRes.ok || !nomRes.data) throw new Error(nomRes.error || "Nomenclador DEMO no disponible");
  if (!diRes.ok || !diRes.data) throw new Error(diRes.error || "Dispensas DEMO no disponibles");

  const afiliados = afRes.data.data ?? [];
  const nomen = nomRes.data.data ?? [];
  const dispensas = diRes.data.data ?? [];

  const ppuByCode = new Map<string, number>();
  for (const n of nomen) ppuByCode.set(n.code, typeof n.ppu === "number" ? n.ppu : 0);

  // Agrupar costo de dispensas por afiliado
  const costoPorAfiliado = new Map<string, number>();
  for (const d of dispensas) {
    const ppu = ppuByCode.get(d.code) ?? 0;
    costoPorAfiliado.set(d.affiliateId, (costoPorAfiliado.get(d.affiliateId) ?? 0) + ppu);
  }

  // Heurística DEMO (simple, explicable):
  // - Si adherencia >= 80% => factor ahorro 30%
  // - Si 60–79%          => 15%
  // - Si <60%            =>  5%
  // - Si hay alertas abiertas, penalizamos a la mitad el ahorro.
  function factorAhorro(adherence: number, alertsOpen: number) {
    let f = adherence >= 0.8 ? 0.30 : adherence >= 0.6 ? 0.15 : 0.05;
    if ((alertsOpen ?? 0) > 0) f = f / 2;
    return f;
  }

  const rows: EconomicsRow[] = afiliados.map((a) => {
    const costo = costoPorAfiliado.get(a.id) ?? 0;
    const adh = typeof a.adherence === "number" ? a.adherence : 0;
    const alerts = a.openAlerts ?? 0;
    const f = factorAhorro(adh, alerts);

    const ahorroPot = costo * f;
    const ahorroNeto = ahorroPot - costo; // ahorro potencial menos inversión en fármaco
    const roiPct = costo > 0 ? (ahorroNeto / costo) * 100 : 0;

    return {
      affiliateId: a.id,
      afiliadoLabel: `${a.lastName}, ${a.firstName} — ${a.documentId ?? "—"}`,
      adherencePct: Math.round(adh * 100),
      alertsOpen: alerts,
      costoDispensas: costo,
      ahorroPotencial: ahorroPot,
      ahorroNeto,
      roiPct,
    };
  });

  // KPIs globales
  const costoTotal = rows.reduce((acc, r) => acc + r.costoDispensas, 0);
  const ahorroPotTotal = rows.reduce((acc, r) => acc + r.ahorroPotencial, 0);
  const ahorroNetoTotal = ahorroPotTotal - costoTotal;
  const roiGlobalPct = costoTotal > 0 ? (ahorroNetoTotal / costoTotal) * 100 : 0;

  return {
    rows,
    kpis: {
      costoTotal,
      ahorroPotTotal,
      ahorroNetoTotal,
      roiGlobalPct,
    },
  };
}

export const fmtCurrency = (n: number) =>
  n.toLocaleString("es-AR", { style: "currency", currency: "ARS" });
