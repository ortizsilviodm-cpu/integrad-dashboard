import type { ComponentType, CSSProperties, Dispatch, ReactNode, SetStateAction } from "react";
import type { CaseloadOperationalCaseSummary } from "../../types/caseload.types";
import type { PatientSummaryResponse } from "../../api/patientSummary";
import type {
  FollowupAssigned,
  FollowupEventRow,
  FollowupEventStatus,
  FollowupSla,
} from "../../api/followup";
import type { PatientContextData } from "../../hooks/usePatientContext";
import OperationalNarrative from "./OperationalNarrative";
import OperationalActionSummary from "./OperationalActionSummary";
import HumanTimeline from "./HumanTimeline";
import PatientEventsTable from "./PatientEventsTable";
import PatientWorkspaceHeader from "./PatientWorkspaceHeader";

type PatientAvatarProps = {
  fullName: string;
  severity: string;
};

type PatientWorkspaceViewProps = {
  isWorkspacePanelOpen?: boolean;
  onBackToCaseload?: () => void;
  backButtonStyle: CSSProperties;
  patientLoading?: boolean;
  patientError?: string | null;
  patientSummary: PatientSummaryResponse | null;
  initialPatientId: string | null;
  initialEventId?: string | null;
  patientContext?: PatientContextData;
  patientContextLoading?: boolean;
  patientContextError?: string | null;
  operationalCase: CaseloadOperationalCaseSummary | null;
  operationalCaseLoading?: boolean;
  status: FollowupEventStatus;
  assigned: FollowupAssigned;
  sla: FollowupSla;
  setStatus: Dispatch<SetStateAction<FollowupEventStatus>>;
  setAssigned: Dispatch<SetStateAction<FollowupAssigned>>;
  setSla: Dispatch<SetStateAction<FollowupSla>>;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  successMessage: string | null;
  visibleRows: FollowupEventRow[];
  hasNext: boolean;
  currentUserEmail: string | null;
  loadFirstPage: () => void;
  loadMore: () => void;
  openActions: (eventId: string) => void;
  isLockedForCurrentUser: (
    row: FollowupEventRow,
    currentUserEmail: string | null,
  ) => boolean;
  statusCellContent: (row: FollowupEventRow) => ReactNode;
  eventLabel: (row: FollowupEventRow) => string;
  probableCauseLabel: (row: FollowupEventRow) => string | null;
  categoryLabel: (raw: string) => string;
  adherenceLabel: (row: FollowupEventRow) => string;
  adherencePillStyle: (row: FollowupEventRow) => CSSProperties;
  adherenceSecondaryLabel: (row: FollowupEventRow) => string | null;
  severityPillStyle: (raw: string) => CSSProperties;
  severityLabel: (raw: string) => string;
  PatientAvatar: ComponentType<PatientAvatarProps>;
  btnPrimary: CSSProperties;
  btnBase: CSSProperties;
};

export default function PatientWorkspaceView({
  onBackToCaseload,
  backButtonStyle,
  patientSummary,
  initialPatientId,
  operationalCase,
  operationalCaseLoading,
  visibleRows,
  status,
  assigned,
  sla,
  setStatus,
  setAssigned,
  setSla,
  loading,
  loadingMore,
  error,
  successMessage,
  hasNext,
  currentUserEmail,
  loadFirstPage,
  loadMore,
  openActions,
  isLockedForCurrentUser,
  statusCellContent,
  eventLabel,
  probableCauseLabel,
  categoryLabel,
  adherenceLabel,
  adherencePillStyle,
  adherenceSecondaryLabel,
  severityPillStyle,
  severityLabel,
  PatientAvatar,
  btnPrimary,
  btnBase,
}: PatientWorkspaceViewProps) {
  const patientName = patientSummary?.patient.fullName ?? initialPatientId ?? null;
  const managedByName = visibleRows[0]?.assignedTo?.displayName ?? null;

  return (
    <>
      {/* Header minimalista */}
      <PatientWorkspaceHeader
        onBackToCaseload={onBackToCaseload}
        backButtonStyle={backButtonStyle}
        patientName={patientName}
        patientId={initialPatientId}
      />

      {/* 1. NARRATIVA OPERACIONAL — dominante, arriba de todo */}
      {operationalCase && !operationalCaseLoading && (
        <OperationalNarrative
          operationalCase={operationalCase}
          patientName={patientName ?? "—"}
          managedByName={managedByName}
        />
      )}

      {operationalCaseLoading && (
        <div
          style={{
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            fontSize: 13,
            color: "#6b7280",
            textAlign: "center",
          }}
        >
          Cargando narrativa operacional…
        </div>
      )}

      {/* 2. OWNERSHIP + PRÓXIMA ACCIÓN */}
      <OperationalActionSummary
        operationalCase={operationalCase}
        managedByName={managedByName}
        priorityLevel={visibleRows[0]?.severity === "CRITICAL" ? "P1" : visibleRows[0]?.severity === "HIGH" ? "P2" : "P3"}
        managementStatus={visibleRows[0]?.status === "IN_PROGRESS" ? "IN_PROGRESS" : "AVAILABLE"}
      />

      {/* 3. TIMELINE HUMANO — solo si hay eventos */}
      <HumanTimeline
        events={visibleRows}
        operationalMotive={operationalCase?.operationalMotive ?? null}
        managedByName={managedByName}
        currentStatus={operationalCase?.status ?? status}
      />

      {/* 3. SECCIÓN DE EVENTOS — tabla simplificada */}
      <div style={{ marginTop: 16 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "#64748b",
            marginBottom: 12,
            paddingBottom: 8,
            borderBottom: "1px solid #e2e8f0",
          }}
        >
          Casos activos del paciente
        </div>

        <PatientEventsTable
          isPatientMode
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
      </div>
    </>
  );
}