/* integrad-dashboard/src/components/DashboardFollowupTable.tsx */

import React from "react";
import type { PatientFollowUpRow } from "../api/dashboard";
import { AlertCircle, CheckCircle2 } from "lucide-react";

// Badge de estado visual simple
interface StatusBadgeProps {
  // Permitimos cualquier string, aunque en la práctica usamos:
  // "En alerta" | "No controlado" | "Estable" | "En revisión"
  label: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ label }) => {
  const isAlert = label === "En alerta";

  // 🎨 Estilo inspirado en la vista Pacientes:
  // pill sólido rojo/verde, texto blanco y un ícono dentro.
  const background = isAlert ? "#e74c3c" : "#27ae60"; // rojo / verde
  const color = "#ffffff";

  const iconProps = { size: 14, strokeWidth: 2, color: "#ffffff" };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        padding: "0.15rem 0.9rem",
        borderRadius: 999,
        fontSize: "var(--font-size-xs)", // antes 0.8rem
        fontWeight: 600,
        backgroundColor: background,
        color,
        minWidth: 110, // 👉 mismo ancho para todos
        height: 24, // 👉 alto consistente con Pacientes
        lineHeight: 1.2,
      }}
    >
      {isAlert ? (
        <AlertCircle {...iconProps} />
      ) : (
        <CheckCircle2 {...iconProps} />
      )}
      <span>{label}</span>
    </span>
  );
};

// --- Estilos inline simples para la tabla ---

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "0.75rem 1rem",
  borderBottom: "2px solid #ddd",
  backgroundColor: "#f9fafb",
  fontSize: "var(--font-size-sm)", // antes 0.9rem
  fontWeight: 600,
  color: "#374151",
};

const tdStyle: React.CSSProperties = {
  padding: "0.75rem 1rem",
  borderBottom: "1px solid #eee",
  fontSize: "var(--font-size-sm)", // antes 0.9rem
  verticalAlign: "top",
};

const tfootCellStyle: React.CSSProperties = {
  padding: "0.75rem 1rem",
  fontSize: "var(--font-size-sm)", // antes 0.9rem
  fontWeight: 600,
  backgroundColor: "#f9fafb",
  borderTop: "2px solid #e5e7eb",
};

interface DashboardFollowupTableProps {
  rows: PatientFollowUpRow[];
  /**
   * Opcional: se llama cuando el usuario hace click en una fila.
   * Ideal para navegar a "Detalle del paciente".
   */
  onRowClick?: (patientId: string) => void;
}

const formatDateTime = (value: string | Date | null): string => {
  if (!value) return "-";
  try {
    const date = value instanceof Date ? value : new Date(value);
    return date.toLocaleString();
  } catch {
    return "Fecha inválida";
  }
};

const formatPercent = (value: number | null | undefined): string => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "-";
  }
  const rounded = Math.round(value);
  return `${rounded}%`;
};

const DashboardFollowupTable: React.FC<DashboardFollowupTableProps> = ({
  rows,
  onRowClick,
}) => {
  if (rows.length === 0) {
    return (
      <p style={{ color: "#6b7280", fontSize: "var(--font-size-sm)" }}>
        No hay pacientes en seguimiento para los filtros actuales.
      </p>
    );
  }

  // ---- Cálculos de resumen ----
  const totalPatients = rows.length;
  const totalAlerts = rows.reduce((acc, r) => acc + (r.openAlerts || 0), 0);

  const sumAdherence = rows.reduce((acc, r) => {
    const v = r.adherencePercent ?? 0;
    // Defensa por si algún día viene 0–1 en vez de 0–100
    const normalized = v <= 1 && v > 0 ? v * 100 : v;
    return acc + normalized;
  }, 0);

  const avgAdherence =
    totalPatients > 0 ? Math.round(sumAdherence / totalPatients) : null;

  return (
    <div
      style={{
        overflowX: "auto",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
        backgroundColor: "#ffffff",
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          minWidth: "800px", // Aseguramos visibilidad en tablet/desktop
        }}
      >
        <thead>
          <tr>
            <th style={thStyle}>Paciente</th>
            <th style={thStyle}>Documento</th>
            <th style={thStyle}>Última Glucemia</th>
            <th style={thStyle}>Adherencia</th>
            <th style={thStyle}>Estado</th>
            <th style={thStyle}>Alertas Abiertas</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const adherence = row.adherencePercent ?? 0;
            // Backend devuelve 0–100, pero si algún día se cambia a 0–1, esto lo absorbe:
            const normalized =
              adherence <= 1 && adherence > 0 ? adherence * 100 : adherence;

            const adherenceColor =
              normalized < 70
                ? "#dc2626"
                : normalized >= 90
                ? "#059669"
                : "#4b5563";

            return (
              <tr
                key={row.patientId}
                style={{
                  transition: "background-color 0.2s",
                  cursor: onRowClick ? "pointer" : "default",
                }}
                onClick={() =>
                  onRowClick && row.patientId && onRowClick(row.patientId)
                }
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#f3f4f6")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "white")
                }
              >
                <td style={tdStyle}>{row.fullName || "-"}</td>
                <td style={tdStyle}>{row.documentNumber || "-"}</td>
                <td style={tdStyle}>
                  {row.lastGlucoseValue !== null ? (
                    <>
                      <strong style={{ color: "#1f2937" }}>
                        {row.lastGlucoseValue} {row.lastGlucoseUnit}
                      </strong>
                      <br />
                      <span
                        style={{
                          fontSize: "var(--font-size-xs)", // antes 0.8rem
                          color: "#6b7280",
                        }}
                      >
                        {formatDateTime(row.lastGlucoseAt as any)}
                      </span>
                    </>
                  ) : (
                    <span style={{ color: "#9ca3af" }}>-</span>
                  )}
                </td>
                <td style={tdStyle}>
                  <span
                    style={{
                      fontWeight: 600,
                      color: adherenceColor,
                      fontSize: "var(--font-size-sm)",
                    }}
                  >
                    {formatPercent(normalized)}
                  </span>
                </td>
                <td style={tdStyle}>
                  <StatusBadge label={row.statusLabel} />
                </td>
                <td style={tdStyle}>
                  <span
                    style={{
                      fontWeight: 600,
                      color: row.openAlerts > 0 ? "#b30000" : "#4b5563",
                      fontSize: "var(--font-size-sm)",
                    }}
                  >
                    {row.openAlerts}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>

        {/* ---- Fila de resumen ---- */}
        <tfoot>
          <tr>
            <td style={tfootCellStyle}>Resumen</td>
            <td style={tfootCellStyle}>{totalPatients} pacientes</td>
            <td style={tfootCellStyle}></td>
            <td style={tfootCellStyle}>
              {avgAdherence !== null ? `${avgAdherence}% promedio` : "-"}
            </td>
            <td style={tfootCellStyle}></td>
            <td style={tfootCellStyle}>{totalAlerts} alertas abiertas</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default DashboardFollowupTable;
