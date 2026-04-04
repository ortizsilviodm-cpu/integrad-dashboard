/* integrad-dashboard/src/components/educators/EducatorsKpiRow.tsx */

import type { CSSProperties } from "react";

import { Card } from "../ui/Card";

type EducatorsKpiRowProps = {
  totalPatients: number;
  selectedPatientName: string | null;
  totalInteractions: number;
  loading?: boolean;
};

function buildValue(value: string, loading: boolean): string {
  if (loading) {
    return "Cargando...";
  }

  return value;
}

export default function EducatorsKpiRow({
  totalPatients,
  selectedPatientName,
  totalInteractions,
  loading = false,
}: EducatorsKpiRowProps) {
  return (
    <div style={styles.grid}>
      <Card style={{ ...styles.card, ...styles.cardPatients }}>
        <div style={{ ...styles.label, ...styles.labelPatients }}>
          Pacientes en bandeja
        </div>
        <div style={{ ...styles.value, ...styles.valuePatients }}>
          {buildValue(String(totalPatients), loading)}
        </div>
        <div style={{ ...styles.helper, ...styles.helperPatients }}>
          Caseload operativo del módulo Educadores
        </div>
      </Card>

      <Card style={{ ...styles.card, ...styles.cardSelected }}>
        <div style={{ ...styles.label, ...styles.labelSelected }}>
          Paciente seleccionado
        </div>
        <div style={{ ...styles.value, ...styles.valueSelected }}>
          {buildValue(selectedPatientName ?? "Sin selección", loading)}
        </div>
        <div style={{ ...styles.helper, ...styles.helperSelected }}>
          Caso activo para seguimiento educativo
        </div>
      </Card>

      <Card style={{ ...styles.card, ...styles.cardInteractions }}>
        <div style={{ ...styles.label, ...styles.labelInteractions }}>
          Interacciones recientes
        </div>
        <div style={{ ...styles.value, ...styles.valueInteractions }}>
          {buildValue(String(totalInteractions), loading)}
        </div>
        <div style={{ ...styles.helper, ...styles.helperInteractions }}>
          Historial visible del paciente activo
        </div>
      </Card>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 16,
  },
  card: {
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 8,
    minHeight: 112,
    borderWidth: 1,
    borderStyle: "solid",
    boxShadow: "0 8px 20px rgba(15, 23, 42, 0.05)",
  },
  cardPatients: {
    background:
      "linear-gradient(180deg, rgba(239, 246, 255, 0.92) 0%, rgba(255, 255, 255, 1) 100%)",
    borderColor: "#bfdbfe",
  },
  cardSelected: {
    background:
      "linear-gradient(180deg, rgba(240, 253, 244, 0.92) 0%, rgba(255, 255, 255, 1) 100%)",
    borderColor: "#bbf7d0",
  },
  cardInteractions: {
    background:
      "linear-gradient(180deg, rgba(255, 247, 237, 0.92) 0%, rgba(255, 255, 255, 1) 100%)",
    borderColor: "#fed7aa",
  },
  label: {
    fontSize: 12,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  labelPatients: {
    color: "#1d4ed8",
  },
  labelSelected: {
    color: "#15803d",
  },
  labelInteractions: {
    color: "#c2410c",
  },
  value: {
    fontSize: 24,
    fontWeight: 700,
    lineHeight: 1.2,
    wordBreak: "break-word",
  },
  valuePatients: {
    color: "#0f172a",
  },
  valueSelected: {
    color: "#14532d",
  },
  valueInteractions: {
    color: "#9a3412",
  },
  helper: {
    fontSize: 13,
    lineHeight: 1.4,
  },
  helperPatients: {
    color: "#475569",
  },
  helperSelected: {
    color: "#166534",
  },
  helperInteractions: {
    color: "#9a3412",
  },
};