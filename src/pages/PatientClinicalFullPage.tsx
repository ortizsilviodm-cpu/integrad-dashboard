/* integrad-dashboard/src/pages/PatientClinicalFullPage.tsx */

import { useEffect, useMemo, useState } from "react";
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
} from "../api/patients";
import AddClinicalIndicatorModal from "../components/clinical/AddClinicalIndicatorModal";
import {
  fetchClinicalHistory,
  type ClinicalIndicatorHistoryRow,
  type ClinicalIndicatorCode,
} from "../api/clinicalHistory";
import {
  fetchPatientAlerts,
  type PatientAlertRow,
} from "../api/alerts";

interface PatientClinicalFullPageProps {
  patient: PatientRow;
  onClose: () => void;
}

/**
 * Punto para minigráfico de tendencia (sparkline).
 */
interface SparklinePoint {
  timestamp: string;
  value: number;
}

interface MiniTrendSparklineProps {
  data: SparklinePoint[];
  width?: number;
  height?: number;
}

/**
 * Códigos que usamos para series en esta vista.
 * Extendemos el ClinicalIndicatorCode original para incluir PA sistólica/diastólica.
 */
type SeriesCode = ClinicalIndicatorCode | "SYSTOLIC_BP" | "DIASTOLIC_BP";

/**
 * Mini gráfico de línea muy simple para mostrar tendencia.
 * Sin librerías externas, solo SVG.
 */
function MiniTrendSparkline({
  data,
  width = 120,
  height = 40,
}: MiniTrendSparklineProps) {
  if (!data || data.length === 0) {
    return (
      <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>Sin datos</div>
    );
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

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      style={{ display: "block" }}
    >
      <polyline
        points={pathPoints}
        fill="none"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {points.length > 0 && (
        <circle
          cx={Number(points[points.length - 1].split(",")[0])}
          cy={Number(points[points.length - 1].split(",")[1])}
          r={2}
        />
      )}
    </svg>
  );
}

/**
 * Agrupa el historial por código de indicador y arma las series de tendencia.
 */
function buildSeriesByCode(history: ClinicalIndicatorHistoryRow[]) {
  const byCode = new Map<SeriesCode, SparklinePoint[]>();

  history
    .filter((row) => row.valueNumber !== null && row.valueNumber !== undefined)
    .sort(
      (a, b) =>
        new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime()
    )
    .forEach((row) => {
      const existing = byCode.get(row.code as SeriesCode) ?? [];
      existing.push({
        timestamp: row.measuredAt,
        value: row.valueNumber as number,
      });
      byCode.set(row.code as SeriesCode, existing);
    });

  return byCode;
}

/**
 * Devuelve el último registro de un indicador dado.
 */
function getLastValueForCode(
  history: ClinicalIndicatorHistoryRow[],
  code: SeriesCode
) {
  const filtered = history
    .filter((row) => row.code === code)
    .sort(
      (a, b) =>
        new Date(b.measuredAt).getTime() - new Date(a.measuredAt).getTime()
    );
  return filtered[0] ?? null;
}

/**
 * Ficha clínica completa del paciente:
 * - Datos básicos + cobertura + programa crónico
 * - Tarjetas de riesgo clínico (micro/macro)
 * - Últimos indicadores relevantes
 * - Historial clínico + tendencias
 * - KPIs 90 días
 * - Alertas clínicas activas
 * - Tratamiento farmacológico actual
 */
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

  // 🔔 Alertas clínicas del paciente
  const [alerts, setAlerts] = useState<PatientAlertRow[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [alertsError, setAlertsError] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [medLoading, setMedLoading] = useState(false);
  const [medError, setMedError] = useState<string | null>(null);

  // Para poder forzar recarga del resumen/riesgo (y ahora historial + alertas)
  // después de cargar un indicador
  const [reloadFlag, setReloadFlag] = useState(0);

  // Modal "Registrar indicador clínico"
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

        // Summary
        if (!summaryRes.ok) {
          setError(summaryRes.error);
          setLoading(false);
          return;
        }
        setSummary(summaryRes.data);

        // Riesgo
        if (riskRes.ok) {
          setRisk(riskRes.data);
        } else {
          setRisk(null);
          setError(riskRes.error);
        }

        // Historial clínico
        if (historyRes.ok) {
          setClinicalHistory(historyRes.data ?? []);
          setHistoryError(null);
        } else {
          setClinicalHistory([]);
          setHistoryError(
            historyRes.error ?? "No se pudo cargar el historial clínico."
          );
        }
      } catch (err) {
        console.error("Error cargando ficha clínica completa:", err);
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

  // 🔔 Carga de alertas clínicas por paciente
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

  // Pill de severidad de alerta (usa severityCode para marcar más fuerte Alta/Crítica)
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
        // Fallback por texto, por si viene algo raro del backend
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

  // Resumen de alertas por severidad (para el contador arriba de la tabla)
  const alertsSummary = useMemo(
    () => {
      const summary = {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        total: alerts.length,
      };

      for (const a of alerts) {
        switch (a.severityCode) {
          case "critical":
            summary.critical += 1;
            break;
          case "high":
            summary.high += 1;
            break;
          case "medium":
            summary.medium += 1;
            break;
          case "low":
            summary.low += 1;
            break;
          default:
            break;
        }
      }

      return summary;
    },
    [alerts]
  );

  // ---- Derivados del historial clínico ----
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

  return (
    <section className="app-table">
      {/* Header ficha completa */}
      <header className="section-header" style={{ marginBottom: 16 }}>
        <div>
          <h2
            style={{
              marginBottom: 4,
              fontSize: "1.4rem",
              fontWeight: 700,
              color: "#0f172a",
            }}
          >
            Ficha clínica del paciente
          </h2>
          <p
            className="chart-subtitle"
            style={{ maxWidth: 640, fontSize: "0.9rem" }}
          >
            Visión 360° del paciente diabético: datos básicos, riesgo clínico,
            indicadores recientes, historial, adherencia, alertas y tratamiento
            farmacológico.
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{
            border: "none",
            borderRadius: 999,
            padding: "6px 14px",
            cursor: "pointer",
            background: "#e5e7eb",
            fontWeight: 600,
            fontSize: "0.85rem",
          }}
        >
          ← Volver a la lista
        </button>
      </header>

      {/* Bloque principal: datos + programa */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 0.8fr",
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
          <h3
            style={{
              marginTop: 0,
              marginBottom: 8,
              fontSize: "1rem",
              fontWeight: 600,
              color: "#111827",
            }}
          >
            Datos del paciente
          </h3>
          <p>
            <strong>Nombre:</strong> {p.fullName}
          </p>
          <p>
            <strong>Documento:</strong> {p.documentNumber}
          </p>
          <p>
            <strong>Teléfono:</strong> {p.phone || "No registrado"}
          </p>
          <p>
            <strong>Obra social:</strong> {p.payerCode || "—"}{" "}
            {p.healthPlan ? `· ${p.healthPlan}` : ""}
          </p>
          <p>
            <strong>Nº afiliado:</strong> {p.membershipCode || "—"}
          </p>
        </div>

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
              marginBottom: 8,
              fontSize: "1rem",
              fontWeight: 600,
              color: "#111827",
            }}
          >
            Programa crónico y adherencia
          </h3>
          <p>
            <strong>Adherencia 90 días:</strong>{" "}
            {Number.isFinite(adherence.coveragePercent)
              ? `${adherence.coveragePercent.toFixed(0)} %`
              : "Sin dato"}
          </p>
          <p>
            <strong>Días de ventana:</strong> {adherence.daysWindow}
          </p>
          <p>
            <strong>Días en “bache” de medicación:</strong>{" "}
            {adherence.gapDays ?? "—"}
          </p>
          <p>
            <strong>Alertas en 90 días:</strong> {kpis90d.alerts}
          </p>
          <p>
            <strong>Dispensas en 90 días:</strong> {kpis90d.dispenses}
          </p>
        </div>
      </div>

      {/* Tarjetas de riesgo clínico */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 12,
          marginBottom: 16,
        }}
      >
        {riskCard("Riesgo de retinopatía", risk?.retinopathyRisk)}
        {riskCard("Riesgo renal", risk?.renalRisk)}
        {riskCard("Riesgo macrovascular", risk?.macrovascularRisk)}
        {riskCard("Riesgo neuropático", risk?.neuropathyRisk)}
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
            <strong>Episodios ambulatorios:</strong> {kpis90d.ambulatoryEpisodes}
          </p>
          <p>
            <strong>Dispensas:</strong> {kpis90d.dispenses}
          </p>
          <p>
            <strong>Alertas generadas:</strong> {kpis90d.alerts}
          </p>
        </div>
      </div>

      {/* 🔔 Alertas clínicas activas */}
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
            {/* Resumen de severidad */}
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
                      <td style={{ padding: 6 }}>
                        {a.description ?? "—"}
                      </td>
                      <td style={{ padding: 6 }}>{a.detectedAtLabel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* 🧾 Historial clínico + tendencias */}
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
            <p
              style={{
                margin: 0,
                fontSize: "0.8rem",
                color: "#6b7280",
              }}
            >
              Evolución de los principales indicadores (HbA1c, glucemia, PA,
              IMC, función renal) a lo largo del tiempo.
            </p>
          </div>
        </div>

        {historyError && (
          <p style={{ color: "#b91c1c", fontSize: "0.85rem" }}>{historyError}</p>
        )}

        {!historyError && !hasAnyHistory && (
          <p style={{ color: "#6b7280", fontSize: "0.85rem" }}>
            Aún no hay historial de indicadores clínicos. Comenzá registrando
            HbA1c, glucemias, PA e IMC desde el botón “Registrar indicador”.
          </p>
        )}

        {!historyError && hasAnyHistory && (
          <>
            {/* Resumen compacto con mini tendencias */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(190px, 1fr))",
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

            {/* Tabla detallada de mediciones */}
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
                            background:
                              idx % 2 === 0 ? "#ffffff" : "#f9fafb",
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

      {/* Modal para registrar indicador clínico */}
      {showAddIndicatorModal && (
        <AddClinicalIndicatorModal
          patientId={patient.id}
          onClose={() => setShowAddIndicatorModal(false)}
          onSuccess={() => {
            setShowAddIndicatorModal(false);
            // Recarga resumen, riesgo, historial y alertas
            setReloadFlag((n) => n + 1);
          }}
        />
      )}
    </section>
  );
}
