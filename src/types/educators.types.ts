/* src/types/educators.types.ts */

/**
 * Estados operativos posibles en la bandeja de educadores
 */
export type EducatorStatus =
  | "ACTIVE"
  | "FOLLOWUP"
  | "PENDING"
  | "RISK";

export type EducatorClinicalContext = {
  description: string;
  probableCause?: string | null;
};

export type EducatorAdherenceStatus = "OK" | "WARNING" | "CRITICAL";

export type EducatorAdherenceContext = {
  status: EducatorAdherenceStatus;
  daysRemaining: number | null;
  message: string;
};

/**
 * Representa una fila de paciente en la bandeja de educadores
 */
export type EducatorPatientRow = {
  id: string;
  fullName: string;
  age: number | null;
  diabetesType: string | null;
  status: EducatorStatus;

  clinicalContext?: EducatorClinicalContext | null;
  adherenceContext?: EducatorAdherenceContext | null;

  latestGlucose?: number | null;
  trend?: "UP" | "DOWN" | "STABLE" | null;

  note?: string | null;
  lastUpdate?: string | null;
};

/**
 * Formulario de creación de interacción educativa
 */
export type EducationInteractionForm = {
  type: "CALL" | "MESSAGE" | "VISIT";
  note: string;
};

/**
 * Item de historial educativo
 */
export type EducationInteractionItem = {
  id: string;
  type: "CALL" | "MESSAGE" | "VISIT";
  note: string;
  createdAt: string;
};

/**
 * Estado del workspace de educadores
 */
export type EducatorWorkspaceState = {
  patients: EducatorPatientRow[];

  selectedPatient: EducatorPatientRow | null;

  interactions: EducationInteractionItem[];

  loading: boolean;
  error: string | null;
};