/* integrad-dashboard/src/components/patientPharma/PharmaAdherenceBars.tsx */

import type { PatientPharmaProfile } from "../../api/pharmaProfile";

interface PharmaAdherenceBarsProps {
  pharma: PatientPharmaProfile | null;
  loading: boolean;
  error: string | null;
}

export default function PharmaAdherenceBars({
  pharma,
  loading,
  error,
}: PharmaAdherenceBarsProps) {
  // Siempre trabajamos con un array (aunque pharma sea null)
  const drugs = pharma?.drugs ?? [];

  if (loading) {
    return <p style={{ fontSize: "0.85rem" }}>Cargando adherencia…</p>;
  }

  if (error) {
    return (
      <p style={{ fontSize: "0.8rem", color: "#b91c1c" }}>
        {error}
      </p>
    );
  }

  if (!drugs.length) {
    return (
      <p style={{ fontSize: "0.85rem", color: "#6b7280" }}>
        No hay medicamentos con dispensas en la ventana analizada.
      </p>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
        marginTop: 4,
      }}
    >
      {drugs.map((drug) => {
        const rawPercent = drug.adherencePercentApprox ?? 0;
        const percent = Math.max(0, Math.min(100, rawPercent));

        let barColor = "#ef4444"; // rojo
        if (percent >= 80) {
          barColor = "#22c55e"; // verde
        } else if (percent >= 60) {
          barColor = "#facc15"; // amarillo
        }

        return (
          <div
            key={`${drug.drugCode || drug.drugName}-bar`}
            style={{ fontSize: "0.8rem" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 2,
              }}
            >
              <span>{drug.drugName}</span>
              <span style={{ color: "#6b7280" }}>{percent}%</span>
            </div>
            <div
              style={{
                width: "100%",
                height: 8,
                borderRadius: 999,
                backgroundColor: "#e5e7eb",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${percent}%`,
                  borderRadius: 999,
                  background: barColor,
                  transition: "width 0.3s ease",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
