import { useState, useRef, useEffect } from "react";
import { T } from "@core/theme/theme";
import { useSimDate } from "@core/simulation/SimDateContext";
import { useBadge } from "@core/users/BadgeContext";
import { useAgentConfig } from "./AgentConfigContext";
import { isLiveMode, askAgent, askTeam } from "./services/claudeService";
import { useViewport } from "@core/routing/useViewport";

// ═══════════════════════════════════════════════════════════════════
//  ICONS
// ═══════════════════════════════════════════════════════════════════
const ChatIcon = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);
const MultiChatIcon = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    <path d="M17 8h2a2 2 0 0 1 2 2v7l-3-3h-5a2 2 0 0 1-2-2" opacity=".4" />
  </svg>
);
const BackIcon = () => (
  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
);
const SendIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);
const DrilldownIcon = ({ color = T.textDim }) => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);
const HistoryIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);
const ChevronDown = ({ open }) => (
  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    style={{ transition: "transform .15s", transform: open ? "rotate(180deg)" : "rotate(0)" }}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
const StarIcon = () => (
  <svg width={12} height={12} viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);
const TeamIcon = () => (
  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const ExpandTallIcon = () => (
  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="7 4 12 0 17 4" /><polyline points="7 20 12 24 17 20" /><line x1="12" y1="1" x2="12" y2="23" />
  </svg>
);
const ExpandFullIcon = () => (
  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" /><line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
  </svg>
);
const ShrinkIcon = () => (
  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="4 14 10 14 10 20" /><polyline points="20 10 14 10 14 4" /><line x1="14" y1="10" x2="21" y2="3" /><line x1="3" y1="21" x2="10" y2="14" />
  </svg>
);

// ═══════════════════════════════════════════════════════════════════
//  CHECKBOX
// ═══════════════════════════════════════════════════════════════════
const Checkbox = ({ checked, color, onChange, partial }) => (
  <button onClick={(e) => { e.stopPropagation(); onChange(); }} style={{
    width: 18, height: 18, borderRadius: 4, flexShrink: 0,
    background: checked ? color : "transparent",
    border: `2px solid ${checked ? color : T.borderLight}`,
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
    transition: "all .12s", padding: 0,
  }}>
    {checked && !partial && <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
    {partial && <div style={{ width: 8, height: 2, background: "#1A1A1A", borderRadius: 1 }} />}
  </button>
);

// ═══════════════════════════════════════════════════════════════════
//  HISTORY BADGE
// ═══════════════════════════════════════════════════════════════════
const HistoryBadge = ({ count, color }) => {
  if (!count) return null;
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, background: color + "25", color,
      padding: "1px 6px", borderRadius: 8, display: "inline-flex", alignItems: "center", gap: 3,
    }}>
      <HistoryIcon /> {count}
    </span>
  );
};

// ═══════════════════════════════════════════════════════════════════
//  VIEW MODE — resize controls, container styles, backdrop
// ═══════════════════════════════════════════════════════════════════
const Backdrop = ({ onClick }) => (
  <div onClick={onClick} style={{
    position: "fixed", inset: 0, zIndex: 999,
    background: "rgba(0,0,0,.45)", backdropFilter: "blur(2px)",
    transition: "opacity .25s",
  }} />
);

const getContainerStyle = (viewMode, defaults) => {
  const base = {
    position: "fixed", zIndex: 1000,
    background: T.bg1, display: "flex", flexDirection: "column",
    overflow: "hidden", fontFamily: "inherit",
    transition: "all .25s ease",
  };
  if (viewMode === "mobile") {
    return {
      ...base,
      inset: 0, width: "auto", height: "auto",
      borderRadius: 0, border: "none", boxShadow: "none",
      maxHeight: "100vh",
    };
  }
  if (viewMode === "tall") {
    return {
      ...base,
      top: 0, right: 0, bottom: 0,
      width: defaults.width || 560,
      height: "100vh",
      borderRadius: "16px 0 0 16px",
      border: `1px solid ${defaults.borderColor || T.accent + "40"}`,
      boxShadow: `0 0 60px rgba(0,0,0,.5), 0 0 0 1px ${defaults.borderColor || T.accent + "20"}`,
    };
  }
  if (viewMode === "fullscreen") {
    return {
      ...base,
      top: 16, left: 16, right: 16, bottom: 16,
      width: "auto", height: "auto",
      borderRadius: 16,
      border: `1px solid ${defaults.borderColor || T.accent + "40"}`,
      boxShadow: `0 8px 60px rgba(0,0,0,.6), 0 0 0 1px ${defaults.borderColor || T.accent + "20"}`,
    };
  }
  // default
  return {
    ...base,
    bottom: 24, right: 24,
    width: defaults.width || 560, height: defaults.height || 640,
    maxWidth: "calc(100vw - 48px)", maxHeight: "calc(100vh - 80px)",
    borderRadius: 16,
    border: `1px solid ${defaults.borderColor || T.accent + "40"}`,
    boxShadow: `0 8px 40px rgba(0,0,0,.4), 0 0 0 1px ${defaults.borderColor || T.accent + "20"}`,
  };
};

const viewControlBtn = {
  background: "transparent", border: `1px solid ${T.border}`,
  borderRadius: 6, padding: "4px 7px", cursor: "pointer",
  color: T.textDim, lineHeight: 1, display: "inline-flex", alignItems: "center",
  transition: "color .12s, border-color .12s",
};

const ViewModeControls = ({ viewMode, setViewMode, onClose }) => (
  <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
    {/* Tall / sidebar toggle */}
    <button
      onClick={() => setViewMode(viewMode === "tall" ? "default" : "tall")}
      title={viewMode === "tall" ? "Restore default size" : "Expand to full height"}
      style={{ ...viewControlBtn, color: viewMode === "tall" ? T.accent : T.textDim, borderColor: viewMode === "tall" ? T.accent + "50" : T.border }}
      onMouseEnter={e => { e.currentTarget.style.color = T.accent; e.currentTarget.style.borderColor = T.accent + "50"; }}
      onMouseLeave={e => { if (viewMode !== "tall") { e.currentTarget.style.color = T.textDim; e.currentTarget.style.borderColor = T.border; } }}
    >
      {viewMode === "tall" ? <ShrinkIcon /> : <ExpandTallIcon />}
    </button>
    {/* Fullscreen toggle */}
    <button
      onClick={() => setViewMode(viewMode === "fullscreen" ? "default" : "fullscreen")}
      title={viewMode === "fullscreen" ? "Restore default size" : "Expand to fullscreen"}
      style={{ ...viewControlBtn, color: viewMode === "fullscreen" ? T.accent : T.textDim, borderColor: viewMode === "fullscreen" ? T.accent + "50" : T.border }}
      onMouseEnter={e => { e.currentTarget.style.color = T.accent; e.currentTarget.style.borderColor = T.accent + "50"; }}
      onMouseLeave={e => { if (viewMode !== "fullscreen") { e.currentTarget.style.color = T.textDim; e.currentTarget.style.borderColor = T.border; } }}
    >
      {viewMode === "fullscreen" ? <ShrinkIcon /> : <ExpandFullIcon />}
    </button>
    {/* Minimize / close */}
    <button onClick={onClose} title="Minimize" style={{ ...viewControlBtn, fontSize: 16 }}>—</button>
  </div>
);

// ═══════════════════════════════════════════════════════════════════
//  COLLAPSIBLE SPECIALIST CARD — summary with expand to full answer
// ═══════════════════════════════════════════════════════════════════
const SpecialistCard = ({ spec, color }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{
      background: T.bg3, border: `1px solid ${T.border}`,
      borderRadius: 8, overflow: "hidden", transition: "border-color .15s",
    }}>
      {/* Summary row — always visible, clickable */}
      <button onClick={() => setExpanded(!expanded)} style={{
        width: "100%", display: "flex", alignItems: "center", gap: 8,
        padding: "8px 12px", background: "transparent", border: "none",
        cursor: "pointer", textAlign: "left",
      }}>
        <div style={{ width: 5, height: 5, borderRadius: "50%", background: color, flexShrink: 0, boxShadow: `0 0 4px ${color}` }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.text }}>{spec.name}</div>
          <div style={{ fontSize: 10, color: T.textMid }}>{spec.role}</div>
        </div>
        <div style={{ flex: 2, fontSize: 11, color: T.textMid, lineHeight: 1.4, padding: "0 8px" }}>
          {spec.summary}
        </div>
        <ChevronDown open={expanded} />
      </button>
      {/* Full response — shown on expand */}
      {expanded && (
        <div style={{
          padding: "10px 14px", borderTop: `1px solid ${T.border}`,
          background: T.bg2, fontSize: 12, color: T.text, lineHeight: 1.6, whiteSpace: "pre-wrap",
        }}>
          {spec.fullResponse}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
//  MANAGER DELEGATION CARD — one per selected EA
//  Shows: manager header → specialist summaries → recommendation
// ═══════════════════════════════════════════════════════════════════
const ManagerDelegationCard = ({ delegation, color }) => {
  const { lead, specialists, recommendation } = delegation;
  return (
    <div style={{
      background: T.bg2, border: `1px solid ${color}30`, borderLeft: `3px solid ${color}`,
      borderRadius: "4px 12px 12px 12px", overflow: "hidden",
    }}>
      {/* Manager header */}
      <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 7, flexShrink: 0,
          background: color + "25", border: `1px solid ${color}50`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, boxShadow: `0 0 6px ${color}` }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color }}>{lead.name}</div>
          <div style={{ fontSize: 10, color: T.textMid }}>{lead.role} · Manager</div>
        </div>
        <span style={{
          fontSize: 9, fontWeight: 600, background: color + "20", color,
          padding: "2px 8px", borderRadius: 6, display: "flex", alignItems: "center", gap: 3,
        }}>
          <TeamIcon /> {specialists.length} consulted
        </span>
      </div>

      {/* Specialist responses — collapsible summary cards */}
      {specialists.length > 0 && (
        <div style={{ padding: "0 12px 10px", display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ fontSize: 9, color: T.textDim, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600, padding: "4px 4px 2px" }}>
            Team Responses
          </div>
          {specialists.map((spec, i) => (
            <SpecialistCard key={spec.id || i} spec={spec} color={color} />
          ))}
        </div>
      )}

      {/* Manager's synthesized recommendation */}
      <div style={{
        padding: "12px 16px", borderTop: `1px solid ${color}20`,
        background: color + "08",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
          <StarIcon />
          <span style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Manager Recommendation
          </span>
        </div>
        <div style={{ fontSize: 12, color: T.text, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
          {recommendation}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
//  CONVERSATION THREAD — renders user questions + delegation cards
// ═══════════════════════════════════════════════════════════════════
const ConversationThread = ({ conversation }) => {
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [conversation]);

  return (
    <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>
      {conversation.map((round, ri) => (
        <div key={ri}>
          {/* User question */}
          <div style={{ padding: "10px 16px", display: "flex", justifyContent: "flex-end" }}>
            <div style={{
              background: T.accent + "25", border: `1px solid ${T.accent}40`,
              borderRadius: "12px 12px 4px 12px", padding: "10px 14px",
              fontSize: 12, color: T.text, lineHeight: 1.5, maxWidth: "85%",
            }}>{round.question}</div>
          </div>
          {/* Manager delegation cards */}
          <div style={{ padding: "8px 14px", display: "flex", flexDirection: "column", gap: 12 }}>
            {round.delegations.map((d, di) => (
              <ManagerDelegationCard key={d.lead.id + "-" + di} delegation={d} color={d.color} />
            ))}
          </div>
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
//  DIRECTORY ITEM WITH CHECKBOX
// ═══════════════════════════════════════════════════════════════════
const EaCheckboxItem = ({ ea, checked, onToggle, onDrilldown, historyCount }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "8px 10px", borderRadius: 8,
        background: hovered ? ea.color + "10" : checked ? ea.color + "08" : "transparent",
        border: `1px solid ${checked ? ea.color + "40" : hovered ? ea.color + "20" : "transparent"}`,
        transition: "all .12s", marginBottom: 2, cursor: "pointer",
      }}
      onClick={onToggle}
    >
      <Checkbox checked={checked} color={ea.color} onChange={onToggle} />
      <div style={{
        width: 28, height: 28, borderRadius: 7, flexShrink: 0,
        background: ea.color + "20", border: `1px solid ${ea.color}40`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ width: 7, height: 7, borderRadius: "50%", background: ea.color, boxShadow: `0 0 5px ${ea.color}` }} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{ea.name}</span>
          <HistoryBadge count={historyCount} color={ea.color} />
        </div>
        <div style={{ fontSize: 10, color: T.textMid }}>{ea.department} · {ea.teamSize} agents</div>
      </div>
      <button onClick={e => { e.stopPropagation(); onDrilldown(); }} title="View agent details" style={{
        background: hovered ? T.bg3 : "transparent", border: `1px solid ${hovered ? T.border : "transparent"}`,
        borderRadius: 6, padding: "4px 6px", cursor: "pointer",
      }}>
        <DrilldownIcon />
      </button>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
//  LIVE AI INDICATORS
// ═══════════════════════════════════════════════════════════════════
const LiveBadge = ({ isLive }) => (
  <span style={{
    fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 6,
    background: isLive ? T.green + "25" : T.textDim + "25",
    color: isLive ? T.green : T.textDim,
    display: "inline-flex", alignItems: "center", gap: 3,
  }}>
    <div style={{ width: 5, height: 5, borderRadius: "50%", background: isLive ? T.green : T.textDim }} />
    {isLive ? "Live AI" : "Simulated"}
  </span>
);

const StreamingBubble = ({ text, color }) => (
  <div style={{ padding: "8px 14px" }}>
    <div style={{
      background: T.bg2, border: `1px solid ${color}30`, borderLeft: `3px solid ${color}`,
      borderRadius: "4px 12px 12px 12px", padding: "12px 16px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
        <div style={{
          width: 6, height: 6, borderRadius: "50%", background: color,
          animation: "pulse 1.5s ease-in-out infinite",
          boxShadow: `0 0 6px ${color}`,
        }} />
        <span style={{ fontSize: 11, fontWeight: 600, color, textTransform: "uppercase", letterSpacing: 0.5 }}>
          AI Responding...
        </span>
      </div>
      {text ? (
        <div style={{ fontSize: 12, color: T.text, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{text}</div>
      ) : (
        <div style={{ fontSize: 12, color: T.textDim }}>Thinking...</div>
      )}
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════
//  buildDelegation — Generates the full manager delegation for one EA
//  Each EA (lead) consults their specialists, then provides a
//  synthesized recommendation.
// ═══════════════════════════════════════════════════════════════════
const buildDelegation = (ea, question) => {
  const lead = ea.agentTeam.lead;
  const specs = ea.agentTeam.specialists || [];

  // Each specialist generates their response from their skill perspective
  const specialistResponses = specs.map(spec => {
    const skillList = (spec.skills || []).slice(0, 3).join(", ");
    const sourceList = (spec.dataSources || []).slice(0, 3).join(", ");
    return {
      id: spec.id,
      name: spec.name,
      role: spec.role,
      summary: `[Simulated] ${spec.name} highlights insights from ${spec.role.toLowerCase()} perspective, reviewing ${skillList || "their domain"}.`,
      fullResponse: `[${spec.name} is processing your question...]\n\nThis is a simulated response. In production, ${spec.name} will analyze: "${question}"\n\nSkills applied: ${skillList || "N/A"}\nData sources consulted: ${sourceList || "N/A"}\n\nAs the ${spec.role} specialist, this agent provides deep analysis from their area of expertise, drawing on real-time data from the Executive Intelligence Platform.`,
    };
  });

  // Manager's synthesized recommendation
  const specNames = specs.map(s => s.name).join(", ");
  const recommendation = `[Simulated] After consulting ${specs.length} specialist${specs.length !== 1 ? "s" : ""} (${specNames || "none"}), ${lead.name} synthesizes the following recommendation:\n\nIn production, this will be a unified analysis that weighs each specialist's perspective — identifying consensus, flagging disagreements, and providing an actionable recommendation based on the combined intelligence of the full ${ea.department || "department"} team.`;

  return {
    lead,
    color: ea.color,
    eaId: ea.id,
    department: ea.department,
    specialists: specialistResponses,
    recommendation,
  };
};

// ═══════════════════════════════════════════════════════════════════
//  AgentChat — Used on VP/exec pages. Manager delegation pattern.
// ═══════════════════════════════════════════════════════════════════
export const AgentChat = ({ agentTeam, color = T.accent, onAgentClick }) => {
  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState("default"); // "default" | "tall" | "fullscreen"
  const [conversation, setConversation] = useState([]);
  const [agentHistories, setAgentHistories] = useState({});
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamText, setStreamText] = useState("");
  const inputRef = useRef(null);

  const { simDate, historyDepth } = useSimDate();
  const { activeUser } = useBadge();
  const { getAgent } = useAgentConfig();
  const liveMode = isLiveMode();
  const { isMobile } = useViewport();

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 200); }, [open]);

  // Escape key to step back: fullscreen → tall → default → close
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        if (viewMode === "fullscreen") setViewMode("tall");
        else if (viewMode === "tall") setViewMode("default");
        else { setOpen(false); setViewMode("default"); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, viewMode]);

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput("");
    const timestamp = new Date().toISOString();

    const fakeEa = { agentTeam, color, id: agentTeam.lead.id, department: agentTeam.lead.role };
    let delegation;

    if (liveMode) {
      setLoading(true);
      setStreamText("Consulting specialists...");
      try {
        delegation = await askTeam({
          agentTeam,
          question: msg,
          history: conversation.flatMap(r => [
            { role: "user", content: r.question },
            { role: "assistant", content: r.delegations[0]?.recommendation || "" },
          ]).slice(-10),
          simDate,
          user: activeUser,
          eaId: fakeEa.id,
          department: fakeEa.department,
          color,
          getAgent,
          historyDepth,
          onProgress: (phase, detail) => {
            if (phase === "specialists") {
              setStreamText(`Consulting specialists... (${detail.completed}/${detail.total})`);
            } else if (phase === "lead") {
              setStreamText("Lead synthesizing team input...");
            }
          },
        });
      } catch (err) {
        delegation = {
          lead: agentTeam.lead, color, eaId: fakeEa.id, department: fakeEa.department,
          specialists: [], recommendation: `[Error] ${err.message}`, isLive: true,
        };
      }
      setLoading(false);
      setStreamText("");
    } else {
      delegation = buildDelegation(fakeEa, msg);
    }

    setConversation(prev => [...prev, { question: msg, delegations: [delegation] }]);

    // Update per-agent histories — lead + each specialist
    setAgentHistories(prev => {
      const next = { ...prev };
      if (!next[delegation.lead.id]) next[delegation.lead.id] = [];
      next[delegation.lead.id] = [...next[delegation.lead.id], {
        question: msg, response: delegation.recommendation, timestamp, role: "manager",
      }];
      delegation.specialists.forEach(spec => {
        if (!next[spec.id]) next[spec.id] = [];
        next[spec.id] = [...next[spec.id], {
          question: msg, response: spec.fullResponse, timestamp, role: "specialist",
        }];
      });
      return next;
    });
  };

  const handleKeyDown = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

  const handleClose = () => { setOpen(false); setViewMode("default"); };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} style={{
        position: "fixed", bottom: isMobile ? 16 : 24, right: isMobile ? 16 : 24, zIndex: 1000,
        display: "flex", alignItems: "center", gap: 10,
        background: color, color: "#1A1A1A",
        border: "none", borderRadius: 14, padding: isMobile ? "16px 24px" : "14px 22px",
        cursor: "pointer", fontWeight: 700, fontSize: isMobile ? 14 : 13,
        boxShadow: `0 4px 24px ${color}40, 0 2px 8px rgba(0,0,0,.3)`,
        transition: "transform .15s, box-shadow .15s", fontFamily: "inherit",
      }}
        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
      >
        <MultiChatIcon />
        Ask AI Agents
      </button>
    );
  }

  const effectiveMode = isMobile ? "mobile" : viewMode;
  const containerStyle = getContainerStyle(effectiveMode, { width: 520, height: 620, borderColor: color + "40" });

  return (
    <>
      {viewMode === "fullscreen" && !isMobile && <Backdrop onClick={() => setViewMode("default")} />}
      <div style={containerStyle}>
        {/* Header */}
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border}`, background: color + "12", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.text, display: "flex", alignItems: "center", gap: 8 }}>
              Ask AI Agents <LiveBadge isLive={liveMode} />
            </div>
            <div style={{ fontSize: 11, color: T.textMid, marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
              <TeamIcon /> {agentTeam.lead.name} + {agentTeam.specialists.length} specialists
            </div>
          </div>
          <ViewModeControls viewMode={viewMode} setViewMode={setViewMode} onClose={handleClose} />
        </div>

        {/* Conversation */}
        {conversation.length > 0 || loading ? (
          <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>
            <ConversationThread conversation={conversation} />
            {loading && <StreamingBubble text={streamText} color={color} />}
          </div>
        ) : (
          <div style={{ flex: 1, overflow: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 12, color: T.textMid, lineHeight: 1.5 }}>
              Ask a question and <strong style={{ color }}>{agentTeam.lead.name}</strong> will consult their team of {agentTeam.specialists.length} specialists, gather each perspective, and deliver a synthesized recommendation.
            </div>
            <div style={{ fontSize: 10, color: T.textDim, marginTop: 4, lineHeight: 1.5 }}>
              Team: {agentTeam.specialists.map(s => s.name).join(", ")}
            </div>
          </div>
        )}

        {/* Input */}
        <div style={{ padding: "12px 14px", borderTop: `1px solid ${T.border}`, display: "flex", gap: 8, alignItems: "flex-end", background: T.bg2 }}>
          <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
            placeholder={`Ask ${agentTeam.lead.name}'s team...`}
            rows={1}
            style={{
              flex: 1, background: T.bg0, border: `1px solid ${T.border}`,
              borderRadius: 10, padding: "10px 14px", color: T.text,
              fontSize: 12, lineHeight: 1.4, resize: "none",
              fontFamily: "inherit", outline: "none", maxHeight: 80, overflow: "auto",
            }}
            onFocus={e => e.currentTarget.style.borderColor = color}
            onBlur={e => e.currentTarget.style.borderColor = T.border}
          />
          <button onClick={() => sendMessage()} disabled={!input.trim()} style={{
            background: input.trim() ? color : T.bg3,
            border: "none", borderRadius: 10, padding: "10px 14px",
            cursor: input.trim() ? "pointer" : "default",
            color: input.trim() ? "#1A1A1A" : T.textDim,
            fontWeight: 700, fontSize: 12, fontFamily: "inherit", transition: "background .15s", flexShrink: 0,
          }}>
            <SendIcon />
          </button>
        </div>
      </div>
    </>
  );
};

// ═══════════════════════════════════════════════════════════════════
//  GlobalAgentFab — Multi-EA selection, each EA delegates to team
// ═══════════════════════════════════════════════════════════════════
export const GlobalAgentFab = ({ directory, onNavigate, preSelectedIds = [], contextAgents = [] }) => {
  // Merge contextAgents into directory (meeting agents at front)
  const fullDirectory = contextAgents.length > 0
    ? [...contextAgents.filter(ca => !directory.some(d => d.id === ca.id)), ...directory]
    : directory;

  const [mode, setMode] = useState("closed");
  const [viewMode, setViewMode] = useState("default"); // "default" | "tall" | "fullscreen"
  const [selectedAgents, setSelectedAgents] = useState([]);
  const [search, setSearch] = useState("");
  const [checkedIds, setCheckedIds] = useState(() => new Set(preSelectedIds));
  const [conversation, setConversation] = useState([]);
  const [agentHistories, setAgentHistories] = useState({});
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamText, setStreamText] = useState("");
  const inputRef = useRef(null);

  const { simDate, historyDepth } = useSimDate();
  const { activeUser } = useBadge();
  const { getAgent } = useAgentConfig();
  const liveMode = isLiveMode();
  const { isMobile } = useViewport();
  const effectiveMode = isMobile ? "mobile" : viewMode;

  // Reset checkedIds when preSelectedIds changes (page navigation)
  useEffect(() => {
    setCheckedIds(new Set(preSelectedIds));
    if (mode === "chat") { setMode("closed"); setConversation([]); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preSelectedIds.join(",")]);

  useEffect(() => { if (mode === "chat") setTimeout(() => inputRef.current?.focus(), 200); }, [mode]);

  // Escape key to step back: fullscreen → tall → default, or close
  useEffect(() => {
    if (mode === "closed") return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        if (viewMode === "fullscreen") setViewMode("tall");
        else if (viewMode === "tall") setViewMode("default");
        else { setMode("closed"); setViewMode("default"); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode, viewMode]);

  const toggleEa = (ea) => {
    setCheckedIds(prev => {
      const next = new Set(prev);
      if (next.has(ea.id)) next.delete(ea.id); else next.add(ea.id);
      return next;
    });
  };

  const toggleBranch = (branchAgents) => {
    setCheckedIds(prev => {
      const next = new Set(prev);
      const allChecked = branchAgents.every(ea => next.has(ea.id));
      branchAgents.forEach(ea => {
        if (allChecked) next.delete(ea.id); else next.add(ea.id);
      });
      return next;
    });
  };

  const selectAll = () => {
    if (checkedIds.size === fullDirectory.length) setCheckedIds(new Set());
    else setCheckedIds(new Set(fullDirectory.map(ea => ea.id)));
  };

  const proceedToChat = () => {
    const selected = fullDirectory.filter(ea => checkedIds.has(ea.id));
    setSelectedAgents(selected);
    setMode("chat");
    setConversation([]);
    setInput("");
  };

  const backToDirectory = () => {
    setMode("directory");
  };

  const handleClose = () => {
    setMode("closed");
    setViewMode("default");
  };

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg || selectedAgents.length === 0 || loading) return;
    setInput("");
    const timestamp = new Date().toISOString();

    let delegations;

    if (liveMode) {
      setLoading(true);
      setStreamText("Consulting agent teams...");
      try {
        const results = await Promise.all(
          selectedAgents.map(async (ea) => {
            try {
              return await askTeam({
                agentTeam: ea.agentTeam,
                question: msg,
                history: conversation.flatMap(r => [
                  { role: "user", content: r.question },
                  ...r.delegations.filter(d => d.eaId === ea.id).map(d => ({
                    role: "assistant", content: d.recommendation,
                  })),
                ]).slice(-10),
                simDate,
                user: activeUser,
                eaId: ea.id,
                department: ea.department,
                color: ea.color,
                getAgent,
                historyDepth,
                onProgress: selectedAgents.length === 1
                  ? (phase, detail) => {
                      if (phase === "specialists") {
                        setStreamText(`Consulting specialists... (${detail.completed}/${detail.total})`);
                      } else {
                        setStreamText("Lead synthesizing...");
                      }
                    }
                  : undefined,
              });
            } catch (err) {
              return {
                lead: ea.agentTeam.lead, color: ea.color, eaId: ea.id, department: ea.department,
                specialists: [], recommendation: `[Error] ${err.message}`, isLive: true,
              };
            }
          })
        );
        delegations = results;
      } catch (err) {
        delegations = selectedAgents.map(ea => ({
          lead: ea.agentTeam.lead, color: ea.color, eaId: ea.id, department: ea.department,
          specialists: [], recommendation: `[Error] ${err.message}`, isLive: true,
        }));
      }
      setLoading(false);
      setStreamText("");
    } else {
      delegations = selectedAgents.map(ea => buildDelegation(ea, msg));
    }

    setConversation(prev => [...prev, { question: msg, delegations }]);

    // Update per-agent histories for every agent involved
    setAgentHistories(prev => {
      const next = { ...prev };
      delegations.forEach(d => {
        if (!next[d.lead.id]) next[d.lead.id] = [];
        next[d.lead.id] = [...next[d.lead.id], {
          question: msg, response: d.recommendation, timestamp, role: "manager",
        }];
        d.specialists.forEach(spec => {
          if (!next[spec.id]) next[spec.id] = [];
          next[spec.id] = [...next[spec.id], {
            question: msg, response: spec.fullResponse, timestamp, role: "specialist",
          }];
        });
      });
      return next;
    });
  };

  const handleKeyDown = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

  // Count total history entries for an EA (lead + specialists)
  const eaHistoryCount = (ea) => {
    let count = (agentHistories[ea.agentTeam?.lead?.id] || []).length;
    (ea.agentTeam?.specialists || []).forEach(s => {
      count += (agentHistories[s.id] || []).length;
    });
    return count;
  };

  // ── CLOSED ──
  if (mode === "closed") {
    const totalHistory = Object.values(agentHistories).reduce((sum, h) => sum + h.length, 0);
    const handleOpen = () => {
      if (preSelectedIds.length > 0 && checkedIds.size > 0) {
        const selected = fullDirectory.filter(ea => checkedIds.has(ea.id));
        if (selected.length > 0) { setSelectedAgents(selected); setMode("chat"); setConversation([]); setInput(""); return; }
      }
      setMode("directory");
    };
    return (
      <button onClick={handleOpen} style={{
        position: "fixed", bottom: isMobile ? 16 : 24, right: isMobile ? 16 : 24, zIndex: 1000,
        display: "flex", alignItems: "center", gap: 10,
        background: T.accent, color: "#1A1A1A",
        border: "none", borderRadius: 14, padding: isMobile ? "16px 24px" : "14px 22px",
        cursor: "pointer", fontWeight: 700, fontSize: isMobile ? 14 : 13,
        boxShadow: `0 4px 24px ${T.accent}40, 0 2px 8px rgba(0,0,0,.3)`,
        transition: "transform .15s, box-shadow .15s", fontFamily: "inherit",
      }}
        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
      >
        <MultiChatIcon />
        Ask AI Agents
        {totalHistory > 0 && (
          <span style={{
            fontSize: 10, fontWeight: 800, background: "#1A1A1A30",
            padding: "2px 7px", borderRadius: 8, marginLeft: 2,
          }}>{totalHistory}</span>
        )}
      </button>
    );
  }

  // ── CHAT MODE ──
  if (mode === "chat" && selectedAgents.length > 0) {
    const totalSpecialists = selectedAgents.reduce((sum, ea) => sum + (ea.agentTeam?.specialists?.length || 0), 0);
    const chatStyle = getContainerStyle(effectiveMode, { width: 560, height: 640, borderColor: T.accent + "40" });
    return (
      <>
        {viewMode === "fullscreen" && !isMobile && <Backdrop onClick={() => setViewMode("default")} />}
        <div style={chatStyle}>
          {/* Header */}
          <div style={{ padding: "10px 14px", borderBottom: `1px solid ${T.border}`, background: T.accent + "12" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <button onClick={backToDirectory} style={{
                background: "transparent", border: "none", cursor: "pointer",
                padding: "2px 0", display: "flex", alignItems: "center", gap: 5,
                fontSize: 11, color: T.textMid, fontFamily: "inherit", transition: "color .12s",
              }}
                onMouseEnter={e => e.currentTarget.style.color = T.accent}
                onMouseLeave={e => e.currentTarget.style.color = T.textMid}
              >
                <BackIcon /> Agent Directory
              </button>
              <ViewModeControls viewMode={viewMode} setViewMode={setViewMode} onClose={handleClose} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>Multi-Agent Chat</span>
              <span style={{ fontSize: 10, fontWeight: 600, background: T.accent + "30", color: T.accent, padding: "2px 8px", borderRadius: 10 }}>
                {selectedAgents.length} EA{selectedAgents.length > 1 ? "s" : ""} · {totalSpecialists} specialists
              </span>
              <LiveBadge isLive={liveMode} />
            </div>
            {/* EA chips */}
            <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
              {selectedAgents.map(ea => (
                <span key={ea.id} style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  fontSize: 10, fontWeight: 600, color: ea.color,
                  background: ea.color + "15", border: `1px solid ${ea.color}30`,
                  borderRadius: 6, padding: "2px 8px",
                }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: ea.color }} />
                  {ea.name} + {ea.agentTeam?.specialists?.length || 0}
                </span>
              ))}
            </div>
          </div>

          {/* Conversation or empty state */}
          {conversation.length > 0 || loading ? (
            <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>
              <ConversationThread conversation={conversation} />
              {loading && <StreamingBubble text={streamText} color={T.accent} />}
            </div>
          ) : (
            <div style={{ flex: 1, overflow: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: 12, color: T.textMid, lineHeight: 1.5 }}>
                Each selected EA will consult their specialist team, gather perspectives, and deliver a synthesized recommendation. You'll see each specialist's summary with an option to expand for the full response.
              </div>
              <div style={{ fontSize: 10, color: T.textDim, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600, marginTop: 8 }}>Suggested Questions</div>
              {["What is the current status across your area?", "What are the top risks you see right now?", "Summarize key metrics for this week"].map((q, i) => (
                <button key={i} onClick={() => sendMessage(q)} style={{
                  background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 8,
                  padding: "10px 14px", cursor: "pointer", textAlign: "left",
                  fontSize: 12, color: T.text, lineHeight: 1.4, transition: "border-color .15s, background .15s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.background = T.accent + "10"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.bg2; }}
                >{q}</button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ padding: "12px 14px", borderTop: `1px solid ${T.border}`, display: "flex", gap: 8, alignItems: "flex-end", background: T.bg2 }}>
            <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
              placeholder={`Ask ${selectedAgents.length} team${selectedAgents.length > 1 ? "s" : ""}...`}
              rows={1}
              style={{
                flex: 1, background: T.bg0, border: `1px solid ${T.border}`,
                borderRadius: 10, padding: "10px 14px", color: T.text,
                fontSize: 12, lineHeight: 1.4, resize: "none",
                fontFamily: "inherit", outline: "none", maxHeight: 80, overflow: "auto",
              }}
              onFocus={e => e.currentTarget.style.borderColor = T.accent}
              onBlur={e => e.currentTarget.style.borderColor = T.border}
            />
            <button onClick={() => sendMessage()} disabled={!input.trim()} style={{
              background: input.trim() ? T.accent : T.bg3, border: "none", borderRadius: 10, padding: "10px 14px",
              cursor: input.trim() ? "pointer" : "default", color: input.trim() ? "#1A1A1A" : T.textDim,
              fontWeight: 700, fontSize: 12, fontFamily: "inherit", transition: "background .15s", flexShrink: 0,
            }}>
              <SendIcon />
            </button>
          </div>
        </div>
      </>
    );
  }

  // ── DIRECTORY MODE ──
  const filtered = fullDirectory.filter(ea =>
    !search || ea.name.toLowerCase().includes(search.toLowerCase()) ||
    ea.department.toLowerCase().includes(search.toLowerCase())
  );

  const groups = {};
  filtered.forEach(ea => {
    const branch = ea.branch || (
      ea.department === "Executive" ? "Executive" :
      ea.color === T.green ? "Delivering" :
      ea.color === T.purple ? "Operations" :
      ea.color === T.blue ? "Finance" : "Admin"
    );
    if (!groups[branch]) groups[branch] = [];
    groups[branch].push(ea);
  });
  const branchOrder = ["Meeting", "Executive", "Delivering", "Operations", "Finance", "Admin"];

  const dirStyle = getContainerStyle(effectiveMode, { width: 380, height: 600, borderColor: T.accent + "40" });

  return (
    <>
      {viewMode === "fullscreen" && !isMobile && <Backdrop onClick={() => setViewMode("default")} />}
      <div style={dirStyle}>
        {/* Header */}
        <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.border}`, background: T.accent + "12", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>Agent Directory</div>
            <div style={{ fontSize: 11, color: T.textMid, marginTop: 2 }}>Select EAs to consult their teams</div>
          </div>
          <ViewModeControls viewMode={viewMode} setViewMode={setViewMode} onClose={handleClose} />
        </div>

        {/* Search + Select All */}
        <div style={{ padding: "10px 14px", borderBottom: `1px solid ${T.border}`, display: "flex", gap: 8, alignItems: "center" }}>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search agents..."
            style={{
              flex: 1, background: T.bg0, border: `1px solid ${T.border}`,
              borderRadius: 8, padding: "8px 12px", color: T.text,
              fontSize: 12, fontFamily: "inherit", outline: "none", boxSizing: "border-box",
            }}
            onFocus={e => e.currentTarget.style.borderColor = T.accent}
            onBlur={e => e.currentTarget.style.borderColor = T.border}
          />
          <button onClick={selectAll} style={{
            background: "transparent", border: `1px solid ${T.border}`, borderRadius: 6,
            padding: "6px 10px", cursor: "pointer", fontSize: 10, fontWeight: 600,
            color: T.accent, fontFamily: "inherit", whiteSpace: "nowrap",
          }}>
            {checkedIds.size === fullDirectory.length ? "None" : "All"}
          </button>
        </div>

        {/* Agent list */}
        <div style={{ flex: 1, overflow: "auto", padding: "4px 8px" }}>
          {branchOrder.map(branch => {
            const agents = groups[branch];
            if (!agents || agents.length === 0) return null;
            const allBranchChecked = agents.every(ea => checkedIds.has(ea.id));
            const someBranchChecked = agents.some(ea => checkedIds.has(ea.id));
            return (
              <div key={branch} style={{ marginBottom: 4 }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "6px 8px",
                  cursor: "pointer",
                }} onClick={() => toggleBranch(agents)}>
                  <Checkbox checked={allBranchChecked || someBranchChecked} partial={someBranchChecked && !allBranchChecked} color={T.accent} onChange={() => toggleBranch(agents)} />
                  <span style={{ fontSize: 10, color: T.textDim, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>{branch}</span>
                  <span style={{ fontSize: 9, color: T.textDim }}>({agents.length})</span>
                </div>
                {agents.map(ea => (
                  <EaCheckboxItem
                    key={ea.id}
                    ea={ea}
                    checked={checkedIds.has(ea.id)}
                    onToggle={() => toggleEa(ea)}
                    onDrilldown={() => { onNavigate(`agent-${ea.id}`); setMode("closed"); }}
                    historyCount={eaHistoryCount(ea)}
                  />
                ))}
              </div>
            );
          })}
          {filtered.length === 0 && <div style={{ fontSize: 12, color: T.textDim, padding: 20, textAlign: "center" }}>No agents match your search</div>}
        </div>

        {/* Bottom action bar */}
        <div style={{
          padding: "12px 14px", borderTop: `1px solid ${T.border}`, background: T.bg2,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span style={{ fontSize: 12, color: checkedIds.size > 0 ? T.text : T.textDim, fontWeight: 600 }}>
            {checkedIds.size > 0 ? `${checkedIds.size} team${checkedIds.size > 1 ? "s" : ""} selected` : "No teams selected"}
          </span>
          <button onClick={proceedToChat} disabled={checkedIds.size === 0} style={{
            background: checkedIds.size > 0 ? T.accent : T.bg3,
            border: "none", borderRadius: 10, padding: "10px 20px",
            cursor: checkedIds.size > 0 ? "pointer" : "default",
            color: checkedIds.size > 0 ? "#1A1A1A" : T.textDim,
            fontWeight: 700, fontSize: 12, fontFamily: "inherit",
            transition: "background .15s", display: "flex", alignItems: "center", gap: 6,
          }}>
            <ChatIcon />
            Ask Teams
          </button>
        </div>
      </div>
    </>
  );
};
