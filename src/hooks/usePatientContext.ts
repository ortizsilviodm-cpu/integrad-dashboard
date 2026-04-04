// integrad-dashboard/src/hooks/usePatientContext.ts

import { useEffect, useState } from "react";
import {
  fetchPatientContext,
  type PatientContextResponse,
} from "../services/patientContext.service";

export type PatientContextData = PatientContextResponse;

const EMPTY_CONTEXT: PatientContextData = {
  patientId: "",
  glucoseSeries: [],
  events: [],
  notes: [],
};

function normalizePatientContext(
  response: PatientContextResponse,
): PatientContextData {
  return {
    ...response,
    glucoseSeries: [...response.glucoseSeries].sort((a, b) => {
      return (
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
    }),
    events: [...response.events].sort((a, b) => {
      return (
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
    }),
    notes: [...response.notes].sort((a, b) => {
      return (
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    }),
  };
}

export function usePatientContext(patientId: string | null) {
  const [data, setData] = useState<PatientContextData>(EMPTY_CONTEXT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!patientId) {
      setData(EMPTY_CONTEXT);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    fetchPatientContext(patientId)
      .then((response) => {
        if (cancelled) {
          return;
        }

        setData(normalizePatientContext(response));
      })
      .catch((err: unknown) => {
        if (cancelled) {
          return;
        }

        const message =
          err instanceof Error && err.message.trim()
            ? err.message
            : "No se pudo cargar el contexto del paciente";

        setData({
          ...EMPTY_CONTEXT,
          patientId,
        });
        setError(message);
      })
      .finally(() => {
        if (cancelled) {
          return;
        }

        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [patientId]);

  return {
    data,
    loading,
    error,
  };
}