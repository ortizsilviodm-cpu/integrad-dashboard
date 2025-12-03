/* integrad-dashboard/src/pages/DispensesPage.tsx */

import { useEffect, useMemo, useState } from "react";
import DispensesView from "../views/DispensesView";
import { fetchDispensesPage, type DispenseRow } from "../api/dispenses";

const PAGE_SIZE = 25;

// Tipo local para el filtro de estado
type StatusFilterValue = "ALL" | "A tiempo" | "Retrasado" | "Pendiente";

export default function DispensesPage() {
  const [dispenses, setDispenses] = useState<DispenseRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [cursor, setCursor] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState<boolean>(false);
  const [cursorStack, setCursorStack] = useState<Array<string | null>>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // 🔍 Filtros locales (solo front por ahora)
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("ALL");

  const loadPage = (cursorToUse: string | null) => {
    setLoading(true);
    setError(null);

    fetchDispensesPage({ limit: PAGE_SIZE, cursor: cursorToUse })
      .then((result) => {
        if (result.ok) {
          setDispenses(result.data);
          setHasNext(result.meta.hasNext);
          setNextCursor(result.meta.nextCursor);
          setCursor(cursorToUse);
          setError(null);
        } else {
          setDispenses([]);
          setHasNext(false);
          setNextCursor(null);
          setError(
            result.error ?? "No se pudieron cargar los datos de dispensas."
          );
        }
      })
      .catch((err) => {
        console.error("Error inesperado al cargar dispensas:", err);
        setDispenses([]);
        setHasNext(false);
        setNextCursor(null);
        setError("No se pudieron cargar los datos de dispensas.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleRetry = () => loadPage(cursor);

  const handleNextPage = () => {
    if (!hasNext || !nextCursor) return;

    setCursorStack((stack) => [...stack, cursor]);
    setCurrentPage((p) => p + 1);
    loadPage(nextCursor);
  };

  const handlePrevPage = () => {
    if (cursorStack.length === 0) return;

    const newStack = [...cursorStack];
    const prevCursor = newStack.pop() ?? null;

    setCursorStack(newStack);
    setCurrentPage((p) => p - 1);
    loadPage(prevCursor);
  };

  useEffect(() => {
    // Primera página
    setCursorStack([]);
    setCurrentPage(1);
    loadPage(null);
  }, []);

  // Aproximación de totalPages: actual + 1 si hay next
  const totalPages = Math.max(1, currentPage + (hasNext ? 1 : 0));

  // 🧮 Aplicamos filtros en el front (sobre la página actual)
  const filteredDispenses = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return dispenses.filter((d) => {
      const matchesSearch =
        !normalizedSearch ||
        d.patientName.toLowerCase().includes(normalizedSearch) ||
        (d.medication ?? "").toLowerCase().includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "ALL" ? true : d.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [dispenses, searchTerm, statusFilter]);

  return (
    <DispensesView
      dispenses={filteredDispenses}
      loading={loading}
      error={error}
      onRetry={handleRetry}
      currentPage={currentPage}
      totalPages={totalPages}
      onNextPage={handleNextPage}
      onPrevPage={handlePrevPage}
      // 🔍 Filtros (controlados desde la página)
      search={searchTerm}
      onSearchChange={setSearchTerm}
      statusFilter={statusFilter}
      onStatusFilterChange={setStatusFilter}
    />
  );
}
