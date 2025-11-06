/* integrad-dashboard/src/App.tsx */

import { useEffect, useState } from "react";
import "./App.css";

import Sidebar from "./components/Sidebar";
import DashboardView from "./views/DashboardView";
import PatientsView from "./views/PatientsView";
import AlertsView from "./views/AlertsView";
import DispensesView from "./views/DispensesView";
import AuditView from "./views/AuditView";
import SettingsView from "./views/SettingsView";

type PatientRow = {
  id: number | string;
  name: string;
  document: string;
  lastGlucose: string;
  adherence: string;
  status: string;
};

const MOCK_PATIENTS: PatientRow[] = [
  {
    id: 1,
    name: "Juan Pérez",
    document: "xx.xxx.xxx",
    lastGlucose: "182 mg/dL",
    adherence: "78 %",
    status: "No controlado",
  },
  {
    id: 2,
    name: "María Gómez",
    document: "xx.xxx.xxx",
    lastGlucose: "210 mg/dL",
    adherence: "62 %",
    status: "En alerta",
  },
];

import { API_URL } from "./config/api";
const DASHBOARD_PATIENT_ID = "cmhifdhly0000te0gwqwbp6e9"; // paciente demo
const ADHERENCE_WINDOW_DAYS = 90;

// Secciones del menú
export type SectionKey =
  | "dashboard"
  | "patients"
  | "alerts"
  | "dispenses"
  | "audit"
  | "settings";

const SECTION_META: Record<
  SectionKey,
  {
    title: string;
    subtitle: string;
  }
> = {
  dashboard: {
    title: "Dashboard Clínico IntegraD",
    subtitle: "Resumen de pacientes, adherencia y alertas críticas.",
  },
  patients: {
    title: "Pacientes",
    subtitle: "Gestión de pacientes en seguimiento.",
  },
  alerts: {
    title: "Alertas",
    subtitle: "Monitoreo de alertas hipo/hiper y seguimiento clínico.",
  },
  dispenses: {
    title: "Dispensas",
    subtitle: "Dispensas de medicación y adherencia al tratamiento.",
  },
  audit: {
    title: "Auditoría",
    subtitle: "Trazabilidad y registro de eventos clínicos.",
  },
  settings: {
    title: "Configuración",
    subtitle: "Preferencias del panel profesional IntegraD.",
  },
};

function App() {
  // 🔹 Sección activa del menú
  const [activeSection, setActiveSection] = useState<SectionKey>("dashboard");

  // 🔹 Estados KPI
  const [alertCount, setAlertCount] = useState<number>(0);
  const [patientCount, setPatientCount] = useState<number>(0);
  const [adherencePercent, setAdherencePercent] = useState<number | null>(null);

  const [loadingAlerts, setLoadingAlerts] = useState<boolean>(false);
  const [loadingPatients, setLoadingPatients] = useState<boolean>(false);
  const [loadingAdherence, setLoadingAdherence] = useState<boolean>(false);

  // 🔹 Estado para vista de Pacientes (listado completo)
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [patientsError, setPatientsError] = useState<string | null>(null);

  // 🔹 Estado para “Pacientes en Seguimiento” del DASHBOARD
  const [dashboardPatients, setDashboardPatients] =
    useState<PatientRow[]>(MOCK_PATIENTS);

  // ============================
  // Alertas abiertas (KPI)
  // ============================
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoadingAlerts(true);
        const res = await fetch(`${API_URL}/readings/alerts?status=open`);
        if (!res.ok) throw new Error("Error obteniendo alertas abiertas");
        const json = await res.json();
        setAlertCount(json.data?.length || 0);
      } catch (error) {
        console.error("Error cargando alertas:", error);
        setAlertCount(0);
      } finally {
        setLoadingAlerts(false);
      }
    };

    fetchAlerts();
  }, []);

  // ============================
  // Pacientes (KPI + listado)
  // ============================
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoadingPatients(true);
        setPatientsError(null);

        const res = await fetch(`${API_URL}/patients`);
        if (!res.ok) throw new Error("Error obteniendo pacientes");
        const json = await res.json();

        const apiPatients: any[] = json.data || [];

        // Mapeo flexible por si el backend usa otros nombres de campos
        const mapped: PatientRow[] = apiPatients.map((p, index) => ({
          id: p.id ?? index,
          // 👇 corregido: solo usamos ||
          name:
            p.fullName ||
            `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim() ||
            "Sin nombre",
          document: p.document ?? p.documentNumber ?? p.documentId ?? "—",
          lastGlucose: "—", // detalle se verá en otros módulos
          adherence: "—",
          status: "Sin estado",
        }));

        setPatients(mapped);
        setPatientCount(mapped.length);
      } catch (error) {
        console.error("Error cargando pacientes:", error);
        setPatients([]);
        setPatientCount(0);
        setPatientsError("No se pudieron cargar los pacientes.");
      } finally {
        setLoadingPatients(false);
      }
    };

    fetchPatients();
  }, []);

  // ============================
  // Adherencia de medicación (KPI)
  // ============================
  useEffect(() => {
    const fetchAdherence = async () => {
      try {
        setLoadingAdherence(true);

        const url = `${API_URL}/dispenses/adherence?patientId=${DASHBOARD_PATIENT_ID}&days=${ADHERENCE_WINDOW_DAYS}`;
        const res = await fetch(url);
        if (!res.ok)
          throw new Error("Error obteniendo adherencia de medicación");

        const json = await res.json();

        const value =
          typeof json.adherencePercent === "number" ? json.adherencePercent : 0;

        setAdherencePercent(value);
      } catch (error) {
        console.error("Error cargando adherencia:", error);
        setAdherencePercent(0);
      } finally {
        setLoadingAdherence(false);
      }
    };

    fetchAdherence();
  }, []);

  // ============================
  // Pacientes en Seguimiento (Dashboard)
  // ============================
  useEffect(() => {
    const fetchFollowupPatients = async () => {
      try {
        const url = `${API_URL}/dashboard/followup-patients?limit=5&days=${ADHERENCE_WINDOW_DAYS}`;
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error("Error obteniendo pacientes en seguimiento");
        }

        const json = await res.json();
        const apiRows: any[] = json.data || [];

        const mapped: PatientRow[] = apiRows.map((row, index) => ({
          id: row.patientId ?? index,
          name: row.fullName ?? "Sin nombre",
          document: row.documentNumber ?? "—",
          lastGlucose:
            typeof row.lastGlucoseValue === "number"
              ? `${row.lastGlucoseValue} ${row.lastGlucoseUnit ?? "mg/dL"}`
              : "—",
          adherence:
            typeof row.adherencePercent === "number"
              ? `${row.adherencePercent} %`
              : "—",
          status: row.statusLabel ?? "En revisión",
        }));

        if (mapped.length > 0) {
          setDashboardPatients(mapped);
        }
      } catch (error) {
        console.error("Error cargando pacientes en seguimiento:", error);
        // Si falla, simplemente nos quedamos con MOCK_PATIENTS
      }
    };

    fetchFollowupPatients();
  }, []);

  const { title, subtitle } = SECTION_META[activeSection];

  return (
    <div className="app-root">
      <Sidebar activeSection={activeSection} onSelect={setActiveSection} />

      <main className="app-main">
        {/* Header dinámico según sección */}
        <header className="app-header">
          <div>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>

          <div className="app-header-user">
            <strong>Dr. Juan Pérez</strong>
            <span className="app-header-role">Endocrinología</span>
          </div>
        </header>

        {/* =========================
            SECCIÓN: DASHBOARD
        ========================== */}
        {activeSection === "dashboard" && (
          <DashboardView
            adherencePercent={adherencePercent ?? 0}
            loadingAdherence={loadingAdherence}
            loadingAlerts={loadingAlerts}
            loadingPatients={loadingPatients}
            alertCount={alertCount}
            patientCount={patientCount}
            mockPatients={dashboardPatients}
            adherenceWindowDays={ADHERENCE_WINDOW_DAYS}
          />
        )}

        {/* =========================
            SECCIÓN: PACIENTES
        ========================== */}
        {activeSection === "patients" && (
          <PatientsView
            loading={loadingPatients}
            patients={patients}
            error={patientsError}
          />
        )}

        {/* =========================
            SECCIÓN: ALERTAS
        ========================== */}
        {activeSection === "alerts" && <AlertsView />}

        {/* =========================
            SECCIÓN: DISPENSAS
        ========================== */}
        {activeSection === "dispenses" && <DispensesView />}

        {/* =========================
            SECCIÓN: AUDITORÍA
        ========================== */}
        {activeSection === "audit" && <AuditView />}

        {/* =========================
            SECCIÓN: CONFIGURACIÓN
        ========================== */}
        {activeSection === "settings" && <SettingsView />}
      </main>
    </div>
  );
}

export default App;
