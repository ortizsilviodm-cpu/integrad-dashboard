/* integrad-dashboard/src/components/patientClinical/PatientMedicationProfile.tsx */

import type { CSSProperties } from "react";

import { Card } from "../ui/Card";
import type { PatientMedicationRow } from "../../api/patients";
import { TOKENS } from "../../theme/tokens";
import { UI } from "../../theme/ui";

export type PatientMedicationProfileProps = {
  medications: PatientMedicationRow[];
  medLoading: boolean;
  medError: string | null;
};

function normalizeText(value?: string | null): string {
  const safe = (value ?? "").trim();
  return safe.length > 0 ? safe : "—";
}

function getFrequencyLabel(medication: PatientMedicationRow): string {
  const schedulePattern = (medication.schedulePattern ?? "").trim();
  if (schedulePattern.length > 0) {
    return schedulePattern;
  }

  const frequency = (medication.frequency ?? "").trim();
  if (frequency.length > 0) {
    return frequency;
  }

  return "Frecuencia no informada";
}

function getMedicationTypeLabel(type: PatientMedicationRow["type"]): string {
  return type === "CRONICO" ? "Crónico" : "Ocasional";
}

function getMedicationTypeStyle(
  type: PatientMedicationRow["type"]
): CSSProperties {
  if (type === "CRONICO") {
    return {
      display: "inline-flex",
      alignItems: "center",
      padding: "4px 10px",
      borderRadius: 999,
      fontSize: "0.78rem",
      fontWeight: 700,
      background: "#eef2ff",
      color: "#4338ca",
      border: "1px solid #c7d2fe",
      whiteSpace: "nowrap",
    };
  }

  return {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 10px",
    borderRadius: 999,
    fontSize: "0.78rem",
    fontWeight: 700,
    background: "#f3f4f6",
    color: "#374151",
    border: "1px solid #e5e7eb",
    whiteSpace: "nowrap",
  };
}

function getMedicationStatusStyle(isActive: boolean): CSSProperties {
  if (isActive) {
    return {
      display: "inline-flex",
      alignItems: "center",
      padding: "4px 10px",
      borderRadius: 999,
      fontSize: "0.78rem",
      fontWeight: 700,
      background: "#ecfdf5",
      color: "#047857",
      border: "1px solid #a7f3d0",
      whiteSpace: "nowrap",
    };
  }

  return {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 10px",
    borderRadius: 999,
    fontSize: "0.78rem",
    fontWeight: 700,
    background: "#f9fafb",
    color: "#6b7280",
    border: "1px solid #e5e7eb",
    whiteSpace: "nowrap",
  };
}

const cardShellStyle: CSSProperties = {
  display: "grid",
  gap: 14,
  padding: 4,
};

const headerRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
  flexWrap: "wrap",
};

const titleBlockStyle: CSSProperties = {
  display: "grid",
  gap: 4,
};

const titleStyle: CSSProperties = {
  ...UI.cardTitleH3,
  margin: 0,
};

const subtitleStyle: CSSProperties = {
  margin: 0,
  color: TOKENS.COLOR_TEXT_MUTED,
  fontSize: "0.9rem",
  lineHeight: 1.45,
  maxWidth: 720,
};

const helperTextStyle: CSSProperties = {
  margin: 0,
  fontSize: "0.82rem",
  color: "#6b7280",
  lineHeight: 1.5,
};

const countBadgeStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "6px 10px",
  borderRadius: 999,
  fontSize: "0.82rem",
  fontWeight: 700,
  background: "#f3f4f6",
  color: "#374151",
  border: "1px solid #e5e7eb",
};

const emptyStateStyle: CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 14,
  padding: 18,
  background: "#f9fafb",
};

const gridStyle: CSSProperties = {
  display: "grid",
  gap: 14,
};

const itemCardStyle: CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  padding: 18,
  background: "#fcfcfd",
  display: "grid",
  gap: 14,
};

const itemHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
  flexWrap: "wrap",
};

const itemNameBlockStyle: CSSProperties = {
  display: "grid",
  gap: 4,
};

const itemNameStyle: CSSProperties = {
  fontSize: "1rem",
  fontWeight: 700,
  color: "#111827",
  margin: 0,
};

const itemCodeStyle: CSSProperties = {
  fontSize: "0.82rem",
  color: "#6b7280",
};

const itemMetaRowStyle: CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
};

const itemBodyStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: 14,
};

const fieldBlockStyle: CSSProperties = {
  display: "grid",
  gap: 5,
  padding: "10px 12px",
  borderRadius: 12,
  background: "#ffffff",
  border: "1px solid #f1f5f9",
};

const fieldLabelStyle: CSSProperties = {
  fontSize: "0.74rem",
  fontWeight: 700,
  color: "#6b7280",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const fieldValueStyle: CSSProperties = {
  fontSize: "0.92rem",
  color: "#111827",
  lineHeight: 1.4,
  wordBreak: "break-word",
};

export default function PatientMedicationProfile({
  medications,
  medLoading,
  medError,
}: PatientMedicationProfileProps) {
  return (
    <Card>
      <div style={cardShellStyle}>
        <div style={headerRowStyle}>
          <div style={titleBlockStyle}>
            <h3 style={titleStyle}>Perfil farmacológico</h3>
            <p style={subtitleStyle}>
              Vista clínica simplificada de la medicación actual del paciente.
            </p>
          </div>

          {!medLoading && medications.length > 0 && !medError && (
            <div style={countBadgeStyle}>
              {medications.length} medicamento{medications.length === 1 ? "" : "s"}
            </div>
          )}
        </div>

        <p style={helperTextStyle}>
          Este bloque muestra el esquema actual de medicación. El modelo temporal
          será reemplazado en futuros sprints por un dosingSchedule estructurado.
        </p>

        {medLoading && <p>Cargando perfil farmacológico…</p>}
        {medError && <p style={{ color: UI.errorText.color }}>{medError}</p>}

        {!medLoading && medications.length === 0 && !medError && (
          <div style={emptyStateStyle}>
            <p
              style={{
                color: TOKENS.COLOR_TEXT_MUTED,
                fontSize: "0.9rem",
                margin: 0,
              }}
            >
              No hay medicación activa o registrada para mostrar en el perfil
              farmacológico.
            </p>
          </div>
        )}

        {!medLoading && medications.length > 0 && (
          <div style={gridStyle}>
            {medications.map((medication) => (
              <article key={medication.id} style={itemCardStyle}>
                <div style={itemHeaderStyle}>
                  <div style={itemNameBlockStyle}>
                    <p style={itemNameStyle}>
                      {normalizeText(medication.medicationName)}
                    </p>
                    <div style={itemCodeStyle}>
                      Código: {normalizeText(medication.medicationCode)}
                    </div>
                  </div>

                  <div style={itemMetaRowStyle}>
                    <span style={getMedicationTypeStyle(medication.type)}>
                      {getMedicationTypeLabel(medication.type)}
                    </span>
                    <span style={getMedicationStatusStyle(medication.isActive)}>
                      {medication.isActive ? "Activo" : "Finalizado"}
                    </span>
                  </div>
                </div>

                <div style={itemBodyStyle}>
                  <div style={fieldBlockStyle}>
                    <div style={fieldLabelStyle}>Dosis</div>
                    <div style={fieldValueStyle}>
                      {normalizeText(medication.dose)}
                    </div>
                  </div>

                  <div style={fieldBlockStyle}>
                    <div style={fieldLabelStyle}>Frecuencia</div>
                    <div style={fieldValueStyle}>
                      {getFrequencyLabel(medication)}
                    </div>
                  </div>

                  <div style={fieldBlockStyle}>
                    <div style={fieldLabelStyle}>Vía</div>
                    <div style={fieldValueStyle}>
                      {normalizeText(medication.route)}
                    </div>
                  </div>

                  <div style={fieldBlockStyle}>
                    <div style={fieldLabelStyle}>Familia terapéutica</div>
                    <div style={fieldValueStyle}>
                      {normalizeText(medication.therapeuticFamily)}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}