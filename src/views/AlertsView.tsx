/* integrad-dashboard/src/views/AlertsView.tsx */

import StatusChip from "../components/StatusChip";
import type { AlertRow } from "../api/alerts";

export type AlertsViewProps = {
  loading: boolean;
  error: string | null;
  alerts: AlertRow[];
  /** Permite reintentar la carga cuando hay error */
  onRetry: () => void;
};

/**
 * Componente presentacional para la vista de Alertas.
 * Muestra una tabla con alertas de hipo/hiperglucemia y riesgo IA.
 */
export default function AlertsView({
  loading,
  error,
  alerts,
  onRetry,
}: AlertsViewProps) {
  const hasNoData = !loading && !error && alerts.length === 0;

  return (
    <section className="app-table">
      {/* 🔹 Encabezado consistente con otras páginas */}
      <header className="section-header">
        <h2>Alertas</h2>
        <p className="chart-subtitle">
          Supervisión de episodios hipo/hiper y alertas de riesgo IA.
        </p>
      </header>

      {/* Estado: cargando */}
      {loading && (
        <div className="chart-placeholder">Cargando alertas...</div>
      )}

      {/* Estado: error */}
      {!loading && error && (
        <div className="chart-placeholder">
          <p
            style={{
              margin: 0,
              marginBottom: "0.8rem",
              width: "100%",
              textAlign: "center",
              lineHeight: 1.4,
            }}
          >
            Error al cargar alertas:
            <br />
            <strong>{error}</strong>
          </p>
          <div className="retry-button-wrapper">
            <button
              type="button"
              className="retry-button"
              onClick={onRetry}
            >
              Reintentar
            </button>
          </div>
        </div>
      )}

      {/* Estado: sin datos */}
      {hasNoData && (
        <div className="chart-placeholder">
          No hay alertas abiertas en este momento.
        </div>
      )}

      {/* Tabla de datos */}
      {!loading && !error && alerts.length > 0 && (
        <div style={{ overflowX: "auto", marginTop: 10 }}>
          <table>
            <thead>
              <tr>
                <th>Paciente</th>
                <th>Tipo</th>
                <th>Valor</th>
                <th>Fecha y hora</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((a) => (
                <tr key={a.id}>
                  <td>{a.patientName}</td>
                  <td>{a.typeLabel}</td>
                  <td>{a.valueLabel}</td>
                  <td>{a.createdAtLabel}</td>
                  <td>
                    <StatusChip label={a.statusLabel} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
