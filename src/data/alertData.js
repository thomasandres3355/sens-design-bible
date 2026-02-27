import { T } from "./theme";
import { activeSites as staticActiveSites, sitePlan } from "./sites";
import { getSiteMetrics } from "./timeEngine";

/**
 * Check Engine Light Alert System
 *
 * Alerts are driven by two sources:
 *   1. KPI / Target misses — computed from plan vs actual data
 *   2. Agent-raised — flagged by AI agents monitoring their domains
 *
 * Each alert carries:
 *   id:           unique identifier
 *   type:         "kpi_miss" | "agent_raised"
 *   severity:     "critical" | "warning" | "info"
 *   label:        short title for the engine light
 *   detail:       longer description with context
 *   kpi:          { actual, target, unit, metric } — for KPI-driven alerts
 *   raisedBy:     { agentId, agentName, department }
 *   targetDepts:  string[] — which VP departments this is relevant to
 *   crossDept:    boolean — true if this alert crosses departmental boundaries
 *   timestamp:    ISO date string
 */

// ─── Compute KPI-driven alerts from live site data ───────────────────────

const computeKpiAlerts = (simDate) => {
  const sites = simDate ? getSiteMetrics(simDate) : staticActiveSites;
  const liveSites = sites.filter(s => s.status === "operational" && s.uptime > 0);
  const alerts = [];
  const dateStr = simDate || "2026-02-24";

  // Per-site uptime misses
  liveSites.forEach(s => {
    const plan = sitePlan(s);
    if (s.uptime < plan.uptimePlan) {
      const gap = plan.uptimePlan - s.uptime;
      alerts.push({
        id: `kpi-uptime-${s.id}`,
        type: "kpi_miss",
        severity: gap >= 10 ? "critical" : "warning",
        label: `${s.short} Uptime ${s.uptime}%`,
        detail: `${s.short} is running at ${s.uptime}% uptime against a ${plan.uptimePlan}% plan target — ${gap}pt shortfall.`,
        kpi: { actual: s.uptime, target: plan.uptimePlan, unit: "%", metric: "Uptime" },
        raisedBy: { agentId: "coo-perf", agentName: "Site Performance Agent", department: "COO" },
        targetDepts: ["vp-ops", "vp-maint"],
        crossDept: true,
        timestamp: `${dateStr}T06:00:00Z`,
      });
    }
  });

  // Per-site revenue misses
  liveSites.forEach(s => {
    const plan = sitePlan(s);
    if (s.actualRevenue && s.actualRevenue < plan.planRevenue * 0.9) {
      const pct = ((s.actualRevenue / plan.planRevenue - 1) * 100).toFixed(0);
      alerts.push({
        id: `kpi-rev-${s.id}`,
        type: "kpi_miss",
        severity: s.actualRevenue < plan.planRevenue * 0.75 ? "critical" : "warning",
        label: `${s.short} Revenue ${pct}% vs Plan`,
        detail: `${s.short} actual revenue $${s.actualRevenue.toFixed(1)}M vs plan $${plan.planRevenue.toFixed(1)}M — tracking ${pct}% off target.`,
        kpi: { actual: s.actualRevenue, target: plan.planRevenue, unit: "$M", metric: "Revenue" },
        raisedBy: { agentId: "fin-rev", agentName: "Finance Agent", department: "VP Finance" },
        targetDepts: ["vp-finance", "vp-ops", "vp-marketing"],
        crossDept: true,
        timestamp: `${dateStr}T07:30:00Z`,
      });
    }
  });

  // Per-site throughput misses
  liveSites.forEach(s => {
    const plan = sitePlan(s);
    if (s.throughput < plan.tphPlan * 0.84) {
      alerts.push({
        id: `kpi-tph-${s.id}`,
        type: "kpi_miss",
        severity: "warning",
        label: `${s.short} Throughput ${s.throughput} TPH`,
        detail: `${s.short} throughput at ${s.throughput} TPH vs ${plan.tphPlan} TPH plan capacity — below 84% efficiency threshold.`,
        kpi: { actual: s.throughput, target: plan.tphPlan, unit: "TPH", metric: "Throughput" },
        raisedBy: { agentId: "ops-sched", agentName: "Scheduling Agent", department: "VP Operations" },
        targetDepts: ["vp-ops", "vp-maint"],
        crossDept: false,
        timestamp: `${dateStr}T06:15:00Z`,
      });
    }
  });

  return alerts;
};


// ─── Agent-raised alerts (cross-departmental intelligence) ───────────────

const agentRaisedAlerts = [
  {
    id: "agent-baton-heat",
    type: "agent_raised",
    severity: "critical",
    label: "Baton Rouge Heat Exchanger",
    detail: "Predictive maintenance model flagged heat exchanger degradation at Baton Rouge — estimated 30 days to failure. Recommend scheduling cleaning during next window.",
    kpi: null,
    raisedBy: { agentId: "maint-pred", agentName: "Maintenance Agent", department: "VP Maintenance" },
    targetDepts: ["vp-maint", "vp-ops"],
    crossDept: true,
    timestamp: "2026-02-24T05:30:00Z",
  },
  {
    id: "agent-series-c",
    type: "agent_raised",
    severity: "warning",
    label: "Series C Pace Behind Schedule",
    detail: "At current rate of $19.4M committed (12%), Series C will take 14 months to close vs 8-month target. 3 meetings cancelled this month.",
    kpi: { actual: 12, target: 50, unit: "%", metric: "Series C Committed" },
    raisedBy: { agentId: "strat-ir", agentName: "Investor Relations Agent", department: "VP Strategy" },
    targetDepts: ["vp-strategy", "vp-finance"],
    crossDept: true,
    timestamp: "2026-02-24T08:00:00Z",
  },
  {
    id: "agent-portland-slip",
    type: "agent_raised",
    severity: "warning",
    label: "Portland OR 3-Day Schedule Slip",
    detail: "Steel delivery delay causing 3-day slip on Portland OR construction schedule. EPC contractor Brown & Root working recovery plan.",
    kpi: null,
    raisedBy: { agentId: "coo-constr", agentName: "Construction Oversight Agent", department: "COO" },
    targetDepts: ["vp-project", "vp-logistics"],
    crossDept: true,
    timestamp: "2026-02-23T14:20:00Z",
  },
  {
    id: "agent-insurance-renewal",
    type: "agent_raised",
    severity: "warning",
    label: "Insurance Renewal — 30 Days",
    detail: "Multi-site coverage policy expires in 30 days. Premium expected to increase 12-15% due to 2 new construction sites. Needs VP Finance approval.",
    kpi: null,
    raisedBy: { agentId: "legal-contract", agentName: "Contract Agent", department: "VP Legal" },
    targetDepts: ["vp-legal", "vp-finance"],
    crossDept: true,
    timestamp: "2026-02-24T09:00:00Z",
  },
  {
    id: "agent-permit-renewal",
    type: "agent_raised",
    severity: "info",
    label: "2 Permits Due for Renewal",
    detail: "Environmental operating permits for Noble OK and Richmond VA due for renewal within 60 days. Filing initiated, awaiting agency confirmation.",
    kpi: null,
    raisedBy: { agentId: "hse-permit", agentName: "Permitting Agent", department: "VP Risk" },
    targetDepts: ["vp-hse", "vp-ops"],
    crossDept: true,
    timestamp: "2026-02-23T16:00:00Z",
  },
  {
    id: "agent-columbus-feedstock",
    type: "agent_raised",
    severity: "warning",
    label: "Columbus OH Feedstock Supply Tight",
    detail: "Columbus OH feedstock buffer down to 4 days vs 10-day target. Midwest Tire Recyclers delivery delayed — alternate supplier being contacted.",
    kpi: { actual: 4, target: 10, unit: "days", metric: "Inventory Buffer" },
    raisedBy: { agentId: "log-sc", agentName: "Supply Chain Agent", department: "VP Logistics" },
    targetDepts: ["vp-logistics", "vp-ops"],
    crossDept: true,
    timestamp: "2026-02-24T07:00:00Z",
  },
  {
    id: "agent-customer-concentration",
    type: "agent_raised",
    severity: "warning",
    label: "Customer Concentration Risk",
    detail: "Top 3 customers account for 65% of revenue. Loss of any single customer would impact $3M+ annual revenue. Diversification needed.",
    kpi: { actual: 65, target: 40, unit: "%", metric: "Top 3 Revenue Share" },
    raisedBy: { agentId: "mktg-sales", agentName: "Sales Agent", department: "VP Marketing" },
    targetDepts: ["vp-marketing", "vp-strategy", "vp-finance"],
    crossDept: true,
    timestamp: "2026-02-24T10:00:00Z",
  },
  {
    id: "agent-richmond-bearing",
    type: "agent_raised",
    severity: "info",
    label: "Richmond Processor #2 Bearing Wear",
    detail: "Vibration analysis detected early bearing wear on Richmond Processor #2. Estimated 30-day window before intervention needed. Work order created.",
    kpi: null,
    raisedBy: { agentId: "maint-pred", agentName: "Maintenance Agent", department: "VP Maintenance" },
    targetDepts: ["vp-maint", "vp-ops"],
    crossDept: true,
    timestamp: "2026-02-24T05:45:00Z",
  },
  {
    id: "agent-training-overdue",
    type: "agent_raised",
    severity: "info",
    label: "7 Training Certifications Overdue",
    detail: "7 employees across 3 sites have overdue safety training certifications. Non-compliance risk if not resolved within 14 days.",
    kpi: { actual: 93, target: 100, unit: "%", metric: "Training Completion" },
    raisedBy: { agentId: "ppl-train", agentName: "Training Agent", department: "VP People" },
    targetDepts: ["vp-people", "vp-hse"],
    crossDept: true,
    timestamp: "2026-02-24T08:30:00Z",
  },
  {
    id: "agent-carbon-price-up",
    type: "agent_raised",
    severity: "info",
    label: "Carbon Black Price +2.1%",
    detail: "N330 carbon black spot price increased 2.1% this week to $680/T. Positive margin impact if sustained — recommend locking in offtake at new rate.",
    kpi: null,
    raisedBy: { agentId: "mktg-price", agentName: "Pricing Agent", department: "VP Marketing" },
    targetDepts: ["vp-marketing", "vp-finance"],
    crossDept: true,
    timestamp: "2026-02-24T09:30:00Z",
  },
];


// ─── Combined & Sorted ──────────────────────────────────────────────────

export const getAllAlerts = (simDate) => {
  const kpiAlerts = computeKpiAlerts(simDate);
  const all = [...kpiAlerts, ...agentRaisedAlerts];
  // Sort: critical first, then warning, then info; within severity by timestamp desc
  const sevOrder = { critical: 0, warning: 1, info: 2 };
  return all.sort((a, b) => {
    if (sevOrder[a.severity] !== sevOrder[b.severity]) return sevOrder[a.severity] - sevOrder[b.severity];
    return new Date(b.timestamp) - new Date(a.timestamp);
  });
};

/**
 * Get alerts relevant to a specific VP department
 * Returns both own-department alerts AND cross-departmental alerts targeting this VP
 */
export const getAlertsForDept = (vpKey, simDate) => {
  return getAllAlerts(simDate).filter(a => a.targetDepts.includes(vpKey));
};

/**
 * Get alerts relevant to an executive (CEO/COO) — returns all alerts
 */
export const getExecutiveAlerts = (simDate) => getAllAlerts(simDate);

/**
 * Get alerts filtered by role lens for the main dashboard
 */
export const getDashboardAlerts = (role, simDate) => {
  const all = getAllAlerts(simDate);
  if (role === "CEO") return all; // CEO sees everything
  // COO default — ops-focused + all critical
  return all.filter(a =>
    a.targetDepts.some(d => ["vp-ops", "vp-maint", "vp-hse", "vp-logistics", "vp-project", "vp-engineering"].includes(d)) || a.severity === "critical"
  );
};

/** Severity color mapping */
export const severityColor = (sev) =>
  sev === "critical" ? T.danger : sev === "warning" ? T.warn : T.blue;

/** Severity icon (unicode) */
export const severityIcon = (sev) =>
  sev === "critical" ? "●" : sev === "warning" ? "◐" : "○";
