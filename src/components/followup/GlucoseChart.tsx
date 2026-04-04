/* integrad-dashboard/src/components/followup/GlucoseChart.tsx */

import type { ReactNode } from "react";
import {
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type GlucosePoint = {
  value: number;
  timestamp: string;
};

export type GlucoseEventPoint = {
  timestamp: string;
  label: string;
  icon: string;
};

type GlucoseChartProps = {
  data: GlucosePoint[];
  events?: GlucoseEventPoint[];
};

type GlucoseChartRow = {
  timestamp: string;
  timestampMs: number;
  value: number;
  eventIcon?: string;
  eventLabel?: string;
};

type GlucoseScatterRow = {
  timestamp: string;
  timestampMs: number;
  markerY: number;
  eventIcon: string;
  eventLabel?: string;
};

type GlucoseEventMarkerRow = {
  timestamp: string;
  timestampMs: number;
  icon: string;
  label: string;
};

type CustomTooltipProps = {
  active?: boolean;
  payload?: Array<{
    value?: number;
    dataKey?: string;
    payload?: GlucoseChartRow | GlucoseScatterRow;
  }>;
  label?: number | string;
};

type ClinicalInsight = {
  title: string;
  detail: string;
  tone: "critical" | "warning" | "info" | "success";
};

function toMillis(value: string): number | null {
  const ms = new Date(value).getTime();
  return Number.isNaN(ms) ? null : ms;
}

function formatTimeTick(value: number): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString([], {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTooltipDateTime(value: number): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString([], {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCompactEventDateTime(timestamp: string): string {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }

  return date.toLocaleString([], {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getSafeMinDomain(data: GlucosePoint[]): number {
  const values = data
    .map((point) => point.value)
    .filter((value) => typeof value === "number" && Number.isFinite(value));

  if (values.length === 0) {
    return 40;
  }

  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = Math.max(20, maxValue - minValue);
  const padding = Math.max(8, Math.round(range * 0.2));

  return Math.max(40, minValue - padding);
}

function getSafeMaxDomain(data: GlucosePoint[]): number {
  const values = data
    .map((point) => point.value)
    .filter((value) => typeof value === "number" && Number.isFinite(value));

  if (values.length === 0) {
    return 280;
  }

  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = Math.max(20, maxValue - minValue);
  const padding = Math.max(8, Math.round(range * 0.2));

  return maxValue + padding;
}

function buildChartRows(
  data: GlucosePoint[],
  events: GlucoseEventPoint[],
): GlucoseChartRow[] {
  const rows: GlucoseChartRow[] = data
    .map((point) => {
      const timestampMs = toMillis(point.timestamp);

      if (timestampMs === null) {
        return null;
      }

      return {
        timestamp: point.timestamp,
        timestampMs,
        value: point.value,
      };
    })
    .filter((row): row is GlucoseChartRow => row !== null)
    .sort((a, b) => a.timestampMs - b.timestampMs);

  if (rows.length === 0 || events.length === 0) {
    return rows;
  }

  events.forEach((event) => {
    const eventMs = toMillis(event.timestamp);
    if (eventMs === null) return;

    let closestIndex = -1;
    let closestDiff = Number.POSITIVE_INFINITY;

    rows.forEach((row, index) => {
      const diff = Math.abs(row.timestampMs - eventMs);

      if (diff < closestDiff) {
        closestDiff = diff;
        closestIndex = index;
      }
    });

    if (closestIndex === -1) {
      return;
    }

    const currentRow = rows[closestIndex];

    rows[closestIndex] = {
      ...currentRow,
      eventIcon: currentRow.eventIcon
        ? `${currentRow.eventIcon} ${event.icon}`
        : event.icon,
      eventLabel: currentRow.eventLabel
        ? `${currentRow.eventLabel} · ${event.label}`
        : event.label,
    };
  });

  return rows;
}

function buildScatterRows(
  rows: GlucoseChartRow[],
  maxDomain: number,
): GlucoseScatterRow[] {
  return rows
    .filter((row) => row.eventIcon)
    .map((row) => ({
      timestamp: row.timestamp,
      timestampMs: row.timestampMs,
      markerY: maxDomain - 18,
      eventIcon: row.eventIcon!,
      eventLabel: row.eventLabel,
    }));
}

function buildEventMarkerRows(
  events: GlucoseEventPoint[],
): GlucoseEventMarkerRow[] {
  return events
    .map((event) => {
      const timestampMs = toMillis(event.timestamp);

      if (timestampMs === null) {
        return null;
      }

      return {
        timestamp: event.timestamp,
        timestampMs,
        icon: event.icon,
        label: event.label,
      };
    })
    .filter((event): event is GlucoseEventMarkerRow => event !== null)
    .sort((a, b) => a.timestampMs - b.timestampMs);
}

function getDotStyle(value: number) {
  if (value < 70) {
    return {
      r: 6,
      fill: "#dc2626",
      stroke: "#ffffff",
      strokeWidth: 2,
    };
  }

  if (value > 180) {
    return {
      r: 6,
      fill: "#ea580c",
      stroke: "#ffffff",
      strokeWidth: 2,
    };
  }

  return {
    r: 4,
    fill: "#16a34a",
    stroke: "#ffffff",
    strokeWidth: 2,
  };
}

function getSummaryStats(data: GlucosePoint[]) {
  const values = data
    .map((point) => point.value)
    .filter((value) => typeof value === "number" && Number.isFinite(value));

  if (values.length === 0) {
    return {
      min: null,
      max: null,
      average: null,
      latest: null,
      trendLabel: "Sin datos",
      range: null,
      first: null,
      delta: null,
      below70Count: 0,
      above180Count: 0,
      above250Count: 0,
    };
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const average = Math.round(
    values.reduce((acc, value) => acc + value, 0) / values.length,
  );
  const latest = data[data.length - 1]?.value ?? values[values.length - 1];

  const first = data[0]?.value ?? values[0];
  const last = latest;
  const delta = last - first;
  const range = max - min;

  let trendLabel = "Estable";

  if (delta >= 15) {
    trendLabel = "Ascenso";
  } else if (delta <= -15) {
    trendLabel = "Descenso";
  } else if (range >= 45) {
    trendLabel = "Variable";
  }

  return {
    min,
    max,
    average,
    latest,
    trendLabel,
    range,
    first,
    delta,
    below70Count: values.filter((value) => value < 70).length,
    above180Count: values.filter((value) => value > 180).length,
    above250Count: values.filter((value) => value > 250).length,
  };
}

function getGlucoseStatus(value: number): {
  label: string;
  color: string;
  background: string;
  border: string;
} {
  if (value < 70) {
    return {
      label: "Hipoglucemia",
      color: "#991b1b",
      background: "#fee2e2",
      border: "#fecaca",
    };
  }

  if (value <= 180) {
    return {
      label: "En rango",
      color: "#166534",
      background: "#f0fdf4",
      border: "#bbf7d0",
    };
  }

  if (value <= 250) {
    return {
      label: "Hiperglucemia",
      color: "#9a3412",
      background: "#fff7ed",
      border: "#fed7aa",
    };
  }

  return {
    label: "Hiperglucemia crítica",
    color: "#991b1b",
    background: "#fee2e2",
    border: "#fecaca",
  };
}

function getClinicalInsight(data: GlucosePoint[]): ClinicalInsight {
  const summary = getSummaryStats(data);

  if (summary.latest === null) {
    return {
      title: "Sin datos glucémicos",
      detail: "No hay registros suficientes para resumir la evolución en 72 horas.",
      tone: "info",
    };
  }

  if (summary.below70Count > 0) {
    return {
      title: "Riesgo de hipoglucemia",
      detail: `Se registraron ${summary.below70Count} valores por debajo de 70 mg/dL en la ventana analizada.`,
      tone: "critical",
    };
  }

  if (summary.latest > 250) {
    return {
      title: "Último valor críticamente elevado",
      detail: `La glucemia más reciente es de ${summary.latest} mg/dL y requiere seguimiento prioritario.`,
      tone: "critical",
    };
  }

  if (summary.above180Count >= 3) {
    return {
      title: "Hiperglucemia sostenida",
      detail: `Se observan ${summary.above180Count} valores por encima de 180 mg/dL dentro del período.`,
      tone: "warning",
    };
  }

  if (summary.range !== null && summary.range >= 60) {
    return {
      title: "Variabilidad glucémica elevada",
      detail: `La amplitud observada es de ${summary.range} mg/dL entre el mínimo y el máximo.`,
      tone: "warning",
    };
  }

  if (summary.delta !== null && summary.delta >= 20) {
    return {
      title: "Tendencia ascendente a controlar",
      detail: `La glucemia aumentó ${summary.delta} mg/dL entre el primer y el último registro.`,
      tone: "warning",
    };
  }

  if (summary.delta !== null && summary.delta <= -20) {
    return {
      title: "Tendencia descendente",
      detail: `La glucemia descendió ${Math.abs(summary.delta)} mg/dL entre el primer y el último registro.`,
      tone: "info",
    };
  }

  return {
    title: "Perfil glucémico estable en 72h",
    detail: "No se observan desvíos críticos ni una variabilidad marcada en la serie reciente.",
    tone: "success",
  };
}

function getInsightStyle(tone: ClinicalInsight["tone"]) {
  if (tone === "critical") {
    return {
      background: "#fee2e2",
      border: "1px solid #fecaca",
      color: "#991b1b",
    };
  }

  if (tone === "warning") {
    return {
      background: "#fff7ed",
      border: "1px solid #fed7aa",
      color: "#9a3412",
    };
  }

  if (tone === "success") {
    return {
      background: "#f0fdf4",
      border: "1px solid #bbf7d0",
      color: "#166534",
    };
  }

  return {
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    color: "#1d4ed8",
  };
}

function CustomGlucoseTooltip({
  active,
  payload,
  label,
}: CustomTooltipProps): ReactNode {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const glucoseEntry = payload.find(
    (entry) =>
      entry?.dataKey === "value" &&
      typeof entry?.value === "number" &&
      Number.isFinite(entry.value),
  );

  const sourcePayload =
    (glucoseEntry?.payload as GlucoseChartRow | undefined) ??
    (payload[0]?.payload as GlucoseChartRow | undefined);

  if (!sourcePayload || typeof sourcePayload.value !== "number") {
    return null;
  }

  const glucoseValue = sourcePayload.value;
  const status = getGlucoseStatus(glucoseValue);
  const eventText = sourcePayload.eventLabel?.trim();

  const resolvedLabel =
    typeof label === "number"
      ? formatTooltipDateTime(label)
      : typeof sourcePayload.timestampMs === "number"
        ? formatTooltipDateTime(sourcePayload.timestampMs)
        : sourcePayload.timestamp;

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 12,
        boxShadow: "0 12px 24px rgba(15, 23, 42, 0.12)",
        minWidth: 220,
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: "#6b7280",
          marginBottom: 8,
          fontWeight: 600,
        }}
      >
        {resolvedLabel}
      </div>

      <div
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: "#111827",
          marginBottom: 8,
        }}
      >
        {glucoseValue} mg/dL
      </div>

      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "4px 8px",
          borderRadius: 999,
          background: status.background,
          color: status.color,
          border: `1px solid ${status.border}`,
          fontSize: 12,
          fontWeight: 700,
          marginBottom: eventText ? 8 : 0,
        }}
      >
        {status.label}
      </div>

      {eventText ? (
        <div
          style={{
            marginTop: 8,
            fontSize: 12,
            color: "#374151",
            lineHeight: 1.5,
          }}
        >
          <strong>Evento relacionado:</strong> {eventText}
        </div>
      ) : null}
    </div>
  );
}

export function GlucoseChart({ data, events = [] }: GlucoseChartProps) {
  if (!data || data.length === 0) {
    return (
      <div
        style={{
          height: 260,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          background: "#ffffff",
          color: "#64748b",
          fontSize: 14,
        }}
      >
        Sin datos de glucosa para visualizar.
      </div>
    );
  }

  const minDomain = getSafeMinDomain(data);
  const maxDomain = getSafeMaxDomain(data);
  const chartRows = buildChartRows(data, events);
  const scatterRows = buildScatterRows(chartRows, maxDomain);
  const eventMarkerRows = buildEventMarkerRows(events);
  const summary = getSummaryStats(data);
  const clinicalInsight = getClinicalInsight(data);
  const lastIndex = chartRows.length - 1;

  const minTimestamp = chartRows[0]?.timestampMs;
  const maxTimestamp = chartRows[chartRows.length - 1]?.timestampMs;

  return (
    <div
      style={{
        width: "100%",
        height: 372,
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: 12,
        padding: 12,
      }}
    >
      <div
        style={{
          ...getInsightStyle(clinicalInsight.tone),
          borderRadius: 12,
          padding: "10px 12px",
          marginBottom: 10,
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            marginBottom: 4,
          }}
        >
          {clinicalInsight.title}
        </div>

        <div
          style={{
            fontSize: 12,
            lineHeight: 1.5,
          }}
        >
          {clinicalInsight.detail}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 10,
        }}
      >
        <div
          style={{
            padding: "4px 8px",
            borderRadius: 999,
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            fontSize: 12,
            color: "#334155",
            fontWeight: 600,
          }}
        >
          Mín: {summary.min ?? "-"} mg/dL
        </div>

        <div
          style={{
            padding: "4px 8px",
            borderRadius: 999,
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            fontSize: 12,
            color: "#334155",
            fontWeight: 600,
          }}
        >
          Máx: {summary.max ?? "-"} mg/dL
        </div>

        <div
          style={{
            padding: "4px 8px",
            borderRadius: 999,
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            fontSize: 12,
            color: "#1d4ed8",
            fontWeight: 700,
          }}
        >
          Prom: {summary.average ?? "-"} mg/dL
        </div>

        <div
          style={{
            padding: "4px 8px",
            borderRadius: 999,
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            fontSize: 12,
            color: "#166534",
            fontWeight: 700,
          }}
        >
          Última: {summary.latest ?? "-"} mg/dL
        </div>

        <div
          style={{
            padding: "4px 8px",
            borderRadius: 999,
            background: "#fff7ed",
            border: "1px solid #fed7aa",
            fontSize: 12,
            color: "#9a3412",
            fontWeight: 700,
          }}
        >
          Tendencia: {summary.trendLabel}
        </div>
      </div>

      <div style={{ width: "100%", height: 208 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartRows}
            margin={{ top: 24, right: 16, left: 0, bottom: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" />

            <ReferenceArea
              y1={minDomain}
              y2={70}
              fill="#fee2e2"
              fillOpacity={0.5}
            />
            <ReferenceArea
              y1={70}
              y2={180}
              fill="#dcfce7"
              fillOpacity={0.45}
            />
            <ReferenceArea
              y1={180}
              y2={250}
              fill="#ffedd5"
              fillOpacity={0.55}
            />
            <ReferenceArea
              y1={250}
              y2={maxDomain}
              fill="#fecaca"
              fillOpacity={0.55}
            />

            {eventMarkerRows.map((event, index) => (
              <ReferenceLine
                key={`${event.timestampMs}-${index}`}
                x={event.timestampMs}
                stroke="#94a3b8"
                strokeDasharray="4 4"
                strokeOpacity={0.55}
              />
            ))}

            <XAxis
              type="number"
              dataKey="timestampMs"
              domain={
                typeof minTimestamp === "number" && typeof maxTimestamp === "number"
                  ? [minTimestamp, maxTimestamp]
                  : ["auto", "auto"]
              }
              tickFormatter={(value) =>
                typeof value === "number" ? formatTimeTick(value) : ""
              }
              minTickGap={32}
              tick={{ fontSize: 11 }}
            />

            <YAxis domain={[minDomain, maxDomain]} />

            <Tooltip content={<CustomGlucoseTooltip />} />

            <Line
              type="monotone"
              dataKey="value"
              stroke="#2563eb"
              strokeWidth={2}
              dot={({ cx, cy, payload, index }) => {
                if (
                  typeof cx !== "number" ||
                  typeof cy !== "number" ||
                  !payload ||
                  typeof payload.value !== "number"
                ) {
                  return null;
                }

                const dotStyle = getDotStyle(payload.value);
                const isLast = index === lastIndex;
                const isCritical = payload.value < 70 || payload.value > 250;

                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isLast ? dotStyle.r + 3 : dotStyle.r}
                    fill={dotStyle.fill}
                    stroke={
                      isLast
                        ? isCritical
                          ? "#7f1d1d"
                          : "#0f172a"
                        : dotStyle.stroke
                    }
                    strokeWidth={isLast ? 4 : dotStyle.strokeWidth}
                  />
                );
              }}
              activeDot={({ cx, cy, payload }) => {
                if (
                  typeof cx !== "number" ||
                  typeof cy !== "number" ||
                  !payload ||
                  typeof payload.value !== "number"
                ) {
                  return null;
                }

                const dotStyle = getDotStyle(payload.value);

                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={Math.max(dotStyle.r + 1, 6)}
                    fill={dotStyle.fill}
                    stroke={dotStyle.stroke}
                    strokeWidth={dotStyle.strokeWidth}
                  />
                );
              }}
            />

            {scatterRows.length > 0 ? (
              <Scatter data={scatterRows} dataKey="markerY" fill="transparent">
                <LabelList dataKey="eventIcon" position="top" fontSize={16} />
              </Scatter>
            ) : null}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {eventMarkerRows.length > 0 ? (
        <div
          style={{
            marginTop: 10,
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          {eventMarkerRows.map((event, index) => (
            <div
              key={`${event.timestampMs}-${index}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 10px",
                borderRadius: 999,
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                fontSize: 12,
                color: "#334155",
                lineHeight: 1.2,
              }}
            >
              <span style={{ fontSize: 14 }}>{event.icon}</span>
              <span style={{ fontWeight: 700 }}>{event.label}</span>
              <span style={{ color: "#64748b" }}>
                {formatCompactEventDateTime(event.timestamp)}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}