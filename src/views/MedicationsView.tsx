/* integrad-dashboard/src/views/MedicationsView.tsx */

import StatusChip from "../components/StatusChip";

export type MedicationRow = {
  id: string;
  patientName: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  startDate: string;
  status: "Activa" | "Suspendida" | "Finalizada";
};

export type MedicationsViewProps = {
  medications: MedicationRow[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
};

export default function MedicationsView({
  medications,
  loading,
  error,
  onRetry,
}: MedicationsViewProps) {
  const hasData = medications.length > 0;

  return (
    <section className="app-table">
      {/* Encabezado consistente con el resto de vistas */}
      <header className="section-header">
        <h2>Esquemas de medicación</h2>
        <p className="chart-subtitle">
          Visualización de tratamientos activos, dosis y frecuencia por
          paciente. No reemplaza la prescripción médica: solo ayuda a gestionar
          y seguir la adherencia.
        </p>
      </header>

      {/* Estado: cargando */}
      {loading && (
        <div className="chart-placeholder">
          Cargando esquemas de medicación...
        </div>
      )}

      {/* Estado: error */}
      {!loading && error && (
        <div className="chart-placeholder">
          <p
            style={{
              margin: 0,
              marginBottom: "1rem",
              width: "100%",
              textAlign: "center",
              lineHeight: 1.4,
            }}
          >
            Error al cargar los esquemas de medicación:
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
          No hay esquemas de medicación para mostrar.
          <br />
          Próximamente: filtros por activo/suspendido, tipo de medicación e
          indicadores de adherencia.
        </div>
      )}

      {/* Tabla */}
      {!loading && !error && hasData && (
        <div style={{ overflowX: "auto", marginTop: 10 }}>
          <table>
            <thead>
              <tr>
                <th>Paciente</th>
                <th>Medicación</th>
                <th>Dosis</th>
                <th>Frecuencia</th>
                <th>Inicio</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {medications.map((m) => (
                <tr key={m.id}>
                  <td>{m.patientName}</td>
                  <td>{m.medicationName}</td>
                  <td>{m.dosage}</td>
                  <td>{m.frequency}</td>
                  <td>{m.startDate}</td>
                  <td>
                    <StatusChip label={m.status} />
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
