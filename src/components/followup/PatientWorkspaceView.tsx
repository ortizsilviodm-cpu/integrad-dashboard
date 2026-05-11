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
import PatientEventsTable from "./PatientEventsTable";
import PatientWorkspaceHeader from "./PatientWorkspaceHeader";

type PatientAvatarProps = {
  fullName: string;
  severity: string;
};

type PatientWorkspaceViewProps = {
  isWorkspacePanelOpen: boolean;
  onBackToCaseload?: () => void;
  backButtonStyle: CSSProperties;
  patientLoading: boolean;
  patientError: string | null;
  patientSummary: PatientSummaryResponse | null;
  initialPatientId: string | null;
  initialEventId: string | null;
  patientContext: PatientContextData;
  patientContextLoading: boolean;
  patientContextError: string | null;
  operationalCase: CaseloadOperationalCaseSummary | null;
  operationalCaseLoading: boolean;
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
  isWorkspacePanelOpen,
  onBackToCaseload,
  backButtonStyle,
  patientLoading,
  patientError,
  patientSummary,
  initialPatientId,
  patientContext,
  patientContextLoading,
  patientContextError,
  operationalCase,
  operationalCaseLoading,
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
  visibleRows,
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
  return (
    <>
      <PatientWorkspaceHeader
        isWorkspacePanelOpen={isWorkspacePanelOpen}
        onBackToCaseload={onBackToCaseload}
        backButtonStyle={backButtonStyle}
        patientLoading={patientLoading}
        patientError={patientError}
        patientSummary={patientSummary}
        initialPatientId={initialPatientId}
        patientContext={patientContext}
        patientContextLoading={patientContextLoading}
        patientContextError={patientContextError}
      />

      {/* Narrativa operacional — visible cuando hay operational case */}
      {operationalCase && !operationalCaseLoading && (
        <OperationalNarrative
          operationalCase={operationalCase}
          patientName={patientSummary?.patient.fullName ?? initialPatientId ?? "—"}
        />
      )}

      {operationalCaseLoading && (
        <div
          style={{
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: 12,
            marginBottom: 16,
            fontSize: 13,
            color: "#6b7280",
          }}
        >
          Cargando narrativa operacional…
        </div>
      )}

      <div className="app-header" style={{ marginBottom: 12 }}>
        <div>
          <h1 style={{ margin: 0 }}>Eventos activos del paciente</h1>
          <p style={{ margin: "6px 0 0" }}>
            Eventos clínicos y operativos vinculados al paciente actualmente visualizado.
          </p>
        </div>
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
    </>
  );
}
