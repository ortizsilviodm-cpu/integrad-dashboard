import { useMemo, useState } from "react";
import StatusChip from "../components/StatusChip";

type PatientsViewProps = {
  loading: boolean;
  patients: Array<{
    id: number | string;
    name: string;
    document: string;
    lastGlucose: string;
    adherence: string;
    status: string;
  }>;
  error: string | null;
};

const PAGE_SIZE = 25;

export default function PatientsView({
  loading,
  patients,
  error,
}: PatientsViewProps) {
  const [search, setSearch] = useState("");

  const normalizedSearch = search.trim().toLowerCase();

  const filteredPatients = useMemo(
    () =>
      patients.filter((p) => {
        if (!normalizedSearch) return true;
        return (
          p.name.toLowerCase().includes(normalizedSearch) ||
          p.document.toLowerCase().includes(normalizedSearch)
        );
      }),
    [patients, normalizedSearch]
  );

  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(filteredPatients.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const startIndex = (safePage - 1) * PAGE_SIZE;
  const pagePatients = filteredPatients.slice(
    startIndex,
    startIndex + PAGE_SIZE
  );

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return (
    <section className="app-table">
      <h2>Pacientes</h2>
      <p className="chart-subtitle">
        Listado y búsqueda de pacientes en seguimiento.
      </p>

      {/* Toolbar: búsqueda + contador */}
      <div className="patients-toolbar">
        <input
          type="text"
          className="patients-search"
          placeholder="Buscar por nombre o documento..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
        <span className="patients-count">
          {loading
            ? "Cargando pacientes..."
            : `${filteredPatients.length} paciente${
                filteredPatients.length === 1 ? "" : "s"
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
          </tr>
        </thead>
        <tbody>
          {pagePatients.map((p) => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>{p.document}</td>
              <td>{p.lastGlucose}</td>
              <td>{p.adherence}</td>
              <td>
                <StatusChip label={p.status} />
              </td>
            </tr>
          ))}

          {!loading && pagePatients.length === 0 && (
            <tr>
              <td colSpan={5} style={{ textAlign: "center", padding: 16 }}>
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
          disabled={safePage === 1}
          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
        >
          Anterior
        </button>
        <span>
          Página {safePage} de {totalPages}
        </span>
        <button
          type="button"
          disabled={safePage === totalPages}
          onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
        >
          Siguiente
        </button>
      </div>
    </section>
  );
}
