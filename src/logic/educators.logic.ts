/* integrad-dashboard/src/logic/educators.logic.ts */

import type {
  EducationInteractionItem,
  EducatorPatientRow,
} from "../types/educators.types";

export function formatInteractionTypeLabel(type: string): string {
  switch (type) {
    case "CALL":
      return "Llamada educativa";
    case "MESSAGE":
      return "Mensaje de seguimiento";
    case "VISIT":
      return "Visita educativa";
    default:
      return "Interacción educativa";
  }
}

export function formatPatientAge(age: number | null | undefined): string {
  if (typeof age !== "number" || Number.isNaN(age)) {
    return "Edad no disponible";
  }

  return `${age} años`;
}

export function formatDiabetesTypeLabel(value: string | null | undefined): string {
  const normalized = (value ?? "").trim();

  if (!normalized) {
    return "Tipo no informado";
  }

  switch (normalized) {
    case "DM1":
      return "Diabetes tipo 1";
    case "DM2":
      return "Diabetes tipo 2";
    case "GDM":
      return "Diabetes gestacional";
    default:
      return normalized;
  }
}

export function formatGlucoseValue(value: number | null | undefined): string {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "Sin glucemia registrada";
  }

  return `${value} mg/dL`;
}

export function formatTrendLabel(
  trend: EducatorPatientRow["trend"],
): string {
  switch (trend) {
    case "UP":
      return "En ascenso";
    case "DOWN":
      return "En descenso";
    case "STABLE":
      return "Estable";
    default:
      return "Sin tendencia";
  }
}

export function formatLastUpdateLabel(value: string | null | undefined): string {
  const normalized = (value ?? "").trim();

  if (!normalized) {
    return "Sin actualización";
  }

  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    return "Sin actualización";
  }

  return date.toLocaleString("es-AR");
}

export function getPatientContextLine(patient: EducatorPatientRow | null): string {
  if (!patient) {
    return "Seleccioná un paciente para ver el contexto educativo.";
  }

  const diabetesType = formatDiabetesTypeLabel(patient.diabetesType);
  const age = formatPatientAge(patient.age);

  return `${diabetesType} · ${age}`;
}

export function getPatientStatusLabel(patient: EducatorPatientRow): string {
  switch (patient.status) {
    case "ACTIVE":
      return "Activo";
    case "FOLLOWUP":
      return "Seguimiento";
    case "PENDING":
      return "Pendiente";
    case "RISK":
      return "Riesgo";
    default:
      return "Seguimiento educativo";
  }
}

export function getPatientNoteLabel(patient: EducatorPatientRow): string {
  const explicitNote = (patient.note ?? "").trim();
  if (explicitNote) {
    return explicitNote;
  }

  const clinicalDescription = (patient.clinicalContext?.description ?? "").trim();
  if (clinicalDescription) {
    return clinicalDescription;
  }

  const probableCause = (patient.clinicalContext?.probableCause ?? "").trim();
  if (probableCause) {
    return `Posible causa: ${probableCause}`;
  }

  const adherenceMessage = (patient.adherenceContext?.message ?? "").trim();
  if (adherenceMessage) {
    return adherenceMessage;
  }

  return "Sin observaciones educativas.";
}

export function sortInteractionsDesc(
  items: EducationInteractionItem[],
): EducationInteractionItem[] {
  return [...items].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}