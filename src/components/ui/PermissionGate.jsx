import { T } from "../../data/theme";
import { usePermissions } from "../../contexts/PermissionContext";

/**
 * PermissionGate — Conditionally renders children based on module permissions.
 *
 * Props:
 *   module   — module key (e.g. "finance")
 *   action   — action key (e.g. "export", "edit")
 *   fallback — "hidden" (default, renders nothing), "disabled" (renders children with opacity + no pointer events), "denied" (shows AccessDenied)
 *   children — content to gate
 */
export function PermissionGate({ module, action, fallback = "hidden", children }) {
  const { can } = usePermissions();
  const allowed = can(module, action);

  if (allowed) return children;

  if (fallback === "disabled") {
    return (
      <div style={{ opacity: 0.4, pointerEvents: "none", cursor: "not-allowed" }} title={`Requires ${action} permission for ${module}`}>
        {children}
      </div>
    );
  }

  if (fallback === "denied") {
    return <AccessDenied module={module} action={action} />;
  }

  // fallback === "hidden"
  return null;
}

/**
 * AccessDenied — Displayed when a user navigates to a view they can't access.
 */
export function AccessDenied({ module, action }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: 60, textAlign: "center",
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: "50%",
        background: T.danger + "15", border: `2px solid ${T.danger}30`,
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 20,
      }}>
        <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke={T.danger} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
        </svg>
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color: T.text, marginBottom: 8 }}>Access Denied</div>
      <div style={{ fontSize: 13, color: T.textMid, marginBottom: 4 }}>
        You don't have permission to {action || "view"} this {module ? `module (${module})` : "content"}.
      </div>
      <div style={{ fontSize: 12, color: T.textDim }}>
        Contact your administrator to request access.
      </div>
    </div>
  );
}
