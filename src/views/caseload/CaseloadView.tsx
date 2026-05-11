/* integrad-dashboard/src/views/caseload/CaseloadView.tsx */

import { Card } from "../../components/ui/Card";
import { PatientAvatar } from "../../components/common/PatientAvatar";
import {
  buildFollowupStatusLabel,
  buildManagementText,
  buildOperationalCaseMotiveLabel,
  buildOperationalCaseSecondaryText,
  buildOperationalCaseStatusLabel,
  buildPatientSecondaryText,
  buildReasonText,
  buildSourceLabels,
  getAvatarSeverity,
  getPriorityColor,
  getPriorityHierarchy,
  getPriorityHumanLabel,
} from "../../logic/caseload.logic";
import {
  styles,
  btnPrimary,
  btnSecondary,
} from "../../styles/caseload.styles";
import { useCaseload } from "../../hooks/useCaseload";

type CaseloadViewProps = {
  onOpenWorkspace?: (input: {
    patientId: string;
    followupEventId?: string | null;
    caseSummary?: string | null;
  }) => void;
};

export default function CaseloadView({
  onOpenWorkspace,
}: CaseloadViewProps) {
  const {
    items,
    loading,
    error,
    actingId,
    handleAction,
    priorityFilter,
    setPriorityFilter,
    statusFilter,
    setStatusFilter,
    pageSize,
    pageSizeOptions,
    currentPage,
    totalPages,
    totalItems,
    hasNextPage,
    hasPreviousPage,
    goToNextPage,
    goToPreviousPage,
    setPageSize,
  } = useCaseload();

  async function handleManage(input: {
    patientId: string;
    caseId: string;
    visibleReason: string;
  }) {
    const result = await handleAction(input.caseId, "TAKE");

    if (!result) {
      return;
    }

    // patientId como unidad principal; followupEventId acompaña si existe
    onOpenWorkspace?.({
      patientId: input.patientId,
      followupEventId: result.workspaceTarget?.followupEventId ?? null,
      caseSummary: input.visibleReason,
    });
  }

  return (
    <div style={styles.page}>
      <section style={styles.shell}>
        <header style={styles.header}>
          <div style={styles.headerContent}>
            <span style={styles.eyebrow}>Bandeja operativa priorizada</span>
            <h1 style={styles.title}>Caseload Unificado</h1>
            <p style={styles.description}>
              Vista compartida del equipo para priorizar pacientes, entender el
              motivo del triage y coordinar la gestión sin duplicación
              operativa.
            </p>
          </div>
        </header>

        <section style={styles.surface}>
          <div style={styles.filtersBar}>
            <select
              value={priorityFilter}
              onChange={(event) => setPriorityFilter(event.target.value)}
              style={styles.filterSelect}
            >
              <option value="ALL">Prioridad: todas</option>
              <option value="P1">P1</option>
              <option value="P2">P2</option>
              <option value="P3">P3</option>
              <option value="P4">P4</option>
            </select>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              style={styles.filterSelect}
            >
              <option value="ALL">Estado: todos</option>
              <option value="AVAILABLE">Disponibles</option>
              <option value="IN_PROGRESS">En gestión</option>
            </select>
          </div>

          {loading && <div style={styles.infoText}>Cargando caseload...</div>}

          {!loading && error && <div style={styles.errorBox}>{error}</div>}

          {!loading && !error && items.length === 0 && (
            <div style={styles.infoText}>
              No hay pacientes para los filtros seleccionados.
            </div>
          )}

          {!loading && !error && items.length > 0 && (
            <>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th align="left" style={styles.th}>
                      Paciente
                    </th>
                    <th align="left" style={styles.th}>
                      Prioridad
                    </th>
                    <th align="left" style={styles.th}>
                      Motivos
                    </th>
                    <th align="left" style={styles.th}>
                      Tipo de caso
                    </th>
                    <th align="left" style={styles.th}>
                      SLA
                    </th>
                    <th align="left" style={styles.th}>
                      Estado
                    </th>
                    <th align="left" style={styles.th}>
                      Asignación
                    </th>
                    <th align="left" style={styles.th}>
                      Acción
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {items.map((item) => {
                    const sourceLabels = buildSourceLabels(item);
                    const managementText = buildManagementText(item);
                    const operationalCaseMotiveLabel =
                      buildOperationalCaseMotiveLabel(item);
                    const operationalCaseSecondaryText =
                      buildOperationalCaseSecondaryText(item);
                    const followupStatusLabel =
                      buildFollowupStatusLabel(item);

                    return (
                      <tr key={item.caseId} style={styles.tr}>
                        <td style={styles.td}>
                          <Card style={styles.patientCard}>
                            <div style={styles.patientCell}>
                              <PatientAvatar
                                fullName={item.fullName}
                                severity={getAvatarSeverity(item)}
                              />

                              <div style={styles.patientMeta}>
                                <div style={styles.patientName}>
                                  {item.fullName}
                                </div>

                                <div style={styles.patientSecondary}>
                                  {buildPatientSecondaryText(item)}
                                </div>

                                {item.operationalCase ? (
                                  <div style={styles.operationalCaseMeta}>
                                    Caso operacional real
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          </Card>
                        </td>

                        <td style={styles.td}>
                          <div
                            style={{
                              ...styles.priorityPill,
                              background: getPriorityColor(item.priorityLevel),
                            }}
                          >
                            {item.priorityLabel}
                          </div>

                          {(() => {
                            const hierarchy = getPriorityHierarchy(item.priorityLevel);
                            const style =
                              hierarchy === "high"
                                ? styles.priorityHigh
                                : hierarchy === "medium"
                                  ? styles.priorityMedium
                                  : styles.priorityLow;
                            return (
                              <div style={style}>
                                {getPriorityHumanLabel(item.priorityLevel)}
                              </div>
                            );
                          })()}
                        </td>

                        <td style={styles.td}>
                          <div
                            style={
                              operationalCaseMotiveLabel
                                ? styles.reasonPrimaryText
                                : styles.reasonText
                            }
                          >
                            {buildReasonText(item)}
                          </div>

                          {operationalCaseSecondaryText ? (
                            <div style={styles.reasonSecondaryText}>
                              {operationalCaseSecondaryText}
                            </div>
                          ) : null}
                        </td>

                        <td style={styles.td}>
                          <div style={styles.badgesWrap}>
                            {sourceLabels.map((label) => (
                              <span key={label} style={styles.sourceBadge}>
                                {label}
                              </span>
                            ))}
                          </div>
                        </td>

                        <td style={styles.td}>
                          <div style={styles.reasonText}>
                            {item.slaLabel}
                          </div>
                        </td>

                        <td style={styles.td}>
                          {item.operationalCase ? (
                            <div style={styles.operationalCaseStatus}>
                              {buildOperationalCaseStatusLabel(
                                item.operationalCase.status,
                              )}
                            </div>
                          ) : item.followupStatus === "NEEDS_ATTENTION" ? (
                            <div style={styles.inProgressBox}>
                              {followupStatusLabel}
                            </div>
                          ) : item.followupStatus === "ACTIVE" ? (
                            <div style={styles.activeStatusBox}>
                              {followupStatusLabel}
                            </div>
                          ) : item.followupStatus === "STABLE" ? (
                            <span style={styles.availableText}>
                              {followupStatusLabel}
                            </span>
                          ) : null}
                        </td>

                        <td style={styles.td}>
                          {item.assignmentStatus === "ASSIGNED" ? (
                            <div style={styles.inProgressBox}>
                              {item.assignmentStatusLabel}
                            </div>
                          ) : (
                            <span style={styles.availableText}>
                              {item.assignmentStatusLabel}
                            </span>
                          )}

                          {managementText ? (
                            <div style={styles.managementMetaText}>
                              {managementText}
                            </div>
                          ) : null}
                        </td>

                        <td style={styles.td}>
                          <div style={styles.actionsWrap}>
                            {item.managementStatus === "AVAILABLE" && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleManage({
                                    patientId: item.patientId,
                                    caseId: item.caseId,
                                    visibleReason: item.visibleReason,
                                  })
                                }
                                disabled={actingId === item.caseId}
                                style={{
                                  ...btnPrimary,
                                  opacity:
                                    actingId === item.caseId ? 0.7 : 1,
                                  cursor:
                                    actingId === item.caseId
                                      ? "not-allowed"
                                      : "pointer",
                                }}
                              >
                                {actingId === item.caseId
                                  ? "Gestionando..."
                                  : "Gestionar"}
                              </button>
                            )}

                            {item.managementStatus === "IN_PROGRESS" && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleAction(item.caseId, "RELEASE")
                                }
                                disabled={actingId === item.caseId}
                                style={{
                                  ...btnSecondary,
                                  opacity:
                                    actingId === item.caseId ? 0.7 : 1,
                                  cursor:
                                    actingId === item.caseId
                                      ? "not-allowed"
                                      : "pointer",
                                }}
                              >
                                {actingId === item.caseId
                                  ? "Procesando..."
                                  : "Soltar caso"}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div style={styles.paginationBar}>
                <div style={styles.pageSizeGroup}>
                  <span style={styles.paginationLabel}>Mostrar</span>

                  <select
                    value={pageSize}
                    onChange={(event) =>
                      setPageSize(Number(event.target.value))
                    }
                    style={styles.filterSelect}
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
                  <span style={styles.paginationInfo}>
                    {totalItems} resultados
                  </span>

                  <button
                    type="button"
                    style={styles.paginationButton}
                    onClick={goToPreviousPage}
                    disabled={!hasPreviousPage}
                  >
                    Anterior
                  </button>

                  <span style={styles.paginationInfo}>
                    Página {currentPage} de {totalPages}
                  </span>

                  <button
                    type="button"
                    style={styles.paginationButton}
                    onClick={goToNextPage}
                    disabled={!hasNextPage}
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </section>
    </div>
  );
}