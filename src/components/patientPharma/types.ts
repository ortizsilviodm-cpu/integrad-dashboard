// -------------------------------------------------------------
// integrad-dashboard\src\components\patientPharma\types.ts
// types.ts — Tipos compartidos para Perfil Farmacológico
// -------------------------------------------------------------

// Medicación indicada del paciente (prescripción interna)
export type PatientMedicationRow = {
  id: string;
  patientId: string;
  medicationId: string;

  medicationCode: string;
  medicationName: string;
  therapeuticFamily: string | null;

  type: "CRONICO" | "OCASIONAL";
  dose: string;
  frequency: string;
  schedulePattern?: string | null;
  route?: string | null;

  startDate: string;
  endDate?: string | null;
  isActive: boolean;

  prescriberName?: string | null;
  notes?: string | null;
};

// Datos provenientes del perfil farmacológico (dispensas)
export type PharmaDrugRow = {
  drugCode: string | null;
  drugName: string;
  chronic: boolean;
  fills: number;
  totalQuantity: number;
  daysCovered: number;
  firstDispenseDate: string;
  lastDispenseDate: string;
  adherencePercentApprox: number | null;
};

// Resumen global (del backend)
export type PharmaSummary = {
  totalDrugs: number;
  chronicDrugs: number;
  occasionalDrugs: number;
};

// Perfil farmacológico completo proveniente del backend
export type PatientPharmaProfile = {
  drugs: PharmaDrugRow[];
  summary: PharmaSummary;
};

// Resumen por familia terapéutica (para tablas agregadas)
export interface DrugFamilySummary {
  family: string;
  drugs: string[];
  chronicCount: number;
  averageAdherence: number | null;
}
