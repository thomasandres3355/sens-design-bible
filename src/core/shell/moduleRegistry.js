/**
 * Module Registry — Central manifest for all SENS platform modules.
 *
 * Each module declares:
 *   - nav:    sidebar navigation config (key, label, icon, children)
 *   - routes: { routeKey → () => ComponentElement } (lazy-friendly)
 *   - phase:  deployment phase (1–6)
 *
 * To disable a module, set `enabled: false`. The shell reads this
 * registry to build the sidebar and resolve views.
 */
import { lazy } from "react";

// ─── Lazy-loaded view components ─────────────────────────────────────
const DashboardView       = lazy(() => import("@modules/dashboard/DashboardView").then(m => ({ default: m.DashboardView })));
const FocusTrackerView    = lazy(() => import("@modules/executive-focus/FocusTrackerView").then(m => ({ default: m.FocusTrackerView })));
const PortfolioMapView    = lazy(() => import("@modules/operations/PortfolioMapView").then(m => ({ default: m.PortfolioMapView })));
const DeliveringView      = lazy(() => import("@core/operational-views/DeliveringView").then(m => ({ default: m.DeliveringView })));
const OperationsView      = lazy(() => import("@core/operational-views/OperationsView").then(m => ({ default: m.OperationsView })));
const FinanceView         = lazy(() => import("@modules/growth/FinanceView").then(m => ({ default: m.FinanceView })));
const DevelopmentView     = lazy(() => import("@modules/growth/DevelopmentView").then(m => ({ default: m.DevelopmentView })));
const RiskLandingView     = lazy(() => import("@modules/risk/RiskLandingView").then(m => ({ default: m.RiskLandingView })));
const RiskView            = lazy(() => import("@modules/risk/RiskView").then(m => ({ default: m.RiskView })));
const RiskDomainDetailView = lazy(() => import("@modules/risk/RiskDomainDetailView").then(m => ({ default: m.RiskDomainDetailView })));
const WorkforceView       = lazy(() => import("@modules/risk/WorkforceView").then(m => ({ default: m.WorkforceView })));
const OrgChartView        = lazy(() => import("@modules/organization/OrgChartView").then(m => ({ default: m.OrgChartView })));
const PlatformAdminView   = lazy(() => import("@modules/admin/PlatformAdminView").then(m => ({ default: m.PlatformAdminView })));
const GenericLandingView  = lazy(() => import("@modules/organization/GenericLandingView").then(m => ({ default: m.GenericLandingView })));
const VpDashboardView     = lazy(() => import("@modules/organization/VpDashboardView").then(m => ({ default: m.VpDashboardView })));
const AgentDetailView     = lazy(() => import("@modules/ai-agents/AgentDetailView").then(m => ({ default: m.AgentDetailView })));
const ModelView           = lazy(() => import("@modules/growth/ModelView").then(m => ({ default: m.ModelView })));

// Templates
const Template1           = lazy(() => import("@modules/templates/TemplatesView").then(m => ({ default: m.Template1 })));
const Template2           = lazy(() => import("@modules/templates/TemplatesView").then(m => ({ default: m.Template2 })));
const Template3           = lazy(() => import("@modules/templates/TemplatesView").then(m => ({ default: m.Template3 })));
const Template4           = lazy(() => import("@modules/templates/TemplatesView").then(m => ({ default: m.Template4 })));
const Template5           = lazy(() => import("@modules/templates/TemplatesView").then(m => ({ default: m.Template5 })));
const DashboardTemplateA  = lazy(() => import("@modules/templates/TemplatesView").then(m => ({ default: m.DashboardTemplateA })));
const DashboardTemplateB  = lazy(() => import("@modules/templates/TemplatesView").then(m => ({ default: m.DashboardTemplateB })));
const DashboardTemplateC  = lazy(() => import("@modules/templates/TemplatesView").then(m => ({ default: m.DashboardTemplateC })));
const DeptHomeA           = lazy(() => import("@modules/templates/TemplatesView").then(m => ({ default: m.DeptHomeA })));
const DeptHomeB           = lazy(() => import("@modules/templates/TemplatesView").then(m => ({ default: m.DeptHomeB })));
const DeptHomeC           = lazy(() => import("@modules/templates/TemplatesView").then(m => ({ default: m.DeptHomeC })));
const DashboardTemplateD  = lazy(() => import("@modules/templates/TemplatesView").then(m => ({ default: m.DashboardTemplateD })));
const DashboardTemplateE  = lazy(() => import("@modules/templates/TemplatesView").then(m => ({ default: m.DashboardTemplateE })));
const DeptHomeD           = lazy(() => import("@modules/templates/TemplatesView").then(m => ({ default: m.DeptHomeD })));
const DeptHomeE           = lazy(() => import("@modules/templates/TemplatesView").then(m => ({ default: m.DeptHomeE })));

// ─── Module Definitions ──────────────────────────────────────────────

export const MODULE_PHASES = {
  PHASE_1: 1,  // Dashboard, Executive Focus, AI Agents, Platform
  PHASE_2: 2,  // Operations, Site Map
  PHASE_3: 3,  // Technology
  PHASE_4: 4,  // Growth
  PHASE_5: 5,  // Risk
  PHASE_6: 6,  // Organization
};

const modules = [
  // ─── Phase 1 ───
  {
    id: "dashboard",
    phase: 1,
    enabled: true,
    nav: { key: "dashboard", label: "Dashboard", icon: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12z M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" },
    routes: {
      dashboard: (props) => ({ component: DashboardView, props: { onNavigate: props.setActive } }),
    },
  },
  {
    id: "executive-focus",
    phase: 1,
    enabled: true,
    nav: { key: "focus", label: "Executive Focus", icon: "M22 11.08V12a10 10 0 1 1-5.93-9.14 M22 4L12 14.01l-3-3" },
    routes: {
      focus: () => ({ component: FocusTrackerView, props: {} }),
      "focus-tasks": () => ({ component: FocusTrackerView, props: { initialTab: "tasks" } }),
    },
  },
  // AI Agents has no top-level nav (accessed via Org Chart + FAB), but is Phase 1
  {
    id: "ai-agents",
    phase: 1,
    enabled: true,
    nav: null, // no sidebar entry — agents are accessed through org chart and FAB
    routes: {}, // agent routes are dynamic (agent-{id}) — handled by shell
  },
  {
    id: "platform",
    phase: 1,
    enabled: true,
    nav: {
      key: "admin", label: "Platform",
      icon: "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
      branch: "ADMINISTRATION",
      children: [
        { key: "admin-it-infra", label: "IT & Infrastructure", icon: "M22 12H2 M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z M6 16h.01 M10 16h.01" },
        { key: "admin-ai-agents", label: "AI & Agents", icon: "M18 12h2 M4 12h2 M12 4v2 M12 18v2 M7 7l1.5 1.5 M15.5 15.5L17 17 M17 7l-1.5 1.5 M8.5 15.5L7 17 M9 2h6 M9 22h6 M2 9v6 M22 9v6 M12 12m-3 0a3 3 0 106 0 3 3 0 00-6 0" },
        { key: "admin-operations", label: "Operations", icon: "M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" },
        { key: "admin-users-security", label: "Users & Security", icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 7a4 4 0 100-8 4 4 0 000 8z M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75" },
        { key: "admin-platform-config", label: "Platform Config", icon: "M4 21v-7 M4 10V3 M12 21v-9 M12 8V3 M20 21v-5 M20 12V3 M1 14h6 M9 8h6 M17 16h6" },
        { key: "admin-bug-fixes", label: "Bug Fixes", icon: "M8 2l1.88 1.88 M14.12 3.88L16 2 M9 7.13v-1a3.003 3.003 0 116 0v1 M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 014-4h4a4 4 0 014 4v3c0 3.3-2.7 6-6 6 M12 20v-9" },
      ],
    },
    routes: {
      admin: () => ({ component: PlatformAdminView, props: {} }),
      "admin-it-infra": () => ({ component: PlatformAdminView, props: { defaultCategory: "it-infra" } }),
      "admin-ai-agents": () => ({ component: PlatformAdminView, props: { defaultCategory: "ai-agents" } }),
      "admin-operations": () => ({ component: PlatformAdminView, props: { defaultCategory: "operations" } }),
      "admin-users-security": () => ({ component: PlatformAdminView, props: { defaultCategory: "users-security" } }),
      "admin-platform-config": () => ({ component: PlatformAdminView, props: { defaultCategory: "platform-config" } }),
      "admin-bug-fixes": () => ({ component: PlatformAdminView, props: { defaultCategory: "bug-fixes" } }),
      settings: () => ({ component: PlatformAdminView, props: {} }), // legacy route
    },
  },

  // ─── Phase 2 ───
  {
    id: "sitemap",
    phase: 2,
    enabled: true,
    nav: { key: "sitemap", label: "Site Map", icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM4 12c0-.61.08-1.21.21-1.78L8.99 15v1c0 1.1.9 2 2 2v1.93C7.06 19.43 4 16.07 4 12zm13.89 5.4c-.26-.81-1-1.4-1.9-1.4h-1v-3c0-.55-.45-1-1-1h-6v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41C18.92 5.77 20 8.65 20 12c0 2.08-.67 4-1.11 5.4z" },
    routes: {
      sitemap: (props) => ({ component: PortfolioMapView, props: { onNavigateToProject: (siteId) => { props.setNavProjectId(siteId); props.setActive("ops-projects"); } } }),
    },
  },
  {
    id: "operations",
    phase: 2,
    enabled: true,
    nav: {
      key: "ops", label: "Operations",
      icon: "M12 2L2 7l10 5 10-5-10-5z M2 17l10 5 10-5 M2 12l10 5 10-5",
      branch: "OPERATIONS",
      children: [
        { key: "ops-projects", label: "Projects", icon: "M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" },
        { key: "ops-engineering", label: "Engineering", icon: "M12 2L2 7l10 5 10-5-10-5z M2 17l10 5 10-5 M2 12l10 5 10-5" },
        { key: "ops-maintenance", label: "Maintenance", icon: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" },
        { key: "ops-risk", label: "Risk", icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z M12 8v4 M12 16h.01" },
        { key: "ops-logistics", label: "Logistics", icon: "M1 3h15v13H1z M16 8h4l3 3v5h-7V8z M5.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5z M18.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" },
        { key: "ops-plant", label: "Plant Operations", icon: "M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" },
      ],
    },
    routes: {
      ops: (props) => ({ component: DeliveringView, props: { fixedTab: "projects", initialProject: props.navProjectId, onNavigate: props.setActive } }),
      "ops-projects": (props) => ({ component: DeliveringView, props: { fixedTab: "projects", initialProject: props.navProjectId, onNavigate: props.setActive } }),
      "ops-engineering": () => ({ component: DeliveringView, props: { fixedTab: "engineering", engineeringScope: "operations" } }),
      "ops-maintenance": () => ({ component: OperationsView, props: { fixedTab: "maintenance", maintenanceScope: "facilities" } }),
      "ops-risk": () => ({ component: OperationsView, props: { fixedTab: "hse" } }),
      "ops-logistics": () => ({ component: OperationsView, props: { fixedTab: "logistics" } }),
      "ops-plant": () => ({ component: OperationsView, props: { fixedTab: "plant" } }),
    },
  },

  // ─── Phase 3 ───
  {
    id: "technology",
    phase: 3,
    enabled: true,
    nav: {
      key: "technology", label: "Technology",
      icon: "M4 4h16v16H4z M9 9h6v6H9z M9 1v3 M15 1v3 M9 20v3 M15 20v3 M20 9h3 M20 15h3 M1 9h3 M1 15h3",
      branch: "TECHNOLOGY",
      children: [
        { key: "tech-manufacturing", label: "Manufacturing", icon: "M2 20h20 M5 20V8l5-6 5 6v12 M19 20V12l-2-2-2 2v8 M9 12h2 M9 16h2" },
        { key: "tech-maintenance", label: "Maintenance", icon: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" },
        { key: "tech-engineering", label: "Engineering", icon: "M12 2L2 7l10 5 10-5-10-5z M2 17l10 5 10-5 M2 12l10 5 10-5" },
        { key: "tech-ip-risk", label: "IP Risk", icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z M9 12l2 2 4-4" },
      ],
    },
    routes: {
      technology: () => ({ component: DeliveringView, props: { fixedTab: "manufacturing" } }),
      "tech-manufacturing": () => ({ component: DeliveringView, props: { fixedTab: "manufacturing" } }),
      "tech-maintenance": () => ({ component: OperationsView, props: { fixedTab: "maintenance", maintenanceScope: "machines" } }),
      "tech-engineering": () => ({ component: DeliveringView, props: { fixedTab: "engineering", engineeringScope: "technology" } }),
      "tech-ip-risk": () => ({ component: null, props: {} }), // placeholder — rendered inline by shell
    },
  },

  // ─── Phase 4 ───
  {
    id: "growth",
    phase: 4,
    enabled: true,
    nav: {
      key: "growth", label: "Growth",
      icon: "M18 20V10 M12 20V4 M6 20v-6",
      branch: "GROWTH",
      children: [
        { key: "finance", label: "Finance & Strategy", icon: "M3 3v18h18 M7 16l4-4 4 4 5-5 M18 7h4v4" },
        { key: "development", label: "Development", icon: "M22 3H2l4 6h12l4-6z M6 9l3 4.5h6L18 9 M9 13.5l2 3h2l2-3 M11 16.5V21 M13 16.5V21" },
      ],
    },
    routes: {
      growth: () => ({ component: FinanceView, props: {} }),
      finance: () => ({ component: FinanceView, props: {} }),
      development: (props) => ({ component: DevelopmentView, props: { onNavigate: props.setActive } }),
    },
  },

  // ─── Phase 5 ───
  {
    id: "risk",
    phase: 5,
    enabled: true,
    nav: {
      key: "risk", label: "Risk",
      icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
      branch: "CROSS-CUTTING",
      children: [
        { key: "risk-workforce", label: "Workforce", icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75" },
        { key: "risk-process-mfg", label: "Process & Mfg", icon: "M2 20h20 M5 20V8l5-6 5 6v12 M19 20V12l-2-2-2 2v8 M9 12h2 M9 16h2" },
        { key: "risk-project-dev", label: "Project Dev", icon: "M22 3H2l4 6h12l4-6z M6 9l3 4.5h6L18 9 M9 13.5l2 3h2l2-3 M11 16.5V21 M13 16.5V21" },
        { key: "risk-offtake-mktg", label: "Offtake & Mktg", icon: "M3 3v18h18 M7 16l4-4 4 4 5-5 M18 7h4v4" },
        { key: "risk-site-security", label: "Site Security", icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z M12 8v4 M12 16h.01" },
        { key: "risk-it-data", label: "IT & Data", icon: "M18 12h2 M4 12h2 M12 4v2 M12 18v2 M12 12m-3 0a3 3 0 106 0 3 3 0 00-6 0" },
        { key: "risk-regulatory", label: "Regulatory", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" },
        { key: "risk-supply-chain", label: "Supply Chain", icon: "M1 3h15v13H1z M16 8h4l3 3v5h-7V8z M5.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5z M18.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" },
      ],
    },
    routes: {
      risk: (props) => ({ component: RiskLandingView, props: { onNavigate: props.setActive } }),
      "risk-workforce": () => ({ component: WorkforceView, props: {} }),
      workforce: () => ({ component: WorkforceView, props: {} }),
      "risk-zones": () => ({ component: RiskView, props: { defaultTab: "zones" } }),
      "risk-contractors": () => ({ component: RiskView, props: { defaultTab: "contractors" } }),
      "risk-safety": () => ({ component: RiskView, props: { defaultTab: "safety" } }),
      "risk-register": () => ({ component: RiskView, props: { defaultTab: "register" } }),
      "risk-predictive": () => ({ component: RiskView, props: { defaultTab: "predictive" } }),
      "risk-process-mfg": () => ({ component: RiskDomainDetailView, props: { domainKey: "risk-process-mfg" } }),
      "risk-project-dev": () => ({ component: RiskDomainDetailView, props: { domainKey: "risk-project-dev" } }),
      "risk-offtake-mktg": () => ({ component: RiskDomainDetailView, props: { domainKey: "risk-offtake-mktg" } }),
      "risk-site-security": () => ({ component: RiskDomainDetailView, props: { domainKey: "risk-site-security" } }),
      "risk-it-data": () => ({ component: RiskDomainDetailView, props: { domainKey: "risk-it-data" } }),
      "risk-regulatory": () => ({ component: RiskDomainDetailView, props: { domainKey: "risk-regulatory" } }),
      "risk-supply-chain": () => ({ component: RiskDomainDetailView, props: { domainKey: "risk-supply-chain" } }),
    },
  },

  // ─── Phase 6 ───
  {
    id: "organization",
    phase: 6,
    enabled: true,
    nav: { key: "org", label: "Org Chart", icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75", branch: "CROSS-CUTTING" },
    routes: {
      org: (props) => ({ component: OrgChartView, props: { onNavigate: props.setActive } }),
      manager: (props) => ({ component: GenericLandingView, props: { pageKey: "manager", onNavigate: props.setActive } }),
      operator: (props) => ({ component: GenericLandingView, props: { pageKey: "operator", onNavigate: props.setActive } }),
      viewer: (props) => ({ component: GenericLandingView, props: { pageKey: "viewer", onNavigate: props.setActive } }),
    },
  },

  // ─── Templates (always visible) ───
  {
    id: "templates",
    phase: 1,
    enabled: true,
    nav: {
      key: "templates", label: "Templates",
      icon: "M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5z M4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z M16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z",
      branch: "TEMPLATES",
      children: [
        { key: "template-1", label: "Template One", icon: "M3 3h18v18H3z M3 9h18 M9 9v12" },
        { key: "template-2", label: "Template Two", icon: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z" },
        { key: "template-3", label: "Template Three", icon: "M3 3h18v4H3z M3 10h18v4H3z M3 17h18v4H3z" },
        { key: "template-4", label: "Template Four", icon: "M4 4h4v4H4z M12 4h4v4h-4z M4 12h4v4H4z M12 12h4v4h-4z M20 4h0 M20 12h0" },
        { key: "template-5", label: "Template Five", icon: "M3 3h18v5H3z M3 11h8v10H3z M14 11h7v4h-7z M14 18h7v3h-7z" },
        { key: "tpl-dash-1", label: "Dashboard A", icon: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M12 18a6 6 0 100-12 6 6 0 000 12z" },
        { key: "tpl-dash-2", label: "Dashboard B", icon: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M12 18a6 6 0 100-12 6 6 0 000 12z" },
        { key: "tpl-dash-3", label: "Dashboard C", icon: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M12 18a6 6 0 100-12 6 6 0 000 12z" },
        { key: "tpl-dept-1", label: "Dept Home A", icon: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10" },
        { key: "tpl-dept-2", label: "Dept Home B", icon: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10" },
        { key: "tpl-dept-3", label: "Dept Home C", icon: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10" },
        { key: "tpl-dash-4", label: "Dashboard D", icon: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M12 18a6 6 0 100-12 6 6 0 000 12z" },
        { key: "tpl-dash-5", label: "Dashboard E", icon: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M12 18a6 6 0 100-12 6 6 0 000 12z" },
        { key: "tpl-dept-4", label: "Dept Home D", icon: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10" },
        { key: "tpl-dept-5", label: "Dept Home E", icon: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10" },
      ],
    },
    routes: {
      templates: () => ({ component: Template1, props: {} }),
      "template-1": () => ({ component: Template1, props: {} }),
      "template-2": () => ({ component: Template2, props: {} }),
      "template-3": () => ({ component: Template3, props: {} }),
      "template-4": () => ({ component: Template4, props: {} }),
      "template-5": () => ({ component: Template5, props: {} }),
      "tpl-dash-1": (props) => ({ component: DashboardTemplateA, props: { onNavigate: props.setActive } }),
      "tpl-dash-2": (props) => ({ component: DashboardTemplateB, props: { onNavigate: props.setActive } }),
      "tpl-dash-3": (props) => ({ component: DashboardTemplateC, props: { onNavigate: props.setActive } }),
      "tpl-dept-1": (props) => ({ component: DeptHomeA, props: { onNavigate: props.setActive } }),
      "tpl-dept-2": (props) => ({ component: DeptHomeB, props: { onNavigate: props.setActive } }),
      "tpl-dept-3": (props) => ({ component: DeptHomeC, props: { onNavigate: props.setActive } }),
      "tpl-dash-4": (props) => ({ component: DashboardTemplateD, props: { onNavigate: props.setActive } }),
      "tpl-dash-5": (props) => ({ component: DashboardTemplateE, props: { onNavigate: props.setActive } }),
      "tpl-dept-4": (props) => ({ component: DeptHomeD, props: { onNavigate: props.setActive } }),
      "tpl-dept-5": (props) => ({ component: DeptHomeE, props: { onNavigate: props.setActive } }),
    },
  },
];

// ─── Public API ──────────────────────────────────────────────────────

/** All enabled modules */
export const getEnabledModules = () => modules.filter(m => m.enabled);

/** Sidebar navigation items from enabled modules (filtered, ordered) */
export const getNavItems = () =>
  getEnabledModules()
    .filter(m => m.nav)
    .map(m => m.nav);

/**
 * Merged route map: routeKey → resolver(props) → { component, props }
 * Only includes routes from enabled modules.
 */
export const getRouteMap = () => {
  const map = {};
  for (const mod of getEnabledModules()) {
    Object.assign(map, mod.routes);
  }
  return map;
};

/** Get all route keys across all enabled modules */
export const getAllRouteKeys = () => Object.keys(getRouteMap());

/** Check if a module (by id) is enabled */
export const isModuleEnabled = (moduleId) =>
  modules.some(m => m.id === moduleId && m.enabled);

/** Get module definition by id */
export const getModuleById = (moduleId) =>
  modules.find(m => m.id === moduleId);

/** Enable/disable a module at runtime (for admin panel, feature flags) */
export const setModuleEnabled = (moduleId, enabled) => {
  const mod = modules.find(m => m.id === moduleId);
  if (mod) mod.enabled = enabled;
};

/** Get the maximum deployed phase */
export const getDeployedPhase = () =>
  Math.max(...getEnabledModules().map(m => m.phase));

/** Lazy components map — for Suspense boundary usage */
export {
  DashboardView,
  FocusTrackerView,
  PortfolioMapView,
  DeliveringView,
  OperationsView,
  FinanceView,
  DevelopmentView,
  RiskLandingView,
  RiskView,
  RiskDomainDetailView,
  WorkforceView,
  OrgChartView,
  PlatformAdminView,
  GenericLandingView,
  VpDashboardView,
  AgentDetailView,
  ModelView,
  Template1, Template2, Template3, Template4, Template5,
  DashboardTemplateA, DashboardTemplateB, DashboardTemplateC,
  DeptHomeA, DeptHomeB, DeptHomeC,
  DashboardTemplateD, DashboardTemplateE,
  DeptHomeD, DeptHomeE,
};
