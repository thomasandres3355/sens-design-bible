/**
 * Time Engine — Deterministic 2-year data generator for Executive Intelligence Platform
 *
 * Uses seeded PRNG (mulberry32) so every date produces identical data.
 * All generators are memoized by date string.
 */

import { SITES, PLAN_PER_MACHINE, COAL_PLAN_PER_MACHINE, sitePlan } from "@core/data/sites";
import { OBJECTIVE_TAGS } from "@modules/executive-focus/focusData";

// ─── Seeded PRNG ──────────────────────────────────────────────────────
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashDate(dateStr) {
  let h = 0;
  for (let i = 0; i < dateStr.length; i++) {
    h = ((h << 5) - h + dateStr.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function seededRng(dateStr, salt = "") {
  return mulberry32(hashDate(dateStr + salt));
}

// ─── Date Helpers ─────────────────────────────────────────────────────
const DAY_MS = 86400000;
const DATA_START = "2024-06-01";
const toDate = (s) => new Date(s + "T12:00:00");
const toStr = (d) => d.toISOString().split("T")[0];
const daysBetween = (a, b) => Math.round((toDate(b) - toDate(a)) / DAY_MS);
const addDays = (s, n) => { const d = toDate(s); d.setDate(d.getDate() + n); return toStr(d); };
const dayOfWeek = (s) => toDate(s).getDay(); // 0=Sun, 1=Mon, ...
const dayOfMonth = (s) => parseInt(s.split("-")[2], 10);
const monthOf = (s) => s.slice(0, 7);

// ─── Memoization Cache ───────────────────────────────────────────────
const cache = {};
function memoByDate(key, dateStr, fn) {
  const k = `${key}:${dateStr}`;
  if (!cache[k]) cache[k] = fn();
  return cache[k];
}

// ─── Base Site Templates ─────────────────────────────────────────────
const ACTIVE_TEMPLATES = SITES.filter((s) => s.status === "operational");
const CONSTRUCTION_TEMPLATES = SITES.filter((s) => s.status === "construction");

// Which sites are operational on a given date
const SITE_LAUNCH_DATES = {
  "noble-ok": "2024-06-01",
  "richmond-va": "2025-01-15",
  "tucson-az": "2025-04-01",
  "baton-la": "2025-07-01",
  "columbus-oh": "2025-11-01",
};

function getActiveSiteIds(dateStr) {
  return Object.entries(SITE_LAUNCH_DATES)
    .filter(([, launch]) => dateStr >= launch)
    .map(([id]) => id);
}

// ═══ SITE METRICS ═════════════════════════════════════════════════════
export function getSiteMetrics(dateStr) {
  return memoByDate("sites", dateStr, () => {
    const rng = seededRng(dateStr, "sites");
    const activeIds = getActiveSiteIds(dateStr);
    const dom = dayOfMonth(dateStr);
    const isMonthStart = dom === 1;

    return SITES.map((template) => {
      const site = { ...template };
      const isActive = activeIds.includes(site.id);

      if (site.status === "operational") {
        if (!isActive) {
          // Site not yet launched — return zeroed
          return { ...site, status: "pre-launch", uptime: 0, throughput: 0, revMTD: 0, diluentGal: 0, carbonT: 0, actualRevenue: 0, actualEBITDA: 0, actualCOGS: 0, actualGrossMargin: 0, actualOpEx: 0 };
        }

        const daysSinceLaunch = daysBetween(SITE_LAUNCH_DATES[site.id], dateStr);
        const rampFactor = Math.min(1, daysSinceLaunch / 180); // 6-month ramp

        // Uptime: base ± variation, occasional dips
        const isIncident = rng() < 0.03; // 3% chance of incident day
        const baseUptime = template.uptime || 85;
        const uptimeVariation = (rng() - 0.5) * 8;
        site.uptime = isIncident
          ? Math.max(40, baseUptime - 20 - rng() * 25)
          : Math.min(99, Math.max(70, baseUptime + uptimeVariation * rampFactor));
        site.uptime = Math.round(site.uptime * 10) / 10;

        // Throughput tracks uptime
        const plan = sitePlan(template);
        site.throughput = Math.round(plan.tphPlan * (site.uptime / 100) * rampFactor * 10) / 10;

        // Revenue accumulates monthly
        const dailyRevRate = (plan.planRevenue * rampFactor * (site.uptime / plan.uptimePlan)) / 30;
        site.revMTD = Math.round(dom * dailyRevRate * 10) / 10;

        // Production metrics scale with throughput
        const throughputRatio = site.throughput / Math.max(plan.tphPlan, 1);
        site.diluentGal = Math.round((template.diluentGal || 14000) * throughputRatio * (0.9 + rng() * 0.2));
        site.carbonT = Math.round((template.carbonT || 120) * throughputRatio * (0.9 + rng() * 0.2));

        // Annual financials scale with ramp and uptime
        const annualFactor = rampFactor * (site.uptime / plan.uptimePlan);
        site.actualRevenue = Math.round(plan.planRevenue * annualFactor * 10) / 10;
        site.actualEBITDA = Math.round(plan.planEBITDA * annualFactor * 0.9 * 10) / 10;
        site.actualCOGS = Math.round(plan.planCosts * annualFactor * 10) / 10;
        site.actualGrossMargin = site.actualRevenue > 0 ? Math.round(((site.actualRevenue - site.actualCOGS) / site.actualRevenue) * 100) : 0;
        site.actualOpEx = Math.round(site.actualCOGS * 0.55 * 10) / 10;
      }

      if (site.status === "construction") {
        const constructionStart = site.id === "noble-b" ? "2025-06-01" : "2025-09-01";
        const totalDays = 730; // ~2 years to complete
        const elapsed = Math.max(0, daysBetween(constructionStart, dateStr));
        const basePct = Math.min(95, (elapsed / totalDays) * 100);
        const variation = (rng() - 0.5) * 2;
        site.constructionPct = Math.max(0, Math.round((basePct + variation) * 10) / 10);

        // Stage progress
        const stages = ["concept", "pre-feed", "feed", "epc", "construction", "commissioning"];
        const stageThresholds = [0, 10, 25, 40, 50, 90];
        site.stageProgress = {};
        stages.forEach((s, i) => {
          const threshold = stageThresholds[i];
          if (basePct >= threshold + 10) site.stageProgress[s] = 100;
          else if (basePct >= threshold) site.stageProgress[s] = Math.round(((basePct - threshold) / 10) * 100);
          else site.stageProgress[s] = 0;
        });
      }

      if (site.status === "development") {
        const devStart = site.id === "coal-fl" ? "2025-03-01" : "2025-01-01";
        const elapsed = Math.max(0, daysBetween(devStart, dateStr));
        const progress = Math.min(50, (elapsed / 1000) * 50);
        site.developmentPct = Math.max(0, Math.round(progress));
      }

      return site;
    });
  });
}

// ═══ EXECUTIVE TASKS ══════════════════════════════════════════════════
const EXECS = ["CEO", "COO", "VP Engineering", "VP Operations", "VP Finance", "VP Strategy", "VP People", "VP Risk"];
const TASK_TEMPLATES = [
  "Review {dept} quarterly report",
  "Approve {dept} budget allocation",
  "Sign off on {site} maintenance plan",
  "Follow up on {site} performance metrics",
  "Prepare {objective} update for board",
  "Review compliance report for {dept}",
  "Call {contact} re: {topic}",
  "Finalize {topic} recommendations",
  "Approve PO for {site} equipment",
  "Review risk assessment for {site}",
  "Schedule site visit to {site}",
  "Update investor deck with {topic}",
  "Review hiring plan for {dept}",
  "Approve safety training schedule",
  "Complete {objective} milestone review",
  "Draft memo on {topic}",
  "Review vendor proposal for {site}",
  "Confirm contractor schedule for {site}",
  "Prepare talking points for {topic}",
  "Sign off on {dept} process changes",
];
const DEPTS = ["Operations", "Engineering", "Finance", "Risk", "HR", "Strategy", "Legal"];
const CONTACTS = ["Meridian Capital", "Greenfield Partners", "WSP Global", "Brown & Root", "Cissell Mueller", "board members"];
const TOPICS = ["Series C progress", "carbon black pricing", "coal gasification", "site expansion", "insurance renewal", "reactor design", "uptime targets", "feedstock supply"];
const SITE_NAMES = ["Noble OK", "Richmond VA", "Tucson AZ", "Baton Rouge", "Columbus OH", "Portland OR", "Noble B"];

function generateTaskText(rng) {
  const template = TASK_TEMPLATES[Math.floor(rng() * TASK_TEMPLATES.length)];
  return template
    .replace("{dept}", DEPTS[Math.floor(rng() * DEPTS.length)])
    .replace("{site}", SITE_NAMES[Math.floor(rng() * SITE_NAMES.length)])
    .replace("{objective}", ["Series C", "Ops Excellence", "Growth Pipeline"][Math.floor(rng() * 3)])
    .replace("{contact}", CONTACTS[Math.floor(rng() * CONTACTS.length)])
    .replace("{topic}", TOPICS[Math.floor(rng() * TOPICS.length)]);
}

const SOURCES = [
  "Exec Standup", "Engineering Sync", "Finance Committee", "Ops Review",
  "Maintenance Review", "IR Prep", "Board Prep", "Site Review",
  "HSE Review", "Strategy Session", "Construction Sync", "Hiring Review",
];

export function getTasksForDate(dateStr) {
  return memoByDate("tasks", dateStr, () => {
    const tasks = [];
    const dayIndex = daysBetween(DATA_START, dateStr);

    // Generate historical tasks: ~2-3 per exec per week = ~0.35/day/exec
    for (let exec of EXECS) {
      const rng = seededRng(dateStr, "tasks-" + exec);

      // Generate tasks that were created in the last 30 days relative to simDate
      for (let daysBack = 0; daysBack < 30; daysBack++) {
        const taskDate = addDays(dateStr, -daysBack);
        const taskRng = seededRng(taskDate, "newtask-" + exec);

        // ~35% chance of new task on any given day per exec
        if (taskRng() > 0.35) continue;

        const id = `ft-gen-${daysBetween(DATA_START, taskDate)}-${exec.replace(/\s/g, "")}`;
        const priority = taskRng() < 0.3 ? "high" : taskRng() < 0.7 ? "medium" : "low";
        const cycle = taskRng() < 0.4 ? "24h" : taskRng() < 0.75 ? "3d" : "1w";
        const cycleDays = cycle === "24h" ? 1 : cycle === "3d" ? 3 : 7;
        const dueDate = addDays(taskDate, cycleDays);

        // Determine objective alignment (~75% aligned)
        let objectiveTag = null;
        if (taskRng() < 0.75) {
          const tags = OBJECTIVE_TAGS.map((t) => t.id);
          objectiveTag = tags[Math.floor(taskRng() * tags.length)];
        }

        // Status: if due < simDate, determine if completed or overdue
        let status = "open";
        let completedDate = null;
        let daysToClose = null;
        if (dueDate < dateStr) {
          const completionRng = seededRng(dueDate, "complete-" + id);
          if (completionRng() < 0.78) {
            // 78% completion rate
            status = "done";
            daysToClose = Math.max(1, Math.floor(completionRng() * cycleDays) + 1);
            completedDate = addDays(taskDate, daysToClose);
          } else {
            status = "overdue";
          }
        }

        const source = SOURCES[Math.floor(taskRng() * SOURCES.length)] + " — " + taskDate.split("-").slice(1).join("/");

        tasks.push({
          id,
          task: generateTaskText(taskRng),
          executive: exec,
          objectiveTag,
          due: dueDate,
          status,
          priority,
          cycle,
          source,
          completedDate,
          daysToClose,
        });
      }
    }

    // Sort: overdue first, then open by due date, then done
    const statusOrder = { overdue: 0, open: 1, done: 2 };
    tasks.sort((a, b) => {
      if (statusOrder[a.status] !== statusOrder[b.status]) return statusOrder[a.status] - statusOrder[b.status];
      return a.due < b.due ? -1 : 1;
    });

    return tasks;
  });
}

// ═══ ALERTS ═══════════════════════════════════════════════════════════
const ALERT_TEMPLATES = [
  { label: "{site} Heat Exchanger Alert", type: "agent_raised", severity: "critical", agentId: "maint-pred", agentName: "Maintenance Agent", dept: "VP Maintenance", targets: ["vp-maint", "vp-ops"] },
  { label: "{site} Feedstock Supply Low", type: "agent_raised", severity: "warning", agentId: "log-sc", agentName: "Supply Chain Agent", dept: "VP Logistics", targets: ["vp-logistics", "vp-ops"] },
  { label: "Customer Concentration Risk", type: "agent_raised", severity: "warning", agentId: "mktg-sales", agentName: "Sales Agent", dept: "VP Marketing", targets: ["vp-marketing", "vp-strategy"] },
  { label: "{site} Bearing Wear Detected", type: "agent_raised", severity: "info", agentId: "maint-pred", agentName: "Maintenance Agent", dept: "VP Maintenance", targets: ["vp-maint", "vp-ops"] },
  { label: "Training Certifications Overdue", type: "agent_raised", severity: "info", agentId: "ppl-train", agentName: "Training Agent", dept: "VP People", targets: ["vp-people", "vp-hse"] },
  { label: "Series C Pace Behind Schedule", type: "agent_raised", severity: "warning", agentId: "strat-ir", agentName: "Investor Relations Agent", dept: "VP Strategy", targets: ["vp-strategy", "vp-finance"] },
  { label: "{site} Schedule Slip", type: "agent_raised", severity: "warning", agentId: "coo-constr", agentName: "Construction Oversight Agent", dept: "COO", targets: ["vp-project", "vp-logistics"] },
  { label: "Insurance Renewal Due", type: "agent_raised", severity: "warning", agentId: "legal-contract", agentName: "Contract Agent", dept: "VP Legal", targets: ["vp-legal", "vp-finance"] },
  { label: "Permit Renewal Due", type: "agent_raised", severity: "info", agentId: "hse-permit", agentName: "Permitting Agent", dept: "VP Risk", targets: ["vp-hse", "vp-ops"] },
  { label: "Carbon Black Price Movement", type: "agent_raised", severity: "info", agentId: "mktg-price", agentName: "Pricing Agent", dept: "VP Marketing", targets: ["vp-marketing", "vp-finance"] },
];

export function getAlertsForDate(dateStr) {
  return memoByDate("alerts", dateStr, () => {
    const rng = seededRng(dateStr, "alerts");
    const sites = getSiteMetrics(dateStr);
    const activeSites = sites.filter((s) => s.status === "operational" && s.uptime > 0);
    const alerts = [];

    // KPI-driven alerts from live site data
    activeSites.forEach((s) => {
      const plan = sitePlan(s);
      if (s.uptime < plan.uptimePlan) {
        const gap = plan.uptimePlan - s.uptime;
        alerts.push({
          id: `kpi-uptime-${s.id}-${dateStr}`,
          type: "kpi_miss", severity: gap >= 10 ? "critical" : "warning",
          label: `${s.short} Uptime ${s.uptime}%`,
          detail: `${s.short} running at ${s.uptime}% vs ${plan.uptimePlan}% plan — ${gap.toFixed(1)}pt gap.`,
          kpi: { actual: s.uptime, target: plan.uptimePlan, unit: "%", metric: "Uptime" },
          raisedBy: { agentId: "coo-perf", agentName: "Site Performance Agent", department: "COO" },
          targetDepts: ["vp-ops", "vp-maint"], crossDept: true, timestamp: dateStr + "T06:00:00Z",
        });
      }
      if (s.actualRevenue && s.actualRevenue < plan.planRevenue * 0.9) {
        alerts.push({
          id: `kpi-rev-${s.id}-${dateStr}`,
          type: "kpi_miss", severity: s.actualRevenue < plan.planRevenue * 0.75 ? "critical" : "warning",
          label: `${s.short} Revenue Below Plan`,
          detail: `${s.short} at $${s.actualRevenue.toFixed(1)}M vs $${plan.planRevenue.toFixed(1)}M plan.`,
          kpi: { actual: s.actualRevenue, target: plan.planRevenue, unit: "$M", metric: "Revenue" },
          raisedBy: { agentId: "fin-rev", agentName: "Finance Agent", department: "VP Finance" },
          targetDepts: ["vp-finance", "vp-ops"], crossDept: true, timestamp: dateStr + "T07:00:00Z",
        });
      }
    });

    // Agent-raised alerts: pick 4-7 from templates based on date seed
    const alertCount = 4 + Math.floor(rng() * 4);
    const shuffled = [...ALERT_TEMPLATES].sort(() => rng() - 0.5);
    for (let i = 0; i < Math.min(alertCount, shuffled.length); i++) {
      const tmpl = shuffled[i];
      const site = activeSites[Math.floor(rng() * activeSites.length)];
      const label = tmpl.label.replace("{site}", site?.short || "Noble OK");
      alerts.push({
        id: `agent-${tmpl.agentId}-${dateStr}-${i}`,
        type: tmpl.type, severity: tmpl.severity, label,
        detail: `${label} — flagged by ${tmpl.agentName} on ${dateStr}.`,
        kpi: null,
        raisedBy: { agentId: tmpl.agentId, agentName: tmpl.agentName, department: tmpl.dept },
        targetDepts: tmpl.targets, crossDept: true, timestamp: dateStr + `T0${5 + i}:00:00Z`,
      });
    }

    // Sort: critical → warning → info
    const sevOrder = { critical: 0, warning: 1, info: 2 };
    return alerts.sort((a, b) => (sevOrder[a.severity] || 2) - (sevOrder[b.severity] || 2));
  });
}

// ═══ MEETINGS ═════════════════════════════════════════════════════════
const MEETING_TYPES = [
  { title: "Weekly Executive Standup", participants: ["thomas", "sarah", "james", "marcus"], room: "Executive Boardroom", duration: "30 min", recurring: true, tags: ["operations", "standup"], dow: 1 },
  { title: "Portland OR Project Review", participants: ["thomas", "sarah", "lena", "marcus"], room: "Engineering Hub", duration: "60 min", recurring: false, tags: ["portland", "construction"], dow: 1 },
  { title: "Investor Relations Prep", participants: ["thomas", "james", "omar"], room: "CEO Office", duration: "45 min", recurring: false, tags: ["investors", "series-c"], dow: 2 },
  { title: "HSE Monthly Review", participants: ["sarah", "marcus", "rachel"], room: "Operations Center", duration: "45 min", recurring: true, tags: ["hse", "compliance"], dow: 3 },
  { title: "Finance Committee", participants: ["thomas", "james", "diane", "omar"], room: "Finance Suite", duration: "60 min", recurring: true, tags: ["budget", "revenue"], dow: 4 },
  { title: "Engineering Sync", participants: ["sarah", "lena", "marcus"], room: "Engineering Hub", duration: "45 min", recurring: true, tags: ["engineering"], dow: 3 },
  { title: "Board Prep", participants: ["thomas", "james", "omar"], room: "CEO Office", duration: "60 min", recurring: false, tags: ["board"], dow: 5 },
];

export function getMeetingsForDate(dateStr) {
  return memoByDate("meetings", dateStr, () => {
    const dow = dayOfWeek(dateStr);
    const rng = seededRng(dateStr, "meetings");
    const meetings = [];

    MEETING_TYPES.forEach((tmpl, idx) => {
      // Recurring meetings happen on their dow, non-recurring ~25% chance
      const shouldHappen = tmpl.recurring ? dow === tmpl.dow : (dow === tmpl.dow && rng() < 0.25);
      if (!shouldHappen) return;

      meetings.push({
        id: `m-${dateStr}-${idx}`,
        type: "meeting",
        title: tmpl.title,
        date: dateStr,
        time: `${9 + idx}:00 AM`,
        status: "completed", // historical data is all completed
        participants: tmpl.participants,
        room: tmpl.room,
        duration: tmpl.duration,
        recurring: tmpl.recurring,
        tags: tmpl.tags,
      });
    });

    return meetings;
  });
}

// ═══ VELOCITY TREND ═══════════════════════════════════════════════════
export function getVelocityTrend(dateStr, weeks = 8) {
  return memoByDate("velocity-" + weeks, dateStr, () => {
    const trend = [];
    for (let w = weeks - 1; w >= 0; w--) {
      const weekEnd = addDays(dateStr, -w * 7);
      const weekStart = addDays(weekEnd, -6);
      const tasks = getTasksForDate(weekEnd);
      const completed = tasks.filter((t) => t.status === "done" && t.completedDate >= weekStart && t.completedDate <= weekEnd);

      const seriesC = completed.filter((t) => t.objectiveTag === "obj-series-c").length;
      const opsExcellence = completed.filter((t) => t.objectiveTag === "obj-ops-excellence").length;
      const growthPipeline = completed.filter((t) => t.objectiveTag === "obj-growth-pipeline").length;
      const unaligned = completed.filter((t) => !t.objectiveTag).length;
      const total = seriesC + opsExcellence + growthPipeline + unaligned;
      const aligned = seriesC + opsExcellence + growthPipeline;

      const d = toDate(weekStart);
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

      trend.push({
        label,
        week: `${label}–${toDate(weekEnd).toLocaleDateString("en-US", { day: "numeric" })}`,
        seriesC, opsExcellence, growthPipeline, unaligned, total, aligned,
        focusPct: total > 0 ? Math.round((aligned / total) * 100) : 0,
      });
    }
    return trend;
  });
}

// ═══ CONSTRUCTION PROGRESS ════════════════════════════════════════════
export function getConstructionProgress(dateStr) {
  const sites = getSiteMetrics(dateStr);
  return sites.filter((s) => s.status === "construction");
}

// ═══ PORTFOLIO AGGREGATES ═════════════════════════════════════════════
export function getPortfolioMetrics(dateStr) {
  return memoByDate("portfolio", dateStr, () => {
    const sites = getSiteMetrics(dateStr);
    const active = sites.filter((s) => s.status === "operational" && s.uptime > 0);

    return {
      totalProcessors: active.reduce((a, s) => a + s.processors, 0),
      totalTPH: active.reduce((a, s) => a + (s.throughput || 0), 0),
      totalRevMTD: active.reduce((a, s) => a + (s.revMTD || 0), 0),
      totalDiluent: active.reduce((a, s) => a + (s.diluentGal || 0), 0),
      totalCarbon: active.reduce((a, s) => a + (s.carbonT || 0), 0),
      avgUptime: active.length > 0 ? active.reduce((a, s) => a + s.uptime, 0) / active.length : 0,
      portfolioEBITDA: active.reduce((a, s) => a + (s.actualEBITDA || 0), 0),
      portfolioRevenue: active.reduce((a, s) => a + (s.actualRevenue || 0), 0),
      activeSiteCount: active.length,
    };
  });
}

// ═══ DATA SLICE (for history depth) ══════════════════════════════════
export function getDataSlice(simDate, historyDepth) {
  const depthDays = { "30d": 30, "90d": 90, "1y": 365, "2y": 730 };
  const days = depthDays[historyDepth] || 365;
  const startDate = addDays(simDate, -days);

  return {
    simDate,
    startDate,
    days,
    sites: getSiteMetrics(simDate),
    tasks: getTasksForDate(simDate),
    alerts: getAlertsForDate(simDate),
    meetings: getMeetingsForDate(simDate),
    velocity: getVelocityTrend(simDate),
    portfolio: getPortfolioMetrics(simDate),
    construction: getConstructionProgress(simDate),
  };
}

// ═══ CLEAR CACHE (for memory management) ═════════════════════════════
export function clearCache() {
  Object.keys(cache).forEach((k) => delete cache[k]);
}
