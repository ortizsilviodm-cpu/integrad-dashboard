import type { CaseloadOperationalCaseSummary } from "../../types/caseload.types";
import { buildOperationalCaseStatusLabel } from "../../logic/caseload.logic";

type OperationalNarrativeProps = {
  operationalCase: CaseloadOperationalCaseSummary;
  patientName: string;
};

const severityColors: Record<string, { bg: string; border: string; text: string }> = {
  CRITICAL: { bg: "#fef2f2", border: "#fecaca", text: "#991b1b" },
  HIGH: { bg: "#fff7ed", border: "#fed7aa", text: "#9a3412" },
  MEDIUM: { bg: "#fffbeb", border: "#fde68a", text: "#92400e" },
  LOW: { bg: "#f0fdf4", border: "#bbf7d0", text: "#166534" },
};

const statusDotColors: Record<string, string> = {
  OPEN: "#ef4444",
  IN_PROGRESS: "#f59e0b",
  STABILIZED: "#3b82f6",
  RESOLVED: "#10b981",
  REOPENED: "#8b5cf6",
};

export default function OperationalNarrative({
  operationalCase,
  patientName,
}: OperationalNarrativeProps) {
  const colors = severityColors[operationalCase.priority] ?? severityColors.MEDIUM;
  const dotColor = statusDotColors[operationalCase.status] ?? "#6b7280";

  return (
    <section
      style={{
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
      }}
    >
      {/* Encabezado: Paciente + Estado operacional */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 12,
          gap: 8,
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 700, color: colors.text }}>
          {patientName}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12,
            fontWeight: 600,
            color: colors.text,
            whiteSpace: "nowrap",
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: dotColor,
              display: "inline-block",
            }}
          />
          {buildOperationalCaseStatusLabel(operationalCase.status)}
        </div>
      </div>

      {/* Motivo */}
      <div
        style={{
          fontSize: 12,
          color: colors.text,
          opacity: 0.8,
          marginBottom: 6,
        }}
      >
        Motivo: {(() => {
          const m = operationalCase.operationalMotive;
          switch (m) {
            case "THERAPEUTIC_ABANDONMENT_RISK": return "Riesgo de abandono terapéutico";
            case "GLUCOSE_RISK": return "Riesgo glucémico elevado";
            case "NEEDS_EDUCATION": return "Necesita educación";
            case "CONTACT_DIFFICULTY": return "Dificultad de contacto";
            case "INTERDISCIPLINARY_INTERVENTION_REQUIRED": return "Requiere intervención interdisciplinaria";
            default: return "—";
          }
        })()}
      </div>

      {/* Resumen narrativo */}
      {operationalCase.contextualSummary && (
        <div
          style={{
            fontSize: 13,
            color: "#1e293b",
            lineHeight: 1.6,
            marginBottom: 8,
            padding: 10,
            background: "rgba(255,255,255,0.5)",
            borderRadius: 10,
          }}
        >
          {operationalCase.contextualSummary}
        </div>
      )}

      {/* Prioridad + Reaperturas */}
      <div
        style={{
          display: "flex",
          gap: 16,
          fontSize: 12,
          color: colors.text,
          opacity: 0.75,
        }}
      >
        <span>
          Prioridad: <strong>{operationalCase.priority === "CRITICAL" ? "Crítica" : operationalCase.priority === "HIGH" ? "Alta" : operationalCase.priority === "MEDIUM" ? "Media" : "Baja"}</strong>
        </span>
        <span>
          Reaperturas: <strong>{operationalCase.reopenedCount}</strong>
        </span>
      </div>
    </section>
  );
}