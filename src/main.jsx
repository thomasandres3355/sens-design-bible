import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { SimDateProvider } from "@core/simulation/SimDateContext";
import { BadgeProvider } from "@core/users/BadgeContext";
import { AuthProvider } from "@core/auth/AuthContext";
import { PermissionProvider } from "@core/permissions/PermissionContext";
import { ThemeProvider } from "@core/theme/ThemeContext";
import { AgentConfigProvider } from "@modules/ai-agents/AgentConfigContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <SimDateProvider>
          <BadgeProvider>
            <AgentConfigProvider>
              <PermissionProvider>
                <App />
              </PermissionProvider>
            </AgentConfigProvider>
          </BadgeProvider>
        </SimDateProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
