/* integrad-dashboard/src/pages/LoginPage.tsx */

import React, { useEffect, useState } from "react";
import logo from "../assets/logo-integrad-full-color.png";
import { useAuth } from "../auth/AuthProvider";

const LoginPage: React.FC = () => {
  const { isAuthenticated, login } = useAuth();
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    const expired = sessionStorage.getItem("auth_expired");
    if (expired) {
      setSessionExpired(true);
      sessionStorage.removeItem("auth_expired");
    }
  }, []);

  // Si ya está autenticado, redirigimos al home (o a /patients si usás router)
  useEffect(() => {
    if (!isAuthenticated) return;

    // Ajustá esta ruta si tu app tiene routing específico
    // - Si usás React Router, conviene usar navigate().
    window.location.href = "/";
  }, [isAuthenticated]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(135deg, #0f172a 0%, #1d3557 40%, #457b9d 100%)",
        padding: "1rem",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          backgroundColor: "#ffffff",
          borderRadius: 12,
          padding: "2.5rem",
          boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.4)",
        }}
      >
        <header style={{ marginBottom: "2rem", textAlign: "center" }}>
          <img
            src={logo}
            alt="Logo IntegraD"
            style={{ height: 40, marginBottom: "1rem" }}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src =
                "https://placehold.co/200x40/2563eb/ffffff?text=IntegraD";
            }}
          />
          <h1
            style={{
              margin: 0,
              fontSize: "1.75rem",
              fontWeight: 700,
              color: "#111827",
            }}
          >
            Acceso Profesional
          </h1>
          <p
            style={{
              marginTop: "0.5rem",
              fontSize: "0.95rem",
              color: "#6b7280",
            }}
          >
            Iniciá sesión con tu cuenta institucional (Keycloak) para acceder al
            panel clínico.
          </p>
        </header>

        {sessionExpired && (
          <div
            style={{
              marginBottom: "1.5rem",
              padding: "0.8rem 1rem",
              borderRadius: 8,
              backgroundColor: "#fffbeb",
              color: "#92400e",
              border: "1px solid #fde68a",
              fontSize: "0.9rem",
              fontWeight: 500,
            }}
          >
            Tu sesión expiró. Iniciá sesión nuevamente.
          </div>
        )}

        <button
          type="button"
          onClick={login}
          style={{
            width: "100%",
            padding: "0.8rem 1rem",
            borderRadius: 8,
            border: "none",
            backgroundColor: "#2563eb",
            color: "#ffffff",
            fontWeight: 700,
            fontSize: "1rem",
            cursor: "pointer",
          }}
        >
          Iniciar sesión (Keycloak)
        </button>

        <p
          style={{
            marginTop: "2rem",
            fontSize: "0.75rem",
            color: "#9ca3af",
            textAlign: "center",
          }}
        >
          IntegraD no reemplaza el criterio clínico. El acceso es exclusivo para
          equipos de salud autorizados.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;