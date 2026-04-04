/* integrad-dashboard/src/components/patientPharma/PharmaMedicationsTable.tsx */

import type React from "react";
import type { PatientMedicationRow } from "./types";

interface Props {
  loading: boolean;
  error: string | null;
  medications: PatientMedicationRow[];
  formatDate: (value?: string | null) => string;
  renderMedicationTypeChip: (type: "CRONICO" | "OCASIONAL") => React.ReactNode;
}

const HEADER_CELL_STYLE: React.CSSProperties = {
  textAlign: "left",
  padding: "10px 12px",
  fontSize: "0.78rem",
  fontWeight: 700,
  color: "#374151",
  borderBottom: "1px solid #e5e7eb",
  whiteSpace: "nowrap",
  verticalAlign: "middle",
};

const BODY_CELL_STYLE: React.CSSProperties = {
  padding: "10px 12px",
  fontSize: "0.82rem",
  color: "#111827",
  borderBottom: "1px solid #f1f5f9",
  verticalAlign: "middle",
};

export default function PharmaMedicationsTable({
  loading,
  error,
  medications,
  formatDate,
  renderMedicationTypeChip,
}: Props) {
  return (
    <section
      style={{
        background: "#ffffff",
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
      }}
    >
      <h3 style={{ margin: 0, marginBottom: 8, fontSize: "0.95rem" }}>
        Tratamiento farmacológico indicado
      </h3>

      {loading && <p>Cargando medicación…</p>}

      {error && (
        <p style={{ fontSize: "0.8rem", color: "#b91c1c" }}>{error}</p>
      )}

      {!loading && !error && medications.length === 0 && (
        <p style={{ fontSize: "0.85rem", color: "#6b7280" }}>
          No se registran tratamientos farmacológicos activos o históricos.
        </p>
      )}

      {!loading && !error && medications.length > 0 && (
        <div style={{ overflowX: "auto", marginTop: 8 }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              tableLayout: "fixed",
            }}
          >
            <colgroup>
              <col style={{ width: "15%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "6%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "6%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "17%" }} />
            </colgroup>

            <thead>
              <tr>
                <th style={HEADER_CELL_STYLE}>Medicamento</th>
                <th style={HEADER_CELL_STYLE}>Código</th>
                <th style={HEADER_CELL_STYLE}>Tipo</th>
                <th style={HEADER_CELL_STYLE}>Dosis</th>
                <th style={HEADER_CELL_STYLE}>Frecuencia</th>
                <th style={HEADER_CELL_STYLE}>Vía</th>
                <th style={HEADER_CELL_STYLE}>Inicio</th>
                <th style={HEADER_CELL_STYLE}>Fin</th>
                <th style={HEADER_CELL_STYLE}>Estado</th>
                <th style={HEADER_CELL_STYLE}>Prescriptor</th>
              </tr>
            </thead>

            <tbody>
              {medications.map((m) => (
                <tr key={m.id}>
                  <td
                    style={{
                      ...BODY_CELL_STYLE,
                      fontWeight: 500,
                      wordBreak: "break-word",
                    }}
                  >
                    {m.medicationName}
                  </td>

                  <td style={{ ...BODY_CELL_STYLE, color: "#4b5563" }}>
                    {m.medicationCode}
                  </td>

                  <td style={BODY_CELL_STYLE}>
                    {renderMedicationTypeChip(m.type)}
                  </td>

                  <td style={{ ...BODY_CELL_STYLE, whiteSpace: "nowrap" }}>
                    {m.dose}
                  </td>

                  <td
                    style={{
                      ...BODY_CELL_STYLE,
                      wordBreak: "break-word",
                    }}
                  >
                    {m.frequency}
                  </td>

                  <td style={{ ...BODY_CELL_STYLE, whiteSpace: "nowrap" }}>
                    {m.route ?? "—"}
                  </td>

                  <td style={{ ...BODY_CELL_STYLE, whiteSpace: "nowrap" }}>
                    {formatDate(m.startDate)}
                  </td>

                  <td style={{ ...BODY_CELL_STYLE, whiteSpace: "nowrap" }}>
                    {formatDate(m.endDate)}
                  </td>

                  <td style={{ ...BODY_CELL_STYLE, whiteSpace: "nowrap" }}>
                    {m.isActive ? "Activo" : "Inactivo"}
                  </td>

                  <td
                    style={{
                      ...BODY_CELL_STYLE,
                      wordBreak: "break-word",
                    }}
                  >
                    {m.prescriberName ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}