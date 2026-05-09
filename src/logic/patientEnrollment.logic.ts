import type { EnrollmentDiabetesSetup } from "../api/patientEnrollment";

export const defaultEnrollmentDiabetesSetup: EnrollmentDiabetesSetup = {
  completionState: "DEFERRED",
  diabetesType: null,
  usesInsulin: null,
  insulinMode: null,
  source: "PROFESSIONAL",
};

export function normalizeEnrollmentDiabetesSetup(
  setup?: EnrollmentDiabetesSetup,
): EnrollmentDiabetesSetup {
  const completionState = setup?.completionState ?? "DEFERRED";
  const source = setup?.source ?? "PROFESSIONAL";

  if (completionState === "DEFERRED") {
    return {
      completionState: "DEFERRED",
      diabetesType: null,
      usesInsulin: null,
      insulinMode: null,
      source,
    };
  }

  const usesInsulin = setup?.usesInsulin === true;

  return {
    completionState: "COMPLETE",
    diabetesType: setup?.diabetesType ?? null,
    usesInsulin,
    insulinMode: usesInsulin ? setup?.insulinMode ?? "UNKNOWN" : "NONE",
    source,
  };
}
