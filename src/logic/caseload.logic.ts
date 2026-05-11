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

export type PriorityHierarchy = "high" | "medium" | "low";

export function getPriorityHierarchy(
  level: CaseloadItem["priorityLevel"],
): PriorityHierarchy {
  if (level === "P1") return "high";
  if (level === "P2") return "medium";
  return "low";
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

  if (
    item.operationalCase.contextualSummary &&
    item.operationalCase.contextualSummary.trim().length > 0
  ) {
    return item.operationalCase.contextualSummary.trim();
  }

  return null;
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

/* nada */

export type SuggestedActionSeverity = "critical" | "warning" | "info" | "stable";

export type SuggestedAction = {
  text: string;
  severity: SuggestedActionSeverity;
};

export function buildSuggestedAction(item: CaseloadItem): SuggestedAction {
  // 1. Si hay operational case con resumen contextual, usarlo como base
  if (item.operationalCase?.contextualSummary) {
    const severity: SuggestedActionSeverity =
      item.operationalCase.priority === "CRITICAL" || item.operationalCase.priority === "HIGH"
        ? "critical"
        : item.operationalCase.priority === "MEDIUM"
          ? "warning"
          : "info";

    return {
      text: item.operationalCase.contextualSummary,
      severity,
    };
  }

  // 2. Si hay motivo operacional, generar acción a partir de él
  const motive = buildOperationalCaseMotiveLabel(item);
  if (motive) {
    const severity: SuggestedActionSeverity =
      item.priorityLevel === "P1" ? "critical" : item.priorityLevel === "P2" ? "warning" : "info";

    return {
      text: `Revisar caso: ${motive.toLowerCase()}.`,
      severity,
    };
  }

  // 3. Fallback por prioridad del followup
  if (item.priorityLevel === "P1") {
    return { text: "Intervención inmediata requerida.", severity: "critical" };
  }

  if (item.priorityLevel === "P2") {
    return { text: "Seguimiento urgente programado.", severity: "warning" };
  }

  if (item.priorityLevel === "P3") {
    return { text: "Atención sugerida según seguimiento.", severity: "info" };
  }

  // 4. Fallback genérico
  return { text: "Sin acción sugerida por el momento.", severity: "stable" };
}

/**
 * Construye una narrativa de ownership legible para el header del workspace.
 */
export function buildOwnershipText(
  item: CaseloadItem,
  managedByName: string | null,
): string {
  if (managedByName) {
    return `Caso gestionado por ${managedByName}`;
  }

  if (item.managementStatus === "IN_PROGRESS") {
    return "Caso en gestión (responsable no asignado aún)";
  }

  return "Caso disponible — sin gestor asignado";
}

/**
 * Etiqueta legible del estado operativo del caso.
 */
export function buildHumanOperationalStatus(
  status: NonNullable<CaseloadItem["operationalCase"]>["status"],
): string {
  switch (status) {
    case "OPEN":
      return "Recién creado";
    case "IN_PROGRESS":
      return "En seguimiento activo";
    case "STABILIZED":
      return "Estabilizado";
    case "RESOLVED":
      return "Resuelto";
    case "REOPENED":
      return "Reabierto — requiere revisión";
  }
}

/**
 * Resume la situación del paciente en una frase legible.
 */
export function buildPatientSituationSummary(item: CaseloadItem): string {
  const motive = buildOperationalCaseMotiveLabel(item);
  const oc = item.operationalCase;

  if (oc && oc.status === "RESOLVED") {
    return `Caso resuelto — fue por ${motive ? motive.toLowerCase() : "motivo no especificado"}`;
  }

  if (oc && oc.status === "STABILIZED") {
    return `Caso estabilizado — ${motive ? motive.toLowerCase() : "en seguimiento"}`;
  }

  if (oc && oc.contextualSummary) {
    return oc.contextualSummary;
  }

  if (motive) {
    return `Requiere atención: ${motive.toLowerCase()}`;
  }

  return "Caso activo — revisar estado del paciente";
}

export function buildPatientSecondaryText(item: CaseloadItem): string {
  if (item.lastContactAt) {
    return `Paciente ${item.patientId.slice(0, 8)} · Último contacto ${new Date(item.lastContactAt).toLocaleDateString()}`;
  }

  return `Paciente ${item.patientId.slice(0, 8)} · Sin contacto registrado`;
}

/**
 * Tipo para representar el ownership y próxima acción del caso.
 */
export type OwnershipInfo = {
  responsibleName: string | null;
  responsibleRole: string | null;
  statusText: string;
  statusColor: string;
  nextActionText: string;
  nextActionPriority: "critical" | "warning" | "info" | "neutral";
  pendingItemText: string | null;
};

/**
 * Construye información de ownership y próxima acción legible.
 */
export function buildOwnershipAndNextAction(
  operationalCase: CaseloadItem["operationalCase"] | undefined,
  managedByName: string | null,
  priorityLevel: CaseloadItem["priorityLevel"],
  managementStatus: CaseloadItem["managementStatus"],
): OwnershipInfo {
  // Determinar responsable
  const responsibleName = managedByName ?? null;
  const responsibleRole = managedByName ? "Responsable de caso" : "Sin asignar";

  // Determinar estado operativo y color
  let statusText = "Abierto";
  let statusColor = "#ef4444"; // red

  if (operationalCase) {
    switch (operationalCase.status) {
      case "OPEN":
        statusText = "Abierto — sin intervención";
        statusColor = "#ef4444";
        break;
      case "IN_PROGRESS":
        statusText = managedByName ? `En gestión por ${managedByName}` : "En gestión — sin responsable";
        statusColor = "#f59e0b"; // amber
        break;
      case "STABILIZED":
        statusText = "Estabilizado — en mantenimiento";
        statusColor = "#3b82f6"; // blue
        break;
      case "RESOLVED":
        statusText = "Resuelto";
        statusColor = "#10b981"; // green
        break;
      case "REOPENED":
        statusText = "Reabierto — requiere revisión";
        statusColor = "#8b5cf6"; // purple
        break;
      default:
        statusText = "Estado desconocido";
        statusColor = "#6b7280";
    }
  } else if (managementStatus === "IN_PROGRESS") {
    statusText = managedByName
      ? `En gestión por ${managedByName}`
      : "En gestión — pendiente de asignar";
    statusColor = "#f59e0b";
  } else {
    statusText = "Caso disponible";
    statusColor = "#10b981";
  }

  // Determinar próxima acción basada en motivo
  let nextActionText = "Revisar caso y definir plan de intervención";
  let nextActionPriority: OwnershipInfo["nextActionPriority"] = "info";

  if (operationalCase?.operationalMotive) {
    switch (operationalCase.operationalMotive) {
      case "THERAPEUTIC_ABANDONMENT_RISK":
        nextActionText = "Contactar al paciente para validar continuidad del tratamiento";
        nextActionPriority = "critical";
        break;
      case "GLUCOSE_RISK":
        nextActionText = "Revisar glucemias recientes y ajustar plan según necesidad";
        nextActionPriority = "warning";
        break;
      case "NEEDS_EDUCATION":
        nextActionText = "Programar intervención educativa según contexto del paciente";
        nextActionPriority = "info";
        break;
      case "CONTACT_DIFFICULTY":
        nextActionText = "Intentar contacto por medios alternativos y documentar intentos";
        nextActionPriority = "warning";
        break;
      case "INTERDISCIPLINARY_INTERVENTION_REQUIRED":
        nextActionText = "Coordinar intervención interdisciplinaria con el equipo";
        nextActionPriority = "warning";
        break;
    }
  } else if (priorityLevel === "P1") {
    nextActionText = "Intervención inmediata requerida — contactar paciente urgentemente";
    nextActionPriority = "critical";
  } else if (priorityLevel === "P2") {
    nextActionText = "Seguimiento urgente — contactar en el día";
    nextActionPriority = "warning";
  }

  // Determinar pendiente (basado en contextualSummary o inference)
  let pendingItemText: string | null = null;

  if (operationalCase?.contextualSummary && operationalCase.status !== "RESOLVED") {
    // Usar el resumen contextual como pendiente si hay
    pendingItemText = operationalCase.contextualSummary;
  }

  return {
    responsibleName,
    responsibleRole,
    statusText,
    statusColor,
    nextActionText,
    nextActionPriority,
    pendingItemText,
  };
}
