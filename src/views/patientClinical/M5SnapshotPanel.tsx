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
      return "Prioridad caseload";
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
        label: "Prioridad caseload",
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

export default function M5SnapshotPanel({
  snapshot,
  loading,
  error,
}: {
  snapshot: PatientRiskSnapshot | null;
  loading: boolean;
  error: string | null;
}) {
  const badge = riskLevelLabel(snapshot?.riskLevel);

  const activeFlags = useMemo(() => {
    const f = snapshot?.flags ?? {};
    return Object.entries(f)
      .filter(([, v]) => Boolean(v))
      .map(([k]) => k);
  }, [snapshot]);

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
            Snapshot calculado para priorizar seguimiento (clínico, adherencia y
            operativo).
          </p>
        </div>

        <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>
          {loading
            ? "Cargando…"
            : snapshot?.generatedAt
            ? `Actualizado: ${formatIsoDateTime(snapshot.generatedAt)}`
            : "Sin snapshot"}
        </span>
      </div>

      {error && <p style={{ color: "#b91c1c", fontSize: "0.85rem" }}>{error}</p>}

      {!loading && !error && !snapshot && (
        <p style={{ color: "#6b7280", fontSize: "0.85rem" }}>
          Aún no hay snapshot M5 disponible para este paciente.
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
          {/* Columna izquierda */}
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

          {/* Columna derecha */}
          <div
