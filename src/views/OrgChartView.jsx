import { useState } from "react";
import { T } from "../data/theme";
import { useAuth } from "../contexts/AuthContext";
import { getRoleClearance } from "../data/badgeData";
import { getLandingPageKey } from "../data/landingPageData";

/**
 * vpKeyMap — maps VP titles from the org chart to their vpData keys
 */
const vpKeyMap = {
  "VP Engineering": "vp-engineering",
  "VP Project": "vp-project",
  "VP Maint": "vp-maint",
  "VP Ops": "vp-ops",
  "VP Risk": "vp-hse",
  "VP Logistics": "vp-logistics",
  "VP Strategy": "vp-strategy",
  "VP Finance": "vp-finance",
  "VP Marketing": "vp-marketing",
  "VP IT": "vp-it",
  "VP AI": "vp-ai",
  "VP Process": "vp-process",
  "VP People": "vp-people",
  "VP Legal": "vp-legal",
};

const VpNode = ({ title, items, color, onNavigate, disabled }) => {
  const [hovered, setHovered] = useState(false);
  const vpKey = vpKeyMap[title];
  const clickable = vpKey && !disabled;

  return (
    <div
      style={{ width: 0, flex: "1 1 0", minWidth: 0, cursor: clickable ? "pointer" : "default", transition: "transform .15s", opacity: disabled ? 0.45 : 1 }}
      onClick={() => clickable && onNavigate?.(vpKey)}
      onMouseEnter={() => !disabled && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{
        background: hovered && !disabled ? color + "35" : color + "20",
        border: `1px solid ${color}`,
        borderRadius: 6, padding: "5px 4px", fontSize: 10, fontWeight: 600,
        color: color, textAlign: "center", marginBottom: 3,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 3,
        transform: hovered && !disabled ? "translateY(-1px)" : "none",
        boxShadow: hovered && !disabled ? `0 4px 12px ${color}25` : "none",
        transition: "all .15s", whiteSpace: "nowrap", overflow: "hidden",
      }}>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{title}</span>
        {clickable && (
          <svg width={8} height={8} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: hovered ? 1 : 0.4, transition: "opacity .15s", flexShrink: 0 }}>
            <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
          </svg>
        )}
      </div>
      {items.map((it, ii) => (
        <div key={ii} style={{
          background: color + "10", borderRadius: 4, padding: "3px 4px",
          fontSize: 8, color: color, textAlign: "center", marginBottom: 2,
          border: `1px solid ${color}30`, whiteSpace: "nowrap",
          overflow: "hidden", textOverflow: "ellipsis",
        }}>{it}</div>
      ))}
    </div>
  );
};

export const OrgChartView = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const userLevel = getRoleClearance(currentUser?.role).level;
  const userLandingKey = currentUser ? getLandingPageKey(currentUser) : null;

  /** A card is disabled if user is not L5 AND it's not their own landing page */
  const isVpDisabled = (vpKey) => {
    if (userLevel >= 5) return false;
    if (vpKey === userLandingKey) return false;
    return true;
  };

  const ceoDisabled = isVpDisabled("ceo");
  const cooDisabled = isVpDisabled("coo");

  return (
  <div style={{ overflowX: "auto", padding: "20px 0" }}>
    <div style={{ minWidth: 900, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
      {/* Parent entities */}
      <div style={{ display: "flex", gap: 16 }}>
        {[{ n: "Sens Co", c: T.green }, { n: "Found Co", c: T.accent }].map((b, i) => (
          <div key={i} style={{ background: b.c + "20", border: `1px solid ${b.c}`, borderRadius: 8, padding: "8px 20px", fontSize: 13, fontWeight: 600, color: b.c }}>{b.n}</div>
        ))}
      </div>

      <div style={{ width: 1, height: 16, background: T.border }} />

      {/* CEO — clickable if L5 or own landing page */}
      <div
        onClick={() => !ceoDisabled && onNavigate("ceo")}
        onMouseEnter={e => { if (!ceoDisabled) { e.currentTarget.style.background = T.accent + "40"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = `0 4px 12px ${T.accent}25`; }}}
        onMouseLeave={e => { e.currentTarget.style.background = T.accent + "25"; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
        style={{ background: T.accent + "25", border: `2px solid ${T.accent}`, borderRadius: 8, padding: "10px 28px", fontSize: 15, fontWeight: 700, color: T.accent, cursor: ceoDisabled ? "default" : "pointer", transition: "all .15s", display: "flex", alignItems: "center", gap: 6, opacity: ceoDisabled ? 0.45 : 1 }}
      >
        CEO
        {!ceoDisabled && (
          <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={T.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
            <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
          </svg>
        )}
      </div>

      <div style={{ width: 1, height: 16, background: T.border }} />

      {/* COO — clickable if L5 or own landing page */}
      <div
        onClick={() => !cooDisabled && onNavigate("coo")}
        onMouseEnter={e => { if (!cooDisabled) { e.currentTarget.style.background = T.accentLight + "40"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = `0 4px 12px ${T.accentLight}25`; }}}
        onMouseLeave={e => { e.currentTarget.style.background = T.accentLight + "25"; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
        style={{ background: T.accentLight + "25", border: `2px solid ${T.accentLight}`, borderRadius: 8, padding: "10px 28px", fontSize: 14, fontWeight: 700, color: T.accentLight, cursor: cooDisabled ? "default" : "pointer", transition: "all .15s", display: "flex", alignItems: "center", gap: 6, opacity: cooDisabled ? 0.45 : 1 }}
      >
        COO
        {!cooDisabled && (
          <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={T.accentLight} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
            <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
          </svg>
        )}
      </div>

      <div style={{ width: 1, height: 16, background: T.border }} />

      {/* Branches */}
      <div style={{ display: "flex", gap: 0, width: "100%", justifyContent: "center", position: "relative" }}>
        <div style={{ position: "absolute", top: 0, left: "12.5%", right: "12.5%", height: 1, background: T.border }} />
        {[
          { branch: "Delivering", color: T.green, vps: [
            { title: "VP Engineering", items: ["Concept & IP", "TiPs Design", "Grade R&D"] },
            { title: "VP Project", items: ["Build / Install", "PM / Fab", "Commissioning"] },
          ]},
          { branch: "Operations", color: T.purple, vps: [
            { title: "VP Maint", items: ["Preventive", "IoT/Predictive", "Turnarounds"] },
            { title: "VP Ops", items: ["Plant Ops", "Process Ctrl", "Quality"] },
            { title: "VP Risk", items: ["Safety", "Environmental", "Permitting"] },
            { title: "VP Logistics", items: ["Inbound", "Outbound", "Inventory"] },
          ]},
          { branch: "Finance", color: T.blue, vps: [
            { title: "VP Strategy", items: ["Corp Strategy", "Investor Rel."] },
            { title: "VP Finance", items: ["Accounting", "Treasury", "Tax"] },
            { title: "VP Marketing", items: ["Product Sales", "Offtake", "Pricing"] },
          ]},
          { branch: "Admin", color: T.teal, vps: [
            { title: "VP IT", items: ["Infrastructure", "Cybersecurity"] },
            { title: "VP AI", items: ["Agent Fleet", "ML Ops"] },
            { title: "VP Process", items: ["Contractors", "Compliance"] },
            { title: "VP People", items: ["HR", "Training"] },
            { title: "VP Legal", items: ["Contracts", "IP/Patents"] },
          ]},
        ].map((br, bi) => (
          <div key={bi} style={{ flex: br.vps.length, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "0 4px" }}>
            <div style={{ width: 1, height: 16, background: T.border }} />
            <div style={{ fontSize: 11, color: T.textDim, fontWeight: 600, letterSpacing: .5 }}>{br.branch}</div>
            <div style={{ display: "flex", gap: 4, flexWrap: "nowrap", justifyContent: "center", width: "100%" }}>
              {br.vps.map((vp, vi) => (
                <VpNode key={vi} title={vp.title} items={vp.items} color={br.color} onNavigate={onNavigate} disabled={isVpDisabled(vpKeyMap[vp.title])} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Hint */}
      <div style={{ fontSize: 11, color: T.textDim, marginTop: 12, display: "flex", alignItems: "center", gap: 6 }}>
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={T.textDim} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
        </svg>
        {userLevel >= 5
          ? "Click any executive or VP to open their dashboard"
          : "Click your role\u2019s card to view your dashboard \u00b7 L5 clearance required for others"}
      </div>
    </div>
  </div>
  );
};
