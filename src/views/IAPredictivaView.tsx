/* integrad-dashboard/src/views/IAPredictivaView.tsx */

import type {
  IAPatientRisk,
  IAPreviewSummary,
  RiskLevel,
} from "../api/iaPredictiva";
import { ShieldCheck, Activity, AlertTriangle } from "lucide-react";

export interface IAPredictivaViewProps {
  /** Indica si el usuario tiene permiso para ver la sección de IA */
  hasAccess: boolean;
  /** Estado de carga del contenedor */
  loading: boolean;
  /** Mensaje de error (si lo hubo) */
  error: string | null;
  /** Resumen de niveles de riesgo (puede ser null si aún no hay datos) */
  summary: IAPreviewSummary | null;
  /** Lista de pacientes ya ordenados por riesgo */
  patients: IAPatientRisk[];
  /** Handler para reintentar la carga de datos */
  onRetry: () => void;
}

/**
 * Devuelve un color según el nivel de riesgo.
 * Usamos colores suaves, alineados al dashboard.
 */
function getRiskColor(level: RiskLevel | "alto" | "medio" | "bajo"): string {
  switch (level) {
    case "alto":
      return "#ff7043"; // naranja fuerte (alerta)
    case "medio":
      return "#ffa726"; // naranja medio
    case "bajo":
    default:
      return "#66bb6a"; // verde suave
  }
}

interface SummaryCardProps {
  label: string;
  value: number;
  level: "bajo" | "medio" | "alto";
}

function SummaryCard({ label, value, level }: SummaryCardProps) {
  const color = getRiskColor(level);
  const softBg =
    level === "alto"
      ? "rgba(255, 112, 67, 0.12)"
      : level === "medio"
      ? "rgba(255, 167, 38, 0.12)"
      : "rgba(102, 187, 106, 0.12)";

  const Icon =
    level === "alto" ? AlertTriangle : level === "medio" ? Activity : ShieldCheck;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.9rem",
        padding: "1.1rem 1.3rem",
        borderRadius: "1.1rem",
        backgroundColor: "#ffffff",
        boxShadow:
          "0 8px 16px rgba(0,0,0,0.04), 0 2px 4px rgba(0,0,0,0.04)",
        flex: 1,
        minWidth: 260,
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: "999px",
          backgroundColor: softBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color,
          flexShrink: 0,
        }}
      >
        <Icon size={28} />
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <span
          style={{
            fontSize: "var(--font-size-xs)",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "#6b7280",
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontSize: "var(--font-size-xl)",
            fontWeight: 700,
            color: "#111827",
            marginTop: 2,
          }}
        >
          {value}
        </span>
      </div>
    </div>
  );
}

export default function IAPredictivaView({
  hasAccess,
  loading,
  error,
  summary,
  patients,
  onRetry,
}: IAPredictivaViewProps) {
  if (!hasAccess) {
    return (
      <section className="app-table">
        <header className="section-header">
          <h2>IA Predictiva — Acceso restringido</h2>
          <p className="chart-subtitle">
            No tenés permisos para acceder a esta sección. Consultá con el
            administrador del sistema si considerás que es un error.
          </p>
        </header>
      </section>
    );
  }

  return (
    <section className="app-table">
      {/* 🔹 Encabezado alineado con el resto de vistas */}
      <header className="section-header">
        <h2>IA Predictiva — Riesgo y adherencia</h2>
        <p className="chart-subtitle">
          Visualización interna del riesgo estimado y adherencia de pacientes,
          sin emitir diagnóstico automático.
        </p>
      </header>

      {/* Estado: cargando */}
      {loading && (
        <div className="chart-placeholder">Cargando datos de riesgo…</div>
      )}

      {/* Estado: error */}
      {!loading && error && (
        <div className="chart-placeholder">
          <strong>Error:</strong> {error}
          <div className="retry-button-wrapper">
            <button
              type="button"
              className="retry-button"
              onClick={onRetry}
            >
              Reintentar
            </button>
          </div>
        </div>
      )}

      {/* Contenido principal */}
      {!loading && !error && summary && (
        <>
          <section
            style={{
              display: "flex",
              gap: "1rem",
              marginBottom: "0.75rem",
              flexWrap: "wrap",
            }}
          >
            <SummaryCard
              label="Riesgo bajo"
              value={summary.bajo}
              level="bajo"
            />
            <SummaryCard
              label="Riesgo medio"
              value={summary.medio}
              level="medio"
            />
            <SummaryCard
              label="Riesgo alto"
              value={summary.alto}
              level="alto"
            />
          </section>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: "1.5rem",
            }}
          >
            <div
              style={{
                padding: "0.4rem 1.1rem",
                borderRadius: "999px",
                backgroundColor: "#eef2ff",
                border: "1px solid rgba(129, 140, 248, 0.6)",
                fontSize: "var(--font-size-sm)",
                fontWeight: 600,
                color: "#1f2937",
              }}
            >
              Total de pacientes analizados:{" "}
              <span style={{ color: "#111827" }}>{patients.length}</span>
            </div>
          </div>

          <section>
            <h3
              style={{
                marginBottom: "0.75rem",
                fontSize: "var(--font-size-lg)",
              }}
            >
              Pacientes ordenados por riesgo
            </h3>
            {patients.length === 0 ? (
              <div className="chart-placeholder">
                No hay pacientes para mostrar en este momento.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table>
                  <thead>
                    <tr>
                      <th>Paciente</th>
                      <th>Riesgo clínico</th>
                      <th>Riesgo adherencia</th>
                      <th>Score global</th>
                      <th>Nivel</th>
                      <th>Motivos principales</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patients.map((p) => (
                      <tr key={p.patientId}>
                        <td>{p.fullName}</td>
                        <td>{p.clinicalRisk.toFixed(0)} %</td>
                        <td>{p.adherenceRisk.toFixed(0)} %</td>
                        <td>{p.riskScore.toFixed(0)} / 100</td>
                        <td>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              padding: "0.15rem 0.6rem",
                              borderRadius: "999px",
                              fontSize: "var(--font-size-xs)",
                              color: "#fff",
                              backgroundColor: getRiskColor(p.riskLevel),
                              textTransform: "capitalize",
                              minWidth: 80,
                              height: 24,
                            }}
                          >
                            {p.riskLevel}
                          </span>
                        </td>
                        <td>
                          {p.reasons && p.reasons.length > 0 ? (
                            <ul
                              style={{
                                paddingLeft: "1.1rem",
                                margin: 0,
                              }}
                            >
                              {p.reasons.slice(0, 3).map((reason, idx) => (
                                <li
                                  key={idx}
                                  style={{
                                    marginBottom: "0.15rem",
                                    fontSize: "var(--font-size-sm)",
                                  }}
                                >
                                  {reason}
                                </li>
                              ))}
                              {p.reasons.length > 3 && (
                                <li
                                  style={{
                                    fontStyle: "italic",
                                    fontSize: "var(--font-size-sm)",
                                  }}
                                >
                                  + {p.reasons.length - 3} motivo(s) más
                                </li>
                              )}
                            </ul>
                          ) : (
                            <span
                              style={{
                                color: "#888",
                                fontSize: "var(--font-size-sm)",
                              }}
                            >
                              Sin motivos detallados
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {!loading && !error && !summary && (
        <div className="chart-placeholder">
          No hay datos de IA predictiva disponibles en este momento.
        </div>
      )}
    </section>
  );
}
