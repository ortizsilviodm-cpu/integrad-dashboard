/* integrad-dashboard/src/views/AuditView.tsx */

import type { AuditRow } from "../api/audit";

export type AuditViewProps = {
  auditLogs: AuditRow[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
};

export default function AuditView({
  auditLogs,
  loading,
  error,
  onRetry,
}: AuditViewProps) {
  const hasData = auditLogs.length > 0;

  return (
    <section className="app-table">
      {/* Encabezado consistente con el resto de vistas */}
      <header className="section-header">
        <h2>Auditoría</h2>
        <p className="chart-subtitle">
          Registro de eventos, cambios y acciones realizadas en el sistema.
        </p>
      </header>

      {/* Estado: cargando */}
      {loading && (
        <div className="chart-placeholder">
          Cargando registro de auditoría...
        </div>
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
            Error al cargar el registro de auditoría:
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
      {!loading && !error && !hasData && (
        <div className="chart-placeholder">
          No hay registros de auditoría para mostrar.
          <br />
          Próximamente: tabla de acciones por usuario, tipo de evento y fecha.
        </div>
      )}

      {/* Tabla con datos */}
      {!loading && !error && hasData && (
        <div style={{ overflowX: "auto", marginTop: 10 }}>
          <table>
            <thead>
              <tr>
                <th>Usuario / ID</th>
                <th>Acción y entidad</th>
                <th>Detalles</th>
                <th>Fecha y hora</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => (
                <tr key={log.id}>
                  <td>{log.userLabel}</td>
                  <td>{log.actionLabel}</td>
                  <td>{log.details}</td>
                  <td>{log.timestampLabel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
