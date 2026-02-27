import { T } from "./theme";

/* ═══════════════════════════════════════════════════════════════════
   Landing Page Data — Role-to-landing-page mapping + page overrides

   Each user can have a `landingPage` field that maps to a VP registry
   key (e.g. "vp-finance"), an exec key ("ceo", "coo"), or a generic
   key ("manager", "operator", "viewer", "dashboard").

   Overrides allow customizing what appears on each landing page
   (toggle objectives, custom focus areas, quick links, KPIs).
   ═══════════════════════════════════════════════════════════════════ */

const STORAGE_KEY = "sens-landing-config";

// ── Role → default landing page key ──
export const ROLE_LANDING_DEFAULTS = {
  "CEO":            "ceo",
  "COO":            "coo",
  "VP Engineering": "vp-engineering",
  "VP Project":     "vp-project",
  "VP Maint":       "vp-maint",
  "VP Ops":         "vp-ops",
  "VP Risk":        "vp-hse",
  "VP Logistics":   "vp-logistics",
  "VP Strategy":    "vp-strategy",
  "VP Finance":     "vp-finance",
  "VP Marketing":   "vp-marketing",
  "VP IT":          "vp-it",
  "VP AI":          "vp-ai",
  "VP Process":     "vp-process",
  "VP People":      "vp-people",
  "VP Legal":       "vp-legal",
  "VP Operations":  "vp-ops",
  "Manager":        "manager",
  "Operator":       "operator",
  "Viewer":         "viewer",
};

// ── Generic landing page configs (for non-VP roles) ──
export const DEFAULT_LANDING_CONFIGS = {
  manager: {
    title: "Manager Dashboard",
    color: T.blue,
    branch: "Operations",
    showCompanyObjectives: true,
    focusAreas: ["Team Performance & Safety", "Shift Operations", "Work Order Management", "Quality Compliance"],
    quickLinks: [
      { label: "Plant Operations", target: "operations" },
      { label: "Risk Dashboard", target: "risk" },
      { label: "Site Map", target: "sitemap" },
    ],
  },
  operator: {
    title: "Operator Dashboard",
    color: T.green,
    branch: "Operations",
    showCompanyObjectives: false,
    focusAreas: ["Process Monitoring", "Safety Protocols", "Equipment Status", "Shift Handover"],
    quickLinks: [
      { label: "Plant Operations", target: "operations" },
      { label: "Site Map", target: "sitemap" },
    ],
  },
  viewer: {
    title: "Viewer Dashboard",
    color: T.textMid,
    branch: "General",
    showCompanyObjectives: false,
    focusAreas: ["Company Overview", "Public KPIs"],
    quickLinks: [
      { label: "Dashboard", target: "dashboard" },
      { label: "Site Map", target: "sitemap" },
    ],
  },
};

// ── Mutable landing overrides (loaded from localStorage) ──
let landingOverrides = {};

// ── Persistence ──

export function loadLandingConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    landingOverrides = JSON.parse(raw);
    return true;
  } catch {
    landingOverrides = {};
    return false;
  }
}

export function saveLandingConfig() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(landingOverrides));
}

export function resetLandingConfig() {
  localStorage.removeItem(STORAGE_KEY);
  landingOverrides = {};
}

export function isLandingConfigDirty() {
  return localStorage.getItem(STORAGE_KEY) !== null;
}

// Load on module init
loadLandingConfig();

// ── Lookups ──

/**
 * Resolve a user's landing page key.
 * Priority: user.landingPage > ROLE_LANDING_DEFAULTS[role] > "dashboard"
 */
export function getLandingPageKey(user) {
  if (user.landingPage) return user.landingPage;
  return ROLE_LANDING_DEFAULTS[user.role] || "dashboard";
}

/**
 * Get overrides for a specific landing page key.
 * Returns the saved overrides object, or an empty object if none.
 */
export function getLandingOverrides(pageKey) {
  return landingOverrides[pageKey] || {};
}

/**
 * Save overrides for a specific landing page key.
 */
export function saveLandingOverrides(pageKey, overrides) {
  if (!overrides || Object.keys(overrides).length === 0) {
    delete landingOverrides[pageKey];
  } else {
    landingOverrides[pageKey] = { ...overrides };
  }
  saveLandingConfig();
}

/**
 * Get all landing page override entries (for the editor).
 */
export function getAllLandingOverrides() {
  return { ...landingOverrides };
}

/**
 * Get the generic config for a non-VP role landing page.
 * Merges defaults with any saved overrides.
 */
export function getGenericLandingConfig(pageKey) {
  const defaults = DEFAULT_LANDING_CONFIGS[pageKey];
  if (!defaults) return null;
  const overrides = getLandingOverrides(pageKey);
  return {
    ...defaults,
    showCompanyObjectives: overrides.showCompanyObjectives ?? defaults.showCompanyObjectives,
    focusAreas: overrides.customFocusAreas || defaults.focusAreas,
    quickLinks: overrides.customQuickLinks || defaults.quickLinks,
  };
}

/**
 * List of all available landing page options for the user form dropdown.
 */
export const LANDING_PAGE_OPTIONS = [
  { value: "", label: "Default for Role" },
  { value: "dashboard", label: "Standard Dashboard" },
  { value: "ceo", label: "CEO Dashboard" },
  { value: "coo", label: "COO Dashboard" },
  { value: "vp-engineering", label: "VP Engineering" },
  { value: "vp-project", label: "VP Project" },
  { value: "vp-maint", label: "VP Maintenance" },
  { value: "vp-ops", label: "VP Operations" },
  { value: "vp-hse", label: "VP Risk / HSE" },
  { value: "vp-logistics", label: "VP Logistics" },
  { value: "vp-strategy", label: "VP Strategy" },
  { value: "vp-finance", label: "VP Finance" },
  { value: "vp-marketing", label: "VP Marketing" },
  { value: "vp-it", label: "VP IT" },
  { value: "vp-ai", label: "VP AI" },
  { value: "vp-process", label: "VP Process" },
  { value: "vp-people", label: "VP People" },
  { value: "vp-legal", label: "VP Legal" },
  { value: "manager", label: "Generic Manager" },
  { value: "operator", label: "Generic Operator" },
  { value: "viewer", label: "Generic Viewer" },
];
