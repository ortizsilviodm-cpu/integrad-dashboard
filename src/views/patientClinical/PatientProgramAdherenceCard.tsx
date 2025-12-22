// integrad-dashboard/src/views/patientClinical/PatientProgramAdherenceCard.tsx

import type { PatientSummaryResponse } from "../../api/patientSummary";

interface PatientProgramAdherenceCardProps {
  adherence: PatientSummaryResponse["adherence"];
  kpis90d: PatientSummaryResponse["kpis90d"];
}

export default function PatientProgramAdherenceCard({
  adherence,
  kpis90d,
}: PatientProgramAdherenceCardProps) {
  // Contrato esperado: adherence no debería ser null, pero mantenemos fallback defensivo.
  const adherenceSafe: PatientSummaryResponse["adherence"] = adherence ?? {
    daysWindow: 90,
    coveragePercent: Number.NaN,
    gapDays: 0,
    isLowAdherence: false,
  };

  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: 16,
        padding: 16,
        boxShadow: "0 4px 12px rgba(15,23,42,0.06)",
      }}
    >
      <h3
        style={{
          marginTop: 0,
          marginBottom: 8,
          fontSize: "1rem",
          fontWeight: 600,
          color: "#111827",
        }}
      >
        Programa crónico y adherencia
      </h3>

      <p>
        <strong>Adherencia 90 días:</strong>{" "}
        {Number.isFinite(adherenceSafe.coveragePercent)
          ? `${adherenceSafe.coveragePercent.toFixed(0)} %`
          : "Sin dato"}
      </p>
      <p>
        <strong>Días de ventana:</strong> {adherenceSafe.daysWindow}
      </p>
      <p>
        <strong>Días en “bache” de medicación:</strong>{" "}
        {adherenceSafe.gapDays ?? "—"}
      </p>
      <p>
        <strong>Alertas en 90 días:</strong> {kpis90d.alerts}
      </p>
      <p>
        <strong>Dispensas en 90 días:</strong> {kpis90d.dispenses}
      </p>
    </div>
  );
}
