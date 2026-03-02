import { useState, useEffect, useRef } from "react";
import { T } from "@core/theme/theme";

/* ─── Icons ─── */
const CopyIcon = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const CheckIcon = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const XIcon = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const TrashIcon = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const UserIcon = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);

const NoteIcon = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

const BugIcon = ({ size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 2l1.88 1.88 M14.12 3.88L16 2 M9 7.13v-1a3.003 3.003 0 1 1 6 0v1" />
    <path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6" />
    <path d="M12 20v-9 M6.53 9C4.6 8.8 3 7.1 3 5 M6 13H2 M3 21c0-2.1 1.7-3.9 3.8-4 M20.97 5c0 2.1-1.6 3.8-3.5 4 M22 13h-4 M17.2 17c2.1.1 3.8 1.9 3.8 4" />
  </svg>
);

const ChevronIcon = ({ open }) => (
  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    style={{ transition: "transform .15s", transform: open ? "rotate(180deg)" : "rotate(0)" }}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const ArrowRightIcon = ({ size = 10, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

/* ─── Brand color palette: orange (accent) + gray ─── */
const SEVERITY_OPTIONS = [
  { value: "low", label: "Low", color: T.textDim },
  { value: "medium", label: "Medium", color: T.textMid },
  { value: "high", label: "High", color: T.accent },
  { value: "critical", label: "Critical", color: T.accent },
];

const STATUS_CONFIG = {
  submitted: { label: "Submitted", color: T.textMid, order: 0 },
  "ai-analyzing": { label: "AI Analyzing", color: T.accent, order: 1 },
  "fix-suggested": { label: "Fix Suggested", color: T.accent, order: 2 },
  "pending-it": { label: "Pending IT", color: T.accent, order: 3 },
  approved: { label: "Approved", color: T.accent, order: 4 },
  rejected: { label: "Denied", color: T.textDim, order: 5 },
};

const PIPELINE_STAGES = [
  { key: "submitted", label: "Submitted" },
  { key: "ai-analyzing", label: "AI Analysis" },
  { key: "fix-suggested", label: "Fix Ready" },
  { key: "pending-it", label: "IT Review" },
  { key: "approved", label: "Approved" },
];

const IT_TEAM = [
  { id: "unassigned", name: "Unassigned" },
  { id: "jared-m", name: "Jared Mitchell" },
  { id: "sarah-k", name: "Sarah Kim" },
  { id: "alex-r", name: "Alex Rodriguez" },
  { id: "maya-p", name: "Maya Patel" },
];

const STORAGE_KEY = "sens-bug-reports";

/* ─── Helpers ─── */
function loadReports() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
}

function saveReports(reports) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(reports)); } catch { /* ignore */ }
}

/** Strip markdown symbols from AI analysis text for clean display */
function cleanAnalysisText(text) {
  if (!text) return "";
  return text
    .replace(/\*\*/g, "")        // bold markers
    .replace(/\*/g, "")          // italic markers
    .replace(/`/g, "")           // code backticks
    .replace(/^#{1,6}\s+/gm, "") // heading markers
    .replace(/^\s*[-*]\s+/gm, "  - ") // normalize list markers
    .trim();
}

/* ─── Sub-components ─── */
const SeverityPill = ({ severity }) => {
  const isCrit = severity === "critical";
  const opt = SEVERITY_OPTIONS.find(o => o.value === severity) || SEVERITY_OPTIONS[0];
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 6,
      background: opt.color + "18", color: opt.color,
      textTransform: "uppercase", letterSpacing: 0.5,
      border: isCrit ? `1px solid ${T.accent}40` : "1px solid transparent",
    }}>{opt.label}</span>
  );
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.submitted;
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 6,
      background: cfg.color + "18", color: cfg.color,
      display: "inline-flex", alignItems: "center", gap: 4,
    }}>
      {status === "ai-analyzing" && <div style={{
        width: 5, height: 5, borderRadius: "50%", background: T.accent,
        animation: "pulse 1.5s ease-in-out infinite",
      }} />}
      {cfg.label}
    </span>
  );
};

/* ─── Copy Button ─── */
const CopyButton = ({ text, label = "Copy" }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  return (
    <button onClick={handleCopy} style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "5px 12px", borderRadius: 6, border: "none", cursor: "pointer",
      fontSize: 11, fontWeight: 600, fontFamily: "inherit",
      background: T.accent + (copied ? "30" : "18"),
      color: T.accent, transition: "all 0.2s",
    }}>
      {copied ? <CheckIcon size={12} color={T.accent} /> : <CopyIcon size={12} color={T.accent} />}
      {copied ? "Copied" : label}
    </button>
  );
};

/* ─── Action Button ─── */
const ActionBtn = ({ icon, label, color, onClick, outline, small }) => (
  <button onClick={onClick} style={{
    display: "inline-flex", alignItems: "center", gap: 5,
    padding: small ? "4px 10px" : "6px 14px", borderRadius: 6,
    border: outline ? `1px solid ${color || T.textMid}40` : "none", cursor: "pointer",
    fontSize: 11, fontWeight: 600, fontFamily: "inherit",
    background: outline ? "transparent" : (color || T.textMid) + "18",
    color: color || T.textMid, transition: "all 0.15s",
  }}
    onMouseEnter={e => { e.currentTarget.style.background = (color || T.textMid) + (outline ? "12" : "28"); }}
    onMouseLeave={e => { e.currentTarget.style.background = outline ? "transparent" : (color || T.textMid) + "18"; }}
  >
    {icon}{label}
  </button>
);

/* ─── Inline Select ─── */
const InlineSelect = ({ value, options, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const selected = options.find(o => o.value === value) || options[0];

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button onClick={(e) => { e.stopPropagation(); setOpen(!open); }} style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        padding: "3px 8px", borderRadius: 5, cursor: "pointer",
        fontSize: 10, fontWeight: 600, fontFamily: "inherit",
        border: `1px solid ${T.border}`, background: "transparent",
        color: T.accent, transition: "all 0.15s",
      }}>
        {selected.label}
        <ChevronIcon open={open} />
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "100%", left: 0, marginTop: 4, zIndex: 100,
          background: T.bg1, border: `1px solid ${T.border}`, borderRadius: 8,
          boxShadow: "0 8px 24px rgba(0,0,0,.3)", overflow: "hidden", minWidth: 120,
        }}>
          {options.map(opt => (
            <button key={opt.value} onClick={(e) => { e.stopPropagation(); onChange(opt.value); setOpen(false); }} style={{
              display: "flex", alignItems: "center", gap: 6, width: "100%",
              padding: "7px 12px", border: "none", cursor: "pointer",
              fontSize: 11, fontWeight: value === opt.value ? 600 : 400,
              fontFamily: "inherit", textAlign: "left",
              background: value === opt.value ? T.accent + "12" : "transparent",
              color: value === opt.value ? T.accent : T.textMid,
            }}
              onMouseEnter={e => { if (value !== opt.value) e.currentTarget.style.background = T.bg3; }}
              onMouseLeave={e => { if (value !== opt.value) e.currentTarget.style.background = "transparent"; }}
            >
              {opt.dot && <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.accent, flexShrink: 0 }} />}
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* ─── Pipeline Mini Bar (per report) ─── */
const PipelineMini = ({ status }) => {
  const currentOrder = STATUS_CONFIG[status]?.order ?? 0;
  const isRejected = status === "rejected";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
      {PIPELINE_STAGES.map((stage, i) => {
        const stageOrder = STATUS_CONFIG[stage.key]?.order ?? i;
        const isActive = stage.key === status;
        const isPast = stageOrder < currentOrder && !isRejected;
        const color = isActive ? T.accent : isPast ? T.accent : T.bg4 || T.border;

        return (
          <div key={stage.key} style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <div style={{
              width: isActive ? 10 : 7, height: isActive ? 10 : 7,
              borderRadius: "50%", background: isPast || isActive ? color : "transparent",
              border: `2px solid ${color}`, transition: "all 0.2s",
              opacity: isPast ? 0.5 : 1,
            }} />
            {i < PIPELINE_STAGES.length - 1 && (
              <div style={{ width: 16, height: 2, background: isPast ? T.accent + "50" : T.bg4 || T.border, borderRadius: 1 }} />
            )}
          </div>
        );
      })}
      {isRejected && (
        <>
          <div style={{ width: 16, height: 2, background: T.textDim, borderRadius: 1 }} />
          <div style={{
            width: 10, height: 10, borderRadius: "50%", background: T.textDim,
            border: `2px solid ${T.textDim}`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <XIcon size={6} color={T.bg0} />
          </div>
        </>
      )}
    </div>
  );
};

/* ─── Delete Confirmation ─── */
const DeleteConfirm = ({ onConfirm, onCancel }) => (
  <div style={{
    display: "flex", alignItems: "center", gap: 8, padding: "6px 10px",
    background: T.bg3, borderRadius: 6, border: `1px solid ${T.border}`,
  }}>
    <span style={{ fontSize: 11, color: T.textMid, fontWeight: 600 }}>Delete this report?</span>
    <ActionBtn label="Yes" color={T.accent} onClick={onConfirm} small />
    <ActionBtn label="No" color={T.textDim} onClick={onCancel} outline small />
  </div>
);

/* ─── Build fix prompt from report ─── */
function buildFixPrompt(report) {
  const analysis = cleanAnalysisText(report.aiAnalysis);
  return `Bug Fix Request: ${report.title}

Context
Project: SENS Master v4.0 — React/Vite executive intelligence dashboard
Module: ${report.module || "Unknown"}
Severity: ${(report.severity || "medium").charAt(0).toUpperCase() + (report.severity || "medium").slice(1)}
Status: ${STATUS_CONFIG[report.status]?.label || report.status}
${report.assignee && report.assignee !== "unassigned" ? `Assigned to: ${IT_TEAM.find(t => t.id === report.assignee)?.name || report.assignee}` : ""}

Bug Summary
${report.description || "No description provided."}

AI Analysis
${analysis || "No analysis available."}
${report.notes?.length ? `\nIT Notes\n${report.notes.map(n => `- [${new Date(n.timestamp).toLocaleDateString()}] ${n.text}`).join("\n")}` : ""}

Constraints
- Follow existing code patterns and conventions (inline styles, functional components, DM Sans font)
- Do not introduce new dependencies
- Ensure npx vite build succeeds after changes
- Keep changes minimal — touch only what is necessary`;
}

/* ─── Report Card ─── */
const ReportCard = ({ report, onUpdate, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState("");
  const noteRef = useRef(null);

  const age = Math.round((Date.now() - report.timestamp) / 60000);
  const ageLabel = age < 60 ? `${age}m ago` : age < 1440 ? `${Math.round(age / 60)}h ago` : `${Math.round(age / 1440)}d ago`;
  const assignee = IT_TEAM.find(t => t.id === report.assignee);
  const isTerminal = report.status === "approved" || report.status === "rejected";

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    const notes = [...(report.notes || []), { text: noteText.trim(), timestamp: Date.now(), author: "IT Manager" }];
    onUpdate(report.id, { notes });
    setNoteText("");
    setShowNoteInput(false);
  };

  useEffect(() => {
    if (showNoteInput) setTimeout(() => noteRef.current?.focus(), 100);
  }, [showNoteInput]);

  return (
    <div style={{
      background: T.bg2, border: `1px solid ${expanded ? T.accent + "40" : T.border}`,
      borderRadius: 10, overflow: "hidden", transition: "border-color 0.2s",
    }}>
      {/* ── Header ── */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", cursor: "pointer" }}
      >
        <BugIcon size={14} color={T.accent} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {report.title}
          </div>
          <div style={{ fontSize: 11, color: T.textDim, marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
            <span>{report.module}</span>
            <span style={{ color: T.border }}>|</span>
            <span>{ageLabel}</span>
            <span style={{ color: T.border }}>|</span>
            <span>{report.reporter || "User"}</span>
            {assignee && assignee.id !== "unassigned" && (
              <>
                <span style={{ color: T.border }}>|</span>
                <span style={{ color: T.textMid, display: "inline-flex", alignItems: "center", gap: 3 }}>
                  <UserIcon size={10} color={T.textMid} />{assignee.name}
                </span>
              </>
            )}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <PipelineMini status={report.status} />
          <CopyButton text={buildFixPrompt(report)} label="Copy Prompt" />
          <SeverityPill severity={report.severity} />
          <StatusBadge status={report.status} />
          <ChevronIcon open={expanded} />
        </div>
      </div>

      {/* ── Expanded ── */}
      {expanded && (
        <div style={{ padding: "0 16px 16px", borderTop: `1px solid ${T.border}` }}>
          {/* Description */}
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: T.textDim, textTransform: "uppercase", letterSpacing: .8, marginBottom: 6 }}>Description</div>
            <div style={{ fontSize: 12, color: T.textMid, lineHeight: 1.5 }}>{report.description || "No description provided."}</div>
          </div>

          {/* AI Analysis — cleaned of markdown */}
          {report.aiAnalysis && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: T.textDim, textTransform: "uppercase", letterSpacing: .8, marginBottom: 6 }}>AI Analysis</div>
              <div style={{
                fontSize: 12, color: T.textMid, lineHeight: 1.6,
                background: T.bg0, borderRadius: 8, padding: 12,
                borderLeft: `3px solid ${T.accent}30`,
                whiteSpace: "pre-wrap",
              }}>{cleanAnalysisText(report.aiAnalysis)}</div>
            </div>
          )}

          {/* Notes */}
          {report.notes?.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: T.textDim, textTransform: "uppercase", letterSpacing: .8, marginBottom: 6 }}>IT Notes</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {report.notes.map((note, i) => (
                  <div key={i} style={{
                    fontSize: 11, color: T.textMid, lineHeight: 1.4,
                    padding: "8px 10px", background: T.bg0, borderRadius: 6,
                    borderLeft: `3px solid ${T.accent}30`, display: "flex", justifyContent: "space-between",
                  }}>
                    <span>{note.text}</span>
                    <span style={{ fontSize: 9, color: T.textDim, flexShrink: 0, marginLeft: 12 }}>
                      {note.author} | {new Date(note.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Note input */}
          {showNoteInput && (
            <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
              <input
                ref={noteRef}
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleAddNote(); if (e.key === "Escape") { setShowNoteInput(false); setNoteText(""); } }}
                placeholder="Add a note..."
                style={{
                  flex: 1, padding: "7px 10px", borderRadius: 6,
                  border: `1px solid ${T.border}`, background: T.bg0, color: T.text,
                  fontSize: 11, fontFamily: "inherit", outline: "none", boxSizing: "border-box",
                }}
                onFocus={e => e.currentTarget.style.borderColor = T.accent}
                onBlur={e => e.currentTarget.style.borderColor = T.border}
              />
              <ActionBtn label="Add" color={T.accent} onClick={handleAddNote} small />
              <ActionBtn label="Cancel" color={T.textDim} onClick={() => { setShowNoteInput(false); setNoteText(""); }} outline small />
            </div>
          )}

          {/* ── Management Actions ── */}
          <div style={{
            marginTop: 14, paddingTop: 12, borderTop: `1px solid ${T.border}`,
            display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
          }}>
            {/* Copy actions */}
            <CopyButton text={buildFixPrompt(report)} label="Copy Fix Prompt" />
            <CopyButton text={JSON.stringify(report, null, 2)} label="Copy JSON" />

            <div style={{ width: 1, height: 20, background: T.border, margin: "0 4px" }} />

            {/* Priority change */}
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 10, color: T.textDim, fontWeight: 600 }}>Priority:</span>
              <InlineSelect
                value={report.severity}
                options={SEVERITY_OPTIONS.map(o => ({ value: o.value, label: o.label, dot: true }))}
                onChange={(val) => onUpdate(report.id, { severity: val })}
              />
            </div>

            {/* Assign */}
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 10, color: T.textDim, fontWeight: 600 }}>Assign:</span>
              <InlineSelect
                value={report.assignee || "unassigned"}
                options={IT_TEAM.map(t => ({ value: t.id, label: t.name }))}
                onChange={(val) => onUpdate(report.id, { assignee: val })}
              />
            </div>

            <div style={{ width: 1, height: 20, background: T.border, margin: "0 4px" }} />

            {/* Add note */}
            <ActionBtn
              icon={<NoteIcon size={12} color={T.accent} />}
              label="Note"
              color={T.accent}
              onClick={(e) => { e.stopPropagation(); setShowNoteInput(!showNoteInput); }}
              small
            />

            {/* Approve / Deny */}
            {!isTerminal && (
              <>
                <ActionBtn
                  icon={<CheckIcon size={12} color={T.accent} />}
                  label="Approve"
                  color={T.accent}
                  onClick={(e) => { e.stopPropagation(); onUpdate(report.id, { status: "approved" }); }}
                  small
                />
                <ActionBtn
                  icon={<XIcon size={11} color={T.textDim} />}
                  label="Deny"
                  color={T.textDim}
                  onClick={(e) => { e.stopPropagation(); onUpdate(report.id, { status: "rejected" }); }}
                  outline
                  small
                />
              </>
            )}

            {/* Re-open */}
            {isTerminal && (
              <ActionBtn
                icon={<ArrowRightIcon size={10} color={T.accent} />}
                label="Re-open"
                color={T.accent}
                onClick={(e) => { e.stopPropagation(); onUpdate(report.id, { status: "pending-it" }); }}
                small
              />
            )}

            {/* Delete */}
            {!confirmDelete ? (
              <ActionBtn
                icon={<TrashIcon size={11} color={T.textDim} />}
                label="Delete"
                color={T.textDim}
                onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
                outline
                small
              />
            ) : (
              <DeleteConfirm
                onConfirm={(e) => { e?.stopPropagation?.(); onDelete(report.id); }}
                onCancel={(e) => { e?.stopPropagation?.(); setConfirmDelete(false); }}
              />
            )}
          </div>

          {/* Status banners */}
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

/* ─── Pipeline Overview (aggregate) ─── */
const PipelineOverview = ({ reports }) => {
  const stageCounts = PIPELINE_STAGES.map(stage => ({
    ...stage,
    count: reports.filter(r => r.status === stage.key).length,
  }));
  const rejectedCount = reports.filter(r => r.status === "rejected").length;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 0,
      background: T.bg2, borderRadius: 10, border: `1px solid ${T.border}`,
      padding: "14px 20px", overflow: "auto",
    }}>
      {stageCounts.map((stage, i) => (
        <div key={stage.key} style={{ display: "flex", alignItems: "center", flex: 1, minWidth: 0 }}>
          <div style={{ textAlign: "center", flex: 1 }}>
            <div style={{
              fontSize: 20, fontWeight: 700,
              color: stage.count > 0 ? T.accent : T.textDim,
              lineHeight: 1,
            }}>{stage.count}</div>
            <div style={{
              fontSize: 9, fontWeight: 600, color: stage.count > 0 ? T.textMid : T.textDim,
              textTransform: "uppercase", letterSpacing: 0.5, marginTop: 4,
            }}>{stage.label}</div>
          </div>
          {i < stageCounts.length - 1 && (
            <div style={{ flexShrink: 0, padding: "0 6px" }}>
              <ArrowRightIcon size={12} color={T.textDim} />
            </div>
          )}
        </div>
      ))}
      {/* Denied count */}
      <div style={{ flexShrink: 0, paddingLeft: 12, borderLeft: `1px solid ${T.border}`, marginLeft: 8 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            fontSize: 20, fontWeight: 700,
            color: rejectedCount > 0 ? T.textMid : T.textDim,
            lineHeight: 1,
          }}>{rejectedCount}</div>
          <div style={{
            fontSize: 9, fontWeight: 600, color: T.textDim,
            textTransform: "uppercase", letterSpacing: 0.5, marginTop: 4,
          }}>Denied</div>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   Main Portal Component
   ═══════════════════════════════════════════════════ */
export const BugFixPortal = () => {
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    setReports(loadReports());
    const handler = () => setReports(loadReports());
    window.addEventListener("storage", handler);
    const interval = setInterval(() => {
      const fresh = loadReports();
      setReports(prev => {
        if (JSON.stringify(prev) !== JSON.stringify(fresh)) return fresh;
        return prev;
      });
    }, 2000);
    return () => { window.removeEventListener("storage", handler); clearInterval(interval); };
  }, []);

  const updateReport = (id, updates) => {
    setReports(prev => {
      const next = prev.map(r => r.id === id ? { ...r, ...updates } : r);
      saveReports(next);
      return next;
    });
  };

  const deleteReport = (id) => {
    setReports(prev => {
      const next = prev.filter(r => r.id !== id);
      saveReports(next);
      return next;
    });
  };

  const filtered = filter === "all" ? reports : reports.filter(r => r.status === filter);

  const FILTERS = [
    { key: "all", label: "All" },
    { key: "submitted", label: "Submitted" },
    { key: "ai-analyzing", label: "Analyzing" },
    { key: "fix-suggested", label: "Fix Ready" },
    { key: "pending-it", label: "Pending IT" },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Denied" },
  ];

  const counts = {};
  FILTERS.forEach(f => {
    counts[f.key] = f.key === "all" ? reports.length : reports.filter(r => r.status === f.key).length;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {reports.length > 0 && <PipelineOverview reports={reports} />}

      {/* Filter Bar — all orange/gray */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        {FILTERS.map(f => {
          const active = filter === f.key;
          const hasItems = (counts[f.key] || 0) > 0;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "5px 12px", borderRadius: 7, border: "none", cursor: "pointer",
                fontSize: 11, fontWeight: 600, fontFamily: "inherit",
                background: active ? T.accent + "18" : T.bg3,
                color: active ? T.accent : hasItems ? T.textMid : T.textDim,
                transition: "all 0.15s",
              }}
            >
              {f.label}
              <span style={{
                fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 8,
                background: active ? T.accent + "25" : T.bg4 || T.border,
                color: active ? T.accent : T.textDim,
                minWidth: 14, textAlign: "center",
              }}>{counts[f.key] || 0}</span>
            </button>
          );
        })}
      </div>

      {/* Reports */}
      {filtered.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "48px 20px",
          background: T.bg2, borderRadius: 10, border: `1px solid ${T.border}`,
        }}>
          <BugIcon size={32} color={T.textDim} />
          <div style={{ fontSize: 14, color: T.textMid, marginTop: 12 }}>
            {filter === "all" ? "No bug reports yet" : `No ${FILTERS.find(f => f.key === filter)?.label?.toLowerCase()} reports`}
          </div>
          <div style={{ fontSize: 12, color: T.textDim, marginTop: 4 }}>
            Submit a bug using the bug icon in the sidebar
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered
            .sort((a, b) => {
              const sevOrder = { critical: 0, high: 1, medium: 2, low: 3 };
              const sevDiff = (sevOrder[a.severity] ?? 2) - (sevOrder[b.severity] ?? 2);
              if (sevDiff !== 0) return sevDiff;
              return b.timestamp - a.timestamp;
            })
            .map((report, i) => (
              <ReportCard
                key={report.id || i}
                report={report}
                onUpdate={updateReport}
                onDelete={deleteReport}
              />
            ))}
        </div>
      )}
    </div>
  );
};

export const getBugReportCountForPortal = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).length : 0;
  } catch { return 0; }
};
