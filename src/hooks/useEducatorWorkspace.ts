/* integradd-dashboard/src/hooks/useEducatorWorkspace.ts */

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  getEducatorPatients,
  getEducationInteractions,
  createEducationInteractionService,
} from "../services/educators.service";

import type {
  EducatorPatientRow,
  EducationInteractionForm,
  EducationInteractionItem,
} from "../types/educators.types";

import type { PatientRow } from "../api/patients";
import type { EducationInteractionType } from "../api/education";

type UseEducatorWorkspaceResult = {
  patients: EducatorPatientRow[];
  selectedPatient: EducatorPatientRow | null;
  interactions: EducationInteractionItem[];
  loadingPatients: boolean;
  loadingInteractions: boolean;
  submittingInteraction: boolean;
  error: string | null;
  interactionError: string | null;
  hasMorePatients: boolean;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  currentPage: number;
  pageSize: number;
  pageSizeOptions: number[];
  selectPatient: (patient: EducatorPatientRow | null) => void;
  loadMorePatients: () => Promise<void>;
  goToNextPage: () => Promise<void>;
  goToPreviousPage: () => Promise<void>;
  setPageSize: (size: number) => Promise<void>;
  reloadInteractions: () => Promise<void>;
  createInteraction: (form: EducationInteractionForm) => Promise<boolean>;
};

const DEFAULT_PAGE_SIZE = 30;
const PAGE_SIZE_OPTIONS = [30, 50, 100];

function mapPatientRow(patient: PatientRow): EducatorPatientRow {
  return {
    id: patient.id,
    fullName: patient.name,
    age: null,
    diabetesType: null,
    status: "FOLLOWUP",

    clinicalContext: {
      description: "Sin contexto clínico integrado",
      probableCause: null,
    },
    adherenceContext: {
      status: "OK",
      daysRemaining: null,
      message: "Sin contexto de adherencia integrado",
    },

    latestGlucose: null,
    trend: null,
    note: null,
    lastUpdate: null,
  };
}

function mapInteractionRow(row: {
  id: string;
  type: EducationInteractionType;
  note: string;
  createdAt: string;
}): EducationInteractionItem {
  return {
    id: row.id,
    type: row.type,
    note: row.note,
    createdAt: row.createdAt,
  };
}

export function useEducatorWorkspace(): UseEducatorWorkspaceResult {
  const [patients, setPatients] = useState<EducatorPatientRow[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  const [interactions, setInteractions] = useState<EducationInteractionItem[]>([]);

  const [loadingPatients, setLoadingPatients] = useState<boolean>(false);
  const [loadingInteractions, setLoadingInteractions] = useState<boolean>(false);
  const [submittingInteraction, setSubmittingInteraction] = useState<boolean>(false);

  const [error, setError] = useState<string | null>(null);
  const [interactionError, setInteractionError] = useState<string | null>(null);

  const [pageSize, setPageSizeState] = useState<number>(DEFAULT_PAGE_SIZE);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [currentCursor, setCurrentCursor] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [cursorStack, setCursorStack] = useState<Array<string | null>>([]);

  const hasNextPage = Boolean(nextCursor);
  const hasPreviousPage = cursorStack.length > 0;
  const hasMorePatients = hasNextPage;

  const selectedPatient = useMemo(() => {
    if (!selectedPatientId) return null;
    return patients.find((p) => p.id === selectedPatientId) ?? null;
  }, [patients, selectedPatientId]);

  const loadPatients = useCallback(
    async (cursorToUse: string | null, limit: number) => {
      setLoadingPatients(true);
      setError(null);

      try {
        const response = await getEducatorPatients({
          limit,
          cursor: cursorToUse,
        });

        if (!response.ok) {
          setPatients([]);
          setCurrentCursor(cursorToUse);
          setNextCursor(null);
          setError(response.error ?? "No se pudo cargar la bandeja de educadores.");
          return;
        }

        const incomingPatients = (response.data ?? []).map(mapPatientRow);
        const resolvedNextCursor = response.meta.nextCursor ?? null;

        setPatients(incomingPatients);
        setCurrentCursor(cursorToUse);
        setNextCursor(resolvedNextCursor);

        setSelectedPatientId((current) => {
          if (!current) return null;
          return incomingPatients.some((p) => p.id === current) ? current : null;
        });
      } catch {
        setPatients([]);
        setCurrentCursor(cursorToUse);
        setNextCursor(null);
        setError("No se pudo cargar la bandeja de educadores.");
      } finally {
        setLoadingPatients(false);
      }
    },
    [],
  );

  const loadInteractions = useCallback(async (patientId: string) => {
    setLoadingInteractions(true);
    setInteractionError(null);

    try {
      const response = await getEducationInteractions(patientId);

      const mapped = (response.data ?? [])
        .map(mapInteractionRow)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setInteractions(mapped);
    } catch {
      setInteractionError("No se pudo cargar el historial educativo.");
      setInteractions([]);
    } finally {
      setLoadingInteractions(false);
    }
  }, []);

  const selectPatient = useCallback((patient: EducatorPatientRow | null) => {
    setSelectedPatientId(patient?.id ?? null);

    if (!patient) {
      setInteractions([]);
      setInteractionError(null);
    }
  }, []);

  const goToNextPage = useCallback(async () => {
    if (!nextCursor || loadingPatients) return;

    setCursorStack((stack) => [...stack, currentCursor]);
    setCurrentPage((p) => p + 1);

    await loadPatients(nextCursor, pageSize);
  }, [currentCursor, loadPatients, loadingPatients, nextCursor, pageSize]);

  const goToPreviousPage = useCallback(async () => {
    if (cursorStack.length === 0 || loadingPatients) return;

    const previousCursor = cursorStack[cursorStack.length - 1];
    const updatedStack = cursorStack.slice(0, -1);

    setCursorStack(updatedStack);
    setCurrentPage((p) => Math.max(1, p - 1));

    await loadPatients(previousCursor, pageSize);
  }, [cursorStack, loadPatients, loadingPatients, pageSize]);

  const setPageSize = useCallback(
    async (size: number) => {
      if (!PAGE_SIZE_OPTIONS.includes(size) || loadingPatients || size === pageSize) {
        return;
      }

      setPageSizeState(size);
      setCurrentPage(1);
      setCurrentCursor(null);
      setNextCursor(null);
      setCursorStack([]);
      setPatients([]);
      setSelectedPatientId(null);
    },
    [loadingPatients, pageSize],
  );

  const loadMorePatients = useCallback(async () => {
    await goToNextPage();
  }, [goToNextPage]);

  const reloadInteractions = useCallback(async () => {
    if (!selectedPatientId) {
      setInteractions([]);
      return;
    }

    await loadInteractions(selectedPatientId);
  }, [loadInteractions, selectedPatientId]);

  const createInteraction = useCallback(
    async (form: EducationInteractionForm): Promise<boolean> => {
      if (!selectedPatientId) {
        setInteractionError("Seleccioná un paciente antes de registrar una interacción.");
        return false;
      }

      const normalizedNote = form.note.trim();

      if (!normalizedNote) {
        setInteractionError("La nota educativa es obligatoria.");
        return false;
      }

      setSubmittingInteraction(true);
      setInteractionError(null);

      try {
        await createEducationInteractionService({
          patientId: selectedPatientId,
          type: form.type,
          note: normalizedNote,
        });

        await loadInteractions(selectedPatientId);
        return true;
      } catch {
        setInteractionError("No se pudo registrar la interacción educativa.");
        return false;
      } finally {
        setSubmittingInteraction(false);
      }
    },
    [loadInteractions, selectedPatientId],
  );

  useEffect(() => {
    void loadPatients(currentCursor, pageSize);
  }, [currentCursor, loadPatients, pageSize]);

  useEffect(() => {
    if (!selectedPatientId) {
      setInteractions([]);
      return;
    }

    void loadInteractions(selectedPatientId);
  }, [loadInteractions, selectedPatientId]);

  return {
    patients,
    selectedPatient,
    interactions,
    loadingPatients,
    loadingInteractions,
    submittingInteraction,
    error,
    interactionError,
    hasMorePatients,
    hasNextPage,
    hasPreviousPage,
    currentPage,
    pageSize,
    pageSizeOptions: PAGE_SIZE_OPTIONS,
    selectPatient,
    loadMorePatients,
    goToNextPage,
    goToPreviousPage,
    setPageSize,
    reloadInteractions,
    createInteraction,
  };
}