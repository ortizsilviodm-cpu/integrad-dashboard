/* integrad-dashboard/src/api/patientEnrollment.ts */

import { API_URL } from "../config/api";
import { getAuthToken } from "../store/authStore";

export interface EnrollmentRequest {
  personal: {
    firstName: string;
    lastName: string;
    documentId: string;
    phone?: string;
    birthDate?: string; // ISO
    gender?: string;
  };
  coverage: {
    payerCode: string;
    membershipCode: string;
    affiliateNumber?: string;
    healthPlan?: string;
    planCode?: string;
  };
  appUser?: {
    email: string;
  };
  program?: {
    mainProvider?: string;
    notes?: string;
  };
}

export interface EnrollmentResponse {
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    documentId: string;
    phone?: string | null;
    payerCode?: string | null;
    membershipCode?: string | null;
    healthPlan?: string | null;
  };
  user: {
    id: string;
    email: string;
    role: string;
  } | null;
  enrollment: {
    id: string;
    status: string;
    enrollmentDate: string;
    payerCode: string | null;
    programType: string;
    mainProvider?: string | null;
  };
}

/**
 * Llama al endpoint de enrolamiento de paciente crónico (diabetes).
 * Requiere token de profesional/admin.
 */
export async function enrollChronicPatient(
  payload: EnrollmentRequest
): Promise<EnrollmentResponse> {
  const token = getAuthToken();
  if (!token) {
    throw new Error("No hay token de autenticación. Inicie sesión nuevamente.");
  }

  const resp = await fetch(
    `${API_URL}/patients/enrollment/enroll-diabetes`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    }
  );

  if (!resp.ok) {
    let errorBody: any = null;
    try {
      errorBody = await resp.json();
    } catch {
      // ignorar
    }

    const message =
      errorBody?.error ??
      `Error al enrolar paciente (HTTP ${resp.status})`;

    throw new Error(
      typeof message === "string" ? message : JSON.stringify(message)
    );
  }

  const data = (await resp.json()) as EnrollmentResponse;
  return data;
}
