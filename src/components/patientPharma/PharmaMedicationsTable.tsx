// -------------------------------------------------------------
// integrad-dashboard/src/components/patientPharma/PharmaMedicationsTable.tsx
// Sección: Tratamiento farmacológico indicado (PASO 3.5)
// -------------------------------------------------------------

import type React from "react";
import type { PatientMedicationRow } from "./types";

interface Props {
  loading: boolean;
  error: string | null;
  medications: PatientMedicationRow[];
  formatDate: (value?: string | null) => string;
  renderMedicationTypeChip: (type: "CRONICO" | "OCASIONAL") => React.ReactNode;
}

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
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th>Medicamento</th>
                <th>Código</th>
                <th>Tipo</th>
                <th>Dosis</th>
                <th>Frecuencia</th>
                <th>Vía</th>
                <th>Inicio</th>
                <th>Fin</th>
                <th>Estado</th>
                <th>Prescriptor</th>
              </tr>
            </thead>

            <tbody>
              {medications.map((m) => (
                <tr key={m.id}>
                  <td>{m.medicationName}</td>
                  <td>{m.medicationCode}</td>

                  {/* Chip de tipo */}
                  <td>{renderMedicationTypeChip(m.type)}</td>

                  <td>{m.dose}</td>
                  <td>{m.frequency}</td>
                  <td>{m.route ?? "—"}</td>
                  <td>{formatDate(m.startDate)}</td>
                  <td>{formatDate(m.endDate)}</td>
                  <td>{m.isActive ? "Activo" : "Inactivo"}</td>
                  <td>{m.prescriberName ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
