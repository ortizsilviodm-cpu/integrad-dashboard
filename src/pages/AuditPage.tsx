/* integrad-dashboard/src/pages/AuditPage.tsx */

import { useEffect, useState } from "react";
import AuditView from "../views/AuditView";
import { fetchAuditLogs, type AuditRow } from "../api/audit";

export default function AuditPage() {
  const [auditLogs, setAuditLogs] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = () => {
    setLoading(true);
    setError(null);

    fetchAuditLogs()
      .then((result) => {
        if (result.ok) {
          setAuditLogs(result.data);
          setError(null);
        } else {
          setAuditLogs([]);
          setError(
            result.error ?? "No se pudo cargar el registro de auditoría."
          );
        }
      })
      .catch((err) => {
        console.error("Error inesperado al cargar auditoría:", err);
        setAuditLogs([]);
        setError("No se pudo cargar el registro de auditoría.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <AuditView
      auditLogs={auditLogs}
      loading={loading}
      error={error}
      onRetry={loadData}
    />
  );
}
