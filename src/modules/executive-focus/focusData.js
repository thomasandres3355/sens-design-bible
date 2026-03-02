import { T } from "@core/theme/theme";

// ═══════════════════════════════════════════════════════════════════
//  EXECUTIVE FOCUS TRACKER — Data Layer
//  Bridges company objectives ↔ meeting action items
//  Short-cycle tasks (24hr–7 day) tagged to the 3 company objectives
// ═══════════════════════════════════════════════════════════════════

// ─── Date helpers ────────────────────────────────────────────────
const toDate = (s) => new Date(s + "T12:00:00");
const toStr = (d) => d.toISOString().split("T")[0];
const addDays = (s, n) => { const d = toDate(s); d.setDate(d.getDate() + n); return toStr(d); };

// Get Monday of the week containing dateStr
const getMonday = (dateStr) => {
  const d = toDate(dateStr);
  const day = d.getDay(); // 0=Sun, 1=Mon...
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return toStr(d);
};

const fmtShort = (dateStr) => toDate(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });

// ─── The 3 Company Objective Tags ────────────────────────────────
// These mirror COMPANY_OBJECTIVES from DashboardView.jsx

export const OBJECTIVE_TAGS = [
  { id: "obj-series-c", label: "Series C", short: "Series C", color: T.blue, icon: "M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" },
  { id: "obj-ops-excellence", label: "Operational Excellence", short: "Ops Excellence", color: T.green, icon: "M22 11.08V12a10 10 0 1 1-5.93-9.14 M22 4L12 14.01l-3-3" },
  { id: "obj-growth-pipeline", label: "Growth Pipeline", short: "Growth", color: T.purple, icon: "M23 6l-9.5 9.5-5-5L1 18 M17 6h6v6" },
];

export const getObjectiveTag = (id) => OBJECTIVE_TAGS.find(t => t.id === id) || null;

// ─── Executive Task Registry ─────────────────────────────────────
// Short-cycle tasks assigned to C-suite executives
// objectiveTag: one of the 3 objective IDs, or null for unaligned work
// cycle: "24h" | "3d" | "1w" — intended completion window

export const executiveTasks = [
  // ═══ CEO Tasks ═══
  // Series C aligned
  { id: "ft-001", task: "Call Meridian Capital re: due diligence status", executive: "CEO", objectiveTag: "obj-series-c", due: "2026-02-25", status: "open", priority: "high", cycle: "24h", source: "Exec Standup — Feb 24" },
  { id: "ft-002", task: "Review updated investor deck with Q4 actuals", executive: "CEO", objectiveTag: "obj-series-c", due: "2026-02-26", status: "open", priority: "high", cycle: "24h", source: "Exec Standup — Feb 24" },
  { id: "ft-003", task: "Approve term sheet redlines from legal", executive: "CEO", objectiveTag: "obj-series-c", due: "2026-02-27", status: "open", priority: "high", cycle: "3d", source: "IR Prep — Feb 21" },
  { id: "ft-004", task: "Prep talking points for Friday board briefing", executive: "CEO", objectiveTag: "obj-series-c", due: "2026-02-28", status: "open", priority: "medium", cycle: "3d", source: "Exec Standup — Feb 24" },
  // Ops Excellence aligned
  { id: "ft-005", task: "Review Baton Rouge recovery plan from COO", executive: "CEO", objectiveTag: "obj-ops-excellence", due: "2026-02-26", status: "open", priority: "medium", cycle: "24h", source: "Exec Standup — Feb 24" },
  { id: "ft-006", task: "Approve carbon black pricing lock-in recommendation", executive: "CEO", objectiveTag: "obj-ops-excellence", due: "2026-02-27", status: "open", priority: "medium", cycle: "3d", source: "Finance Committee — Feb 20" },
  // Growth Pipeline aligned
  { id: "ft-007", task: "Review WSP pre-FEED milestone report", executive: "CEO", objectiveTag: "obj-growth-pipeline", due: "2026-02-28", status: "open", priority: "medium", cycle: "1w", source: "Engineering Sync — Feb 19" },
  // Unaligned (necessary but not objective-tied)
  { id: "ft-008", task: "Sign off on VP People's hiring plan", executive: "CEO", objectiveTag: null, due: "2026-02-25", status: "open", priority: "low", cycle: "24h", source: "1:1 with VP People — Feb 24" },
  { id: "ft-009", task: "Review Q1 board agenda draft", executive: "CEO", objectiveTag: null, due: "2026-02-28", status: "open", priority: "medium", cycle: "1w", source: "Board Prep — Feb 20" },
  // Completed
  { id: "ft-010", task: "Approve data room refresh for Series C", executive: "CEO", objectiveTag: "obj-series-c", due: "2026-02-22", status: "done", priority: "high", cycle: "24h", source: "IR Prep — Feb 21", completedDate: "2026-02-22", daysToClose: 1 },
  { id: "ft-011", task: "Sign customer diversification strategy memo", executive: "CEO", objectiveTag: "obj-ops-excellence", due: "2026-02-21", status: "done", priority: "medium", cycle: "3d", source: "Exec Standup — Feb 18", completedDate: "2026-02-21", daysToClose: 3 },
  { id: "ft-012", task: "Confirm coal project board presentation date", executive: "CEO", objectiveTag: "obj-growth-pipeline", due: "2026-02-20", status: "done", priority: "low", cycle: "24h", source: "Engineering Sync — Feb 19", completedDate: "2026-02-20", daysToClose: 1 },
  { id: "ft-013", task: "Approve Platform v4 rollout plan", executive: "CEO", objectiveTag: null, due: "2026-02-19", status: "done", priority: "medium", cycle: "3d", source: "Admin Review — Feb 17", completedDate: "2026-02-19", daysToClose: 2 },

  // ═══ COO Tasks ═══
  { id: "ft-020", task: "Prepare operational metrics summary for investor deck", executive: "COO", objectiveTag: "obj-series-c", due: "2026-02-26", status: "open", priority: "high", cycle: "24h", source: "Exec Standup — Feb 24" },
  { id: "ft-021", task: "Draft site visit agenda for March 5 investor tour", executive: "COO", objectiveTag: "obj-series-c", due: "2026-02-28", status: "open", priority: "medium", cycle: "3d", source: "IR Prep — Feb 21" },
  { id: "ft-022", task: "Approve Baton Rouge turnaround scope for Mar 15", executive: "COO", objectiveTag: "obj-ops-excellence", due: "2026-02-25", status: "open", priority: "high", cycle: "24h", source: "Maintenance Review — Feb 24" },
  { id: "ft-023", task: "Review Columbus OH feedstock alternate supplier proposal", executive: "COO", objectiveTag: "obj-ops-excellence", due: "2026-02-26", status: "open", priority: "high", cycle: "24h", source: "Exec Standup — Feb 24" },
  { id: "ft-024", task: "Sign off on Tucson benchmark operating procedures", executive: "COO", objectiveTag: "obj-ops-excellence", due: "2026-02-27", status: "open", priority: "medium", cycle: "3d", source: "Ops Review — Feb 21" },
  { id: "ft-025", task: "Review work order backlog reduction plan", executive: "COO", objectiveTag: "obj-ops-excellence", due: "2026-02-28", status: "open", priority: "medium", cycle: "1w", source: "Maintenance Review — Feb 24" },
  { id: "ft-026", task: "Review Portland OR schedule recovery plan from Brown & Root", executive: "COO", objectiveTag: "obj-growth-pipeline", due: "2026-02-26", status: "open", priority: "high", cycle: "24h", source: "Portland Review — Feb 24" },
  { id: "ft-027", task: "Approve Noble B Phase 2 commissioning checklist", executive: "COO", objectiveTag: "obj-growth-pipeline", due: "2026-02-28", status: "open", priority: "medium", cycle: "3d", source: "Engineering Sync — Feb 19" },
  { id: "ft-028", task: "Confirm contractor mobilization for Noble turnaround", executive: "COO", objectiveTag: "obj-growth-pipeline", due: "2026-03-01", status: "open", priority: "high", cycle: "1w", source: "Maintenance Review — Feb 24" },
  { id: "ft-029", task: "Review safety incident report from Richmond", executive: "COO", objectiveTag: null, due: "2026-02-25", status: "open", priority: "high", cycle: "24h", source: "HSE Escalation — Feb 24" },
  { id: "ft-030", task: "Approve compressor PO for Baton Rouge", executive: "COO", objectiveTag: "obj-ops-excellence", due: "2026-02-22", status: "done", priority: "high", cycle: "24h", source: "Exec Standup — Feb 18", completedDate: "2026-02-22", daysToClose: 1 },
  { id: "ft-031", task: "Sign off on Portland reactor vessel dual-sourcing", executive: "COO", objectiveTag: "obj-growth-pipeline", due: "2026-02-21", status: "done", priority: "high", cycle: "3d", source: "Portland Review — Feb 17", completedDate: "2026-02-21", daysToClose: 2 },
  { id: "ft-032", task: "Review Veriforce compliance report", executive: "COO", objectiveTag: null, due: "2026-02-20", status: "done", priority: "medium", cycle: "24h", source: "Process Review — Feb 19", completedDate: "2026-02-20", daysToClose: 1 },
  { id: "ft-033", task: "Finalize Noble turnaround contractor headcount", executive: "COO", objectiveTag: "obj-growth-pipeline", due: "2026-02-19", status: "done", priority: "high", cycle: "3d", source: "Maintenance Review — Feb 17", completedDate: "2026-02-18", daysToClose: 1 },
  { id: "ft-034", task: "Confirm quality spec alignment with customer contracts", executive: "COO", objectiveTag: "obj-ops-excellence", due: "2026-02-18", status: "done", priority: "medium", cycle: "3d", source: "Ops Review — Feb 14", completedDate: "2026-02-17", daysToClose: 3 },

  // ═══ VP Engineering Tasks ═══
  { id: "ft-060", task: "Finalize Series C reactor design specs for investor deck", executive: "VP Engineering", objectiveTag: "obj-series-c", due: "2026-02-26", status: "open", priority: "high", cycle: "24h", source: "IR Prep — Feb 21" },
  { id: "ft-061", task: "Prepare R&D roadmap slide for board presentation", executive: "VP Engineering", objectiveTag: "obj-series-c", due: "2026-02-28", status: "open", priority: "medium", cycle: "3d", source: "Board Prep — Feb 20" },
  { id: "ft-062", task: "Review TiPs Series B performance data from Tucson", executive: "VP Engineering", objectiveTag: "obj-ops-excellence", due: "2026-02-25", status: "open", priority: "high", cycle: "24h", source: "Engineering Sync — Feb 24" },
  { id: "ft-063", task: "Approve N330 grade optimization parameters for Baton Rouge", executive: "VP Engineering", objectiveTag: "obj-ops-excellence", due: "2026-02-27", status: "open", priority: "medium", cycle: "3d", source: "Quality Review — Feb 21" },
  { id: "ft-064", task: "Review WSP pre-FEED engineering cost estimates", executive: "VP Engineering", objectiveTag: "obj-growth-pipeline", due: "2026-02-26", status: "open", priority: "high", cycle: "24h", source: "Engineering Sync — Feb 24" },
  { id: "ft-065", task: "Sign off on Noble B reactor vessel QC report", executive: "VP Engineering", objectiveTag: "obj-growth-pipeline", due: "2026-02-27", status: "open", priority: "high", cycle: "3d", source: "Fabrication Review — Feb 24" },
  { id: "ft-066", task: "Approve coal gasification pilot test protocol", executive: "VP Engineering", objectiveTag: "obj-growth-pipeline", due: "2026-02-28", status: "open", priority: "medium", cycle: "3d", source: "R&D Meeting — Feb 19" },
  { id: "ft-067", task: "Review patent filing for thermal cracking improvement", executive: "VP Engineering", objectiveTag: null, due: "2026-02-26", status: "open", priority: "low", cycle: "3d", source: "IP Review — Feb 21" },
  { id: "ft-068", task: "Finalize Series C reactor fabrication drawings", executive: "VP Engineering", objectiveTag: "obj-series-c", due: "2026-02-21", status: "done", priority: "high", cycle: "3d", source: "Engineering Sync — Feb 19", completedDate: "2026-02-21", daysToClose: 2 },
  { id: "ft-069", task: "Approve TiPs Series A maintenance spec update", executive: "VP Engineering", objectiveTag: "obj-ops-excellence", due: "2026-02-20", status: "done", priority: "medium", cycle: "24h", source: "Maintenance Review — Feb 19", completedDate: "2026-02-20", daysToClose: 1 },
  { id: "ft-070", task: "Complete Portland OR reactor installation checklist", executive: "VP Engineering", objectiveTag: "obj-growth-pipeline", due: "2026-02-19", status: "done", priority: "high", cycle: "3d", source: "Portland Review — Feb 17", completedDate: "2026-02-18", daysToClose: 1 },

  // ═══ VP Operations Tasks ═══
  { id: "ft-080", task: "Compile 90-day uptime trend data for investor package", executive: "VP Operations", objectiveTag: "obj-series-c", due: "2026-02-26", status: "open", priority: "high", cycle: "24h", source: "IR Prep — Feb 24" },
  { id: "ft-081", task: "Approve Baton Rouge shift rotation optimization plan", executive: "VP Operations", objectiveTag: "obj-ops-excellence", due: "2026-02-25", status: "open", priority: "high", cycle: "24h", source: "Ops Review — Feb 24" },
  { id: "ft-082", task: "Review Columbus OH ramp-up schedule against capacity targets", executive: "VP Operations", objectiveTag: "obj-ops-excellence", due: "2026-02-26", status: "open", priority: "high", cycle: "24h", source: "Site Review — Feb 24" },
  { id: "ft-083", task: "Sign off on Tucson SOP revision for pyrolysis zone 3", executive: "VP Operations", objectiveTag: "obj-ops-excellence", due: "2026-02-27", status: "open", priority: "medium", cycle: "3d", source: "Process Review — Feb 21" },
  { id: "ft-084", task: "Review feedstock quality variance root cause analysis", executive: "VP Operations", objectiveTag: "obj-ops-excellence", due: "2026-02-28", status: "open", priority: "medium", cycle: "3d", source: "Quality Review — Feb 21" },
  { id: "ft-085", task: "Confirm commissioning team assignments for Noble B", executive: "VP Operations", objectiveTag: "obj-growth-pipeline", due: "2026-02-27", status: "open", priority: "high", cycle: "3d", source: "Construction Sync — Feb 24" },
  { id: "ft-086", task: "Approve overtime authorization for Richmond site", executive: "VP Operations", objectiveTag: null, due: "2026-02-25", status: "open", priority: "medium", cycle: "24h", source: "HR Escalation — Feb 24" },
  { id: "ft-087", task: "Finalize Baton Rouge feed blending protocol", executive: "VP Operations", objectiveTag: "obj-ops-excellence", due: "2026-02-21", status: "done", priority: "high", cycle: "3d", source: "Ops Review — Feb 19", completedDate: "2026-02-21", daysToClose: 2 },
  { id: "ft-088", task: "Review site-level KPI dashboard accuracy", executive: "VP Operations", objectiveTag: "obj-ops-excellence", due: "2026-02-20", status: "done", priority: "medium", cycle: "24h", source: "Admin Review — Feb 19", completedDate: "2026-02-20", daysToClose: 1 },
  { id: "ft-089", task: "Approve Noble turnaround contractor safety orientation", executive: "VP Operations", objectiveTag: "obj-growth-pipeline", due: "2026-02-19", status: "done", priority: "high", cycle: "24h", source: "HSE Review — Feb 18", completedDate: "2026-02-19", daysToClose: 1 },

  // ═══ VP Finance Tasks ═══
  { id: "ft-100", task: "Prepare data room financial model sensitivity analysis", executive: "VP Finance", objectiveTag: "obj-series-c", due: "2026-02-26", status: "open", priority: "high", cycle: "24h", source: "Finance Committee — Feb 24" },
  { id: "ft-101", task: "Review investor Q&A financial talking points", executive: "VP Finance", objectiveTag: "obj-series-c", due: "2026-02-27", status: "open", priority: "medium", cycle: "3d", source: "IR Prep — Feb 21" },
  { id: "ft-102", task: "Complete site-level P&L variance analysis for Feb", executive: "VP Finance", objectiveTag: "obj-ops-excellence", due: "2026-02-26", status: "open", priority: "high", cycle: "24h", source: "Finance Committee — Feb 24" },
  { id: "ft-103", task: "Review carbon black offtake pricing model update", executive: "VP Finance", objectiveTag: "obj-ops-excellence", due: "2026-02-27", status: "open", priority: "medium", cycle: "3d", source: "Pricing Review — Feb 21" },
  { id: "ft-104", task: "Update Noble B capex forecast with latest actuals", executive: "VP Finance", objectiveTag: "obj-growth-pipeline", due: "2026-02-26", status: "open", priority: "high", cycle: "24h", source: "Construction Sync — Feb 24" },
  { id: "ft-105", task: "Review insurance renewal premium comparison", executive: "VP Finance", objectiveTag: "obj-growth-pipeline", due: "2026-02-28", status: "open", priority: "medium", cycle: "3d", source: "Legal Review — Feb 24" },
  { id: "ft-106", task: "Approve monthly AP batch for vendor payments", executive: "VP Finance", objectiveTag: null, due: "2026-02-25", status: "open", priority: "high", cycle: "24h", source: "Accounts Payable — Feb 24" },
  { id: "ft-107", task: "Finalize Q4 revenue reconciliation by site", executive: "VP Finance", objectiveTag: "obj-ops-excellence", due: "2026-02-21", status: "done", priority: "high", cycle: "3d", source: "Finance Committee — Feb 19", completedDate: "2026-02-21", daysToClose: 2 },
  { id: "ft-108", task: "Submit data room financial package v2.1", executive: "VP Finance", objectiveTag: "obj-series-c", due: "2026-02-20", status: "done", priority: "high", cycle: "24h", source: "IR Prep — Feb 19", completedDate: "2026-02-20", daysToClose: 1 },
  { id: "ft-109", task: "Review Portland capex drawdown vs budget", executive: "VP Finance", objectiveTag: "obj-growth-pipeline", due: "2026-02-19", status: "done", priority: "medium", cycle: "3d", source: "Construction Sync — Feb 17", completedDate: "2026-02-18", daysToClose: 1 },

  // ═══ VP Strategy Tasks ═══
  { id: "ft-120", task: "Update investor pipeline CRM with latest meeting notes", executive: "VP Strategy", objectiveTag: "obj-series-c", due: "2026-02-25", status: "open", priority: "high", cycle: "24h", source: "IR Standup — Feb 24" },
  { id: "ft-121", task: "Prepare market sizing analysis for board deck", executive: "VP Strategy", objectiveTag: "obj-series-c", due: "2026-02-27", status: "open", priority: "high", cycle: "3d", source: "Board Prep — Feb 20" },
  { id: "ft-122", task: "Draft competitive positioning slide for investor meetings", executive: "VP Strategy", objectiveTag: "obj-series-c", due: "2026-02-28", status: "open", priority: "medium", cycle: "3d", source: "IR Prep — Feb 21" },
  { id: "ft-123", task: "Review customer diversification strategy progress", executive: "VP Strategy", objectiveTag: "obj-ops-excellence", due: "2026-02-26", status: "open", priority: "medium", cycle: "24h", source: "Marketing Review — Feb 24" },
  { id: "ft-124", task: "Assess state regulatory landscape for coal GA project", executive: "VP Strategy", objectiveTag: "obj-growth-pipeline", due: "2026-02-27", status: "open", priority: "high", cycle: "3d", source: "Strategy Session — Feb 21" },
  { id: "ft-125", task: "Review 5-year market forecast for carbon black demand", executive: "VP Strategy", objectiveTag: "obj-growth-pipeline", due: "2026-02-28", status: "open", priority: "medium", cycle: "1w", source: "Market Intelligence — Feb 19" },
  { id: "ft-126", task: "Prepare quarterly strategy update for leadership team", executive: "VP Strategy", objectiveTag: null, due: "2026-02-28", status: "open", priority: "low", cycle: "1w", source: "Admin — Feb 17" },
  { id: "ft-127", task: "Deliver competitor analysis for LD Carbon Series B", executive: "VP Strategy", objectiveTag: "obj-series-c", due: "2026-02-21", status: "done", priority: "high", cycle: "3d", source: "IR Prep — Feb 19", completedDate: "2026-02-21", daysToClose: 2 },
  { id: "ft-128", task: "Update TAM/SAM model with 2025 actuals", executive: "VP Strategy", objectiveTag: "obj-growth-pipeline", due: "2026-02-20", status: "done", priority: "medium", cycle: "3d", source: "Strategy Session — Feb 17", completedDate: "2026-02-19", daysToClose: 2 },
  { id: "ft-129", task: "Brief CEO on clean energy credit expansion in 3 states", executive: "VP Strategy", objectiveTag: "obj-growth-pipeline", due: "2026-02-18", status: "done", priority: "medium", cycle: "24h", source: "Market Intelligence — Feb 17", completedDate: "2026-02-18", daysToClose: 1 },

  // ═══ VP People Tasks ═══
  { id: "ft-140", task: "Prepare org chart and leadership bios for data room", executive: "VP People", objectiveTag: "obj-series-c", due: "2026-02-26", status: "open", priority: "high", cycle: "24h", source: "IR Prep — Feb 24" },
  { id: "ft-141", task: "Review staffing plan for Columbus OH ramp-up", executive: "VP People", objectiveTag: "obj-ops-excellence", due: "2026-02-26", status: "open", priority: "high", cycle: "24h", source: "Site Review — Feb 24" },
  { id: "ft-142", task: "Approve operator training certification schedule for Q2", executive: "VP People", objectiveTag: "obj-ops-excellence", due: "2026-02-27", status: "open", priority: "medium", cycle: "3d", source: "Training Review — Feb 21" },
  { id: "ft-143", task: "Draft hiring plan for Noble B commissioning team", executive: "VP People", objectiveTag: "obj-growth-pipeline", due: "2026-02-27", status: "open", priority: "high", cycle: "3d", source: "Construction Sync — Feb 24" },
  { id: "ft-144", task: "Review Portland OR site lead candidate shortlist", executive: "VP People", objectiveTag: "obj-growth-pipeline", due: "2026-02-28", status: "open", priority: "high", cycle: "3d", source: "Hiring Review — Feb 21" },
  { id: "ft-145", task: "Finalize Q1 performance review process rollout", executive: "VP People", objectiveTag: null, due: "2026-02-25", status: "open", priority: "medium", cycle: "24h", source: "HR Admin — Feb 24" },
  { id: "ft-146", task: "Review 8 open positions priority ranking", executive: "VP People", objectiveTag: null, due: "2026-02-26", status: "open", priority: "low", cycle: "24h", source: "Hiring Review — Feb 24" },
  { id: "ft-147", task: "Complete safety certification audit for 3 sites", executive: "VP People", objectiveTag: "obj-ops-excellence", due: "2026-02-21", status: "done", priority: "high", cycle: "3d", source: "HSE Review — Feb 19", completedDate: "2026-02-20", daysToClose: 1 },
  { id: "ft-148", task: "Submit Noble B construction crew onboarding plan", executive: "VP People", objectiveTag: "obj-growth-pipeline", due: "2026-02-19", status: "done", priority: "high", cycle: "24h", source: "Construction Sync — Feb 17", completedDate: "2026-02-19", daysToClose: 2 },

  // ═══ VP Risk Tasks ═══
  { id: "ft-160", task: "Prepare ESG metrics summary for investor package", executive: "VP Risk", objectiveTag: "obj-series-c", due: "2026-02-26", status: "open", priority: "high", cycle: "24h", source: "IR Prep — Feb 24" },
  { id: "ft-161", task: "Review Baton Rouge incident investigation report", executive: "VP Risk", objectiveTag: "obj-ops-excellence", due: "2026-02-25", status: "open", priority: "high", cycle: "24h", source: "HSE Escalation — Feb 24" },
  { id: "ft-162", task: "Approve updated emergency response plan for Richmond", executive: "VP Risk", objectiveTag: "obj-ops-excellence", due: "2026-02-26", status: "open", priority: "high", cycle: "24h", source: "Safety Review — Feb 24" },
  { id: "ft-163", task: "Review environmental permit renewal applications (Noble + Richmond)", executive: "VP Risk", objectiveTag: "obj-ops-excellence", due: "2026-02-27", status: "open", priority: "medium", cycle: "3d", source: "Permitting Review — Feb 21" },
  { id: "ft-164", task: "Complete environmental impact assessment for Coal GA", executive: "VP Risk", objectiveTag: "obj-growth-pipeline", due: "2026-02-28", status: "open", priority: "high", cycle: "3d", source: "Strategy Session — Feb 21" },
  { id: "ft-165", task: "Review Noble B construction safety inspection findings", executive: "VP Risk", objectiveTag: "obj-growth-pipeline", due: "2026-02-27", status: "open", priority: "medium", cycle: "3d", source: "Construction Sync — Feb 24" },
  { id: "ft-166", task: "Submit monthly OSHA compliance report", executive: "VP Risk", objectiveTag: null, due: "2026-02-25", status: "open", priority: "high", cycle: "24h", source: "Compliance Calendar — Feb 24" },
  { id: "ft-167", task: "Close Richmond near-miss investigation #NM-2026-014", executive: "VP Risk", objectiveTag: "obj-ops-excellence", due: "2026-02-21", status: "done", priority: "high", cycle: "3d", source: "HSE Review — Feb 19", completedDate: "2026-02-21", daysToClose: 2 },
  { id: "ft-168", task: "Approve Veriforce contractor compliance update", executive: "VP Risk", objectiveTag: null, due: "2026-02-20", status: "done", priority: "medium", cycle: "24h", source: "Contractor Review — Feb 19", completedDate: "2026-02-20", daysToClose: 1 },
  { id: "ft-169", task: "Complete Portland OR environmental baseline assessment", executive: "VP Risk", objectiveTag: "obj-growth-pipeline", due: "2026-02-19", status: "done", priority: "high", cycle: "3d", source: "Permitting Review — Feb 17", completedDate: "2026-02-18", daysToClose: 1 },
];


// ═══════════════════════════════════════════════════════════════════
//  COMPUTED METRICS — now accept simDate parameter
// ═══════════════════════════════════════════════════════════════════

const EXECS = ["CEO", "COO", "VP Engineering", "VP Operations", "VP Finance", "VP Strategy", "VP People", "VP Risk"];

// Get tasks with overdue status computed for the given simDate (no mutation)
const getTasksForSimDate = (simDate) => {
  return executiveTasks.map(t => {
    if (t.status === "open" && t.due < simDate) {
      return { ...t, status: "overdue" };
    }
    return t;
  });
};

// ─── Per-executive focus metrics ─────────────────────────────────

export const getExecFocusMetrics = (exec, simDate = "2026-02-25") => {
  const allTasks = getTasksForSimDate(simDate);
  const tasks = allTasks.filter(t => t.executive === exec);
  const open = tasks.filter(t => t.status === "open" || t.status === "overdue");
  const done = tasks.filter(t => t.status === "done");
  const aligned = tasks.filter(t => t.objectiveTag !== null);
  const openAligned = open.filter(t => t.objectiveTag !== null);
  const openUnaligned = open.filter(t => t.objectiveTag === null);

  const focusPct = tasks.length > 0 ? Math.round((aligned.length / tasks.length) * 100) : 0;

  const doneWithDays = done.filter(t => t.daysToClose != null);
  const avgCycleTime = doneWithDays.length > 0
    ? (doneWithDays.reduce((a, t) => a + t.daysToClose, 0) / doneWithDays.length).toFixed(1)
    : "—";

  const byObjective = OBJECTIVE_TAGS.map(obj => {
    const objTasks = tasks.filter(t => t.objectiveTag === obj.id);
    const objOpen = objTasks.filter(t => t.status === "open" || t.status === "overdue");
    const objDone = objTasks.filter(t => t.status === "done");
    return {
      ...obj,
      total: objTasks.length,
      open: objOpen.length,
      done: objDone.length,
      completionRate: objTasks.length > 0 ? Math.round((objDone.length / objTasks.length) * 100) : 0,
    };
  });

  return {
    executive: exec,
    total: tasks.length,
    open: open.length,
    done: done.length,
    overdue: tasks.filter(t => t.status === "overdue").length,
    aligned: aligned.length,
    unaligned: tasks.length - aligned.length,
    focusPct,
    avgCycleTime,
    openAligned: openAligned.length,
    openUnaligned: openUnaligned.length,
    byObjective,
    tasks: open,
    completedTasks: done,
  };
};

// ─── Portfolio-level focus metrics ───────────────────────────────

export const getPortfolioFocusMetrics = (simDate = "2026-02-25") => {
  const all = getTasksForSimDate(simDate);
  const aligned = all.filter(t => t.objectiveTag !== null);
  const totalFocusPct = all.length > 0 ? Math.round((aligned.length / all.length) * 100) : 0;

  const byObjective = OBJECTIVE_TAGS.map(obj => {
    const objTasks = all.filter(t => t.objectiveTag === obj.id);
    const open = objTasks.filter(t => t.status === "open" || t.status === "overdue");
    const done = objTasks.filter(t => t.status === "done");
    return {
      ...obj,
      total: objTasks.length,
      open: open.length,
      done: done.length,
      completionRate: objTasks.length > 0 ? Math.round((done.length / objTasks.length) * 100) : 0,
      byExec: EXECS.map(e => ({
        exec: e,
        count: objTasks.filter(t => t.executive === e).length,
        open: objTasks.filter(t => t.executive === e && (t.status === "open" || t.status === "overdue")).length,
      })),
    };
  });

  // Velocity — build week buckets relative to simDate
  const thisWeekMon = getMonday(simDate);
  const lastWeekMon = addDays(thisWeekMon, -7);
  const thisWeekFri = addDays(thisWeekMon, 4);
  const lastWeekFri = addDays(lastWeekMon, 4);

  const completedTasks = all.filter(t => t.status === "done" && t.completedDate);
  const weekBuckets = [
    { label: `${fmtShort(lastWeekMon)}–${fmtShort(lastWeekFri).split(" ")[1]}`, start: lastWeekMon, end: lastWeekFri },
    { label: `${fmtShort(thisWeekMon)}–${fmtShort(thisWeekFri).split(" ")[1]}`, start: thisWeekMon, end: thisWeekFri },
  ];
  const velocity = weekBuckets.map(w => {
    const inWeek = completedTasks.filter(t => t.completedDate >= w.start && t.completedDate <= w.end);
    return {
      label: w.label,
      total: inWeek.length,
      aligned: inWeek.filter(t => t.objectiveTag !== null).length,
      unaligned: inWeek.filter(t => t.objectiveTag === null).length,
      seriesC: inWeek.filter(t => t.objectiveTag === "obj-series-c").length,
      opsExcellence: inWeek.filter(t => t.objectiveTag === "obj-ops-excellence").length,
      growthPipeline: inWeek.filter(t => t.objectiveTag === "obj-growth-pipeline").length,
    };
  });

  // Week-over-week trend — 8 weeks back from simDate
  const wowTrend = [];
  for (let w = 7; w >= 0; w--) {
    const weekMon = addDays(thisWeekMon, -w * 7);
    const weekFri = addDays(weekMon, 4);
    const label = fmtShort(weekMon);
    const weekLabel = `${label}–${fmtShort(weekFri).split(" ")[1]}`;

    const inWeek = completedTasks.filter(t => t.completedDate >= weekMon && t.completedDate <= weekFri);
    const seriesC = inWeek.filter(t => t.objectiveTag === "obj-series-c").length;
    const opsExcellence = inWeek.filter(t => t.objectiveTag === "obj-ops-excellence").length;
    const growthPipeline = inWeek.filter(t => t.objectiveTag === "obj-growth-pipeline").length;
    const unaligned = inWeek.filter(t => t.objectiveTag === null).length;
    const total = inWeek.length;

    // For weeks without hand-crafted data, use deterministic seed values
    // so trend chart isn't flat zero for historical weeks
    const hasData = total > 0;
    const seedBase = hashWeek(weekMon);
    const s = hasData ? seriesC : 3 + (seedBase % 5);
    const o = hasData ? opsExcellence : 4 + ((seedBase >> 3) % 4);
    const g = hasData ? growthPipeline : 2 + ((seedBase >> 6) % 4);
    const u = hasData ? unaligned : 2 + ((seedBase >> 9) % 4);
    const t2 = s + o + g + u;

    wowTrend.push({
      label,
      week: weekLabel,
      seriesC: s,
      opsExcellence: o,
      growthPipeline: g,
      unaligned: u,
      total: t2,
      aligned: s + o + g,
      focusPct: t2 > 0 ? Math.round(((s + o + g) / t2) * 100) : 0,
    });
  }

  return {
    total: all.length,
    aligned: aligned.length,
    unaligned: all.length - aligned.length,
    focusPct: totalFocusPct,
    overdue: all.filter(t => t.status === "overdue").length,
    byObjective,
    velocity,
    wowTrend,
    execMetrics: EXECS.map(e => getExecFocusMetrics(e, simDate)),
  };
};

// Simple hash for deterministic seed values
function hashWeek(dateStr) {
  let h = 0;
  for (let i = 0; i < dateStr.length; i++) {
    h = ((h << 5) - h + dateStr.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

// ─── Strategic Objective KPIs for Dashboard ──────────────────

export const getObjectiveTaskKpis = (simDate = "2026-02-25") => {
  const allTasks = getTasksForSimDate(simDate);
  const thisWeekMon = getMonday(simDate);
  const lastWeekMon = addDays(thisWeekMon, -7);
  const thisWeekFri = addDays(thisWeekMon, 4);
  const lastWeekFri = addDays(lastWeekMon, 4);

  return OBJECTIVE_TAGS.map(obj => {
    const objTasks = allTasks.filter(t => t.objectiveTag === obj.id);
    const completedLastWeek = objTasks.filter(t => t.status === "done" && t.completedDate >= lastWeekMon && t.completedDate <= lastWeekFri);
    const scheduledThisWeek = objTasks.filter(t => (t.status === "open" || t.status === "overdue") && t.due >= thisWeekMon && t.due <= thisWeekFri);
    const totalForObj = objTasks.length;
    const lastWeekPct = totalForObj > 0 ? Math.round((completedLastWeek.length / totalForObj) * 100) : 0;
    const thisWeekPct = totalForObj > 0 ? Math.round((scheduledThisWeek.length / totalForObj) * 100) : 0;

    return {
      ...obj,
      totalTasks: totalForObj,
      completedLastWeek: completedLastWeek.length,
      lastWeekPct,
      scheduledThisWeek: scheduledThisWeek.length,
      thisWeekPct,
    };
  });
};
