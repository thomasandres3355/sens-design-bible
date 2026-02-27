import { useState, useRef, useEffect } from "react";
import { T } from "../../data/theme";
import { isLiveMode, askAgent } from "../../services/claudeService";
import { useBadge } from "../../contexts/BadgeContext";
import { usePermissions } from "../../contexts/PermissionContext";
import { useSimDate } from "../../contexts/SimDateContext";

// ─── Icons ───
const BugIcon = ({ size = 18, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 2l1.88 1.88 M14.12 3.88L16 2 M9 7.13v-1a3.003 3.003 0 1 1 6 0v1" />
    <path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6" />
    <path d="M12 20v-9 M6.53 9C4.6 8.8 3 7.1 3 5 M6 13H2 M3 21c0-2.1 1.7-3.9 3.8-4 M20.97 5c0 2.1-1.6 3.8-3.5 4 M22 13h-4 M17.2 17c2.1.1 3.8 1.9 3.8 4" />
  </svg>
);

const CloseIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const CheckIcon = () => (
  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const ChevronIcon = ({ open }) => (
  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    style={{ transition: "transform .15s", transform: open ? "rotate(180deg)" : "rotate(0)" }}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const SendIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const ListIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
);

// ─── Constants ───
const SEVERITY_OPTIONS = [
  { value: "low", label: "Low", color: T.blue },
  { value: "medium", label: "Medium", color: T.warn },
  { value: "high", label: "High", color: T.accent },
  { value: "critical", label: "Critical", color: T.danger },
];

const STATUS_CONFIG = {
  submitted: { label: "Submitted", color: T.textMid },
  "ai-analyzing": { label: "AI Analyzing", color: T.blue },
  "fix-suggested": { label: "Fix Suggested", color: T.accent },
  "pending-it": { label: "Pending IT Review", color: T.warn },
  approved: { label: "Approved", color: T.green },
  rejected: { label: "Rejected", color: T.danger },
};

const STORAGE_KEY = "sens-bug-reports";

// ─── Persistence helpers ───
function loadReports() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
}

function saveReports(reports) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(reports)); } catch { /* ignore */ }
}

// ─── Simulated Claude analysis ───
function simulateAnalysis(title, description, severity, module) {
  return `Bug Analysis — ${title}

Module: ${module}
Severity Assessment: ${severity.charAt(0).toUpperCase() + severity.slice(1)} — confirmed

Root Cause (Probable):
Based on the reported behavior, this appears to be related to a state management issue in the ${module} module. The component may not be properly re-rendering when underlying data changes, leading to stale UI state.

Suggested Fix:
1. Add a dependency check in the useEffect hook that handles data refresh in the ${module} view
2. Ensure the data subscription is properly cleaned up on unmount
3. Add error boundary wrapping for graceful failure handling

Recommendation: ${severity === "critical" || severity === "high" ? "Prioritize for immediate sprint inclusion. Deploy hotfix if in production." : "Schedule for next sprint cycle. Low risk of user impact."}`;
}

// ─── SeverityPill ───
const SeverityPill = ({ severity }) => {
  const opt = SEVERITY_OPTIONS.find(o => o.value === severity) || SEVERITY_OPTIONS[0];
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 6,
      background: opt.color + "20", color: opt.color, textTransform: "uppercase", letterSpacing: 0.5,
    }}>{opt.label}</span>
  );
};

// ─── StatusBadge ───
const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.submitted;
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 6,
      background: cfg.color + "20", color: cfg.color, display: "inline-flex", alignItems: "center", gap: 4,
    }}>
      {status === "ai-analyzing" && <div style={{
        width: 5, height: 5, borderRadius: "50%", background: cfg.color,
        animation: "pulse 1.5s ease-in-out infinite", boxShadow: `0 0 4px ${cfg.color}`,
      }} />}
      {cfg.label}
    </span>
  );
};

// ─── Report Card (in tracker list) ───
const ReportCard = ({ report, onApprove, onReject, canReview }) => {
  const [expanded, setExpanded] = useState(false);
  const age = Math.round((Date.now() - report.timestamp) / 60000);
  const ageLabel = age < 60 ? `${age}m ago` : age < 1440 ? `${Math.round(age / 60)}h ago` : `${Math.round(age / 1440)}d ago`;

  return (
    <div style={{
      background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden",
    }}>
      {/* Header row */}
      <button onClick={() => setExpanded(!expanded)} style={{
        width: "100%", display: "flex", alignItems: "center", gap: 8,
        padding: "10px 14px", background: "transparent", border: "none",
        cursor: "pointer", textAlign: "left",
      }}>
        <BugIcon size={14} color={SEVERITY_OPTIONS.find(o => o.value === report.severity)?.color || T.textMid} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {report.title}
          </div>
          <div style={{ fontSize: 10, color: T.textDim, marginTop: 2 }}>
            {report.module} · {ageLabel} · {report.reporter}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <SeverityPill severity={report.severity} />
          <StatusBadge status={report.status} />
          <ChevronIcon open={expanded} />
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div style={{ padding: "0 14px 14px", borderTop: `1px solid ${T.border}` }}>
          {/* Description */}
          <div style={{ fontSize: 11, color: T.textMid, lineHeight: 1.5, padding: "10px 0", whiteSpace: "pre-wrap" }}>
            {report.description}
          </div>

          {/* AI Analysis */}
          {report.aiAnalysis && (
            <div style={{
              background: T.bg0, borderLeft: `3px solid ${T.accent}30`,
              borderRadius: "4px 8px 8px 8px", padding: "12px 14px", marginTop: 8,
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.accent, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: T.accent }} />
                AI Analysis
              </div>
              <div style={{ fontSize: 11, color: T.text, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                {report.aiAnalysis.replace(/\*\*/g, "").replace(/\*/g, "").replace(/`/g, "").replace(/^#{1,6}\s+/gm, "")}
              </div>
            </div>
          )}

          {/* Streaming indicator */}
          {report.status === "ai-analyzing" && (
            <div style={{
              background: T.bg0, borderLeft: `3px solid ${T.accent}30`,
              borderRadius: "4px 8px 8px 8px", padding: "12px 14px", marginTop: 8,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{
                  width: 6, height: 6, borderRadius: "50%", background: T.accent,
                  animation: "pulse 1.5s ease-in-out infinite",
                }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: T.accent }}>
                  {report.streamText ? "Analyzing..." : "Analyzing bug report..."}
                </span>
              </div>
              {report.streamText && (
                <div style={{ fontSize: 11, color: T.text, lineHeight: 1.6, whiteSpace: "pre-wrap", marginTop: 8 }}>
                  {report.streamText.replace(/\*\*/g, "").replace(/\*/g, "").replace(/`/g, "")}
                </div>
              )}
            </div>
          )}

          {/* IT Approval buttons */}
          {canReview && report.status === "pending-it" && (
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button onClick={() => onApprove(report.id)} style={{
                display: "flex", alignItems: "center", gap: 5, padding: "7px 16px",
                borderRadius: 8, border: "none", cursor: "pointer",
                background: T.accent, color: T.bg0, fontSize: 11, fontWeight: 700, fontFamily: "inherit",
              }}>
                <CheckIcon /> Approve Fix
              </button>
              <button onClick={() => onReject(report.id)} style={{
                display: "flex", alignItems: "center", gap: 5, padding: "7px 16px",
                borderRadius: 8, border: `1px solid ${T.textDim}`, cursor: "pointer",
                background: "transparent", color: T.textDim, fontSize: 11, fontWeight: 700, fontFamily: "inherit",
              }}>
                Deny
              </button>
            </div>
          )}

          {/* Approval result */}
          {report.status === "approved" && (
            <div style={{
              marginTop: 10, padding: "8px 12px", borderRadius: 8,
              background: T.accent + "12", borderLeft: `3px solid ${T.accent}`,
              fontSize: 11, color: T.accent, fontWeight: 600,
            }}>
              Fix approved — ready for deployment
            </div>
          )}
          {report.status === "rejected" && (
            <div style={{
              marginTop: 10, padding: "8px 12px", borderRadius: 8,
              background: T.bg3, borderLeft: `3px solid ${T.textDim}`,
              fontSize: 11, color: T.textDim, fontWeight: 600,
            }}>
              Fix denied — requires further review
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
//  BugReportModal — main export
// ═══════════════════════════════════════════════════════════════════
export const BugReportModal = ({ open, onClose, activeModule }) => {
  const [view, setView] = useState("form"); // "form" | "tracker"
  const [reports, setReports] = useState(loadReports);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("medium");
  const [submitting, setSubmitting] = useState(false);
  const titleRef = useRef(null);

  const { activeUser } = useBadge();
  const { can } = usePermissions();
  const { simDate } = useSimDate();
  const canReview = can("admin", "edit");

  // Focus title input when opening form
  useEffect(() => {
    if (open && view === "form") setTimeout(() => titleRef.current?.focus(), 200);
  }, [open, view]);

  // Persist reports whenever they change
  useEffect(() => { saveReports(reports); }, [reports]);

  if (!open) return null;

  const moduleName = activeModule?.charAt(0).toUpperCase() + activeModule?.slice(1) || "Unknown";

  const updateReport = (id, updates) => {
    setReports(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const handleSubmit = async () => {
    if (!title.trim() || submitting) return;
    setSubmitting(true);

    const report = {
      id: `BUG-${Date.now().toString(36).toUpperCase()}`,
      title: title.trim(),
      description: description.trim(),
      severity,
      module: moduleName,
      reporter: activeUser.name,
      reporterId: activeUser.id,
      timestamp: Date.now(),
      status: "ai-analyzing",
      aiAnalysis: null,
      streamText: "",
    };

    setReports(prev => [report, ...prev]);
    setTitle("");
    setDescription("");
    setSeverity("medium");
    setView("tracker");

    // Send to Claude for analysis
    const liveMode = isLiveMode();
    if (liveMode) {
      try {
        const bugAgent = {
          name: "Bug Analysis Agent",
          role: "Platform Bug Analyst",
          skills: ["bug triage", "root cause analysis", "fix recommendation"],
          dataSources: [],
        };
        const question = `Analyze this bug report and provide a root cause analysis, suggested fix steps, and a recommendation. Use plain text only — no markdown, no emojis, no symbols. Keep it concise and professional.\n\nTitle: ${report.title}\nModule: ${report.module}\nSeverity: ${report.severity}\nDescription: ${report.description || "No description provided"}\nReported by: ${report.reporter}`;

        const response = await askAgent({
          agent: bugAgent,
          question,
          simDate,
          user: activeUser,
          source: "bug-report",
          onChunk: (_chunk, full) => {
            updateReport(report.id, { streamText: full });
          },
        });
        updateReport(report.id, { status: "fix-suggested", aiAnalysis: response, streamText: "" });
        // Auto-advance to pending IT after analysis
        setTimeout(() => updateReport(report.id, { status: "pending-it" }), 1500);
      } catch (err) {
        const fallback = simulateAnalysis(report.title, report.description, report.severity, report.module);
        updateReport(report.id, { status: "fix-suggested", aiAnalysis: `[Live AI unavailable — simulated]\n\n${fallback}`, streamText: "" });
        setTimeout(() => updateReport(report.id, { status: "pending-it" }), 1500);
      }
    } else {
      // Simulated mode — fake a short delay for realism
      setTimeout(() => {
        const analysis = simulateAnalysis(report.title, report.description, report.severity, report.module);
        updateReport(report.id, { status: "fix-suggested", aiAnalysis: analysis, streamText: "" });
        setTimeout(() => updateReport(report.id, { status: "pending-it" }), 1200);
      }, 1800);
    }
    setSubmitting(false);
  };

  const handleApprove = (id) => updateReport(id, { status: "approved" });
  const handleReject = (id) => updateReport(id, { status: "rejected" });

  const openCount = reports.filter(r => !["approved", "rejected"].includes(r.status)).length;

  return (
    <div style={{
      position: "fixed", bottom: 24, left: 72, zIndex: 1000,
      width: 460, maxHeight: "calc(100vh - 80px)",
      background: T.bg1, border: `1px solid ${T.border}`,
      borderRadius: 16, display: "flex", flexDirection: "column",
      boxShadow: "0 8px 40px rgba(0,0,0,.4), 0 0 0 1px rgba(255,255,255,.04)",
      overflow: "hidden", fontFamily: "inherit",
    }}>
      {/* Header */}
      <div style={{
        padding: "12px 16px", borderBottom: `1px solid ${T.border}`,
        background: T.danger + "08",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <BugIcon size={18} color={T.danger} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>Bug Report</div>
            <div style={{ fontSize: 10, color: T.textMid, marginTop: 1 }}>
              {view === "form" ? `Reporting on ${moduleName}` : `${reports.length} report${reports.length !== 1 ? "s" : ""}`}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {/* Toggle form/tracker */}
          <button onClick={() => setView(view === "form" ? "tracker" : "form")} style={{
            display: "flex", alignItems: "center", gap: 4, padding: "5px 10px",
            borderRadius: 6, border: `1px solid ${T.border}`, background: T.bg2,
            cursor: "pointer", color: T.textMid, fontSize: 10, fontWeight: 600, fontFamily: "inherit",
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.color = T.accent; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textMid; }}
          >
            {view === "form" ? <><ListIcon /> Tracker{openCount > 0 ? ` (${openCount})` : ""}</> : <><BugIcon size={12} /> New Report</>}
          </button>
          <button onClick={onClose} style={{
            background: "transparent", border: `1px solid ${T.border}`,
            borderRadius: 6, padding: "4px 6px", cursor: "pointer", color: T.textDim,
          }}>
            <CloseIcon />
          </button>
        </div>
      </div>

      {/* FORM VIEW */}
      {view === "form" && (
        <div style={{ flex: 1, overflow: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Title */}
          <div>
            <label style={{ fontSize: 10, fontWeight: 600, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4, display: "block" }}>Title</label>
            <input
              ref={titleRef}
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Brief description of the bug..."
              style={{
                width: "100%", padding: "9px 12px", borderRadius: 8,
                border: `1px solid ${T.border}`, background: T.bg0, color: T.text,
                fontSize: 12, fontFamily: "inherit", outline: "none", boxSizing: "border-box",
              }}
              onFocus={e => e.currentTarget.style.borderColor = T.accent}
              onBlur={e => e.currentTarget.style.borderColor = T.border}
              onKeyDown={e => { if (e.key === "Enter") handleSubmit(); }}
            />
          </div>

          {/* Description */}
          <div>
            <label style={{ fontSize: 10, fontWeight: 600, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4, display: "block" }}>Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Steps to reproduce, expected vs actual behavior..."
              rows={4}
              style={{
                width: "100%", padding: "9px 12px", borderRadius: 8,
                border: `1px solid ${T.border}`, background: T.bg0, color: T.text,
                fontSize: 12, fontFamily: "inherit", outline: "none", resize: "vertical",
                lineHeight: 1.5, boxSizing: "border-box",
              }}
              onFocus={e => e.currentTarget.style.borderColor = T.accent}
              onBlur={e => e.currentTarget.style.borderColor = T.border}
            />
          </div>

          {/* Severity + Module row */}
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 10, fontWeight: 600, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4, display: "block" }}>Severity</label>
              <div style={{ display: "flex", gap: 4 }}>
                {SEVERITY_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => setSeverity(opt.value)} style={{
                    flex: 1, padding: "7px 0", borderRadius: 6, cursor: "pointer",
                    fontSize: 11, fontWeight: 600, fontFamily: "inherit",
                    background: severity === opt.value ? opt.color + "20" : T.bg0,
                    border: `1px solid ${severity === opt.value ? opt.color : T.border}`,
                    color: severity === opt.value ? opt.color : T.textMid,
                    transition: "all .12s",
                  }}>{opt.label}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Module display */}
          <div style={{
            display: "flex", alignItems: "center", gap: 8, padding: "8px 12px",
            background: T.bg0, borderRadius: 8, border: `1px solid ${T.border}`,
          }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.8 }}>Module:</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: T.accent }}>{moduleName}</span>
            <span style={{ fontSize: 10, color: T.textDim, marginLeft: "auto" }}>Auto-detected</span>
          </div>

          {/* Workflow explanation */}
          <div style={{
            padding: "10px 12px", borderRadius: 8, background: T.accent + "08",
            borderLeft: `3px solid ${T.accent}30`, fontSize: 10, color: T.textMid, lineHeight: 1.5,
          }}>
            <strong style={{ color: T.accent }}>Workflow:</strong> Your report will be automatically sent to <strong style={{ color: T.text }}>AI</strong> for analysis and fix suggestion, then routed to <strong style={{ color: T.text }}>IT</strong> for approval.
          </div>
        </div>
      )}

      {/* TRACKER VIEW */}
      {view === "tracker" && (
        <div style={{ flex: 1, overflow: "auto", padding: "8px 12px", maxHeight: 440 }}>
          {reports.length === 0 ? (
            <div style={{ padding: 30, textAlign: "center", color: T.textDim, fontSize: 12 }}>
              No bug reports yet. Submit one to get started.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "4px 0" }}>
              {reports.map(r => (
                <ReportCard
                  key={r.id}
                  report={r}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  canReview={canReview}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Submit button (form view only) */}
      {view === "form" && (
        <div style={{ padding: "12px 16px", borderTop: `1px solid ${T.border}`, background: T.bg2 }}>
          <button onClick={handleSubmit} disabled={!title.trim() || submitting} style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            padding: "11px 0", borderRadius: 10, border: "none", cursor: title.trim() && !submitting ? "pointer" : "default",
            background: title.trim() && !submitting ? T.danger : T.bg3,
            color: title.trim() && !submitting ? "#fff" : T.textDim,
            fontSize: 12, fontWeight: 700, fontFamily: "inherit", transition: "background .15s",
          }}>
            <SendIcon />
            {submitting ? "Submitting..." : "Submit Bug Report"}
          </button>
        </div>
      )}
    </div>
  );
};

// Export the icon and a helper for the badge count
export { BugIcon };
export function getBugReportCount() {
  const reports = loadReports();
  return reports.filter(r => !["approved", "rejected"].includes(r.status)).length;
}
