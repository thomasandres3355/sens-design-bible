import { useState, useMemo } from "react";
import { T } from "@core/theme/theme";
import { constructionSites, developmentSites, sitePlan } from "@core/data/sites";
import { modelData } from "./modelData";
import { KpiCard, StatusPill, Progress, Card, DataTable, TabBar, BarChart, EngineLight, DraggableGrid, DraggableCardRow } from "@core/ui";
import { useSimDate } from "@core/simulation/SimDateContext";
import { getSiteMetrics, getPortfolioMetrics } from "@modules/operations/timeEngine";

const fmtM = (v) => v == null ? "—" : `$${v.toFixed(1)}M`;
const variance = (actual, plan) => {
  if (!actual || !plan) return { pct: 0, color: T.textDim, label: "—" };
  const diff = ((actual / plan) - 1) * 100;
  return { pct: diff, color: diff >= 0 ? T.green : T.danger, label: `${diff >= 0 ? "+" : ""}${diff.toFixed(0)}%` };
};

const FEEDSTOCK_OPTIONS = [
  { key: "all", label: "All Feedstock" },
  { key: "tires", label: "Tires", match: "Tire Crumb" },
  { key: "coal", label: "Coal", match: "Coal" },
];

const FeedstockFilter = ({ value, onChange }) => (
  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
    <span style={{ fontSize: 11, color: T.textDim, marginRight: 4, fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5 }}>Feedstock</span>
    {FEEDSTOCK_OPTIONS.map(opt => (
      <button
        key={opt.key}
        onClick={() => onChange(opt.key)}
        style={{
          padding: "5px 14px",
          borderRadius: 20,
          border: `1px solid ${value === opt.key ? T.accent : T.border}`,
          background: value === opt.key ? T.accentBg : T.bg1,
          color: value === opt.key ? T.accent : T.textMid,
          fontSize: 12,
          fontWeight: value === opt.key ? 600 : 400,
          cursor: "pointer",
          transition: "all 0.2s",
        }}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

const filterByFeedstock = (sites, feedstockKey) => {
  if (feedstockKey === "all") return sites;
  const match = FEEDSTOCK_OPTIONS.find(o => o.key === feedstockKey)?.match;
  return sites.filter(s => s.feedstock === match);
};

// Tire-specific $/ton economics
const TIRE_REV_PER_TON = [
  { c: "Diluent ($8/gal)", v: "$47.8", p: 56, cl: T.blue },
  { c: "Carbon ($0.5/lb)", v: "$31.8", p: 37, cl: T.textMid },
  { c: "RNG ($1.5/mcf)", v: "$3.6", p: 4, cl: T.green },
  { c: "Metal", v: "$2.2", p: 3, cl: T.accent },
];
const TIRE_COST_PER_TON = [
  { c: "Raw Materials", v: "$22.5", p: 45, cl: T.textMid },
  { c: "Labor", v: "$18.2", p: 36, cl: T.blue },
  { c: "Utilities", v: "$6.8", p: 14, cl: T.warn },
  { c: "Equipment Maint", v: "$2.5", p: 5, cl: T.textDim },
];
const TIRE_REV_TOTAL = "$85.4/T";
const TIRE_COST_TOTAL = "$50.0/T";

// Coal-specific $/ton economics (larger scale, different product mix)
const COAL_REV_PER_TON = [
  { c: "Syngas ($4.5/mcf)", v: "$22.1", p: 42, cl: T.green },
  { c: "Liquid Fuels ($3.2/gal)", v: "$18.4", p: 35, cl: T.blue },
  { c: "Char / Ash ($40/T)", v: "$6.8", p: 13, cl: T.textMid },
  { c: "Sulfur Credits", v: "$5.2", p: 10, cl: T.accent },
];
const COAL_COST_PER_TON = [
  { c: "Coal Feedstock", v: "$8.5", p: 32, cl: T.textMid },
  { c: "Labor", v: "$6.4", p: 24, cl: T.blue },
  { c: "Utilities / Gas", v: "$7.2", p: 27, cl: T.warn },
  { c: "Equipment Maint", v: "$4.4", p: 17, cl: T.textDim },
];
const COAL_REV_TOTAL = "$52.5/T";
const COAL_COST_TOTAL = "$26.5/T";

export const FinanceView = () => {
  const { simDate, historyDepth, historyStart } = useSimDate();
  const [tab, setTab] = useState("pl");
  const [feedstock, setFeedstock] = useState("all");
  const [layoutLocked, setLayoutLocked] = useState(true);
  const tabs = [{ key: "pl", label: "P&L" }, { key: "performance", label: "Performance vs Plan" }, { key: "marketing", label: "Marketing" }];

  // Get live site data from time engine
  const allSites = useMemo(() => getSiteMetrics(simDate), [simDate]);
  const activeSites = useMemo(() => allSites.filter(s => s.status === "operational" && s.uptime > 0), [allSites]);

  const filteredActive = filterByFeedstock(activeSites, feedstock);
  const filteredDev = filterByFeedstock(developmentSites, feedstock);

  // Generate monthly data from time engine across history depth
  const monthlyData = useMemo(() => {
    const months = [];
    const startDate = new Date(historyStart + "T12:00:00");
    const endDate = new Date(simDate + "T12:00:00");

    // Walk month by month from historyStart to simDate
    const cursor = new Date(startDate);
    cursor.setDate(1); // Start of month
    while (cursor <= endDate) {
      const monthStr = cursor.toISOString().split("T")[0];
      const portfolio = getPortfolioMetrics(monthStr);
      const label = cursor.toLocaleDateString("en-US", { month: "short", year: "2-digit" });

      // Budget baseline grows with active site count over time
      const baseBudget = portfolio.activeSiteCount * 2200000; // ~$2.2M/site/month budget

      months.push({
        label,
        actual: Math.round(portfolio.totalRevMTD * 1000000), // RevMTD is in $M
        budget: Math.round(baseBudget),
      });

      cursor.setMonth(cursor.getMonth() + 1);
    }
    return months;
  }, [simDate, historyStart]);

  const avgMonthlyBudget = monthlyData.length > 0 ? monthlyData.reduce((a, d) => a + d.budget, 0) / monthlyData.length : 0;

  // Sparkline data from monthly portfolio metrics
  const { revSparkData, ebitdaSparkData } = useMemo(() => {
    const revData = monthlyData.map(m => Math.round((m.actual / 1000000) * 10) / 10);
    const ebitdaData = monthlyData.map(m => Math.round((m.actual / 1000000) * 0.35 * 10) / 10); // ~35% margin estimate
    return { revSparkData: revData.slice(-12), ebitdaSparkData: ebitdaData.slice(-12) };
  }, [monthlyData]);

  // Build per-site P&L rows with plan comparison
  const siteRows = filteredActive.map(s => {
    const plan = sitePlan(s);
    const revVar = variance(s.actualRevenue, plan.planRevenue);
    const ebitdaVar = variance(s.actualEBITDA, plan.planEBITDA);
    return {
      site: s, plan, revVar, ebitdaVar,
    };
  });

  const totalActualRev = filteredActive.reduce((a, s) => a + (s.actualRevenue || 0), 0);
  const totalPlanRev = filteredActive.reduce((a, s) => a + sitePlan(s).planRevenue, 0);
  const totalActualEBITDA = filteredActive.reduce((a, s) => a + (s.actualEBITDA || 0), 0);
  const totalPlanEBITDA = filteredActive.reduce((a, s) => a + sitePlan(s).planEBITDA, 0);

  // Pick $/ton economics based on filter
  const revPerTon = feedstock === "coal" ? COAL_REV_PER_TON : TIRE_REV_PER_TON;
  const costPerTon = feedstock === "coal" ? COAL_COST_PER_TON : TIRE_COST_PER_TON;
  const revTotal = feedstock === "coal" ? COAL_REV_TOTAL : TIRE_REV_TOTAL;
  const costTotal = feedstock === "coal" ? COAL_COST_TOTAL : TIRE_COST_TOTAL;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <TabBar tabs={tabs} active={tab} onChange={setTab} />
        {tab !== "marketing" && <FeedstockFilter value={feedstock} onChange={setFeedstock} />}
      </div>

      {tab === "pl" && (
        <DraggableGrid
          widgets={[
            {
              id: "fin-pl-lights",
              label: "Engine Lights",
              render: () => (
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                  <EngineLight on={false} color={T.green} label="Revenue vs Plan +19%" />
                  <EngineLight on={true} color={T.warn} label="Burn Rate +17%" />
                  <EngineLight on={false} color={T.green} label="AR Current" />
                  <EngineLight on={false} color={T.green} label="AP Current" />
                  <EngineLight on={true} color={T.warn} label="Customer Concentration" />
                </div>
              ),
            },
            {
              id: "fin-pl-kpis",
              label: "KPI Cards",
              render: () => {
                const totalCOGS = filteredActive.reduce((a, s) => a + (s.actualCOGS || 0), 0);
                const totalOpEx = filteredActive.reduce((a, s) => a + (s.actualOpEx || 0), 0);
                const avgMargin = filteredActive.length > 0 ? Math.round(filteredActive.reduce((a, s) => a + (s.actualGrossMargin || 0), 0) / filteredActive.length) : 0;
                return (
                  <DraggableCardRow
                    items={[
                      { id: "kpi-rev-ytd", label: "Rev YTD", value: fmtM(totalActualRev), sub: `Plan: ${fmtM(totalPlanRev)}`, color: T.green, target: totalPlanRev, threshold: totalPlanRev * 0.8, spark: revSparkData, sparkTarget: totalPlanRev },
                      { id: "kpi-cogs-ytd", label: "COGS YTD", value: fmtM(totalCOGS), sub: `${totalActualRev > 0 ? Math.round(totalCOGS / totalActualRev * 100) : 0}%`, color: T.textMid, target: totalPlanRev * 0.38, threshold: totalPlanRev * 0.5, invert: true },
                      { id: "kpi-gross-margin", label: "Gross Margin", value: `${avgMargin}%`, sub: "Target: 65%", color: avgMargin >= 60 ? T.green : T.warn, target: 65, threshold: 50 },
                      { id: "kpi-opex-ytd", label: "OpEx YTD", value: fmtM(totalOpEx), sub: "R&D + G&A", color: T.textMid, invert: true, target: totalPlanRev * 0.25, threshold: totalPlanRev * 0.35 },
                      { id: "kpi-ebitda", label: "EBITDA", value: fmtM(totalActualEBITDA), sub: `${totalActualRev > 0 ? Math.round(totalActualEBITDA / totalActualRev * 100) : 0}% margin`, color: T.green, target: totalPlanEBITDA, threshold: totalPlanEBITDA * 0.7, spark: ebitdaSparkData, sparkTarget: totalPlanEBITDA },
                      { id: "kpi-burn-rate", label: "Burn Rate", value: `$${activeSites.length > 0 ? (2.1 * filteredActive.length / activeSites.length).toFixed(1) : "0.0"}M/mo`, sub: "Cash runway", color: T.warn, target: "$1.8M/mo", invert: true, threshold: "$3.0M/mo" },
                    ]}
                    locked={layoutLocked}
                    storageKey="sens-finance-financial-cards-kpis"
                    renderItem={(item) => <KpiCard label={item.label} value={item.value} sub={item.sub} color={item.color} target={item.target} threshold={item.threshold} spark={item.spark} sparkTarget={item.sparkTarget} invert={item.invert} />}
                  />
                );
              },
            },
            {
              id: "fin-pl-chart",
              label: "Monthly Revenue vs Budget",
              render: () => (
                <Card title="Monthly Revenue vs Budget" action={<div style={{ display: "flex", gap: 12, fontSize: 11, color: T.textDim }}><div style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 10, height: 6, background: T.textDim + "35", borderRadius: 2 }} />Budget</div><div style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 10, height: 6, background: T.accent, borderRadius: 2 }} />Actual</div></div>}>
                  <BarChart data={monthlyData} targetLine={avgMonthlyBudget} thresholdLine={avgMonthlyBudget * 0.7} />
                </Card>
              ),
            },
            {
              id: "fin-pl-revenue-cost",
              label: "Revenue & Cost $/Ton",
              render: () => (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <Card title={`Revenue $/Ton — ${feedstock === "coal" ? "Coal" : feedstock === "tires" ? "Tires" : "Tires (default)"}`}>
                    {revPerTon.map((e, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "6px 0" }}>
                        <span style={{ fontSize: 12, color: T.textMid, width: 160 }}>{e.c}</span>
                        <div style={{ flex: 1 }}><Progress pct={e.p} color={e.cl} /></div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: T.text, width: 50, textAlign: "right" }}>{e.v}</span>
                      </div>
                    ))}
                    <div style={{ borderTop: `1px solid ${T.border}`, marginTop: 6, paddingTop: 6, display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                      <span style={{ color: T.textMid, fontWeight: 600 }}>Total</span>
                      <span style={{ color: T.text, fontWeight: 700 }}>{revTotal}</span>
                    </div>
                  </Card>

                  <Card title={`Cost $/Ton — ${feedstock === "coal" ? "Coal" : feedstock === "tires" ? "Tires" : "Tires (default)"}`}>
                    {costPerTon.map((e, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "6px 0" }}>
                        <span style={{ fontSize: 12, color: T.textMid, width: 160 }}>{e.c}</span>
                        <div style={{ flex: 1 }}><Progress pct={e.p} color={e.cl} /></div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: T.text, width: 50, textAlign: "right" }}>{e.v}</span>
                      </div>
                    ))}
                    <div style={{ borderTop: `1px solid ${T.border}`, marginTop: 6, paddingTop: 6, display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                      <span style={{ color: T.textMid, fontWeight: 600 }}>Total</span>
                      <span style={{ color: T.text, fontWeight: 700 }}>{costTotal}</span>
                    </div>
                  </Card>
                </div>
              ),
            },
            {
              id: "fin-pl-pl-table",
              label: "Site P&L — Actual vs Plan",
              render: () => (
                <Card title="Site P&L — Actual vs Plan">
                  <DataTable
                    columns={["Site", "Machines", "Actual Rev", "Plan Rev", "Var", "Actual EBITDA", "Plan EBITDA", "Var", "Status"]}
                    rows={siteRows.map(r => [
                      r.site.short,
                      `${r.site.processors} × ${r.site.feedstock === "Coal" ? "20" : "2"}TPH`,
                      fmtM(r.site.actualRevenue),
                      fmtM(r.plan.planRevenue),
                      <span style={{ color: r.revVar.color, fontWeight: 600, fontSize: 12 }}>{r.revVar.label}</span>,
                      fmtM(r.site.actualEBITDA),
                      fmtM(r.plan.planEBITDA),
                      <span style={{ color: r.ebitdaVar.color, fontWeight: 600, fontSize: 12 }}>{r.ebitdaVar.label}</span>,
                      <StatusPill status={r.revVar.pct >= -10 ? "green" : "yellow"} />,
                    ])}
                  />
                  <div style={{ borderTop: `1px solid ${T.border}`, marginTop: 8, paddingTop: 8, display: "flex", justifyContent: "space-between", fontSize: 12, color: T.textMid }}>
                    <span style={{ fontWeight: 700, color: T.text }}>Portfolio Total</span>
                    <span>Actual Rev: {fmtM(totalActualRev)} | Plan: {fmtM(totalPlanRev)} | Actual EBITDA: {fmtM(totalActualEBITDA)} | Plan: {fmtM(totalPlanEBITDA)}</span>
                  </div>
                </Card>
              ),
            },
            {
              id: "fin-pl-cash",
              label: "Cash Position Metrics",
              render: () => (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                  <Card title="Cash Position">
                    {[
                      ["Operating Cash", "$12.4M"],
                      ["Reserve Fund", "$8.0M"],
                      ["AR Outstanding", "$3.2M"],
                      ["AP Outstanding", "$2.1M"],
                      ["Net Working Capital", "$19.5M"],
                    ].map((item, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${T.border}`, fontSize: 12 }}>
                        <span style={{ color: T.textMid }}>{item[0]}</span>
                        <span style={{ color: T.text, fontWeight: 600 }}>{item[1]}</span>
                      </div>
                    ))}
                  </Card>

                  <Card title="Runway Analysis">
                    {(() => {
                      const monthsRunway = 9.7;
                      const runwayThreshold = 6;
                      const runwayColor = monthsRunway < runwayThreshold ? T.danger : T.text;
                      const items = [
                        ["Monthly Burn", "$2.1M", null],
                        ["Cash Available", "$20.4M", null],
                        ["Months Runway", `${monthsRunway}`, runwayColor],
                        ["Next Milestone", "Series D Discussion", null],
                      ];
                      return items.map((item, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${T.border}`, fontSize: 12 }}>
                          <span style={{ color: T.textMid }}>{item[0]}</span>
                          <span style={{ color: item[2] || T.text, fontWeight: 600 }}>
                            {item[1]}
                            {item[0] === "Months Runway" && monthsRunway < runwayThreshold && (
                              <span style={{ marginLeft: 6, fontSize: 10, color: T.danger, fontWeight: 700 }}>BELOW THRESHOLD</span>
                            )}
                          </span>
                        </div>
                      ));
                    })()}
                  </Card>

                  <Card title="Key Assumptions (from Model)">
                    {[
                      ["Diluent Price", `$${modelData.assumptions.solventPrice}/gal`],
                      ["Carbon Price", `$${modelData.assumptions.carbonBlackPrice}/lb`],
                      ["Uptime", `${(modelData.assumptions.operatingAvailability * 100).toFixed(0)}%`],
                      ["Feed Rate", `${modelData.assumptions.tirecrumbFeedPerHour} TPH`],
                      ["WACC", `${(modelData.wacc.wacc * 100).toFixed(0)}%`],
                      ["Tax Rate", `${(modelData.assumptions.taxRate * 100).toFixed(0)}%`],
                    ].map((item, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${T.border}`, fontSize: 12 }}>
                        <span style={{ color: T.textMid }}>{item[0]}</span>
                        <span style={{ color: T.text, fontWeight: 600 }}>{item[1]}</span>
                      </div>
                    ))}
                  </Card>
                </div>
              ),
            },
          ]}
          storageKey="sens-finance-pl-layout"
          locked={layoutLocked}
          onLockedChange={setLayoutLocked}
        />
      )}

      {tab === "performance" && (
        <DraggableGrid
          widgets={[
            {
              id: "fin-perf-lights",
              label: "Engine Lights",
              render: () => (
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                  <EngineLight on={totalActualRev > totalPlanRev * 0.9} color={totalActualRev >= totalPlanRev ? T.green : T.warn} label={`Portfolio Rev ${variance(totalActualRev, totalPlanRev).label} vs Plan`} />
                  <EngineLight on={true} color={T.green} label="IRR on track" />
                  <EngineLight on={true} color={T.blue} label={`${totalProcessors} machines operational`} />
                </div>
              ),
            },
            {
              id: "fin-perf-kpis",
              label: "Portfolio KPIs",
              render: () => {
                const kpiItems = [
                  { id: "kpi-total-machines", label: "Total Machines", value: `${filteredActive.reduce((a,s) => a + s.processors, 0)}`, sub: `${filteredActive.length} sites`, color: T.accent },
                  { id: "kpi-total-tph", label: "Total TPH", value: `${filteredActive.reduce((a,s) => a + s.throughput, 0).toFixed(1)}`, sub: "Processing capacity", color: T.blue },
                  { id: "kpi-model-irr", label: "Model IRR", value: `${(modelData.economics.projectIRR * 100).toFixed(0)}%`, sub: "Noble OK 15yr", color: T.green, target: 50, threshold: 25 },
                  { id: "kpi-actual-rev", label: "Actual Rev", value: fmtM(totalActualRev), sub: `Plan: ${fmtM(totalPlanRev)}`, color: totalActualRev >= totalPlanRev ? T.green : T.warn, target: totalPlanRev, threshold: totalPlanRev * 0.8, spark: revSparkData, sparkTarget: totalPlanRev },
                  { id: "kpi-actual-ebitda", label: "Actual EBITDA", value: fmtM(totalActualEBITDA), sub: `Plan: ${fmtM(totalPlanEBITDA)}`, color: totalActualEBITDA >= totalPlanEBITDA ? T.green : T.warn, target: totalPlanEBITDA, threshold: totalPlanEBITDA * 0.7, spark: ebitdaSparkData, sparkTarget: totalPlanEBITDA },
                ];
                if (filteredDev.length > 0) {
                  kpiItems.push({ id: "kpi-development", label: "Development", value: `${filteredDev.length}`, sub: `${filteredDev.reduce((a, s) => a + s.tph, 0)} TPH planned`, color: T.purple });
                }
                return (
                  <DraggableCardRow
                    items={kpiItems}
                    locked={layoutLocked}
                    storageKey="sens-finance-portfolio-cards-kpis"
                    renderItem={(item) => <KpiCard label={item.label} value={item.value} sub={item.sub} color={item.color} target={item.target} threshold={item.threshold} spark={item.spark} sparkTarget={item.sparkTarget} />}
                  />
                );
              },
            },
            {
              id: "fin-perf-sites",
              label: "Per-Site Performance Cards",
              render: () => (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
                  {filteredActive.map(s => {
                    const plan = sitePlan(s);
                    const revVar = variance(s.actualRevenue, plan.planRevenue);
                    const ebitdaVar = variance(s.actualEBITDA, plan.planEBITDA);
                    const uptimeVar = s.uptime - plan.uptimePlan;
                    const throughputPlan = plan.tphPlan;

                    return (
                      <Card key={s.id} title={s.short} titleColor={revVar.pct >= 0 ? T.green : T.warn}>
                        {/* Site header info */}
                        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 11, color: T.textDim, background: T.bg0, padding: "3px 8px", borderRadius: 4 }}>{s.processors} machine{s.processors > 1 ? "s" : ""}</span>
                          <span style={{ fontSize: 11, color: T.textDim, background: T.bg0, padding: "3px 8px", borderRadius: 4 }}>{s.feedstock}</span>
                          <span style={{ fontSize: 11, color: T.textDim, background: T.bg0, padding: "3px 8px", borderRadius: 4 }}>{s.tph} TPH capacity</span>
                          <span style={{ fontSize: 11, color: T.textDim, background: T.bg0, padding: "3px 8px", borderRadius: 4 }}>{s.feedSupplier}</span>
                        </div>

                        {/* Revenue vs Plan */}
                        <div style={{ marginBottom: 10 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                            <span style={{ color: T.textMid }}>Revenue</span>
                            <span style={{ color: T.text }}>{fmtM(s.actualRevenue)} / {fmtM(plan.planRevenue)} <span style={{ color: revVar.color, fontWeight: 600 }}>{revVar.label}</span></span>
                          </div>
                          <div style={{ position: "relative", height: 12, background: T.bg0, borderRadius: 6, overflow: "hidden" }}>
                            <div style={{ position: "absolute", width: `${Math.min((plan.planRevenue / Math.max(s.actualRevenue, plan.planRevenue)) * 100, 100)}%`, height: "100%", background: T.textDim + "30", borderRadius: 6 }} />
                            <div style={{ position: "absolute", width: `${Math.min((s.actualRevenue / Math.max(s.actualRevenue, plan.planRevenue)) * 100, 100)}%`, height: "100%", background: revVar.pct >= 0 ? T.green : T.warn, borderRadius: 6 }} />
                          </div>
                        </div>

                        {/* EBITDA vs Plan */}
                        <div style={{ marginBottom: 10 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                            <span style={{ color: T.textMid }}>EBITDA</span>
                            <span style={{ color: T.text }}>{fmtM(s.actualEBITDA)} / {fmtM(plan.planEBITDA)} <span style={{ color: ebitdaVar.color, fontWeight: 600 }}>{ebitdaVar.label}</span></span>
                          </div>
                          <div style={{ position: "relative", height: 12, background: T.bg0, borderRadius: 6, overflow: "hidden" }}>
                            <div style={{ position: "absolute", width: `${Math.min((plan.planEBITDA / Math.max(s.actualEBITDA, plan.planEBITDA)) * 100, 100)}%`, height: "100%", background: T.textDim + "30", borderRadius: 6 }} />
                            <div style={{ position: "absolute", width: `${Math.min((s.actualEBITDA / Math.max(s.actualEBITDA, plan.planEBITDA)) * 100, 100)}%`, height: "100%", background: ebitdaVar.pct >= 0 ? T.green : T.warn, borderRadius: 6 }} />
                          </div>
                        </div>

                        {/* Uptime & Throughput */}
                        <div style={{ display: "flex", gap: 16 }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
                              <span style={{ color: T.textDim }}>Uptime</span>
                              <span style={{ color: uptimeVar >= 0 ? T.green : T.danger, fontWeight: 600 }}>{s.uptime}% / {plan.uptimePlan}% ({uptimeVar >= 0 ? "+" : ""}{uptimeVar.toFixed(1)}pt)</span>
                            </div>
                            <Progress pct={s.uptime} color={uptimeVar >= 0 ? T.green : T.warn} h={6} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
                              <span style={{ color: T.textDim }}>Throughput</span>
                              <span style={{ color: s.throughput >= throughputPlan * 0.84 ? T.green : T.warn, fontWeight: 600 }}>{s.throughput} / {throughputPlan} TPH</span>
                            </div>
                            <Progress pct={(s.throughput / throughputPlan) * 100} color={s.throughput >= throughputPlan * 0.84 ? T.green : T.warn} h={6} />
                          </div>
                        </div>

                        {/* Production volumes */}
                        <div style={{ marginTop: 10, display: "flex", gap: 12 }}>
                          <div style={{ fontSize: 11, color: T.textDim }}><span style={{ color: T.text, fontWeight: 600 }}>{s.diluentGal?.toLocaleString()}</span> gal diluent/mo</div>
                          <div style={{ fontSize: 11, color: T.textDim }}><span style={{ color: T.text, fontWeight: 600 }}>{s.carbonT}</span> T carbon/mo</div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ),
            },
            ...(filteredDev.length > 0 ? [{
              id: "fin-perf-dev",
              label: "Development Projects",
              render: () => (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
                  {filteredDev.map(s => {
                    const plan = sitePlan(s);
                    const margin = plan.planRevenue > 0 ? ((plan.planEBITDA / plan.planRevenue) * 100).toFixed(0) : 0;
                    return (
                      <Card key={s.id} title={`${s.short} (${s.stage})`} titleColor={T.purple}>
                        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 11, color: T.textDim, background: T.bg0, padding: "3px 8px", borderRadius: 4 }}>{s.processors} × 20 TPH</span>
                          <span style={{ fontSize: 11, color: T.textDim, background: T.bg0, padding: "3px 8px", borderRadius: 4 }}>{s.feedstock}</span>
                          <span style={{ fontSize: 11, color: T.textDim, background: T.bg0, padding: "3px 8px", borderRadius: 4 }}>{s.capex}</span>
                          <span style={{ fontSize: 11, color: T.textDim, background: T.bg0, padding: "3px 8px", borderRadius: 4 }}>{s.epc}</span>
                        </div>

                        <div style={{ fontSize: 12, color: T.accent, fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>Plan Economics (Annual)</div>
                        {[
                          ["Plan Revenue", `$${plan.planRevenue.toFixed(1)}M`],
                          ["Plan Costs", `$${plan.planCosts.toFixed(1)}M`],
                          ["Plan EBITDA", `$${plan.planEBITDA.toFixed(1)}M`],
                          ["EBITDA Margin", `${margin}%`],
                          ["Target Uptime", `${plan.uptimePlan}%`],
                          ["Target TPH", `${plan.tphPlan} TPH`],
                        ].map(([label, val], i) => (
                          <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${T.border}`, fontSize: 12 }}>
                            <span style={{ color: T.textMid }}>{label}</span>
                            <span style={{ color: T.text, fontWeight: 600 }}>{val}</span>
                          </div>
                        ))}

                        <div style={{ marginTop: 12, padding: "10px 12px", background: T.bg0, borderRadius: 6 }}>
                          <div style={{ fontSize: 11, color: T.textDim, marginBottom: 6, fontWeight: 600 }}>Development Progress</div>
                          <Progress pct={s.developmentPct || 0} color={T.purple} h={8} />
                          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 11 }}>
                            <span style={{ color: T.textMid }}>{s.developmentPct || 0}% complete</span>
                            <span style={{ color: T.textDim }}>Target: {s.startYear}</span>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ),
            }] : []),
            {
              id: "fin-perf-sensitivity",
              label: "Sensitivity Analysis",
              render: () => (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <Card title="Diluent Price Sensitivity">
                    {[
                      { p: "$6/gal", irr: "42%", b: 42 },
                      { p: `$${modelData.assumptions.solventPrice}/gal (Model)`, irr: `${(modelData.economics.projectIRR * 100).toFixed(0)}%`, b: Math.round(modelData.economics.projectIRR * 100) },
                      { p: "$10/gal", irr: "85%", b: 85 },
                      { p: "$14/gal", irr: "100%+", b: 100 },
                    ].map((s, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "6px 0", background: i === 1 ? T.accentBg : "transparent", borderRadius: 4, paddingLeft: i === 1 ? 8 : 0 }}>
                        <span style={{ fontSize: 12, color: i === 1 ? T.accent : T.textMid, width: 110, fontWeight: i === 1 ? 600 : 400 }}>{s.p}</span>
                        <div style={{ flex: 1 }}><Progress pct={s.b} color={i === 1 ? T.accent : T.blue} /></div>
                        <span style={{ fontSize: 12, color: T.text, width: 50, textAlign: "right" }}>{s.irr}</span>
                      </div>
                    ))}
                  </Card>

                  <Card title="Uptime Sensitivity">
                    {[
                      { u: "75%", irr: "38%", b: 38 },
                      { u: `${(modelData.assumptions.operatingAvailability * 100).toFixed(0)}% (Model)`, irr: `${(modelData.economics.projectIRR * 100).toFixed(0)}%`, b: Math.round(modelData.economics.projectIRR * 100) },
                      { u: "90%", irr: "72%", b: 72 },
                      { u: "95%", irr: "88%", b: 88 },
                    ].map((s, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "6px 0", background: i === 1 ? T.accentBg : "transparent", borderRadius: 4, paddingLeft: i === 1 ? 8 : 0 }}>
                        <span style={{ fontSize: 12, color: i === 1 ? T.accent : T.textMid, width: 110, fontWeight: i === 1 ? 600 : 400 }}>{s.u}</span>
                        <div style={{ flex: 1 }}><Progress pct={s.b} color={i === 1 ? T.accent : T.green} /></div>
                        <span style={{ fontSize: 12, color: T.text, width: 50, textAlign: "right" }}>{s.irr}</span>
                      </div>
                    ))}
                  </Card>
                </div>
              ),
            },
            {
              id: "fin-perf-calendar",
              label: "Board Reporting Calendar",
              render: () => (
                <Card title="Board Reporting Calendar">
                  <DataTable
                    columns={["Meeting", "Date", "Focus", "Key Metrics", "Status"]}
                    rows={[
                      ["Q1 Board Meeting", "Mar 15, 2026", "Financial Review", "P&L, Cash, IRR", <StatusPill status="green" />],
                      ["Series C Closeout", "May 20, 2026", "Funding", "$162M deployment plan", <StatusPill status="yellow" />],
                      ["Strategic Review", "Jul 10, 2026", "Coal Program", "FL-456 concept validation", <StatusPill status="blue" />],
                      ["Q3 Board Meeting", "Sep 22, 2026", "Operations", "Site metrics, uptime", <StatusPill status="green" />],
                      ["Annual Investor Update", "Dec 5, 2026", "Full Year Results", "YTD performance", <StatusPill status="blue" />],
                    ]}
                  />
                </Card>
              ),
            },
          ]}
          storageKey="sens-finance-perf-layout"
          locked={layoutLocked}
          onLockedChange={setLayoutLocked}
        />
      )}

      {tab === "marketing" && (
        <DraggableGrid
          widgets={[
            {
              id: "fin-mkt-lights",
              label: "Engine Lights",
              render: () => (
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                  <EngineLight on={true} color={T.warn} label="Top 3 = 65% of rev" />
                  <EngineLight on={true} color={T.warn} label="Southern Carbon renewal" />
                  <EngineLight on={false} color={T.green} label="Pipeline $8M" />
                  <EngineLight on={false} color={T.green} label="Pricing stable" />
                </div>
              ),
            },
            {
              id: "fin-mkt-kpis",
              label: "Marketing KPIs",
              render: () => (
                <DraggableCardRow
                  items={[
                    { id: "kpi-active-customers", label: "Active Customers", value: "8", sub: "Contracted", color: T.green, target: 12, threshold: 6 },
                    { id: "kpi-contracted-pct", label: "Contracted %", value: "62%", sub: "6 of 8", color: T.green, target: "80%", threshold: "50%" },
                    { id: "kpi-pipeline", label: "Pipeline", value: "$8M", sub: "12-month", color: T.green, target: "$12M", threshold: "$5M" },
                    { id: "kpi-avg-term", label: "Avg Term", value: "3.2 yrs", sub: "Contract length", color: T.blue },
                    { id: "kpi-renewal-risk", label: "Renewal Risk", value: "1", sub: "Medium term", color: T.green, target: 0, invert: true, threshold: 3 },
                  ]}
                  locked={layoutLocked}
                  storageKey="sens-finance-marketing-cards-kpis"
                  renderItem={(item) => <KpiCard label={item.label} value={item.value} sub={item.sub} color={item.color} target={item.target} threshold={item.threshold} invert={item.invert} />}
                />
              ),
            },
            {
              id: "fin-mkt-contracts",
              label: "Offtake Contracts — Portfolio",
              render: () => (
                <Card title="Offtake Contracts — Portfolio">
                  <DataTable
                    columns={["Customer", "Product", "Volume/wk", "Price", "Annual Rev", "Term", "Expiry", "Status"]}
                    rows={[
                      ["Oilfield Svc", "Diluent", "4,800 gal", "$8.0/gal", "$2.0M", "3yr", "Mar 2028", <StatusPill status="green" />],
                      ["Pipeline Maint", "d-Limonene", "6,400 gal", "$10.5/gal", "$3.5M", "4yr", "May 2029", <StatusPill status="green" />],
                      ["Nat'l Tire Mfg", "Carbon N330", "72 T/mo", "$0.5/lb", "$1.9M", "5yr", "Nov 2030", <StatusPill status="green" />],
                      ["SE Chem Dist", "Heavy Fraction", "3,200 gal", "$7.0/gal", "$1.2M", "2yr", "Sep 2027", <StatusPill status="yellow" />],
                      ["Regional Refinery", "Diluent", "8,000 gal", "$8.5/gal", "$3.5M", "3yr", "Jan 2028", <StatusPill status="green" />],
                      ["Ind. Cleaning", "d-Limonene", "2,400 gal", "$11.0/gal", "$1.3M", "2yr", "Nov 2027", <StatusPill status="yellow" />],
                    ]}
                  />
                </Card>
              ),
            },
            {
              id: "fin-mkt-concentration",
              label: "Customer Concentration",
              render: () => (
                <Card title="Customer Concentration">
                  {[
                    { c: "Top 3 Customers", v: "65%", p: 65, cl: T.warn },
                    { c: "Oilfield Svc (Diluent)", v: "22%", p: 22, cl: T.accent },
                    { c: "Pipeline Maint (Limonene)", v: "25%", p: 25, cl: T.blue },
                    { c: "Nat'l Tire Mfg (Carbon)", v: "17%", p: 17, cl: T.textMid },
                  ].map((e, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "6px 0" }}>
                      <span style={{ fontSize: 12, color: T.textMid, width: 150 }}>{e.c}</span>
                      <div style={{ flex: 1 }}><Progress pct={e.p} color={e.cl} /></div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: T.text, width: 40, textAlign: "right" }}>{e.v}</span>
                    </div>
                  ))}
                </Card>
              ),
            },
            {
              id: "fin-mkt-pricing",
              label: "Pricing Summary & Sales Pipeline",
              render: () => (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <Card title="Pricing Summary">
                    <DataTable
                      columns={["Product", "Current Price", "YTD Avg", "Market Range"]}
                      rows={[
                        ["Diluent", "$8.0/gal", "$8.1/gal", "$6-14"],
                        ["d-Limonene", "$10.5/gal", "$10.4/gal", "$9-12"],
                        ["Carbon N330", "$0.5/lb", "$0.5/lb", "$0.5-0.6"],
                        ["Heavy Frac", "$7.0/gal", "$7.2/gal", "$6-8"],
                      ]}
                      compact
                    />
                  </Card>

                  <Card title="Sales Pipeline">
                    <DataTable
                      columns={["Prospect", "Product", "Volume", "Est. Value", "Stage"]}
                      rows={[
                        ["TransChem Inc", "Diluent", "3,600 gal/wk", "$1.9M", "Proposal"],
                        ["Gulf Logistics", "Carbon", "48 T/mo", "$1.9M", "Negotiation"],
                        ["Coastal Mills", "Limonene", "2,000 gal/wk", "$1.1M", "RFQ"],
                        ["Atlantic Fuels", "Diluent", "5,200 gal/wk", "$2.3M", "Discovery"],
                      ]}
                      compact
                    />
                  </Card>
                </div>
              ),
            },
          ]}
          storageKey="sens-finance-mkt-layout"
          locked={layoutLocked}
          onLockedChange={setLayoutLocked}
        />
      )}
    </div>
  );
};
