/**
 * ro.am API Service Layer
 * ─────────────────────────────────────────────────────────────────
 * Abstraction over ro.am REST API (https://developer.ro.am)
 * Currently uses mock data; swap with real API calls in production.
 *
 * Configuration: Set ROAM_API_TOKEN in SENS Admin > Integrations
 * ─────────────────────────────────────────────────────────────────
 */

// ─── Configuration ───────────────────────────────────────────────
const ROAM_CONFIG = {
  baseUrl: "https://api.ro.am/v1",
  token: null, // Set via configureRoam()
  webhookUrl: null,
  connected: false,
  lastSync: null,
};

export const configureRoam = ({ token, webhookUrl }) => {
  ROAM_CONFIG.token = token;
  ROAM_CONFIG.webhookUrl = webhookUrl;
  ROAM_CONFIG.connected = !!token;
  return ROAM_CONFIG;
};

export const getRoamStatus = () => ({
  connected: ROAM_CONFIG.connected,
  lastSync: ROAM_CONFIG.lastSync,
  hasToken: !!ROAM_CONFIG.token,
});

// ─── API Headers ─────────────────────────────────────────────────
const headers = () => ({
  Authorization: `Bearer ${ROAM_CONFIG.token}`,
  "Content-Type": "application/json",
});

// ─── Mock Mode Detection ─────────────────────────────────────────
const useMock = () => !ROAM_CONFIG.token;

// ═══════════════════════════════════════════════════════════════════
//  API METHODS — each returns a promise
//  In mock mode, returns static data; in production, calls ro.am API
// ═══════════════════════════════════════════════════════════════════

/**
 * Fetch meeting rooms/groups
 * ro.am endpoint: /groups.list
 */
export const fetchGroups = async () => {
  if (useMock()) {
    return { ok: true, groups: [
      { id: "grp-exec-standup", name: "Executive Boardroom", type: "meeting", members: 12 },
      { id: "grp-portland-review", name: "Engineering Hub", type: "meeting", members: 8 },
      { id: "grp-ir-prep", name: "CEO Office", type: "office", members: 3 },
      { id: "grp-hse-monthly", name: "Operations Center", type: "meeting", members: 15 },
      { id: "grp-fin-committee", name: "Finance Suite", type: "meeting", members: 6 },
    ]};
  }
  const res = await fetch(`${ROAM_CONFIG.baseUrl}/groups.list`, { headers: headers() });
  return res.json();
};

/**
 * Fetch chat history for a group
 * ro.am endpoint: /chat.history
 */
export const fetchChatHistory = async (groupId, limit = 50) => {
  if (useMock()) {
    return { ok: true, messages: [], hasMore: false };
  }
  const res = await fetch(`${ROAM_CONFIG.baseUrl}/chat.history`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ group: groupId, limit }),
  });
  return res.json();
};

/**
 * Send a message to a group
 * ro.am endpoint: /chat.sendMessage
 */
export const sendChatMessage = async (groupId, text) => {
  if (useMock()) {
    return { ok: true, ts: new Date().toISOString() };
  }
  const res = await fetch(`${ROAM_CONFIG.baseUrl}/chat.sendMessage`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ group: groupId, text }),
  });
  return res.json();
};

/**
 * List recordings
 * ro.am endpoint: /recording.list
 */
export const fetchRecordings = async (groupId) => {
  if (useMock()) {
    return { ok: true, recordings: [
      { id: "rec-001", groupId: "grp-exec-standup", date: "2026-02-18", duration: "28:14", status: "processed", hasTranscript: true },
      { id: "rec-002", groupId: "grp-portland-review", date: "2026-02-17", duration: "52:07", status: "processed", hasTranscript: true },
      { id: "rec-003", groupId: "grp-ir-prep", date: "2026-02-14", duration: "38:22", status: "processed", hasTranscript: false },
    ]};
  }
  const params = groupId ? `?group=${groupId}` : "";
  const res = await fetch(`${ROAM_CONFIG.baseUrl}/recording.list${params}`, { headers: headers() });
  return res.json();
};

/**
 * Get transcript info
 * ro.am endpoint: /transcript.info
 */
export const fetchTranscript = async (recordingId) => {
  if (useMock()) {
    return { ok: true, transcript: { id: recordingId, status: "complete", entries: [], summary: "" } };
  }
  const res = await fetch(`${ROAM_CONFIG.baseUrl}/transcript.info`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ recording: recordingId }),
  });
  return res.json();
};

/**
 * List users
 * ro.am endpoint: /user.list
 */
export const fetchUsers = async () => {
  if (useMock()) {
    return { ok: true, users: [] };
  }
  const res = await fetch(`${ROAM_CONFIG.baseUrl}/user.list`, { headers: headers() });
  return res.json();
};

/**
 * Subscribe to webhook events
 * ro.am endpoint: /webhook.subscribe
 */
export const subscribeWebhook = async (events = ["transcript:saved", "chat:message:dm", "lobby:booked"]) => {
  if (useMock()) {
    return { ok: true, subscriptionId: "mock-sub-001" };
  }
  const res = await fetch(`${ROAM_CONFIG.baseUrl}/webhook.subscribe`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ url: ROAM_CONFIG.webhookUrl, events }),
  });
  return res.json();
};

/**
 * Export message archive (compliance)
 * ro.am endpoint: /messageevent.export
 */
export const exportMessages = async (groupId, startDate, endDate) => {
  if (useMock()) {
    return { ok: true, messages: [], count: 0 };
  }
  const res = await fetch(`${ROAM_CONFIG.baseUrl}/messageevent.export`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ group: groupId, start: startDate, end: endDate }),
  });
  return res.json();
};

// ═══════════════════════════════════════════════════════════════════
//  SYNC UTILITIES
// ═══════════════════════════════════════════════════════════════════

/**
 * Full sync — pulls all meeting data from ro.am
 * Returns normalized data for SENS consumption
 */
export const fullSync = async () => {
  const [groups, recordings, users] = await Promise.all([
    fetchGroups(),
    fetchRecordings(),
    fetchUsers(),
  ]);

  ROAM_CONFIG.lastSync = new Date().toISOString();

  return {
    groups: groups.groups || [],
    recordings: recordings.recordings || [],
    users: users.users || [],
    syncedAt: ROAM_CONFIG.lastSync,
  };
};

/**
 * Webhook event handler — process incoming ro.am events
 */
export const handleWebhookEvent = (event) => {
  switch (event.type) {
    case "transcript:saved":
      // Auto-sync transcript into SENS
      return { action: "sync_transcript", recordingId: event.recording_id };
    case "chat:message:dm":
      // Update live chat in active meeting
      return { action: "new_message", groupId: event.group_id, message: event.message };
    case "lobby:booked":
      // Add new meeting to upcoming list
      return { action: "new_meeting", meeting: event.meeting };
    default:
      return { action: "unknown", event };
  }
};
