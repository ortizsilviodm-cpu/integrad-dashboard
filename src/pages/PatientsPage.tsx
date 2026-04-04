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

  const [cursor, setCursor] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState<boolean>(false);

  const [cursorStack, setCursorStack] = useState<Array<string | null>>([]);

  const [selectedPatient, setSelectedPatient] = useState<PatientRow | null>(
    null
  );

  const [pharmaDetailPatient, setPharmaDetailPatient] =
    useState<PatientRow | null>(null);

  const [clinicalDetailPatient, setClinicalDetailPatient] =
    useState<PatientRow | null>(null);

  const [enrollmentFilter, setEnrollmentFilter] = useState<
    "all" | "enrolled" | "not_enrolled"
  >("all");

  const normalizedSearch = search.trim().toLowerCase();

  const filteredPatients = useMemo(
    () =>
      patients.filter((p) => {
        if (
          normalizedSearch &&
          !(
            p.name.toLowerCase().includes(normalizedSearch) ||
            p.document.toLowerCase().includes(normalizedSearch)
          )
        ) {
          return false;
        }

        if (enrollmentFilter === "enrolled" && !p.enrolled) return false;
        if (enrollmentFilter === "not_enrolled" && p.enrolled) return false;

        return true;
      }),
    [patients, normalizedSearch, enrollmentFilter]
  );

  const totalFilteredCount = filteredPatients.length;

  const totalPages = Math.max(1, currentPage + (hasNext ? 1 : 0));

  const handleSearchChange = (value: string) => {
    setSearch(value);
  };

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

  const handlePageChange = (page: number) => {
    if (page === currentPage) return;

    if (page > currentPage) {
      if (!hasNext || !nextCursor) return;

      const newStack = [...cursorStack, cursor];
      setCursorStack(newStack);
      setCurrentPage(currentPage + 1);
      loadPage(nextCursor);
      return;
    }

    if (page < currentPage) {
      if (cursorStack.length === 0) return;

      const newStack = [...cursorStack];
      const prevCursor = newStack.pop() ?? null;

      setCursorStack(newStack);
      setCurrentPage(Math.max(1, currentPage - 1));
      loadPage(prevCursor);
    }
  };

  useEffect(() => {
    setCursorStack([]);
    setCurrentPage(1);
    loadPage(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setSelectedPatient(null);
  }, [currentPage]);

  const handleCloseDetail = () => setSelectedPatient(null);

  const handleOpenPharmaDetail = (patient: PatientRow) => {
    setSelectedPatient(null);
    setClinicalDetailPatient(null);
    setPharmaDetailPatient(patient);
  };

  const handleOpenClinicalDetail = (patient: PatientRow) => {
    setSelectedPatient(null);
    setPharmaDetailPatient(null);
    setClinicalDetailPatient(patient);
  };

  const handleClosePharmaDetail = () => {
    setPharmaDetailPatient(null);
  };

  const handleCloseClinicalDetail = () => {
    setClinicalDetailPatient(null);
  };

  return (
    <>
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

      {selectedPatient && (
        <PatientDetailPage
          patient={selectedPatient}
          onClose={handleCloseDetail}
          onOpenPharmaDetail={handleOpenPharmaDetail}
          onOpenClinicalDetail={handleOpenClinicalDetail}
        />
      )}

      {pharmaDetailPatient && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15,23,42,0.40)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "24px 20px",
            zIndex: 9998,
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              width: "min(1360px, 100%)",
              maxHeight: "92vh",
              overflowY: "auto",
              overflowX: "hidden",
              background: "#f9fafb",
              borderRadius: 18,
              boxShadow: "0 15px 45px rgba(15,23,42,0.35)",
              boxSizing: "border-box",
            }}
          >
            <PatientPharmaFullPage
              patient={pharmaDetailPatient}
              onClose={handleClosePharmaDetail}
            />
          </div>
        </div>
      )}

      {clinicalDetailPatient && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15,23,42,0.40)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-start",
            padding: "24px 20px",
            zIndex: 9998,
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              width: "min(1520px, 100%)",
              maxHeight: "92vh",
              overflowY: "auto",
              overflowX: "hidden",
              background: "#f9fafb",
              borderRadius: 16,
              boxShadow: "0 15px 45px rgba(15,23,42,0.35)",
              boxSizing: "border-box",
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