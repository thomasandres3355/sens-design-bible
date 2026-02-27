/**
 * Token Usage Tracker — Records and aggregates Claude API usage for the SENS dashboard
 *
 * Stores per-call usage records in localStorage keyed by date (sens_usage_YYYY-MM-DD).
 * Provides aggregation helpers for the Settings > Usage & Compute panel.
 */

// ─── Pricing Constants (Claude Sonnet) ────────────────────────────────
const INPUT_COST_PER_TOKEN = 3 / 1_000_000;   // $3 per 1M input tokens
const OUTPUT_COST_PER_TOKEN = 15 / 1_000_000;  // $15 per 1M output tokens

const STORAGE_PREFIX = "sens_usage_";

// ─── Helpers ──────────────────────────────────────────────────────────
function todayKey() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function storageKey(date) {
  return `${STORAGE_PREFIX}${date}`;
}

function readDay(date) {
  try {
    const raw = localStorage.getItem(storageKey(date));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeDay(date, records) {
  localStorage.setItem(storageKey(date), JSON.stringify(records));
}

function calcCost(inputTokens, outputTokens) {
  return inputTokens * INPUT_COST_PER_TOKEN + outputTokens * OUTPUT_COST_PER_TOKEN;
}

// ─── Record a single API call ─────────────────────────────────────────
export function recordUsage({ userId, agentId, agentName, inputTokens, outputTokens, source = "chat" }) {
  const date = todayKey();
  const records = readDay(date);
  records.push({
    ts: Date.now(),
    userId,
    agentId,
    agentName,
    inputTokens: inputTokens || 0,
    outputTokens: outputTokens || 0,
    source,
  });
  writeDay(date, records);
}

// ─── Query: records in date range ─────────────────────────────────────
export function getUsageForRange(startDate, endDate) {
  const records = [];
  const current = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T00:00:00");
  while (current <= end) {
    const dateStr = current.toISOString().slice(0, 10);
    records.push(...readDay(dateStr));
    current.setDate(current.getDate() + 1);
  }
  return records;
}

// ─── Query: aggregated summary ────────────────────────────────────────
export function getUsageSummary() {
  const records = getLast30DaysRecords();
  let totalInput = 0, totalOutput = 0, callCount = 0;
  for (const r of records) {
    totalInput += r.inputTokens;
    totalOutput += r.outputTokens;
    callCount++;
  }
  const totalCost = calcCost(totalInput, totalOutput);
  return {
    totalTokens: totalInput + totalOutput,
    totalInput,
    totalOutput,
    totalCost,
    callCount,
    avgCostPerCall: callCount > 0 ? totalCost / callCount : 0,
  };
}

// ─── Query: usage grouped by user ─────────────────────────────────────
export function getUsageByUser() {
  const records = getLast30DaysRecords();
  const map = {};
  for (const r of records) {
    const key = r.userId || "unknown";
    if (!map[key]) map[key] = { userId: key, totalInput: 0, totalOutput: 0, callCount: 0 };
    map[key].totalInput += r.inputTokens;
    map[key].totalOutput += r.outputTokens;
    map[key].callCount++;
  }
  return Object.values(map).map(u => ({
    ...u,
    totalTokens: u.totalInput + u.totalOutput,
    totalCost: calcCost(u.totalInput, u.totalOutput),
  }));
}

// ─── Query: usage grouped by agent ────────────────────────────────────
export function getUsageByAgent() {
  const records = getLast30DaysRecords();
  const map = {};
  for (const r of records) {
    const key = r.agentId || "unknown";
    if (!map[key]) map[key] = { agentId: key, agentName: r.agentName || key, totalInput: 0, totalOutput: 0, callCount: 0 };
    map[key].totalInput += r.inputTokens;
    map[key].totalOutput += r.outputTokens;
    map[key].callCount++;
  }
  return Object.values(map).map(a => ({
    ...a,
    totalTokens: a.totalInput + a.totalOutput,
    totalCost: calcCost(a.totalInput, a.totalOutput),
  }));
}

// ─── Query: daily totals for trend chart ──────────────────────────────
export function getDailyUsage(days = 30) {
  const result = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const records = readDay(dateStr);
    let totalInput = 0, totalOutput = 0, callCount = 0;
    for (const r of records) {
      totalInput += r.inputTokens;
      totalOutput += r.outputTokens;
      callCount++;
    }
    result.push({
      date: dateStr,
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      totalTokens: totalInput + totalOutput,
      totalInput,
      totalOutput,
      totalCost: calcCost(totalInput, totalOutput),
      callCount,
    });
  }
  return result;
}

// ─── Clear all usage data ─────────────────────────────────────────────
export function clearUsageData() {
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(STORAGE_PREFIX)) keysToRemove.push(key);
  }
  keysToRemove.forEach(k => localStorage.removeItem(k));
}

// ─── Internal: get all records from last 30 days ──────────────────────
function getLast30DaysRecords() {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 30);
  return getUsageForRange(start.toISOString().slice(0, 10), now.toISOString().slice(0, 10));
}
