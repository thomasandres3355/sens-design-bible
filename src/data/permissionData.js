import { getRoleClearance } from "./badgeData";

/* ═══════════════════════════════════════════════════════════════════
   Permission Data — Module-level access control matrix

   Each module has actions (view, edit, delete, export, configure, special)
   with minimum clearance levels and allowed roles.

   checkModulePermission(user, module, action) → { allowed, reason }
   ═══════════════════════════════════════════════════════════════════ */

const STORAGE_KEY = "sens-permission-config";

// ── Default permission matrix ──
const DEFAULT_MODULE_PERMISSIONS = {
  dashboard: {
    view:      { level: 1, roles: [] },
    export:    { level: 2, roles: [] },
    configure: { level: 4, roles: ["CEO", "COO"] },
  },
  focus: {
    view:      { level: 3, roles: ["CEO", "COO", "VP Engineering", "VP Operations", "VP Finance", "VP Strategy", "VP People", "VP Risk"] },
    edit:      { level: 3, roles: ["CEO", "COO"] },
    export:    { level: 3, roles: ["CEO", "COO"] },
    configure: { level: 5, roles: ["CEO", "COO"] },
    journal:   { level: 4, roles: ["CEO", "COO", "VP Engineering", "VP Operations", "VP Finance", "VP Strategy", "VP People", "VP Risk"] },
    pulse:     { level: 3, roles: ["CEO", "COO", "VP Engineering", "VP Operations", "VP Finance", "VP Strategy", "VP People", "VP Risk"] },
  },
  sitemap: {
    view:      { level: 1, roles: [] },
    export:    { level: 2, roles: [] },
  },
  development: {
    view:      { level: 2, roles: ["CEO", "COO", "VP Engineering", "VP Strategy"] },
    edit:      { level: 3, roles: ["CEO", "COO", "VP Engineering"] },
    delete:    { level: 3, roles: ["CEO", "COO", "VP Engineering"] },
    export:    { level: 3, roles: [] },
    configure: { level: 3, roles: ["CEO", "COO", "VP Engineering"] },
    designer:  { level: 3, roles: ["CEO", "COO", "VP Engineering"] },
    modeling:  { level: 3, roles: ["CEO", "COO", "VP Finance", "VP Strategy"] },
  },
  delivering: {
    view:      { level: 2, roles: ["CEO", "COO", "VP Engineering", "VP Operations"] },
    edit:      { level: 3, roles: ["VP Engineering", "CEO", "COO"] },
    export:    { level: 3, roles: [] },
    configure: { level: 3, roles: ["VP Engineering", "CEO"] },
  },
  operations: {
    view:      { level: 1, roles: [] },
    viewDetail:{ level: 2, roles: [] },
    edit:      { level: 2, roles: ["VP Operations", "Manager", "Operator", "CEO", "COO"] },
    export:    { level: 2, roles: ["CEO", "COO", "VP Operations"] },
    configure: { level: 3, roles: ["VP Operations", "CEO", "COO"] },
  },
  finance: {
    view:      { level: 3, roles: ["CEO", "COO", "VP Finance", "VP Strategy"] },
    edit:      { level: 3, roles: ["VP Finance", "CEO", "COO"] },
    export:    { level: 4, roles: ["CEO", "COO", "VP Finance"] },
    configure: { level: 4, roles: ["CEO", "COO", "VP Finance"] },
    investor:  { level: 4, roles: ["CEO", "COO", "VP Finance", "VP Strategy"] },
    board:     { level: 5, roles: ["CEO", "COO"] },
  },
  technology: {
    view:      { level: 1, roles: [] },
    configure: { level: 3, roles: ["CEO", "COO", "VP Operations"] },
  },
  ops: {
    view:      { level: 2, roles: ["CEO", "COO", "VP Engineering", "VP Operations"] },
    configure: { level: 3, roles: ["CEO", "COO", "VP Engineering"] },
  },
  growth: {
    view:      { level: 2, roles: ["CEO", "COO", "VP Engineering", "VP Strategy", "VP Finance"] },
    configure: { level: 3, roles: ["CEO", "COO", "VP Finance", "VP Strategy"] },
  },
  admin: {
    view:      { level: 3, roles: ["CEO", "COO"] },
    edit:      { level: 4, roles: ["CEO", "COO"] },
    configure: { level: 5, roles: ["CEO", "COO"] },
    it:        { level: 3, roles: ["CEO", "COO"] },
    ai:        { level: 3, roles: ["CEO", "COO"] },
  },
  workforce: {
    view:      { level: 2, roles: ["CEO", "COO", "VP People", "VP Operations", "VP Risk", "Manager"] },
    edit:      { level: 3, roles: ["VP People", "VP Risk", "CEO", "COO"] },
    export:    { level: 4, roles: ["CEO", "COO", "VP People", "VP Risk"] },
    configure: { level: 3, roles: [] },
    compensation: { level: 4, roles: ["CEO", "COO", "VP People", "VP Finance"] },
    hrRecords: { level: 4, roles: ["CEO", "COO", "VP People"] },
  },
  risk: {
    view:      { level: 2, roles: ["CEO", "COO", "VP Risk", "VP Operations", "VP Engineering"] },
    edit:      { level: 2, roles: ["VP Risk", "CEO", "COO"] },
    export:    { level: 3, roles: ["CEO", "COO", "VP Risk"] },
    configure: { level: 3, roles: ["VP Risk", "CEO", "COO"] },
  },
  org: {
    view:      { level: 1, roles: [] },
    edit:      { level: 4, roles: ["CEO", "COO", "VP People"] },
    vpDashboard: { level: 2, roles: ["CEO", "COO", "VP Engineering", "VP Operations", "VP Finance", "VP Strategy", "VP People", "VP Risk"] },
    agentDetail: { level: 2, roles: ["CEO", "COO", "VP Engineering", "VP Operations", "VP Finance", "VP Strategy", "VP People", "VP Risk"] },
  },
  settings: {
    view:      { level: 2, roles: ["CEO", "COO", "Manager", "VP Engineering", "VP Operations", "VP Finance", "VP Strategy", "VP People", "VP Risk"] },
    edit:      { level: 3, roles: ["CEO", "COO"] },
    configure: { level: 4, roles: ["CEO", "COO"] },
    apiKeys:   { level: 5, roles: ["CEO", "COO"] },
    integrations: { level: 4, roles: ["CEO", "COO"] },
    userMgmt:  { level: 4, roles: ["CEO", "COO"] },
    iot:       { level: 3, roles: ["CEO", "COO", "VP Operations", "VP Engineering"] },
    permissions: { level: 4, roles: ["CEO", "COO"] },
    landingPages: { level: 4, roles: ["CEO", "COO"] },
  },
};

// ── Default VP/Exec Dashboard Access ──
const DEFAULT_VP_DASHBOARD_ACCESS = {
  "ceo-dashboard":   { level: 4, roles: ["CEO", "COO"] },
  "coo-dashboard":   { level: 3, roles: ["CEO", "COO"] },
  "vp-engineering":  { level: 2, roles: ["CEO", "COO", "VP Engineering"] },
  "vp-operations":   { level: 2, roles: ["CEO", "COO", "VP Operations"] },
  "vp-finance":      { level: 2, roles: ["CEO", "COO", "VP Finance"] },
  "vp-strategy":     { level: 2, roles: ["CEO", "COO", "VP Strategy"] },
  "vp-people":       { level: 2, roles: ["CEO", "COO", "VP People"] },
  "vp-risk":         { level: 2, roles: ["CEO", "COO", "VP Risk"] },
};

// ═══ MUTABLE EXPORTS (deep-cloned from defaults, mutated in-place) ═══════

function clonePerms(perms) {
  const out = {};
  for (const mod of Object.keys(perms)) {
    out[mod] = {};
    for (const action of Object.keys(perms[mod])) {
      out[mod][action] = { level: perms[mod][action].level, roles: [...perms[mod][action].roles] };
    }
  }
  return out;
}

function cloneVpAccess(vp) {
  const out = {};
  for (const key of Object.keys(vp)) {
    out[key] = { level: vp[key].level, roles: [...vp[key].roles] };
  }
  return out;
}

export const MODULE_PERMISSIONS = clonePerms(DEFAULT_MODULE_PERMISSIONS);
export const VP_DASHBOARD_ACCESS = cloneVpAccess(DEFAULT_VP_DASHBOARD_ACCESS);

// ═══ PERSISTENCE ═════════════════════════════════════════════════════════

export function loadPermissionConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const saved = JSON.parse(raw);

    if (saved.modulePermissions) {
      // Replace contents in-place
      for (const mod of Object.keys(MODULE_PERMISSIONS)) delete MODULE_PERMISSIONS[mod];
      for (const mod of Object.keys(saved.modulePermissions)) {
        MODULE_PERMISSIONS[mod] = {};
        for (const action of Object.keys(saved.modulePermissions[mod])) {
          const p = saved.modulePermissions[mod][action];
          MODULE_PERMISSIONS[mod][action] = { level: p.level, roles: [...(p.roles || [])] };
        }
      }
    }
    if (saved.vpDashboardAccess) {
      for (const key of Object.keys(VP_DASHBOARD_ACCESS)) delete VP_DASHBOARD_ACCESS[key];
      for (const key of Object.keys(saved.vpDashboardAccess)) {
        const p = saved.vpDashboardAccess[key];
        VP_DASHBOARD_ACCESS[key] = { level: p.level, roles: [...(p.roles || [])] };
      }
    }
    // Recalculate MODULE_KEYS
    MODULE_KEYS.splice(0, MODULE_KEYS.length, ...Object.keys(MODULE_PERMISSIONS));
    return true;
  } catch {
    return false;
  }
}

export function savePermissionConfig() {
  const data = {
    modulePermissions: MODULE_PERMISSIONS,
    vpDashboardAccess: VP_DASHBOARD_ACCESS,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function resetPermissionConfig() {
  localStorage.removeItem(STORAGE_KEY);
  // Restore MODULE_PERMISSIONS in-place
  for (const mod of Object.keys(MODULE_PERMISSIONS)) delete MODULE_PERMISSIONS[mod];
  const fresh = clonePerms(DEFAULT_MODULE_PERMISSIONS);
  for (const mod of Object.keys(fresh)) MODULE_PERMISSIONS[mod] = fresh[mod];
  // Restore VP_DASHBOARD_ACCESS in-place
  for (const key of Object.keys(VP_DASHBOARD_ACCESS)) delete VP_DASHBOARD_ACCESS[key];
  const freshVp = cloneVpAccess(DEFAULT_VP_DASHBOARD_ACCESS);
  for (const key of Object.keys(freshVp)) VP_DASHBOARD_ACCESS[key] = freshVp[key];
  // Recalculate MODULE_KEYS
  MODULE_KEYS.splice(0, MODULE_KEYS.length, ...Object.keys(MODULE_PERMISSIONS));
}

export function isPermissionConfigDirty() {
  return localStorage.getItem(STORAGE_KEY) !== null;
}

// ── All module keys (for iteration, mutable array) ──
export const MODULE_KEYS = Object.keys(MODULE_PERMISSIONS);

// Load saved config on module init
loadPermissionConfig();

// ── Module display info ──
export const MODULE_LABELS = {
  dashboard: "Dashboard",
  focus: "Executive Focus",
  sitemap: "Site Map",
  technology: "Technology",
  ops: "Operations",
  growth: "Growth",
  development: "Development",
  delivering: "Engineering & Projects",
  operations: "Plant Operations",
  "tech-manufacturing": "Manufacturing",
  "tech-maintenance": "Maintenance (Machines)",
  "tech-engineering": "Engineering (R&D)",
  "tech-ip-risk": "IP Risk",
  "ops-projects": "Projects",
  "ops-engineering": "Engineering (Projects)",
  "ops-maintenance": "Maintenance (Facilities)",
  "ops-risk": "Risk",
  "ops-logistics": "Logistics",
  "ops-plant": "Plant Operations",
  finance: "Finance & Strategy",
  admin: "Platform",
  workforce: "Workforce",
  risk: "Risk",
  "risk-workforce": "Workforce Risk",
  "risk-zones": "Site Zones",
  "risk-contractors": "Contractor Intel",
  "risk-safety": "Safety & Compliance",
  "risk-register": "Risk Register",
  "risk-predictive": "Predictive Analytics",
  "risk-process-mfg": "Process & Mfg Risk",
  "risk-project-dev": "Project Dev Risk",
  "risk-offtake-mktg": "Offtake & Mktg Risk",
  "risk-site-security": "Site Security Risk",
  "risk-it-data": "IT & Data Risk",
  "risk-regulatory": "Regulatory Risk",
  "risk-supply-chain": "Supply Chain Risk",
  "admin-it-infra": "IT & Infrastructure",
  "admin-ai-agents": "AI & Agents",
  "admin-users-security": "Users & Security",
  "admin-platform-config": "Platform Config",
  "admin-bug-fixes": "Bug Fixes",
  org: "Org Chart",
  settings: "Settings",
};

// ── Action labels ──
export const ACTION_LABELS = {
  view: "View",
  viewDetail: "View Detail",
  edit: "Edit / Create",
  delete: "Delete",
  export: "Export",
  configure: "Configure",
};


/**
 * Check if a user has permission for a specific module action.
 * @param {object} user — user object with { role, department, overrides }
 * @param {string} module — module key from MODULE_PERMISSIONS
 * @param {string} action — action key (view, edit, delete, export, configure, or special actions)
 * @returns {{ allowed: boolean, reason: string }}
 */
export function checkModulePermission(user, module, action) {
  const modulePerms = MODULE_PERMISSIONS[module];
  if (!modulePerms) return { allowed: false, reason: `Unknown module: ${module}` };

  const actionPerm = modulePerms[action];
  if (!actionPerm) return { allowed: false, reason: `No ${action} action defined for ${module}` };

  const roleClearance = getRoleClearance(user.role);

  // Check clearance level
  if (roleClearance.level < actionPerm.level) {
    return { allowed: false, reason: `Requires L${actionPerm.level}, you have L${roleClearance.level}` };
  }

  // Check role restriction (if roles array is empty, any role at that level is allowed)
  if (actionPerm.roles.length > 0 && !actionPerm.roles.includes(user.role)) {
    return { allowed: false, reason: `Restricted to ${actionPerm.roles.join(", ")}` };
  }

  return { allowed: true, reason: `${user.role} L${roleClearance.level} — authorized` };
}

/**
 * Check if a user can access a VP/Exec dashboard.
 */
export function checkVpAccess(user, vpKey) {
  const vpPerm = VP_DASHBOARD_ACCESS[vpKey];
  if (!vpPerm) return { allowed: true, reason: "No restriction" }; // Unknown VP keys are allowed

  const roleClearance = getRoleClearance(user.role);
  if (roleClearance.level < vpPerm.level) {
    return { allowed: false, reason: `Requires L${vpPerm.level}` };
  }
  if (vpPerm.roles.length > 0 && !vpPerm.roles.includes(user.role)) {
    return { allowed: false, reason: `Restricted to ${vpPerm.roles.join(", ")}` };
  }
  return { allowed: true, reason: `${user.role} — authorized` };
}

/**
 * Get all modules a user can view.
 */
export function getVisibleModules(user) {
  return MODULE_KEYS.filter((mod) => checkModulePermission(user, mod, "view").allowed);
}

/**
 * Get all actions a user can perform on a module.
 */
export function getModuleActions(user, module) {
  const modulePerms = MODULE_PERMISSIONS[module];
  if (!modulePerms) return [];
  return Object.keys(modulePerms).filter((action) => checkModulePermission(user, module, action).allowed);
}
