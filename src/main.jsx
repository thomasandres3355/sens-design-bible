import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { SimDateProvider } from "./contexts/SimDateContext";
import { BadgeProvider } from "./contexts/BadgeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { PermissionProvider } from "./contexts/PermissionContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { MobileProvider } from "./contexts/MobileContext";
import { AgentConfigProvider } from "./contexts/AgentConfigContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <MobileProvider>
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
      </MobileProvider>
    </ThemeProvider>
  </React.StrictMode>
);
