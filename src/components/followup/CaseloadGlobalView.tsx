import type { ComponentType, CSSProperties, Dispatch, ReactNode, SetStateAction } from "react";
import type {
  FollowupAssigned,
  FollowupEventRow,
  FollowupEventStatus,
  FollowupSla,
} from "../../api/followup";
import PatientEventsTable from "./PatientEventsTable";

type PatientAvatarProps = {
  fullName: string;
  severity: string;
};

type CaseloadGlobalViewProps = {
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

export default function CaseloadGlobalView({
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
}: CaseloadGlobalViewProps) {
  return (
    <>
      <div className="app-header" style={{ marginBottom: 12 }}>
        <div>
          <h1 style={{ margin: 0 }}>Seguimiento / Caseload</h1>

          <p style={{ margin: "6px 0 0" }}>
            Bandeja operativa de eventos, priorización por SLA y trazabilidad de intervenciones.
          </p>
        </div>
      </div>

      <PatientEventsTable
        isPatientMode={false}
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
