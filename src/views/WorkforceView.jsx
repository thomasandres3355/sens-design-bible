import { useState, useMemo } from "react";
import { T } from "../data/theme";
import { activeSites, allProjectSites } from "../data/sites";
import { EngineLight, KpiCard, StatusPill, Progress, Card, DataTable, TabBar, StyledSelect, DraggableGrid, DraggableCardRow } from "../components/ui";

/* ─── Per-Site Workforce Data ─── */
const workforceDataBySite = {
  "Noble OK":    { employees: 7, contractors: 18, openRoles: 1, turnover: 10, training: 96, engagement: 82, tenure: 2.4, costM: 1.2, firms: 3 },
  "Richmond VA":    { employees: 12, contractors: 35, openRoles: 2, turnover: 12, training: 94, engagement: 80, tenure: 1.9, costM: 2.1, firms: 4 },
  "Tucson AZ":      { employees: 12, contractors: 38, openRoles: 2, turnover: 15, training: 92, engagement: 76, tenure: 1.5, costM: 2.2, firms: 5 },
  "Baton Rouge": { employees: 7, contractors: 22, openRoles: 1, turnover: 18, training: 90, engagement: 74, tenure: 1.2, costM: 1.1, firms: 3 },
  "Columbus OH":   { employees: 7, contractors: 23, openRoles: 2, turnover: 16, training: 91, engagement: 77, tenure: 0.8, costM: 1.0, firms: 3 },
};

const contractorsBySite = {
  "Noble OK":    [
    { firm: "Texas Vessel", safety: 95, quality: 92, schedule: 88, cost: 90 },
    { firm: "Advanced Fab", safety: 93, quality: 91, schedule: 89, cost: 91 },
    { firm: "Titan Logistics", safety: 91, quality: 89, schedule: 90, cost: 86 },
  ],
  "Richmond VA":    [
    { firm: "Cissell Mueller", safety: 90, quality: 88, schedule: 85, cost: 87 },
    { firm: "Brown & Root", safety: 92, quality: 90, schedule: 91, cost: 88 },
    { firm: "Phoenix Steel", safety: 88, quality: 85, schedule: 84, cost: 85 },
    { firm: "Gulf Piping", safety: 86, quality: 84, schedule: 82, cost: 83 },
  ],
  "Tucson AZ":      [
    { firm: "Texas Vessel", safety: 95, quality: 92, schedule: 88, cost: 90 },
    { firm: "Phoenix Steel", safety: 88, quality: 85, schedule: 84, cost: 85 },
    { firm: "Gulf Piping", safety: 86, quality: 84, schedule: 82, cost: 83 },
    { firm: "Midwest Electric", safety: 89, quality: 87, schedule: 86, cost: 88 },
    { firm: "Titan Logistics", safety: 91, quality: 89, schedule: 90, cost: 86 },
  ],
  "Baton Rouge": [
    { firm: "Brown & Root", safety: 92, quality: 90, schedule: 91, cost: 88 },
    { firm: "Gulf Piping", safety: 86, quality: 84, schedule: 82, cost: 83 },
    { firm: "Midwest Electric", safety: 89, quality: 87, schedule: 86, cost: 88 },
  ],
  "Columbus OH":   [
    { firm: "Cissell Mueller", safety: 90, quality: 88, schedule: 85, cost: 87 },
    { firm: "Advanced Fab", safety: 93, quality: 91, schedule: 89, cost: 91 },
    { firm: "Titan Logistics", safety: 91, quality: 89, schedule: 90, cost: 86 },
  ],
};

const turnoverBySite = {
  "Noble OK":    [10, 12, 8, 11, 10, 10],
  "Richmond VA":    [13, 15, 11, 14, 12, 12],
  "Tucson AZ":      [16, 20, 14, 18, 15, 15],
  "Baton Rouge": [19, 22, 16, 20, 18, 18],
  "Columbus OH":   [17, 20, 14, 18, 16, 16],
};

const costBreakdownBySite = {
  "Noble OK":    [["Operations", "3", "$120K", "$0.4M"], ["Maintenance", "2", "$110K", "$0.2M"], ["Quality", "1", "$100K", "$0.1M"], ["Management", "2", "$150K", "$0.3M"], ["Contractors", "18", "$25K", "$0.5M"], ["TOTAL", "26", "\u2014", "$1.2M"]],
  "Richmond VA":    [["Operations", "6", "$120K", "$0.7M"], ["Maintenance", "3", "$110K", "$0.3M"], ["Quality", "1", "$100K", "$0.1M"], ["Management", "2", "$150K", "$0.3M"], ["Contractors", "35", "$25K", "$0.9M"], ["TOTAL", "47", "\u2014", "$2.1M"]],
  "Tucson AZ":      [["Operations", "6", "$120K", "$0.7M"], ["Maintenance", "3", "$110K", "$0.3M"], ["Quality", "1", "$100K", "$0.1M"], ["Management", "2", "$150K", "$0.3M"], ["Contractors", "38", "$25K", "$1.0M"], ["TOTAL", "50", "\u2014", "$2.2M"]],
  "Baton Rouge": [["Operations", "3", "$120K", "$0.4M"], ["Maintenance", "2", "$110K", "$0.2M"], ["Quality", "1", "$100K", "$0.1M"], ["Management", "2", "$150K", "$0.3M"], ["Contractors", "22", "$25K", "$0.6M"], ["TOTAL", "30", "\u2014", "$1.1M"]],
  "Columbus OH":   [["Operations", "3", "$120K", "$0.4M"], ["Maintenance", "2", "$110K", "$0.2M"], ["Quality", "1", "$100K", "$0.1M"], ["Management", "2", "$150K", "$0.3M"], ["Contractors", "23", "$25K", "$0.6M"], ["TOTAL", "31", "\u2014", "$1.0M"]],
};

const spendBySite = {
  "Noble OK":    [{ label: "EPC & HC", value: "$0.2M", pct: 49 }, { label: "Fabrication", value: "$0.1M", pct: 22 }, { label: "Supply", value: "$0.1M", pct: 20 }, { label: "Other", value: "$0.04M", pct: 9 }],
  "Richmond VA":    [{ label: "EPC & HC", value: "$0.4M", pct: 47 }, { label: "Fabrication", value: "$0.2M", pct: 22 }, { label: "Supply", value: "$0.2M", pct: 20 }, { label: "Other", value: "$0.1M", pct: 11 }],
  "Tucson AZ":      [{ label: "EPC & HC", value: "$0.5M", pct: 47 }, { label: "Fabrication", value: "$0.2M", pct: 22 }, { label: "Supply", value: "$0.2M", pct: 20 }, { label: "Other", value: "$0.1M", pct: 11 }],
  "Baton Rouge": [{ label: "EPC & HC", value: "$0.3M", pct: 47 }, { label: "Fabrication", value: "$0.1M", pct: 22 }, { label: "Supply", value: "$0.1M", pct: 20 }, { label: "Other", value: "$0.1M", pct: 11 }],
  "Columbus OH":   [{ label: "EPC & HC", value: "$0.3M", pct: 47 }, { label: "Fabrication", value: "$0.1M", pct: 22 }, { label: "Supply", value: "$0.1M", pct: 21 }, { label: "Other", value: "$0.1M", pct: 10 }],
};

const safetyTrendBySite = {
  "Noble OK":    { trir: [0.3, 0.2, 0.2, 0.2, 0.2, 0.2], lti: [120, 150, 160, 170, 175, 180] },
  "Richmond VA":    { trir: [1.0, 1.2, 1.0, 0.9, 0.8, 0.8], lti: [56, 86, 100, 120, 135, 142] },
  "Tucson AZ":      { trir: [1.5, 1.4, 1.3, 1.2, 1.2, 1.2], lti: [20, 40, 55, 70, 85, 95] },
  "Baton Rouge": { trir: [0.8, 0.6, 0.5, 0.5, 0.5, 0.5], lti: [10, 20, 30, 40, 50, 56] },
  "Columbus OH":   { trir: [1.0, 1.0, 0.9, 0.8, 0.8, 0.8], lti: [56, 86, 100, 120, 135, 142] },
};

const safetyActionsBySite = {
  "Noble OK":    [["Machine guarding retrofit", "Noble OK", "2026-03-31", "Maintenance", "yellow"]],
  "Richmond VA":    [["Electrical panel labeling", "Richmond VA", "2026-03-30", "Electrical", "yellow"]],
  "Tucson AZ":      [["Guardrail installation", "Tucson AZ", "2026-03-15", "Operations", "yellow"]],
  "Baton Rouge": [["Emergency eyewash station", "Baton Rouge", "2026-02-28", "Facilities", "red"]],
  "Columbus OH":   [["Fall protection training", "Columbus OH", "2026-03-22", "Safety", "yellow"]],
};

const leadingIndicatorsBySite = {
  "Noble OK":    [{ label: "Safety Observations", value: 12, color: T.green }, { label: "Toolbox Talks", value: 4, color: T.green }, { label: "Training Hours", value: 8, color: T.accent }, { label: "Safety Audits", value: 3, color: T.green }],
  "Richmond VA":    [{ label: "Safety Observations", value: 22, color: T.green }, { label: "Toolbox Talks", value: 6, color: T.green }, { label: "Training Hours", value: 12, color: T.accent }, { label: "Safety Audits", value: 3, color: T.green }],
  "Tucson AZ":      [{ label: "Safety Observations", value: 28, color: T.green }, { label: "Toolbox Talks", value: 5, color: T.green }, { label: "Training Hours", value: 10, color: T.accent }, { label: "Safety Audits", value: 2, color: T.green }],
  "Baton Rouge": [{ label: "Safety Observations", value: 8, color: T.green }, { label: "Toolbox Talks", value: 4, color: T.green }, { label: "Training Hours", value: 8, color: T.accent }, { label: "Safety Audits", value: 2, color: T.green }],
  "Columbus OH":   [{ label: "Safety Observations", value: 18, color: T.green }, { label: "Toolbox Talks", value: 5, color: T.green }, { label: "Training Hours", value: 10, color: T.accent }, { label: "Safety Audits", value: 2, color: T.green }],
};

const laggingIndicatorsBySite = {
  "Noble OK":    [{ label: "Lost Time Injuries", value: 0, color: T.green }, { label: "Recordable Injuries", value: 0, color: T.green }, { label: "Near Misses", value: 1, color: T.warn }, { label: "Safety Violations", value: 0, color: T.green }],
  "Richmond VA":    [{ label: "Lost Time Injuries", value: 0, color: T.green }, { label: "Recordable Injuries", value: 0, color: T.green }, { label: "Near Misses", value: 2, color: T.warn }, { label: "Safety Violations", value: 0, color: T.green }],
  "Tucson AZ":      [{ label: "Lost Time Injuries", value: 0, color: T.green }, { label: "Recordable Injuries", value: 1, color: T.accent }, { label: "Near Misses", value: 3, color: T.warn }, { label: "Safety Violations", value: 0, color: T.green }],
  "Baton Rouge": [{ label: "Lost Time Injuries", value: 0, color: T.green }, { label: "Recordable Injuries", value: 0, color: T.green }, { label: "Near Misses", value: 1, color: T.warn }, { label: "Safety Violations", value: 0, color: T.green }],
  "Columbus OH":   [{ label: "Lost Time Injuries", value: 0, color: T.green }, { label: "Recordable Injuries", value: 0, color: T.green }, { label: "Near Misses", value: 1, color: T.warn }, { label: "Safety Violations", value: 0, color: T.green }],
};

/* ─── All data (global aggregates) ─── */
const allContractors = [
  { firm: "Texas Vessel", safety: 95, quality: 92, schedule: 88, cost: 90 },
  { firm: "Cissell Mueller", safety: 90, quality: 88, schedule: 85, cost: 87 },
  { firm: "Brown & Root", safety: 92, quality: 90, schedule: 91, cost: 88 },
  { firm: "Phoenix Steel", safety: 88, quality: 85, schedule: 84, cost: 85 },
  { firm: "Advanced Fab", safety: 93, quality: 91, schedule: 89, cost: 91 },
  { firm: "Gulf Piping", safety: 86, quality: 84, schedule: 82, cost: 83 },
  { firm: "Midwest Electric", safety: 89, quality: 87, schedule: 86, cost: 88 },
  { firm: "Titan Logistics", safety: 91, quality: 89, schedule: 90, cost: 86 },
];

const allSafetyBySite = [
  { site: "Noble OK", lti: 180, trir: 0.2, actions: 0, permits: 3, obs: 12 },
  { site: "Richmond VA", lti: 142, trir: 0.8, actions: 1, permits: 4, obs: 18 },
  { site: "Tucson AZ", lti: 95, trir: 1.2, actions: 2, permits: 4, obs: 22 },
  { site: "Baton Rouge", lti: 56, trir: 0.5, actions: 0, permits: 3, obs: 8 },
  { site: "Columbus OH", lti: 142, trir: 0.8, actions: 2, permits: 3, obs: 15 },
];

const allSafetyActions = [
  ["Guardrail installation", "Tucson AZ", "2026-03-15", "Operations", "yellow"],
  ["Machine guarding retrofit", "Noble OK", "2026-03-31", "Maintenance", "yellow"],
  ["Emergency eyewash station", "Baton Rouge", "2026-02-28", "Facilities", "red"],
  ["Fall protection training", "Columbus OH", "2026-03-22", "Safety", "yellow"],
  ["Electrical panel labeling", "Richmond VA", "2026-03-30", "Electrical", "yellow"],
];

const allLeadingIndicators = [
  { label: "Safety Observations", value: 100, color: T.green },
  { label: "Toolbox Talks", value: 24, color: T.green },
  { label: "Training Hours", value: 48, color: T.accent },
  { label: "Safety Audits", value: 12, color: T.green },
];

const allLaggingIndicators = [
  { label: "Lost Time Injuries", value: 0, color: T.green },
  { label: "Recordable Injuries", value: 1, color: T.accent },
  { label: "Near Misses", value: 8, color: T.warn },
  { label: "Safety Violations", value: 0, color: T.green },
];

export const WorkforceView = () => {
  const [tab, setTab] = useState("headcount");
  const [selectedSite, setSelectedSite] = useState("all");
  const [layoutLocked, setLayoutLocked] = useState(true);

  const siteLabel = selectedSite === "all" ? "All Sites" : selectedSite;

  // Calculate headcount by site
  const headcountBySite = useMemo(() => {
    const rows = activeSites.map(s => {
      const ops = Math.ceil(s.processors * 3);
      const maint = Math.ceil(s.processors * 1.5);
      const qual = 1;
      const mgmt = 2;
      const total = ops + maint + qual + mgmt;
      return [s.short, ops, maint, qual, mgmt, total];
    });
    rows.push(["Corporate HQ", 6, 3, 2, 1, 12]);
    const total = rows.reduce((a, r) => a + r[5], 0);
    rows.push(["TOTAL", "", "", "", "", total]);
    return rows;
  }, []);

  // Filtered headcount
  const filteredHeadcount = useMemo(() => {
    if (selectedSite === "all") return headcountBySite;
    const siteRow = headcountBySite.find(r => r[0] === selectedSite);
    if (!siteRow) return headcountBySite;
    return [siteRow, ["TOTAL", "", "", "", "", siteRow[5]]];
  }, [selectedSite, headcountBySite]);

  // Filtered workforce KPIs
  const wfData = useMemo(() => {
    if (selectedSite === "all") {
      return { employees: 52, contractors: 148, total: 200, openRoles: 8, tenure: "1.8 yrs", costM: "$8.4M", turnover: 14, training: 93, engagement: 78, firms: 8 };
    }
    const d = workforceDataBySite[selectedSite];
    if (!d) return { employees: 52, contractors: 148, total: 200, openRoles: 8, tenure: "1.8 yrs", costM: "$8.4M", turnover: 14, training: 93, engagement: 78, firms: 8 };
    return {
      employees: d.employees, contractors: d.contractors, total: d.employees + d.contractors,
      openRoles: d.openRoles, tenure: `${d.tenure} yrs`, costM: `$${d.costM}M`,
      turnover: d.turnover, training: d.training, engagement: d.engagement, firms: d.firms,
    };
  }, [selectedSite]);

  // Filtered contractors
  const filteredContractors = useMemo(() => {
    if (selectedSite === "all") return allContractors;
    return contractorsBySite[selectedSite] || allContractors;
  }, [selectedSite]);

  // Filtered contractor spend
  const filteredSpend = useMemo(() => {
    if (selectedSite === "all") return [
      { label: "EPC & HC", value: "$1.8M", pct: 47 },
      { label: "Fabrication", value: "$0.8M", pct: 22 },
      { label: "Supply", value: "$0.8M", pct: 20 },
      { label: "Other", value: "$0.4M", pct: 11 },
    ];
    return spendBySite[selectedSite] || spendBySite["Noble OK"];
  }, [selectedSite]);

  // Filtered turnover
  const filteredTurnover = useMemo(() => {
    if (selectedSite === "all") return [15, 18, 12, 16, 14, 14];
    return turnoverBySite[selectedSite] || [15, 18, 12, 16, 14, 14];
  }, [selectedSite]);

  // Filtered cost breakdown
  const filteredCostBreakdown = useMemo(() => {
    if (selectedSite === "all") return [
      ["Operations", "15", "$120K", "$1.8M"],
      ["Maintenance", "22", "$110K", "$2.4M"],
      ["Quality", "5", "$100K", "$0.5M"],
      ["Management", "10", "$150K", "$1.5M"],
      ["Contractors", "148", "$25K", "$3.7M"],
      ["TOTAL", "200", "\u2014", "$8.4M"],
    ];
    return costBreakdownBySite[selectedSite] || costBreakdownBySite["Noble OK"];
  }, [selectedSite]);

  // Filtered safety data
  const filteredSafetyBySite = useMemo(() => {
    if (selectedSite === "all") return allSafetyBySite;
    return allSafetyBySite.filter(s => s.site === selectedSite);
  }, [selectedSite]);

  const filteredSafetyActions = useMemo(() => {
    if (selectedSite === "all") return allSafetyActions;
    return safetyActionsBySite[selectedSite] || [];
  }, [selectedSite]);

  const filteredLeading = useMemo(() => {
    if (selectedSite === "all") return allLeadingIndicators;
    return leadingIndicatorsBySite[selectedSite] || allLeadingIndicators;
  }, [selectedSite]);

  const filteredLagging = useMemo(() => {
    if (selectedSite === "all") return allLaggingIndicators;
    return laggingIndicatorsBySite[selectedSite] || allLaggingIndicators;
  }, [selectedSite]);

  const filteredSafetyTrend = useMemo(() => {
    if (selectedSite === "all") return { trir: [0.8, 1.0, 0.9, 0.8, 0.8, 0.8], lti: [56, 95, 128, 142, 142, 142] };
    return safetyTrendBySite[selectedSite] || { trir: [0.8, 1.0, 0.9, 0.8, 0.8, 0.8], lti: [56, 95, 128, 142, 142, 142] };
  }, [selectedSite]);

  // Safety KPIs
  const safetyKpis = useMemo(() => {
    if (selectedSite === "all") {
      return { lti: 142, trir: 0.8, actions: 5, permits: 24, compliance: "100%", obs: 100 };
    }
    const s = allSafetyBySite.find(x => x.site === selectedSite);
    if (!s) return { lti: 142, trir: 0.8, actions: 5, permits: 24, compliance: "100%", obs: 100 };
    return { lti: s.lti, trir: s.trir, actions: s.actions, permits: s.permits, compliance: "100%", obs: s.obs };
  }, [selectedSite]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Site Selector */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <TabBar
          tabs={[
            { key: "headcount", label: "Headcount" },
            { key: "contractors", label: "Contractors" },
            { key: "safety", label: "Safety" }
          ]}
          active={tab}
          onChange={setTab}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, color: T.textDim, fontWeight: 600 }}>SCOPE</span>
          <StyledSelect
            value={selectedSite}
            onChange={v => setSelectedSite(v)}
            options={[
              { value: "all", label: "All Sites (Global)" },
              ...activeSites.map(s => ({ value: s.short, label: s.short })),
            ]}
          />
        </div>
      </div>

      {tab === "headcount" && (
        <DraggableGrid
          widgets={[
            {
              id: "wf-status-lights",
              label: "Status Overview",
              render: () => (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <EngineLight on={wfData.openRoles > 0} label={`${wfData.openRoles} Open Roles`} color={wfData.openRoles > 0 ? T.warn : T.green} />
                  <EngineLight on={wfData.turnover > 12} color={wfData.turnover > 12 ? T.warn : T.green} label={`Turnover ${wfData.turnover}%`} />
                  <EngineLight label={`Training ${wfData.training}%`} color={wfData.training >= 90 ? T.green : T.warn} />
                  <EngineLight on={wfData.engagement < 80} color={wfData.engagement < 80 ? T.warn : T.green} label={`Engagement ${wfData.engagement}%`} />
                  <EngineLight label={`Avg Tenure ${wfData.tenure}`} color={T.green} />
                </div>
              ),
            },
            {
              id: "wf-kpis",
              label: "Workforce KPIs",
              render: () => (
                <DraggableCardRow
                  items={[
                    { id: "kpi-employees", label: "Employees", value: String(wfData.employees), color: T.green, target: 65, threshold: 45 },
                    { id: "kpi-contractors", label: "Contractors", value: String(wfData.contractors), color: T.accent, target: 160, threshold: 100 },
                    { id: "kpi-total-workforce", label: "Total Workforce", value: String(wfData.total), color: T.blue, target: 225 },
                    { id: "kpi-open-roles", label: "Open Roles", value: String(wfData.openRoles), color: T.warn, target: 0, invert: true, threshold: 10 },
                    { id: "kpi-avg-tenure", label: "Avg Tenure", value: wfData.tenure, color: T.green, target: "2.5 yrs", threshold: "1.0 yr" },
                    { id: "kpi-workforce-cost", label: "Workforce Cost", value: wfData.costM, color: T.accent, target: "$10.0M" },
                  ]}
                  locked={layoutLocked}
                  storageKey="sens-workforce-people-cards-kpis"
                  renderItem={(item) => <KpiCard label={item.label} value={item.value} color={item.color} target={item.target} threshold={item.threshold} invert={item.invert} />}
                />
              ),
            },
            {
              id: "wf-headcount-table",
              label: "Headcount by Site",
              render: () => (
                <Card title={`Headcount by Site${selectedSite !== "all" ? ` \u2014 ${selectedSite}` : ""}`}>
                  <DataTable
                    columns={["Site", "Operations", "Maintenance", "Quality", "Management", "Total"]}
                    rows={filteredHeadcount.map(r => [
                      r[0],
                      r[1],
                      r[2],
                      r[3],
                      r[4],
                      typeof r[5] === "number" ? r[5] : <span style={{ fontWeight: 600, color: T.accent }}>{r[5]}</span>
                    ])}
                  />
                </Card>
              ),
            },
            {
              id: "wf-composition",
              label: "Workforce Composition",
              render: () => (
                <Card title="Workforce Composition">
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12 }}>
                    {[
                      { val: String(wfData.employees), label: "Direct Employees", color: T.green },
                      { val: String(wfData.contractors), label: "Contractors", color: T.accent },
                      { val: String(wfData.firms), label: "Firms", color: T.blue },
                      { val: String(wfData.openRoles), label: "Open Roles", color: T.warn },
                    ].map((item, i) => (
                      <div key={i} style={{ background: T.bg0, borderRadius: 8, padding: 12, textAlign: "center" }}>
                        <div style={{ fontSize: 24, fontWeight: 700, color: item.color }}>{item.val}</div>
                        <div style={{ fontSize: 11, color: T.textDim, marginTop: 4 }}>{item.label}</div>
                      </div>
                    ))}
                  </div>
                </Card>
              ),
            },
            {
              id: "wf-turnover-trend",
              label: "Turnover Trend",
              render: () => (
                <Card title={`Turnover Trend (6 months)${selectedSite !== "all" ? ` \u2014 ${selectedSite}` : ""}`}>
                  <div style={{ display: "flex", gap: 6, marginBottom: 8, fontSize: 10 }}>
                    <span style={{ color: T.textDim }}>Target: <span style={{ color: T.green, fontWeight: 600 }}>10%</span></span>
                    <span style={{ color: T.textDim, marginLeft: 8 }}>Fail: <span style={{ color: T.danger, fontWeight: 600 }}>20%</span></span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10 }}>
                    {["Aug", "Sep", "Oct", "Nov", "Dec", "Jan"].map((m, i) => (
                      <div key={i} style={{ textAlign: "center" }}>
                        <div style={{ height: 80, background: T.bg0, borderRadius: 6, marginBottom: 6, display: "flex", alignItems: "flex-end", justifyContent: "center", padding: "4px 0", position: "relative" }}>
                          {/* Target line at 10% */}
                          <div style={{ position: "absolute", left: 0, right: 0, bottom: `${10 + 4}px`, height: 1, background: T.green, opacity: 0.6, zIndex: 1 }} />
                          {/* Fail line at 20% */}
                          <div style={{ position: "absolute", left: 0, right: 0, bottom: `${20 + 4}px`, height: 1, background: T.danger, opacity: 0.6, zIndex: 1, borderTop: `1px dashed ${T.danger}` }} />
                          <div style={{ width: "60%", height: `${filteredTurnover[i]}px`, background: filteredTurnover[i] >= 20 ? T.danger : filteredTurnover[i] > 10 ? T.warn : T.green, borderRadius: 2, position: "relative", zIndex: 2 }} />
                        </div>
                        <div style={{ fontSize: 11, color: T.textDim }}>{m}</div>
                        <div style={{ fontSize: 10, color: filteredTurnover[i] >= 20 ? T.danger : filteredTurnover[i] > 10 ? T.warn : T.green, marginTop: 2, fontWeight: 600 }}>{filteredTurnover[i]}%</div>
                      </div>
                    ))}
                  </div>
                </Card>
              ),
            },
            {
              id: "wf-cost-breakdown",
              label: "Cost Breakdown",
              render: () => (
                <Card title={`Workforce Cost Breakdown${selectedSite !== "all" ? ` \u2014 ${selectedSite}` : ""}`}>
                  <DataTable
                    columns={["Category", "Headcount", "Cost/Person", "Total Cost"]}
                    rows={filteredCostBreakdown}
                  />
                </Card>
              ),
            },
          ]}
          storageKey="sens-workforce-headcount-layout"
          locked={layoutLocked}
          onLockedChange={setLayoutLocked}
        />
      )}

      {tab === "contractors" && (
        <DraggableGrid
          widgets={[
            {
              id: "contractors-status-lights",
              label: "Status Overview",
              render: () => (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <EngineLight label="All firms pre-qualified" color={T.green} />
                  <EngineLight label="TRIR compliance" color={T.green} />
                  <EngineLight label="Insurance verified" color={T.green} />
                  <EngineLight on color={T.warn} label="TX Vessel schedule watch" />
                </div>
              ),
            },
            {
              id: "contractors-kpis",
              label: "Contractor KPIs",
              render: () => (
                <DraggableCardRow
                  items={[
                    { id: "kpi-total-contractors", label: "Total Contractors", value: String(wfData.contractors), color: T.accent, target: 160 },
                    { id: "kpi-firms", label: "Firms", value: String(filteredContractors.length), color: T.blue },
                    { id: "kpi-avg-safety-score", label: "Avg Safety Score", value: `${Math.round(filteredContractors.reduce((s, c) => s + c.safety, 0) / filteredContractors.length)}/100`, color: T.green, target: "95/100", threshold: "85/100" },
                  ]}
                  locked={layoutLocked}
                  storageKey="sens-workforce-contractors-cards-kpis"
                  renderItem={(item) => <KpiCard label={item.label} value={item.value} color={item.color} target={item.target} threshold={item.threshold} />}
                />
              ),
            },
            {
              id: "contractors-scorecard",
              label: "Performance Scorecard",
              render: () => (
                <Card title={`Contractor Performance Scorecard${selectedSite !== "all" ? ` \u2014 ${selectedSite}` : ""}`}>
                  <DataTable
                    compact
                    columns={["Firm", "Safety", "Quality", "Schedule", "Cost"]}
                    rows={filteredContractors.map(c => [
                      c.firm,
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <div style={{ width: 40 }}><Progress pct={c.safety} color={c.safety >= 90 ? T.green : c.safety >= 80 ? T.warn : T.danger} h={4} /></div>
                        <span style={{ fontSize: 11, color: c.safety >= 90 ? T.green : c.safety >= 80 ? T.warn : T.danger, fontWeight: 600 }}>{c.safety}</span>
                      </div>,
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <div style={{ width: 40 }}><Progress pct={c.quality} color={c.quality >= 90 ? T.green : c.quality >= 80 ? T.warn : T.danger} h={4} /></div>
                        <span style={{ fontSize: 11, color: c.quality >= 90 ? T.green : c.quality >= 80 ? T.warn : T.danger, fontWeight: 600 }}>{c.quality}</span>
                      </div>,
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <div style={{ width: 40 }}><Progress pct={c.schedule} color={c.schedule >= 90 ? T.green : c.schedule >= 80 ? T.warn : T.danger} h={4} /></div>
                        <span style={{ fontSize: 11, color: c.schedule >= 90 ? T.green : c.schedule >= 80 ? T.warn : T.danger, fontWeight: 600 }}>{c.schedule}</span>
                      </div>,
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <div style={{ width: 40 }}><Progress pct={c.cost} color={c.cost >= 90 ? T.green : c.cost >= 80 ? T.warn : T.danger} h={4} /></div>
                        <span style={{ fontSize: 11, color: c.cost >= 90 ? T.green : c.cost >= 80 ? T.warn : T.danger, fontWeight: 600 }}>{c.cost}</span>
                      </div>
                    ])}
                  />
                </Card>
              ),
            },
            {
              id: "contractors-spend",
              label: "Spend by Category",
              render: () => (
                <Card title={`Contractor Spend by Category${selectedSite !== "all" ? ` \u2014 ${selectedSite}` : ""}`}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
                    {filteredSpend.map((item, i) => (
                      <div key={i}>
                        <div style={{ marginBottom: 8 }}>
                          <div style={{ fontSize: 11, color: T.textDim, marginBottom: 4 }}>{item.label}</div>
                          <Progress pct={item.pct} color={T.accent} h={6} />
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                </Card>
              ),
            },
            {
              id: "contractors-prequalification",
              label: "Pre-Qualification Status",
              render: () => (
                <Card title="Pre-Qualification Status">
                  <DataTable
                    compact
                    columns={["Firm", "Safety Cert", "Insurance", "References", "Status"]}
                    rows={filteredContractors.map(c => [
                      c.firm,
                      <StatusPill status="green" />,
                      <StatusPill status="green" />,
                      <StatusPill status="green" />,
                      <StatusPill status="green" />
                    ])}
                  />
                </Card>
              ),
            },
          ]}
          storageKey="sens-workforce-contractors-layout"
          locked={layoutLocked}
          onLockedChange={setLayoutLocked}
        />
      )}

      {tab === "safety" && (
        <DraggableGrid
          widgets={[
            {
              id: "safety-status-lights",
              label: "Status Overview",
              render: () => (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <EngineLight label={`Zero LTI ${safetyKpis.lti} days`} color={T.green} />
                  <EngineLight on={safetyKpis.trir > 0.5} color={safetyKpis.trir > 0.5 ? T.warn : T.green} label={`TRIR ${safetyKpis.trir} target <0.5`} />
                  <EngineLight label="Environmental 100%" color={T.green} />
                  <EngineLight label="Zero Waste" color={T.green} />
                  <EngineLight label="Leading Indicators up" color={T.green} />
                </div>
              ),
            },
            {
              id: "safety-kpis",
              label: "Safety KPIs",
              render: () => (
                <DraggableCardRow
                  items={[
                    { id: "kpi-days-since-lti", label: "Days Since LTI", value: String(safetyKpis.lti), color: T.green, target: 365, threshold: 90 },
                    { id: "kpi-trir", label: "TRIR", value: String(safetyKpis.trir), color: safetyKpis.trir > 0.5 ? T.warn : T.green, target: 0.5, threshold: 1.0, invert: true },
                    { id: "kpi-open-actions", label: "Open Actions", value: String(safetyKpis.actions), color: T.accent },
                    { id: "kpi-active-permits", label: "Active Permits", value: String(safetyKpis.permits), color: T.blue },
                    { id: "kpi-compliance", label: "Compliance", value: safetyKpis.compliance, color: T.green, target: "100%", threshold: "95%" },
                    { id: "kpi-observations-mo", label: "Observations/mo", value: String(safetyKpis.obs), color: T.accent },
                  ]}
                  locked={layoutLocked}
                  storageKey="sens-workforce-safety-cards-kpis"
                  renderItem={(item) => <KpiCard label={item.label} value={item.value} color={item.color} target={item.target} threshold={item.threshold} invert={item.invert} />}
                />
              ),
            },
            {
              id: "safety-leading-indicators",
              label: "Leading Indicators",
              render: () => (
                <Card title={`Leading Indicators${selectedSite !== "all" ? ` \u2014 ${selectedSite}` : ""}`}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {filteredLeading.map((item, i) => (
                      <div key={i}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                          <span style={{ fontSize: 12, color: T.textMid }}>{item.label}</span>
                          <span style={{ fontSize: 12, fontWeight: 600, color: item.color }}>{item.value}</span>
                        </div>
                        <Progress pct={Math.min(100, (item.value / 100) * 100)} color={item.color} h={6} />
                      </div>
                    ))}
                  </div>
                </Card>
              ),
            },
            {
              id: "safety-lagging-indicators",
              label: "Lagging Indicators",
              render: () => (
                <Card title={`Lagging Indicators${selectedSite !== "all" ? ` \u2014 ${selectedSite}` : ""}`}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {filteredLagging.map((item, i) => (
                      <div key={i} style={{ padding: "10px 0", borderBottom: i < 3 ? `1px solid ${T.border}` : "none" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 12, color: T.textMid }}>{item.label}</span>
                          <span style={{ fontSize: 16, fontWeight: 700, color: item.color }}>{item.value}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              ),
            },
            ...(selectedSite === "all" ? [{
              id: "safety-performance-by-site",
              label: "Safety Performance by Site",
              render: () => (
                <Card title="Safety Performance by Site">
                  <DataTable
                    compact
                    columns={["Site", "Days LTI", "TRIR", "Actions", "Permits", "Obs/mo"]}
                    rows={filteredSafetyBySite.map(s => [
                      s.site,
                      <span style={{ color: s.lti >= 100 ? T.green : T.warn, fontWeight: 600 }}>{s.lti}</span>,
                      <span style={{ color: s.trir < 0.5 ? T.green : s.trir < 1 ? T.warn : T.danger, fontWeight: 600 }}>{s.trir}</span>,
                      s.actions,
                      s.permits,
                      s.obs
                    ])}
                  />
                </Card>
              ),
            }] : []),
            {
              id: "safety-trend",
              label: "Safety Trend",
              render: () => (
                <Card title={`Safety Trend (6 months)${selectedSite !== "all" ? ` \u2014 ${selectedSite}` : ""}`}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10 }}>
                    {["Aug", "Sep", "Oct", "Nov", "Dec", "Jan"].map((m, i) => (
                      <div key={i}>
                        <div style={{ fontSize: 11, color: T.textDim, marginBottom: 8 }}>{m}</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          <div style={{ background: T.bg0, borderRadius: 4, padding: "6px 8px" }}>
                            <div style={{ fontSize: 10, color: T.textDim }}>TRIR</div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: filteredSafetyTrend.trir[i] <= 0.5 ? T.green : T.warn }}>{filteredSafetyTrend.trir[i]}</div>
                          </div>
                          <div style={{ background: T.bg0, borderRadius: 4, padding: "6px 8px" }}>
                            <div style={{ fontSize: 10, color: T.textDim }}>LTI</div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: T.green }}>{filteredSafetyTrend.lti[i]}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              ),
            },
            {
              id: "safety-actions",
              label: "Open Safety Actions",
              render: () => (
                <Card title={`Open Safety Actions${selectedSite !== "all" ? ` \u2014 ${selectedSite}` : ""}`}>
                  {filteredSafetyActions.length > 0 ? (
                    <DataTable
                      compact
                      columns={["Action", "Site", "Due Date", "Owner", "Status"]}
                      rows={filteredSafetyActions.map(a => [
                        a[0], a[1], a[2], a[3], <StatusPill status={a[4]} />
                      ])}
                    />
                  ) : (
                    <div style={{ color: T.textDim, fontSize: 12, padding: 12, textAlign: "center" }}>No open safety actions for this site</div>
                  )}
                </Card>
              ),
            },
          ]}
          storageKey="sens-workforce-safety-layout"
          locked={layoutLocked}
          onLockedChange={setLayoutLocked}
        />
      )}
    </div>
  );
};
