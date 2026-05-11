import type { CaseloadOperationalCaseSummary } from "../../types/caseload.types";
import { buildPatientSituationSummary } from "../../logic/caseload.logic";

type OperationalNarrativeProps = {
  operationalCase: CaseloadOperationalCaseSummary;
  patientName: string;
  managedByName: string | null;
};

const severityColors: Record<string, { bg: string; border: string; text: string; softText: string }> = {
  CRITICAL: { bg: "#fef2f2", border: "#f8a8a8", text: "#991b1b", softText: "#b91c1c" },
  HIGH: { bg: "#fff7ed", border: "#fdba74", text: "#9a3412", softText: "#c2410c" },
  MEDIUM: { bg: "#fffbeb", border: "#fde68a", text: "#92400e", softText: "#a16207" },
  LOW: { bg: "#f0fdf4", border: "#86efac", text: "#166534", softText: "#15803d" },
};

const statusConfig: Record<string, { label: string; dot: string; badgeBg: string; badgeText: string }> = {
  OPEN: { label: "Recién creado", dot: "#ef4444", badgeBg: "#fee2e2", badgeText: "#991b1b" },
  IN_PROGRESS: { label: "En seguimiento", dot: "#f59e0b", badgeBg: "#fef3c7", badgeText: "#92400e" },
  STABILIZED: { label: "Estabilizado", dot: "#3b82f6", badgeBg: "#dbeafe", badgeText: "#1d4ed8" },
  RESOLVED: { label: "Resuelto", dot: "#10b981", badgeBg: "#d1fae5", badgeText: "#065f46" },
  REOPENED: { label: "Reabierto", dot: "#8b5cf6", badgeBg: "#ede9fe", badgeText: "#6d28d9" },
};

const priorityLabels: Record<string, string> = {
  CRITICAL: "Crítica",
  HIGH: "Alta",
  MEDIUM: "Media",
  LOW: "Baja",
};

export default function OperationalNarrative({
  operationalCase,
  patientName,
  managedByName,
}: OperationalNarrativeProps) {
  const colors = severityColors[operationalCase.priority] ?? severityColors.MEDIUM;
  const statusInfo = statusConfig[operationalCase.status] ?? statusConfig.OPEN;

  return (
    <section
      style={{
        background: colors.bg,
        border: `2px solid ${colors.border}`,
        borderRadius: 20,
        padding: 24,
        marginBottom: 20,
      }}
    >
      {/* Fila superior: nombre + estado + owner */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 16,
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        {/* Nombre del paciente */}
        <div style={{ fontSize: 20, fontWeight: 800, color: colors.text }}>
          {patientName}
        </div>

        {/* Estado operativo */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: statusInfo.badgeBg,
              color: statusInfo.badgeText,
              padding: "5px 12px",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: statusInfo.dot,
                display: "inline-block",
              }}
            />
            {statusInfo.label}
          </span>
        </div>
      </div>

      {/* Situación resumida */}
      <div
        style={{
          fontSize: 15,
          color: "#1e293b",
          lineHeight: 1.6,
          marginBottom: 14,
          padding: 14,
          background: "rgba(255,255,255,0.6)",
          borderRadius: 12,
          border: "1px solid rgba(0,0,0,0.06)",
          fontWeight: 500,
        }}
      >
        {operationalCase.contextualSummary || buildPatientSituationSummary({ operationalCase } as any)}
      </div>

      {/* Motivo */}
      {operationalCase.operationalMotive && (
        <div
          style={{
            fontSize: 13,
            color: colors.softText,
            marginBottom: 14,
            paddingLeft: 4,
          }}
        >
          <strong>Motivo:</strong>{" "}
          {(() => {
            const m = operationalCase.operationalMotive;
            switch (m) {
              case "THERAPEUTIC_ABANDONMENT_RISK": return "Riesgo de abandono terapéutico";
              case "GLUCOSE_RISK": return "Riesgo glucémico elevado";
              case "NEEDS_EDUCATION": return "Necesita educación";
              case "CONTACT_DIFFICULTY": return "Dificultad de contacto";
              case "INTERDISCIPLINARY_INTERVENTION_REQUIRED": return "Requiere intervención interdisciplinaria";
              default: return m;
            }
          })()}
        </div>
      )}

      {/* Barra inferior: prioridad + responsable + reaperturas */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          paddingTop: 12,
          borderTop: `1px solid ${colors.border}`,
        }}
      >
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <span
            style={{
              fontSize: 12,
              color: colors.softText,
              fontWeight: 600,
            }}
          >
            Prioridad:{" "}
            <span style={{ fontWeight: 800 }}>
              {priorityLabels[operationalCase.priority] || operationalCase.priority}
            </span>
          </span>
          <span style={{ fontSize: 12, color: colors.softText, fontWeight: 600 }}>
            Reaperturas: <span style={{ fontWeight: 800 }}>{operationalCase.reopenedCount}</span>
          </span>
        </div>
        <div
          style={{
            fontSize: 12,
            color: "#6b7280",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: managedByName ? "#10b981" : "#9ca3af",
              display: "inline-block",
            }}
          />
          {managedByName ? (
            <>Responsable: <strong>{managedByName}</strong></>
          ) : (
            "Sin responsable asignado"
          )}
        </div>
      </div>
    </section>
  );
}