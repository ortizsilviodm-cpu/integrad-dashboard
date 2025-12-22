// integrad-dashboard/src/utils/patientClinical/sparkline.tsx

/**
 * Punto para minigráfico de tendencia (sparkline).
 */
export interface SparklinePoint {
  timestamp: string;
  value: number;
}

export interface MiniTrendSparklineProps {
  data: SparklinePoint[];
  width?: number;
  height?: number;
}

/**
 * Mini gráfico de línea muy simple para mostrar tendencia.
 * Sin librerías externas, solo SVG.
 */
export function MiniTrendSparkline({
  data,
  width = 120,
  height = 40,
}: MiniTrendSparklineProps) {
  if (!data || data.length === 0) {
    return <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>Sin datos</div>;
  }

  if (data.length === 1) {
    return (
      <div
        style={{
          fontSize: "1rem",
          lineHeight: 1,
          color: "#6b7280",
        }}
      >
        •
      </div>
    );
  }

  const padding = 4;
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;

  const values = data.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = innerWidth / Math.max(1, data.length - 1);

  const points = data.map((p, index) => {
    const x = padding + stepX * index;
    const normalized = (p.value - min) / range;
    const y = padding + innerHeight - normalized * innerHeight;
    return `${x},${y}`;
  });

  const pathPoints = points.join(" ");

  const last = points[points.length - 1];
  const [lastX, lastY] = last.split(",").map((n) => Number(n));

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      style={{ display: "block", color: "#0f172a" }}
    >
      <polyline
        points={pathPoints}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lastX} cy={lastY} r={2} fill="currentColor" />
    </svg>
  );
}
