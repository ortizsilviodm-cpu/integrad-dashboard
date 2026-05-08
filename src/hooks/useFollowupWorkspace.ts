import { useMemo } from "react";
import type { FollowupEventRow } from "../api/followup";
import type { PatientSummaryResponse } from "../api/patientSummary";

type UseFollowupWorkspaceInput = {
  initialPatientId?: string | null;
  initialEventId?: string | null;
  patientSummary: PatientSummaryResponse | null;
  rows: FollowupEventRow[];
  targetEventRow: FollowupEventRow | null;
  selectedEventId: string | null;
  actionsOpen: boolean;
  currentUserEmail: string | null;
  isLockedForCurrentUser: (
    row: FollowupEventRow,
    currentUserEmail: string | null,
  ) => boolean;
};

export function useFollowupWorkspace({
  initialPatientId = null,
  initialEventId = null,
  patientSummary,
  rows,
  targetEventRow,
  selectedEventId,
  actionsOpen,
  currentUserEmail,
  isLockedForCurrentUser,
}: UseFollowupWorkspaceInput) {
  const isPatientMode = Boolean(initialPatientId);
  const isCaseMode = Boolean(initialEventId);
  const selectedPatientSummary = patientSummary;

  const selectedEvent = useMemo(() => {
    if (!selectedEventId) return null;
    return (
      rows.find((row) => row.id === selectedEventId) ??
      (targetEventRow?.id === selectedEventId ? targetEventRow : null)
    );
  }, [rows, selectedEventId, targetEventRow]);

  const visibleRows = useMemo(() => {
    if (!isPatientMode || !initialPatientId) {
      return rows;
    }

    const filteredRows = rows.filter(
      (row) => row.patientId === initialPatientId || row.patient.id === initialPatientId,
    );

    if (
      targetEventRow &&
      (targetEventRow.patientId === initialPatientId ||
        targetEventRow.patient.id === initialPatientId) &&
      !filteredRows.some((row) => row.id === targetEventRow.id)
    ) {
      return [targetEventRow, ...filteredRows];
    }

    return filteredRows;
  }, [initialPatientId, isPatientMode, rows, targetEventRow]);

  const selectedEventLocked = selectedEvent
    ? isLockedForCurrentUser(selectedEvent, currentUserEmail)
    : false;

  const isWorkspacePanelOpen = actionsOpen && Boolean(selectedEventId);
  const caseReference = initialEventId ? initialEventId.slice(0, 8) : "--------";

  return {
    isPatientMode,
    isCaseMode,
    selectedPatientSummary,
    selectedEvent,
    visibleRows,
    selectedEventLocked,
    isWorkspacePanelOpen,
    caseReference,
    showPatientWorkspace: isPatientMode,
    showGlobalCaseload: !isPatientMode,
  };
}

export default useFollowupWorkspace;
