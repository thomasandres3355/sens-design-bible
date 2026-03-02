import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { T } from "@core/theme/theme";
import { Card, TabBar, DataTable, DraggableGrid, DraggableCardRow, StyledSelect, SectionHeader } from "@core/ui";
import { KpiCard, StatusPill, Progress, EngineLight } from "@core/ui";
import { PROJECT_STAGES } from "@core/data/sites";
import { getAgentDirectory } from "@modules/ai-agents/vpData";
import {
  ELEMENT_CATALOG, ELEMENT_CATEGORIES, FILE_CATEGORIES,
  INITIAL_DEV_PROJECTS, INITIAL_ACTIVITY, DOWNSTREAM_MODULES,
  employeeRoster, calcElementCost, calcProcessBudget,
  calcProcessBudgetExtended,
  COAL_PRESETS, TIRE_PRESETS,
  DEFAULT_FEEDSTOCK_CONFIG, DEFAULT_FINANCIAL_CONFIG,
} from "./developmentData";

// ─── Helpers ──────────────────────────────────────────────────────
const fmt$ = (v) => v >= 1000 ? `$${(v / 1000).toFixed(1)}B` : v >= 1 ? `$${v.toFixed(1)}M` : `$${(v * 1000).toFixed(0)}K`;
const fmtN = (v) => v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `${(v / 1e3).toFixed(0)}K` : v.toFixed(0);
let _uid = 100;
const uid = () => `gen-${_uid++}`;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DEVELOPMENT VIEW
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function DevelopmentView({ onNavigate }) {
  const [tab, setTab] = useState("pipeline");
  const [projects, setProjects] = useState(INITIAL_DEV_PROJECTS);
  const [activity, setActivity] = useState(INITIAL_ACTIVITY);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [showNewProject, setShowNewProject] = useState(false);
  const [layoutLocked, setLayoutLocked] = useState(true);

  // Process designer state
  const [designerProjectId, setDesignerProjectId] = useState(projects[0]?.id || null);

  const agentDirectory = useMemo(() => getAgentDirectory(), []);
  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const designerProject = projects.find(p => p.id === designerProjectId);

  const tabs = [
    { key: "pipeline", label: "Pipeline" },
    { key: "designer", label: "Process Designer" },
    { key: "team", label: "Team & Assets" },
    { key: "dataroom", label: "Data Room" },
  ];

  return (
    <div>
      <TabBar tabs={tabs} active={tab} onChange={setTab} />
      <div style={{ marginTop: 24 }}>
        {tab === "pipeline" && <PipelineTab projects={projects} setProjects={setProjects} selectedProjectId={selectedProjectId} setSelectedProjectId={setSelectedProjectId} showNewProject={showNewProject} setShowNewProject={setShowNewProject} layoutLocked={layoutLocked} onLockedChange={setLayoutLocked} onNavigate={onNavigate} />}
        {tab === "designer" && <DesignerTab projects={projects} setProjects={setProjects} designerProjectId={designerProjectId} setDesignerProjectId={setDesignerProjectId} />}
        {tab === "team" && <TeamTab projects={projects} agentDirectory={agentDirectory} />}
        {tab === "dataroom" && <DataRoomTab projects={projects} activity={activity} />}
      </div>
      <DownstreamBar selectedProject={selectedProject || designerProject} onNavigate={onNavigate} />
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TAB 1: PIPELINE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function PipelineTab({ projects, setProjects, selectedProjectId, setSelectedProjectId, showNewProject, setShowNewProject, layoutLocked, onLockedChange }) {
  const activeProjects = projects.filter(p => p.status === "active");
  const totalPipelineValue = projects.reduce((s, p) => s + (p.budget?.estimated || 0), 0);
  const preFeedCount = projects.filter(p => p.stage === "pre-feed" || p.stage === "feed").length;

  const kpis = [
    { id: "k1", label: "Active Projects", value: activeProjects.length, sub: `${projects.length} total`, spark: [3, 4, 4, 5, 5], color: T.accent, target: 6, sparkTarget: 6 },
    { id: "k2", label: "Pipeline Value", value: fmt$(totalPipelineValue), sub: `${activeProjects.length} active`, spark: [200, 280, 340, 400, 500], color: T.green, target: "$600M", sparkTarget: 600, threshold: "$200M" },
    { id: "k3", label: "Pre-FEED / FEED", value: preFeedCount, sub: "in engineering stages", spark: [1, 1, 2, 2, 3], color: T.blue, target: 4, sparkTarget: 4 },
    { id: "k4", label: "On Hold", value: projects.filter(p => p.status === "on-hold").length, sub: "awaiting review", spark: [0, 1, 1, 1, 1], color: T.warn || T.accent, target: 0, threshold: 3, invert: true },
  ];

  const widgets = [
    { id: "dev-kpis", label: "Pipeline KPIs", render: () => (
      <DraggableCardRow items={kpis} locked={layoutLocked} storageKey="dev-pipeline-kpis" renderItem={(k) => <KpiCard key={k.id} {...k} />} />
    )},
    { id: "dev-cards", label: "Development Projects", render: () => (
      <Card title="Development Projects" titleColor={T.accent} action={
        <button onClick={() => setShowNewProject(true)} style={{ background: T.accent, color: "#1A1A1A", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>+ New Project</button>
      }>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
          {projects.map(p => <ProjectCard key={p.id} project={p} selected={selectedProjectId === p.id} onClick={() => setSelectedProjectId(selectedProjectId === p.id ? null : p.id)} />)}
        </div>
      </Card>
    )},
    { id: "dev-funnel", label: "Stage Funnel", render: () => (
      <Card title="Stage Pipeline" titleColor={T.purple}>
        <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8 }}>
          {PROJECT_STAGES.slice(0, 4).map(stage => {
            const stageProjects = projects.filter(p => p.stage === stage.key);
            return (
              <div key={stage.key} style={{ flex: 1, minWidth: 180, background: T.bg0, borderRadius: 10, padding: 14, border: `1px solid ${T.border}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: stage.color }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: T.text, textTransform: "uppercase", letterSpacing: 0.8 }}>{stage.label}</span>
                  <span style={{ fontSize: 11, color: T.textDim, marginLeft: "auto" }}>{stageProjects.length}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {stageProjects.map(p => {
                    // Determine on-schedule status for this project in this stage
                    const stagePct = p.stageProgress?.[stage.key] || 0;
                    const stageTargetPct = 60; // expected progress within current stage
                    const funnelStatus = stagePct >= stageTargetPct ? "green" : stagePct >= stageTargetPct * 0.5 ? "yellow" : "red";
                    const funnelStatusColor = funnelStatus === "green" ? T.green : funnelStatus === "yellow" ? (T.warn || T.accent) : T.danger;
                    return (
                    <div key={p.id} onClick={() => setSelectedProjectId(p.id)} style={{ background: T.bg2, borderRadius: 8, padding: "10px 12px", cursor: "pointer", border: `1px solid ${selectedProjectId === p.id ? T.accent : T.border}`, transition: "all .15s" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{p.name}</div>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: funnelStatusColor, flexShrink: 0 }} title={funnelStatus === "green" ? "On schedule" : funnelStatus === "yellow" ? "Behind schedule" : "Critically behind"} />
                      </div>
                      <div style={{ fontSize: 11, color: T.textMid }}>{p.location?.name || "Location TBD"} · {fmt$(p.budget?.estimated || 0)}</div>
                      <Progress pct={stagePct} color={funnelStatusColor} h={3} target={stageTargetPct} />
                    </div>
                  );})}
                  {stageProjects.length === 0 && <div style={{ fontSize: 11, color: T.textDim, padding: 8, textAlign: "center" }}>No projects</div>}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    )},
  ];

  return (
    <div style={{ display: "flex", gap: 24 }}>
      <div style={{ flex: 1 }}>
        <DraggableGrid widgets={widgets} storageKey="dev-pipeline-grid" locked={layoutLocked} onLockedChange={onLockedChange} />
      </div>
      {selectedProjectId && <ProjectDetailDrawer project={projects.find(p => p.id === selectedProjectId)} onClose={() => setSelectedProjectId(null)} />}
      {showNewProject && <NewProjectModal onClose={() => setShowNewProject(false)} onCreate={(p) => { setProjects(prev => [...prev, p]); setShowNewProject(false); }} />}
    </div>
  );
}

// ── Project Card ──
function ProjectCard({ project: p, selected, onClick }) {
  const [hov, setHov] = useState(false);
  const stageObj = PROJECT_STAGES.find(s => s.key === p.stage) || PROJECT_STAGES[0];
  const pct = p.stageProgress ? Object.values(p.stageProgress).reduce((a, v) => a + v, 0) / (Object.keys(p.stageProgress).length * 100) * 100 : 0;
  // Compute schedule status relative to target date
  const targetDate = p.targetFeedDate;
  const now = new Date();
  const stageIdx = PROJECT_STAGES.findIndex(s => s.key === p.stage);
  // Expected progress: projects in later stages should have higher overall %
  const expectedPct = Math.min(100, (stageIdx + 1) / PROJECT_STAGES.length * 100 * 0.8);
  const scheduleStatus = pct >= expectedPct ? "green" : pct >= expectedPct * 0.6 ? "yellow" : "red";
  const scheduleLabel = scheduleStatus === "green" ? "ON SCHEDULE" : scheduleStatus === "yellow" ? "BEHIND" : "CRITICAL";
  // Budget health: spent vs estimated
  const budgetPct = p.budget?.estimated > 0 ? ((p.budget?.spent || 0) / p.budget.estimated * 100) : 0;
  const budgetOverThreshold = budgetPct > 80;
  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: selected ? T.accentDim : hov ? T.bg3 : T.bg0, border: `1px solid ${selected ? T.accent : T.border}`, borderRadius: 10, padding: 16, cursor: "pointer", transition: "all .15s" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 2 }}>{p.name}</div>
          <div style={{ fontSize: 11, color: T.textMid }}>{p.location?.name || "Location TBD"}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
          <StatusPill status={p.health} />
          <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, fontWeight: 700, background: scheduleStatus === "green" ? T.green + "18" : scheduleStatus === "yellow" ? (T.warn || T.accent) + "18" : T.danger + "18", color: scheduleStatus === "green" ? T.green : scheduleStatus === "yellow" ? (T.warn || T.accent) : T.danger }}>{scheduleLabel}</span>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 12, background: stageObj.color + "20", color: stageObj.color, fontWeight: 600 }}>{stageObj.label}</span>
        <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 12, background: T.bg2, color: T.textMid }}>{p.feedstock}</span>
        <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 12, background: T.bg2, color: T.textMid }}>{p.targetTPH} TPH</span>
      </div>
      <Progress pct={pct} color={scheduleStatus === "red" ? T.danger : stageObj.color} h={4} target={Math.round(expectedPct)} />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 11, color: T.textMid }}>
        <span>Budget: {fmt$(p.budget?.estimated || 0)}</span>
        <span style={{ color: budgetOverThreshold ? T.danger : T.textMid, fontWeight: budgetOverThreshold ? 600 : 400 }}>Spent: {fmt$(p.budget?.spent || 0)} {budgetOverThreshold ? "(>80%)" : ""}</span>
      </div>
    </div>
  );
}

// ── Project Detail Drawer ──
function ProjectDetailDrawer({ project: p, onClose }) {
  if (!p) return null;
  const stageObj = PROJECT_STAGES.find(s => s.key === p.stage) || PROJECT_STAGES[0];
  return (
    <div style={{ width: 340, flexShrink: 0, background: T.bg1, borderRadius: 12, border: `1px solid ${T.border}`, padding: 20, height: "fit-content", position: "sticky", top: 0, maxHeight: "calc(100vh - 180px)", overflowY: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>{p.name}</div>
          <div style={{ fontSize: 12, color: T.textMid, marginTop: 2 }}>{p.location?.name || "Location TBD"}</div>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: T.textDim, cursor: "pointer", fontSize: 18 }}>✕</button>
      </div>

      <div style={{ fontSize: 12, color: T.textMid, marginBottom: 16, lineHeight: 1.5 }}>{p.description}</div>

      {/* Stage Progress */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600, marginBottom: 8 }}>Stage Progress</div>
        {(() => {
          // Target progress for each stage based on current project stage
          const currentStageIdx = PROJECT_STAGES.findIndex(s => s.key === p.stage);
          const stageTargets = {};
          const stageThresholds = {};
          PROJECT_STAGES.forEach((s, idx) => {
            if (idx < currentStageIdx) { stageTargets[s.key] = 100; stageThresholds[s.key] = 100; }
            else if (idx === currentStageIdx) { stageTargets[s.key] = 75; stageThresholds[s.key] = 40; }
            else { stageTargets[s.key] = 0; stageThresholds[s.key] = 0; }
          });
          return PROJECT_STAGES.map(s => {
            const stagePct = p.stageProgress?.[s.key] || 0;
            const stTarget = stageTargets[s.key] || 0;
            const stThresh = stageThresholds[s.key] || 0;
            const isBehind = stagePct < stThresh && stTarget > 0;
            return (
              <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 10, color: isBehind ? T.danger : T.textMid, width: 70, flexShrink: 0, fontWeight: isBehind ? 600 : 400 }}>{s.label}</span>
                <div style={{ flex: 1 }}><Progress pct={stagePct} color={isBehind ? T.danger : s.color} h={4} showLabel target={stTarget > 0 && stagePct < 100 ? stTarget : undefined} threshold={stThresh > 0 && stagePct < 100 ? stThresh : undefined} /></div>
                {isBehind && <span style={{ fontSize: 8, color: T.danger, fontWeight: 700 }}>!</span>}
              </div>
            );
          });
        })()}
      </div>

      {/* Budget */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600, marginBottom: 8 }}>Budget</div>
        {(() => {
          const estimated = p.budget?.estimated || 0;
          const spent = p.budget?.spent || 0;
          const committed = p.budget?.committed || 0;
          const spentPct = estimated > 0 ? (spent / estimated * 100) : 0;
          const committedPct = estimated > 0 ? ((spent + committed) / estimated * 100) : 0;
          const overBudget = spentPct > 100;
          const nearBudget = spentPct > 80;
          return (<>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {[
              { l: "Estimated", v: estimated, color: T.text },
              { l: "Spent", v: spent, color: overBudget ? T.danger : nearBudget ? (T.warn || T.accent) : T.text },
              { l: "Committed", v: committed, color: T.text },
            ].map(b => (
              <div key={b.l} style={{ background: T.bg0, borderRadius: 6, padding: "8px 10px" }}>
                <div style={{ fontSize: 10, color: T.textDim }}>{b.l}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: b.color }}>{fmt$(b.v || 0)}</div>
              </div>
            ))}
          </div>
          {estimated > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginBottom: 3 }}>
                <span style={{ color: T.textDim }}>Spend vs Budget</span>
                <span style={{ color: overBudget ? T.danger : T.text, fontWeight: 600 }}>{spentPct.toFixed(0)}%</span>
              </div>
              <Progress pct={Math.min(spentPct, 100)} color={overBudget ? T.danger : nearBudget ? (T.warn || T.accent) : T.accent} h={5} target={80} threshold={100} />
            </div>
          )}
          {p.budget?.categories && (
            <div style={{ marginTop: 8 }}>
              {Object.entries(p.budget.categories).filter(([, v]) => v > 0).map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: T.textMid, padding: "2px 0" }}>
                  <span style={{ textTransform: "capitalize" }}>{k}</span><span>{fmt$(v)}</span>
                </div>
              ))}
            </div>
          )}
          </>);
        })()}
      </div>

      {/* Team */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600, marginBottom: 8 }}>Team ({p.team?.length || 0})</div>
        {(p.team || []).map((t, i) => {
          const person = t.type === "employee" ? employeeRoster.find(e => e.id === t.id) : null;
          return (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: `1px solid ${T.border}` }}>
              <div>
                <div style={{ fontSize: 12, color: T.text, fontWeight: 500 }}>{person?.name || t.id}</div>
                <div style={{ fontSize: 10, color: T.textDim }}>{t.role}</div>
              </div>
              <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 10, background: t.type === "agent" ? T.purpleDim || T.purple + "20" : T.blueDim || T.blue + "20", color: t.type === "agent" ? T.purple : T.blue }}>{t.type}</span>
            </div>
          );
        })}
      </div>

      {/* Files */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600, marginBottom: 8 }}>Files ({p.files?.length || 0})</div>
        {(p.files || []).slice(0, 5).map(f => {
          const cat = FILE_CATEGORIES.find(c => c.key === f.category);
          return (
            <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: `1px solid ${T.border}` }}>
              <span style={{ fontSize: 14, width: 20, textAlign: "center", color: cat?.color || T.textMid }}>{cat?.icon || "◻"}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, color: T.text, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{f.name}</div>
                <div style={{ fontSize: 10, color: T.textDim }}>{f.uploadDate} · {f.size}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Notes */}
      {p.notes && (
        <div>
          <div style={{ fontSize: 11, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600, marginBottom: 6 }}>Notes</div>
          <div style={{ fontSize: 12, color: T.textMid, lineHeight: 1.5, background: T.bg0, borderRadius: 6, padding: 10 }}>{p.notes}</div>
        </div>
      )}

      {/* Key Dates with schedule assessment */}
      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 11, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600, marginBottom: 8 }}>Timeline</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <div style={{ flex: 1, background: T.bg0, borderRadius: 6, padding: "8px 10px" }}>
            <div style={{ fontSize: 10, color: T.textDim }}>Start</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{p.startDate}</div>
          </div>
          <div style={{ flex: 1, background: T.bg0, borderRadius: 6, padding: "8px 10px" }}>
            <div style={{ fontSize: 10, color: T.textDim }}>Target FEED</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{p.targetFeedDate}</div>
          </div>
        </div>
        {(() => {
          const stageIdx = PROJECT_STAGES.findIndex(s => s.key === p.stage);
          const overallPct = p.stageProgress ? Object.values(p.stageProgress).reduce((a, v) => a + v, 0) / (Object.keys(p.stageProgress).length * 100) * 100 : 0;
          const expectedPct = Math.min(100, (stageIdx + 1) / PROJECT_STAGES.length * 100 * 0.8);
          const schedStatus = overallPct >= expectedPct ? "green" : overallPct >= expectedPct * 0.6 ? "yellow" : "red";
          const schedColor = schedStatus === "green" ? T.green : schedStatus === "yellow" ? (T.warn || T.accent) : T.danger;
          const schedLabel = schedStatus === "green" ? "On Schedule" : schedStatus === "yellow" ? "Behind Schedule" : "Critically Behind";
          return (
            <div style={{ background: schedColor + "12", border: `1px solid ${schedColor}30`, borderRadius: 6, padding: "8px 10px", display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: schedColor }} />
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: schedColor }}>{schedLabel}</div>
                <div style={{ fontSize: 9, color: T.textDim }}>Overall: {overallPct.toFixed(0)}% vs {expectedPct.toFixed(0)}% target</div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

// ── New Project Modal ──
function NewProjectModal({ onClose, onCreate }) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [feedstock, setFeedstock] = useState("Tire Crumb");
  const [tph, setTph] = useState(2);
  const [locName, setLocName] = useState("");
  const [budget, setBudget] = useState(50);

  const handleCreate = () => {
    if (!name.trim()) return;
    onCreate({
      id: `dev-${uid()}`, name, description: desc,
      status: "active", health: "green", stage: "concept",
      stageProgress: { concept: 0, "pre-feed": 0, feed: 0, epc: 0, construction: 0, commissioning: 0 },
      feedstock, targetTPH: tph,
      location: locName ? { name: locName, state: "", lat: 0, lon: 0 } : null,
      linkedSiteId: null,
      startDate: new Date().toISOString().slice(0, 10), targetFeedDate: "TBD",
      budget: { estimated: budget, spent: 0, committed: 0, categories: { engineering: 0, permits: 0, land: 0, equipment: 0, other: 0 } },
      teamLead: null, team: [], files: [], processConfig: null, notes: "",
      created: new Date().toISOString().slice(0, 10), updated: new Date().toISOString().slice(0, 10),
    });
  };

  const inputStyle = { width: "100%", background: T.bg0, border: `1px solid ${T.border}`, borderRadius: 6, padding: "8px 10px", color: T.text, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" };
  const labelStyle = { fontSize: 11, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600, marginBottom: 4, display: "block" };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.bg1, borderRadius: 14, padding: 28, width: 440, maxHeight: "80vh", overflowY: "auto", border: `1px solid ${T.border}` }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: T.text, marginBottom: 20 }}>New Development Project</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div><label style={labelStyle}>Project Name</label><input value={name} onChange={e => setName(e.target.value)} style={inputStyle} placeholder="e.g., Houston Tire Facility" /></div>
          <div><label style={labelStyle}>Description</label><textarea value={desc} onChange={e => setDesc(e.target.value)} style={{ ...inputStyle, minHeight: 60, resize: "vertical" }} placeholder="Brief project description..." /></div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}><label style={labelStyle}>Feedstock</label><select value={feedstock} onChange={e => setFeedstock(e.target.value)} style={inputStyle}><option>Tire Crumb</option><option>Coal</option><option>Mixed</option></select></div>
            <div style={{ flex: 1 }}><label style={labelStyle}>Target TPH</label><input type="number" value={tph} onChange={e => setTph(+e.target.value)} style={inputStyle} /></div>
          </div>
          <div><label style={labelStyle}>Location</label><input value={locName} onChange={e => setLocName(e.target.value)} style={inputStyle} placeholder="City, State (optional)" /></div>
          <div><label style={labelStyle}>Estimated Budget ($M)</label><input type="number" value={budget} onChange={e => setBudget(+e.target.value)} style={inputStyle} /></div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ background: T.bg3, color: T.textMid, border: "none", borderRadius: 6, padding: "8px 18px", fontSize: 13, cursor: "pointer" }}>Cancel</button>
          <button onClick={handleCreate} style={{ background: T.accent, color: "#1A1A1A", border: "none", borderRadius: 6, padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: name.trim() ? 1 : 0.5 }}>Create Project</button>
        </div>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TAB 2: PROCESS DESIGNER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function DesignerTab({ projects, setProjects, designerProjectId, setDesignerProjectId }) {
  const project = projects.find(p => p.id === designerProjectId);
  const [elements, setElements] = useState(project?.processConfig?.elements || []);
  const [connections, setConnections] = useState(project?.processConfig?.connections || []);
  const [feedstockConfig, setFeedstockConfig] = useState(project?.processConfig?.feedstockConfig || { ...DEFAULT_FEEDSTOCK_CONFIG });
  const [financialConfig, setFinancialConfig] = useState(project?.processConfig?.financialConfig || { ...DEFAULT_FINANCIAL_CONFIG });
  const [selectedEl, setSelectedEl] = useState(null);
  const [connectMode, setConnectMode] = useState(null);
  const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });
  const [rightPanel, setRightPanel] = useState("budget");
  const [showProForma, setShowProForma] = useState(false);
  const canvasRef = useRef(null);
  const GRID = 40;

  useEffect(() => {
    const p = projects.find(p2 => p2.id === designerProjectId);
    setElements(p?.processConfig?.elements || []);
    setConnections(p?.processConfig?.connections || []);
    setFeedstockConfig(p?.processConfig?.feedstockConfig || { ...DEFAULT_FEEDSTOCK_CONFIG });
    setFinancialConfig(p?.processConfig?.financialConfig || { ...DEFAULT_FINANCIAL_CONFIG });
    setSelectedEl(null);
    setConnectMode(null);
  }, [designerProjectId]);

  const saveConfig = useCallback((els, conns, fc, fin) => {
    setProjects(prev => prev.map(p => p.id === designerProjectId ? {
      ...p, processConfig: { elements: els, connections: conns, feedstockConfig: fc, financialConfig: fin }
    } : p));
  }, [designerProjectId, setProjects]);

  const budget = useMemo(() =>
    calcProcessBudgetExtended(elements, feedstockConfig, financialConfig),
    [elements, feedstockConfig, financialConfig]
  );

  const doSave = useCallback((els, conns) => {
    saveConfig(els || elements, conns || connections, feedstockConfig, financialConfig);
  }, [elements, connections, feedstockConfig, financialConfig, saveConfig]);

  const updateFeedstock = (newFC) => { setFeedstockConfig(newFC); saveConfig(elements, connections, newFC, financialConfig); };
  const updateFinancial = (newFin) => { setFinancialConfig(newFin); saveConfig(elements, connections, feedstockConfig, newFin); };

  const handleCanvasDrop = (e) => {
    e.preventDefault();
    const type = e.dataTransfer.getData("element-type");
    if (!type || !ELEMENT_CATALOG[type]) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.round((e.clientX - rect.left - viewport.x) / (GRID * viewport.zoom)) * GRID;
    const y = Math.round((e.clientY - rect.top - viewport.y) / (GRID * viewport.zoom)) * GRID;
    const newEl = { id: `el-${uid()}`, type, x, y, quantity: 1, customCost: null, customParams: {}, label: ELEMENT_CATALOG[type].label };
    const newEls = [...elements, newEl];
    setElements(newEls);
    setSelectedEl(newEl.id);
    saveConfig(newEls, connections, feedstockConfig, financialConfig);
  };

  const handleCanvasClick = (e) => {
    if (e.target === canvasRef.current || e.target.tagName === "svg" || e.target.classList?.contains("canvas-bg")) { setSelectedEl(null); setConnectMode(null); }
  };

  const handleElementClick = (elId, e) => {
    e.stopPropagation();
    if (connectMode) {
      if (connectMode.from !== elId) {
        const newConn = { id: `conn-${uid()}`, from: connectMode.from, to: elId, label: "", color: T.accent };
        const newConns = [...connections, newConn];
        setConnections(newConns);
        doSave(elements, newConns);
      }
      setConnectMode(null);
    } else { setSelectedEl(elId); }
  };

  const handleElementDrag = (elId, e) => {
    e.preventDefault();
    const startX = e.clientX, startY = e.clientY;
    const el = elements.find(x => x.id === elId);
    if (!el) return;
    const origX = el.x, origY = el.y;
    const onMove = (me) => {
      const dx = (me.clientX - startX) / viewport.zoom;
      const dy = (me.clientY - startY) / viewport.zoom;
      setElements(prev => prev.map(x => x.id === elId ? { ...x, x: Math.round((origX + dx) / GRID) * GRID, y: Math.round((origY + dy) / GRID) * GRID } : x));
    };
    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      setElements(prev => { doSave(prev, connections); return prev; });
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  const updateElement = (id, updates) => { const newEls = elements.map(e => e.id === id ? { ...e, ...updates } : e); setElements(newEls); doSave(newEls, connections); };
  const deleteElement = (id) => { const newEls = elements.filter(e => e.id !== id); const newConns = connections.filter(c => c.from !== id && c.to !== id); setElements(newEls); setConnections(newConns); setSelectedEl(null); doSave(newEls, newConns); };
  const deleteConnection = (id) => { const newConns = connections.filter(c => c.id !== id); setConnections(newConns); doSave(elements, newConns); };

  const handleCanvasPan = (e) => {
    if (e.target !== canvasRef.current && !e.target.classList?.contains("canvas-bg")) return;
    e.preventDefault();
    const startX = e.clientX, startY = e.clientY, origVX = viewport.x, origVY = viewport.y;
    const onMove = (me) => setViewport(v => ({ ...v, x: origVX + (me.clientX - startX), y: origVY + (me.clientY - startY) }));
    const onUp = () => { document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); };
    document.addEventListener("mousemove", onMove); document.addEventListener("mouseup", onUp);
  };

  const handleWheel = (e) => { e.preventDefault(); setViewport(v => ({ ...v, zoom: Math.max(0.3, Math.min(3, v.zoom * (e.deltaY > 0 ? 0.9 : 1.1))) })); };

  const selEl = elements.find(e => e.id === selectedEl);
  const selCat = selEl ? ELEMENT_CATALOG[selEl.type] : null;
  const barSeg = (pct, color) => ({ height: 5, borderRadius: 2, background: color, width: `${pct}%`, transition: "width 0.2s" });

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 240px)", minHeight: 500 }}>
      {/* Top KPI bar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8, padding: "0 0 10px 0", flexShrink: 0 }}>
        {[
          { label: "Total CapEx", value: fmt$(budget.totalCapex), color: T.accent, targetLabel: budget.totalCapex > 0 ? `Target: ${fmt$(budget.totalCapex * 0.9)}` : null },
          { label: "Power Gen", value: `${budget.totalPowerGenMW.toFixed(0)} MW`, color: T.green, targetLabel: "Target: 50 MW" },
          { label: "Power Load", value: `${budget.totalPowerConsumeMW.toFixed(1)} MW`, color: T.blue },
          { label: "Power Surplus", value: `${budget.powerSurplusMW >= 0 ? "+" : ""}${budget.powerSurplusMW.toFixed(1)} MW`, color: budget.powerSurplusMW >= 0 ? T.green : T.danger, targetLabel: "Target: >0 MW" },
          { label: "Coal → MW", value: budget.coalMachines > 0 ? `${budget.coalCharMWCapacity.toFixed(1)} MW` : "—", color: T.warn || T.accent, sub: budget.coalMachines > 0 ? `${(budget.carbonFuelCoverage * 100).toFixed(0)}% fuel · ${(budget.coalThermalEfficiency * 100).toFixed(0)}% eff` : null },
          { label: "Yr 4 EBITDA", value: budget.proForma?.rows?.ebitda?.[4] != null ? fmt$(budget.proForma.rows.ebitda[4]) : "—", color: (budget.proForma?.rows?.ebitda?.[4] || 0) >= 0 ? T.green : T.danger, targetLabel: budget.proForma?.rows?.ebitda?.[4] != null ? "Target: >$0" : null },
        ].map((k, i) => (
          <div key={i} style={{ background: T.bg1, borderRadius: 8, border: `1px solid ${T.border}`, padding: "8px 10px" }}>
            <div style={{ fontSize: 9, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600, marginBottom: 2 }}>{k.label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: k.color }}>{k.value}</div>
            {k.sub && <div style={{ fontSize: 9, color: T.textMid, marginTop: 1 }}>{k.sub}</div>}
            {k.targetLabel && <div style={{ fontSize: 8, color: T.textDim, marginTop: 1, fontStyle: "italic" }}>{k.targetLabel}</div>}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 0, flex: 1, minHeight: 0 }}>
        {/* Left: Palette */}
        <div style={{ width: 210, flexShrink: 0, background: T.bg1, borderRadius: "12px 0 0 12px", border: `1px solid ${T.border}`, borderRight: "none", overflowY: "auto", padding: "14px 10px" }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600, marginBottom: 8 }}>Project</div>
            <select value={designerProjectId || ""} onChange={e => setDesignerProjectId(e.target.value)}
              style={{ width: "100%", background: T.bg0, border: `1px solid ${T.border}`, borderRadius: 6, padding: "6px 8px", color: T.text, fontSize: 12, fontFamily: "inherit" }}>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div style={{ fontSize: 11, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600, marginBottom: 8 }}>Elements</div>
          {ELEMENT_CATEGORIES.map(cat => (
            <div key={cat.key} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: cat.color, fontWeight: 600, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.6 }}>{cat.label}</div>
              {Object.entries(ELEMENT_CATALOG).filter(([, v]) => v.category === cat.key).map(([key, el]) => {
                // Show catalog cost as the target cost
                const targetCost = el.capex;
                return (
                <div key={key} draggable onDragStart={e => { e.dataTransfer.setData("element-type", key); e.dataTransfer.effectAllowed = "copy"; }}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 6, cursor: "grab", marginBottom: 2, background: T.bg0, border: `1px solid ${T.border}`, transition: "all .1s" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = el.color} onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
                  <span style={{ fontSize: 14, width: 20, textAlign: "center" }}>{el.icon}</span>
                  <div>
                    <div style={{ fontSize: 11, color: T.text, fontWeight: 500 }}>{el.label}</div>
                    <div style={{ fontSize: 9, color: T.textDim }}>{fmt$(el.capex)}{el.mw ? "/MW" : "/unit"}</div>
                    <div style={{ fontSize: 8, color: T.green }}>Target: {fmt$(targetCost * 0.9)}{el.mw ? "/MW" : "/unit"}</div>
                  </div>
                </div>
              );})}
            </div>
          ))}
        </div>

        {/* Center: Canvas + Pro Forma drawer */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          <div ref={canvasRef} onClick={handleCanvasClick} onMouseDown={handleCanvasPan} onWheel={handleWheel}
            onDragOver={e => e.preventDefault()} onDrop={handleCanvasDrop}
            style={{ flex: 1, background: T.bg0, border: `1px solid ${T.border}`, position: "relative", overflow: "hidden", cursor: connectMode ? "crosshair" : "default" }}>
            <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
              <defs><pattern id="grid" width={GRID * viewport.zoom} height={GRID * viewport.zoom} patternUnits="userSpaceOnUse" x={viewport.x % (GRID * viewport.zoom)} y={viewport.y % (GRID * viewport.zoom)}><circle cx={1} cy={1} r={0.5} fill={T.textDim + "30"} /></pattern></defs>
              <rect width="100%" height="100%" fill="url(#grid)" className="canvas-bg" style={{ pointerEvents: "all" }} />
            </svg>
            <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
              {connections.map(conn => {
                const fromEl = elements.find(e => e.id === conn.from), toEl = elements.find(e => e.id === conn.to);
                if (!fromEl || !toEl) return null;
                const fc2 = ELEMENT_CATALOG[fromEl.type] || {}, tc = ELEMENT_CATALOG[toEl.type] || {};
                const fx = viewport.x + (fromEl.x + (fc2.w || 2) * GRID / 2) * viewport.zoom, fy = viewport.y + (fromEl.y + (fc2.h || 2) * GRID / 2) * viewport.zoom;
                const tx = viewport.x + (toEl.x + (tc.w || 2) * GRID / 2) * viewport.zoom, ty = viewport.y + (toEl.y + (tc.h || 2) * GRID / 2) * viewport.zoom;
                const mx = (fx + tx) / 2;
                return (<g key={conn.id} style={{ pointerEvents: "all", cursor: "pointer" }} onClick={() => deleteConnection(conn.id)}>
                  <path d={`M${fx},${fy} C${mx},${fy} ${mx},${ty} ${tx},${ty}`} stroke={conn.color || T.accent} strokeWidth={2} fill="none" strokeDasharray="6,3" opacity={0.6} />
                  <circle cx={tx} cy={ty} r={4} fill={conn.color || T.accent} opacity={0.6} />
                  {conn.label && <text x={mx} y={(fy + ty) / 2 - 6} fill={T.textDim} fontSize={9 * viewport.zoom} textAnchor="middle">{conn.label}</text>}
                </g>);
              })}
            </svg>
            {elements.map(el => {
              const cat = ELEMENT_CATALOG[el.type]; if (!cat) return null;
              const w = (cat.w || 2) * GRID * viewport.zoom, h = (cat.h || 2) * GRID * viewport.zoom;
              const x = viewport.x + el.x * viewport.zoom, y = viewport.y + el.y * viewport.zoom;
              const isSelected = selectedEl === el.id;
              return (<div key={el.id} onClick={(e) => handleElementClick(el.id, e)} onMouseDown={(e) => { if (e.button === 0 && !connectMode) handleElementDrag(el.id, e); }}
                style={{ position: "absolute", left: x, top: y, width: w, height: h, background: (cat.color || T.accent) + "18", border: `2px solid ${isSelected ? T.accent : (cat.color || T.accent) + "60"}`, borderRadius: 8, cursor: connectMode ? "crosshair" : "move", transition: "border-color .1s", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, boxShadow: isSelected ? `0 0 12px ${T.accent}40` : "none" }}>
                <span style={{ fontSize: Math.max(12, 16 * viewport.zoom) }}>{cat.icon}</span>
                <span style={{ fontSize: Math.max(8, 10 * viewport.zoom), color: T.text, fontWeight: 600, textAlign: "center", padding: "0 4px", lineHeight: 1.2 }}>{el.label}</span>
                {el.quantity > 1 && <span style={{ fontSize: Math.max(7, 9 * viewport.zoom), color: T.textMid }}>×{el.quantity}</span>}
              </div>);
            })}
            <div style={{ position: "absolute", top: 10, right: 10, display: "flex", gap: 4 }}>
              <button onClick={() => setShowProForma(p => !p)} style={{ ...canvasBtnStyle, background: showProForma ? T.accent + "30" : T.bg2, color: showProForma ? T.accent : T.textMid }}>Pro Forma</button>
              <button onClick={() => setViewport({ x: 0, y: 0, zoom: 1 })} style={canvasBtnStyle}>Reset</button>
              <button onClick={() => setViewport(v => ({ ...v, zoom: Math.min(3, v.zoom * 1.2) }))} style={canvasBtnStyle}>+</button>
              <button onClick={() => setViewport(v => ({ ...v, zoom: Math.max(0.3, v.zoom * 0.8) }))} style={canvasBtnStyle}>−</button>
            </div>
            {connectMode && <div style={{ position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)", background: T.accent, color: "#1A1A1A", padding: "4px 14px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>Click target element to connect</div>}
            {elements.length === 0 && (<div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}><div style={{ textAlign: "center", color: T.textDim }}><div style={{ fontSize: 32, marginBottom: 8 }}>⚙</div><div style={{ fontSize: 14, fontWeight: 600 }}>Drag elements from the palette</div><div style={{ fontSize: 12, marginTop: 4 }}>Build your facility configuration</div></div></div>)}
          </div>

          {/* Pro Forma Drawer */}
          {showProForma && budget.proForma && (
            <div style={{ background: T.bg1, border: `1px solid ${T.border}`, borderTop: "none", maxHeight: 260, overflowY: "auto", flexShrink: 0 }}>
              <div style={{ padding: "10px 14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ fontSize: 11, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600 }}>6-Year Pro Forma ($M)</div>
                  <div style={{ display: "flex", gap: 12, fontSize: 11 }}>
                    <span style={{ color: T.purple }}>Foundation ({financialConfig.foundationShare}%): <strong>{fmt$(budget.proForma.foundationDiv)}</strong></span>
                    <span style={{ color: T.green }}>SENS ({100 - financialConfig.foundationShare}%): <strong>{fmt$(budget.proForma.sensDiv)}</strong></span>
                  </div>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                  <thead><tr style={{ borderBottom: `1px solid ${T.border}` }}>
                    <th style={{ textAlign: "left", padding: "6px 8px", color: T.textDim, fontWeight: 600, fontSize: 10 }}>Line Item</th>
                    {[0,1,2,3,4,5].map(y => <th key={y} style={{ textAlign: "right", padding: "6px 6px", color: T.textDim, fontWeight: 600, fontSize: 10 }}>Yr {y}</th>)}
                  </tr></thead>
                  <tbody>
                    {[
                      { label: "CapEx", data: budget.proForma.rows.capex, color: T.danger },
                      { label: "Revenue", data: budget.proForma.rows.revenue, color: T.green },
                      { label: "OpEx", data: budget.proForma.rows.opex, color: T.warn || T.accent },
                      { label: "EBITDA", data: budget.proForma.rows.ebitda, color: T.accent, bold: true },
                      { label: "Net Income", data: budget.proForma.rows.netIncome, color: T.blue },
                      { label: "FCF", data: budget.proForma.rows.fcf, color: T.text, bold: true },
                      { label: "Cum. FCF", data: budget.proForma.rows.cumFCF, color: T.purple },
                    ].map(({ label, data, color, bold }) => (
                      <tr key={label} style={{ borderBottom: `1px solid ${T.border}20` }}>
                        <td style={{ padding: "4px 8px", color, fontWeight: bold ? 600 : 400 }}>{label}</td>
                        {data.map((v, i) => (<td key={i} style={{ textAlign: "right", padding: "4px 6px", fontFamily: "'SF Mono', monospace", fontSize: 10, color: v < 0 ? T.danger : color }}>
                          {Math.abs(v) < 0.05 ? "—" : v < 0 ? `(${Math.abs(v).toFixed(1)})` : v.toFixed(1)}
                        </td>))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right: Properties + Budget/Feedstock/Financial tabs */}
        <div style={{ width: 300, flexShrink: 0, background: T.bg1, borderRadius: "0 12px 12px 0", border: `1px solid ${T.border}`, borderLeft: "none", overflowY: "auto", display: "flex", flexDirection: "column" }}>
          {/* Properties */}
          <div style={{ padding: 14, borderBottom: `1px solid ${T.border}` }}>
            {selEl && selCat ? (<>
              <div style={{ fontSize: 11, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600, marginBottom: 8 }}>Properties</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}><span>{selCat.icon}</span> {selEl.label}</div>
              <div style={{ fontSize: 11, color: T.textMid, marginBottom: 12, lineHeight: 1.4 }}>{selCat.description}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <PropField label="Label" value={selEl.label} onChange={v => updateElement(selEl.id, { label: v })} />
                <PropField label="Quantity" type="number" value={selEl.quantity} onChange={v => updateElement(selEl.id, { quantity: Math.max(1, +v) })} />
                {selCat.mw && <PropField label="MW Rating" type="number" value={selEl.customParams?.mw || selCat.mw} onChange={v => updateElement(selEl.id, { customParams: { ...selEl.customParams, mw: +v } })} />}
                {selCat.acres && <PropField label="Acres" type="number" value={selEl.customParams?.acres || 100} onChange={v => updateElement(selEl.id, { customParams: { ...selEl.customParams, acres: +v } })} />}
                {selCat.capacityGal && <PropField label="Capacity (gal)" type="number" value={selEl.customParams?.capacityGal || selCat.capacityGal} onChange={v => updateElement(selEl.id, { customParams: { ...selEl.customParams, capacityGal: +v } })} />}
                {selCat.capacityTon && <PropField label="Capacity (ton)" type="number" value={selEl.customParams?.capacityTon || selCat.capacityTon} onChange={v => updateElement(selEl.id, { customParams: { ...selEl.customParams, capacityTon: +v } })} />}
                <PropField label="Cost Override ($M)" type="number" value={selEl.customCost ?? ""} onChange={v => updateElement(selEl.id, { customCost: v === "" ? null : +v })} placeholder={`Default: ${fmt$(selCat.capex)}`} />
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
                <button onClick={() => setConnectMode({ from: selEl.id })} style={{ ...canvasBtnStyle, flex: 1, background: T.blue + "20", color: T.blue }}>Connect →</button>
                <button onClick={() => deleteElement(selEl.id)} style={{ ...canvasBtnStyle, flex: 1, background: T.danger + "20", color: T.danger }}>Delete</button>
              </div>
              <div style={{ marginTop: 10, fontSize: 11, color: T.textMid }}>
                {(() => {
                  const elCost = calcElementCost(selEl);
                  const catalogCapex = selCat.capex * (selCat.mw ? (selEl.customParams?.mw || selCat.mw) : 1) * selEl.quantity;
                  const actualCapex = elCost.capex;
                  const capexDiff = catalogCapex > 0 ? ((actualCapex - catalogCapex) / catalogCapex * 100) : 0;
                  const isOverBudget = capexDiff > 10;
                  return (<>
                    <div>CapEx: <strong style={{ color: isOverBudget ? T.danger : T.text }}>{fmt$(actualCapex)}</strong>
                      {catalogCapex > 0 && selEl.customCost != null && (
                        <span style={{ fontSize: 9, marginLeft: 4, color: isOverBudget ? T.danger : T.green }}>
                          ({capexDiff >= 0 ? "+" : ""}{capexDiff.toFixed(0)}% vs catalog)
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 9, color: T.textDim }}>Catalog target: {fmt$(catalogCapex)}</div>
                    <div>OpEx/yr: <strong style={{ color: T.text }}>{fmt$(elCost.opexAnnual)}</strong></div>
                    {elCost.revAnnual > 0 && <div>Revenue/yr: <strong style={{ color: T.green }}>{fmt$(elCost.revAnnual)}</strong></div>}
                  </>);
                })()}
              </div>
            </>) : (<div style={{ color: T.textDim, fontSize: 12, textAlign: "center", padding: 20 }}>Select an element to edit properties</div>)}
          </div>

          {/* Sub-tabs */}
          <div style={{ display: "flex", borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
            {[{ key: "budget", label: "Budget" }, { key: "feedstock", label: "Feedstock" }, { key: "financial", label: "Financial" }].map(t => (
              <button key={t.key} onClick={() => setRightPanel(t.key)} style={{ flex: 1, background: "none", border: "none", borderBottom: `2px solid ${rightPanel === t.key ? T.accent : "transparent"}`, padding: "8px 4px", fontSize: 10, fontWeight: rightPanel === t.key ? 600 : 400, color: rightPanel === t.key ? T.text : T.textMid, cursor: "pointer", fontFamily: "inherit", textTransform: "uppercase", letterSpacing: 0.5 }}>{t.label}</button>
            ))}
          </div>

          {/* Budget */}
          {rightPanel === "budget" && (<div style={{ padding: 14, background: T.bg0, flex: 1 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 10 }}>
              <BudgetMetric label="Total CapEx" value={fmt$(budget.totalCapex)} color={T.accent} target={budget.totalCapex > 0 ? fmt$(budget.totalCapex * 0.9) : undefined} />
              <BudgetMetric label="Annual OpEx" value={fmt$(budget.totalOpex)} color={T.blue} target={budget.totalOpex > 0 ? fmt$(budget.totalOpex * 0.85) : undefined} />
              <BudgetMetric label="Annual Revenue" value={fmt$(budget.totalRev)} color={T.green} target={budget.totalRev > 0 ? fmt$(budget.totalRev * 1.1) : undefined} />
              <BudgetMetric label="EBITDA" value={fmt$(budget.ebitda)} color={budget.ebitda >= 0 ? T.green : T.danger} target={budget.ebitda !== 0 ? fmt$(Math.abs(budget.ebitda) * 1.15) : undefined} />
            </div>
            <div style={{ fontSize: 11, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600, marginBottom: 6 }}>Capacity & Conversion</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 6 }}>
              <CapacityCheck label="Power Balance" value={`${budget.powerSurplusMW >= 0 ? "+" : ""}${budget.powerSurplusMW.toFixed(1)} MW`} ok={budget.powerSurplusMW >= 0} />
              <CapacityCheck label="Diluent Buffer" value={budget.diluentBufferDays === Infinity ? "N/A" : `${budget.diluentBufferDays.toFixed(0)} days`} ok={budget.diluentBufferDays >= 7 || budget.diluentBufferDays === Infinity} />
              <CapacityCheck label="Carbon Buffer" value={budget.carbonBufferDays === Infinity ? "N/A" : `${budget.carbonBufferDays.toFixed(0)} days`} ok={budget.carbonBufferDays >= 7 || budget.carbonBufferDays === Infinity} />
              {budget.coalMachines > 0 && <>
                <CapacityCheck label="Char Ash" value={`${budget.coalCharAshPct.toFixed(1)}%`} ok={budget.coalCharAshPct <= 25} />
                <CapacityCheck label="Thermal Eff" value={`${(budget.coalThermalEfficiency * 100).toFixed(1)}%`} ok={budget.coalThermalEfficiency >= 0.28} />
                <CapacityCheck label="Fuel Coverage" value={budget.installedCarbonMW > 0 ? `${(budget.carbonFuelCoverage * 100).toFixed(0)}%` : "N/A"} ok={budget.carbonFuelCoverage >= 0.7 || budget.installedCarbonMW === 0} />
                <CapacityCheck label="Coal → MW" value={`${budget.coalCharMWCapacity.toFixed(0)} / ${budget.installedCarbonMW} MW`} ok={budget.coalCharMWCapacity >= budget.installedCarbonMW * 0.5} />
              </>}
            </div>
            {budget.warnings.length > 0 && (<div style={{ marginTop: 6 }}>{budget.warnings.map((w, i) => (
              <div key={i} style={{ fontSize: 10, color: w.severity === "red" ? T.danger : (T.warn || T.accent), padding: "4px 8px", background: (w.severity === "red" ? T.danger : (T.warn || T.accent)) + "15", borderRadius: 4, marginBottom: 3, lineHeight: 1.3 }}>⚠ {w.msg}</div>
            ))}</div>)}
            <div style={{ fontSize: 10, color: T.textDim, marginTop: 8 }}>{elements.length} elements · {connections.length} connections · {budget.coalMachines} coal · {budget.equivalentTireMachines2TPH} tire</div>
          </div>)}

          {/* Feedstock */}
          {rightPanel === "feedstock" && (<div style={{ padding: 14, background: T.bg0, flex: 1 }}>
            {/* Coal */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontSize: 11, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600 }}>Coal Proximate Analysis</div>
                <select onChange={e => { const p = COAL_PRESETS[e.target.value]; if (p) updateFeedstock({ ...feedstockConfig, coalFeedstock: { ...p } }); }}
                  style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 4, padding: "2px 6px", color: T.text, fontSize: 9, fontFamily: "inherit" }}>
                  <option value="">Preset...</option>
                  {Object.keys(COAL_PRESETS).map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", height: 5, borderRadius: 2, overflow: "hidden", marginBottom: 8, background: T.bg3 }}>
                <div style={barSeg(feedstockConfig.coalFeedstock.fixedCarbon, T.accent)} />
                <div style={barSeg(feedstockConfig.coalFeedstock.volatileMatter, T.blue)} />
                <div style={barSeg(feedstockConfig.coalFeedstock.ash, T.textMid)} />
                <div style={barSeg(feedstockConfig.coalFeedstock.moisture, T.teal)} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                {[{ key: "fixedCarbon", label: "Fixed Carbon", color: T.accent }, { key: "volatileMatter", label: "Volatile Matter", color: T.blue }, { key: "ash", label: "Ash", color: T.textMid }, { key: "moisture", label: "Moisture", color: T.teal }].map(f => (
                  <div key={f.key} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: f.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 9, color: T.textMid, flex: 1 }}>{f.label}</span>
                    <input type="number" step="0.5" value={feedstockConfig.coalFeedstock[f.key]} onChange={e => updateFeedstock({ ...feedstockConfig, coalFeedstock: { ...feedstockConfig.coalFeedstock, [f.key]: Math.max(0, Math.min(100, +e.target.value)) } })}
                      style={{ width: 42, background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 3, padding: "2px 4px", color: T.text, fontSize: 10, fontFamily: "inherit", textAlign: "right" }} />
                    <span style={{ fontSize: 8, color: T.textDim }}>%</span>
                  </div>
                ))}
              </div>
              {(() => { const t = feedstockConfig.coalFeedstock.fixedCarbon + feedstockConfig.coalFeedstock.volatileMatter + feedstockConfig.coalFeedstock.ash + feedstockConfig.coalFeedstock.moisture; return <div style={{ fontSize: 9, marginTop: 4, color: Math.abs(t - 100) < 0.5 ? T.green : T.danger, fontWeight: 600 }}>{Math.abs(t - 100) < 0.5 ? "✓ Balanced" : `✗ Total: ${t.toFixed(1)}%`}</div>; })()}
            </div>
            {/* Tire */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontSize: 11, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600 }}>Tire Proximate Analysis</div>
                <select onChange={e => { const p = TIRE_PRESETS[e.target.value]; if (p) updateFeedstock({ ...feedstockConfig, tireFeedstock: { ...p } }); }}
                  style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 4, padding: "2px 6px", color: T.text, fontSize: 9, fontFamily: "inherit" }}>
                  <option value="">Preset...</option>
                  {Object.keys(TIRE_PRESETS).map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", height: 5, borderRadius: 2, overflow: "hidden", marginBottom: 8, background: T.bg3 }}>
                <div style={barSeg(feedstockConfig.tireFeedstock.fixedCarbon, T.accent)} />
                <div style={barSeg(feedstockConfig.tireFeedstock.volatileMatter, T.blue)} />
                <div style={barSeg(feedstockConfig.tireFeedstock.ash, T.textMid)} />
                <div style={barSeg(feedstockConfig.tireFeedstock.moisture, T.teal)} />
                <div style={barSeg(feedstockConfig.tireFeedstock.steel || 0, T.purple)} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                {[{ key: "fixedCarbon", label: "Fixed Carbon", color: T.accent }, { key: "volatileMatter", label: "Volatile Matter", color: T.blue }, { key: "ash", label: "Ash", color: T.textMid }, { key: "moisture", label: "Moisture", color: T.teal }, { key: "steel", label: "Steel", color: T.purple }].map(f => (
                  <div key={f.key} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: f.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 9, color: T.textMid, flex: 1 }}>{f.label}</span>
                    <input type="number" step="0.5" value={feedstockConfig.tireFeedstock[f.key] || 0} onChange={e => updateFeedstock({ ...feedstockConfig, tireFeedstock: { ...feedstockConfig.tireFeedstock, [f.key]: Math.max(0, Math.min(100, +e.target.value)) } })}
                      style={{ width: 42, background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 3, padding: "2px 4px", color: T.text, fontSize: 10, fontFamily: "inherit", textAlign: "right" }} />
                    <span style={{ fontSize: 8, color: T.textDim }}>%</span>
                  </div>
                ))}
              </div>
              {(() => { const tf = feedstockConfig.tireFeedstock; const t = tf.fixedCarbon + tf.volatileMatter + tf.ash + tf.moisture + (tf.steel || 0); return <div style={{ fontSize: 9, marginTop: 4, color: Math.abs(t - 100) < 0.5 ? T.green : T.danger, fontWeight: 600 }}>{Math.abs(t - 100) < 0.5 ? "✓ Balanced" : `✗ Total: ${t.toFixed(1)}%`}</div>; })()}
            </div>
            {/* Conversion summary */}
            {budget.coalMachines > 0 && (<div style={{ marginTop: 14, borderTop: `1px solid ${T.border}`, paddingTop: 10 }}>
              <div style={{ fontSize: 10, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 600, marginBottom: 6 }}>Coal Conversion</div>
              {[{ l: "Feedstock", v: `${fmtN(budget.coalConv.annualFeedstockTons)} ton/yr` }, { l: "Carbon Char", v: `${fmtN(budget.coalConv.carbonCharYield)} ton/yr`, c: T.accent }, { l: "Fuel Oil", v: `${fmtN(budget.coalConv.fuelOilYield)} ton/yr`, c: T.blue }, { l: "Char Ash", v: `${budget.coalConv.charAshPct.toFixed(1)}%`, c: budget.coalConv.charAshPct <= 25 ? T.green : T.danger }, { l: "Heat Rate", v: `${budget.coalConv.effectiveHeatRate.toFixed(0)} BTU/kWh` }, { l: "Coal → Power", v: `${budget.coalConv.mwCapacity.toFixed(1)} MW`, c: T.green }, { l: "Tons/MWh", v: budget.coalConv.tonsPerMWh.toFixed(1), c: T.accent }].map((r, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 10, padding: "2px 0" }}><span style={{ color: T.textMid }}>{r.l}</span><span style={{ fontWeight: 600, color: r.c || T.text, fontFamily: "'SF Mono', monospace" }}>{r.v}</span></div>
              ))}
            </div>)}
            {budget.equivalentTireMachines2TPH > 0 && (<div style={{ marginTop: 10, borderTop: `1px solid ${T.border}`, paddingTop: 10 }}>
              <div style={{ fontSize: 10, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 600, marginBottom: 6 }}>Tire Conversion</div>
              {[{ l: "Feedstock", v: `${fmtN(budget.tireConv.annualFeedstockTons)} ton/yr` }, { l: "Carbon Black", v: `${fmtN(budget.tireConv.carbonBlackYield)} ton/yr`, c: T.accent }, { l: "Pyro-Oil", v: `${fmtN(budget.tireConv.oilYield)} ton/yr`, c: T.blue }, { l: "Steel", v: `${fmtN(budget.tireConv.steelYield)} ton/yr`, c: T.purple }, { l: "Oil Yield", v: `${budget.tireConv.oilGalPerTon.toFixed(0)} gal/ton`, c: T.blue }].map((r, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 10, padding: "2px 0" }}><span style={{ color: T.textMid }}>{r.l}</span><span style={{ fontWeight: 600, color: r.c || T.text, fontFamily: "'SF Mono', monospace" }}>{r.v}</span></div>
              ))}
            </div>)}
          </div>)}

          {/* Financial */}
          {rightPanel === "financial" && (<div style={{ padding: 14, background: T.bg0, flex: 1 }}>
            <div style={{ fontSize: 11, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600, marginBottom: 10 }}>Financial Assumptions</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[{ label: "PPA Price ($/MWh)", key: "ppaPrice", step: 5 }, { label: "Grid Price ($/MWh)", key: "gridPrice", step: 5 }, { label: "Revenue Escalator (%)", key: "revenueEscalator", step: 0.5 }, { label: "O&M Escalator (%)", key: "omEscalator", step: 0.5 }, { label: "Federal Tax (%)", key: "federalTax", step: 1 }, { label: "State Tax (%)", key: "stateTax", step: 0.5 }, { label: "Local Tax (%)", key: "localTax", step: 0.5 }, { label: "Inflation (%)", key: "inflation", step: 0.5 }, { label: "Insurance (% CapEx)", key: "insurance", step: 0.1 }, { label: "Foundation Share (%)", key: "foundationShare", step: 1 }, { label: "Equity (%)", key: "equity", step: 5 }, { label: "Tire Offtake/Machine ($M)", key: "tireOfftakePerMachine", step: 0.5 }].map(f => (
                <div key={f.key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 10, color: T.textMid, flex: 1 }}>{f.label}</span>
                  <input type="number" step={f.step} value={financialConfig[f.key]} onChange={e => updateFinancial({ ...financialConfig, [f.key]: +e.target.value })}
                    style={{ width: 60, background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 4, padding: "3px 6px", color: T.blue, fontSize: 11, fontFamily: "'SF Mono', monospace", textAlign: "right" }} />
                </div>
              ))}
            </div>
          </div>)}
        </div>
      </div>
    </div>
  );
}const canvasBtnStyle = { background: T.bg2, color: T.textMid, border: `1px solid ${T.border}`, borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: "pointer", fontFamily: "inherit" };

function PropField({ label, value, onChange, type = "text", placeholder }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: T.textDim, marginBottom: 2 }}>{label}</div>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: "100%", background: T.bg0, border: `1px solid ${T.border}`, borderRadius: 4, padding: "5px 8px", color: T.text, fontSize: 12, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
    </div>
  );
}

function BudgetMetric({ label, value, color, target }) {
  return (
    <div style={{ background: T.bg1, borderRadius: 6, padding: "8px 10px", border: `1px solid ${T.border}` }}>
      <div style={{ fontSize: 9, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color }}>{value}</div>
      {target && <div style={{ fontSize: 8, color: T.textDim, marginTop: 1 }}>Target: {target}</div>}
    </div>
  );
}

function CapacityCheck({ label, value, ok }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11 }}>
      <span style={{ color: T.textMid }}>{label}</span>
      <span style={{ fontWeight: 600, color: ok ? T.green : T.danger }}>{value} {ok ? "✓" : "✗"}</span>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TAB 3: TEAM & ASSETS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function TeamTab({ projects, agentDirectory }) {
  const [filterProject, setFilterProject] = useState("all");

  // Build team roster with project assignments
  const assignments = useMemo(() => {
    const map = {};
    for (const p of projects) {
      for (const t of (p.team || [])) {
        const key = `${t.type}-${t.id}`;
        if (!map[key]) {
          const person = t.type === "employee" ? employeeRoster.find(e => e.id === t.id) : agentDirectory.find(a => a.id === t.id);
          map[key] = { ...t, name: person?.name || person?.title || t.id, title: person?.title || "", projects: [] };
        }
        map[key].projects.push({ id: p.id, name: p.name, role: t.role });
      }
    }
    return Object.values(map);
  }, [projects, agentDirectory]);

  const filtered = filterProject === "all" ? assignments : assignments.filter(a => a.projects.some(p => p.id === filterProject));

  const widgets = [
    { id: "team-table", label: "Project Assignments", render: () => (
      <Card title="Project Assignments" titleColor={T.blue} action={
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select value={filterProject} onChange={e => setFilterProject(e.target.value)}
            style={{ background: T.bg0, border: `1px solid ${T.border}`, borderRadius: 6, padding: "4px 8px", color: T.text, fontSize: 11, fontFamily: "inherit" }}>
            <option value="all">All Projects</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      }>
        <DataTable
          columns={["Person", "Title", "Type", "Projects", "Role"]}
          rows={filtered.map(a => [
            a.name,
            a.title,
            <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: a.type === "agent" ? T.purple + "20" : T.blue + "20", color: a.type === "agent" ? T.purple : T.blue }}>{a.type}</span>,
            a.projects.map(p => p.name).join(", "),
            a.projects.map(p => p.role).join(", "),
          ])}
        />
      </Card>
    )},
    { id: "team-heatmap", label: "Workload Heatmap", render: () => (
      <Card title="Workload Heatmap" titleColor={T.accent}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "8px 10px", color: T.textDim, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>Person</th>
                {projects.filter(p => p.status === "active").map(p => (
                  <th key={p.id} style={{ padding: "8px 6px", color: T.textDim, fontWeight: 600, borderBottom: `1px solid ${T.border}`, fontSize: 10, maxWidth: 100, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name.split(" ")[0]}</th>
                ))}
                <th style={{ padding: "8px 10px", color: T.textDim, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((a, i) => {
                const activeProjects = projects.filter(p => p.status === "active");
                const total = a.projects.filter(ap => activeProjects.some(p => p.id === ap.id)).length;
                const utilPct = Math.min(100, total * 35);
                return (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: "8px 10px", color: T.text, fontWeight: 500 }}>{a.name}</td>
                    {activeProjects.map(p => {
                      const assigned = a.projects.find(ap => ap.id === p.id);
                      return (
                        <td key={p.id} style={{ padding: "4px 6px", textAlign: "center" }}>
                          {assigned ? (
                            <div style={{ width: 28, height: 28, borderRadius: 6, background: T.accent + Math.round(0.15 + 0.85 * (1 / total)).toString(16).padStart(2, "0"), display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}>
                              <span style={{ fontSize: 9, color: T.text }}>✓</span>
                            </div>
                          ) : <span style={{ color: T.textDim }}>—</span>}
                        </td>
                      );
                    })}
                    <td style={{ padding: "8px 10px", textAlign: "center" }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: utilPct > 80 ? T.danger : utilPct > 50 ? (T.warn || T.accent) : T.green }}>{utilPct}%</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    )},
  ];

  return <DraggableGrid widgets={widgets} storageKey="dev-team-grid" locked gap={24} />;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TAB 4: DATA ROOM
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function DataRoomTab({ projects, activity }) {
  const [filterProject, setFilterProject] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [selectedFile, setSelectedFile] = useState(null);

  const allFiles = useMemo(() => {
    const files = [];
    for (const p of projects) {
      for (const f of (p.files || [])) {
        files.push({ ...f, projectId: p.id, projectName: p.name });
      }
    }
    return files.sort((a, b) => b.uploadDate.localeCompare(a.uploadDate));
  }, [projects]);

  const filtered = allFiles.filter(f => {
    if (filterProject !== "all" && f.projectId !== filterProject) return false;
    if (filterCategory !== "all" && f.category !== filterCategory) return false;
    return true;
  });

  const filteredActivity = filterProject === "all" ? activity : activity.filter(a => a.projectId === filterProject);

  const widgets = [
    { id: "dr-files", label: "File Browser", render: () => (
      <Card title="Data Room Files" titleColor={T.green} action={
        <div style={{ display: "flex", gap: 8 }}>
          <select value={filterProject} onChange={e => setFilterProject(e.target.value)}
            style={{ background: T.bg0, border: `1px solid ${T.border}`, borderRadius: 6, padding: "4px 8px", color: T.text, fontSize: 11, fontFamily: "inherit" }}>
            <option value="all">All Projects</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
            style={{ background: T.bg0, border: `1px solid ${T.border}`, borderRadius: 6, padding: "4px 8px", color: T.text, fontSize: 11, fontFamily: "inherit" }}>
            <option value="all">All Categories</option>
            {FILE_CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
        </div>
      }>
        <div style={{ display: "flex", gap: 16 }}>
          <div style={{ flex: 1 }}>
            {filtered.length === 0 ? (
              <div style={{ padding: 20, textAlign: "center", color: T.textDim, fontSize: 12 }}>No files found</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {filtered.map(f => {
                  const cat = FILE_CATEGORIES.find(c => c.key === f.category);
                  return (
                    <div key={f.id} onClick={() => setSelectedFile(f)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, cursor: "pointer", background: selectedFile?.id === f.id ? T.accentDim : "transparent", border: `1px solid ${selectedFile?.id === f.id ? T.accent : "transparent"}`, transition: "all .1s" }}
                      onMouseEnter={e => { if (selectedFile?.id !== f.id) e.currentTarget.style.background = T.bg3; }}
                      onMouseLeave={e => { if (selectedFile?.id !== f.id) e.currentTarget.style.background = "transparent"; }}>
                      <span style={{ fontSize: 16, width: 24, textAlign: "center", color: cat?.color || T.textMid }}>{cat?.icon || "◻"}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, color: T.text, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{f.name}</div>
                        <div style={{ fontSize: 10, color: T.textDim }}>{f.projectName} · {f.uploadDate} · {f.size}</div>
                      </div>
                      <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 10, background: (cat?.color || T.textMid) + "20", color: cat?.color || T.textMid }}>{cat?.label || f.category}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          {/* File detail panel */}
          {selectedFile && (
            <div style={{ width: 260, flexShrink: 0, background: T.bg0, borderRadius: 10, padding: 16, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 4, wordBreak: "break-all" }}>{selectedFile.name}</div>
              <div style={{ fontSize: 11, color: T.textMid, marginBottom: 12 }}>{selectedFile.projectName}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  { l: "Category", v: FILE_CATEGORIES.find(c => c.key === selectedFile.category)?.label || selectedFile.category },
                  { l: "Uploaded", v: selectedFile.uploadDate },
                  { l: "Size", v: selectedFile.size },
                  { l: "Uploaded By", v: selectedFile.uploadedBy },
                ].map(r => (
                  <div key={r.l} style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                    <span style={{ color: T.textDim }}>{r.l}</span>
                    <span style={{ color: T.text, fontWeight: 500 }}>{r.v}</span>
                  </div>
                ))}
              </div>
              {selectedFile.notes && (
                <div style={{ marginTop: 10, fontSize: 11, color: T.textMid, background: T.bg1, borderRadius: 6, padding: 8, lineHeight: 1.4 }}>
                  <div style={{ fontSize: 10, color: T.textDim, fontWeight: 600, marginBottom: 2 }}>Notes</div>
                  {selectedFile.notes}
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    )},
    { id: "dr-activity", label: "Recent Activity", render: () => (
      <Card title="Recent Activity" titleColor={T.teal}>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {filteredActivity.slice(0, 12).map((a, i) => {
            const p = projects.find(pr => pr.id === a.projectId);
            return (
              <div key={a.id} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: i < filteredActivity.length - 1 ? `1px solid ${T.border}` : "none" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.accent, marginTop: 6, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 12, color: T.text }}><strong>{a.action}</strong> — {a.detail}</div>
                  <div style={{ fontSize: 10, color: T.textDim, marginTop: 2 }}>{p?.name} · {a.person} · {a.date}</div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    )},
  ];

  return <DraggableGrid widgets={widgets} storageKey="dev-dataroom-grid" locked gap={24} />;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DOWNSTREAM CONNECTIONS BAR
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function DownstreamBar({ selectedProject, onNavigate }) {
  const p = selectedProject;
  const getStatus = (mod) => {
    if (!p) return false;
    if (mod.key === "ops-projects") return p.stage === "epc" || p.stage === "construction";
    if (mod.key === "ops-plant") return p.stage === "commissioning";
    if (mod.key === "finance") return (p.budget?.estimated || 0) > 0;
    if (mod.key === "sitemap") return !!p.location?.name;
    if (mod.key === "risk") return (p.team?.length || 0) > 0;
    return false;
  };

  return (
    <div style={{ marginTop: 24, background: T.bg1, borderRadius: 10, border: `1px solid ${T.border}`, padding: "14px 20px" }}>
      <div style={{ fontSize: 11, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600, marginBottom: 10 }}>Downstream Connections</div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {DOWNSTREAM_MODULES.map(mod => {
          const active = getStatus(mod);
          return (
            <div key={mod.key} onClick={() => onNavigate(mod.key)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 8, background: active ? T.green + "10" : T.bg0, border: `1px solid ${active ? T.green + "40" : T.border}`, cursor: "pointer", transition: "all .15s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = T.accent}
              onMouseLeave={e => e.currentTarget.style.borderColor = active ? T.green + "40" : T.border}>
              <EngineLight on={active} color={active ? T.green : T.textDim} />
              <div>
                <div style={{ fontSize: 12, color: T.text, fontWeight: 500 }}>{mod.label}</div>
                <div style={{ fontSize: 10, color: T.textDim }}>{mod.trigger}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
