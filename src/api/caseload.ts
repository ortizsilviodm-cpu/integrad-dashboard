// integrad-dashboard/src/api/caseload.ts

import { API_URL } from "../config/api";
import { getAuthToken } from "../store/authStore";

import type { CaseloadItem } from "../types/caseload.types";

type ApiCaseloadItem = {
  caseId: string;
  patientId: string;
  fullName: string;
  caseType: CaseloadItem["caseType"];
  caseTypeLabel: string;
  caseState: CaseloadItem["caseState"];
  caseStateLabel: string;
  slaDueAt: string | null;
  slaStatus: CaseloadItem["slaStatus"];
  slaLabel: string;
  visibleReason: string;
  priorityLevel: CaseloadItem["priorityLevel"];
  priorityLabel: string;
  reasons?: string[];
  displaySource?: CaseloadItem["displaySource"];
  displaySourceLabel?: string;
  displayReasons?: string[];
  sourceFlags?: {
    hasClinical?: boolean;
    hasAdherence?: boolean;
    hasEducational?: boolean;
    hasOperational?: boolean;
  };
  lastContactAt: string | null;
  managementStatus: CaseloadItem["managementStatus"];
  assignmentStatus: CaseloadItem["assignmentStatus"];
  assignmentStatusLabel: string;
  followupStatus: CaseloadItem["followupStatus"];
  managedByName: string | null;
  managedAt: string | null;
};

type CaseloadResponse = {
  items: ApiCaseloadItem[];
};

function authHeaders() {
  const token = getAuthToken();

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function fetchCaseload(): Promise<CaseloadItem[]> {
  const res = await fetch(`${API_URL}/api/caseload/unified`, {
    headers: authHeaders(),
  });

  if (!res.ok) {
    throw new Error("No se pudo cargar el caseload");
  }

  const json: CaseloadResponse = await res.json();

  return json.items.map((item) => ({
    caseId: item.caseId,
    patientId: item.patientId,
    fullName: item.fullName,
    caseType: item.caseType,
    caseTypeLabel: item.caseTypeLabel,
    caseState: item.caseState,
    caseStateLabel: item.caseStateLabel,
    slaDueAt: item.slaDueAt,
    slaStatus: item.slaStatus,
    slaLabel: item.slaLabel,
    visibleReason: item.visibleReason,
    priorityLevel: item.priorityLevel,
    priorityLabel: item.priorityLabel,
    reasons: item.reasons ?? [],
    displaySource: item.displaySource,
    displaySourceLabel: item.displaySourceLabel,
    displayReasons: item.displayReasons,
    hasClinical: item.sourceFlags?.hasClinical ?? false,
    hasAdherence: item.sourceFlags?.hasAdherence ?? false,
    hasEducational: item.sourceFlags?.hasEducational ?? false,
    hasOperational: item.sourceFlags?.hasOperational ?? false,
    lastContactAt: item.lastContactAt,
    managementStatus: item.managementStatus,
    assignmentStatus: item.assignmentStatus,
    assignmentStatusLabel: item.assignmentStatusLabel,
    followupStatus: item.followupStatus,
    managedByName: item.managedByName,
    managedAt: item.managedAt,
  }));
}
