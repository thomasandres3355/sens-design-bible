/**
 * Agent Contribution Service — Proactive meeting interjection via Claude
 *
 * Uses a batch + keyword filter approach:
 * 1. Messages are filtered by CONTRIBUTION_KEYWORDS (numbers, financial terms, etc.)
 * 2. Only messages with factual claims are batched and sent to Claude every N seconds
 * 3. Claude checks claims against provided data and flags errors
 *
 * Estimated cost: ~$0.05/hour for a typical meeting
 */

import { recordUsage } from "./usageTracker";

const API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-6";

// ─── Keyword Patterns (detect factual claims) ────────────────────────
const CONTRIBUTION_KEYWORDS = [
  /\$[\d,.]+[MBKmk]?/,           // dollar amounts: $5M, $100K, $3.2B
  /\d+(\.\d+)?%/,                  // percentages: 95%, 3.2%
  /\d+(\.\d+)?\s*(million|billion|thousand|hundred)/i,
  /revenue|ebitda|margin|profit|loss|cash|burn|runway/i,
  /uptime|throughput|yield|capacity|utilization/i,
  /tph|gal(lon)?s?|ton(ne)?s?|barrel/i,
  /last (quarter|month|week|year)|ytd|mtd|qtd/i,
  /q[1-4]\s*\d{2,4}/i,            // Q1 2025, Q3 24
  /\b(series [a-c]|fundrais|valuation|investor)\b/i,
  /\b(overdue|on.?track|behind|ahead)\b/i,
];

// ─── Settings helpers ─────────────────────────────────────────────────
export function isAgentContribEnabled() {
  return localStorage.getItem("agent_contrib_enabled") === "true";
}

export function setAgentContribEnabled(enabled) {
  localStorage.setItem("agent_contrib_enabled", enabled ? "true" : "false");
}

export function getAgentContribInterval() {
  const v = parseInt(localStorage.getItem("agent_contrib_interval"));
  return [30, 45, 60, 90, 120].includes(v) ? v : 45;
}

export function setAgentContribInterval(seconds) {
  localStorage.setItem("agent_contrib_interval", String(seconds));
}

const SENSITIVITY_LEVELS = ["relaxed", "normal", "strict", "precise"];

export function getAgentContribSensitivity() {
  const v = localStorage.getItem("agent_contrib_sensitivity");
  return SENSITIVITY_LEVELS.includes(v) ? v : "normal";
}

export function setAgentContribSensitivity(level) {
  localStorage.setItem("agent_contrib_sensitivity", level);
}

// ─── Claim Detection ──────────────────────────────────────────────────
export function containsFactualClaim(text) {
  if (!text || text.length < 10) return false;
  return CONTRIBUTION_KEYWORDS.some(rx => rx.test(text));
}

// ─── Sensitivity → Prompt mapping ─────────────────────────────────────
const SENSITIVITY_PROMPTS = {
  relaxed: {
    tolerance: "within 15% tolerance",
    extra: "Be lenient — only flag numbers that are clearly and significantly wrong. Rough estimates and ballpark figures should NOT be flagged.",
  },
  normal: {
    tolerance: "within 5% tolerance",
    extra: "",
  },
  strict: {
    tolerance: "within 2% tolerance",
    extra: "Be thorough — flag even small discrepancies where the stated number meaningfully differs from the data.",
  },
  precise: {
    tolerance: "at all (0% tolerance — any deviation counts)",
    extra: "Be extremely precise — flag ANY deviation from the data, no matter how small. Even rounding differences should be flagged.",
  },
};

// ─── Prompt Builder ───────────────────────────────────────────────────
export function buildContribPrompt(messages, dataContext, sensitivity = "normal") {
  const chatBlock = messages.map(m => `[${m.from}]: ${m.text}`).join("\n");
  const { tolerance, extra } = SENSITIVITY_PROMPTS[sensitivity] || SENSITIVITY_PROMPTS.normal;

  return {
    system: `You are a fact-checking assistant for SENS (Systemic Environmental Solutions), a tire pyrolysis and coal gasification company. You monitor meeting chat for factual errors.

RULES:
- ONLY flag clear factual errors where a stated number contradicts the provided data.
- Do NOT flag opinions, estimates, or forward-looking statements.
- Do NOT flag if the claim is approximately correct (${tolerance}).${extra ? "\n- " + extra : ""}
- If no errors are found, respond with exactly: NO_ERRORS
- If you find an error, respond in this exact JSON format (one error only — the most significant):
{"speaker":"<name>","claim":"<what they said>","correction":"<correct value from data>","severity":"high"}

CURRENT DATA:
${dataContext}`,
    userMessage: `Review these recent meeting chat messages for factual accuracy:\n\n${chatBlock}`,
  };
}

// ─── Check Facts (single API call) ────────────────────────────────────
// Returns: { type: "interjection", ...data } | { type: "error", message } | null
export async function checkFacts({ messages, dataContext, userId, sensitivity }) {
  const TAG = "[AgentContrib]";
  const apiKey = localStorage.getItem("anthropic_api_key");
  if (!apiKey) {
    console.warn(TAG, "No API key — skipping check");
    return { type: "error", message: "No API key configured. Go to Settings → AI & Agents to add one." };
  }

  console.log(TAG, `Checking ${messages.length} message(s), sensitivity=${sensitivity}`);
  const { system, userMessage } = buildContribPrompt(messages, dataContext, sensitivity);

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 256,
        system,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      console.error(TAG, `API error ${res.status}:`, errBody);
      const errMsg = res.status === 401
        ? "Invalid API key. Check your key in Settings → AI & Agents."
        : res.status === 429
          ? "Rate limited — will retry next interval."
          : `API error (${res.status}). Check console for details.`;
      return { type: "error", message: errMsg };
    }

    const json = await res.json();
    const text = json.content?.[0]?.text || "";
    console.log(TAG, "Claude response:", text);

    // Record usage
    const usage = json.usage || {};
    recordUsage({
      userId,
      agentId: "agent-contributor",
      agentName: "Agent Contributor",
      inputTokens: usage.input_tokens || 0,
      outputTokens: usage.output_tokens || 0,
      source: "agent-contribution",
    });

    // Parse response
    if (text.trim() === "NO_ERRORS") {
      console.log(TAG, "No errors detected");
      return null;
    }

    try {
      const parsed = JSON.parse(text.trim());
      console.log(TAG, "Error detected:", parsed);
      return {
        type: "interjection",
        id: `fc-${Date.now()}`,
        ts: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        speaker: parsed.speaker,
        claim: parsed.claim,
        correction: parsed.correction,
        severity: parsed.severity || "high",
      };
    } catch (e) {
      console.warn(TAG, "Could not parse Claude response as JSON:", text, e);
      return null;
    }
  } catch (e) {
    console.error(TAG, "Network/fetch error:", e);
    return { type: "error", message: "Network error — check your connection." };
  }
}
