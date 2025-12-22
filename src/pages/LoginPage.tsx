/* integrad-dashboard/src/pages/LoginPage.tsx */

import React, { useEffect, useState } from "react";
import { login } from "../api/auth";
import logo from "../assets/logo-integrad-full-color.png";

interface LoginPageProps {
  onSuccessfulLogin: (token: string) => void;
}

interface LoginCredentials {
  email: string;
  password: string;
}

const LoginPage: React.FC<LoginPageProps> = ({ onSuccessfulLogin }) => {
  const [form, setForm] = useState<LoginCredentials>({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    const expired = sessionStorage.getItem("auth_expired");
    if (expired) {
      setSessionExpired(true);
      sessionStorage.removeItem("auth_expired");
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const canSubmit = form.email.trim().length > 0 && form.password.length > 0;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!canSubmit) {
      setError("Ingresá email y contraseña.");
      return;
    }

    setLoading(true);

    try {
      const result = await login({
        email: form.email.trim(),
        password: form.password,
      });

      if (!result.ok || !result.data?.token) {
        setError(
          result.error ||
            "No se pudo iniciar sesión. Verificá tus credenciales."
        );
        return;
      }

      const token = result.data.token;
      onSuccessfulLogin(token);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error inesperado. Intentá nuevamente."
      );
    } finally {
      setLoading(false);
    }
  };

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
            Iniciá sesión para acceder al panel clínico y al módulo de
            seguimiento.
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

        {error && (
          <div
            style={{
              marginBottom: "1.5rem",
              padding: "0.8rem 1rem",
              borderRadius: 8,
              backgroundColor: "#fef2f2",
              color: "#b91c1c",
              border: "1px solid #fca5a5",
              fontSize: "0.9rem",
              fontWeight: 500,
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1.25rem" }}>
            <label
              htmlFor="email"
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontSize: "0.9rem",
                fontWeight: 600,
                color: "#374151",
              }}
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Ingresá tu email"
              required
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                fontSize: "0.95rem",
              }}
            />
          </div>

          <div style={{ marginBottom: "2rem" }}>
            <label
              htmlFor="password"
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontSize: "0.9rem",
                fontWeight: 600,
                color: "#374151",
              }}
            >
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={handleChange}
              placeholder="Ingresá tu contraseña"
              required
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                fontSize: "0.95rem",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !canSubmit}
            style={{
              width: "100%",
              padding: "0.8rem 1rem",
              borderRadius: 8,
              border: "none",
              backgroundColor: loading || !canSubmit ? "#9ca3af" : "#2563eb",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: "1rem",
              cursor: loading || !canSubmit ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Ingresando..." : "Iniciar sesión"}
          </button>
        </form>

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
