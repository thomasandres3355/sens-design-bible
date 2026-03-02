/**
 * Agent Configuration Store — Pure JS localStorage persistence layer.
 * No React dependency. Used by both AgentConfigContext (React) and claudeService (non-React).
 */
import { agentIndex } from "./vpData";

const AGENT_OVERRIDES_KEY = "sens_agent_overrides";
const GLOBAL_RULES_KEY = "sens_global_rules";

// ─── Default Global Rules (extracted from claudeService.js hardcoded text) ────
export const DEFAULT_ACCESS_CONTROL_RULES = `- Only discuss data that has been provided to you below. If the user asks about data not in your context, explain that you don't have access to that information or that it requires higher clearance.
- If asked about compensation, HR records, or other restricted data that isn't in your context, respond: "That information requires higher clearance than currently available."
- Never fabricate data. Only reference the specific numbers provided below.
- Never speculate about data you do not have. If a question requires information outside your data context, say so explicitly.
- Do not reference external sources, URLs, or documents not provided in your context.`;

export const DEFAULT_RESPONSE_GUIDELINES = `- Start every response with a 1-2 sentence executive summary of your key finding or recommendation.
- After the summary, provide your full analysis with supporting data.
- Be concise and specific. Reference actual numbers from the data provided.
- Use the executive's name when relevant.
- Flag risks and recommend concrete actions with owners and timelines.
- If you see concerning trends, proactively mention them.
- Format with bullet points for readability. Use markdown headers (##) to separate sections.
- Keep total response under 300 words unless the question requires detailed analysis.
- NEVER use emojis, emoticons, or decorative unicode symbols.
- NEVER include images, image links, or decorative elements.
- Use plain text formatting only: bullet points, numbered lists, bold (**text**), headers.
- When presenting numbers, use consistent formatting: $X.XM for dollars, X.X% for percentages.`;

// ─── Agent Overrides ──────────────────────────────────────────────────────────

function readJSON(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

/** Get all agent overrides map: { [agentId]: { skills?, dataSources?, ... } } */
export function getAgentOverrides() {
  return readJSON(AGENT_OVERRIDES_KEY) || {};
}

/** Set/merge overrides for a single agent */
export function setAgentOverride(agentId, patch) {
  const all = getAgentOverrides();
  all[agentId] = { ...(all[agentId] || {}), ...patch };
  writeJSON(AGENT_OVERRIDES_KEY, all);
}

/** Clear overrides for a single agent (revert to defaults) */
export function clearAgentOverride(agentId) {
  const all = getAgentOverrides();
  delete all[agentId];
  writeJSON(AGENT_OVERRIDES_KEY, all);
}

/** Clear all agent overrides */
export function clearAllOverrides() {
  localStorage.removeItem(AGENT_OVERRIDES_KEY);
}

/** Check if an agent has any overrides */
export function isAgentOverridden(agentId) {
  const all = getAgentOverrides();
  return agentId in all;
}

/** Get the effective agent object — base merged with override */
export function getEffectiveAgent(agentId) {
  const entry = agentIndex[agentId];
  if (!entry) return null;
  const base = entry.agent;
  const override = getAgentOverrides()[agentId];
  if (!override) return base;
  return { ...base, ...override };
}

// ─── Global Rules ─────────────────────────────────────────────────────────────

/** Get current global rules, falling back to defaults */
export function getGlobalRules() {
  const stored = readJSON(GLOBAL_RULES_KEY);
  return {
    accessControlRules: stored?.accessControlRules ?? DEFAULT_ACCESS_CONTROL_RULES,
    responseGuidelines: stored?.responseGuidelines ?? DEFAULT_RESPONSE_GUIDELINES,
  };
}

/** Update global rules (partial patch) */
export function setGlobalRules(patch) {
  const current = readJSON(GLOBAL_RULES_KEY) || {};
  writeJSON(GLOBAL_RULES_KEY, { ...current, ...patch });
}

/** Clear global rules (revert to defaults) */
export function clearGlobalRules() {
  localStorage.removeItem(GLOBAL_RULES_KEY);
}

/** Check if global rules have been customized */
export function isGlobalRulesOverridden() {
  return readJSON(GLOBAL_RULES_KEY) !== null;
}

// ─── Export / Import ──────────────────────────────────────────────────────────

/** Export full config as JSON object */
export function exportConfig() {
  return {
    agentOverrides: getAgentOverrides(),
    globalRules: readJSON(GLOBAL_RULES_KEY) || null,
  };
}

/** Import config from JSON object */
export function importConfig(data) {
  if (data.agentOverrides) {
    writeJSON(AGENT_OVERRIDES_KEY, data.agentOverrides);
  }
  if (data.globalRules) {
    writeJSON(GLOBAL_RULES_KEY, data.globalRules);
  }
}
