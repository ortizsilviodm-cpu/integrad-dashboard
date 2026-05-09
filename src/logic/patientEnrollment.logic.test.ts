import { describe, expect, it } from "vitest";

import {
  defaultEnrollmentDiabetesSetup,
  normalizeEnrollmentDiabetesSetup,
} from "./patientEnrollment.logic";

describe("patientEnrollment.logic", () => {
  it("keeps deferred setup explicit instead of silently omitting it", () => {
    expect(normalizeEnrollmentDiabetesSetup()).toEqual(defaultEnrollmentDiabetesSetup);

    expect(
      normalizeEnrollmentDiabetesSetup({
        completionState: "DEFERRED",
        diabetesType: "T1",
        usesInsulin: true,
        insulinMode: "BASAL",
      }),
    ).toEqual({
      completionState: "DEFERRED",
      diabetesType: null,
      usesInsulin: null,
      insulinMode: null,
      source: "PROFESSIONAL",
    });
  });

  it("normalizes complete setup and avoids inventing insulin mode defaults", () => {
    expect(
      normalizeEnrollmentDiabetesSetup({
        completionState: "COMPLETE",
        diabetesType: "T1",
        usesInsulin: true,
        insulinMode: null,
        source: "PATIENT",
      }),
    ).toEqual({
      completionState: "COMPLETE",
      diabetesType: "T1",
      usesInsulin: true,
      insulinMode: "UNKNOWN",
      source: "PATIENT",
    });

    expect(
      normalizeEnrollmentDiabetesSetup({
        completionState: "COMPLETE",
        diabetesType: "T2",
        usesInsulin: false,
        insulinMode: "BASAL",
      }),
    ).toEqual({
      completionState: "COMPLETE",
      diabetesType: "T2",
      usesInsulin: false,
      insulinMode: "NONE",
      source: "PROFESSIONAL",
    });
  });
});
