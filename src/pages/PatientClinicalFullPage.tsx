/* integrad-dashboard/src/pages/PatientClinicalFullPage.tsx */

import { useState } from "react";
import type { CSSProperties } from "react";

import ClinicalRiskCards from "../views/patientClinical/ClinicalRiskCards";
import PatientIdentityCard from "../views/patientClinical/PatientIdentityCard";
import PatientProgramAdherenceCard from "../views/patientClinical/PatientProgramAdherenceCard";
import PatientClinicalHeader from "../views/patientClinical/PatientClinicalHeader";
import M5SnapshotCard from "../views/patientClinical/M5SnapshotCard";
import PatientMedicationsCard from "../views/patientClinical/PatientMedicationsCard";
import PatientClinicalHistoryCard from "../views/patientClinical/PatientClinicalHistoryCard";
import PatientAlertsCard from "../views/patientClinical/PatientAlertsCard";
import PatientMedicationProfile from "../components/patientClinical/PatientMedicationProfile";

import { Card } from "../components/ui/Card";

import type { PatientRow } from "../api/patients";
import AddClinicalIndicatorModal from "../components/clinical/AddClinicalIndicatorModal";
import { usePatientClinicalFull } from "../hooks/usePatientClinicalFull";

import { formatClinicalValue } from "./patientClinical/patientClinical.logic";
import { S } from "./patientClinical/patientClinical.styles";

interface PatientClinicalFullPageProps {
  patient: PatientRow;
  onClose: () => void;
}

const MSG = {
  patientLoadFail: "No se pudo cargar la ficha del paciente.",
  loadingText: "Cargando ficha clínica del paciente…",
} as const;

const TIMELINE_PREVIEW_LIMIT = 5;

const pageContentStyle: CSSProperties = {
  display: "grid",
  gap: 20,
};

const blockSectionStyle: CSSProperties = {
  display: "grid",
  gap: 14,
};

const sectionCardStyle: CSSProperties = {
  display: "grid",
  gap: 14,
  padding: 16,
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  background: "#ffffff",
};

const sectionHeaderStyle: CSSProperties = {
  display: "grid",
  gap: 4,
};

const sectionEyebrowStyle: CSSProperties = {
  margin: 0,
  fontSize: "0.76rem",
  fontWeight: 700,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: "#6b7280",
};

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "1.02rem",
  fontWeight: 700,
  color: "#111827",
};

const sectionDescriptionStyle: CSSProperties = {
  margin: 0,
  fontSize: "0.9rem",
  color: "#6b7280",
};

const blockHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  marginBottom: 12,
};

const blockTitleStyle: CSSProperties = {
  ...S.h3,
  margin: 0,
};

const timelineToggleButtonStyle: CSSProperties = {
  border: "1px solid #d1d5db",
  borderRadius: 999,
  padding: "6px 12px",
  cursor: "pointer",
  background: "#ffffff",
  color: "#374151",
  fontSize: "0.82rem",
  fontWeight: 600,
  flexShrink: 0,
};

const timelineBodyStyle: CSSProperties = {
  display: "grid",
  gap: 10,
};

const timelineListStyle: CSSProperties = {
  display: "grid",
  gap: 10,
};

const timelineItemStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  padding: "10px 12px",
  background: "#f9fafb",
};

const timelineItemContentStyle: CSSProperties = {
  minWidth: 0,
};

const timelineItemDateStyle: CSSProperties = {
  fontSize: 12,
  color: "#6b7280",
  whiteSpace: "nowrap",
  flexShrink: 0,
};

const timelineItemTitleStyle: CSSProperties = {
  fontWeight: 700,
  color: "#111827",
};

function formatTimelineDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("es-AR");
}

function getTimelineBadgeStyle(type: "EVENT" | "INDICATOR"): CSSProperties {
  if (type === "EVENT") {
    return {
      display: "inline-block",
      padding: "4px 8px",
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 700,
      background: "#fef3c7",
      color: "#92400e",
      border: "1px solid #fde68a",
      marginBottom: 6,
    };
  }

  return {
    display: "inline-block",
    padding: "4px 8px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    background: "#dbeafe",
    color: "#1d4ed8",
    border: "1px solid #bfdbfe",
    marginBottom: 6,
  };
}

export default function PatientClinicalFullPage({
  patient,
  onClose,
}: PatientClinicalFullPageProps) {
  const [showAddIndicatorModal, setShowAddIndicatorModal] =
    useState<boolean>(false);
  const [isTimelineExpanded, setIsTimelineExpanded] = useState<boolean>(false);

  const { data, loading, error, sectionErrors, reload } =
    usePatientClinicalFull(patient.id);

  if (loading) {
    return (
      <section className="app-table" style={S.pageShell}>
        <p>{MSG.loadingText}</p>
      </section>
    );
  }

  if (!data.summary) {
    return (
      <section className="app-table" style={S.pageShell}>
        <p className="table-error">{error ?? MSG.patientLoadFail}</p>
      </section>
    );
  }

  const { patient: p, adherence, kpis90d } = data.summary;

  return (
    <section className="app-table" style={S.pageShell}>
      <div style={pageContentStyle}>
        <PatientClinicalHeader onClose={onClose} />

        <section aria-label="Header del paciente" style={sectionCardStyle}>
          <div style={sectionHeaderStyle}>
            <p style={sectionEyebrowStyle}>Paciente</p>
            <h2 style={sectionTitleStyle}>Identificación y programa activo</h2>
            <p style={sectionDescriptionStyle}>
              Resumen administrativo y estado base del seguimiento longitudinal.
            </p>
          </div>

          <div style={S.sectionGrid2}>
            <PatientIdentityCard patient={p} />
            <PatientProgramAdherenceCard
              adherence={adherence}
              kpis90d={kpis90d}
            />
          </div>
        </section>

        <section aria-label="Resumen clínico" style={sectionCardStyle}>
          <div style={sectionHeaderStyle}>
            <p style={sectionEyebrowStyle}>Contexto clínico</p>
            <h2 style={sectionTitleStyle}>Resumen clínico y actividad reciente</h2>
            <p style={sectionDescriptionStyle}>
              Información clave para lectura rápida del estado clínico actual.
            </p>
          </div>

          <div style={blockSectionStyle}>
            <ClinicalRiskCards risk={data.risk} />

            <M5SnapshotCard
              snapshot={data.m5}
              loading={false}
              error={sectionErrors.m5}
            />

            <div style={S.sectionGridKpis}>
              <Card>
                <div style={S.indicatorsHeaderRow}>
                  <h3 style={S.h3}>Indicadores clínicos recientes</h3>

                  <button
                    type="button"
                    onClick={() => setShowAddIndicatorModal(true)}
                    style={S.registerIndicatorButton}
                  >
                    Registrar indicador
                  </button>
                </div>

                <div style={S.indicatorsGrid}>
                  <div>
                    <strong>HbA1c:</strong>{" "}
                    {formatClinicalValue(data.risk?.lastValues.hba1c)}
                  </div>
                  <div>
                    <strong>Glucemia en ayunas:</strong>{" "}
                    {formatClinicalValue(data.risk?.lastValues.glucoseFasting)}
                  </div>
                  <div>
                    <strong>PA:</strong>{" "}
                    {formatClinicalValue(data.risk?.lastValues.bloodPressure)}
                  </div>
                  <div>
                    <strong>Triglicéridos:</strong>{" "}
                    {formatClinicalValue(data.risk?.lastValues.triglycerides)}
                  </div>
                  <div>
                    <strong>Colesterol total:</strong>{" "}
                    {formatClinicalValue(data.risk?.lastValues.totalCholesterol)}
                  </div>
                  <div>
                    <strong>IMC:</strong>{" "}
                    {formatClinicalValue(data.risk?.lastValues.bmi)}
                  </div>
                  <div>
                    <strong>Microalbuminuria:</strong>{" "}
                    {formatClinicalValue(data.risk?.lastValues.microalbuminuria)}
                  </div>
                  <div>
                    <strong>Proteinuria:</strong>{" "}
                    {formatClinicalValue(data.risk?.lastValues.proteinuria)}
                  </div>
                  <div>
                    <strong>Tabaquismo:</strong>{" "}
                    {formatClinicalValue(data.risk?.lastValues.smokingStatus)}
                  </div>
                  <div>
                    <strong>Años desde diagnóstico:</strong>{" "}
                    {formatClinicalValue(data.risk?.lastValues.yearsSinceDiagnosis)}
                  </div>
                </div>
              </Card>

              <Card style={S.kpisCard}>
                <h3 style={{ ...S.h3, ...S.kpisTitle }}>Actividad 90 días</h3>
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
              </Card>
            </div>

            <PatientAlertsCard
              alerts={data.alerts}
              alertsLoading={false}
              alertsError={sectionErrors.alerts}
            />
          </div>
        </section>

        <section aria-label="Timeline clínico" style={sectionCardStyle}>
          <div style={sectionHeaderStyle}>
            <p style={sectionEyebrowStyle}>Seguimiento</p>
            <h2 style={sectionTitleStyle}>Timeline y tendencias clínicas</h2>
            <p style={sectionDescriptionStyle}>
              Secuencia reciente de eventos e indicadores para lectura cronológica.
            </p>
          </div>

          <div style={blockSectionStyle}>
            <Card>
              <div
                style={{
                  ...blockHeaderStyle,
                  marginBottom: isTimelineExpanded ? 12 : 0,
                }}
              >
                <h3 style={blockTitleStyle}>Timeline clínico</h3>

                <button
                  type="button"
                  onClick={() => setIsTimelineExpanded((prev) => !prev)}
                  style={timelineToggleButtonStyle}
                >
                  {isTimelineExpanded ? "Ocultar" : "Mostrar"}
                </button>
              </div>

              {isTimelineExpanded && (
                <div style={timelineBodyStyle}>
                  {sectionErrors.timeline ? (
                    <p>{sectionErrors.timeline}</p>
                  ) : data.timeline.length === 0 ? (
                    <p>Sin registros en el timeline.</p>
                  ) : (
                    <div style={timelineListStyle}>
                      {data.timeline
                        .slice(0, TIMELINE_PREVIEW_LIMIT)
                        .map((item, index) => (
                          <div
                            key={`${item.type}-${item.date}-${index}`}
                            style={timelineItemStyle}
                          >
                            <div style={timelineItemContentStyle}>
                              <span style={getTimelineBadgeStyle(item.type)}>
                                {item.type === "EVENT" ? "Evento" : "Indicador"}
                              </span>

                              <div style={timelineItemTitleStyle}>{item.title}</div>
                            </div>

                            <div style={timelineItemDateStyle}>
                              {formatTimelineDate(item.date)}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </Card>

            <PatientClinicalHistoryCard
              clinicalHistory={data.history}
              historyError={sectionErrors.history}
            />
          </div>
        </section>

        <section aria-label="Perfil farmacológico" style={sectionCardStyle}>
          <div style={sectionHeaderStyle}>
            <p style={sectionEyebrowStyle}>Tratamiento</p>
            <h2 style={sectionTitleStyle}>Perfil farmacológico actual</h2>
            <p style={sectionDescriptionStyle}>
              Vista clínica ordenada de medicación vigente y su trazabilidad básica.
            </p>
          </div>

          <div style={blockSectionStyle}>
            <PatientMedicationProfile
              medications={data.medications}
              medLoading={false}
              medError={sectionErrors.medications}
            />

            <PatientMedicationsCard
              medications={data.medications}
              medLoading={false}
              medError={sectionErrors.medications}
            />
          </div>
        </section>
      </div>

      {showAddIndicatorModal && (
        <AddClinicalIndicatorModal
          patientId={patient.id}
          onClose={() => setShowAddIndicatorModal(false)}
          onSuccess={() => {
            setShowAddIndicatorModal(false);
            reload();
          }}
        />
      )}
    </section>
  );
}