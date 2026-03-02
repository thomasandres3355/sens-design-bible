import { useState, useMemo } from "react";
import { T } from "@core/theme/theme";
import { activeSites, constructionSites, sitePlan } from "@core/data/sites";
import { EngineLight, KpiCard, StatusPill, Progress, SectionHeader, Card, DataTable, TabBar, MetricGrid, FacilityView, ZoneDetail, DraggableGrid, DraggableCardRow } from "@core/ui";
import { SiteGridView } from "@modules/operations/PortfolioMapView";

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

export const OperationsView = ({ fixedTab, maintenanceScope }) => {
  const [tab, setTab] = useState(fixedTab || "plant");
  const [sel, setSel] = useState(null);
  const [feedstock, setFeedstock] = useState("all");
  const [selSite, setSelSite] = useState(activeSites[0]?.id);
  const [invDrill, setInvDrill] = useState(null);
  const [logInvDrill, setLogInvDrill] = useState(null);
  const [layoutLocked, setLayoutLocked] = useState(true);
  const filteredActive = filterByFeedstock(activeSites, feedstock);

  // Ensure selected site is valid within filter
  const site = filteredActive.find(s => s.id === selSite) || filteredActive[0];

  // Build enriched site object for SiteGridView (needs tphPerMachine, series, region)
  const enrichedSite = useMemo(() => {
    if (!site) return null;
    return { ...site, tphPerMachine: site.feedstock === "Coal" ? 20 : 2, series: site.feedstock === "Coal" ? "C" : "A", region: "US" };
  }, [site]);

  const tabsConfig = [
    { key: "plant", label: "Plant Ops" },
    { key: "maintenance", label: "Maintenance" },
    { key: "hse", label: "Risk" },
    { key: "logistics", label: "Logistics" }
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        {!fixedTab && <TabBar
          tabs={tabsConfig}
          active={tab}
          onChange={k => { setTab(k); setSel(null); }}
        />}
        <FeedstockFilter value={feedstock} onChange={setFeedstock} />
      </div>

      {/* Empty state when filter has no matches */}
      {filteredActive.length === 0 && (
        <Card title="No Operational Sites">
          <div style={{ padding: 24, textAlign: "center", color: T.textMid, fontSize: 13 }}>
            No operational sites match the selected feedstock filter. Coal sites are currently in development — switch to <strong>All Feedstock</strong> or <strong>Tires</strong> to view operational data.
          </div>
        </Card>
      )}

      {/* PLANT OPS TAB */}
      {tab === "plant" && !sel && filteredActive.length > 0 && (
        <DraggableGrid
          widgets={[
            {
              id: "ops-plant-site-sel",
              label: "Site Selector",
              render: () => (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {filteredActive.map(s => (
                    <button
                      key={s.id}
                      onClick={() => { setSelSite(s.id); setSel(null); }}
                      style={{
                        padding: "8px 16px",
                        borderRadius: 6,
                        border: `1px solid ${selSite === s.id ? T.accent : T.border}`,
                        background: selSite === s.id ? T.accentBg : T.bg1,
                        color: selSite === s.id ? T.accent : T.text,
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: "pointer",
                        transition: "all 0.2s"
                      }}
                    >
                      {s.short}
                    </button>
                  ))}
                </div>
              ),
            },
            {
              id: "ops-plant-engine",
              label: "Engine Lights",
              render: () => (
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <EngineLight
                    on={site.uptime < 85}
                    color={site.uptime < 85 ? "warn" : "green"}
                    label={`${site.short} Uptime ${site.uptime}%`}
                  />
                  <EngineLight on={false} color="green" label="Feed Supply OK" />
                  <EngineLight on={false} color="green" label="Product Quality OK" />
                  <EngineLight on={site.uptime < 80} color="danger" label="Below Target" />
                  <EngineLight on={false} color="green" label="Zero Waste" />
                </div>
              ),
            },
            {
              id: "ops-plant-kpis",
              label: "KPI Cards",
              render: () => {
                const sp = sitePlan(site);
                const revMTD = site.throughput * site.processors * 8.5;
                const revTarget = Math.round(sp.planRevenue / 12 * 1000);
                return (
                  <DraggableCardRow
                    items={[
                      { id: "ops-kpi-tph", label: "Throughput", value: `${site.throughput} TPH`, sub: `Plan: ${sp.tphPlan} TPH`, color: T.accent, target: sp.tphPlan, threshold: Math.round(sp.tphPlan * 0.7), unit: " TPH", spark: [site.throughput * 0.88, site.throughput * 0.91, site.throughput * 0.85, site.throughput * 0.93, site.throughput * 0.96, site.throughput * 0.90, site.throughput * 0.94, site.throughput * 0.97, site.throughput * 0.92, site.throughput * 0.99, site.throughput * 0.95, site.throughput], sparkTarget: sp.tphPlan },
                      { id: "ops-kpi-uptime", label: "Uptime", value: `${site.uptime}%`, sub: `Plan: ${sp.uptimePlan}%`, color: site.uptime >= sp.uptimePlan ? T.green : T.warn, target: sp.uptimePlan, threshold: 75, spark: [site.uptime - 6, site.uptime - 3, site.uptime - 8, site.uptime - 2, site.uptime + 1, site.uptime - 4, site.uptime - 1, site.uptime + 2, site.uptime - 5, site.uptime + 1, site.uptime - 2, site.uptime], sparkTarget: sp.uptimePlan },
                      { id: "ops-kpi-proc", label: "Processors", value: site.processors, sub: `${site.processors} Active / ${site.processors} Total`, color: T.blue },
                      { id: "ops-kpi-rev", label: "Revenue MTD", value: `$${revMTD.toFixed(0)}K`, sub: `Plan: $${revTarget}K/mo`, color: revMTD >= revTarget ? T.green : T.warn, target: revTarget, threshold: Math.round(revTarget * 0.7), unit: "K" },
                    ]}
                    locked={layoutLocked}
                    storageKey="sens-ops-plant-cards-kpis"
                    renderItem={(item) => <KpiCard label={item.label} value={item.value} sub={item.sub} color={item.color} target={item.target} threshold={item.threshold} unit={item.unit} spark={item.spark} sparkTarget={item.sparkTarget} invert={item.invert} />}
                  />
                );
              },
            },
            {
              id: "ops-plant-streams",
              label: "Product Streams",
              render: () => (
                <Card title="Product Streams — Daily Output">
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                    {(() => {
                      const dilTarget = Math.round(site.processors * 16);
                      const cbTarget = Math.round(site.processors * 140);
                      const sgTarget = Math.round(site.processors * 2.8 * 10) / 10;
                      const waterTarget = Math.round(site.processors * 15);
                      const dilRate = (site.diluentGal / 1000);
                      const cbRate = site.carbonT;
                      const sgRate = site.processors * 2.4;
                      const waterRate = site.processors * 12;
                      return [
                        { name: "Diluent", rate: dilRate.toFixed(1), unit: "K gal", rev: "38%", target: dilTarget, threshold: Math.round(dilTarget * 0.7), actual: dilRate },
                        { name: "Carbon Black", rate: cbRate, unit: "T", rev: "42%", target: cbTarget, threshold: Math.round(cbTarget * 0.7), actual: cbRate },
                        { name: "Syn Gas", rate: sgRate.toFixed(1), unit: "MMSCF", rev: "18%", target: sgTarget, threshold: null, actual: sgRate },
                        { name: "Water", rate: waterRate.toFixed(0), unit: "gal", rev: "2%", target: waterTarget, threshold: null, actual: waterRate, isRecovery: true }
                      ];
                    })().map((p, i) => {
                      const pctOfTarget = p.target ? (p.actual / p.target * 100) : null;
                      const atTarget = pctOfTarget != null && pctOfTarget >= 100;
                      const belowThreshold = p.threshold != null && p.actual < p.threshold;
                      const statusColor = belowThreshold ? T.danger : atTarget ? T.green : T.warn;
                      return (
                        <div key={i} style={{ padding: 12, background: T.bg1, borderRadius: 6, border: `1px solid ${T.border}` }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                            <span style={{ fontSize: 11, color: T.textDim }}>{p.name}</span>
                            {pctOfTarget != null && <div style={{ width: 6, height: 6, borderRadius: "50%", background: statusColor, boxShadow: `0 0 6px ${statusColor}40` }} />}
                          </div>
                          <div style={{ fontSize: 18, fontWeight: 600, color: T.text, marginBottom: 2 }}>
                            {p.isRecovery ? `${Math.round(p.actual / p.target * 100)}%` : `${p.rate} ${p.unit}`}
                            {p.isRecovery && <span style={{ fontSize: 11, color: T.textDim, fontWeight: 400, marginLeft: 4 }}>recovery</span>}
                          </div>
                          {!p.isRecovery && <div style={{ fontSize: 10, color: T.textDim, marginBottom: 4 }}>Target: {p.target} {p.unit}{p.threshold != null ? ` · Fail: ${p.threshold} ${p.unit}` : ""}</div>}
                          {p.isRecovery && <div style={{ fontSize: 10, color: T.textDim, marginBottom: 4 }}>Target: {p.target} {p.unit} ({Math.round(p.actual / p.target * 100)}% of target)</div>}
                          <Progress pct={pctOfTarget != null ? Math.min(pctOfTarget, 100) : 0} color={statusColor} h={4} target={100} threshold={p.threshold != null ? (p.threshold / p.target * 100) : undefined} />
                          <div style={{ fontSize: 10, color: T.textMid, marginTop: 4 }}>Revenue: {p.rev}</div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              ),
            },
            ...(enrichedSite ? [{
              id: "ops-plant-flow",
              label: "Flow Chart",
              render: () => (
                <div style={{ borderRadius: 10, border: `1px solid ${T.border}`, overflow: "hidden" }}>
                  <SiteGridView site={enrichedSite} embedded />
                </div>
              ),
            }] : []),
            {
              id: "ops-plant-quality",
              label: "Quality Lab",
              render: () => (
                <Card title="Quality / Lab — Latest Batch">
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: T.blue, marginBottom: 8 }}>Diluent Analysis</div>
                      {[
                        { t: "d-Limonene", v: "18.2%", numVal: 18.2, spec: "10-25%", lo: 10, hi: 25, inSpec: true },
                        { t: "Aromatic", v: "91.4%", numVal: 91.4, spec: "85-95%", lo: 85, hi: 95, inSpec: true },
                        { t: "Flash Point", v: "71°F", numVal: 71, spec: ">65°F", lo: 65, hi: null, inSpec: true },
                        { t: "Sp. Gravity", v: "0.9", numVal: 0.9, spec: "0.9-1.0", lo: 0.9, hi: 1.0, inSpec: true }
                      ].map((r, i) => {
                        const withinSpec = r.inSpec && (r.lo == null || r.numVal >= r.lo) && (r.hi == null || r.numVal <= r.hi);
                        const nearEdge = withinSpec && ((r.lo != null && r.hi != null) ? (r.numVal - r.lo < (r.hi - r.lo) * 0.15 || r.hi - r.numVal < (r.hi - r.lo) * 0.15) : false);
                        const statusColor = !withinSpec ? T.danger : nearEdge ? T.warn : T.green;
                        return (
                          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", borderBottom: `1px solid ${T.border}`, fontSize: 12 }}>
                            <span style={{ color: T.textMid, display: "flex", alignItems: "center", gap: 6 }}>
                              <div style={{ width: 6, height: 6, borderRadius: "50%", background: statusColor, boxShadow: `0 0 4px ${statusColor}40`, flexShrink: 0 }} />
                              {r.t}
                            </span>
                            <span style={{ color: statusColor, fontWeight: 500 }}>{r.v} <span style={{ color: T.textDim, fontSize: 10 }}>({r.spec})</span></span>
                          </div>
                        );
                      })}
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: T.textMid, marginBottom: 8 }}>Carbon Black</div>
                      {[
                        { t: "Iodine", v: "85 Mg/kg", numVal: 85, spec: "82 ctrl", lo: 75, hi: 95, inSpec: true },
                        { t: "Tensile", v: "2,771 psi", numVal: 2771, spec: "3,402 ctrl", lo: 2500, hi: 3800, inSpec: true, nearCtrl: true },
                        { t: "Particle", v: "29 nm", numVal: 29, spec: "27 ctrl", lo: 22, hi: 35, inSpec: true },
                        { t: "Moisture", v: "0.3%", numVal: 0.3, spec: "<1.0%", lo: null, hi: 1.0, inSpec: true }
                      ].map((r, i) => {
                        const withinSpec = r.inSpec && (r.lo == null || r.numVal >= r.lo) && (r.hi == null || r.numVal <= r.hi);
                        const nearEdge = withinSpec && r.nearCtrl;
                        const statusColor = !withinSpec ? T.danger : nearEdge ? T.warn : T.green;
                        return (
                          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", borderBottom: `1px solid ${T.border}`, fontSize: 12 }}>
                            <span style={{ color: T.textMid, display: "flex", alignItems: "center", gap: 6 }}>
                              <div style={{ width: 6, height: 6, borderRadius: "50%", background: statusColor, boxShadow: `0 0 4px ${statusColor}40`, flexShrink: 0 }} />
                              {r.t}
                            </span>
                            <span style={{ color: statusColor, fontWeight: 500 }}>{r.v} <span style={{ color: T.textDim, fontSize: 10 }}>({r.spec})</span></span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </Card>
              ),
            },
            {
              id: "ops-plant-contracts",
              label: "Contract Output",
              render: () => (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.textMid, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 16 }}>Contract-Linked Output</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
                    {[
                      { contract: "CNT-2024-001", product: "Diluent", monthlyQty: "450K gal", ytdVolume: "1.8M gal", revenue: "$324K", status: "green" },
                      { contract: "CNT-2024-005", product: "Carbon Black", monthlyQty: "180T", ytdVolume: "720T", revenue: "$216K", status: "green" },
                      { contract: "CNT-2024-012", product: "Syn Gas", monthlyQty: "35 MMSCF", ytdVolume: "140 MMSCF", revenue: "$84K", status: "yellow" },
                    ].map((c, i) => (
                      <Card key={i} title={`${c.contract} — ${c.product}`} titleColor={c.status === "green" ? T.green : T.warn}>
                        <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                          <StatusPill status={c.status} />
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                          <div style={{ padding: "8px 10px", background: T.bg0, borderRadius: 6, textAlign: "center" }}>
                            <div style={{ fontSize: 10, color: T.textDim }}>Monthly</div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{c.monthlyQty}</div>
                          </div>
                          <div style={{ padding: "8px 10px", background: T.bg0, borderRadius: 6, textAlign: "center" }}>
                            <div style={{ fontSize: 10, color: T.textDim }}>YTD Volume</div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{c.ytdVolume}</div>
                          </div>
                        </div>
                        <div style={{ fontSize: 11, color: T.textDim, borderTop: `1px solid ${T.border}`, paddingTop: 6, display: "flex", justifyContent: "space-between" }}>
                          <span>Revenue</span>
                          <span style={{ color: T.green, fontWeight: 700, fontSize: 14 }}>{c.revenue}</span>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ),
            },
          ]}
          storageKey={`sens-ops-plant-layout`}
          locked={layoutLocked}
          onLockedChange={setLayoutLocked}
        />
      )}

      {/* Supply Chain Inventory — separate from DraggableGrid due to drill-down state */}
      {tab === "plant" && !sel && filteredActive.length > 0 &&
          <Card title="Supply Chain Inventory" action={invDrill && <button onClick={() => setInvDrill(null)} style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 6, padding: "4px 10px", color: T.textMid, cursor: "pointer", fontSize: 11 }}>← All Sites</button>}>
            {!invDrill ? (<>
              {/* Global aggregated view */}
              {(() => {
                const avgFeed = Math.round(filteredActive.reduce((a, s) => a + 45 + s.processors, 0) / filteredActive.length);
                const avgFuel = Math.round(filteredActive.reduce((a, s) => a + 32 + s.processors, 0) / filteredActive.length);
                const minFeed = Math.min(...filteredActive.map(s => 45 + s.processors));
                const minFuel = Math.min(...filteredActive.map(s => 32 + s.processors));
                return (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                    <div style={{ padding: "12px 14px", background: T.bg0, borderRadius: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: T.blue }}>Crumb Feed</span>
                        <span style={{ fontSize: 18, fontWeight: 700, color: T.text }}>{avgFeed}d avg</span>
                      </div>
                      <Progress pct={Math.min((avgFeed / 60) * 100, 100)} color={avgFeed > 30 ? T.blue : T.warn} h={8} />
                      <div style={{ fontSize: 10, color: T.textDim, marginTop: 4 }}>Min: {minFeed}d · {filteredActive.length} sites</div>
                    </div>
                    <div style={{ padding: "12px 14px", background: T.bg0, borderRadius: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: T.accent }}>Process Fuel</span>
                        <span style={{ fontSize: 18, fontWeight: 700, color: T.text }}>{avgFuel}d avg</span>
                      </div>
                      <Progress pct={Math.min((avgFuel / 60) * 100, 100)} color={avgFuel > 25 ? T.accent : T.warn} h={8} />
                      <div style={{ fontSize: 10, color: T.textDim, marginTop: 4 }}>Min: {minFuel}d · {filteredActive.length} sites</div>
                    </div>
                  </div>
                );
              })()}
              {/* Per-site summary row — click to drill */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
                {filteredActive.map(s => {
                  const feedDays = 45 + s.processors;
                  const fuelDays = 32 + s.processors;
                  const lowestDay = Math.min(feedDays, fuelDays);
                  return (
                    <div key={s.id} onClick={() => setInvDrill(s.id)} style={{ padding: "10px 12px", background: T.bg1, borderRadius: 8, border: `1px solid ${T.border}`, cursor: "pointer", transition: "all 0.2s" }} onMouseEnter={e => { e.currentTarget.style.borderColor = T.accent; }} onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: T.accent, marginBottom: 6 }}>{s.short}</div>
                      <div style={{ display: "flex", gap: 12 }}>
                        <div>
                          <div style={{ fontSize: 10, color: T.textDim }}>Feed</div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: feedDays < 30 ? T.warn : T.text }}>{feedDays}d</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, color: T.textDim }}>Fuel</div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: fuelDays < 25 ? T.warn : T.text }}>{fuelDays}d</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>) : (<>
              {/* Drill-down: selected site detail */}
              {(() => {
                const s = filteredActive.find(x => x.id === invDrill) || filteredActive[0];
                if (!s) return null;
                const feedDays = 45 + s.processors;
                const fuelDays = 32 + s.processors;
                const items = [
                  { name: "Crumb Feed", days: feedDays, fill: 65 + s.processors * 2, color: T.blue, capacity: `${(s.processors * 120).toLocaleString()} T`, rate: `${(s.processors * 4).toFixed(0)} T/day` },
                  { name: "Process Fuel", days: fuelDays, fill: 55 + s.processors * 3, color: T.accent, capacity: `${(s.processors * 80).toLocaleString()} gal`, rate: `${(s.processors * 2.5).toFixed(0)} gal/day` },
                  { name: "Process Chemicals", days: Math.round(feedDays * 1.2), fill: 70, color: T.green, capacity: `${s.processors * 40} L`, rate: `${s.processors} L/day` },
                  { name: "Spare Parts", days: 90, fill: 82, color: T.textMid, capacity: `${s.processors * 12} units`, rate: "As needed" },
                ];
                return (
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.accent, marginBottom: 12 }}>{s.short} — {s.processors} Processors</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      {items.map((inv, i) => (
                        <div key={i} style={{ padding: "10px 12px", background: T.bg0, borderRadius: 8 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: inv.color }}>{inv.name}</span>
                            <span style={{ fontSize: 16, fontWeight: 700, color: inv.days < 30 ? T.warn : T.text }}>{inv.days}d</span>
                          </div>
                          <Progress pct={inv.fill} color={inv.days < 30 ? T.warn : inv.color} h={6} />
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: T.textDim, marginTop: 4 }}>
                            <span>Cap: {inv.capacity}</span>
                            <span>Usage: {inv.rate}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </>)}
          </Card>
      }

      {tab === "plant" && sel && (
        <ZoneDetail zone={sel} onBack={() => setSel(null)} site={site} />
      )}

      {/* MAINTENANCE TAB */}
      {tab === "maintenance" && maintenanceScope === "facilities" && (
        <DraggableGrid
          widgets={[
            {
              id: "fac-maint-engine",
              label: "Facilities Status",
              render: () => (
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <EngineLight on={false} color="green" label="HVAC Operational" />
                  <EngineLight on={false} color="green" label="Fire Suppression OK" />
                  <EngineLight on={true} color="warn" label="Backup Gen Service Due" />
                  <EngineLight on={false} color="green" label="Building Inspection Current" />
                </div>
              ),
            },
            {
              id: "fac-maint-kpis",
              label: "Facilities KPIs",
              render: () => (
                <DraggableCardRow
                  items={[
                    { id: "fac-kpi-1", label: "Open Facilities WOs", value: "5", color: T.warn, target: 0, threshold: 8, invert: true },
                    { id: "fac-kpi-2", label: "Overdue", value: "1", color: T.warn, target: 0, threshold: 2, invert: true },
                    { id: "fac-kpi-3", label: "Building Compliance", value: "94%", color: T.green, target: 100, threshold: 90 },
                    { id: "fac-kpi-4", label: "Avg Response Time", value: "2.4 hrs", color: T.blue, target: "2 hrs", threshold: "4 hrs" },
                    { id: "fac-kpi-5", label: "Scheduled Inspections", value: "3", sub: "This month", color: T.textMid },
                  ]}
                  locked={layoutLocked}
                  storageKey="sens-fac-maint-cards-kpis"
                  renderItem={(item) => <KpiCard label={item.label} value={item.value} sub={item.sub} color={item.color} target={item.target} threshold={item.threshold} invert={item.invert} />}
                />
              ),
            },
            {
              id: "fac-maint-workorders",
              label: "Facilities Work Orders",
              render: () => (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.textMid, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 16 }}>Facilities Work Orders</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
                    {[
                      { wo: "FWO-101", asset: "HVAC Compressor Unit 2", type: "Preventive", priority: "Medium", assigned: "T. Garcia", hours: 6, due: "3/1", status: "green", priorityColor: T.blue },
                      { wo: "FWO-102", asset: "Fire Alarm Panel — Bldg A", type: "Corrective", priority: "High", assigned: "K. Patel", hours: 3, due: "Today", status: "yellow", priorityColor: T.warn },
                      { wo: "FWO-103", asset: "Roof Drainage — Warehouse", type: "Corrective", priority: "Low", assigned: "D. Chen", hours: 4, due: "3/5", status: "blue", priorityColor: T.textDim },
                    ].map((w, i) => (
                      <Card key={i} title={`${w.wo} — ${w.asset}`} titleColor={w.priorityColor}>
                        <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
                          <StatusPill status={w.status} />
                          <span style={{ fontSize: 11, color: T.textDim, background: T.bg0, padding: "3px 8px", borderRadius: 4 }}>{w.type}</span>
                          <span style={{ fontSize: 11, color: w.priorityColor, background: T.bg0, padding: "3px 8px", borderRadius: 4, fontWeight: 600 }}>{w.priority}</span>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                          <div style={{ padding: "8px 10px", background: T.bg0, borderRadius: 6 }}>
                            <div style={{ fontSize: 10, color: T.textDim }}>Assigned</div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{w.assigned}</div>
                          </div>
                          <div style={{ padding: "8px 10px", background: T.bg0, borderRadius: 6 }}>
                            <div style={{ fontSize: 10, color: T.textDim }}>Hours Est.</div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{w.hours} hrs</div>
                          </div>
                        </div>
                        <div style={{ fontSize: 11, color: T.textDim, marginTop: 8, borderTop: `1px solid ${T.border}`, paddingTop: 6 }}>
                          Due: <span style={{ color: w.due === "Today" ? T.warn : T.text, fontWeight: 600 }}>{w.due}</span>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ),
            },
            {
              id: "fac-maint-systems",
              label: "Building Systems",
              render: () => (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.textMid, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 16 }}>Building Systems Monitoring</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
                    {[
                      { system: "HVAC", status: "Operational", health: 92, trend: "→", color: T.green, detail: "3 units active, 1 standby" },
                      { system: "Electrical", status: "Operational", health: 98, trend: "→", color: T.green, detail: "All panels normal, backup gen tested" },
                      { system: "Water / Sewer", status: "Monitor", health: 85, trend: "↘", color: T.warn, detail: "Drainage flow reduced — inspection scheduled" },
                      { system: "Security", status: "Operational", health: 100, trend: "→", color: T.green, detail: "All cameras online, access control active" },
                    ].map((sys, i) => (
                      <Card key={i} title={sys.system} titleColor={sys.color}>
                        <div style={{ display: "flex", justifyContent: "center", alignItems: "baseline", gap: 8, marginBottom: 12 }}>
                          <div style={{ fontSize: 28, fontWeight: 700, color: T.text }}>{sys.health}%</div>
                          <div style={{ fontSize: 16, color: sys.trend === "↘" ? T.warn : T.textDim, fontWeight: 600 }}>{sys.trend}</div>
                        </div>
                        <Progress pct={sys.health} color={sys.color} h={6} target={100} threshold={90} />
                        <div style={{ fontSize: 11, color: T.textMid, marginTop: 10 }}>{sys.detail}</div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, marginTop: 8, borderTop: `1px solid ${T.border}`, paddingTop: 6 }}>
                          <span style={{ color: T.textDim }}>{sys.status}</span>
                          <StatusPill status={sys.health >= 95 ? "green" : sys.health >= 85 ? "yellow" : "red"} />
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ),
            },
            {
              id: "fac-maint-infrastructure",
              label: "Site Infrastructure",
              render: () => (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.textMid, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 16 }}>Site Infrastructure Summary</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
                    {filteredActive.map(s => (
                      <Card key={s.id} title={s.short} titleColor={T.accent}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                          <div style={{ padding: "8px 10px", background: T.bg0, borderRadius: 6 }}>
                            <div style={{ fontSize: 10, color: T.textDim }}>Buildings</div>
                            <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>{Math.max(2, s.processors + 1)}</div>
                          </div>
                          <div style={{ padding: "8px 10px", background: T.bg0, borderRadius: 6 }}>
                            <div style={{ fontSize: 10, color: T.textDim }}>Open WOs</div>
                            <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>{s.processors % 2 + 1}</div>
                          </div>
                        </div>
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
                            <span style={{ color: T.textDim }}>Facilities Compliance</span>
                            <span style={{ color: T.green, fontWeight: 600 }}>94%</span>
                          </div>
                          <Progress pct={94} color={T.green} h={6} />
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginTop: 8, borderTop: `1px solid ${T.border}`, paddingTop: 6 }}>
                          <span style={{ color: T.textDim }}>Last Inspection: <span style={{ color: T.text, fontWeight: 600 }}>Feb 15</span></span>
                          <span style={{ color: T.textDim }}>Next: <span style={{ color: T.text, fontWeight: 600 }}>Mar 15</span></span>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ),
            },
          ]}
          storageKey="sens-fac-maint-layout"
          locked={layoutLocked}
          onLockedChange={setLayoutLocked}
        />
      )}
      {tab === "maintenance" && maintenanceScope !== "facilities" && (
        <DraggableGrid
          widgets={[
            {
              id: "ops-maint-engine",
              label: "Engine Lights",
              render: () => (
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <EngineLight on={false} color="green" label="PM Schedule" />
                  <EngineLight on={true} color="warn" label="WO-042 Due Today" />
                  <EngineLight on={false} color="green" label="Parts Inventory" />
                  <EngineLight on={false} color="green" label="IoT Sensors Normal" />
                </div>
              ),
            },
            {
              id: "ops-maint-kpis",
              label: "KPI Cards",
              render: () => (
                <DraggableCardRow
                  items={[
                    { id: "ops-maint-kpi-1", label: "Open WOs", value: "3", color: T.warn, target: 0, threshold: 5, invert: true },
                    { id: "ops-maint-kpi-2", label: "Overdue", value: "0", color: T.green, target: 0, threshold: 1, invert: true },
                    { id: "ops-maint-kpi-3", label: "PM Compliance", value: "96%", color: T.green, target: 98, threshold: 90 },
                    { id: "ops-maint-kpi-4", label: "MTBF", value: "340 hrs", color: T.blue, target: 400, threshold: 250, unit: " hrs" },
                    { id: "ops-maint-kpi-5", label: "Planned Downtime", value: "8 hrs", sub: "This week", color: T.textMid, target: "4 hrs", threshold: "16 hrs", invert: true },
                  ]}
                  locked={layoutLocked}
                  storageKey="sens-ops-maint-cards-kpis"
                  renderItem={(item) => <KpiCard label={item.label} value={item.value} sub={item.sub} color={item.color} target={item.target} threshold={item.threshold} invert={item.invert} unit={item.unit} />}
                />
              ),
            },
            {
              id: "ops-maint-workorders",
              label: "Work Orders",
              render: () => (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.textMid, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 16 }}>Work Orders</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
                    {[
                      { wo: "WO-040", asset: "Conveyor Motor", type: "Preventive", priority: "Medium", assigned: "J. Smith", hours: 4, due: "2/28", status: "green", priorityColor: T.blue },
                      { wo: "WO-042", asset: "Heat Exchanger", type: "Predictive", priority: "High", assigned: "M. Johnson", hours: 8, due: "Today", status: "yellow", priorityColor: T.warn },
                      { wo: "WO-043", asset: "Loading Pump", type: "Corrective", priority: "Low", assigned: "R. Lee", hours: 3, due: "3/3", status: "blue", priorityColor: T.textDim },
                    ].map((w, i) => (
                      <Card key={i} title={`${w.wo} — ${w.asset}`} titleColor={w.priorityColor}>
                        <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
                          <StatusPill status={w.status} />
                          <span style={{ fontSize: 11, color: T.textDim, background: T.bg0, padding: "3px 8px", borderRadius: 4 }}>{w.type}</span>
                          <span style={{ fontSize: 11, color: w.priorityColor, background: T.bg0, padding: "3px 8px", borderRadius: 4, fontWeight: 600 }}>{w.priority}</span>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                          <div style={{ padding: "8px 10px", background: T.bg0, borderRadius: 6 }}>
                            <div style={{ fontSize: 10, color: T.textDim }}>Assigned</div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{w.assigned}</div>
                          </div>
                          <div style={{ padding: "8px 10px", background: T.bg0, borderRadius: 6 }}>
                            <div style={{ fontSize: 10, color: T.textDim }}>Hours Est.</div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{w.hours} hrs</div>
                          </div>
                        </div>
                        <div style={{ fontSize: 11, color: T.textDim, marginTop: 8, borderTop: `1px solid ${T.border}`, paddingTop: 6 }}>
                          Due: <span style={{ color: w.due === "Today" ? T.warn : T.text, fontWeight: 600 }}>{w.due}</span>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ),
            },
            {
              id: "ops-maint-iot",
              label: "IoT Sensors",
              render: () => (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.textMid, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 16 }}>IoT Predictive Maintenance</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
                    {[
                      { sensor: "TEMP-01", asset: "Reactor", reading: "412°F", readingNum: 412, thresholdNum: 425, threshold: "<425°F", trend: "→", health: "Normal", status: "green" },
                      { sensor: "VIB-02", asset: "Conveyor", reading: "3.2 mm/s", readingNum: 3.2, thresholdNum: 4.0, threshold: "<4.0", trend: "↗", health: "Monitor", status: "yellow" },
                      { sensor: "TEMP-03", asset: "Heat Exch", reading: "22°F", readingNum: 22, thresholdNum: 25, threshold: "<25°F", trend: "→", health: "Normal", status: "green" },
                      { sensor: "AMP-04", asset: "Feed Auger", reading: "18A", readingNum: 18, thresholdNum: 22, threshold: "<22A", trend: "→", health: "Normal", status: "green" },
                    ].map((s, i) => {
                      const thresholdPct = Math.round((s.readingNum / s.thresholdNum) * 100);
                      const proximityColor = thresholdPct >= 95 ? T.danger : thresholdPct >= 80 ? T.warn : T.green;
                      return (
                        <Card key={i} title={`${s.sensor} — ${s.asset}`} titleColor={s.status === "green" ? T.green : T.warn}>
                          <div style={{ display: "flex", justifyContent: "center", alignItems: "baseline", gap: 8, marginBottom: 12 }}>
                            <div style={{ fontSize: 28, fontWeight: 700, color: T.text }}>{s.reading}</div>
                            <div style={{ fontSize: 16, color: s.trend === "↗" ? T.warn : s.trend === "↘" ? T.green : T.textDim, fontWeight: 600 }}>{s.trend}</div>
                          </div>
                          <div style={{ marginBottom: 8 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: T.textDim, marginBottom: 4 }}>
                              <span>0</span>
                              <span style={{ color: proximityColor, fontWeight: 700, fontSize: 11 }}>{thresholdPct}% of threshold</span>
                              <span>{s.threshold}</span>
                            </div>
                            <Progress pct={thresholdPct} color={proximityColor} h={6} target={100} threshold={90} />
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                            <div style={{ padding: "6px 8px", background: T.bg0, borderRadius: 4, fontSize: 11 }}>
                              <div style={{ color: T.textDim }}>Threshold</div>
                              <div style={{ color: T.textMid, fontWeight: 600 }}>{s.threshold}</div>
                            </div>
                            <div style={{ padding: "6px 8px", background: T.bg0, borderRadius: 4, fontSize: 11 }}>
                              <div style={{ color: T.textDim }}>Headroom</div>
                              <div style={{ color: proximityColor, fontWeight: 600 }}>{100 - thresholdPct}%</div>
                            </div>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, borderTop: `1px solid ${T.border}`, paddingTop: 6 }}>
                            <span style={{ color: T.textDim }}>{s.health}</span>
                            <StatusPill status={s.status} />
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ),
            },
            {
              id: "ops-maint-reliability",
              label: "Equipment Reliability",
              render: () => (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.textMid, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 16 }}>Equipment Reliability by Site</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
                    {filteredActive.map(s => {
                      const mtbf = Math.round(320 + s.processors * 8);
                      const stops = Math.max(0, s.processors % 3);
                      return (
                        <Card key={s.id} title={s.short} titleColor={T.accent}>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                            <div style={{ padding: "8px 10px", background: T.bg0, borderRadius: 6 }}>
                              <div style={{ fontSize: 10, color: T.textDim }}>Processors</div>
                              <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>{s.processors}</div>
                            </div>
                            <div style={{ padding: "8px 10px", background: T.bg0, borderRadius: 6 }}>
                              <div style={{ fontSize: 10, color: T.textDim }}>MTBF</div>
                              <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>{mtbf} hrs</div>
                            </div>
                          </div>
                          <div>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
                              <span style={{ color: T.textDim }}>PM Compliance</span>
                              <span style={{ color: T.green, fontWeight: 600 }}>96%</span>
                            </div>
                            <Progress pct={96} color={T.green} h={6} />
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginTop: 8, borderTop: `1px solid ${T.border}`, paddingTop: 6 }}>
                            <span style={{ color: T.textDim }}>Unplanned Stops: <span style={{ color: stops > 0 ? T.warn : T.green, fontWeight: 600 }}>{stops}</span></span>
                            <span style={{ color: T.textDim }}>Turnaround: <span style={{ color: T.text, fontWeight: 600 }}>Q3 2026</span></span>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ),
            },
          ]}
          storageKey="sens-ops-maint-layout"
          locked={layoutLocked}
          onLockedChange={setLayoutLocked}
        />
      )}

      {/* HSE TAB */}
      {tab === "hse" && (
        <DraggableGrid
          widgets={[
            {
              id: "ops-hse-engine",
              label: "Engine Lights",
              render: () => (
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <EngineLight on={false} color="green" label="Zero LTI 142 days" />
                  <EngineLight on={true} color="warn" label="TRIR 0.8" />
                  <EngineLight on={true} color="warn" label="Tucson AZ Permit Renewal" />
                  <EngineLight on={false} color="green" label="Emissions Compliance" />
                  <EngineLight on={false} color="green" label="Training 93%" />
                </div>
              ),
            },
            {
              id: "ops-hse-kpis",
              label: "KPI Cards",
              render: () => (
                <DraggableCardRow
                  items={[
                    { id: "ops-hse-kpi-1", label: "Days Since LTI", value: "142", color: T.green, target: 365, threshold: 90 },
                    { id: "ops-hse-kpi-2", label: "TRIR", value: "0.8", sub: "Target: < 0.5", color: T.warn, target: 0.5, threshold: 1.0, invert: true },
                    { id: "ops-hse-kpi-3", label: "Open Actions", value: "5", color: T.accent, target: 0, threshold: 10, invert: true },
                    { id: "ops-hse-kpi-4", label: "Active Permits", value: "24", color: T.blue, target: 24 },
                    { id: "ops-hse-kpi-5", label: "Compliance", value: "100%", color: T.green, target: "100%", threshold: "95%" },
                  ]}
                  locked={layoutLocked}
                  storageKey="sens-ops-hse-cards-kpis"
                  renderItem={(item) => <KpiCard label={item.label} value={item.value} sub={item.sub} color={item.color} target={item.target} threshold={item.threshold} invert={item.invert} />}
                />
              ),
            },
            {
              id: "ops-hse-safety",
              label: "Safety Performance",
              render: () => (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.textMid, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 16 }}>Safety Performance by Site</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
                    {filteredActive.map((s, idx) => {
                      const trir = (0.6 + (idx * 0.12)).toFixed(1);
                      const nearMisses = Math.ceil(s.processors + 1);
                      return (
                        <Card key={s.id} title={s.short} titleColor={T.green}>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
                            <div style={{ padding: "8px 10px", background: T.bg0, borderRadius: 6, textAlign: "center" }}>
                              <div style={{ fontSize: 10, color: T.textDim }}>LTI YTD</div>
                              <div style={{ fontSize: 18, fontWeight: 700, color: T.green }}>0</div>
                            </div>
                            <div style={{ padding: "8px 10px", background: T.bg0, borderRadius: 6, textAlign: "center" }}>
                              <div style={{ fontSize: 10, color: T.textDim }}>TRIR</div>
                              <div style={{ fontSize: 18, fontWeight: 700, color: Number(trir) < 0.5 ? T.green : T.warn }}>{trir}</div>
                            </div>
                            <div style={{ padding: "8px 10px", background: T.bg0, borderRadius: 6, textAlign: "center" }}>
                              <div style={{ fontSize: 10, color: T.textDim }}>Near Misses</div>
                              <div style={{ fontSize: 18, fontWeight: 700, color: T.text }}>{nearMisses}</div>
                            </div>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, borderTop: `1px solid ${T.border}`, paddingTop: 6 }}>
                            <span style={{ color: T.textDim }}>Emissions: <span style={{ color: T.green, fontWeight: 600 }}>Within Limits</span></span>
                            <span style={{ color: T.textDim }}>Waste: <span style={{ color: T.green, fontWeight: 600 }}>Zero Disposal</span></span>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ),
            },
            {
              id: "ops-hse-permits",
              label: "Environmental Permits",
              render: () => (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.textMid, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 16 }}>Environmental Permits</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                    {[
                      { type: "Air Permit", site: "Noble OK", issued: "2022-03-15", expires: "2027-03-14", daysLeft: 1083, status: "green" },
                      { type: "Water Discharge", site: "Noble OK", issued: "2021-06-01", expires: "2026-05-31", daysLeft: 97, status: "yellow" },
                      { type: "Tucson AZ Renewal", site: "Baton Rouge", issued: "2023-01-10", expires: "2026-01-09", daysLeft: 19, status: "yellow" },
                      { type: "Hazmat Transport", site: "All Sites", issued: "2024-01-01", expires: "2027-12-31", daysLeft: 678, status: "green" },
                    ].map((p, i) => (
                      <Card key={i} title={p.type} titleColor={p.status === "green" ? T.green : T.warn}>
                        <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                          <StatusPill status={p.status} />
                          <span style={{ fontSize: 11, color: T.textDim, background: T.bg0, padding: "3px 8px", borderRadius: 4 }}>{p.site}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
                          <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: 28, fontWeight: 700, color: p.daysLeft < 100 ? T.warn : T.text }}>{p.daysLeft.toLocaleString()}</div>
                            <div style={{ fontSize: 10, color: T.textDim }}>days remaining</div>
                          </div>
                        </div>
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
                            <span style={{ color: T.textDim }}>Expiry Progress</span>
                            <span style={{ color: T.textMid }}>{p.expires}</span>
                          </div>
                          <Progress pct={Math.max(5, 100 - (p.daysLeft / 1825 * 100))} color={p.daysLeft < 100 ? T.warn : T.green} h={6} />
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ),
            },
            {
              id: "ops-hse-actions",
              label: "Open Safety Actions",
              render: () => (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.textMid, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 16 }}>Open Safety Actions</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
                    {[
                      { id: "ACT-2024-118", category: "Training Gap", site: "Noble OK", owner: "K. Williams", due: "2/28", status: "yellow" },
                      { id: "ACT-2024-125", category: "Equipment Guard", site: "Baton Rouge", owner: "S. Brown", due: "3/15", status: "blue" },
                      { id: "ACT-2024-131", category: "Emergency Shower", site: "Tucson AZ", owner: "D. Martinez", due: "3/1", status: "blue" },
                      { id: "ACT-2024-144", category: "Confined Space", site: "Noble OK", owner: "J. Garcia", due: "3/10", status: "blue" },
                      { id: "ACT-2024-152", category: "PPE Audit", site: "All Sites", owner: "M. Chen", due: "2/26", status: "yellow" },
                    ].map((a, i) => (
                      <Card key={i} title={`${a.id} — ${a.category}`} titleColor={a.status === "yellow" ? T.warn : T.blue}>
                        <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
                          <StatusPill status={a.status} />
                          <span style={{ fontSize: 11, color: T.textDim, background: T.bg0, padding: "3px 8px", borderRadius: 4 }}>{a.site}</span>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                          <div style={{ padding: "6px 10px", background: T.bg0, borderRadius: 6 }}>
                            <div style={{ fontSize: 10, color: T.textDim }}>Owner</div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{a.owner}</div>
                          </div>
                          <div style={{ padding: "6px 10px", background: T.bg0, borderRadius: 6 }}>
                            <div style={{ fontSize: 10, color: T.textDim }}>Due</div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{a.due}</div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ),
            },
          ]}
          storageKey="sens-ops-hse-layout"
          locked={layoutLocked}
          onLockedChange={setLayoutLocked}
        />
      )}

      {/* LOGISTICS TAB */}
      {tab === "logistics" && (
        <DraggableGrid
          widgets={[
            {
              id: "ops-log-engine",
              label: "Engine Lights",
              render: () => (
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <EngineLight on={false} color="green" label="All Deliveries On Track" />
                  <EngineLight on={false} color="green" label="Tank Levels OK" />
                  <EngineLight on={false} color="green" label="Carrier Schedule" />
                  <EngineLight on={false} color="green" label="Inventory > 30 days" />
                </div>
              ),
            },
            {
              id: "ops-log-kpis",
              label: "KPI Cards",
              render: () => (
                <DraggableCardRow
                  items={[
                    { id: "ops-log-kpi-1", label: "Inbound Today", value: "192 T", color: T.blue, target: "200 T" },
                    { id: "ops-log-kpi-2", label: "Outbound MTD", value: "48 loads", color: T.accent, target: "55 loads", threshold: "40 loads" },
                    { id: "ops-log-kpi-3", label: "On-Time", value: "97%", color: T.green, target: 98, threshold: 90 },
                    { id: "ops-log-kpi-4", label: "Tank Utilization", value: "72%", color: T.textMid, target: 80, threshold: 95, invert: true },
                    { id: "ops-log-kpi-5", label: "Inventory", value: "52 days", sub: "On hand", color: T.blue, target: "60 days", threshold: "30 days" },
                  ]}
                  locked={layoutLocked}
                  storageKey="sens-ops-log-cards-kpis"
                  renderItem={(item) => <KpiCard label={item.label} value={item.value} sub={item.sub} color={item.color} target={item.target} threshold={item.threshold} invert={item.invert} />}
                />
              ),
            },
            {
              id: "ops-log-inbound",
              label: "Inbound Feed",
              render: () => (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.textMid, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 16 }}>Inbound Feed — Suppliers</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
                    {[
                      { supplier: "TireRecycle Inc", product: "Crumb Feed", volume: "240 T", received: "2/22", daysOnHand: 18, nextDelivery: "2/28", status: "green" },
                      { supplier: "RegionalPlastics Co", product: "Plastic Waste", volume: "85 T", received: "2/20", daysOnHand: 12, nextDelivery: "3/2", status: "yellow" },
                      { supplier: "EcoMaterials LLC", product: "Mixed Polymer", volume: "120 T", received: "2/24", daysOnHand: 35, nextDelivery: "3/15", status: "green" },
                    ].map((f, i) => (
                      <Card key={i} title={f.supplier} titleColor={f.status === "green" ? T.green : T.warn}>
                        <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                          <StatusPill status={f.status} />
                          <span style={{ fontSize: 11, color: T.textDim, background: T.bg0, padding: "3px 8px", borderRadius: 4 }}>{f.product}</span>
                          <span style={{ fontSize: 11, color: T.textDim, background: T.bg0, padding: "3px 8px", borderRadius: 4 }}>{f.volume}</span>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
                          <div style={{ padding: "8px 10px", background: T.bg0, borderRadius: 6, textAlign: "center" }}>
                            <div style={{ fontSize: 10, color: T.textDim }}>Days on Hand</div>
                            <div style={{ fontSize: 18, fontWeight: 700, color: f.daysOnHand < 15 ? T.warn : T.text }}>{f.daysOnHand}</div>
                          </div>
                          <div style={{ padding: "8px 10px", background: T.bg0, borderRadius: 6, textAlign: "center" }}>
                            <div style={{ fontSize: 10, color: T.textDim }}>Received</div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{f.received}</div>
                          </div>
                          <div style={{ padding: "8px 10px", background: T.bg0, borderRadius: 6, textAlign: "center" }}>
                            <div style={{ fontSize: 10, color: T.textDim }}>Next</div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{f.nextDelivery}</div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ),
            },
            {
              id: "ops-log-tanks",
              label: "Storage & Tanks",
              render: () => (
                <Card title="Storage & Tank Levels">
                  <div style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 8 }}>
                    {[
                      { name: "Diluent", fill: 78, capacity: "400K gal", color: T.blue },
                      { name: "Product Oil", fill: 62, capacity: "300K gal", color: T.accent },
                      { name: "Syn Gas", fill: 45, capacity: "200 MMSCF", color: T.green },
                      { name: "Waste", fill: 34, capacity: "80K gal", color: T.warn },
                      { name: "Process Water", fill: 89, capacity: "500K gal", color: T.blue },
                      { name: "Feed Staging", fill: 71, capacity: "250 T", color: T.accent },
                    ].map((t, i) => {
                      const isOverfill = t.fill > 90;
                      const isLow = t.fill < 20;
                      const fillColor = isOverfill ? T.danger : t.fill > 80 ? T.warn : isLow ? T.danger : t.color;
                      const statusLabel = isOverfill ? "HIGH" : isLow ? "LOW" : null;
                      return (
                        <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 90, flex: 1, padding: "16px 12px", background: T.bg1, borderRadius: 8, border: `1px solid ${isOverfill || isLow ? T.danger + "60" : T.border}` }}>
                          <div style={{ fontSize: 16, fontWeight: 700, color: isOverfill || isLow ? T.danger : T.text, marginBottom: 4 }}>{t.fill}%</div>
                          {statusLabel && <div style={{ fontSize: 9, fontWeight: 700, color: T.danger, background: T.danger + "15", padding: "1px 6px", borderRadius: 3, marginBottom: 4 }}>{statusLabel}</div>}
                          <div style={{ width: 36, height: 100, borderRadius: 6, background: T.bg0, border: `1px solid ${T.border}`, position: "relative", overflow: "hidden", marginBottom: 10 }}>
                            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: `${t.fill}%`, background: fillColor, borderRadius: "0 0 5px 5px", transition: "height 0.6s ease", opacity: 0.85 }} />
                            {/* Gridlines at 25%, 50%, 75% */}
                            {[25, 50, 75].map(mark => (
                              <div key={mark} style={{ position: "absolute", bottom: `${mark}%`, left: 0, right: 0, height: 1, background: T.border, opacity: 0.5 }} />
                            ))}
                            {/* Overfill threshold at 90% - red dashed */}
                            <div style={{ position: "absolute", bottom: "90%", left: -2, right: -2, height: 2, background: T.danger, opacity: 0.8, zIndex: 2 }} />
                            {/* Low threshold at 20% - red dashed */}
                            <div style={{ position: "absolute", bottom: "20%", left: -2, right: -2, height: 2, background: T.danger, opacity: 0.6, zIndex: 2 }} />
                            {/* Min threshold marker at 25% - distinct warning line */}
                            <div style={{ position: "absolute", bottom: "25%", left: -1, right: -1, height: 2, background: T.warn, opacity: 0.9, zIndex: 2 }} />
                          </div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: T.text, textAlign: "center", marginBottom: 2 }}>{t.name}</div>
                          <div style={{ fontSize: 9, color: T.textDim, textAlign: "center" }}>{t.capacity}</div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 8, fontSize: 10, color: T.textDim }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ display: "inline-block", width: 12, height: 2, background: T.danger, borderRadius: 1 }} /> Overfill (90%) / Low (20%)</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ display: "inline-block", width: 12, height: 2, background: T.warn, borderRadius: 1 }} /> Min threshold (25%)</span>
                  </div>
                </Card>
              ),
            },
            {
              id: "ops-log-outbound",
              label: "Outbound Shipments",
              render: () => (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.textMid, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 16 }}>Outbound Shipments — MTD</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
                    {[
                      { id: "SH-2024-892", product: "Diluent", volume: "48K gal", dest: "Gulf Coast Refinery", carrier: "TransLogix", eta: "2/26", status: "green" },
                      { id: "SH-2024-893", product: "Carbon Black", volume: "22T", dest: "TireMfg Partners", carrier: "FreightSys", eta: "2/25", status: "blue" },
                      { id: "SH-2024-894", product: "Syn Gas", volume: "8 MMSCF", dest: "Chemical Co", carrier: "Pipeline", eta: "Daily", status: "green" },
                      { id: "SH-2024-895", product: "Product Oil", volume: "16K gal", dest: "Lubricant Blender", carrier: "TransLogix", eta: "2/27", status: "blue" },
                    ].map((sh, i) => (
                      <Card key={i} title={`${sh.id}`} titleColor={sh.status === "green" ? T.green : T.blue}>
                        <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
                          <StatusPill status={sh.status} />
                          <span style={{ fontSize: 11, color: T.textDim, background: T.bg0, padding: "3px 8px", borderRadius: 4 }}>{sh.product}</span>
                          <span style={{ fontSize: 11, color: T.textDim, background: T.bg0, padding: "3px 8px", borderRadius: 4 }}>{sh.volume}</span>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                          <div style={{ padding: "6px 10px", background: T.bg0, borderRadius: 6 }}>
                            <div style={{ fontSize: 10, color: T.textDim }}>Destination</div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{sh.dest}</div>
                          </div>
                          <div style={{ padding: "6px 10px", background: T.bg0, borderRadius: 6 }}>
                            <div style={{ fontSize: 10, color: T.textDim }}>Carrier</div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{sh.carrier}</div>
                          </div>
                        </div>
                        <div style={{ fontSize: 11, color: T.textDim, borderTop: `1px solid ${T.border}`, paddingTop: 6 }}>
                          ETA: <span style={{ color: T.text, fontWeight: 600 }}>{sh.eta}</span>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ),
            },
            {
              id: "ops-log-inventory",
              label: "Inventory Levels",
              render: () => (
                <Card title="Inventory Levels" action={logInvDrill && <button onClick={() => setLogInvDrill(null)} style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 6, padding: "4px 10px", color: T.textMid, cursor: "pointer", fontSize: 11 }}>← All Sites</button>}>
                  {!logInvDrill ? (<>
                    {/* Global summary */}
                    {(() => {
                      const products = [
                        { name: "Diluent", color: T.blue, getDays: s => 48 + s.processors, getFill: s => 65 + s.processors * 2 },
                        { name: "Carbon Black", color: T.textMid, getDays: s => 35 + s.processors, getFill: s => 40 + s.processors * 3 },
                        { name: "Feed Stock", color: T.accent, getDays: s => 55 + s.processors, getFill: s => 72 + s.processors },
                      ];
                      return (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
                          {products.map((p, i) => {
                            const avgDays = Math.round(filteredActive.reduce((a, s) => a + p.getDays(s), 0) / filteredActive.length);
                            const minDays = Math.min(...filteredActive.map(s => p.getDays(s)));
                            const avgFill = Math.round(filteredActive.reduce((a, s) => a + p.getFill(s), 0) / filteredActive.length);
                            return (
                              <div key={i} style={{ padding: "12px 14px", background: T.bg0, borderRadius: 8 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                                  <span style={{ fontSize: 11, fontWeight: 600, color: p.color }}>{p.name}</span>
                                  <span style={{ fontSize: 16, fontWeight: 700, color: T.text }}>{avgDays}d</span>
                                </div>
                                <Progress pct={avgFill} color={avgDays < 30 ? T.warn : p.color} h={6} />
                                <div style={{ fontSize: 10, color: T.textDim, marginTop: 4 }}>Min: {minDays}d across sites</div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                    {/* Per-site compact cards — click to drill */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10 }}>
                      {filteredActive.map(s => {
                        const dilDays = 48 + s.processors;
                        const cbDays = 35 + s.processors;
                        const feedDays = 55 + s.processors;
                        const lowestDay = Math.min(dilDays, cbDays, feedDays);
                        return (
                          <div key={s.id} onClick={() => setLogInvDrill(s.id)} style={{ padding: "10px 12px", background: T.bg1, borderRadius: 8, border: `1px solid ${T.border}`, cursor: "pointer", transition: "all 0.2s" }} onMouseEnter={e => { e.currentTarget.style.borderColor = T.accent; }} onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                              <span style={{ fontSize: 12, fontWeight: 600, color: T.accent }}>{s.short}</span>
                              {lowestDay < 40 && <span style={{ fontSize: 9, color: T.warn, fontWeight: 600, background: T.warn + "15", padding: "2px 6px", borderRadius: 3 }}>Low</span>}
                            </div>
                            <div style={{ display: "flex", gap: 8 }}>
                              {[{ l: "Dil", d: dilDays, c: T.blue }, { l: "CB", d: cbDays, c: T.textMid }, { l: "Feed", d: feedDays, c: T.accent }].map((p, i) => (
                                <div key={i} style={{ textAlign: "center", flex: 1 }}>
                                  <div style={{ fontSize: 13, fontWeight: 700, color: p.d < 40 ? T.warn : T.text }}>{p.d}d</div>
                                  <div style={{ fontSize: 9, color: T.textDim }}>{p.l}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>) : (<>
                    {/* Drill-down: site detail */}
                    {(() => {
                      const s = filteredActive.find(x => x.id === logInvDrill) || filteredActive[0];
                      if (!s) return null;
                      const items = [
                        { name: "Diluent", days: 48 + s.processors, fill: 65 + s.processors * 2, color: T.blue, capacity: `${(s.processors * 150).toLocaleString()}K gal`, turnover: "12x/yr" },
                        { name: "Carbon Black", days: 35 + s.processors, fill: 40 + s.processors * 3, color: T.textMid, capacity: `${s.processors * 60}T`, turnover: "10x/yr" },
                        { name: "Feed Stock", days: 55 + s.processors, fill: 72 + s.processors, color: T.accent, capacity: `${s.processors * 200}T`, turnover: "7x/yr" },
                      ];
                      return (
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: T.accent, marginBottom: 12 }}>{s.short} — Inventory Detail</div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            {items.map((inv, i) => (
                              <div key={i} style={{ padding: "12px 14px", background: T.bg0, borderRadius: 8 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                                  <span style={{ fontSize: 13, fontWeight: 600, color: inv.color }}>{inv.name}</span>
                                  <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                                    <span style={{ fontSize: 11, color: T.textDim }}>Cap: {inv.capacity}</span>
                                    <span style={{ fontSize: 11, color: T.textDim }}>Turnover: {inv.turnover}</span>
                                    <span style={{ fontSize: 18, fontWeight: 700, color: inv.days < 40 ? T.warn : T.text }}>{inv.days}d</span>
                                  </div>
                                </div>
                                <Progress pct={inv.fill} color={inv.days < 40 ? T.warn : inv.color} h={10} />
                                <div style={{ fontSize: 10, color: T.textDim, marginTop: 4 }}>{inv.fill}% of capacity</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </>)}
                </Card>
              ),
            },
          ]}
          storageKey="sens-ops-log-layout"
          locked={layoutLocked}
          onLockedChange={setLayoutLocked}
        />
      )}
    </div>
  );
};
