/* integrad-dashboard/src/logic/caseload.logic.ts */

import type { CaseloadItem } from "../types/caseload.types";

export function getPriorityColor(level: CaseloadItem["priorityLevel"]) {
  switch (level) {
    case "P1":
      return "#ef4444";
    case "P2":
      return "#f59e0b";
    case "P3":
      return "#3b82f6";
    case "P4":
      return "#10b981";
  }
}

export function getPriorityHumanLabel(
  level: CaseloadItem["priorityLevel"],
): string {
  switch (level) {
    case "P1":
      return "Intervención inmediata";
    case "P2":
      return "Seguimiento urgente";
    case "P3":
      return "Atención sugerida";
    case "P4":
      return "Prioridad baja";
  }
}

export function getAvatarSeverity(item: CaseloadItem): string {
  if (item.priorityLevel === "P1") return "CRITICAL";
  if (item.priorityLevel === "P2") return "HIGH";
  if (item.priorityLevel === "P3") return "WARNING";
  return "LOW";
}

export function buildSourceLabels(item: CaseloadItem): string[] {
  const labels: string[] = [];

  if (item.hasClinical) labels.push("Clínico");
  if (item.hasAdherence) labels.push("Adherencia");
  if (item.hasEducational) labels.push("Educativo");
  if (item.hasOperational) labels.push("Operativo");

  if (labels.length > 0) {
    return labels;
  }

  if (item.displaySourceLabel && item.displaySourceLabel.trim().length > 0) {
    return [item.displaySourceLabel.trim()];
  }

  if (item.caseTypeLabel && item.caseTypeLabel.trim().length > 0) {
    return [item.caseTypeLabel.trim()];
  }

  return labels;
}

export function buildReasonText(item: CaseloadItem): string {
  const operationalMotive = buildOperationalCaseMotiveLabel(item);

  if (operationalMotive) return operationalMotive;

  if (item.reasons.length > 0) return item.reasons.join(" • ");

  if (item.displayReasons && item.displayReasons.length > 0) {
    return item.displayReasons.join(" • ");
  }

  if (item.visibleReason && item.visibleReason.trim().length > 0) {
    return item.visibleReason.trim();
  }

  return "Sin motivos activos informados.";
}

export function buildOperationalCaseSecondaryText(
  item: CaseloadItem,
): string | null {
  if (!item.operationalCase) return null;

  const parts: string[] = [];

  parts.push(`Estado: ${formatOperationalCaseStatus(item.operationalCase.status)}`);
  parts.push(
    `Prioridad: ${formatOperationalCasePriority(item.operationalCase.priority)}`,
  );

  return parts.join(" • ");
}

export function buildFollowupStatusLabel(item: CaseloadItem): string {
  switch (item.followupStatus) {
    case "NEEDS_ATTENTION":
      return "Atención requerida";
    case "ACTIVE":
      return "Seguimiento activo";
    case "STABLE":
      return "Estable";
  }
}

export function buildManagementText(item: CaseloadItem): string | null {
  if (item.managementStatus !== "IN_PROGRESS") return null;

  if (item.managedByName && item.managedAt) {
    return `En gestión por ${item.managedByName}`;
  }

  return "En gestión";
}

export function buildOperationalCaseStatusLabel(
  status: NonNullable<CaseloadItem["operationalCase"]>["status"],
): string {
  return formatOperationalCaseStatus(status);
}

export function buildOperationalCaseMotiveLabel(item: CaseloadItem): string | null {
  const motive = item.operationalCase?.operationalMotive;

  switch (motive) {
    case "THERAPEUTIC_ABANDONMENT_RISK":
      return "Riesgo de abandono terapéutico";
    case "GLUCOSE_RISK":
      return "Riesgo glucémico elevado";
    case "NEEDS_EDUCATION":
      return "Necesita educación";
    case "CONTACT_DIFFICULTY":
      return "Dificultad de contacto";
    case "INTERDISCIPLINARY_INTERVENTION_REQUIRED":
      return "Requiere intervención interdisciplinaria";
    default:
      return null;
  }
}

function formatOperationalCaseStatus(
  status: NonNullable<CaseloadItem["operationalCase"]>["status"],
): string {
  switch (status) {
    case "OPEN":
      return "Abierto";
    case "IN_PROGRESS":
      return "En gestión";
    case "STABILIZED":
      return "Estabilizado";
    case "RESOLVED":
      return "Resuelto";
    case "REOPENED":
      return "Reabierto";
  }
}

function formatOperationalCasePriority(
  priority: NonNullable<CaseloadItem["operationalCase"]>["priority"],
): string {
  switch (priority) {
    case "LOW":
      return "Baja";
    case "MEDIUM":
      return "Media";
    case "HIGH":
      return "Alta";
    case "CRITICAL":
      return "Crítica";
  }
}

export function buildPatientSecondaryText(item: CaseloadItem): string {
  if (item.lastContactAt) {
    return `Paciente ${item.patientId.slice(0, 8)} · Último contacto ${new Date(item.lastContactAt).toLocaleDateString()}`;
  }

  return `Paciente ${item.patientId.slice(0, 8)} · Sin contacto registrado`;
}
