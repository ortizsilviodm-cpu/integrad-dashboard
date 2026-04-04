/* integrad-dashboard/src/components/educators/EducatorInterventionPanel.tsx */

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, FormEvent, ReactNode } from "react";

import { Card } from "../ui/Card";

import type {
  EducationInteractionForm,
  EducationInteractionItem,
  EducatorPatientRow,
} from "../../types/educators.types";
import {
  formatGlucoseValue,
  formatTrendLabel,
  getPatientContextLine,
  getPatientNoteLabel,
} from "../../logic/educators.logic";
import EducationInteractionHistory from "./EducationInteractionHistory";

type EducatorInterventionPanelProps = {
  patient: EducatorPatientRow | null;
  interactions: EducationInteractionItem[];
  loadingHistory?: boolean;
  historyError?: string | null;
  submitting?: boolean;
  submitError?: string | null;
  onClose?: () => void;
  onSubmit: (form: EducationInteractionForm) => Promise<boolean>;
};

type CollapsibleSectionProps = {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
};

const DEFAULT_FORM: EducationInteractionForm = {
  type: "CALL",
  note: "",
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

function CollapsibleSection({
  title,
  open,
  onToggle,
  children,
}: CollapsibleSectionProps) {
  return (
    <div style={styles.sectionCard}>
      <div style={styles.sectionHeader}>
        <h4 style={styles.sectionTitle}>{title}</h4>

        <button type="button" style={styles.toggleButton} onClick={onToggle}>
          {open ? "Ocultar" : "Mostrar"}
        </button>
      </div>

      {open ? <div style={styles.sectionContent}>{children}</div> : null}
    </div>
  );
}

export default function EducatorInterventionPanel({
  patient,
  interactions,
  loadingHistory = false,
  historyError = null,
  submitting = false,
  submitError = null,
  onClose,
  onSubmit,
}: EducatorInterventionPanelProps) {
  const [form, setForm] = useState<EducationInteractionForm>(DEFAULT_FORM);
  const [contextOpen, setContextOpen] = useState<boolean>(true);
  const [interactionOpen, setInteractionOpen] = useState<boolean>(true);
  const [historyOpen, setHistoryOpen] = useState<boolean>(true);

  useEffect(() => {
    setForm(DEFAULT_FORM);
    setContextOpen(true);
    setInteractionOpen(true);
    setHistoryOpen(true);
  }, [patient?.id]);

  const initials = useMemo(() => {
    return getInitials(patient?.fullName);
  }, [patient]);

  const clinicalDescription = (patient?.clinicalContext?.description ?? "").trim();
  const probableCause = (patient?.clinicalContext?.probableCause ?? "").trim();
  const adherenceMessage = (patient?.adherenceContext?.message ?? "").trim();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const ok = await onSubmit({
      type: form.type,
      note: form.note,
    });

    if (ok) {
      setForm(DEFAULT_FORM);
    }
  };

  if (!patient) {
    return null;
  }

  return (
    <div style={styles.drawer}>
      <div style={styles.backdrop} onClick={onClose} />

      <div style={styles.panelShell}>
        <Card style={styles.card}>
          <div style={styles.headerBlock}>
            <div style={styles.headerTopRow}>
              <span style={styles.eyebrow}>Panel de intervención</span>

              {onClose ? (
                <button
                  type="button"
                  style={styles.closeButton}
                  onClick={onClose}
                >
                  Cerrar
                </button>
              ) : null}
            </div>

            <div style={styles.patientHeader}>
              <div style={styles.avatar}>{initials}</div>

              <div style={styles.patientSummary}>
                <h3 style={styles.patientName}>{patient.fullName ?? "Paciente"}</h3>
                <p style={styles.patientMeta}>
                  {getPatientContextLine(patient)}
                </p>
              </div>
            </div>
          </div>

          <CollapsibleSection
            title="Contexto resumido"
            open={contextOpen}
            onToggle={() => setContextOpen((current) => !current)}
          >
            <div style={styles.contextGrid}>
              <div style={styles.contextBox}>
                <div style={styles.contextLabel}>Última glucemia</div>
                <div style={styles.contextValue}>
                  {formatGlucoseValue(patient.latestGlucose)}
                </div>
              </div>

              <div style={styles.contextBox}>
                <div style={styles.contextLabel}>Tendencia</div>
                <div style={styles.contextValue}>
                  {formatTrendLabel(patient.trend)}
                </div>
              </div>
            </div>

            {clinicalDescription ? (
              <div style={styles.noteBox}>
                <div style={styles.contextLabel}>Contexto clínico</div>
                <div style={styles.noteValue}>{clinicalDescription}</div>
              </div>
            ) : null}

            {probableCause ? (
              <div style={styles.noteBox}>
                <div style={styles.contextLabel}>Posible causa</div>
                <div style={styles.noteValue}>{probableCause}</div>
              </div>
            ) : null}

            {adherenceMessage ? (
              <div style={styles.noteBox}>
                <div style={styles.contextLabel}>Contexto de adherencia</div>
                <div style={styles.noteValue}>{adherenceMessage}</div>
              </div>
            ) : null}

            <div style={styles.noteBox}>
              <div style={styles.contextLabel}>Observación de seguimiento</div>
              <div style={styles.noteValue}>{getPatientNoteLabel(patient)}</div>
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            title="Registrar interacción educativa"
            open={interactionOpen}
            onToggle={() => setInteractionOpen((current) => !current)}
          >
            {submitError ? <div style={styles.errorBox}>{submitError}</div> : null}

            <form style={styles.form} onSubmit={handleSubmit}>
              <label style={styles.field}>
                <span style={styles.label}>Tipo de interacción</span>
                <select
                  value={form.type}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      type: event.target.value as EducationInteractionForm["type"],
                    }))
                  }
                  style={styles.select}
                  disabled={submitting}
                >
                  <option value="CALL">Llamada educativa</option>
                  <option value="MESSAGE">Mensaje de seguimiento</option>
                  <option value="VISIT">Visita educativa</option>
                </select>
              </label>

              <label style={styles.field}>
                <span style={styles.label}>Nota educativa</span>
                <textarea
                  value={form.note}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      note: event.target.value,
                    }))
                  }
                  style={styles.textarea}
                  rows={4}
                  placeholder="Registrá observaciones de adherencia, acompañamiento o seguimiento educativo."
                  disabled={submitting}
                />
              </label>

              <button
                type="submit"
                style={styles.submitButton}
                disabled={submitting}
              >
                {submitting ? "Registrando..." : "Registrar interacción"}
              </button>
            </form>
          </CollapsibleSection>

          <CollapsibleSection
            title="Historial reciente"
            open={historyOpen}
            onToggle={() => setHistoryOpen((current) => !current)}
          >
            <EducationInteractionHistory
              interactions={interactions}
              loading={loadingHistory}
              error={historyError}
            />
          </CollapsibleSection>
        </Card>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  drawer: {
    position: "fixed",
    inset: 0,
    zIndex: 9998,
    display: "flex",
    justifyContent: "flex-end",
  },
  backdrop: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(15, 23, 42, 0.22)",
    backdropFilter: "blur(4px)",
    WebkitBackdropFilter: "blur(4px)",
  },
  panelShell: {
    position: "relative",
    width: "min(920px, 100vw)",
    height: "100vh",
    backgroundColor: "#f8fafc",
    borderLeft: "1px solid #e2e8f0",
    boxShadow: "-12px 0 32px rgba(15, 23, 42, 0.12)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  card: {
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 12,
    height: "100%",
    overflowY: "auto",
    borderRadius: 0,
    boxShadow: "none",
    backgroundColor: "#f8fafc",
  },
  headerBlock: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  headerTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    color: "#64748b",
  },
  closeButton: {
    border: "1px solid #cbd5e1",
    backgroundColor: "#ffffff",
    color: "#334155",
    borderRadius: 10,
    padding: "7px 12px",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
  },
  patientHeader: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    minWidth: 0,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: "#2563eb",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 15,
    fontWeight: 700,
    flexShrink: 0,
  },
  patientSummary: {
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  patientName: {
    margin: 0,
    fontSize: 20,
    lineHeight: 1.2,
    fontWeight: 700,
    color: "#0f172a",
  },
  patientMeta: {
    margin: 0,
    fontSize: 13,
    lineHeight: 1.5,
    color: "#475569",
  },
  sectionCard: {
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    padding: 14,
    backgroundColor: "#ffffff",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  sectionTitle: {
    margin: 0,
    fontSize: 15,
    fontWeight: 700,
    color: "#0f172a",
  },
  toggleButton: {
    border: "1px solid #cbd5e1",
    backgroundColor: "#ffffff",
    color: "#334155",
    borderRadius: 10,
    padding: "6px 10px",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    flexShrink: 0,
  },
  sectionContent: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  contextGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 10,
  },
  contextBox: {
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#f8fafc",
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  contextLabel: {
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    color: "#64748b",
  },
  contextValue: {
    fontSize: 14,
    fontWeight: 600,
    lineHeight: 1.4,
    color: "#0f172a",
  },
  noteBox: {
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#ffffff",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  noteValue: {
    fontSize: 13,
    color: "#0f172a",
    lineHeight: 1.5,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: 600,
    color: "#334155",
  },
  select: {
    border: "1px solid #cbd5e1",
    borderRadius: 10,
    padding: "9px 11px",
    fontSize: 13,
    color: "#0f172a",
    backgroundColor: "#ffffff",
  },
  textarea: {
    border: "1px solid #cbd5e1",
    borderRadius: 10,
    padding: "11px 12px",
    fontSize: 13,
    color: "#0f172a",
    resize: "vertical",
    fontFamily: "inherit",
    backgroundColor: "#ffffff",
  },
  submitButton: {
    border: "1px solid #2563eb",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    borderRadius: 10,
    padding: "9px 13px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    alignSelf: "flex-start",
  },
  errorBox: {
    padding: "11px 12px",
    borderRadius: 12,
    backgroundColor: "#fef2f2",
    color: "#b91c1c",
    fontSize: 13,
  },
};