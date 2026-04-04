/* integrad-dashboard\src\components\followup\InterventionPanel.tsx */

import { useState, type CSSProperties, type ReactNode } from "react";
import type { FollowupEventRow, FollowupEventStatus } from "../../api/followup";
import { usePatientContext } from "../../hooks/usePatientContext";
import { usePatientTimeline } from "../../hooks/usePatientTimeline";
import {
  formatCategoryLabel,
  formatDateTime,
  formatEventIcon,
  formatEventLabel,
  formatNoteLabel,
  formatSlaLabel,
  getClinicalNarrativeFallback,
  getGlucoseColor,
  getGlucoseTrend,
  getOperationalPriorityMessage,
  getSeverityLabel,
} from "../../logic/patientContext.logic";
import { GlucoseChart } from "./GlucoseChart";

type InterventionPanelProps = {
  open: boolean;
  event: FollowupEventRow | null;
  onClose: () => void;
  children?: ReactNode;
  historyContent?: ReactNode;
};

const STATUS_LABEL: Record<FollowupEventStatus, string> = {
  OPEN: "Pendiente",
  IN_PROGRESS: "En curso",
  ESCALATED: "Escalado",
  CLOSED: "Controlado",
};

const TIMELINE_PREVIEW_LIMIT = 5;

const overlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(15, 23, 42, 0.22)",
  zIndex: 9998,
};

const panelStyle: CSSProperties = {
  position: "fixed",
  top: 0,
  right: 0,
  width: "min(1400px, 100vw)",
  height: "100vh",
  background: "#f8fafc",
  borderLeft: "1px solid #e5e7eb",
  boxShadow: "-16px 0 36px rgba(15, 23, 42, 0.16)",
  zIndex: 9999,
  display: "flex",
  flexDirection: "column",
};

const headerStyle: CSSProperties = {
  padding: "20px 24px",
  borderBottom: "1px solid #e5e7eb",
  display: "flex",
  alignItems: "flex-start",
  gap: 12,
  background: "#ffffff",
};

const bodyStyle: CSSProperties = {
  padding: 24,
  overflowY: "auto",
  display: "flex",
  flexDirection: "column",
  gap: 18,
};

const topGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 18,
  alignItems: "start",
};

const middleGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 18,
  alignItems: "start",
};

const sectionCardStyle: CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  padding: 16,
  background: "#ffffff",
};

const interpretationStyle: CSSProperties = {
  ...sectionCardStyle,
  background: "#eff6ff",
  border: "1px solid #bfdbfe",
};

const alertStyle: CSSProperties = {
  ...sectionCardStyle,
  background: "#fff7ed",
  border: "1px solid #fed7aa",
  color: "#9a3412",
};

const listStyle: CSSProperties = {
  display: "grid",
  gap: 10,
};

const listRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  background: "#f9fafb",
};

const historyCardStyle: CSSProperties = {
  ...sectionCardStyle,
  padding: 16,
};

const historyBodyStyle: CSSProperties = {
  ...listStyle,
  minHeight: 56,
};

const leftColumnStyle: CSSProperties = {
  minWidth: 0,
  display: "grid",
  gap: 4,
};

const rightColumnStyle: CSSProperties = {
  flexShrink: 0,
  fontSize: 12,
  color: "#6b7280",
  whiteSpace: "nowrap",
};

const criticalGlucoseContextStyle: CSSProperties = {
  marginTop: 12,
  padding: "10px 12px",
  borderRadius: 12,
  background: "#fee2e2",
  border: "1px solid #fecaca",
  color: "#991b1b",
  fontSize: 13,
  fontWeight: 600,
  lineHeight: 1.5,
};

const glucoseTrendStyle: CSSProperties = {
  marginBottom: 12,
  padding: "10px 12px",
  borderRadius: 12,
  background: "#eff6ff",
  border: "1px solid #bfdbfe",
  color: "#1d4ed8",
  fontSize: 13,
  fontWeight: 700,
  lineHeight: 1.5,
};

const timelineHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  marginBottom: 10,
};

const timelineTitleBlockStyle: CSSProperties = {
  minWidth: 0,
  display: "grid",
  gap: 4,
};

const timelineToggleButtonStyle: CSSProperties = {
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid #e5e7eb",
  background: "#ffffff",
  color: "#374151",
  fontWeight: 600,
  cursor: "pointer",
  fontSize: 12,
};

const timelineMetaStyle: CSSProperties = {
  fontSize: 12,
  color: "#6b7280",
};

const timelineItemLeftStyle: CSSProperties = {
  minWidth: 0,
  display: "grid",
  gap: 6,
};

const timelineBadgeBaseStyle: CSSProperties = {
  display: "inline-block",
  padding: "4px 8px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 700,
};

const timelineFooterNoteStyle: CSSProperties = {
  marginTop: 10,
  fontSize: 12,
  color: "#6b7280",
};

function getSeverityPillStyle(raw: string): CSSProperties {
  const value = String(raw || "").toUpperCase().trim();

  if (value === "CRITICAL") {
    return {
      background: "#fee2e2",
      color: "#991b1b",
      border: "1px solid #fecaca",
    };
  }

  if (value === "HIGH") {
    return {
      background: "#fff7ed",
      color: "#9a3412",
      border: "1px solid #fed7aa",
    };
  }

  if (value === "MEDIUM") {
    return {
      background: "#fef3c7",
      color: "#92400e",
      border: "1px solid #fde68a",
    };
  }

  return {
    background: "#ecfdf5",
    color: "#166534",
    border: "1px solid #bbf7d0",
  };
}

function getAdherencePillStyle(status: string): CSSProperties {
  const value = String(status || "").toUpperCase().trim();

  if (value === "CRITICAL") {
    return {
      background: "#fee2e2",
      color: "#991b1b",
      border: "1px solid #fecaca",
    };
  }

  if (value === "WARNING") {
    return {
      background: "#fff7ed",
      color: "#9a3412",
      border: "1px solid #fed7aa",
    };
  }

  return {
    background: "#ecfdf5",
    color: "#166534",
    border: "1px solid #bbf7d0",
  };
}

function getAdherenceLabel(status: string): string {
  const value = String(status || "").toUpperCase().trim();

  if (value === "CRITICAL") {
    return "Sin medicación";
  }

  if (value === "WARNING") {
    return "Próximo a quedarse sin medicación";
  }

  return "Cobertura de medicación OK";
}

function getAdherenceDaysLabel(daysRemaining: number | null): string {
  if (daysRemaining === null || daysRemaining === undefined) {
    return "Días restantes no disponibles";
  }

  if (daysRemaining === 1) {
    return "1 día restante";
  }

  return `${daysRemaining} días restantes`;
}

function buildRecentLinkText(
  event: FollowupEventRow,
  contextLoading: boolean,
): string {
  if (contextLoading) {
    return "Relacionando evento con contexto reciente...";
  }

  const cause = event.clinicalContext?.probableCause?.trim();
  if (cause) {
    return cause;
  }

  return "Revisar eventos y notas recientes para completar la interpretación clínica.";
}

function formatTimelineItemDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("es-AR");
}

function getTimelineTypeStyle(type: "EVENT" | "INDICATOR"): CSSProperties {
  if (type === "EVENT") {
    return {
      ...timelineBadgeBaseStyle,
      background: "#fef3c7",
      color: "#92400e",
      border: "1px solid #fde68a",
    };
  }

  return {
    ...timelineBadgeBaseStyle,
    background: "#dbeafe",
    color: "#1d4ed8",
    border: "1px solid #bfdbfe",
  };
}

export function InterventionPanel({
  open,
  event,
  onClose,
  children,
  historyContent,
}: InterventionPanelProps) {
  const context = usePatientContext(event?.patientId ?? null);
  const { data: timelineData, loading: timelineLoading, error: timelineError } =
    usePatientTimeline(event?.patientId ?? null);
  const [timelineExpanded, setTimelineExpanded] = useState(false);
  const [historyExpanded, setHistoryExpanded] = useState(true);
  const [eventsExpanded, setEventsExpanded] = useState(false);
  const [notesExpanded, setNotesExpanded] = useState(false);
  const [glucoseRecordsExpanded, setGlucoseRecordsExpanded] = useState(false);

  if (!open || !event) {
    return null;
  }

  const glucoseTrend = getGlucoseTrend(context.data.glucoseSeries);
  const timelinePreview = timelineData.slice(0, TIMELINE_PREVIEW_LIMIT);
  const hiddenTimelineCount = Math.max(
    timelineData.length - TIMELINE_PREVIEW_LIMIT,
    0,
  );

  const glucoseChartEvents = (context.data.events || []).map((item) => ({
    timestamp: item.timestamp,
    label: formatEventLabel(item.type),
    icon: formatEventIcon(item.type),
  }));

  return (
    <>
      <div
        style={overlayStyle}
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      />

      <aside aria-label="Panel de intervención" style={panelStyle}>
        <div style={headerStyle}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 0.3,
                textTransform: "uppercase",
                color: "#6b7280",
                marginBottom: 6,
              }}
            >
              Panel de intervención
            </div>

            <h3
              style={{
                margin: 0,
                fontSize: 22,
                color: "#111827",
                lineHeight: 1.2,
              }}
            >
              {event.patient.fullName}
            </h3>

            <div style={{ marginTop: 8, fontSize: 13, color: "#6b7280" }}>
              {event.patient.documentId}
            </div>

            <div style={{ marginTop: 6, fontSize: 13, color: "#374151" }}>
              Diabetes: tipo no disponible
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                marginTop: 12,
              }}
            >
              <span
                style={{
                  ...getSeverityPillStyle(event.severity),
                  padding: "4px 10px",
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                Severidad: {getSeverityLabel(event.severity)}
              </span>

              <span
                style={{
                  background: "#eff6ff",
                  color: "#1d4ed8",
                  border: "1px solid #bfdbfe",
                  padding: "4px 10px",
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                Estado: {STATUS_LABEL[event.status] ?? event.status}
              </span>

              <span
                style={{
                  background: "#f3f4f6",
                  color: "#374151",
                  border: "1px solid #e5e7eb",
                  padding: "4px 10px",
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                SLA: {formatSlaLabel(event.slaDueAt)}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "8px 12px",
              borderRadius: 999,
              border: "1px solid #e5e7eb",
              background: "#ffffff",
              color: "#374151",
              fontWeight: 600,
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            Cerrar
          </button>
        </div>

        <div style={bodyStyle}>
          <section style={sectionCardStyle}>
            <div
              style={{
                marginBottom: 10,
                fontSize: 14,
                fontWeight: 700,
                color: "#111827",
              }}
            >
              Glucemias
            </div>

            {context.loading ? (
              <div style={{ fontSize: 13, color: "#6b7280" }}>
                Cargando glucemias...
              </div>
            ) : (
              <>
                <div style={glucoseTrendStyle}>
                  {glucoseTrend.label} {glucoseTrend.symbol}
                </div>

                <GlucoseChart
                  data={(context.data.glucoseSeries || []).map((point) => ({
                    timestamp: point.timestamp,
                    value: point.value,
                  }))}
                  events={glucoseChartEvents}
                />

                {event.severity === "CRITICAL" && (
                  <div style={criticalGlucoseContextStyle}>
                    Riesgo clínico elevado pese a valores recientes en rango
                    normal.
                  </div>
                )}
              </>
            )}
          </section>

          <div style={topGridStyle}>
            <section style={interpretationStyle}>
              <div
                style={{
                  fontWeight: 700,
                  marginBottom: 10,
                  color: "#1e3a8a",
                }}
              >
                Interpretación clínica
              </div>

              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#111827",
                  lineHeight: 1.3,
                  marginBottom: 10,
                }}
              >
                {event.clinicalContext?.description ||
                  getClinicalNarrativeFallback(event.category)}
              </div>

              <div
                style={{
                  display: "grid",
                  gap: 8,
                  fontSize: 13,
                  color: "#374151",
                  lineHeight: 1.5,
                }}
              >
                <div>
                  <strong>Causa probable:</strong>{" "}
                  {event.clinicalContext?.probableCause ||
                    "Sin causa probable disponible"}
                </div>

                <div>
                  <strong>Relación con contexto reciente:</strong>{" "}
                  {buildRecentLinkText(event, context.loading)}
                </div>

                <div>
                  <strong>Tipo de seguimiento:</strong>{" "}
                  {formatCategoryLabel(event.category)}
                </div>
              </div>
            </section>

            <section style={alertStyle}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>
                Evento priorizado
              </div>

              <div
                style={{
                  display: "grid",
                  gap: 6,
                  fontSize: 13,
                  lineHeight: 1.5,
                }}
              >
                <div>
                  <strong>Motivo operativo:</strong>{" "}
                  {getOperationalPriorityMessage(event.severity)}
                </div>
                <div>
                  <strong>Tipo:</strong> {formatCategoryLabel(event.category)}
                </div>
                <div>
                  <strong>Estado:</strong>{" "}
                  {STATUS_LABEL[event.status] ?? event.status}
                </div>
              </div>
            </section>

            <section style={sectionCardStyle}>
              <div
                style={{
                  marginBottom: 10,
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#111827",
                }}
              >
                Adherencia farmacológica
              </div>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <span
                  style={{
                    ...getAdherencePillStyle(event.adherenceContext.status),
                    padding: "4px 10px",
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {getAdherenceLabel(event.adherenceContext.status)}
                </span>

                <span
                  style={{
                    background: "#f3f4f6",
                    color: "#374151",
                    border: "1px solid #e5e7eb",
                    padding: "4px 10px",
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {getAdherenceDaysLabel(event.adherenceContext.daysRemaining)}
                </span>
              </div>

              <div
                style={{
                  display: "grid",
                  gap: 8,
                  fontSize: 13,
                  color: "#374151",
                  lineHeight: 1.5,
                }}
              >
                <div>
                  <strong>Estado operativo:</strong>{" "}
                  {getAdherenceLabel(event.adherenceContext.status)}
                </div>

                <div>
                  <strong>Mensaje sugerido:</strong>{" "}
                  {event.adherenceContext.operationalMessage}
                </div>

                <div>
                  <strong>Acción recomendada:</strong>{" "}
                  {event.adherenceContext.status === "CRITICAL"
                    ? "Contactar al paciente para verificar retiro de medicación."
                    : event.adherenceContext.status === "WARNING"
                      ? "Confirmar próximo retiro de medicación y continuidad del tratamiento."
                      : "Mantener seguimiento habitual y monitorear continuidad."}
                </div>
              </div>
            </section>

            <section style={sectionCardStyle}>
              <div
                style={{
                  marginBottom: 6,
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#111827",
                }}
              >
                Contexto reciente
              </div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>
                Últimas 72 hs
              </div>

              <div
                style={{
                  marginTop: 12,
                  fontSize: 13,
                  color: "#374151",
                  lineHeight: 1.5,
                }}
              >
                {context.loading
                  ? "Cargando contexto clínico..."
                  : context.data.events.length > 0
                    ? `${formatEventLabel(
                        context.data.events[context.data.events.length - 1].type,
                      )} reciente: ${
                        context.data.events[context.data.events.length - 1]
                          .description
                      }`
                    : "Sin información reciente."}
              </div>

              {context.error ? (
                <div style={{ marginTop: 10, fontSize: 12, color: "#b91c1c" }}>
                  {context.error}
                </div>
              ) : null}
            </section>
          </div>

          <div style={middleGridStyle}>
            <section style={sectionCardStyle}>
              <div style={timelineHeaderStyle}>
                <div style={timelineTitleBlockStyle}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: "#111827",
                    }}
                  >
                    Glucemias registradas
                  </div>

                  <div style={timelineMetaStyle}>
                    Mediciones recientes registradas del paciente.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setGlucoseRecordsExpanded((prev) => !prev)}
                  style={timelineToggleButtonStyle}
                >
                  {glucoseRecordsExpanded ? "Ocultar" : "Ver glucemias"}
                </button>
              </div>

              {glucoseRecordsExpanded ? (
                context.loading ? (
                  <div style={{ fontSize: 13, color: "#6b7280" }}>
                    Cargando detalle de glucemias...
                  </div>
                ) : (
                  <div style={listStyle}>
                    {context.data.glucoseSeries.length > 0 ? (
                      context.data.glucoseSeries.map((point, index) => (
                        <div
                          key={`${point.timestamp}-${index}`}
                          style={listRowStyle}
                        >
                          <div style={leftColumnStyle}>
                            <div
                              style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: getGlucoseColor(point.value),
                              }}
                            >
                              {point.value} mg/dL
                            </div>
                          </div>

                          <div style={rightColumnStyle}>
                            {formatDateTime(point.timestamp)}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ fontSize: 13, color: "#6b7280" }}>
                        Sin glucemias registradas.
                      </div>
                    )}
                  </div>
                )
              ) : null}
            </section>

            <section style={sectionCardStyle}>
              <div style={timelineHeaderStyle}>
                <div style={timelineTitleBlockStyle}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: "#111827",
                    }}
                  >
                    Eventos
                  </div>

                  <div style={timelineMetaStyle}>
                    Eventos recientes del contexto clínico del paciente.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setEventsExpanded((prev) => !prev)}
                  style={timelineToggleButtonStyle}
                >
                  {eventsExpanded ? "Ocultar" : "Ver eventos"}
                </button>
              </div>

              {eventsExpanded ? (
                context.loading ? (
                  <div style={{ fontSize: 13, color: "#6b7280" }}>
                    Cargando eventos...
                  </div>
                ) : (
                  <div style={listStyle}>
                    {context.data.events.length > 0 ? (
                      context.data.events.map((item, index) => (
                        <div
                          key={`${item.timestamp}-${index}`}
                          style={listRowStyle}
                        >
                          <div style={leftColumnStyle}>
                            <div
                              style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: "#111827",
                              }}
                            >
                              {formatEventIcon(item.type)}{" "}
                              {formatEventLabel(item.type)}
                            </div>

                            <div
                              style={{
                                fontSize: 13,
                                color: "#374151",
                                lineHeight: 1.5,
                              }}
                            >
                              {item.description}
                            </div>
                          </div>

                          <div style={rightColumnStyle}>
                            {formatDateTime(item.timestamp)}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ fontSize: 13, color: "#6b7280" }}>
                        Sin eventos recientes.
                      </div>
                    )}
                  </div>
                )
              ) : null}
            </section>

            <section style={sectionCardStyle}>
              <div style={timelineHeaderStyle}>
                <div style={timelineTitleBlockStyle}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: "#111827",
                    }}
                  >
                    Notas
                  </div>

                  <div style={timelineMetaStyle}>
                    Notas recientes asociadas al paciente.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setNotesExpanded((prev) => !prev)}
                  style={timelineToggleButtonStyle}
                >
                  {notesExpanded ? "Ocultar" : "Ver notas"}
                </button>
              </div>

              {notesExpanded ? (
                context.loading ? (
                  <div style={{ fontSize: 13, color: "#6b7280" }}>
                    Cargando notas...
                  </div>
                ) : (
                  <div style={listStyle}>
                    {context.data.notes.length > 0 ? (
                      context.data.notes.map((note, index) => (
                        <div
                          key={`${note.createdAt}-${index}`}
                          style={listRowStyle}
                        >
                          <div style={leftColumnStyle}>
                            <div
                              style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: "#111827",
                              }}
                            >
                              {formatNoteLabel(note.type)}
                            </div>

                            <div
                              style={{
                                fontSize: 13,
                                color: "#374151",
                                lineHeight: 1.5,
                              }}
                            >
                              {note.text}
                            </div>
                          </div>

                          <div style={rightColumnStyle}>
                            {formatDateTime(note.createdAt)}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ fontSize: 13, color: "#6b7280" }}>
                        Sin notas recientes.
                      </div>
                    )}
                  </div>
                )
              ) : null}
            </section>
          </div>

          {historyContent ? (
            <section style={historyCardStyle}>
              <div style={timelineHeaderStyle}>
                <div style={timelineTitleBlockStyle}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: "#111827",
                    }}
                  >
                    Historial
                  </div>

                  <div style={timelineMetaStyle}>
                    Acciones registradas del caso en seguimiento.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setHistoryExpanded((prev) => !prev)}
                  style={timelineToggleButtonStyle}
                >
                  {historyExpanded ? "Ocultar" : "Ver historial"}
                </button>
              </div>

              {historyExpanded ? (
                <div style={historyBodyStyle}>{historyContent}</div>
              ) : null}
            </section>
          ) : null}

          <section style={sectionCardStyle}>
            <div style={timelineHeaderStyle}>
              <div style={timelineTitleBlockStyle}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#111827",
                  }}
                >
                  Timeline clínico
                </div>

                <div style={timelineMetaStyle}>
                  {timelineLoading
                    ? "Cargando timeline..."
                    : `${Math.min(
                        timelineData.length,
                        TIMELINE_PREVIEW_LIMIT,
                      )} de ${timelineData.length} registros visibles`}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setTimelineExpanded((prev) => !prev)}
                style={timelineToggleButtonStyle}
              >
                {timelineExpanded ? "Ocultar" : "Ver timeline"}
              </button>
            </div>

            {timelineExpanded ? (
              timelineLoading ? (
                <div style={{ fontSize: 13, color: "#6b7280" }}>
                  Cargando timeline clínico...
                </div>
              ) : timelineError ? (
                <div style={{ fontSize: 13, color: "#b91c1c" }}>
                  {timelineError}
                </div>
              ) : timelinePreview.length === 0 ? (
                <div style={{ fontSize: 13, color: "#6b7280" }}>
                  No hay registros en el timeline clínico.
                </div>
              ) : (
                <>
                  <div style={listStyle}>
                    {timelinePreview.map((item, index) => (
                      <div
                        key={`${item.type}-${item.date}-${item.title}-${index}`}
                        style={listRowStyle}
                      >
                        <div style={timelineItemLeftStyle}>
                          <span style={getTimelineTypeStyle(item.type)}>
                            {item.type}
                          </span>

                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: "#111827",
                              lineHeight: 1.5,
                            }}
                          >
                            {item.title}
                          </div>
                        </div>

                        <div style={rightColumnStyle}>
                          {formatTimelineItemDate(item.date)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {hiddenTimelineCount > 0 && (
                    <div style={timelineFooterNoteStyle}>
                      Hay {hiddenTimelineCount} registro
                      {hiddenTimelineCount === 1 ? "" : "s"} adicional
                      {hiddenTimelineCount === 1 ? "" : "es"} no mostrado
                      {hiddenTimelineCount === 1 ? "" : "s"} en esta vista
                      rápida.
                    </div>
                  )}
                </>
              )
            ) : null}
          </section>

          <section style={sectionCardStyle}>
            <div
              style={{
                marginBottom: 12,
                fontSize: 14,
                fontWeight: 700,
                color: "#111827",
              }}
            >
              Acciones
            </div>

            {children}
          </section>
        </div>
      </aside>
    </>
  );
}