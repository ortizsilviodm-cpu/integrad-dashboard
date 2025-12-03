/* integrad-dashboard/src/pages/MedicationsPage.tsx */

import { useEffect, useState } from "react";
import MedicationsView from "../views/MedicationsView";
import { fetchMedications, type MedicationRow } from "../api/medications";

export default function MedicationsPage() {
  const [medications, setMedications] = useState<MedicationRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = () => {
    setLoading(true);
    setError(null);

    fetchMedications()
      .then((result) => {
        if (result.ok) {
          setMedications(result.data);
          setError(null);
        } else {
          setMedications([]);
          setError(
            result.error ??
              "No se pudieron cargar los esquemas de medicación."
          );
        }
      })
      .catch((err) => {
        console.error("Error inesperado al cargar medicación:", err);
        setMedications([]);
        setError("No se pudieron cargar los esquemas de medicación.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <MedicationsView
      medications={medications}
      loading={loading}
      error={error}
      onRetry={loadData}
    />
  );
}
