import { useEffect, useState } from "react";
import {
  fetchPatientTimeline,
  type PatientTimelineItem,
} from "../api/patientTimeline";

type UsePatientTimelineResult = {
  data: PatientTimelineItem[];
  loading: boolean;
  error: string | null;
};

export function usePatientTimeline(
  patientId: string | null | undefined
): UsePatientTimelineResult {
  const [data, setData] = useState<PatientTimelineItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadTimeline(): Promise<void> {
      if (!patientId?.trim()) {
        setData([]);
        setLoading(false);
        setError(null);
        return;
      }

      try {
        setLoading(true);

        const timeline = await fetchPatientTimeline(patientId);

        if (!cancelled) {
          setData(timeline);
          setError(null); // CLAVE: limpiar error SOLO si hay éxito real
        }
      } catch (err) {
        if (!cancelled) {
          setData([]);
          setError(
            err instanceof Error
              ? err.message
              : "No se pudo cargar el timeline del paciente"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadTimeline();

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