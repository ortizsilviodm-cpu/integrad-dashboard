import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchCaseload } from "./caseload";

const { getAuthTokenMock } = vi.hoisted(() => ({
  getAuthTokenMock: vi.fn(),
}));

vi.mock("../store/authStore", () => ({
  getAuthToken: getAuthTokenMock,
}));

describe("fetchCaseload", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("maps display semantic fields and source flags from API payload", async () => {
    getAuthTokenMock.mockReturnValue("token-123");

    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [
          {
            caseId: "evt-1",
            patientId: "pat-1",
            fullName: "Ana Semántica",
            caseType: "ADHERENCE",
            caseTypeLabel: "Adherencia",
            caseState: "PENDING",
            caseStateLabel: "Pendiente",
            slaDueAt: null,
            slaStatus: "NO_SLA",
            slaLabel: "Sin SLA",
            visibleReason: "Paciente no retiró medicación",
            priorityLevel: "P3",
            priorityLabel: "Atención sugerida",
            reasons: ["CHRONIC_HIGH_RENAL_OR_RETINOPATHY_UPLIFT"],
            displaySource: "ADHERENCE",
            displaySourceLabel: "Adherencia",
            displayReasons: [
              "Origen: Adherencia • DISPENSE_OVERDUE",
              "CHRONIC_HIGH_RENAL_OR_RETINOPATHY_UPLIFT",
            ],
            sourceFlags: {
              hasClinical: true,
              hasEducational: false,
              hasOperational: false,
            },
            managementStatus: "AVAILABLE",
            assignmentStatus: "UNASSIGNED",
            assignmentStatusLabel: "Sin asignar",
            managedByName: null,
            managedAt: null,
          },
        ],
      }),
    } as Response);

    await expect(fetchCaseload()).resolves.toEqual([
      {
        caseId: "evt-1",
        patientId: "pat-1",
        fullName: "Ana Semántica",
        caseType: "ADHERENCE",
        caseTypeLabel: "Adherencia",
        caseState: "PENDING",
        caseStateLabel: "Pendiente",
        slaDueAt: null,
        slaStatus: "NO_SLA",
        slaLabel: "Sin SLA",
        visibleReason: "Paciente no retiró medicación",
        priorityLevel: "P3",
        priorityLabel: "Atención sugerida",
        reasons: ["CHRONIC_HIGH_RENAL_OR_RETINOPATHY_UPLIFT"],
        displaySource: "ADHERENCE",
        displaySourceLabel: "Adherencia",
        displayReasons: [
          "Origen: Adherencia • DISPENSE_OVERDUE",
          "CHRONIC_HIGH_RENAL_OR_RETINOPATHY_UPLIFT",
        ],
        hasClinical: true,
        hasEducational: false,
        hasOperational: false,
        managementStatus: "AVAILABLE",
        assignmentStatus: "UNASSIGNED",
        assignmentStatusLabel: "Sin asignar",
        managedByName: null,
        managedAt: null,
      },
    ]);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/caseload/unified"),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer token-123",
        }),
      }),
    );
  });
});
