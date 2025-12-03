/* integrad-dashboard/src/pages/PatientAlertsPage.tsx */

import { useEffect, useState } from "react";
import PatientAlertsView, {
  type PatientAlertsViewProps,
  type PatientAlertRow,
} from "../views/PatientAlertsView";
import { fetchPatientAlerts } from "../api/patientAlerts";

type OwnProps = {
  patientId: string;
  patientName: string;
};

type Props = OwnProps;

export default function PatientAlertsPage({ patientId, patientName }: Props) {
  const [alerts, setAlerts] = useState<PatientAlertRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = () => {
    setLoading(true);
    setError(null);

    fetchPatientAlerts(patientId)
      .then((result) => {
        if (result.ok) {
          setAlerts(result.data);
          setError(null);
        } else {
          setAlerts([]);
          setError(
            result.error ??
              "No se pudieron cargar las alertas del paciente."
          );
        }
      })
      .catch((err) => {
        console.error("Error inesperado al cargar alertas del paciente:", err);
        setAlerts([]);
        setError(
          "No se pudieron cargar las alertas del paciente. Intente nuevamente."
        );
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, [patientId]);

  const viewProps: PatientAlertsViewProps = {
    patientName,
    alerts,
    loading,
    error,
    onRetry: loadData,
  };

  return <PatientAlertsView {...viewProps} />;
}
