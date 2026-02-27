import { BADGE_USERS, ROLE_CLEARANCE } from "./badgeData";

// ═══ STORAGE KEYS ══════════════════════════════════════════════════════
const USERS_KEY = "sens-users";
const AUDIT_KEY = "sens-audit-log";

// ═══ DEFAULT USERS (enhanced from BADGE_USERS) ═══════════════════════
const now = new Date().toISOString();

export const DEFAULT_USERS = BADGE_USERS.map((u) => ({
  ...u,
  status: "active",
  passwordHash: "mock-hash-" + u.id,
  mustChangePassword: false,
  lastLogin: now,
  lastPasswordChange: now,
  createdAt: "2025-01-15T00:00:00.000Z",
  createdBy: "system",
  modifiedAt: now,
  modifiedBy: "system",
  mfaEnabled: ["david", "thomas", "sarah", "james", "lena", "marcus"].includes(u.id),
  ssoProvider: null,
  notes: "",
  landingPage: null,
}));

// ═══ PERSISTENCE ═════════════════════════════════════════════════════
export function loadUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return [...DEFAULT_USERS];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return [...DEFAULT_USERS];
    return parsed;
  } catch {
    return [...DEFAULT_USERS];
  }
}

export function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function resetUsersToDefault() {
  localStorage.removeItem(USERS_KEY);
  return [...DEFAULT_USERS];
}

// ═══ MOCK PASSWORD UTILS ═══════════════════════════════════════════════
export function generateMockHash(password) {
  return "mock-hash-" + btoa(password).slice(0, 12);
}

export function generateRandomPassword(length = 12) {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ═══ USER ID GENERATION ════════════════════════════════════════════════
export function generateUserId(name) {
  const base = name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return base || "user-" + Date.now();
}

// ═══ AUDIT LOG ═════════════════════════════════════════════════════════
export function loadAuditLog() {
  try {
    const raw = localStorage.getItem(AUDIT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addAuditEntry(action, targetUser, changedBy, details = "") {
  const log = loadAuditLog();
  log.unshift({
    id: "audit-" + Date.now(),
    timestamp: new Date().toISOString(),
    action,
    targetUser,
    changedBy,
    details,
  });
  // Keep last 200 entries
  if (log.length > 200) log.length = 200;
  localStorage.setItem(AUDIT_KEY, JSON.stringify(log));
  return log;
}

export function clearAuditLog() {
  localStorage.removeItem(AUDIT_KEY);
}

// ═══ VALIDATION ════════════════════════════════════════════════════════
export function validateUser(user, existingUsers, isNew = true) {
  const errors = [];
  if (!user.name?.trim()) errors.push("Name is required");
  if (!user.email?.trim()) errors.push("Email is required");
  if (user.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) errors.push("Invalid email format");
  if (!user.role) errors.push("Role is required");
  if (!user.department?.trim()) errors.push("Department is required");
  if (isNew && existingUsers.some((u) => u.email.toLowerCase() === user.email?.toLowerCase())) {
    errors.push("Email already in use");
  }
  if (isNew && existingUsers.some((u) => u.id === user.id)) {
    errors.push("User ID already exists");
  }
  return errors;
}

// ═══ AVAILABLE ROLES ═══════════════════════════════════════════════════
export const AVAILABLE_ROLES = ROLE_CLEARANCE.map((r) => r.role);

export const AVAILABLE_DEPARTMENTS = [
  "Executive", "Engineering", "Operations", "Finance", "Strategy",
  "Risk", "People", "Maintenance", "Logistics", "Legal", "IT",
];

export const USER_STATUSES = ["active", "inactive", "locked"];
