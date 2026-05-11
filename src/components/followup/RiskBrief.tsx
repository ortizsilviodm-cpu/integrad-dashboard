import type {
  RiskStratificationPriorityHint,
  RiskStratificationV1,
} from "../../api/followup";

type RiskBriefProps = {
  riskStratification: RiskStratificationV1;
};

/**
 * Resumen breve de riesgo para el Intervention Panel.
 * Muestra riesgo base, riesgo dinámico y prioridad sugerida de forma concisa.
 */
export function RiskBrief({ riskStratification }: RiskBriefProps) {
  // Map risk bands to colors
  const riskColors: Record<string, { bg: string; text: string; border: string }> = {
    CRITICAL: { bg: "#fef2f2", text: "#991b1b", border: "#fecaca" },
    HIGH: { bg: "#fff7ed", text: "#9a3412", border: "#fed7aa" },
    MEDIUM: { bg: "#fef3c7", text: "#92400e", border: "#fde68a" },
    LOW: { bg: "#f0fdf4", text: "#166534", border: "#bbf7d0" },
  };

  const baselineColor =
    riskColors[riskStratification.baselineRiskBand.toUpperCase()] ?? riskColors.MEDIUM;
  const dynamicColor =
    riskColors[riskStratification.dynamicRiskBand.toUpperCase()] ?? riskColors.MEDIUM;

  const getRiskLabel = (band: string): string => {
    const labels: Record<string, string> = {
      CRITICAL: "Crítico",
      HIGH: "Alto",
      MEDIUM: "Medio",
      LOW: "Bajo",
      NONE: "Sin riesgo",
    };
    return labels[band.toUpperCase()] ?? band;
  };

  const getPriorityLabel = (hint: RiskStratificationPriorityHint): string => {
    const labels: Record<string, string> = {
      KEEP_CURRENT: "Mantener",
      PRIORITIZE_REVIEW: "Prioritario",
      ESCALATE_NOW: "Escalar ahora",
    };
    return labels[hint] ?? hint;
  };

  const isHighPriority =
    riskStratification.operationalPriorityHint === "PRIORITIZE_REVIEW" ||
    riskStratification.operationalPriorityHint === "ESCALATE_NOW";

  return (
    <div
      style={{
        background: "#fafafa",
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        border: "1px solid #e5e7eb",
      }}
    >
      {/* Header */}
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: "#6b7280",
          marginBottom: 12,
        }}
      >
        Estratificación de riesgo
      </div>

      {/* Risk bands - side by side */}
      <div
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 14,
          flexWrap: "wrap",
        }}
      >
        {/* Riesgo base */}
        <div
          style={{
            flex: 1,
            minWidth: 140,
            background: baselineColor.bg,
            border: `1px solid ${baselineColor.border}`,
            borderRadius: 10,
            padding: "10px 14px",
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: baselineColor.text,
              marginBottom: 4,
            }}
          >
            Riesgo base
          </div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: baselineColor.text,
            }}
          >
            {getRiskLabel(riskStratification.baselineRiskBand)}
          </div>
        </div>

        {/* Riesgo dinámico */}
        <div
          style={{
            flex: 1,
            minWidth: 140,
            background: dynamicColor.bg,
            border: `1px solid ${dynamicColor.border}`,
            borderRadius: 10,
            padding: "10px 14px",
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: dynamicColor.text,
              marginBottom: 4,
            }}
          >
            Riesgo dinámico
          </div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: dynamicColor.text,
            }}
          >
            {getRiskLabel(riskStratification.dynamicRiskBand)}
          </div>
        </div>
      </div>

      {/* Priority hint - simple pill */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          background: "#ffffff",
          border: "1px solid #d1d5db",
          borderRadius: 8,
          padding: "8px 12px",
          fontSize: 13,
        }}
      >
        <span style={{ fontWeight: 600, color: "#374151" }}>
          Prioridad sugerida:
        </span>
        <span
          style={{
            fontWeight: 700,
            color: isHighPriority ? "#991b1b" : "#374151",
          }}
        >
          {getPriorityLabel(riskStratification.operationalPriorityHint)}
        </span>
      </div>

      {/* Triggered rules - collapsible hint */}
      {riskStratification.triggeredRules.length > 0 && (
        <div
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: "1px solid #e5e7eb",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#6b7280",
              marginBottom: 6,
            }}
          >
            {riskStratification.triggeredRules.length} criterio
            {riskStratification.triggeredRules.length !== 1 ? "s" : ""} activado
            {riskStratification.triggeredRules.length !== 1 ? "s" : ""}
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
            }}
          >
            {riskStratification.triggeredRules.slice(0, 3).map((rule) => (
              <span
                key={rule.code}
                style={{
                  fontSize: 11,
                  background: "#f3f4f6",
                  color: "#4b5563",
                  padding: "4px 8px",
                  borderRadius: 6,
                }}
              >
                {rule.label}
              </span>
            ))}
            {riskStratification.triggeredRules.length > 3 && (
              <span
                style={{
                  fontSize: 11,
                  color: "#6b7280",
                }}
              >
                +{riskStratification.triggeredRules.length - 3} más
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default RiskBrief;