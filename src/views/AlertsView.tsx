/* integrad-dashboard/src/views/AlertsView.tsx */

import { useEffect, useState } from "react";
import StatusChip from "../components/StatusChip";

/**
 * Por ahora repetimos la URL base.
 * Más adelante se puede centralizar en un config común con App.tsx.
 */
import { API_URL } from "../config/api";

type AlertRow = {
  id: string;
  typeLabel: string;
  valueLabel: string;
  createdAtLabel: string;
  statusLabel: string;
};

export default function AlertsView() {
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar alertas abiertas desde el backend
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        setError(null);

        // Leemos solo alertas abiertas (status=open)
        const res = await fetch(`${API_URL}/readings/alerts?status=open`);
        if (!res.ok) {
          throw new Error("Error obteniendo alertas");
        }

        const json = await res.json();
        const apiAlerts: any[] = json.data || [];

        // Mapeo flexible de campos según lo que devuelva el backend
        const mapped: AlertRow[] = apiAlerts.map((a) => {
          const typeLabel = a.type ?? a.alertType ?? a.kind ?? "—";

          const valueRaw =
            a.value ?? a.readingValue ?? a.reading?.value ?? null;
          const valueUnit =
            a.unit ??
            a.readingUnit ??
            a.reading?.unit ??
            (valueRaw != null ? "mg/dL" : "");
          const valueLabel =
            valueRaw != null ? `${valueRaw} ${valueUnit}` : "—";

          const created = a.createdAt ?? a.timestamp ?? a.reading?.createdAt;
          let createdAtLabel = "—";
          if (created) {
            const d = new Date(created);
            if (!isNaN(d.getTime())) {
              createdAtLabel = d.toLocaleString("es-AR", {
                dateStyle: "short",
                timeStyle: "short",
              });
            }
          }

          const statusLabel = a.status
            ? String(a.status)
            : "En alerta";

          return {
            id: String(a.id ?? `${typeLabel}-${created ?? Math.random()}`),
            typeLabel,
            valueLabel,
            createdAtLabel,
            statusLabel,
          };
        });

        setAlerts(mapped);
      } catch (err) {
        console.error("Error cargando alertas:", err);
        setAlerts([]);
        setError("No se pudieron cargar las alertas.");
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, []);

  return (
    <section className="app-table">
      <h2>Alertas</h2>
      <p className="chart-subtitle">
        Monitoreo de episodios de hipo e hiper y su resolución.
      </p>

      {loading && (
        <div className="chart-placeholder">Cargando alertas...</div>
      )}

      {error && !loading && (
        <div className="chart-placeholder">{error}</div>
      )}

      {!loading && !error && alerts.length === 0 && (
        <div className="chart-placeholder">
          No hay alertas abiertas en este momento.
        </div>
      )}

      {!loading && !error && alerts.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Valor</th>
              <th>Fecha y hora</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((a) => (
              <tr key={a.id}>
                <td>{a.typeLabel}</td>
                <td>{a.valueLabel}</td>
                <td>{a.createdAtLabel}</td>
                <td>
                  <StatusChip label={a.statusLabel} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
