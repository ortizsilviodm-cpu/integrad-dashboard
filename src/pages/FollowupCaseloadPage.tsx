// integrad-dashboard/src/pages/FollowupCaseloadPage.tsx

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  fetchFollowupEvents,
  takeFollowupEvent,
  closeFollowupEvent,
  fetchFollowupEventActions,
  createFollowupEventAction,
  type FollowupEventStatus,
  type FollowupAssigned,
  type FollowupSla,
  type FollowupEventRow,
  type FollowupEventActionRow,
  type FollowupEventActionType,
  type FollowupEventActionOutcome,
} from "../api/followup";

const PAGE_LIMIT = 20;

/* ----------------------------- */
/* Labels (UI ES)                */
/* ----------------------------- */

const STATUS_LABEL: Record<FollowupEventStatus, string> = {
  OPEN: "Abierto",
  IN_PROGRESS: "En curso",
  ESCALATED: "Escalado",
  CLOSED: "Cerrado",
};

const ACTION_TYPE_LABEL: Record<FollowupEventActionType, string> = {
  CALL: "Llamada",
  WHATSAPP: "WhatsApp",
  EDUCATION: "Educación",
  DERIVATION: "Derivación",
  NOTE: "Nota interna",
  CLOSE: "Cierre",
  ESCALATE: "Escalar",
};

const OUTCOME_LABEL: Record<FollowupEventActionOutcome, string> = {
  CONTACTED: "Contactado",
  NO_RESPONSE: "Sin respuesta",
  RESOLVED: "Resuelto",
  ESCALATED: "Escalado",
  INFO: "Informativo",
};

function severityLabel(raw: string): string {
  const v = String(raw || "").toUpperCase().trim();
  if (v === "LOW") return "Baja";
  if (v === "MEDIUM") return "Media";
  if (v === "HIGH") return "Alta";
  if (v === "CRITICAL") return "Crítica";
  return raw;
}

/* ----------------------------- */
/* UI Modal simple               */
/* ----------------------------- */

function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        zIndex: 9999,
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: "min(860px, 100%)",
          background: "var(--color-card-bg, #fff)",
          borderRadius: 16,
          padding: 16,
          boxShadow: "0 18px 40px rgba(15, 23, 42, 0.25)",
          border: "1px solid rgba(229, 231, 235, 1)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h3 style={{ margin: 0, flex: 1, color: "var(--color-text, #111827)" }}>
            {title}
          </h3>

          <button
            onClick={onClose}
            style={{
              padding: "8px 12px",
              borderRadius: 999,
              border: "1px solid #e5e7eb",
              background: "#ffffff",
              color: "#374151",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Cerrar
          </button>
        </div>

        <div style={{ marginTop: 12 }}>{children}</div>
      </div>
    </div>
  );
}

/* ----------------------------- */
/* Botones (evitar oscuro)       */
/* ----------------------------- */

const btnBase: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 999,
  border: "1px solid #e5e7eb",
  background: "#ffffff",
  color: "#374151",
  fontWeight: 600,
  cursor: "pointer",
};

const btnPrimary: React.CSSProperties = {
  ...btnBase,
  background: "var(--color-primary, #2f42ad)",
  border: "1px solid rgba(47, 66, 173, 1)",
  color: "#ffffff",
};

const btnDanger: React.CSSProperties = {
  ...btnBase,
  background: "var(--color-error, #dc2626)",
  border: "1px solid rgba(220, 38, 38, 1)",
  color: "#ffffff",
};

export default function FollowupCaseloadPage() {
  const [rows, setRows] = useState<FollowupEventRow[]>([]);
  const [status, setStatus] = useState<FollowupEventStatus>("OPEN");
  const [assigned, setAssigned] = useState<FollowupAssigned>("any");
  const [sla, setSla] = useState<FollowupSla>("any");

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [hasNext, setHasNext] = useState(false);

  /* ----------------------------- */
  /* Modal Acciones                */
  /* ----------------------------- */

  const [actionsOpen, setActionsOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const selectedEvent = useMemo(() => {
    if (!selectedEventId) return null;
    return rows.find((r) => r.id === selectedEventId) ?? null;
  }, [rows, selectedEventId]);

  const [actionsLoading, setActionsLoading] = useState(false);
  const [actionsError, setActionsError] = useState<string | null>(null);
  const [actions, setActions] = useState<FollowupEventActionRow[]>([]);

  const [newActionType, setNewActionType] =
    useState<FollowupEventActionType>("WHATSAPP");
  const [newOutcome, setNewOutcome] =
    useState<FollowupEventActionOutcome>("CONTACTED");
  const [newNote, setNewNote] = useState("");
  const [creatingAction, setCreatingAction] = useState(false);

  async function loadFirstPage() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetchFollowupEvents({
        status,
        assigned,
        sla,
        limit: PAGE_LIMIT,
      });

      setRows(res.data);
      setHasNext(Boolean(res.meta.hasNext));
      setNextCursor(res.meta.nextCursor);
    } catch (e: any) {
      setError(e?.message ?? "Error cargando seguimiento");
      setRows([]);
      setHasNext(false);
      setNextCursor(undefined);
    } finally {
      setLoading(false);
    }
  }

  async function loadMore() {
    if (!hasNext || !nextCursor) return;

    setLoadingMore(true);
    setError(null);

    try {
      const res = await fetchFollowupEvents({
        status,
        assigned,
        sla,
        limit: PAGE_LIMIT,
        cursor: nextCursor,
      });

      const existingIds = new Set(rows.map((r) => r.id));
      const appended = res.data.filter((r) => !existingIds.has(r.id));

      setRows((prev) => [...prev, ...appended]);
      setHasNext(Boolean(res.meta.hasNext));
      setNextCursor(res.meta.nextCursor);
    } catch (e: any) {
      setError(e?.message ?? "Error cargando más eventos");
    } finally {
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    setRows([]);
    setHasNext(false);
    setNextCursor(undefined);
    loadFirstPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, assigned, sla]);

  async function onTake(id: string) {
    setError(null);

    try {
      await takeFollowupEvent(id);
      setAssigned("me");
      await loadFirstPage();
    } catch (e: any) {
      setError(e?.message ?? "Error tomando el evento");
    }
  }

  function askCloseNote(): string | undefined {
    const note = prompt("Nota de cierre (opcional):");
    if (note === null) return undefined;
    const trimmed = String(note).trim();
    return trimmed ? trimmed : undefined;
  }

  async function onClose(id: string) {
    const note = askCloseNote();
    setError(null);

    try {
      await closeFollowupEvent(id, note);
      await loadFirstPage();
    } catch (e: any) {
      setError(e?.message ?? "Error cerrando el evento");
    }
  }

  async function openActions(eventId: string) {
    setSelectedEventId(eventId);
    setActionsOpen(true);

    setActionsError(null);
    setActionsLoading(true);
    setActions([]);

    try {
      const res = await fetchFollowupEventActions(eventId);
      setActions(res.data ?? []);
    } catch (e: any) {
      setActionsError(e?.message ?? "Error cargando acciones");
    } finally {
      setActionsLoading(false);
    }
  }

  function closeActionsModal() {
    setActionsOpen(false);
    setSelectedEventId(null);
    setActions([]);
    setActionsError(null);
    setActionsLoading(false);

    setNewActionType("WHATSAPP");
    setNewOutcome("CONTACTED");
    setNewNote("");
    setCreatingAction(false);
  }

  async function onCreateAction() {
    if (!selectedEventId) return;
    if (!selectedEvent) return;

    if (selectedEvent.status === "CLOSED") {
      setActionsError("No se permiten nuevas acciones en un evento cerrado.");
      return;
    }

    const noteTrimmed = newNote.trim();
    setCreatingAction(true);
    setActionsError(null);

    try {
      const res = await createFollowupEventAction(selectedEventId, {
        actionType: newActionType,
        outcome: newOutcome,
        ...(noteTrimmed ? { note: noteTrimmed } : {}),
      });

      setActions((prev) => [...prev, res.action]);
      setNewNote("");
    } catch (e: any) {
      setActionsError(e?.message ?? "Error creando acción");
    } finally {
      setCreatingAction(false);
    }
  }

  return (
    <div style={{ padding: 16 }}>
      <div className="app-header" style={{ marginBottom: 12 }}>
        <div>
          <h1 style={{ margin: 0 }}>Seguimiento / Caseload</h1>
          <p style={{ margin: "6px 0 0" }}>
            Bandeja operativa de eventos, priorización por SLA y trazabilidad de intervenciones.
          </p>
        </div>
      </div>

      <section
        className="app-table"
        style={{ padding: 16, marginTop: 0, boxShadow: "var(--shadow-card)" }}
      >
        <div style={{ display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as FollowupEventStatus)}
            style={{ padding: 8, borderRadius: 10, border: "1px solid #e5e7eb" }}
          >
            <option value="OPEN">Abiertos</option>
            <option value="IN_PROGRESS">En curso</option>
            <option value="ESCALATED">Escalados</option>
            <option value="CLOSED">Cerrados</option>
          </select>

          <select
            value={assigned}
            onChange={(e) => setAssigned(e.target.value as FollowupAssigned)}
            style={{ padding: 8, borderRadius: 10, border: "1px solid #e5e7eb" }}
          >
            <option value="any">Asignación: cualquiera</option>
            <option value="me">Solo míos</option>
            <option value="none">Sin asignar</option>
          </select>

          <select
            value={sla}
            onChange={(e) => setSla(e.target.value as FollowupSla)}
            style={{ padding: 8, borderRadius: 10, border: "1px solid #e5e7eb" }}
          >
            <option value="any">SLA: cualquiera</option>
            <option value="overdue">SLA vencido</option>
            <option value="due_48h">SLA &lt; 48h</option>
          </select>

          <button onClick={loadFirstPage} disabled={loading || loadingMore} style={btnPrimary}>
            Refrescar
          </button>
        </div>

        {error && <div style={{ color: "crimson", marginBottom: 8 }}>{error}</div>}
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
                {rows.map((r) => (
                  <tr key={r.id} style={{ borderTop: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "10px 0" }}>
                      <strong>{r.patient.fullName}</strong>
                      <div style={{ fontSize: 12, color: "var(--color-text-muted, #6b7280)" }}>
                        {r.patient.documentId}
                        {r.patient.payerCode ? ` • ${r.patient.payerCode}` : ""}
                      </div>
                    </td>

                    <td style={{ padding: "10px 0" }}>
                      <div>{r.type}</div>
                      <div style={{ fontSize: 12, color: "var(--color-text-muted, #6b7280)" }}>
                        {r.category}
                      </div>
                    </td>

                    <td style={{ padding: "10px 0" }}>{severityLabel(r.severity)}</td>
                    <td style={{ padding: "10px 0" }}>{STATUS_LABEL[r.status] ?? r.status}</td>

                    <td style={{ padding: "10px 0" }}>
                      {r.slaDueAt ? new Date(r.slaDueAt).toLocaleString() : "-"}
                    </td>

                    <td style={{ padding: "10px 0" }}>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button onClick={() => openActions(r.id)} style={btnBase}>
                          Acciones
                        </button>

                        {(r.status === "OPEN" ||
                          r.status === "IN_PROGRESS" ||
                          r.status === "ESCALATED") && (
                          <button onClick={() => onTake(r.id)} style={btnPrimary}>
                            Tomar
                          </button>
                        )}

                        {r.status !== "CLOSED" && (
                          <button onClick={() => onClose(r.id)} style={btnDanger}>
                            Cerrar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: 12, color: "#6b7280" }}>
                      No hay eventos para los filtros seleccionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div style={{ marginTop: 12, display: "flex", gap: 12, alignItems: "center" }}>
              {hasNext ? (
                <button onClick={loadMore} disabled={loadingMore || loading} style={btnBase}>
                  {loadingMore ? "Cargando…" : "Cargar más"}
                </button>
              ) : (
                <div style={{ color: "#6b7280", fontSize: 12 }}>No hay más resultados.</div>
              )}
            </div>
          </>
        )}
      </section>

      <Modal
        open={actionsOpen && Boolean(selectedEventId)}
        title={
          selectedEvent
            ? `Acciones — ${selectedEvent.patient.fullName} (${selectedEvent.type})`
            : "Acciones"
        }
        onClose={closeActionsModal}
      >
        {selectedEvent && selectedEvent.status === "CLOSED" && (
          <div
            style={{
              background: "#fff7ed",
              border: "1px solid #fed7aa",
              padding: 10,
              borderRadius: 12,
              marginBottom: 12,
              color: "#9a3412",
              fontWeight: 600,
            }}
          >
            Evento cerrado: no se permiten nuevas acciones.
          </div>
        )}

        {actionsError && <div style={{ color: "crimson", marginBottom: 10 }}>{actionsError}</div>}

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Tipo</div>
            <select
              value={newActionType}
              onChange={(e) => setNewActionType(e.target.value as FollowupEventActionType)}
              disabled={creatingAction || selectedEvent?.status === "CLOSED"}
              style={{ padding: 8, borderRadius: 10, border: "1px solid #e5e7eb" }}
            >
              {(Object.keys(ACTION_TYPE_LABEL) as FollowupEventActionType[]).map((k) => (
                <option key={k} value={k}>
                  {ACTION_TYPE_LABEL[k]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Resultado</div>
            <select
              value={newOutcome}
              onChange={(e) => setNewOutcome(e.target.value as FollowupEventActionOutcome)}
              disabled={creatingAction || selectedEvent?.status === "CLOSED"}
              style={{ padding: 8, borderRadius: 10, border: "1px solid #e5e7eb" }}
            >
              {(Object.keys(OUTCOME_LABEL) as FollowupEventActionOutcome[]).map((k) => (
                <option key={k} value={k}>
                  {OUTCOME_LABEL[k]}
                </option>
              ))}
            </select>
          </div>

          <div style={{ flex: "1 1 260px", minWidth: 260 }}>
            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Nota (opcional)</div>
            <input
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Ej: Se contacta por WhatsApp, confirma retiro mañana."
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 12,
                border: "1px solid #e5e7eb",
              }}
              disabled={creatingAction || selectedEvent?.status === "CLOSED"}
            />
          </div>

          <div style={{ alignSelf: "end" }}>
            <button
              onClick={onCreateAction}
              disabled={creatingAction || actionsLoading || selectedEvent?.status === "CLOSED"}
              style={btnPrimary}
            >
              {creatingAction ? "Guardando…" : "Agregar acción"}
            </button>
          </div>
        </div>

        <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 12 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Historial</div>

          {actionsLoading ? (
            <div>Cargando historial…</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th align="left">Fecha</th>
                  <th align="left">Tipo</th>
                  <th align="left">Resultado</th>
                  <th align="left">Nota</th>
                </tr>
              </thead>
              <tbody>
                {actions.map((a) => (
                  <tr key={a.id} style={{ borderTop: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "8px 0", width: 190 }}>
                      {new Date(a.createdAt).toLocaleString()}
                    </td>
                    <td style={{ padding: "8px 0", width: 160 }}>
                      {ACTION_TYPE_LABEL[a.actionType] ?? a.actionType}
                    </td>
                    <td style={{ padding: "8px 0", width: 160 }}>
                      {OUTCOME_LABEL[a.outcome] ?? a.outcome}
                    </td>
                    <td style={{ padding: "8px 0" }}>{a.note ?? "-"}</td>
                  </tr>
                ))}

                {actions.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ padding: 10, color: "#6b7280" }}>
                      No hay acciones registradas para este evento.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </Modal>
    </div>
  );
}
