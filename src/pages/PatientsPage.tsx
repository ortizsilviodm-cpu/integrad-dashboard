/* integrad-dashboard/src/pages/PatientsPage.tsx */

import { useEffect, useMemo, useState } from "react";
import PatientsView from "../views/PatientsView";
import { fetchPatientsPage, type PatientRow } from "../api/patients";
import PatientDetailPage from "./PatientDetailPage";
import PatientPharmaFullPage from "./PatientPharmaFullPage";
import PatientClinicalFullPage from "./PatientClinicalFullPage";

const PAGE_SIZE = 25;

export default function PatientsPage() {
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);

  // 🔁 Estado de paginación basada en cursor (backend)
  const [cursor, setCursor] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState<boolean>(false);

  // Pila de cursores anteriores para poder navegar hacia atrás
  const [cursorStack, setCursorStack] = useState<Array<string | null>>([]);

  // Paciente seleccionado (para modal resumen)
  const [selectedPatient, setSelectedPatient] = useState<PatientRow | null>(
    null
  );

  // Paciente seleccionado para vista farmacológica completa
  const [pharmaDetailPatient, setPharmaDetailPatient] =
    useState<PatientRow | null>(null);

  // Paciente seleccionado para ficha clínica completa (visión 360°)
  const [clinicalDetailPatient, setClinicalDetailPatient] =
    useState<PatientRow | null>(null);

  // Filtro de enrolamiento
  const [enrollmentFilter, setEnrollmentFilter] = useState<
    "all" | "enrolled" | "not_enrolled"
  >("all");

  const normalizedSearch = search.trim().toLowerCase();

  // 🔍 Búsqueda + filtro de enrolamiento sobre la página actual
  const filteredPatients = useMemo(
    () =>
      patients.filter((p) => {
        // filtro por texto
        if (
          normalizedSearch &&
          !(
            p.name.toLowerCase().includes(normalizedSearch) ||
            p.document.toLowerCase().includes(normalizedSearch)
          )
        ) {
          return false;
        }

        // filtro por enrolamiento
        if (enrollmentFilter === "enrolled" && !p.enrolled) return false;
        if (enrollmentFilter === "not_enrolled" && p.enrolled) return false;

        return true;
      }),
    [patients, normalizedSearch, enrollmentFilter]
  );

  const totalFilteredCount = filteredPatients.length;

  // Como usamos paginación por cursor, no conocemos el total de páginas.
  // Usamos una aproximación: página actual + 1 si hay siguiente.
  const totalPages = Math.max(1, currentPage + (hasNext ? 1 : 0));

  const handleSearchChange = (value: string) => {
    setSearch(value);
  };

  /**
   * Carga una página desde el backend usando cursor y PAGE_SIZE.
   */
  const loadPage = (cursorToUse: string | null) => {
    setLoading(true);
    setError(null);

    fetchPatientsPage({ limit: PAGE_SIZE, cursor: cursorToUse })
      .then((result) => {
        if (result.ok) {
          setPatients(result.data);
          setHasNext(result.meta.hasNext);
          setNextCursor(result.meta.nextCursor ?? null);
          setCursor(cursorToUse);
          setError(null);
        } else {
          setPatients([]);
          setHasNext(false);
          setNextCursor(null);
          setError(
            result.error ??
              "No se pudieron cargar los pacientes. Intente nuevamente."
          );
        }
      })
      .catch((err) => {
        console.error("Error inesperado al cargar pacientes:", err);
        setPatients([]);
        setHasNext(false);
        setNextCursor(null);
        setError("No se pudieron cargar los pacientes. Intente nuevamente.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  /**
   * Maneja los cambios de página que dispara PatientsView.
   */
  const handlePageChange = (page: number) => {
    if (page === currentPage) return;

    // Ir hacia adelante (Siguiente)
    if (page > currentPage) {
      if (!hasNext || !nextCursor) return;

      const newStack = [...cursorStack, cursor];
      setCursorStack(newStack);
      setCurrentPage(currentPage + 1);
      loadPage(nextCursor);
      return;
    }

    // Ir hacia atrás (Anterior)
    if (page < currentPage) {
      if (cursorStack.length === 0) return;

      const newStack = [...cursorStack];
      const prevCursor = newStack.pop() ?? null;

      setCursorStack(newStack);
      setCurrentPage(Math.max(1, currentPage - 1));
      loadPage(prevCursor);
    }
  };

  // Carga inicial
  useEffect(() => {
    setCursorStack([]);
    setCurrentPage(1);
    loadPage(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Si cambiamos de página, cerramos el modal
  useEffect(() => {
    setSelectedPatient(null);
  }, [currentPage]);

  const handleCloseDetail = () => setSelectedPatient(null);

  // Abrir vista farmacológica completa desde el modal
  const handleOpenPharmaDetail = (patient: PatientRow) => {
    setSelectedPatient(null); // cerramos la ficha rápida
    setClinicalDetailPatient(null); // aseguramos que no haya ficha clínica abierta
    setPharmaDetailPatient(patient); // abrimos la vista farmacológica completa
  };

  // Abrir ficha clínica completa (visión 360°)
  const handleOpenClinicalDetail = (patient: PatientRow) => {
    setSelectedPatient(null); // cerramos la ficha rápida
    setPharmaDetailPatient(null); // cerramos la farmacológica si estaba abierta
    setClinicalDetailPatient(patient); // abrimos la ficha clínica completa
  };

  const handleClosePharmaDetail = () => {
    setPharmaDetailPatient(null);
  };

  const handleCloseClinicalDetail = () => {
    setClinicalDetailPatient(null);
  };

  return (
    <>
      {/* Contenido principal (lista + modales estándar) */}
      <PatientsView
        loading={loading}
        error={error}
        patients={filteredPatients}
        totalFilteredCount={totalFilteredCount}
        currentSearch={search}
        onSearchChange={handleSearchChange}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        onPatientClick={setSelectedPatient}
        enrollmentFilter={enrollmentFilter}
        onEnrollmentFilterChange={setEnrollmentFilter}
      />

      {/* Modal con ficha rápida del paciente */}
      {selectedPatient && (
        <PatientDetailPage
          patient={selectedPatient}
          onClose={handleCloseDetail}
          onOpenPharmaDetail={handleOpenPharmaDetail}
          onOpenClinicalDetail={handleOpenClinicalDetail}
        />
      )}

      {/* Vista farmacológica completa (ya maneja su propio overlay) */}
      {pharmaDetailPatient && (
        <PatientPharmaFullPage
          patient={pharmaDetailPatient}
          onClose={handleClosePharmaDetail}
        />
      )}

      {/* 🆕 Ficha clínica completa en overlay con blur */}
      {clinicalDetailPatient && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15,23,42,0.40)", // sombra suave
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-start",
            padding: "40px 24px",
            zIndex: 9998,
          }}
        >
          <div
            style={{
              maxWidth: 1200,
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              background: "#f9fafb",
              borderRadius: 16,
              boxShadow: "0 15px 45px rgba(15,23,42,0.35)",
            }}
          >
            <PatientClinicalFullPage
              patient={clinicalDetailPatient}
              onClose={handleCloseClinicalDetail}
            />
          </div>
        </div>
      )}
    </>
  );
}
