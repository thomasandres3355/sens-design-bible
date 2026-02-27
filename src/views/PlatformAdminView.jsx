import { useState } from "react";
import { T } from "../data/theme";
import { AdminView } from "./AdminView";
import { SettingsView } from "./SettingsView";
import { BugFixPortal } from "../components/ui/BugFixPortal";

/* ─── Icons (inline SVG paths) ─── */
const ICONS = {
  server: "M22 12H2 M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z M6 16h.01 M10 16h.01",
  cpu: "M18 12h2 M4 12h2 M12 4v2 M12 18v2 M7 7l1.5 1.5 M15.5 15.5L17 17 M17 7l-1.5 1.5 M8.5 15.5L7 17 M9 2h6 M9 22h6 M2 9v6 M22 9v6 M12 12m-3 0a3 3 0 106 0 3 3 0 00-6 0",
  users: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 7a4 4 0 100-8 4 4 0 000 8z M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75",
  sliders: "M4 21v-7 M4 10V3 M12 21v-9 M12 8V3 M20 21v-5 M20 12V3 M1 14h6 M9 8h6 M17 16h6",
  bug: "M8 2l1.88 1.88 M14.12 3.88L16 2 M9 7.13v-1a3.003 3.003 0 116 0v1 M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 014-4h4a4 4 0 014 4v3c0 3.3-2.7 6-6 6 M12 20v-9",
};

const Icon = ({ path, size = 16, color = T.textMid }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={path} />
  </svg>
);

const ChevronIcon = ({ open, color = T.textDim }) => (
  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    style={{ transition: "transform .2s", transform: open ? "rotate(180deg)" : "rotate(0)" }}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

/* ─── Category definitions ─── */
const CATEGORIES = [
  {
    key: "it-infra",
    label: "IT & Infrastructure",
    icon: ICONS.server,
    items: [
      { key: "it", label: "IT", source: "admin" },
      { key: "iot", label: "IoT Devices", source: "settings" },
      { key: "integrations", label: "Integrations", source: "settings" },
      { key: "api", label: "API & Endpoints", source: "settings" },
    ],
  },
  {
    key: "ai-agents",
    label: "AI & Agents",
    icon: ICONS.cpu,
    items: [
      { key: "ai", label: "AI", source: "admin" },
      { key: "ai-settings", label: "AI Agents", source: "settings", settingsKey: "ai" },
      { key: "agent-config", label: "Agent Config", source: "settings" },
    ],
  },
  {
    key: "users-security",
    label: "Users & Security",
    icon: ICONS.users,
    items: [
      { key: "myaccess", label: "My Access", source: "settings" },
      { key: "users", label: "Users & Access", source: "settings" },
      { key: "permissions", label: "Permissions", source: "settings" },
      { key: "badges", label: "Badges & Clearance", source: "settings" },
    ],
  },
  {
    key: "platform-config",
    label: "Platform Config",
    icon: ICONS.sliders,
    items: [
      { key: "config", label: "Configuration", source: "settings" },
      { key: "tags", label: "Tags", source: "settings" },
      { key: "landing", label: "Landing Pages", source: "settings" },
      { key: "usage", label: "Usage & Compute", source: "settings" },
      { key: "roam", label: "ro.am", source: "settings" },
    ],
  },
  {
    key: "bug-fixes",
    label: "Bug Fixes",
    icon: ICONS.bug,
    items: [],
    isBugPortal: true,
  },
];

/* ─── Expandable Section ─── */
const ExpandableSection = ({ label, expanded, onToggle, children }) => (
  <div style={{
    background: T.bg2,
    border: `1px solid ${expanded ? T.accent + "44" : T.border}`,
    borderRadius: 10,
    overflow: "hidden",
    transition: "border-color 0.2s",
  }}>
    <button
      onClick={onToggle}
      style={{
        width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 16px", background: "transparent", border: "none",
        cursor: "pointer", fontFamily: "inherit",
      }}
    >
      <span style={{ fontSize: 13, fontWeight: 600, color: expanded ? T.text : T.textMid }}>
        {label}
      </span>
      <ChevronIcon open={expanded} color={expanded ? T.accent : T.textDim} />
    </button>
    {expanded && (
      <div style={{ padding: "0 16px 16px", borderTop: `1px solid ${T.border}` }}>
        <div style={{ paddingTop: 16 }}>
          {children}
        </div>
      </div>
    )}
  </div>
);

/* ─── Render content for a sub-item ─── */
const SubItemContent = ({ item }) => {
  if (item.source === "admin") {
    return <AdminView initialTab={item.key} hideChrome />;
  }
  // For settings, use the settingsKey if defined (for duplicate key names like "ai")
  const settingsTab = item.settingsKey || item.key;
  return <SettingsView initialTab={settingsTab} hideChrome />;
};

/* ─── Main View ─── */
export const PlatformAdminView = ({ defaultCategory = "it-infra" }) => {
  const [activeCategory, setActiveCategory] = useState(defaultCategory);
  const [expandedItem, setExpandedItem] = useState(null);

  const category = CATEGORIES.find(c => c.key === activeCategory);

  return (
    <div style={{ padding: "8px 0", minHeight: "calc(100vh - 80px)" }}>
      {/* Bug Fix Portal (special case — no expandable sections) */}
      {category?.isBugPortal && <BugFixPortal />}

      {/* Expandable Sub-items */}
      {!category?.isBugPortal && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {category?.items.map(item => (
            <ExpandableSection
              key={item.key}
              label={item.label}
              expanded={expandedItem === item.key}
              onToggle={() => setExpandedItem(expandedItem === item.key ? null : item.key)}
            >
              <SubItemContent item={item} />
            </ExpandableSection>
          ))}
        </div>
      )}
    </div>
  );
};
