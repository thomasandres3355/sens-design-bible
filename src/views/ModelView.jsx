import { useState, useMemo } from "react";
import { T } from "../data/theme";
import { modelData } from "../data/modelData";
import { KpiCard, Progress } from "../components/ui/indicators";
import { Card, TabBar, DataTable, SectionHeader, DraggableGrid, DraggableCardRow } from "../components/ui/layout";

const fmt = (v, decimals = 1) => {
  if (v == null) return "—";
  const abs = Math.abs(v);
  if (abs >= 1e9) return (v < 0 ? "(" : "") + "$" + (abs / 1e9).toFixed(decimals) + "B" + (v < 0 ? ")" : "");
  if (abs >= 1e6) return (v < 0 ? "(" : "") + "$" + (abs / 1e6).toFixed(decimals) + "M" + (v < 0 ? ")" : "");
  if (abs >= 1e3) return (v < 0 ? "(" : "") + "$" + (abs / 1e3).toFixed(decimals) + "K" + (v < 0 ? ")" : "");
  return "$" + v.toFixed(decimals);
};

const pct = (v) => v == null ? "—" : (v * 100).toFixed(1) + "%";

// ─── SVG Line Chart ───
const LineChart = ({ series, labels, height = 200, width = "100%", showGrid = true, yFormat }) => {
  const allValues = series.flatMap(s => s.data.filter(v => v != null));
  const max = Math.max(...allValues);
  const min = Math.min(...allValues, 0);
  const range = max - min || 1;
  const svgW = 800;
  const svgH = height;
  const padL = 70, padR = 20, padT = 20, padB = 30;
  const plotW = svgW - padL - padR;
  const plotH = svgH - padT - padB;

  const toX = (i, len) => padL + (i / (len - 1)) * plotW;
  const toY = (v) => padT + plotH - ((v - min) / range) * plotH;

  const yTicks = 5;
  const yFmt = yFormat || (v => fmt(v, 1));

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} style={{ width, height: "auto" }}>
      {showGrid && Array.from({ length: yTicks + 1 }, (_, i) => {
        const v = min + (range / yTicks) * i;
        const y = toY(v);
        return <g key={i}>
          <line x1={padL} x2={svgW - padR} y1={y} y2={y} stroke={T.border} strokeWidth=".5" />
          <text x={padL - 8} y={y + 4} textAnchor="end" fill={T.textDim} fontSize="10">{yFmt(v)}</text>
        </g>;
      })}
      {/* Zero line */}
      {min < 0 && <line x1={padL} x2={svgW - padR} y1={toY(0)} y2={toY(0)} stroke={T.textDim} strokeWidth="1" strokeDasharray="4,3" />}
      {series.map((s, si) => {
        const pts = s.data.map((v, i) => v != null ? `${toX(i, s.data.length)},${toY(v)}` : null).filter(Boolean);
        return <polyline key={si} points={pts.join(" ")} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" />;
      })}
      {labels && labels.filter((_, i) => i % Math.ceil(labels.length / 12) === 0).map((l, i, arr) => (
        <text key={i} x={toX(i * Math.ceil(labels.length / 12), labels.length)} y={svgH - 4} textAnchor="middle" fill={T.textDim} fontSize="9">{l}</text>
      ))}
    </svg>
  );
};

// ─── Gantt Chart ───
const GanttChart = ({ items, months = 22, height = 24 }) => {
  const totalBudget = items.reduce((s, it) => s + (it.budget || 0), 0);
  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ minWidth: 700 }}>
        {items.map((item, i) => {
          const nonZeroMonths = item.monthlySpend ? item.monthlySpend.filter(v => v > 0) : [];
          const startMonth = item.monthlySpend ? item.monthlySpend.findIndex(v => v > 0) : 0;
          const duration = nonZeroMonths.length || 1;
          const budgetPct = totalBudget > 0 ? (item.budget / totalBudget) * 100 : 0;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <div style={{ width: 200, fontSize: 11, color: T.textMid, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={item.description}>{item.description || item.division}</div>
              <div style={{ flex: 1, height, background: T.bg0, borderRadius: 4, position: "relative", overflow: "hidden" }}>
                <div style={{
                  position: "absolute", left: `${(startMonth / months) * 100}%`, width: `${(duration / months) * 100}%`,
                  height: "100%", background: T.accent + "60", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  <span style={{ fontSize: 9, color: T.text, fontWeight: 600 }}>{fmt(item.budget, 1)}</span>
                </div>
              </div>
              <div style={{ width: 50, fontSize: 10, color: T.textDim, textAlign: "right" }}>{budgetPct.toFixed(1)}%</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Stacked Horizontal Bar ───
const CostBreakdown = ({ items }) => {
  const grouped = {};
  items.forEach(it => {
    const cat = it.category || "Other";
    if (!grouped[cat]) grouped[cat] = { items: [], total: 0 };
    grouped[cat].items.push(it);
    grouped[cat].total += (it.model || 0);
  });
  const totalCost = items.reduce((s, it) => s + (it.model || 0), 0);
  const catColors = [T.accent, T.blue, T.green, T.purple, T.teal, T.warn, T.danger];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {Object.entries(grouped).map(([cat, data], ci) => (
        <div key={cat}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 12, color: T.text, fontWeight: 600 }}>{cat}</span>
            <span style={{ fontSize: 12, color: T.textMid }}>{fmt(data.total, 0)}/mo · {((data.total / totalCost) * 100).toFixed(0)}%</span>
          </div>
          <div style={{ background: T.bg0, borderRadius: 4, height: 18, overflow: "hidden" }}>
            <div style={{ width: `${(data.total / totalCost) * 100}%`, height: "100%", background: catColors[ci % catColors.length], borderRadius: 4, transition: "width .4s" }} />
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
            {data.items.map((it, j) => (
              <span key={j} style={{ fontSize: 10, color: T.textDim, background: T.bg0, padding: "2px 6px", borderRadius: 3 }}>
                {it.item}: ${it.model?.toLocaleString() || 0} ({it.perFeedTon ? `$${it.perFeedTon}/T` : ""})
              </span>
            ))}
          </div>
        </div>
      ))}
      <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 8, display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Total Monthly OpCost</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: T.accent }}>{fmt(totalCost, 0)}</span>
      </div>
    </div>
  );
};

// ─── Tabs ───

const FinancialTab = ({ layoutLocked, setLayoutLocked }) => {
  const { economics, monthlyCashFlow } = modelData;
  const { annual, projectNPV, projectIRR, investorIRR } = economics;

  const revData = annual.map(a => a.revenue);
  const costData = annual.map(a => Math.abs(a.costs || 0));
  const ebitdaData = annual.map(a => a.ebitda);
  const yearLabels = annual.map(a => String(a.year));

  const paybackMonth = monthlyCashFlow.findIndex(m => (m.cumulativeCashFlow || 0) > 0 && monthlyCashFlow.indexOf(m) > 6);
  const cumCFData = monthlyCashFlow.map(m => m.cumulativeCashFlow);
  const cfLabels = monthlyCashFlow.map(m => `${m.month} ${String(m.year).slice(2)}`);

  const widgets = [
    {
      id: "model-fin-kpis",
      label: "Financial KPIs",
      render: () => (
        <DraggableCardRow
          locked={layoutLocked}
          storageKey="sens-model-financial-cards-kpis"
          items={[
            { id: "fin-npv", label: "Project NPV", value: fmt(projectNPV, 1), sub: "at 20% WACC", color: T.green },
            { id: "fin-irr", label: "Project IRR", value: pct(projectIRR), sub: "15-year unlevered", color: T.accent },
            { id: "fin-series-irr", label: "Series A IRR", value: pct(investorIRR), sub: "50% equity", color: T.blue },
            { id: "fin-wacc", label: "WACC", value: pct(modelData.wacc.wacc), sub: "100% equity financed", color: T.purple },
            { id: "fin-payback", label: "Payback", value: paybackMonth > 0 ? `${paybackMonth} mo` : "—", sub: "cumulative CF positive", color: T.teal },
          ]}
        />
      ),
    },
    {
      id: "model-fin-rev-chart",
      label: "Revenue vs Costs vs EBITDA",
      render: () => (
        <Card title="Annual Revenue vs Costs vs EBITDA (15-Year Projection)">
          <div style={{ display: "flex", gap: 16, marginBottom: 10 }}>
            <span style={{ fontSize: 11, color: T.green }}>● Revenue</span>
            <span style={{ fontSize: 11, color: T.danger }}>● Costs</span>
            <span style={{ fontSize: 11, color: T.accent }}>● EBITDA</span>
          </div>
          <LineChart series={[
            { data: revData, color: T.green },
            { data: costData, color: T.danger },
            { data: ebitdaData, color: T.accent }
          ]} labels={yearLabels} height={220} />
        </Card>
      ),
    },
    {
      id: "model-fin-cumcf-chart",
      label: "Cumulative Cash Flow",
      render: () => (
        <Card title="Monthly Cumulative Cash Flow (180 Months)">
          <div style={{ fontSize: 11, color: T.textMid, marginBottom: 8 }}>
            Breakeven crossover highlighted — cumulative free cash flow over 15-year model horizon
          </div>
          <LineChart series={[{ data: cumCFData, color: T.accent }]} labels={cfLabels} height={180} />
        </Card>
      ),
    },
    {
      id: "model-fin-annual-table",
      label: "Annual Economics Detail",
      render: () => (
        <Card title="Annual Economics Detail">
          <DataTable compact columns={["Year", "Revenue", "Costs", "EBITDA", "After-Tax P/L", "Free Cash Flow", "DCF", "ROIC"]}
            rows={annual.map(a => [
              a.year,
              fmt(a.revenue), fmt(a.costs), fmt(a.ebitda),
              fmt(a.afterTaxPL), fmt(a.freeCashFlow), fmt(a.discountedCashFlow),
              a.roic != null ? (a.roic * 100).toFixed(1) + "%" : "—"
            ])} />
        </Card>
      ),
    },
    {
      id: "model-fin-production-table",
      label: "Annual Production Volumes",
      render: () => (
        <Card title="Annual Production Volumes">
          <DataTable compact columns={["Year", "Tires Processed", "Solvent (gal)", "Carbon Black (lbs)", "Gas (MCF)"]}
            rows={economics.production.map(p => [
              p.year,
              p.tiresProcessed?.toLocaleString() || "—",
              p.solventGal?.toLocaleString() || "—",
              p.carbonBlackLbs?.toLocaleString() || "—",
              p.gasProductionMCF?.toLocaleString() || "—"
            ])} />
        </Card>
      ),
    },
  ];

  return (
    <DraggableGrid
      widgets={widgets}
      layoutLocked={layoutLocked}
      setLayoutLocked={setLayoutLocked}
      storageKey="sens-model-financial-layout"
    />
  );
};

const DeliveryTab = ({ layoutLocked, setLayoutLocked }) => {
  const { constructionBudget, machineBuild, processorSchedule, assumptions } = modelData;
  const [selectedCat, setSelectedCat] = useState(null);

  const widgets = [
    {
      id: "model-del-kpis",
      label: "Delivery KPIs",
      render: () => (
        <DraggableCardRow
          locked={layoutLocked}
          storageKey="sens-model-delivery-cards-kpis"
          items={[
            { id: "del-site-budget", label: "Site Budget", value: fmt(constructionBudget.totalBudget, 1), sub: `${constructionBudget.divisions.length} divisions`, color: T.accent },
            { id: "del-per-proc-full", label: "Per Processor (Full)", value: fmt(machineBuild.grandTotal, 1), sub: "Equip + Facilities + Labor", color: T.blue },
            { id: "del-per-proc-equip", label: "Per Processor (Equip)", value: fmt(processorSchedule.grandTotal, 1), sub: "12-month build cycle", color: T.green },
            { id: "del-machines", label: "Machines", value: "6", sub: `Start months: ${assumptions.machineSchedule.map(m => m.capexStartMonth).join(", ")}`, color: T.purple },
          ]}
        />
      ),
    },
    {
      id: "model-del-budget-gantt",
      label: "Site Construction Budget",
      render: () => (
        <Card title="Site Construction Budget — Division Timeline">
          <div style={{ fontSize: 11, color: T.textMid, marginBottom: 12 }}>
            Noble, OK 6-Processor Facility — {constructionBudget.divisions.length} construction divisions phased across build period
          </div>
          <GanttChart items={constructionBudget.divisions} months={22} />
        </Card>
      ),
    },
    {
      id: "model-del-machine-build",
      label: "Machine Build Cost Breakdown",
      render: () => (
        <Card title="Machine Build Cost Breakdown (Per Processor)">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {machineBuild.categories.map((cat, i) => {
              const colors = [T.accent, T.blue, T.green, T.purple, T.teal];
              const pctOfTotal = machineBuild.grandTotal > 0 ? ((cat.total || 0) / machineBuild.grandTotal) * 100 : 0;
              return (
                <div key={i} onClick={() => setSelectedCat(selectedCat === i ? null : i)} style={{ cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: T.text, fontWeight: 600 }}>{cat.name}</span>
                    <span style={{ fontSize: 12, color: T.textMid }}>{fmt(cat.total, 1)} · {pctOfTotal.toFixed(1)}%</span>
                  </div>
                  <Progress pct={pctOfTotal} color={colors[i % colors.length]} h={10} showLabel />
                  {selectedCat === i && cat.monthlySpend && (
                    <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
                      {cat.monthlySpend.map((v, mi) => (
                        <div key={mi} style={{ background: T.bg0, borderRadius: 4, padding: "4px 8px", minWidth: 50, textAlign: "center" }}>
                          <div style={{ fontSize: 9, color: T.textDim }}>Mo {mi + 1}</div>
                          <div style={{ fontSize: 11, color: v > 0 ? T.text : T.textDim, fontWeight: v > 0 ? 600 : 400 }}>{v > 0 ? fmt(v, 0) : "—"}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 8, display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Grand Total</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: T.accent }}>{fmt(machineBuild.grandTotal, 1)}</span>
            </div>
          </div>
        </Card>
      ),
    },
    {
      id: "model-del-machine-schedule",
      label: "Machine Online Schedule",
      render: () => (
        <Card title="Machine Online Schedule">
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {assumptions.machineSchedule.map((m, i) => (
              <div key={i} style={{ background: T.bg0, borderRadius: 8, padding: "14px 18px", minWidth: 100, textAlign: "center", border: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: T.accent }}>#{m.machine}</div>
                <div style={{ fontSize: 11, color: T.textMid, marginTop: 4 }}>Month {m.capexStartMonth}</div>
                <div style={{ fontSize: 10, color: T.textDim }}>
                  {m.capexStartMonth <= 6 ? "2026 H1" : m.capexStartMonth <= 12 ? "2026 H2" : "2027 H1"}
                </div>
              </div>
            ))}
          </div>
        </Card>
      ),
    },
    ...(machineBuild.equipmentItems.length > 0 ? [{
      id: "model-del-equipment",
      label: "Equipment & Materials Detail",
      render: () => (
        <Card title="Equipment & Materials Detail">
          <DataTable compact columns={["Item", "Cost"]}
            rows={machineBuild.equipmentItems.map(e => [e.item, fmt(e.cost, 0)])} />
        </Card>
      ),
    }] : []),
  ];

  return (
    <DraggableGrid
      widgets={widgets}
      layoutLocked={layoutLocked}
      setLayoutLocked={setLayoutLocked}
      storageKey="sens-model-delivery-layout"
    />
  );
};

const OperationsTab = ({ layoutLocked, setLayoutLocked }) => {
  const { opCost, assumptions, economics } = modelData;
  const { management } = assumptions;

  const revPerTon = [
    { product: "Diluent/Solvent", priceUnit: `$${assumptions.solventPrice}/gal`, ratio: assumptions.solventRatio },
    { product: "Carbon Black", priceUnit: `$${assumptions.carbonBlackPrice}/lb`, ratio: assumptions.carbonBlackRatio },
    { product: "Gas/RNG", priceUnit: `$${assumptions.gasPrice}/MCF`, ratio: assumptions.gasRatio },
  ];

  const prodData = economics.production;
  const tiresData = prodData.map(p => p.tiresProcessed);
  const solventData = prodData.map(p => p.solventGal);
  const carbonData = prodData.map(p => p.carbonBlackLbs);
  const yearLabels = prodData.map(p => String(p.year));

  const widgets = [
    {
      id: "model-ops-kpis",
      label: "Operations KPIs",
      render: () => (
        <DraggableCardRow
          locked={layoutLocked}
          storageKey="sens-model-operations-cards-kpis"
          items={[
            { id: "ops-feed-rate", label: "Feed Rate", value: `${assumptions.tirecrumbFeedPerHour} TPH`, sub: `${assumptions.tirecrumbFeedPerDay} T/day per machine`, color: T.accent },
            { id: "ops-avail", label: "Operating Avail.", value: pct(assumptions.operatingAvailability), sub: `${assumptions.operatingHours}hr/day schedule`, color: T.green },
            { id: "ops-contingency", label: "Contingency", value: pct(assumptions.contingency), sub: "Applied to operating costs", color: T.warn },
            { id: "ops-split", label: "Product Split", value: "45/45/10", sub: "Solvent / Carbon / Gas", color: T.blue },
          ]}
        />
      ),
    },
    {
      id: "model-ops-cost-breakdown",
      label: "Monthly Operating Cost Breakdown",
      render: () => (
        <Card title="Monthly Operating Cost Breakdown">
          <CostBreakdown items={opCost} />
        </Card>
      ),
    },
    {
      id: "model-ops-production-chart",
      label: "Production Forecasts",
      render: () => (
        <Card title="Production Forecasts (Annual)">
          <div style={{ display: "flex", gap: 16, marginBottom: 10 }}>
            <span style={{ fontSize: 11, color: T.green }}>● Tires (units)</span>
            <span style={{ fontSize: 11, color: T.accent }}>● Solvent (gal)</span>
            <span style={{ fontSize: 11, color: T.blue }}>● Carbon (lbs)</span>
          </div>
          <LineChart series={[
            { data: tiresData, color: T.green },
            { data: solventData, color: T.accent },
            { data: carbonData, color: T.blue }
          ]} labels={yearLabels} height={200} yFormat={(v) => v >= 1e6 ? (v / 1e6).toFixed(1) + "M" : v >= 1e3 ? (v / 1e3).toFixed(0) + "K" : String(v)} />
        </Card>
      ),
    },
    {
      id: "model-ops-rev-mgmt",
      label: "Revenue & Management",
      render: () => (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Card title="Revenue per Ton">
            {revPerTon.map((r, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${T.border}` }}>
                <span style={{ fontSize: 12, color: T.text }}>{r.product}</span>
                <span style={{ fontSize: 12, color: T.textMid }}>{r.priceUnit} · {(r.ratio * 100).toFixed(0)}% yield</span>
              </div>
            ))}
          </Card>

          <Card title="Management & Overhead">
            <DataTable compact columns={["Role", "Annual", "Monthly"]}
              rows={management.map(m => [m.role, fmt(m.annualCost, 0), fmt(m.monthlyCost, 0)])} />
          </Card>
        </div>
      ),
    },
    {
      id: "model-ops-assumptions",
      label: "Key Assumptions",
      render: () => (
        <Card title="Key Assumptions">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
            {[
              { label: "Working Capital", value: pct(assumptions.workingCapitalPct) },
              { label: "Tax Rate", value: pct(assumptions.taxRate) },
              { label: "Discount Rate", value: pct(assumptions.discountRate) },
              { label: "Depreciation", value: `${assumptions.depreciationPeriod} years` },
              { label: "Feedstock Cost", value: `$${assumptions.feedstockCost}/lb` },
              { label: "CapEx Series A", value: fmt(assumptions.capexSeriesA, 0) },
              { label: "CapEx Series B", value: fmt(assumptions.capexSeriesB, 0) },
              { label: "Machines Start", value: `Month ${assumptions.machineOpsStart}` },
            ].map((a, i) => (
              <div key={i} style={{ background: T.bg0, borderRadius: 6, padding: "10px 12px" }}>
                <div style={{ fontSize: 10, color: T.textDim, textTransform: "uppercase", letterSpacing: .6 }}>{a.label}</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: T.text, marginTop: 2 }}>{a.value}</div>
              </div>
            ))}
          </div>
        </Card>
      ),
    },
  ];

  return (
    <DraggableGrid
      widgets={widgets}
      layoutLocked={layoutLocked}
      setLayoutLocked={setLayoutLocked}
      storageKey="sens-model-operations-layout"
    />
  );
};

const MarketTab = ({ layoutLocked, setLayoutLocked }) => {
  const { marketPricing, assumptions } = modelData;
  const { carbonBlack, carbonBlackStats, diluent } = marketPricing;

  const cbPeriods = carbonBlack.map(c => c.period);
  const cbChina = carbonBlack.map(c => c.chinaPerLb);
  const cbIndia = carbonBlack.map(c => c.indiaPerLb);
  const cbUS = carbonBlack.map(c => c.usPerLb);
  const cbSENS = carbonBlack.map(c => c.sensPrice);

  const dilPeriods = diluent.map(d => d.period);
  const dilXylene = diluent.map(d => d.mixedXylene);
  const dilA150 = diluent.map(d => d.aromatic150);
  const dilA200 = diluent.map(d => d.aromatic200);
  const dilSENS = diluent.map(d => d.sensPrice);
  const dilTerpHigh = diluent.map(d => d.terpeneHigh);

  const widgets = [
    {
      id: "model-mkt-header",
      label: "Market Pricing Intelligence",
      render: () => (
        <SectionHeader sub="Quarterly market pricing Q1 2020 – Q3 2025 vs SENS product pricing">Market Pricing Intelligence</SectionHeader>
      ),
    },
    {
      id: "model-mkt-carbon-chart",
      label: "N330 Carbon Black Chart",
      render: () => (
        <Card title="N330 Carbon Black — $/lb by Region">
          <div style={{ display: "flex", gap: 16, marginBottom: 10 }}>
            <span style={{ fontSize: 11, color: T.blue }}>● China</span>
            <span style={{ fontSize: 11, color: T.purple }}>● India</span>
            <span style={{ fontSize: 11, color: T.danger }}>● US</span>
            <span style={{ fontSize: 11, color: T.green }}>● SENS ($0.6)</span>
          </div>
          <LineChart series={[
            { data: cbChina, color: T.blue },
            { data: cbIndia, color: T.purple },
            { data: cbUS, color: T.danger },
            { data: cbSENS, color: T.green }
          ]} labels={cbPeriods} height={220} yFormat={v => "$" + v.toFixed(1)} />
        </Card>
      ),
    },
    {
      id: "model-mkt-carbon-kpis",
      label: "Carbon Black KPIs",
      render: () => (
        <DraggableCardRow
          locked={layoutLocked}
          storageKey="sens-model-market-cards-kpis"
          items={[
            { id: "mkt-us-current", label: "US Current", value: "$" + (carbonBlackStats.current || 0).toFixed(1) + "/lb", sub: "Q3 2025", color: T.danger },
            { id: "mkt-5y-high", label: "5-Year High", value: "$" + (carbonBlackStats.high || 0).toFixed(1) + "/lb", color: T.warn },
            { id: "mkt-5y-low", label: "5-Year Low", value: "$" + (carbonBlackStats.low || 0).toFixed(1) + "/lb", color: T.green },
            { id: "mkt-5y-avg", label: "5-Year Avg", value: "$" + (carbonBlackStats.average || 0).toFixed(1) + "/lb", color: T.blue },
            { id: "mkt-sens-price", label: "SENS Price", value: "$" + (assumptions.carbonBlackPrice || 0).toFixed(1) + "/lb", sub: "36% below US avg", color: T.accent },
          ]}
        />
      ),
    },
    {
      id: "model-mkt-diluent-chart",
      label: "Diluent / Solvent Chart",
      render: () => (
        <Card title="Diluent / Solvent — $/gal Comparables">
          <div style={{ display: "flex", gap: 16, marginBottom: 10 }}>
            <span style={{ fontSize: 11, color: T.blue }}>● Mixed Xylene</span>
            <span style={{ fontSize: 11, color: T.purple }}>● Aromatic 150</span>
            <span style={{ fontSize: 11, color: T.warn }}>● Aromatic 200</span>
            <span style={{ fontSize: 11, color: T.green }}>● SENS ($8.0)</span>
            <span style={{ fontSize: 11, color: T.textDim }}>● Terpene High</span>
          </div>
          <LineChart series={[
            { data: dilXylene, color: T.blue },
            { data: dilA150, color: T.purple },
            { data: dilA200, color: T.warn },
            { data: dilSENS, color: T.green },
            { data: dilTerpHigh, color: T.textDim }
          ]} labels={dilPeriods} height={220} yFormat={v => "$" + v.toFixed(1)} />
        </Card>
      ),
    },
    {
      id: "model-mkt-wacc",
      label: "WACC & Capital Structure",
      render: () => (
        <Card title="WACC & Capital Structure">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
            {[
              { label: "Risk-Free Rate", value: pct(modelData.wacc.riskFreeRate) },
              { label: "Beta", value: modelData.wacc.beta?.toFixed(1) },
              { label: "Equity Risk Premium", value: pct(modelData.wacc.equityRiskPremium) },
              { label: "Cost of Equity", value: modelData.wacc.costOfEquity?.toFixed(1) + "%" },
              { label: "Debt Rate", value: pct(modelData.wacc.debtRate) },
              { label: "Capital: Equity", value: pct(modelData.wacc.equityPercent) },
              { label: "Capital: Debt", value: pct(modelData.wacc.debtPercent) },
              { label: "Corporate Tax", value: pct(modelData.wacc.taxRate) },
              { label: "WACC", value: pct(modelData.wacc.wacc) },
            ].map((w, i) => (
              <div key={i} style={{ background: T.bg0, borderRadius: 6, padding: "10px 12px" }}>
                <div style={{ fontSize: 10, color: T.textDim, textTransform: "uppercase", letterSpacing: .6 }}>{w.label}</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: T.text, marginTop: 2 }}>{w.value}</div>
              </div>
            ))}
          </div>
        </Card>
      ),
    },
    {
      id: "model-mkt-sensitivity",
      label: "Diluent Price Sensitivity",
      render: () => (
        <Card title="Diluent Price Sensitivity — Impact on IRR">
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[
              { price: "$6/gal", irr: "42%", color: T.danger },
              { price: "$7/gal", irr: "55%", color: T.warn },
              { price: "$8/gal", irr: "68%", color: T.accent },
              { price: "$10/gal", irr: "85%", color: T.green },
              { price: "$12/gal", irr: "95%+", color: T.green },
              { price: "$14/gal", irr: "100%+", color: T.green },
            ].map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 60, fontSize: 12, color: T.textMid, textAlign: "right" }}>{s.price}</div>
                <div style={{ flex: 1, height: 20, background: T.bg0, borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ width: `${Math.min(parseInt(s.irr), 100)}%`, height: "100%", background: s.color, borderRadius: 4, display: "flex", alignItems: "center", paddingLeft: 8 }}>
                    <span style={{ fontSize: 10, color: "#1A1A1A", fontWeight: 600 }}>{s.irr}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ),
    },
  ];

  return (
    <DraggableGrid
      widgets={widgets}
      layoutLocked={layoutLocked}
      setLayoutLocked={setLayoutLocked}
      storageKey="sens-model-market-layout"
    />
  );
};

// ─── Main View ───

const tabs = [
  { key: "financial", label: "Financial Projections" },
  { key: "delivery", label: "Delivery & Construction" },
  { key: "operations", label: "Operations & Costs" },
  { key: "market", label: "Market & Pricing" },
];

export const ModelView = () => {
  const [tab, setTab] = useState("financial");
  const [layoutLocked, setLayoutLocked] = useState(true);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <TabBar tabs={tabs} active={tab} onChange={setTab} />
      {tab === "financial" && <FinancialTab layoutLocked={layoutLocked} setLayoutLocked={setLayoutLocked} />}
      {tab === "delivery" && <DeliveryTab layoutLocked={layoutLocked} setLayoutLocked={setLayoutLocked} />}
      {tab === "operations" && <OperationsTab layoutLocked={layoutLocked} setLayoutLocked={setLayoutLocked} />}
      {tab === "market" && <MarketTab layoutLocked={layoutLocked} setLayoutLocked={setLayoutLocked} />}
    </div>
  );
};
