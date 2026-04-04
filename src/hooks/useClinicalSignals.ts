/* integrad-dashboard\src\hooks\useClinicalSignals.ts */

import { useEffect, useState } from "react";
import { getClinicalSignals } from "../services/clinicalSignals.service";
import type {
  ClinicalSignal,
  ClinicalSignalsResponse,
} from "../types/clinicalSignals.types";

export function useClinicalSignals() {
  const [data, setData] = useState<ClinicalSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getClinicalSignals()
      .then((res: ClinicalSignalsResponse) => {
        setData(res.data || []);
        setError(null);
      })
      .catch((err: { message?: string }) => {
        setData([]);
        setError(err.message || "Error cargando señales clínicas");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return { data, loading, error };
}