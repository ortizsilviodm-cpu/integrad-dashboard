/* integrad-dashboard/src/views/DispensesView.tsx */

import { useState } from "react";
import StatusChip from "../components/StatusChip";
import type { DispenseRow } from "../api/dispenses";

// Tipo local para el filtro de estado
type StatusFilterValue = "ALL" | "A tiempo" | "Retrasado" | "Pendiente";

export type DispensesViewProps = {
  dispenses: DispenseRow[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;

  // 🔥 PROPS DE PAGINACIÓN
  currentPage: number;
  totalPages: number;
  onNextPage: () => void;
  onPrevPage: () => void;

  // 🔍 PROPS DE FILTROS
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: StatusFilterValue;
  onStatusFilterChange: (value: StatusFilterValue) => void;
};

export default function DispensesView({
  dispenses,
  loading,
  error,
  onRetry,

  currentPage,
  totalPages,
  onNextPage,
  onPrevPage,

  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}: DispensesViewProps) {
  const hasData = dispenses.length > 0;

  // 🧩 Estado local para ver el detalle de una dispensa
  const [selectedDispense, setSelectedDispense] = useState<DispenseRow | null>(
    null
  );

  const handleCloseDetail = () => setSelectedDispense(null);

  return (
    <section className="app-table">
      {/* 🔹 Encabezado */}
      <header className="section-header">
        <h2>Dispensas</h2>
        <p className="chart-subtitle">
          Historial de dispensas de medicación y adherencia por paciente.
        </p>
      </header>

      {/* 🔍 Barra de filtros */}
      <div
        style={{
          marginTop: "0.75rem",
          marginBottom: "0.75rem",
          display: "flex",
          flexWrap: "wrap",
          gap: "0.75rem",
          alignItems: "center",
        }}
      >
        <div style={{ flex: "1 1 260px" }}>
          <label
            style={{
              display: "block",
              fontSize: "0.75rem",
              marginBottom: "0.25rem",
              color: "#6b7280",
            }}
          >
            Buscar
          </label>
          <input
            type="text"
            placeholder="Paciente o medicación..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              width: "100%",
              padding: "0.45rem 0.6rem",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              fontSize: "0.85rem",
            }}
          />
        </div>

        <div style={{ flex: "0 0 200px" }}>
          <label
            style={{
              display: "block",
              fontSize: "0.75rem",
              marginBottom: "0.25rem",
              color: "#6b7280",
            }}
          >
            Estado
          </label>
          <select
            value={statusFilter}
            onChange={(e) =>
              onStatusFilterChange(e.target.value as StatusFilterValue)
            }
            style={{
              width: "100%",
              padding: "0.45rem 0.6rem",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              fontSize: "0.85rem",
              backgroundColor: "#ffffff",
            }}
          >
            <option value="ALL">Todos los estados</option>
            <option value="A tiempo">A tiempo</option>
            <option value="Retrasado">Retrasado</option>
            <option value="Pendiente">Pendiente</option>
          </select>
        </div>
      </div>

      {/* Estado: cargando */}
      {loading && (
        <div className="chart-placeholder">Cargando datos de dispensas...</div>
      )}

      {/* Estado: error */}
      {!loading && error && (
        <div className="chart-placeholder">
          <p
            style={{
              margin: 0,
              marginBottom: "0.8rem",
              width: "100%",
              textAlign: "center",
              lineHeight: 1.4,
            }}
          >
            Error al cargar dispensas:
            <br />
            <strong>{error}</strong>
          </p>

          <div className="retry-button-wrapper">
            <button type="button" className="retry-button" onClick={onRetry}>
              Reintentar
            </button>
          </div>
        </div>
      )}

      {/* Estado: sin datos */}
      {!loading && !error && !hasData && (
        <div className="chart-placeholder">
          No hay datos de dispensas para mostrar con los filtros actuales.
          <br />
          Probá limpiarlos o ampliar el criterio de búsqueda.
        </div>
      )}

      {/* Tabla con datos */}
      {!loading && !error && hasData && (
        <div style={{ overflowX: "auto", marginTop: 10 }}>
          <table>
            <thead>
              <tr>
                <th>Paciente</th>
                <th>Medicación</th>
                <th>Fecha dispensa</th>
                <th>Canal</th>
                <th>Días de retraso</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {dispenses.map((d) => (
                <tr key={d.id}>
                  <td>{d.patientName}</td>

                  {/* 🔍 Celda clickeable para ver detalle */}
                  <td>
                    <button
                      type="button"
                      onClick={() => setSelectedDispense(d)}
                      style={{
                        border: "none",
                        background: "transparent",
                        padding: 0,
                        margin: 0,
                        cursor: "pointer",
                        textDecoration: "underline",
                        color: "#2563eb", // azul suave tipo link
                        font: "inherit",
                      }}
                    >
                      {d.medication || "Ver medicamentos"}
                    </button>
                  </td>

                  <td>{d.dispenseDate}</td>
                  <td>{d.channel}</td>
                  <td>{d.delayDays === 0 ? "—" : `${d.delayDays} días`}</td>
                  <td>
                    <StatusChip label={d.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 🔥 PAGINACIÓN — SOLO SI HAY DATOS */}
      {!loading && !error && hasData && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "1rem",
            marginTop: "1rem",
          }}
        >
          <button
            className="retry-button"
            disabled={currentPage <= 1}
            onClick={onPrevPage}
          >
            ← Anterior
          </button>

          <span style={{ alignSelf: "center", opacity: 0.8 }}>
            Página {currentPage} de {totalPages}
          </span>

          <button
            className="retry-button"
            disabled={currentPage >= totalPages}
            onClick={onNextPage}
          >
            Siguiente →
          </button>
        </div>
      )}

      {/* 🧾 Modal de detalle de dispensa */}
      {selectedDispense && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.40)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              padding: "1.5rem 1.75rem",
              maxWidth: "640px",
              width: "90%",
              boxShadow:
                "0 10px 30px rgba(15, 23, 42, 0.20), 0 0 0 1px rgba(15, 23, 42, 0.04)",
            }}
          >
            <header
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1rem",
              }}
            >
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: "1.1rem",
                    fontWeight: 600,
                  }}
                >
                  Detalle de dispensa
                </h3>
                <p
                  style={{
                    margin: 0,
                    marginTop: "0.25rem",
                    fontSize: "0.85rem",
                    color: "#6b7280",
                  }}
                >
                  Información detallada de la dispensa y los medicamentos
                  asociados.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseDetail}
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  padding: "0.25rem 0.5rem",
                  borderRadius: "999px",
                }}
              >
                Cerrar
              </button>
            </header>

            {/* Info general de la dispensa */}
            <section
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "0.75rem",
                marginBottom: "1rem",
                fontSize: "0.85rem",
              }}
            >
              <div>
                <strong>Paciente</strong>
                <div>{selectedDispense.patientName}</div>
              </div>
              <div>
                <strong>Fecha de dispensa</strong>
                <div>{selectedDispense.dispenseDate}</div>
              </div>
              <div>
                <strong>Canal</strong>
                <div>{selectedDispense.channel}</div>
              </div>
              <div>
                <strong>Días de retraso</strong>
                <div>
                  {selectedDispense.delayDays === 0
                    ? "A tiempo"
                    : `${selectedDispense.delayDays} días`}
                </div>
              </div>
              <div>
                <strong>Estado</strong>
                <div>
                  <StatusChip label={selectedDispense.status} />
                </div>
              </div>
            </section>

            {/* Detalle por medicamento (si está disponible en los datos) */}
            <section>
              <h4
                style={{
                  margin: 0,
                  marginBottom: "0.5rem",
                  fontSize: "0.95rem",
                }}
              >
                Medicamentos retirados
              </h4>

              {(() => {
                // ⚠️ Leemos posibles items como any para NO forzar cambios en DispenseRow.
                const anyDispense = selectedDispense as any;
                const items =
                  (anyDispense?.items as
                    | Array<{
                        drugName?: string;
                        drugCode?: string;
                        quantity?: number;
                        daysCovered?: number;
                      }>
                    | undefined) ?? [];

                if (!items.length) {
                  return (
                    <p
                      style={{
                        fontSize: "0.8rem",
                        color: "#6b7280",
                        marginTop: "0.25rem",
                      }}
                    >
                      El detalle por medicamento no está disponible para esta
                      dispensa en los datos actuales. Se muestra la información
                      general de la operación. Cuando el backend provea los
                      ítems por receta, aquí se verán listados de forma
                      automática.
                    </p>
                  );
                }

                return (
                  <div style={{ overflowX: "auto" }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Medicamento</th>
                          <th>Código</th>
                          <th>Unidades</th>
                          <th>Días cubiertos</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, idx) => (
                          <tr key={`${item.drugCode ?? "item"}-${idx}`}>
                            <td>{item.drugName ?? "—"}</td>
                            <td>{item.drugCode ?? "—"}</td>
                            <td>
                              {typeof item.quantity === "number"
                                ? item.quantity
                                : "—"}
                            </td>
                            <td>
                              {typeof item.daysCovered === "number"
                                ? item.daysCovered
                                : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </section>

            <small
              style={{
                display: "block",
                marginTop: "0.75rem",
                fontSize: "0.75rem",
                color: "#9ca3af",
                lineHeight: 1.4,
              }}
            >
              Este detalle se basa en las dispensas registradas en IntegraD y
              está pensado para apoyar el seguimiento y la auditoría, no para
              automatizar decisiones clínicas.
            </small>
          </div>
        </div>
      )}
    </section>
  );
}
