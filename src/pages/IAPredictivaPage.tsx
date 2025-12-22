/* integrad-dashboard/src/pages/IAPredictivaPage.tsx */

import { useEffect, useState, useMemo } from "react";
import IAPredictivaView from "../views/IAPredictivaView";
import {
  fetchIAPredictivaPreview,
  type IAPatientRisk,
  type IAPreviewSummary,
} from "../api/iaPredictiva";

/**
 * Roles permitidos para ver la sección de IA.
 * Más adelante esto debería venir del sistema de auth real.
 */
const ALLOWED_ROLES = ["admin", "medico", "coordinador"] as const;
type AllowedRole = (typeof ALLOWED_ROLES)[number];

/**
 * Ordena pacientes de mayor a menor riesgo.
 */
function sortPatientsByRisk(patients: IAPatientRisk[]): IAPatientRisk[] {
  return [...patients].sort((a, b) => b.riskScore - a.riskScore);
}

/**
 * Mantiene 1 fila por patientId (evita duplicados por “seguimientos”/motivos).
 * Nota: si el backend envía varias filas con el mismo patientId, nos quedamos
 * con la primera ocurrencia.
 */
function uniquePatientsById(patients: IAPatientRisk[]): IAPatientRisk[] {
  const map = new Map<string, IAPatientRisk>();

  for (const p of patients) {
    const id = (p as any)?.patientId ? String((p as any).patientId).trim() : "";
    if (!id) continue;

    if (!map.has(id)) {
      map.set(id, p);
    }
  }

  return Array.from(map.values());
}

export default function IAPredictivaPage() {
  // ⚠️ Por ahora, rol simulado. Luego se conectará con auth real.
  const currentUserRole: string = "admin";

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<IAPreviewSummary | null>(null);
  const [patients, setPatients] = useState<IAPatientRisk[]>([]);

  const hasAccess = useMemo(
    () => ALLOWED_ROLES.includes(currentUserRole as AllowedRole),
    [currentUserRole]
  );

  const loadData = () => {
    if (!hasAccess) return;

    setLoading(true);
    setError(null);

    fetchIAPredictivaPreview()
      .then((data) => {
        setSummary(data.summary);

        const uniquePatients = uniquePatientsById(data.patients ?? []);
        setPatients(sortPatientsByRisk(uniquePatients));
      })
      .catch((err) => {
        // Mantener console.error aquí es útil en etapa dev;
        // luego lo podemos reemplazar por un logger/telemetría.
        console.error("Error al cargar IA Predictiva:", err);

        setError(
          "No se pudieron cargar los datos de IA Predictiva. Intente nuevamente."
        );
        setSummary(null);
        setPatients([]);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAccess]);

  return (
    <IAPredictivaView
      hasAccess={hasAccess}
      loading={loading}
      error={error}
      summary={summary}
      patients={patients}
      onRetry={loadData}
    />
  );
}
