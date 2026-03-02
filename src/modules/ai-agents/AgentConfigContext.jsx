import { createContext, useContext, useState, useCallback } from "react";
import {
  getAgentOverrides,
  setAgentOverride,
  clearAgentOverride,
  clearAllOverrides,
  isAgentOverridden,
  getEffectiveAgent,
  getGlobalRules as storeGetGlobalRules,
  setGlobalRules as storeSetGlobalRules,
  clearGlobalRules as storeClearGlobalRules,
  isGlobalRulesOverridden,
  exportConfig as storeExport,
  importConfig as storeImport,
} from "./agentConfigStore";

const AgentConfigContext = createContext(null);

export const AgentConfigProvider = ({ children }) => {
  const [configVersion, setConfigVersion] = useState(0);
  const bump = () => setConfigVersion((v) => v + 1);

  // ── Agent overrides ──

  const getAgent = useCallback(
    (agentId) => getEffectiveAgent(agentId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [configVersion]
  );

  const updateAgent = useCallback((agentId, patch) => {
    setAgentOverride(agentId, patch);
    bump();
  }, []);

  const resetAgent = useCallback((agentId) => {
    clearAgentOverride(agentId);
    bump();
  }, []);

  const resetAllAgents = useCallback(() => {
    clearAllOverrides();
    bump();
  }, []);

  const isAgentDirty = useCallback(
    (agentId) => isAgentOverridden(agentId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [configVersion]
  );

  // ── Global rules ──

  const getGlobalRules = useCallback(
    () => storeGetGlobalRules(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [configVersion]
  );

  const updateGlobalRules = useCallback((patch) => {
    storeSetGlobalRules(patch);
    bump();
  }, []);

  const resetGlobalRules = useCallback(() => {
    storeClearGlobalRules();
    bump();
  }, []);

  const isGlobalRulesDirty = useCallback(
    () => isGlobalRulesOverridden(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [configVersion]
  );

  // ── Export / Import ──

  const exportAgentConfig = useCallback(() => storeExport(), []);

  const importAgentConfig = useCallback((data) => {
    storeImport(data);
    bump();
  }, []);

  return (
    <AgentConfigContext.Provider
      value={{
        configVersion,
        getAgent,
        updateAgent,
        resetAgent,
        resetAllAgents,
        isAgentDirty,
        getGlobalRules,
        updateGlobalRules,
        resetGlobalRules,
        isGlobalRulesDirty,
        exportConfig: exportAgentConfig,
        importConfig: importAgentConfig,
      }}
    >
      {children}
    </AgentConfigContext.Provider>
  );
};

export const useAgentConfig = () => {
  const ctx = useContext(AgentConfigContext);
  if (!ctx) throw new Error("useAgentConfig must be used within AgentConfigProvider");
  return ctx;
};
