/* integrad-dashboard/src/views/PatientAlertsView.tsx */

import StatusChip from "../components/StatusChip";

/**
 * Fila de alerta de un paciente individual.
 * Pensada como modelo ya formateado para la UI.
 */
export type PatientAlertRow = {
  id: string;

  // Etiquetas amigables ya formateadas por la capa de API
  typeLabel: string;    // "Hipo", "Hiper", "Riesgo IA", etc.
  valueLabel: string;   // "120 mg/dL", "85 / 100", etc.
  detectedAt: string;   // Texto ya formateado (ej: "12/03/2025 14:30")
  statusLabel: string;  // "En alerta", "Resuelta", etc.

  // Motivo adicional (si lo trae el backend)
  reason: string | null;
};

export type PatientAlertsViewProps = {
  patientName: string;
  alerts: PatientAlertRow[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
};

/**
 * Vista presentacional de alertas por paciente.
 *
 * - Usa el mismo estilo de card que PatientsView: section.app-table
 * - Encabezado con section-header + chart-subtitle
 * - Tabla simple sin paginación (se asume volumen acotado por paciente)
 */
export default function PatientAlertsView({
  patientName,
  alerts,
  loading,
  error,
  onRetry,
}: PatientAlertsViewProps) {
  const noData = !loading && alerts.length === 0;

  return (
    <section className="app-table">
      {/* Encabezado consistente con el resto del dashboard */}
      <header className="section-header">
        <h2>Alertas del paciente</h2>
        <p className="chart-subtitle">
          Episodios de hipo/hiper glucemia y alertas de riesgo para{" "}
          <strong>{patientName}</strong>. Esta vista muestra eventos ya
          detectados por el sistema para facilitar el seguimiento clínico.
        </p>
      </header>

      {/* Tabla de alertas */}
      <table>
        <thead>
          <tr>
            <th>Fecha y hora</th>
            <th>Tipo</th>
            <th>Valor</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {/* Fila de carga */}
          {loading && (
            <tr>
              <td colSpan={4} style={{ textAlign: "center", padding: 16 }}>
                Cargando alertas...
              </td>
            </tr>
          )}

          {/* Filas con datos */}
          {!loading &&
            alerts.map((a) => (
              <tr key={a.id}>
                <td>{a.detectedAt}</td>
                <td>{a.typeLabel}</td>
                <td>{a.valueLabel}</td>
                <td>
                  <StatusChip label={a.statusLabel} />
                </td>
              </tr>
            ))}

          {/* Sin resultados */}
          {noData && (
            <tr>
              <td colSpan={4} style={{ textAlign: "center", padding: 16 }}>
                No se registran alertas para este paciente.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Error + botón de reintento reciclado del estilo existente */}
      {error && (
        <>
          <div className="table-error">{error}</div>
          <div className="retry-button-wrapper">
            <button
              type="button"
              className="retry-button"
              onClick={onRetry}
              disabled={loading}
            >
              Reintentar
            </button>
          </div>
        </>
      )}
    </section>
  );
}
