// integrad-dashboard/src/types/caseload.types.ts

export type CaseloadPriorityLevel = "P1" | "P2" | "P3" | "P4";

export type CaseloadManagementStatus = "AVAILABLE" | "IN_PROGRESS";
export type CaseloadAssignmentStatus = "UNASSIGNED" | "ASSIGNED";
export type CaseloadFollowupStatus =
  | "NEEDS_ATTENTION"
  | "ACTIVE"
  | "STABLE";

export type CaseloadCaseOperationalState =
  | "PENDING"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "ESCALATED";

export type CaseloadSlaStatus =
  | "NO_SLA"
  | "ON_TRACK"
  | "DUE_SOON"
  | "OVERDUE";

export type CaseloadItem = {
  caseId: string;
  patientId: string;
  fullName: string;
  caseType: "CLINICAL" | "ADHERENCE" | "OPERATIONAL" | "PREVENTIVE";
  caseTypeLabel: string;
  caseState: CaseloadCaseOperationalState;
  caseStateLabel: string;
  slaDueAt: string | null;
  slaStatus: CaseloadSlaStatus;
  slaLabel: string;
  visibleReason: string;
  priorityLevel: CaseloadPriorityLevel;
  priorityLabel: string;
  reasons: string[];
  displaySource?: "CLINICAL" | "ADHERENCE" | "OPERATIONAL" | "PREVENTIVE";
  displaySourceLabel?: string;
  displayReasons?: string[];
  hasClinical: boolean;
  hasAdherence: boolean;
  hasEducational: boolean;
  hasOperational: boolean;
  lastContactAt: string | null;
  managementStatus: CaseloadManagementStatus;
  assignmentStatus: CaseloadAssignmentStatus;
  assignmentStatusLabel: string;
  followupStatus: CaseloadFollowupStatus;
  managedByName: string | null;
  managedAt: string | null;
};
