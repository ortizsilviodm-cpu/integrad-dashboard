/* integrad-dashboard/src/views/AlertsView.tsx */

import { useEffect, useState } from "react";
import StatusChip from "../components/StatusChip";
import { API_URL } from "../config/api";
import { safeFetch } from "../api/safeFetch";

type AlertRow = {
  id: string;
  patientName: string;
  typeLabel: string;
  valueLabel: string;
  createdAtLabel: string;
  statusLabel: string;
};

interface AlertsApiRow {
  id: string;
  patientId: string;
  patientName?: string;
  kind: string;
  value: number | null;
  detectedAt: string;
  resolvedAt: string | null;
  status: string;
}

interface AlertsApiResponse {
  data?: AlertsApiRow[];
}

/**
 * Mapea el tipo crudo de alerta a una etiqueta amigable.
 */
function mapAlertType(rawType: string | null | undefined): string {
  if (!rawType) return "—";

  const t = rawType.toLowerCase();

  if (t === "hipo" || t === "hipoglucemia") return "Hipo";
  if (t === "hiper" || t === "hiperglucemia") return "Hiper";
  if (t === "riesgo_ia" || t === "ia_risk") return "Riesgo IA";

  // fallback: capitalizar lo que venga
  return rawType.charAt(0).toUpperCase() + rawType.slice(1);
}

/**
 * Formatea el valor de la alerta según el tipo.
 * - Para hipo/hiper → mg/dL.
 * - Para riesgo IA → "score / 100".
 */
function formatAlertValue(
  rawType: string | null | undefined,
  valueRaw: number | null,
  unit: string
): string {
  if (valueRaw == null) return "—";

  const t = rawType?.toLowerCase();

  if (t === "riesgo_ia" || t === "ia_risk") {
    return `${valueRaw} / 100`;
  }

  return `${valueRaw} ${unit}`;
}

export default function AlertsView() {
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar alertas abiertas desde el backend
  useEffect(() => {
    const fetchAlerts = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await safeFetch<AlertsApiResponse>(
          `${API_URL}/readings/alerts?status=open`
        );

        if (!result.ok || !result.data || !Array.isArray(result.data.data)) {
          setAlerts([]);
          setError(
            result.error ?? "No se pudieron cargar las alertas."
          );
          return;
        }

        const apiAlerts = result.data.data;

        const mapped: AlertRow[] = apiAlerts.map((a) => {
          const rawType = a.kind ?? null;
          const typeLabel = mapAlertType(rawType);

          // Nombre del paciente
          const rawPatientName = a.patientName ?? "";
          const normalizedName = rawPatientName
            .trim()
            .replace(/\s+/g, " ");
          const patientName = normalizedName || "—";

          const valueRaw = a.value;

          const valueUnit =
            valueRaw != null ? "mg/dL" : "";

          const numericValue =
            typeof valueRaw === "number" ? valueRaw : Number(valueRaw);

          const valueLabel = formatAlertValue(
            rawType,
            isNaN(numericValue) ? null : numericValue,
            valueUnit
          );

          const created = a.detectedAt;
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

          const statusLabel = a.status ? String(a.status) : "En alerta";

          return {
            id: String(a.id),
            patientName,
            typeLabel,
            valueLabel,
            createdAtLabel,
            statusLabel,
          };
        });

        setAlerts(mapped);
      } catch (err) {
        console.error("Error inesperado cargando alertas:", err);
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
        Supervisión de episodios hipo/hiper y alertas de riesgo IA.
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
              <th>Paciente</th>
              <th>Tipo</th>
              <th>Valor</th>
              <th>Fecha y hora</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((a) => (
              <tr key={a.id}>
                <td>{a.patientName}</td>
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
