import { createContext, useContext, useState, useCallback, useMemo } from "react";
import { loadTasks, saveTasks, computeOverdueStatus } from "@modules/executive-focus/taskData";
import { useSimDate } from "@core/simulation/SimDateContext";

// ═══════════════════════════════════════════════════════════════════
//  TASK CONTEXT — Unified task CRUD + query helpers
//  Follows the BadgeContext pattern: useState + useCallback + localStorage
// ═══════════════════════════════════════════════════════════════════

const TaskContext = createContext(null);

export const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState(() => loadTasks());
  const { simDate } = useSimDate();

  // Computed: tasks with overdue status applied based on simDate
  const tasksWithStatus = useMemo(
    () => computeOverdueStatus(tasks, simDate),
    [tasks, simDate]
  );

  // ── CREATE ──
  const addTask = useCallback((taskData) => {
    const newTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      task: taskData.task,
      executive: taskData.executive,
      objectiveTag: taskData.objectiveTag || null,
      due: taskData.due,
      status: "open",
      priority: taskData.priority || "medium",
      cycle: taskData.cycle || "3d",
      source: taskData.source || "Manual entry",
      sourceType: taskData.sourceType || "manual",
      meetingId: taskData.meetingId || null,
      completedDate: null,
      daysToClose: null,
      createdAt: new Date().toISOString(),
      createdBy: taskData.createdBy || "unknown",
    };
    setTasks(prev => {
      const next = [...prev, newTask];
      saveTasks(next);
      return next;
    });
    return newTask;
  }, []);

  // ── UPDATE ──
  const updateTask = useCallback((taskId, updates) => {
    setTasks(prev => {
      const next = prev.map(t =>
        t.id === taskId ? { ...t, ...updates } : t
      );
      saveTasks(next);
      return next;
    });
  }, []);

  // ── DELETE ──
  const deleteTask = useCallback((taskId) => {
    setTasks(prev => {
      const next = prev.filter(t => t.id !== taskId);
      saveTasks(next);
      return next;
    });
  }, []);

  // ── COMPLETE ──
  const completeTask = useCallback((taskId, completionDate) => {
    setTasks(prev => {
      const next = prev.map(t => {
        if (t.id !== taskId) return t;
        const created = new Date(t.createdAt || t.due + "T12:00:00");
        const completed = new Date(completionDate + "T12:00:00");
        const daysToClose = Math.max(1, Math.round((completed - created) / 86400000));
        return { ...t, status: "done", completedDate: completionDate, daysToClose };
      });
      saveTasks(next);
      return next;
    });
  }, []);

  // ── REOPEN ──
  const reopenTask = useCallback((taskId) => {
    setTasks(prev => {
      const next = prev.map(t =>
        t.id === taskId ? { ...t, status: "open", completedDate: null, daysToClose: null } : t
      );
      saveTasks(next);
      return next;
    });
  }, []);

  // ── IMPORT FROM MEETING ──
  const importFromMeeting = useCallback((actionItem, executive, createdBy) => {
    return addTask({
      task: actionItem.task,
      executive,
      objectiveTag: null,
      due: actionItem.due,
      priority: actionItem.priority || "medium",
      cycle: "3d",
      source: actionItem.source,
      sourceType: "meeting",
      meetingId: actionItem.meeting || actionItem.id,
      createdBy,
    });
  }, [addTask]);

  // ── QUERY HELPERS ──
  const getTasksForExec = useCallback((execKey) =>
    tasksWithStatus.filter(t => t.executive === execKey),
    [tasksWithStatus]
  );

  const getOpenTasksForExec = useCallback((execKey) =>
    tasksWithStatus.filter(t => t.executive === execKey && (t.status === "open" || t.status === "overdue")),
    [tasksWithStatus]
  );

  const value = useMemo(() => ({
    tasks: tasksWithStatus,
    addTask,
    updateTask,
    deleteTask,
    completeTask,
    reopenTask,
    importFromMeeting,
    getTasksForExec,
    getOpenTasksForExec,
  }), [tasksWithStatus, addTask, updateTask, deleteTask, completeTask, reopenTask, importFromMeeting, getTasksForExec, getOpenTasksForExec]);

  return (
    <TaskContext.Provider value={value}>{children}</TaskContext.Provider>
  );
};

export const useTasks = () => {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error("useTasks must be used within TaskProvider");
  return ctx;
};
