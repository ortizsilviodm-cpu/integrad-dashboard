// integrad-dashboard/src/views/patientClinical/M5SuggestedActionsPanel.tsx

import { useMemo } from "react";
import type {
  M5SuggestedAction,
  M5SuggestedActionPriority,
  PatientRiskSnapshot,
} from "../../api/patients";

function normalizeM5Priority(
  p?: unknown
): M5SuggestedActionPriority | undefined {
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
        label: "SIN PRIORIDAD",
        bg: "#f3f4f6",
        color: "#6b7280",
        border: "1px solid #e5e7eb",
      };
  }
}

export default function M5SuggestedActionsPanel({
  snapshot,
}: {
  snapshot: PatientRiskSnapshot;
}) {
  const m5SuggestedActions: M5SuggestedAction[] = useMemo(() => {
    return snapshot.suggestedActions ?? [];
  }, [snapshot]);

  const fallbackSuggestedAction = useMemo<M5SuggestedAction | null>(() => {
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

  const m5DataIncomplete = Boolean(snapshot.flags?.dataIncomplete);

  const syntheticFallbackActions = useMemo<M5SuggestedAction[]>(() => {
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

  return (
    <div>
      <div style={{ fontWeight: 800, marginBottom: 6, color: "#111827" }}>
        Acciones sugeridas por IA
      </div>
      <p style={{ margin: 0, fontSize: "0.78rem", color: "#6b7280" }}>
        Sugerencias para guiar la gestión clínica y operativa. No ejecutan
        acciones automáticamente.
      </p>

      {actionsToRenderFinal.length === 0 ? (
        <div
          style={{
            marginTop: 8,
            padding: 10,
            borderRadius: 12,
            border: "1px solid #e5e7eb",
            background: "#f9fafb",
            color: "#6b7280",
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
                  border: "1px solid #e5e7eb",
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
                  <div style={{ fontSize: "0.82rem", color: "#374151" }}>
                    {a.reason}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
