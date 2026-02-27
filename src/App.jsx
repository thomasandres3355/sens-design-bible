import { useState, useEffect, useMemo, useRef } from "react";
import { T } from "./data/theme";
import { activeSites, constructionSites, totalProcessors } from "./data/sites";
import { DashboardView, DeliveringView, OperationsView, FinanceView, RiskView, RiskLandingView, RiskDomainDetailView, OrgChartView, VpDashboardView, AgentDetailView, PortfolioMapView, SettingsView, FocusTrackerView, DevelopmentView, PlatformAdminView } from "./views";
import { WorkforceView } from "./views/WorkforceView";
import { GenericLandingView } from "./views/GenericLandingView";
import { vpRegistry, isVpKey, isExecKey, getExecData, isAgentKey, agentIndex, ceoAgentTeam, cooAgentTeam, getAgentDirectory } from "./data/vpData";
import { getLandingPageKey } from "./data/landingPageData";
import { GlobalAgentFab } from "./components/ui/AgentChat";
import sensLogo from "./assets/SENS Logo-White copy.png";
import { useSimDate } from "./contexts/SimDateContext";
import { useBadge } from "./contexts/BadgeContext";
import { useAuth } from "./contexts/AuthContext";
import LoginView from "./views/LoginView";
import { AUTH_METHODS } from "./data/authData";
import { usePermissions } from "./contexts/PermissionContext";
import { AccessDenied } from "./components/ui/PermissionGate";
import { useThemeMode } from "./contexts/ThemeContext";
import { BugReportModal, BugIcon, getBugReportCount } from "./components/ui/BugReportModal";

const modules = [
  { key: "dashboard", label: "Dashboard", icon: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12z M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z", branch: null },
  { key: "focus", label: "Executive Focus", icon: "M22 11.08V12a10 10 0 1 1-5.93-9.14 M22 4L12 14.01l-3-3", branch: null },
  { key: "sitemap", label: "Site Map", icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM4 12c0-.61.08-1.21.21-1.78L8.99 15v1c0 1.1.9 2 2 2v1.93C7.06 19.43 4 16.07 4 12zm13.89 5.4c-.26-.81-1-1.4-1.9-1.4h-1v-3c0-.55-.45-1-1-1h-6v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41C18.92 5.77 20 8.65 20 12c0 2.08-.67 4-1.11 5.4z", branch: null },
  { key: "technology", label: "Technology", icon: "M4 4h16v16H4z M9 9h6v6H9z M9 1v3 M15 1v3 M9 20v3 M15 20v3 M20 9h3 M20 15h3 M1 9h3 M1 15h3", branch: "TECHNOLOGY", children: [
    { key: "operations", label: "Plant Operations", icon: "M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" },
  ]},
  { key: "ops", label: "Operations", icon: "M12 2L2 7l10 5 10-5-10-5z M2 17l10 5 10-5 M2 12l10 5 10-5", branch: "OPERATIONS", children: [
    { key: "delivering", label: "Engineering & Projects", icon: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" },
  ]},
  { key: "growth", label: "Growth", icon: "M18 20V10 M12 20V4 M6 20v-6", branch: "GROWTH", children: [
    { key: "finance", label: "Finance & Strategy", icon: "M3 3v18h18 M7 16l4-4 4 4 5-5 M18 7h4v4" },
    { key: "development", label: "Development", icon: "M22 3H2l4 6h12l4-6z M6 9l3 4.5h6L18 9 M9 13.5l2 3h2l2-3 M11 16.5V21 M13 16.5V21" },
  ]},
  { key: "admin", label: "Platform", icon: "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z", branch: "ADMINISTRATION", children: [
    { key: "admin-it-infra", label: "IT & Infrastructure", icon: "M22 12H2 M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z M6 16h.01 M10 16h.01" },
    { key: "admin-ai-agents", label: "AI & Agents", icon: "M18 12h2 M4 12h2 M12 4v2 M12 18v2 M7 7l1.5 1.5 M15.5 15.5L17 17 M17 7l-1.5 1.5 M8.5 15.5L7 17 M9 2h6 M9 22h6 M2 9v6 M22 9v6 M12 12m-3 0a3 3 0 106 0 3 3 0 00-6 0" },
    { key: "admin-operations", label: "Operations", icon: "M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" },
    { key: "admin-users-security", label: "Users & Security", icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 7a4 4 0 100-8 4 4 0 000 8z M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75" },
    { key: "admin-platform-config", label: "Platform Config", icon: "M4 21v-7 M4 10V3 M12 21v-9 M12 8V3 M20 21v-5 M20 12V3 M1 14h6 M9 8h6 M17 16h6" },
    { key: "admin-bug-fixes", label: "Bug Fixes", icon: "M8 2l1.88 1.88 M14.12 3.88L16 2 M9 7.13v-1a3.003 3.003 0 116 0v1 M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 014-4h4a4 4 0 014 4v3c0 3.3-2.7 6-6 6 M12 20v-9" },
  ]},
  { key: "risk", label: "Risk", icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z", branch: "CROSS-CUTTING", children: [
    { key: "risk-workforce", label: "Workforce", icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75" },
    { key: "risk-process-mfg", label: "Process & Mfg", icon: "M2 20h20 M5 20V8l5-6 5 6v12 M19 20V12l-2-2-2 2v8 M9 12h2 M9 16h2" },
    { key: "risk-project-dev", label: "Project Dev", icon: "M22 3H2l4 6h12l4-6z M6 9l3 4.5h6L18 9 M9 13.5l2 3h2l2-3 M11 16.5V21 M13 16.5V21" },
    { key: "risk-offtake-mktg", label: "Offtake & Mktg", icon: "M3 3v18h18 M7 16l4-4 4 4 5-5 M18 7h4v4" },
    { key: "risk-site-security", label: "Site Security", icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z M12 8v4 M12 16h.01" },
    { key: "risk-it-data", label: "IT & Data", icon: "M18 12h2 M4 12h2 M12 4v2 M12 18v2 M12 12m-3 0a3 3 0 106 0 3 3 0 00-6 0" },
    { key: "risk-regulatory", label: "Regulatory", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" },
    { key: "risk-supply-chain", label: "Supply Chain", icon: "M1 3h15v13H1z M16 8h4l3 3v5h-7V8z M5.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5z M18.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" },
  ]},
  { key: "org", label: "Org Chart", icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75", branch: "CROSS-CUTTING" },
];

const HISTORY_OPTIONS = [
  { value: "30d", label: "30 Days" },
  { value: "90d", label: "90 Days" },
  { value: "1y", label: "1 Year" },
  { value: "2y", label: "2 Years" },
];

export default function App() {
  const [active, setActive] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [navProjectId, setNavProjectId] = useState(null);
  const [bugReportOpen, setBugReportOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({ risk: true, admin: true, technology: true, ops: true, growth: true });
  useEffect(() => { setMounted(true); }, []);

  const { simDate, advanceDay, retreatDay, historyDepth, setHistoryDepth, maxDate } = useSimDate();
  const { activeUser, badge, switchUser, allUsers } = useBadge();
  const { isAuthenticated, currentUser, authMethod, signOut } = useAuth();
  const { visibleModules, can, canAccessVp } = usePermissions();
  const { mode, toggleTheme } = useThemeMode();

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
      const entry = agentIndex[agentId];
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

  // Post-login redirect to role-based landing page
  const hasRedirected = useRef(false);
  useEffect(() => {
    if (isAuthenticated && currentUser && !hasRedirected.current) {
      hasRedirected.current = true;
      const landingKey = getLandingPageKey(currentUser);
      if (landingKey) setActive(landingKey);
    }
    if (!isAuthenticated) hasRedirected.current = false;
  }, [isAuthenticated, currentUser]);

  // Auth gate — show login if not authenticated
  if (!isAuthenticated) return <LoginView />;

  // Filter sidebar modules by permission
  const visibleSidebar = modules.filter((m) => visibleModules.includes(m.key));

  // ─── Resolve the active view ───
  const resolveView = () => {
    // Executive dashboards (CEO, COO) — reuse VpDashboardView
    if (isExecKey(active)) {
      if (!canAccessVp(active)) return <AccessDenied module="org" action="view executive dashboard" />;
      const exec = getExecData(active);
      if (exec) return <VpDashboardView vp={exec} onNavigate={setActive} />;
    }

    // VP dashboards
    if (isVpKey(active) && vpRegistry[active]) {
      if (!canAccessVp(active)) return <AccessDenied module="org" action="view this VP dashboard" />;
      return <VpDashboardView vp={vpRegistry[active]} onNavigate={setActive} />;
    }

    // Agent detail pages: "agent-{agentId}"
    if (isAgentKey(active)) {
      if (!can("org", "agentDetail")) return <AccessDenied module="org" action="view agent details" />;
      const agentId = active.replace("agent-", "");
      const entry = agentIndex[agentId];
      if (entry) {
        const parentTeam = entry.parentKey === "ceo"
          ? ceoAgentTeam.agentTeam
          : entry.parentKey === "coo"
          ? cooAgentTeam.agentTeam
          : vpRegistry[entry.parentKey]?.agentTeam;
        return (
          <AgentDetailView
            agent={entry.agent}
            parentKey={entry.parentKey}
            parentTitle={entry.parentTitle}
            color={entry.color}
            agentTeam={parentTeam}
            onNavigate={setActive}
          />
        );
      }
    }

    // Generic landing pages (Manager / Operator / Viewer)
    if (active === "manager" || active === "operator" || active === "viewer") {
      return <GenericLandingView pageKey={active} onNavigate={setActive} />;
    }

    // Permission check for standard modules (including risk children — check parent "risk" permission)
    const permKey = active.startsWith("risk-") ? "risk" : active.startsWith("admin-") ? "admin" : active;
    const isStandardModule = modules.find((m) => m.key === active) || modules.some(m => m.children?.some(c => c.key === active));
    if (!can(permKey, "view") && isStandardModule) {
      return <AccessDenied module={permKey} action="view" />;
    }

    // Standard module views
    const standardViews = {
      dashboard: <DashboardView onNavigate={setActive} />,
      technology: <OperationsView />,
      ops: <DeliveringView initialProject={navProjectId} onNavigate={setActive} key={navProjectId || "delivering"} />,
      growth: <FinanceView />,
      development: <DevelopmentView onNavigate={setActive} />,
      delivering: <DeliveringView initialProject={navProjectId} onNavigate={setActive} key={navProjectId || "delivering"} />,
      operations: <OperationsView />,
      finance: <FinanceView />,
      admin: <PlatformAdminView />,
      workforce: <WorkforceView />,
      risk: <RiskLandingView onNavigate={setActive} />,
      "risk-workforce": <WorkforceView />,
      "risk-zones": <RiskView defaultTab="zones" key="risk-zones" />,
      "risk-contractors": <RiskView defaultTab="contractors" key="risk-contractors" />,
      "risk-safety": <RiskView defaultTab="safety" key="risk-safety" />,
      "risk-register": <RiskView defaultTab="register" key="risk-register" />,
      "risk-predictive": <RiskView defaultTab="predictive" key="risk-predictive" />,
      "risk-process-mfg": <RiskDomainDetailView domainKey="risk-process-mfg" key="risk-process-mfg" />,
      "risk-project-dev": <RiskDomainDetailView domainKey="risk-project-dev" key="risk-project-dev" />,
      "risk-offtake-mktg": <RiskDomainDetailView domainKey="risk-offtake-mktg" key="risk-offtake-mktg" />,
      "risk-site-security": <RiskDomainDetailView domainKey="risk-site-security" key="risk-site-security" />,
      "risk-it-data": <RiskDomainDetailView domainKey="risk-it-data" key="risk-it-data" />,
      "risk-regulatory": <RiskDomainDetailView domainKey="risk-regulatory" key="risk-regulatory" />,
      "risk-supply-chain": <RiskDomainDetailView domainKey="risk-supply-chain" key="risk-supply-chain" />,
      "admin-it-infra": <PlatformAdminView defaultCategory="it-infra" key="admin-it-infra" />,
      "admin-ai-agents": <PlatformAdminView defaultCategory="ai-agents" key="admin-ai-agents" />,
      "admin-operations": <PlatformAdminView defaultCategory="operations" key="admin-operations" />,
      "admin-users-security": <PlatformAdminView defaultCategory="users-security" key="admin-users-security" />,
      "admin-platform-config": <PlatformAdminView defaultCategory="platform-config" key="admin-platform-config" />,
      "admin-bug-fixes": <PlatformAdminView defaultCategory="bug-fixes" key="admin-bug-fixes" />,
      org: <OrgChartView onNavigate={setActive} />,
      focus: <FocusTrackerView />,
      sitemap: <PortfolioMapView onNavigateToProject={(siteId) => { setNavProjectId(siteId); setActive("delivering"); }} />,
      settings: <PlatformAdminView />,  /* legacy route — redirects to combined view */
    };
    return standardViews[active] || standardViews.dashboard;
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
      const entry = agentIndex[agentId];
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
      const riskModule = modules.find(m => m.key === "risk");
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
      const adminModule = modules.find(m => m.key === "admin");
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
    const parentModule = modules.find(m => m.children?.some(c => c.key === active));
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
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: T.text }}>{modules.find(m => m.key === active)?.label}</h1>
        <span style={{ fontSize: 11, color: T.accent }}>{activeSites.length} Active Sites · {constructionSites.length} In Construction · {totalProcessors} Processors</span>
      </>
    );
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: T.bg0, color: T.text, fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif", opacity: mounted ? 1 : 0, transition: "opacity .4s" }}>
      <div style={{ width: 3, background: T.accent, flexShrink: 0 }} />
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
          {getBugReportCount() > 0 && (
            <span style={{ position: collapsed ? "absolute" : "static", top: collapsed ? 6 : undefined, right: collapsed ? 8 : undefined, marginLeft: collapsed ? 0 : "auto", fontSize: 9, fontWeight: 800, background: T.danger, color: "#fff", minWidth: 16, height: 16, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>
              {getBugReportCount()}
            </span>
          )}
        </button>
        <button onClick={() => setCollapsed(!collapsed)} style={{ padding: 14, border: "none", borderTop: `1px solid ${T.border}`, background: "transparent", cursor: "pointer", color: T.textDim, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: collapsed ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .2s" }}><path d="M15 18l-6-6 6-6" /></svg>
        </button>
      </nav>
      <main style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>
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
        <div style={{ padding: 28, flex: 1 }}>{resolveView()}</div>
      </main>

      {/* Global agent FAB — visible on all pages with per-page pre-selection */}
      <GlobalAgentFab directory={agentDirectory} onNavigate={setActive} preSelectedIds={preSelectedIds} />

      {/* Bug Report Modal */}
      <BugReportModal open={bugReportOpen} onClose={() => setBugReportOpen(false)} activeModule={active} />
    </div>
  );
}
