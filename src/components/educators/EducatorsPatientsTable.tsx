/* integrad-dashboard/src/components/educators/EducatorsPatientsTable.tsx */

import type { CSSProperties } from "react";

import { Card } from "../ui/Card";

import type { EducatorPatientRow } from "../../types/educators.types";
import {
  formatGlucoseValue,
  formatLastUpdateLabel,
  formatTrendLabel,
  getPatientStatusLabel,
} from "../../logic/educators.logic";

type EducatorsPatientsTableProps = {
  patients: EducatorPatientRow[];
  selectedPatientId: string | null;
  loading?: boolean;
  error?: string | null;
  hasMore?: boolean;
  onSelectPatient: (patient: EducatorPatientRow) => void;
  onLoadMore?: () => void;
};

function getInitials(fullName?: string | null): string {
  if (!fullName) {
    return "—";
  }

  const parts = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return "—";
  }

  return parts.map((part) => part.charAt(0).toUpperCase()).join("");
}

function getStatusBadgeStyle(
  patient: EducatorPatientRow,
  isSelected: boolean,
): CSSProperties {
  if (isSelected) {
    return styles.selectedBadge;
  }

  switch (patient.status) {
    case "ACTIVE":
      return styles.badgeActive;
    case "FOLLOWUP":
      return styles.badgeFollowup;
    case "PENDING":
      return styles.badgePending;
    case "RISK":
      return styles.badgeRisk;
    default:
      return styles.badgeNeutral;
  }
}

export default function EducatorsPatientsTable({
  patients,
  selectedPatientId,
  loading = false,
  error = null,
  onSelectPatient,
}: EducatorsPatientsTableProps) {
  return (
    <Card style={styles.card}>
      <div style={styles.header}>
        <div>
          <h3 style={styles.title}>Bandeja operativa</h3>
          <p style={styles.subtitle}>
            Seleccioná un paciente para abrir el panel de seguimiento educativo.
          </p>
        </div>
      </div>

      {error ? (
        <div style={styles.feedbackError}>{error}</div>
      ) : null}

      {!error && loading && patients.length === 0 ? (
        <div style={styles.feedbackNeutral}>Cargando pacientes...</div>
      ) : null}

      {!error && !loading && patients.length === 0 ? (
        <div style={styles.feedbackNeutral}>
          No hay pacientes disponibles en la bandeja.
        </div>
      ) : null}

      {patients.length > 0 ? (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.headCell}>Paciente</th>
                <th style={styles.headCell}>Estado educativo</th>
                <th style={styles.headCell}>Contexto</th>
                <th style={styles.headCell}>Última actualización</th>
                <th style={styles.headCell}>Acción</th>
              </tr>
            </thead>

            <tbody>
              {patients.map((patient) => {
                const isSelected = patient.id === selectedPatientId;
                const initials = getInitials(patient.fullName);
                const statusLabel = getPatientStatusLabel(patient);

                return (
                  <tr
                    key={patient.id}
                    style={isSelected ? styles.selectedRow : undefined}
                  >
                    <td style={styles.bodyCell}>
                      <div style={styles.patientIdentity}>
                        <div
                          style={
                            isSelected ? styles.selectedAvatar : styles.avatar
                          }
                        >
                          {initials}
                        </div>

                        <div style={styles.patientIdentityText}>
                          <div style={styles.patientName}>
                            {patient.fullName ?? "Paciente"}
                          </div>
                          <div style={styles.patientMeta}>
                            {patient.diabetesType ?? "Tipo no informado"}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td style={styles.bodyCell}>
                      <span style={getStatusBadgeStyle(patient, isSelected)}>
                        {statusLabel}
                      </span>
                    </td>

                    <td style={styles.bodyCell}>
                      <div style={styles.contextPrimary}>
                        {formatGlucoseValue(patient.latestGlucose)}
                      </div>
                      <div style={styles.contextSecondary}>
                        {formatTrendLabel(patient.trend)}
                      </div>
                    </td>

                    <td style={styles.bodyCell}>
                      {formatLastUpdateLabel(patient.lastUpdate)}
                    </td>

                    <td style={styles.bodyCell}>
                      <button
                        type="button"
                        style={isSelected ? styles.selectedButton : styles.button}
                        onClick={() => onSelectPatient(patient)}
                      >
                        {isSelected ? "Caso activo" : "Seleccionar"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </Card>
  );
}

const styles: Record<string, CSSProperties> = {
  card: {
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  title: {
    margin: 0,
    fontSize: 20,
    fontWeight: 700,
    color: "#0f172a",
  },
  subtitle: {
    margin: "6px 0 0 0",
    fontSize: 14,
    color: "#475569",
    lineHeight: 1.5,
  },
  feedbackNeutral: {
    padding: "14px 16px",
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    color: "#475569",
    fontSize: 14,
  },
  feedbackError: {
    padding: "14px 16px",
    borderRadius: 12,
    backgroundColor: "#fef2f2",
    color: "#b91c1c",
    fontSize: 14,
  },
  tableWrapper: {
    overflowX: "auto",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: 920,
  },
  headCell: {
    textAlign: "left",
    padding: "12px 14px",
    borderBottom: "1px solid #e2e8f0",
    fontSize: 12,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    color: "#64748b",
    backgroundColor: "#f8fafc",
  },
  bodyCell: {
    padding: "14px",
    borderBottom: "1px solid #e2e8f0",
    verticalAlign: "middle",
    fontSize: 14,
    color: "#0f172a",
    backgroundColor: "#ffffff",
  },
  selectedRow: {
    backgroundColor: "#f8fafc",
  },
  patientIdentity: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    minWidth: 0,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: "#e2e8f0",
    color: "#334155",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 700,
    flexShrink: 0,
  },
  selectedAvatar: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: "#2563eb",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 700,
    flexShrink: 0,
  },
  patientIdentityText: {
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  patientName: {
    fontSize: 14,
    fontWeight: 700,
    color: "#0f172a",
  },
  patientMeta: {
    fontSize: 13,
    color: "#64748b",
  },
  badgeNeutral: {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 10px",
    borderRadius: 999,
    backgroundColor: "#e2e8f0",
    color: "#334155",
    fontSize: 12,
    fontWeight: 600,
    border: "1px solid #cbd5e1",
  },
  badgeFollowup: {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 10px",
    borderRadius: 999,
    backgroundColor: "#eff6ff",
    color: "#1d4ed8",
    fontSize: 12,
    fontWeight: 700,
    border: "1px solid #bfdbfe",
  },
  badgeActive: {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 10px",
    borderRadius: 999,
    backgroundColor: "#ecfdf5",
    color: "#166534",
    fontSize: 12,
    fontWeight: 700,
    border: "1px solid #bbf7d0",
  },
  badgePending: {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 10px",
    borderRadius: 999,
    backgroundColor: "#fff7ed",
    color: "#c2410c",
    fontSize: 12,
    fontWeight: 700,
    border: "1px solid #fed7aa",
  },
  badgeRisk: {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 10px",
    borderRadius: 999,
    backgroundColor: "#fef2f2",
    color: "#b91c1c",
    fontSize: 12,
    fontWeight: 700,
    border: "1px solid #fecaca",
  },
  selectedBadge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 10px",
    borderRadius: 999,
    backgroundColor: "#dbeafe",
    color: "#1d4ed8",
    fontSize: 12,
    fontWeight: 700,
    border: "1px solid #93c5fd",
  },
  contextPrimary: {
    fontSize: 14,
    fontWeight: 600,
    color: "#0f172a",
  },
  contextSecondary: {
    marginTop: 4,
    fontSize: 13,
    color: "#64748b",
  },
  button: {
    border: "1px solid #cbd5e1",
    backgroundColor: "#ffffff",
    color: "#0f172a",
    borderRadius: 10,
    padding: "8px 12px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  selectedButton: {
    border: "1px solid #93c5fd",
    backgroundColor: "#eff6ff",
    color: "#1d4ed8",
    borderRadius: 10,
    padding: "8px 12px",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  },
};