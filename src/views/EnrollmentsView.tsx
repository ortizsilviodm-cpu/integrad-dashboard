/* integrad-dashboard/src/views/EnrollmentsView.tsx */

import type { CSSProperties } from "react";
import type { EnrollmentRow } from "../api/enrollments";

export type EnrollmentsViewProps = {
  loading: boolean;
  error: string | null;
  rows: EnrollmentRow[];
  totalFilteredCount: number;

  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;

  search: string;
  onSearchChange: (value: string) => void;

  programTypeFilter: string;
  onProgramTypeFilterChange: (value: string) => void;

  payerFilter: string;
  onPayerFilterChange: (value: string) => void;

  statusFilter: string;
  onStatusFilterChange: (value: string) => void;

  onRowClick?: (row: EnrollmentRow) => void;
};

const statusPillBase: CSSProperties = {
  display: "inline-block",
  padding: "2px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 600,
};

const statusActive: CSSProperties = {
  ...statusPillBase,
  backgroundColor: "#DCFCE7",
  color: "#166534",
};

const statusInactive: CSSProperties = {
  ...statusPillBase,
  backgroundColor: "#FEE2E2",
  color: "#B91C1C",
};

export default function EnrollmentsView({
  loading,
  error,
  rows,
  totalFilteredCount,
  currentPage,
  totalPages,
  onPageChange,
  search,
  onSearchChange,
  programTypeFilter,
  onProgramTypeFilterChange,
  payerFilter,
  onPayerFilterChange,
  statusFilter,
  onStatusFilterChange,
  onRowClick,
}: EnrollmentsViewProps) {
  const handlePrevPage = () => onPageChange(Math.max(1, currentPage - 1));
  const handleNextPage = () =>
    onPageChange(Math.min(totalPages, currentPage + 1));

  const noData = !loading && rows.length === 0;

  return (
    <section className="app-table">
      <header className="section-header">
        <h2>Enrolamientos</h2>
        <p className="chart-subtitle">
          Listado de pacientes enrolados en programas crónicos (ej: Diabetes).
        </p>
      </header>

      {/* Toolbar: filtros + contador */}
      <div className="patients-toolbar">
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <input
            type="text"
            className="patients-search"
            placeholder="Buscar por nombre o documento..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />

          {/* Programa */}
          <select
            value={programTypeFilter}
            onChange={(e) => onProgramTypeFilterChange(e.target.value)}
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              border: "1px solid #d1d5db",
              backgroundColor: "#ffffff",
              fontSize: 13,
            }}
          >
            <option value="">Todos los programas</option>
            <option value="diabetes">Diabetes</option>
          </select>

          {/* Obra social */}
          <select
            value={payerFilter}
            onChange={(e) => onPayerFilterChange(e.target.value)}
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              border: "1px solid #d1d5db",
              backgroundColor: "#ffffff",
              fontSize: 13,
            }}
          >
            <option value="">Todas las obras sociales</option>
            <option value="APOS">APOS</option>
            <option value="INSSSEP">INSSSEP</option>
          </select>

          {/* Estado programa */}
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              border: "1px solid #d1d5db",
              backgroundColor: "#ffffff",
              fontSize: 13,
            }}
          >
            <option value="">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
        </div>

        <span className="patients-count">
          {loading
            ? "Cargando enrolamientos..."
            : `${totalFilteredCount} enrolamiento${
                totalFilteredCount === 1 ? "" : "s"
              }`}
        </span>
      </div>

      {/* Tabla principal */}
      <table>
        <thead>
          <tr>
            <th>Paciente</th>
            <th>Documento</th>
            <th>Obra social</th>
            <th>Programa</th>
            <th>Estado</th>
            <th>Inicio</th>
            <th>Profesional</th>
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td colSpan={7} style={{ textAlign: "center", padding: 16 }}>
                Cargando datos...
              </td>
            </tr>
          )}

          {!loading &&
            rows.map((row) => {
              const isActive =
                row.status === "active" || row.status === "activo";

              return (
                <tr
                  key={row.id}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  style={onRowClick ? { cursor: "pointer" } : undefined}
                >
                  <td>{row.patientName}</td>
                  <td>{row.document}</td>
                  <td>{row.payerCode ?? "—"}</td>
                  <td>{row.programType}</td>
                  <td>
                    <span style={isActive ? statusActive : statusInactive}>
                      {isActive ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td>
                    {row.enrollmentDate
                      ? new Date(row.enrollmentDate).toLocaleDateString("es-AR")
                      : "Pendiente"}
                  </td>
                  <td>{row.mainProvider ?? "Pendiente"}</td>
                </tr>
              );
            })}

          {noData && (
            <tr>
              <td colSpan={7} style={{ textAlign: "center", padding: 16 }}>
                No se encontraron enrolamientos para el criterio aplicado.
              </td>
            </tr>
          )}
        </tbody>
      </table>

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
