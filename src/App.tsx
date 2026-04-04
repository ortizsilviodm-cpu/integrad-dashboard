/* integrad-dashboard/src/App.tsx */

import { useEffect, useMemo, useState, createContext, useContext } from "react";
import "./App.css";

//  NUEVO: Auth Keycloak (Sprint 53)
import { useAuth as useKeycloakAuth } from "./auth/AuthProvider";

// Theme
import { TOKENS } from "./theme/tokens";

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
import EducatorsPage from "./pages/EducatorsPage";
import { ClinicalSignalsPage } from "./pages/ClinicalSignalsPage";
import CaseloadPage from "./pages/CaseloadPage";

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

// ---------------------------------------------------------------------
// Auth Context (compatibilidad interna del Dashboard)
// ---------------------------------------------------------------------
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isReady: boolean;
  // login queda “noop” porque LoginPage dispara Keycloak directamente
  login: (_token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isReady: true,
  login: () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

// ---------------------------------------------------------------------
// Helpers: leer info mínima desde el JWT (sin validar firma, solo UI)
// ---------------------------------------------------------------------
type JwtPayload = {
  sub?: string;
  name?: string;
  preferred_username?: string;
  email?: string;
  realm_access?: { roles?: string[] };
};

function base64UrlDecode(input: string): string {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = normalized.length % 4;
  const padded = pad ? normalized + "=".repeat(4 - pad) : normalized;
  return atob(padded);
}

function safeParseJwtPayload(token: string | null): JwtPayload | null {
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const json = base64UrlDecode(parts[1]);
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

function mapTokenToUser(token: string | null): User | null {
  const p = safeParseJwtPayload(token);
  if (!p) return null;

  const roles = p.realm_access?.roles ?? [];
  const isAdmin = roles.includes("fhir-admin") || roles.includes("admin");

  const fullName =
    (p.name || "").trim() ||
    (p.preferred_username || "").trim() ||
    (p.email || "").trim() ||
    "Usuario";

  return {
    id: p.sub || "unknown",
    fullName,
    role: isAdmin ? "admin" : "professional",
    specialty: "",
  };
}

function roleLabel(role: User["role"]): string {
  return role === "admin" ? "Administrador" : "Profesional";
}

/* ------------------------------ */
/* Styles (unificados con TOKENS) */
/* ------------------------------ */

const TOPBAR_STYLE: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0.4rem 1.5rem",
  height: 50,
  backgroundColor: TOKENS.COLOR_CARD_BG,
  borderBottom: TOKENS.BORDER_DEFAULT,
};

const TOPBAR_LEFT_PLACEHOLDER_STYLE: React.CSSProperties = {
  fontSize: 12,
  color: "#9ca3af",
};

const TOPBAR_RIGHT_STYLE: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
};

const FONT_CONTROLS_STYLE: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 4,
};

const FONT_PERCENT_STYLE: React.CSSProperties = {
  marginLeft: 6,
  fontSize: 11,
  color: TOKENS.COLOR_TEXT_MUTED,
  minWidth: 52,
  textAlign: "right",
};

const DEMO_BUTTON_STYLE: React.CSSProperties = {
  padding: "4px 10px",
  borderRadius: 999,
  border: TOKENS.BORDER_DEFAULT,
  background: TOKENS.COLOR_CARD_BG,
  color: TOKENS.COLOR_PRIMARY,
  cursor: "pointer",
  fontWeight: 600,
  fontSize: 12,
};

const USER_AVATAR_STYLE: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: "999px",
  background: "linear-gradient(135deg, #f97316 0%, #ec4899 100%)",
  color: "#ffffff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 13,
  fontWeight: 600,
};

const USER_META_STYLE: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  lineHeight: 1.1,
};

const USER_NAME_STYLE: React.CSSProperties = {
  fontSize: 13,
};

const USER_ROLE_STYLE: React.CSSProperties = {
  fontSize: 11,
  color: TOKENS.COLOR_TEXT_MUTED,
};

const LOGOUT_BUTTON_STYLE: React.CSSProperties = {
  marginLeft: 4,
  border: "none",
  background: "transparent",
  color: "#c0392b",
  cursor: "pointer",
  fontSize: 12,
};

const CASELOAD_TEST_BUTTON_STYLE: React.CSSProperties = {
  position: "fixed",
  right: 20,
  bottom: 20,
  zIndex: 1000,
  padding: "10px 14px",
  borderRadius: 10,
  border: TOKENS.BORDER_DEFAULT,
  background: TOKENS.COLOR_CARD_BG,
  color: TOKENS.COLOR_PRIMARY,
  cursor: "pointer",
  fontWeight: 600,
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.12)",
};

function App() {
  // ✅ Auth desde Keycloak Provider
  const kc = useKeycloakAuth();

  const [activeSection, setActiveSection] = useState<
    SectionKey | "caseload"
  >("dashboard");

  // Accessibility: global font scale (1 = 100%)
  const [fontScale, setFontScale] = useState<number>(1);

  useEffect(() => {
    document.documentElement.style.setProperty("--font-scale", String(fontScale));
  }, [fontScale]);

  const handleFontIncrease = () =>
    setFontScale((prev) => Math.min(prev + 0.1, 1.5));
  const handleFontDecrease = () =>
    setFontScale((prev) => Math.max(prev - 0.1, 0.9));
  const handleFontReset = () => setFontScale(1);

  const fontScalePercentage = Math.round(fontScale * 100);

  // User mínimo desde el token (para topbar)
  const user = useMemo(() => mapTokenToUser(kc.token), [kc.token]);

  const authContextValue: AuthContextType = {
    user,
    isAuthenticated: kc.isAuthenticated,
    // No tenemos “ready” explícito; el provider hace init al cargar
    isReady: true,
    login: () => {},
    logout: () => {
      setActiveSection("dashboard");
      kc.logout();
    },
  };

  // Si no está autenticado → LoginPage (Keycloak)
  if (!kc.isAuthenticated) {
    return <LoginPage />;
  }

  const userInitials =
    user?.fullName
      .split(" ")
      .filter(Boolean)
      .map((p) => p[0])
      .slice(0, 2)
      .join("") ?? "";

  const secondaryLabel =
    user?.specialty?.trim()
      ? user.specialty
      : roleLabel(user?.role ?? "professional");

  return (
    <AuthContext.Provider value={authContextValue}>
      <div className="app-root">
        <Sidebar
          activeSection={activeSection as SectionKey}
          onSelect={setActiveSection as (section: SectionKey) => void}
        />

        <main className="app-main">
          <header className="app-topbar-minimal" style={TOPBAR_STYLE}>
            <div
              className="app-topbar-left"
              style={TOPBAR_LEFT_PLACEHOLDER_STYLE}
            />

            <div className="app-topbar-right" style={TOPBAR_RIGHT_STYLE}>
              <div
                className="font-size-controls"
                aria-label="Ajustar tamaño de texto"
                style={FONT_CONTROLS_STYLE}
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

                <span style={FONT_PERCENT_STYLE}>{fontScalePercentage}%</span>
              </div>

              {DEMO_MODE && (
                <button
                  onClick={() => setActiveSection("economicsDemo")}
                  style={DEMO_BUTTON_STYLE}
                >
                  Impacto Económico
                </button>
              )}

              <div style={USER_AVATAR_STYLE}>{userInitials}</div>

              <div style={USER_META_STYLE}>
                <strong style={USER_NAME_STYLE}>{user?.fullName}</strong>
                <span className="app-header-role" style={USER_ROLE_STYLE}>
                  {secondaryLabel}
                </span>
              </div>

              <button
                onClick={authContextValue.logout}
                className="logout-button"
                style={LOGOUT_BUTTON_STYLE}
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
            {activeSection === "clinicalSignals" && <ClinicalSignalsPage />}
            {activeSection === "dispenses" && <DispensesPage />}
            {activeSection === "ambulatory" && <AmbulatoryPage />}
            {activeSection === "audit" && <AuditPage />}
            {activeSection === "medications" && <MedicationsPage />}
            {activeSection === "settings" && <SettingsView />}
            {activeSection === "iaPredictiva" && <IAPredictivaPage />}
            {activeSection === "economicsDemo" && <EconomicsDemoView />}
            {activeSection === "followup" && <FollowupCaseloadPage />}
            {activeSection === "educators" && <EducatorsPage />}
            {activeSection === "caseload" && <CaseloadPage />}
          </div>

          <button
            type="button"
            style={CASELOAD_TEST_BUTTON_STYLE}
            onClick={() => setActiveSection("caseload")}
          >
            Ver Caseload
          </button>
        </main>
      </div>
    </AuthContext.Provider>
  );
}

export default App;