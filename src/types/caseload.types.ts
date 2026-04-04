// integrad-dashboard/src/types/caseload.types.ts

export type CaseloadPriorityLevel = "P1" | "P2" | "P3" | "P4";

export type CaseloadItem = {
  patientId: string;
  fullName: string;
  priorityLevel: CaseloadPriorityLevel;
  priorityLabel: string;
  reasons: string[];
  hasClinical: boolean;
  hasEducational: boolean;
  hasOperational: boolean;
};