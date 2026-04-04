/* integrad-dashboard/src/pages/PatientDetailPage.tsx */

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import type { PatientRow } from "../api/patients";
import {
  fetchPharmaProfile,
  type PatientPharmaProfile,
} from "../api/pharmaProfile";
import {
  fetchClinicalRiskSummary,
  type ClinicalRiskSummary,
} from "../api/patientSummary";
import {
  fetchPatientMedications,
  type PatientMedicationRow,
} from "../api/patients";
import AddMedicationModal from "../components/medications/AddMedicationModal";

interface PatientDetailPageProps {
  patient: PatientRow;
  onClose: () => void;
  onOpenPharmaDetail: (patient: PatientRow) => void;
  onOpenClinicalDetail: (patient: PatientRow) => void;
}

const CARD_STYLE: CSSProperties = {
  background: "#ffffff",
  borderRadius: 14,
  padding: 18,
  boxShadow: "0 2px 10px rgba(15,23,42,0.06)",
  border: "1px solid #eef2f7",
};

const SECTION_TITLE_STYLE: CSSProperties = {
  marginTop: 0,
  marginBottom: 12,
  fontSize: "1rem",
  fontWeight: 700,
  color: "#1f2937",
};

const META_TEXT_STYLE: CSSProperties = {
  margin: 0,
  color: "#6b7280",
  fontSize: "0.88rem",
  lineHeight: 1.5,
};

const PRIMARY_BUTTON_STYLE: CSSProperties = {
  border: "1px solid #2563eb",
  borderRadius: 999,
  padding: "8px 14px",
  cursor: "pointer",
  background: "#2563eb",
  color: "#ffffff",
  fontWeight: 600,
  fontSize: "0.82rem",
  lineHeight: 1.2,
};

const SECONDARY_BUTTON_STYLE: CSSProperties = {
  border: "1px solid #d1d5db",
  borderRadius: 999,
  padding: "8px 14px",
  cursor: "pointer",
  background: "#f3f4f6",
  color: "#374151",
  fontWeight: 600,
  fontSize: "0.82rem",
  lineHeight: 1.2,
};

const TABLE_HEADER_CELL_STYLE: CSSProperties = {
  textAlign: "left",
  padding: "10px 8px",
  fontSize: "0.78rem",
  fontWeight: 700,
  color: "#475569",
  borderBottom: "1px solid #e5e7eb",
  whiteSpace: "nowrap",
};

const TABLE_BODY_CELL_STYLE: CSSProperties = {
  padding: "10px 8px",
  fontSize: "0.84rem",
  color: "#111827",
  borderBottom: "1px solid #f1f5f9",
  verticalAlign: "top",
};

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

  const [clinicalRisk, setClinicalRisk] = useState<ClinicalRiskSummary | null>(
    null
  );
  const [loadingRisk, setLoadingRisk] = useState<boolean>(false);
  const [riskError, setRiskError] = useState<string | null>(null);

  const [showAddMedicationModal, setShowAddMedicationModal] =
    useState<boolean>(false);

  useEffect(() => {
    if (!patient.id) return;

    setLoadingPharma(true);
    setPharmaError(null);

    fetchPharmaProfile(patient.id, 365)
      .then((data) => setPharma(data))
      .catch(() => setPharmaError("No se pudo cargar el perfil farmacológico."))
      .finally(() => setLoadingPharma(false));
  }, [patient.id]);

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
      if (!d.lastDispenseDate) continue;

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

  const riskBadgeStyle = (
    level: "low" | "medium" | "high" | null | undefined
  ): CSSProperties => {
    const base: CSSProperties = {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "3px 10px",
      borderRadius: 999,
      fontSize: "0.75rem",
      fontWeight: 700,
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
        background: "#fef3c7",
        color: "#92400e",
      };
    }

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
        padding: 24,
        boxSizing: "border-box",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#f8fafc",
          borderRadius: 18,
          padding: 24,
          width: "min(1180px, 96vw)",
          boxShadow: "0 18px 50px rgba(15,23,42,0.18)",
          maxHeight: "88vh",
          overflowY: "auto",
          overflowX: "hidden",
          boxSizing: "border-box",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            ...CARD_STYLE,
            marginBottom: 18,
            padding: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "1.35rem",
                  color: "#1f2937",
                }}
              >
                Ficha rápida del paciente
              </h2>
              <p
                className="chart-subtitle"
                style={{
                  marginTop: 6,
                  marginBottom: 0,
                  color: "#6b7280",
                  fontSize: "0.9rem",
                  lineHeight: 1.45,
                }}
              >
                Vista resumida de datos clínicos y estado del programa crónico.
              </p>
            </div>

            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                onClick={() => onOpenClinicalDetail(patient)}
                style={PRIMARY_BUTTON_STYLE}
              >
                Ver ficha clínica completa
              </button>

              <button
                type="button"
                onClick={onClose}
                style={SECONDARY_BUTTON_STYLE}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.1fr 0.9fr",
            gap: 16,
            marginBottom: 16,
          }}
        >
          <div style={CARD_STYLE}>
            <h3 style={SECTION_TITLE_STYLE}>Datos del paciente</h3>

            <div
              style={{
                display: "grid",
                gap: 10,
                fontSize: "0.9rem",
              }}
            >
              <p style={{ margin: 0 }}>
                <strong>Nombre:</strong> {patient.name}
              </p>
              <p style={{ margin: 0 }}>
                <strong>Documento:</strong> {patient.document}
              </p>
              <p style={{ margin: 0 }}>
                <strong>Última glucemia:</strong> {patient.lastGlucose}
              </p>
              <p style={{ margin: 0 }}>
                <strong>Adherencia global:</strong> {patient.adherence}
              </p>
              <p style={{ margin: 0 }}>
                <strong>Estado actual:</strong> {patient.status}
              </p>
            </div>
          </div>

          <div style={CARD_STYLE}>
            <h3 style={SECTION_TITLE_STYLE}>Estado del programa crónico</h3>

            <div
              style={{
                display: "grid",
                gap: 10,
                fontSize: "0.9rem",
              }}
            >
              <p style={{ margin: 0 }}>
                <strong>Programa:</strong>{" "}
                {patient.enrolled ? patient.programType ?? "Diabetes" : "No enrolado"}
              </p>

              <p style={{ margin: 0 }}>
                <strong>Estado:</strong>{" "}
                {patient.enrolled
                  ? patient.programStatus ?? "active"
                  : "Sin programa activo"}
              </p>

              <p style={{ margin: 0 }}>
                <strong>Profesional responsable:</strong>{" "}
                {patient.mainProvider ?? "Pendiente de asignación"}
              </p>

              <p style={{ margin: 0 }}>
                <strong>Fecha de inicio:</strong>{" "}
                {patient.enrollmentDate
                  ? formatDate(patient.enrollmentDate)
                  : "Pendiente"}
              </p>
            </div>
          </div>
        </div>

        <div
          style={{
            ...CARD_STYLE,
            marginBottom: 16,
          }}
        >
          <h3 style={SECTION_TITLE_STYLE}>
            Riesgo clínico — Complicaciones de la diabetes
          </h3>

          {loadingRisk && <p style={META_TEXT_STYLE}>Cargando riesgo clínico…</p>}

          {riskError && (
            <p style={{ color: "#b91c1c", fontSize: "0.85rem", margin: 0 }}>
              {riskError}
            </p>
          )}

          {!loadingRisk && !riskError && !clinicalRisk && (
            <p style={META_TEXT_STYLE}>
              No hay datos suficientes para calcular el riesgo clínico.
            </p>
          )}

          {!loadingRisk && !riskError && clinicalRisk && (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: 14,
                  marginBottom: 14,
                }}
              >
                <div>
                  <div style={{ marginBottom: 6, fontSize: "0.84rem", color: "#475569" }}>
                    Retinopatía
                  </div>
                  <span style={riskBadgeStyle(clinicalRisk.retinopathyRisk)}>
                    {riskLabel(clinicalRisk.retinopathyRisk)}
                  </span>
                </div>

                <div>
                  <div style={{ marginBottom: 6, fontSize: "0.84rem", color: "#475569" }}>
                    Riesgo renal
                  </div>
                  <span style={riskBadgeStyle(clinicalRisk.renalRisk)}>
                    {riskLabel(clinicalRisk.renalRisk)}
                  </span>
                </div>

                <div>
                  <div style={{ marginBottom: 6, fontSize: "0.84rem", color: "#475569" }}>
                    Riesgo macrovascular
                  </div>
                  <span style={riskBadgeStyle(clinicalRisk.macrovascularRisk)}>
                    {riskLabel(clinicalRisk.macrovascularRisk)}
                  </span>
                </div>

                <div>
                  <div style={{ marginBottom: 6, fontSize: "0.84rem", color: "#475569" }}>
                    Riesgo neuropático
                  </div>
                  <span style={riskBadgeStyle(clinicalRisk.neuropathyRisk)}>
                    {riskLabel(clinicalRisk.neuropathyRisk)}
                  </span>
                </div>
              </div>

              <div
                style={{
                  paddingTop: 12,
                  borderTop: "1px solid #eef2f7",
                  fontSize: "0.82rem",
                  color: "#64748b",
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 14,
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
                    <strong>IMC:</strong> {clinicalRisk.lastValues.bmi.valueNumeric}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div
          style={{
            ...CARD_STYLE,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 12,
              flexWrap: "wrap",
              marginBottom: 12,
            }}
          >
            <div>
              <h3 style={{ ...SECTION_TITLE_STYLE, marginBottom: 4 }}>
                Tratamiento farmacológico actual
              </h3>
              <p style={META_TEXT_STYLE}>
                Medicación activa registrada para seguimiento operativo.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowAddMedicationModal(true)}
              style={PRIMARY_BUTTON_STYLE}
            >
              Agregar medicación
            </button>
          </div>

          {loadingMeds && <p style={META_TEXT_STYLE}>Cargando medicación…</p>}
          {medError && <p style={{ color: "#b91c1c", margin: 0 }}>{medError}</p>}

          {!loadingMeds && medications.length === 0 && !medError && (
            <p style={META_TEXT_STYLE}>
              No hay tratamientos farmacológicos cargados.
            </p>
          )}

          {!loadingMeds && medications.length > 0 && (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  tableLayout: "fixed",
                }}
              >
                <colgroup>
                  <col style={{ width: "28%" }} />
                  <col style={{ width: "12%" }} />
                  <col style={{ width: "12%" }} />
                  <col style={{ width: "18%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "8%" }} />
                  <col style={{ width: "12%" }} />
                </colgroup>

                <thead>
                  <tr>
                    <th style={TABLE_HEADER_CELL_STYLE}>Medicamento</th>
                    <th style={TABLE_HEADER_CELL_STYLE}>Tipo</th>
                    <th style={TABLE_HEADER_CELL_STYLE}>Dosis</th>
                    <th style={TABLE_HEADER_CELL_STYLE}>Frecuencia</th>
                    <th style={TABLE_HEADER_CELL_STYLE}>Inicio</th>
                    <th style={TABLE_HEADER_CELL_STYLE}>Fin</th>
                    <th style={TABLE_HEADER_CELL_STYLE}>Estado</th>
                  </tr>
                </thead>

                <tbody>
                  {medications.map((m) => (
                    <tr key={m.id}>
                      <td
                        style={{
                          ...TABLE_BODY_CELL_STYLE,
                          fontWeight: 500,
                          wordBreak: "break-word",
                        }}
                      >
                        {m.medicationName} ({m.medicationCode})
                      </td>
                      <td style={TABLE_BODY_CELL_STYLE}>
                        {m.type === "CRONICO" ? "Crónico" : "Ocasional"}
                      </td>
                      <td style={{ ...TABLE_BODY_CELL_STYLE, whiteSpace: "nowrap" }}>
                        {m.dose}
                      </td>
                      <td style={{ ...TABLE_BODY_CELL_STYLE, wordBreak: "break-word" }}>
                        {m.frequency}
                      </td>
                      <td style={{ ...TABLE_BODY_CELL_STYLE, whiteSpace: "nowrap" }}>
                        {formatDate(m.startDate)}
                      </td>
                      <td style={{ ...TABLE_BODY_CELL_STYLE, whiteSpace: "nowrap" }}>
                        {formatDate(m.endDate)}
                      </td>
                      <td style={TABLE_BODY_CELL_STYLE}>
                        {m.isActive ? "Activo" : "Finalizado"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div style={CARD_STYLE}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 12,
              flexWrap: "wrap",
              marginBottom: 12,
            }}
          >
            <div>
              <h3 style={{ ...SECTION_TITLE_STYLE, marginBottom: 4 }}>
                Perfil farmacológico (resumen últimos 12 meses)
              </h3>
              <p style={META_TEXT_STYLE}>
                Dispensas, continuidad y señales operativas del tratamiento.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onOpenPharmaDetail(patient)}
              style={PRIMARY_BUTTON_STYLE}
            >
              Ver detalle farmacológico completo
            </button>
          </div>

          {loadingPharma && <p style={META_TEXT_STYLE}>Cargando perfil farmacológico…</p>}

          {pharmaError && (
            <p style={{ color: "#b91c1c", fontSize: "0.85rem", margin: 0 }}>
              {pharmaError}
            </p>
          )}

          {!loadingPharma && !pharmaError && pharmaSummary.totalDrugs === 0 && (
            <p style={META_TEXT_STYLE}>
              No se registran dispensas de medicamentos en la ventana analizada.
            </p>
          )}

          {!loadingPharma && !pharmaError && pharmaSummary.totalDrugs > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 12,
              }}
            >
              <div
                style={{
                  padding: 14,
                  borderRadius: 12,
                  background: "#f8fafc",
                  border: "1px solid #e5e7eb",
                }}
              >
                <div style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: 4 }}>
                  Total de medicamentos
                </div>
                <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#111827" }}>
                  {pharmaSummary.totalDrugs}
                </div>
              </div>

              <div
                style={{
                  padding: 14,
                  borderRadius: 12,
                  background: "#f8fafc",
                  border: "1px solid #e5e7eb",
                }}
              >
                <div style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: 4 }}>
                  Crónicos
                </div>
                <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#111827" }}>
                  {pharmaSummary.chronicDrugs}
                </div>
              </div>

              <div
                style={{
                  padding: 14,
                  borderRadius: 12,
                  background: "#f8fafc",
                  border: "1px solid #e5e7eb",
                }}
              >
                <div style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: 4 }}>
                  Última dispensa registrada
                </div>
                <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#111827" }}>
                  {pharmaSummary.lastDispenseLabel}
                </div>
              </div>

              {pharmaSummary.anyLowAdherence && (
                <div
                  style={{
                    padding: 14,
                    borderRadius: 12,
                    background: "#fff7ed",
                    border: "1px solid #fed7aa",
                  }}
                >
                  <div style={{ fontSize: "0.8rem", color: "#9a3412", marginBottom: 4 }}>
                    Señal operativa
                  </div>
                  <div style={{ fontSize: "0.92rem", fontWeight: 600, color: "#9a3412" }}>
                    Al menos un medicamento con baja adherencia (&lt; 60%).
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showAddMedicationModal && (
        <AddMedicationModal
          patientId={patient.id}
          onClose={() => setShowAddMedicationModal(false)}
          onSuccess={() => {
            setShowAddMedicationModal(false);
            reloadMedications();
          }}
        />
      )}
    </div>
  );
}