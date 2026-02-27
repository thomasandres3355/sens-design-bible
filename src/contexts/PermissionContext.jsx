import { createContext, useContext, useState, useCallback, useMemo } from "react";
import { useBadge } from "./BadgeContext";
import { checkModulePermission, checkVpAccess, getVisibleModules, getModuleActions } from "../data/permissionData";

const PermissionContext = createContext(null);

export const PermissionProvider = ({ children }) => {
  const { activeUser } = useBadge();
  const [configVersion, setConfigVersion] = useState(0);

  const refreshPermConfig = useCallback(() => {
    setConfigVersion((v) => v + 1);
  }, []);

  const visibleModules = useMemo(
    () => getVisibleModules(activeUser),
    [activeUser, configVersion]
  );

  const can = useCallback(
    (module, action) => checkModulePermission(activeUser, module, action).allowed,
    [activeUser, configVersion]
  );

  const check = useCallback(
    (module, action) => checkModulePermission(activeUser, module, action),
    [activeUser, configVersion]
  );

  const canAccessVp = useCallback(
    (vpKey) => checkVpAccess(activeUser, vpKey).allowed,
    [activeUser, configVersion]
  );

  const getActions = useCallback(
    (module) => getModuleActions(activeUser, module),
    [activeUser, configVersion]
  );

  const value = useMemo(() => ({
    visibleModules,
    can,
    check,
    canAccessVp,
    getActions,
    configVersion,
    refreshPermConfig,
  }), [visibleModules, can, check, canAccessVp, getActions, configVersion, refreshPermConfig]);

  return (
    <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>
  );
};

export const usePermissions = () => {
  const ctx = useContext(PermissionContext);
  if (!ctx) throw new Error("usePermissions must be used within PermissionProvider");
  return ctx;
};
