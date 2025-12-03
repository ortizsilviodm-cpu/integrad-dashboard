/* integrad-dashboard/src/components/KpiCard.tsx */

import React from "react";
import "./KpiCard.css";

// Íconos reales
import { Activity, Users, AlertTriangle, Droplet } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string;
  description?: string;
  color?: "blue" | "purple" | "green" | "red";
}

// Mapeo de íconos por color
const IconMap = {
  green: Activity,
  blue: Users,
  red: AlertTriangle,
  purple: Droplet,
};

const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  description,
  color = "blue",
}) => {
  const Icon = IconMap[color];

  return (
    <div className={`kpi-card kpi-${color}`}>
      {/* Ícono grande */}
      <div className="kpi-header">
        <Icon className="kpi-icon-svg" />
      </div>

      {/* Valor */}
      <div className="kpi-value">{value}</div>

      {/* Textos */}
      <div className="kpi-text-group">
        <div className="kpi-title">{title}</div>
        {description && <div className="kpi-description">{description}</div>}
      </div>
    </div>
  );
};

export default KpiCard;
