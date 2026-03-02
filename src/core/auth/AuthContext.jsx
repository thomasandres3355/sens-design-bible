import { createContext, useContext, useState, useCallback, useMemo } from "react";
import { BADGE_USERS, addProductionUser } from "@core/users/badgeData";
import { SESSION_CONFIG, AUTH_DELAYS, AUTH_METHODS } from "./authData";
import { isRealAuth } from "./authModeConfig";
import { loginRequest } from "./msalConfig";

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
export const AuthProvider = ({ children, msalInstance }) => {
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

  // ── Shared: resolve OAuth email to BADGE_USERS ──
  // In production, if no users exist, auto-bootstrap the first SSO user as admin
  const resolveOrBootstrapUser = useCallback((email, name) => {
    if (!email) return null;
    const existing = BADGE_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) return existing;

    // Production bootstrap: first user becomes CEO/admin
    if (isRealAuth && BADGE_USERS.length === 0 && name) {
      const id = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "-");
      const bootstrapUser = {
        id,
        name,
        role: "CEO",
        department: "Executive",
        email,
        reportsTo: null,
        overrides: [],
      };
      addProductionUser(bootstrapUser);
      return bootstrapUser;
    }

    return null;
  }, []);

  // ── Shared: complete login ──
  const completeLogin = useCallback((userId, method) => {
    setCurrentUserId(userId);
    setAuthMethod(method);
    setIsAuthenticated(true);
    setLoginStep(LOGIN_STEPS.CHOOSE_METHOD);
    setSsoProvider(null);
    setPendingEmail(null);
    setLoginError(null);
    saveSession(userId, method);
  }, []);

  // ══════════════════════════════════════════════════
  //  REAL AUTH FLOW (production — Microsoft MSAL)
  // ══════════════════════════════════════════════════

  const startRealMicrosoftLogin = useCallback(async () => {
    if (!msalInstance) return;
    setLoginError(null);
    setSsoProvider("microsoft");
    setLoginStep(LOGIN_STEPS.SSO_LOADING);

    try {
      const response = await msalInstance.loginPopup(loginRequest);
      if (response?.account) {
        const email = response.account.username;
        const user = resolveOrBootstrapUser(email, response.account.name);
        if (user) {
          completeLogin(user.id, AUTH_METHODS.MICROSOFT_SSO);
        } else {
          setLoginError(`Account ${email} is not registered in the platform. Contact your administrator.`);
          setLoginStep(LOGIN_STEPS.CHOOSE_METHOD);
          setSsoProvider(null);
        }
      }
    } catch (error) {
      if (error.errorCode === "user_cancelled") {
        setLoginStep(LOGIN_STEPS.CHOOSE_METHOD);
        setSsoProvider(null);
      } else {
        console.error("Microsoft login error:", error);
        setLoginError(error.message || "Microsoft login failed");
        setLoginStep(LOGIN_STEPS.CHOOSE_METHOD);
        setSsoProvider(null);
      }
    }
  }, [msalInstance, resolveOrBootstrapUser, completeLogin]);

  // ══════════════════════════════════════════════════
  //  MOCK AUTH FLOWS (development — unchanged)
  // ══════════════════════════════════════════════════

  const startMockSsoLogin = useCallback((providerId) => {
    setLoginError(null);
    setSsoProvider(providerId);
    setLoginStep(LOGIN_STEPS.SSO_LOADING);
    setTimeout(() => {
      setLoginStep(LOGIN_STEPS.SSO_ACCOUNT_PICKER);
    }, AUTH_DELAYS.ssoRedirect);
  }, []);

  const selectSsoAccount = useCallback((userId) => {
    const method = ssoProvider === "microsoft" ? AUTH_METHODS.MICROSOFT_SSO : AUTH_METHODS.GOOGLE_SSO;
    completeLogin(userId, method);
  }, [ssoProvider, completeLogin]);

  // ── Router: delegates to real or mock ──
  const startSsoLogin = useCallback((providerId) => {
    if (isRealAuth && providerId === "microsoft") {
      startRealMicrosoftLogin();
    } else if (!isRealAuth) {
      startMockSsoLogin(providerId);
    }
  }, [startRealMicrosoftLogin, startMockSsoLogin]);

  // ── Email + Password Flow (mock only — stays unchanged) ──
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

  // ── MFA Verification (mock only) ──
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
    completeLogin(user.id, AUTH_METHODS.EMAIL_PASSWORD);
  }, [pendingEmail, completeLogin]);

  // ── Sign Out ──
  const signOut = useCallback(() => {
    if (isRealAuth && msalInstance) {
      const accounts = msalInstance.getAllAccounts();
      if (accounts.length > 0) {
        msalInstance.logoutPopup({ account: accounts[0] }).catch(() => {});
      }
    }
    setIsAuthenticated(false);
    setCurrentUserId(null);
    setAuthMethod(null);
    setLoginStep(LOGIN_STEPS.CHOOSE_METHOD);
    setLoginError(null);
    setSsoProvider(null);
    setPendingEmail(null);
    clearSession();
  }, [msalInstance]);

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
    isRealAuth,
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
