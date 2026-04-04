/* integrad-dashboard\src\hooks\usePatientClinicalFull.ts  */

import { useCallback, useEffect, useState } from "react";

import {
  fetchPatientSummary,
  fetchClinicalRiskSummary,
  type PatientSummaryResponse,
  type ClinicalRiskSummary,
} from "../api/patientSummary";
import {
  fetchPatientMedications,
  fetchPatientRiskSnapshot,
  type PatientMedicationRow,
  type PatientRiskSnapshot,
} from "../api/patients";
import {
  fetchClinicalHistory,
  type ClinicalIndicatorHistoryRow,
} from "../api/clinicalHistory";
import { fetchPatientAlerts, type PatientAlertRow } from "../api/alerts";
import {
  fetchPatientTimeline,
  type PatientTimelineItem,
} from "../api/patientTimeline";

const MSG = {
  patientLoadFail: "No se pudo cargar la ficha del paciente.",
  historyLoadFail: "No se pudo cargar el historial clínico.",
  m5LoadFail: "No se pudo cargar el snapshot M5.",
  medsLoadFail: "No se pudo cargar la medicación.",
  alertsLoadFail: "No se pudieron cargar las alertas clínicas.",
  timelineLoadFail: "No se pudo cargar el timeline clínico.",
} as const;

export type PatientClinicalFullData = {
  summary: PatientSummaryResponse | null;
  risk: ClinicalRiskSummary | null;
  medications: PatientMedicationRow[];
  alerts: PatientAlertRow[];
  history: ClinicalIndicatorHistoryRow[];
  timeline: PatientTimelineItem[];
  m5: PatientRiskSnapshot | null;
};

export type PatientClinicalFullSectionErrors = {
  summary: string | null;
  risk: string | null;
  medications: string | null;
  alerts: string | null;
  history: string | null;
  timeline: string | null;
  m5: string | null;
};

export type UsePatientClinicalFullResult = {
  data: PatientClinicalFullData;
  loading: boolean;
  error: string | null;
  sectionErrors: PatientClinicalFullSectionErrors;
  reload: () => void;
};

const INITIAL_DATA: PatientClinicalFullData = {
  summary: null,
  risk: null,
  medications: [],
  alerts: [],
  history: [],
  timeline: [],
  m5: null,
};

const INITIAL_SECTION_ERRORS: PatientClinicalFullSectionErrors = {
  summary: null,
  risk: null,
  medications: null,
  alerts: null,
  history: null,
  timeline: null,
  m5: null,
};

export function usePatientClinicalFull(
  patientId: string | null | undefined,
): UsePatientClinicalFullResult {
  const [data, setData] = useState<PatientClinicalFullData>(INITIAL_DATA);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [sectionErrors, setSectionErrors] = useState<PatientClinicalFullSectionErrors>(
    INITIAL_SECTION_ERRORS,
  );
  const [reloadFlag, setReloadFlag] = useState<number>(0);

  const reload = useCallback(() => {
    setReloadFlag((current) => current + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadData(): Promise<void> {
      if (!patientId) {
        if (cancelled) return;

        setData(INITIAL_DATA);
        setSectionErrors(INITIAL_SECTION_ERRORS);
        setError(null);
        setLoading(false);
        return;
      }

      try {
        if (!cancelled) {
          setLoading(true);
          setError(null);
          setSectionErrors(INITIAL_SECTION_ERRORS);
        }

        const [
          summarySettled,
          riskSettled,
          medicationsSettled,
          alertsSettled,
          historySettled,
          timelineSettled,
          m5Settled,
        ] = await Promise.allSettled([
          fetchPatientSummary(patientId),
          fetchClinicalRiskSummary(patientId),
          fetchPatientMedications(patientId),
          fetchPatientAlerts(patientId, "open"),
          fetchClinicalHistory(patientId),
          fetchPatientTimeline(patientId),
          fetchPatientRiskSnapshot({
            patientId,
            windowDays: 90,
            modelVersion: "m5_v1",
          }),
        ]);

        if (cancelled) return;

        if (
          summarySettled.status !== "fulfilled" ||
          !summarySettled.value.ok
        ) {
          setData(INITIAL_DATA);
          setSectionErrors({
            ...INITIAL_SECTION_ERRORS,
            summary:
              summarySettled.status === "fulfilled"
                ? summarySettled.value.error ?? MSG.patientLoadFail
                : MSG.patientLoadFail,
          });
          setError(
            summarySettled.status === "fulfilled"
              ? summarySettled.value.error ?? MSG.patientLoadFail
              : MSG.patientLoadFail,
          );
          return;
        }

        const nextSectionErrors: PatientClinicalFullSectionErrors = {
          ...INITIAL_SECTION_ERRORS,
        };

        const nextData: PatientClinicalFullData = {
          summary: summarySettled.value.data,
          risk: null,
          medications: [],
          alerts: [],
          history: [],
          timeline: [],
          m5: null,
        };

        if (riskSettled.status === "fulfilled") {
          if (riskSettled.value.ok) {
            nextData.risk = riskSettled.value.data;
          } else {
            nextSectionErrors.risk = riskSettled.value.error ?? MSG.patientLoadFail;
          }
        } else {
          nextSectionErrors.risk = MSG.patientLoadFail;
        }

        if (medicationsSettled.status === "fulfilled") {
          if (medicationsSettled.value.ok) {
            nextData.medications = medicationsSettled.value.data;
          } else {
            nextSectionErrors.medications =
              medicationsSettled.value.error ?? MSG.medsLoadFail;
          }
        } else {
          nextSectionErrors.medications = MSG.medsLoadFail;
        }

        if (alertsSettled.status === "fulfilled") {
          if (alertsSettled.value.ok) {
            nextData.alerts = alertsSettled.value.data;
          } else {
            nextSectionErrors.alerts =
              alertsSettled.value.error ?? MSG.alertsLoadFail;
          }
        } else {
          nextSectionErrors.alerts = MSG.alertsLoadFail;
        }

        if (historySettled.status === "fulfilled") {
          if (historySettled.value.ok) {
            nextData.history = historySettled.value.data ?? [];
          } else {
            nextSectionErrors.history =
              historySettled.value.error ?? MSG.historyLoadFail;
          }
        } else {
          nextSectionErrors.history = MSG.historyLoadFail;
        }

        if (timelineSettled.status === "fulfilled") {
          nextData.timeline = timelineSettled.value;
        } else {
          nextSectionErrors.timeline = MSG.timelineLoadFail;
        }

        if (m5Settled.status === "fulfilled") {
          if (m5Settled.value.ok) {
            nextData.m5 = m5Settled.value.data;
          } else {
            nextSectionErrors.m5 = m5Settled.value.error ?? MSG.m5LoadFail;
          }
        } else {
          nextSectionErrors.m5 = MSG.m5LoadFail;
        }

        setData(nextData);
        setSectionErrors(nextSectionErrors);
        setError(null);
      } catch {
        if (cancelled) return;

        setData(INITIAL_DATA);
        setSectionErrors({
          ...INITIAL_SECTION_ERRORS,
          summary: MSG.patientLoadFail,
        });
        setError(MSG.patientLoadFail);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [patientId, reloadFlag]);

  return {
    data,
    loading,
    error,
    sectionErrors,
    reload,
  };
}

export default usePatientClinicalFull;