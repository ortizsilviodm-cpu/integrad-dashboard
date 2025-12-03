/* integrad-dashboard/src/pages/DashboardPage.tsx */

// Vista principal del Dashboard — IntegraD
// Contenedor: hace el fetch a /dashboard/followup-patients y pasa los datos
// a los componentes visuales (KPIs, gráficos y tabla de seguimiento).

import { useEffect, useState, useCallback } from "react";
import { fetchFollowUpPatientsPage } from "../api/dashboard";
import type {
  PatientFollowUpRow,
  DashboardPageMeta,
} from "../api/dashboard";
import DashboardFollowupTable from "../components/DashboardFollowupTable";
import KpiCard from "../components/KpiCard";
import AdherenceBarChart from "../components/AdherenceBarChart";
import AlertsDonutChart from "../components/AlertsDonutChart";
// Importar estilos CSS para el layout de la página
import "./DashboardPage.css"; // Necesario para aplicar la grilla y estilos del mockup.

// ⚙️ Valores por defecto del Dashboard
// Usamos 25 para alinear con la vista de Pacientes y asegurarnos
// de que Americo (nuestro paciente demo completo) aparezca en la página 1.
const DEFAULT_LIMIT = 25;
const DEFAULT_DAYS = 90;

const DashboardPage: React.FC = () => {
  const [rows, setRows] = useState<PatientFollowUpRow[]>([]);
  const [meta, setMeta] = useState<DashboardPageMeta | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros (por ahora fijos)
  const [limit] = useState<number>(DEFAULT_LIMIT);
  const [windowDays] = useState<number>(DEFAULT_DAYS);

  // 🔹 Estado de paginación (cursor-based)
  const [cursor, setCursor] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState<boolean>(false);
  const [cursorStack, setCursorStack] = useState<Array<string | null>>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Función de carga reutilizable (para montaje + paginación + "Reintentar")
  const loadPage = useCallback(
    async (cursorToUse: string | null) => {
      setLoading(true);
      setError(null);

      const result = await fetchFollowUpPatientsPage({
        limit,
        days: windowDays,
        cursor: cursorToUse,
      });

      if (result.ok) {
        setRows(result.data);
        setMeta(result.meta);
        setHasNext(result.meta.hasNext);
        setNextCursor(result.meta.nextCursor ?? null);
        setCursor(cursorToUse);
        setError(null);
      } else {
        setRows([]);
        setMeta(null);
        setHasNext(false);
        setNextCursor(null);
        setError(
          result.error ||
            "No se pudieron cargar los pacientes en seguimiento. Verificá tu conexión o tu sesión."
        );
      }

      setLoading(false);
    },
    [limit, windowDays]
  );

  // Cargar datos al montar el componente (primera página)
  useEffect(() => {
    setCursorStack([]);
    setCurrentPage(1);
    loadPage(null);
  }, [loadPage]);

  // Handlers de paginación
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
    setCurrentPage((p) => Math.max(1, p - 1));
    loadPage(prevCursor);
  };

  const handleRetry = () => {
    // Reintenta la página actual
    loadPage(cursor);
  };

  // --- KPIs calculados a partir de los rows ---
  const patientCount = rows.length;

  const adherencePercent = rows.length
    ? Math.round(
        rows.reduce((acc, row) => {
          const adherence = row.adherencePercent ?? 0;
          return acc + adherence;
        }, 0) / rows.length
      )
    : 0;

  const alertCount = rows.reduce((acc, row) => {
    const openAlerts = row.openAlerts ?? 0;
    return acc + openAlerts;
  }, 0);

  const avgGlucoseValue = rows.length
    ? Math.round(
        rows.reduce((acc, row) => {
          const lastGlucose = row.lastGlucoseValue ?? 0;
          return acc + lastGlucose;
        }, 0) / rows.length
      )
    : null;

  // Aproximación de total de páginas: la actual + 1 si hay siguiente
  const totalPages = Math.max(1, currentPage + (hasNext ? 1 : 0));

  return (
    <div className="dashboard-container">
      {/* Encabezado principal */}
      <header className="dashboard-header">
        <h1 className="dashboard-title">Dashboard Clínico IntegraD</h1>
        <p className="dashboard-subtitle">
          Resumen general de pacientes, adherencia y alertas críticas en
          seguimiento.
        </p>

        {meta && (
          <p className="dashboard-meta-info">
            Ventana de análisis: últimos {meta.windowDays ?? windowDays} días ·
            Máx. {meta.limit ?? limit} pacientes
            {meta.generatedAt && (
              <>
                {" "}
                · Generado:{" "}
                {new Date(meta.generatedAt).toLocaleString("es-AR")}
              </>
            )}
          </p>
        )}
      </header>

      {/* KPIs superiores */}
      <section className="kpi-grid">
        <KpiCard
          title="Adherencia de Medicación"
          value={loading ? "..." : `${adherencePercent} %`}
          description={`Promedio últimos ${windowDays} días`}
          color="green"
        />
        <KpiCard
          title="Pacientes Activos"
          value={loading ? "..." : `${patientCount}`}
          description="En seguimiento"
          color="blue"
        />
        <KpiCard
          title="Alertas Abiertas"
          value={loading ? "..." : `${alertCount}`}
          description="Hipo/Hiper sin resolver"
          color="red"
        />
        <KpiCard
          title="Glucemia Promedio Global"
          value={
            loading
              ? "..."
              : avgGlucoseValue !== null
              ? `${avgGlucoseValue} mg/dL`
              : "—"
          }
          description="Cohorte actual"
          color="purple"
        />
      </section>

      {/* Zona de gráficos */}
      <section className="charts-grid">
        <div className="chart-card chart-card--adherence">
          <h2 className="chart-title">Evolución de Adherencia</h2>
          <p className="chart-subtitle">Comparativo por mes</p>
          <AdherenceBarChart />
        </div>

        <div className="chart-card chart-card--alerts-donut">
          <h2 className="chart-title">Distribución de Alertas</h2>
          <p className="chart-subtitle">Hipo vs Hiper</p>
          <AlertsDonutChart />
        </div>
      </section>

      {/* Estados generales previos a la tabla */}
      {loading && (
        <p className="status-message status-message--loading">
          Cargando datos de pacientes en seguimiento…
        </p>
      )}

      {!loading && !error && rows.length === 0 && (
        <p className="status-message status-message--empty">
          No hay pacientes en seguimiento para los filtros actuales.
        </p>
      )}

      {/* Tabla + paginación */}
      {!loading && !error && rows.length > 0 && (
        <section className="dashboard-table-section">
          <h2 className="section-title">Pacientes en Seguimiento</h2>
          <p className="section-subtitle">
            Últimas mediciones de glucemia, adherencia y estado de control.
          </p>

          <DashboardFollowupTable rows={rows} />

          {/* 🔹 Paginación del Dashboard */}
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
              onClick={handlePrevPage}
            >
              ← Anterior
            </button>

            <span style={{ alignSelf: "center", opacity: 0.8 }}>
              Página {currentPage} de {totalPages}
            </span>

            <button
              className="retry-button"
              disabled={!hasNext || currentPage >= totalPages}
              onClick={handleNextPage}
            >
              Siguiente →
            </button>
          </div>
        </section>
      )}

      {/* Mensaje de error */}
      {!loading && error && (
        <div className="status-message status-message--error">
          <p>{error}</p>
          <button onClick={handleRetry} className="retry-button">
            Reintentar
          </button>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
