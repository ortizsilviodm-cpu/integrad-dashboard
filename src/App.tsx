/* integrad-dashboard/src/App.tsx */

import { useEffect, useState, createContext, useContext } from "react";
import "./App.css";

// Global
import { getAuthToken, isAuthenticated, onAuthChange } from "./store/authStore";
import { logout, fetchMe, type MeResponse } from "./api/auth";

// Components
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
import FollowupCaseloadPage from "./pages/FollowupCaseloadPage";

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

// Auth Context
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

/**
 * /auth/me en backend puede devolver:
 * A) { id, email, role, ... }
 * B) { user: { id, email, role, ... }, patientId, appContext }
 */
function normalizeMePayload(payload: unknown): MeResponse | null {
  if (!payload || typeof payload !== "object") return null;

  const p = payload as any;

  if (p.user && typeof p.user === "object") {
    const u = p.user as any;
    if (!u?.id) return null;

    // Si tu MeResponse incluye campos extra (appContext/patientId), los dejamos pasar si existen.
    return {
      ...u,
      appContext: p.appContext,
      patientId: p.patientId,
    } as MeResponse;
  }

  if (p.id) return p as MeResponse;

  return null;
}

function mapMeToUser(me: MeResponse): User {
  const roleLower: User["role"] = me.role === "ADMIN" ? "admin" : "professional";

  const fullName =
    me.fullName?.trim() || me.name?.trim() || me.email?.trim() || "Usuario";

  return {
    id: me.id,
    fullName,
    role: roleLower,
    specialty: (me.specialty || "").trim(),
  };
}

function roleLabel(role: User["role"]): string {
  return role === "admin" ? "Administrador" : "Profesional";
}

const getInitialAuth = (): { user: User | null; token: string | null } => {
  const token = getAuthToken();
  return { token: token || null, user: null };
};

function App() {
  const [authData, setAuthData] = useState(() => getInitialAuth());
  const [isReady, setIsReady] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionKey>("dashboard");

  // Accessibility: global font scale (1 = 100%)
  const [fontScale, setFontScale] = useState<number>(1);

  const hydrateUser = async (): Promise<boolean> => {
    const tokenExists = isAuthenticated();
    if (!tokenExists) return false;

    const result = await fetchMe();

    if (result.ok && result.data) {
      const me = normalizeMePayload(result.data);
      if (me?.id) {
        const user = mapMeToUser(me);
        setAuthData((prev) => ({ ...prev, user }));
        return true;
      }
    }

    logout();
    setAuthData({ user: null, token: null });
    setActiveSection("dashboard");
    return false;
  };

  useEffect(() => {
    const unsubscribe = onAuthChange((token) => {
      if (!token) {
        setAuthData({ user: null, token: null });
        setActiveSection("dashboard");
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    let cancelled = false;

    const boot = async () => {
      const token = getAuthToken();
      if (!token) {
        if (!cancelled) setIsReady(true);
        return;
      }

      if (!cancelled) {
        setAuthData({ token, user: null });
      }

      await hydrateUser();

      if (!cancelled) setIsReady(true);
    };

    void boot();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty("--font-scale", String(fontScale));
  }, [fontScale]);

  const handleLogin = (token: string) => {
    setIsReady(false);
    setAuthData({ token, user: null });

    void (async () => {
      await hydrateUser();
      setIsReady(true);
    })();
  };

  const handleLogout = () => {
    logout();
    setAuthData({ user: null, token: null });
    setActiveSection("dashboard");
  };

  const authContextValue: AuthContextType = {
    user: authData.user,
    isAuthenticated: !!authData.token && !!authData.user,
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

  const secondaryLabel =
    authData.user?.specialty?.trim()
      ? authData.user.specialty
      : roleLabel(authData.user?.role ?? "professional");

  return (
    <AuthContext.Provider value={authContextValue}>
      <div className="app-root">
        <Sidebar activeSection={activeSection} onSelect={setActiveSection} />

        <main className="app-main">
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
            <div
              className="app-topbar-left"
              style={{ fontSize: 12, color: "#9ca3af" }}
            />

            <div
              className="app-topbar-right"
              style={{ display: "flex", alignItems: "center", gap: 12 }}
            >
              <div
                className="font-size-controls"
                aria-label="Ajustar tamaño de texto"
                style={{ display: "flex", alignItems: "center", gap: 4 }}
              >
                <button type="button" onClick={handleFontDecrease}>
                  A-
                </button>
                <button type="button" onClick={handleFontReset}>
                  A
                </button>
                <button type="button" onClick={handleFontIncrease}>
                  A+
                </button>
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
                  {secondaryLabel}
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
            {activeSection === "followup" && <FollowupCaseloadPage />}
          </div>
        </main>
      </div>
    </AuthContext.Provider>
  );
}

export default App;
