/* integrad-dashboard/src/components/patientPharma/PharmaDispenseSummary.tsx */
// PharmaDispenseSummary.tsx
// Resumen general del perfil farmacológico (dispensas)

import type { PatientPharmaProfile } from "../../api/pharmaProfile";

interface Props {
  loading: boolean;
  error: string | null;
  pharma: PatientPharmaProfile | null;
}

export default function PharmaDispenseSummary({ loading, error, pharma }: Props) {
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
        Resumen de medicación (12 meses)
      </h3>

      {loading && <p>Cargando perfil farmacológico…</p>}

      {error && (
        <p style={{ color: "#b91c1c", fontSize: "0.8rem" }}>{error}</p>
      )}

      {!loading && !error && pharma && pharma.drugs.length === 0 && (
        <p style={{ fontSize: "0.9rem", color: "#6b7280" }}>
          No se registran dispensas de medicamentos en la ventana analizada.
        </p>
      )}

      {!loading && !error && pharma && pharma.drugs.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 16,
            fontSize: "0.9rem",
          }}
        >
          <div>
            <strong>Total de medicamentos:</strong>{" "}
            {pharma.summary.totalDrugs}
          </div>
          <div>
            <strong>Crónicos:</strong> {pharma.summary.chronicDrugs}
          </div>
          <div>
            <strong>Ocasionales:</strong> {pharma.summary.occasionalDrugs}
          </div>
        </div>
      )}
    </section>
  );
}
