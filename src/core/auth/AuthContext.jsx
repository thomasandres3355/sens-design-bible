import { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react";
import { BADGE_USERS } from "@core/users/badgeData";
import { SESSION_CONFIG, AUTH_DELAYS, AUTH_METHODS } from "./authData";

const AuthContext = createContext(null);

// ═══ SESSION PERSISTENCE ═══════════════════════════════════════════════
function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_CONFIG.storageKey);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (Date.now() > session.expiresAt) {
      localStorage.removeItem(SESSION_CONFIG.storageKey);
      return null;
    }
    // Verify user still exists
    const user = BADGE_USERS.find((u) => u.id === session.userId);
    if (!user) return null;
    return session;
  } catch {
    return null;
  }
}

function saveSession(userId, authMethod, rememberMe = false) {
  const duration = rememberMe ? SESSION_CONFIG.rememberMeDuration : SESSION_CONFIG.sessionDuration;
  const session = {
    userId,
    authMethod,
    authenticatedAt: Date.now(),
    expiresAt: Date.now() + duration,
  };
  localStorage.setItem(SESSION_CONFIG.storageKey, JSON.stringify(session));
}

function clearSession() {
  localStorage.removeItem(SESSION_CONFIG.storageKey);
}

// ═══ LOGIN STEPS ═══════════════════════════════════════════════════════
export const LOGIN_STEPS = {
  CHOOSE_METHOD: "choose-method",
  SSO_LOADING: "sso-loading",
  SSO_ACCOUNT_PICKER: "sso-account-picker",
  EMAIL_FORM: "email-form",
  MFA_VERIFY: "mfa-verify",
};

// ═══ AUTH PROVIDER ═══════════════════════════════════════════════════════
export const AuthProvider = ({ children }) => {
  const existingSession = loadSession();

  const [isAuthenticated, setIsAuthenticated] = useState(!!existingSession);
  const [currentUserId, setCurrentUserId] = useState(existingSession?.userId || null);
  const [authMethod, setAuthMethod] = useState(existingSession?.authMethod || null);
  const [loginStep, setLoginStep] = useState(LOGIN_STEPS.CHOOSE_METHOD);
  const [loginError, setLoginError] = useState(null);
  const [ssoProvider, setSsoProvider] = useState(null);
  const [pendingEmail, setPendingEmail] = useState(null);

  const currentUser = useMemo(
    () => (currentUserId ? BADGE_USERS.find((u) => u.id === currentUserId) : null),
    [currentUserId]
  );

  // ── SSO Login Flow ──
  const startSsoLogin = useCallback((providerId) => {
    setLoginError(null);
    setSsoProvider(providerId);
    setLoginStep(LOGIN_STEPS.SSO_LOADING);

    setTimeout(() => {
      setLoginStep(LOGIN_STEPS.SSO_ACCOUNT_PICKER);
    }, AUTH_DELAYS.ssoRedirect);
  }, []);

  const selectSsoAccount = useCallback((userId) => {
    const method = ssoProvider === "microsoft" ? AUTH_METHODS.MICROSOFT_SSO : AUTH_METHODS.GOOGLE_SSO;
    setCurrentUserId(userId);
    setAuthMethod(method);
    setIsAuthenticated(true);
    setLoginStep(LOGIN_STEPS.CHOOSE_METHOD);
    setSsoProvider(null);
    saveSession(userId, method);
  }, [ssoProvider]);

  // ── Email + Password Flow ──
  const submitEmailLogin = useCallback((email) => {
    setLoginError(null);
    const user = BADGE_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      setLoginError("No account found with that email address");
      return;
    }
    setPendingEmail(email);
    setLoginStep(LOGIN_STEPS.MFA_VERIFY);
  }, []);

  // ── MFA Verification ──
  const verifyMfa = useCallback((code) => {
    setLoginError(null);
    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      setLoginError("Please enter a valid 6-digit code");
      return;
    }
    const user = BADGE_USERS.find((u) => u.email.toLowerCase() === pendingEmail?.toLowerCase());
    if (!user) {
      setLoginError("Session expired. Please try again.");
      setLoginStep(LOGIN_STEPS.CHOOSE_METHOD);
      return;
    }
    setCurrentUserId(user.id);
    setAuthMethod(AUTH_METHODS.EMAIL_PASSWORD);
    setIsAuthenticated(true);
    setLoginStep(LOGIN_STEPS.CHOOSE_METHOD);
    setPendingEmail(null);
    saveSession(user.id, AUTH_METHODS.EMAIL_PASSWORD);
  }, [pendingEmail]);

  // ── Sign Out ──
  const signOut = useCallback(() => {
    setIsAuthenticated(false);
    setCurrentUserId(null);
    setAuthMethod(null);
    setLoginStep(LOGIN_STEPS.CHOOSE_METHOD);
    setLoginError(null);
    setSsoProvider(null);
    setPendingEmail(null);
    clearSession();
  }, []);

  // ── Go back in login flow ──
  const goBackToLogin = useCallback(() => {
    setLoginStep(LOGIN_STEPS.CHOOSE_METHOD);
    setLoginError(null);
    setSsoProvider(null);
    setPendingEmail(null);
  }, []);

  const value = useMemo(() => ({
    isAuthenticated,
    currentUser,
    currentUserId,
    authMethod,
    loginStep,
    loginError,
    ssoProvider,
    pendingEmail,
    startSsoLogin,
    selectSsoAccount,
    submitEmailLogin,
    verifyMfa,
    signOut,
    goBackToLogin,
    setLoginStep,
  }), [
    isAuthenticated, currentUser, currentUserId, authMethod,
    loginStep, loginError, ssoProvider, pendingEmail,
    startSsoLogin, selectSsoAccount, submitEmailLogin,
    verifyMfa, signOut, goBackToLogin,
  ]);

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
