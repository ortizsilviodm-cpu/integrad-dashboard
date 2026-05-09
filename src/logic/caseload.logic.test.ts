import { describe, expect, it } from "vitest";

import {
  buildReasonText,
  buildSourceLabels,
} from "./caseload.logic";
import type { CaseloadItem } from "../types/caseload.types";

function buildItem(overrides: Partial<CaseloadItem> = {}): CaseloadItem {
  return {
    caseId: "evt-1",
    patientId: "pat-1",
    fullName: "Ana Semántica",
    caseType: "ADHERENCE",
    caseTypeLabel: "",
    caseState: "PENDING",
    caseStateLabel: "Pendiente",
    slaDueAt: null,
    slaStatus: "NO_SLA",
    slaLabel: "Sin SLA",
    visibleReason: "",
    priorityLevel: "P3",
    priorityLabel: "Atención sugerida",
    reasons: [],
    displaySource: undefined,
    displaySourceLabel: undefined,
    displayReasons: undefined,
    hasClinical: false,
    hasAdherence: false,
    hasEducational: false,
    hasOperational: false,
    lastContactAt: null,
    managementStatus: "AVAILABLE",
    assignmentStatus: "UNASSIGNED",
    assignmentStatusLabel: "Sin asignar",
    followupStatus: "STABLE",
    managedByName: null,
    managedAt: null,
    ...overrides,
  };
}

describe("caseload.logic display semantics", () => {
  it("prefers display source label over legacy flags", () => {
    const item = buildItem({
      displaySourceLabel: "Adherencia",
      hasClinical: true,
      hasOperational: true,
    });

    expect(buildSourceLabels(item)).toEqual(["Adherencia"]);
  });

  it("falls back to legacy source flags when display label is missing", () => {
    const item = buildItem({
      hasClinical: true,
      hasEducational: true,
      hasOperational: true,
    });

    expect(buildSourceLabels(item)).toEqual([
      "Clínico",
      "Educativo",
      "Operativo",
    ]);
  });

  it("prefers display reasons and falls back to urgency reasons/default copy", () => {
    expect(
      buildReasonText(
        buildItem({
          visibleReason: "Paciente no retiró medicación",
          displayReasons: [
            "Origen: Adherencia • DISPENSE_OVERDUE",
            "CHRONIC_HIGH_RENAL_OR_RETINOPATHY_UPLIFT",
          ],
          reasons: ["ADHERENCE - DISPENSE_OVERDUE"],
        }),
      ),
    ).toBe("Paciente no retiró medicación");

    expect(
      buildReasonText(
        buildItem({ visibleReason: "", reasons: ["CLINICAL - CRITICAL_LAB"] }),
      ),
    ).toBe("CLINICAL - CRITICAL_LAB");

    expect(buildReasonText(buildItem())).toBe("Sin motivos activos informados.");
  });
});
