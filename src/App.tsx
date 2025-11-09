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
import IAPredictivaView from "./views/IAPredictivaView";

import { API_URL } from "./config/api";
import { safeFetch } from "./api/safeFetch";

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

const DASHBOARD_PATIENT_ID = "cmhifdhly0000te0gwqwbp6e9"; // paciente demo
const ADHERENCE_WINDOW_DAYS = 90;

// 🔹 rol actual (por ahora fijo; más adelante vendrá del sistema de auth)
const CURRENT_USER_ROLE = "admin" as const;

// Secciones del menú
export type SectionKey =
  | "dashboard"
  | "patients"
  | "alerts"
  | "dispenses"
  | "audit"
  | "settings"
  | "iaPredictiva";

const SECTION_META: Record<
  SectionKey,
  {
    title: string;
    subtitle: string;
  }
> = {
  dashboard: {
    title: "Dashboard Clínico IntegraD",
    subtitle:
      "Resumen general de pacientes, adherencia y alertas críticas en seguimiento.",
  },
  patients: {
    title: "Pacientes",
    subtitle:
      "Registro general de pacientes activos y su información básica de seguimiento.",
  },
  alerts: {
    title: "Alertas",
    subtitle:
      "Supervisión de episodios críticos y alertas predictivas generadas por IA.",
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
    subtitle:
      "Preferencias del panel profesional y ajustes del entorno IntegraD.",
  },
  iaPredictiva: {
    title: "IA Predictiva — Riesgo y adherencia",
    subtitle:
      "Visualización interna del riesgo estimado y adherencia de pacientes. Muestra pacientes ordenados por riesgo estimado, a partir de datos clínicos y de adherencia, sin emitir diagnóstico automático.",
  },
};

// ============================
// Tipos de respuestas de API
// ============================

interface ApiPatient {
  id?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  document?: string;
  documentNumber?: string;
  documentId?: string;
}

interface PatientsApiResponse {
  data?: ApiPatient[];
}

interface FollowupApiRow {
  patientId?: string;
  fullName?: string;
  documentNumber?: string;
  lastGlucoseValue?: number | null;
  lastGlucoseUnit?: string | null;
  lastGlucoseAt?: string | null;
  adherencePercent?: number;
  statusLabel?: string;
}

interface FollowupApiResponse {
  data?: FollowupApiRow[];
}

interface AdherenceApiResponse {
  adherencePercent?: number;
}

interface AlertsKpiApiResponse {
  data?: unknown[];
}

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
      setLoadingAlerts(true);
      try {
        const result = await safeFetch<AlertsKpiApiResponse>(
          `${API_URL}/readings/alerts?status=open`
        );

        if (!result.ok || !result.data || !Array.isArray(result.data.data)) {
          setAlertCount(0);
          if (result.error) {
            console.error("Error cargando alertas (KPI):", result.error);
          }
          return;
        }

        setAlertCount(result.data.data.length);
      } catch (error) {
        console.error("Error inesperado cargando alertas (KPI):", error);
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

        const result = await safeFetch<PatientsApiResponse>(
          `${API_URL}/patients`
        );

        if (!result.ok || !result.data || !Array.isArray(result.data.data)) {
          setPatients([]);
          setPatientCount(0);
          setPatientsError(
            result.error ?? "No se pudieron cargar los pacientes."
          );
          return;
        }

        const apiPatients = result.data.data;

        const mapped: PatientRow[] = apiPatients.map((p, index) => {
          // nombre
          const rawNameFromFull = p.fullName ?? "";
          const rawNameFromParts =
            `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim();
          const name =
            (rawNameFromFull || rawNameFromParts).trim() || "Sin nombre";

          // documento
          const document =
            p.document ?? p.documentNumber ?? p.documentId ?? "—";

          return {
            id: p.id ?? index,
            name,
            document,
            // estos campos no vienen de /patients, los dejamos neutros
            lastGlucose: "—",
            adherence: "—",
            status: "Sin estado",
          };
        });

        setPatients(mapped);
        setPatientCount(mapped.length);
      } catch (error) {
        console.error("Error inesperado cargando pacientes:", error);
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
        const result = await safeFetch<AdherenceApiResponse>(url);

        if (!result.ok || !result.data) {
          if (result.error) {
            console.error("Error cargando adherencia:", result.error);
          }
          setAdherencePercent(0);
          return;
        }

        const value =
          typeof result.data.adherencePercent === "number"
            ? result.data.adherencePercent
            : 0;

        setAdherencePercent(value);
      } catch (error) {
        console.error("Error inesperado cargando adherencia:", error);
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
        const result = await safeFetch<FollowupApiResponse>(url);

        if (!result.ok || !result.data || !Array.isArray(result.data.data)) {
          if (result.error) {
            console.error(
              "Error cargando pacientes en seguimiento:",
              result.error
            );
          }
          return;
        }

        const apiRows = result.data.data;

        const mapped: PatientRow[] = apiRows.map((row, index) => {
          const fullName = row.fullName ?? ("" || "Sin nombre");

          const documentNumber = row.documentNumber ?? "—";

          const lastGlucose =
            typeof row.lastGlucoseValue === "number"
              ? `${row.lastGlucoseValue} ${row.lastGlucoseUnit ?? "mg/dL"}`
              : "—";

          const adherence =
            typeof row.adherencePercent === "number"
              ? `${row.adherencePercent} %`
              : "—";

          return {
            id: row.patientId ?? index,
            name: fullName,
            document: documentNumber,
            lastGlucose,
            adherence,
            status: row.statusLabel ?? "En revisión",
          };
        });

        if (mapped.length > 0) {
          setDashboardPatients(mapped);
        }
      } catch (error) {
        console.error(
          "Error inesperado cargando pacientes en seguimiento:",
          error
        );
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

        {/* =========================
            SECCIÓN: IA PREDICTIVA
        ========================== */}
        {activeSection === "iaPredictiva" && (
          <IAPredictivaView currentUserRole={CURRENT_USER_ROLE} />
        )}
      </main>
    </div>
  );
}

export default App;
