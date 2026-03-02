# SENS Platform — Modular Architecture Plan

**Date:** 2026-03-01
**Version:** 2 (revised module boundaries)
**Status:** Planning
**Author:** Architecture Review (Claude + Thomas)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current State Assessment](#2-current-state-assessment)
3. [Module Map — All 9 Modules](#3-module-map--all-9-modules)
4. [Target Architecture](#4-target-architecture)
5. [Phase 1 Scope — Detailed](#5-phase-1-scope--detailed)
6. [Phase 2–6 Roadmap](#6-phase-26-roadmap)
7. [Implementation Strategy](#7-implementation-strategy)
8. [Technical Decisions](#8-technical-decisions)
9. [Risk & Mitigation](#9-risk--mitigation)
10. [File-Level Migration Map](#10-file-level-migration-map)

---

## 1. Executive Summary

### The Problem
The SENS platform is currently a monolithic React SPA — 69 files, ~38,000 lines, shipping as a single 1.5 MB JavaScript bundle. Every feature is coupled to every other feature through a flat directory structure and a massive `App.jsx` router. This makes it impossible to deploy incrementally or build in phases.

### The Solution
Restructure the application into a **feature-module architecture** with 9 business modules plus a shared core. Each module is self-contained with its own views, data, and components. A shared `core/` layer provides platform infrastructure (auth, permissions, routing, UI components) that all modules depend on.

### The 9 Modules

| # | Module | Business Purpose | Phase |
|---|--------|-----------------|-------|
| 1 | **Platform Core** | Auth, users, permissions, settings, nav | 1 |
| 2 | **Dashboard** | System alerts + company objectives | 1 |
| 3 | **Executive Focus** | Daily task tracker, weekly plans, pulse feed | 1 |
| 4 | **AI Agents** | Ask AI, meeting agents, system alerts | 1 |
| 5 | **Operations** | Site execution — how are sites performing? | 2 |
| 6 | **Technology** | Machine delivery — what are we building? | 3 |
| 7 | **Growth** | Finance, strategy, development pipeline | 4 |
| 8 | **Risk** | 9 risk domains, compliance, workforce | 5 |
| 9 | **Organization** | Org chart, VP dashboards, role-based landing | 6 |

### Key Principle
> All other dashboards (Operations, Technology, Growth, Risk) exist to provide information so executives can make day-to-day decisions. Those decisions drive daily tasks in the Executive Focus tracker. The Focus Tracker is the operational heartbeat.

---

## 2. Current State Assessment

### 2.1 Tech Stack
- **Frontend:** React 18.3.1 + Vite 6.0.0
- **Charts:** Recharts 3.7.0
- **Testing:** Playwright 1.58.2
- **Backend:** None — pure client-side app
- **Database:** None — localStorage for persistence
- **Types:** None — plain JavaScript (JSX)
- **CI/CD:** None — manual deployment
- **Bundle:** Single 1.5 MB monolithic JS file

### 2.2 Current Directory Structure (by-type)
```
src/
├── App.jsx                 # 40KB+ monolithic router
├── main.jsx                # Entry point (6 nested context providers)
├── components/ui/          # 13 shared UI components
├── contexts/               # 6 React contexts
├── data/                   # 19 data/config files
├── hooks/                  # 1 routing hook
├── services/               # 3 service files
└── views/                  # 28 view files
```

### 2.3 Context Provider Stack
```
ThemeProvider → AuthProvider → SimDateProvider →
  BadgeProvider → AgentConfigProvider → PermissionProvider → App
```

### 2.4 Current Navigation Branches

The app already organizes features into branches that map well to modules:

```
Dashboard                          → Module: Dashboard
Executive Focus                    → Module: Executive Focus
Site Map                           → Module: Operations
TECHNOLOGY                         → Module: Technology
  ├── Manufacturing                   (DeliveringView, fixedTab="manufacturing")
  ├── Maintenance (Machines)          (OperationsView, maintenanceScope="machines")
  ├── Engineering (Tech)              (DeliveringView, engineeringScope="technology")
  └── IP Risk                         (Placeholder)
OPERATIONS                         → Module: Operations
  ├── Projects                        (DeliveringView, fixedTab="projects")
  ├── Engineering (Ops)               (DeliveringView, engineeringScope="operations")
  ├── Maintenance (Facilities)        (OperationsView, maintenanceScope="facilities")
  ├── Risk / HSE                      (OperationsView, fixedTab="hse")
  ├── Logistics                       (OperationsView, fixedTab="logistics")
  └── Plant                           (OperationsView, fixedTab="plant")
GROWTH                             → Module: Growth
  ├── Finance & Strategy              (FinanceView)
  └── Development                     (DevelopmentView)
CROSS-CUTTING (Risk)               → Module: Risk
  ├── Risk Landing
  ├── 7 Risk Domains
  ├── Workforce
  └── Risk zones/contractors/safety/register/predictive
ADMINISTRATION                     → Module: Admin (part of Platform Core)
  ├── IT & Infrastructure
  ├── AI & Agents
  ├── Users & Security
  ├── Platform Config
  └── Bug Fixes
Org Chart                          → Module: Organization
```

### 2.5 Critical Coupling: Shared View Components

**Technology and Operations branches share the same two view components**, configured by props:

| View Component | Technology Uses | Operations Uses |
|---------------|----------------|-----------------|
| **DeliveringView** | Manufacturing, Engineering (tech) | Projects, Engineering (ops) |
| **OperationsView** | Maintenance (machines) | Maintenance (facilities), HSE, Logistics, Plant |

The difference is **perspective**, not code:
- **Technology** asks: "What machines are we building? What's the manufacturing status?"
- **Operations** asks: "How are sites performing? What needs maintenance at the facility?"

This means DeliveringView and OperationsView must be **shared components** accessible to both modules. They will live in `core/operational-views/` (see Section 4).

### 2.6 Data Persistence (localStorage keys)
```
sens-auth-session           # Auth session (24h/30d TTL)
sens-users                  # User directory
sens-audit-log              # User action audit trail (200 entries max)
sens-permission-config      # Module & VP permissions
sens-badge-config           # Clearance, roles, data classifications
sens-landing-config         # Landing page customization
sens_agent_overrides        # Agent skill/datasource overrides
sens_global_rules           # Access control & response guidelines
sens-layout                 # Dashboard widget layout order
sens-*-kpis                 # KPI card positions per view
sens-usage-*                # API usage statistics by date
sens-theme                  # Dark/light mode preference
```

---

## 3. Module Map — All 9 Modules

### Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     PLATFORM CORE (Phase 1)                  │
│  Auth · Users · Permissions · Theme · Routing · Shared UI    │
│  SimDate · Shared Operational Views · Site Master Data       │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
    ┌──────────┴──────────┐      ┌───────────┴───────────┐
    │   PHASE 1 MODULES   │      │   PHASE 2-6 MODULES   │
    │                      │      │                        │
    │  Dashboard           │      │  Operations  (Ph 2)    │
    │  Executive Focus     │      │  Technology  (Ph 3)    │
    │  AI Agents           │      │  Growth      (Ph 4)    │
    │  Admin (subset)      │      │  Risk        (Ph 5)    │
    │                      │      │  Organization (Ph 6)   │
    └──────────────────────┘      └────────────────────────┘
```

### Module Dependency Graph

```
Platform Core ←──── every module depends on this
     ↑
     ├── Dashboard ←── reads from: Executive Focus (health), AI Agents (alerts)
     ├── Executive Focus ←── reads from: AI Agents (meeting action items)
     ├── AI Agents ←── reads from: Executive Focus (task data for agent context)
     ├── Admin ←── configures: AI Agents, Users, Permissions
     │
     ├── Operations ←── uses: core/operational-views (DeliveringView, OperationsView)
     ├── Technology ←── uses: core/operational-views (same shared views, different props)
     ├── Growth ←── uses: Operations data (site metrics for finance)
     ├── Risk ←── standalone data; links to: Operations, Growth
     └── Organization ←── reads from: AI Agents (agent directory), all modules (VP KPIs)
```

### Module Detail Cards

---

#### Module 1: Platform Core (Phase 1)
**Always loaded. Every module depends on this.**

| Capability | Key Files |
|-----------|-----------|
| Authentication (SSO, Email+MFA) | AuthContext, LoginView, authData |
| User management (CRUD, roles) | BadgeContext, userData, badgeData |
| Permissions (RBAC, 34 modules) | PermissionContext, permissionData, PermissionGate |
| Theme (dark/light) | ThemeContext, theme.js |
| Simulation date (demo/testing) | SimDateContext |
| Routing (40+ routes, History API) | useRouting |
| Shared UI library | layout, indicators, charts, site components |
| Shared operational views | DeliveringView, OperationsView (used by Tech + Ops modules) |
| Site master data | sites.js (7 sites, plan figures) |

---

#### Module 2: Dashboard (Phase 1)
**Command center — alerts and strategic objectives.**

| Capability | Key Files |
|-----------|-----------|
| System alerts (Check Engine Lights) | CheckEngineLightPanel, alertData |
| Company objectives (3 strategic goals) | ObjectiveCard, objectivesData |
| Phase 1: alerts from focus health + objectives + AI | Modified alertData |
| Phase 2+: adds operational KPI alerts, site performance widget | Expanded DashboardView |

**Routes:** `dashboard`

---

#### Module 3: Executive Focus (Phase 1)
**The operational heartbeat — mission critical.**

| Capability | Key Files |
|-----------|-----------|
| Portfolio focus analytics | FocusTrackerView (tab 1) |
| Weekly plans + daily focus posts | FocusTrackerView (tab 2), pulseData |
| Executive task tracking (24h/3d/1w cycles) | focusData |
| Objective alignment scoring | focusData + objectivesData |
| Task carryover tracking (Phase 1 enhancement) | New: carryover system |
| Action item import from meetings | Integration with AI Agents module |

**Routes:** `focus`

---

#### Module 4: AI Agents (Phase 1)
**Digital team — core differentiator.**

| Capability | Key Files |
|-----------|-----------|
| Ask AI button (global FAB) | AgentChat (GlobalAgentFab) |
| Single-agent chat + manager delegation | AgentChat |
| Agent profiles (50+ agents) | AgentDetailView, vpData |
| Meeting AI participation + fact-checking | MeetingView, factCheckService |
| Agent configuration + global rules | AgentConfigContext, agentConfigStore |
| Claude API integration (streaming) | claudeService |
| Usage tracking + cost monitoring | usageTracker |
| Meeting archive + action items | meetingData |

**Routes:** `agent-{id}`, plus global FAB overlay on all pages

---

#### Module 5: Operations (Phase 2)
**Site execution — "How are sites performing?"**

| Capability | Key Files |
|-----------|-----------|
| Site Map (Factorio-style portfolio visualization) | PortfolioMapView |
| Plant operations (throughput, uptime, processors) | OperationsView (fixedTab="plant") |
| Facility maintenance | OperationsView (maintenanceScope="facilities") |
| HSE / Risk | OperationsView (fixedTab="hse") |
| Logistics | OperationsView (fixedTab="logistics") |
| Construction projects | DeliveringView (fixedTab="projects") |
| Engineering (operations scope) | DeliveringView (engineeringScope="operations") |
| Time-series site metrics engine | timeEngine |

**Routes:** `sitemap`, `ops`, `ops-projects`, `ops-engineering`, `ops-maintenance`, `ops-risk`, `ops-logistics`, `ops-plant`

**Note:** OperationsView and DeliveringView live in `core/operational-views/` since they're shared with Technology.

---

#### Module 6: Technology (Phase 3)
**Machine delivery — "What are we building?"**

| Capability | Key Files |
|-----------|-----------|
| Manufacturing (unit delivery tracking) | DeliveringView (fixedTab="manufacturing") |
| Machine maintenance | OperationsView (maintenanceScope="machines") |
| Engineering (technology scope) | DeliveringView (engineeringScope="technology") |
| IP Risk | Placeholder (under development) |

**Routes:** `technology`, `tech-manufacturing`, `tech-maintenance`, `tech-engineering`, `tech-ip-risk`

**Note:** Uses the same shared views from `core/operational-views/` as Operations, but with technology-focused props.

---

#### Module 7: Growth (Phase 4)
**Finance, strategy, and development pipeline.**

| Capability | Key Files |
|-----------|-----------|
| P&L, performance vs plan, marketing | FinanceView |
| Development pipeline + project stages | DevelopmentView |
| Economic models by site | modelData |
| Process designer, team, data room | DevelopmentView (tabs) |
| Development project data | developmentData |

**Routes:** `growth`, `finance`, `development`

---

#### Module 8: Risk (Phase 5)
**9 risk domains, compliance, and workforce.**

| Capability | Key Files |
|-----------|-----------|
| Risk landing + domain navigation | RiskLandingView |
| 7 risk domain detail pages | RiskDomainDetailView |
| Workforce analytics | WorkforceView |
| Risk zones, contractors, safety, register, predictive | RiskView (multi-tab) |
| Risk data models | riskData |

**Routes:** `risk`, `risk-workforce`, `risk-process-mfg`, `risk-project-dev`, `risk-offtake-mktg`, `risk-site-security`, `risk-it-data`, `risk-regulatory`, `risk-supply-chain`, `risk-zones`, `risk-contractors`, `risk-safety`, `risk-register`, `risk-predictive`

---

#### Module 9: Organization (Phase 6)
**Org chart, VP dashboards, role-based landing.**

| Capability | Key Files |
|-----------|-----------|
| Interactive org chart | OrgChartView |
| CEO / COO executive dashboards | VpDashboardView |
| VP-specific dashboards (6 VPs) | VpDashboardView |
| Role-based landing pages | GenericLandingView |

**Routes:** `org`, `ceo`, `coo`, `vp-engineering`, `vp-operations`, `vp-finance`, `vp-strategy`, `vp-people`, `vp-risk`, `manager`, `operator`, `viewer`

---

## 4. Target Architecture

### 4.1 Feature-Module Directory Structure

```
src/
├── core/                              # Shared platform infrastructure
│   ├── auth/                          # Authentication system
│   │   ├── AuthContext.jsx
│   │   ├── LoginView.jsx
│   │   └── authData.js
│   ├── users/                         # User management
│   │   ├── BadgeContext.jsx
│   │   ├── userData.js
│   │   ├── badgeData.js
│   │   └── UserManagementPanel.jsx
│   ├── permissions/                   # RBAC system
│   │   ├── PermissionContext.jsx
│   │   ├── permissionData.js
│   │   └── PermissionGate.jsx
│   ├── theme/                         # Theme system
│   │   ├── ThemeContext.jsx
│   │   └── theme.js
│   ├── simulation/                    # SimDate (testing/demo)
│   │   └── SimDateContext.jsx
│   ├── routing/                       # Navigation
│   │   └── useRouting.js
│   ├── ui/                            # Shared UI component library
│   │   ├── layout.jsx                 #   Card, TabBar, DataTable, DraggableGrid
│   │   ├── indicators.jsx             #   KpiCard, StatusPill, EngineLight, Progress
│   │   ├── charts.jsx                 #   LineChart (Recharts wrapper)
│   │   ├── site.jsx                   #   SiteSelector, PortfolioMap, FacilityView
│   │   └── index.js                   #   Barrel export
│   ├── operational-views/             # Shared views for Technology + Operations
│   │   ├── DeliveringView.jsx         #   Manufacturing, projects, engineering
│   │   └── OperationsView.jsx         #   Plant, maintenance, HSE, logistics
│   ├── shell/                         # App shell (sidebar, header)
│   │   └── AppShell.jsx               #   Extracted from App.jsx
│   └── data/                          # Shared data
│       └── sites.js                   #   Site master data (used cross-module)
│
├── modules/                           # Feature modules
│   ├── dashboard/                     # Phase 1 ─────────────────────
│   │   ├── DashboardView.jsx
│   │   ├── CheckEngineLightPanel.jsx
│   │   ├── ObjectiveCard.jsx
│   │   ├── alertData.js
│   │   ├── objectivesData.js
│   │   └── index.js                   #   Module manifest
│   │
│   ├── executive-focus/               # Phase 1
│   │   ├── FocusTrackerView.jsx
│   │   ├── focusData.js
│   │   ├── pulseData.js
│   │   └── index.js
│   │
│   ├── ai-agents/                     # Phase 1
│   │   ├── AgentChat.jsx
│   │   ├── AgentDetailView.jsx
│   │   ├── MeetingView.jsx
│   │   ├── AgentConfigContext.jsx
│   │   ├── agentConfigStore.js
│   │   ├── vpData.js
│   │   ├── meetingData.js
│   │   ├── services/
│   │   │   ├── claudeService.js
│   │   │   ├── factCheckService.js
│   │   │   └── usageTracker.js
│   │   └── index.js
│   │
│   ├── admin/                         # Phase 1 (subset)
│   │   ├── PlatformAdminView.jsx
│   │   ├── BugReportModal.jsx
│   │   ├── BugFixPortal.jsx
│   │   ├── landingPageData.js
│   │   ├── roamService.js
│   │   └── index.js
│   │                                  # ─────────────────────────────
│   ├── operations/                    # Phase 2
│   │   ├── PortfolioMapView.jsx       #   Site Map lives here
│   │   ├── timeEngine.js
│   │   └── index.js                   #   Routes render shared operational views
│   │
│   ├── technology/                    # Phase 3
│   │   └── index.js                   #   Routes render shared operational views
│   │
│   ├── growth/                        # Phase 4
│   │   ├── FinanceView.jsx
│   │   ├── DevelopmentView.jsx
│   │   ├── modelData.js
│   │   ├── developmentData.js
│   │   └── index.js
│   │
│   ├── risk/                          # Phase 5
│   │   ├── RiskView.jsx
│   │   ├── RiskLandingView.jsx
│   │   ├── RiskDomainDetailView.jsx
│   │   ├── WorkforceView.jsx
│   │   ├── riskData.js
│   │   └── index.js
│   │
│   └── organization/                  # Phase 6
│       ├── OrgChartView.jsx
│       ├── VpDashboardView.jsx
│       ├── GenericLandingView.jsx
│       └── index.js
│
├── App.jsx                            # Slim router (reads module registry)
├── main.jsx                           # Entry point
└── moduleRegistry.js                  # Central module manifest
```

### 4.2 The Shared Operational Views Pattern

Technology and Operations both use the same two view components (`DeliveringView` and `OperationsView`) but configure them with different props. Rather than duplicate code or create awkward cross-module imports, these views live in `core/operational-views/`:

```javascript
// modules/operations/index.js — Operations module manifest
import { lazy } from 'react';

export default {
  id: 'operations',
  phase: 2,
  enabled: false,  // disabled until Phase 2
  routes: [
    { key: 'sitemap',         component: lazy(() => import('./PortfolioMapView')) },
    { key: 'ops',             component: lazy(() => import('../../core/operational-views/DeliveringView')),
                              props: { fixedTab: 'projects' } },
    { key: 'ops-projects',    component: lazy(() => import('../../core/operational-views/DeliveringView')),
                              props: { fixedTab: 'projects' } },
    { key: 'ops-engineering', component: lazy(() => import('../../core/operational-views/DeliveringView')),
                              props: { fixedTab: 'engineering', engineeringScope: 'operations' } },
    { key: 'ops-maintenance', component: lazy(() => import('../../core/operational-views/OperationsView')),
                              props: { fixedTab: 'maintenance', maintenanceScope: 'facilities' } },
    { key: 'ops-risk',        component: lazy(() => import('../../core/operational-views/OperationsView')),
                              props: { fixedTab: 'hse' } },
    { key: 'ops-logistics',   component: lazy(() => import('../../core/operational-views/OperationsView')),
                              props: { fixedTab: 'logistics' } },
    { key: 'ops-plant',       component: lazy(() => import('../../core/operational-views/OperationsView')),
                              props: { fixedTab: 'plant' } },
  ],
  nav: [
    { key: 'sitemap', label: 'Site Map' },
    { key: 'ops', label: 'Operations', branch: 'OPERATIONS', children: [
      { key: 'ops-projects', label: 'Projects' },
      { key: 'ops-engineering', label: 'Engineering' },
      { key: 'ops-maintenance', label: 'Maintenance' },
      { key: 'ops-risk', label: 'Risk / HSE' },
      { key: 'ops-logistics', label: 'Logistics' },
      { key: 'ops-plant', label: 'Plant' },
    ]},
  ],
};

// modules/technology/index.js — Technology module manifest
export default {
  id: 'technology',
  phase: 3,
  enabled: false,  // disabled until Phase 3
  routes: [
    { key: 'technology',        component: lazy(() => import('../../core/operational-views/DeliveringView')),
                                props: { fixedTab: 'manufacturing' } },
    { key: 'tech-manufacturing', component: lazy(() => import('../../core/operational-views/DeliveringView')),
                                props: { fixedTab: 'manufacturing' } },
    { key: 'tech-maintenance',  component: lazy(() => import('../../core/operational-views/OperationsView')),
                                props: { fixedTab: 'maintenance', maintenanceScope: 'machines' } },
    { key: 'tech-engineering',  component: lazy(() => import('../../core/operational-views/DeliveringView')),
                                props: { fixedTab: 'engineering', engineeringScope: 'technology' } },
    { key: 'tech-ip-risk',     component: null },  // Placeholder — under development
  ],
  nav: [
    { key: 'technology', label: 'Technology', branch: 'TECHNOLOGY', children: [
      { key: 'tech-manufacturing', label: 'Manufacturing' },
      { key: 'tech-maintenance', label: 'Maintenance' },
      { key: 'tech-engineering', label: 'Engineering' },
      { key: 'tech-ip-risk', label: 'IP Risk' },
    ]},
  ],
};
```

This way:
- Each module is a thin **route configuration** layer over shared views
- The shared views live in core, accessible to both
- Either module can deploy independently (shared views come with core)
- No code duplication

### 4.3 Module Registry Pattern

```javascript
// moduleRegistry.js
import dashboard from './modules/dashboard';
import executiveFocus from './modules/executive-focus';
import aiAgents from './modules/ai-agents';
import admin from './modules/admin';
import operations from './modules/operations';
import technology from './modules/technology';
import growth from './modules/growth';
import risk from './modules/risk';
import organization from './modules/organization';

const allModules = [
  dashboard, executiveFocus, aiAgents, admin,       // Phase 1
  operations,                                        // Phase 2
  technology,                                        // Phase 3
  growth,                                            // Phase 4
  risk,                                              // Phase 5
  organization,                                      // Phase 6
];

export const enabledModules = allModules.filter(m => m.enabled);
export const allRoutes = enabledModules.flatMap(m => m.routes);
export const navItems = enabledModules.flatMap(m => m.nav);
```

### 4.4 Slim App.jsx

The current 40KB+ `App.jsx` becomes a thin shell:

```javascript
// App.jsx (target: ~200 lines)
function App() {
  const { active } = useRouting();
  const { visibleModules } = usePermissions();

  const route = allRoutes.find(r => r.key === active);
  const RouteComponent = route?.component;
  const routeProps = route?.props || {};

  return (
    <AppShell nav={navItems} visibleModules={visibleModules}>
      <Suspense fallback={<Loading />}>
        {RouteComponent ? <RouteComponent {...routeProps} /> : <NotFound />}
      </Suspense>
    </AppShell>
  );
}
```

---

## 5. Phase 1 Scope — Detailed

### 5.1 What Ships

```
Phase 1 = Platform Core + Dashboard (lite) + Executive Focus (full) + AI Agents (full) + Admin (subset)
```

**Route Map (Phase 1):**

| Route Key | URL Path | View |
|-----------|----------|------|
| `dashboard` | `/dashboard` | DashboardView (alerts + objectives only) |
| `focus` | `/focus` | FocusTrackerView (both tabs) |
| `admin` | `/admin` | PlatformAdminView |
| `admin-ai-agents` | `/admin/ai-agents` | PlatformAdminView (AI & Agents) |
| `admin-users-security` | `/admin/users-security` | PlatformAdminView (Users) |
| `admin-platform-config` | `/admin/platform-config` | PlatformAdminView (Config) |
| `agent-{id}` | `/org/agent/{id}` | AgentDetailView |

**Navigation Sidebar (Phase 1):**
```
Dashboard
Executive Focus
Admin
  ├── AI & Agents
  ├── Users & Security
  └── Platform Config
```

Plus the global AI Agent FAB (floating action button, always visible).

### 5.2 What's Deferred

| Module | Phase | What It Adds |
|--------|-------|-------------|
| Operations | 2 | Site Map, plant KPIs, facility maintenance, HSE, logistics, projects |
| Technology | 3 | Manufacturing, machine maintenance, engineering (tech), IP Risk |
| Growth | 4 | Finance (P&L, performance), Development (pipeline, designer, data room) |
| Risk | 5 | 9 risk domains, workforce analytics, risk register, predictive |
| Organization | 6 | Org chart, CEO/COO/VP dashboards, role-based landing pages |

### 5.3 Phase 1 Module Details

#### Dashboard (Phase 1 — reduced scope)

**Included:**
- System alerts (Check Engine Lights) — sourced from focus health + objectives + AI agent health
- Company objectives — the 3 strategic objectives with progress and cross-dept intelligence

**NOT included (Phase 2):**
- Site operational performance (uptime, throughput, revenue, EBITDA)
- Construction pipeline widget

**Phase 1 Alert Sources:**
1. Executive Focus health alerts (new):
   - "3 executives have >50% task carryover this week"
   - "VP Finance has 4 overdue tasks (2+ days old)"
   - "Portfolio focus score dropped below 60%"
2. Company objective status changes:
   - "Series C objective progress stalled at 12%"
   - "Operational Excellence objective flagged yellow"
3. AI Agent system alerts:
   - "Claude API connection lost"
   - "Usage spike: 3x normal token consumption today"
   - Agent-raised strategic alerts (keep existing 10)

#### Executive Focus (Phase 1 — full scope, mission critical)

**All features ship.** This is the operational heartbeat.

**Key Workflows:**
1. **Weekly Planning** — Post weekly plan, tag tasks to objectives, import from action items
2. **Daily Focus** — Yesterday completion review + today's plan, toggle task status
3. **Portfolio Monitoring** — C-Suite and VP focus scores, objective alignment, velocity trends
4. **Task Management** — Inline edit, status cycling, completion tracking

**Critical Business Rule — Task Carryover:**
> Daily tasks should be completable within 24 hours. Carryover beyond 1 day is a signal:
> the executive is over-committed, too busy, bad at time management, or overestimates capacity.

**Required Phase 1 enhancements:**
1. **Task Age Indicator** — Visual badge showing days since task creation (1d, 2d, 3d+)
2. **Carryover Tracking** — Count consecutive days a task has been carried over
3. **Carryover Analytics per Executive:**
   - Average carryover rate (% of tasks that spill past 24h)
   - Carryover streak (longest run of days with carryover)
   - Carryover by objective (which objectives generate the most spillover)
4. **Health Score Impact** — Executive focus health should penalize high carryover rates
5. **AI Agent Insight** — When an exec consistently carries over tasks, the AI should flag it:
   - "Sarah has carried over 60% of tasks this week — consider reducing scope"
   - "VP Finance averages 2.3 days per task vs. target of 1 day"

#### AI Agents (Phase 1 — full scope)

**All capabilities ship:**
1. Ask AI Button — Global floating action button (always visible)
2. Manager Delegation Pattern — Lead agent consults specialists, synthesizes recommendations
3. Meeting AI Participation — Agents attend meetings, contribute insights, fact-check claims
4. System Alerts — Agents raise cross-departmental alerts
5. Agent Configuration — Customize agent skills, data sources, global behavior rules
6. Usage Tracking — Token consumption, cost monitoring, per-user/per-agent breakdown
7. 50+ Agent Directory — CEO team, COO team, 13 VP teams with specialized agents

#### Admin (Phase 1 — subset)

| Category | Phase 1 | Deferred |
|----------|---------|----------|
| Users & Security | User CRUD, roles, MFA, SSO config, password reset | — |
| AI & Agents | Agent config, global rules, usage dashboard | — |
| Platform Config | Landing pages, tags, bug reporting | IoT, integrations, API endpoints |
| IT & Infrastructure | — | Full IT dashboard (Phase 2) |
| Operations Admin | — | Operations admin tools (Phase 2) |

### 5.4 Data Layer Strategy

**Phase 1 data sources (all client-side for now):**
- Executive tasks → `focusData.js` (hardcoded, migrate to Supabase later)
- Weekly plans / Daily posts → `pulseData.js` (hardcoded, needs CRUD)
- Company objectives → `objectivesData.js` (hardcoded, eventually computed from live ops)
- Alerts → `alertData.js` (modified: focus health + objectives + AI alerts)
- Agent directory → `vpData.js` (hardcoded agent definitions)
- Meeting data → `meetingData.js` (hardcoded, migrate to Supabase later)
- User management → `userData.js` (localStorage, migrate to Supabase Auth later)

**Data abstraction pattern (introduce in Phase 1):**
```javascript
// src/core/data/repository.js
export function createRepository(config) {
  return {
    getAll: () => config.getData(),
    getById: (id) => config.getData().find(item => item.id === id),
    create: (item) => config.saveItem(item),
    update: (id, patch) => config.updateItem(id, patch),
    delete: (id) => config.deleteItem(id),
  };
}

// Phase 1 (localStorage):
const taskRepo = createRepository({
  getData: () => JSON.parse(localStorage.getItem('sens-tasks') || '[]'),
  saveItem: (task) => { /* localStorage */ },
});

// Future (Supabase — same interface):
const taskRepo = createRepository({
  getData: () => supabase.from('tasks').select('*'),
  saveItem: (task) => supabase.from('tasks').insert(task),
});
```

---

## 6. Phase 2–6 Roadmap

### Phase 2: Operations
**Module:** `operations/`
**Adds:** Site Map (PortfolioMapView), site plant KPIs, facility maintenance, HSE, logistics, construction projects, engineering (ops scope)
**Shared views activated:** DeliveringView + OperationsView (from `core/operational-views/`) with operations-specific props
**Data adds:** timeEngine.js (time-series site metrics)
**Dashboard expansion:** Site operational performance widget, KPI miss alerts (uptime < plan, revenue < target)
**Nav additions:**
```
Site Map
Operations
  ├── Projects
  ├── Engineering
  ├── Maintenance
  ├── Risk / HSE
  ├── Logistics
  └── Plant
```

### Phase 3: Technology
**Module:** `technology/`
**Adds:** Manufacturing (unit delivery tracking), machine maintenance, engineering (tech scope), IP Risk
**Shared views reused:** Same DeliveringView + OperationsView from core, with technology-specific props
**Dependency:** Requires Phase 2 (shared views and timeEngine already deployed)
**Nav additions:**
```
Technology
  ├── Manufacturing
  ├── Maintenance
  ├── Engineering
  └── IP Risk
```

**Note:** Operations and Technology could deploy together as a single phase if preferred, since they share the same underlying views and data engine. Splitting them just means Technology routes are disabled until Phase 3.

### Phase 4: Growth
**Module:** `growth/`
**Adds:** FinanceView (P&L, performance vs plan, marketing), DevelopmentView (pipeline, designer, team, data room)
**Data adds:** modelData.js (economic models), developmentData.js (development pipeline)
**Dashboard expansion:** Financial KPIs, portfolio economics
**Access control:** L3+ financial data restrictions enforced
**Nav additions:**
```
Growth
  ├── Finance & Strategy
  └── Development
```

### Phase 5: Risk & Compliance
**Module:** `risk/`
**Adds:** Risk landing, 7 risk domain detail pages, workforce analytics, risk zones/contractors/safety/register/predictive
**Data adds:** riskData.js
**Dashboard expansion:** Risk indicators, compliance alerts
**Integration:** Risk signals feed into executive focus priorities
**Nav additions:**
```
Risk
  ├── (Risk Landing)
  ├── Workforce
  ├── Process & Manufacturing
  ├── Project & Development
  ├── Offtake & Marketing
  ├── Site Security
  ├── IT & Data
  ├── Regulatory
  └── Supply Chain
```

### Phase 6: Organization Intelligence
**Module:** `organization/`
**Adds:** Org chart visualization, CEO/COO/VP executive dashboards (6 VPs), role-based landing pages
**Dashboard expansion:** Full VP-specific KPIs and team views
**Nav additions:**
```
Org Chart
  (+ CEO/COO/VP dashboards accessible from org chart)
```
**Final state:** Complete platform as it exists today, plus all accumulated improvements.

---

## 7. Implementation Strategy

### 7.1 Migration Approach: Strangler Fig

We don't rewrite from scratch. Instead:

1. **Create the new directory structure** alongside the existing code
2. **Move files one module at a time** into their new locations
3. **Update imports** as files move (Vite handles this seamlessly)
4. **Introduce the module registry** once the first module is extracted
5. **Extract App.jsx** into AppShell + registry-driven routing
6. **Disable deferred modules** via the registry (not by deleting code)
7. **Deploy Phase 1** once all Phase 1 modules are clean and tested

### 7.2 Implementation Order

```
Step  1: Create directory structure (core/, modules/)
Step  2: Extract core/ — move auth, permissions, theme, users, routing, UI
Step  3: Move shared operational views to core/operational-views/
Step  4: Extract modules/dashboard/ — move DashboardView + dependencies
Step  5: Extract modules/executive-focus/ — move FocusTrackerView + data
Step  6: Extract modules/ai-agents/ — move AgentChat, services, data
Step  7: Extract modules/admin/ — move PlatformAdminView, settings
Step  8: Build moduleRegistry.js + slim App.jsx
Step  9: Move remaining views into operations/, technology/, growth/, risk/, organization/
Step 10: Disable Phase 2–6 modules in registry (enabled: false)
Step 11: Build Phase 1 enhancements (carryover, alert engine, objectives)
Step 12: Test, verify, deploy
```

### 7.3 Estimated Effort

| Step | Effort | Risk |
|------|--------|------|
| Steps 1-3 (core extraction) | Medium | Low — mechanical refactoring |
| Steps 4-7 (Phase 1 modules) | Medium | Low — same pattern per module |
| Step 8 (module registry + App.jsx rewrite) | Medium | Medium — routing logic change |
| Step 9 (remaining modules) | Low | Low — same pattern |
| Step 10 (disable deferred) | Low | Low — registry flag |
| Step 11 (Phase 1 enhancements) | High | Medium — new features |
| Step 12 (test + deploy) | Medium | Medium — first production deploy |

---

## 8. Technical Decisions

### 8.1 Why NOT Separate Repos / Packages

The modules are **directory-level boundaries within a single app**, not separate npm packages. Reasons:
- Only 3 production dependencies — no package management overhead
- Single deployment target (static hosting)
- Shared theme, auth, permissions are tightly coupled by design
- Team is small — monorepo tooling not justified
- Vite's tree-shaking + lazy loading achieves the same deployment benefit

### 8.2 Why Shared Operational Views in Core

Technology and Operations both render `DeliveringView` and `OperationsView` with different props. Options considered:

| Option | Verdict |
|--------|---------|
| Duplicate views into each module | Rejected — code duplication, maintenance burden |
| Put in Operations, import from Technology | Rejected — creates deployment dependency |
| **Put in `core/operational-views/`** | **Chosen** — both modules deploy independently, no duplication |

### 8.3 Why NOT TypeScript (yet)

Converting 38,000 lines to TypeScript during a restructure adds too much risk.
- Phase 1: Ship in JavaScript
- Phase 2+: Introduce TypeScript incrementally (new files in TS, convert on touch)

### 8.4 Lazy Loading Strategy

Each module's views are lazy-loaded via `React.lazy()`. Benefits:
- Phase 1 bundle only includes Phase 1 code
- Disabled modules never load (not in the bundle if import is conditional)
- Faster initial page load

### 8.5 Environment Configuration

Introduce `.env` support for Phase 1:
```
VITE_API_URL=https://api.anthropic.com
VITE_APP_MODE=production    # or 'demo' for mock data
VITE_SUPABASE_URL=          # empty until Supabase added
VITE_SUPABASE_KEY=          # empty until Supabase added
```

### 8.6 CI/CD Recommendation

For Phase 1 deployment:
- GitHub Actions workflow: lint → build → test (Playwright) → deploy
- Deploy target: Vercel (zero-config for Vite apps) or Netlify
- Preview deployments on PR for testing

---

## 9. Risk & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Import breakage during file moves | Build fails | Move one module at a time, run build after each move |
| Circular dependencies surface | Runtime errors | Analyze import graph before moving; break cycles first |
| `vpData.js` is too large to split | AI Agents module bloated | Keep as-is for Phase 1; split by VP team in Phase 6 |
| Phase 1 alerts feel empty without ops data | Dashboard looks sparse | Design compelling focus-health + objective-progress alerts |
| Meeting feature depends on operational data | Meetings partially broken | Ensure meetingData.js is self-contained |
| Tech + Ops shared views cause confusion | Wrong props passed | Shared views in core, module manifests control props |
| Performance regression from lazy loading | Slower navigation | Route prefetching for adjacent modules |
| localStorage limits (5-10MB) | Data loss at scale | Acceptable for pilot; Supabase migration resolves later |

---

## 10. File-Level Migration Map

### Files → `core/`

| Current Path | New Path |
|-------------|----------|
| `contexts/AuthContext.jsx` | `core/auth/AuthContext.jsx` |
| `views/LoginView.jsx` | `core/auth/LoginView.jsx` |
| `data/authData.js` | `core/auth/authData.js` |
| `contexts/BadgeContext.jsx` | `core/users/BadgeContext.jsx` |
| `data/userData.js` | `core/users/userData.js` |
| `data/badgeData.js` | `core/users/badgeData.js` |
| `contexts/PermissionContext.jsx` | `core/permissions/PermissionContext.jsx` |
| `data/permissionData.js` | `core/permissions/permissionData.js` |
| `components/ui/PermissionGate.jsx` | `core/permissions/PermissionGate.jsx` |
| `contexts/ThemeContext.jsx` | `core/theme/ThemeContext.jsx` |
| `data/theme.js` | `core/theme/theme.js` |
| `contexts/SimDateContext.jsx` | `core/simulation/SimDateContext.jsx` |
| `hooks/useRouting.js` | `core/routing/useRouting.js` |
| `components/ui/layout.jsx` | `core/ui/layout.jsx` |
| `components/ui/indicators.jsx` | `core/ui/indicators.jsx` |
| `components/ui/charts.jsx` | `core/ui/charts.jsx` |
| `components/ui/site.jsx` | `core/ui/site.jsx` |
| `components/ui/index.js` | `core/ui/index.js` |
| `data/sites.js` | `core/data/sites.js` |

### Files → `core/operational-views/` (shared by Technology + Operations)

| Current Path | New Path |
|-------------|----------|
| `views/DeliveringView.jsx` | `core/operational-views/DeliveringView.jsx` |
| `views/OperationsView.jsx` | `core/operational-views/OperationsView.jsx` |

### Files → `modules/dashboard/`

| Current Path | New Path |
|-------------|----------|
| `views/DashboardView.jsx` | `modules/dashboard/DashboardView.jsx` |
| `components/ui/CheckEngineLightPanel.jsx` | `modules/dashboard/CheckEngineLightPanel.jsx` |
| `components/ui/ObjectiveCard.jsx` | `modules/dashboard/ObjectiveCard.jsx` |
| `data/alertData.js` | `modules/dashboard/alertData.js` |
| `data/objectivesData.js` | `modules/dashboard/objectivesData.js` |

### Files → `modules/executive-focus/`

| Current Path | New Path |
|-------------|----------|
| `views/FocusTrackerView.jsx` | `modules/executive-focus/FocusTrackerView.jsx` |
| `data/focusData.js` | `modules/executive-focus/focusData.js` |
| `data/pulseData.js` | `modules/executive-focus/pulseData.js` |

### Files → `modules/ai-agents/`

| Current Path | New Path |
|-------------|----------|
| `components/ui/AgentChat.jsx` | `modules/ai-agents/AgentChat.jsx` |
| `views/AgentDetailView.jsx` | `modules/ai-agents/AgentDetailView.jsx` |
| `views/MeetingView.jsx` | `modules/ai-agents/MeetingView.jsx` |
| `views/JournalView.jsx` | `modules/ai-agents/JournalView.jsx` |
| `contexts/AgentConfigContext.jsx` | `modules/ai-agents/AgentConfigContext.jsx` |
| `data/agentConfigStore.js` | `modules/ai-agents/agentConfigStore.js` |
| `data/vpData.js` | `modules/ai-agents/vpData.js` |
| `data/meetingData.js` | `modules/ai-agents/meetingData.js` |
| `services/claudeService.js` | `modules/ai-agents/services/claudeService.js` |
| `services/factCheckService.js` | `modules/ai-agents/services/factCheckService.js` |
| `services/usageTracker.js` | `modules/ai-agents/services/usageTracker.js` |

### Files → `modules/admin/`

| Current Path | New Path |
|-------------|----------|
| `views/PlatformAdminView.jsx` | `modules/admin/PlatformAdminView.jsx` |
| `components/ui/BugReportModal.jsx` | `modules/admin/BugReportModal.jsx` |
| `components/ui/BugFixPortal.jsx` | `modules/admin/BugFixPortal.jsx` |
| `data/landingPageData.js` | `modules/admin/landingPageData.js` |
| `data/roamService.js` | `modules/admin/roamService.js` |

### Files → `modules/operations/` (Phase 2)

| Current Path | New Path |
|-------------|----------|
| `views/PortfolioMapView.jsx` | `modules/operations/PortfolioMapView.jsx` |
| `views/SiteDetailView.jsx` | `modules/operations/SiteDetailView.jsx` |
| `data/timeEngine.js` | `modules/operations/timeEngine.js` |

Note: Routes in this module render `core/operational-views/DeliveringView` and `core/operational-views/OperationsView` with operations-specific props. No view duplication.

### Files → `modules/technology/` (Phase 3)

No unique view files — this module is purely a route manifest that renders `core/operational-views/` with technology-specific props.

### Files → `modules/growth/` (Phase 4)

| Current Path | New Path |
|-------------|----------|
| `views/FinanceView.jsx` | `modules/growth/FinanceView.jsx` |
| `views/DevelopmentView.jsx` | `modules/growth/DevelopmentView.jsx` |
| `data/modelData.js` | `modules/growth/modelData.js` |
| `data/developmentData.js` | `modules/growth/developmentData.js` |

### Files → `modules/risk/` (Phase 5)

| Current Path | New Path |
|-------------|----------|
| `views/RiskView.jsx` | `modules/risk/RiskView.jsx` |
| `views/RiskLandingView.jsx` | `modules/risk/RiskLandingView.jsx` |
| `views/RiskDomainDetailView.jsx` | `modules/risk/RiskDomainDetailView.jsx` |
| `views/WorkforceView.jsx` | `modules/risk/WorkforceView.jsx` |
| `data/riskData.js` | `modules/risk/riskData.js` |

### Files → `modules/organization/` (Phase 6)

| Current Path | New Path |
|-------------|----------|
| `views/OrgChartView.jsx` | `modules/organization/OrgChartView.jsx` |
| `views/VpDashboardView.jsx` | `modules/organization/VpDashboardView.jsx` |
| `views/GenericLandingView.jsx` | `modules/organization/GenericLandingView.jsx` |

---

## Appendix A: Current Codebase Statistics

- **Total source files:** 69
- **Total lines of code:** ~37,865
- **Largest files:**
  - `App.jsx` — ~40,000+ characters (needs decomposition)
  - `FocusTrackerView.jsx` — 2,406 lines
  - `MeetingView.jsx` — 1,400+ lines
  - `vpData.js` — 1,311 lines
  - `AgentChat.jsx` — 924 lines
  - `meetingData.js` — 778 lines
- **Production dependencies:** 3 (react, react-dom, recharts)
- **Build output:** 1.5 MB single bundle

## Appendix B: localStorage Key Registry

| Key | Module Owner | Description |
|-----|-------------|-------------|
| `sens-auth-session` | core/auth | Authentication session |
| `sens-users` | core/users | User directory |
| `sens-audit-log` | core/users | User action audit trail |
| `sens-badge-config` | core/users | Clearance & role config |
| `sens-permission-config` | core/permissions | Module permissions |
| `sens-theme` | core/theme | Dark/light mode |
| `sens-landing-config` | admin | Landing page customization |
| `sens_agent_overrides` | ai-agents | Agent skill/datasource overrides |
| `sens_global_rules` | ai-agents | Agent behavior rules |
| `sens-layout` | dashboard | Dashboard widget layout |
| `sens-*-kpis` | various | KPI card positions per view |
| `sens-usage-*` | ai-agents | API usage stats by date |
| `sens-focus-*` | executive-focus | Focus tracker layout |

## Appendix C: Permission Matrix (Phase 1 modules)

| Module | View | Edit | Delete | Export | Configure |
|--------|------|------|--------|--------|-----------|
| dashboard | L1 (all) | — | — | L3 (C-suite) | L4 (CEO/COO) |
| focus | L1 (all) | L1 (own tasks) | L2 (own tasks) | L3 (C-suite) | L4 (CEO/COO) |
| ai-agents | L1 (all) | L3 (config) | — | L3 | L4 (CEO/COO) |
| admin | L3 (C-suite) | L4 (CEO/COO) | L5 (CEO) | L4 | L5 (CEO) |
| users | L3 (CEO/COO) | L4 (CEO/COO) | L5 (CEO) | — | L5 (CEO) |

## Appendix D: Full Module × Phase Matrix

| Module | Phase | Routes | Unique Views | Shared Views | Data Files |
|--------|-------|--------|-------------|-------------|-----------|
| Platform Core | 1 | — | LoginView | — | 8 (auth, users, permissions, theme, sim, routing, UI, sites) |
| Dashboard | 1 | 1 | DashboardView | — | 2 (alertData, objectivesData) |
| Executive Focus | 1 | 1 | FocusTrackerView | — | 2 (focusData, pulseData) |
| AI Agents | 1 | 1+ | AgentChat, AgentDetail, Meeting, Journal | — | 5 (vpData, meetingData, agentConfig, 3 services) |
| Admin | 1 | 3 | PlatformAdminView, Bug* | — | 2 (landingPageData, roamService) |
| Operations | 2 | 8 | PortfolioMapView, SiteDetail | DeliveringView, OperationsView | 1 (timeEngine) |
| Technology | 3 | 5 | — | DeliveringView, OperationsView | — |
| Growth | 4 | 2 | FinanceView, DevelopmentView | — | 2 (modelData, developmentData) |
| Risk | 5 | 14 | RiskView, RiskLanding, RiskDomain, Workforce | — | 1 (riskData) |
| Organization | 6 | 9+ | OrgChart, VpDashboard, GenericLanding | — | — |
