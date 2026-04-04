/* integrad-dashboard\src\pages\ClinicalSignalsPage.tsx */

import { useState } from "react";
import { ClinicalSignalItem } from "../components/clinicalSignals/ClinicalSignalItem";
import { sortSignalsBySeverity } from "../logic/clinicalSignals.logic";
import { useClinicalSignals } from "../hooks/useClinicalSignals";
import "./DashboardPage.css";

export function ClinicalSignalsPage() {
  const { data: signals, loading, error } = useClinicalSignals();
  const [filter, setFilter] = useState("ALL");

  const sortedSignals = sortSignalsBySeverity(signals);

  const filteredSignals = sortedSignals.filter((signal) =>
    filter === "ALL" ? true : signal.severity === filter
  );

  const highPriority = filteredSignals.filter((s) => s.severity === "HIGH");
  const otherSignals = filteredSignals.filter((s) => s.severity !== "HIGH");

  if (loading) {
    return (
      <div className="dashboard-container">
        <header className="dashboard-header">
          <h1 className="dashboard-title">Señales Clínicas</h1>
          <p className="dashboard-subtitle">
            Visualización operativa de señales clínicas activas.
          </p>
        </header>

        <div className="status-message status-message--loading">
          Cargando señales clínicas…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <header className="dashboard-header">
          <h1 className="dashboard-title">Señales Clínicas</h1>
          <p className="dashboard-subtitle">
            Visualización operativa de señales clínicas activas.
          </p>
        </header>

        <div className="status-message status-message--error">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1 className="dashboard-title">Señales Clínicas</h1>
        <p className="dashboard-subtitle">
          Visualización operativa de señales clínicas activas.
        </p>
      </header>

      <div style={{ marginBottom: "1rem" }}>
        <label
          htmlFor="severity-filter"
          style={{
            display: "block",
            marginBottom: "0.5rem",
            fontWeight: 600,
            color: "var(--color-text)",
          }}
        >
          Filtrar por severidad
        </label>

        <select
          id="severity-filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            padding: "0.5rem 0.75rem",
            borderRadius: "8px",
            border: "1px solid var(--color-border)",
            backgroundColor: "var(--color-card-bg)",
            color: "var(--color-text)",
          }}
        >
          <option value="ALL">Todas</option>
          <option value="HIGH">Alta</option>
          <option value="MEDIUM">Media</option>
          <option value="LOW">Baja</option>
        </select>
      </div>

      {filteredSignals.length === 0 && (
        <div className="status-message status-message--empty">
          No hay señales clínicas activas.
        </div>
      )}

      {highPriority.length > 0 && (
        <>
          <h2 style={{ marginTop: "1rem" }}>Alta prioridad</h2>
          {highPriority.map((signal) => (
            <ClinicalSignalItem key={signal.id} signal={signal} />
          ))}
        </>
      )}

      {otherSignals.length > 0 && (
        <>
          <h2 style={{ marginTop: "1rem" }}>Otras señales</h2>
          {otherSignals.map((signal) => (
            <ClinicalSignalItem key={signal.id} signal={signal} />
          ))}
        </>
      )}
    </div>
  );
}