/**
 * News Config Store — localStorage-backed configuration for the World News module.
 * Stores per-department prompts, schedule settings, and global toggles.
 */

const STORAGE_KEY = "sens_news_config";

// ─── Default Prompts per Department ──────────────────────────────────
const DEFAULT_DEPARTMENT_PROMPTS = {
  company: {
    label: "SENS (Company-wide)",
    prompt: "Provide the top 3–5 world news stories most relevant to SENS, a company operating tire pyrolysis and coal gasification facilities. Focus on circular economy developments, waste-to-energy policy, tire recycling industry trends, carbon markets, and cleantech investment news. For each story, explain why it matters to SENS specifically.",
    enabled: true,
  },
  "vp-engineering": {
    label: "Engineering",
    prompt: "Provide the top 3–5 world news stories relevant to a VP of Engineering at a tire pyrolysis and coal gasification company. Focus on process engineering breakthroughs, pyrolysis reactor design advances, gasification technology developments, heat recovery innovations, and chemical engineering research that could affect plant design or efficiency.",
    enabled: true,
  },
  "vp-project": {
    label: "Project Management",
    prompt: "Provide the top 3–5 world news stories relevant to a VP of Project Management overseeing construction of industrial processing facilities. Focus on EPC industry trends, construction cost escalation, permitting and regulatory changes for industrial projects, modular construction innovations, and major project delivery milestones in the cleantech sector.",
    enabled: true,
  },
  "vp-maint": {
    label: "Maintenance",
    prompt: "Provide the top 3–5 world news stories relevant to a VP of Maintenance at industrial processing facilities. Focus on predictive maintenance technology, industrial IoT sensor innovations, asset management best practices, reliability engineering developments, and CMMS/EAM platform updates.",
    enabled: true,
  },
  "vp-ops": {
    label: "Operations",
    prompt: "Provide the top 3–5 world news stories relevant to a VP of Plant Operations at tire pyrolysis and coal gasification facilities. Focus on industrial safety incidents and lessons learned, process optimization breakthroughs, operational excellence methodologies, throughput improvement techniques, and manufacturing best practices.",
    enabled: true,
  },
  "vp-hse": {
    label: "Risk & HSE",
    prompt: "Provide the top 3–5 world news stories relevant to a VP of Risk & HSE at industrial processing facilities. Focus on industrial safety regulation changes, environmental compliance updates, ESG reporting requirements, workplace safety technology, and chemical facility risk management developments.",
    enabled: true,
  },
  "vp-logistics": {
    label: "Logistics",
    prompt: "Provide the top 3–5 world news stories relevant to a VP of Logistics managing feedstock supply chains for tire pyrolysis facilities. Focus on tire waste collection and supply trends, transportation and freight market conditions, commodity logistics disruptions, feedstock sourcing innovations, and circular supply chain developments.",
    enabled: true,
  },
  "vp-strategy": {
    label: "Strategy",
    prompt: "Provide the top 3–5 world news stories relevant to a VP of Strategy at a cleantech company in waste-to-energy. Focus on M&A activity in circular economy, carbon credit market developments, government policy and incentives for waste processing, competitive landscape changes, and strategic partnership announcements in the sector.",
    enabled: true,
  },
  "vp-finance": {
    label: "Finance",
    prompt: "Provide the top 3–5 world news stories relevant to a VP of Finance at a cleantech company operating pyrolysis and gasification facilities. Focus on energy commodity pricing trends, capital markets for cleantech, project finance developments, carbon credit valuation, and tax incentive or subsidy changes affecting waste-to-energy companies.",
    enabled: true,
  },
  "vp-marketing": {
    label: "Marketing & Business Dev",
    prompt: "Provide the top 3–5 world news stories relevant to a VP of Marketing at a circular economy company. Focus on sustainability branding trends, offtake market developments for recovered carbon black and pyrolysis oil, ESG-driven procurement shifts, circular economy certifications, and customer demand signals for sustainable industrial products.",
    enabled: true,
  },
  "vp-it": {
    label: "IT",
    prompt: "Provide the top 3–5 world news stories relevant to a VP of IT at an industrial processing company. Focus on industrial cybersecurity threats and incidents, SCADA/OT security developments, cloud infrastructure for manufacturing, data governance regulations, and enterprise IT platform updates relevant to industrial operations.",
    enabled: true,
  },
  "vp-ai": {
    label: "AI & Automation",
    prompt: "Provide the top 3–5 world news stories relevant to a VP of AI at a manufacturing company. Focus on AI applications in industrial processes, LLM developments relevant to enterprise, process automation and digital twin innovations, computer vision for quality control, and AI regulation or governance developments.",
    enabled: true,
  },
  "vp-process": {
    label: "Process & Quality",
    prompt: "Provide the top 3–5 world news stories relevant to a VP of Process at chemical processing facilities. Focus on chemical process innovation, quality standard updates (ISO, ASTM), laboratory testing technology, product quality breakthroughs in pyrolysis outputs, and process safety management developments.",
    enabled: true,
  },
  "vp-people": {
    label: "People & HR",
    prompt: "Provide the top 3–5 world news stories relevant to a VP of People at an industrial company. Focus on manufacturing workforce trends, skilled labor market developments, workplace training innovations, DEI initiatives in industrial sectors, and labor policy changes affecting manufacturing employers.",
    enabled: true,
  },
  "vp-legal": {
    label: "Legal",
    prompt: "Provide the top 3–5 world news stories relevant to a VP of Legal at a cleantech/industrial company. Focus on environmental law developments, intellectual property protection in cleantech, industrial facility regulation changes, contract and procurement law updates, and ESG disclosure requirements.",
    enabled: true,
  },
};

// ─── Default Config ──────────────────────────────────────────────────
function buildDefaultConfig() {
  return {
    enabled: false,
    useWebSearch: false,
    refreshInterval: "daily",
    departments: { ...DEFAULT_DEPARTMENT_PROMPTS },
  };
}

// ─── Core CRUD ───────────────────────────────────────────────────────
export function getNewsConfig() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return buildDefaultConfig();
    const parsed = JSON.parse(stored);
    // Merge with defaults to pick up any new departments added later
    const defaults = buildDefaultConfig();
    return {
      ...defaults,
      ...parsed,
      departments: {
        ...defaults.departments,
        ...parsed.departments,
      },
    };
  } catch {
    return buildDefaultConfig();
  }
}

export function saveNewsConfig(config) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

// ─── Global Toggle ───────────────────────────────────────────────────
export function isNewsEnabled() {
  return getNewsConfig().enabled;
}

export function setNewsEnabled(enabled) {
  const config = getNewsConfig();
  config.enabled = enabled;
  saveNewsConfig(config);
}

// ─── Web Search Toggle ──────────────────────────────────────────────
export function isWebSearchEnabled() {
  return getNewsConfig().useWebSearch;
}

export function setWebSearchEnabled(enabled) {
  const config = getNewsConfig();
  config.useWebSearch = enabled;
  saveNewsConfig(config);
}

// ─── Refresh Interval ────────────────────────────────────────────────
export function getRefreshInterval() {
  return getNewsConfig().refreshInterval;
}

export function setRefreshInterval(interval) {
  const config = getNewsConfig();
  config.refreshInterval = interval;
  saveNewsConfig(config);
}

// ─── Department Prompts ──────────────────────────────────────────────
export function getDepartmentConfig(deptKey) {
  const config = getNewsConfig();
  return config.departments[deptKey] || null;
}

export function setDepartmentPrompt(deptKey, prompt) {
  const config = getNewsConfig();
  if (config.departments[deptKey]) {
    config.departments[deptKey].prompt = prompt;
    saveNewsConfig(config);
  }
}

export function setDepartmentEnabled(deptKey, enabled) {
  const config = getNewsConfig();
  if (config.departments[deptKey]) {
    config.departments[deptKey].enabled = enabled;
    saveNewsConfig(config);
  }
}

export function resetDepartmentPrompt(deptKey) {
  const defaults = buildDefaultConfig();
  const config = getNewsConfig();
  if (defaults.departments[deptKey]) {
    config.departments[deptKey].prompt = defaults.departments[deptKey].prompt;
    saveNewsConfig(config);
  }
}

// ─── Defaults ────────────────────────────────────────────────────────
export function getDefaultPrompts() {
  return { ...DEFAULT_DEPARTMENT_PROMPTS };
}

export function getDepartmentKeys() {
  return Object.keys(DEFAULT_DEPARTMENT_PROMPTS);
}
