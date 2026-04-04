/* integrad-dashboard/src/main.tsx */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

// Sprint 53: Auth provider (Keycloak / token)
import { AuthProvider } from "./auth/AuthProvider";
import { initializeAuthStore } from "./store/authStore";

initializeAuthStore();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);