// integrad-dashboard/src/views/patientClinical/PatientIdentityCard.tsx

import type { PatientSummaryResponse } from "../../api/patientSummary";

interface PatientIdentityCardProps {
  patient: PatientSummaryResponse["patient"];
}

export default function PatientIdentityCard({ patient }: PatientIdentityCardProps) {
  const membership = patient.membershipCode ?? "—";

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
        Datos del paciente
      </h3>

      <p>
        <strong>Nombre:</strong> {patient.fullName}
      </p>
      <p>
        <strong>Documento:</strong> {patient.documentNumber}
      </p>
      <p>
        <strong>Teléfono:</strong> {patient.phone || "No registrado"}
      </p>
      <p>
        <strong>Obra social:</strong> {patient.payerCode || "—"}{" "}
        {patient.healthPlan ? `· ${patient.healthPlan}` : ""}
      </p>
      <p>
        <strong>Nº afiliado:</strong> {membership}
      </p>
    </div>
  );
}
