/* integrad-dashboard/src/components/StatusChip.tsx */

import React from "react";
import "./StatusChip.css";

type StatusType = "success" | "warning" | "error" | "neutral";

interface StatusChipProps {
  label: string;
  type?: StatusType;
}

/**
 * Detecta el color correcto según el texto del label
 */
const inferTypeFromLabel = (label: string): StatusType => {
  const normalized = label.toLowerCase();

  if (normalized.includes("estable") || normalized.includes("controlado")) {
    return "success";
  }

  if (
    normalized.includes("revisión") ||
    normalized.includes("revision") ||
    normalized.includes("en estudio") ||
    normalized.includes("pendiente")
  ) {
    return "warning";
  }

  if (
    normalized.includes("alerta") ||
    normalized.includes("no control") ||
    normalized.includes("crítico") ||
    normalized.includes("critico") ||
    normalized.includes("descompens")
  ) {
    return "error";
  }

  return "neutral";
};

const StatusChip: React.FC<StatusChipProps> = ({ label, type }) => {
  const finalType: StatusType = type ?? inferTypeFromLabel(label);

  return (
    <span className={`status-chip ${finalType}`}>
      <span className="status-chip-icon">
        {finalType === "success" && "✓"}
        {finalType === "warning" && "!"}
        {finalType === "error" && "!"}
        {finalType === "neutral" && "•"}
      </span>
      <span className="status-chip-label">{label}</span>
    </span>
  );
};

export default StatusChip;
