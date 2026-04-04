/* integrad-dashboard/src/views/patientClinical/PatientAlertsCard.tsx */

import { useMemo, useState } from "react";
import { Card } from "../../components/ui/Card";
import { UI } from "../../theme/ui";
import type { PatientAlertRow } from "../../api/alerts";

export type PatientAlertsCardProps = {
  alerts: PatientAlertRow[];
  alertsLoading: boolean;
  alertsError: string | null;
};

function renderAlertSeverity(
  label: string,
  severityCode?: PatientAlertRow["severityCode"]
) {
  let bg = "#e5e7eb";
  let color = "#374151";
  let border: string | undefined;

  switch (severityCode) {
    case "low":
      bg = "#e0f2fe";
      color = "#0369a1";
      break;
    case "medium":
      bg = "#fef3c7";
      color = "#92400e";
      break;
    case "high":
      bg = "#fee2e2";
      color = "#b91c1c";
      border = "1px solid rgba(185,28,28,0.4)";
      break;
    case "critical":
      bg = "#b91c1c";
      color = "#ffffff";
      border = "1px solid #7f1d1d";
      break;
    default: {
      const t = label.toLowerCase();
      if (t.includes("baja")) {
        bg = "#e0f2fe";
        color = "#0369a1";
      } else if (t.includes("moderada")) {
        bg = "#fef3c7";
        color = "#92400e";
      } else if (t.includes("alta")) {
        bg = "#fee2e2";
        color = "#b91c1c";
      } else if (t.includes("crítica") || t.includes("critica")) {
        bg = "#b91c1c";
        color = "#ffffff";
      }
    }
  }

  return (
    <span
      style={{
        padding: "2px 8px",
        borderRadius: 999,
        fontSize: "0.72rem",
        fontWeight: 700,
        backgroundColor: bg,
        color,
        textTransform: "uppercase",
        border,
      }}
    >
      {label}
    </span>
  );
}

export default function PatientAlertsCard({
  alerts,
  alertsLoading,
  alertsError,
}: PatientAlertsCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const alertsSummary = useMemo(() => {
    const summaryObj = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      total: alerts.length,
    };

    for (const a of alerts) {
      switch (a.severityCode) {
        case "critical":
          summaryObj.critical += 1;
          break;
        case "high":
          summaryObj.high += 1;
          break;
        case "medium":
          summaryObj.medium += 1;
          break;
        case "low":
          summaryObj.low += 1;
          break;
        default:
          break;
      }
    }

    return summaryObj;
  }, [alerts]);

  const summaryLabel = alertsLoading
    ? "Cargando alertas…"
    : alerts.length === 0
      ? "Sin alertas activas"
      : `${alerts.length} alerta(s) activa(s)`;

  return (
    <Card style={{ marginBottom: 16 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          marginBottom: isExpanded ? 8 : 0,
        }}
      >
        <h3 style={UI.cardTitleH3}>Alertas clínicas activas</h3>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
            justifyContent: "flex-end",
          }}
        >
          <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>
            {summaryLabel}
          </span>

          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            style={{
              border: "1px solid #d1d5db",
              borderRadius: 999,
              padding: "6px 12px",
              cursor: "pointer",
              background: "#ffffff",
              color: "#374151",
              fontSize: "0.82rem",
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            {isExpanded ? "Ocultar" : "Mostrar"}
          </button>
        </div>
      </div>

      {isExpanded && alertsError && (
        <p style={{ color: UI.errorText.color, fontSize: "0.8rem" }}>
          {alertsError}
        </p>
      )}

      {isExpanded && !alertsLoading && !alertsError && alerts.length > 0 && (
        <>
          <div
            style={{
              display: "flex",
              gap: 12,
              marginBottom: 10,
              fontSize: "0.78rem",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                padding: "6px 10px",
                borderRadius: 10,
                background: "#fee2e2",
                color: "#7f1d1d",
                fontWeight: 600,
                minWidth: 90,
              }}
            >
              Críticas: {alertsSummary.critical}
            </div>

            <div
              style={{
                padding: "6px 10px",
                borderRadius: 10,
                background: "#fee2e2",
                color: "#b91c1c",
                fontWeight: 600,
                minWidth: 90,
              }}
            >
              Altas: {alertsSummary.high}
            </div>

            <div
              style={{
                padding: "6px 10px",
                borderRadius: 10,
                background: "#fef3c7",
                color: "#92400e",
                fontWeight: 500,
                minWidth: 110,
              }}
            >
              Moderadas: {alertsSummary.medium}
            </div>

            <div
              style={{
                padding: "6px 10px",
                borderRadius: 10,
                background: "#e0f2fe",
                color: "#0369a1",
                fontWeight: 500,
                minWidth: 90,
              }}
            >
              Bajas: {alertsSummary.low}
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={UI.table}>
              <thead>
                <tr style={UI.thRow}>
                  <th style={UI.td}>Tipo</th>
                  <th style={UI.td}>Severidad</th>
                  <th style={UI.td}>Título</th>
                  <th style={UI.td}>Detalle</th>
                  <th style={UI.td}>Detectada</th>
                </tr>
              </thead>

              <tbody>
                {alerts.map((a, idx) => (
                  <tr
                    key={a.id}
                    style={{
                      background: idx % 2 === 0 ? "#ffffff" : "#f9fafb",
                    }}
                  >
                    <td style={UI.td}>{a.kindLabel}</td>
                    <td style={UI.td}>
                      {renderAlertSeverity(a.severityLabel, a.severityCode)}
                    </td>
                    <td style={UI.td}>{a.title}</td>
                    <td style={UI.td}>{a.description ?? "—"}</td>
                    <td style={UI.td}>{a.detectedAtLabel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Card>
  );
}