/**
 * News Service — Generates department-relevant world news using Claude API.
 *
 * Uses the same API pattern as claudeService.js (direct fetch, shared API key).
 * Caches results in localStorage, supports scheduled refresh.
 */

import { getApiKey, isLiveMode } from "./claudeService";
import { recordUsage } from "./usageTracker";
import { getNewsConfig, isNewsEnabled, getDepartmentConfig } from "../data/newsConfigStore";

const API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-6";
const NEWS_CACHE_PREFIX = "sens_news_";

let schedulerInterval = null;

// ─── Cache Management ────────────────────────────────────────────────

function cacheKey(deptKey, dateStr) {
  return `${NEWS_CACHE_PREFIX}${deptKey}_${dateStr}`;
}

function getRefreshMs(interval) {
  const map = { "6h": 6 * 3600_000, "12h": 12 * 3600_000, "daily": 24 * 3600_000 };
  return map[interval] || null; // "manual" returns null
}

export function getCachedNews(deptKey) {
  // Find the most recent cache entry for this department
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(`${NEWS_CACHE_PREFIX}${deptKey}_`)) {
      keys.push(k);
    }
  }
  if (keys.length === 0) return null;

  // Sort by date descending, return most recent
  keys.sort().reverse();
  try {
    const raw = localStorage.getItem(keys[0]);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function isCacheFresh(deptKey) {
  const cached = getCachedNews(deptKey);
  if (!cached) return false;

  const config = getNewsConfig();
  const refreshMs = getRefreshMs(config.refreshInterval);
  if (!refreshMs) return true; // "manual" mode — cache never auto-expires

  const age = Date.now() - cached.generatedAt;
  return age < refreshMs;
}

function saveToCache(deptKey, dateStr, items) {
  const entry = {
    items,
    generatedAt: Date.now(),
    deptKey,
    dateStr,
  };
  localStorage.setItem(cacheKey(deptKey, dateStr), JSON.stringify(entry));
}

export function clearNewsCache(deptKey) {
  const toRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(NEWS_CACHE_PREFIX)) {
      if (!deptKey || k.startsWith(`${NEWS_CACHE_PREFIX}${deptKey}_`)) {
        toRemove.push(k);
      }
    }
  }
  toRemove.forEach(k => localStorage.removeItem(k));
}

// ─── News Generation ─────────────────────────────────────────────────

function buildNewsSystemPrompt(simDate) {
  return `You are a world news analyst for SENS (Systemic Environmental Solutions), a company that operates tire pyrolysis and coal gasification facilities across multiple sites in the United States.

Today's date: ${simDate}

Your task is to provide relevant world news analysis tailored to a specific department or function within the company. Each news item should be a real or realistic recent development that has direct implications for the company.

IMPORTANT: Respond ONLY with a valid JSON array. No markdown, no code fences, no explanation text before or after. Just the raw JSON array.

Each item in the array must have these fields:
- "headline": string (concise news headline, max 100 chars)
- "summary": string (2-3 sentence summary of the news story)
- "relevance": string (1-2 sentences explaining why this matters to this department at SENS)
- "category": string (one of: "Policy", "Technology", "Market", "Safety", "Regulation", "Industry", "Finance", "Workforce", "Environment")
- "impact": string (one of: "high", "medium", "low")`;
}

export async function generateNews(deptKey, simDate) {
  const key = getApiKey();
  if (!key) throw new Error("No API key configured");
  if (!isNewsEnabled()) throw new Error("World News module is disabled");
  if (!isLiveMode()) throw new Error("Live mode is off — enable it in AI Settings");

  const deptConfig = getDepartmentConfig(deptKey);
  if (!deptConfig) throw new Error(`Unknown department: ${deptKey}`);
  if (!deptConfig.enabled) throw new Error(`News disabled for ${deptConfig.label}`);

  const systemPrompt = buildNewsSystemPrompt(simDate);
  const userPrompt = deptConfig.prompt;

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `API error: ${res.status}`);
  }

  const json = await res.json();
  const usage = json.usage || {};

  // Track usage
  recordUsage({
    userId: "system",
    agentId: "world-news",
    agentName: `World News (${deptConfig.label})`,
    inputTokens: usage.input_tokens || 0,
    outputTokens: usage.output_tokens || 0,
    source: "world-news",
  });

  // Parse the response — extract JSON from the text
  const text = json.content?.[0]?.text || "[]";
  let items;
  try {
    // Try parsing directly first
    items = JSON.parse(text);
  } catch {
    // Try extracting JSON array from text (in case Claude wraps it)
    const match = text.match(/\[[\s\S]*\]/);
    if (match) {
      items = JSON.parse(match[0]);
    } else {
      throw new Error("Failed to parse news response as JSON");
    }
  }

  // Cache the result
  saveToCache(deptKey, simDate, items);

  return items;
}

// ─── Batch Refresh ───────────────────────────────────────────────────

export async function refreshAllNews(simDate) {
  if (!isNewsEnabled()) return;

  const config = getNewsConfig();
  const results = {};
  const errors = {};

  for (const [deptKey, dept] of Object.entries(config.departments)) {
    if (!dept.enabled) continue;
    if (isCacheFresh(deptKey)) {
      results[deptKey] = getCachedNews(deptKey)?.items || [];
      continue;
    }

    try {
      results[deptKey] = await generateNews(deptKey, simDate);
    } catch (e) {
      errors[deptKey] = e.message;
    }
  }

  return { results, errors };
}

// ─── Scheduler ───────────────────────────────────────────────────────

export function startNewsScheduler(simDate) {
  stopNewsScheduler();
  const config = getNewsConfig();
  const ms = getRefreshMs(config.refreshInterval);
  if (!ms || !config.enabled) return;

  schedulerInterval = setInterval(() => {
    refreshAllNews(simDate);
  }, ms);
}

export function stopNewsScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
  }
}

export function isSchedulerRunning() {
  return schedulerInterval !== null;
}
