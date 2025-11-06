// integrad-dashboard/src/components/AlertsDonutChart.tsx

import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export type AlertSlice = {
  name: string;
  value: number;
};

// Datos mock por defecto; luego se pueden reemplazar desde el contenedor
const DEFAULT_DATA: AlertSlice[] = [
  { name: "Hipo", value: 3 },
  { name: "Hiper", value: 4 },
];

const COLORS = ["var(--color-accent)", "var(--color-secondary)"];

type AlertsDonutChartProps = {
  /**
   * Distribución de alertas (ej: Hipo / Hiper).
   * Si no se envía, usa DEFAULT_DATA.
   */
  data?: AlertSlice[];
};

const AlertsDonutChart: React.FC<AlertsDonutChartProps> = ({ data }) => {
  const chartData = data && data.length > 0 ? data : DEFAULT_DATA;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          innerRadius={60}
          outerRadius={80}
          paddingAngle={4}
        >
          {chartData.map((entry, index) => (
            <Cell
              key={entry.name ?? `cell-${index}`}
              fill={COLORS[index % COLORS.length]}
            />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number, name: string) => [
            `${value} alertas`,
            name,
          ]}
        />
        <Legend
          verticalAlign="bottom"
          height={36}
          formatter={(value) => (
            <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
              {value}
            </span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default AlertsDonutChart;
