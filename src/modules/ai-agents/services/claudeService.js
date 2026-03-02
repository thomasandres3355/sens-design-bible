/**
 * Claude API Service — Direct REST integration for Executive Intelligence Platform pilot testing
 *
 * Uses native fetch() to call Anthropic API. No SDK dependency.
 * API key stored in localStorage (acceptable for pilot/testing only).
 */

import { getDataSlice, getSiteMetrics, getTasksForDate, getAlertsForDate, getPortfolioMetrics, getVelocityTrend } from "@modules/operations/timeEngine";
import { checkAccess, getAccessibleDomains } from "@core/users/badgeData";
import { recordUsage } from "./usageTracker";
import { getGlobalRules } from "../agentConfigStore";

const API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-6";

// ─── API Key Management ──────────────────────────────────────────────
export function getApiKey() {
  return localStorage.getItem("anthropic_api_key") || "";
}

export function setApiKey(key) {
  localStorage.setItem("anthropic_api_key", key);
}

export function isLiveMode() {
  return localStorage.getItem("agent_live_mode") === "true" && !!getApiKey();
}

export function setLiveMode(enabled) {
  localStorage.setItem("agent_live_mode", enabled ? "true" : "false");
}

// ─── Test Connection ─────────────────────────────────────────────────
export async function testConnection() {
  const key = getApiKey();
  if (!key) return { success: false, error: "No API key configured" };

  try {
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
        max_tokens: 32,
        messages: [{ role: "user", content: "Reply with only: connected" }],
      }),
    });

    if (res.ok) return { success: true };
    const err = await res.json();
    return { success: false, error: err.error?.message || `HTTP ${res.status}` };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ─── Data Context Builder ────────────────────────────────────────────
// Agent dataSources now use internal domain names directly (e.g. "site_kpis", "alerts").
// Data sections are filtered by user clearance via getAccessibleDomains().

export function buildDataContext(agent, simDate, user, historyDepth = "1y") {
  const accessibleDomains = getAccessibleDomains(user);
  const sites = getSiteMetrics(simDate);
  const tasks = getTasksForDate(simDate);
  const alerts = getAlertsForDate(simDate);
  const portfolio = getPortfolioMetrics(simDate);
  const activeSites = sites.filter((s) => s.status === "operational" && s.uptime > 0);

  const sections = [];

  // Always include accessible KPIs
  if (accessibleDomains.includes("site_kpis")) {
    sections.push("## Portfolio KPIs\n" + activeSites.map((s) =>
      `- ${s.short}: Uptime ${s.uptime}%, Throughput ${s.throughput} TPH, RevMTD $${s.revMTD}M, EBITDA $${(s.actualEBITDA || 0).toFixed(1)}M`
    ).join("\n") + `\n- Portfolio Avg Uptime: ${portfolio.avgUptime.toFixed(1)}%\n- Portfolio EBITDA: $${portfolio.portfolioEBITDA.toFixed(1)}M\n- Portfolio Revenue: $${portfolio.portfolioRevenue.toFixed(1)}M`);
  }

  if (accessibleDomains.includes("alerts")) {
    const topAlerts = alerts.slice(0, 8);
    sections.push("## Active Alerts\n" + topAlerts.map((a) =>
      `- [${a.severity.toUpperCase()}] ${a.label}: ${a.detail}`
    ).join("\n"));
  }

  if (accessibleDomains.includes("executive_tasks")) {
    const openTasks = tasks.filter((t) => t.status === "open" || t.status === "overdue");
    const overdue = openTasks.filter((t) => t.status === "overdue");
    sections.push(`## Executive Tasks\n- Total Open: ${openTasks.length}\n- Overdue: ${overdue.length}\n` +
      openTasks.slice(0, 15).map((t) =>
        `- [${t.status}] ${t.executive}: ${t.task} (due: ${t.due}, priority: ${t.priority})`
      ).join("\n"));
  }

  if (accessibleDomains.includes("site_operations")) {
    sections.push("## Site Operations Detail\n" + activeSites.map((s) =>
      `- ${s.short}: ${s.processors} processors, Feed: ${s.feedSupplier}, Diluent: ${s.diluentGal} gal, Carbon: ${s.carbonT}T`
    ).join("\n"));
  }

  if (accessibleDomains.includes("financial_detail")) {
    sections.push("## Financial Detail\n" + activeSites.map((s) =>
      `- ${s.short}: Revenue $${(s.actualRevenue || 0).toFixed(1)}M, COGS $${(s.actualCOGS || 0).toFixed(1)}M, Margin ${s.actualGrossMargin}%, OpEx $${(s.actualOpEx || 0).toFixed(1)}M`
    ).join("\n"));
  }

  const construction = sites.filter((s) => s.status === "construction");
  if (accessibleDomains.includes("project_budgets") && construction.length) {
    sections.push("## Construction Projects\n" + construction.map((s) =>
      `- ${s.short}: ${s.constructionPct}% complete, Stage: ${s.stage}, EPC: ${s.epc}`
    ).join("\n"));
  }

  // Historical trend data based on history depth
  if (accessibleDomains.includes("site_kpis") || accessibleDomains.includes("financial_detail")) {
    const depthMonths = { "30d": 1, "90d": 3, "1y": 12, "2y": 24 }[historyDepth] || 12;
    const dataPoints = Math.min(depthMonths, 12); // Cap at 12 monthly data points
    const stepMonths = Math.max(1, Math.floor(depthMonths / dataPoints));
    const trendLines = [];
    const endDate = new Date(simDate + "T12:00:00");
    for (let i = dataPoints - 1; i >= 0; i--) {
      const d = new Date(endDate);
      d.setMonth(d.getMonth() - i * stepMonths);
      d.setDate(1);
      const dateStr = d.toISOString().split("T")[0];
      const p = getPortfolioMetrics(dateStr);
      const label = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      trendLines.push(`- ${label}: Revenue $${p.portfolioRevenue.toFixed(1)}M, EBITDA $${p.portfolioEBITDA.toFixed(1)}M, Uptime ${p.avgUptime.toFixed(1)}%, Sites ${p.activeSiteCount}`);
    }
    sections.push(`## Historical Trends (${historyDepth} lookback)\n${trendLines.join("\n")}`);

    // Task velocity trend
    const velocityWeeks = Math.min(Math.floor(depthMonths * 4.3), 12);
    const velocity = getVelocityTrend(simDate, velocityWeeks);
    if (velocity && velocity.length > 0) {
      const velLines = velocity.map(v => `- ${v.weekLabel}: ${v.completed} completed, ${v.added} added`);
      sections.push(`## Task Velocity Trend\n${velLines.join("\n")}`);
    }
  }

  return sections.join("\n\n");
}

// ─── System Prompt Builder ───────────────────────────────────────────
function buildSystemPrompt(agent, simDate, user, dataContext) {
  const rules = getGlobalRules();

  return `You are ${agent.name}, a ${agent.role} at SENS (Systemic Environmental Solutions), a company that operates tire pyrolysis and coal gasification facilities.

Your skills: ${(agent.skills || []).join(", ")}
Your data sources: ${(agent.dataSources || []).join(", ")}

Today's date: ${simDate}
Active user: ${user.name} (${user.role}, ${user.department} department)
User clearance: L${checkAccess(user, "board_materials").allowed ? "5" : checkAccess(user, "compensation").allowed ? "4" : checkAccess(user, "financial_detail").allowed ? "3" : checkAccess(user, "site_operations").allowed ? "2" : "1"}

ACCESS CONTROL RULES:
${rules.accessControlRules}

CURRENT DATA (as of ${simDate}):
${dataContext}

RESPONSE GUIDELINES:
${rules.responseGuidelines}`;
}

// ─── Main Ask Agent Function ─────────────────────────────────────────
/**
 * Ask an agent a question using Claude API
 * @param {object} params
 * @param {object} params.agent — agent config (name, role, skills, dataSources)
 * @param {string} params.question — user question
 * @param {Array} params.history — conversation history [{role, content}]
 * @param {string} params.simDate — current simulated date
 * @param {object} params.user — active user from BadgeContext
 * @param {function} params.onChunk — callback for streaming chunks (optional)
 * @param {string} params.source — usage source label ("chat", "agent-contribution", "meeting")
 * @returns {Promise<string>} — full response text
 */
export async function askAgent({ agent, question, history = [], simDate, user, onChunk, source = "chat", historyDepth = "1y" }) {
  const key = getApiKey();
  if (!key) throw new Error("No API key configured");

  const dataContext = buildDataContext(agent, simDate, user, historyDepth);
  const systemPrompt = buildSystemPrompt(agent, simDate, user, dataContext);

  const messages = [
    ...history.slice(-10), // Keep last 10 messages for context
    { role: "user", content: question },
  ];

  const body = {
    model: MODEL,
    max_tokens: 1024,
    system: systemPrompt,
    messages,
    stream: !!onChunk,
  };

  const headers = {
    "Content-Type": "application/json",
    "x-api-key": key,
    "anthropic-version": "2023-06-01",
    "anthropic-dangerous-direct-browser-access": "true",
  };

  const res = await fetch(API_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `API error: ${res.status}`);
  }

  // Streaming mode
  if (onChunk && res.body) {
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let fullText = "";
    let buffer = "";
    let streamInputTokens = 0;
    let streamOutputTokens = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6);
        if (data === "[DONE]") break;

        try {
          const parsed = JSON.parse(data);
          if (parsed.type === "content_block_delta" && parsed.delta?.text) {
            fullText += parsed.delta.text;
            onChunk(parsed.delta.text, fullText);
          }
          // Capture usage from streaming events
          if (parsed.type === "message_start" && parsed.message?.usage) {
            streamInputTokens = parsed.message.usage.input_tokens || 0;
          }
          if (parsed.type === "message_delta" && parsed.usage) {
            streamOutputTokens = parsed.usage.output_tokens || 0;
          }
        } catch {
          // Skip unparseable chunks
        }
      }
    }

    // Record usage after stream completes
    recordUsage({
      userId: user?.id,
      agentId: agent?.id,
      agentName: agent?.name,
      inputTokens: streamInputTokens,
      outputTokens: streamOutputTokens,
      source,
    });

    return fullText;
  }

  // Non-streaming mode
  const json = await res.json();
  const usage = json.usage || {};
  recordUsage({
    userId: user?.id,
    agentId: agent?.id,
    agentName: agent?.name,
    inputTokens: usage.input_tokens || 0,
    outputTokens: usage.output_tokens || 0,
    source,
  });
  return json.content?.[0]?.text || "No response generated.";
}
