/* integrad-dashboard/src/pages/PatientDetailPage.tsx */

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import type { PatientRow } from "../api/patients";
import {
  fetchPharmaProfile,
  type PatientPharmaProfile,
} from "../api/pharmaProfile";

// ✅ Riesgo clínico resumido (endpoint /patients/:id/clinical-risk-summary)
import {
  fetchClinicalRiskSummary,
  type ClinicalRiskSummary,
} from "../api/patientSummary";

// Medicación asignada al paciente
import {
  fetchPatientMedications,
  type PatientMedicationRow,
} from "../api/patients";

// Modal externo
import AddMedicationModal from "../components/medications/AddMedicationModal";

interface PatientDetailPageProps {
  patient: PatientRow;
  onClose: () => void;
  onOpenPharmaDetail: (patient: PatientRow) => void;
  // 🆕 Abrir ficha clínica completa (visión 360°)
  onOpenClinicalDetail: (patient: PatientRow) => void;
}

export default function PatientDetailPage({
  patient,
  onClose,
  onOpenPharmaDetail,
  onOpenClinicalDetail,
}: PatientDetailPageProps) {
  const [pharma, setPharma] = useState<PatientPharmaProfile | null>(null);
  const [loadingPharma, setLoadingPharma] = useState<boolean>(false);
  const [pharmaError, setPharmaError] = useState<string | null>(null);

  const [medications, setMedications] = useState<PatientMedicationRow[]>([]);
  const [loadingMeds, setLoadingMeds] = useState<boolean>(false);
  const [medError, setMedError] = useState<string | null>(null);

  // Riesgo clínico resumido (retinopatía, renal, macro, neuro)
  const [clinicalRisk, setClinicalRisk] = useState<ClinicalRiskSummary | null>(
    null
  );
  const [loadingRisk, setLoadingRisk] = useState<boolean>(false);
  const [riskError, setRiskError] = useState<string | null>(null);

  // Modal “Agregar medicación”
  const [showAddMedicationModal, setShowAddMedicationModal] =
    useState<boolean>(false);

  /* ============================================================
   * 1) PERFIL FARMACOLÓGICO (dispensas)
   * ============================================================ */
  useEffect(() => {
    if (!patient.id) return;

    setLoadingPharma(true);
    setPharmaError(null);

    fetchPharmaProfile(patient.id, 365)
      .then((data) => setPharma(data))
      .catch(() => setPharmaError("No se pudo cargar el perfil farmacológico."))
      .finally(() => setLoadingPharma(false));
  }, [patient.id]);

  /* ============================================================
   * 2) MEDICACIÓN ACTUAL (prescripción)
   * ============================================================ */
  const reloadMedications = () => {
    if (!patient.id) return;

    setLoadingMeds(true);
    setMedError(null);

    fetchPatientMedications(patient.id)
      .then((res) => {
        if (res.ok) {
          setMedications(res.data);
        } else {
          setMedications([]);
          setMedError(res.error ?? "No se pudo cargar la medicación.");
        }
      })
      .catch(() => {
        setMedications([]);
        setMedError("No se pudo cargar la medicación del paciente.");
      })
      .finally(() => setLoadingMeds(false));
  };

  useEffect(() => {
    reloadMedications();
  }, [patient.id]);

  /* ============================================================
   * 3) RIESGO CLÍNICO (micro / macro / renal / neuro)
   * ============================================================ */
  useEffect(() => {
    if (!patient.id) return;

    setLoadingRisk(true);
    setRiskError(null);
    setClinicalRisk(null);

    fetchClinicalRiskSummary(patient.id)
      .then((res) => {
        if (res.ok) {
          setClinicalRisk(res.data);
        } else {
          setClinicalRisk(null);
          setRiskError(
            res.error || "No se pudo obtener el riesgo clínico del paciente."
          );
        }
      })
      .catch(() => {
        setClinicalRisk(null);
        setRiskError("No se pudo obtener el riesgo clínico del paciente.");
      })
      .finally(() => setLoadingRisk(false));
  }, [patient.id]);

  /* ============================================================
   * Helpers UI
   * ============================================================ */
  const formatDate = (value?: string | null) => {
    if (!value) return "—";
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("es-AR");
  };

  const buildPharmaSummary = () => {
  if (!pharma || pharma.drugs.length === 0) {
    return {
      totalDrugs: 0,
      chronicDrugs: 0,
      lastDispenseLabel: "—",
      anyLowAdherence: false,
    };
  }

  const totalDrugs = pharma.summary.totalDrugs;
  const chronicDrugs = pharma.summary.chronicDrugs;

  let lastDate: Date | null = null;

  for (const d of pharma.drugs) {
    if (!d.lastDispenseDate) continue; // FIX: evitar 1970 o invalid dates

    const current = new Date(d.lastDispenseDate);
    if (!Number.isNaN(current.getTime())) {
      if (!lastDate || current > lastDate) {
        lastDate = current;
      }
    }
  }

  const lastDispenseLabel = lastDate
    ? lastDate.toLocaleDateString("es-AR")
    : "—";

  const anyLowAdherence = pharma.drugs.some(
    (d) => (d.adherencePercentApprox ?? 0) < 60
  );

  return {
    totalDrugs,
    chronicDrugs,
    lastDispenseLabel,
    anyLowAdherence,
  };
};


  const pharmaSummary = buildPharmaSummary();

  // Badge de riesgo (bajo / medio / alto)
  const riskBadgeStyle = (
    level: "low" | "medium" | "high" | null | undefined
  ): CSSProperties => {
    const base: CSSProperties = {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "2px 10px",
      borderRadius: 999,
      fontSize: "0.75rem",
      fontWeight: 600,
    };

    if (!level) {
      return {
        ...base,
        background: "#e5e7eb",
        color: "#4b5563",
      };
    }

    if (level === "low") {
      return {
        ...base,
        background: "#dcfce7",
        color: "#166534",
      };
    }
    if (level === "medium") {
      return {
        ...base,
        background: "#fef9c3",
        color: "#92400e",
      };
    }
    // high
    return {
      ...base,
      background: "#fee2e2",
      color: "#b91c1c",
    };
  };

  const riskLabel = (
    level: "low" | "medium" | "high" | null | undefined
  ): string => {
    if (!level) return "Sin dato";
    if (level === "low") return "Bajo";
    if (level === "medium") return "Medio";
    return "Alto";
  };

  /* ============================================================
   * RENDER
   * ============================================================ */
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.35)",
        backdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#f9fafb",
          borderRadius: 16,
          padding: 24,
          maxWidth: 900,
          width: "90%",
          boxShadow: "0 10px 40px rgba(0,0,0,0.18)",
          maxHeight: "80vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 16,
          }}
        >
          <div>
            <h2 style={{ margin: 0 }}>Ficha rápida del paciente</h2>
            <p className="chart-subtitle" style={{ marginTop: 4 }}>
              Vista resumida de datos clínicos y estado del programa crónico.
            </p>
          </div>
          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
            }}
          >
            {/* Ir a ficha clínica completa */}
            <button
              type="button"
              onClick={() => onOpenClinicalDetail(patient)}
              style={{
                border: "1px solid #2563eb",
                borderRadius: 999,
                padding: "4px 10px",
                cursor: "pointer",
                background: "#2563eb",
                color: "#ffffff",
                fontWeight: 600,
                fontSize: "0.8rem",
              }}
            >
              Ver ficha clínica completa
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                border: "none",
                borderRadius: 999,
                padding: "4px 10px",
                cursor: "pointer",
                background: "#e5e7eb",
                fontWeight: 600,
              }}
            >
              Cerrar
            </button>
          </div>
        </div>

        {/* ================= DATOS DEL PACIENTE ================= */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.1fr 0.9fr",
            gap: 16,
            marginBottom: 16,
          }}
        >
          {/* Datos básicos */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: 12,
              padding: 16,
              boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: 8 }}>Datos del paciente</h3>
            <p>
              <strong>Nombre:</strong> {patient.name}
            </p>
            <p>
              <strong>Documento:</strong> {patient.document}
            </p>
            <p>
              <strong>Última glucemia:</strong> {patient.lastGlucose}
            </p>
            <p>
              <strong>Adherencia global:</strong> {patient.adherence}
            </p>
            <p>
              <strong>Estado actual:</strong> {patient.status}
            </p>
          </div>

          {/* Estado del programa */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: 12,
              padding: 16,
              boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: 8 }}>
              Estado del programa crónico
            </h3>

            <p>
              <strong>Programa:</strong>{" "}
              {patient.enrolled ? patient.programType ?? "Diabetes" : "No enrolado"}
            </p>

            <p>
              <strong>Estado:</strong>{" "}
              {patient.enrolled
                ? patient.programStatus ?? "active"
                : "Sin programa activo"}
            </p>

            <p>
              <strong>Profesional responsable:</strong>{" "}
              {patient.mainProvider ?? "Pendiente de asignación"}
            </p>

            <p>
              <strong>Fecha de inicio:</strong>{" "}
              {patient.enrollmentDate
                ? formatDate(patient.enrollmentDate)
                : "Pendiente"}
            </p>
          </div>
        </div>

        {/* ================= RIESGO CLÍNICO ================= */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: 8 }}>
            Riesgo clínico — Complicaciones de la diabetes
          </h3>

          {loadingRisk && <p>Cargando riesgo clínico…</p>}

          {riskError && (
            <p style={{ color: "#b91c1c", fontSize: "0.85rem" }}>{riskError}</p>
          )}

          {!loadingRisk && !riskError && !clinicalRisk && (
            <p style={{ fontSize: "0.85rem", color: "#6b7280" }}>
              No hay datos suficientes para calcular el riesgo clínico.
            </p>
          )}

          {!loadingRisk && !riskError && clinicalRisk && (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
                  gap: 12,
                  marginBottom: 12,
                  fontSize: "0.85rem",
                }}
              >
                <div>
                  <div style={{ marginBottom: 4 }}>Retinopatía</div>
                  <span style={riskBadgeStyle(clinicalRisk.retinopathyRisk)}>
                    {riskLabel(clinicalRisk.retinopathyRisk)}
                  </span>
                </div>

                <div>
                  <div style={{ marginBottom: 4 }}>Riesgo renal</div>
                  <span style={riskBadgeStyle(clinicalRisk.renalRisk)}>
                    {riskLabel(clinicalRisk.renalRisk)}
                  </span>
                </div>

                <div>
                  <div style={{ marginBottom: 4 }}>Riesgo macrovascular</div>
                  <span style={riskBadgeStyle(clinicalRisk.macrovascularRisk)}>
                    {riskLabel(clinicalRisk.macrovascularRisk)}
                  </span>
                </div>

                <div>
                  <div style={{ marginBottom: 4 }}>Riesgo neuropático</div>
                  <span style={riskBadgeStyle(clinicalRisk.neuropathyRisk)}>
                    {riskLabel(clinicalRisk.neuropathyRisk)}
                  </span>
                </div>
              </div>

              {/* Últimos valores relevantes */}
              <div
                style={{
                  marginTop: 8,
                  fontSize: "0.8rem",
                  color: "#6b7280",
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                {clinicalRisk.lastValues?.hba1c && (
                  <div>
                    <strong>HbA1c:</strong>{" "}
                    {clinicalRisk.lastValues.hba1c.valueNumeric}{" "}
                    {clinicalRisk.lastValues.hba1c.unit ?? "%"}
                  </div>
                )}
                {clinicalRisk.lastValues?.bloodPressure && (
                  <div>
                    <strong>PA:</strong>{" "}
                    {clinicalRisk.lastValues.bloodPressure.valueText}
                  </div>
                )}
                {clinicalRisk.lastValues?.triglycerides && (
                  <div>
                    <strong>TG:</strong>{" "}
                    {clinicalRisk.lastValues.triglycerides.valueNumeric}{" "}
                    {clinicalRisk.lastValues.triglycerides.unit ?? "mg/dL"}
                  </div>
                )}
                {clinicalRisk.lastValues?.totalCholesterol && (
                  <div>
                    <strong>Col total:</strong>{" "}
                    {clinicalRisk.lastValues.totalCholesterol.valueNumeric}{" "}
                    {clinicalRisk.lastValues.totalCholesterol.unit ?? "mg/dL"}
                  </div>
                )}
                {clinicalRisk.lastValues?.bmi && (
                  <div>
                    <strong>IMC:</strong>{" "}
                    {clinicalRisk.lastValues.bmi.valueNumeric}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* ================= TRATAMIENTO FARMACOLÓGICO ================= */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: 8 }}>
            Tratamiento farmacológico actual
          </h3>

          {loadingMeds && <p>Cargando medicación…</p>}
          {medError && <p style={{ color: "#b91c1c" }}>{medError}</p>}

          {!loadingMeds && medications.length === 0 && !medError && (
            <p style={{ color: "#666" }}>
              No hay tratamientos farmacológicos cargados.
            </p>
          )}

          {!loadingMeds && medications.length > 0 && (
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
                  {medications.map((m) => (
                    <tr key={m.id}>
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

          {/* Botón agregar medicación */}
          <button
            type="button"
            onClick={() => setShowAddMedicationModal(true)}
            style={{
              marginTop: 12,
              padding: "6px 14px",
              borderRadius: 8,
              border: "1px solid #2563eb",
              background: "#2563eb",
              color: "#ffffff",
              cursor: "pointer",
              fontSize: "0.85rem",
            }}
          >
            [+] Agregar medicación
          </button>
        </div>

        {/* ================= PERFIL FARMACOLÓGICO ================= */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: 12,
            padding: 16,
            boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: 8 }}>
            Perfil farmacológico (resumen últimos 12 meses)
          </h3>

          {loadingPharma && <p>Cargando perfil farmacológico…</p>}
          {pharmaError && (
            <p style={{ color: "#b91c1c", fontSize: "0.8rem" }}>
              {pharmaError}
            </p>
          )}

          {!loadingPharma &&
            !pharmaError &&
            pharmaSummary.totalDrugs === 0 && (
              <p style={{ fontSize: "0.9rem", color: "#6b7280" }}>
                No se registran dispensas de medicamentos en la ventana
                analizada.
              </p>
            )}

          {!loadingPharma &&
            !pharmaError &&
            pharmaSummary.totalDrugs > 0 && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 16,
                  marginBottom: 12,
                  fontSize: "0.9rem",
                }}
              >
                <div>
                  <strong>Total de medicamentos:</strong>{" "}
                  {pharmaSummary.totalDrugs}
                </div>

                <div>
                  <strong>Crónicos:</strong> {pharmaSummary.chronicDrugs}
                </div>

                <div>
                  <strong>Última dispensa registrada:</strong>{" "}
                  {pharmaSummary.lastDispenseLabel}
                </div>

                {pharmaSummary.anyLowAdherence && (
                  <div style={{ color: "#92400e" }}>
                    ⚠ Al menos un medicamento con baja adherencia (&lt; 60%).
                  </div>
                )}
              </div>
            )}

          <button
            type="button"
            onClick={() => onOpenPharmaDetail(patient)}
            style={{
              marginTop: 4,
              padding: "6px 14px",
              borderRadius: 999,
              border: "1px solid #2563eb",
              background: "#2563eb",
              color: "#ffffff",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: 600,
            }}
          >
            Ver detalle farmacológico completo
          </button>
        </div>
      </div>

      {/* ================= MODAL: AGREGAR MEDICACIÓN ================= */}
      {showAddMedicationModal && (
        <AddMedicationModal
          patientId={patient.id}
          onClose={() => setShowAddMedicationModal(false)}
          onSuccess={() => {
            setShowAddMedicationModal(false);
            reloadMedications(); // refrescamos lista
          }}
        />
      )}
    </div>
  );
}
