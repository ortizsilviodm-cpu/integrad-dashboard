/*  integrad-dashboard\src\components\followup\GlucoseChartPlaceholder.tsx  */

import type { CSSProperties } from "react";

type Props = {
  series: number[];
};

const containerStyle: CSSProperties = {
  height: 140,
  borderRadius: 12,
  background: "#f8fafc",
  border: "1px solid #e5e7eb",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 12,
  color: "#6b7280",
  fontWeight: 500,
};

export function GlucoseChartPlaceholder({ series }: Props) {
  if (!series || series.length === 0) {
    return <div style={containerStyle}>Sin datos de glucosa</div>;
  }

  return (
    <div style={containerStyle}>
      [ Gráfico simulado 72hs ]
    </div>
  );
}