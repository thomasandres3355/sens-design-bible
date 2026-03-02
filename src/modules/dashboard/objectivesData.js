import { sitePlan } from "@core/data/sites";

/**
 * Build company strategic objectives from live metrics.
 * Extracted from DashboardView to be shared across Dashboard + VP landing pages.
 *
 * @param {Array} liveActiveSites — operational sites with uptime > 0
 * @param {Object} portfolio — aggregated portfolio metrics from getPortfolioMetrics()
 * @returns {Array} 3 objective objects with id, title, pct, status, owner, summary, metrics, intelligence, nav
 */
export function buildObjectives(liveActiveSites, portfolio) {
  const avgUptime = portfolio.avgUptime.toFixed(1);
  const totalTPH = portfolio.totalTPH;
  const totalPlannedTPH = liveActiveSites.reduce((a, s) => a + sitePlan(s).tphPlan, 0);

  const br = liveActiveSites.find(s => s.id === "baton-la");
  const brUptime = br ? br.uptime.toFixed(0) : "—";
  const col = liveActiveSites.find(s => s.id === "columbus-oh");
  const colUptime = col ? col.uptime.toFixed(0) : "—";

  const COMPANY_OBJECTIVES = [
    { title: "Close Series C — $162M Capital Raise", pct: 12, status: "yellow", progressTarget: 25 },
    { title: "Prove Operational Excellence Across 5 Sites", pct: 78, status: "green", progressTarget: 90 },
    { title: "Deliver Growth Pipeline On Schedule", pct: 22, status: "yellow", progressTarget: 35, progressThreshold: 15 },
  ];

  const obj1 = {
    owner: "Operational Proof Points for Investors",
    summary: `Investors need to see scalable operations before committing. Portfolio at ${avgUptime}% uptime (target 85%) and ${totalTPH.toFixed(1)} TPH. Baton Rouge at ${brUptime}% is the biggest credibility risk. Construction milestones at Noble B and Portland OR are key proof points.`,
    metrics: [
      { label: "Portfolio Uptime", value: `${avgUptime}%`, sub: "investors want 85%+" },
      { label: "Quality Score", value: "96.2%", sub: "N330 consistency" },
      { label: "Noble B Progress", value: "18%", sub: "on track" },
      { label: "Baton Rouge", value: `${brUptime}%`, sub: "credibility gap" },
    ],
    intelligence: [
      { dept: "Operations", agent: "Site Performance Agent", text: `Portfolio at ${avgUptime}% avg uptime — Baton Rouge (${brUptime}%) is the single biggest risk to the investor narrative`, severity: "warning" },
      { dept: "Quality", agent: "Quality Agent", text: "N330 grade consistency at 96.2% across all sites — strong investor proof point for product reliability", severity: "green" },
      { dept: "Projects", agent: "Construction Agent", text: "Noble B 18% complete and on schedule — positive milestone for investor confidence in expansion playbook", severity: "green" },
      { dept: "Maintenance", agent: "Maintenance Agent", text: "Predictive maintenance system caught 2 failures before downtime — demonstrable technology advantage for investor deck", severity: "green" },
    ],
    nav: "ops-plant",
  };

  const obj2 = {
    owner: "Site Performance, Uptime & Throughput",
    summary: `Portfolio at ${avgUptime}% avg uptime and ${totalTPH.toFixed(1)} TPH aggregate. Baton Rouge (${brUptime}%) is the clear outlier — heat exchanger + feed quality issues. Columbus OH (${colUptime}%) ramping as newest site. Mar 15 Noble turnaround will temporarily reduce capacity.`,
    metrics: [
      { label: "Avg Uptime", value: `${avgUptime}%`, sub: "target 85%" },
      { label: "Aggregate TPH", value: `${totalTPH.toFixed(1)}`, sub: `of ${totalPlannedTPH} capacity` },
      { label: "Open Work Orders", value: "34", sub: "12 critical" },
      { label: "Next Turnaround", value: "Mar 15", sub: "Noble OK" },
    ],
    intelligence: [
      { dept: "Maintenance", agent: "Maintenance Agent", text: "Baton Rouge heat exchanger degradation — 30-day failure window. Cleaning scheduled for Mar 15 turnaround. Richmond bearing wear also flagged", severity: "critical" },
      { dept: "Operations", agent: "Process Control Agent", text: "Feed quality variance at Baton Rouge — Gulf Coast Rubber running 3% below spec. Root cause of throughput shortfall", severity: "warning" },
      { dept: "Logistics", agent: "Supply Chain Agent", text: "Columbus OH feedstock buffer at 4 days vs 10-day target — Midwest Tire Recyclers delayed, alternate supplier contacted", severity: "warning" },
      { dept: "Operations", agent: "Scheduling Agent", text: `Processor optimization yielding +0.5 TPH week-over-week. Tucson leading at 91% uptime — benchmark for other sites`, severity: "green" },
    ],
    nav: "ops-plant",
  };

  const obj3 = {
    owner: "Construction Execution & Commissioning Readiness",
    summary: `Noble B (6 processors, $110M) at 18% — on track. Portland OR (3 processors, $52M) at 10% — 3-day schedule slip from steel delivery. 148 contractors across 8 firms, 100% Veriforce compliant. 9 TiPs machines in fabrication pipeline.`,
    metrics: [
      { label: "Noble B", value: "18%", sub: "6 proc · on track" },
      { label: "Portland OR", value: "10%", sub: "3 proc · 3-day slip" },
      { label: "Contractors", value: "148", sub: "100% compliant" },
      { label: "TiPs in Fab", value: "9", sub: "Series C reactors" },
    ],
    intelligence: [
      { dept: "Projects", agent: "Construction Agent", text: "Portland OR: steel delivery delay causing 3-day schedule slip — Brown & Root working recovery plan for Q2 milestone", severity: "warning" },
      { dept: "Projects", agent: "Fabrication Agent", text: "Series C reactor fabrication on track for April delivery — first 2 Noble B units progressing well through QC", severity: "green" },
      { dept: "Risk", agent: "Permitting Agent", text: "2 environmental permits due for renewal within 60 days — Noble OK and Richmond. Filing initiated, awaiting agency response", severity: "yellow" },
      { dept: "Process", agent: "Contractor Agent", text: "148 contractors, 100% Veriforce compliant. 24 confirmed for Noble turnaround Mar 15 — no gaps in construction workforce", severity: "green" },
    ],
    nav: "ops-projects",
  };

  return COMPANY_OBJECTIVES.map((base, i) => {
    const lensData = [obj1, obj2, obj3][i];
    return { ...base, id: `obj-${i + 1}`, ...lensData };
  });
}
