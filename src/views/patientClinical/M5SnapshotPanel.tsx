// integrad-dashboard/src/views/patientClinical/M5SnapshotPanel.tsx

import { useMemo } from "react";
import type { PatientRiskSnapshot } from "../../api/patients";
import { formatIsoDateTime } from "../../utils/patientClinical/formatters";
import M5SuggestedActionsPanel from "./M5SuggestedActionsPanel";

function riskLevelLabel(level?: PatientRiskSnapshot["riskLevel"]) {
  switch (level) {
    case "low":
      return { label: "Bajo", color: "#16a34a", bg: "#dcfce7" };
    case "medium":
      return { label: "Moderado", color: "#92400e", bg: "#fef3c7" };
    case "high":
      return { label: "Alto", color: "#b91c1c", bg: "#fee2e2" };
    case "critical":
      return { label: "Crítico", color: "#ffffff", bg: "#b91c1c" };
    default:
      return { label: "Sin dato", color: "#6b7280", bg: "#f3f4f6" };
  }
}

function formatFlagLabel(key: string): string {
  switch (key) {
    case "dataIncomplete":
      return "Datos incompletos";
    case "needsContact":
      return "Requiere contacto";
    case "needsClinicalReview":
      return "Revisión clínica";
    case "highPriorityCaseload":
      return "Prioridad de seguimiento";
    default:
      return key;
  }
}

function flagPillStyle(flagKey: string) {
  switch (flagKey) {
    case "needsContact":
      return {
        label: "Requiere contacto",
        bg: "#e0f2fe",
        color: "#0369a1",
        border: "1px solid rgba(3,105,161,0.25)",
      };
    case "dataIncomplete":
      return {
        label: "Datos incompletos",
        bg: "#fef3c7",
        color: "#92400e",
        border: "1px solid rgba(146,64,14,0.25)",
      };
    case "needsClinicalReview":
      return {
        label: "Revisión clínica",
        bg: "#fee2e2",
        color: "#b91c1c",
        border: "1px solid rgba(185,28,28,0.35)",
      };
    case "highPriorityCaseload":
      return {
        label: "Prioridad de seguimiento",
        bg: "#f3f4f6",
        color: "#111827",
        border: "1px solid #e5e7eb",
      };
    default:
      return {
        label: formatFlagLabel(flagKey),
        bg: "#f3f4f6",
        color: "#6b7280",
        border: "1px solid #e5e7eb",
      };
  }
}

function secondaryButtonStyle(isEnabled: boolean) {
  return {
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: "8px 10px",
    cursor: isEnabled ? "pointer" : "not-allowed",
    background: isEnabled ? "#ffffff" : "#f9fafb",
    color: isEnabled ? "#111827" : "#9ca3af",
    fontSize: "0.8rem",
    fontWeight: 700 as const,
  };
}

function signalChipStyle(isPresent: boolean) {
  if (isPresent) {
    return {
      bg: "#dcfce7",
      color: "#166534",
      border: "1px solid rgba(22,101,52,0.25)",
    };
  }
  return {
    bg: "#f3f4f6",
    color: "#6b7280",
    border: "1px solid #e5e7eb",
  };
}

function extractSignalAvailability(snapshot: PatientRiskSnapshot | null) {
  const rawSignals = (snapshot as unknown as { signals?: unknown } | null)?.signals;

  if (!rawSignals || typeof rawSignals !== "object") {
    return {
      hasReadings: false,
      hasDispenses: false,
      hasAlerts: false,
    };
  }

  const signals = rawSignals as {
    hasReadings?: unknown;
    hasDispenses?: unknown;
    hasAlerts?: unknown;
  };

  return {
    hasReadings: Boolean(signals.hasReadings),
    hasDispenses: Boolean(signals.hasDispenses),
    hasAlerts: Boolean(signals.hasAlerts),
  };
}

type M5SnapshotPanelProps = {
  snapshot: PatientRiskSnapshot | null;
  loading: boolean;
  error: string | null;
};

export default function M5SnapshotPanel({
  snapshot,
  loading,
  error,
}: M5SnapshotPanelProps) {
  const badge = riskLevelLabel(snapshot?.riskLevel);

  const activeFlags = useMemo(() => {
    const f = snapshot?.flags ?? {};
    return Object.entries(f)
      .filter(([, v]) => Boolean(v))
      .map(([k]) => k);
  }, [snapshot]);

  const { hasReadings, hasDispenses, hasAlerts } =
    extractSignalAvailability(snapshot);

  const isContactActionEnabled = true;
  const isRequestReadingsEnabled = true;
  const isClinicalReviewEnabled = true;
  const isMarkPriorityEnabled = true;

  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: 16,
        padding: 16,
        boxShadow: "0 4px 12px rgba(15,23,42,0.06)",
        marginBottom: 16,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <div>
          <h3
            style={{
              marginTop: 0,
              marginBottom: 2,
              fontSize: "1rem",
              fontWeight: 600,
              color: "#111827",
            }}
          >
            M5 — Riesgo predictivo (IA)
          </h3>
          <p style={{ margin: 0, fontSize: "0.8rem", color: "#6b7280" }}>
            Resumen calculado para priorizar el seguimiento clínico, de adherencia y
            operativo.
          </p>
        </div>

        <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>
          {loading
            ? "Cargando…"
            : snapshot?.generatedAt
            ? `Actualizado: ${formatIsoDateTime(snapshot.generatedAt)}`
            : "Sin resumen"}
        </span>
      </div>

      {error && <p style={{ color: "#b91c1c", fontSize: "0.85rem" }}>{error}</p>}

      {!loading && !error && !snapshot && (
        <p style={{ color: "#6b7280", fontSize: "0.85rem" }}>
          Aún no hay un resumen M5 disponible para este paciente.
        </p>
      )}

      {!loading && !error && snapshot && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            marginTop: 10,
          }}
        >
          <div
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 14,
              padding: 12,
              background: "#f9fafb",
            }}
          >
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span
                style={{
                  alignSelf: "flex-start",
                  padding: "4px 12px",
                  borderRadius: 999,
                  fontSize: "0.78rem",
                  fontWeight: 800,
                  color: badge.color,
                  backgroundColor: badge.bg,
                  textTransform: "uppercase",
                }}
              >
                {badge.label}
              </span>
              <div style={{ fontSize: "0.9rem", color: "#111827" }}>
                <strong>Score:</strong> {snapshot.riskScore}
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: 10,
                marginTop: 10,
                fontSize: "0.85rem",
              }}
            >
              {[
                { label: "Clínico", value: snapshot.clinicalRisk },
                { label: "Adherencia", value: snapshot.adherenceRisk },
                { label: "Operativo", value: snapshot.operationalRisk },
              ].map((x) => (
                <div
                  key={x.label}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: 12,
                    padding: 10,
                  }}
                >
                  <div style={{ color: "#6b7280", fontSize: "0.75rem" }}>
                    {x.label}
                  </div>
                  <div style={{ fontWeight: 800, fontSize: "1.05rem" }}>
                    {x.value}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 10, fontSize: "0.8rem" }}>
              <div style={{ color: "#6b7280", marginBottom: 6 }}>
                Señales detectadas
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, color: "#0f172a" }}>
                {snapshot.reasons.slice(0, 5).map((r, i) => (
                  <li key={`${r}-${i}`}>{r}</li>
                ))}
              </ul>
            </div>
          </div>

          <div
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 14,
              padding: 12,
              background: "#ffffff",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 10,
                alignItems: "baseline",
                marginBottom: 8,
              }}
            >
              <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "#111827" }}>
                Calidad del resumen de seguimiento
              </div>
              <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                Ventana: {snapshot.windowDays} días · Modelo: {snapshot.modelVersion}
              </div>
            </div>

            <div style={{ fontSize: "0.8rem", color: "#6b7280", marginBottom: 6 }}>
              Señales disponibles
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
              {[
                { label: "Lecturas", present: hasReadings },
                { label: "Dispensas", present: hasDispenses },
                { label: "Alertas", present: hasAlerts },
              ].map((s) => {
                const style = signalChipStyle(s.present);
                return (
                  <div
                    key={s.label}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 999,
                      fontSize: "0.78rem",
                      background: style.bg,
                      color: style.color,
                      border: style.border,
                      fontWeight: 700,
                    }}
                  >
                    {s.label}: {s.present ? "Sí" : "No"}
                  </div>
                );
              })}
            </div>

            <div style={{ fontSize: "0.8rem", color: "#6b7280", marginBottom: 6 }}>
              Señales operativas
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
              {activeFlags.length === 0 ? (
                <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                  Sin señales operativas activas.
                </div>
              ) : (
                activeFlags.map((k) => {
                  const p = flagPillStyle(k);
                  return (
                    <div
                      key={k}
                      style={{
                        padding: "4px 10px",
                        borderRadius: 999,
                        fontSize: "0.78rem",
                        background: p.bg,
                        color: p.color,
                        border: p.border,
                        fontWeight: 700,
                      }}
                    >
                      {p.label}
                    </div>
                  );
                })
              )}
            </div>

            <div style={{ fontWeight: 800, fontSize: "0.9rem", color: "#111827" }}>
              Acciones operativas
            </div>
            <div style={{ fontSize: "0.78rem", color: "#6b7280", marginTop: 4 }}>
              Botones de apoyo para el equipo. Por el momento no ejecutan acciones reales;
              se habilitarán cuando esté listo el sistema de tareas.
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
                marginTop: 10,
              }}
            >
              <button style={secondaryButtonStyle(isContactActionEnabled)}>
                Crear tarea de contacto
              </button>
              <button style={secondaryButtonStyle(isRequestReadingsEnabled)}>
                Solicitar lecturas
              </button>
              <button style={secondaryButtonStyle(isClinicalReviewEnabled)}>
                Derivar a revisión
              </button>
              <button style={secondaryButtonStyle(isMarkPriorityEnabled)}>
                Marcar prioritario
              </button>
            </div>

            <div style={{ marginTop: 12 }}>
              <M5SuggestedActionsPanel snapshot={snapshot} />
            </div>

            <div
              style={{
                marginTop: 10,
                fontSize: "0.78rem",
                color: "#6b7280",
                borderTop: "1px solid #e5e7eb",
                paddingTop: 10,
              }}
            >
              Estado operativo para seguimiento
            </div>
          </div>
        </div>
      )}
    </div>
  );
}