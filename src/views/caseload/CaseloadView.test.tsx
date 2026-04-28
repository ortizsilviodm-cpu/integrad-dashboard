import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const { useCaseloadMock } = vi.hoisted(() => ({
  useCaseloadMock: vi.fn(),
}));

vi.mock("../../hooks/useCaseload", () => ({
  useCaseload: useCaseloadMock,
}));

import CaseloadView from "./CaseloadView";

describe("CaseloadView", () => {
  it("renders hybrid display semantics for adherence rows and legacy fallback for clinical rows", () => {
    useCaseloadMock.mockReturnValue({
      items: [
        {
          caseId: "case-adh-1",
          patientId: "pat-adh-1",
          fullName: "Ana Semántica",
          visibleReason: "Origen: Adherencia • DISPENSE_OVERDUE",
          priorityLevel: "P3",
          priorityLabel: "Atención sugerida",
          slaLabel: "Sin SLA",
          caseStateLabel: "Pendiente",
          assignmentStatus: "UNASSIGNED",
          assignmentStatusLabel: "Disponible",
          reasons: ["ADHERENCE - DISPENSE_OVERDUE"],
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
          managedByName: null,
          managedAt: null,
        },
        {
          caseId: "case-cli-1",
          patientId: "pat-cli-1",
          fullName: "Beto Agudo",
          visibleReason: "CLINICAL - CRITICAL_LAB",
          priorityLevel: "P1",
          priorityLabel: "Alta prioridad",
          slaLabel: "Vence hoy",
          caseStateLabel: "En gestión",
          assignmentStatus: "ASSIGNED",
          assignmentStatusLabel: "Asignado",
          reasons: ["CLINICAL - CRITICAL_LAB"],
          hasClinical: true,
          hasEducational: false,
          hasOperational: false,
          managementStatus: "IN_PROGRESS",
          managedByName: "Dra. House",
          managedAt: "2026-04-20T10:00:00.000Z",
        },
      ],
      loading: false,
      error: null,
      actingId: null,
      handleAction: vi.fn(),
      priorityFilter: "ALL",
      setPriorityFilter: vi.fn(),
      statusFilter: "ALL",
      setStatusFilter: vi.fn(),
      pageSize: 10,
      pageSizeOptions: [10, 20, 50],
      currentPage: 1,
      totalPages: 1,
      totalItems: 2,
      hasNextPage: false,
      hasPreviousPage: false,
      goToNextPage: vi.fn(),
      goToPreviousPage: vi.fn(),
      setPageSize: vi.fn(),
    });

    const html = renderToStaticMarkup(<CaseloadView />);

    expect(html).toContain("Adherencia");
    expect(html).toContain(
      "Origen: Adherencia • DISPENSE_OVERDUE • CHRONIC_HIGH_RENAL_OR_RETINOPATHY_UPLIFT",
    );
    expect(html).toContain("Clínico");
    expect(html).toContain("CLINICAL - CRITICAL_LAB");
    expect(html).toContain("En gestión por Dra. House");
  });
});
