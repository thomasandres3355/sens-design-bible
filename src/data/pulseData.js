import { T } from "./theme";

// ═══════════════════════════════════════════════════════════════════
//  WEEKLY PULSE — Executive Task Communication Channel
//  Short-cycle (24h) tasks, weekly commitments, and daily standups
//  All tasks should be achievable within the week — not multi-month projects
// ═══════════════════════════════════════════════════════════════════

export const PULSE_EXECS = [
  { key: "CEO", name: "Thomas Rivera", color: T.accent, initials: "TR" },
  { key: "COO", name: "Sarah Mitchell", color: T.green, initials: "SM" },
  { key: "VP Engineering", name: "Lena Torres", color: T.green, initials: "LT" },
  { key: "VP Operations", name: "Marcus Webb", color: T.purple, initials: "MW" },
  { key: "VP Finance", name: "Diane Chen", color: T.blue, initials: "DC" },
  { key: "VP Strategy", name: "Omar Hassan", color: T.blue, initials: "OH" },
  { key: "VP People", name: "Amy Rodriguez", color: T.teal, initials: "AR" },
  { key: "VP Risk", name: "Rachel Kim", color: T.purple, initials: "RK" },
];

export const getExecInfo = (key) => PULSE_EXECS.find(e => e.key === key) || { key, name: key, color: T.textDim, initials: "??" };


// ═══════════════════════════════════════════════════════════════════
//  WEEKLY PLANS — What each exec commits to completing this week
//  Posted Monday morning, updated as tasks complete through the week
// ═══════════════════════════════════════════════════════════════════

export const weeklyPlans = [
  // ─── Week of Feb 24, 2026 ───────────────────────────────────────

  // CEO
  {
    id: "wp-ceo-0224", executive: "CEO", weekOf: "2026-02-24",
    postedAt: "2026-02-24T08:15:00Z",
    tasks: [
      { id: "wt-001", task: "Call Meridian Capital re: due diligence status", objectiveTag: "obj-series-c", status: "done", completedDate: "2026-02-24", source: "meeting" },
      { id: "wt-002", task: "Review updated investor deck with Q4 actuals", objectiveTag: "obj-series-c", status: "done", completedDate: "2026-02-24", source: "meeting" },
      { id: "wt-003", task: "Approve term sheet redlines from legal", objectiveTag: "obj-series-c", status: "planned", completedDate: null, source: "manual" },
      { id: "wt-004", task: "Prep talking points for Friday board briefing", objectiveTag: "obj-series-c", status: "planned", completedDate: null, source: "meeting" },
      { id: "wt-005", task: "Review Baton Rouge recovery plan from COO", objectiveTag: "obj-ops-excellence", status: "done", completedDate: "2026-02-25", source: "manual" },
      { id: "wt-006", task: "Approve carbon black pricing lock-in recommendation", objectiveTag: "obj-ops-excellence", status: "planned", completedDate: null, source: "meeting" },
      { id: "wt-007", task: "Review WSP pre-FEED milestone report", objectiveTag: "obj-growth-pipeline", status: "planned", completedDate: null, source: "action-item" },
    ],
  },

  // COO
  {
    id: "wp-coo-0224", executive: "COO", weekOf: "2026-02-24",
    postedAt: "2026-02-24T07:45:00Z",
    tasks: [
      { id: "wt-010", task: "Approve Baton Rouge turnaround scope for Mar 15", objectiveTag: "obj-ops-excellence", status: "done", completedDate: "2026-02-24", source: "meeting" },
      { id: "wt-011", task: "Review Columbus OH feedstock alternate supplier proposal", objectiveTag: "obj-ops-excellence", status: "done", completedDate: "2026-02-24", source: "meeting" },
      { id: "wt-012", task: "Sign off on Tucson benchmark operating procedures", objectiveTag: "obj-ops-excellence", status: "planned", completedDate: null, source: "manual" },
      { id: "wt-013", task: "Review Portland OR schedule recovery plan from Brown & Root", objectiveTag: "obj-growth-pipeline", status: "planned", completedDate: null, source: "action-item" },
      { id: "wt-014", task: "Prepare operational metrics summary for investor deck", objectiveTag: "obj-series-c", status: "planned", completedDate: null, source: "meeting" },
      { id: "wt-015", task: "Review safety incident report from Richmond", objectiveTag: null, status: "done", completedDate: "2026-02-25", source: "manual" },
    ],
  },

  // VP Engineering
  {
    id: "wp-vpeng-0224", executive: "VP Engineering", weekOf: "2026-02-24",
    postedAt: "2026-02-24T08:00:00Z",
    tasks: [
      { id: "wt-030", task: "Finalize Series C reactor design specs for investor deck", objectiveTag: "obj-series-c", status: "planned", completedDate: null, source: "meeting" },
      { id: "wt-031", task: "Review TiPs Series B performance data from Tucson", objectiveTag: "obj-ops-excellence", status: "done", completedDate: "2026-02-25", source: "manual" },
      { id: "wt-032", task: "Review WSP pre-FEED engineering cost estimates", objectiveTag: "obj-growth-pipeline", status: "planned", completedDate: null, source: "action-item" },
      { id: "wt-033", task: "Sign off on Noble B reactor vessel QC report", objectiveTag: "obj-growth-pipeline", status: "planned", completedDate: null, source: "meeting" },
      { id: "wt-034", task: "Approve N330 grade optimization parameters for Baton Rouge", objectiveTag: "obj-ops-excellence", status: "planned", completedDate: null, source: "manual" },
    ],
  },

  // VP Operations
  {
    id: "wp-vpops-0224", executive: "VP Operations", weekOf: "2026-02-24",
    postedAt: "2026-02-24T07:30:00Z",
    tasks: [
      { id: "wt-040", task: "Approve Baton Rouge shift rotation optimization plan", objectiveTag: "obj-ops-excellence", status: "done", completedDate: "2026-02-24", source: "meeting" },
      { id: "wt-041", task: "Review Columbus OH ramp-up schedule against capacity targets", objectiveTag: "obj-ops-excellence", status: "done", completedDate: "2026-02-25", source: "meeting" },
      { id: "wt-042", task: "Sign off on Tucson SOP revision for pyrolysis zone 3", objectiveTag: "obj-ops-excellence", status: "planned", completedDate: null, source: "manual" },
      { id: "wt-043", task: "Compile 90-day uptime trend data for investor package", objectiveTag: "obj-series-c", status: "planned", completedDate: null, source: "action-item" },
      { id: "wt-044", task: "Confirm commissioning team assignments for Noble B", objectiveTag: "obj-growth-pipeline", status: "planned", completedDate: null, source: "meeting" },
    ],
  },

  // VP Finance
  {
    id: "wp-vpfin-0224", executive: "VP Finance", weekOf: "2026-02-24",
    postedAt: "2026-02-24T08:20:00Z",
    tasks: [
      { id: "wt-050", task: "Prepare data room financial model sensitivity analysis", objectiveTag: "obj-series-c", status: "done", completedDate: "2026-02-24", source: "meeting" },
      { id: "wt-051", task: "Complete site-level P&L variance analysis for Feb", objectiveTag: "obj-ops-excellence", status: "planned", completedDate: null, source: "meeting" },
      { id: "wt-052", task: "Update Noble B capex forecast with latest actuals", objectiveTag: "obj-growth-pipeline", status: "planned", completedDate: null, source: "manual" },
      { id: "wt-053", task: "Approve monthly AP batch for vendor payments", objectiveTag: null, status: "done", completedDate: "2026-02-25", source: "manual" },
    ],
  },

  // VP Strategy
  {
    id: "wp-vpstrat-0224", executive: "VP Strategy", weekOf: "2026-02-24",
    postedAt: "2026-02-24T09:00:00Z",
    tasks: [
      { id: "wt-060", task: "Update investor pipeline CRM with latest meeting notes", objectiveTag: "obj-series-c", status: "done", completedDate: "2026-02-24", source: "meeting" },
      { id: "wt-061", task: "Prepare market sizing analysis for board deck", objectiveTag: "obj-series-c", status: "planned", completedDate: null, source: "meeting" },
      { id: "wt-062", task: "Draft competitive positioning slide for investor meetings", objectiveTag: "obj-series-c", status: "planned", completedDate: null, source: "manual" },
      { id: "wt-063", task: "Review customer diversification strategy progress", objectiveTag: "obj-ops-excellence", status: "planned", completedDate: null, source: "action-item" },
      { id: "wt-064", task: "Assess state regulatory landscape for coal GA project", objectiveTag: "obj-growth-pipeline", status: "planned", completedDate: null, source: "meeting" },
    ],
  },

  // VP People
  {
    id: "wp-vppeople-0224", executive: "VP People", weekOf: "2026-02-24",
    postedAt: "2026-02-24T08:45:00Z",
    tasks: [
      { id: "wt-070", task: "Prepare org chart and leadership bios for data room", objectiveTag: "obj-series-c", status: "planned", completedDate: null, source: "meeting" },
      { id: "wt-071", task: "Review staffing plan for Columbus OH ramp-up", objectiveTag: "obj-ops-excellence", status: "done", completedDate: "2026-02-24", source: "meeting" },
      { id: "wt-072", task: "Draft hiring plan for Noble B commissioning team", objectiveTag: "obj-growth-pipeline", status: "planned", completedDate: null, source: "manual" },
      { id: "wt-073", task: "Finalize Q1 performance review process rollout", objectiveTag: null, status: "done", completedDate: "2026-02-25", source: "manual" },
    ],
  },

  // VP Risk
  {
    id: "wp-vprisk-0224", executive: "VP Risk", weekOf: "2026-02-24",
    postedAt: "2026-02-24T07:50:00Z",
    tasks: [
      { id: "wt-080", task: "Prepare ESG metrics summary for investor package", objectiveTag: "obj-series-c", status: "planned", completedDate: null, source: "meeting" },
      { id: "wt-081", task: "Review Baton Rouge incident investigation report", objectiveTag: "obj-ops-excellence", status: "done", completedDate: "2026-02-24", source: "manual" },
      { id: "wt-082", task: "Approve updated emergency response plan for Richmond", objectiveTag: "obj-ops-excellence", status: "done", completedDate: "2026-02-25", source: "meeting" },
      { id: "wt-083", task: "Complete environmental impact assessment for Coal GA", objectiveTag: "obj-growth-pipeline", status: "planned", completedDate: null, source: "meeting" },
      { id: "wt-084", task: "Submit monthly OSHA compliance report", objectiveTag: null, status: "done", completedDate: "2026-02-25", source: "manual" },
    ],
  },

  // ─── Week of Feb 17, 2026 (last week — for comparison) ──────────

  {
    id: "wp-ceo-0217", executive: "CEO", weekOf: "2026-02-17",
    postedAt: "2026-02-17T08:10:00Z",
    tasks: [
      { id: "wt-100", task: "Approve data room refresh for Series C", objectiveTag: "obj-series-c", status: "done", completedDate: "2026-02-17", source: "meeting" },
      { id: "wt-101", task: "Sign customer diversification strategy memo", objectiveTag: "obj-ops-excellence", status: "done", completedDate: "2026-02-18", source: "manual" },
      { id: "wt-102", task: "Confirm coal project board presentation date", objectiveTag: "obj-growth-pipeline", status: "done", completedDate: "2026-02-17", source: "manual" },
      { id: "wt-103", task: "Approve Platform v4 rollout plan", objectiveTag: null, status: "done", completedDate: "2026-02-19", source: "manual" },
      { id: "wt-104", task: "Review Q1 board agenda draft", objectiveTag: null, status: "partial", completedDate: null, source: "meeting" },
    ],
  },
  {
    id: "wp-coo-0217", executive: "COO", weekOf: "2026-02-17",
    postedAt: "2026-02-17T07:40:00Z",
    tasks: [
      { id: "wt-110", task: "Approve compressor PO for Baton Rouge", objectiveTag: "obj-ops-excellence", status: "done", completedDate: "2026-02-18", source: "meeting" },
      { id: "wt-111", task: "Sign off on Portland reactor vessel dual-sourcing", objectiveTag: "obj-growth-pipeline", status: "done", completedDate: "2026-02-18", source: "meeting" },
      { id: "wt-112", task: "Review Veriforce compliance report", objectiveTag: null, status: "done", completedDate: "2026-02-17", source: "manual" },
      { id: "wt-113", task: "Finalize Noble turnaround contractor headcount", objectiveTag: "obj-growth-pipeline", status: "done", completedDate: "2026-02-18", source: "meeting" },
      { id: "wt-114", task: "Confirm quality spec alignment with customer contracts", objectiveTag: "obj-ops-excellence", status: "done", completedDate: "2026-02-17", source: "manual" },
    ],
  },
];


// ═══════════════════════════════════════════════════════════════════
//  DAILY STANDUP POSTS — "What I did yesterday, what I'm doing today"
//  Quick, structured posts. No commentary — just tasks & status.
// ═══════════════════════════════════════════════════════════════════

export const dailyPosts = [
  // ─── Tuesday Feb 25 (today) ────────────────────────────────

  {
    id: "dp-ceo-0225", executive: "CEO", date: "2026-02-25",
    postedAt: "2026-02-25T08:22:00Z",
    yesterdayUpdate: {
      planned: 3, completed: 3,
      tasks: [
        { task: "Call Meridian Capital re: due diligence status", status: "done", objectiveTag: "obj-series-c" },
        { task: "Review updated investor deck with Q4 actuals", status: "done", objectiveTag: "obj-series-c" },
        { task: "Review Baton Rouge recovery plan from COO", status: "done", objectiveTag: "obj-ops-excellence" },
      ],
    },
    todayPlan: [
      { task: "Approve term sheet redlines from legal", objectiveTag: "obj-series-c", source: "manual" },
      { task: "Approve carbon black pricing lock-in recommendation", objectiveTag: "obj-ops-excellence", source: "meeting" },
      { task: "Sign off on VP People's hiring plan", objectiveTag: null, source: "manual" },
    ],
  },
  {
    id: "dp-coo-0225", executive: "COO", date: "2026-02-25",
    postedAt: "2026-02-25T07:50:00Z",
    yesterdayUpdate: {
      planned: 3, completed: 2,
      tasks: [
        { task: "Approve Baton Rouge turnaround scope for Mar 15", status: "done", objectiveTag: "obj-ops-excellence" },
        { task: "Review Columbus OH feedstock alternate supplier proposal", status: "done", objectiveTag: "obj-ops-excellence" },
        { task: "Draft site visit agenda for March 5 investor tour", status: "partial", objectiveTag: "obj-series-c" },
      ],
    },
    todayPlan: [
      { task: "Review safety incident report from Richmond", objectiveTag: null, source: "manual" },
      { task: "Sign off on Tucson benchmark operating procedures", objectiveTag: "obj-ops-excellence", source: "manual" },
      { task: "Review work order backlog reduction plan", objectiveTag: "obj-ops-excellence", source: "meeting" },
      { task: "Finalize site visit agenda for March 5 investor tour", objectiveTag: "obj-series-c", source: "manual" },
    ],
  },
  {
    id: "dp-vpeng-0225", executive: "VP Engineering", date: "2026-02-25",
    postedAt: "2026-02-25T08:05:00Z",
    yesterdayUpdate: {
      planned: 2, completed: 2,
      tasks: [
        { task: "Review TiPs Series B performance data from Tucson", status: "done", objectiveTag: "obj-ops-excellence" },
        { task: "Review patent filing for thermal cracking improvement", status: "done", objectiveTag: null },
      ],
    },
    todayPlan: [
      { task: "Finalize Series C reactor design specs for investor deck", objectiveTag: "obj-series-c", source: "meeting" },
      { task: "Review WSP pre-FEED engineering cost estimates", objectiveTag: "obj-growth-pipeline", source: "action-item" },
    ],
  },
  {
    id: "dp-vpops-0225", executive: "VP Operations", date: "2026-02-25",
    postedAt: "2026-02-25T07:35:00Z",
    yesterdayUpdate: {
      planned: 3, completed: 2,
      tasks: [
        { task: "Approve Baton Rouge shift rotation optimization plan", status: "done", objectiveTag: "obj-ops-excellence" },
        { task: "Review Columbus OH ramp-up schedule against capacity targets", status: "done", objectiveTag: "obj-ops-excellence" },
        { task: "Approve overtime authorization for Richmond site", status: "partial", objectiveTag: null },
      ],
    },
    todayPlan: [
      { task: "Finalize overtime authorization for Richmond site", objectiveTag: null, source: "manual" },
      { task: "Sign off on Tucson SOP revision for pyrolysis zone 3", objectiveTag: "obj-ops-excellence", source: "manual" },
      { task: "Compile 90-day uptime trend data for investor package", objectiveTag: "obj-series-c", source: "action-item" },
    ],
  },
  {
    id: "dp-vpfin-0225", executive: "VP Finance", date: "2026-02-25",
    postedAt: "2026-02-25T08:25:00Z",
    yesterdayUpdate: {
      planned: 2, completed: 2,
      tasks: [
        { task: "Prepare data room financial model sensitivity analysis", status: "done", objectiveTag: "obj-series-c" },
        { task: "Review investor Q&A financial talking points", status: "done", objectiveTag: "obj-series-c" },
      ],
    },
    todayPlan: [
      { task: "Approve monthly AP batch for vendor payments", objectiveTag: null, source: "manual" },
      { task: "Complete site-level P&L variance analysis for Feb", objectiveTag: "obj-ops-excellence", source: "meeting" },
    ],
  },
  {
    id: "dp-vpstrat-0225", executive: "VP Strategy", date: "2026-02-25",
    postedAt: "2026-02-25T09:05:00Z",
    yesterdayUpdate: {
      planned: 2, completed: 2,
      tasks: [
        { task: "Update investor pipeline CRM with latest meeting notes", status: "done", objectiveTag: "obj-series-c" },
        { task: "Review customer diversification strategy progress", status: "done", objectiveTag: "obj-ops-excellence" },
      ],
    },
    todayPlan: [
      { task: "Prepare market sizing analysis for board deck", objectiveTag: "obj-series-c", source: "meeting" },
      { task: "Assess state regulatory landscape for coal GA project", objectiveTag: "obj-growth-pipeline", source: "meeting" },
    ],
  },
  {
    id: "dp-vppeople-0225", executive: "VP People", date: "2026-02-25",
    postedAt: "2026-02-25T08:48:00Z",
    yesterdayUpdate: {
      planned: 2, completed: 1,
      tasks: [
        { task: "Review staffing plan for Columbus OH ramp-up", status: "done", objectiveTag: "obj-ops-excellence" },
        { task: "Prepare org chart and leadership bios for data room", status: "partial", objectiveTag: "obj-series-c" },
      ],
    },
    todayPlan: [
      { task: "Finalize Q1 performance review process rollout", objectiveTag: null, source: "manual" },
      { task: "Continue org chart and leadership bios for data room", objectiveTag: "obj-series-c", source: "meeting" },
      { task: "Review 8 open positions priority ranking", objectiveTag: null, source: "manual" },
    ],
  },
  {
    id: "dp-vprisk-0225", executive: "VP Risk", date: "2026-02-25",
    postedAt: "2026-02-25T07:55:00Z",
    yesterdayUpdate: {
      planned: 2, completed: 2,
      tasks: [
        { task: "Review Baton Rouge incident investigation report", status: "done", objectiveTag: "obj-ops-excellence" },
        { task: "Approve updated emergency response plan for Richmond", status: "done", objectiveTag: "obj-ops-excellence" },
      ],
    },
    todayPlan: [
      { task: "Submit monthly OSHA compliance report", objectiveTag: null, source: "manual" },
      { task: "Review environmental permit renewal applications (Noble + Richmond)", objectiveTag: "obj-ops-excellence", source: "meeting" },
      { task: "Prepare ESG metrics summary for investor package", objectiveTag: "obj-series-c", source: "meeting" },
    ],
  },

  // ─── Monday Feb 24 ─────────────────────────────────────────

  {
    id: "dp-ceo-0224", executive: "CEO", date: "2026-02-24",
    postedAt: "2026-02-24T08:18:00Z",
    yesterdayUpdate: {
      planned: 0, completed: 0,
      tasks: [],
    },
    todayPlan: [
      { task: "Call Meridian Capital re: due diligence status", objectiveTag: "obj-series-c", source: "meeting" },
      { task: "Review updated investor deck with Q4 actuals", objectiveTag: "obj-series-c", source: "meeting" },
      { task: "Review Baton Rouge recovery plan from COO", objectiveTag: "obj-ops-excellence", source: "manual" },
    ],
  },
  {
    id: "dp-coo-0224", executive: "COO", date: "2026-02-24",
    postedAt: "2026-02-24T07:48:00Z",
    yesterdayUpdate: {
      planned: 0, completed: 0,
      tasks: [],
    },
    todayPlan: [
      { task: "Approve Baton Rouge turnaround scope for Mar 15", objectiveTag: "obj-ops-excellence", source: "meeting" },
      { task: "Review Columbus OH feedstock alternate supplier proposal", objectiveTag: "obj-ops-excellence", source: "meeting" },
      { task: "Draft site visit agenda for March 5 investor tour", objectiveTag: "obj-series-c", source: "manual" },
    ],
  },
];


// ═══════════════════════════════════════════════════════════════════
//  COMPUTED PULSE METRICS
// ═══════════════════════════════════════════════════════════════════

// Date helpers
const toDate = (s) => new Date(s + "T12:00:00");
const toStr = (d) => d.toISOString().split("T")[0];
const addDays = (s, n) => { const d = toDate(s); d.setDate(d.getDate() + n); return toStr(d); };
const getMonday = (dateStr) => {
  const d = toDate(dateStr);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return toStr(d);
};

export const getPulseMetrics = (simDate = "2026-02-25") => {
  const thisWeekMon = getMonday(simDate);
  const lastWeekMon = addDays(thisWeekMon, -7);

  const thisWeekPlans = weeklyPlans.filter(p => p.weekOf === thisWeekMon);
  const lastWeekPlans = weeklyPlans.filter(p => p.weekOf === lastWeekMon);
  const todayPosts = dailyPosts.filter(p => p.date === simDate);

  // Weekly alignment
  const allThisWeekTasks = thisWeekPlans.flatMap(p => p.tasks);
  const aligned = allThisWeekTasks.filter(t => t.objectiveTag !== null);
  const alignmentPct = allThisWeekTasks.length > 0 ? Math.round((aligned.length / allThisWeekTasks.length) * 100) : 0;

  // Last week completion rate
  const allLastWeekTasks = lastWeekPlans.flatMap(p => p.tasks);
  const lastWeekDone = allLastWeekTasks.filter(t => t.status === "done");
  const lastWeekCompletionPct = allLastWeekTasks.length > 0 ? Math.round((lastWeekDone.length / allLastWeekTasks.length) * 100) : 0;

  // This week completion so far
  const thisWeekDone = allThisWeekTasks.filter(t => t.status === "done");
  const thisWeekCompletionPct = allThisWeekTasks.length > 0 ? Math.round((thisWeekDone.length / allThisWeekTasks.length) * 100) : 0;

  // Posts today
  const totalExecs = PULSE_EXECS.length;
  const postedToday = todayPosts.length;

  // Overdue from last week (planned but not done/partial)
  const lastWeekCarryover = allLastWeekTasks.filter(t => t.status === "planned" || t.status === "partial");

  // Per-objective breakdown for this week
  const byObjective = [
    { id: "obj-series-c", label: "Series C", short: "Series C", color: "#5B8AF0" },
    { id: "obj-ops-excellence", label: "Ops Excellence", short: "Ops Excl", color: "#4CAF50" },
    { id: "obj-growth-pipeline", label: "Growth Pipeline", short: "Growth", color: "#AB68D6" },
  ].map(obj => {
    const tasks = allThisWeekTasks.filter(t => t.objectiveTag === obj.id);
    const done = tasks.filter(t => t.status === "done");
    return {
      ...obj,
      total: tasks.length,
      done: done.length,
      pct: tasks.length > 0 ? Math.round((done.length / tasks.length) * 100) : 0,
    };
  });

  return {
    alignmentPct,
    lastWeekCompletionPct,
    thisWeekCompletionPct,
    thisWeekDone: thisWeekDone.length,
    thisWeekTotal: allThisWeekTasks.length,
    postedToday,
    totalExecs,
    lastWeekCarryover: lastWeekCarryover.length,
    byObjective,
    thisWeekPlans,
    lastWeekPlans,
    todayPosts,
  };
};
