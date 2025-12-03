// integrad-dashboard/src/pages/AlertsPage.tsx

import { useEffect, useState } from "react";
import AlertsView from "../views/AlertsView";
import { fetchOpenAlerts, type AlertRow } from "../api/alerts";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = () => {
    setLoading(true);
    setError(null);

    fetchOpenAlerts()
      .then((result) => {
        if (result.ok) {
          setAlerts(result.data);
          setError(null);
        } else {
          setAlerts([]);
          setError(result.error ?? "No se pudieron cargar las alertas.");
        }
      })
      .catch((err) => {
        console.error("Error inesperado al cargar alertas:", err);
        setAlerts([]);
        setError("No se pudieron cargar las alertas.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <AlertsView
      loading={loading}
      error={error}
      alerts={alerts}
      onRetry={loadData}
    />
  );
}
