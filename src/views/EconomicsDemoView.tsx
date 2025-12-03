/* integrad-dashboard/src/views/EconomicsDemoView.tsx */
/**
 * 💰 Impacto Económico (DEMO APOS)
 * - Usa /integrations/apos/* (mock)
 * - Heurística explicable (factor por adherencia y alertas)
 * - No diagnostica. Es una vista demostrativa para conversación con pagadores.
 */

import { useEffect, useMemo, useState } from "react";
import {
  loadEconomicsDemo,
  fmtCurrency,
  type EconomicsRow,
} from "../services/economicsDemo";
import KpiCard from "../components/KpiCard";

import "./EconomicsDemoView.css";

export default function EconomicsDemoView() {
  const [rows, setRows] = useState<EconomicsRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [costoTotal, setCostoTotal] = useState<number>(0);
  const [ahorroPotTotal, setAhorroPotTotal] = useState<number>(0);
  const [ahorroNetoTotal, setAhorroNetoTotal] = useState<number>(0);
  const [roiGlobalPct, setRoiGlobalPct] = useState<number>(0);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const r = await loadEconomicsDemo();
        setRows(r.rows);
        setCostoTotal(r.kpis.costoTotal);
        setAhorroPotTotal(r.kpis.ahorroPotTotal);
        setAhorroNetoTotal(r.kpis.ahorroNetoTotal);
        setRoiGlobalPct(r.kpis.roiGlobalPct);
      } catch (e: any) {
        setError(e?.message || "Error cargando Impacto Económico DEMO");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const topByAhorro = useMemo(() => {
    return [...rows]
      .sort((a, b) => b.ahorroPotencial - a.ahorroPotencial)
      .slice(0, 5);
  }, [rows]);

  const hasError = !!error;

  return (
    <div className="page pad econ">
      {/* Encabezado de sección (título se alinea con el resto del dashboard) */}
      <header className="app-section-header">
        <div>
          <h1>Impacto Económico — DEMO APOS</h1>
          <p className="text-muted">
            Estimación de eficiencia preventiva basada en adherencia, alertas y
            costo de dispensas.
            <br />
            <strong>Nota:</strong> heurística de demo; no representa liquidación
            real.
          </p>
        </div>
      </header>

      {/* KPIs principales */}
      <section className="app-kpis">
        <KpiCard
          title="Costo de dispensas"
          value={
            loading ? "..." : hasError ? "—" : fmtCurrency(costoTotal)
          }
          description="Suma de PPU por afiliado"
          color="blue"
        />

        <KpiCard
          title="Ahorro potencial"
          value={
            loading ? "..." : hasError ? "—" : fmtCurrency(ahorroPotTotal)
          }
          description="En base a adherencia y alertas"
          color="purple"
        />

        <KpiCard
          title="Ahorro neto"
          value={
            loading ? "..." : hasError ? "—" : fmtCurrency(ahorroNetoTotal)
          }
          description="Ahorro potencial - costo de dispensas"
          color="green"
        />

        <KpiCard
          title="ROI estimado"
          value={
            loading
              ? "..."
              : hasError
              ? "—"
              : `${Math.round(roiGlobalPct)} %`
          }
          description="(Ahorro neto / costo) × 100"
          color={roiGlobalPct >= 0 ? "green" : "red"}
        />
      </section>

      {/* Tabla por afiliado */}
      <section className="card">
        <div className="card-head">
          <h2 className="card-title">Resumen por afiliado</h2>
          <button
            className="btn primary"
            onClick={() => exportEconomicsCsv(rows)}
            disabled={loading || !!error}
          >
            Exportar CSV
          </button>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Afiliado</th>
                <th>Adherencia</th>
                <th>Alertas</th>
                <th>Costo dispensas</th>
                <th>Ahorro potencial</th>
                <th>Ahorro neto</th>
                <th>ROI</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.affiliateId}>
                  <td>{r.afiliadoLabel}</td>
                  <td>{r.adherencePct} %</td>
                  <td>
                    <span
                      className={`badge ${
                        r.alertsOpen > 0 ? "warn" : "ok"
                      }`}
                    >
                      {r.alertsOpen > 0
                        ? `${r.alertsOpen} alerta(s)`
                        : "Sin alertas"}
                    </span>
                  </td>
                  <td>{fmtCurrency(r.costoDispensas)}</td>
                  <td>{fmtCurrency(r.ahorroPotencial)}</td>
                  <td>{fmtCurrency(r.ahorroNeto)}</td>
                  <td className={r.roiPct >= 0 ? "roi-pos" : "roi-neg"}>
                    {Math.round(r.roiPct)} %
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="footnote">
          * DEMO: factores de ahorro basados en adherencia (≥80%: 30%, 60–79%:
          15%, &lt;60%: 5%), penalizados por alertas abiertas (×0.5).
        </p>
      </section>

      {/* Top ahorro potencial */}
      <section className="card">
        <h2 className="card-title">Top 5 — Ahorro potencial</h2>
        <div className="list">
          {topByAhorro.map((r) => (
            <div key={r.affiliateId} className="list-item">
              <div className="list-main">
                <strong>{r.afiliadoLabel}</strong>
                <span className="text-muted">
                  Adherencia {r.adherencePct}% • Alertas {r.alertsOpen}
                </span>
              </div>
              <div className="list-right">
                {fmtCurrency(r.ahorroPotencial)}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function escapeCsvCell(v: unknown) {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function exportEconomicsCsv(rows: EconomicsRow[]) {
  const headers = [
    "AfiliadoId",
    "Afiliado",
    "Adherencia_%",
    "Alertas",
    "CostoDispensas_AR$",
    "AhorroPotencial_AR$",
    "AhorroNeto_AR$",
    "ROI_%",
  ];
  const body = rows.map((r) => [
    r.affiliateId,
    r.afiliadoLabel,
    r.adherencePct,
    r.alertsOpen,
    Math.round(r.costoDispensas),
    Math.round(r.ahorroPotencial),
    Math.round(r.ahorroNeto),
    Math.round(r.roiPct),
  ]);
  const csv =
    headers.map(escapeCsvCell).join(",") +
    "\n" +
    body.map((row) => row.map(escapeCsvCell).join(",")).join("\n");

  const blob = new Blob([`\uFEFF${csv}`], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "economics_demo_apos.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
