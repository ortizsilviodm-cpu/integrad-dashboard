/* integrad-dashboard/src/pages/EducatorsPage.tsx */

import type { CSSProperties } from "react";

import EducatorInterventionPanel from "../components/educators/EducatorInterventionPanel";
import EducatorsKpiRow from "../components/educators/EducatorsKpiRow";
import EducatorsPatientsTable from "../components/educators/EducatorsPatientsTable";
import { useEducatorWorkspace } from "../hooks/useEducatorWorkspace";

export default function EducatorsPage() {
  const {
    patients,
    selectedPatient,
    interactions,
    loadingPatients,
    loadingInteractions,
    submittingInteraction,
    error,
    interactionError,
    hasNextPage,
    hasPreviousPage,
    currentPage,
    pageSize,
    pageSizeOptions,
    selectPatient,
    goToNextPage,
    goToPreviousPage,
    setPageSize,
    createInteraction,
  } = useEducatorWorkspace();

  return (
    <div style={styles.page}>
      <section style={styles.shell}>
        <header style={styles.header}>
          <div style={styles.headerContent}>
            <span style={styles.eyebrow}>Workspace operativo</span>
            <h1 style={styles.title}>Educadores</h1>
            <p style={styles.description}>
              Seguimiento educativo, acompañamiento longitudinal y registro de
              interacciones con pacientes dentro del circuito operativo de
              IntegraD.
            </p>
          </div>
        </header>

        <section style={styles.kpiSurface}>
          <EducatorsKpiRow
            totalPatients={patients.length}
            selectedPatientName={selectedPatient?.fullName ?? null}
            totalInteractions={interactions.length}
            loading={loadingPatients}
          />
        </section>

        <section style={styles.workspaceSurface}>
          <div style={styles.workspace}>
            <section style={styles.leftColumnSurface}>
              <div style={styles.leftColumn}>
                <EducatorsPatientsTable
                  patients={patients}
                  selectedPatientId={selectedPatient?.id ?? null}
                  loading={loadingPatients}
                  error={error}
                  hasMore={false}
                  onSelectPatient={selectPatient}
                />

                <div style={styles.paginationBar}>
                  <div style={styles.pageSizeGroup}>
                    <span style={styles.paginationLabel}>Mostrar</span>

                    <select
                      value={pageSize}
                      onChange={(event) => {
                        void setPageSize(Number(event.target.value));
                      }}
                      style={styles.pageSizeSelect}
                      disabled={loadingPatients}
                    >
                      {pageSizeOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>

                    <span style={styles.paginationLabel}>registros</span>
                  </div>

                  <div style={styles.paginationControls}>
                    <button
                      type="button"
                      style={styles.paginationButton}
                      onClick={() => {
                        void goToPreviousPage();
                      }}
                      disabled={!hasPreviousPage || loadingPatients}
                    >
                      Anterior
                    </button>

                    <span style={styles.paginationInfo}>
                      Página {currentPage}
                    </span>

                    <button
                      type="button"
                      style={styles.paginationButton}
                      onClick={() => {
                        void goToNextPage();
                      }}
                      disabled={!hasNextPage || loadingPatients}
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </section>
      </section>

      {selectedPatient ? (
        <EducatorInterventionPanel
          patient={selectedPatient}
          interactions={interactions}
          loadingHistory={loadingInteractions}
          historyError={interactionError}
          submitting={submittingInteraction}
          submitError={interactionError}
          onSubmit={createInteraction}
          onClose={() => selectPatient(null)}
        />
      ) : null}
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    padding: 20,
    background: "#f8fafc",
    minHeight: "100%",
    boxSizing: "border-box",
  },
  shell: {
    display: "flex",
    flexDirection: "column",
    gap: 18,
    maxWidth: 1600,
    margin: "0 auto",
  },
  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
    padding: "4px 2px 0 2px",
  },
  headerContent: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    minWidth: 0,
  },
  eyebrow: {
    fontSize: 12,
    lineHeight: 1.4,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#64748b",
  },
  title: {
    margin: 0,
    fontSize: 24,
    lineHeight: 1.2,
    fontWeight: 700,
    color: "#0f172a",
  },
  description: {
    margin: 0,
    fontSize: 14,
    lineHeight: 1.6,
    color: "#475569",
    maxWidth: 760,
  },
  kpiSurface: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  workspaceSurface: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 18,
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
    padding: 16,
  },
  workspace: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr)",
    gap: 18,
    alignItems: "start",
  },
  leftColumnSurface: {
    minWidth: 0,
    background: "#ffffff",
    borderRadius: 14,
  },
  leftColumn: {
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  paginationBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    padding: "4px 2px 0 2px",
    flexWrap: "wrap",
  },
  pageSizeGroup: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  paginationLabel: {
    fontSize: 13,
    color: "#475569",
    fontWeight: 500,
  },
  pageSizeSelect: {
    border: "1px solid #cbd5e1",
    backgroundColor: "#ffffff",
    color: "#0f172a",
    borderRadius: 10,
    padding: "8px 10px",
    fontSize: 13,
    fontWeight: 600,
  },
  paginationControls: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  paginationInfo: {
    fontSize: 13,
    color: "#334155",
    fontWeight: 600,
    minWidth: 72,
    textAlign: "center",
  },
  paginationButton: {
    border: "1px solid #cbd5e1",
    backgroundColor: "#ffffff",
    color: "#0f172a",
    borderRadius: 10,
    padding: "8px 12px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
};