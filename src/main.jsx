// src/main.jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { initClient } from "./api/client";
import { AuthProvider } from "./store/auth.store.jsx";
import { OrganizationProvider } from "./store/organization.store.jsx";
import "./styles/global.css";
import "./styles/mobile/mobile.css";

initClient()
  .then((client) => {
    if (import.meta.env.DEV) {
      window.__client = client;
    }
  })
  .catch((err) => {
    console.error("[initClient] failed, falling back to no-op:", err);
  })
  .finally(() => {
    createRoot(document.getElementById("root")).render(
      <StrictMode>
        <AuthProvider>
          <OrganizationProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </OrganizationProvider>
        </AuthProvider>
      </StrictMode>
    );
  });