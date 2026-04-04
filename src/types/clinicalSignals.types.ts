/* integrad-dashboard\src\types\clinicalSignals.types.ts  */

export type ClinicalSignalPatient = {
  id: string;
  displayName: string;
} | null;

export type ClinicalSignalContext = {
  description?: string;
  detail?: string;
  condition?: string;
} | null;

export type ClinicalSignal = {
  id: string;
  type: string;
  status: string;
  severity: string;
  patient?: ClinicalSignalPatient;
  clinicalContext?: ClinicalSignalContext;
  firstDetectedAt: string;
  lastDetectedAt: string;
};

export type ClinicalSignalsResponse = {
  data?: ClinicalSignal[];
};

