/* integrad-dashboard/src/pages/FollowupCaseloadPage.tsx */

import { useEffect, useMemo, useRef, useState } from "react";
import {
  fetchFollowupEventById,
  fetchFollowupEvents,
  takeFollowupEvent,
  closeFollowupEvent,
  fetchFollowupHistoryTrace,
  createFollowupEventAction,
  fetchEventRiskStratification,
  type FollowupEventStatus,
  type FollowupAssigned,
  type FollowupSla,
  type FollowupEventRow,
  type FollowupHistoryTraceEntry,
  type FollowupEventActionType,
  type FollowupEventActionOutcome,
  type FollowupResolutionType,
  type RiskStratificationV1,
} from "../api/followup";
import {
  fetchEducationInteractions,
  createEducationInteraction,
  type EducationInteractionRow,
} from "../api/education";
import { fetchOperationalCases } from "../api/operationalCases";
import { getAuthToken } from "../store/authStore";
import { type CaseloadOperationalCaseSummary } from "../types/caseload.types";
import InterventionPanelContainer from "../components/followup/InterventionPanelContainer";
import CaseloadGlobalView from "../components/followup/CaseloadGlobalView";
import PatientWorkspaceView from "../components/followup/PatientWorkspaceView";
import { PatientAvatar } from "../components/common/PatientAvatar";
import {
  fetchPatientSummary,
  type PatientSummaryResponse,
} from "../api/patientSummary";
import { useFollowupWorkspace } from "../hooks/useFollowupWorkspace";
import { usePatientContext } from "../hooks/usePatientContext";

const PAGE_LIMIT = 20;

type FollowupCaseloadPageProps = {
  initialEventId?: string | null;
  initialCaseSummary?: string | null;
  initialPatientId?: string | null;
  onBackToCaseload?: () => void;
};

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

export default function FollowupCaseloadPage({
  initialEventId = null,
  initialCaseSummary = null,
  initialPatientId = null,
  onBackToCaseload,
}: FollowupCaseloadPageProps) {
  const [rows, setRows] = useState<FollowupEventRow[]>([]);
  const [targetEventRow, setTargetEventRow] = useState<FollowupEventRow | null>(
    null,
  );
  const [status, setStatus] = useState<FollowupEventStatus>(() =>
    initialEventId ? "IN_PROGRESS" : "OPEN",
  );
  const [assigned, setAssigned] = useState<FollowupAssigned>(() =>
    initialEventId ? "me" : "any",
  );
  const [sla, setSla] = useState<FollowupSla>("any");

  // Determinar modo de apertura: patientId es la unidad principal
  // Cargar datos del paciente en modo paciente
  const [patientSummary, setPatientSummary] = useState<PatientSummaryResponse | null>(null);
  const [patientLoading, setPatientLoading] = useState(false);
  const [patientError, setPatientError] = useState<string | null>(null);
  const patientContext = usePatientContext(initialPatientId);

  useEffect(() => {
    if (!initialPatientId) return;
    setPatientLoading(true);
    setPatientError(null);
    fetchPatientSummary(initialPatientId)
      .then((res) => {
        if (res.ok && res.data) {
          setPatientSummary(res.data);
        } else {
          setPatientError(res.error || "No se pudo cargar");
        }
      })
      .catch(() => setPatientError("Error de conexión"))
      .finally(() => setPatientLoading(false));
  }, [initialPatientId]);

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
  /* Operational Case              */
  /* ----------------------------- */

  const [operationalCase, setOperationalCase] = useState<CaseloadOperationalCaseSummary | null>(null);
  const [operationalCaseLoading, setOperationalCaseLoading] = useState(false);

  useEffect(() => {
    if (!initialPatientId) {
      setOperationalCase(null);
      return;
    }

    setOperationalCaseLoading(true);
    setOperationalCase(null);

    void fetchOperationalCases().then((cases) => {
      const found = cases.find((c) => c.patientId === initialPatientId);
      setOperationalCase(found ?? null);
      setOperationalCaseLoading(false);
    }).catch(() => {
      setOperationalCase(null);
      setOperationalCaseLoading(false);
    });
  }, [initialPatientId]);

  /* ----------------------------- */
  /* Panel Acciones                */
  /* ----------------------------- */

  const [actionsOpen, setActionsOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const currentUserEmail = useMemo(() => readCurrentUserEmail(), []);
  const {
    isPatientMode,
    isCaseMode,
    selectedPatientSummary,
    selectedEvent,
    visibleRows,
    selectedEventLocked,
    isWorkspacePanelOpen,
    caseReference,
    showPatientWorkspace,
    showGlobalCaseload,
  } = useFollowupWorkspace({
    initialPatientId,
    initialEventId,
    patientSummary,
    rows,
    targetEventRow,
    selectedEventId,
    actionsOpen,
    currentUserEmail,
    isLockedForCurrentUser,
  });

  const [actionsLoading, setActionsLoading] = useState(false);
  const [actionsError, setActionsError] = useState<string | null>(null);
  const [historyTrace, setHistoryTrace] = useState<FollowupHistoryTraceEntry[]>([]);
  const [riskStratification, setRiskStratification] =
    useState<RiskStratificationV1 | null>(null);
  const [riskLoading, setRiskLoading] = useState(false);
  const [riskError, setRiskError] = useState<string | null>(null);

  const [education, setEducation] = useState<EducationInteractionRow[]>([]);
  const [educationLoading, setEducationLoading] = useState(false);
  const [educationError, setEducationError] = useState<string | null>(null);

  if (isCaseMode && !isPatientMode) {
    if (loading) {
      return (
        <div
          style={{
            color: "#1e3a8a",
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            borderRadius: 12,
            padding: "12px 14px",
            marginBottom: 8,
            fontSize: 13,
          }}
        >
          Cargando caso {caseReference}…
        </div>
      );
    }

    if (error) {
      return (
        <div
          style={{
            color: "#dc2626",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: 12,
            padding: "12px 14px",
            marginBottom: 8,
            fontSize: 13,
          }}
        >
          Error: {error}
        </div>
      );
    }

    if (!targetEventRow) {
      return (
        <div
          style={{
            color: "#6b7280",
            background: "#f3f4f6",
            border: "1px solid #d1d5db",
            borderRadius: 12,
            padding: "12px 14px",
            marginBottom: 8,
            fontSize: 13,
          }}
        >
          Caso no encontrado
        </div>
      );
    }

    return (
      <div
        style={{
          color: "#1e3a8a",
          background: "#eff6ff",
          border: "1px solid #bfdbfe",
          borderRadius: 12,
          padding: "12px 14px",
          marginBottom: 8,
          fontSize: 13,
          lineHeight: 1.5,
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 4 }}>
          Gestionando caso #{caseReference}…
        </div>
        <div>
          <span style={{ fontWeight: 500 }}>Paciente:</span>{" "}
          {targetEventRow.patient.fullName || targetEventRow.patientId}
        </div>
        <div>
          <span style={{ fontWeight: 500 }}>Motivo:</span>{" "}
          {initialCaseSummary || eventLabel(targetEventRow) || "Sin motivo"}
        </div>
        <div>
          <span style={{ fontWeight: 500 }}>Prioridad:</span>{" "}
          {severityLabel(targetEventRow.severity)}
        </div>
        <div>
          <span style={{ fontWeight: 500 }}>Estado:</span>{" "}
          {targetEventRow.status === "IN_PROGRESS"
            ? "En curso"
            : targetEventRow.status === "OPEN"
              ? "Pendiente"
              : targetEventRow.status}
        </div>
      </div>
    );
  }

  const [newActionType, setNewActionType] =
    useState<FollowupEventActionType>("WHATSAPP");
  const [newOutcome, setNewOutcome] =
    useState<FollowupEventActionOutcome>("CONTACTED");
  const [newNote, setNewNote] = useState("");
  const [creatingAction, setCreatingAction] = useState(false);

  const [newEducationNote, setNewEducationNote] = useState("");
  const [creatingEducation, setCreatingEducation] = useState(false);

  const hasAutoOpenedRef = useRef(false);
  const riskRequestIdRef = useRef(0);

  useEffect(() => {
    if (!actionsOpen || !selectedEvent) return;

    const suggestion = getSuggestedActionBySeverity(selectedEvent.severity);
    setNewActionType(suggestion.actionType);
    setNewOutcome(suggestion.outcome);
  }, [actionsOpen, selectedEvent]);

  async function loadFirstPage(filters?: {
    status?: FollowupEventStatus;
    assigned?: FollowupAssigned;
    sla?: FollowupSla;
  }) {
    const effectiveStatus = filters?.status ?? status;
    const effectiveAssigned = filters?.assigned ?? assigned;
    const effectiveSla = filters?.sla ?? sla;

    setLoading(true);
    setError(null);

    try {
      const res = await fetchFollowupEvents({
        status: effectiveStatus,
        assigned: effectiveAssigned,
        sla: effectiveSla,
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

  function upsertRow(row: FollowupEventRow) {
    setRows((prev) => {
      const existingIndex = prev.findIndex((item) => item.id === row.id);

      if (existingIndex === -1) {
        return [row, ...prev];
      }

      const next = [...prev];
      next[existingIndex] = row;
      return next;
    });
  }

  function closeActionsModal() {
    riskRequestIdRef.current += 1;
    setActionsOpen(false);
    setSelectedEventId(null);
    setHistoryTrace([]);
    setActionsError(null);
    setActionsLoading(false);
    setRiskStratification(null);
    setRiskError(null);
    setRiskLoading(false);

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

  useEffect(() => {
    if (!initialEventId) {
      hasAutoOpenedRef.current = false;
      setTargetEventRow(null);
      return;
    }

    setStatus("IN_PROGRESS");
    setAssigned("me");
    setSla("any");
    setTargetEventRow(null);

    closeActionsModal();

    hasAutoOpenedRef.current = false;

    void (async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetchFollowupEventById(initialEventId);
        setTargetEventRow(response.data);
        upsertRow(response.data);
        hasAutoOpenedRef.current = true;
        await openActions(response.data.id, response.data);
        await loadFirstPage({
          status: "IN_PROGRESS",
          assigned: "me",
          sla: "any",
        });
      } catch (e: unknown) {
        const message =
          e instanceof Error ? e.message : "Error cargando evento exacto";
        setRows([]);
        setHasNext(false);
        setNextCursor(undefined);
        setError(
          `No se pudo abrir el evento solicitado (${initialEventId}): ${message}`,
        );
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialEventId]);

  useEffect(() => {
    if (initialEventId && !hasAutoOpenedRef.current) return;

    closeActionsModal();
    hasAutoOpenedRef.current = false;
    void loadFirstPage();
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

  async function loadHistoryTrace(eventId: string) {
    try {
      const res = await fetchFollowupHistoryTrace(eventId);
      setHistoryTrace(res.data ?? []);
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "Error cargando trazabilidad";
      setActionsError(message);
    } finally {
      setActionsLoading(false);
    }
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

      const refreshed = await fetchFollowupEventById(selectedEvent.id);
      setTargetEventRow(refreshed.data);
      upsertRow(refreshed.data);
      setSelectedEventId(refreshed.data.id);
      setActionsOpen(true);
      setClosingEventId(null);
      setClosingResolutionType(null);
      setClosingNote("");
      await loadHistoryTrace(refreshed.data.id);

      setSuccessMessage(
        status === "CLOSED"
          ? "Evento cerrado correctamente. La traza quedó actualizada."
          : "Evento cerrado correctamente. Puede dejar de aparecer en este filtro porque ya no está en curso.",
      );
      await loadFirstPage();
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "Error cerrando el evento";
      setError(message);
    } finally {
      setConfirmingClose(false);
    }
  }

  async function openActions(eventId: string, providedRow?: FollowupEventRow) {
    if (providedRow) {
      setTargetEventRow(providedRow);
    }

    setSelectedEventId(eventId);
    setActionsOpen(true);

    setActionsError(null);
    setActionsLoading(true);
    setHistoryTrace([]);
    setEducation([]);
    setEducationError(null);
    setEducationLoading(true);
    setSuccessMessage(null);
    setRiskStratification(null);
    setRiskError(null);
    setRiskLoading(true);

    const currentRiskRequestId = riskRequestIdRef.current + 1;
    riskRequestIdRef.current = currentRiskRequestId;

    const selectedRow =
      providedRow ??
      rows.find((row) => row.id === eventId) ??
      (targetEventRow?.id === eventId ? targetEventRow : null);
    const patientId = selectedRow?.patientId ?? null;

    void fetchEventRiskStratification(eventId)
      .then((result) => {
        if (riskRequestIdRef.current !== currentRiskRequestId) return;
        setRiskStratification(result);
      })
      .catch((e: unknown) => {
        if (riskRequestIdRef.current !== currentRiskRequestId) return;

        const message =
          e instanceof Error
            ? e.message
            : "Error cargando estratificación de riesgo";

        setRiskError(message);
      })
      .finally(() => {
        if (riskRequestIdRef.current !== currentRiskRequestId) return;
        setRiskLoading(false);
      });

    await loadHistoryTrace(eventId);

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
      await createFollowupEventAction(selectedEventId, {
        actionType: newActionType,
        outcome: newOutcome,
        ...(noteTrimmed ? { note: noteTrimmed } : {}),
      });

      await loadHistoryTrace(selectedEventId);
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

      await loadHistoryTrace(selectedEvent.id);
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
      {showPatientWorkspace ? (
        <PatientWorkspaceView
          isWorkspacePanelOpen={isWorkspacePanelOpen}
          onBackToCaseload={onBackToCaseload}
          backButtonStyle={btnBase}
          patientLoading={patientLoading}
          patientError={patientError}
          patientSummary={selectedPatientSummary}
          initialPatientId={initialPatientId}
          initialEventId={initialEventId}
          patientContext={patientContext.data}
          patientContextLoading={patientContext.loading}
patientContextError={patientContext.error}
          operationalCase={operationalCase}
          operationalCaseLoading={operationalCaseLoading}
          status={status}
          assigned={assigned}
          sla={sla}
          setStatus={setStatus}
          setAssigned={setAssigned}
          setSla={setSla}
          loading={loading}
          loadingMore={loadingMore}
          error={error}
          successMessage={successMessage}
          visibleRows={visibleRows}
          hasNext={hasNext}
          currentUserEmail={currentUserEmail}
          loadFirstPage={loadFirstPage}
          loadMore={loadMore}
          openActions={openActions}
          isLockedForCurrentUser={isLockedForCurrentUser}
          statusCellContent={statusCellContent}
          eventLabel={eventLabel}
          probableCauseLabel={probableCauseLabel}
          categoryLabel={categoryLabel}
          adherenceLabel={adherenceLabel}
          adherencePillStyle={adherencePillStyle}
          adherenceSecondaryLabel={adherenceSecondaryLabel}
          severityPillStyle={severityPillStyle}
          severityLabel={severityLabel}
          PatientAvatar={PatientAvatar}
          btnPrimary={btnPrimary}
          btnBase={btnBase}
        />
      ) : showGlobalCaseload ? (
        <CaseloadGlobalView
          status={status}
          assigned={assigned}
          sla={sla}
          setStatus={setStatus}
          setAssigned={setAssigned}
          setSla={setSla}
          loading={loading}
          loadingMore={loadingMore}
          error={error}
          successMessage={successMessage}
          visibleRows={visibleRows}
          hasNext={hasNext}
          currentUserEmail={currentUserEmail}
          loadFirstPage={loadFirstPage}
          loadMore={loadMore}
          openActions={openActions}
          isLockedForCurrentUser={isLockedForCurrentUser}
          statusCellContent={statusCellContent}
          eventLabel={eventLabel}
          probableCauseLabel={probableCauseLabel}
          categoryLabel={categoryLabel}
          adherenceLabel={adherenceLabel}
          adherencePillStyle={adherencePillStyle}
          adherenceSecondaryLabel={adherenceSecondaryLabel}
          severityPillStyle={severityPillStyle}
          severityLabel={severityLabel}
          PatientAvatar={PatientAvatar}
          btnPrimary={btnPrimary}
          btnBase={btnBase}
        />
      ) : null}

      <InterventionPanelContainer
        open={actionsOpen && Boolean(selectedEventId)}
        event={selectedEvent}
        onClose={closeActionsModal}
        riskStratification={riskStratification}
        riskLoading={riskLoading}
        riskError={riskError}
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
              {historyTrace.map((entry) => (
                <div key={entry.id} style={historyRowStyle}>
                  <div style={historyLeftColumnStyle}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#111827",
                      }}
                    >
                      {entry.kind === "ACTION"
                        ? ACTION_TYPE_LABEL[
                        (entry.sourceMeta?.actionType as FollowupEventActionType) ??
                        "NOTE"
                        ] ?? entry.title
                        : entry.kind === "EDUCATION"
                          ? "Interacción educativa"
                          : entry.title}
                    </div>

                    <div
                      style={{
                        fontSize: 13,
                        color: "#374151",
                        lineHeight: 1.5,
                      }}
                    >
                      {entry.detail ?? "Sin detalle adicional."}
                    </div>
                  </div>

                  <div style={historyRightColumnStyle}>
                    <div>{new Date(entry.occurredAt).toLocaleString()}</div>
                    {entry.kind === "ACTION" && entry.sourceMeta?.outcome ? (
                      <div style={{ marginTop: 4 }}>
                        {OUTCOME_LABEL[
                          entry.sourceMeta.outcome as FollowupEventActionOutcome
                        ] ?? entry.sourceMeta.outcome}
                      </div>
                    ) : null}
                    {entry.actor?.displayName ? (
                      <div style={{ marginTop: 4 }}>{entry.actor.displayName}</div>
                    ) : null}
                  </div>
                </div>
              ))}

              {historyTrace.length === 0 && (
                <div style={historyRowStyle}>
                  <div style={historyLeftColumnStyle}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#111827",
                      }}
                    >
                      Sin traza registrada
                    </div>

                    <div
                      style={{
                        fontSize: 13,
                        color: "#6b7280",
                        lineHeight: 1.5,
                      }}
                    >
                      No hay hitos ni acciones registradas para este evento.
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

          {selectedEvent?.status !== "CLOSED" ? (
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
          ) : null}

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

          {selectedEvent?.status === "CLOSED" ? (
            <div
              style={{
                background: "#f8fafc",
                border: "1px solid #dbeafe",
                borderRadius: 12,
                padding: 12,
                color: "#334155",
                fontSize: 13,
                lineHeight: 1.6,
              }}
            >
              Este caso ya quedó cerrado. La traza operativa de arriba resume lo ocurrido y no se permiten nuevas acciones ni educación sobre este evento.
            </div>
          ) : (
            <>
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
                  takingEventId === selectedEvent?.id ||
                  closingEventId === selectedEvent?.id ||
                  confirmingClose
                }
                style={btnPrimary}
              >
                {creatingEducation ? "Guardando…" : "Registrar educación"}
              </button>
            </>
          )}
        </div>
      </InterventionPanelContainer>
    </div>
  );
}
