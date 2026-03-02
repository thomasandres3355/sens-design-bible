import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { SimDateProvider } from "@core/simulation/SimDateContext";
import { BadgeProvider } from "@core/users/BadgeContext";
import { AuthProvider } from "@core/auth/AuthContext";
import { PermissionProvider } from "@core/permissions/PermissionContext";
import { ThemeProvider } from "@core/theme/ThemeContext";
import { MobileProvider } from "@core/mobile/MobileContext";
import { AgentConfigProvider } from "@modules/ai-agents/AgentConfigContext";
import { TaskProvider } from "@core/tasks/TaskContext";
import { isRealAuth } from "@core/auth/authModeConfig";
import { PublicClientApplication } from "@azure/msal-browser";
import { msalConfig } from "@core/auth/msalConfig";

// ── Initialize MSAL (only creates instance in real auth mode) ──
let msalInstance = null;
if (isRealAuth) {
  msalInstance = new PublicClientApplication(msalConfig);
}

async function bootstrap() {
  // Initialize MSAL — catch errors so the app still renders
  if (msalInstance) {
    try {
      await msalInstance.initialize();
      const response = await msalInstance.handleRedirectPromise();
      if (response?.account) {
        msalInstance.setActiveAccount(response.account);
      }
    } catch (err) {
      console.error("[MSAL] Initialization failed:", err);
    }
  }

  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <ThemeProvider>
        <MobileProvider>
        <AuthProvider msalInstance={msalInstance}>
          <SimDateProvider>
            <TaskProvider>
            <BadgeProvider>
              <AgentConfigProvider>
                <PermissionProvider>
                  <App />
                </PermissionProvider>
              </AgentConfigProvider>
            </BadgeProvider>
            </TaskProvider>
          </SimDateProvider>
        </AuthProvider>
        </MobileProvider>
      </ThemeProvider>
    </React.StrictMode>
  );
}

bootstrap().catch((err) => {
  console.error("[App] Bootstrap failed:", err);
  document.getElementById("root").innerHTML =
    '<div style="color:#fff;padding:40px;font-family:system-ui">' +
    '<h2>Failed to load application</h2>' +
    '<p style="color:#aaa;margin-top:8px">' + err.message + '</p></div>';
});
