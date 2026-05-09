/*integrad-dashboard\src\auth\AuthProvider.tsx*/
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { keycloak } from "./keycloak";
import { setAuthToken, clearAuthToken } from "../store/authStore";

type AuthContextType = {
  isAuthenticated: boolean;
  token: string | null;
  login: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    let intervalId: number | null = null;

    const stopRefresh = () => {
      if (intervalId != null) {
        window.clearInterval(intervalId);
        intervalId = null;
      }
    };

    keycloak
      .init({
        onLoad: "check-sso",
        pkceMethod: "S256",
        checkLoginIframe: false,
      })
        .then((auth) => {
          setIsAuthenticated(auth);

          const t = keycloak.token ?? null;
          setToken(t);
          setAuthToken(t);

        intervalId = window.setInterval(() => {
          if (!keycloak.token) return;

          keycloak
            .updateToken(30)
              .then(() => {
                const newToken = keycloak.token ?? null;
                setToken(newToken);
                setAuthToken(newToken);
              })
              .catch(() => {
                setIsAuthenticated(false);
                setToken(null);
                clearAuthToken();
              });
        }, 10_000);
      })
      .catch(() => {
        setIsAuthenticated(false);
        setToken(null);
        clearAuthToken();
      });

    keycloak.onTokenExpired = () => {
      setIsAuthenticated(false);
      setToken(null);
      clearAuthToken();
      stopRefresh();
    };

    return () => stopRefresh();
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      isAuthenticated,
      token,
      login: () =>
        keycloak.login({
          redirectUri: window.location.origin,
        }),
      logout: () => {
        setIsAuthenticated(false);
        setToken(null);
        clearAuthToken();
        return keycloak.logout({ redirectUri: window.location.origin });
      },
    }),
    [isAuthenticated, token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
