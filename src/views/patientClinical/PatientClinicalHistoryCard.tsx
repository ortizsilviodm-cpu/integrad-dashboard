/* integrad-dashboard/src/views/patientClinical/PatientClinicalHistoryCard.tsx */

import { useMemo, useState } from "react";

import { Card } from "../../components/ui/Card";
import { TOKENS } from "../../theme/tokens";

import { MiniTrendSparkline } from "../../utils/patientClinical/sparkline";
import {
  buildSeriesByCode,
  getLastValueForCode,
} from "../../utils/patientClinical/history";

import type { ClinicalIndicatorHistoryRow } from "../../api/clinicalHistory";

export type PatientClinicalHistoryCardProps = {
  clinicalHistory: ClinicalIndicatorHistoryRow[];
  historyError: string | null;
};

const S = {
  h3: {
    marginTop: 0,
    marginBottom: 0,
    fontSize: "1rem",
    fontWeight: 600,
    color: "#111827",
  } as const,

  td: {
    padding: 6,
  } as const,
};

export default function PatientClinicalHistoryCard({
  clinicalHistory,
  historyError,
}: PatientClinicalHistoryCardProps) {
  const [isMeasurementsExpanded, setIsMeasurementsExpanded] =
    useState<boolean>(false);

  const hasAnyHistory = clinicalHistory.length > 0;

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

  return (
    <Card
      padding={18}
      variant="outlined"
      style={{
        background: "#f9fafb",
        borderRadius: 18,
        boxShadow: TOKENS.SHADOW_CARD,
        marginBottom: 16,
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
          <h3 style={{ ...S.h3, fontSize: "1.05rem", marginBottom: 2 }}>
            Historial clínico y tendencias
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: "0.8rem",
              color: TOKENS.COLOR_TEXT_MUTED,
            }}
          >
            Evolución de los principales indicadores (HbA1c, glucemia, PA, IMC,
            función renal) a lo largo del tiempo.
          </p>
        </div>
      </div>

      {historyError && (
        <p style={{ color: "#b91c1c", fontSize: "0.85rem" }}>{historyError}</p>
      )}

      {!historyError && !hasAnyHistory && (
        <p style={{ color: TOKENS.COLOR_TEXT_MUTED, fontSize: "0.85rem" }}>
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
              <MiniTrendSparkline data={historySeriesByCode.get("HBA1C") ?? []} />
            </div>

            <div
              style={{
                borderRadius: 14,
                border: TOKENS.BORDER_DEFAULT,
                padding: 10,
                background: "#ffffff",
                boxShadow: TOKENS.SHADOW_CARD,
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
                border: TOKENS.BORDER_DEFAULT,
                padding: 10,
                background: "#ffffff",
                boxShadow: TOKENS.SHADOW_CARD,
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
                border: TOKENS.BORDER_DEFAULT,
                padding: 10,
                background: "#ffffff",
                boxShadow: TOKENS.SHADOW_CARD,
              }}
            >
              <div style={{ fontWeight: 600 }}>IMC</div>
              <div style={{ fontSize: "0.9rem", marginBottom: 4 }}>
                <strong>{lastBmiHistory?.valueNumber ?? "—"} kg/m²</strong>
              </div>
              <MiniTrendSparkline data={historySeriesByCode.get("BMI") ?? []} />
            </div>

            <div
              style={{
                borderRadius: 14,
                border: TOKENS.BORDER_DEFAULT,
                padding: 10,
                background: "#ffffff",
                boxShadow: TOKENS.SHADOW_CARD,
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
                border: TOKENS.BORDER_DEFAULT,
                padding: 10,
                background: "#ffffff",
                boxShadow: TOKENS.SHADOW_CARD,
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
                border: TOKENS.BORDER_DEFAULT,
                padding: 10,
                background: "#ffffff",
                boxShadow: TOKENS.SHADOW_CARD,
              }}
            >
              <div style={{ fontWeight: 600 }}>Tabaquismo</div>
              <div style={{ fontSize: "0.9rem", marginBottom: 4 }}>
                <strong>{lastSmokingHistory?.valueText ?? "No registrado"}</strong>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 4 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                marginBottom: isMeasurementsExpanded ? 6 : 0,
              }}
            >
              <h4
                style={{
                  margin: 0,
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  color: "#111827",
                }}
              >
                Detalle de mediciones
              </h4>

              <button
                type="button"
                onClick={() => setIsMeasurementsExpanded((prev) => !prev)}
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
                {isMeasurementsExpanded ? "Ocultar" : "Mostrar"}
              </button>
            </div>

            {isMeasurementsExpanded && (
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
                        borderBottom: TOKENS.BORDER_DEFAULT,
                        background: "#f3f4f6",
                      }}
                    >
                      <th style={S.td}>Fecha</th>
                      <th style={S.td}>Indicador</th>
                      <th style={S.td}>Valor</th>
                      <th style={S.td}>Unidad</th>
                      <th style={S.td}>Origen</th>
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
                          <td style={S.td}>
                            {new Date(row.measuredAt).toLocaleDateString("es-AR")}
                          </td>
                          <td style={S.td}>{row.label}</td>
                          <td style={S.td}>
                            {row.valueNumber ?? row.valueText ?? "—"}
                          </td>
                          <td style={S.td}>{row.unit ?? "—"}</td>
                          <td style={S.td}>{row.source ?? "Manual"}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </Card>
  );
}