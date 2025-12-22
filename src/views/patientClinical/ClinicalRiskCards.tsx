// integrad-dashboard/src/views/patientClinical/ClinicalRiskCards.tsx

import type { ClinicalRiskSummary } from "../../api/patientSummary";

type RiskLevel = "low" | "medium" | "high" | undefined;

interface ClinicalRiskCardsProps {
  risk: ClinicalRiskSummary | null;
}

function riskLabel(level?: "low" | "medium" | "high") {
  switch (level) {
    case "low":
      return { label: "Bajo", color: "#16a34a", bg: "#dcfce7" };
    case "medium":
      return { label: "Moderado", color: "#92400e", bg: "#fef3c7" };
    case "high":
      return { label: "Alto", color: "#b91c1c", bg: "#fee2e2" };
    default:
      return { label: "Sin dato", color: "#6b7280", bg: "#f3f4f6" };
  }
}

function RiskCard({
  title,
  level,
  helper,
}: {
  title: string;
  level?: RiskLevel;
  helper?: string;
}) {
  const info = riskLabel(level);
  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: 14,
        padding: 12,
        boxShadow: "0 4px 10px rgba(15,23,42,0.06)",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        borderTop: `3px solid ${info.color}`,
      }}
    >
      <div style={{ fontSize: "0.9rem", color: "#111827", fontWeight: 600 }}>
        {title}
      </div>

      <span
        style={{
          alignSelf: "flex-start",
          padding: "3px 12px",
          borderRadius: 999,
          fontSize: "0.78rem",
          fontWeight: 700,
          color: info.color,
          backgroundColor: info.bg,
        }}
      >
        {info.label}
      </span>

      {helper && (
        <div style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: 2 }}>
          {helper}
        </div>
      )}
    </div>
  );
}

export default function ClinicalRiskCards({ risk }: ClinicalRiskCardsProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
        gap: 12,
        marginBottom: 16,
      }}
    >
      <RiskCard title="Riesgo de retinopatía" level={risk?.retinopathyRisk} />
      <RiskCard title="Riesgo renal" level={risk?.renalRisk} />
      <RiskCard title="Riesgo macrovascular" level={risk?.macrovascularRisk} />
      <RiskCard title="Riesgo neuropático" level={risk?.neuropathyRisk} />
    </div>
  );
}
