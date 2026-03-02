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

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <MobileProvider>
      <AuthProvider>
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
