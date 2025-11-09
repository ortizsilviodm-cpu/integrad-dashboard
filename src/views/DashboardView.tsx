/* integrad-dashboard/src/views/DashboardView.tsx */

import AdherenceBarChart from "../components/AdherenceBarChart";
import AlertsDonutChart from "../components/AlertsDonutChart";
import KpiCard from "../components/KpiCard";
import StatusChip from "../components/StatusChip";

type DashboardPatientRow = {
  id: number | string;
  name: string;
  document: string;
  lastGlucose: string;
  adherence: string;
  status: string;
};

type DashboardViewProps = {
  adherencePercent: number;
  loadingAdherence: boolean;
  loadingAlerts: boolean;
  loadingPatients: boolean;
  alertCount: number;
  patientCount: number;
  mockPatients: DashboardPatientRow[];
  adherenceWindowDays: number;
};

export default function DashboardView({
  adherencePercent,
  loadingAdherence,
  loadingAlerts,
  loadingPatients,
  alertCount,
  patientCount,
  mockPatients,
  adherenceWindowDays,
}: DashboardViewProps) {
  return (
    <>
      {/* KPIs superiores */}
      <section className="app-kpis">
        <KpiCard
          title="Adherencia de Medicación"
          value={loadingAdherence ? "..." : `${adherencePercent} %`}
          description={`Promedio últimos ${adherenceWindowDays} días`}
          color="green"
        />
        <KpiCard
          title="Pacientes Activos"
          value={loadingPatients ? "..." : `${patientCount}`}
          description="En seguimiento"
          color="blue"
        />
        <KpiCard
          title="Alertas Abiertas"
          value={loadingAlerts ? "..." : `${alertCount}`}
          description="Hipo/Hiper sin resolver"
          color="red"
        />
        <KpiCard
          title="Glucemia Promedio Global"
          value="142 mg/dL"
          description="Cohorte actual"
          color="purple"
        />
      </section>

      {/* Tarjetas de gráficos */}
      <section className="app-charts">
        <div className="chart-card">
          <h2>Evolución de Adherencia</h2>
          <p className="chart-subtitle">Comparativo por mes</p>
          <AdherenceBarChart />
        </div>

        <div className="chart-card">
          <h2>Distribución de Alertas</h2>
          <p className="chart-subtitle">Hipo vs Hiper</p>
          <AlertsDonutChart />
        </div>
      </section>

      {/* Tabla de pacientes demo */}
      <section className="app-table">
        <h2>Pacientes en Seguimiento</h2>
        <p className="chart-subtitle">
           Últimas mediciones de glucemia, adherencia y estado de control.
        </p>

        <table>
          <thead>
            <tr>
              <th>Paciente</th>
              <th>Documento</th>
              <th>Última glucemia</th>
              <th>Adherencia</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {mockPatients.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.document}</td>
                <td>{p.lastGlucose}</td>
                <td>{p.adherence}</td>
                <td>
                  <StatusChip label={p.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
