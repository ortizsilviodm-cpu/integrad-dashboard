/* integrad-dashboard/src/views/PatientsView.tsx */

import type { CSSProperties } from "react";
import StatusChip from "../components/StatusChip";
import type { PatientRow } from "../api/patients";

export type PatientsViewProps = {
  loading: boolean;
  error: string | null;

  /** Datos paginados y filtrados listos para dibujar */
  patients: PatientRow[];

  /** Conteo total de pacientes después de aplicar el filtro (para el mensaje) */
  totalFilteredCount: number;

  /** Estado actual del campo de búsqueda */
  currentSearch: string;

  /** Handler para cuando el usuario cambia el texto de búsqueda */
  onSearchChange: (search: string) => void;

  // Props de paginación
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;

  // Handler opcional para clic en fila de paciente
  onPatientClick?: (patient: PatientRow) => void;

  // 🆕 Filtro de enrolamiento
  enrollmentFilter: "all" | "enrolled" | "not_enrolled";
  onEnrollmentFilterChange: (
    value: "all" | "enrolled" | "not_enrolled"
  ) => void;
};

// Estilos simples inline para el pill de enrolamiento
const pillBase: CSSProperties = {
  display: "inline-block",
  padding: "2px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 600,
};

const pillEnrolled: CSSProperties = {
  ...pillBase,
  backgroundColor: "#DCFCE7",
  color: "#166534",
};

const pillNotEnrolled: CSSProperties = {
  ...pillBase,
  backgroundColor: "#E5E7EB",
  color: "#374151",
};

// --- Componente de Vista (presentacional) ---
export default function PatientsView({
  loading,
  patients,
  error,
  totalFilteredCount,
  currentSearch,
  onSearchChange,
  currentPage,
  totalPages,
  onPageChange,
  onPatientClick,
  enrollmentFilter,
  onEnrollmentFilterChange,
}: PatientsViewProps) {
  const handlePrevPage = () => onPageChange(Math.max(1, currentPage - 1));
  const handleNextPage = () =>
    onPageChange(Math.min(totalPages, currentPage + 1));

  const noData = !loading && patients.length === 0;

  return (
    <section className="app-table">
      {/* 🔹 Encabezado consistente con Dashboard */}
      <header className="section-header">
        <h2>Pacientes</h2>
        <p className="chart-subtitle">
          Registro general de pacientes activos y su información básica de
          seguimiento.
        </p>
      </header>

      {/* Toolbar: búsqueda + filtro enrolamiento + contador */}
      <div className="patients-toolbar">
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="text"
            className="patients-search"
            placeholder="Buscar por nombre o documento..."
            value={currentSearch}
            onChange={(e) => onSearchChange(e.target.value)}
          />

          {/* Selector de enrolamiento */}
          <select
            value={enrollmentFilter}
            onChange={(e) =>
              onEnrollmentFilterChange(
                e.target.value as "all" | "enrolled" | "not_enrolled"
              )
            }
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              border: "1px solid #d1d5db",
              backgroundColor: "#ffffff",
              fontSize: 13,
            }}
          >
            <option value="all">Todos</option>
            <option value="enrolled">Enrolados</option>
            <option value="not_enrolled">No enrolados</option>
          </select>
        </div>

        <span className="patients-count">
          {loading
            ? "Cargando pacientes..."
            : `${totalFilteredCount} paciente${
                totalFilteredCount === 1 ? "" : "s"
              }`}
        </span>
      </div>

      {/* Tabla principal de pacientes */}
      <table>
        <thead>
          <tr>
            <th>Paciente</th>
            <th>Documento</th>
            <th>Última glucemia</th>
            <th>Adherencia</th>
            <th>Estado</th>
            <th>Programa crónico</th>
          </tr>
        </thead>
        <tbody>
          {/* Fila de carga */}
          {loading && (
            <tr>
              <td colSpan={6} style={{ textAlign: "center", padding: 16 }}>
                Cargando datos...
              </td>
            </tr>
          )}

          {/* Filas de datos */}
          {!loading &&
            patients.map((p) => (
              <tr
                key={p.id}
                onClick={onPatientClick ? () => onPatientClick(p) : undefined}
                style={onPatientClick ? { cursor: "pointer" } : undefined}
              >
                <td>{p.name}</td>
                <td>{p.document}</td>
                <td>{p.lastGlucose}</td>
                <td>{p.adherence}</td>
                <td>
                  <StatusChip label={p.status} />
                </td>
                <td>
                  {p.enrolled ? (
                    <span style={pillEnrolled}>Enrolado</span>
                  ) : (
                    <span style={pillNotEnrolled}>No enrolado</span>
                  )}
                </td>
              </tr>
            ))}

          {/* Fila de sin resultados */}
          {noData && (
            <tr>
              <td colSpan={6} style={{ textAlign: "center", padding: 16 }}>
                No se encontraron pacientes para el criterio de búsqueda.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Error de carga */}
      {error && <div className="table-error">{error}</div>}

      {/* Paginación */}
      <div className="table-pagination">
        <button
          type="button"
          disabled={currentPage === 1 || loading}
          onClick={handlePrevPage}
        >
          Anterior
        </button>

        <span>
          Página {currentPage} de {totalPages}
        </span>

        <button
          type="button"
          disabled={currentPage === totalPages || loading}
          onClick={handleNextPage}
        >
          Siguiente
        </button>
      </div>
    </section>
  );
}
