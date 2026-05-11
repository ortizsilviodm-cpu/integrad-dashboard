import type { CSSProperties } from "react";
import type { FollowupEventRow } from "../../api/followup";
import { formatEventLabel, formatEventIcon, formatDateTime, getOperationalPriorityMessage } from "../../logic/patientContext.logic";
import { buildOperationalCaseMotiveLabel } from "../../logic/caseload.logic";

type TimelineItem = {
  kind: "EVENT" | "ACTION" | "MILESTONE";
  timestamp: string;
  title: string;
  detail: string;
  icon?: string;
  color: string;
};

type HumanTimelineProps = {
  events: FollowupEventRow[];
  operationalMotive: string | null;
  managedByName: string | null;
  currentStatus: string;
};

const containerStyle: CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  padding: 20,
  marginBottom: 16,
};

const headerStyle: CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
  color: "#111827",
  marginBottom: 4,
};

const subtitleStyle: CSSProperties = {
  fontSize: 13,
  color: "#6b7280",
  marginBottom: 16,
};

const timelineLineStyle: CSSProperties = {
  position: "relative" as const,
  paddingLeft: 32,
};

const lineBeforeStyle: CSSProperties = {
  content: '""',
  position: "absolute" as const,
  left: 11,
  top: 0,
  bottom: 0,
  width: 2,
  background: "#e5e7eb",
};

const itemWrapperStyle: CSSProperties = {
  position: "relative" as const,
  marginBottom: 20,
  paddingLeft: 24,
};

const dotBaseStyle: CSSProperties = {
  position: "absolute" as const,
  left: -32,
  top: 4,
  width: 12,
  height: 12,
  borderRadius: "50%",
  border: "2px solid #ffffff",
  boxShadow: "0 0 0 2px #e5e7eb",
};

const itemTitleStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: "#111827",
  lineHeight: 1.4,
};

const itemDetailStyle: CSSProperties = {
  fontSize: 13,
  color: "#6b7280",
  lineHeight: 1.5,
  marginTop: 4,
};

const itemMetaStyle: CSSProperties = {
  fontSize: 12,
  color: "#9ca3af",
  marginTop: 4,
};

const sectionLabelStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase" as const,
  letterSpacing: "0.06em",
  color: "#9ca3af",
  marginTop: 20,
  marginBottom: 10,
};

function buildTimelineItems(
  events: FollowupEventRow[],
  operationalMotive: string | null,
  managedByName: string | null,
  currentStatus: string,
): TimelineItem[] {
  const items: TimelineItem[] = [];

  // MILESTONE: Situación actual del caso
  const humanStatus = (() => {
    switch (currentStatus) {
      case "OPEN":
        return "Caso abierto — en espera de primera intervención";
      case "IN_PROGRESS":
        return managedByName
          ? `${managedByName} está gestionando el caso`
          : "Caso en curso — responsable pendiente de asignación";
      case "STABILIZED":
        return "Caso estabilizado — seguimiento de mantenimiento";
      case "RESOLVED":
        return "Caso resuelto — cerrado por el equipo";
      case "REOPENED":
        return "Caso reabierto — requiere re-evaluación";
      default:
        return "Estado del caso: " + currentStatus;
    }
  })();

  items.push({
    kind: "MILESTONE",
    timestamp: "Situación actual",
    title: humanStatus,
    detail: operationalMotive
      ? `Motivo: ${operationalMotive.replace(/_/g, " ").toLowerCase()}`
      : "",
    color: "#6366f1",
  });

  // Clasificar eventos en acciones y eventos clínicos
  const actions = events.filter(
    (e) =>
      e.category === "OPERATIONAL" ||
      (e.clinicalContext?.probableCause && e.clinicalContext.probableCause.length > 0),
  );
  const clinicalEvents = events.filter(
    (e) => !actions.includes(e),
  );

  // EVENTOS: los más recientes primero
  const sortedClinicalEvents = [...clinicalEvents].sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  );

  for (const event of sortedClinicalEvents) {
    items.push({
      kind: "EVENT",
      timestamp: event.occurredAt,
      title: formatEventLabel(event.type) || event.type,
      detail:
        event.clinicalContext?.description || event.clinicalContext?.probableCause || "",
      icon: formatEventIcon(event.type),
      color: getSeverityColor(event.severity),
    });
  }

  // ACCIONES: registros de intervención
  const sortedActions = [...actions].sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  );

  for (const action of sortedActions) {
    const motive = buildOperationalCaseMotiveLabel({
      operationalCase: {
        operationalMotive: action.category as any,
        priority: "MEDIUM",
        status: "OPEN",
        contextualSummary: "",
        reopenedCount: 0,
        updatedAt: "",
      },
    } as any);

    items.push({
      kind: "ACTION",
      timestamp: action.occurredAt,
      title: motive ? `Intervención: ${motive.toLowerCase()}` : formatEventLabel(action.type),
      detail:
        action.clinicalContext?.description ||
        action.clinicalContext?.probableCause ||
        getOperationalPriorityMessage({
          severity: action.severity,
          category: action.category,
          status: action.status,
          adherenceStatus: action.adherenceContext?.status,
        }),
      icon: action.status === "CLOSED" ? "✅" : "🔄",
      color: action.status === "CLOSED" ? "#16a34a" : "#f59e0b",
    });
  }

  return items;
}

function getSeverityColor(severity: string): string {
  const v = String(severity || "").toUpperCase().trim();
  if (v === "CRITICAL") return "#ef4444";
  if (v === "HIGH") return "#f97316";
  if (v === "MEDIUM") return "#eab308";
  return "#6b7280";
}

export default function HumanTimeline({
  events,
  operationalMotive,
  managedByName,
  currentStatus,
}: HumanTimelineProps) {
  if (events.length === 0) {
    return null;
  }

  const timelineItems = buildTimelineItems(events, operationalMotive, managedByName, currentStatus);

  return (
    <section style={containerStyle}>
      <div style={headerStyle}>Línea de tiempo del caso</div>
      <div style={subtitleStyle}>
        Recorrido completo de eventos e intervenciones. Lo más reciente arriba.
      </div>

      <div style={timelineLineStyle}>
        <div style={lineBeforeStyle} />

        {timelineItems.map((item, index) => {
          const dotColor =
            item.kind === "MILESTONE"
              ? "#6366f1"
              : item.kind === "ACTION"
                ? item.color
                : item.color;

          const dotSize = item.kind === "MILESTONE" ? 14 : 12;

          return (
            <div key={`${item.timestamp}-${index}`} style={itemWrapperStyle}>
              <div
                style={{
                  ...dotBaseStyle,
                  width: dotSize,
                  height: dotSize,
                  background: dotColor,
                }}
              />

              {item.kind === "MILESTONE" ? (
                <div style={sectionLabelStyle}>SITUACIÓN ACTUAL</div>
              ) : null}

              <div style={itemTitleStyle}>
                {item.icon ? `${item.icon} ` : ""}
                {item.title}
              </div>

              {item.detail ? (
                <div style={itemDetailStyle}>{item.detail}</div>
              ) : null}

              <div style={itemMetaStyle}>{formatDateTime(item.timestamp)}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}