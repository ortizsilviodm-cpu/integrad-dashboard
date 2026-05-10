/* integrad-dashboard/src/hooks/useCaseload.ts */

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CaseloadItem } from "../types/caseload.types";
import { fetchCaseload } from "../api/caseload";
import { fetchOperationalCases } from "../api/operationalCases";
import { API_URL } from "../config/api";
import { getAuthToken } from "../store/authStore";

const PAGE_SIZE_OPTIONS = [10, 20, 50];
const DEFAULT_PAGE_SIZE = 10;

type CaseloadWorkspaceTarget = {
  module: "followup";
  followupEventId: string | null;
};

type ManageCaseloadCaseResponse = {
  patientId: string;
  managementStatus: "AVAILABLE" | "IN_PROGRESS";
  managedByName: string | null;
  managedAt: string | null;
  workspaceTarget?: CaseloadWorkspaceTarget | null;
};

export function useCaseload() {
  const [items, setItems] = useState<CaseloadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);

  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const [pageSize, setPageSizeState] = useState<number>(DEFAULT_PAGE_SIZE);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [caseloadData, operationalCases] = await Promise.all([
        fetchCaseload(),
        fetchOperationalCases().catch(() => []),
      ]);

      const operationalCaseByPatientId = new Map(
        operationalCases.map((item) => [item.patientId, item]),
      );

      setItems(
        caseloadData.map((item) => ({
          ...item,
          operationalCase: operationalCaseByPatientId.get(item.patientId),
        })),
      );
    } catch {
      setError("No se pudo cargar el caseload.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleAction = useCallback(
    async (
      caseId: string,
      action: "TAKE" | "RELEASE",
    ): Promise<ManageCaseloadCaseResponse | null> => {
      try {
        setActingId(caseId);

        const token = getAuthToken();

        const response = await fetch(`${API_URL}/api/caseload/${caseId}/manage`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(action === "RELEASE" ? { action } : {}),
        });

        if (!response.ok) {
          throw new Error("Error HTTP en gestión de caso");
        }

        const result =
          (await response.json()) as ManageCaseloadCaseResponse;

        await load();
        return result;
      } catch {
        setError("No se pudo gestionar el caso.");
        return null;
      } finally {
        setActingId(null);
      }
    },
    [load],
  );

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const priorityMatch =
        priorityFilter === "ALL" || item.priorityLevel === priorityFilter;

      const statusMatch =
        statusFilter === "ALL" ||
        (statusFilter === "AVAILABLE" &&
          item.managementStatus === "AVAILABLE") ||
        (statusFilter === "IN_PROGRESS" &&
          item.managementStatus === "IN_PROGRESS");

      return priorityMatch && statusMatch;
    });
  }, [items, priorityFilter, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [priorityFilter, statusFilter]);

  const totalItems = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedItems = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    const end = start + pageSize;
    return filteredItems.slice(start, end);
  }, [filteredItems, safeCurrentPage, pageSize]);

  const hasNextPage = safeCurrentPage < totalPages;
  const hasPreviousPage = safeCurrentPage > 1;

  const goToNextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  const goToPreviousPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  }, []);

  const setPageSize = useCallback((size: number) => {
    if (!PAGE_SIZE_OPTIONS.includes(size)) return;
    setPageSizeState(size);
    setCurrentPage(1);
  }, []);

  return {
    items: paginatedItems,
    rawItems: items,
    filteredItems,
    loading,
    error,
    actingId,
    reload: load,
    handleAction,
    priorityFilter,
    setPriorityFilter,
    statusFilter,
    setStatusFilter,
    pageSize,
    pageSizeOptions: PAGE_SIZE_OPTIONS,
    currentPage: safeCurrentPage,
    totalPages,
    totalItems,
    hasNextPage,
    hasPreviousPage,
    goToNextPage,
    goToPreviousPage,
    setPageSize,
  };
}
