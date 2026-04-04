import type { CSSProperties, ReactElement } from "react";
import { usePatientTimeline } from "../../hooks/usePatientTimeline";

type PatientTimelineProps = {
  patientId: string | null | undefined;
};

function formatTimelineDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("es-AR");
}

function getTypeLabel(type: "EVENT" | "INDICATOR"): string {
  if (type === "EVENT") return "EVENT";
  return "INDICATOR";
}

function getBadgeStyle(type: "EVENT" | "INDICATOR"): CSSProperties {
  if (type === "EVENT") {
    return {
      display: "inline-block",
      padding: "4px 8px",
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 600,
      backgroundColor: "#fef3c7",
      color: "#92400e",
    };
  }

  return {
    display: "inline-block",
    padding: "4px 8px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
    backgroundColor: "#dbeafe",
    color: "#1d4ed8",
  };
}

const containerStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const listStyle: CSSProperties = {
  listStyle: "none",
  margin: 0,
  padding: 0,
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const itemStyle: CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 12,
  backgroundColor: "#ffffff",
};

const dateStyle: CSSProperties = {
  fontSize: 13,
  color: "#6b7280",
  marginBottom: 6,
};

const titleStyle: CSSProperties = {
  fontSize: 15,
  color: "#111827",
  margin: "8px 0 0 0",
};

const emptyStyle: CSSProperties = {
  border: "1px dashed #d1d5db",
  borderRadius: 12,
  padding: 16,
  color: "#6b7280",
  backgroundColor: "#f9fafb",
};

export default function PatientTimeline({
  patientId,
}: PatientTimelineProps): ReactElement {
  const { data, loading, error } = usePatientTimeline(patientId);

  if (loading) {
    return <div style={emptyStyle}>Cargando timeline clínico...</div>;
  }

  if (error) {
    return <div style={emptyStyle}>{error}</div>;
  }

  if (data.length === 0) {
    return <div style={emptyStyle}>No hay eventos en el timeline clínico.</div>;
  }

  return (
    <div style={containerStyle}>
      <ul style={listStyle}>
        {data.map((item, index) => (
          <li
            key={`${item.type}-${item.date}-${item.title}-${index}`}
            style={itemStyle}
          >
            <div style={dateStyle}>{formatTimelineDate(item.date)}</div>
            <span style={getBadgeStyle(item.type)}>{getTypeLabel(item.type)}</span>
            <p style={titleStyle}>{item.title}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}