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
import { isRealAuth, GOOGLE_CLIENT_ID } from "@core/auth/authModeConfig";
import { PublicClientApplication } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { msalConfig } from "@core/auth/msalConfig";

// ── Initialize MSAL (only creates instance in real auth mode) ──
let msalInstance = null;
if (isRealAuth) {
  msalInstance = new PublicClientApplication(msalConfig);
}

// ── Conditional wrapper for OAuth providers ──
function AuthProviderWrapper({ children }) {
  if (!isRealAuth) return children;
  return (
    <MsalProvider instance={msalInstance}>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        {children}
      </GoogleOAuthProvider>
    </MsalProvider>
  );
}

async function bootstrap() {
  // Initialize MSAL and handle any pending redirect responses
  if (msalInstance) {
    await msalInstance.initialize();
    const response = await msalInstance.handleRedirectPromise();
    if (response?.account) {
      msalInstance.setActiveAccount(response.account);
    }
  }

  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <AuthProviderWrapper>
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
      </AuthProviderWrapper>
    </React.StrictMode>
  );
}

bootstrap();
