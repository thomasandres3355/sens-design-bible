import { LogLevel } from "@azure/msal-browser";

const clientId = import.meta.env.VITE_MICROSOFT_CLIENT_ID;
const tenantId = import.meta.env.VITE_MICROSOFT_TENANT_ID;
const redirectUri = import.meta.env.VITE_MICROSOFT_REDIRECT_URI || window.location.origin;

export const msalConfig = {
  auth: {
    clientId,
    authority: `https://login.microsoftonline.com/${tenantId}`,
    redirectUri,
    postLogoutRedirectUri: redirectUri,
    navigateToLoginRequestUrl: true,
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        if (level === LogLevel.Error) console.error("[MSAL]", message);
      },
      logLevel: LogLevel.Warning,
    },
  },
};

export const loginRequest = {
  scopes: ["User.Read", "openid", "profile", "email"],
};
