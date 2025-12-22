// integrad-dashboard/src/views/patientClinical/PatientClinicalHeader.tsx

interface PatientClinicalHeaderProps {
  onClose: () => void;
}

export default function PatientClinicalHeader({
  onClose,
}: PatientClinicalHeaderProps) {
  return (
    <header className="section-header" style={{ marginBottom: 16 }}>
      <div>
        <h2
          style={{
            marginBottom: 4,
            fontSize: "1.4rem",
            fontWeight: 700,
            color: "#0f172a",
          }}
        >
          Ficha clínica del paciente
        </h2>
        <p
          className="chart-subtitle"
          style={{ maxWidth: 640, fontSize: "0.9rem" }}
        >
          Visión 360° del paciente diabético: datos básicos, riesgo clínico,
          indicadores recientes, historial, adherencia, alertas y tratamiento
          farmacológico.
        </p>
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
        ← Volver a la lista
      </button>
    </header>
  );
}
