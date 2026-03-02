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
  // Custom agents
  getCustomAgents as storeGetCustomAgents,
  createCustomAgent as storeCreateCustomAgent,
  updateCustomAgent as storeUpdateCustomAgent,
  deleteCustomAgent as storeDeleteCustomAgent,
  isCustomAgent as storeIsCustomAgent,
  // Custom teams
  getCustomTeams as storeGetCustomTeams,
  createCustomTeam as storeCreateCustomTeam,
  updateCustomTeam as storeUpdateCustomTeam,
  deleteCustomTeam as storeDeleteCustomTeam,
} from "../data/agentConfigStore";

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
    if (storeIsCustomAgent(agentId)) {
      storeUpdateCustomAgent(agentId, patch);
    } else {
      setAgentOverride(agentId, patch);
    }
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

  // ── Custom agents ──

  const createAgent = useCallback((agent) => {
    storeCreateCustomAgent(agent);
    bump();
  }, []);

  const deleteAgent = useCallback((agentId) => {
    storeDeleteCustomAgent(agentId);
    bump();
  }, []);

  const isCustom = useCallback(
    (agentId) => storeIsCustomAgent(agentId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [configVersion]
  );

  const getCustomAgents = useCallback(
    () => storeGetCustomAgents(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [configVersion]
  );

  // ── Custom teams ──

  const getCustomTeams = useCallback(
    () => storeGetCustomTeams(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [configVersion]
  );

  const createTeam = useCallback((team) => {
    storeCreateCustomTeam(team);
    bump();
  }, []);

  const updateTeam = useCallback((teamKey, patch) => {
    storeUpdateCustomTeam(teamKey, patch);
    bump();
  }, []);

  const deleteTeam = useCallback((teamKey) => {
    storeDeleteCustomTeam(teamKey);
    bump();
  }, []);

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
        // Agent overrides
        getAgent,
        updateAgent,
        resetAgent,
        resetAllAgents,
        isAgentDirty,
        // Custom agents
        createAgent,
        deleteAgent,
        isCustom,
        getCustomAgents,
        // Custom teams
        getCustomTeams,
        createTeam,
        updateTeam,
        deleteTeam,
        // Global rules
        getGlobalRules,
        updateGlobalRules,
        resetGlobalRules,
        isGlobalRulesDirty,
        // Export/import
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
