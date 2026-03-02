import { useState, useMemo } from "react";
import { T } from "@core/theme/theme";
import { activeSites, constructionSites, developmentSites, allProjectSites, totalProcessors, sitePlan, COAL_PLAN_PER_MACHINE, PLAN_PER_MACHINE, PROJECT_STAGES, manufacturingSiteDependencies } from "@core/data/sites";
import { modelData } from "@modules/growth/modelData";
import { EngineLight, KpiCard, StatusPill, Progress, TabBar, Card, DataTable, DraggableGrid, DraggableCardRow } from "@core/ui";
import { SiteGridView } from "@modules/operations/PortfolioMapView";

const fmt = (v, d = 1) => v == null ? "—" : "$" + (Math.abs(v) >= 1e6 ? (v / 1e6).toFixed(d) + "M" : v >= 1e3 ? (v / 1e3).toFixed(d) + "K" : v.toFixed(d));
const pctLabel = (a, b) => b > 0 ? ((a / b - 1) * 100).toFixed(0) + "%" : "—";

export const DeliveringView = ({ initialProject, onNavigate, fixedTab, engineeringScope }) => {
  const [tab, setTab] = useState(fixedTab || (initialProject ? "projects" : "projects"));
  const [selUnit, setSelUnit] = useState(null);
  const [expandedDiv, setExpandedDiv] = useState(null);
  const [selectedProject, setSelectedProject] = useState(initialProject || null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [mfgFilter, setMfgFilter] = useState("all");
  const [showArchived, setShowArchived] = useState(false);
  const [layoutLocked, setLayoutLocked] = useState(true);

  // ── Manufacturing Units ──
  // phase: "in-progress" | "site-ready" | "commissioning" | "operational"
  const units = [
    { id: "TiPs-001", type: "2 TPH", project: "Noble OK", design: 100, fab: 100, qa: 100, ship: "Delivered", status: "green", phase: "operational" },
    { id: "TiPs-002", type: "2 TPH", project: "Richmond VA", design: 100, fab: 100, qa: 100, ship: "Delivered", status: "green", phase: "operational" },
    { id: "TiPs-003", type: "2 TPH", project: "Richmond VA", design: 100, fab: 100, qa: 100, ship: "Delivered", status: "green", phase: "operational" },
    { id: "TiPs-004", type: "2 TPH", project: "Tucson AZ", design: 100, fab: 100, qa: 100, ship: "Delivered", status: "green", phase: "operational" },
    { id: "TiPs-005", type: "2 TPH", project: "Tucson AZ", design: 100, fab: 100, qa: 100, ship: "Delivered", status: "green", phase: "operational" },
    { id: "TiPs-006", type: "2 TPH", project: "Baton Rouge", design: 100, fab: 100, qa: 100, ship: "Delivered", status: "green", phase: "operational" },
    { id: "TiPs-007", type: "2 TPH", project: "Columbus OH", design: 100, fab: 100, qa: 100, ship: "Delivered", status: "green", phase: "operational" },
    { id: "TiPs-008", type: "2 TPH", project: "Noble B", design: 100, fab: 68, qa: 0, ship: "Q3 2027", status: "green", phase: "in-progress" },
    { id: "TiPs-009", type: "2 TPH", project: "Noble B", design: 100, fab: 42, qa: 0, ship: "Q4 2027", status: "green", phase: "in-progress" },
    { id: "TiPs-010", type: "2 TPH", project: "Noble B", design: 95, fab: 18, qa: 0, ship: "Q1 2028", status: "blue", phase: "in-progress" },
    { id: "TiPs-011", type: "2 TPH", project: "Noble B", design: 90, fab: 5, qa: 0, ship: "Q2 2028", status: "blue", phase: "in-progress" },
    { id: "TiPs-012", type: "2 TPH", project: "Noble B", design: 85, fab: 0, qa: 0, ship: "Q3 2028", status: "blue", phase: "in-progress" },
    { id: "TiPs-013", type: "2 TPH", project: "Noble B", design: 80, fab: 0, qa: 0, ship: "Q4 2028", status: "blue", phase: "in-progress" },
    { id: "TiPs-014", type: "2 TPH", project: "Portland OR", design: 100, fab: 32, qa: 0, ship: "Q1 2028", status: "green", phase: "in-progress" },
    { id: "TiPs-015", type: "2 TPH", project: "Portland OR", design: 95, fab: 10, qa: 0, ship: "Q2 2028", status: "blue", phase: "in-progress" },
    { id: "TiPs-016", type: "2 TPH", project: "Portland OR", design: 90, fab: 0, qa: 0, ship: "Q3 2028", status: "blue", phase: "in-progress" },
    // Coal machines — 20 TPH
    { id: "Coal-001", type: "20 TPH", project: "Coal FL", design: 45, fab: 20, qa: 0, ship: "Q3 2029", status: "blue", phase: "in-progress" },
    { id: "Coal-002", type: "20 TPH", project: "Coal TX", design: 35, fab: 5, qa: 0, ship: "Q1 2030", status: "purple", phase: "in-progress" },
  ];

  // Target delivery dates and fabrication targets for manufacturing tracking
  const deliveryTargets = {
    "TiPs-008": { targetShip: "Q2 2027", targetFab: 80, targetDesign: 100, targetQA: 20 },
    "TiPs-009": { targetShip: "Q3 2027", targetFab: 60, targetDesign: 100, targetQA: 10 },
    "TiPs-010": { targetShip: "Q4 2027", targetFab: 40, targetDesign: 100, targetQA: 0 },
    "TiPs-011": { targetShip: "Q1 2028", targetFab: 25, targetDesign: 100, targetQA: 0 },
    "TiPs-012": { targetShip: "Q2 2028", targetFab: 15, targetDesign: 95, targetQA: 0 },
    "TiPs-013": { targetShip: "Q3 2028", targetFab: 10, targetDesign: 90, targetQA: 0 },
    "TiPs-014": { targetShip: "Q4 2027", targetFab: 50, targetDesign: 100, targetQA: 10 },
    "TiPs-015": { targetShip: "Q1 2028", targetFab: 30, targetDesign: 100, targetQA: 0 },
    "TiPs-016": { targetShip: "Q2 2028", targetFab: 15, targetDesign: 95, targetQA: 0 },
    "Coal-001": { targetShip: "Q2 2029", targetFab: 30, targetDesign: 55, targetQA: 0 },
    "Coal-002": { targetShip: "Q4 2029", targetFab: 15, targetDesign: 45, targetQA: 0 },
  };

  // Build notes for archived/operational machines
  const buildNotes = {
    "TiPs-001": { completed: "Mar 2024", buildTime: "5.2 mo", notes: "First production unit. Extended QA cycle for baseline certification. Minor reactor weld rework in month 3.", files: ["TiPs-001_Build_Report.pdf", "QA_Cert_001.pdf"] },
    "TiPs-002": { completed: "Jun 2024", buildTime: "4.8 mo", notes: "Second unit for Richmond. Streamlined fab sequence from 001 lessons learned. No rework required.", files: ["TiPs-002_Build_Report.pdf", "QA_Cert_002.pdf"] },
    "TiPs-003": { completed: "Sep 2024", buildTime: "4.5 mo", notes: "Third unit, Richmond pair. Parallel fab with 002 reduced lead time. Heat exchanger vendor switch to Alfa Laval.", files: ["TiPs-003_Build_Report.pdf", "QA_Cert_003.pdf"] },
    "TiPs-004": { completed: "Dec 2024", buildTime: "4.6 mo", notes: "Tucson first unit. New conveyor design iteration. Controls software v2.1 baseline.", files: ["TiPs-004_Build_Report.pdf", "QA_Cert_004.pdf", "Conveyor_ECN_04.pdf"] },
    "TiPs-005": { completed: "Feb 2025", buildTime: "4.3 mo", notes: "Tucson pair. Fastest build to date. All components on-time from vendors.", files: ["TiPs-005_Build_Report.pdf", "QA_Cert_005.pdf"] },
    "TiPs-006": { completed: "May 2025", buildTime: "4.7 mo", notes: "Baton Rouge unit. Condensing unit delay (2 wk) due to vendor backlog. Resolved with secondary supplier.", files: ["TiPs-006_Build_Report.pdf", "QA_Cert_006.pdf", "Vendor_Delay_Log.pdf"] },
    "TiPs-007": { completed: "Aug 2025", buildTime: "4.4 mo", notes: "Columbus unit. Smooth build. First unit with v3.0 control software. Piping layout optimized per field feedback.", files: ["TiPs-007_Build_Report.pdf", "QA_Cert_007.pdf", "Controls_v3_Release.pdf"] },
  };

  // Phase metadata for filters
  const phaseConfig = {
    "in-progress": { label: "In Progress", color: T.accent },
    "site-ready": { label: "Site Ready", color: T.blue },
    "commissioning": { label: "Commissioning", color: T.warn },
    "operational": { label: "Operational", color: T.green },
  };

  // Filtered units (operational excluded from main view, shown in archive)
  const activeUnits = units.filter(u => u.phase !== "operational");
  const archivedUnits = units.filter(u => u.phase === "operational");
  const filteredUnits = mfgFilter === "all" ? activeUnits : activeUnits.filter(u => u.phase === mfgFilter);

  const fabDetail = {
    "TiPs-008": [{ p: "Reactor Vessel", pct: 100, c: T.green }, { p: "Heat Exchangers", pct: 82, c: T.accent }, { p: "Conveyor System", pct: 55, c: T.warn }, { p: "Condensing Units", pct: 45, c: T.warn }, { p: "Controls", pct: 30, c: T.blue }, { p: "Piping", pct: 20, c: T.blue }, { p: "Final Assembly", pct: 0, c: T.textDim }],
    "TiPs-014": [{ p: "Reactor Vessel", pct: 90, c: T.accent }, { p: "Heat Exchangers", pct: 45, c: T.warn }, { p: "Conveyor", pct: 20, c: T.blue }, { p: "Condensing", pct: 12, c: T.blue }, { p: "Controls", pct: 0, c: T.textDim }, { p: "Assembly", pct: 0, c: T.textDim }],
    "Coal-001": [{ p: "Gasifier Core", pct: 45, c: T.blue }, { p: "Heat Recovery Boiler", pct: 30, c: T.blue }, { p: "Syngas Processing", pct: 15, c: T.warn }, { p: "Controls & Instrumentation", pct: 8, c: T.blue }, { p: "Assembly & QA", pct: 0, c: T.textDim }],
    "Coal-002": [{ p: "Gasifier Core", pct: 35, c: T.blue }, { p: "Heat Recovery Boiler", pct: 12, c: T.warn }, { p: "Syngas Processing", pct: 5, c: T.textDim }, { p: "Controls & Instrumentation", pct: 0, c: T.textDim }, { p: "Assembly & QA", pct: 0, c: T.textDim }],
  };

  const { constructionBudget, machineBuild, assumptions } = modelData;
  const catColors = [T.accent, T.blue, T.green, T.purple, T.teal];
  const proj = selectedProject ? allProjectSites.find(s => s.id === selectedProject) : null;

  // Construction milestone data for drill-down
  const milestones = {
    "noble-b": [{ p: "EPC Contract", pct: 100, t: "Signed" }, { p: "Site Permitting", pct: 25, t: "Q3 2026" }, { p: "Geotech Survey", pct: 80, t: "Done" }, { p: "Processor Fab (×6)", pct: 22, t: "Q4 2028" }, { p: "Civil & Foundation", pct: 5, t: "Q4 2026" }, { p: "Electrical & Piping", pct: 0, t: "Q1 2027" }, { p: "Commission", pct: 0, t: "Q3 2028" }],
    "portland-or": [{ p: "EPC Contract", pct: 100, t: "Signed" }, { p: "Site Permitting", pct: 15, t: "Q4 2026" }, { p: "Site Survey", pct: 60, t: "Q2 2026" }, { p: "Processor Fab (×3)", pct: 14, t: "Q3 2028" }, { p: "Civil & Foundation", pct: 0, t: "Q1 2027" }, { p: "Commission", pct: 0, t: "Q1 2028" }],
    "coal-fl": [{ p: "WSP Pre-FEED Study", pct: 15, t: "Q2 2027" }, { p: "Feedstock Analysis", pct: 40, t: "Q4 2026" }, { p: "Technology Validation", pct: 25, t: "Q1 2027" }, { p: "Site Selection", pct: 10, t: "Q3 2027" }, { p: "Environmental Review", pct: 0, t: "Q4 2027" }, { p: "FEED Design", pct: 0, t: "Q2 2028" }, { p: "EPC Procurement", pct: 0, t: "Q4 2028" }],
    "coal-tx": [{ p: "Pre-FEED Complete", pct: 100, t: "Done" }, { p: "FEED Design Study", pct: 35, t: "Q3 2027" }, { p: "Feedstock LOI", pct: 80, t: "Q2 2026" }, { p: "Site Permitting", pct: 10, t: "Q1 2028" }, { p: "Environmental Review", pct: 5, t: "Q2 2028" }, { p: "EPC Bid Process", pct: 0, t: "Q3 2028" }, { p: "Construction Start", pct: 0, t: "Q1 2029" }],
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {!fixedTab && <TabBar tabs={[{ key: "projects", label: "Projects" }, { key: "manufacturing", label: "Manufacturing" }, { key: "engineering", label: "Engineering" }]} active={tab} onChange={k => { setTab(k); setSelUnit(null); setSelectedProject(null); }} />}

      {/* ════════════════ PROJECTS TAB ════════════════ */}
      {tab === "projects" && <>
        <DraggableGrid
          widgets={[
            {
              id: "del-proj-drilldown",
              label: "Project Details",
              render: () => (proj ? (<>
          <button onClick={() => setSelectedProject(null)} style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 6, padding: "6px 14px", color: T.textMid, cursor: "pointer", fontSize: 12, alignSelf: "flex-start" }}>← Back to Projects</button>

          {/* Header */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: T.text }}>{proj.name}</div>
              {proj.description && <div style={{ fontSize: 13, color: T.textMid, lineHeight: 1.6, marginTop: 8 }}>{proj.description}</div>}
              <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                {[
                  `${proj.feedstock} Feedstock`,
                  `${proj.processors} × ${proj.feedstock === "Coal" ? "20 TPH" : "2 TPH"}`,
                  `${proj.tph} TPH Total`,
                  proj.epc ? `EPC: ${proj.epc}` : null,
                  proj.feedSupplier ? `Feed: ${proj.feedSupplier}` : null,
                ].filter(Boolean).map((badge, i) => (
                  <span key={i} style={{ fontSize: 11, background: T.bg0, padding: "4px 10px", borderRadius: 4, color: T.textDim, border: `1px solid ${T.border}` }}>{badge}</span>
                ))}
              </div>
            </div>
            <Card title="Snapshot">
              <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 12 }}>
                {[
                  ["Status", proj.status === "operational" ? "Operational" : proj.status === "construction" ? "Construction" : proj.stage],
                  ["CapEx", proj.capex],
                  ["Target Start", proj.startYear],
                  ["State", proj.state],
                ].map(([label, val], i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: T.textMid }}>{label}</span>
                    <span style={{ color: T.text, fontWeight: 600 }}>{val}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Stage Gates */}
          {proj.stageProgress && (
            <Card title="Project Stage Gates">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12 }}>
                {PROJECT_STAGES.map((gate) => {
                  const pct = proj.stageProgress[gate.key] || 0;
                  const isCurrent = pct > 0 && pct < 100;
                  // Target: where this stage should be by now; threshold: critical minimum
                  const stageTargets = { concept: 100, "pre-feed": 100, feed: 80, epc: 60, construction: 40, commissioning: 20 };
                  const stageThresholds = { concept: 100, "pre-feed": 80, feed: 50, epc: 30, construction: 15, commissioning: 0 };
                  const targetPct = stageTargets[gate.key] || 0;
                  const thresholdPct = stageThresholds[gate.key] || 0;
                  const isBehind = pct < thresholdPct && pct < 100;
                  return (
                    <div key={gate.key} style={{ padding: "10px 8px", background: isCurrent ? T.bg0 : "transparent", borderRadius: 8, border: isCurrent ? `1px solid ${T.accent}40` : "1px solid transparent" }}>
                      <div style={{ fontSize: 11, color: isCurrent ? T.accent : T.textDim, marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{gate.label}</div>
                      <Progress pct={pct} color={pct === 100 ? T.green : isBehind ? T.danger : pct > 0 ? gate.color : T.bg3} h={8} target={pct < 100 ? targetPct : undefined} threshold={pct < 100 && thresholdPct > 0 ? thresholdPct : undefined} />
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: pct === 100 ? T.green : isBehind ? T.danger : pct > 0 ? T.text : T.textDim }}>{pct === 100 ? "✓" : `${pct}%`}</div>
                        {isCurrent && <div style={{ fontSize: 9, color: isBehind ? T.danger : pct >= targetPct ? T.green : T.textDim }}>{isBehind ? "BEHIND" : pct >= targetPct ? "ON TRACK" : "OK"}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Model Economics */}
          <Card title={`Model Economics — Per Machine (Annual at Full Capacity)`}>
            {(() => {
              const planConst = proj.feedstock === "Coal" ? COAL_PLAN_PER_MACHINE : PLAN_PER_MACHINE;
              const plan = sitePlan(proj);
              const margin = ((planConst.ebitda / planConst.revenue) * 100).toFixed(0);
              return (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 12, color: T.accent, fontWeight: 600, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>Per Machine</div>
                    {[
                      ["Revenue", fmt(planConst.revenue)],
                      ["Costs", fmt(planConst.costs)],
                      ["EBITDA", fmt(planConst.ebitda)],
                      ["EBITDA Margin", margin + "%"],
                      ["Uptime Target", planConst.uptimePlan + "%"],
                      ["Throughput", planConst.tphPerMachine + " TPH"],
                    ].map(([label, val], i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${T.border}` }}>
                        <span style={{ fontSize: 12, color: T.textMid }}>{label}</span>
                        <span style={{ fontSize: 12, color: T.text, fontWeight: 600 }}>{val}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: T.blue, fontWeight: 600, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>Site Total ({proj.processors} machine{proj.processors > 1 ? "s" : ""})</div>
                    {[
                      ["Plan Revenue", `$${plan.planRevenue.toFixed(1)}M`],
                      ["Plan Costs", `$${plan.planCosts.toFixed(1)}M`],
                      ["Plan EBITDA", `$${plan.planEBITDA.toFixed(1)}M`],
                      ["Plan TPH", `${plan.tphPlan} TPH`],
                    ].map(([label, val], i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${T.border}` }}>
                        <span style={{ fontSize: 12, color: T.textMid }}>{label}</span>
                        <span style={{ fontSize: 12, color: T.text, fontWeight: 600 }}>{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </Card>

          {/* Project Schedule / Milestones */}
          {milestones[proj.id] && (
            <Card title="Project Schedule">
              {milestones[proj.id].map((m, i) => {
                // Set expected target completion % for each milestone
                const scheduleTargets = { "EPC Contract": 100, "Site Permitting": 50, "Geotech Survey": 100, "Site Survey": 100, "Processor Fab": 40, "Civil & Foundation": 20, "Electrical & Piping": 10, "Commission": 0, "WSP Pre-FEED Study": 30, "Feedstock Analysis": 60, "Technology Validation": 40, "Site Selection": 25, "Environmental Review": 10, "FEED Design": 15, "EPC Procurement": 0, "Pre-FEED Complete": 100, "FEED Design Study": 50, "Feedstock LOI": 90, "EPC Bid Process": 0, "Construction Start": 0 };
                const targetKey = Object.keys(scheduleTargets).find(k => m.p.startsWith(k));
                const targetPct = targetKey ? scheduleTargets[targetKey] : undefined;
                const isBehind = targetPct != null && m.pct < targetPct && m.pct < 100;
                const thresholdPct = targetPct != null && targetPct > 20 ? Math.round(targetPct * 0.5) : undefined;
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "5px 0" }}>
                    <span style={{ fontSize: 12, color: T.textMid, width: 200 }}>{m.p}</span>
                    <div style={{ flex: 1 }}><Progress pct={m.pct} color={m.pct === 100 ? T.green : isBehind ? T.warn : m.pct > 0 ? T.accent : T.bg3} target={targetPct != null && m.pct < 100 ? targetPct : undefined} threshold={thresholdPct != null && m.pct < 100 ? thresholdPct : undefined} /></div>
                    <span style={{ fontSize: 12, color: m.pct === 100 ? T.green : isBehind ? T.warn : T.textDim, width: 80, textAlign: "right", fontWeight: isBehind ? 600 : 400 }}>{m.t}</span>
                    {isBehind && <span style={{ fontSize: 9, color: T.warn, fontWeight: 700, width: 50 }}>BEHIND</span>}
                    {!isBehind && m.pct > 0 && m.pct < 100 && targetPct != null && <span style={{ fontSize: 9, color: T.green, fontWeight: 600, width: 50 }}>ON TRACK</span>}
                  </div>
                );
              })}
            </Card>
          )}

          {/* Manufacturing → Site Dependencies */}
          {(() => {
            const projUnits = units.filter(u => {
              const dep = manufacturingSiteDependencies[u.id];
              return dep && dep.siteId === proj.id;
            });
            if (projUnits.length === 0) return null;
            return (
              <Card title="Machine Build & Site Readiness">
                <div style={{ fontSize: 12, color: T.textMid, marginBottom: 14, padding: "8px 12px", background: T.bg0, borderRadius: 6, borderLeft: `3px solid ${T.warn}` }}>
                  Machines cannot be installed until site is ready. Critical path items must be completed before machine delivery.
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {projUnits.map((u) => {
                    const dep = manufacturingSiteDependencies[u.id];
                    return (
                      <div key={u.id} style={{ padding: 14, background: T.bg0, borderRadius: 8, border: `1px solid ${T.border}` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ fontWeight: 700, color: T.accent, fontSize: 14 }}>{u.id}</span>
                            <span style={{ fontSize: 11, color: T.textDim, background: T.bg3, padding: "2px 8px", borderRadius: 3 }}>{u.type}</span>
                          </div>
                          <div style={{ fontSize: 12, color: T.textMid }}>Ship Target: <span style={{ fontWeight: 600, color: T.text }}>{u.ship}</span></div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                          <div>
                            <div style={{ fontSize: 11, color: T.textDim, marginBottom: 6, fontWeight: 600 }}>Machine Fabrication</div>
                            {(() => { const dt = deliveryTargets[u.id]; const fabBehind = dt && u.fab < dt.targetFab; return (
                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                              <div style={{ flex: 1 }}><Progress pct={u.fab} color={u.fab === 100 ? T.green : fabBehind ? T.warn : u.fab > 0 ? T.accent : T.bg3} h={6} target={dt?.targetFab} threshold={dt ? Math.round(dt.targetFab * 0.5) : undefined} /></div>
                              <span style={{ fontSize: 11, fontWeight: 600, color: fabBehind ? T.warn : T.text }}>{u.fab}%</span>
                            </div>); })()}
                            <div style={{ fontSize: 11, color: T.textDim, marginTop: 4 }}>Design: {u.design}% · QA: {u.qa > 0 ? u.qa + "%" : "pending"}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 11, color: T.textDim, marginBottom: 6, fontWeight: 600 }}>Site Readiness</div>
                            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                              <StatusPill status={dep.status} />
                              <span style={{ fontSize: 11, color: T.textMid }}>Target: {dep.readinessTarget}</span>
                            </div>
                          </div>
                        </div>
                        <div style={{ fontSize: 11, color: T.textDim, marginTop: 10, padding: "8px 10px", background: T.bg3, borderRadius: 4 }}>
                          <span style={{ fontWeight: 600, color: T.textMid }}>Critical Path:</span> {dep.criticalPath.map(c => c.replace(/-/g, " ")).join(" → ")}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })()}

          {/* Performance vs Plan (operational sites only) */}
          {proj.status === "operational" && proj.actualRevenue != null && (() => {
            const plan = sitePlan(proj);
            const revVar = plan.planRevenue > 0 ? ((proj.actualRevenue / plan.planRevenue - 1) * 100).toFixed(0) : 0;
            const ebitdaVar = plan.planEBITDA > 0 ? ((proj.actualEBITDA / plan.planEBITDA - 1) * 100).toFixed(0) : 0;
            return (
              <Card title="Performance vs Plan (YTD)">
                {[
                  { label: "Revenue", actual: proj.actualRevenue, plan: plan.planRevenue, variance: revVar },
                  { label: "EBITDA", actual: proj.actualEBITDA, plan: plan.planEBITDA, variance: ebitdaVar },
                ].map((row, i) => (
                  <div key={i} style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                      <span style={{ color: T.textMid }}>{row.label}</span>
                      <span style={{ color: T.text }}>
                        ${row.actual.toFixed(1)}M actual / ${row.plan.toFixed(1)}M plan
                        <span style={{ color: Number(row.variance) >= 0 ? T.green : T.warn, fontWeight: 700, marginLeft: 8 }}>
                          {Number(row.variance) >= 0 ? "+" : ""}{row.variance}%
                        </span>
                      </span>
                    </div>
                    <div style={{ position: "relative", height: 14, background: T.bg0, borderRadius: 6, overflow: "hidden" }}>
                      <div style={{ position: "absolute", width: `${Math.min((row.plan / Math.max(row.actual, row.plan)) * 100, 100)}%`, height: "100%", background: T.textDim + "25", borderRadius: 6 }} />
                      <div style={{ position: "absolute", width: `${Math.min((row.actual / Math.max(row.actual, row.plan)) * 100, 100)}%`, height: "100%", background: Number(row.variance) >= 0 ? T.green : T.warn, borderRadius: 6 }} />
                    </div>
                  </div>
                ))}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 8 }}>
                  <div style={{ padding: "10px", background: T.bg0, borderRadius: 6 }}>
                    <div style={{ fontSize: 11, color: T.textDim }}>Uptime</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>{proj.uptime}%</div>
                    <div style={{ fontSize: 11, color: T.textDim }}>Plan: {plan.uptimePlan}%</div>
                  </div>
                  <div style={{ padding: "10px", background: T.bg0, borderRadius: 6 }}>
                    <div style={{ fontSize: 11, color: T.textDim }}>Throughput</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>{proj.throughput} TPH</div>
                    <div style={{ fontSize: 11, color: T.textDim }}>Plan: {plan.tphPlan} TPH</div>
                  </div>
                </div>
              </Card>
            );
          })()}

          {/* Interactive Flow Chart — embedded for operational sites */}
          {proj.status === "operational" && (() => {
            const enriched = { ...proj, tphPerMachine: proj.feedstock === "Coal" ? 20 : 2, series: proj.feedstock === "Coal" ? "C" : "A", region: "US" };
            return (
              <div style={{ borderRadius: 10, border: `1px solid ${T.border}`, overflow: "hidden" }}>
                <SiteGridView site={enriched} embedded />
              </div>
            );
          })()}
        </>) : null)
            },
            {
              id: "del-proj-list",
              label: "Project Cards",
              render: () => !proj ? (<>

          {/* ── Project List (default view) ── */}
          {/* Project Cards Grid — exclude operational sites */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
            {allProjectSites.filter(s => s.status !== "operational").map(s => {
              const plan = sitePlan(s);
              const isOperational = s.status === "operational";
              const isConstruction = s.status === "construction";
              const isDevelopment = !isOperational && !isConstruction;
              const statusColor = isOperational ? T.green : isConstruction ? T.accent : T.purple;
              const statusLabel = isOperational ? "Operational" : isConstruction ? "Construction" : s.stage;
              const revVar = isOperational && s.actualRevenue ? ((s.actualRevenue / plan.planRevenue - 1) * 100).toFixed(0) : null;

              return (
                <Card key={s.id} title={s.short} titleColor={statusColor}>
                  <div style={{ cursor: "pointer" }} onClick={() => setSelectedProject(s.id)}>
                    {/* Status & badges */}
                    <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
                      <StatusPill status={isOperational ? "green" : isConstruction ? "construction" : "blue"} />
                      <span style={{ fontSize: 11, color: T.textDim, background: T.bg0, padding: "3px 8px", borderRadius: 4 }}>{s.feedstock}</span>
                      <span style={{ fontSize: 11, color: T.textDim, background: T.bg0, padding: "3px 8px", borderRadius: 4 }}>{s.processors} × {s.feedstock === "Coal" ? "20 TPH" : "2 TPH"}</span>
                      <span style={{ fontSize: 11, color: T.textDim, background: T.bg0, padding: "3px 8px", borderRadius: 4 }}>{s.capex}</span>
                    </div>

                    {/* Key metrics */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                      <div style={{ padding: "8px 10px", background: T.bg0, borderRadius: 6 }}>
                        <div style={{ fontSize: 10, color: T.textDim }}>Capacity</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>{s.tph} TPH</div>
                      </div>
                      <div style={{ padding: "8px 10px", background: T.bg0, borderRadius: 6 }}>
                        <div style={{ fontSize: 10, color: T.textDim }}>{isOperational ? "Uptime" : "Stage"}</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: isOperational ? (s.uptime >= 85 ? T.green : T.warn) : statusColor }}>{isOperational ? `${s.uptime}%` : statusLabel}</div>
                      </div>
                    </div>

                    {/* Revenue or Plan info */}
                    {isOperational && s.actualRevenue != null && (
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
                          <span style={{ color: T.textMid }}>Revenue YTD</span>
                          <span style={{ color: T.text }}>${s.actualRevenue.toFixed(1)}M <span style={{ color: Number(revVar) >= 0 ? T.green : T.warn, fontWeight: 600 }}>{Number(revVar) >= 0 ? "+" : ""}{revVar}%</span></span>
                        </div>
                        <div style={{ position: "relative", height: 8, background: T.bg0, borderRadius: 4, overflow: "hidden" }}>
                          <div style={{ position: "absolute", width: `${Math.min((plan.planRevenue / Math.max(s.actualRevenue, plan.planRevenue)) * 100, 100)}%`, height: "100%", background: T.textDim + "25", borderRadius: 4 }} />
                          <div style={{ position: "absolute", width: `${Math.min((s.actualRevenue / Math.max(s.actualRevenue, plan.planRevenue)) * 100, 100)}%`, height: "100%", background: Number(revVar) >= 0 ? T.green : T.warn, borderRadius: 4 }} />
                        </div>
                      </div>
                    )}

                    {!isOperational && (
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
                          <span style={{ color: T.textMid }}>Plan Revenue (Annual)</span>
                          <span style={{ color: T.text, fontWeight: 600 }}>${plan.planRevenue.toFixed(1)}M</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                          <span style={{ color: T.textMid }}>Plan EBITDA</span>
                          <span style={{ color: T.text, fontWeight: 600 }}>${plan.planEBITDA.toFixed(1)}M</span>
                        </div>
                      </div>
                    )}

                    {/* EPC / Supplier info */}
                    <div style={{ display: "flex", gap: 12, fontSize: 11, color: T.textDim, borderTop: `1px solid ${T.border}`, paddingTop: 8 }}>
                      {s.epc && <span>EPC: <span style={{ color: T.textMid }}>{s.epc}</span></span>}
                      {s.feedSupplier && <span>Feed: <span style={{ color: T.textMid }}>{s.feedSupplier}</span></span>}
                      {!s.epc && !s.feedSupplier && <span>Start: {s.startYear}</span>}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Completed / Operational Projects (collapsible) */}
          {allProjectSites.filter(s => s.status === "operational").length > 0 && (
            <div>
              <div onClick={() => setShowCompleted(!showCompleted)} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "10px 0" }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: T.textMid }}>{showCompleted ? "▾" : "▸"} Completed Projects ({allProjectSites.filter(s => s.status === "operational").length})</span>
                <span style={{ fontSize: 11, color: T.textDim }}>— now in Operations</span>
              </div>
              {showCompleted && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16, opacity: 0.7 }}>
                  {allProjectSites.filter(s => s.status === "operational").map(s => {
                    const plan = sitePlan(s);
                    const revVar = s.actualRevenue ? ((s.actualRevenue / plan.planRevenue - 1) * 100).toFixed(0) : null;
                    return (
                      <Card key={s.id} title={s.short} titleColor={T.green}>
                        <div style={{ cursor: "pointer" }} onClick={() => setSelectedProject(s.id)}>
                          <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
                            <StatusPill status="green" />
                            <span style={{ fontSize: 11, color: T.textDim, background: T.bg0, padding: "3px 8px", borderRadius: 4 }}>{s.feedstock}</span>
                            <span style={{ fontSize: 11, color: T.textDim, background: T.bg0, padding: "3px 8px", borderRadius: 4 }}>{s.processors} × {s.feedstock === "Coal" ? "20 TPH" : "2 TPH"}</span>
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                            <div style={{ padding: "8px 10px", background: T.bg0, borderRadius: 6 }}>
                              <div style={{ fontSize: 10, color: T.textDim }}>Capacity</div>
                              <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>{s.tph} TPH</div>
                            </div>
                            <div style={{ padding: "8px 10px", background: T.bg0, borderRadius: 6 }}>
                              <div style={{ fontSize: 10, color: T.textDim }}>Uptime</div>
                              <div style={{ fontSize: 16, fontWeight: 700, color: s.uptime >= 85 ? T.green : T.warn }}>{s.uptime}%</div>
                            </div>
                          </div>
                          {s.actualRevenue != null && (
                            <div style={{ fontSize: 11, borderTop: `1px solid ${T.border}`, paddingTop: 8 }}>
                              <span style={{ color: T.textMid }}>Revenue YTD: </span>
                              <span style={{ color: T.text, fontWeight: 600 }}>${s.actualRevenue.toFixed(1)}M</span>
                              {revVar && <span style={{ color: Number(revVar) >= 0 ? T.green : T.warn, fontWeight: 600, marginLeft: 6 }}>{Number(revVar) >= 0 ? "+" : ""}{revVar}%</span>}
                            </div>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
            ) : null
            },
          ]}
          storageKey="sens-delivering-proj-layout"
          locked={layoutLocked}
          onLockedChange={setLayoutLocked}
        />

        <DraggableCardRow
          items={[
            { id: "kpi-1", label: "Active Sites", value: `${activeSites.length}`, sub: `${totalProcessors} machines`, color: T.green, target: 10, spark: [3, 4, 5, 6, 7, activeSites.length], sparkTarget: 10 },
            { id: "kpi-2", label: "In Construction", value: `${constructionSites.length}`, sub: `${constructionSites.reduce((a, s) => a + s.processors, 0)} new machines`, color: T.accent, target: 3, spark: [1, 1, 2, 2, constructionSites.length], sparkTarget: 3 },
            { id: "kpi-3", label: "Development", value: `${developmentSites.length}`, sub: `${developmentSites.reduce((a, s) => a + s.tph, 0)} TPH planned`, color: T.blue, target: 4, spark: [1, 2, 2, developmentSites.length], sparkTarget: 4 },
            { id: "kpi-4", label: "Model IRR", value: `${(modelData.economics.projectIRR * 100).toFixed(0)}%`, sub: `NPV: $${(modelData.economics.projectNPV / 1e6).toFixed(1)}M`, color: T.accent, target: "25%", threshold: "15%", spark: [18, 20, 22, 24, (modelData.economics.projectIRR * 100)], sparkTarget: 25 },
            { id: "kpi-5", label: "Pipeline", value: `+${constructionSites.reduce((a, s) => a + s.tph, 0) + developmentSites.reduce((a, s) => a + s.tph, 0)} TPH`, sub: `${constructionSites.reduce((a, s) => a + s.processors, 0) + developmentSites.reduce((a, s) => a + s.processors, 0)} machines`, color: T.purple, target: "60 TPH", spark: [10, 20, 30, 40, constructionSites.reduce((a, s) => a + s.tph, 0) + developmentSites.reduce((a, s) => a + s.tph, 0)], sparkTarget: 60 },
          ]}
          locked={layoutLocked}
          storageKey="sens-delivering-proj-cards-kpis"
          renderItem={(item) => <KpiCard label={item.label} value={item.value} sub={item.sub} color={item.color} target={item.target} threshold={item.threshold} spark={item.spark} sparkTarget={item.sparkTarget} />}
        />

      </>}

      {/* ════════════════ MANUFACTURING TAB ════════════════ */}
      {tab === "manufacturing" && <>
        <DraggableGrid
          widgets={[
            {
              id: "del-mfg-pipeline",
              label: "Pipeline",
              render: () => (
        <Card title={`Pipeline — ${activeUnits.length} Active`}>
          <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
            {activeUnits.map(u => {
              const isCoal = u.type === "20 TPH";
              return (
                <div key={u.id} style={{ textAlign: "center", cursor: "pointer", width: isCoal ? 64 : 48 }} onClick={() => setSelUnit(u.id)}>
                  <div style={{ height: isCoal ? 44 : 36, background: u.fab === 100 ? T.green : u.fab > 0 ? (isCoal ? T.purple : T.accent) : T.bg3, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: u.fab > 0 ? T.text : T.textDim, fontWeight: 600, border: `1px solid ${u.fab === 100 ? T.green : u.fab > 0 ? (isCoal ? T.purple : T.accent) : T.border}` }}>
                    {u.id.split("-").pop()}
                  </div>
                  <div style={{ fontSize: 8, color: isCoal ? T.purple : T.textDim, marginTop: 2 }}>{u.fab === 100 ? "✓" : u.fab > 0 ? `${u.fab}%` : "—"}</div>
                  {isCoal && <div style={{ fontSize: 7, color: T.purple, fontWeight: 600 }}>COAL</div>}
                </div>
              );
            })}
          </div>
        </Card>
              )
            },
            {
              id: "del-mfg-kpis",
              label: "KPI Cards",
              render: () => (
        <DraggableCardRow
          items={[
            { id: "kpi-mfg-1", label: "Active Units", value: `${activeUnits.length}`, sub: `${archivedUnits.length} archived`, target: 15, spark: [5, 7, 9, 11, activeUnits.length], sparkTarget: 15 },
            { id: "kpi-mfg-2", label: "In Fab", value: `${activeUnits.filter(u => u.fab > 0 && u.fab < 100).length}`, color: T.accent, target: 8, spark: [2, 3, 5, 6, activeUnits.filter(u => u.fab > 0 && u.fab < 100).length], sparkTarget: 8 },
            { id: "kpi-mfg-3", label: "TiPs Partner", value: "TX Vessel", color: T.blue },
            { id: "kpi-mfg-4", label: "Coal Units", value: `${units.filter(u => u.type === "20 TPH").length}`, sub: `${units.filter(u => u.type === "20 TPH" && u.fab > 0).length} in fab`, color: T.purple, target: 4, threshold: 2 },
            { id: "kpi-mfg-5", label: "Build Time", value: "~6 mo", sub: "TiPs avg", color: T.textMid, target: "5 mo", invert: true },
          ]}
          locked={layoutLocked}
          storageKey="sens-delivering-mfg-cards-kpis"
          renderItem={(item) => <KpiCard label={item.label} value={item.value} sub={item.sub} color={item.color} target={item.target} threshold={item.threshold} spark={item.spark} sparkTarget={item.sparkTarget} invert={item.invert} />}
        />
              )
            },

            {
              id: "del-mfg-units",
              label: "Manufacturing Units",
              render: () => (<>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 11, color: T.textDim, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginRight: 4 }}>Filter:</span>
          {[
            { key: "all", label: "All Active", count: activeUnits.length },
            { key: "in-progress", label: "In Progress", count: activeUnits.filter(u => u.phase === "in-progress").length, color: T.accent },
            { key: "site-ready", label: "Site Ready", count: activeUnits.filter(u => u.phase === "site-ready").length, color: T.blue },
            { key: "commissioning", label: "Commissioning", count: activeUnits.filter(u => u.phase === "commissioning").length, color: T.warn },
          ].map(f => (
            <button key={f.key} onClick={() => setMfgFilter(f.key)} style={{
              background: mfgFilter === f.key ? (f.color || T.accent) + "20" : T.bg0,
              border: `1px solid ${mfgFilter === f.key ? (f.color || T.accent) : T.border}`,
              borderRadius: 6, padding: "6px 14px", cursor: "pointer", fontSize: 12,
              color: mfgFilter === f.key ? (f.color || T.accent) : T.textMid,
              fontWeight: mfgFilter === f.key ? 600 : 400,
              display: "flex", alignItems: "center", gap: 6,
            }}>
              {f.label}
              <span style={{ fontSize: 10, background: mfgFilter === f.key ? (f.color || T.accent) + "30" : T.bg3, padding: "1px 6px", borderRadius: 10, fontWeight: 600 }}>{f.count}</span>
            </button>
          ))}
        </div>

        {filteredUnits.length === 0 && (
          <div style={{ padding: 40, textAlign: "center", color: T.textDim, fontSize: 13 }}>No machines in this phase yet.</div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {filteredUnits.map(u => {
            const dep = manufacturingSiteDependencies[u.id];
            const isCoal = u.type === "20 TPH";
            const unitColor = isCoal ? T.purple : T.accent;

            return (
              <Card key={u.id} title={u.id} titleColor={unitColor}>
                <div style={{ cursor: "pointer" }} onClick={() => setSelUnit(u.id)}>
                  {/* Badges */}
                  <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, color: isCoal ? T.purple : T.textDim, background: T.bg0, padding: "3px 8px", borderRadius: 4, fontWeight: isCoal ? 600 : 400 }}>{u.type}</span>
                    <span style={{ fontSize: 11, color: T.textDim, background: T.bg0, padding: "3px 8px", borderRadius: 4 }}>{u.project}</span>
                    <span style={{ fontSize: 10, color: phaseConfig[u.phase]?.color || T.textDim, background: (phaseConfig[u.phase]?.color || T.textDim) + "18", padding: "3px 8px", borderRadius: 4, fontWeight: 600 }}>{phaseConfig[u.phase]?.label || u.phase}</span>
                  </div>

                  {/* Progress bars with targets */}
                  {(() => {
                    const dt = deliveryTargets[u.id];
                    const designBehind = dt && u.design < dt.targetDesign;
                    const fabBehind = dt && u.fab < dt.targetFab;
                    return (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
                          <span style={{ color: T.textDim }}>Design</span>
                          <span style={{ color: designBehind ? T.warn : T.text, fontWeight: 600 }}>{u.design}%{designBehind ? " (behind)" : ""}</span>
                        </div>
                        <Progress pct={u.design} color={designBehind ? T.warn : T.green} h={6} target={dt?.targetDesign} />
                      </div>
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
                          <span style={{ color: T.textDim }}>Fabrication</span>
                          <span style={{ color: fabBehind ? T.warn : T.text, fontWeight: 600 }}>{u.fab}%{fabBehind ? " (behind)" : ""}</span>
                        </div>
                        <Progress pct={u.fab} color={fabBehind ? T.warn : T.accent} h={6} target={dt?.targetFab} threshold={dt ? Math.round(dt.targetFab * 0.5) : undefined} />
                      </div>
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
                          <span style={{ color: T.textDim }}>QA</span>
                          <span style={{ color: T.text, fontWeight: 600 }}>{u.qa > 0 ? `${u.qa}%` : "Pending"}</span>
                        </div>
                        <Progress pct={u.qa} color={T.blue} h={6} target={dt?.targetQA} />
                      </div>
                    </div>
                    );
                  })()}

                  {/* Ship & Site Ready — with target delivery comparison */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, borderTop: `1px solid ${T.border}`, paddingTop: 8 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <span style={{ color: T.textDim }}>Ship: <span style={{ color: T.text, fontWeight: 600 }}>{u.ship}</span></span>
                      {deliveryTargets[u.id] && (
                        <span style={{ fontSize: 10, color: u.ship === deliveryTargets[u.id].targetShip ? T.green : T.warn }}>
                          Target: {deliveryTargets[u.id].targetShip} {u.ship === deliveryTargets[u.id].targetShip ? "✓" : u.ship > deliveryTargets[u.id].targetShip ? "LATE" : ""}
                        </span>
                      )}
                    </div>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      {dep ? <StatusPill status={dep.status} /> : <span style={{ color: T.green, fontSize: 11 }}>✓ Site Ready</span>}
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
              </>)
            },
            {
              id: "del-mfg-archived",
              label: "Archived Machines",
              render: () => archivedUnits.length > 0 ? (
          <div>
            <div onClick={() => setShowArchived(!showArchived)} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "10px 0" }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: T.textMid }}>{showArchived ? "▾" : "▸"} Archived — Operational ({archivedUnits.length})</span>
              <span style={{ fontSize: 11, color: T.textDim }}>— build complete, now in operations</span>
            </div>
            {showArchived && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16, opacity: 0.85 }}>
                {archivedUnits.map(u => {
                  const notes = buildNotes[u.id];
                  return (
                    <Card key={u.id} title={u.id} titleColor={T.green}>
                      <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 11, color: T.textDim, background: T.bg0, padding: "3px 8px", borderRadius: 4 }}>{u.type}</span>
                        <span style={{ fontSize: 11, color: T.textDim, background: T.bg0, padding: "3px 8px", borderRadius: 4 }}>{u.project}</span>
                        <span style={{ fontSize: 10, color: T.green, background: T.green + "18", padding: "3px 8px", borderRadius: 4, fontWeight: 600 }}>Operational</span>
                      </div>
                      {notes && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                            <div style={{ padding: "8px 10px", background: T.bg0, borderRadius: 6 }}>
                              <div style={{ fontSize: 10, color: T.textDim }}>Completed</div>
                              <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{notes.completed}</div>
                            </div>
                            <div style={{ padding: "8px 10px", background: T.bg0, borderRadius: 6 }}>
                              <div style={{ fontSize: 10, color: T.textDim }}>Build Time</div>
                              <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{notes.buildTime}</div>
                            </div>
                          </div>
                          <div style={{ fontSize: 12, color: T.textMid, lineHeight: 1.5, padding: "8px 10px", background: T.bg0, borderRadius: 6 }}>{notes.notes}</div>
                          {notes.files && notes.files.length > 0 && (
                            <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 8 }}>
                              <div style={{ fontSize: 10, color: T.textDim, fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Build Files</div>
                              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                {notes.files.map((f, fi) => (
                                  <span key={fi} style={{ fontSize: 11, color: T.accent, background: T.accent + "12", padding: "4px 10px", borderRadius: 4, cursor: "pointer", border: `1px solid ${T.accent}25` }}>{f}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        ) : null
            },

            {
              id: "del-mfg-cost-analysis",
              label: "Cost Analysis & Procurement",
              render: () => (
        <div style={{ borderTop: `2px solid ${T.accent}40`, paddingTop: 20, marginTop: 8 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.accent, marginBottom: 14 }}>Cost Analysis & Procurement</div>

          <DraggableCardRow
            items={[
              { id: "kpi-cost-1", label: "Build Cost", value: `$${(machineBuild.grandTotal / 1e6).toFixed(1)}M`, sub: "per machine", color: T.accent, target: "$2.0M", threshold: "$2.5M", invert: true },
              { id: "kpi-cost-2", label: "Site Budget", value: `$${(constructionBudget.totalBudget / 1e6).toFixed(1)}M`, sub: `${constructionBudget.divisions.length} divisions`, color: T.blue, target: `$${(constructionBudget.totalBudget * 0.95 / 1e6).toFixed(1)}M`, threshold: `$${(constructionBudget.totalBudget * 1.1 / 1e6).toFixed(1)}M`, invert: true },
              { id: "kpi-cost-3", label: "Equip & Mat", value: fmt(machineBuild.categories[0]?.total, 1), sub: `${machineBuild.grandTotal > 0 ? ((machineBuild.categories[0]?.total || 0) / machineBuild.grandTotal * 100).toFixed(0) : 0}% of build`, color: T.green, target: fmt(machineBuild.categories[0]?.total * 0.95, 1), invert: true },
              { id: "kpi-cost-4", label: "Workforce", value: fmt(machineBuild.categories[4]?.total, 1), sub: `${machineBuild.grandTotal > 0 ? ((machineBuild.categories[4]?.total || 0) / machineBuild.grandTotal * 100).toFixed(0) : 0}% of build`, color: T.purple, target: fmt(machineBuild.categories[4]?.total * 0.9, 1), invert: true },
            ]}
            locked={layoutLocked}
            storageKey="sens-delivering-cost-cards-kpis"
            renderItem={(item) => <KpiCard label={item.label} value={item.value} sub={item.sub} color={item.color} target={item.target} threshold={item.threshold} invert={item.invert} />}
            style={{ marginBottom: 16 }}
          />

          <Card title={`Per-Machine Build Cost — $${(machineBuild.grandTotal / 1e6).toFixed(1)}M Total`}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {machineBuild.categories.map((cat, i) => {
                const pctOfTotal = machineBuild.grandTotal > 0 ? ((cat.total || 0) / machineBuild.grandTotal) * 100 : 0;
                return (
                  <div key={i}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: T.text, fontWeight: 600 }}>{cat.name}</span>
                      <span style={{ fontSize: 12, color: T.textMid }}>{fmt(cat.total, 1)} · {pctOfTotal.toFixed(0)}%</span>
                    </div>
                    <Progress pct={pctOfTotal} color={catColors[i % catColors.length]} h={8} showLabel />
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Construction Budget Breakdown */}
          <Card title={`Site Construction Budget — $${(constructionBudget.totalBudget / 1e6).toFixed(1)}M · ${constructionBudget.divisions.length} Divisions`}>
            <div style={{ fontSize: 10, color: T.textDim, marginBottom: 8, padding: "6px 10px", background: T.bg0, borderRadius: 4, display: "flex", gap: 16, alignItems: "center" }}>
              <span><span style={{ display: "inline-block", width: 8, height: 2, background: T.text, marginRight: 4, verticalAlign: "middle", opacity: 0.7 }} />Target</span>
              <span><span style={{ display: "inline-block", width: 8, height: 2, background: T.danger, marginRight: 4, verticalAlign: "middle", opacity: 0.8 }} />Threshold (&gt;10% over)</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {constructionBudget.divisions.filter(d => d.budget > 0).map((div, i) => {
                const pctOfTotal = (div.budget / constructionBudget.totalBudget) * 100;
                const budgetTarget = pctOfTotal; // target is the budgeted amount
                const budgetThreshold = pctOfTotal * 1.1; // threshold at 10% over budget = red
                const isExpanded = expandedDiv === i;
                return (
                  <div key={i}>
                    <div onClick={() => setExpandedDiv(isExpanded ? null : i)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", cursor: "pointer" }}>
                      <span style={{ fontSize: 11, color: T.textMid, width: 200, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={div.description}>{div.description || div.division}</span>
                      <div style={{ flex: 1, position: "relative" }}>
                        <Progress pct={pctOfTotal} color={T.accent + "60"} h={14} target={budgetTarget} threshold={budgetThreshold > budgetTarget ? budgetThreshold : undefined} />
                      </div>
                      <span style={{ fontSize: 11, color: T.text, fontWeight: 600, width: 70, textAlign: "right" }}>{fmt(div.budget, 1)}</span>
                      <span style={{ fontSize: 10, color: T.textDim, width: 40, textAlign: "right" }}>{pctOfTotal.toFixed(1)}%</span>
                    </div>
                    {isExpanded && div.monthlySpend && (
                      <div style={{ display: "flex", gap: 3, marginBottom: 8, flexWrap: "wrap", paddingLeft: 200 }}>
                        {div.monthlySpend.map((v, mi) => v > 0 && (
                          <div key={mi} style={{ background: T.bg0, borderRadius: 3, padding: "3px 6px", minWidth: 48, textAlign: "center" }}>
                            <div style={{ fontSize: 8, color: T.textDim }}>Mo {mi + 1}</div>
                            <div style={{ fontSize: 10, color: T.text, fontWeight: 600 }}>{fmt(v, 0)}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Procurement Tracker */}
          <Card title="Procurement Tracker">
            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 0.6fr 0.5fr 0.5fr 0.6fr", gap: 10, padding: "4px 10px", marginBottom: 6 }}>
              <span style={{ fontSize: 10, color: T.textDim, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Item</span>
              <span style={{ fontSize: 10, color: T.textDim, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Vendor</span>
              <span style={{ fontSize: 10, color: T.textDim, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Status</span>
              <span style={{ fontSize: 10, color: T.textDim, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Lead</span>
              <span style={{ fontSize: 10, color: T.textDim, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Qty</span>
              <span style={{ fontSize: 10, color: T.textDim, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, textAlign: "right" }}>Cost</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {[
                { item: "Reactor Vessels", vendor: "TX Vessel Works", status: "green", lead: "12 wk", qty: `${units.filter(u => u.fab > 0 && u.fab < 100).length} active`, cost: "$233K ea" },
                { item: "Heat Exchangers", vendor: "Alfa Laval", status: "green", lead: "8 wk", qty: "On schedule", cost: "$185K ea" },
                { item: "Conveyor Systems", vendor: "Hytrol / Custom", status: "blue", lead: "10 wk", qty: "3 on order", cost: "$142K ea" },
                { item: "Control Automation", vendor: "Rockwell / Allen-Bradley", status: "green", lead: "6 wk", qty: "Stocked", cost: "$478K ea" },
                { item: "Motors & Drives", vendor: "ABB / Siemens", status: "green", lead: "4 wk", qty: "Stocked", cost: "$356K ea" },
                { item: "Gasifier Core (Coal)", vendor: "TBD — RFP Open", status: "purple", lead: "24 wk", qty: "2 required", cost: "Est $1.2M ea" },
                { item: "Structural Steel", vendor: "Regional fab", status: "blue", lead: "8 wk", qty: "Per-site", cost: "Varies" },
              ].map((row, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 0.6fr 0.5fr 0.5fr 0.6fr", gap: 10, padding: "8px 10px", background: i % 2 === 0 ? T.bg0 : "transparent", borderRadius: 6, alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: T.text, fontWeight: 600 }}>{row.item}</span>
                  <span style={{ fontSize: 11, color: T.textMid }}>{row.vendor}</span>
                  <StatusPill status={row.status} />
                  <span style={{ fontSize: 11, color: T.textDim }}>{row.lead}</span>
                  <span style={{ fontSize: 11, color: T.textDim }}>{row.qty}</span>
                  <span style={{ fontSize: 11, color: T.text, fontWeight: 600, textAlign: "right" }}>{row.cost}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
              )
            },
          ]}
          storageKey="sens-delivering-mfg-layout"
          locked={layoutLocked}
          onLockedChange={setLayoutLocked}
        />

        {/* Machine Detail Modal Overlay */}
        {selUnit && (() => {
          const selUnitData = units.find(u => u.id === selUnit);
          const isCoal = selUnitData && selUnitData.type === "20 TPH";
          const unitColor = isCoal ? T.purple : T.accent;
          return (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={() => setSelUnit(null)}>
            <div style={{ background: T.bg1, borderRadius: 12, border: `1px solid ${T.border}`, maxWidth: 560, width: "100%", maxHeight: "80vh", overflow: "auto", padding: 24 }} onClick={e => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: unitColor }}>{selUnit} — {fabDetail[selUnit] ? "Fab Breakdown" : "Unit Detail"}</div>
                <button onClick={() => setSelUnit(null)} style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 6, padding: "6px 12px", color: T.textMid, cursor: "pointer", fontSize: 12 }}>✕</button>
              </div>

              {/* Unit overview */}
              {selUnitData && (
                <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, color: isCoal ? T.purple : T.textDim, background: T.bg0, padding: "3px 8px", borderRadius: 4, fontWeight: isCoal ? 600 : 400 }}>{selUnitData.type}</span>
                  <span style={{ fontSize: 11, color: T.textDim, background: T.bg0, padding: "3px 8px", borderRadius: 4 }}>{selUnitData.project}</span>
                  <StatusPill status={selUnitData.status} />
                  <span style={{ fontSize: 11, color: T.textDim, background: T.bg0, padding: "3px 8px", borderRadius: 4 }}>Ship: {selUnitData.ship}</span>
                </div>
              )}

              {/* Progress summary */}
              {selUnitData && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
                  {[
                    { label: "Design", pct: selUnitData.design, color: T.green },
                    { label: "Fabrication", pct: selUnitData.fab, color: T.accent },
                    { label: "QA", pct: selUnitData.qa, color: T.blue },
                  ].map((stage, i) => (
                    <div key={i}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
                        <span style={{ color: T.textDim }}>{stage.label}</span>
                        <span style={{ color: T.text, fontWeight: 600 }}>{stage.pct > 0 ? `${stage.pct}%` : "Pending"}</span>
                      </div>
                      <Progress pct={stage.pct} color={stage.pct === 100 ? T.green : stage.color} h={6} />
                    </div>
                  ))}
                </div>
              )}

              {/* Detailed fab breakdown (when available) */}
              {fabDetail[selUnit] && (<>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.textMid, marginBottom: 10, borderTop: `1px solid ${T.border}`, paddingTop: 12 }}>Fabrication Detail</div>
                {fabDetail[selUnit].map((p, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "6px 0" }}>
                    <span style={{ fontSize: 12, color: T.textMid, width: 180 }}>{p.p}</span>
                    <div style={{ flex: 1 }}><Progress pct={p.pct} color={p.c} /></div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: T.text, width: 40, textAlign: "right" }}>{p.pct}%</span>
                  </div>
                ))}
              </>)}

              {manufacturingSiteDependencies[selUnit] && (() => {
                const dep = manufacturingSiteDependencies[selUnit];
                return (
                  <div style={{ marginTop: 14, padding: 12, background: T.bg0, borderRadius: 8, border: `1px solid ${T.border}` }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.textMid, marginBottom: 8 }}>Site Readiness — {dep.siteShort}</div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                      <StatusPill status={dep.status} />
                      <span style={{ fontSize: 11, color: T.textMid }}>Target: {dep.readinessTarget}</span>
                    </div>
                    <div style={{ fontSize: 11, color: T.textDim, padding: "6px 8px", background: T.bg3, borderRadius: 4 }}>
                      <span style={{ fontWeight: 600 }}>Critical Path:</span> {dep.criticalPath.map(c => c.replace(/-/g, " ")).join(" → ")}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
          );
        })()}
      </>}

      {/* ════════════════ ENGINEERING TAB ════════════════ */}
      {tab === "engineering" && <>
        <DraggableGrid
          widgets={[
            ...(engineeringScope === "operations" ? [] : [{
              id: "del-eng-kpis",
              label: "Engineering KPIs",
              render: () => (
        <DraggableCardRow
          items={[
            { id: "kpi-eng-1", label: "Active Designs", value: "3", color: T.accent, target: 4, spark: [1, 2, 2, 3, 3], sparkTarget: 4 },
            { id: "kpi-eng-2", label: "Patents", value: "4", color: T.blue, target: 6, spark: [1, 2, 3, 3, 4], sparkTarget: 6 },
            { id: "kpi-eng-3", label: "R&D", value: "2", color: T.green, target: 3, spark: [1, 1, 1, 2, 2], sparkTarget: 3 },
          ]}
          locked={layoutLocked}
          storageKey="sens-delivering-eng-cards-kpis"
          renderItem={(item) => <KpiCard label={item.label} value={item.value} sub={item.sub} color={item.color} target={item.target} spark={item.spark} sparkTarget={item.sparkTarget} />}
        />
              )
            },
            {
              id: "del-eng-programs",
              label: "Engineering Programs",
              render: () => (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {[
            { name: "TiPs 2 TPH (Tire)", phase: "Production", partner: "Texas Vessel", status: "green", desc: "Core thermal processing unit for tire crumb feedstock. In full production with partner fabrication.", pct: 100, targetPct: 100 },
            { name: "TiPs 20 TPH (Coal)", phase: "FEED Design", partner: "WSP Global", status: "blue", desc: "Scaled-up gasification system for coal feedstock. Front-end engineering design underway.", pct: 35, targetPct: 50, threshPct: 25 },
            { name: "Carbon Optimization", phase: "Testing", partner: "Sid Richardson", status: "green", desc: "Carbon black quality enhancement program targeting N330 grade specifications.", pct: 72, targetPct: 75, threshPct: 50 },
            { name: "Power Plant", phase: "Concept", partner: "Internal", status: "purple", desc: "Conceptual design for integrated power generation from syn gas output.", pct: 10, targetPct: 15, threshPct: 5 },
          ].map((prog, i) => {
            const isBehind = prog.pct < prog.threshPct;
            const isOnTrack = prog.pct >= prog.targetPct;
            return (
            <Card key={i} title={prog.name} titleColor={prog.status === "green" ? T.green : prog.status === "blue" ? T.blue : T.purple}>
              <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
                <StatusPill status={prog.status} />
                <span style={{ fontSize: 11, color: T.textDim, background: T.bg0, padding: "3px 8px", borderRadius: 4 }}>{prog.phase}</span>
                <span style={{ fontSize: 11, color: T.textDim, background: T.bg0, padding: "3px 8px", borderRadius: 4 }}>{prog.partner}</span>
                {prog.pct < 100 && <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 4, fontWeight: 600, background: isBehind ? T.danger + "18" : isOnTrack ? T.green + "18" : T.warn + "18", color: isBehind ? T.danger : isOnTrack ? T.green : T.warn }}>{isBehind ? "BEHIND" : isOnTrack ? "ON TRACK" : "WATCH"}</span>}
              </div>
              <div style={{ fontSize: 12, color: T.textMid, lineHeight: 1.5, marginBottom: 12 }}>{prog.desc}</div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
                  <span style={{ color: T.textDim }}>Progress</span>
                  <span style={{ color: T.text, fontWeight: 600 }}>{prog.pct}% <span style={{ color: T.textDim, fontWeight: 400 }}>/ {prog.targetPct}% target</span></span>
                </div>
                <Progress pct={prog.pct} color={prog.pct === 100 ? T.green : isBehind ? T.danger : prog.pct > 50 ? T.accent : T.blue} h={8} target={prog.pct < 100 ? prog.targetPct : undefined} threshold={prog.threshPct && prog.pct < 100 ? prog.threshPct : undefined} />
              </div>
            </Card>
          );})}
        </div>
              )
            }]),
            ...(engineeringScope === "technology" ? [] : [{
              id: "del-eng-coal",
              label: "Coal Program",
              render: () => (
        <div style={{ borderTop: `2px solid ${T.purple}40`, paddingTop: 20, marginTop: 8 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.purple, marginBottom: 14 }}>Coal Program</div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
            <EngineLight on color={T.accent} label="2 Projects Active" />
            <EngineLight on color={T.blue} label="WSP Partnership" />
            <EngineLight on color={T.green} label="Feedstock LOI (TX)" />
            <EngineLight on color={T.purple} label="B&R Selected (TX)" />
            <EngineLight color={T.warn} label="FL Site TBD" />
          </div>

          <DraggableCardRow
            items={[
              { id: "kpi-coal-1", label: "Projects", value: "2", sub: "FL + TX", color: T.purple, target: 3, spark: [0, 1, 1, 2, 2], sparkTarget: 3 },
              { id: "kpi-coal-2", label: "Machine Size", value: "20 TPH", color: T.accent, target: "20 TPH" },
              { id: "kpi-coal-3", label: "Total CapEx", value: "$600M", sub: "$280M + $320M", color: T.accent, target: "$550M", threshold: "$700M", invert: true },
              { id: "kpi-coal-4", label: "Plan Revenue", value: `$${(COAL_PLAN_PER_MACHINE.revenue / 1e6).toFixed(1)}M`, sub: "per machine/yr", color: T.green, target: `$${(COAL_PLAN_PER_MACHINE.revenue * 1.1 / 1e6).toFixed(1)}M` },
              { id: "kpi-coal-5", label: "Plan EBITDA", value: `$${(COAL_PLAN_PER_MACHINE.ebitda / 1e6).toFixed(1)}M`, sub: `${((COAL_PLAN_PER_MACHINE.ebitda / COAL_PLAN_PER_MACHINE.revenue) * 100).toFixed(0)}% margin`, color: T.green, target: `$${(COAL_PLAN_PER_MACHINE.ebitda * 1.05 / 1e6).toFixed(1)}M`, threshold: `$${(COAL_PLAN_PER_MACHINE.ebitda * 0.8 / 1e6).toFixed(1)}M` },
            ]}
            locked={layoutLocked}
            storageKey="sens-delivering-coal-cards-kpis"
            renderItem={(item) => <KpiCard label={item.label} value={item.value} sub={item.sub} color={item.color} target={item.target} threshold={item.threshold} spark={item.spark} sparkTarget={item.sparkTarget} invert={item.invert} />}
            style={{ marginBottom: 16 }}
          />

          <Card title="Coal Program Overview">
            <p style={{ fontSize: 13, color: T.textMid, lineHeight: 1.6, margin: 0 }}>
              The Coal Program scales our thermal processing technology from 2 TPH tire crumb machines to 20 TPH coal gasification systems. Two projects are underway: Florida (Pre-FEED, WSP Global) and Texas (FEED, Brown & Root). Each facility targets 20 TPH throughput with projected annual revenue of ${(COAL_PLAN_PER_MACHINE.revenue / 1e6).toFixed(1)}M and EBITDA of ${(COAL_PLAN_PER_MACHINE.ebitda / 1e6).toFixed(1)}M per machine at full capacity.
            </p>
          </Card>

          {developmentSites.map(ds => (
            <Card key={ds.id} title={`${ds.short} — ${ds.stage} · ${ds.capex} · ${ds.epc}`}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12, marginBottom: 16 }}>
                {PROJECT_STAGES.map((gate) => {
                  const pct = ds.stageProgress[gate.key] || 0;
                  const isCurrent = pct > 0 && pct < 100;
                  const coalStageTargets = { concept: 100, "pre-feed": 80, feed: 50, epc: 20, construction: 0, commissioning: 0 };
                  const coalStageThresholds = { concept: 100, "pre-feed": 60, feed: 30, epc: 0, construction: 0, commissioning: 0 };
                  const tgt = coalStageTargets[gate.key] || 0;
                  const thr = coalStageThresholds[gate.key] || 0;
                  const behind = isCurrent && pct < thr;
                  return (
                    <div key={gate.key}>
                      <div style={{ fontSize: 11, color: isCurrent ? T.accent : T.textDim, marginBottom: 8, fontWeight: isCurrent ? 600 : 500 }}>{gate.label}</div>
                      <Progress pct={pct} color={pct === 100 ? T.green : behind ? T.danger : pct > 0 ? gate.color : T.bg3} h={8} target={isCurrent ? tgt : undefined} threshold={isCurrent && thr > 0 ? thr : undefined} />
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: pct === 100 ? T.green : behind ? T.danger : pct > 0 ? T.text : T.textDim }}>{pct === 100 ? "✓" : `${pct}%`}</span>
                        {isCurrent && <span style={{ fontSize: 9, color: behind ? T.danger : pct >= tgt ? T.green : T.textDim }}>{behind ? "BEHIND" : pct >= tgt ? "ON TRACK" : ""}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
              {milestones[ds.id] && milestones[ds.id].map((m, i) => {
                const coalMilestoneTargets = { "WSP Pre-FEED Study": 30, "Feedstock Analysis": 60, "Technology Validation": 40, "Site Selection": 25, "Environmental Review": 10, "FEED Design": 15, "EPC Procurement": 0, "Pre-FEED Complete": 100, "FEED Design Study": 50, "Feedstock LOI": 90, "Site Permitting": 25, "EPC Bid Process": 0, "Construction Start": 0 };
                const tKey = Object.keys(coalMilestoneTargets).find(k => m.p.startsWith(k));
                const mTarget = tKey ? coalMilestoneTargets[tKey] : undefined;
                const mBehind = mTarget != null && m.pct < mTarget && m.pct < 100;
                return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "4px 0" }}>
                  <span style={{ fontSize: 12, color: T.textMid, width: 200 }}>{m.p}</span>
                  <div style={{ flex: 1 }}><Progress pct={m.pct} color={m.pct === 100 ? T.green : mBehind ? T.warn : m.pct > 0 ? T.accent : T.bg3} target={mTarget != null && m.pct < 100 ? mTarget : undefined} /></div>
                  <span style={{ fontSize: 12, color: m.pct === 100 ? T.green : mBehind ? T.warn : T.textDim, width: 80, textAlign: "right" }}>{m.t}</span>
                  {mBehind && <span style={{ fontSize: 9, color: T.warn, fontWeight: 700, width: 50 }}>BEHIND</span>}
                </div>
                );
              })}
            </Card>
          ))}
        </div>
              )
            },
            {
              id: "del-eng-workstreams",
              label: "Key Workstreams",
              render: () => (<>
          <div style={{ fontSize: 12, fontWeight: 600, color: T.textMid, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 12 }}>Key Workstreams</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16, marginTop: 10 }}>
            {[
              { name: "Feedstock Sourcing & Analysis", lead: "WSP Global", status: "green", target: "Q2 2026", pct: 70, targetPct: 75, threshPct: 50 },
              { name: "Technology Selection & Scale-Up", lead: "Internal R&D", status: "blue", target: "Q3 2026", pct: 40, targetPct: 45, threshPct: 25 },
              { name: "Coal FL — Site Evaluation", lead: "WSP Global", status: "yellow", target: "Q4 2026", pct: 20, targetPct: 30, threshPct: 15 },
              { name: "Coal TX — FEED Design", lead: "Brown & Root", status: "blue", target: "Q3 2027", pct: 35, targetPct: 40, threshPct: 20 },
              { name: "Coal TX — Feedstock LOI", lead: "SW Energy Resources", status: "green", target: "Q2 2026", pct: 80, targetPct: 85, threshPct: 60 },
              { name: "Permitting & Environmental", lead: "WSP / B&R", status: "blue", target: "Q1 2028", pct: 10, targetPct: 12, threshPct: 5 },
              { name: "EPC Bid & Partner Selection", lead: "Internal", status: "purple", target: "Q3 2028", pct: 5, targetPct: 8, threshPct: 0 },
            ].map((ws, i) => {
              const wsIsBehind = ws.pct < ws.threshPct;
              const wsOnTrack = ws.pct >= ws.targetPct;
              return (
              <Card key={i} title={ws.name}>
                <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
                  <StatusPill status={ws.status} />
                  <span style={{ fontSize: 11, color: T.textDim, background: T.bg0, padding: "3px 8px", borderRadius: 4 }}>{ws.lead}</span>
                  <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 4, fontWeight: 600, background: wsIsBehind ? T.danger + "18" : wsOnTrack ? T.green + "18" : T.warn + "18", color: wsIsBehind ? T.danger : wsOnTrack ? T.green : T.warn }}>{wsIsBehind ? "BEHIND" : wsOnTrack ? "ON TRACK" : "WATCH"}</span>
                </div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
                    <span style={{ color: T.textDim }}>Progress</span>
                    <span style={{ color: T.text, fontWeight: 600 }}>{ws.pct}% <span style={{ color: T.textDim, fontWeight: 400 }}>/ {ws.targetPct}% target</span></span>
                  </div>
                  <Progress pct={ws.pct} color={wsIsBehind ? T.danger : ws.pct >= 70 ? T.green : ws.pct >= 30 ? T.accent : T.blue} h={6} target={ws.targetPct} threshold={ws.threshPct > 0 ? ws.threshPct : undefined} />
                </div>
                <div style={{ fontSize: 11, color: T.textDim, marginTop: 8, borderTop: `1px solid ${T.border}`, paddingTop: 6 }}>
                  Target: <span style={{ color: T.text, fontWeight: 600 }}>{ws.target}</span>
                </div>
              </Card>
            );})}
          </div>
          </>)
            }]),
          ]}
          storageKey={`sens-delivering-eng-layout${engineeringScope ? `-${engineeringScope}` : ""}`}
          locked={layoutLocked}
          onLockedChange={setLayoutLocked}
        />
      </>}
    </div>
  );
};
