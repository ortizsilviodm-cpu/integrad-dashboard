/* integrad-dashboard/src/App.tsx */

import { useEffect, useState, createContext, useContext } from "react";
import "./App.css";

// 🌐 Global
import { getAuthToken, isAuthenticated } from "./store/authStore";
import { logout } from "./api/auth";

// 🏛️ Componentes
import Sidebar, { type SectionKey } from "./components/Sidebar";
import LoginPage from "./pages/LoginPage";

// Pages
import DashboardPage from "./pages/DashboardPage";
import AlertsPage from "./pages/AlertsPage";
import DispensesPage from "./pages/DispensesPage";
import AuditPage from "./pages/AuditPage";
import IAPredictivaPage from "./pages/IAPredictivaPage";
import PatientsPage from "./pages/PatientsPage";
import MedicationsPage from "./pages/MedicationsPage";
import AmbulatoryPage from "./pages/AmbulatoryPage";
import PatientEnrollmentPage from "./pages/PatientEnrollmentPage";
import EnrollmentsPage from "./pages/EnrollmentsPage";

// Views
import SettingsView from "./views/SettingsView";
import EconomicsDemoView from "./views/EconomicsDemoView";

const DEMO_MODE =
  (import.meta.env.VITE_DEMO_MODE || "false").toLowerCase() === "true";

export type { SectionKey } from "./components/Sidebar";

export interface User {
  id: string;
  fullName: string;
  role: "admin" | "professional";
  specialty: string;
}

// ============================
// 🔐 Auth Context
// ============================

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isReady: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isReady: false,
  login: () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

// ============================
// 🏛️ APP Principal
// ============================

const getInitialAuth = (): { user: User | null; token: string | null } => {
  const token = getAuthToken();
  if (token) {
    return {
      token,
      user: {
        id: "demo-user-123",
        fullName: "Dr. Juan Pérez",
        role: "professional",
        specialty: "Endocrinología",
      },
    };
  }
  return { user: null, token: null };
};

function App() {
  const [authData, setAuthData] = useState(() => getInitialAuth());
  const [isReady, setIsReady] = useState(false);
  const [activeSection, setActiveSection] =
    useState<SectionKey>("dashboard");

  // 🔎 Accesibilidad: escala global de fuente (1 = 100%)
  const [fontScale, setFontScale] = useState<number>(1);

  useEffect(() => {
    const tokenExists = isAuthenticated();
    if (tokenExists) {
      // En una app real: fetchUserData(token)
    }
    setIsReady(true);
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--font-scale",
      String(fontScale)
    );
  }, [fontScale]);

  const handleLogin = (token: string) => {
    setAuthData({
      token,
      user: {
        id: "demo-user-123",
        fullName: "Dr. Juan Pérez",
        role: "professional",
        specialty: "Endocrinología",
      },
    });
  };

  const handleLogout = () => {
    logout();
    setAuthData({ user: null, token: null });
    setActiveSection("dashboard");
  };

  const authContextValue: AuthContextType = {
    user: authData.user,
    isAuthenticated: !!authData.user,
    isReady,
    login: handleLogin,
    logout: handleLogout,
  };

  const handleFontIncrease = () =>
    setFontScale((prev) => Math.min(prev + 0.1, 1.5));

  const handleFontDecrease = () =>
    setFontScale((prev) => Math.max(prev - 0.1, 0.9));

  const handleFontReset = () => setFontScale(1);

  const fontScalePercentage = Math.round(fontScale * 100);

  if (!isReady) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        Cargando configuración de la aplicación...
      </div>
    );
  }

  if (!authContextValue.isAuthenticated) {
    return <LoginPage onSuccessfulLogin={handleLogin} />;
  }

  const userInitials =
    authData.user?.fullName
      .split(" ")
      .filter(Boolean)
      .map((p) => p[0])
      .slice(0, 2)
      .join("") ?? "";

  return (
    <AuthContext.Provider value={authContextValue}>
      <div className="app-root">
        <Sidebar activeSection={activeSection} onSelect={setActiveSection} />

        <main className="app-main">
          {/* TOPBAR */}
          <header
            className="app-topbar-minimal"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.4rem 1.5rem",
              height: 50,
              backgroundColor: "#FFFFFF",
              borderBottom: "1px solid #e5e7eb",
            }}
          >
            <div className="app-topbar-left" style={{ fontSize: 12, color: "#9ca3af" }} />

            <div
              className="app-topbar-right"
              style={{ display: "flex", alignItems: "center", gap: 12 }}
            >
              {/* Controles de accesibilidad */}
              <div
                className="font-size-controls"
                aria-label="Ajustar tamaño de texto"
                style={{ display: "flex", alignItems: "center", gap: 4 }}
              >
                <button type="button" onClick={handleFontDecrease}>A-</button>
                <button type="button" onClick={handleFontReset}>A</button>
                <button type="button" onClick={handleFontIncrease}>A+</button>
                <span
                  style={{
                    marginLeft: 6,
                    fontSize: 11,
                    color: "#6b7280",
                    minWidth: 52,
                    textAlign: "right",
                  }}
                >
                  {fontScalePercentage}%
                </span>
              </div>

              {DEMO_MODE && (
                <button
                  onClick={() => setActiveSection("economicsDemo")}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 999,
                    border: "1px solid #e5e7eb",
                    background: "#ffffff",
                    color: "#2563eb",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: 12,
                  }}
                >
                  Impacto Económico
                </button>
              )}

              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "999px",
                  background:
                    "linear-gradient(135deg, #f97316 0%, #ec4899 100%)",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {userInitials}
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  lineHeight: 1.1,
                }}
              >
                <strong style={{ fontSize: 13 }}>
                  {authData.user?.fullName}
                </strong>
                <span
                  className="app-header-role"
                  style={{ fontSize: 11, color: "#6b7280" }}
                >
                  {authData.user?.specialty}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="logout-button"
                style={{
                  marginLeft: 4,
                  border: "none",
                  background: "transparent",
                  color: "#c0392b",
                  cursor: "pointer",
                  fontSize: 12,
                }}
              >
                (Salir)
              </button>
            </div>
          </header>

          {/* MAIN ROUTER */}
          <div className="app-content-wrapper">
            {activeSection === "dashboard" && <DashboardPage />}
            {activeSection === "patients" && <PatientsPage />}
            {activeSection === "enrollment" && <PatientEnrollmentPage />}
            {activeSection === "enrollments" && <EnrollmentsPage />}
            {activeSection === "alerts" && <AlertsPage />}
            {activeSection === "dispenses" && <DispensesPage />}
            {activeSection === "ambulatory" && <AmbulatoryPage />}
            {activeSection === "audit" && <AuditPage />}
            {activeSection === "medications" && <MedicationsPage />}
            {activeSection === "settings" && <SettingsView />}
            {activeSection === "iaPredictiva" && <IAPredictivaPage />}
            {activeSection === "economicsDemo" && <EconomicsDemoView />}
          </div>
        </main>
      </div>
    </AuthContext.Provider>
  );
}

export default App;
