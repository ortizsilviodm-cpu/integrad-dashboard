/* integrad-dashboard/src/views/patientClinical/PatientMedicationsCard.tsx */

import { Card } from "../../components/ui/Card";
import { TOKENS } from "../../theme/tokens";
import { UI } from "../../theme/ui";
import type { PatientMedicationRow } from "../../api/patients";

export type PatientMedicationsCardProps = {
  medications: PatientMedicationRow[];
  medLoading: boolean;
  medError: string | null;
};

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("es-AR");
}

function getTypeBadgeStyle(type: PatientMedicationRow["type"]): React.CSSProperties {
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

function getStatusBadgeStyle(isActive: boolean): React.CSSProperties {
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

export default function PatientMedicationsCard({
  medications,
  medLoading,
  medError,
}: PatientMedicationsCardProps) {
  return (
    <Card>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          marginBottom: 14,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h3 style={{ ...UI.cardTitleH3, marginBottom: 4 }}>
            Tratamiento farmacológico actual
          </h3>
          <p
            style={{
              margin: 0,
              color: TOKENS.COLOR_TEXT_MUTED,
              fontSize: "0.9rem",
            }}
          >
            Perfil terapéutico vigente y trazabilidad básica del tratamiento.
          </p>
        </div>

        {!medLoading && medications.length > 0 && !medError && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "6px 10px",
              borderRadius: 999,
              fontSize: "0.82rem",
              fontWeight: 700,
              background: "#f3f4f6",
              color: "#374151",
              border: "1px solid #e5e7eb",
            }}
          >
            {medications.length} tratamiento{medications.length === 1 ? "" : "s"}
          </div>
        )}
      </div>

      {medLoading && <p>Cargando medicación…</p>}
      {medError && <p style={{ color: UI.errorText.color }}>{medError}</p>}

      {!medLoading && medications.length === 0 && !medError && (
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 14,
            padding: 16,
            background: "#f9fafb",
          }}
        >
          <p style={{ color: TOKENS.COLOR_TEXT_MUTED, fontSize: "0.9rem", margin: 0 }}>
            No hay tratamientos farmacológicos cargados.
          </p>
        </div>
      )}

      {!medLoading && medications.length > 0 && (
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 14,
            background: "#ffffff",
            overflow: "hidden",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                ...UI.table,
                width: "100%",
                fontSize: "0.88rem",
                borderCollapse: "separate",
                borderSpacing: 0,
              }}
            >
              <thead>
                <tr
                  style={{
                    ...UI.thRow,
                    background: "#f9fafb",
                  }}
                >
                  <th
                    style={{
                      ...UI.td,
                      fontWeight: 700,
                      color: "#374151",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Medicamento
                  </th>
                  <th
                    style={{
                      ...UI.td,
                      fontWeight: 700,
                      color: "#374151",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Tipo
                  </th>
                  <th
                    style={{
                      ...UI.td,
                      fontWeight: 700,
                      color: "#374151",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Dosis
                  </th>
                  <th
                    style={{
                      ...UI.td,
                      fontWeight: 700,
                      color: "#374151",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Frecuencia
                  </th>
                  <th
                    style={{
                      ...UI.td,
                      fontWeight: 700,
                      color: "#374151",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Inicio
                  </th>
                  <th
                    style={{
                      ...UI.td,
                      fontWeight: 700,
                      color: "#374151",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Fin
                  </th>
                  <th
                    style={{
                      ...UI.td,
                      fontWeight: 700,
                      color: "#374151",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Estado
                  </th>
                </tr>
              </thead>

              <tbody>
                {medications.map((m, idx) => (
                  <tr
                    key={m.id}
                    style={{
                      background: idx % 2 === 0 ? "#ffffff" : "#fcfcfd",
                    }}
                  >
                    <td
                      style={{
                        ...UI.td,
                        verticalAlign: "top",
                        borderTop: "1px solid #f3f4f6",
                        minWidth: 220,
                      }}
                    >
                      <div style={{ fontWeight: 700, color: "#111827", marginBottom: 2 }}>
                        {m.medicationName}
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "#6b7280" }}>
                        Código: {m.medicationCode}
                      </div>
                    </td>

                    <td
                      style={{
                        ...UI.td,
                        verticalAlign: "top",
                        borderTop: "1px solid #f3f4f6",
                      }}
                    >
                      <span style={getTypeBadgeStyle(m.type)}>
                        {m.type === "CRONICO" ? "Crónico" : "Ocasional"}
                      </span>
                    </td>

                    <td
                      style={{
                        ...UI.td,
                        verticalAlign: "top",
                        borderTop: "1px solid #f3f4f6",
                        color: "#111827",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {m.dose}
                    </td>

                    <td
                      style={{
                        ...UI.td,
                        verticalAlign: "top",
                        borderTop: "1px solid #f3f4f6",
                        color: "#111827",
                        minWidth: 140,
                      }}
                    >
                      {m.frequency}
                    </td>

                    <td
                      style={{
                        ...UI.td,
                        verticalAlign: "top",
                        borderTop: "1px solid #f3f4f6",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatDate(m.startDate)}
                    </td>

                    <td
                      style={{
                        ...UI.td,
                        verticalAlign: "top",
                        borderTop: "1px solid #f3f4f6",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatDate(m.endDate)}
                    </td>

                    <td
                      style={{
                        ...UI.td,
                        verticalAlign: "top",
                        borderTop: "1px solid #f3f4f6",
                      }}
                    >
                      <span style={getStatusBadgeStyle(m.isActive)}>
                        {m.isActive ? "Activo" : "Finalizado"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Card>
  );
}