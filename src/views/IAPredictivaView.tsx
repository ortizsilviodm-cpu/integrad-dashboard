/* integrad-dashboard/src/views/IAPredictivaView.tsx */

import { useEffect, useMemo, useState } from "react";
import {
  fetchIAPredictivaPreview,
  type IAPatientRisk,
  type IAPreviewSummary,
  type RiskLevel,
} from "../api/iaPredictiva";

/**
 * Roles que pueden acceder a esta vista.
 * Más adelante se conectará con tu sistema real de auth.
 */
const ALLOWED_ROLES = ["admin", "medico", "coordinador"] as const;
type AllowedRole = (typeof ALLOWED_ROLES)[number];

export interface IAPredictivaViewProps {
  currentUserRole: string;
}

/**
 * Devuelve un color según el nivel de riesgo.
 * Usamos colores suaves para estar en línea con el resto del dashboard.
 */
function getRiskColor(level: RiskLevel): string {
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

/**
 * Ordena pacientes de mayor a menor riesgo.
 */
function sortPatientsByRisk(patients: IAPatientRisk[]): IAPatientRisk[] {
  return [...patients].sort((a, b) => b.riskScore - a.riskScore);
}

interface SummaryCardProps {
  label: string;
  value: number;
  bgColor: string;
}

function SummaryCard({ label, value, bgColor }: SummaryCardProps) {
  return (
    <div
      style={{
        padding: "0.75rem 1rem",
        borderRadius: "0.75rem",
        backgroundColor: bgColor,
        minWidth: "160px",
        boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: "0.8rem",
          fontWeight: 500,
          color: "#000000ff", // texto oscuro
        }}
      >
        {label}
      </p>
      <div
        style={{
          fontSize: "1.5rem",
          fontWeight: 700,
          marginTop: "0.25rem",
          color: "#0a0a0aff", // texto principal oscuro
        }}
      >
        {value}
      </div>
    </div>
  );
}

/**
 * 🔹 Componente principal de la vista de IA Predictiva.
 *
 * Alineado al modelo IntegraD:
 * - No hace diagnóstico.
 * - Muestra riesgo y motivos para ayudar al equipo clínico a priorizar.
 */
export default function IAPredictivaView({
  currentUserRole,
}: IAPredictivaViewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<IAPreviewSummary | null>(null);
  const [patients, setPatients] = useState<IAPatientRisk[]>([]);

  const hasAccess = useMemo(
    () => ALLOWED_ROLES.includes(currentUserRole as AllowedRole),
    [currentUserRole]
  );

  useEffect(() => {
    if (!hasAccess) return;

    setLoading(true);
    setError(null);

    fetchIAPredictivaPreview()
      .then((data) => {
        setSummary(data.summary);
        setPatients(sortPatientsByRisk(data.patients));
      })
      .catch((err) => {
        console.error("Error al cargar IA Predictiva:", err);
        setError(
          "No se pudieron cargar los datos de IA Predictiva. Intente nuevamente."
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, [hasAccess]);

  // Si el usuario no tiene permiso, no mostramos nada crítico de la IA
  if (!hasAccess) {
    return (
      <section className="app-table">
        <h2>IA Predictiva — Acceso restringido</h2>
        <p className="chart-subtitle">
          No tenés permisos para acceder a esta sección. Consultá con el
          administrador del sistema si considerás que es un error.
        </p>
      </section>
    );
  }

  return (
    <section className="app-table">
      {loading && (
        <div className="chart-placeholder">Cargando datos de riesgo…</div>
      )}

      {error && !loading && (
        <div className="chart-placeholder">
          <strong>Error:</strong> {error}
        </div>
      )}

      {!loading && !error && summary && (
        <>
          {/* Resumen de niveles de riesgo */}
          <section
            style={{
              display: "flex",
              gap: "1rem",
              marginBottom: "1.5rem",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <SummaryCard
              label="Riesgo bajo"
              value={summary.bajo}
              bgColor="#66BB6A"
            />
            <SummaryCard
              label="Riesgo medio"
              value={summary.medio}
              bgColor="#FFA726"
            />
            <SummaryCard
              label="Riesgo alto"
              value={summary.alto}
              bgColor="#DC2626"
            />
            <div
              style={{
                marginLeft: "auto",
                fontSize: "0.85rem",
                color: "#555",
              }}
            >
              Total de pacientes analizados:{" "}
              <strong>{patients.length}</strong>
            </div>
          </section>

          {/* Tabla de pacientes */}
          <section>
            <h3 style={{ marginBottom: "0.75rem" }}>
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
                              display: "inline-block",
                              padding: "0.15rem 0.6rem",
                              borderRadius: "999px",
                              fontSize: "0.8rem",
                              color: "#fff",
                              backgroundColor: getRiskColor(p.riskLevel),
                              textTransform: "capitalize",
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
                                <li key={idx} style={{ marginBottom: "0.15rem" }}>
                                  {reason}
                                </li>
                              ))}
                              {p.reasons.length > 3 && (
                                <li style={{ fontStyle: "italic" }}>
                                  + {p.reasons.length - 3} motivo(s) más
                                </li>
                              )}
                            </ul>
                          ) : (
                            <span style={{ color: "#888" }}>
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
    </section>
  );
}
