import { T } from "./theme";

// ═══ SSO PROVIDER CONFIGS ══════════════════════════════════════════════
export const SSO_PROVIDERS = [
  {
    id: "microsoft",
    label: "Sign in with Microsoft",
    color: "#2F6FBA",
    icon: "M1 1h10v10H1zm12 0h10v10H13zM1 13h10v10H1zm12 0h10v10H13z",
    mockDelay: 1800,
  },
  {
    id: "google",
    label: "Sign in with Google",
    color: "#ffffff",
    textColor: T.bg0,
    icon: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z M5.84 14.09a6.68 6.68 0 0 1 0-4.18V7.07H2.18a11 11 0 0 0 0 9.86l3.66-2.84z M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z",
    mockDelay: 1800,
  },
];

// ═══ MFA SETTINGS ═════════════════════════════════════════════════════
export const MFA_CONFIG = {
  codeLength: 6,
  resendDelay: 30,    // seconds before allowing resend
  mockAcceptAny: true, // demo mode: accept any 6-digit code
};

// ═══ SESSION CONFIG ═══════════════════════════════════════════════════
export const SESSION_CONFIG = {
  storageKey: "sens-auth-session",
  sessionDuration: 24 * 60 * 60 * 1000, // 24 hours
  rememberMeDuration: 30 * 24 * 60 * 60 * 1000, // 30 days
};

// ═══ MOCK DELAYS ═════════════════════════════════════════════════════
export const AUTH_DELAYS = {
  ssoRedirect: 1800,
  emailLogin: 1200,
  mfaVerify: 800,
  signOut: 400,
};

// ═══ AUTH METHODS ════════════════════════════════════════════════════
export const AUTH_METHODS = {
  MICROSOFT_SSO: "microsoft-sso",
  GOOGLE_SSO: "google-sso",
  EMAIL_PASSWORD: "email-password",
};
