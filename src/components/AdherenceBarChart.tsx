// integrad-dashboard/src/components/AdherenceBarChart.tsx

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";

export type AdherencePoint = {
  month: string;
  adherence: number;
};

// Datos mock por defecto; se pueden sobrescribir vía props
const DEFAULT_DATA: AdherencePoint[] = [
  { month: "Ene", adherence: 72 },
  { month: "Feb", adherence: 78 },
  { month: "Mar", adherence: 81 },
  { month: "Abr", adherence: 79 },
  { month: "May", adherence: 84 },
  { month: "Jun", adherence: 83 },
];

type AdherenceBarChartProps = {
  /**
   * Serie de adherencia por mes.
   * Si no se envía, usa DEFAULT_DATA (mock).
   */
  data?: AdherencePoint[];
  /**
   * Meta de adherencia para la línea de referencia (ej: 80%).
   */
  target?: number;
};

const AdherenceBarChart: React.FC<AdherenceBarChartProps> = ({
  data = DEFAULT_DATA,
  target = 80,
}) => {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart
        data={data}
        margin={{ top: 8, right: 16, left: -24, bottom: 0 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke="rgba(148, 163, 184, 0.35)"
        />
        <XAxis
          dataKey="month"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fill: "var(--color-text-muted)" }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fill: "var(--color-text-muted)" }}
          unit="%"
        />
        <Tooltip
          cursor={{ fill: "rgba(148, 163, 184, 0.15)" }}
          formatter={(value: number) => [`${value}%`, "Adherencia"]}
          labelFormatter={(label) => `Mes: ${label}`}
        />
        {/* Línea de meta de adherencia */}
        <ReferenceLine
          y={target}
          stroke="var(--color-secondary)"
          strokeDasharray="3 3"
        />
        <Bar
          dataKey="adherence"
          fill="var(--color-primary)"
          radius={[8, 8, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default AdherenceBarChart;
