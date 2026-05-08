import type { ComponentType, CSSProperties, Dispatch, ReactNode, SetStateAction } from "react";
import type {
  FollowupAssigned,
  FollowupEventRow,
  FollowupEventStatus,
  FollowupSla,
} from "../../api/followup";

type PatientAvatarProps = {
  fullName: string;
  severity: string;
};

type PatientEventsTableProps = {
  isPatientMode: boolean;
  status: FollowupEventStatus;
  assigned: FollowupAssigned;
  sla: FollowupSla;
  setStatus: Dispatch<SetStateAction<FollowupEventStatus>>;
  setAssigned: Dispatch<SetStateAction<FollowupAssigned>>;
  setSla: Dispatch<SetStateAction<FollowupSla>>;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  successMessage: string | null;
  visibleRows: FollowupEventRow[];
  hasNext: boolean;
  currentUserEmail: string | null;
  loadFirstPage: () => void;
  loadMore: () => void;
  openActions: (eventId: string) => void;
  isLockedForCurrentUser: (
    row: FollowupEventRow,
    currentUserEmail: string | null,
  ) => boolean;
  statusCellContent: (row: FollowupEventRow) => ReactNode;
  eventLabel: (row: FollowupEventRow) => string;
  probableCauseLabel: (row: FollowupEventRow) => string | null;
  categoryLabel: (raw: string) => string;
  adherenceLabel: (row: FollowupEventRow) => string;
  adherencePillStyle: (row: FollowupEventRow) => CSSProperties;
  adherenceSecondaryLabel: (row: FollowupEventRow) => string | null;
  severityPillStyle: (raw: string) => CSSProperties;
  severityLabel: (raw: string) => string;
  PatientAvatar: ComponentType<PatientAvatarProps>;
  btnPrimary: CSSProperties;
  btnBase: CSSProperties;
};

export default function PatientEventsTable({
  isPatientMode,
  status,
  assigned,
  sla,
  setStatus,
  setAssigned,
  setSla,
  loading,
  loadingMore,
  error,
  successMessage,
  visibleRows,
  hasNext,
  currentUserEmail,
  loadFirstPage,
  loadMore,
  openActions,
  isLockedForCurrentUser,
  statusCellContent,
  eventLabel,
  probableCauseLabel,
  categoryLabel,
  adherenceLabel,
  adherencePillStyle,
  adherenceSecondaryLabel,
  severityPillStyle,
  severityLabel,
  PatientAvatar,
  btnPrimary,
  btnBase,
}: PatientEventsTableProps) {
  return (
    <section
      className="app-table"
      style={{ padding: 16, marginTop: 0, boxShadow: "var(--shadow-card)" }}
    >
      <div
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 12,
          flexWrap: "wrap",
        }}
      >
        {isPatientMode ? (
          <button
            onClick={loadFirstPage}
            disabled={loading || loadingMore}
            style={btnPrimary}
          >
            Refrescar eventos del paciente
          </button>
        ) : (
          <>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as FollowupEventStatus)}
              style={{
                padding: 8,
                borderRadius: 10,
                border: "1px solid #e5e7eb",
              }}
            >
              <option value="OPEN">Abiertos</option>
              <option value="IN_PROGRESS">En curso</option>
              <option value="ESCALATED">Escalados</option>
              <option value="CLOSED">Cerrados</option>
            </select>

            <select
              value={assigned}
              onChange={(e) => setAssigned(e.target.value as FollowupAssigned)}
              style={{
                padding: 8,
                borderRadius: 10,
                border: "1px solid #e5e7eb",
              }}
            >
              <option value="any">Asignación: cualquiera</option>
              <option value="me">Solo míos</option>
              <option value="none">Sin asignar</option>
            </select>

            <select
              value={sla}
              onChange={(e) => setSla(e.target.value as FollowupSla)}
              style={{
                padding: 8,
                borderRadius: 10,
                border: "1px solid #e5e7eb",
              }}
            >
              <option value="any">SLA: cualquiera</option>
              <option value="overdue">SLA vencido</option>
              <option value="due_48h">SLA &lt; 48h</option>
            </select>

            <button
              onClick={loadFirstPage}
              disabled={loading || loadingMore}
              style={btnPrimary}
            >
              Refrescar
            </button>
          </>
        )}
      </div>

      {error && <div style={{ color: "crimson", marginBottom: 8 }}>{error}</div>}

      {successMessage && (
        <div
          style={{
            color: "#166534",
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: 12,
            padding: "10px 12px",
            marginBottom: 8,
            fontWeight: 600,
          }}
        >
          {successMessage}
        </div>
      )}
      {loading && <div>Cargando…</div>}

      {!loading && (
        <>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th align="left">Paciente</th>
                <th align="left">Evento</th>
                <th align="left">Severidad</th>
                <th align="left">Estado</th>
                <th align="left">SLA</th>
                <th align="left">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {visibleRows.map((r) => {
                const lockedForCurrentUser = isLockedForCurrentUser(
                  r,
                  currentUserEmail,
                );

                return (
                  <tr key={r.id} style={{ borderTop: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "10px 0" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          minWidth: 0,
                        }}
                      >
                        <PatientAvatar
                          fullName={r.patient.fullName}
                          severity={r.severity}
                        />

                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontWeight: 700,
                              color: "#111827",
                              lineHeight: 1.3,
                            }}
                          >
                            {r.patient.fullName}
                          </div>

                          <div
                            style={{
                              fontSize: 12,
                              color: "var(--color-text-muted, #6b7280)",
                              marginTop: 2,
                            }}
                          >
                            {r.patient.documentId}
                            {r.patient.payerCode ? ` • ${r.patient.payerCode}` : ""}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: "10px 0" }}>
                      <div style={{ fontWeight: 600, color: "#111827" }}>
                        {eventLabel(r)}
                      </div>

                      {probableCauseLabel(r) && (
                        <div
                          style={{
                            fontSize: 12,
                            color: "var(--color-text-muted, #6b7280)",
                            marginTop: 4,
                            lineHeight: 1.4,
                            maxWidth: 420,
                          }}
                        >
                          Posible causa: {probableCauseLabel(r)}
                        </div>
                      )}

                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--color-text-muted, #6b7280)",
                          marginTop: 4,
                        }}
                      >
                        {categoryLabel(r.category)}
                      </div>

                      <div style={{ marginTop: 8 }}>
                        <span
                          style={{
                            ...adherencePillStyle(r),
                            padding: "4px 10px",
                            borderRadius: 999,
                            fontSize: 12,
                            fontWeight: 700,
                            display: "inline-block",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {adherenceLabel(r)}
                        </span>

                        {adherenceSecondaryLabel(r) && (
                          <div
                            style={{
                              marginTop: 4,
                              fontSize: 12,
                              color: "#6b7280",
                            }}
                          >
                            {adherenceSecondaryLabel(r)}
                          </div>
                        )}
                      </div>
                    </td>

                    <td style={{ padding: "10px 0" }}>
                      <span
                        style={{
                          ...severityPillStyle(r.severity),
                          padding: "4px 10px",
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: 700,
                          display: "inline-block",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {severityLabel(r.severity)}
                      </span>
                    </td>

                    <td style={{ padding: "10px 0" }}>{statusCellContent(r)}</td>

                    <td style={{ padding: "10px 0" }}>
                      {r.slaDueAt ? new Date(r.slaDueAt).toLocaleString() : "-"}
                    </td>

                    <td style={{ padding: "10px 0" }}>
                      {lockedForCurrentUser ? (
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "8px 12px",
                            borderRadius: 999,
                            border: "1px solid #d1d5db",
                            background: "#f9fafb",
                            color: "#6b7280",
                            fontWeight: 600,
                            fontSize: 14,
                          }}
                        >
                          <span>
                            {r.assignedTo
                              ? `Ocupado por ${r.assignedTo.displayName}`
                              : "Ocupado"}
                          </span>

                          <span style={{ color: "#9ca3af" }}>Gestionar</span>
                        </div>
                      ) : (
                        <button onClick={() => openActions(r.id)} style={btnPrimary}>
                          {r.status === "CLOSED" ? "Ver" : "Gestionar"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}

              {visibleRows.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: 12, color: "#6b7280" }}>
                    {isPatientMode
                      ? "No hay eventos visibles para este paciente con los filtros seleccionados."
                      : "No hay eventos para los filtros seleccionados."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div
            style={{
              marginTop: 12,
              display: "flex",
              gap: 12,
              alignItems: "center",
            }}
          >
            {hasNext ? (
              <button
                onClick={loadMore}
                disabled={loadingMore || loading}
                style={btnBase}
              >
                {loadingMore ? "Cargando…" : "Cargar más"}
              </button>
            ) : (
              <div style={{ color: "#6b7280", fontSize: 12 }}>
                No hay más resultados.
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
