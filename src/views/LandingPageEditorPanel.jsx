import { useState, useMemo } from "react";
import { T } from "../data/theme";
import { Card, DataTable } from "../components/ui";
import { vpRegistry, ceoAgentTeam, cooAgentTeam } from "../data/vpData";
import {
  getLandingOverrides, saveLandingOverrides, getAllLandingOverrides,
  DEFAULT_LANDING_CONFIGS, LANDING_PAGE_OPTIONS,
} from "../data/landingPageData";

/* ─────────────────────────────────────────────
   Landing Page Editor — Configure per-role dashboards
   Accessible from Settings > Landing Pages (CEO/COO only)
   ───────────────────────────────────────────── */

const ModalOverlay = ({ title, onClose, children, width = 560 }) => (
  <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}
    onClick={onClose}>
    <div style={{ background: T.bg2, borderRadius: 14, padding: 28, width, maxWidth: "90vw", maxHeight: "85vh", overflow: "auto", border: `1px solid ${T.border}`, boxShadow: "0 12px 40px rgba(0,0,0,.3)" }}
      onClick={(e) => e.stopPropagation()}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.text }}>{title}</h3>
        <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: T.textDim, fontSize: 18, fontFamily: "inherit" }}>×</button>
      </div>
      {children}
    </div>
  </div>
);

// All configurable landing page keys
const ALL_PAGES = [
  { key: "ceo", title: "CEO", source: "exec" },
  { key: "coo", title: "COO", source: "exec" },
  ...Object.keys(vpRegistry).map(k => ({ key: k, title: vpRegistry[k].title, source: "vp" })),
  { key: "manager", title: "Manager (Generic)", source: "generic" },
  { key: "operator", title: "Operator (Generic)", source: "generic" },
  { key: "viewer", title: "Viewer (Generic)", source: "generic" },
];

function getPageDefaults(pageKey) {
  if (pageKey === "ceo") return ceoAgentTeam;
  if (pageKey === "coo") return cooAgentTeam;
  if (vpRegistry[pageKey]) return vpRegistry[pageKey];
  if (DEFAULT_LANDING_CONFIGS[pageKey]) return DEFAULT_LANDING_CONFIGS[pageKey];
  return null;
}

export default function LandingPageEditorPanel() {
  const [editingKey, setEditingKey] = useState(null);
  const [version, setVersion] = useState(0); // force re-render after save

  const allOverrides = useMemo(() => getAllLandingOverrides(), [version]);

  const rows = ALL_PAGES.map(page => {
    const overrides = allOverrides[page.key];
    const hasCustom = !!overrides && Object.keys(overrides).length > 0;
    return [
      <span style={{ fontWeight: 600, color: T.text }}>{page.title}</span>,
      <span style={{ fontSize: 11, color: T.textDim, textTransform: "capitalize" }}>{page.source}</span>,
      hasCustom
        ? <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: T.accent + "20", color: T.accent, fontWeight: 600 }}>Customized</span>
        : <span style={{ fontSize: 10, color: T.textDim }}>Default</span>,
      <button
        onClick={() => setEditingKey(page.key)}
        style={{ fontSize: 11, padding: "4px 12px", borderRadius: 6, border: `1px solid ${T.border}`, background: T.bg3, color: T.text, cursor: "pointer", fontFamily: "inherit", fontWeight: 500 }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.color = T.accent; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.text; }}
      >
        Configure
      </button>,
    ];
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ fontSize: 12, color: T.textMid, lineHeight: 1.6 }}>
        Configure what each role sees on their landing page after login. Overrides are layered on top of the default VP/exec data.
        Each landing page can toggle company objectives and customize focus areas, quick links, and KPIs.
      </div>

      <Card title="Landing Page Configurations" titleColor={T.accent}>
        <DataTable
          compact
          columns={["Page", "Type", "Status", "Actions"]}
          rows={rows}
        />
      </Card>

      {editingKey && (
        <LandingPageEditModal
          pageKey={editingKey}
          onClose={() => setEditingKey(null)}
          onSave={() => { setVersion(v => v + 1); setEditingKey(null); }}
        />
      )}
    </div>
  );
}


function LandingPageEditModal({ pageKey, onClose, onSave }) {
  const defaults = getPageDefaults(pageKey);
  const existing = getLandingOverrides(pageKey);

  const defaultFocusAreas = defaults?.focusAreas || [];
  const defaultQuickLinks = defaults?.quickLinks || [];
  const defaultKpis = defaults?.kpis || [];

  const [showObjectives, setShowObjectives] = useState(existing?.showCompanyObjectives ?? true);
  const [focusAreas, setFocusAreas] = useState(existing?.customFocusAreas || null);
  const [quickLinks, setQuickLinks] = useState(existing?.customQuickLinks || null);
  const [kpis, setKpis] = useState(existing?.customKpis || null);
  const [newFocus, setNewFocus] = useState("");
  const [newLinkLabel, setNewLinkLabel] = useState("");
  const [newLinkTarget, setNewLinkTarget] = useState("dashboard");

  const effectiveFocus = focusAreas || defaultFocusAreas;
  const effectiveLinks = quickLinks || defaultQuickLinks;
  const effectiveKpis = kpis || defaultKpis;

  const inputStyle = { background: T.bg0, border: `1px solid ${T.border}`, borderRadius: 6, padding: "6px 10px", color: T.text, fontSize: 12, outline: "none", fontFamily: "inherit" };
  const pillBtn = (label, onClick) => (
    <button onClick={onClick} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, border: `1px solid ${T.danger}30`, background: T.danger + "10", color: T.danger, cursor: "pointer", fontFamily: "inherit" }}>{label}</button>
  );

  const handleSave = () => {
    const overrides = {};
    if (showObjectives !== true) overrides.showCompanyObjectives = showObjectives;
    if (focusAreas) overrides.customFocusAreas = focusAreas;
    if (quickLinks) overrides.customQuickLinks = quickLinks;
    if (kpis) overrides.customKpis = kpis;
    saveLandingOverrides(pageKey, overrides);
    onSave();
  };

  const handleReset = () => {
    saveLandingOverrides(pageKey, {});
    onSave();
  };

  const addFocusArea = () => {
    if (!newFocus.trim()) return;
    setFocusAreas([...(focusAreas || defaultFocusAreas), newFocus.trim()]);
    setNewFocus("");
  };

  const removeFocusArea = (idx) => {
    const arr = [...(focusAreas || defaultFocusAreas)];
    arr.splice(idx, 1);
    setFocusAreas(arr);
  };

  const addQuickLink = () => {
    if (!newLinkLabel.trim()) return;
    setQuickLinks([...(quickLinks || defaultQuickLinks), { label: newLinkLabel.trim(), target: newLinkTarget }]);
    setNewLinkLabel("");
  };

  const removeQuickLink = (idx) => {
    const arr = [...(quickLinks || defaultQuickLinks)];
    arr.splice(idx, 1);
    setQuickLinks(arr);
  };

  const pageTitle = ALL_PAGES.find(p => p.key === pageKey)?.title || pageKey;

  return (
    <ModalOverlay title={`Configure — ${pageTitle}`} onClose={onClose} width={620}>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Company Objectives Toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: T.bg0, borderRadius: 8, border: `1px solid ${T.border}` }}>
          <input type="checkbox" checked={showObjectives} onChange={(e) => setShowObjectives(e.target.checked)} style={{ accentColor: T.accent }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>Show Company Objectives</div>
            <div style={{ fontSize: 11, color: T.textDim }}>Display the 3 strategic objectives on this landing page</div>
          </div>
        </div>

        {/* Focus Areas */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: T.textMid, marginBottom: 8 }}>FOCUS AREAS {focusAreas && <span style={{ fontSize: 10, color: T.accent }}>(customized)</span>}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {effectiveFocus.map((area, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: T.bg0, borderRadius: 6, border: `1px solid ${T.border}` }}>
                <span style={{ flex: 1, fontSize: 12, color: T.text }}>{area}</span>
                {pillBtn("×", () => removeFocusArea(i))}
              </div>
            ))}
            <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
              <input value={newFocus} onChange={e => setNewFocus(e.target.value)} placeholder="Add focus area..."
                style={{ ...inputStyle, flex: 1 }} onKeyDown={e => e.key === "Enter" && addFocusArea()} />
              <button onClick={addFocusArea} style={{ fontSize: 11, padding: "6px 14px", borderRadius: 6, border: `1px solid ${T.accent}`, background: T.accent + "15", color: T.accent, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>Add</button>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: T.textMid, marginBottom: 8 }}>QUICK LINKS {quickLinks && <span style={{ fontSize: 10, color: T.accent }}>(customized)</span>}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {effectiveLinks.map((link, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: T.bg0, borderRadius: 6, border: `1px solid ${T.border}` }}>
                <span style={{ flex: 1, fontSize: 12, color: T.text }}>{link.label}</span>
                <span style={{ fontSize: 10, color: T.textDim, background: T.bg2, padding: "2px 6px", borderRadius: 4 }}>{link.target}</span>
                {pillBtn("×", () => removeQuickLink(i))}
              </div>
            ))}
            <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
              <input value={newLinkLabel} onChange={e => setNewLinkLabel(e.target.value)} placeholder="Link label..."
                style={{ ...inputStyle, flex: 1 }} onKeyDown={e => e.key === "Enter" && addQuickLink()} />
              <select value={newLinkTarget} onChange={e => setNewLinkTarget(e.target.value)}
                style={{ ...inputStyle, minWidth: 140 }}>
                <option value="dashboard">Dashboard</option>
                <option value="operations">Plant Operations</option>
                <option value="delivering">Engineering & Projects</option>
                <option value="finance">Finance & Strategy</option>
                <option value="risk">Risk</option>
                <option value="admin">Platform & Admin</option>
                <option value="sitemap">Site Map</option>
                <option value="focus">Executive Focus</option>
                <option value="development">Development</option>
                <option value="org">Org Chart</option>
                <option value="settings">Settings</option>
              </select>
              <button onClick={addQuickLink} style={{ fontSize: 11, padding: "6px 14px", borderRadius: 6, border: `1px solid ${T.accent}`, background: T.accent + "15", color: T.accent, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>Add</button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
          <button onClick={handleReset} style={{ fontSize: 11, padding: "8px 16px", borderRadius: 8, border: `1px solid ${T.danger}40`, background: T.danger + "10", color: T.danger, cursor: "pointer", fontFamily: "inherit", fontWeight: 500 }}>
            Reset to Defaults
          </button>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onClose} style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 18px", color: T.textMid, fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
              Cancel
            </button>
            <button onClick={handleSave} style={{ background: T.accent, border: "none", borderRadius: 8, padding: "8px 18px", color: "#1A1A1A", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              Save Configuration
            </button>
          </div>
        </div>

      </div>
    </ModalOverlay>
  );
}
