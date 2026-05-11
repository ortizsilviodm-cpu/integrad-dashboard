import type { CaseloadOperationalCaseSummary } from "../../types/caseload.types";
import { buildOwnershipAndNextAction } from "../../logic/caseload.logic";

type OperationalActionSummaryProps = {
  operationalCase: CaseloadOperationalCaseSummary | null;
  managedByName: string | null;
  priorityLevel: "P1" | "P2" | "P3" | "P4";
  managementStatus: "AVAILABLE" | "IN_PROGRESS";
};

const priorityColors: Record<string, { bg: string; text: string; border: string }> = {
  critical: { bg: "#fef2f2", text: "#991b1b", border: "#fecaca" },
  warning: { bg: "#fffbeb", text: "#92400e", border: "#fde68a" },
  info: { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" },
  neutral: { bg: "#f9fafb", text: "#374151", border: "#e5e7eb" },
};

const statusBadgeStyle = (color: string): React.CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "4px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 600,
  background: color + "20",
  color: color,
  border: `1px solid ${color}40`,
});

export default function OperationalActionSummary({
  operationalCase,
  managedByName,
  priorityLevel,
  managementStatus,
}: OperationalActionSummaryProps) {
  const info = buildOwnershipAndNextAction(
    operationalCase ?? undefined,
    managedByName,
    priorityLevel,
    managementStatus,
  );

  const actionColors = priorityColors[info.nextActionPriority] ?? priorityColors.neutral;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: 12,
        marginBottom: 16,
      }}
    >
      {/* Responsable / Ownership */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 14,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: "#94a3b8",
            marginBottom: 8,
          }}
        >
          Responsable
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>
          {info.responsibleName || "Sin asignar"}
        </div>
        <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
          {info.responsibleRole || "Pendiente de asignación"}
        </div>
        <div style={{ marginTop: 8, ...statusBadgeStyle(info.statusColor) }}>
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: info.statusColor,
            }}
          />
          {info.statusText}
        </div>
      </div>

      {/* Próxima acción */}
      <div
        style={{
          background: actionColors.bg,
          border: `1px solid ${actionColors.border}`,
          borderRadius: 12,
          padding: 14,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: actionColors.text,
            marginBottom: 8,
          }}
        >
          Próxima acción
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: actionColors.text, lineHeight: 1.5 }}>
          {info.nextActionText}
        </div>
      </div>

      {/* Pendiente (si hay) */}
      {info.pendingItemText && (
        <div
          style={{
            background: "#fefce8",
            border: "1px solid #fef08a",
            borderRadius: 12,
            padding: 14,
            gridColumn: "1 / -1",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "#a16207",
              marginBottom: 6,
            }}
          >
            Pendiente operativo
          </div>
          <div style={{ fontSize: 13, color: "#713f12", lineHeight: 1.5 }}>
            {info.pendingItemText}
          </div>
        </div>
      )}
    </div>
  );
}