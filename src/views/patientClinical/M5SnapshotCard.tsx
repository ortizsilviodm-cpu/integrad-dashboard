/* integrad-dashboard/src/views/patientClinical/M5SnapshotCard.tsx */

import { useMemo, useState } from "react";
import { TOKENS } from "../../theme/tokens";
import { Card } from "../../components/ui/Card";
import { formatIsoDateTime } from "../../utils/patientClinical/formatters";

import type {
  PatientRiskSnapshot,
  M5SuggestedAction,
  M5SuggestedActionPriority,
} from "../../api/patients";

type Props = {
  snapshot: PatientRiskSnapshot | null;
  loading: boolean;
  error: string | null;
};

function riskLevelLabel(level?: PatientRiskSnapshot["riskLevel"]) {
  switch (level) {
    case "low":
      return { label: "Bajo", color: "#16a34a", bg: "#dcfce7" };
    case "medium":
      return { label: "Moderado", color: "#92400e", bg: "#fef3c7" };
    case "high":
      return { label: "Alto", color: "#b91c1c", bg: "#fee2e2" };
    case "critical":
      return { label: "Crítico", color: "#ffffff", bg: "#b91c1c" };
    default:
      return { label: "Sin dato", color: "#6b7280", bg: "#f3f4f6" };
  }
}

function normalizeM5Priority(p?: unknown): M5SuggestedActionPriority | undefined {
  const v = typeof p === "string" ? p.toLowerCase().trim() : "";
  if (v === "critical") return "critical";
  if (v === "high") return "high";
  if (v === "medium") return "medium";
  if (v === "low") return "low";
  return undefined;
}

function priorityPill(priority?: M5SuggestedActionPriority) {
  switch (priority) {
    case "critical":
      return {
        label: "Crítica",
        bg: "#b91c1c",
        color: "#ffffff",
        border: "1px solid #7f1d1d",
      };
    case "high":
      return {
        label: "Alta",
        bg: "#fee2e2",
        color: "#b91c1c",
        border: "1px solid rgba(185,28,28,0.35)",
      };
    case "medium":
      return {
        label: "Moderada",
        bg: "#fef3c7",
        color: "#92400e",
        border: "1px solid rgba(146,64,14,0.25)",
      };
    case "low":
      return {
        label: "Baja",
        bg: "#e0f2fe",
        color: "#0369a1",
        border: "1px solid rgba(3,105,161,0.25)",
      };
    default:
      return {
        label: "Sin prioridad",
        bg: "#f3f4f6",
        color: "#6b7280",
        border: TOKENS.BORDER_DEFAULT,
      };
  }
}

function formatFlagLabel(key: string): string {
  switch (key) {
    case "dataIncomplete":
      return "Datos incompletos";
    case "needsContact":
      return "Requiere contacto";
    case "needsClinicalReview":
      return "Revisión clínica";
    case "highPriorityCaseload":
      return "Prioridad de seguimiento";
    default:
      return key;
  }
}

function flagPillStyle(flagKey: string) {
  switch (flagKey) {
    case "needsContact":
      return {
        label: "Requiere contacto",
        bg: "#e0f2fe",
        color: "#0369a1",
        border: "1px solid rgba(3,105,161,0.25)",
      };
    case "dataIncomplete":
      return {
        label: "Datos incompletos",
        bg: "#fef3c7",
        color: "#92400e",
        border: "1px solid rgba(146,64,14,0.25)",
      };
    case "needsClinicalReview":
      return {
        label: "Revisión clínica",
        bg: "#fee2e2",
        color: "#b91c1c",
        border: "1px solid rgba(185,28,28,0.35)",
      };
    case "highPriorityCaseload":
      return {
        label: "Prioridad de seguimiento",
        bg: "#f3f4f6",
        color: "#111827",
        border: TOKENS.BORDER_DEFAULT,
      };
    default:
      return {
        label: formatFlagLabel(flagKey),
        bg: "#f3f4f6",
        color: "#6b7280",
        border: TOKENS.BORDER_DEFAULT,
      };
  }
}

function secondaryButtonStyle(isEnabled: boolean) {
  return {
    border: TOKENS.BORDER_DEFAULT,
    borderRadius: 12,
    padding: "8px 10px",
    cursor: isEnabled ? "pointer" : "not-allowed",
    background: isEnabled ? "#ffffff" : "#f9fafb",
    color: isEnabled ? "#111827" : "#9ca3af",
    fontSize: "0.8rem",
    fontWeight: 700 as const,
  };
}

function signalChipStyle(isPresent: boolean) {
  if (isPresent) {
    return {
      bg: "#dcfce7",
      color: "#166534",
      border: "1px solid rgba(22,101,52,0.25)",
    };
  }
  return {
    bg: "#f3f4f6",
    color: "#6b7280",
    border: TOKENS.BORDER_DEFAULT,
  };
}

export default function M5SnapshotCard({ snapshot, loading, error }: Props) {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const m5Badge = riskLevelLabel(snapshot?.riskLevel);

  const m5SuggestedActions: M5SuggestedAction[] = useMemo(() => {
    return snapshot?.suggestedActions ?? [];
  }, [snapshot]);

  const fallbackSuggestedAction = useMemo<M5SuggestedAction | null>(() => {
    if (!snapshot) return null;
    const hasActions = (snapshot.suggestedActions ?? []).length > 0;
    if (hasActions) return null;

    if (snapshot.flags?.dataIncomplete) {
      return {
        priority: "medium",
        title: "Completar datos de monitoreo",
        reason:
          "No hay lecturas suficientes en la ventana para evaluar variabilidad y ajustar la priorización. Se recomienda contacto y registro de controles.",
        category: "data",
        code: "COMPLETE_DATA_WINDOW",
      };
    }

    return null;
  }, [snapshot]);

  const actionsToRender = useMemo<M5SuggestedAction[]>(() => {
    if (m5SuggestedActions.length > 0) return m5SuggestedActions;
    return fallbackSuggestedAction ? [fallbackSuggestedAction] : [];
  }, [m5SuggestedActions, fallbackSuggestedAction]);

  const m5ActiveFlags = useMemo(() => {
    const f = snapshot?.flags ?? {};
    return Object.entries(f)
      .filter(([, v]) => Boolean(v))
      .map(([k]) => k);
  }, [snapshot]);

  const m5DataIncomplete = Boolean(snapshot?.flags?.dataIncomplete);

  const syntheticFallbackActions = useMemo<M5SuggestedAction[]>(() => {
    if (!snapshot) return [];
    const hasActions = (snapshot.suggestedActions ?? []).length > 0;
    if (hasActions) return [];
    if (!m5DataIncomplete) return [];

    const list: M5SuggestedAction[] = [];

    if (snapshot.flags?.needsContact) {
      list.push({
        priority: "high",
        title: "Contactar al paciente",
        reason:
          "La plataforma detecta necesidad de contacto. Se recomienda validar situación, barreras y reforzar el plan de seguimiento.",
        category: "operational",
        code: "CONTACT_PATIENT",
      });
    }

    list.push({
      priority: "medium",
      title: "Solicitar lecturas y controles",
      reason:
        "Datos insuficientes para análisis. Se recomienda solicitar lecturas recientes (glucemias/HbA1c) para recalcular el riesgo.",
        category: "data",
        code: "REQUEST_READINGS",
      });

    return list.slice(0, 2);
  }, [snapshot, m5DataIncomplete]);

  const actionsToRenderFinal = useMemo<M5SuggestedAction[]>(() => {
    if (actionsToRender.length > 0) return actionsToRender;
    if (syntheticFallbackActions.length > 0) return syntheticFallbackActions;
    return [];
  }, [actionsToRender, syntheticFallbackActions]);

  const summaryLabel = loading
    ? "Cargando…"
    : snapshot?.generatedAt
      ? `Actualizado: ${formatIsoDateTime(snapshot.generatedAt)}`
      : "Sin resumen";

  return (
    <Card style={{ marginBottom: 16 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          marginBottom: isExpanded ? 8 : 0,
        }}
      >
        <div>
          <h3
            style={{
              marginTop: 0,
              marginBottom: 2,
              fontSize: "1rem",
              fontWeight: 600,
              color: "#111827",
            }}
          >
            M5 — Riesgo predictivo (IA)
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: "0.8rem",
              color: TOKENS.COLOR_TEXT_MUTED,
            }}
          >
            Resumen calculado para priorizar el seguimiento clínico, de
            adherencia y operativo.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
            justifyContent: "flex-end",
          }}
        >
          <span style={{ fontSize: "0.8rem", color: TOKENS.COLOR_TEXT_MUTED }}>
            {summaryLabel}
          </span>

          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            style={{
              border: "1px solid #d1d5db",
              borderRadius: 999,
              padding: "6px 12px",
              cursor: "pointer",
              background: "#ffffff",
              color: "#374151",
              fontSize: "0.82rem",
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            {isExpanded ? "Ocultar" : "Mostrar"}
          </button>
        </div>
      </div>

      {isExpanded && error && (
        <p style={{ color: "#b91c1c", fontSize: "0.85rem" }}>{error}</p>
      )}

      {isExpanded && !loading && !error && !snapshot && (
        <p style={{ color: TOKENS.COLOR_TEXT_MUTED, fontSize: "0.85rem" }}>
          Aún no hay un resumen M5 disponible para este paciente.
        </p>
      )}

      {isExpanded && !loading && !error && snapshot && (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
              marginTop: 10,
            }}
          >
            <div
              style={{
                border: TOKENS.BORDER_DEFAULT,
                borderRadius: 14,
                padding: 12,
                background: "#f9fafb",
              }}
            >
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span
                  style={{
                    alignSelf: "flex-start",
                    padding: "4px 12px",
                    borderRadius: 999,
                    fontSize: "0.78rem",
                    fontWeight: 800,
                    color: m5Badge.color,
                    backgroundColor: m5Badge.bg,
                    textTransform: "uppercase",
                  }}
                >
                  {m5Badge.label}
                </span>
                <div style={{ fontSize: "0.9rem", color: "#111827" }}>
                  <strong>Score:</strong> {snapshot.riskScore}
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  gap: 10,
                  marginTop: 10,
                  fontSize: "0.85rem",
                }}
              >
                {[
                  { label: "Clínico", value: snapshot.clinicalRisk },
                  { label: "Adherencia", value: snapshot.adherenceRisk },
                  { label: "Operativo", value: snapshot.operationalRisk },
                ].map((x) => (
                  <div
                    key={x.label}
                    style={{
                      background: "#ffffff",
                      border: TOKENS.BORDER_DEFAULT,
                      borderRadius: 12,
                      padding: 10,
                    }}
                  >
                    <div
                      style={{
                        color: TOKENS.COLOR_TEXT_MUTED,
                        fontSize: "0.75rem",
                      }}
                    >
                      {x.label}
                    </div>
                    <div style={{ fontWeight: 800, fontSize: "1.05rem" }}>
                      {x.value}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 10, fontSize: "0.8rem" }}>
                <div
                  style={{ color: TOKENS.COLOR_TEXT_MUTED, marginBottom: 6 }}
                >
                  Señales detectadas
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, color: "#0f172a" }}>
                  {snapshot.reasons.slice(0, 5).map((r, i) => (
                    <li key={`${r}-${i}`}>{r}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div
              style={{
                border: TOKENS.BORDER_DEFAULT,
                borderRadius: 14,
                padding: 12,
                background: "#ffffff",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10,
                  alignItems: "baseline",
                  marginBottom: 8,
                }}
              >
                <div style={{ fontWeight: 800, color: "#111827" }}>
                  Calidad del resumen de seguimiento
                </div>
                <div style={{ fontSize: "0.78rem", color: TOKENS.COLOR_TEXT_MUTED }}>
                  Estado operativo para seguimiento
                </div>
              </div>

              <div style={{ fontSize: "0.85rem", color: "#111827" }}>
                <p style={{ margin: "6px 0" }}>
                  <strong>Ventana:</strong> {snapshot.windowDays} días ·{" "}
                  <strong>Modelo:</strong> {snapshot.modelVersion}
                </p>

                <div style={{ marginTop: 8 }}>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      color: "#111827",
                      marginBottom: 6,
                    }}
                  >
                    Señales disponibles
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {[
                      {
                        label: "Lecturas",
                        present: Boolean(
                          snapshot.dataCompleteness?.readingsPresent
                        ),
                      },
                      {
                        label: "Dispensas",
                        present: Boolean(
                          snapshot.dataCompleteness?.dispensesSignal
                        ),
                      },
                      {
                        label: "Alertas",
                        present: Boolean(
                          snapshot.dataCompleteness?.alertsSignal
                        ),
                      },
                    ].map((s) => {
                      const st = signalChipStyle(s.present);
                      return (
                        <span
                          key={s.label}
                          style={{
                            padding: "6px 10px",
                            borderRadius: 999,
                            fontSize: "0.78rem",
                            fontWeight: 800,
                            background: st.bg,
                            color: st.color,
                            border: st.border,
                            whiteSpace: "nowrap",
                          }}
                          title={s.present ? "Disponible" : "No disponible"}
                        >
                          {s.label}: {s.present ? "Sí" : "No"}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                    alignItems: "baseline",
                    marginBottom: 6,
                  }}
                >
                  <div
                    style={{
                      fontWeight: 800,
                      color: "#111827",
                      fontSize: "0.86rem",
                    }}
                  >
                    Señales operativas
                  </div>
                  <div style={{ fontSize: "0.78rem", color: TOKENS.COLOR_TEXT_MUTED }}>
                    {m5ActiveFlags.length === 0
                      ? "Sin flags activos"
                      : `${m5ActiveFlags.length} activo(s)`}
                  </div>
                </div>

                {m5ActiveFlags.length === 0 ? (
                  <div
                    style={{
                      borderRadius: 12,
                      border: TOKENS.BORDER_DEFAULT,
                      padding: 10,
                      background: "#f9fafb",
                      color: TOKENS.COLOR_TEXT_MUTED,
                      fontSize: "0.85rem",
                    }}
                  >
                    No se detectaron flags de priorización en esta ventana.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {m5ActiveFlags.map((flagKey) => {
                      const s = flagPillStyle(flagKey);
                      return (
                        <span
                          key={flagKey}
                          style={{
                            padding: "6px 10px",
                            borderRadius: 999,
                            fontSize: "0.78rem",
                            fontWeight: 800,
                            background: s.bg,
                            color: s.color,
                            border: s.border,
                            whiteSpace: "nowrap",
                          }}
                          title={formatFlagLabel(flagKey)}
                        >
                          {s.label}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              <div
                style={{
                  marginTop: 14,
                  marginBottom: 12,
                  borderTop: TOKENS.BORDER_DEFAULT,
                }}
              />

              <div>
                <div
                  style={{
                    fontWeight: 800,
                    marginBottom: 6,
                    color: "#111827",
                    fontSize: "0.86rem",
                  }}
                >
                  Acciones operativas
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.78rem",
                    color: TOKENS.COLOR_TEXT_MUTED,
                  }}
                >
                  Botones de apoyo para el equipo. Por el momento no ejecutan
                  acciones reales; se habilitarán cuando esté listo el sistema
                  de tareas.
                </p>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                    gap: 10,
                    marginTop: 8,
                  }}
                >
                  <button
                    type="button"
                    disabled={!Boolean(snapshot.flags?.needsContact)}
                    onClick={() => {
                      // UI-only: pendiente implementación workflow.
                    }}
                    style={secondaryButtonStyle(Boolean(snapshot.flags?.needsContact))}
                    title={
                      snapshot.flags?.needsContact
                        ? "Disponible — ejecución pendiente del sistema de tareas"
                        : "No aplica para este snapshot"
                    }
                  >
                    Crear tarea de contacto
                  </button>

                  <button
                    type="button"
                    disabled={!Boolean(snapshot.flags?.dataIncomplete)}
                    onClick={() => {
                      // UI-only: pendiente implementación workflow.
                    }}
                    style={secondaryButtonStyle(Boolean(snapshot.flags?.dataIncomplete))}
                    title={
                      snapshot.flags?.dataIncomplete
                        ? "Disponible — ejecución pendiente del sistema de tareas"
                        : "No disponible con los datos actuales"
                    }
                  >
                    Solicitar lecturas
                  </button>

                  <button
                    type="button"
                    disabled={!Boolean(snapshot.flags?.needsClinicalReview)}
                    onClick={() => {
                      // UI-only: pendiente implementación workflow.
                    }}
                    style={secondaryButtonStyle(Boolean(snapshot.flags?.needsClinicalReview))}
                    title={
                      snapshot.flags?.needsClinicalReview
                        ? "Disponible — ejecución pendiente del sistema de tareas"
                        : "No disponible por condición del paciente"
                    }
                  >
                    Derivar a revisión
                  </button>

                  <button
                    type="button"
                    disabled={!Boolean(snapshot.flags?.highPriorityCaseload)}
                    onClick={() => {
                      // UI-only: pendiente implementación workflow.
                    }}
                    style={secondaryButtonStyle(Boolean(snapshot.flags?.highPriorityCaseload))}
                    title={
                      snapshot.flags?.highPriorityCaseload
                        ? "Disponible — ejecución pendiente del sistema de tareas"
                        : "No aplica para este snapshot"
                    }
                  >
                    Marcar prioritario
                  </button>
                </div>
              </div>

              <div
                style={{
                  marginTop: 14,
                  marginBottom: 12,
                  borderTop: TOKENS.BORDER_DEFAULT,
                }}
              />

              <div>
                <div
                  style={{
                    fontWeight: 800,
                    marginBottom: 6,
                    color: "#111827",
                  }}
                >
                  Acciones sugeridas por IA
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.78rem",
                    color: TOKENS.COLOR_TEXT_MUTED,
                  }}
                >
                  Sugerencias para guiar la gestión clínica y operativa. No
                  ejecutan acciones automáticamente.
                </p>

                {actionsToRenderFinal.length === 0 ? (
                  <div
                    style={{
                      marginTop: 8,
                      padding: 10,
                      borderRadius: 12,
                      border: TOKENS.BORDER_DEFAULT,
                      background: "#f9fafb",
                      color: TOKENS.COLOR_TEXT_MUTED,
                      fontSize: "0.85rem",
                    }}
                  >
                    No hay acciones sugeridas para este paciente en esta ventana.
                  </div>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr",
                      gap: 8,
                      marginTop: 8,
                    }}
                  >
                    {actionsToRenderFinal.slice(0, 6).map((a, idx) => {
                      const normalizedPriority = normalizeM5Priority(a.priority);
                      const pill = priorityPill(normalizedPriority);

                      return (
                        <div
                          key={`${a.title ?? "accion"}-${idx}`}
                          style={{
                            borderRadius: 12,
                            border: TOKENS.BORDER_DEFAULT,
                            background: "#ffffff",
                            padding: 10,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              gap: 10,
                              alignItems: "flex-start",
                              marginBottom: a.reason ? 6 : 0,
                            }}
                          >
                            <div
                              style={{
                                fontWeight: 800,
                                color: "#111827",
                                fontSize: "0.9rem",
                                lineHeight: 1.2,
                              }}
                            >
                              {a.title ?? "Acción sugerida"}
                            </div>

                            <span
                              style={{
                                padding: "2px 8px",
                                borderRadius: 999,
                                fontSize: "0.72rem",
                                fontWeight: 800,
                                background: pill.bg,
                                color: pill.color,
                                border: pill.border,
                                textTransform: "uppercase",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {pill.label}
                            </span>
                          </div>

                          {a.reason && (
                            <div
                              style={{
                                fontSize: "0.82rem",
                                color: "#374151",
                              }}
                            >
                              {a.reason}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}