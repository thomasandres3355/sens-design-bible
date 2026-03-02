import { useState, useEffect, useMemo, useRef, Suspense, createElement } from "react";
import { T } from "@core/theme/theme";
import { activeSites, constructionSites, totalProcessors } from "@core/data/sites";
import { getNavItems, getRouteMap, VpDashboardView, AgentDetailView } from "@core/shell/moduleRegistry";
import { vpRegistry, isVpKey, isExecKey, getExecData, isAgentKey, agentIndex, ceoAgentTeam, cooAgentTeam, getAgentDirectory } from "@modules/ai-agents/vpData";
import { getAgentEntry } from "@modules/ai-agents/agentConfigStore";
import { getLandingPageKey } from "@modules/admin/landingPageData";
import { useMobile } from "@core/mobile/MobileContext";
import { Card } from "@core/ui";
import { GlobalAgentFab } from "@modules/ai-agents/AgentChat";
import sensLogo from "./assets/SENS Logo-White copy.png";
import { useSimDate } from "@core/simulation/SimDateContext";
import { useBadge } from "@core/users/BadgeContext";
import { useAuth } from "@core/auth/AuthContext";
import LoginView from "@core/auth/LoginView";
import { AUTH_METHODS } from "@core/auth/authData";
import { usePermissions } from "@core/permissions/PermissionContext";
import { AccessDenied } from "@core/permissions/PermissionGate";
import { useThemeMode } from "@core/theme/ThemeContext";
import { BugReportModal, BugIcon, getBugReportCount } from "@modules/admin/BugReportModal";
import { useRouting, pathToKey } from "@core/routing/useRouting";

// Navigation items and route map sourced from the module registry
const navItems = getNavItems();

const HISTORY_OPTIONS = [
  { value: "30d", label: "30 Days" },
  { value: "90d", label: "90 Days" },
  { value: "1y", label: "1 Year" },
  { value: "2y", label: "2 Years" },
];

export default function App() {
  const { active, setActive } = useRouting();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [navProjectId, setNavProjectId] = useState(null);
  const [bugReportOpen, setBugReportOpen] = useState(false);
  const [bugCount, setBugCount] = useState(getBugReportCount);
  const [expandedGroups, setExpandedGroups] = useState({ risk: false, admin: false, technology: false, ops: false, growth: false, learning: false, templates: false });
  useEffect(() => { setMounted(true); }, []);

  // Keep bug badge count in sync with localStorage (updates from BugFixPortal deletions)
  useEffect(() => {
    const sync = () => setBugCount(getBugReportCount());
    window.addEventListener("storage", sync);
    const interval = setInterval(sync, 2000);
    return () => { window.removeEventListener("storage", sync); clearInterval(interval); };
  }, []);

  const { simDate, advanceDay, retreatDay, historyDepth, setHistoryDepth, maxDate } = useSimDate();
  const { activeUser, badge, switchUser, allUsers } = useBadge();
  const { isAuthenticated, currentUser, authMethod, signOut } = useAuth();
  const { visibleModules, can, canAccessVp } = usePermissions();
  const { mode, toggleTheme } = useThemeMode();
  const { isMobile, toggleMobile } = useMobile();
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Redirect to mobile-safe route when entering mobile mode
  useEffect(() => {
    if (isMobile && active !== "dashboard" && active !== "focus") {
      setActive("dashboard");
    }
  }, [isMobile]);

  // All hooks must be before early returns (Rules of Hooks)
  const agentDirectory = useMemo(() => getAgentDirectory(), []);
  const preSelectedIds = useMemo(() => {
    if (isExecKey(active)) {
      const exec = getExecData(active);
      return exec?.agentTeam?.lead?.id ? [exec.agentTeam.lead.id] : [];
    }
    if (isVpKey(active) && vpRegistry[active]) {
      return [vpRegistry[active].agentTeam.lead.id];
    }
    if (isAgentKey(active)) {
      const agentId = active.replace("agent-", "");
      const entry = getAgentEntry(agentId);
      if (entry) {
        const parentTeam = entry.parentKey === "ceo" ? ceoAgentTeam
          : entry.parentKey === "coo" ? cooAgentTeam
          : vpRegistry[entry.parentKey];
        return parentTeam?.agentTeam?.lead?.id ? [parentTeam.agentTeam.lead.id] : [];
      }
    }
    return [];
  }, [active]);

  // Sync authenticated user to BadgeContext
  useEffect(() => {
    if (isAuthenticated && currentUser && currentUser.id !== activeUser.id) {
      switchUser(currentUser.id);
    }
  }, [isAuthenticated, currentUser, activeUser.id, switchUser]);

  // Post-login redirect to role-based landing page (with deep-link restoration)
  const hasRedirected = useRef(false);
  const intendedPath = useRef(null);
  useEffect(() => {
    if (isAuthenticated && currentUser && !hasRedirected.current) {
      hasRedirected.current = true;
      if (intendedPath.current) {
        const key = pathToKey(intendedPath.current);
        intendedPath.current = null;
        setActive(key, { replace: true });
      } else {
        // Only redirect to landing page on fresh login (not on page refresh with an existing deep URL)
        const currentPath = window.location.pathname;
        if (currentPath === "/" || currentPath === "/login" || currentPath === "/dashboard") {
          const landingKey = getLandingPageKey(currentUser);
          if (landingKey) setActive(landingKey, { replace: true });
        }
      }
    }
    if (!isAuthenticated) hasRedirected.current = false;
  }, [isAuthenticated, currentUser]);

  // Auth gate — show login if not authenticated
  if (!isAuthenticated) {
    if (window.location.pathname !== "/login" && window.location.pathname !== "/") {
      intendedPath.current = window.location.pathname;
      window.history.replaceState({}, "", "/login");
    }
    return <LoginView />;
  }

  // Filter sidebar modules by permission — templates always visible
  const visibleSidebar = navItems.filter((m) => m.key === "templates" || visibleModules.includes(m.key));

  // ─── Resolve the active view ───
  const resolveView = () => {
    // Executive dashboards (CEO, COO) — reuse VpDashboardView
    if (isExecKey(active)) {
      if (!canAccessVp(active)) return <AccessDenied module="org" action="view executive dashboard" />;
      const exec = getExecData(active);
      if (exec) return createElement(VpDashboardView, { vp: exec, onNavigate: setActive });
    }

    // VP dashboards
    if (isVpKey(active) && vpRegistry[active]) {
      if (!canAccessVp(active)) return <AccessDenied module="org" action="view this VP dashboard" />;
      return createElement(VpDashboardView, { vp: vpRegistry[active], onNavigate: setActive });
    }

    // Agent detail pages: "agent-{agentId}"
    if (isAgentKey(active)) {
      if (!can("org", "agentDetail")) return <AccessDenied module="org" action="view agent details" />;
      const agentId = active.replace("agent-", "");
      const entry = getAgentEntry(agentId);
      if (entry) {
        const parentTeam = entry.parentKey === "ceo"
          ? ceoAgentTeam.agentTeam
          : entry.parentKey === "coo"
          ? cooAgentTeam.agentTeam
          : vpRegistry[entry.parentKey]?.agentTeam;
        return createElement(AgentDetailView, {
          agent: entry.agent,
          parentKey: entry.parentKey,
          parentTitle: entry.parentTitle,
          color: entry.color,
          agentTeam: parentTeam,
          onNavigate: setActive,
        });
      }
    }

    // Permission check for standard modules — skip for templates (always accessible)
    if (!(active === "templates" || active.startsWith("template-") || active.startsWith("tpl-"))) {
      const permKey = active.startsWith("risk-") ? "risk" : active.startsWith("admin-") ? "admin" : active.startsWith("tech-") ? "technology" : active.startsWith("ops-") ? "ops" : active.startsWith("learning-") ? "learning" : active;
      const isStandardModule = navItems.find((m) => m.key === active) || navItems.some(m => m.children?.some(c => c.key === active));
      if (!can(permKey, "view") && isStandardModule) {
        return <AccessDenied module={permKey} action="view" />;
      }
    }

    // Registry-driven route resolution
    const routeMap = getRouteMap();
    const resolver = routeMap[active] || routeMap["dashboard"];
    if (resolver) {
      const { component: Comp, props: viewProps } = resolver({ setActive, navProjectId, setNavProjectId });
      // Handle placeholder routes (e.g. tech-ip-risk)
      if (!Comp) {
        return <Card title="IP Risk" titleColor={T.accent}><div style={{ padding: 20, textAlign: "center" }}><div style={{ fontSize: 40, marginBottom: 12 }}>&#128737;</div><div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 8 }}>Intellectual Property Risk Management</div><div style={{ fontSize: 12, color: T.textDim, lineHeight: 1.6 }}>Patent portfolio tracking, trade secret protection, licensing compliance, and IP risk assessment. This module is under development.</div></div></Card>;
      }
      return createElement(Comp, { key: active, ...viewProps });
    }
    return null;
  };

  // ─── Resolve the header content ───
  const resolveHeader = () => {
    // Executive dashboard header (CEO, COO)
    if (isExecKey(active)) {
      const exec = getExecData(active);
      if (exec) {
        return (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
              <button onClick={() => setActive("org")} style={{ background: "transparent", border: "none", cursor: "pointer", color: T.textDim, fontSize: 12, padding: 0, fontFamily: "inherit" }}
                onMouseEnter={e => e.currentTarget.style.color = T.accent} onMouseLeave={e => e.currentTarget.style.color = T.textDim}>Org Chart</button>
              <span style={{ color: T.textDim, fontSize: 12 }}>/</span>
              <span style={{ fontSize: 12, color: exec.color, fontWeight: 600 }}>{exec.title}</span>
            </div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: T.text }}>{exec.title}</h1>
          </>
        );
      }
    }

    // VP dashboard header
    if (isVpKey(active) && vpRegistry[active]) {
      const vp = vpRegistry[active];
      return (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
            <button onClick={() => setActive("org")} style={{ background: "transparent", border: "none", cursor: "pointer", color: T.textDim, fontSize: 12, padding: 0, fontFamily: "inherit" }}
              onMouseEnter={e => e.currentTarget.style.color = T.accent} onMouseLeave={e => e.currentTarget.style.color = T.textDim}>Org Chart</button>
            <span style={{ color: T.textDim, fontSize: 12 }}>/</span>
            <span style={{ fontSize: 12, color: vp.color, fontWeight: 600 }}>{vp.title}</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: T.text }}>{vp.title}</h1>
        </>
      );
    }

    // Agent detail header
    if (isAgentKey(active)) {
      const agentId = active.replace("agent-", "");
      const entry = getAgentEntry(agentId);
      if (entry) {
        return (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
              <button onClick={() => setActive("org")} style={{ background: "transparent", border: "none", cursor: "pointer", color: T.textDim, fontSize: 12, padding: 0, fontFamily: "inherit" }}
                onMouseEnter={e => e.currentTarget.style.color = T.accent} onMouseLeave={e => e.currentTarget.style.color = T.textDim}>Org Chart</button>
              <span style={{ color: T.textDim, fontSize: 12 }}>/</span>
              <button onClick={() => setActive(entry.parentKey)} style={{ background: "transparent", border: "none", cursor: "pointer", color: T.textDim, fontSize: 12, padding: 0, fontFamily: "inherit" }}
                onMouseEnter={e => e.currentTarget.style.color = entry.color} onMouseLeave={e => e.currentTarget.style.color = T.textDim}>{entry.parentTitle}</button>
              <span style={{ color: T.textDim, fontSize: 12 }}>/</span>
              <span style={{ fontSize: 12, color: entry.color, fontWeight: 600 }}>{entry.agent.name}</span>
            </div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: T.text }}>{entry.agent.name}</h1>
          </>
        );
      }
    }

    // Generic landing page header
    if (active === "manager" || active === "operator" || active === "viewer") {
      const labels = { manager: "Manager Dashboard", operator: "Operator Dashboard", viewer: "Viewer Dashboard" };
      return (
        <>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: T.text }}>{labels[active]}</h1>
          <span style={{ fontSize: 11, color: T.accent }}>{activeSites.length} Active Sites · {constructionSites.length} In Construction · {totalProcessors} Processors</span>
        </>
      );
    }

    // Risk child header (breadcrumb)
    if (active.startsWith("risk-")) {
      const riskModule = navItems.find(m => m.key === "risk");
      const childModule = riskModule?.children?.find(c => c.key === active);
      return (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
            <button onClick={() => setActive("risk")} style={{ background: "transparent", border: "none", cursor: "pointer", color: T.textDim, fontSize: 12, padding: 0, fontFamily: "inherit" }}
              onMouseEnter={e => e.currentTarget.style.color = T.accent} onMouseLeave={e => e.currentTarget.style.color = T.textDim}>Risk</button>
            <span style={{ color: T.textDim, fontSize: 12 }}>/</span>
            <span style={{ fontSize: 12, color: T.accent, fontWeight: 600 }}>{childModule?.label || active}</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: T.text }}>{childModule?.label || "Risk"}</h1>
        </>
      );
    }

    // Admin child header (breadcrumb)
    if (active.startsWith("admin-")) {
      const adminModule = navItems.find(m => m.key === "admin");
      const childModule = adminModule?.children?.find(c => c.key === active);
      return (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
            <button onClick={() => setActive("admin")} style={{ background: "transparent", border: "none", cursor: "pointer", color: T.textDim, fontSize: 12, padding: 0, fontFamily: "inherit" }}
              onMouseEnter={e => e.currentTarget.style.color = T.accent} onMouseLeave={e => e.currentTarget.style.color = T.textDim}>Platform</button>
            <span style={{ color: T.textDim, fontSize: 12 }}>/</span>
            <span style={{ fontSize: 12, color: T.accent, fontWeight: 600 }}>{childModule?.label || active}</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: T.text }}>{childModule?.label || "Platform"}</h1>
        </>
      );
    }

    // Generic parent-child breadcrumb header (Technology, Operations, Growth children)
    const parentModule = navItems.find(m => m.children?.some(c => c.key === active));
    if (parentModule && !active.startsWith("risk-") && !active.startsWith("admin-")) {
      const childModule = parentModule.children.find(c => c.key === active);
      return (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
            <button onClick={() => setActive(parentModule.key)} style={{ background: "transparent", border: "none", cursor: "pointer", color: T.textDim, fontSize: 12, padding: 0, fontFamily: "inherit" }}
              onMouseEnter={e => e.currentTarget.style.color = T.accent} onMouseLeave={e => e.currentTarget.style.color = T.textDim}>{parentModule.label}</button>
            <span style={{ color: T.textDim, fontSize: 12 }}>/</span>
            <span style={{ fontSize: 12, color: T.accent, fontWeight: 600 }}>{childModule?.label || active}</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: T.text }}>{childModule?.label || parentModule.label}</h1>
        </>
      );
    }

    // Default header
    return (
      <>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: T.text }}>{navItems.find(m => m.key === active)?.label}</h1>
        <span style={{ fontSize: 11, color: T.accent }}>{activeSites.length} Active Sites · {constructionSites.length} In Construction · {totalProcessors} Processors</span>
      </>
    );
  };

  // ─── Mobile bottom tab config ───
  const mobileNavTabs = [
    { key: "dashboard", label: "Dashboard", icon: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12z M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" },
    { key: "focus", label: "Focus", icon: "M22 11.08V12a10 10 0 1 1-5.93-9.14 M22 4L12 14.01l-3-3" },
  ];

  const mobilePageTitle = active === "focus" ? "Executive Focus" : "Dashboard";

  return (
    <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", height: "100vh", background: T.bg0, color: T.text, fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif", opacity: mounted ? 1 : 0, transition: "opacity .4s" }}>

      {/* ─── Accent stripe (desktop only) ─── */}
      {!isMobile && <div style={{ width: 3, background: T.accent, flexShrink: 0 }} />}

      {/* ─── Desktop Sidebar ─── */}
      {!isMobile && (
      <nav style={{ width: collapsed ? 56 : 220, flexShrink: 0, background: T.bg1, borderRight: `1px solid ${T.border}`, display: "flex", flexDirection: "column", transition: "width .25s ease", overflow: "hidden" }}>
        <div style={{ padding: collapsed ? "20px 8px" : "20px 18px", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, borderBottom: `1px solid ${T.border}`, minHeight: 64 }}>
          {collapsed
            ? <div style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, background: "transparent", border: `3px solid ${T.accent}`, boxSizing: "border-box" }} />
            : <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
                <img src={sensLogo} alt="SENS" style={{ height: 34, objectFit: "contain", filter: mode === "light" ? "invert(1) brightness(0.3)" : "none" }} />
              </div>
          }
        </div>
        <div style={{ flex: 1, padding: "12px 6px", display: "flex", flexDirection: "column", gap: 2, overflowY: "auto" }}>
          {visibleSidebar.map((m) => {
            const hasChildren = m.children && m.children.length > 0;
            const isGroupExpanded = expandedGroups[m.key];
            const isChildActive = hasChildren && m.children.some(c => c.key === active);
            const isParentActive = active === m.key || isChildActive;
            return (<div key={m.key}>
              {/* Parent nav item */}
              <button onClick={() => {
                setNavProjectId(null);
                if (hasChildren) {
                  setActive(m.key);
                  if (!isGroupExpanded) setExpandedGroups(prev => ({ ...prev, [m.key]: true }));
                } else {
                  const targetKey = m.key === "dashboard" ? getLandingPageKey(currentUser) : m.key;
                  setActive(targetKey);
                }
              }} style={{ display: "flex", alignItems: "center", gap: 12, padding: collapsed ? "10px 12px" : "10px 14px", borderRadius: 8, border: "none", cursor: "pointer", background: isParentActive ? T.accentDim : "transparent", borderLeft: isParentActive ? `3px solid ${T.accent}` : "3px solid transparent", transition: "all .15s", width: "100%", textAlign: "left" }} onMouseEnter={e => { if (!isParentActive) e.currentTarget.style.background = T.bg3; }} onMouseLeave={e => { if (!isParentActive) e.currentTarget.style.background = "transparent"; }}>
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={isParentActive ? T.accent : T.textMid} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={m.icon} /></svg>
                {!collapsed && <span style={{ fontSize: 13, fontWeight: isParentActive ? 600 : 400, color: isParentActive ? T.text : T.textMid, whiteSpace: "nowrap", flex: 1 }}>{m.label}</span>}
                {!collapsed && hasChildren && (
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={T.textDim} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    onClick={(e) => { e.stopPropagation(); setExpandedGroups(prev => ({ ...prev, [m.key]: !prev[m.key] })); }}
                    style={{ transform: isGroupExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .2s", cursor: "pointer", flexShrink: 0 }}>
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                )}
              </button>
              {/* Children (indented, collapsible) */}
              {hasChildren && isGroupExpanded && !collapsed && (
                <div style={{ paddingLeft: 14, marginTop: 2, display: "flex", flexDirection: "column", gap: 1 }}>
                  {m.children.map(child => {
                    const isActive = active === child.key;
                    return (
                      <button key={child.key} onClick={() => { setNavProjectId(null); setActive(child.key); }}
                        style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 12px", borderRadius: 6, border: "none", cursor: "pointer", background: isActive ? T.accentDim : "transparent", borderLeft: isActive ? `2px solid ${T.accent}` : "2px solid transparent", transition: "all .15s", width: "100%", textAlign: "left" }}
                        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = T.bg3; }}
                        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}>
                        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={isActive ? T.accent : T.textDim} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={child.icon} /></svg>
                        <span style={{ fontSize: 12, fontWeight: isActive ? 600 : 400, color: isActive ? T.text : T.textDim, whiteSpace: "nowrap" }}>{child.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>);
          })}
        </div>
        {/* Mobile Mode Toggle */}
        <button onClick={toggleMobile} title="Switch to mobile mode" style={{ padding: collapsed ? "10px 14px" : "10px 14px", border: "none", borderTop: `1px solid ${T.border}`, background: "transparent", cursor: "pointer", color: T.textDim, display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-start", gap: 12, width: "100%", fontFamily: "inherit", fontSize: 13, minHeight: 44, transition: "all .25s ease" }}
          onMouseEnter={e => { e.currentTarget.style.color = T.accent; e.currentTarget.style.background = T.bg3; }}
          onMouseLeave={e => { e.currentTarget.style.color = T.textDim; e.currentTarget.style.background = "transparent"; }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
          {!collapsed && <span style={{ fontWeight: 400, whiteSpace: "nowrap" }}>Mobile Mode</span>}
        </button>
        <button onClick={toggleTheme} title={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"} style={{ padding: collapsed ? "10px 14px" : "10px 14px", border: "none", borderTop: `1px solid ${T.border}`, background: "transparent", cursor: "pointer", color: T.textDim, display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-start", gap: 12, width: "100%", fontFamily: "inherit", fontSize: 13 }}
          onMouseEnter={e => { e.currentTarget.style.color = T.accent; e.currentTarget.style.background = T.bg3; }}
          onMouseLeave={e => { e.currentTarget.style.color = T.textDim; e.currentTarget.style.background = "transparent"; }}>
          {mode === "dark"
            ? <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            : <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          }
          {!collapsed && <span style={{ fontWeight: 400, whiteSpace: "nowrap" }}>{mode === "dark" ? "Light Mode" : "Dark Mode"}</span>}
        </button>
        {/* Bug Report button */}
        <button onClick={() => setBugReportOpen(!bugReportOpen)} title="Report a Bug" style={{ padding: collapsed ? "10px 14px" : "10px 14px", border: "none", borderTop: `1px solid ${T.border}`, background: bugReportOpen ? T.danger + "12" : "transparent", cursor: "pointer", color: bugReportOpen ? T.danger : T.textDim, display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-start", gap: 12, width: "100%", fontFamily: "inherit", fontSize: 13, position: "relative", transition: "all .15s" }}
          onMouseEnter={e => { if (!bugReportOpen) { e.currentTarget.style.color = T.danger; e.currentTarget.style.background = T.bg3; }}}
          onMouseLeave={e => { if (!bugReportOpen) { e.currentTarget.style.color = T.textDim; e.currentTarget.style.background = "transparent"; }}}>
          <BugIcon size={16} />
          {!collapsed && <span style={{ fontWeight: bugReportOpen ? 600 : 400, whiteSpace: "nowrap" }}>Report Bug</span>}
          {bugCount > 0 && (
            <span style={{ position: collapsed ? "absolute" : "static", top: collapsed ? 6 : undefined, right: collapsed ? 8 : undefined, marginLeft: collapsed ? 0 : "auto", fontSize: 9, fontWeight: 800, background: T.danger, color: "#fff", minWidth: 16, height: 16, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>
              {bugCount}
            </span>
          )}
        </button>
        <button onClick={() => setCollapsed(!collapsed)} style={{ padding: 14, border: "none", borderTop: `1px solid ${T.border}`, background: "transparent", cursor: "pointer", color: T.textDim, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: collapsed ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .2s" }}><path d="M15 18l-6-6 6-6" /></svg>
        </button>
      </nav>
      )}

      <main style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column", paddingBottom: isMobile ? 72 : 0 }}>

        {/* ─── Mobile Header ─── */}
        {isMobile ? (
          <header style={{ padding: "10px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: T.bg1, position: "sticky", top: 0, zIndex: 10, minHeight: 48 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", border: `2.5px solid ${T.accent}`, flexShrink: 0 }} />
              <span style={{ fontSize: 16, fontWeight: 700, color: T.text }}>{mobilePageTitle}</span>
            </div>
            <button onClick={() => setSettingsOpen(true)} style={{ background: "transparent", border: "none", cursor: "pointer", color: T.textDim, padding: 8, minWidth: 44, minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, transition: "all .15s" }}
              onMouseEnter={e => { e.currentTarget.style.color = T.accent; e.currentTarget.style.background = T.bg3; }}
              onMouseLeave={e => { e.currentTarget.style.color = T.textDim; e.currentTarget.style.background = "transparent"; }}>
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/><path d="M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z"/>
              </svg>
            </button>
          </header>
        ) : (
        <header style={{ padding: "14px 28px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: T.bg1, position: "sticky", top: 0, zIndex: 10 }}>
          <div>{resolveHeader()}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Badge indicator */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 6, background: T.bg3, border: `1px solid ${badge.color}33` }}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={badge.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
              <span style={{ fontSize: 11, fontWeight: 600, color: badge.color }}>{badge.label}</span>
            </div>
            {/* Authenticated user display */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: T.accent + "20", border: `1.5px solid ${T.accent}40`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 700, color: T.accent,
              }}>
                {activeUser.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div style={{ lineHeight: 1.2 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: T.text }}>{activeUser.name}</div>
                <div style={{ fontSize: 10, color: T.textDim }}>{activeUser.role}{authMethod ? ` · ${authMethod === AUTH_METHODS.MICROSOFT_SSO ? "Microsoft" : authMethod === AUTH_METHODS.GOOGLE_SSO ? "Google" : "Email"}` : ""}</div>
              </div>
            </div>
            {/* Sign out */}
            <button
              onClick={signOut}
              style={{ fontSize: 10, padding: "4px 10px", borderRadius: 6, border: `1px solid ${T.border}`, background: T.bg2, color: T.textMid, cursor: "pointer", fontFamily: "inherit", fontWeight: 500 }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.danger; e.currentTarget.style.color = T.danger; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textMid; }}
            >
              Sign Out
            </button>
            {/* Divider */}
            <div style={{ width: 1, height: 20, background: T.border }} />
            {/* SimDate display + controls */}
            <div style={{ fontSize: 12, color: T.textDim, fontWeight: 500 }}>
              {new Date(simDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
            </div>
            <button onClick={retreatDay} title="Go back one day" style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 4, cursor: "pointer", color: T.textMid, padding: "3px 6px", fontSize: 12, lineHeight: 1, fontFamily: "inherit" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = T.accent} onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
              ‹
            </button>
            <button onClick={advanceDay} disabled={simDate >= maxDate} title={simDate >= maxDate ? "Already at latest date" : "Advance one day (Catch Up)"} style={{ background: simDate >= maxDate ? T.bg3 : T.accentDim, border: `1px solid ${simDate >= maxDate ? T.border : T.accent + "55"}`, borderRadius: 6, cursor: simDate >= maxDate ? "not-allowed" : "pointer", color: simDate >= maxDate ? T.textDim : T.accent, padding: "4px 10px", fontSize: 11, fontWeight: 600, fontFamily: "inherit", whiteSpace: "nowrap", opacity: simDate >= maxDate ? 0.5 : 1 }}
              onMouseEnter={e => { if (simDate < maxDate) { e.currentTarget.style.background = T.accent; e.currentTarget.style.color = "#fff"; } }} onMouseLeave={e => { if (simDate < maxDate) { e.currentTarget.style.background = T.accentDim; e.currentTarget.style.color = T.accent; } }}>
              Catch Up ›
            </button>
            {/* History depth dropdown */}
            <select
              value={historyDepth}
              onChange={(e) => setHistoryDepth(e.target.value)}
              title="How much history to display"
              style={{ fontSize: 11, padding: "4px 8px", borderRadius: 6, border: `1px solid ${T.border}`, background: T.bg2, color: T.textMid, cursor: "pointer", fontFamily: "inherit" }}
            >
              {HISTORY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </header>
        )}

        {/* ─── Page content ─── */}
        <div style={{ padding: isMobile ? 16 : 28, flex: 1 }}>
          <Suspense fallback={<div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 200, color: T.textDim, fontSize: 13 }}>Loading module...</div>}>
            {resolveView()}
          </Suspense>
        </div>
      </main>

      {/* ─── Mobile Bottom Tab Bar ─── */}
      {isMobile && (
        <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, height: 56, background: T.bg1, borderTop: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-around", zIndex: 20, paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
          {mobileNavTabs.map(tab => {
            const isActive = active === tab.key;
            return (
              <button key={tab.key} onClick={() => setActive(tab.key)} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, background: "transparent", border: "none", cursor: "pointer", color: isActive ? T.accent : T.textDim, padding: "6px 24px", minWidth: 72, minHeight: 44, transition: "color .25s ease", fontFamily: "inherit" }}>
                <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isActive ? "2.5" : "2"} strokeLinecap="round" strokeLinejoin="round"><path d={tab.icon} /></svg>
                <span style={{ fontSize: 11, fontWeight: isActive ? 700 : 500, letterSpacing: 0.3 }}>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      )}

      {/* ─── Mobile Settings Overlay ─── */}
      {isMobile && settingsOpen && (
        <div onClick={() => setSettingsOpen(false)} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 30, display: "flex", justifyContent: "flex-end" }}>
          <div onClick={e => e.stopPropagation()} style={{ width: 280, maxWidth: "80vw", height: "100%", background: T.bg1, borderLeft: `1px solid ${T.border}`, padding: 24, display: "flex", flexDirection: "column", gap: 8, transform: "translateX(0)", transition: "transform .25s ease" }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: T.text, marginBottom: 8 }}>Settings</div>

            {/* User info */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 0", borderBottom: `1px solid ${T.border}` }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: T.accent + "20", border: `1.5px solid ${T.accent}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: T.accent }}>
                {activeUser.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{activeUser.name}</div>
                <div style={{ fontSize: 12, color: T.textDim }}>{activeUser.role}</div>
              </div>
            </div>

            {/* Date display */}
            <div style={{ padding: "12px 0", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 8 }}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={T.textDim} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <span style={{ fontSize: 13, color: T.textMid, fontWeight: 500 }}>{new Date(simDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
            </div>

            {/* Theme toggle */}
            <button onClick={() => { toggleTheme(); }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 0", border: "none", background: "transparent", cursor: "pointer", color: T.text, fontSize: 14, minHeight: 44, width: "100%", textAlign: "left", fontFamily: "inherit" }}>
              {mode === "dark"
                ? <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={T.textMid} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                : <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={T.textMid} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              }
              <span>{mode === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}</span>
            </button>

            {/* Desktop mode toggle */}
            <button onClick={() => { toggleMobile(); setSettingsOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 0", border: "none", background: "transparent", cursor: "pointer", color: T.text, fontSize: 14, minHeight: 44, width: "100%", textAlign: "left", fontFamily: "inherit" }}>
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={T.textMid} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
              <span>Switch to Desktop Mode</span>
            </button>

            {/* Sign out */}
            <button onClick={signOut} style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 12, padding: "14px 0", border: "none", background: "transparent", cursor: "pointer", color: T.danger, fontSize: 14, minHeight: 44, width: "100%", textAlign: "left", fontFamily: "inherit" }}>
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* Global agent FAB — hidden in mobile */}
      {!isMobile && <GlobalAgentFab directory={agentDirectory} onNavigate={setActive} preSelectedIds={preSelectedIds} />}

      {/* Bug Report Modal */}
      <BugReportModal open={bugReportOpen} onClose={() => setBugReportOpen(false)} activeModule={active} />
    </div>
  );
}
