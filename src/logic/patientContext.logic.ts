/* integrad-dashboard/src/logic/patientContext.logic.ts */

import type { CSSProperties } from "react";

export function getSeverityLabel(raw: string): string {
  const v = String(raw || "").toUpperCase().trim();
  if (v === "LOW") return "Baja";
  if (v === "MEDIUM") return "Media";
  if (v === "HIGH") return "Alta";
  if (v === "CRITICAL") return "Crítica";
  return raw;
}

export function getGlucoseColor(value: number): string {
  if (value < 70) return "#b91c1c";
  if (value > 250) return "#991b1b";
  if (value > 180) return "#c2410c";
  return "#166534";
}

export function getGlucoseTrend(
  values: Array<{ value: number }>,
): {
  label: string;
  symbol: string;
} {
  if (!values || values.length < 2) {
    return {
      label: "Sin tendencia disponible",
      symbol: "→",
    };
  }

  const last = values[values.length - 1]?.value;
  const previous = values[values.length - 2]?.value;

  if (typeof last !== "number" || typeof previous !== "number") {
    return {
      label: "Sin tendencia disponible",
      symbol: "→",
    };
  }

  const diff = last - previous;

  if (diff >= 15) {
    return {
      label: "Glucemia en ascenso",
      symbol: "↑",
    };
  }

  if (diff <= -15) {
    return {
      label: "Glucemia en descenso",
      symbol: "↓",
    };
  }

  return {
    label: "Glucemia estable",
    symbol: "→",
  };
}

export function formatSlaLabel(value: string | null): string {
  if (!value) return "Sin SLA";
  return new Date(value).toLocaleString();
}

export function formatDateTime(value: string): string {
  return new Date(value).toLocaleString();
}

export function formatNoteLabel(type: string): string {
  if (type === "SOCIAL") return "Nota social";
  if (type === "CLINICAL") return "Nota clínica";
  return "Nota";
}

export function formatEventLabel(type: string): string {
  if (type === "MEAL") return "Comida";
  if (type === "EXERCISE") return "Actividad";
  if (type === "MEDICATION") return "Medicación";
  return type;
}

export function formatEventIcon(type: string): string {
  if (type === "MEAL") return "🍽";
  if (type === "EXERCISE") return "🏃";
  if (type === "MEDICATION") return "💊";
  return "•";
}

export function formatCategoryLabel(raw: string): string {
  const value = String(raw || "").toUpperCase().trim();
  if (value === "CLINICAL") return "Clínico";
  if (value === "OPERATIONAL") return "Operativo";
  if (value === "ADHERENCE") return "Adherencia";
  if (value === "PREVENTIVE") return "Preventivo";
  return raw;
}

export function getClinicalNarrativeFallback(category: string): string {
  const value = String(category || "").toUpperCase().trim();

  if (value === "CLINICAL") {
    return "Alteración clínica que requiere seguimiento activo";
  }

  if (value === "ADHERENCE") {
    return "Posible dificultad de adherencia con necesidad de acompañamiento";
  }

  if (value === "OPERATIONAL") {
    return "Incidencia operativa con posible impacto en la continuidad del cuidado";
  }

  if (value === "PREVENTIVE") {
    return "Situación preventiva que requiere seguimiento oportuno";
  }

  return "Situación clínica que requiere seguimiento";
}

export function getOperationalPriorityMessage(severity: string): string {
  const value = String(severity || "").toUpperCase().trim();

  if (value === "CRITICAL") {
    return "requiere atención prioritaria del equipo.";
  }

  if (value === "HIGH") {
    return "requiere seguimiento activo en el corto plazo.";
  }

  if (value === "MEDIUM") {
    return "requiere revisión clínica y seguimiento programado.";
  }

  return "requiere seguimiento según evolución clínica y operativa.";
}

export function getSuggestedAction(severity: string): string {
  const value = String(severity || "").toUpperCase().trim();

  if (value === "CRITICAL") {
    return "Contacto inmediato con el paciente por alta prioridad clínica";
  }

  if (value === "HIGH") {
    return "Contacto en el día para validar evolución clínica y adherencia";
  }

  if (value === "MEDIUM") {
    return "Seguimiento breve con refuerzo educativo según contexto";
  }

  return "Monitoreo y seguimiento según evolución";
}

export function getSuggestedActionStyle(severity: string): CSSProperties {
  const value = String(severity || "").toUpperCase().trim();

  const baseStyle: CSSProperties = {
    marginBottom: 12,
    padding: "10px 12px",
    borderRadius: 12,
    fontSize: 13,
    lineHeight: 1.5,
  };

  if (value === "CRITICAL") {
    return {
      ...baseStyle,
      background: "#fee2e2",
      border: "1px solid #fecaca",
      color: "#991b1b",
    };
  }

  if (value === "HIGH") {
    return {
      ...baseStyle,
      background: "#fff7ed",
      border: "1px solid #fed7aa",
      color: "#9a3412",
    };
  }

  if (value === "MEDIUM") {
    return {
      ...baseStyle,
      background: "#fef3c7",
      border: "1px solid #fde68a",
      color: "#92400e",
    };
  }

  return {
    ...baseStyle,
    background: "#ecfdf5",
    border: "1px solid #bbf7d0",
    color: "#166534",
  };
}