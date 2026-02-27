import { createContext, useContext, useState, useCallback, useMemo } from "react";
import { checkAccess, getAccessibleDomains, getUserBadge, getRoleClearance } from "../data/badgeData";
import { loadUsers, saveUsers, generateMockHash, addAuditEntry, generateUserId } from "../data/userData";

const BadgeContext = createContext(null);

export const BadgeProvider = ({ children }) => {
  const [users, setUsers] = useState(() => loadUsers());
  const [activeUserId, setActiveUserId] = useState("thomas");
  const [configVersion, setConfigVersion] = useState(0);

  const refreshConfig = useCallback(() => {
    setConfigVersion((v) => v + 1);
  }, []);

  const activeUser = useMemo(
    () => users.find((u) => u.id === activeUserId) || users[0],
    [activeUserId, users]
  );

  const badge = useMemo(() => getUserBadge(activeUser), [activeUser, configVersion]);

  const switchUser = useCallback((userId) => {
    setActiveUserId(userId);
  }, []);

  const hasAccess = useCallback(
    (domain) => checkAccess(activeUser, domain).allowed,
    [activeUser, configVersion]
  );

  const checkDomain = useCallback(
    (domain) => checkAccess(activeUser, domain),
    [activeUser, configVersion]
  );

  const clearanceLevel = useMemo(
    () => getRoleClearance(activeUser.role).level,
    [activeUser, configVersion]
  );

  const accessibleDomains = useMemo(
    () => getAccessibleDomains(activeUser),
    [activeUser, configVersion]
  );

  // ── CRUD Methods ──

  const addUser = useCallback((userData) => {
    const now = new Date().toISOString();
    const newUser = {
      id: userData.id || generateUserId(userData.name),
      name: userData.name,
      role: userData.role,
      department: userData.department,
      email: userData.email,
      overrides: userData.overrides || [],
      landingPage: userData.landingPage || null,
      status: userData.status || "active",
      passwordHash: generateMockHash(userData.password || "changeme"),
      mustChangePassword: userData.mustChangePassword ?? true,
      lastLogin: null,
      lastPasswordChange: now,
      createdAt: now,
      createdBy: activeUser.name,
      modifiedAt: now,
      modifiedBy: activeUser.name,
      mfaEnabled: userData.mfaEnabled ?? false,
      ssoProvider: userData.ssoProvider || null,
      notes: userData.notes || "",
    };
    setUsers((prev) => {
      const next = [...prev, newUser];
      saveUsers(next);
      return next;
    });
    addAuditEntry("user_created", newUser.name, activeUser.name, `Role: ${newUser.role}, Dept: ${newUser.department}`);
    return newUser;
  }, [activeUser]);

  const updateUser = useCallback((userId, updates) => {
    setUsers((prev) => {
      const next = prev.map((u) =>
        u.id === userId
          ? { ...u, ...updates, modifiedAt: new Date().toISOString(), modifiedBy: activeUser.name }
          : u
      );
      saveUsers(next);
      return next;
    });
    const changedFields = Object.keys(updates).filter((k) => k !== "modifiedAt" && k !== "modifiedBy").join(", ");
    addAuditEntry("user_updated", userId, activeUser.name, `Changed: ${changedFields}`);
  }, [activeUser]);

  const deleteUser = useCallback((userId) => {
    const target = users.find((u) => u.id === userId);
    setUsers((prev) => {
      const next = prev.filter((u) => u.id !== userId);
      saveUsers(next);
      return next;
    });
    if (target) addAuditEntry("user_deleted", target.name, activeUser.name);
  }, [activeUser, users]);

  const resetPassword = useCallback((userId, newPassword, forceChange = true) => {
    const now = new Date().toISOString();
    setUsers((prev) => {
      const next = prev.map((u) =>
        u.id === userId
          ? { ...u, passwordHash: generateMockHash(newPassword), mustChangePassword: forceChange, lastPasswordChange: now, modifiedAt: now, modifiedBy: activeUser.name }
          : u
      );
      saveUsers(next);
      return next;
    });
    const target = users.find((u) => u.id === userId);
    addAuditEntry("password_reset", target?.name || userId, activeUser.name, forceChange ? "Force change on next login" : "No force change");
  }, [activeUser, users]);

  const bulkUpdateStatus = useCallback((userIds, status) => {
    const now = new Date().toISOString();
    setUsers((prev) => {
      const next = prev.map((u) =>
        userIds.includes(u.id)
          ? { ...u, status, modifiedAt: now, modifiedBy: activeUser.name }
          : u
      );
      saveUsers(next);
      return next;
    });
    addAuditEntry("bulk_status_change", `${userIds.length} users`, activeUser.name, `Status → ${status}`);
  }, [activeUser]);

  const value = useMemo(
    () => ({
      activeUser,
      badge,
      switchUser,
      hasAccess,
      checkDomain,
      clearanceLevel,
      accessibleDomains,
      allUsers: users,
      addUser,
      updateUser,
      deleteUser,
      resetPassword,
      bulkUpdateStatus,
      configVersion,
      refreshConfig,
    }),
    [activeUser, badge, switchUser, hasAccess, checkDomain, clearanceLevel, accessibleDomains, users, addUser, updateUser, deleteUser, resetPassword, bulkUpdateStatus, configVersion, refreshConfig]
  );

  return (
    <BadgeContext.Provider value={value}>{children}</BadgeContext.Provider>
  );
};

export const useBadge = () => {
  const ctx = useContext(BadgeContext);
  if (!ctx) throw new Error("useBadge must be used within BadgeProvider");
  return ctx;
};
