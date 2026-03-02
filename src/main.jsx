import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { SimDateProvider } from "./contexts/SimDateContext";
import { BadgeProvider } from "./contexts/BadgeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { PermissionProvider } from "./contexts/PermissionContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AgentConfigProvider } from "./contexts/AgentConfigContext";
import { TaskProvider } from "./contexts/TaskContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
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
    </ThemeProvider>
  </React.StrictMode>
);
