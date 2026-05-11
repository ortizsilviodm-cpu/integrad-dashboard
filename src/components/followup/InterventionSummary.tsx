import type { FollowupEventRow } from "../../api/followup";
import {
  formatCategoryLabel,
  getOperationalPriorityMessage,
  getSeverityLabel,
} from "../../logic/patientContext.logic";

type InterventionSummaryProps = {
  event: FollowupEventRow;
  managedByName?: string | null;
};

/**
 * Resumen operacional simplificado para el Intervention Panel.
 * Muestra: situación actual, riesgo, próxima acción, ownership.
 */
export function InterventionSummary({
  event,
  managedByName,
}: InterventionSummaryProps) {
  // Determinar estado operativo humano
  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    OPEN: { label: "Pendiente de intervención", color: "#ef4444", bg: "#fef2f2" },
    IN_PROGRESS: {
      label: managedByName ? `En gestión por ${managedByName}` : "En gestión",
      color: "#f59e0b",
      bg: "#fffbeb",
    },
    CLOSED: { label: "Caso controlado", color: "#10b981", bg: "#f0fdf4" },
    ESCALATED: { label: "Escalado", color: "#8b5cf6", bg: "#f5f3ff" },
  };

  const status = statusConfig[event.status] ?? statusConfig.OPEN;

  // Próxima acción basada en severidad y categoría
  const nextAction = getOperationalPriorityMessage({
    severity: event.severity,
    category: event.category,
    status: event.status,
    adherenceStatus: event.adherenceContext?.status,
  });

  // Severidad label
  const severityLabel = getSeverityLabel(event.severity);

  // Severidad color
  const severityColors: Record<string, { bg: string; text: string }> = {
    CRITICAL: { bg: "#fef2f2", text: "#991b1b" },
    HIGH: { bg: "#fff7ed", text: "#9a3412" },
    MEDIUM: { bg: "#fef3c7", text: "#92400e" },
    LOW: { bg: "#f0fdf4", text: "#166534" },
  };
  const severityStyle = severityColors[event.severity.toUpperCase()] ?? severityColors.MEDIUM;

  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        border: "1px solid #e5e7eb",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      }}
    >
      {/* Estado operativo - dominante */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 16,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "#94a3b8",
              marginBottom: 4,
            }}
          >
            Estado operativo
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: status.color,
              }}
            />
            <span
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "#1e293b",
              }}
            >
              {status.label}
            </span>
          </div>
        </div>

        {/* Severidad */}
        <div
          style={{
            background: severityStyle.bg,
            color: severityStyle.text,
            padding: "6px 12px",
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          Severidad: {severityLabel}
        </div>
      </div>

      {/* Qué está pasando - descripción humana */}
      <div
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: "#1e293b",
          lineHeight: 1.5,
          marginBottom: 12,
          padding: 12,
          background: "#f8fafc",
          borderRadius: 10,
        }}
      >
        {event.clinicalContext?.description ||
          `Caso de ${formatCategoryLabel(event.category).toLowerCase()}`}
      </div>

      {/* Próxima acción - operacional */}
      <div
        style={{
          background: "#fff7ed",
          border: "1px solid #fed7aa",
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
            color: "#9a3412",
            marginBottom: 6,
          }}
        >
          Qué hacer ahora
        </div>
        <div
          style={{
            fontSize: 14,
            color: "#7c2d12",
            lineHeight: 1.5,
          }}
        >
          {nextAction}
        </div>
      </div>

      {/* Información adicional - compacta */}
      <div
        style={{
          display: "flex",
          gap: 16,
          marginTop: 14,
          flexWrap: "wrap",
          fontSize: 12,
          color: "#64748b",
        }}
      >
        <div>
          <strong>Tipo:</strong> {formatCategoryLabel(event.category)}
        </div>
        {event.adherenceContext?.status && (
          <div>
            <strong>Adherencia:</strong>{" "}
            {event.adherenceContext.status === "CRITICAL"
              ? "Sin medicación"
              : event.adherenceContext.status === "WARNING"
                ? "Próximo a quedarse"
                : "OK"}
          </div>
        )}
      </div>
    </div>
  );
}

export default InterventionSummary;