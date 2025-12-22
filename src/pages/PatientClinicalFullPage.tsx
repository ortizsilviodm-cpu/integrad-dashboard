/* integrad-dashboard/src/pages/PatientClinicalFullPage.tsx */

import { useEffect, useMemo, useState } from "react";

import ClinicalRiskCards from "../views/patientClinical/ClinicalRiskCards";
import PatientIdentityCard from "../views/patientClinical/PatientIdentityCard";
import PatientProgramAdherenceCard from "../views/patientClinical/PatientProgramAdherenceCard";
import PatientClinicalHeader from "../views/patientClinical/PatientClinicalHeader";

import { MiniTrendSparkline } from "../utils/patientClinical/sparkline";
import {
  buildSeriesByCode,
  getLastValueForCode,
} from "../utils/patientClinical/history";
import { formatIsoDateTime } from "../utils/patientClinical/formatters";

import type { PatientRow } from "../api/patients";
import {
  fetchPatientSummary,
  fetchClinicalRiskSummary,
  type PatientSummaryResponse,
  type ClinicalRiskSummary,
  type ClinicalValue,
} from "../api/patientSummary";
import {
  fetchPatientMedications,
  type PatientMedicationRow,
  fetchPatientRiskSnapshot,
  type PatientRiskSnapshot,
  type M5SuggestedAction,
  type M5SuggestedActionPriority,
} from "../api/patients";
import AddClinicalIndicatorModal from "../components/clinical/AddClinicalIndicatorModal";
import {
  fetchClinicalHistory,
  type ClinicalIndicatorHistoryRow,
} from "../api/clinicalHistory";
import { fetchPatientAlerts, type PatientAlertRow } from "../api/alerts";

interface PatientClinicalFullPageProps {
  patient: PatientRow;
  onClose: () => void;
}

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

/**
 * Normaliza la prioridad por si el backend manda strings inesperados.
 */
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

function formatFlagLabel(key: string): string {
  switch (key) {
    case "dataIncomplete":
      return "Datos incompletos";
    case "needsContact":
      return "Requiere contacto";
    case "needsClinicalReview":
      return "Revisión clínica";
    case "highPriorityCaseload":
      return "Prioridad caseload";
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
        label: "Prioridad caseload",
        bg: "#f3f4f6",
        color: "#111827",
        border: "1px solid #e5e7eb",
      };
    default:
      return {
        label: formatFlagLabel(flagKey),
        bg: "#f3f4f6",
        color: "#6b7280",
        border: "1px solid #e5e7eb",
      };
  }
}

function secondaryButtonStyle(isEnabled: boolean) {
  return {
    border: "1px solid #e5e7eb",
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
    border: "1px solid #e5e7eb",
  };
}

export default function PatientClinicalFullPage({
  patient,
  onClose,
}: PatientClinicalFullPageProps) {
  const [summary, setSummary] = useState<PatientSummaryResponse | null>(null);
  const [risk, setRisk] = useState<ClinicalRiskSummary | null>(null);
  const [medications, setMedications] = useState<PatientMedicationRow[]>([]);

  const [clinicalHistory, setClinicalHistory] = useState<
    ClinicalIndicatorHistoryRow[]
  >([]);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // Alertas clínicas del paciente
  const [alerts, setAlerts] = useState<PatientAlertRow[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [alertsError, setAlertsError] = useState<string | null>(null);

  // M5 Snapshot
  const [m5Snapshot, setM5Snapshot] = useState<PatientRiskSnapshot | null>(
    null
  );
  const [m5Loading, setM5Loading] = useState(false);
  const [m5Error, setM5Error] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [medLoading, setMedLoading] = useState(false);
  const [medError, setMedError] = useState<string | null>(null);

  const [reloadFlag, setReloadFlag] = useState(0);

  const [showAddIndicatorModal, setShowAddIndicatorModal] =
    useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setHistoryError(null);

      try {
        const [summaryRes, riskRes, historyRes] = await Promise.all([
          fetchPatientSummary(patient.id),
          fetchClinicalRiskSummary(patient.id),
          fetchClinicalHistory(patient.id),
        ]);

        if (cancelled) return;

        if (!summaryRes.ok) {
          setError(summaryRes.error);
          setLoading(false);
          return;
        }
        setSummary(summaryRes.data);

        if (riskRes.ok) {
          setRisk(riskRes.data);
        } else {
          setRisk(null);
          setError(riskRes.error);
        }

        if (historyRes.ok) {
          setClinicalHistory(historyRes.data ?? []);
          setHistoryError(null);
        } else {
          setClinicalHistory([]);
          setHistoryError(
            historyRes.error ?? "No se pudo cargar el historial clínico."
          );
        }
      } catch (_err) {
        if (!cancelled) {
          setError("No se pudo cargar la ficha del paciente.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [patient.id, reloadFlag]);

  useEffect(() => {
    let cancelled = false;

    async function loadM5() {
      setM5Loading(true);
      setM5Error(null);

      const res = await fetchPatientRiskSnapshot({
        patientId: patient.id,
        windowDays: 90,
        modelVersion: "m5_v1",
      });

      if (cancelled) return;

      if (!res.ok) {
        setM5Snapshot(null);
        setM5Error(res.error ?? "No se pudo cargar el snapshot M5.");
      } else {
        setM5Snapshot(res.data);
      }

      setM5Loading(false);
    }

    loadM5();

    return () => {
      cancelled = true;
    };
  }, [patient.id, reloadFlag]);

  useEffect(() => {
    async function loadMeds() {
      setMedLoading(true);
      setMedError(null);
      const res = await fetchPatientMedications(patient.id);
      if (res.ok) setMedications(res.data);
      else setMedError(res.error ?? "No se pudo cargar la medicación.");
      setMedLoading(false);
    }

    loadMeds();
  }, [patient.id]);

  useEffect(() => {
    let cancelled = false;

    async function loadAlerts() {
      setAlertsLoading(true);
      setAlertsError(null);

      const res = await fetchPatientAlerts(patient.id, "open");

      if (cancelled) return;

      if (!res.ok) {
        setAlerts([]);
        setAlertsError(
          res.error ?? "No se pudieron cargar las alertas clínicas."
        );
      } else {
        setAlerts(res.data);
      }

      setAlertsLoading(false);
    }

    loadAlerts();

    return () => {
      cancelled = true;
    };
  }, [patient.id, reloadFlag]);

  const formatDate = (value?: string | null) => {
    if (!value) return "—";
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("es-AR");
  };

  const formatValue = (v?: ClinicalValue | null) => {
    if (!v) return "Sin dato";
    if (typeof v.valueNumeric === "number") {
      const num = Number.isInteger(v.valueNumeric)
        ? v.valueNumeric.toString()
        : v.valueNumeric.toFixed(1);
      return v.unit ? `${num} ${v.unit}` : num;
    }
    if (v.valueText) return v.valueText;
    return "Sin dato";
  };

  const riskLabel = (level?: "low" | "medium" | "high") => {
    switch (level) {
      case "low":
        return { label: "Bajo", color: "#16a34a", bg: "#dcfce7" };
      case "medium":
        return { label: "Moderado", color: "#92400e", bg: "#fef3c7" };
      case "high":
        return { label: "Alto", color: "#b91c1c", bg: "#fee2e2" };
      default:
        return { label: "Sin dato", color: "#6b7280", bg: "#f3f4f6" };
    }
  };

  const riskCard = (
    title: string,
    level?: "low" | "medium" | "high",
    helper?: string
  ) => {
    const info = riskLabel(level);
    return (
      <div
        style={{
          background: "#ffffff",
          borderRadius: 14,
          padding: 12,
          boxShadow: "0 4px 10px rgba(15,23,42,0.06)",
          display: "flex",
          flexDirection: "column",
          gap: 6,
          borderTop: `3px solid ${info.color}`,
        }}
      >
        <div style={{ fontSize: "0.9rem", color: "#111827", fontWeight: 600 }}>
          {title}
        </div>
        <span
          style={{
            alignSelf: "flex-start",
            padding: "3px 12px",
            borderRadius: 999,
            fontSize: "0.78rem",
            fontWeight: 700,
            color: info.color,
            backgroundColor: info.bg,
          }}
        >
          {info.label}
        </span>
        {helper && (
          <div
            style={{
              fontSize: "0.75rem",
              color: "#9ca3af",
              marginTop: 2,
            }}
          >
            {helper}
          </div>
        )}
      </div>
    );
  };

  const renderAlertSeverity = (
    label: string,
    severityCode?: PatientAlertRow["severityCode"]
  ) => {
    let bg = "#e5e7eb";
    let color = "#374151";
    let border: string | undefined;

    switch (severityCode) {
      case "low":
        bg = "#e0f2fe";
        color = "#0369a1";
        break;
      case "medium":
        bg = "#fef3c7";
        color = "#92400e";
        break;
      case "high":
        bg = "#fee2e2";
        color = "#b91c1c";
        border = "1px solid rgba(185,28,28,0.4)";
        break;
      case "critical":
        bg = "#b91c1c";
        color = "#ffffff";
        border = "1px solid #7f1d1d";
        break;
      default: {
        const t = label.toLowerCase();
        if (t.includes("baja")) {
          bg = "#e0f2fe";
          color = "#0369a1";
        } else if (t.includes("moderada")) {
          bg = "#fef3c7";
          color = "#92400e";
        } else if (t.includes("alta")) {
          bg = "#fee2e2";
          color = "#b91c1c";
        } else if (t.includes("crítica") || t.includes("critica")) {
          bg = "#b91c1c";
          color = "#ffffff";
        }
      }
    }

    return (
      <span
        style={{
          padding: "2px 8px",
          borderRadius: 999,
          fontSize: "0.72rem",
          fontWeight: 700,
          backgroundColor: bg,
          color,
          textTransform: "uppercase",
          border,
        }}
      >
        {label}
      </span>
    );
  };

  const alertsSummary = useMemo(() => {
    const summaryObj = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      total: alerts.length,
    };

    for (const a of alerts) {
      switch (a.severityCode) {
        case "critical":
          summaryObj.critical += 1;
          break;
        case "high":
          summaryObj.high += 1;
          break;
        case "medium":
          summaryObj.medium += 1;
          break;
        case "low":
          summaryObj.low += 1;
          break;
        default:
          break;
      }
    }

    return summaryObj;
  }, [alerts]);

  const historySeriesByCode = useMemo(
    () => buildSeriesByCode(clinicalHistory),
    [clinicalHistory]
  );

  const lastHba1cHistory = useMemo(
    () => getLastValueForCode(clinicalHistory, "HBA1C"),
    [clinicalHistory]
  );
  const lastGlucoseHistory = useMemo(
    () => getLastValueForCode(clinicalHistory, "GLUCOSE_FASTING"),
    [clinicalHistory]
  );
  const lastBpSysHistory = useMemo(
    () => getLastValueForCode(clinicalHistory, "SYSTOLIC_BP"),
    [clinicalHistory]
  );
  const lastBpDiaHistory = useMemo(
    () => getLastValueForCode(clinicalHistory, "DIASTOLIC_BP"),
    [clinicalHistory]
  );
  const lastBmiHistory = useMemo(
    () => getLastValueForCode(clinicalHistory, "BMI"),
    [clinicalHistory]
  );
  const lastMicroHistory = useMemo(
    () => getLastValueForCode(clinicalHistory, "MICROALBUMINURIA"),
    [clinicalHistory]
  );
  const lastProteinHistory = useMemo(
    () => getLastValueForCode(clinicalHistory, "PROTEINURIA"),
    [clinicalHistory]
  );
  const lastSmokingHistory = useMemo(
    () => getLastValueForCode(clinicalHistory, "SMOKING_STATUS"),
    [clinicalHistory]
  );

  const hasAnyHistory = clinicalHistory.length > 0;

  const m5SuggestedActions: M5SuggestedAction[] = useMemo(() => {
    return m5Snapshot?.suggestedActions ?? [];
  }, [m5Snapshot]);

  const fallbackSuggestedAction = useMemo<M5SuggestedAction | null>(() => {
    if (!m5Snapshot) return null;
    const hasActions = (m5Snapshot.suggestedActions ?? []).length > 0;
    if (hasActions) return null;

    if (m5Snapshot.flags?.dataIncomplete) {
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
  }, [m5Snapshot]);

  const actionsToRender = useMemo<M5SuggestedAction[]>(() => {
    if (m5SuggestedActions.length > 0) return m5SuggestedActions;
    return fallbackSuggestedAction ? [fallbackSuggestedAction] : [];
  }, [m5SuggestedActions, fallbackSuggestedAction]);

  const m5ActiveFlags = useMemo(() => {
    const f = m5Snapshot?.flags ?? {};
    return Object.entries(f)
      .filter(([, v]) => Boolean(v))
      .map(([k]) => k);
  }, [m5Snapshot]);

  const m5DataIncomplete = Boolean(m5Snapshot?.flags?.dataIncomplete);

  const syntheticFallbackActions = useMemo<M5SuggestedAction[]>(() => {
    if (!m5Snapshot) return [];
    const hasActions = (m5Snapshot.suggestedActions ?? []).length > 0;
    if (hasActions) return [];
    if (!m5DataIncomplete) return [];

    const list: M5SuggestedAction[] = [];

    if (m5Snapshot.flags?.needsContact) {
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
  }, [m5Snapshot, m5DataIncomplete]);

  const actionsToRenderFinal = useMemo<M5SuggestedAction[]>(() => {
    if (actionsToRender.length > 0) return actionsToRender;
    if (syntheticFallbackActions.length > 0) return syntheticFallbackActions;
    return [];
  }, [actionsToRender, syntheticFallbackActions]);

  if (loading) {
    return (
      <section className="app-table">
        <p>Cargando ficha clínica del paciente…</p>
      </section>
    );
  }

  if (!summary) {
    return (
      <section className="app-table">
        <p className="table-error">
          {error ?? "No se pudo cargar la ficha del paciente."}
        </p>
      </section>
    );
  }

  const { patient: p, adherence, kpis90d } = summary;
  const m5Badge = riskLevelLabel(m5Snapshot?.riskLevel);

  return (
    <section className="app-table">
      <PatientClinicalHeader onClose={onClose} />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 0.8fr",
          gap: 16,
          marginBottom: 16,
        }}
      >
        <PatientIdentityCard patient={p} />
        <PatientProgramAdherenceCard adherence={adherence} kpis90d={kpis90d} />
      </div>

      <ClinicalRiskCards risk={risk} />

      <div
        style={{
          background: "#ffffff",
          borderRadius: 16,
          padding: 16,
          boxShadow: "0 4px 12px rgba(15,23,42,0.06)",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
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
            <p style={{ margin: 0, fontSize: "0.8rem", color: "#6b7280" }}>
              Snapshot calculado para priorizar seguimiento (clínico, adherencia
              y operativo).
            </p>
          </div>

          <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>
            {m5Loading
              ? "Cargando…"
              : m5Snapshot?.generatedAt
              ? `Actualizado: ${formatIsoDateTime(m5Snapshot.generatedAt)}`
              : "Sin snapshot"}
          </span>
        </div>

        {m5Error && (
          <p style={{ color: "#b91c1c", fontSize: "0.85rem" }}>{m5Error}</p>
        )}

        {!m5Loading && !m5Error && !m5Snapshot && (
          <p style={{ color: "#6b7280", fontSize: "0.85rem" }}>
            Aún no hay snapshot M5 disponible para este paciente.
          </p>
        )}

        {!m5Loading && !m5Error && m5Snapshot && (
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
                  border: "1px solid #e5e7eb",
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
                    <strong>Score:</strong> {m5Snapshot.riskScore}
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
                  <div
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: 12,
                      padding: 10,
                    }}
                  >
                    <div style={{ color: "#6b7280", fontSize: "0.75rem" }}>
                      Clínico
                    </div>
                    <div style={{ fontWeight: 800, fontSize: "1.05rem" }}>
                      {m5Snapshot.clinicalRisk}
                    </div>
                  </div>
                  <div
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: 12,
                      padding: 10,
                    }}
                  >
                    <div style={{ color: "#6b7280", fontSize: "0.75rem" }}>
                      Adherencia
                    </div>
                    <div style={{ fontWeight: 800, fontSize: "1.05rem" }}>
                      {m5Snapshot.adherenceRisk}
                    </div>
                  </div>
                  <div
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: 12,
                      padding: 10,
                    }}
                  >
                    <div style={{ color: "#6b7280", fontSize: "0.75rem" }}>
                      Operativo
                    </div>
                    <div style={{ fontWeight: 800, fontSize: "1.05rem" }}>
                      {m5Snapshot.operationalRisk}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 10, fontSize: "0.8rem" }}>
                  <div style={{ color: "#6b7280", marginBottom: 6 }}>
                    Señales detectadas
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 18, color: "#0f172a" }}>
                    {m5Snapshot.reasons.slice(0, 5).map((r, i) => (
                      <li key={`${r}-${i}`}>{r}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div
                style={{
                  border: "1px solid #e5e7eb",
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
                    Calidad del snapshot
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "#6b7280" }}>
                    Estado operativo para caseload
                  </div>
                </div>

                <div style={{ fontSize: "0.85rem", color: "#111827" }}>
                  <p style={{ margin: "6px 0" }}>
                    <strong>Ventana:</strong> {m5Snapshot.windowDays} días ·{" "}
                    <strong>Modelo:</strong> {m5Snapshot.modelVersion}
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
                            m5Snapshot.dataCompleteness.readingsPresent
                          ),
                        },
                        {
                          label: "Dispensas",
                          present: Boolean(
                            m5Snapshot.dataCompleteness.dispensesSignal
                          ),
                        },
                        {
                          label: "Alertas",
                          present: Boolean(
                            m5Snapshot.dataCompleteness.alertsSignal
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
                    <div style={{ fontSize: "0.78rem", color: "#6b7280" }}>
                      {m5ActiveFlags.length === 0
                        ? "Sin flags activos"
                        : `${m5ActiveFlags.length} activo(s)`}
                    </div>
                  </div>

                  {m5ActiveFlags.length === 0 ? (
                    <div
                      style={{
                        borderRadius: 12,
                        border: "1px solid #e5e7eb",
                        padding: 10,
                        background: "#f9fafb",
                        color: "#6b7280",
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

                <div style={{ marginTop: 12 }}>
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
                    style={{ margin: 0, fontSize: "0.78rem", color: "#6b7280" }}
                  >
                    “Botones de apoyo para el equipo. Por el momento no ejecutan acciones reales; 
                    se habilitarán cuando esté listo el sistema de tareas.”
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
                      disabled={!m5Snapshot.flags?.needsClinicalReview}
                      onClick={() => {
                        // UI-only: pendiente implementación workflow.
                      }}
                      style={secondaryButtonStyle(
                        Boolean(m5Snapshot.flags?.needsContact)
                      )}
                      title={
                        m5Snapshot.flags?.needsContact
                          ? "Disponible — ejecución pendiente del sistema de tareas"
                          : "No aplica para este snapshot"
                      }
                    >
                      Crear tarea de contacto
                    </button>

                    <button
                      type="button"
                      disabled={!m5Snapshot.flags?.needsClinicalReview}
                      onClick={() => {
                        // UI-only: pendiente implementación workflow.
                      }}
                      style={secondaryButtonStyle(
                        Boolean(m5Snapshot.flags?.dataIncomplete)
                      )}
                      title={
                        m5Snapshot.flags?.dataIncomplete
                          ? "Disponible — ejecución pendiente del sistema de tareas"
                          : "No disponible con los datos actuales"
                      }
                    >
                      Solicitar lecturas
                    </button>

                    <button
                      type="button"
                      disabled={!m5Snapshot.flags?.needsClinicalReview}
                      onClick={() => {
                        // UI-only: pendiente implementación workflow.
                      }}
                      style={secondaryButtonStyle(
                        Boolean(m5Snapshot.flags?.needsClinicalReview)
                      )}
                      title={
                        m5Snapshot.flags?.needsClinicalReview
                          ? "Disponible — ejecución pendiente del sistema de tareas"
                          : "No disponible por condición del paciente"
                      }
                    >
                      Derivar a revisión
                    </button>

                    <button
                      type="button"
                      disabled={!m5Snapshot.flags?.needsClinicalReview}
                      onClick={() => {
                        // UI-only: pendiente implementación workflow.
                      }}
                      style={secondaryButtonStyle(
                        Boolean(m5Snapshot.flags?.highPriorityCaseload)
                      )}
                      title={
                        m5Snapshot.flags?.highPriorityCaseload
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
                    borderTop: "1px solid #e5e7eb",
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
                    style={{ margin: 0, fontSize: "0.78rem", color: "#6b7280" }}
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
                        border: "1px solid #e5e7eb",
                        background: "#f9fafb",
                        color: "#6b7280",
                        fontSize: "0.85rem",
                      }}
                    >
                      No hay acciones sugeridas para este paciente en esta
                      ventana.
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
                        const normalizedPriority = normalizeM5Priority(
                          a.priority
                        );
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
      </div>

      {/* Indicadores recientes + KPIs 90 días */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.4fr 0.8fr",
          gap: 16,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            background: "#ffffff",
            borderRadius: 16,
            padding: 16,
            boxShadow: "0 4px 12px rgba(15,23,42,0.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <h3
              style={{
                marginTop: 0,
                marginBottom: 0,
                fontSize: "1rem",
                fontWeight: 600,
                color: "#111827",
              }}
            >
              Indicadores clínicos recientes
            </h3>

            <button
              type="button"
              onClick={() => setShowAddIndicatorModal(true)}
              style={{
                border: "1px solid #2563eb",
                borderRadius: 999,
                padding: "4px 10px",
                cursor: "pointer",
                background: "#2563eb",
                color: "#ffffff",
                fontSize: "0.8rem",
                fontWeight: 600,
              }}
            >
              Registrar indicador
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 10,
              fontSize: "0.85rem",
            }}
          >
            <div>
              <strong>HbA1c:</strong> {formatValue(risk?.lastValues.hba1c)}
            </div>
            <div>
              <strong>Glucemia en ayunas:</strong>{" "}
              {formatValue(risk?.lastValues.glucoseFasting)}
            </div>
            <div>
              <strong>PA:</strong> {formatValue(risk?.lastValues.bloodPressure)}
            </div>
            <div>
              <strong>Triglicéridos:</strong>{" "}
              {formatValue(risk?.lastValues.triglycerides)}
            </div>
            <div>
              <strong>Colesterol total:</strong>{" "}
              {formatValue(risk?.lastValues.totalCholesterol)}
            </div>
            <div>
              <strong>IMC:</strong> {formatValue(risk?.lastValues.bmi)}
            </div>
            <div>
              <strong>Microalbuminuria:</strong>{" "}
              {formatValue(risk?.lastValues.microalbuminuria)}
            </div>
            <div>
              <strong>Proteinuria:</strong>{" "}
              {formatValue(risk?.lastValues.proteinuria)}
            </div>
            <div>
              <strong>Tabaquismo:</strong>{" "}
              {formatValue(risk?.lastValues.smokingStatus)}
            </div>
            <div>
              <strong>Años desde diagnóstico:</strong>{" "}
              {formatValue(risk?.lastValues.yearsSinceDiagnosis)}
            </div>
          </div>
        </div>

        <div
          style={{
            background: "#ffffff",
            borderRadius: 16,
            padding: 16,
            boxShadow: "0 4px 12px rgba(15,23,42,0.06)",
            fontSize: "0.85rem",
          }}
        >
          <h3
            style={{
              marginTop: 0,
              marginBottom: 10,
              fontSize: "1rem",
              fontWeight: 600,
              color: "#111827",
            }}
          >
            Actividad 90 días
          </h3>
          <p>
            <strong>Lecturas de glucosa:</strong> {kpis90d.readings}
          </p>
          <p>
            <strong>Episodios ambulatorios:</strong>{" "}
            {kpis90d.ambulatoryEpisodes}
          </p>
          <p>
            <strong>Dispensas:</strong> {kpis90d.dispenses}
          </p>
          <p>
            <strong>Alertas generadas:</strong> {kpis90d.alerts}
          </p>
        </div>
      </div>

      {/* Alertas clínicas activas */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: 16,
          padding: 16,
          boxShadow: "0 4px 12px rgba(15,23,42,0.06)",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <h3
            style={{
              marginTop: 0,
              marginBottom: 0,
              fontSize: "1rem",
              fontWeight: 600,
              color: "#111827",
            }}
          >
            Alertas clínicas activas
          </h3>
          <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>
            {alertsLoading
              ? "Cargando alertas…"
              : alerts.length === 0
              ? "Sin alertas activas"
              : `${alerts.length} alerta(s) activa(s)`}
          </span>
        </div>

        {alertsError && (
          <p style={{ color: "#b91c1c", fontSize: "0.8rem" }}>{alertsError}</p>
        )}

        {!alertsLoading && !alertsError && alerts.length > 0 && (
          <>
            <div
              style={{
                display: "flex",
                gap: 12,
                marginBottom: 10,
                fontSize: "0.78rem",
              }}
            >
              <div
                style={{
                  padding: "6px 10px",
                  borderRadius: 10,
                  background: "#fee2e2",
                  color: "#7f1d1d",
                  fontWeight: 600,
                  minWidth: 90,
                }}
              >
                Críticas: {alertsSummary.critical}
              </div>
              <div
                style={{
                  padding: "6px 10px",
                  borderRadius: 10,
                  background: "#fee2e2",
                  color: "#b91c1c",
                  fontWeight: 600,
                  minWidth: 90,
                }}
              >
                Altas: {alertsSummary.high}
              </div>
              <div
                style={{
                  padding: "6px 10px",
                  borderRadius: 10,
                  background: "#fef3c7",
                  color: "#92400e",
                  fontWeight: 500,
                  minWidth: 110,
                }}
              >
                Moderadas: {alertsSummary.medium}
              </div>
              <div
                style={{
                  padding: "6px 10px",
                  borderRadius: 10,
                  background: "#e0f2fe",
                  color: "#0369a1",
                  fontWeight: 500,
                  minWidth: 90,
                }}
              >
                Bajas: {alertsSummary.low}
              </div>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "0.8rem",
                }}
              >
                <thead>
                  <tr
                    style={{
                      textAlign: "left",
                      borderBottom: "1px solid #e5e7eb",
                      background: "#f9fafb",
                    }}
                  >
                    <th style={{ padding: 6 }}>Tipo</th>
                    <th style={{ padding: 6 }}>Severidad</th>
                    <th style={{ padding: 6 }}>Título</th>
                    <th style={{ padding: 6 }}>Detalle</th>
                    <th style={{ padding: 6 }}>Detectada</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map((a, idx) => (
                    <tr
                      key={a.id}
                      style={{
                        background: idx % 2 === 0 ? "#ffffff" : "#f9fafb",
                      }}
                    >
                      <td style={{ padding: 6 }}>{a.kindLabel}</td>
                      <td style={{ padding: 6 }}>
                        {renderAlertSeverity(a.severityLabel, a.severityCode)}
                      </td>
                      <td style={{ padding: 6 }}>{a.title}</td>
                      <td style={{ padding: 6 }}>{a.description ?? "—"}</td>
                      <td style={{ padding: 6 }}>{a.detectedAtLabel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Historial clínico + tendencias */}
      <div
        style={{
          background: "#f9fafb",
          borderRadius: 18,
          padding: 18,
          boxShadow: "0 6px 18px rgba(15,23,42,0.06)",
          marginBottom: 16,
          border: "1px solid #e5e7eb",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: 8,
          }}
        >
          <div>
            <h3
              style={{
                marginTop: 0,
                marginBottom: 2,
                fontSize: "1.05rem",
                fontWeight: 600,
                color: "#111827",
              }}
            >
              Historial clínico y tendencias
            </h3>
            <p style={{ margin: 0, fontSize: "0.8rem", color: "#6b7280" }}>
              Evolución de los principales indicadores (HbA1c, glucemia, PA,
              IMC, función renal) a lo largo del tiempo.
            </p>
          </div>
        </div>

        {historyError && (
          <p style={{ color: "#b91c1c", fontSize: "0.85rem" }}>
            {historyError}
          </p>
        )}

        {!historyError && !hasAnyHistory && (
          <p style={{ color: "#6b7280", fontSize: "0.85rem" }}>
            Aún no hay historial de indicadores clínicos. Comenzá registrando
            HbA1c, glucemias, PA e IMC desde el botón “Registrar indicador”.
          </p>
        )}

        {!historyError && hasAnyHistory && (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
                gap: 12,
                marginBottom: 16,
                fontSize: "0.85rem",
              }}
            >
              <div
                style={{
                  borderRadius: 14,
                  border: "1px solid #fecaca",
                  padding: 10,
                  background: "#fef2f2",
                  boxShadow: "0 3px 10px rgba(248,113,113,0.25)",
                }}
              >
                <div style={{ fontWeight: 600, color: "#991b1b" }}>HbA1c</div>
                <div
                  style={{
                    fontSize: "1rem",
                    marginBottom: 4,
                    fontWeight: 700,
                    color: "#b91c1c",
                  }}
                >
                  {lastHba1cHistory?.valueNumber ?? "—"}{" "}
                  {lastHba1cHistory?.unit || "%"}
                </div>
                <MiniTrendSparkline
                  data={historySeriesByCode.get("HBA1C") ?? []}
                />
              </div>

              <div
                style={{
                  borderRadius: 14,
                  border: "1px solid #e5e7eb",
                  padding: 10,
                  background: "#ffffff",
                  boxShadow: "0 3px 8px rgba(15,23,42,0.06)",
                }}
              >
                <div style={{ fontWeight: 600 }}>Glucemia en ayunas</div>
                <div style={{ fontSize: "0.9rem", marginBottom: 4 }}>
                  <strong>
                    {lastGlucoseHistory?.valueNumber ?? "—"}{" "}
                    {lastGlucoseHistory?.unit || "mg/dL"}
                  </strong>
                </div>
                <MiniTrendSparkline
                  data={historySeriesByCode.get("GLUCOSE_FASTING") ?? []}
                />
              </div>

              <div
                style={{
                  borderRadius: 14,
                  border: "1px solid #e5e7eb",
                  padding: 10,
                  background: "#ffffff",
                  boxShadow: "0 3px 8px rgba(15,23,42,0.06)",
                }}
              >
                <div style={{ fontWeight: 600 }}>Presión arterial</div>
                <div style={{ fontSize: "0.9rem", marginBottom: 4 }}>
                  <strong>
                    {lastBpSysHistory?.valueNumber ?? "—"}/
                    {lastBpDiaHistory?.valueNumber ?? "—"} mmHg
                  </strong>
                </div>
                <MiniTrendSparkline
                  data={historySeriesByCode.get("SYSTOLIC_BP") ?? []}
                />
              </div>

              <div
                style={{
                  borderRadius: 14,
                  border: "1px solid #e5e7eb",
                  padding: 10,
                  background: "#ffffff",
                  boxShadow: "0 3px 8px rgba(15,23,42,0.06)",
                }}
              >
                <div style={{ fontWeight: 600 }}>IMC</div>
                <div style={{ fontSize: "0.9rem", marginBottom: 4 }}>
                  <strong>{lastBmiHistory?.valueNumber ?? "—"} kg/m²</strong>
                </div>
                <MiniTrendSparkline
                  data={historySeriesByCode.get("BMI") ?? []}
                />
              </div>

              <div
                style={{
                  borderRadius: 14,
                  border: "1px solid #e5e7eb",
                  padding: 10,
                  background: "#ffffff",
                  boxShadow: "0 3px 8px rgba(15,23,42,0.06)",
                }}
              >
                <div style={{ fontWeight: 600 }}>Microalbuminuria</div>
                <div style={{ fontSize: "0.9rem", marginBottom: 4 }}>
                  <strong>
                    {lastMicroHistory?.valueNumber ?? "—"}{" "}
                    {lastMicroHistory?.unit || ""}
                  </strong>
                </div>
                <MiniTrendSparkline
                  data={historySeriesByCode.get("MICROALBUMINURIA") ?? []}
                />
              </div>

              <div
                style={{
                  borderRadius: 14,
                  border: "1px solid #e5e7eb",
                  padding: 10,
                  background: "#ffffff",
                  boxShadow: "0 3px 8px rgba(15,23,42,0.06)",
                }}
              >
                <div style={{ fontWeight: 600 }}>Proteinuria</div>
                <div style={{ fontSize: "0.9rem", marginBottom: 4 }}>
                  <strong>
                    {lastProteinHistory?.valueNumber ?? "—"}{" "}
                    {lastProteinHistory?.unit || ""}
                  </strong>
                </div>
                <MiniTrendSparkline
                  data={historySeriesByCode.get("PROTEINURIA") ?? []}
                />
              </div>

              <div
                style={{
                  borderRadius: 14,
                  border: "1px solid #e5e7eb",
                  padding: 10,
                  background: "#ffffff",
                  boxShadow: "0 3px 8px rgba(15,23,42,0.06)",
                }}
              >
                <div style={{ fontWeight: 600 }}>Tabaquismo</div>
                <div style={{ fontSize: "0.9rem", marginBottom: 4 }}>
                  <strong>
                    {lastSmokingHistory?.valueText ?? "No registrado"}
                  </strong>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 4 }}>
              <h4
                style={{
                  margin: 0,
                  marginBottom: 6,
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  color: "#111827",
                }}
              >
                Detalle de mediciones
              </h4>
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "0.8rem",
                    background: "#ffffff",
                    borderRadius: 12,
                    overflow: "hidden",
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        textAlign: "left",
                        borderBottom: "1px solid #e5e7eb",
                        background: "#f3f4f6",
                      }}
                    >
                      <th style={{ padding: 6 }}>Fecha</th>
                      <th style={{ padding: 6 }}>Indicador</th>
                      <th style={{ padding: 6 }}>Valor</th>
                      <th style={{ padding: 6 }}>Unidad</th>
                      <th style={{ padding: 6 }}>Origen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clinicalHistory
                      .slice()
                      .sort(
                        (a, b) =>
                          new Date(b.measuredAt).getTime() -
                          new Date(a.measuredAt).getTime()
                      )
                      .map((row, idx) => (
                        <tr
                          key={row.id}
                          style={{
                            background: idx % 2 === 0 ? "#ffffff" : "#f9fafb",
                          }}
                        >
                          <td style={{ padding: 6 }}>
                            {new Date(row.measuredAt).toLocaleDateString(
                              "es-AR"
                            )}
                          </td>
                          <td style={{ padding: 6 }}>{row.label}</td>
                          <td style={{ padding: 6 }}>
                            {row.valueNumber ?? row.valueText ?? "—"}
                          </td>
                          <td style={{ padding: 6 }}>{row.unit ?? "—"}</td>
                          <td style={{ padding: 6 }}>
                            {row.source ?? "Manual"}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Tratamiento farmacológico actual */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: 16,
          padding: 16,
          boxShadow: "0 4px 12px rgba(15,23,42,0.06)",
        }}
      >
        <h3
          style={{
            marginTop: 0,
            marginBottom: 10,
            fontSize: "1rem",
            fontWeight: 600,
            color: "#111827",
          }}
        >
          Tratamiento farmacológico actual
        </h3>

        {medLoading && <p>Cargando medicación…</p>}
        {medError && <p style={{ color: "#b91c1c" }}>{medError}</p>}

        {!medLoading && medications.length === 0 && !medError && (
          <p style={{ color: "#6b7280", fontSize: "0.9rem" }}>
            No hay tratamientos farmacológicos cargados.
          </p>
        )}

        {!medLoading && medications.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.85rem",
              }}
            >
              <thead>
                <tr
                  style={{
                    textAlign: "left",
                    borderBottom: "1px solid #e5e7eb",
                    background: "#f3f4f6",
                  }}
                >
                  <th style={{ padding: 6 }}>Medicamento</th>
                  <th style={{ padding: 6 }}>Tipo</th>
                  <th style={{ padding: 6 }}>Dosis</th>
                  <th style={{ padding: 6 }}>Frecuencia</th>
                  <th style={{ padding: 6 }}>Inicio</th>
                  <th style={{ padding: 6 }}>Fin</th>
                  <th style={{ padding: 6 }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {medications.map((m, idx) => (
                  <tr
                    key={m.id}
                    style={{
                      background: idx % 2 === 0 ? "#ffffff" : "#f9fafb",
                    }}
                  >
                    <td style={{ padding: 6 }}>
                      {m.medicationName} ({m.medicationCode})
                    </td>
                    <td style={{ padding: 6 }}>
                      {m.type === "CRONICO" ? "Crónico" : "Ocasional"}
                    </td>
                    <td style={{ padding: 6 }}>{m.dose}</td>
                    <td style={{ padding: 6 }}>{m.frequency}</td>
                    <td style={{ padding: 6 }}>{formatDate(m.startDate)}</td>
                    <td style={{ padding: 6 }}>{formatDate(m.endDate)}</td>
                    <td style={{ padding: 6 }}>
                      {m.isActive ? "Activo" : "Finalizado"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddIndicatorModal && (
        <AddClinicalIndicatorModal
          patientId={patient.id}
          onClose={() => setShowAddIndicatorModal(false)}
          onSuccess={() => {
            setShowAddIndicatorModal(false);
            setReloadFlag((n) => n + 1);
          }}
        />
      )}
    </section>
  );
}
