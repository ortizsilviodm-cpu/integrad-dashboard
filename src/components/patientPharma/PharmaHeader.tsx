// -------------------------------------------------------------
// integrad-dashboard/src/components/patientPharma/PharmaHeader.tsx
// Encabezado superior del Perfil Farmacológico Completo
// -------------------------------------------------------------

import type { PatientRow } from "../../api/patients";

interface PharmaHeaderProps {
  patient: PatientRow;
  onClose: () => void;
}

export default function PharmaHeader({ patient, onClose }: PharmaHeaderProps) {
  return (
    <header
      style={{
        padding: "0.75rem 1.5rem",
        borderBottom: "1px solid #e5e7eb",
        backgroundColor: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}
    >
      <div>
        <h2 style={{ margin: 0, fontSize: "1.1rem" }}>
          Perfil farmacológico del paciente
        </h2>
        <p
          className="chart-subtitle"
          style={{ marginTop: 4, fontSize: "0.85rem", color: "#6b7280" }}
        >
          Detalle completo de medicación, familias terapéuticas y adherencia por
          droga. No reemplaza la prescripción ni el criterio clínico.
        </p>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            textAlign: "right",
            fontSize: "0.85rem",
            lineHeight: 1.3,
          }}
        >
          <div>
            <strong>{patient.name}</strong>
          </div>
          <div style={{ color: "#6b7280" }}>
            Documento: {patient.document}
          </div>
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
          Cerrar
        </button>
      </div>
    </header>
  );
}
