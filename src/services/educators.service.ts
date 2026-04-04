/* integradd-dashboard/src/services/educators.service.ts */

import { fetchPatientsPage } from "../api/patients";
import {
  fetchEducationInteractions,
  createEducationInteraction,
  type EducationInteractionType,
} from "../api/education";

export async function getEducatorPatients(params: {
  limit: number;
  cursor?: string | null;
}) {
  return fetchPatientsPage({
    limit: params.limit,
    cursor: params.cursor ?? undefined,
  });
}

export async function getEducationInteractions(patientId: string) {
  return fetchEducationInteractions(patientId);
}

export async function createEducationInteractionService(params: {
  patientId: string;
  type: EducationInteractionType;
  note: string;
}) {
  return createEducationInteraction(params);
}