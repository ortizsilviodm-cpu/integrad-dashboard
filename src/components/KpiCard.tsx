/* integrad-dashboard\src\components\KpiCard.tsx */

//import React from "react";
import "./KpiCard.css";

interface KpiCardProps {
  title: string;
  value: string;
  description?: string;
  color?: "blue" | "purple" | "green" | "red";
}

const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  description,
  color = "blue",
}) => {
  return (
    <div className={`kpi-card kpi-${color}`}>
      <div className="kpi-title">{title}</div>
      <div className="kpi-value">{value}</div>
      {description && <div className="kpi-description">{description}</div>}
    </div>
  );
};

export default KpiCard;
