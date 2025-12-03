/* integrad-dashboard/src/pages/EnrollmentsPage.tsx */

import { useEffect, useMemo, useState } from "react";
import EnrollmentsView from "../views/EnrollmentsView";
import {
  fetchEnrollmentsPage,
  type EnrollmentRow,
} from "../api/enrollments";

const PAGE_SIZE = 25;

export default function EnrollmentsPage() {
  const [rows, setRows] = useState<EnrollmentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [cursor, setCursor] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [cursorStack, setCursorStack] = useState<Array<string | null>>([]);

  // Filtros
  const [search, setSearch] = useState("");
  const [programTypeFilter, setProgramTypeFilter] = useState<string>(""); // "" = todos
  const [payerFilter, setPayerFilter] = useState<string>(""); // "" = todos
  const [statusFilter, setStatusFilter] = useState<string>(""); // "" = todos

  // Modal
  const [selectedEnrollment, setSelectedEnrollment] =
    useState<EnrollmentRow | null>(null);

  const normalizedSearch = search.trim().toLowerCase();

  const filteredRows = useMemo(
    () =>
      rows.filter((row) => {
        if (
          normalizedSearch &&
          !(
            row.patientName.toLowerCase().includes(normalizedSearch) ||
            row.document.toLowerCase().includes(normalizedSearch)
          )
        ) {
          return false;
        }
        return true;
      }),
    [rows, normalizedSearch]
  );

  const totalFilteredCount = filteredRows.length;
  const totalPages = Math.max(1, currentPage + (hasNext ? 1 : 0));

  const loadPage = (cursorToUse: string | null) => {
    setLoading(true);
    setError(null);

    fetchEnrollmentsPage({
      limit: PAGE_SIZE,
      cursor: cursorToUse,
      programType: programTypeFilter || undefined,
      payerCode: payerFilter || undefined,
      status: statusFilter || undefined,
    })
      .then((result) => {
        if (result.ok) {
          setRows(result.data);
          setHasNext(result.meta.hasNext);
          setNextCursor(result.meta.nextCursor);
          setCursor(cursorToUse);
          setError(null);
        } else {
          setRows([]);
          setHasNext(false);
          setNextCursor(null);
          setError(
            result.error ??
              "No se pudieron cargar los enrolamientos. Intente nuevamente."
          );
        }
      })
      .catch((err) => {
        console.error("Error inesperado al cargar enrolamientos:", err);
        setRows([]);
        setHasNext(false);
        setNextCursor(null);
        setError(
          "No se pudieron cargar los enrolamientos. Intente nuevamente."
        );
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Carga inicial + cuando cambian filtros remotos
  useEffect(() => {
    setCursorStack([]);
    setCurrentPage(1);
    loadPage(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programTypeFilter, payerFilter, statusFilter]);

  // Si cambiamos de página, cierro modal
  useEffect(() => {
    setSelectedEnrollment(null);
  }, [currentPage]);

  const handlePageChange = (page: number) => {
    if (page === currentPage) return;

    // Siguiente
    if (page > currentPage) {
      if (!hasNext || !nextCursor) return;
      const newStack = [...cursorStack, cursor];
      setCursorStack(newStack);
      setCurrentPage(currentPage + 1);
      loadPage(nextCursor);
      return;
    }

    // Anterior
    if (page < currentPage) {
      if (cursorStack.length === 0) return;
      const newStack = [...cursorStack];
      const prevCursor = newStack.pop() ?? null;
      setCursorStack(newStack);
      setCurrentPage(Math.max(1, currentPage - 1));
      loadPage(prevCursor);
    }
  };

  const handleCloseDetail = () => setSelectedEnrollment(null);

  return (
    <>
      <EnrollmentsView
        loading={loading}
        error={error}
        rows={filteredRows}
        totalFilteredCount={totalFilteredCount}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        search={search}
        onSearchChange={setSearch}
        programTypeFilter={programTypeFilter}
        onProgramTypeFilterChange={setProgramTypeFilter}
        payerFilter={payerFilter}
        onPayerFilterChange={setPayerFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onRowClick={setSelectedEnrollment}
      />

      {selectedEnrollment && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.35)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
          onClick={handleCloseDetail}
        >
          <div
            style={{
              background: "#f9fafb",
              borderRadius: 16,
              padding: 24,
              maxWidth: 800,
              width: "90%",
              boxShadow: "0 10px 40px rgba(0,0,0,0.18)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 16,
              }}
            >
              <div>
                <h2 style={{ margin: 0 }}>Detalle de enrolamiento</h2>
                <p className="chart-subtitle" style={{ marginTop: 4 }}>
                  Información básica del programa crónico del paciente.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseDetail}
                style={{
                  border: "none",
                  borderRadius: 999,
                  padding: "4px 10px",
                  cursor: "pointer",
                  background: "#e5e7eb",
                  fontWeight: 600,
                }}
              >
                Cerrar
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.4fr 1fr",
                gap: 16,
              }}
            >
              {/* Columna izquierda: paciente */}
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: 12,
                  padding: 16,
                  boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                }}
              >
                <h3 style={{ marginTop: 0, marginBottom: 8 }}>
                  Datos del paciente
                </h3>
                <p>
                  <strong>Nombre:</strong> {selectedEnrollment.patientName}
                </p>
                <p>
                  <strong>Documento:</strong> {selectedEnrollment.document}
                </p>
                <p>
                  <strong>Obra social:</strong>{" "}
                  {selectedEnrollment.payerCode ?? "—"}
                </p>
                <p>
                  <strong>Código afiliado:</strong>{" "}
                  {selectedEnrollment.membershipCode ?? "—"}
                </p>
                <p>
                  <strong>Plan:</strong> {selectedEnrollment.planCode ?? "—"}
                </p>
              </div>

              {/* Columna derecha: programa */}
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: 12,
                  padding: 16,
                  boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                }}
              >
                <h3 style={{ marginTop: 0, marginBottom: 8 }}>
                  Programa crónico
                </h3>
                <p>
                  <strong>Programa:</strong> {selectedEnrollment.programType}
                </p>
                <p>
                  <strong>Estado:</strong> {selectedEnrollment.status}
                </p>
                <p>
                  <strong>Profesional responsable:</strong>{" "}
                  {selectedEnrollment.mainProvider ?? "Pendiente de asignación"}
                </p>
                <p>
                  <strong>Fecha de inicio:</strong>{" "}
                  {selectedEnrollment.enrollmentDate
                    ? new Date(
                        selectedEnrollment.enrollmentDate
                      ).toLocaleDateString("es-AR")
                    : "Pendiente"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
