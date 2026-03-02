import { executiveTasks } from "./focusData";
import { allActionItems, participants } from "@modules/ai-agents/meetingData";

// ═══════════════════════════════════════════════════════════════════
//  TASK DATA — Unified task model, seed builder, localStorage persistence
// ═══════════════════════════════════════════════════════════════════

const TASK_STORAGE_KEY = "sens-unified-tasks";

// ─── Assignee name → executive role mapping ──────────────────────
const assigneeToRole = (assignee) => {
  const lower = assignee.toLowerCase();
  for (const p of participants) {
    if (p.name.toLowerCase() === lower) return p.role;
    if (p.name.toLowerCase().startsWith(lower)) return p.role;
    if (lower.startsWith(p.name.split(" ")[0].toLowerCase())) return p.role;
  }
  return assignee; // fallback: use as-is
};

// ─── Build seed tasks from existing data ─────────────────────────
export const buildSeedTasks = () => {
  const now = new Date().toISOString();

  // Map executive tasks
  const fromExec = executiveTasks.map(t => ({
    id: t.id,
    task: t.task,
    executive: t.executive,
    objectiveTag: t.objectiveTag || null,
    due: t.due,
    status: t.status === "done" ? "done" : "open",
    priority: t.priority,
    cycle: t.cycle,
    source: t.source,
    sourceType: "executive",
    meetingId: null,
    completedDate: t.completedDate || null,
    daysToClose: t.daysToClose || null,
    createdAt: now,
    createdBy: "system",
  }));

  // Map meeting action items (skip duplicates already covered by exec tasks)
  const execIds = new Set(fromExec.map(t => t.id));
  const fromMeetings = allActionItems
    .filter(ai => !execIds.has(ai.id))
    .map(ai => ({
      id: ai.id,
      task: ai.task,
      executive: assigneeToRole(ai.assignee),
      objectiveTag: null,
      due: ai.due,
      status: ai.status === "done" ? "done" : "open",
      priority: ai.priority || "medium",
      cycle: "3d",
      source: ai.source,
      sourceType: "meeting",
      meetingId: ai.meeting || null,
      completedDate: ai.status === "done" ? ai.due : null,
      daysToClose: null,
      createdAt: now,
      createdBy: "system",
    }));

  return [...fromExec, ...fromMeetings];
};

// ─── Compute overdue status based on simDate ─────────────────────
export const computeOverdueStatus = (tasks, simDate) =>
  tasks.map(t => {
    if (t.status === "open" && t.due < simDate) return { ...t, status: "overdue" };
    return t;
  });

// ─── localStorage persistence ────────────────────────────────────
export const loadTasks = () => {
  try {
    const raw = localStorage.getItem(TASK_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore parse errors */ }
  const seed = buildSeedTasks();
  saveTasks(seed);
  return seed;
};

export const saveTasks = (tasks) => {
  localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(tasks));
};

export const resetTasks = () => {
  localStorage.removeItem(TASK_STORAGE_KEY);
  return buildSeedTasks();
};
