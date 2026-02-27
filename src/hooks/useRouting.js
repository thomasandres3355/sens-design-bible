import { useState, useEffect, useCallback } from "react";

// ─── Static key → URL path mapping ───
const KEY_TO_PATH = {
  // Top-level
  dashboard:    "/dashboard",
  focus:        "/focus",
  sitemap:      "/sitemap",
  technology:   "/technology",
  ops:          "/ops",
  growth:       "/growth",
  org:          "/org",

  // Children of top-level parents
  operations:   "/operations",
  delivering:   "/delivering",
  finance:      "/finance",
  development:  "/development",
  workforce:    "/workforce",

  // Risk landing + children
  risk:                "/risk",
  "risk-workforce":    "/risk/workforce",
  "risk-process-mfg":  "/risk/process-mfg",
  "risk-project-dev":  "/risk/project-dev",
  "risk-offtake-mktg": "/risk/offtake-mktg",
  "risk-site-security":"/risk/site-security",
  "risk-it-data":      "/risk/it-data",
  "risk-regulatory":   "/risk/regulatory",
  "risk-supply-chain": "/risk/supply-chain",
  "risk-zones":        "/risk/zones",
  "risk-contractors":  "/risk/contractors",
  "risk-safety":       "/risk/safety",
  "risk-register":     "/risk/register",
  "risk-predictive":   "/risk/predictive",

  // Admin landing + children
  admin:                   "/admin",
  "admin-it-infra":        "/admin/it-infra",
  "admin-ai-agents":       "/admin/ai-agents",
  "admin-operations":      "/admin/operations",
  "admin-users-security":  "/admin/users-security",
  "admin-platform-config": "/admin/platform-config",
  "admin-bug-fixes":       "/admin/bug-fixes",

  // Exec / VP under /org
  ceo:              "/org/ceo",
  coo:              "/org/coo",
  "vp-engineering": "/org/vp-engineering",
  "vp-project":     "/org/vp-project",
  "vp-maint":       "/org/vp-maint",
  "vp-ops":         "/org/vp-ops",
  "vp-hse":         "/org/vp-hse",
  "vp-logistics":   "/org/vp-logistics",
  "vp-strategy":    "/org/vp-strategy",
  "vp-finance":     "/org/vp-finance",
  "vp-marketing":   "/org/vp-marketing",
  "vp-it":          "/org/vp-it",
  "vp-ai":          "/org/vp-ai",
  "vp-process":     "/org/vp-process",
  "vp-people":      "/org/vp-people",
  "vp-legal":       "/org/vp-legal",

  // Role-based landing pages
  manager:  "/manager",
  operator: "/operator",
  viewer:   "/viewer",
};

// ─── Reverse lookup: URL path → key ───
const PATH_TO_KEY = {};
for (const [key, path] of Object.entries(KEY_TO_PATH)) {
  PATH_TO_KEY[path] = key;
}

// ─── Conversion helpers ───

export function keyToPath(key) {
  if (KEY_TO_PATH[key]) return KEY_TO_PATH[key];
  // Dynamic: agent-xxx → /org/agent/xxx
  if (key.startsWith("agent-")) return "/org/agent/" + key.slice(6);
  // Unknown key → /dashboard
  return "/dashboard";
}

export function pathToKey(pathname) {
  // Normalize: strip trailing slash, treat root as /dashboard
  const path = (!pathname || pathname === "/")
    ? "/dashboard"
    : pathname.replace(/\/+$/, "").toLowerCase();

  if (PATH_TO_KEY[path]) return PATH_TO_KEY[path];

  // Dynamic: /org/agent/xxx → agent-xxx
  const agentMatch = path.match(/^\/org\/agent\/(.+)$/);
  if (agentMatch) return "agent-" + agentMatch[1];

  // Unknown path → dashboard
  return "dashboard";
}

// ─── Hook ───

export function useRouting() {
  const [active, setActiveInternal] = useState(() =>
    pathToKey(window.location.pathname)
  );

  // Navigate: update state + push/replace history
  const setActive = useCallback((key, { replace = false } = {}) => {
    const path = keyToPath(key);
    if (window.location.pathname !== path) {
      if (replace) {
        window.history.replaceState({ key }, "", path);
      } else {
        window.history.pushState({ key }, "", path);
      }
    }
    setActiveInternal(key);
  }, []);

  // Handle browser back / forward
  useEffect(() => {
    const handlePopState = (event) => {
      const key = event.state?.key || pathToKey(window.location.pathname);
      setActiveInternal(key);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Seed the initial history entry with state metadata and normalize unknown/mistyped URLs
  useEffect(() => {
    const currentKey = pathToKey(window.location.pathname);
    const canonicalPath = keyToPath(currentKey);
    window.history.replaceState({ key: currentKey }, "", canonicalPath);
  }, []);

  return { active, setActive };
}
