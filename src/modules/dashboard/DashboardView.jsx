import { useState, useMemo } from "react";
import { T } from "@core/theme/theme";
import {
  constructionSites, developmentSites, sitePlan, PLAN_PER_MACHINE,
} from "@core/data/sites";
import {
  StatusPill, Progress, SectionHeader, Card, DataTable,
  CheckEngineLightPanel, DraggableGrid,
} from "@core/ui";
import { ObjectiveCard } from "./ObjectiveCard";
import { getDashboardAlerts } from "./alertData";
import { useSimDate } from "@core/simulation/SimDateContext";
import { getSiteMetrics, getPortfolioMetrics } from "@modules/operations/timeEngine";
import { buildObjectives } from "./objectivesData";

// ═══════════════════════════════════════════════════════════════════
//  SITE OPERATIONAL PERFORMANCE — Executive-Grade View
//  Sorted by health score (worst first) to surface problems
//  Metrics focused on performance vs plan
// ═══════════════════════════════════════════════════════════════════

const ragColor = (value, greenThresh, yellowThresh) =>
  value >= greenThresh ? T.green : value >= yellowThresh ? T.warn : T.danger;

const SiteOperationalPerformance = ({ activeSites, portfolio }) => {
  const portfolioEBITDA = portfolio.portfolioEBITDA;
  const portfolioRevenue = portfolio.portfolioRevenue;
  const avgUptime = portfolio.avgUptime.toFixed(1);
  const totalTPH = portfolio.totalTPH;
  const totalProcessors = portfolio.totalProcessors;
  const totalPlannedTPH = activeSites.reduce((a, s) => a + sitePlan(s).tphPlan, 0);
  const planRevTotal = activeSites.reduce((a, s) => a + sitePlan(s).planRevenue, 0);
  const ebitdaMarginPct = portfolioRevenue > 0 ? ((portfolioEBITDA / portfolioRevenue) * 100).toFixed(0) : "0";
  const tphAttainment = totalPlannedTPH > 0 ? ((totalTPH / totalPlannedTPH) * 100).toFixed(0) : 0;
  const revAttainment = planRevTotal > 0 ? ((portfolioRevenue / planRevTotal) * 100).toFixed(0) : 0;

  const siteData = activeSites.map(s => {
    const plan = sitePlan(s);
    const uptimeGap = s.uptime - plan.uptimePlan;
    const tphPct = plan.tphPlan > 0 ? (s.throughput / plan.tphPlan) * 100 : 0;
    const revPct = plan.planRevenue > 0 ? (s.actualRevenue / plan.planRevenue) * 100 : 0;
    const ebitdaMargin = s.actualRevenue > 0 ? ((s.actualEBITDA / s.actualRevenue) * 100) : 0;
    const healthScore = (
      ((s.uptime / plan.uptimePlan) * 40) +
      (tphPct * 0.3) +
      (revPct * 0.3)
    );
    return { ...s, plan, uptimeGap, tphPct, revPct, ebitdaMargin, healthScore };
  }).sort((a, b) => a.healthScore - b.healthScore);

  return (
    <div>
      <SectionHeader sub={`${activeSites.length} operational sites · ${constructionSites.length} in construction · ranked by health score`}>
        Site Operational Performance
      </SectionHeader>

      {/* Portfolio Summary Metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, margin: "16px 0" }}>
        {[
          { label: "Avg Uptime", value: `${avgUptime}%`, sub: `plan ${PLAN_PER_MACHINE.uptimePlan}%`, color: ragColor(parseFloat(avgUptime), 85, 80) },
          { label: "Total TPH", value: totalTPH.toFixed(1), sub: `${tphAttainment}% of ${totalPlannedTPH} capacity`, color: ragColor(parseFloat(tphAttainment), 90, 80) },
          { label: "Revenue", value: `$${portfolioRevenue.toFixed(1)}M`, sub: `${revAttainment}% of $${planRevTotal.toFixed(1)}M plan`, color: ragColor(parseFloat(revAttainment), 95, 80) },
          { label: "EBITDA", value: `$${portfolioEBITDA.toFixed(1)}M`, sub: `${ebitdaMarginPct}% margin`, color: ragColor(parseFloat(ebitdaMarginPct), 35, 25) },
          { label: "Processors Online", value: totalProcessors, sub: `${activeSites.length} sites active`, color: T.accent },
        ].map((m, i) => (
          <div key={i} style={{ background: T.bg0, borderRadius: 8, padding: "12px 14px", borderLeft: `3px solid ${m.color}` }}>
            <div style={{ fontSize: 10, color: T.textDim, textTransform: "uppercase", letterSpacing: .8, fontWeight: 600 }}>{m.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: T.text, marginTop: 2 }}>{m.value}</div>
            <div style={{ fontSize: 10, color: T.textMid, marginTop: 2 }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Uptime vs Plan — Horizontal Bar Chart */}
      <Card title="Uptime vs Plan" titleColor={T.textDim} style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {siteData.map(s => {
            const color = ragColor(s.uptime, s.plan.uptimePlan, s.plan.uptimePlan - 5);
            return (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: `1px solid ${T.border}` }}>
                <span style={{ width: 90, fontSize: 12, fontWeight: 600, color: T.accent, flexShrink: 0 }}>{s.short}</span>
                <div style={{ flex: 1, position: "relative", height: 18, background: T.bg0, borderRadius: 4 }}>
                  <div style={{
                    width: `${Math.min((s.uptime / 100) * 100, 100)}%`,
                    height: "100%",
                    background: `linear-gradient(90deg, ${color}40, ${color}90)`,
                    borderRadius: 4,
                    transition: "width .4s ease",
                  }} />
                  <div style={{
                    position: "absolute", left: `${s.plan.uptimePlan}%`, top: -3,
                    width: 2, height: 24, background: T.text, borderRadius: 1, opacity: 0.4,
                  }} />
                </div>
                <span style={{ width: 42, fontSize: 13, fontWeight: 700, color, textAlign: "right" }}>{s.uptime}%</span>
                <span style={{ width: 50, fontSize: 11, fontWeight: 600, color: s.uptimeGap >= 0 ? T.green : T.danger, textAlign: "right" }}>
                  {s.uptimeGap >= 0 ? "+" : ""}{s.uptimeGap.toFixed(1)}pt
                </span>
              </div>
            );
          })}
          <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "10px 0 2px", fontSize: 10, color: T.textDim }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 2, height: 10, background: T.text, opacity: 0.4, borderRadius: 1 }} />
              <span>Plan target ({PLAN_PER_MACHINE.uptimePlan}%)</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: T.green + "80" }} />
              <span>On/above plan</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: T.warn + "80" }} />
              <span>Within 5pt</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: T.danger + "80" }} />
              <span>Below plan</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Performance vs Plan — Detailed Table */}
      <Card title="Performance vs Plan — Site Detail" titleColor={T.textDim} style={{ marginBottom: 16 }}>
        <DataTable
          compact
          columns={["Site", "Uptime", "vs Plan", "TPH Efficiency", "Rev Attainment", "EBITDA Margin", "Status"]}
          rows={siteData.map(s => {
            const uptimeStatus = s.uptime >= s.plan.uptimePlan ? 2 : s.uptime >= s.plan.uptimePlan - 5 ? 1 : 0;
            const tphStatus = s.tphPct >= 90 ? 2 : s.tphPct >= 80 ? 1 : 0;
            const revStatus = s.revPct >= 95 ? 2 : s.revPct >= 80 ? 1 : 0;
            const worstStatus = Math.min(uptimeStatus, tphStatus, revStatus);
            const statusMap = { 2: "green", 1: "yellow", 0: "red" };

            return [
              <span style={{ fontWeight: 600, color: T.accent }}>{s.short}</span>,
              <span style={{ color: ragColor(s.uptime, 85, 80), fontWeight: 700 }}>{s.uptime}%</span>,
              <span style={{ color: s.uptimeGap >= 0 ? T.green : T.danger, fontWeight: 600 }}>
                {s.uptimeGap >= 0 ? "+" : ""}{s.uptimeGap.toFixed(1)}pt
              </span>,
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 48, height: 6, background: T.bg0, borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ width: `${Math.min(s.tphPct, 100)}%`, height: "100%", background: ragColor(s.tphPct, 90, 80), borderRadius: 3 }} />
                </div>
                <span style={{ color: ragColor(s.tphPct, 90, 80), fontWeight: 600, fontSize: 12 }}>{s.tphPct.toFixed(0)}%</span>
              </div>,
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 48, height: 6, background: T.bg0, borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ width: `${Math.min(s.revPct, 100)}%`, height: "100%", background: ragColor(s.revPct, 95, 80), borderRadius: 3 }} />
                </div>
                <span style={{ color: ragColor(s.revPct, 95, 80), fontWeight: 600, fontSize: 12 }}>{s.revPct.toFixed(0)}%</span>
              </div>,
              <span style={{ color: ragColor(s.ebitdaMargin, 40, 30), fontWeight: 600 }}>{s.ebitdaMargin.toFixed(0)}%</span>,
              <StatusPill status={statusMap[worstStatus]} />,
            ];
          })}
        />
      </Card>

      {/* Construction Pipeline */}
      {constructionSites.length > 0 && (
        <Card title="Construction Pipeline" titleColor={T.textDim}>
          <DataTable
            compact
            columns={["Site", "Processors", "Capacity", "EPC", "Progress", "Target Year", "Status"]}
            rows={constructionSites.map(s => [
              <span style={{ fontWeight: 600, color: T.accent }}>{s.short}</span>,
              s.processors,
              `${s.tph} TPH`,
              s.epc || "TBD",
              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 100 }}>
                <div style={{ flex: 1 }}>
                  <Progress pct={s.constructionPct} color={T.accent} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: T.text, minWidth: 28, textAlign: "right" }}>{s.constructionPct}%</span>
              </div>,
              s.startYear,
              <StatusPill status="construction" />,
            ])}
          />
        </Card>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
//  MAIN DASHBOARD VIEW
// ═══════════════════════════════════════════════════════════════════

export const DashboardView = ({ onNavigate }) => {
  const { simDate } = useSimDate();
  const alerts = getDashboardAlerts("COO", simDate);
  const [layoutLocked, setLayoutLocked] = useState(true);

  // Derive live metrics from time engine
  const allSites = useMemo(() => getSiteMetrics(simDate), [simDate]);
  const activeSites = useMemo(() => allSites.filter(s => s.status === "operational" && s.uptime > 0), [allSites]);
  const portfolio = useMemo(() => getPortfolioMetrics(simDate), [simDate]);
  const objectives = useMemo(() => buildObjectives(activeSites, portfolio), [activeSites, portfolio]);

  const widgets = useMemo(() => [
    {
      id: "dash-alerts",
      label: "System Alerts",
      render: () => (
        <CheckEngineLightPanel
          alerts={alerts}
          onNavigate={onNavigate}
          title="System Alerts"
        />
      ),
    },
    {
      id: "dash-objectives",
      label: "Strategic Objectives",
      render: () => (
        <div>
          <SectionHeader sub="3 company-wide priorities with cross-departmental intelligence">
            Company Strategic Objectives
          </SectionHeader>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
            {objectives.map((obj, i) => (
              <ObjectiveCard key={obj.id} obj={obj} index={i} onNavigate={onNavigate} />
            ))}
          </div>
        </div>
      ),
    },
    {
      id: "dash-site-performance",
      label: "Site Performance",
      render: () => <SiteOperationalPerformance activeSites={activeSites} portfolio={portfolio} />,
    },
  ], [alerts, layoutLocked, objectives, activeSites, portfolio]);

  return (
    <DraggableGrid
      widgets={widgets}
      storageKey="sens-dashboard-layout-v2"
      locked={layoutLocked}
      onLockedChange={setLayoutLocked}
    />
  );
};
