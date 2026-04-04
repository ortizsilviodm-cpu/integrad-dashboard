/* integrad-dashboard\src\pages\FollowupCaseloadPage.tsx */

import { useEffect, useMemo, useState } from "react";
import {
  fetchFollowupEvents,
  takeFollowupEvent,
  closeFollowupEvent,
  fetchFollowupEventActions,
  createFollowupEventAction,
  type FollowupEventStatus,
  type FollowupAssigned,
  type FollowupSla,
  type FollowupEventRow,
  type FollowupEventActionRow,
  type FollowupEventActionType,
  type FollowupEventActionOutcome,
  type FollowupResolutionType,
} from "../api/followup";
import {
  fetchEducationInteractions,
  createEducationInteraction,
  type EducationInteractionRow,
} from "../api/education";
import { getAuthToken } from "../store/authStore";
import { InterventionPanel } from "../components/followup/InterventionPanel";
import { PatientAvatar } from "../components/common/PatientAvatar";

const PAGE_LIMIT = 20;

/* ----------------------------- */
/* Labels (UI ES)                */
/* ----------------------------- */

const STATUS_LABEL: Record<FollowupEventStatus, string> = {
  OPEN: "Pendiente",
  IN_PROGRESS: "En curso",
  ESCALATED: "Escalado",
  CLOSED: "Controlado",
};

const ACTION_TYPE_LABEL: Record<FollowupEventActionType, string> = {
  CALL: "Llamada",
  WHATSAPP: "WhatsApp",
  EDUCATION: "Educación",
  DERIVATION: "Derivación",
  NOTE: "Nota interna",
  CLOSE: "Cierre",
  ESCALATE: "Escalar",
};

const OUTCOME_LABEL: Record<FollowupEventActionOutcome, string> = {
  CONTACTED: "Contactado",
  NO_RESPONSE: "Sin respuesta",
  RESOLVED: "Resuelto",
  ESCALATED: "Escalado",
  INFO: "Informativo",
};

function severityLabel(raw: string): string {
  const v = String(raw || "")
    .toUpperCase()
    .trim();
  if (v === "LOW") return "Baja";
  if (v === "MEDIUM") return "Media";
  if (v === "HIGH") return "Alta";
  if (v === "CRITICAL") return "Crítica";
  return raw;
}

function severityPillStyle(raw: string): React.CSSProperties {
  const v = String(raw || "")
    .toUpperCase()
    .trim();

  if (v === "CRITICAL") {
    return {
      background: "#dc2626",
      color: "#ffffff",
      border: "1px solid #dc2626",
    };
  }

  if (v === "HIGH") {
    return {
      background: "#f97316",
      color: "#ffffff",
      border: "1px solid #f97316",
    };
  }

  if (v === "MEDIUM") {
    return {
      background: "#eab308",
      color: "#ffffff",
      border: "1px solid #eab308",
    };
  }

  return {
    background: "#16a34a",
    color: "#ffffff",
    border: "1px solid #16a34a",
  };
}

function categoryLabel(raw: string): string {
  const value = String(raw || "")
    .toUpperCase()
    .trim();

  if (value === "CLINICAL") return "Clínico";
  if (value === "OPERATIONAL") return "Operativo";
  if (value === "ADHERENCE") return "Adherencia";
  if (value === "PREVENTIVE") return "Preventivo";

  return raw;
}

function eventLabel(row: FollowupEventRow): string {
  const description = row.clinicalContext?.description?.trim();
  if (description) return description;

  const type = String(row.type || "")
    .toUpperCase()
    .trim();
  const category = String(row.category || "")
    .toUpperCase()
    .trim();

  if (type === "WELCOME_EMAIL_QUEUED") {
    return "Email de bienvenida";
  }

  if (type.includes("CRITICAL")) {
    return "Alerta crítica clínica";
  }

  if (type.includes("HIGH")) {
    return "Alerta alta clínica";
  }

  if (type.includes("MEDIUM")) {
    return "Seguimiento clínico";
  }

  if (type.includes("LOW")) {
    return category === "OPERATIONAL"
      ? "Seguimiento operativo"
      : "Seguimiento clínico";
  }

  return category === "OPERATIONAL"
    ? "Seguimiento operativo"
    : "Seguimiento clínico";
}

function probableCauseLabel(row: FollowupEventRow): string | null {
  const cause = row.clinicalContext?.probableCause?.trim();
  return cause || null;
}

function adherenceLabel(row: FollowupEventRow): string {
  const status = row.adherenceContext?.status;

  if (status === "CRITICAL") {
    return "Sin medicación";
  }

  if (status === "WARNING") {
    return "Próximo a quedarse sin medicación";
  }

  return "Cobertura de medicación OK";
}

function adherencePillStyle(row: FollowupEventRow): React.CSSProperties {
  const status = row.adherenceContext?.status;

  if (status === "CRITICAL") {
    return {
      background: "#fee2e2",
      color: "#991b1b",
      border: "1px solid #fecaca",
    };
  }

  if (status === "WARNING") {
    return {
      background: "#fff7ed",
      color: "#9a3412",
      border: "1px solid #fed7aa",
    };
  }

  return {
    background: "#ecfdf5",
    color: "#166534",
    border: "1px solid #bbf7d0",
  };
}

function adherenceSecondaryLabel(row: FollowupEventRow): string | null {
  const daysRemaining = row.adherenceContext?.daysRemaining;

  if (daysRemaining === null || daysRemaining === undefined) {
    return row.adherenceContext?.operationalMessage ?? null;
  }

  if (daysRemaining === 1) {
    return "1 día restante";
  }

  return `${daysRemaining} días restantes`;
}

function statusCellContent(row: FollowupEventRow): React.ReactNode {
  if (row.status === "IN_PROGRESS") {
    return (
      <div>
        <div style={{ fontWeight: 600, color: "#374151" }}>En curso</div>

        <div style={{ fontSize: 12, color: "#6b7280" }}>
          {row.assignedTo
            ? `Ocupado por ${row.assignedTo.displayName}`
            : row.assignedToUserId
              ? "Ocupado"
              : "Asignado"}
        </div>
      </div>
    );
  }

  if (row.status === "CLOSED") {
    return (
      <span
        style={{
          background: "#16a34a",
          color: "#ffffff",
          border: "1px solid #16a34a",
          padding: "4px 10px",
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 700,
          display: "inline-block",
          whiteSpace: "nowrap",
        }}
      >
        Controlado
      </span>
    );
  }

  return STATUS_LABEL[row.status] ?? row.status;
}

function canTakeEvent(row: FollowupEventRow): boolean {
  return row.status === "OPEN" && !row.assignedToUserId;
}

function readCurrentUserEmail(): string | null {
  const token = getAuthToken();
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length < 2) return null;

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const decoded = JSON.parse(window.atob(padded));
    return typeof decoded.email === "string"
      ? decoded.email.trim().toLowerCase()
      : null;
  } catch {
    return null;
  }
}

function isOwnedByCurrentUser(
  row: FollowupEventRow,
  currentUserEmail: string | null,
): boolean {
  if (!currentUserEmail) return false;
  const assignedEmail = row.assignedTo?.displayName?.trim().toLowerCase();
  return Boolean(assignedEmail && assignedEmail === currentUserEmail);
}

function isLockedForCurrentUser(
  row: FollowupEventRow,
  currentUserEmail: string | null,
): boolean {
  return (
    row.status === "IN_PROGRESS" &&
    Boolean(row.assignedToUserId) &&
    !isOwnedByCurrentUser(row, currentUserEmail)
  );
}

/* ----------------------------- */
/* Botones                       */
/* ----------------------------- */

const btnBase: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 999,
  border: "1px solid #e5e7eb",
  background: "#ffffff",
  color: "#374151",
  fontWeight: 600,
  cursor: "pointer",
};

const btnPrimary: React.CSSProperties = {
  ...btnBase,
  background: "var(--color-primary, #2f42ad)",
  border: "1px solid rgba(47, 66, 173, 1)",
  color: "#ffffff",
};

const btnDanger: React.CSSProperties = {
  ...btnBase,
  background: "var(--color-error, #dc2626)",
  border: "1px solid rgba(220, 38, 38, 1)",
  color: "#ffffff",
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#6b7280",
  marginBottom: 6,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 0.3,
};

const historyListStyle: React.CSSProperties = {
  display: "grid",
  gap: 10,
};

const historyRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  background: "#f9fafb",
};

const historyLeftColumnStyle: React.CSSProperties = {
  minWidth: 0,
  display: "grid",
  gap: 4,
};

const historyRightColumnStyle: React.CSSProperties = {
  flexShrink: 0,
  fontSize: 12,
  color: "#6b7280",
  whiteSpace: "nowrap",
};

function getSuggestedActionBySeverity(severity: string): {
  actionType: FollowupEventActionType;
  outcome: FollowupEventActionOutcome;
} {
  const value = String(severity || "")
    .toUpperCase()
    .trim();

  if (value === "CRITICAL") {
    return {
      actionType: "CALL",
      outcome: "CONTACTED",
    };
  }

  if (value === "HIGH") {
    return {
      actionType: "WHATSAPP",
      outcome: "CONTACTED",
    };
  }

  if (value === "MEDIUM") {
    return {
      actionType: "EDUCATION",
      outcome: "INFO",
    };
  }

  return {
    actionType: "NOTE",
    outcome: "INFO",
  };
}

function getActionSuggestionText(row: FollowupEventRow | null): string {
  if (!row) {
    return "Seleccioná una acción clínica según prioridad del caso.";
  }

  const severity = String(row.severity || "")
    .toUpperCase()
    .trim();
  const category = String(row.category || "")
    .toUpperCase()
    .trim();

  if (row.adherenceContext?.status === "CRITICAL") {
    return "Sugerencia inicial: contactar al paciente para verificar retiro de medicación.";
  }

  if (row.adherenceContext?.status === "WARNING") {
    return "Sugerencia inicial: confirmar próximo retiro de medicación y continuidad del tratamiento.";
  }

  if (severity === "CRITICAL") {
    return "Sugerencia inicial: contacto inmediato con el paciente (alta prioridad).";
  }

  if (severity === "HIGH") {
    return "Sugerencia inicial: contacto en el día para validar situación clínica y adherencia.";
  }

  if (severity === "MEDIUM") {
    return "Sugerencia inicial: intervención educativa o seguimiento breve según contexto.";
  }

  if (category === "OPERATIONAL") {
    return "Sugerencia inicial: nota interna o contacto operativo para resolver la gestión pendiente.";
  }

  return "Sugerencia inicial: registrar nota clínica o seguimiento preventivo según evolución.";
}

function getSuggestionStyle(row: FollowupEventRow | null): React.CSSProperties {
  if (row?.adherenceContext?.status === "CRITICAL") {
    return {
      background: "#fee2e2",
      border: "1px solid #fecaca",
      color: "#991b1b",
    };
  }

  if (row?.adherenceContext?.status === "WARNING") {
    return {
      background: "#fff7ed",
      border: "1px solid #fed7aa",
      color: "#9a3412",
    };
  }

  const v = String(row?.severity || "")
    .toUpperCase()
    .trim();

  if (v === "CRITICAL") {
    return {
      background: "#fee2e2",
      border: "1px solid #fecaca",
      color: "#991b1b",
    };
  }

  if (v === "HIGH") {
    return {
      background: "#fff7ed",
      border: "1px solid #fed7aa",
      color: "#9a3412",
    };
  }

  if (v === "MEDIUM") {
    return {
      background: "#fef3c7",
      border: "1px solid #fde68a",
      color: "#92400e",
    };
  }

  return {
    background: "#ecfdf5",
    border: "1px solid #bbf7d0",
    color: "#166534",
  };
}

export default function FollowupCaseloadPage() {
  const [rows, setRows] = useState<FollowupEventRow[]>([]);
  const [status, setStatus] = useState<FollowupEventStatus>("OPEN");
  const [assigned, setAssigned] = useState<FollowupAssigned>("any");
  const [sla, setSla] = useState<FollowupSla>("any");

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [hasNext, setHasNext] = useState(false);

  const [takingEventId, setTakingEventId] = useState<string | null>(null);
  const [closingEventId, setClosingEventId] = useState<string | null>(null);
  const [closingResolutionType, setClosingResolutionType] =
    useState<FollowupResolutionType | null>(null);
  const [closingNote, setClosingNote] = useState("");
  const [confirmingClose, setConfirmingClose] = useState(false);

  /* ----------------------------- */
  /* Panel Acciones                */
  /* ----------------------------- */

  const [actionsOpen, setActionsOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const selectedEvent = useMemo(() => {
    if (!selectedEventId) return null;
    return rows.find((r) => r.id === selectedEventId) ?? null;
  }, [rows, selectedEventId]);

  const currentUserEmail = useMemo(() => readCurrentUserEmail(), []);
  const selectedEventLocked = selectedEvent
    ? isLockedForCurrentUser(selectedEvent, currentUserEmail)
    : false;

  const [actionsLoading, setActionsLoading] = useState(false);
  const [actionsError, setActionsError] = useState<string | null>(null);
  const [actions, setActions] = useState<FollowupEventActionRow[]>([]);

  const [education, setEducation] = useState<EducationInteractionRow[]>([]);
  const [educationLoading, setEducationLoading] = useState(false);
  const [educationError, setEducationError] = useState<string | null>(null);

  const [newActionType, setNewActionType] =
    useState<FollowupEventActionType>("WHATSAPP");
  const [newOutcome, setNewOutcome] =
    useState<FollowupEventActionOutcome>("CONTACTED");
  const [newNote, setNewNote] = useState("");
  const [creatingAction, setCreatingAction] = useState(false);

  const [newEducationNote, setNewEducationNote] = useState("");
  const [creatingEducation, setCreatingEducation] = useState(false);

  useEffect(() => {
    if (!actionsOpen || !selectedEvent) return;

    const suggestion = getSuggestedActionBySeverity(selectedEvent.severity);
    setNewActionType(suggestion.actionType);
    setNewOutcome(suggestion.outcome);
  }, [actionsOpen, selectedEvent]);

  async function loadFirstPage() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetchFollowupEvents({
        status,
        assigned,
        sla,
        limit: PAGE_LIMIT,
      });

      setRows(res.data);
      setHasNext(Boolean(res.meta.hasNext));
      setNextCursor(res.meta.nextCursor);
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "Error cargando seguimiento";
      setError(message);
      setRows([]);
      setHasNext(false);
      setNextCursor(undefined);
    } finally {
      setLoading(false);
    }
  }

  async function loadMore() {
    if (!hasNext || !nextCursor) return;

    setLoadingMore(true);
    setError(null);

    try {
      const res = await fetchFollowupEvents({
        status,
        assigned,
        sla,
        limit: PAGE_LIMIT,
        cursor: nextCursor,
      });

      const existingIds = new Set(rows.map((r) => r.id));
      const appended = res.data.filter((r) => !existingIds.has(r.id));

      setRows((prev) => [...prev, ...appended]);
      setHasNext(Boolean(res.meta.hasNext));
      setNextCursor(res.meta.nextCursor);
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "Error cargando más eventos";
      setError(message);
    } finally {
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    closeActionsModal();
    setRows([]);
    setHasNext(false);
    setNextCursor(undefined);
    loadFirstPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, assigned, sla]);

  async function onTake(id: string) {
    setTakingEventId(id);
    setError(null);
    setSuccessMessage(null);

    try {
      await takeFollowupEvent(id);
      setSuccessMessage("Evento tomado correctamente.");
      await loadFirstPage();
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "Error tomando el evento";
      setError(message);
    } finally {
      setTakingEventId(null);
    }
  }

  function onClose(id: string) {
    setClosingEventId(id);
    setClosingResolutionType(null);
    setClosingNote("");
    setError(null);
    setSuccessMessage(null);
  }

  async function onConfirmClose() {
    if (!selectedEvent) return;
    if (!closingResolutionType) return;

    setConfirmingClose(true);
    setError(null);
    setSuccessMessage(null);
    setActionsError(null);

    try {
      await closeFollowupEvent(selectedEvent.id, {
        resolutionType: closingResolutionType,
        ...(closingNote.trim() ? { note: closingNote.trim() } : {}),
      });

      setSuccessMessage("Evento cerrado correctamente.");
      closeActionsModal();
      await loadFirstPage();
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "Error cerrando el evento";
      setError(message);
    } finally {
      setConfirmingClose(false);
    }
  }

  async function openActions(eventId: string) {
    setSelectedEventId(eventId);
    setActionsOpen(true);

    setActionsError(null);
    setActionsLoading(true);
    setActions([]);
    setEducation([]);
    setEducationError(null);
    setEducationLoading(true);
    setSuccessMessage(null);

    const selectedRow = rows.find((row) => row.id === eventId);
    const patientId = selectedRow?.patientId ?? null;

    try {
      const res = await fetchFollowupEventActions(eventId);
      setActions(res.data ?? []);
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "Error cargando acciones";
      setActionsError(message);
    } finally {
      setActionsLoading(false);
    }

    if (!patientId) {
      setEducationError("No se pudo identificar el paciente del caso.");
      setEducationLoading(false);
      return;
    }

    try {
      const resEdu = await fetchEducationInteractions(patientId);
      setEducation(resEdu.data ?? []);
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "Error cargando educación";
      setEducationError(message);
    } finally {
      setEducationLoading(false);
    }
  }

  function closeActionsModal() {
    setActionsOpen(false);
    setSelectedEventId(null);
    setActions([]);
    setActionsError(null);
    setActionsLoading(false);

    setEducation([]);
    setEducationError(null);
    setEducationLoading(false);
    setNewEducationNote("");
    setCreatingEducation(false);

    setClosingEventId(null);
    setClosingResolutionType(null);
    setClosingNote("");
    setConfirmingClose(false);

    setNewActionType("WHATSAPP");
    setNewOutcome("CONTACTED");
    setNewNote("");
    setCreatingAction(false);
  }

  async function onCreateAction() {
    if (!selectedEventId) return;
    if (!selectedEvent) return;

    if (selectedEvent.status === "CLOSED") {
      setActionsError("No se permiten nuevas acciones en un evento cerrado.");
      return;
    }

    if (selectedEventLocked) {
      setActionsError("Este evento está asignado a otro usuario.");
      return;
    }

    const noteTrimmed = newNote.trim();
    setCreatingAction(true);
    setActionsError(null);
    setSuccessMessage(null);

    try {
      const res = await createFollowupEventAction(selectedEventId, {
        actionType: newActionType,
        outcome: newOutcome,
        ...(noteTrimmed ? { note: noteTrimmed } : {}),
      });

      setActions((prev) => [...prev, res.action]);
      setNewNote("");
      setSuccessMessage("Acción registrada correctamente.");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Error creando acción";
      setActionsError(message);
    } finally {
      setCreatingAction(false);
    }
  }

  async function onCreateEducation() {
    if (!selectedEvent) return;

    const noteTrimmed = newEducationNote.trim();
    if (!noteTrimmed) return;

    setCreatingEducation(true);
    setEducationError(null);
    setSuccessMessage(null);

    try {
      const res = await createEducationInteraction({
        patientId: selectedEvent.patientId,
        type: "CALL",
        note: noteTrimmed,
      });

      setEducation((prev) => [
        {
          id: res.data.id,
          patientId: res.data.patientId,
          educatorUserId: res.data.educatorUserId,
          type: res.data.type,
          note: res.data.note,
          createdAt: res.data.createdAt,
          educator: null,
        },
        ...prev,
      ]);

      setNewEducationNote("");
      setSuccessMessage("Interacción educativa registrada correctamente.");
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "Error creando educación";
      setEducationError(message);
    } finally {
      setCreatingEducation(false);
    }
  }

  return (
    <div style={{ padding: 16 }}>
      <div className="app-header" style={{ marginBottom: 12 }}>
        <div>
          <h1 style={{ margin: 0 }}>Seguimiento / Caseload</h1>
          <p style={{ margin: "6px 0 0" }}>
            Bandeja operativa de eventos, priorización por SLA y trazabilidad de
            intervenciones.
          </p>
        </div>
      </div>

      <section
        className="app-table"
        style={{ padding: 16, marginTop: 0, boxShadow: "var(--shadow-card)" }}
      >
        <div
          style={{
            display: "flex",
            gap: 12,
            marginBottom: 12,
            flexWrap: "wrap",
          }}
        >
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as FollowupEventStatus)}
            style={{
              padding: 8,
              borderRadius: 10,
              border: "1px solid #e5e7eb",
            }}
          >
            <option value="OPEN">Abiertos</option>
            <option value="IN_PROGRESS">En curso</option>
            <option value="ESCALATED">Escalados</option>
            <option value="CLOSED">Cerrados</option>
          </select>

          <select
            value={assigned}
            onChange={(e) => setAssigned(e.target.value as FollowupAssigned)}
            style={{
              padding: 8,
              borderRadius: 10,
              border: "1px solid #e5e7eb",
            }}
          >
            <option value="any">Asignación: cualquiera</option>
            <option value="me">Solo míos</option>
            <option value="none">Sin asignar</option>
          </select>

          <select
            value={sla}
            onChange={(e) => setSla(e.target.value as FollowupSla)}
            style={{
              padding: 8,
              borderRadius: 10,
              border: "1px solid #e5e7eb",
            }}
          >
            <option value="any">SLA: cualquiera</option>
            <option value="overdue">SLA vencido</option>
            <option value="due_48h">SLA &lt; 48h</option>
          </select>

          <button
            onClick={loadFirstPage}
            disabled={loading || loadingMore}
            style={btnPrimary}
          >
            Refrescar
          </button>
        </div>

        {error && (
          <div style={{ color: "crimson", marginBottom: 8 }}>{error}</div>
        )}

        {successMessage && (
          <div
            style={{
              color: "#166534",
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: 12,
              padding: "10px 12px",
              marginBottom: 8,
              fontWeight: 600,
            }}
          >
            {successMessage}
          </div>
        )}

        {loading && <div>Cargando…</div>}

        {!loading && (
          <>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th align="left">Paciente</th>
                  <th align="left">Evento</th>
                  <th align="left">Severidad</th>
                  <th align="left">Estado</th>
                  <th align="left">SLA</th>
                  <th align="left">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((r) => {
                  const lockedForCurrentUser = isLockedForCurrentUser(
                    r,
                    currentUserEmail,
                  );

                  return (
                    <tr key={r.id} style={{ borderTop: "1px solid #e5e7eb" }}>
                      <td style={{ padding: "10px 0" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            minWidth: 0,
                          }}
                        >
                          <PatientAvatar
                            fullName={r.patient.fullName}
                            severity={r.severity}
                          />

                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{
                                fontWeight: 700,
                                color: "#111827",
                                lineHeight: 1.3,
                              }}
                            >
                              {r.patient.fullName}
                            </div>

                            <div
                              style={{
                                fontSize: 12,
                                color: "var(--color-text-muted, #6b7280)",
                                marginTop: 2,
                              }}
                            >
                              {r.patient.documentId}
                              {r.patient.payerCode
                                ? ` • ${r.patient.payerCode}`
                                : ""}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: "10px 0" }}>
                        <div style={{ fontWeight: 600, color: "#111827" }}>
                          {eventLabel(r)}
                        </div>

                        {probableCauseLabel(r) && (
                          <div
                            style={{
                              fontSize: 12,
                              color: "var(--color-text-muted, #6b7280)",
                              marginTop: 4,
                              lineHeight: 1.4,
                              maxWidth: 420,
                            }}
                          >
                            Posible causa: {probableCauseLabel(r)}
                          </div>
                        )}

                        <div
                          style={{
                            fontSize: 12,
                            color: "var(--color-text-muted, #6b7280)",
                            marginTop: 4,
                          }}
                        >
                          {categoryLabel(r.category)}
                        </div>

                        <div style={{ marginTop: 8 }}>
                          <span
                            style={{
                              ...adherencePillStyle(r),
                              padding: "4px 10px",
                              borderRadius: 999,
                              fontSize: 12,
                              fontWeight: 700,
                              display: "inline-block",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {adherenceLabel(r)}
                          </span>

                          {adherenceSecondaryLabel(r) && (
                            <div
                              style={{
                                marginTop: 4,
                                fontSize: 12,
                                color: "#6b7280",
                              }}
                            >
                              {adherenceSecondaryLabel(r)}
                            </div>
                          )}
                        </div>
                      </td>

                      <td style={{ padding: "10px 0" }}>
                        <span
                          style={{
                            ...severityPillStyle(r.severity),
                            padding: "4px 10px",
                            borderRadius: 999,
                            fontSize: 12,
                            fontWeight: 700,
                            display: "inline-block",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {severityLabel(r.severity)}
                        </span>
                      </td>

                      <td style={{ padding: "10px 0" }}>
                        {statusCellContent(r)}
                      </td>

                      <td style={{ padding: "10px 0" }}>
                        {r.slaDueAt
                          ? new Date(r.slaDueAt).toLocaleString()
                          : "-"}
                      </td>

                      <td style={{ padding: "10px 0" }}>
                        {lockedForCurrentUser ? (
                          <div
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 10,
                              padding: "8px 12px",
                              borderRadius: 999,
                              border: "1px solid #d1d5db",
                              background: "#f9fafb",
                              color: "#6b7280",
                              fontWeight: 600,
                              fontSize: 14,
                            }}
                          >
                            <span>
                              {r.assignedTo
                                ? `Ocupado por ${r.assignedTo.displayName}`
                                : "Ocupado"}
                            </span>

                            <span style={{ color: "#9ca3af" }}>Gestionar</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => openActions(r.id)}
                            style={btnPrimary}
                          >
                            {r.status === "CLOSED" ? "Ver" : "Gestionar"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: 12, color: "#6b7280" }}>
                      No hay eventos para los filtros seleccionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div
              style={{
                marginTop: 12,
                display: "flex",
                gap: 12,
                alignItems: "center",
              }}
            >
              {hasNext ? (
                <button
                  onClick={loadMore}
                  disabled={loadingMore || loading}
                  style={btnBase}
                >
                  {loadingMore ? "Cargando…" : "Cargar más"}
                </button>
              ) : (
                <div style={{ color: "#6b7280", fontSize: 12 }}>
                  No hay más resultados.
                </div>
              )}
            </div>
          </>
        )}
      </section>

      <InterventionPanel
        open={actionsOpen && Boolean(selectedEventId)}
        event={selectedEvent}
        onClose={closeActionsModal}
        historyContent={
          actionsLoading ? (
            <div style={historyListStyle}>
              <div style={historyRowStyle}>
                <div style={historyLeftColumnStyle}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#111827",
                    }}
                  >
                    Cargando historial...
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={historyListStyle}>
              {actions.map((a) => (
                <div key={a.id} style={historyRowStyle}>
                  <div style={historyLeftColumnStyle}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#111827",
                      }}
                    >
                      {ACTION_TYPE_LABEL[a.actionType] ?? a.actionType}
                    </div>

                    <div
                      style={{
                        fontSize: 13,
                        color: "#374151",
                        lineHeight: 1.5,
                      }}
                    >
                      {a.note ?? "Sin nota."}
                    </div>
                  </div>

                  <div style={historyRightColumnStyle}>
                    <div>{new Date(a.createdAt).toLocaleString()}</div>
                    <div style={{ marginTop: 4 }}>
                      {OUTCOME_LABEL[a.outcome] ?? a.outcome}
                    </div>
                  </div>
                </div>
              ))}

              {actions.length === 0 && (
                <div style={historyRowStyle}>
                  <div style={historyLeftColumnStyle}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#111827",
                      }}
                    >
                      Sin historial registrado
                    </div>

                    <div
                      style={{
                        fontSize: 13,
                        color: "#6b7280",
                        lineHeight: 1.5,
                      }}
                    >
                      No hay acciones registradas para este evento.
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        }
      >
        {selectedEventLocked && (
          <div
            style={{
              background: "#f9fafb",
              border: "1px solid #d1d5db",
              padding: 12,
              borderRadius: 12,
              marginBottom: 12,
              color: "#6b7280",
              fontWeight: 600,
            }}
          >
            {selectedEvent?.assignedTo
              ? `Caso ocupado por ${selectedEvent.assignedTo.displayName}`
              : "Caso ocupado por otro usuario"}
          </div>
        )}

        {selectedEvent && !selectedEventLocked && (
          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              marginBottom: 14,
            }}
          >
            {canTakeEvent(selectedEvent) && (
              <button
                onClick={() => onTake(selectedEvent.id)}
                disabled={takingEventId === selectedEvent.id || confirmingClose}
                style={btnPrimary}
              >
                {takingEventId === selectedEvent.id ? "Tomando…" : "Tomar"}
              </button>
            )}

            {selectedEvent.status !== "CLOSED" && (
              <button
                onClick={() => onClose(selectedEvent.id)}
                disabled={
                  closingEventId === selectedEvent.id || confirmingClose
                }
                style={btnDanger}
              >
                Cerrar
              </button>
            )}
          </div>
        )}

        {selectedEvent &&
          !selectedEventLocked &&
          selectedEvent.status !== "CLOSED" &&
          closingEventId === selectedEvent.id && (
            <div
              style={{
                border: "1px solid #fee2e2",
                borderRadius: 16,
                padding: 16,
                marginBottom: 16,
                background: "#fff7f7",
                display: "grid",
                gap: 14,
              }}
            >
              <div>
                <div style={sectionTitleStyle}>Cierre clínico</div>
                <div
                  style={{
                    fontSize: 13,
                    color: "#6b7280",
                    lineHeight: 1.4,
                  }}
                >
                  Definí el desenlace del caso para dejar una resolución clara y
                  auditable.
                </div>
              </div>

              <div>
                <div
                  style={{
                    fontSize: 12,
                    color: "#6b7280",
                    marginBottom: 6,
                    fontWeight: 600,
                  }}
                >
                  Tipo de resolución
                </div>

                <select
                  value={closingResolutionType ?? ""}
                  onChange={(e) =>
                    setClosingResolutionType(
                      e.target.value as FollowupResolutionType,
                    )
                  }
                  disabled={confirmingClose}
                  style={{
                    width: "100%",
                    padding: 10,
                    borderRadius: 12,
                    border: "1px solid #fca5a5",
                    background: "#ffffff",
                  }}
                >
                  <option value="">Seleccionar resolución</option>
                  <option value="STABILIZED">Estabilizado</option>
                  <option value="DERIVED">Derivado</option>
                  <option value="FOLLOW_UP">Seguimiento programado</option>
                </select>
              </div>

              <div>
                <div
                  style={{
                    fontSize: 12,
                    color: "#6b7280",
                    marginBottom: 6,
                    fontWeight: 600,
                  }}
                >
                  Nota clínica final (opcional)
                </div>

                <textarea
                  value={closingNote}
                  onChange={(e) => setClosingNote(e.target.value)}
                  placeholder="Ej: Paciente compensado, control programado en 72 hs."
                  disabled={confirmingClose}
                  style={{
                    width: "100%",
                    minHeight: 96,
                    padding: 12,
                    borderRadius: 12,
                    border: "1px solid #fca5a5",
                    resize: "vertical",
                    fontFamily: "inherit",
                    background: "#ffffff",
                  }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  paddingTop: 4,
                }}
              >
                <button
                  type="button"
                  onClick={onConfirmClose}
                  disabled={!closingResolutionType || confirmingClose}
                  style={{
                    ...btnDanger,
                    opacity:
                      closingResolutionType && !confirmingClose ? 1 : 0.55,
                    cursor:
                      closingResolutionType && !confirmingClose
                        ? "pointer"
                        : "not-allowed",
                  }}
                >
                  {confirmingClose ? "Confirmando…" : "Confirmar cierre"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setClosingEventId(null);
                    setClosingResolutionType(null);
                    setClosingNote("");
                  }}
                  disabled={confirmingClose}
                  style={btnBase}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

        <div
          style={{
            borderTop:
              selectedEvent &&
              !selectedEventLocked &&
              selectedEvent.status !== "CLOSED" &&
              closingEventId === selectedEvent.id
                ? "1px solid #e5e7eb"
                : "none",
            paddingTop:
              selectedEvent &&
              !selectedEventLocked &&
              selectedEvent.status !== "CLOSED" &&
              closingEventId === selectedEvent.id
                ? 14
                : 0,
            marginTop:
              selectedEvent &&
              !selectedEventLocked &&
              selectedEvent.status !== "CLOSED" &&
              closingEventId === selectedEvent.id
                ? 4
                : 0,
          }}
        >
          <div style={{ ...sectionTitleStyle, marginBottom: 10 }}>Acciones</div>

          <div
            style={{
              ...getSuggestionStyle(selectedEvent),
              padding: 12,
              borderRadius: 12,
              marginBottom: 12,
              fontSize: 13,
            }}
          >
            {getActionSuggestionText(selectedEvent)}
          </div>

          {selectedEvent && selectedEvent.status === "CLOSED" && (
            <div
              style={{
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                padding: 12,
                borderRadius: 12,
                marginBottom: 12,
                color: "#166534",
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 6 }}>
                Evento cerrado
              </div>

              <div style={{ fontSize: 13 }}>
                <strong>Resolución:</strong>{" "}
                {selectedEvent.resolutionType === "STABILIZED" &&
                  "Estabilizado"}
                {selectedEvent.resolutionType === "DERIVED" && "Derivado"}
                {selectedEvent.resolutionType === "FOLLOW_UP" &&
                  "Seguimiento programado"}
              </div>

              {selectedEvent.resolutionNote && (
                <div style={{ fontSize: 13, marginTop: 4 }}>
                  <strong>Nota:</strong> {selectedEvent.resolutionNote}
                </div>
              )}

              <div style={{ fontSize: 12, marginTop: 6, color: "#166534" }}>
                Cerrado el{" "}
                {selectedEvent.closedAt
                  ? new Date(selectedEvent.closedAt).toLocaleString()
                  : "-"}
              </div>
            </div>
          )}

          {actionsError && (
            <div style={{ color: "crimson", marginBottom: 10 }}>
              {actionsError}
            </div>
          )}

          <div
            style={{
              display: "grid",
              gap: 14,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 12,
                    color: "#6b7280",
                    marginBottom: 6,
                    fontWeight: 600,
                  }}
                >
                  Tipo de acción
                </div>
                <select
                  value={newActionType}
                  onChange={(e) =>
                    setNewActionType(e.target.value as FollowupEventActionType)
                  }
                  disabled={
                    selectedEventLocked ||
                    creatingAction ||
                    actionsLoading ||
                    selectedEvent?.status === "CLOSED" ||
                    takingEventId === selectedEvent?.id ||
                    closingEventId === selectedEvent?.id ||
                    confirmingClose
                  }
                  style={{
                    width: "100%",
                    padding: 10,
                    borderRadius: 12,
                    border: "1px solid #e5e7eb",
                    background: "#ffffff",
                  }}
                >
                  {(
                    Object.keys(ACTION_TYPE_LABEL) as FollowupEventActionType[]
                  ).map((k) => (
                    <option key={k} value={k}>
                      {ACTION_TYPE_LABEL[k]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div
                  style={{
                    fontSize: 12,
                    color: "#6b7280",
                    marginBottom: 6,
                    fontWeight: 600,
                  }}
                >
                  Resultado
                </div>
                <select
                  value={newOutcome}
                  onChange={(e) =>
                    setNewOutcome(e.target.value as FollowupEventActionOutcome)
                  }
                  disabled={
                    selectedEventLocked ||
                    creatingAction ||
                    actionsLoading ||
                    selectedEvent?.status === "CLOSED" ||
                    takingEventId === selectedEvent?.id ||
                    closingEventId === selectedEvent?.id ||
                    confirmingClose
                  }
                  style={{
                    width: "100%",
                    padding: 10,
                    borderRadius: 12,
                    border: "1px solid #e5e7eb",
                    background: "#ffffff",
                  }}
                >
                  {(
                    Object.keys(OUTCOME_LABEL) as FollowupEventActionOutcome[]
                  ).map((k) => (
                    <option key={k} value={k}>
                      {OUTCOME_LABEL[k]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <div
                style={{
                  fontSize: 12,
                  color: "#6b7280",
                  marginBottom: 6,
                  fontWeight: 600,
                }}
              >
                Nota (opcional)
              </div>
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Ej: Se contacta por WhatsApp, confirma retiro mañana."
                style={{
                  width: "100%",
                  minHeight: 96,
                  padding: 12,
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                  resize: "vertical",
                  fontFamily: "inherit",
                }}
                disabled={
                  selectedEventLocked ||
                  creatingAction ||
                  actionsLoading ||
                  selectedEvent?.status === "CLOSED" ||
                  takingEventId === selectedEvent?.id ||
                  closingEventId === selectedEvent?.id ||
                  confirmingClose
                }
              />
            </div>

            <div>
              <button
                onClick={onCreateAction}
                disabled={
                  selectedEventLocked ||
                  creatingAction ||
                  actionsLoading ||
                  selectedEvent?.status === "CLOSED" ||
                  takingEventId === selectedEvent?.id ||
                  closingEventId === selectedEvent?.id ||
                  confirmingClose
                }
                style={btnPrimary}
              >
                {creatingAction ? "Guardando…" : "Agregar acción"}
              </button>
            </div>
          </div>

          <div style={{ ...sectionTitleStyle, marginTop: 16 }}>
            Educación al paciente
          </div>

          {educationError && (
            <div style={{ color: "crimson", marginBottom: 10 }}>
              {educationError}
            </div>
          )}

          <div style={{ display: "grid", gap: 10, marginBottom: 12 }}>
            {educationLoading ? (
              <div style={{ fontSize: 13, color: "#6b7280" }}>
                Cargando educación...
              </div>
            ) : education.length === 0 ? (
              <div style={{ fontSize: 13, color: "#6b7280" }}>
                Sin interacciones educativas.
              </div>
            ) : (
              education.map((item) => (
                <div key={item.id} style={historyRowStyle}>
                  <div style={historyLeftColumnStyle}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>
                      Interacción educativa
                    </div>
                    <div style={{ fontSize: 13 }}>{item.note}</div>
                  </div>

                  <div style={historyRightColumnStyle}>
                    {new Date(item.createdAt).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>

          <textarea
            value={newEducationNote}
            onChange={(e) => setNewEducationNote(e.target.value)}
            placeholder="Registrar intervención educativa..."
            style={{
              width: "100%",
              minHeight: 80,
              padding: 10,
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              marginBottom: 8,
              resize: "vertical",
              fontFamily: "inherit",
            }}
            disabled={
              selectedEventLocked ||
              creatingEducation ||
              educationLoading ||
              selectedEvent?.status === "CLOSED" ||
              takingEventId === selectedEvent?.id ||
              closingEventId === selectedEvent?.id ||
              confirmingClose
            }
          />

          <button
            onClick={onCreateEducation}
            disabled={
              selectedEventLocked ||
              creatingEducation ||
              educationLoading ||
              selectedEvent?.status === "CLOSED" ||
              takingEventId === selectedEvent?.id ||
              closingEventId === selectedEvent?.id ||
              confirmingClose
            }
            style={btnPrimary}
          >
            {creatingEducation ? "Guardando…" : "Registrar educación"}
          </button>
        </div>
      </InterventionPanel>
    </div>
  );
}