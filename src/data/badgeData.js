import { T } from "./theme";

const STORAGE_KEY = "sens-badge-config";

// ═══ DEFAULT CLEARANCE LEVELS ════════════════════════════════════════════
const DEFAULT_CLEARANCE_LEVELS = [
  { level: 1, label: "L1 — Public", short: "L1", color: T.textMid, description: "Company-wide dashboards, general KPIs, public alerts" },
  { level: 2, label: "L2 — Internal", short: "L2", color: T.blue, description: "Site operations, maintenance logs, logistics data" },
  { level: 3, label: "L3 — Confidential", short: "L3", color: T.green, description: "Financial details, project budgets, legal contracts, engineering IP" },
  { level: 4, label: "L4 — Restricted", short: "L4", color: T.warn, description: "Compensation, HR records, investor pipeline details" },
  { level: 5, label: "L5 — Executive Only", short: "L5", color: T.danger, description: "Board materials, M&A strategy, strategic negotiations" },
];

// ═══ DEFAULT DATA DOMAIN CLASSIFICATIONS ═════════════════════════════════
const DEFAULT_DATA_CLASSIFICATIONS = [
  { domain: "site_kpis", label: "Site KPIs (Public)", level: 1, departments: ["all"], description: "Uptime, throughput, general performance metrics" },
  { domain: "alerts", label: "Alerts & Notifications", level: 1, departments: ["all"], description: "System alerts and check engine lights" },
  { domain: "site_operations", label: "Site Operations Detail", level: 2, departments: ["operations", "engineering", "maintenance"], description: "Detailed operational data, shift logs, work orders" },
  { domain: "maintenance_details", label: "Maintenance Records", level: 2, departments: ["operations", "maintenance", "engineering"], description: "Work orders, predictive maintenance, equipment history" },
  { domain: "logistics", label: "Logistics & Supply Chain", level: 2, departments: ["operations", "logistics"], description: "Feedstock supply, inventory, transport" },
  { domain: "risk_register", label: "Risk Register", level: 2, departments: ["risk", "operations"], description: "Risk items, mitigation plans, incident reports" },
  { domain: "meeting_notes", label: "Meeting Notes", level: 2, departments: ["all"], description: "General meeting summaries and action items" },
  { domain: "financial_summary", label: "Financial Summary", level: 2, departments: ["finance"], description: "High-level revenue, EBITDA, budget status" },
  { domain: "financial_detail", label: "Financial Detail", level: 3, departments: ["finance"], description: "P&L by site, cost breakdowns, cash position" },
  { domain: "project_budgets", label: "Project Budgets", level: 3, departments: ["finance", "engineering", "project"], description: "Capex budgets, variance analysis, contractor costs" },
  { domain: "legal_contracts", label: "Legal & Contracts", level: 3, departments: ["legal"], description: "Contracts, term sheets, legal agreements" },
  { domain: "engineering_ip", label: "Engineering IP", level: 3, departments: ["engineering"], description: "Patents, reactor designs, proprietary processes" },
  { domain: "executive_tasks", label: "Executive Task Details", level: 3, departments: ["all"], description: "Individual exec task assignments and progress" },
  { domain: "compensation", label: "Compensation Data", level: 4, departments: ["people", "finance"], description: "Salaries, bonuses, equity grants" },
  { domain: "hr_records", label: "HR Records", level: 4, departments: ["people"], description: "Performance reviews, disciplinary records, personal data" },
  { domain: "investor_pipeline", label: "Investor Pipeline", level: 4, departments: ["strategy", "finance"], description: "Series C details, investor commitments, term negotiations" },
  { domain: "meeting_private", label: "Private Meeting Notes", level: 4, departments: ["all"], description: "CEO private notes, confidential discussions" },
  { domain: "board_materials", label: "Board Materials", level: 5, departments: ["all"], description: "Board decks, resolutions, governance documents" },
  { domain: "mna_strategy", label: "M&A Strategy", level: 5, departments: ["strategy"], description: "Acquisition targets, strategic planning, deal terms" },
  { domain: "strategic_negotiations", label: "Strategic Negotiations", level: 5, departments: ["all"], description: "Active negotiation details, partnership terms" },
  { domain: "vp_landing_access", label: "VP Landing Page Access", level: 5, departments: ["all"], description: "Navigate to VP and executive landing pages from org chart" },
];

// ═══ DEFAULT ROLE → CLEARANCE MAPPING ════════════════════════════════════
const DEFAULT_ROLE_CLEARANCE = [
  { role: "CEO", level: 5, scope: "all", departments: ["all"], label: "Full Access — All Departments" },
  { role: "COO", level: 4, scope: "all-operational", departments: ["operations", "engineering", "maintenance", "logistics", "project", "risk", "people"], label: "Operational Access — All Branches" },
  { role: "VP Engineering", level: 3, scope: "department", departments: ["engineering"], crossDeptLevel: 2, label: "Engineering + Cross-Dept Read" },
  { role: "VP Operations", level: 3, scope: "department", departments: ["operations", "maintenance"], crossDeptLevel: 2, label: "Operations + Cross-Dept Read" },
  { role: "VP Finance", level: 3, scope: "department+financial", departments: ["finance"], crossDeptLevel: 2, financialAccess: true, label: "Finance + Financial Data Across" },
  { role: "VP Strategy", level: 3, scope: "department", departments: ["strategy"], crossDeptLevel: 2, label: "Strategy + Cross-Dept Read" },
  { role: "VP People", level: 4, scope: "department", departments: ["people"], crossDeptLevel: 2, label: "HR/People (L4 own dept) + Cross-Dept Read" },
  { role: "VP Risk", level: 3, scope: "department", departments: ["risk", "people"], crossDeptLevel: 2, label: "Risk + Workforce + Cross-Dept Read" },
  { role: "Manager", level: 2, scope: "department", departments: [], crossDeptLevel: 1, label: "Own Department Only" },
  { role: "Operator", level: 1, scope: "site", departments: [], crossDeptLevel: 1, label: "Assigned Site Only" },
  { role: "Viewer", level: 1, scope: "readonly", departments: [], crossDeptLevel: 1, label: "Read-Only Assigned Tabs" },
];

// ═══ MUTABLE EXPORTS (mutated in-place so all function refs see updates) ═
export const CLEARANCE_LEVELS = [...DEFAULT_CLEARANCE_LEVELS.map((c) => ({ ...c }))];
export const DATA_CLASSIFICATIONS = [...DEFAULT_DATA_CLASSIFICATIONS.map((c) => ({ ...c, departments: [...c.departments] }))];
export const ROLE_CLEARANCE = [...DEFAULT_ROLE_CLEARANCE.map((r) => ({ ...r, departments: [...r.departments] }))];

// ═══ PERSISTENCE ═════════════════════════════════════════════════════════

export function loadBadgeConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const saved = JSON.parse(raw);

    if (saved.clearanceLevels) {
      CLEARANCE_LEVELS.splice(0, CLEARANCE_LEVELS.length, ...saved.clearanceLevels.map((c) => {
        const def = DEFAULT_CLEARANCE_LEVELS.find((d) => d.level === c.level);
        return { ...def, ...c, color: def?.color || T.textMid };
      }));
    }
    if (saved.roleClearance) {
      ROLE_CLEARANCE.splice(0, ROLE_CLEARANCE.length, ...saved.roleClearance.map((r) => ({
        ...r, departments: r.departments || [],
      })));
    }
    if (saved.dataClassifications) {
      DATA_CLASSIFICATIONS.splice(0, DATA_CLASSIFICATIONS.length, ...saved.dataClassifications.map((c) => ({
        ...c, departments: c.departments || [],
      })));
    }
    return true;
  } catch {
    return false;
  }
}

export function saveBadgeConfig() {
  const data = {
    clearanceLevels: CLEARANCE_LEVELS.map(({ level, label, short, description }) => ({ level, label, short, description })),
    roleClearance: ROLE_CLEARANCE.map(({ role, level, scope, departments, crossDeptLevel, financialAccess, label }) => ({
      role, level, scope, departments, crossDeptLevel, financialAccess, label,
    })),
    dataClassifications: DATA_CLASSIFICATIONS.map(({ domain, label, level, departments, description }) => ({
      domain, label, level, departments, description,
    })),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function resetBadgeConfig() {
  localStorage.removeItem(STORAGE_KEY);
  CLEARANCE_LEVELS.splice(0, CLEARANCE_LEVELS.length, ...DEFAULT_CLEARANCE_LEVELS.map((c) => ({ ...c })));
  ROLE_CLEARANCE.splice(0, ROLE_CLEARANCE.length, ...DEFAULT_ROLE_CLEARANCE.map((r) => ({ ...r, departments: [...r.departments] })));
  DATA_CLASSIFICATIONS.splice(0, DATA_CLASSIFICATIONS.length, ...DEFAULT_DATA_CLASSIFICATIONS.map((c) => ({ ...c, departments: [...c.departments] })));
}

export function isBadgeConfigDirty() {
  return localStorage.getItem(STORAGE_KEY) !== null;
}

// Load saved config on module init
loadBadgeConfig();

// ═══ LOOKUPS ═════════════════════════════════════════════════════════════

export const getClearanceLabel = (level) => CLEARANCE_LEVELS.find((c) => c.level === level) || CLEARANCE_LEVELS[0];
export const getClassification = (domain) => DATA_CLASSIFICATIONS.find((c) => c.domain === domain);
export const getRoleClearance = (role) => ROLE_CLEARANCE.find((r) => r.role === role) || ROLE_CLEARANCE[ROLE_CLEARANCE.length - 1];

// ═══ USERS (for pilot testing) ═══════════════════════════════════════════
export const BADGE_USERS = [
  { id: "thomas", name: "Thomas", role: "CEO", department: "Executive", email: "thomas@systemicenvs.com", overrides: [] },
  { id: "sarah", name: "Sarah Mitchell", role: "COO", department: "Executive", email: "sarah@systemicenvs.com", overrides: [] },
  { id: "james", name: "James Park", role: "VP Finance", department: "Finance", email: "james@systemicenvs.com", overrides: [] },
  { id: "lena", name: "Lena Torres", role: "VP Engineering", department: "Engineering", email: "lena@systemicenvs.com", overrides: [] },
  { id: "marcus", name: "Marcus Webb", role: "VP Operations", department: "Operations", email: "marcus@systemicenvs.com", overrides: [] },
  { id: "diane", name: "Diane Chen", role: "VP Finance", department: "Finance", email: "diane@systemicenvs.com", overrides: [] },
  { id: "omar", name: "Omar Hassan", role: "VP Strategy", department: "Strategy", email: "omar@systemicenvs.com", overrides: [] },
  { id: "rachel", name: "Rachel Kim", role: "VP Risk", department: "Risk", email: "rachel@systemicenvs.com", overrides: [] },
  { id: "demo-mgr", name: "Demo Manager", role: "Manager", department: "Operations", email: "demo.mgr@systemicenvs.com", overrides: [] },
  { id: "demo-op", name: "Demo Operator", role: "Operator", department: "Operations", email: "demo.op@systemicenvs.com", overrides: [] },
];

// ═══ ACCESS CHECK ENGINE ═════════════════════════════════════════════════

/**
 * Check if a user can access a specific data domain
 * @param {object} user — user object from BADGE_USERS
 * @param {string} domain — domain key from DATA_CLASSIFICATIONS
 * @returns {{ allowed: boolean, reason: string }}
 */
export function checkAccess(user, domain) {
  const classification = getClassification(domain);
  if (!classification) return { allowed: false, reason: "Unknown data domain" };

  const roleClearance = getRoleClearance(user.role);

  // Check overrides first (explicit grant/revoke)
  const override = (user.overrides || []).find((o) => o.domain === domain);
  if (override) {
    return override.granted
      ? { allowed: true, reason: `Granted by override` }
      : { allowed: false, reason: `Revoked by override` };
  }

  // CEO/COO — broad access
  if (roleClearance.scope === "all") {
    return { allowed: true, reason: `${user.role} has full access (L${roleClearance.level})` };
  }

  if (roleClearance.scope === "all-operational") {
    if (classification.level <= roleClearance.level) {
      return { allowed: true, reason: `${user.role} operational access (L${roleClearance.level})` };
    }
    return { allowed: false, reason: `Requires L${classification.level}, ${user.role} has L${roleClearance.level}` };
  }

  // Department-scoped roles
  const userDepts = roleClearance.departments;
  const dataDepts = classification.departments;
  const isOwnDept = dataDepts.includes("all") || userDepts.some((d) => dataDepts.includes(d));

  if (isOwnDept && classification.level <= roleClearance.level) {
    return { allowed: true, reason: `Own department access (L${roleClearance.level})` };
  }

  // VP Finance special: financial data across all departments
  if (roleClearance.financialAccess && ["financial_summary", "financial_detail", "project_budgets"].includes(domain)) {
    if (classification.level <= roleClearance.level) {
      return { allowed: true, reason: `Financial access across departments` };
    }
  }

  // Cross-department fallback
  const crossLevel = roleClearance.crossDeptLevel || 1;
  if (!isOwnDept && classification.level <= crossLevel) {
    return { allowed: true, reason: `Cross-department read (L${crossLevel})` };
  }

  return {
    allowed: false,
    reason: `Requires L${classification.level} ${isOwnDept ? "" : `in ${dataDepts.join("/")}`}, ${user.role} has L${isOwnDept ? roleClearance.level : crossLevel}`,
  };
}

/**
 * Get all accessible domains for a user
 */
export function getAccessibleDomains(user) {
  return DATA_CLASSIFICATIONS.filter((c) => checkAccess(user, c.domain).allowed).map((c) => c.domain);
}

/**
 * Get badge display info for a user
 */
export function getUserBadge(user) {
  const roleClearance = getRoleClearance(user.role);
  const levelInfo = getClearanceLabel(roleClearance.level);
  return {
    user,
    level: roleClearance.level,
    label: levelInfo.short,
    fullLabel: levelInfo.label,
    color: levelInfo.color,
    scope: roleClearance.label,
    accessibleDomains: getAccessibleDomains(user),
  };
}
