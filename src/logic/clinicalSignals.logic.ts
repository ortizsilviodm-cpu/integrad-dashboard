/* integrad-dashboard\src\logic\clinicalSignals.logic.ts */

import type { ClinicalSignal } from "../types/clinicalSignals.types";

export function getPatientLabel(signal: ClinicalSignal): string {
  const displayName = signal.patient?.displayName?.trim();

  if (!displayName) {
    return "Paciente sin identificación";
  }

  if (displayName === signal.patient?.id) {
    return "Paciente registrado";
  }

  return displayName;
}

export function getSignalDescription(signal: ClinicalSignal): string {
  return signal.clinicalContext?.description?.trim() || signal.type;
}

export function getSeverityLabel(severity: string): string {
  switch (severity) {
    case "HIGH":
      return "ALTO";
    case "MEDIUM":
      return "MEDIO";
    case "LOW":
      return "BAJO";
    default:
      return severity;
  }
}

export function getSeverityColor(severity: string): string {
  switch (severity) {
    case "HIGH":
      return "var(--color-danger)";
    case "MEDIUM":
      return "var(--color-warning)";
    default:
      return "var(--color-success)";
  }
}

export function sortSignalsBySeverity(
  signals: ClinicalSignal[]
): ClinicalSignal[] {
  const order: Record<string, number> = {
    HIGH: 0,
    MEDIUM: 1,
    LOW: 2,
  };

  return [...signals].sort((a, b) => {
    const severityA = order[a.severity] ?? Number.MAX_SAFE_INTEGER;
    const severityB = order[b.severity] ?? Number.MAX_SAFE_INTEGER;

    return severityA - severityB;
  });
}