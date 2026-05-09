import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const { usePatientContextMock, usePatientTimelineMock } = vi.hoisted(() => ({
  usePatientContextMock: vi.fn(),
  usePatientTimelineMock: vi.fn(),
}));

vi.mock("../../hooks/usePatientContext", () => ({
  usePatientContext: usePatientContextMock,
}));

vi.mock("../../hooks/usePatientTimeline", () => ({
  usePatientTimeline: usePatientTimelineMock,
}));

vi.mock("./GlucoseChart", () => ({
  GlucoseChart: () => null,
}));

import { InterventionPanel } from "./InterventionPanel";
import type { FollowupEventRow, RiskStratificationV1 } from "../../api/followup";

function buildEvent(
  overrides: Partial<FollowupEventRow["patient"]["diabetesSetupSummary"]> = {},
): FollowupEventRow {
  return {
    id: "evt-1",
    patientId: "pat-1",
    clinicalSignalId: null,
    patient: {
      id: "pat-1",
      fullName: "Ana Baseline",
      documentId: "30111222",
      payerCode: null,
      diabetesSetupSummary: {
        completionState: "DEFERRED",
        hasPersistedRow: true,
        diabetesType: null,
        usesInsulin: null,
        insulinMode: null,
        source: "PROFESSIONAL",
        ...overrides,
      },
    },
    category: "ADHERENCE",
    type: "DISPENSE_OVERDUE",
    severity: "HIGH",
    status: "OPEN",
    priorityBase: 80,
    clinicalContext: { description: "Sin contexto clínico", probableCause: null },
    adherenceContext: {
      daysRemaining: 0,
      status: "WARNING",
      operationalMessage: "Cobertura inestable",
    },
    operationalSignals: { medicationRisk: "FOLLOWUP" },
    occurredAt: "2026-04-20T10:00:00.000Z",
    openedAt: "2026-04-20T10:00:00.000Z",
    slaDueAt: "2026-04-20T12:00:00.000Z",
    assignedToUserId: null,
    assignedTo: null,
    closedAt: null,
    closedByUserId: null,
    resolutionType: null,
    resolutionNote: null,
    createdAt: "2026-04-20T10:00:00.000Z",
    updatedAt: "2026-04-20T10:00:00.000Z",
  };
}

function buildRiskStratification(
  overrides: Partial<RiskStratificationV1> = {},
): RiskStratificationV1 {
  return {
    version: "dynamic-risk-stratification/v1",
    computedAt: "2026-04-20T10:00:00.000Z",
    context: {
      patientId: "pat-1",
      eventId: "evt-1",
      sourceConsumer: "FOLLOWUP_PANEL",
    },
    baselineRiskBand: "MEDIUM",
    dynamicRiskBand: "HIGH",
    operationalPriorityHint: "PRIORITIZE_REVIEW",
    suggestedInitialRole: "PROFESSIONAL",
    explainabilityReasons: [],
    triggeredRules: [],
    overrides: [],
    inputSourcesUsed: [],
    baselineProfile: {
      factors: [
        {
          key: "insulin-therapy",
          label: "Insulinoterapia",
          value: null,
          sourceType: "real",
          status: "missing",
          provenance: [
            {
              key: "diabetes-setup.insulin.deferred",
              sourceType: "real",
              status: "missing",
            },
          ],
        },
        {
          key: "renal-risk-summary",
          label: "Resumen renal",
          value: "HIGH",
          sourceType: "proxy",
          status: "used",
          provenance: [
            {
              key: "clinical-risk-summary.renal",
              sourceType: "proxy",
              status: "used",
            },
          ],
        },
      ],
      ruleBands: [
        {
          code: "BASELINE_RENAL_PROXY",
          label: "Carga renal proxy elevada",
          band: "MEDIUM",
          sourceType: "proxy",
          factorKeys: ["renal-risk-summary"],
        },
      ],
      missingFactors: [
        {
          key: "dialysis",
          label: "Diálisis",
          sourceType: "future-missing",
          status: "missing",
          provenance: [
            {
              key: "future-missing.dialysis",
              sourceType: "future-missing",
              status: "missing",
            },
          ],
        },
      ],
      overrides: [],
    },
    ...overrides,
  };
}

describe("InterventionPanel structured baseline", () => {
  it("renders unified trace history content with source distinctions", () => {
    usePatientContextMock.mockReturnValue({
      data: { patientId: "pat-1", glucoseSeries: [], events: [], notes: [] },
      loading: false,
      error: null,
    });
    usePatientTimelineMock.mockReturnValue({
      data: [],
      loading: false,
      error: null,
    });

    const html = renderToStaticMarkup(
      <InterventionPanel
        open
        event={buildEvent()}
        onClose={() => {}}
        riskStratification={buildRiskStratification({ baselineProfile: undefined })}
        historyContent={
          <div>
            <div>Caso tomado</div>
            <div>Interacción educativa</div>
            <div>accion@example.com</div>
          </div>
        }
      />,
    );

    expect(html).toContain("Traza operativa");
    expect(html).toContain(
      "Hitos del caso, intervenciones y educación en una sola secuencia.",
    );
    expect(html).toContain("Caso tomado");
    expect(html).toContain("Interacción educativa");
    expect(html).toContain("accion@example.com");
  });

  it("renders known persisted diabetes setup without hardcoded unavailable text", () => {
    usePatientContextMock.mockReturnValue({
      data: { patientId: "pat-1", glucoseSeries: [], events: [], notes: [] },
      loading: false,
      error: null,
    });
    usePatientTimelineMock.mockReturnValue({
      data: [],
      loading: false,
      error: null,
    });

    const html = renderToStaticMarkup(
      <InterventionPanel
        open
        event={buildEvent({
          completionState: "COMPLETE",
          diabetesType: "T1",
          usesInsulin: true,
          insulinMode: "BASAL",
        })}
        onClose={() => {}}
        riskStratification={buildRiskStratification()}
      />,
    );

    expect(html).toContain("Diabetes: T1");
    expect(html).not.toContain("tipo no disponible");
  });

  it("renders advisory dynamic risk content plus additive structured baseline data for deferred setup", () => {
    usePatientContextMock.mockReturnValue({
      data: { patientId: "pat-1", glucoseSeries: [], events: [], notes: [] },
      loading: false,
      error: null,
    });
    usePatientTimelineMock.mockReturnValue({
      data: [],
      loading: false,
      error: null,
    });

    const html = renderToStaticMarkup(
      <InterventionPanel
        open
        event={buildEvent()}
        onClose={() => {}}
        riskStratification={buildRiskStratification()}
      />,
    );

    expect(html).toContain("Diabetes: setup diferido");
    expect(html).toContain("Orientación clínica y operativa");
    expect(html).toContain(
      "Lectura orientativa para entender el caso. No cambia el orden actual de la bandeja.",
    );
    expect(html).toContain("Riesgo base: Medio");
    expect(html).toContain("Riesgo dinámico: Alto");
    expect(html).toContain("Prioridad sugerida:");
    expect(html).toContain("Priorizar revisión");
    expect(html).toContain("Por qué requiere seguimiento ahora:");
    expect(html).toContain("Rol inicial sugerido:");
    expect(html).toContain("Profesional");
    expect(html).toContain("dynamic-risk-stratification/v1");
    expect(html).toContain("Factores clínicos de base");
    expect(html).toContain(
      "Datos del paciente que ayudan a entender su vulnerabilidad de fondo.",
    );
    expect(html).toContain("Insulinoterapia");
    expect(html).toContain("Resumen renal");
    expect(html).toContain("Fuentes: Setup de insulina diferido");
    expect(html).toContain("Carga renal proxy elevada");
    expect(html).toContain("Conclusiones del sistema");
    expect(html).toContain("Datos clínicos todavía no disponibles");
    expect(html).toContain("Diálisis");
    expect(html).toContain("Dato inferido");
  });

  it("keeps legacy fallback copy when baselineProfile is absent", () => {
    usePatientContextMock.mockReturnValue({
      data: { patientId: "pat-1", glucoseSeries: [], events: [], notes: [] },
      loading: false,
      error: null,
    });
    usePatientTimelineMock.mockReturnValue({
      data: [],
      loading: false,
      error: null,
    });

    const html = renderToStaticMarkup(
      <InterventionPanel
        open
        event={buildEvent({ completionState: "LEGACY_MISSING", hasPersistedRow: false })}
        onClose={() => {}}
        riskStratification={buildRiskStratification({ baselineProfile: undefined })}
      />,
    );

    expect(html).toContain("Diabetes: setup legacy pendiente");
    expect(html).toContain("Orientación clínica y operativa");
    expect(html).toContain(
      "Este evento todavía usa el resumen legacy. Se mantiene la vista actual sin cambios.",
    );
  });
});
