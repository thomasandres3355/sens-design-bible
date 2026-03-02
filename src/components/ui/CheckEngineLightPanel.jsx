import { useState, useRef, useEffect, useMemo } from "react";
import { T } from "../../data/theme";
import { severityColor } from "../../data/alertData";
import { ceoAgentTeam, cooAgentTeam, vpRegistry } from "../../data/vpData";
import { useMobile } from "../../contexts/MobileContext";

/**
 * CheckEngineLightPanel — Prominent alert panel for dashboard & VP anchor pages.
 *
 * Features:
 *   - Severity-coded visual weight (critical = pulsing red, warning = amber, info = blue)
 *   - Agent attribution — shows which agent raised the alert, clickable
 *   - KPI context — shows actual vs target when driven by a KPI miss
 *   - Cross-departmental tagging — shows which departments are affected
 *   - Expandable detail for each alert
 *   - Collapsible panel with alert count badge
 *   - ACTIONS: Resolve, Snooze (with duration), Assign (to executive or AI agent)
 *   - Filter tabs: Active / Snoozed / Resolved / Assigned
 */

const DEPT_LABELS = {
  "vp-engineering": "Engineering",
  "vp-project": "Projects",
  "vp-maint": "Maintenance",
  "vp-ops": "Operations",
  "vp-hse": "Risk",
  "vp-logistics": "Logistics",
  "vp-strategy": "Strategy",
  "vp-finance": "Finance",
  "vp-marketing": "Marketing",
  "vp-it": "IT",
  "vp-ai": "AI",
  "vp-process": "Process",
  "vp-people": "People",
  "vp-legal": "Legal",
};

const SNOOZE_OPTIONS = [
  { label: "1 Hour", ms: 3600000 },
  { label: "4 Hours", ms: 14400000 },
  { label: "1 Day", ms: 86400000 },
  { label: "3 Days", ms: 259200000 },
  { label: "1 Week", ms: 604800000 },
];

// ─── Build assignee list from live data ─────────────────────────────
const buildAssignees = () => {
  const list = [];

  // Executives
  list.push({ type: "header", label: "Executives" });
  list.push({ type: "executive", id: "ceo", name: ceoAgentTeam.title, role: ceoAgentTeam.agentTeam.lead.role, color: ceoAgentTeam.color });
  list.push({ type: "executive", id: "coo", name: cooAgentTeam.title, role: cooAgentTeam.agentTeam.lead.role, color: cooAgentTeam.color });

  // CEO Agent Team
  list.push({ type: "divider", label: `${ceoAgentTeam.title} Agent Team` });
  list.push({ type: "agent", id: ceoAgentTeam.agentTeam.lead.id, name: ceoAgentTeam.agentTeam.lead.name, role: ceoAgentTeam.agentTeam.lead.role, color: ceoAgentTeam.color });
  ceoAgentTeam.agentTeam.specialists.forEach(s => {
    list.push({ type: "agent", id: s.id, name: s.name, role: s.role, color: ceoAgentTeam.color });
  });

  // COO Agent Team
  list.push({ type: "divider", label: `${cooAgentTeam.title} Agent Team` });
  list.push({ type: "agent", id: cooAgentTeam.agentTeam.lead.id, name: cooAgentTeam.agentTeam.lead.name, role: cooAgentTeam.agentTeam.lead.role, color: cooAgentTeam.color });
  cooAgentTeam.agentTeam.specialists.forEach(s => {
    list.push({ type: "agent", id: s.id, name: s.name, role: s.role, color: cooAgentTeam.color });
  });

  // VP Agent Teams
  Object.values(vpRegistry).forEach(vp => {
    list.push({ type: "divider", label: `${vp.title} Agents` });
    list.push({ type: "agent", id: vp.agentTeam.lead.id, name: vp.agentTeam.lead.name, role: `${vp.title} Lead`, color: vp.color });
    vp.agentTeam.specialists.forEach(s => {
      list.push({ type: "agent", id: s.id, name: s.name, role: s.role, color: vp.color });
    });
  });

  return list;
};

const ASSIGNEES = buildAssignees();

const FILTER_TABS = [
  { key: "active", label: "Active" },
  { key: "assigned", label: "Assigned" },
  { key: "snoozed", label: "Snoozed" },
  { key: "resolved", label: "Resolved" },
];

// ─── Tiny dropdown hook ───────────────────────────────────────────────

const useDropdown = () => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return { open, setOpen, ref };
};

// ─── Sub-components ───────────────────────────────────────────────────

const SeverityDot = ({ severity }) => {
  const color = severityColor(severity);
  const isCritical = severity === "critical";
  return (
    <div style={{ position: "relative", width: 14, height: 14, flexShrink: 0 }}>
      {isCritical && (
        <div style={{
          position: "absolute", inset: -3,
          borderRadius: "50%", background: color + "30",
          animation: "cel-pulse 2s ease-in-out infinite",
        }} />
      )}
      <div style={{
        width: 14, height: 14, borderRadius: "50%",
        background: color,
        boxShadow: `0 0 ${isCritical ? 12 : 6}px ${color}`,
        position: "relative",
      }} />
    </div>
  );
};

const KpiBar = ({ actual, target, unit }) => {
  if (actual == null || target == null) return null;
  const pct = Math.min((actual / target) * 100, 100);
  const isBelow = actual < target;
  const barColor = isBelow ? (pct < 75 ? T.danger : T.warn) : T.green;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
      <span style={{ fontSize: 11, color: T.textDim, minWidth: 44 }}>Actual</span>
      <div style={{ flex: 1, height: 6, background: T.bg0, borderRadius: 3, overflow: "hidden", position: "relative" }}>
        <div style={{
          position: "absolute", right: 0, top: -1, bottom: -1, width: 2,
          background: T.textDim, borderRadius: 1, zIndex: 1,
        }} />
        <div style={{
          width: `${pct}%`, height: "100%", background: barColor,
          borderRadius: 3, transition: "width .4s ease",
        }} />
      </div>
      <span style={{ fontSize: 11, color: T.textMid, minWidth: 80, textAlign: "right" }}>
        {actual}{unit} / {target}{unit}
      </span>
    </div>
  );
};

// ─── Action Button ────────────────────────────────────────────────────

const ActionBtn = ({ icon, label, color, onClick, active, style: extraStyle }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick?.(e); }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        padding: "5px 10px", borderRadius: 6,
        border: `1px solid ${active ? color + "50" : (hovered ? color + "40" : T.border)}`,
        background: active ? color + "18" : (hovered ? color + "0C" : "transparent"),
        color: active ? color : (hovered ? color : T.textMid),
        fontSize: 11, fontWeight: 600, cursor: "pointer",
        transition: "all .15s", whiteSpace: "nowrap",
        fontFamily: "inherit",
        ...extraStyle,
      }}
    >
      {icon}
      {label}
    </button>
  );
};

// ─── Snooze Dropdown ──────────────────────────────────────────────────

const SnoozeDropdown = ({ onSnooze }) => {
  const { open, setOpen, ref } = useDropdown();
  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <ActionBtn
        icon={<svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>}
        label="Snooze"
        color={T.warn}
        onClick={() => setOpen(!open)}
        active={open}
      />
      {open && (
        <div style={{
          position: "absolute", bottom: "100%", left: 0, marginBottom: 4,
          background: T.bg1, border: `1px solid ${T.border}`,
          borderRadius: 8, padding: 4, minWidth: 140, zIndex: 100,
          boxShadow: "0 -4px 24px rgba(0,0,0,.4)",
          animation: "cel-expand .15s ease",
        }}>
          <div style={{ padding: "6px 10px", fontSize: 10, color: T.textDim, textTransform: "uppercase", letterSpacing: .8, fontWeight: 600 }}>
            Snooze for...
          </div>
          {SNOOZE_OPTIONS.map(opt => (
            <button
              key={opt.label}
              onClick={(e) => { e.stopPropagation(); onSnooze(opt); setOpen(false); }}
              onMouseEnter={e => e.currentTarget.style.background = T.bg3}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              style={{
                display: "block", width: "100%", textAlign: "left",
                padding: "8px 10px", border: "none", borderRadius: 6,
                background: "transparent", color: T.text, fontSize: 12,
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Assign Dropdown ──────────────────────────────────────────────────

const AssignDropdown = ({ onAssign, currentAssignee }) => {
  const { open, setOpen, ref } = useDropdown();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return ASSIGNEES;
    const q = search.toLowerCase();
    // When searching, filter to matching items + keep dividers/headers only if they have matches after them
    const matches = ASSIGNEES.filter(a =>
      a.type === "divider" || a.type === "header" ||
      a.name.toLowerCase().includes(q) || a.role.toLowerCase().includes(q)
    );
    // Remove orphan dividers/headers (no matching items follow)
    return matches.filter((item, i) => {
      if (item.type !== "divider" && item.type !== "header") return true;
      // Keep divider/header only if next non-divider item exists
      for (let j = i + 1; j < matches.length; j++) {
        if (matches[j].type === "divider" || matches[j].type === "header") return false;
        return true;
      }
      return false;
    });
  }, [search]);

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <ActionBtn
        icon={<svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><path d="M20 8v6" /><path d="M23 11h-6" /></svg>}
        label={currentAssignee ? currentAssignee.name : "Assign"}
        color={T.purple}
        onClick={() => setOpen(!open)}
        active={open || !!currentAssignee}
      />
      {open && (
        <div style={{
          position: "absolute", bottom: "100%", right: 0, marginBottom: 4,
          background: T.bg1, border: `1px solid ${T.border}`,
          borderRadius: 10, padding: 6, minWidth: 260, zIndex: 100,
          boxShadow: "0 -4px 24px rgba(0,0,0,.4)",
          animation: "cel-expand .15s ease",
          maxHeight: 340, display: "flex", flexDirection: "column",
        }}>
          {/* Search */}
          <div style={{ padding: "4px 6px 8px" }}>
            <input
              type="text"
              placeholder="Search executives & agents..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onClick={e => e.stopPropagation()}
              style={{
                width: "100%", padding: "7px 10px", borderRadius: 6,
                border: `1px solid ${T.border}`, background: T.bg0,
                color: T.text, fontSize: 12, fontFamily: "inherit",
                outline: "none", boxSizing: "border-box",
              }}
              onFocus={e => e.currentTarget.style.borderColor = T.accent}
              onBlur={e => e.currentTarget.style.borderColor = T.border}
            />
          </div>

          {/* List */}
          <div style={{ overflowY: "auto", flex: 1 }}>
            {filtered.map((item, i) => {
              if (item.type === "divider" || item.type === "header") {
                return (
                  <div key={`div-${i}`} style={{
                    padding: "8px 10px 4px", fontSize: 10, color: item.type === "header" ? T.accent : T.textDim,
                    textTransform: "uppercase", letterSpacing: .8, fontWeight: 600,
                    borderTop: i > 0 ? `1px solid ${T.border}` : "none",
                    marginTop: i > 0 ? 4 : 0,
                  }}>
                    {item.label}
                  </div>
                );
              }

              const isSelected = currentAssignee?.id === item.id;
              return (
                <button
                  key={item.id}
                  onClick={(e) => { e.stopPropagation(); onAssign(item); setOpen(false); setSearch(""); }}
                  onMouseEnter={e => e.currentTarget.style.background = T.bg3}
                  onMouseLeave={e => e.currentTarget.style.background = isSelected ? item.color + "10" : "transparent"}
                  style={{
                    display: "flex", alignItems: "center", gap: 10, width: "100%",
                    padding: "8px 10px", border: "none", borderRadius: 6,
                    background: isSelected ? item.color + "10" : "transparent",
                    cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                  }}
                >
                  {/* Avatar dot */}
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: item.color + "20", border: `2px solid ${item.color}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    {item.type === "executive" ? (
                      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={item.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                      </svg>
                    ) : (
                      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={item.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="12" cy="5" r="3" />
                      </svg>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{item.name}</div>
                    <div style={{ fontSize: 10, color: T.textDim }}>{item.role}</div>
                  </div>
                  {item.type === "executive" && (
                    <span style={{ fontSize: 9, color: item.color, background: item.color + "18", padding: "2px 6px", borderRadius: 8, fontWeight: 700, letterSpacing: .3 }}>EXEC</span>
                  )}
                  {item.type === "agent" && (
                    <span style={{ fontSize: 9, color: T.purple, background: T.purpleDim, padding: "2px 6px", borderRadius: 8, fontWeight: 700, letterSpacing: .3 }}>AI</span>
                  )}
                  {isSelected && (
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={T.green} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Status Badge (for snoozed / resolved / assigned) ─────────────────

const StatusBadge = ({ status, snoozeLabel, assignee, onUndo }) => {
  const configs = {
    snoozed: { color: T.warn, icon: "⏳", label: `Snoozed · ${snoozeLabel || ""}` },
    resolved: { color: T.green, icon: "✓", label: "Resolved" },
    assigned: { color: T.purple, icon: "→", label: `Assigned to ${assignee?.name || ""}` },
  };
  const c = configs[status];
  if (!c) return null;

  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "4px 10px", borderRadius: 8,
      background: c.color + "12", border: `1px solid ${c.color}30`,
      fontSize: 11, color: c.color, fontWeight: 600,
    }}>
      <span>{c.icon}</span>
      <span>{c.label}</span>
      <button
        onClick={(e) => { e.stopPropagation(); onUndo?.(); }}
        style={{
          background: "none", border: "none", cursor: "pointer",
          color: T.textDim, fontSize: 11, fontFamily: "inherit",
          padding: "0 0 0 4px", display: "inline-flex", alignItems: "center",
        }}
        onMouseEnter={e => e.currentTarget.style.color = T.text}
        onMouseLeave={e => e.currentTarget.style.color = T.textDim}
        title="Undo"
      >
        <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" />
        </svg>
      </button>
    </div>
  );
};


// ─── Alert Row ────────────────────────────────────────────────────────

const AlertRow = ({ alert, onNavigate, expanded, onToggle, alertState, onResolve, onSnooze, onAssign, onUndo }) => {
  const color = severityColor(alert.severity);
  const [hovered, setHovered] = useState(false);
  const state = alertState || {};
  const isDimmed = state.status === "resolved" || state.status === "snoozed";

  return (
    <div
      style={{
        background: expanded ? color + "0A" : (hovered ? T.bg3 : T.bg1),
        border: `1px solid ${expanded ? color + "30" : (hovered ? color + "20" : T.border)}`,
        borderRadius: 10,
        transition: "all .2s",
        overflow: "visible",
        opacity: isDimmed ? 0.6 : 1,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Alert header row — always visible */}
      <div
        onClick={onToggle}
        style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "12px 16px", cursor: "pointer",
        }}
      >
        <SeverityDot severity={alert.severity} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{
              fontSize: 13, fontWeight: 600, color: T.text,
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>
              {alert.label}
            </span>
            <span style={{
              fontSize: 10, fontWeight: 600, letterSpacing: .3,
              color: color, background: color + "18",
              padding: "2px 8px", borderRadius: 10,
              textTransform: "uppercase",
            }}>
              {alert.severity}
            </span>
            {alert.crossDept && (
              <span style={{
                fontSize: 10, color: T.purple, background: T.purpleDim,
                padding: "2px 8px", borderRadius: 10, fontWeight: 600,
              }}>
                Cross-Dept
              </span>
            )}
            {/* Status badge inline */}
            {state.status && (
              <StatusBadge
                status={state.status}
                snoozeLabel={state.snoozeLabel}
                assignee={state.assignee}
                onUndo={onUndo}
              />
            )}
          </div>

          {/* Agent attribution line */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={T.textDim} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
            <span
              onClick={(e) => { e.stopPropagation(); onNavigate?.(`agent-${alert.raisedBy.agentId}`); }}
              style={{
                fontSize: 11, color: T.accent, cursor: "pointer",
                fontWeight: 500, textDecoration: "none",
              }}
              onMouseEnter={e => e.currentTarget.style.textDecoration = "underline"}
              onMouseLeave={e => e.currentTarget.style.textDecoration = "none"}
            >
              {alert.raisedBy.agentName}
            </span>
            <span style={{ fontSize: 11, color: T.textDim }}>· {alert.raisedBy.department}</span>
          </div>
        </div>

        {/* Expand chevron */}
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={T.textDim} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0, transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .2s" }}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{
          padding: "0 16px 14px 42px",
          animation: "cel-expand .2s ease",
        }}>
          <p style={{ margin: "0 0 8px 0", fontSize: 12, color: T.textMid, lineHeight: 1.5 }}>
            {alert.detail}
          </p>

          {/* KPI bar if applicable */}
          {alert.kpi && (
            <KpiBar actual={alert.kpi.actual} target={alert.kpi.target} unit={alert.kpi.unit} />
          )}

          {/* Departments affected */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
            <span style={{ fontSize: 10, color: T.textDim, alignSelf: "center" }}>Affects:</span>
            {alert.targetDepts.map(d => (
              <span key={d}
                onClick={(e) => { e.stopPropagation(); onNavigate?.(d); }}
                style={{
                  fontSize: 10, padding: "2px 8px", borderRadius: 8,
                  background: T.bg3, color: T.textMid, cursor: "pointer",
                  border: `1px solid ${T.border}`, fontWeight: 500,
                  transition: "all .15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.color = T.accent; e.currentTarget.style.borderColor = T.accent + "40"; }}
                onMouseLeave={e => { e.currentTarget.style.color = T.textMid; e.currentTarget.style.borderColor = T.border; }}
              >
                {DEPT_LABELS[d] || d}
              </span>
            ))}
          </div>

          {/* Timestamp */}
          <div style={{ fontSize: 10, color: T.textDim, marginTop: 6 }}>
            {new Date(alert.timestamp).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
          </div>

          {/* ════════ ACTION BAR ════════ */}
          {!state.status && (
            <div style={{
              display: "flex", alignItems: "center", gap: 8, marginTop: 12,
              paddingTop: 12, borderTop: `1px solid ${T.border}`,
            }}>
              <ActionBtn
                icon={<svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>}
                label="Resolve"
                color={T.green}
                onClick={() => onResolve?.(alert.id)}
              />
              <SnoozeDropdown onSnooze={(opt) => onSnooze?.(alert.id, opt)} />
              <AssignDropdown
                onAssign={(assignee) => onAssign?.(alert.id, assignee)}
                currentAssignee={null}
              />
            </div>
          )}

          {/* If already actioned, show undo in the action bar area */}
          {state.status && (
            <div style={{
              display: "flex", alignItems: "center", gap: 8, marginTop: 12,
              paddingTop: 12, borderTop: `1px solid ${T.border}`,
            }}>
              {state.status === "assigned" && (
                <AssignDropdown
                  onAssign={(assignee) => onAssign?.(alert.id, assignee)}
                  currentAssignee={state.assignee}
                />
              )}
              <ActionBtn
                icon={<svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>}
                label="Undo"
                color={T.textMid}
                onClick={() => onUndo?.()}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};


// ═══════════════════════════════════════════════════════════════════════
//  MAIN PANEL
// ═══════════════════════════════════════════════════════════════════════

export const CheckEngineLightPanel = ({ alerts = [], onNavigate, title, color, compact }) => {
  const { isMobile } = useMobile();
  const [expandedId, setExpandedId] = useState(null);
  const [collapsed, setCollapsed] = useState(true);
  const [filter, setFilter] = useState("active");

  // Alert action states: { [alertId]: { status: "resolved"|"snoozed"|"assigned", snoozeLabel, snoozeUntil, assignee } }
  const [alertStates, setAlertStates] = useState({});

  const handleResolve = (id) => {
    setAlertStates(prev => ({ ...prev, [id]: { status: "resolved" } }));
  };

  const handleSnooze = (id, opt) => {
    setAlertStates(prev => ({
      ...prev,
      [id]: { status: "snoozed", snoozeLabel: opt.label, snoozeUntil: Date.now() + opt.ms },
    }));
  };

  const handleAssign = (id, assignee) => {
    setAlertStates(prev => ({
      ...prev,
      [id]: { status: "assigned", assignee },
    }));
  };

  const handleUndo = (id) => {
    setAlertStates(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  // Filter alerts by current tab
  const filteredAlerts = useMemo(() => {
    return alerts.filter(a => {
      const state = alertStates[a.id];
      if (filter === "active") return !state || !state.status;
      if (filter === "resolved") return state?.status === "resolved";
      if (filter === "snoozed") return state?.status === "snoozed";
      if (filter === "assigned") return state?.status === "assigned";
      return true;
    });
  }, [alerts, alertStates, filter]);

  // Counts per tab
  const counts = useMemo(() => {
    const c = { active: 0, resolved: 0, snoozed: 0, assigned: 0 };
    alerts.forEach(a => {
      const state = alertStates[a.id];
      if (!state || !state.status) c.active++;
      else c[state.status]++;
    });
    return c;
  }, [alerts, alertStates]);

  const criticalCount = alerts.filter(a => a.severity === "critical" && !alertStates[a.id]?.status).length;
  const warningCount = alerts.filter(a => a.severity === "warning" && !alertStates[a.id]?.status).length;
  const infoCount = alerts.filter(a => a.severity === "info" && !alertStates[a.id]?.status).length;
  const activeCount = criticalCount + warningCount;

  if (!alerts.length) {
    return (
      <div style={{
        background: T.green + "08", border: `1px solid ${T.green}25`,
        borderRadius: 12, padding: "16px 20px",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <div style={{ width: 14, height: 14, borderRadius: "50%", background: T.green, boxShadow: `0 0 8px ${T.green}` }} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>All Systems Nominal</div>
          <div style={{ fontSize: 11, color: T.textMid }}>No active alerts — if all lights are off, move forward.</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: T.bg2,
      border: `1px solid ${criticalCount > 0 ? T.danger + "40" : T.border}`,
      borderRadius: 12,
      overflow: "visible",
    }}>
      {/* CSS animations */}
      <style>{`
        @keyframes cel-pulse { 0%,100% { opacity: .4; transform: scale(1); } 50% { opacity: .8; transform: scale(1.3); } }
        @keyframes cel-expand { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* Panel Header */}
      <div
        onClick={() => setCollapsed(!collapsed)}
        style={{
          display: "flex", alignItems: "center", gap: isMobile ? 8 : 12,
          flexWrap: isMobile ? "wrap" : "nowrap",
          padding: isMobile ? "12px 14px" : "14px 20px", cursor: "pointer",
          background: criticalCount > 0 ? T.danger + "08" : T.bg3,
          borderBottom: collapsed ? "none" : `1px solid ${T.border}`,
          transition: "all .2s",
          minHeight: isMobile ? 44 : undefined,
        }}
      >
        {/* Engine light icon cluster */}
        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
          {criticalCount > 0 && <SeverityDot severity="critical" />}
          {warningCount > 0 && <SeverityDot severity="warning" />}
          {infoCount > 0 && <SeverityDot severity="info" />}
          {activeCount === 0 && infoCount === 0 && (
            <div style={{ width: 14, height: 14, borderRadius: "50%", background: T.green, boxShadow: `0 0 6px ${T.green}` }} />
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text, textTransform: "uppercase", letterSpacing: .8 }}>
            {title || "System Alerts"}
          </div>
          <div style={{ fontSize: 11, color: T.textMid, marginTop: 2 }}>
            {activeCount > 0
              ? `${activeCount} active alert${activeCount > 1 ? "s" : ""} — ${criticalCount} critical, ${warningCount} warning, ${infoCount} info`
              : counts.active > 0
              ? `${counts.active} info notice${counts.active > 1 ? "s" : ""}`
              : `All ${alerts.length} alerts handled`
            }
          </div>
        </div>

        {/* Collapse chevron */}
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={T.textDim} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0, transform: collapsed ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .2s" }}>
          <path d="M6 9l6 6 6-6" />
        </svg>

        {/* Count badges — wrap to next line on mobile */}
        <div style={{ display: "flex", gap: 6, flexShrink: 0, ...(isMobile ? { width: "100%", marginTop: 4, paddingLeft: 18 } : {}) }}>
          {criticalCount > 0 && (
            <span style={{ fontSize: 11, fontWeight: 700, color: T.danger, background: T.dangerDim, padding: "3px 10px", borderRadius: 12 }}>
              {criticalCount} Critical
            </span>
          )}
          {warningCount > 0 && (
            <span style={{ fontSize: 11, fontWeight: 700, color: T.warn, background: T.warnDim, padding: "3px 10px", borderRadius: 12 }}>
              {warningCount} Warning
            </span>
          )}
          {counts.assigned > 0 && (
            <span style={{ fontSize: 11, fontWeight: 700, color: T.purple, background: T.purpleDim, padding: "3px 10px", borderRadius: 12 }}>
              {counts.assigned} Assigned
            </span>
          )}
        </div>
      </div>

      {/* Filter Tabs + Alert List */}
      {!collapsed && (
        <>
          {/* Filter tabs */}
          <div style={{
            display: "flex", gap: 2, padding: "8px 16px",
            borderBottom: `1px solid ${T.border}`,
            background: T.bg2,
          }}>
            {FILTER_TABS.map(tab => {
              const isActive = filter === tab.key;
              const count = counts[tab.key];
              return (
                <button
                  key={tab.key}
                  onClick={(e) => { e.stopPropagation(); setFilter(tab.key); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 5,
                    padding: "6px 12px", borderRadius: 6,
                    border: "none", cursor: "pointer",
                    background: isActive ? T.accent + "18" : "transparent",
                    color: isActive ? T.accent : T.textDim,
                    fontSize: 11, fontWeight: 600, fontFamily: "inherit",
                    transition: "all .15s",
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = T.bg3; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                >
                  {tab.label}
                  {count > 0 && (
                    <span style={{
                      fontSize: 10, fontWeight: 700,
                      background: isActive ? T.accent + "30" : T.bg4,
                      color: isActive ? T.accent : T.textMid,
                      padding: "1px 6px", borderRadius: 8, minWidth: 18, textAlign: "center",
                    }}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Alert list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: compact ? "10px 12px" : "12px 16px" }}>
            {filteredAlerts.length === 0 && (
              <div style={{
                padding: "20px 16px", textAlign: "center",
                color: T.textDim, fontSize: 12,
              }}>
                {filter === "active" ? "No active alerts — all clear." :
                 filter === "resolved" ? "No resolved alerts yet." :
                 filter === "snoozed" ? "No snoozed alerts." :
                 "No assigned alerts."}
              </div>
            )}
            {filteredAlerts.map(a => (
              <AlertRow
                key={a.id}
                alert={a}
                onNavigate={onNavigate}
                expanded={expandedId === a.id}
                onToggle={() => setExpandedId(expandedId === a.id ? null : a.id)}
                alertState={alertStates[a.id]}
                onResolve={handleResolve}
                onSnooze={handleSnooze}
                onAssign={handleAssign}
                onUndo={() => handleUndo(a.id)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
