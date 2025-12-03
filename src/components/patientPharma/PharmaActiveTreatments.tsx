/* integrad-dashboard/src/components/patientPharma/PharmaActiveTreatments.tsx */

import type { PatientPharmaProfile } from "../../api/pharmaProfile";

export interface PharmaActiveTreatmentsProps {
  // La vista puede mandar `pharma?.drugs ?? null`, así que aceptamos array | null | undefined
  drugs: PatientPharmaProfile["drugs"] | null | undefined;
  loading: boolean;
  error: string | null;
}

export default function PharmaActiveTreatments({
  drugs,
  loading,
  error,
}: PharmaActiveTreatmentsProps) {
  // Siempre trabajamos con un array seguro
  const list = drugs ?? [];

  return (
    <section
      style={{
        background: "#ffffff",
        borderRadius: 12,
        padding: 16,
        boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
      }}
    >
      <h3 style={{ margin: 0, marginBottom: 8, fontSize: "0.95rem" }}>
        Tratamientos activos
      </h3>

      {loading && <p>Cargando…</p>}

      {error && !loading && (
        <p style={{ fontSize: "0.8rem", color: "#b91c1c" }}>{error}</p>
      )}

      {!loading && !error && list.length === 0 && (
        <p style={{ fontSize: "0.85rem", color: "#6b7280", marginBottom: 0 }}>
          No se identifican tratamientos activos a partir de las dispensas
          registradas.
        </p>
      )}

      {!loading && !error && list.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            fontSize: "0.8rem",
            marginTop: 4,
          }}
        >
          {list.map((drug) => (
            <span
              key={`${drug.drugCode || drug.drugName}-badge`}
              style={{
                display: "inline-flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 4,
                padding: "4px 10px",
                borderRadius: 999,
                backgroundColor: "#eef2ff",
                color: "#312e81",
                fontWeight: 600,
              }}
            >
              {drug.drugName}
              {drug.drugCode && (
                <span
                  style={{
                    fontWeight: 400,
                    fontSize: "0.75rem",
                    opacity: 0.9,
                    marginLeft: 4,
                  }}
                >
                  · {drug.drugCode}
                </span>
              )}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
