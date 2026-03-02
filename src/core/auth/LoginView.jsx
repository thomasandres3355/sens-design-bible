import { useState, useEffect, useRef } from "react";
import { T } from "@core/theme/theme";
import { SSO_PROVIDERS, MFA_CONFIG } from "./authData";
import { BADGE_USERS } from "@core/users/badgeData";
import { useAuth, LOGIN_STEPS } from "./AuthContext";
import sensLogo from "../../assets/SENS Logo-White copy.png";

/* ─────────────────────────────────────────────
   Login View — Full-screen branded login
   4 flows: Microsoft SSO, Google SSO, Email+Password, 2FA
   ───────────────────────────────────────────── */

// ── Shared input style ──
const inputStyle = {
  width: "100%",
  background: T.bg0,
  border: `1px solid ${T.border}`,
  borderRadius: 8,
  padding: "12px 14px",
  color: T.text,
  fontSize: 13,
  outline: "none",
  fontFamily: "inherit",
  boxSizing: "border-box",
};

// ── Microsoft Icon ──
const MicrosoftIcon = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <rect x="1" y="1" width="10" height="10" fill="#F25022" />
    <rect x="13" y="1" width="10" height="10" fill="#7FBA00" />
    <rect x="1" y="13" width="10" height="10" fill="#00A4EF" />
    <rect x="13" y="13" width="10" height="10" fill="#FFB900" />
  </svg>
);

// ── Google Icon ──
const GoogleIcon = () => (
  <svg width={18} height={18} viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09a6.68 6.68 0 0 1 0-4.18V7.07H2.18a11 11 0 0 0 0 9.86l3.66-2.84z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

export default function LoginView() {
  const {
    loginStep, loginError, ssoProvider,
    startSsoLogin, selectSsoAccount, submitEmailLogin,
    verifyMfa, goBackToLogin, setLoginStep,
  } = useAuth();

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <div style={{
      position: "fixed", inset: 0, background: T.bg0, display: "flex",
      fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif",
      opacity: mounted ? 1 : 0, transition: "opacity .5s ease",
    }}>
      {/* Accent bar */}
      <div style={{ width: 3, background: T.accent, flexShrink: 0 }} />

      {/* Center content */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{
          width: 420, background: T.bg1, borderRadius: 16,
          boxShadow: "0 8px 32px rgba(0,0,0,.4), 0 2px 8px rgba(0,0,0,.2)",
          border: `1px solid ${T.border}`, overflow: "hidden",
        }}>
          {/* Header */}
          <div style={{ padding: "32px 36px 24px", textAlign: "center", borderBottom: `1px solid ${T.border}` }}>
            <img src={sensLogo} alt="SENS" style={{ height: 38, objectFit: "contain", marginBottom: 16 }} />
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: T.text, letterSpacing: 0.5 }}>Executive Intelligence Platform</h1>
          </div>

          {/* Body */}
          <div style={{ padding: "28px 36px 36px" }}>
            {loginStep === LOGIN_STEPS.CHOOSE_METHOD && <ChooseMethodPanel />}
            {loginStep === LOGIN_STEPS.SSO_LOADING && <SsoLoadingPanel provider={ssoProvider} />}
            {loginStep === LOGIN_STEPS.SSO_ACCOUNT_PICKER && <SsoAccountPicker provider={ssoProvider} onSelect={selectSsoAccount} onBack={goBackToLogin} />}
            {loginStep === LOGIN_STEPS.EMAIL_FORM && <EmailFormPanel onSubmit={submitEmailLogin} onBack={goBackToLogin} error={loginError} />}
            {loginStep === LOGIN_STEPS.MFA_VERIFY && <MfaVerifyPanel onVerify={verifyMfa} onBack={goBackToLogin} error={loginError} />}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        position: "fixed", bottom: 16, left: 0, right: 0, textAlign: "center",
        fontSize: 11, color: T.textDim,
      }}>
        Systemic Environmental Solutions &middot; v4.0
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════
//  Step 1: Choose Login Method
// ═══════════════════════════════════════════════
function ChooseMethodPanel() {
  const { startSsoLogin, setLoginStep } = useAuth();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* SSO Buttons */}
      <SsoButton
        icon={<MicrosoftIcon />}
        label="Sign in with Microsoft"
        bgColor="#2F6FBA"
        textColor="#fff"
        onClick={() => startSsoLogin("microsoft")}
      />
      <SsoButton
        icon={<GoogleIcon />}
        label="Sign in with Google"
        bgColor="#ffffff"
        textColor="#333"
        onClick={() => startSsoLogin("google")}
      />

      {/* Divider */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "8px 0" }}>
        <div style={{ flex: 1, height: 1, background: T.border }} />
        <span style={{ fontSize: 11, color: T.textDim, whiteSpace: "nowrap" }}>or sign in with email</span>
        <div style={{ flex: 1, height: 1, background: T.border }} />
      </div>

      {/* Email option */}
      <button
        onClick={() => setLoginStep(LOGIN_STEPS.EMAIL_FORM)}
        style={{
          width: "100%", padding: "12px 16px", borderRadius: 8,
          border: `1px solid ${T.border}`, background: T.bg2, color: T.text,
          fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          transition: "border-color .15s",
        }}
        onMouseEnter={(e) => e.currentTarget.style.borderColor = T.accent}
        onMouseLeave={(e) => e.currentTarget.style.borderColor = T.border}
      >
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={T.textMid} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <path d="M22 6l-10 7L2 6" />
        </svg>
        Sign in with Email
      </button>

      {/* Demo hint */}
      <div style={{ marginTop: 8, padding: "10px 14px", borderRadius: 8, background: T.accent + "08", border: `1px solid ${T.accent}20` }}>
        <div style={{ fontSize: 11, color: T.accent, fontWeight: 600, marginBottom: 4 }}>Demo Mode</div>
        <div style={{ fontSize: 11, color: T.textDim, lineHeight: 1.5 }}>
          SSO will show an account picker with all demo users. Email login accepts any registered email with any password.
        </div>
      </div>
    </div>
  );
}

// ── SSO Button ──
function SsoButton({ icon, label, bgColor, textColor, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: "100%", padding: "12px 16px", borderRadius: 8,
        border: bgColor === "#ffffff" ? `1px solid ${T.border}` : "none",
        background: bgColor, color: textColor,
        fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
        opacity: hover ? 0.9 : 1, transition: "opacity .15s",
      }}
    >
      {icon}
      {label}
    </button>
  );
}


// ═══════════════════════════════════════════════
//  Step 2a: SSO Loading (simulated redirect)
// ═══════════════════════════════════════════════
function SsoLoadingPanel({ provider }) {
  const providerLabel = provider === "microsoft" ? "Microsoft" : "Google";
  const providerColor = provider === "microsoft" ? "#2F6FBA" : "#4285F4";

  return (
    <div style={{ textAlign: "center", padding: "20px 0" }}>
      {/* Spinner */}
      <div style={{ marginBottom: 20 }}>
        <div style={{
          width: 40, height: 40, border: `3px solid ${T.border}`,
          borderTop: `3px solid ${providerColor}`, borderRadius: "50%",
          margin: "0 auto",
          animation: "spin 1s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
      <div style={{ fontSize: 14, color: T.text, fontWeight: 600 }}>Redirecting to {providerLabel}...</div>
      <div style={{ fontSize: 12, color: T.textDim, marginTop: 6 }}>Please wait while we connect to your account</div>
    </div>
  );
}


// ═══════════════════════════════════════════════
//  Step 2b: SSO Account Picker
// ═══════════════════════════════════════════════
function SsoAccountPicker({ provider, onSelect, onBack }) {
  const providerLabel = provider === "microsoft" ? "Microsoft" : "Google";
  const providerColor = provider === "microsoft" ? "#2F6FBA" : "#4285F4";

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 14, color: T.text, fontWeight: 600 }}>Pick an account</div>
        <div style={{ fontSize: 12, color: T.textDim, marginTop: 4 }}>to continue to Executive Intelligence Platform via {providerLabel}</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 340, overflowY: "auto" }}>
        {BADGE_USERS.map((user) => (
          <AccountRow key={user.id} user={user} color={providerColor} onClick={() => onSelect(user.id)} />
        ))}
      </div>

      <button onClick={onBack} style={{
        width: "100%", marginTop: 16, padding: "10px", borderRadius: 8,
        border: `1px solid ${T.border}`, background: "transparent",
        color: T.textMid, fontSize: 12, cursor: "pointer", fontFamily: "inherit",
      }}>
        &larr; Back to sign in options
      </button>
    </div>
  );
}

function AccountRow({ user, color, onClick }) {
  const [hover, setHover] = useState(false);
  const initials = user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: "100%", padding: "10px 14px", borderRadius: 8,
        border: `1px solid ${hover ? color + "50" : T.border}`,
        background: hover ? T.bg3 : T.bg2,
        cursor: "pointer", fontFamily: "inherit",
        display: "flex", alignItems: "center", gap: 12,
        transition: "all .15s", textAlign: "left",
      }}
    >
      <div style={{
        width: 34, height: 34, borderRadius: "50%",
        background: color + "20", color, border: `1.5px solid ${color}40`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 12, fontWeight: 700, flexShrink: 0,
      }}>
        {initials}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</div>
        <div style={{ fontSize: 11, color: T.textDim, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</div>
      </div>
      <div style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: T.bg0, color: T.textMid, fontWeight: 500, flexShrink: 0 }}>
        {user.role}
      </div>
    </button>
  );
}


// ═══════════════════════════════════════════════
//  Step 3: Email + Password Form
// ═══════════════════════════════════════════════
function EmailFormPanel({ onSubmit, onBack, error }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setTimeout(() => {
      onSubmit(email.trim());
      setLoading(false);
    }, 1200);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ textAlign: "center", marginBottom: 4 }}>
        <div style={{ fontSize: 14, color: T.text, fontWeight: 600 }}>Sign in with Email</div>
        <div style={{ fontSize: 12, color: T.textDim, marginTop: 4 }}>Enter your SENS email and password</div>
      </div>

      <div>
        <label style={{ fontSize: 11, color: T.textMid, fontWeight: 500, marginBottom: 6, display: "block" }}>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@systemicenvs.com"
          autoFocus
          style={inputStyle}
          onFocus={(e) => e.currentTarget.style.borderColor = T.accent}
          onBlur={(e) => e.currentTarget.style.borderColor = T.border}
        />
      </div>

      <div>
        <label style={{ fontSize: 11, color: T.textMid, fontWeight: 500, marginBottom: 6, display: "block" }}>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          style={inputStyle}
          onFocus={(e) => e.currentTarget.style.borderColor = T.accent}
          onBlur={(e) => e.currentTarget.style.borderColor = T.border}
        />
      </div>

      {error && (
        <div style={{ padding: "10px 14px", borderRadius: 8, background: T.danger + "15", border: `1px solid ${T.danger}30`, fontSize: 12, color: T.danger }}>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !email.trim()}
        style={{
          width: "100%", padding: "12px", borderRadius: 8, border: "none",
          background: loading ? T.bg3 : T.accent, color: loading ? T.textMid : "#1A1A1A",
          fontSize: 13, fontWeight: 600, cursor: loading ? "default" : "pointer",
          fontFamily: "inherit", transition: "background .15s",
        }}
      >
        {loading ? "Verifying..." : "Sign In"}
      </button>

      <button type="button" onClick={onBack} style={{
        width: "100%", padding: "10px", borderRadius: 8,
        border: `1px solid ${T.border}`, background: "transparent",
        color: T.textMid, fontSize: 12, cursor: "pointer", fontFamily: "inherit",
      }}>
        &larr; Back to sign in options
      </button>

      {/* Demo hint */}
      <div style={{ fontSize: 11, color: T.textDim, textAlign: "center", lineHeight: 1.5 }}>
        Demo: Use any registered user email (e.g. thomas@systemicenvs.com) with any password
      </div>
    </form>
  );
}


// ═══════════════════════════════════════════════
//  Step 4: MFA / 2FA Verification
// ═══════════════════════════════════════════════
function MfaVerifyPanel({ onVerify, onBack, error }) {
  const { pendingEmail } = useAuth();
  const [code, setCode] = useState(Array(MFA_CONFIG.codeLength).fill(""));
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(MFA_CONFIG.resendDelay);
  const inputRefs = useRef([]);

  // Resend countdown
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((p) => p - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  // Auto-focus first input
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleDigitChange = (index, value) => {
    if (value && !/^\d$/.test(value)) return;
    const next = [...code];
    next[index] = value;
    setCode(next);

    // Auto-advance
    if (value && index < MFA_CONFIG.codeLength - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits entered
    if (value && next.every((d) => d)) {
      setLoading(true);
      setTimeout(() => {
        onVerify(next.join(""));
        setLoading(false);
      }, 800);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, MFA_CONFIG.codeLength);
    if (pasted.length === MFA_CONFIG.codeLength) {
      e.preventDefault();
      const next = pasted.split("");
      setCode(next);
      inputRefs.current[MFA_CONFIG.codeLength - 1]?.focus();
      setLoading(true);
      setTimeout(() => {
        onVerify(next.join(""));
        setLoading(false);
      }, 800);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
      {/* Lock icon */}
      <div style={{
        width: 48, height: 48, borderRadius: "50%",
        background: T.accent + "15", border: `2px solid ${T.accent}30`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={T.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </div>

      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 14, color: T.text, fontWeight: 600 }}>Two-Factor Authentication</div>
        <div style={{ fontSize: 12, color: T.textDim, marginTop: 4 }}>
          Enter the 6-digit code sent to <span style={{ color: T.textMid }}>{pendingEmail}</span>
        </div>
      </div>

      {/* Code inputs */}
      <div style={{ display: "flex", gap: 8 }} onPaste={handlePaste}>
        {code.map((digit, i) => (
          <input
            key={i}
            ref={(el) => (inputRefs.current[i] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleDigitChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            style={{
              width: 44, height: 52, textAlign: "center",
              background: T.bg0, border: `2px solid ${digit ? T.accent : T.border}`,
              borderRadius: 10, color: T.text, fontSize: 20, fontWeight: 700,
              outline: "none", fontFamily: "inherit",
              transition: "border-color .15s",
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = T.accent}
            onBlur={(e) => e.currentTarget.style.borderColor = digit ? T.accent : T.border}
          />
        ))}
      </div>

      {error && (
        <div style={{ padding: "10px 14px", borderRadius: 8, background: T.danger + "15", border: `1px solid ${T.danger}30`, fontSize: 12, color: T.danger, width: "100%", textAlign: "center" }}>
          {error}
        </div>
      )}

      {loading && (
        <div style={{ fontSize: 12, color: T.accent, fontWeight: 500 }}>Verifying...</div>
      )}

      {/* Resend */}
      <div style={{ fontSize: 12, color: T.textDim }}>
        {resendTimer > 0 ? (
          <span>Resend code in {resendTimer}s</span>
        ) : (
          <button
            onClick={() => setResendTimer(MFA_CONFIG.resendDelay)}
            style={{ background: "transparent", border: "none", color: T.accent, cursor: "pointer", fontSize: 12, fontFamily: "inherit", textDecoration: "underline" }}
          >
            Resend code
          </button>
        )}
      </div>

      <button onClick={onBack} style={{
        width: "100%", padding: "10px", borderRadius: 8,
        border: `1px solid ${T.border}`, background: "transparent",
        color: T.textMid, fontSize: 12, cursor: "pointer", fontFamily: "inherit",
      }}>
        &larr; Back to sign in options
      </button>

      {/* Demo hint */}
      <div style={{ padding: "10px 14px", borderRadius: 8, background: T.accent + "08", border: `1px solid ${T.accent}20`, width: "100%" }}>
        <div style={{ fontSize: 11, color: T.accent, fontWeight: 600, marginBottom: 2 }}>Demo Mode</div>
        <div style={{ fontSize: 11, color: T.textDim, lineHeight: 1.4 }}>
          Any 6-digit code will be accepted (e.g. 123456)
        </div>
      </div>
    </div>
  );
}
