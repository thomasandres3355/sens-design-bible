import { useState, useMemo, useCallback } from "react";
import { T } from "@core/theme/theme";
import { Card, TabBar, DataTable, StatusPill, KpiCard, EngineLight, DraggableGrid, DraggableCardRow } from "@core/ui";
import { configureRoam, getRoamStatus } from "./roamService";
import { tagRegistry } from "@modules/ai-agents/meetingData";
import { CLEARANCE_LEVELS, DATA_CLASSIFICATIONS, ROLE_CLEARANCE, checkAccess, getAccessibleDomains, getUserBadge, saveBadgeConfig, resetBadgeConfig, isBadgeConfigDirty } from "@core/users/badgeData";
import { isCustomAgent as storeIsCustomAgent, getCustomAgents as storeGetCustomAgents, getCustomTeams as storeGetCustomTeams } from "@modules/ai-agents/agentConfigStore";
import { useBadge } from "@core/users/BadgeContext";
import { getApiKey, setApiKey, isLiveMode, setLiveMode, testConnection } from "@modules/ai-agents/services/claudeService";
import { getUsageSummary, getUsageByUser, getUsageByAgent, getDailyUsage, clearUsageData } from "@modules/ai-agents/services/usageTracker";
import { isAgentContribEnabled, setAgentContribEnabled, getAgentContribInterval, setAgentContribInterval, getAgentContribSensitivity, setAgentContribSensitivity } from "@modules/ai-agents/services/factCheckService";
import UserManagementPanel from "./UserManagementPanel";
import LandingPageEditorPanel from "./LandingPageEditorPanel";
import { usePermissions } from "@core/permissions/PermissionContext";
import { MODULE_PERMISSIONS, MODULE_LABELS, VP_DASHBOARD_ACCESS, checkModulePermission, checkVpAccess, savePermissionConfig, resetPermissionConfig, isPermissionConfigDirty } from "@core/permissions/permissionData";
import { PermissionGate } from "@core/permissions/PermissionGate";
import { useAgentConfig } from "@modules/ai-agents/AgentConfigContext";
import { ceoAgentTeam, cooAgentTeam, vpRegistry, agentIndex } from "@modules/ai-agents/vpData";
import { DEFAULT_ACCESS_CONTROL_RULES, DEFAULT_RESPONSE_GUIDELINES } from "@modules/ai-agents/agentConfigStore";

/* ─────────────────────────────────────────────
   Settings View — User Config · Access · Integrations · API · IoT
   ───────────────────────────────────────────── */

// ── Integration registry ──
const integrations = [
  // Enterprise Core
  { name: "Oracle Financials", category: "ERP / Finance", status: "connected", scope: "All Sites", dataFlow: "847 API calls/day", protocol: "REST API", auth: "OAuth 2.0", owner: "VP Finance", notes: "P&L, cash mgmt, capex, AR/AP" },
  { name: "Oracle P6", category: "Project Mgmt", status: "degraded", scope: "Construction", dataFlow: "4 tables synced", protocol: "REST API", auth: "Service Account", owner: "VP Engineering", notes: "45 sec latency — under investigation" },
  { name: "Oracle EAM", category: "Asset Mgmt", status: "connected", scope: "5 Operational Sites", dataFlow: "Real-time", protocol: "REST API", auth: "Service Account", owner: "VP Maintenance", notes: "Work orders, equipment registry, CMMS" },
  { name: "Oracle MES", category: "Manufacturing", status: "connected", scope: "5 Operational Sites", dataFlow: "Real-time", protocol: "REST API", auth: "Service Account", owner: "VP Plant Ops", notes: "Production reports, batch tracking" },

  // Operations & IoT
  { name: "SCADA Gateway", category: "Industrial Control", status: "connected", scope: "5 Operational Sites", dataFlow: "48 streams / 1 sec", protocol: "OPC-UA / Modbus", auth: "Certificate", owner: "VP Plant Ops", notes: "Reactor temp, pressure, flow, quality" },
  { name: "OSIsoft PI", category: "Data Historian", status: "connected", scope: "5 Operational Sites", dataFlow: "2.4M pts/day", protocol: "PI Web API", auth: "Kerberos", owner: "VP Maintenance", notes: "Time-series for predictive maintenance" },
  { name: "AWS IoT Core", category: "IoT Platform", status: "connected", scope: "5 Operational Sites", dataFlow: "48 devices", protocol: "MQTT / HTTPS", auth: "X.509 Certs", owner: "VP IT", notes: "Device shadow, telemetry routing" },
  { name: "AWS S3", category: "Data Lake", status: "connected", scope: "All", dataFlow: "2.1 TB/day", protocol: "S3 API", auth: "IAM Role", owner: "VP IT", notes: "Raw sensor data, logs, backups" },

  // Safety & Compliance
  { name: "WakeCap", category: "Worker Safety", status: "connected", scope: "Active Construction", dataFlow: "Real-time", protocol: "REST API", auth: "API Key", owner: "VP Risk & HSE", notes: "Worker location, zone density, permits" },
  { name: "GOARC", category: "Permit Mgmt", status: "connected", scope: "All Sites", dataFlow: "Real-time", protocol: "REST API", auth: "API Key", owner: "VP Risk & HSE", notes: "Hot work permits, spatial overlap detection" },
  { name: "Veriforce", category: "Contractor Compliance", status: "connected", scope: "All Contractors", dataFlow: "15 min sync", protocol: "REST API", auth: "API Key", owner: "VP Risk & HSE", notes: "Prequalification, certs, insurance, TRIR" },

  // Construction & Design
  { name: "Procore", category: "Construction Mgmt", status: "connected", scope: "Construction Sites", dataFlow: "Daily sync", protocol: "REST API", auth: "OAuth 2.0", owner: "VP Engineering", notes: "Daily reports, photos, RFIs, punch lists" },
  { name: "Autodesk Vault", category: "Design Mgmt", status: "connected", scope: "Engineering", dataFlow: "On-demand", protocol: "REST API", auth: "OAuth 2.0", owner: "VP R&D", notes: "CAD models, design revisions, BOM" },
  { name: "SolidWorks PDM", category: "PDM", status: "connected", scope: "Engineering", dataFlow: "On-demand", protocol: "API", auth: "LDAP", owner: "VP R&D", notes: "Change orders, bill of materials" },

  // Business Systems
  { name: "Salesforce", category: "CRM", status: "connected", scope: "Sales & Investor Relations", dataFlow: "Real-time", protocol: "REST API", auth: "OAuth 2.0", owner: "VP Business Dev", notes: "Pipeline, investors, board deck tracking" },
  { name: "DocuSign", category: "Contract Mgmt", status: "connected", scope: "Legal", dataFlow: "Webhook", protocol: "REST API", auth: "OAuth 2.0", owner: "VP Legal", notes: "Signature workflows, term sheets" },
  { name: "LabWare LIMS", category: "Lab / Quality", status: "connected", scope: "5 Operational Sites", dataFlow: "Batch sync", protocol: "REST API", auth: "API Key", owner: "VP Quality", notes: "Iodine, tensile, particle, moisture testing" },

  // Collaboration
  { name: "ro.am", category: "Virtual HQ", status: "connected", scope: "Executive Team", dataFlow: "Real-time + Webhooks", protocol: "REST API", auth: "Bearer Token", owner: "CEO", notes: "Meeting rooms, Magic Minutes, transcripts, recordings, chat" },
  { name: "Google Workspace", category: "Collaboration", status: "connected", scope: "All Users", dataFlow: "Real-time", protocol: "Google API", auth: "OAuth 2.0", owner: "VP IT", notes: "Email, calendar, Drive" },
  { name: "Slack", category: "Messaging", status: "connected", scope: "All Teams", dataFlow: "Webhook", protocol: "REST API", auth: "Bot Token", owner: "VP IT", notes: "Alerts, escalation channels" },
  { name: "Notion", category: "Knowledge Mgmt", status: "connected", scope: "Executive", dataFlow: "API sync", protocol: "REST API", auth: "API Key", owner: "COO", notes: "Initiative tracking, decision logs" },
  { name: "PagerDuty", category: "Escalation", status: "connected", scope: "All Depts", dataFlow: "Webhook", protocol: "REST API", auth: "API Key", owner: "VP IT", notes: "Cross-functional SLA enforcement" },

  // Intelligence
  { name: "PatSnap", category: "IP Intelligence", status: "connected", scope: "R&D / Legal", dataFlow: "Daily", protocol: "REST API", auth: "API Key", owner: "VP R&D", notes: "Patent landscape monitoring" },
  { name: "Google Patents", category: "Prior Art", status: "connected", scope: "R&D", dataFlow: "On-demand", protocol: "Public API", auth: "API Key", owner: "VP R&D", notes: "Prior art analysis for coal IP" },
  { name: "Splunk", category: "Log Analytics", status: "connected", scope: "All Systems", dataFlow: "18.4M events/day", protocol: "REST API", auth: "Token", owner: "VP IT", notes: "Centralized logging, security events" },

  // Pending / Planned
  { name: "SAP Ariba", category: "Procurement", status: "pending", scope: "Supply Chain", dataFlow: "—", protocol: "REST API", auth: "OAuth 2.0", owner: "VP Supply Chain", notes: "Vendor mgmt, purchase orders — Q3 2026" },
  { name: "Bloomberg Terminal", category: "Market Data", status: "pending", scope: "Finance / Strategy", dataFlow: "—", protocol: "B-PIPE", auth: "Enterprise License", owner: "VP Finance", notes: "Commodity pricing, competitor analysis" },
  { name: "S&P Capital IQ", category: "Market Intelligence", status: "pending", scope: "Finance", dataFlow: "—", protocol: "REST API", auth: "API Key", owner: "VP Finance", notes: "Market sizing, peer valuation — planned" },
];

// ── IoT Device Registry ──
const iotDevices = [
  { id: "TEMP-01", type: "Temperature", location: "Reactor", site: "Noble OK", protocol: "MQTT", threshold: "< 425°F", status: "online", lastReading: "412°F", updated: "2 sec ago" },
  { id: "TEMP-02", type: "Temperature", location: "Distillation Column", site: "Noble OK", protocol: "MQTT", threshold: "< 350°F", status: "online", lastReading: "338°F", updated: "2 sec ago" },
  { id: "TEMP-03", type: "Temperature", location: "Heat Exchanger", site: "Richmond VA", protocol: "MQTT", threshold: "< 400°F", status: "online", lastReading: "387°F", updated: "3 sec ago" },
  { id: "VIB-01", type: "Vibration", location: "Conveyor Belt", site: "Noble OK", protocol: "MQTT", threshold: "< 4.0 mm/s", status: "online", lastReading: "2.8 mm/s", updated: "1 sec ago" },
  { id: "VIB-02", type: "Vibration", location: "Feed Auger", site: "Mesa AZ", protocol: "MQTT", threshold: "< 3.5 mm/s", status: "warning", lastReading: "3.3 mm/s", updated: "2 sec ago" },
  { id: "AMP-01", type: "Electrical", location: "Feed Auger Motor", site: "Noble OK", protocol: "Modbus", threshold: "< 22A", status: "online", lastReading: "18.4A", updated: "1 sec ago" },
  { id: "AMP-02", type: "Electrical", location: "Loading Pump", site: "Baton Rouge LA", protocol: "Modbus", threshold: "< 15A", status: "online", lastReading: "11.2A", updated: "1 sec ago" },
  { id: "PRES-01", type: "Pressure", location: "Reactor Vessel", site: "Noble OK", protocol: "MQTT", threshold: "< 45 PSI", status: "online", lastReading: "38.6 PSI", updated: "2 sec ago" },
  { id: "PRES-02", type: "Pressure", location: "Distillation", site: "Richmond VA", protocol: "MQTT", threshold: "< 30 PSI", status: "online", lastReading: "24.1 PSI", updated: "3 sec ago" },
  { id: "FLOW-01", type: "Flow", location: "Diluent Output", site: "Noble OK", protocol: "MQTT", threshold: "> 50 GPM", status: "online", lastReading: "62.4 GPM", updated: "1 sec ago" },
  { id: "FLOW-02", type: "Flow", location: "Feedstock Input", site: "Mesa AZ", protocol: "Modbus", threshold: "> 2.0 TPH", status: "online", lastReading: "1.9 TPH", updated: "2 sec ago" },
  { id: "QUAL-01", type: "Quality", location: "Carbon Black Lab", site: "Noble OK", protocol: "REST", threshold: "Iodine > 40", status: "online", lastReading: "42.8", updated: "15 min ago" },
];

// ── API Endpoints Registry ──
const apiEndpoints = [
  { endpoint: "/api/v1/sites", method: "GET", service: "Executive Intelligence Platform", purpose: "All site operational data", rateLimit: "100/min", auth: "Bearer Token" },
  { endpoint: "/api/v1/sites/{id}/kpis", method: "GET", service: "Executive Intelligence Platform", purpose: "Per-site KPI metrics", rateLimit: "100/min", auth: "Bearer Token" },
  { endpoint: "/api/v1/production/daily", method: "GET", service: "Oracle MES", purpose: "Daily production output", rateLimit: "60/min", auth: "Service Account" },
  { endpoint: "/api/v1/maintenance/workorders", method: "GET/POST", service: "Oracle EAM", purpose: "Work order CRUD", rateLimit: "60/min", auth: "Service Account" },
  { endpoint: "/api/v1/finance/pnl", method: "GET", service: "Oracle Financials", purpose: "P&L actuals vs budget", rateLimit: "30/min", auth: "OAuth 2.0" },
  { endpoint: "/api/v1/finance/cash", method: "GET", service: "Oracle Financials", purpose: "Cash position & runway", rateLimit: "30/min", auth: "OAuth 2.0" },
  { endpoint: "/api/v1/construction/milestones", method: "GET", service: "Oracle P6", purpose: "Project milestones & gates", rateLimit: "30/min", auth: "Service Account" },
  { endpoint: "/api/v1/construction/schedule", method: "GET", service: "Oracle P6 / Procore", purpose: "Gantt schedule data", rateLimit: "30/min", auth: "Service Account" },
  { endpoint: "/api/v1/safety/zones", method: "GET", service: "WakeCap", purpose: "Zone density & worker count", rateLimit: "60/min", auth: "API Key" },
  { endpoint: "/api/v1/safety/permits", method: "GET/POST", service: "GOARC", purpose: "Active permits, spatial overlap", rateLimit: "60/min", auth: "API Key" },
  { endpoint: "/api/v1/compliance/contractors", method: "GET", service: "Veriforce", purpose: "Contractor scores, certs, insurance", rateLimit: "30/min", auth: "API Key" },
  { endpoint: "/api/v1/iot/devices", method: "GET", service: "AWS IoT Core", purpose: "Device registry & shadows", rateLimit: "100/min", auth: "IAM / X.509" },
  { endpoint: "/api/v1/iot/telemetry", method: "GET", service: "AWS IoT Core", purpose: "Real-time sensor readings", rateLimit: "200/min", auth: "IAM / X.509" },
  { endpoint: "/api/v1/scada/streams", method: "GET", service: "SCADA Gateway", purpose: "Live process data (48 streams)", rateLimit: "Unlimited", auth: "Certificate" },
  { endpoint: "/api/v1/historian/query", method: "POST", service: "OSIsoft PI", purpose: "Historical time-series query", rateLimit: "30/min", auth: "Kerberos" },
  { endpoint: "/api/v1/agents/tasks", method: "GET/POST", service: "SENS AI", purpose: "Agent task queue & results", rateLimit: "200/min", auth: "Internal" },
  { endpoint: "/api/v1/alerts", method: "GET", service: "Executive Intelligence Platform", purpose: "Active alerts & escalations", rateLimit: "100/min", auth: "Bearer Token" },
  { endpoint: "/api/v1/lab/results", method: "GET", service: "LabWare LIMS", purpose: "Lab batch test results", rateLimit: "30/min", auth: "API Key" },
  { endpoint: "/api/v1/crm/pipeline", method: "GET", service: "Salesforce", purpose: "Sales & investor pipeline", rateLimit: "30/min", auth: "OAuth 2.0" },
  { endpoint: "/api/v1/contracts/status", method: "GET", service: "DocuSign", purpose: "Contract signature status", rateLimit: "30/min", auth: "OAuth 2.0" },
  { endpoint: "/api/v1/meetings/groups", method: "GET", service: "ro.am", purpose: "Meeting rooms & groups", rateLimit: "60/min", auth: "Bearer Token" },
  { endpoint: "/api/v1/meetings/recordings", method: "GET", service: "ro.am", purpose: "Recording list & transcripts", rateLimit: "60/min", auth: "Bearer Token" },
  { endpoint: "/api/v1/meetings/chat", method: "GET/POST", service: "ro.am", purpose: "Chat history & send message", rateLimit: "100/min", auth: "Bearer Token" },
  { endpoint: "/api/v1/meetings/webhooks", method: "POST", service: "ro.am", purpose: "Webhook event subscription", rateLimit: "10/min", auth: "Bearer Token" },
];

// ── Users & Roles — now managed by UserManagementPanel ──

// ── Mini components ──
const Badge = ({ label, color }) => (
  <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: color + "20", color, fontWeight: 600, whiteSpace: "nowrap" }}>{label}</span>
);

const IntegrationCard = ({ item }) => {
  const statusColor = item.status === "connected" ? T.green : item.status === "degraded" ? T.warn : T.textDim;
  return (
    <div style={{ background: T.bg2, borderRadius: 10, padding: "14px 16px", border: `1px solid ${T.border}`, display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{item.name}</span>
        <Badge label={item.status} color={statusColor} />
      </div>
      <div style={{ fontSize: 11, color: T.textMid }}>{item.category}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 2 }}>
        <Badge label={item.protocol} color={T.blue} />
        <Badge label={item.auth} color={T.purple} />
        <Badge label={item.scope} color={T.teal} />
      </div>
      <div style={{ fontSize: 11, color: T.textDim, marginTop: 4 }}>
        <strong style={{ color: T.textMid }}>Data:</strong> {item.dataFlow} &nbsp;·&nbsp;
        <strong style={{ color: T.textMid }}>Owner:</strong> {item.owner}
      </div>
      <div style={{ fontSize: 10, color: T.textDim, fontStyle: "italic" }}>{item.notes}</div>
    </div>
  );
};

// ═══════════════════════════════════════════════
//  ro.am Integration Settings Panel
// ═══════════════════════════════════════════════
const RoamSettingsPanel = () => {
  const [token, setToken] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("https://sens.systemicenvs.com/api/webhooks/roam");
  const [testStatus, setTestStatus] = useState(null); // null | "testing" | "success" | "error"
  const [syncStatus, setSyncStatus] = useState("idle"); // idle | syncing | synced
  const [autoSync, setAutoSync] = useState(true);
  const [syncInterval, setSyncInterval] = useState("5");
  const [enabledEvents, setEnabledEvents] = useState({ "transcript:saved": true, "chat:message:dm": true, "lobby:booked": true, "recording:started": false, "recording:stopped": true });
  const roamStatus = getRoamStatus();

  const handleTestConnection = () => {
    setTestStatus("testing");
    setTimeout(() => {
      if (token.trim().length > 10) {
        configureRoam({ token, webhookUrl });
        setTestStatus("success");
      } else {
        setTestStatus(token.trim() ? "success" : "error");
      }
    }, 1500);
  };

  const handleSync = () => {
    setSyncStatus("syncing");
    setTimeout(() => setSyncStatus("synced"), 2000);
  };

  const InputRow = ({ label, value, onChange, placeholder, type = "text", mono = false }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${T.border}` }}>
      <span style={{ fontSize: 12, color: T.textMid, minWidth: 160, fontWeight: 500 }}>{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={{ flex: 1, background: T.bg0, border: `1px solid ${T.border}`, borderRadius: 6, padding: "8px 12px", color: T.text, fontSize: 12, outline: "none", fontFamily: mono ? "monospace" : "inherit" }} onFocus={(e) => (e.currentTarget.style.borderColor = T.accent)} onBlur={(e) => (e.currentTarget.style.borderColor = T.border)} />
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Connection Status */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <EngineLight on={false} color={roamStatus.connected ? T.green : T.textDim} label={roamStatus.connected ? "Connected" : "Not Connected"} />
        <EngineLight on={!roamStatus.hasToken} color={T.warn} label={roamStatus.hasToken ? "Token Set" : "No Token"} />
        <EngineLight on={syncStatus === "syncing"} color={T.blue} label={syncStatus === "synced" ? "Synced" : syncStatus === "syncing" ? "Syncing..." : "Not Synced"} />
      </div>

      <DraggableCardRow
        items={[
          { id: "roam-connection", render: () => <KpiCard label="Connection" value={roamStatus.connected ? "Active" : "Inactive"} sub={roamStatus.lastSync ? `Last sync: ${roamStatus.lastSync}` : "Never synced"} color={roamStatus.connected ? T.green : T.textDim} /> },
          { id: "roam-apiversion", render: () => <KpiCard label="API Version" value="v1" sub="developer.ro.am" color={T.accent} /> },
          { id: "roam-webhooks", render: () => <KpiCard label="Webhook Events" value={Object.values(enabledEvents).filter(Boolean).length} sub={`of ${Object.keys(enabledEvents).length} available`} color={T.blue} /> },
          { id: "roam-syncinterval", render: () => <KpiCard label="Sync Interval" value={`${syncInterval}m`} sub={autoSync ? "auto-sync on" : "manual only"} color={T.purple} /> },
        ]}
        storageKey="sens-settings-roam-cards-kpis"
        locked={true}
      />

      {/* API Configuration */}
      <Card title="API Configuration" titleColor={T.accent}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <InputRow label="API Token" value={token} onChange={setToken} placeholder="roam_xxxxxxxxxxxxxxxxxxxx" type="password" mono />
          <InputRow label="Webhook URL" value={webhookUrl} onChange={setWebhookUrl} placeholder="https://your-server.com/webhooks/roam" mono />
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${T.border}` }}>
            <span style={{ fontSize: 12, color: T.textMid, minWidth: 160, fontWeight: 500 }}>Auto Sync</span>
            <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
              <input type="checkbox" checked={autoSync} onChange={(e) => setAutoSync(e.target.checked)} style={{ accentColor: T.accent }} />
              <span style={{ fontSize: 12, color: T.text }}>Enable automatic sync</span>
            </label>
          </div>
          {autoSync && (
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${T.border}` }}>
              <span style={{ fontSize: 12, color: T.textMid, minWidth: 160, fontWeight: 500 }}>Sync Interval</span>
              <select value={syncInterval} onChange={(e) => setSyncInterval(e.target.value)} style={{ background: T.bg0, border: `1px solid ${T.border}`, borderRadius: 6, padding: "8px 12px", color: T.text, fontSize: 12, outline: "none" }}>
                <option value="1">Every 1 minute</option>
                <option value="5">Every 5 minutes</option>
                <option value="15">Every 15 minutes</option>
                <option value="30">Every 30 minutes</option>
                <option value="60">Every 60 minutes</option>
              </select>
            </div>
          )}
          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <button onClick={handleTestConnection} disabled={testStatus === "testing"} style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 16px", color: testStatus === "success" ? T.green : testStatus === "error" ? T.danger : T.text, fontSize: 12, fontWeight: 600, cursor: testStatus === "testing" ? "default" : "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              {testStatus === "testing" ? "Testing..." : testStatus === "success" ? "Connected" : testStatus === "error" ? "Failed — Check Token" : "Test Connection"}
            </button>
            <button onClick={handleSync} disabled={syncStatus === "syncing"} style={{ background: T.accent, border: "none", borderRadius: 8, padding: "8px 16px", color: "#1A1A1A", fontSize: 12, fontWeight: 600, cursor: syncStatus === "syncing" ? "default" : "pointer" }}>
              {syncStatus === "syncing" ? "Syncing..." : syncStatus === "synced" ? "Sync Complete" : "Full Sync Now"}
            </button>
          </div>
        </div>
      </Card>

      {/* Webhook Events */}
      <Card title="Webhook Event Subscriptions" titleColor={T.blue}>
        <div style={{ fontSize: 12, color: T.textMid, marginBottom: 12, lineHeight: 1.5 }}>
          Choose which ro.am events trigger real-time updates in SENS. Events are delivered via webhook to your configured URL.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {[
            { event: "transcript:saved", label: "Transcript Saved", desc: "When Magic Minutes finishes processing a recording transcript" },
            { event: "chat:message:dm", label: "Direct Message", desc: "When a new DM is received in a meeting group" },
            { event: "lobby:booked", label: "Meeting Booked", desc: "When a new meeting is scheduled via ro.am lobby" },
            { event: "recording:started", label: "Recording Started", desc: "When a meeting recording begins" },
            { event: "recording:stopped", label: "Recording Stopped", desc: "When a meeting recording ends and is ready for processing" },
          ].map(({ event, label, desc }) => (
            <div key={event} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", background: enabledEvents[event] ? T.accent + "06" : "transparent", border: `1px solid ${enabledEvents[event] ? T.accent + "20" : T.border}`, borderRadius: 8 }}>
              <input type="checkbox" checked={enabledEvents[event]} onChange={() => setEnabledEvents(ev => ({ ...ev, [event]: !ev[event] }))} style={{ marginTop: 2, accentColor: T.accent }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{label}</div>
                <div style={{ fontSize: 11, color: T.textDim, marginTop: 2 }}>{desc}</div>
              </div>
              <span style={{ fontSize: 10, fontFamily: "monospace", color: T.textDim, padding: "2px 6px", background: T.bg0, borderRadius: 4 }}>{event}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* API Endpoints Reference */}
      <Card title="ro.am API Endpoints (v1)" titleColor={T.purple}>
        <DataTable
          compact
          columns={["Endpoint", "Method", "Purpose", "SENS Usage", "Status"]}
          rows={[
            [<span style={{ fontFamily: "monospace", fontSize: 11, color: T.accent }}>/groups.list</span>, <Badge label="GET" color={T.green} />, "List meeting rooms/groups", "Meeting list, calendar sync", <Badge label="active" color={T.green} />],
            [<span style={{ fontFamily: "monospace", fontSize: 11, color: T.accent }}>/chat.history</span>, <Badge label="POST" color={T.warn} />, "Fetch chat messages", "Team chat in meetings", <Badge label="active" color={T.green} />],
            [<span style={{ fontFamily: "monospace", fontSize: 11, color: T.accent }}>/chat.sendMessage</span>, <Badge label="POST" color={T.warn} />, "Send message to group", "Reply from SENS (future)", <Badge label="planned" color={T.textDim} />],
            [<span style={{ fontFamily: "monospace", fontSize: 11, color: T.accent }}>/recording.list</span>, <Badge label="GET" color={T.green} />, "List recordings", "Recording archive, sync", <Badge label="active" color={T.green} />],
            [<span style={{ fontFamily: "monospace", fontSize: 11, color: T.accent }}>/transcript.info</span>, <Badge label="POST" color={T.warn} />, "Get transcript data", "Magic Minutes, transcript view", <Badge label="active" color={T.green} />],
            [<span style={{ fontFamily: "monospace", fontSize: 11, color: T.accent }}>/user.list</span>, <Badge label="GET" color={T.green} />, "List ro.am users", "Participant sync", <Badge label="active" color={T.green} />],
            [<span style={{ fontFamily: "monospace", fontSize: 11, color: T.accent }}>/webhook.subscribe</span>, <Badge label="POST" color={T.warn} />, "Subscribe to events", "Real-time updates", <Badge label="active" color={T.green} />],
            [<span style={{ fontFamily: "monospace", fontSize: 11, color: T.accent }}>/messageevent.export</span>, <Badge label="POST" color={T.warn} />, "Export message archive", "Compliance/audit", <Badge label="planned" color={T.textDim} />],
          ]}
        />
      </Card>

      {/* Data Flow */}
      <Card title="Data Flow Architecture" titleColor={T.teal}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
          {[
            { layer: "ro.am (Source)", desc: "Virtual HQ platform — recordings, transcripts, chat, Magic Minutes", tech: "REST API v1 + Webhooks", color: T.accent },
            { layer: "SENS Sync Layer", desc: "roamService.js — auth, mock/live toggle, full sync, webhook handler", tech: "Fetch API + Bearer Token", color: T.blue },
            { layer: "Meeting Module", desc: "MeetingView — unified workspace for notes, chat, agents, recordings", tech: "React state + mock data", color: T.green },
            { layer: "SENS Data Layer", desc: "Notes, annotations, action items, risk links — all SENS-owned", tech: "Local state (DB in prod)", color: T.purple },
            { layer: "AI Agent Fleet", desc: "40+ agents get read access to meeting data for insights", tech: "SENS Agent Framework", color: T.teal },
            { layer: "Export & Compliance", desc: "Markdown/text export, message archive, audit trail", tech: "Client-side generation", color: T.warn },
          ].map((l, i) => (
            <div key={i} style={{ background: T.bg2, borderRadius: 8, padding: 14, border: `1px solid ${T.border}`, borderLeft: `3px solid ${l.color}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: l.color, marginBottom: 4 }}>{l.layer}</div>
              <div style={{ fontSize: 11, color: T.textMid, marginBottom: 4, lineHeight: 1.4 }}>{l.desc}</div>
              <div style={{ fontSize: 10, color: T.textDim }}>{l.tech}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

// ═══════════════════════════════════════════════
//  Tag Management Panel
// ═══════════════════════════════════════════════
const C = T.accent;

const TagManagementPanel = () => {
  const [tags, setTags] = useState(tagRegistry);
  const [editingTag, setEditingTag] = useState(null);
  const [showNewTag, setShowNewTag] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newColor, setNewColor] = useState(C);
  const [filterCat, setFilterCat] = useState("all");
  const [search, setSearch] = useState("");

  const colorOptions = [
    { label: "Accent", value: T.accent },
    { label: "Green", value: T.green },
    { label: "Blue", value: T.blue },
    { label: "Purple", value: T.purple },
    { label: "Teal", value: T.teal },
    { label: "Warning", value: T.warn },
    { label: "Danger", value: T.danger },
  ];

  const categories = useMemo(() => [...new Set(tags.map(t => t.category))].sort(), [tags]);

  const filtered = useMemo(() => {
    let items = tags;
    if (filterCat !== "all") items = items.filter(t => t.category === filterCat);
    if (search) { const q = search.toLowerCase(); items = items.filter(t => t.name.includes(q) || t.description.toLowerCase().includes(q)); }
    return items;
  }, [tags, filterCat, search]);

  const grouped = useMemo(() => {
    const g = {};
    filtered.forEach(t => { if (!g[t.category]) g[t.category] = []; g[t.category].push(t); });
    return g;
  }, [filtered]);

  const saveNewTag = () => {
    const name = newName.trim().toLowerCase().replace(/\s+/g, "-");
    if (!name || tags.some(t => t.name === name)) return;
    const tag = { id: `tag-${name}`, name, color: newColor, category: newCategory.trim() || "Custom", description: newDescription.trim() || name };
    setTags([...tags, tag]);
    setShowNewTag(false);
    setNewName(""); setNewCategory(""); setNewDescription(""); setNewColor(C);
  };

  const updateTag = (id, updates) => {
    setTags(tags.map(t => t.id === id ? { ...t, ...updates } : t));
    setEditingTag(null);
  };

  const deleteTag = (id) => {
    setTags(tags.filter(t => t.id !== id));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>Tag Management</div>
          <div style={{ fontSize: 12, color: T.textDim, marginTop: 4 }}>Manage tags used across High Fives and Notepad entries. Tags are shared across all journal features.</div>
        </div>
        <button onClick={() => setShowNewTag(!showNewTag)} style={{ background: showNewTag ? T.danger + "20" : C, border: showNewTag ? `1px solid ${T.danger}40` : "none", borderRadius: 8, padding: "8px 18px", color: showNewTag ? T.danger : "#1A1A1A", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          {showNewTag ? "Cancel" : "+ New Tag"}
        </button>
      </div>

      {/* KPIs */}
      <DraggableCardRow
        items={[
          { id: "tags-total", render: () => <KpiCard label="Total Tags" value={tags.length} color={C} /> },
          { id: "tags-categories", render: () => <KpiCard label="Categories" value={categories.length} color={T.purple} /> },
          { id: "tags-custom", render: () => <KpiCard label="Custom Tags" value={tags.filter(t => t.category === "Custom").length} sub="user-created" color={T.teal} /> },
        ]}
        storageKey="sens-settings-tags-cards-kpis"
        locked={true}
      />

      {/* New Tag Form */}
      {showNewTag && (
        <Card title="CREATE NEW TAG" titleColor={C}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div style={{ fontSize: 10, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600, marginBottom: 4 }}>Tag Name</div>
              <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. quarterly-review" style={{ width: "100%", background: T.bg0, border: `1px solid ${T.border}`, borderRadius: 6, padding: "8px 12px", color: T.text, fontSize: 12, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} onFocus={(e) => (e.currentTarget.style.borderColor = C)} onBlur={(e) => (e.currentTarget.style.borderColor = T.border)} />
            </div>
            <div>
              <div style={{ fontSize: 10, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600, marginBottom: 4 }}>Category</div>
              <input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="e.g. Operations, Finance" list="tag-categories" style={{ width: "100%", background: T.bg0, border: `1px solid ${T.border}`, borderRadius: 6, padding: "8px 12px", color: T.text, fontSize: 12, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} onFocus={(e) => (e.currentTarget.style.borderColor = C)} onBlur={(e) => (e.currentTarget.style.borderColor = T.border)} />
              <datalist id="tag-categories">{categories.map(c => <option key={c} value={c} />)}</datalist>
            </div>
            <div>
              <div style={{ fontSize: 10, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600, marginBottom: 4 }}>Description</div>
              <input value={newDescription} onChange={(e) => setNewDescription(e.target.value)} placeholder="What this tag is for..." style={{ width: "100%", background: T.bg0, border: `1px solid ${T.border}`, borderRadius: 6, padding: "8px 12px", color: T.text, fontSize: 12, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} onFocus={(e) => (e.currentTarget.style.borderColor = C)} onBlur={(e) => (e.currentTarget.style.borderColor = T.border)} />
            </div>
            <div>
              <div style={{ fontSize: 10, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600, marginBottom: 4 }}>Color</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {colorOptions.map(opt => (
                  <button key={opt.value} onClick={() => setNewColor(opt.value)} title={opt.label} style={{ width: 28, height: 28, borderRadius: 6, background: opt.value + "20", border: newColor === opt.value ? `2px solid ${opt.value}` : `1px solid ${T.border}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ width: 12, height: 12, borderRadius: "50%", background: opt.value }} />
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end", alignItems: "center" }}>
            {newName.trim() && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, padding: "4px 10px", borderRadius: 4, background: newColor + "15", color: newColor, fontWeight: 600, marginRight: "auto" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: newColor }} />
                Preview: {newName.trim().toLowerCase().replace(/\s+/g, "-")}
              </span>
            )}
            <button onClick={() => setShowNewTag(false)} style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 6, padding: "6px 14px", color: T.textMid, fontSize: 12, cursor: "pointer" }}>Cancel</button>
            <button onClick={saveNewTag} disabled={!newName.trim()} style={{ background: newName.trim() ? C : T.bg3, border: "none", borderRadius: 6, padding: "6px 18px", color: newName.trim() ? "#1A1A1A" : T.textDim, fontSize: 12, fontWeight: 600, cursor: newName.trim() ? "pointer" : "default" }}>Create Tag</button>
          </div>
        </Card>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
        <button onClick={() => setFilterCat("all")} style={{ padding: "5px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600, background: filterCat === "all" ? C : T.bg3, color: filterCat === "all" ? "#1A1A1A" : T.textMid }}>All ({tags.length})</button>
        {categories.map(cat => {
          const count = tags.filter(t => t.category === cat).length;
          return <button key={cat} onClick={() => setFilterCat(cat)} style={{ padding: "5px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600, background: filterCat === cat ? C : T.bg3, color: filterCat === cat ? "#1A1A1A" : T.textMid }}>{cat} ({count})</button>;
        })}
        <div style={{ flex: 1 }} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tags..." style={{ background: T.bg0, border: `1px solid ${T.border}`, borderRadius: 6, padding: "6px 12px", color: T.text, fontSize: 12, outline: "none", width: 180, fontFamily: "inherit" }} onFocus={(e) => (e.currentTarget.style.borderColor = C)} onBlur={(e) => (e.currentTarget.style.borderColor = T.border)} />
      </div>

      {/* Tag Grid by Category */}
      {Object.entries(grouped).map(([cat, catTags]) => (
        <div key={cat}>
          <div style={{ fontSize: 11, color: T.textDim, textTransform: "uppercase", letterSpacing: 1, fontWeight: 700, marginBottom: 8 }}>{cat}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 8 }}>
            {catTags.map(tag => (
              <div key={tag.id} style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 14px", borderLeft: `3px solid ${tag.color}`, display: "flex", alignItems: "center", gap: 10, transition: "all .15s" }} onMouseEnter={(e) => (e.currentTarget.style.borderColor = tag.color + "40")} onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.borderLeftColor = tag.color; }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: tag.color, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  {editingTag === tag.id ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <input defaultValue={tag.description} onBlur={(e) => updateTag(tag.id, { description: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") updateTag(tag.id, { description: e.target.value }); if (e.key === "Escape") setEditingTag(null); }} autoFocus style={{ background: T.bg0, border: `1px solid ${C}`, borderRadius: 4, padding: "4px 8px", color: T.text, fontSize: 11, outline: "none", fontFamily: "inherit" }} />
                      <div style={{ display: "flex", gap: 4 }}>
                        {colorOptions.map(opt => (
                          <button key={opt.value} onClick={() => updateTag(tag.id, { color: opt.value })} style={{ width: 18, height: 18, borderRadius: 4, background: opt.value + "20", border: tag.color === opt.value ? `2px solid ${opt.value}` : `1px solid ${T.border}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <span style={{ width: 8, height: 8, borderRadius: "50%", background: opt.value }} />
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ fontSize: 12, fontWeight: 700, color: tag.color, textTransform: "uppercase", letterSpacing: 0.5 }}>{tag.name}</div>
                      <div style={{ fontSize: 11, color: T.textDim, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tag.description}</div>
                    </>
                  )}
                </div>
                {editingTag !== tag.id && (
                  <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                    <button onClick={() => setEditingTag(tag.id)} style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 4, padding: "3px 8px", color: T.textDim, fontSize: 10, cursor: "pointer" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = C; e.currentTarget.style.color = C; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textDim; }}>Edit</button>
                    <button onClick={() => deleteTag(tag.id)} style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 4, padding: "3px 8px", color: T.textDim, fontSize: 10, cursor: "pointer" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.danger; e.currentTarget.style.color = T.danger; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textDim; }}>Del</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {filtered.length === 0 && <div style={{ textAlign: "center", padding: 40, color: T.textDim, fontSize: 12 }}>No tags match the current filter.</div>}
    </div>
  );
};

// ═══════════════════════════════════════════════
//  Badges & Clearance Panel
// ═══════════════════════════════════════════════
const BadgesClearancePanel = ({ locked, onLockedChange }) => {
  const { activeUser, badge, allUsers, refreshConfig } = useBadge();
  const { can } = usePermissions();
  const [selectedUserId, setSelectedUserId] = useState(activeUser.id);
  const [editMode, setEditMode] = useState(false);
  const [dirty, setDirty] = useState(() => isBadgeConfigDirty());
  const [, forceRender] = useState(0);
  const selectedUser = allUsers.find(u => u.id === selectedUserId) || allUsers[0];
  const selectedBadge = getUserBadge(selectedUser);
  const selectedDomains = getAccessibleDomains(selectedUser);

  const canEdit = can("settings", "configure");
  const inputStyle = { background: T.bg0, border: `1px solid ${T.border}`, borderRadius: 6, padding: "6px 10px", color: T.text, fontSize: 12, outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box" };
  const selectStyle = { ...inputStyle, width: "auto", minWidth: 60 };

  const handleSave = () => { saveBadgeConfig(); refreshConfig(); setDirty(true); forceRender(v => v + 1); };
  const handleReset = () => { resetBadgeConfig(); refreshConfig(); setDirty(false); setEditMode(false); forceRender(v => v + 1); };

  return (
    <DraggableGrid
      widgets={[
        {
          id: "badges-edit-controls",
          label: "Edit Controls",
          render: () => canEdit ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <button onClick={() => setEditMode(!editMode)} style={{ padding: "8px 18px", borderRadius: 8, border: editMode ? `1px solid ${T.danger}40` : "none", background: editMode ? T.danger + "20" : T.accent, color: editMode ? T.danger : "#1A1A1A", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                {editMode ? "Exit Edit Mode" : "Edit Configuration"}
              </button>
              {dirty && (
                <button onClick={handleReset} style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${T.warn}40`, background: T.warn + "15", color: T.warn, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  Reset to Defaults
                </button>
              )}
              {dirty && <span style={{ fontSize: 11, color: T.warn, fontWeight: 600 }}>Modified — custom config active</span>}
            </div>
          ) : null,
        },
        {
          id: "badges-user-select",
          label: "User Badge Preview",
          render: () => (
            <Card title="User Badge Preview">
              <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
                <div style={{ flex: "0 0 240px" }}>
                  <div style={{ fontSize: 11, color: T.textDim, marginBottom: 6 }}>Select User</div>
                  <select value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)} style={{
                    width: "100%", padding: "8px 12px", borderRadius: 8, border: `1px solid ${T.border}`,
                    background: T.bg2, color: T.text, fontSize: 12, fontFamily: "inherit",
                  }}>
                    {allUsers.map(u => <option key={u.id} value={u.id}>{u.name} — {u.role}</option>)}
                  </select>
                  <div style={{
                    marginTop: 16, padding: 16, borderRadius: 12,
                    background: selectedBadge.color + "10", border: `2px solid ${selectedBadge.color}40`,
                    textAlign: "center",
                  }}>
                    <svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke={selectedBadge.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    <div style={{ fontSize: 24, fontWeight: 800, color: selectedBadge.color, marginTop: 4 }}>{selectedBadge.label}</div>
                    <div style={{ fontSize: 12, color: T.text, fontWeight: 600, marginTop: 4 }}>{selectedUser.name}</div>
                    <div style={{ fontSize: 11, color: T.textMid }}>{selectedUser.role} · {selectedUser.department}</div>
                    <div style={{ fontSize: 10, color: T.textDim, marginTop: 4 }}>{selectedBadge.scope}</div>
                    <div style={{ fontSize: 10, color: T.textMid, marginTop: 8 }}>{selectedDomains.length} accessible domains</div>
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 300 }}>
                  <div style={{ fontSize: 11, color: T.textDim, marginBottom: 6 }}>Access Matrix</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {DATA_CLASSIFICATIONS.map(dc => {
                      const result = checkAccess(selectedUser, dc.domain);
                      return (
                        <div key={dc.domain} style={{
                          display: "flex", alignItems: "center", gap: 8, padding: "4px 8px",
                          borderRadius: 6, background: result.allowed ? T.green + "08" : T.bg2,
                          border: `1px solid ${result.allowed ? T.green + "20" : T.border}`,
                        }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: result.allowed ? T.green : T.danger + "60" }} />
                          <div style={{ flex: 1 }}>
                            <span style={{ fontSize: 11, fontWeight: 600, color: T.text }}>{dc.label}</span>
                            <span style={{ fontSize: 10, color: T.textDim, marginLeft: 6 }}>L{dc.level}</span>
                          </div>
                          <span style={{ fontSize: 9, color: result.allowed ? T.green : T.textDim }}>{result.reason}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </Card>
          ),
        },
        {
          id: "badges-clearance-levels",
          label: "Clearance Levels",
          render: () => (
            <Card title="Clearance Levels">
              <DataTable
                columns={[
                  { key: "label", header: "Level", render: (_, r) => <span style={{ fontWeight: 700, color: r.color }}>{r.label}</span> },
                  { key: "description", header: "Description", render: (v, r) => editMode ? (
                    <input defaultValue={v} style={inputStyle} onBlur={(e) => { if (e.target.value !== v) { r.description = e.target.value; handleSave(); } }} onKeyDown={(e) => { if (e.key === "Enter") e.target.blur(); }} />
                  ) : v },
                ]}
                rows={CLEARANCE_LEVELS}
              />
            </Card>
          ),
        },
        {
          id: "badges-role-mapping",
          label: "Role → Clearance Mapping",
          render: () => (
            <Card title="Role → Clearance Mapping">
              <DataTable
                columns={[
                  { key: "role", header: "Role", render: (v) => <span style={{ fontWeight: 600 }}>{v}</span> },
                  { key: "level", header: "Level", render: (v, r) => editMode ? (
                    <select value={v} style={selectStyle} onChange={(e) => { r.level = Number(e.target.value); handleSave(); }}>
                      {[1,2,3,4,5].map(l => <option key={l} value={l}>L{l}</option>)}
                    </select>
                  ) : <span style={{ fontWeight: 700, color: CLEARANCE_LEVELS.find(c => c.level === v)?.color || T.text }}>L{v}</span> },
                  { key: "label", header: "Scope", render: (v, r) => editMode ? (
                    <input defaultValue={v} style={inputStyle} onBlur={(e) => { if (e.target.value !== v) { r.label = e.target.value; handleSave(); } }} onKeyDown={(e) => { if (e.key === "Enter") e.target.blur(); }} />
                  ) : v },
                ]}
                rows={ROLE_CLEARANCE}
              />
            </Card>
          ),
        },
        {
          id: "badges-data-domains",
          label: "Data Domain Classifications",
          render: () => (
            <Card title="Data Domain Classifications">
              <DataTable
                columns={[
                  { key: "label", header: "Domain" },
                  { key: "level", header: "Level", render: (v, r) => editMode ? (
                    <select value={v} style={selectStyle} onChange={(e) => { r.level = Number(e.target.value); handleSave(); }}>
                      {[1,2,3,4,5].map(l => <option key={l} value={l}>L{l}</option>)}
                    </select>
                  ) : <span style={{ fontWeight: 700, color: CLEARANCE_LEVELS.find(c => c.level === v)?.color || T.text }}>L{v}</span> },
                  { key: "departments", header: "Departments", render: (v, r) => editMode ? (
                    <input defaultValue={v.join(", ")} style={inputStyle} onBlur={(e) => { const next = e.target.value.split(",").map(s => s.trim()).filter(Boolean); r.departments = next; handleSave(); }} onKeyDown={(e) => { if (e.key === "Enter") e.target.blur(); }} />
                  ) : v.join(", ") },
                  { key: "description", header: "Description", render: (v, r) => editMode ? (
                    <input defaultValue={v} style={inputStyle} onBlur={(e) => { if (e.target.value !== v) { r.description = e.target.value; handleSave(); } }} onKeyDown={(e) => { if (e.key === "Enter") e.target.blur(); }} />
                  ) : v },
                ]}
                rows={DATA_CLASSIFICATIONS}
              />
            </Card>
          ),
        },
      ]}
      storageKey="sens-settings-badges-layout"
      locked={locked}
      onLockedChange={onLockedChange}
    />
  );
};

// ═══════════════════════════════════════════════
//  AI Agents Panel — API Key + Live Mode Config
// ═══════════════════════════════════════════════
const AiAgentsPanel = ({ locked, onLockedChange }) => {
  const [apiKey, setApiKeyState] = useState(getApiKey());
  const [live, setLive] = useState(isLiveMode());
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);
  const [fcEnabled, setFcEnabled] = useState(isAgentContribEnabled());
  const [fcInterval, setFcInterval] = useState(getAgentContribInterval());
  const [fcSensitivity, setFcSensitivity] = useState(getAgentContribSensitivity());

  const handleSaveKey = useCallback((val) => {
    setApiKeyState(val);
    setApiKey(val);
    setTestResult(null);
  }, []);

  const handleToggleLive = useCallback((enabled) => {
    setLive(enabled);
    setLiveMode(enabled);
  }, []);

  const handleTest = useCallback(async () => {
    setTesting(true);
    setTestResult(null);
    const result = await testConnection();
    setTestResult(result);
    setTesting(false);
  }, []);

  return (
    <DraggableGrid
      widgets={[
        {
          id: "ai-config",
          label: "Claude API Configuration",
          render: () => (
            <Card title="Claude API Configuration">
              <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 520 }}>
                {/* API Key */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 6 }}>Anthropic API Key</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      type="password"
                      value={apiKey}
                      onChange={e => handleSaveKey(e.target.value)}
                      placeholder="sk-ant-..."
                      style={{
                        flex: 1, padding: "10px 14px", borderRadius: 8,
                        border: `1px solid ${T.border}`, background: T.bg2,
                        color: T.text, fontSize: 12, fontFamily: "monospace",
                      }}
                    />
                    <button
                      onClick={handleTest}
                      disabled={!apiKey || testing}
                      style={{
                        padding: "10px 16px", borderRadius: 8, border: "none",
                        background: apiKey ? T.accent : T.bg3, color: apiKey ? "#1A1A1A" : T.textDim,
                        fontWeight: 700, fontSize: 12, cursor: apiKey ? "pointer" : "default",
                        fontFamily: "inherit",
                      }}
                    >
                      {testing ? "Testing..." : "Test Connection"}
                    </button>
                  </div>
                  {testResult && (
                    <div style={{
                      marginTop: 8, padding: "8px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                      background: testResult.success ? T.green + "15" : T.danger + "15",
                      color: testResult.success ? T.green : T.danger,
                      border: `1px solid ${testResult.success ? T.green + "30" : T.danger + "30"}`,
                    }}>
                      {testResult.success ? "Connected successfully" : `Error: ${testResult.error}`}
                    </div>
                  )}
                  <div style={{ fontSize: 10, color: T.textDim, marginTop: 6 }}>
                    Key is stored in browser localStorage. Pilot testing only — not for production.
                  </div>
                </div>

                {/* Live Mode Toggle */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 6 }}>Live AI Mode</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <button
                      onClick={() => handleToggleLive(!live)}
                      style={{
                        width: 48, height: 26, borderRadius: 13, border: "none", cursor: "pointer",
                        background: live ? T.green : T.bg3, transition: "background .2s",
                        position: "relative", padding: 0,
                      }}
                    >
                      <div style={{
                        width: 20, height: 20, borderRadius: "50%", background: "#fff",
                        position: "absolute", top: 3, left: live ? 25 : 3,
                        transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,.3)",
                      }} />
                    </button>
                    <span style={{ fontSize: 12, color: live ? T.green : T.textDim, fontWeight: 600 }}>
                      {live ? "Live — Agents use Claude API" : "Simulated — Agents return placeholder text"}
                    </span>
                  </div>
                  {live && !apiKey && (
                    <div style={{ marginTop: 6, fontSize: 10, color: T.warn }}>
                      API key required for live mode to work
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ),
        },
        {
          id: "ai-status",
          label: "AI Status",
          render: () => (
            <Card title="AI Agent Status">
              <DraggableCardRow
                items={[
                  { id: "ai-mode", render: () => <KpiCard label="Mode" value={isLiveMode() ? "Live" : "Simulated"} color={isLiveMode() ? T.green : T.textDim} /> },
                  { id: "ai-model", render: () => <KpiCard label="Model" value="Sonnet 4.6" sub="claude-sonnet-4-6" color={T.blue} /> },
                  { id: "ai-key", render: () => <KpiCard label="API Key" value={apiKey ? "Configured" : "Not Set"} color={apiKey ? T.green : T.warn} /> },
                  { id: "ai-clearance", render: () => <KpiCard label="Data Context" value="Badge-Filtered" sub="Per-user clearance" color={T.purple} /> },
                ]}
                storageKey="sens-settings-ai-cards"
                locked={locked}
              />
            </Card>
          ),
        },
        {
          id: "ai-info",
          label: "How It Works",
          render: () => (
            <Card title="How AI Agents Work">
              <div style={{ fontSize: 12, color: T.textMid, lineHeight: 1.7, maxWidth: 600 }}>
                <p style={{ margin: "0 0 12px" }}>When <strong style={{ color: T.text }}>Live AI Mode</strong> is enabled, agent conversations use Claude (Sonnet 4.6) via the Anthropic API. Each agent receives:</p>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  <li><strong style={{ color: T.text }}>Identity</strong> — Agent name, role, skills, and data sources from the agent registry</li>
                  <li><strong style={{ color: T.text }}>Data Context</strong> — Live data from the time engine, filtered by the active user's badge clearance</li>
                  <li><strong style={{ color: T.text }}>Access Rules</strong> — Agents enforce clearance levels and refuse unauthorized data requests</li>
                  <li><strong style={{ color: T.text }}>Conversation History</strong> — Last 10 messages for context continuity</li>
                </ul>
                <p style={{ margin: "12px 0 0", fontSize: 11, color: T.textDim }}>
                  In <strong>Simulated</strong> mode, agents return placeholder responses without calling any API.
                </p>
              </div>
            </Card>
          ),
        },
        {
          id: "ai-agent-contrib",
          label: "Meeting Agent Contribution",
          render: () => (
            <Card title="Meeting Agent Contribution (Proactive Interjection)">
              <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 520 }}>
                {/* Warning banner */}
                <div style={{ padding: "10px 14px", borderRadius: 8, background: T.warn + "12", border: `1px solid ${T.warn}30`, fontSize: 11, color: T.warn, lineHeight: 1.5 }}>
                  This feature sends meeting chat to Claude periodically. Tokens are consumed even when no errors are found.
                </div>
                {/* Enable toggle */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 6 }}>Enable Agent Contribution</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <button onClick={() => { const next = !fcEnabled; setFcEnabled(next); setAgentContribEnabled(next); }}
                      style={{ width: 48, height: 26, borderRadius: 13, border: "none", cursor: "pointer", background: fcEnabled ? T.green : T.bg3, transition: "background .2s", position: "relative", padding: 0 }}>
                      <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: fcEnabled ? 25 : 3, transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,.3)" }} />
                    </button>
                    <span style={{ fontSize: 12, color: fcEnabled ? T.green : T.textDim, fontWeight: 600 }}>
                      {fcEnabled ? "Active — agents monitor meeting chat for errors" : "Disabled — no automatic agent contributions"}
                    </span>
                  </div>
                </div>
                {/* Interval selector */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 6 }}>Check Interval</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {[30, 45, 60, 90, 120].map(s => (
                      <button key={s} onClick={() => { setFcInterval(s); setAgentContribInterval(s); }}
                        style={{ padding: "6px 14px", borderRadius: 6, border: `1px solid ${fcInterval === s ? T.accent : T.border}`, background: fcInterval === s ? T.accent + "20" : T.bg3, color: fcInterval === s ? T.accent : T.textMid, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                        {s}s{s === 45 ? " (default)" : ""}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Sensitivity selector */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 6 }}>Sensitivity</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {[
                      { key: "relaxed", label: "Relaxed", desc: "15% tolerance" },
                      { key: "normal", label: "Normal", desc: "5% (default)" },
                      { key: "strict", label: "Strict", desc: "2% tolerance" },
                      { key: "precise", label: "Precise", desc: "0% tolerance" },
                    ].map(s => (
                      <button key={s.key} onClick={() => { setFcSensitivity(s.key); setAgentContribSensitivity(s.key); }}
                        style={{ padding: "6px 14px", borderRadius: 6, border: `1px solid ${fcSensitivity === s.key ? T.accent : T.border}`, background: fcSensitivity === s.key ? T.accent + "20" : T.bg3, color: fcSensitivity === s.key ? T.accent : T.textMid, fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, minWidth: 80 }}>
                        <span>{s.label}</span>
                        <span style={{ fontSize: 9, fontWeight: 400, opacity: 0.7 }}>{s.desc}</span>
                      </button>
                    ))}
                  </div>
                  <div style={{ fontSize: 10, color: T.textDim, marginTop: 6 }}>
                    Higher sensitivity = tighter tolerance = more agent interventions.
                  </div>
                </div>
                {/* Cost estimate */}
                <div style={{ fontSize: 11, color: T.textDim, lineHeight: 1.5 }}>
                  Estimated cost: <strong style={{ color: T.textMid }}>~$0.1/hour</strong> for a typical meeting (batch + keyword filter approach).
                </div>
              </div>
            </Card>
          ),
        },
      ]}
      storageKey="sens-settings-ai-layout"
      locked={locked}
      onLockedChange={onLockedChange}
    />
  );
};

// ═══════════════════════════════════════════════
//  Usage & Compute Panel
// ═══════════════════════════════════════════════
const UsageComputePanel = ({ locked, onLockedChange }) => {
  const [summary, setSummary] = useState(() => getUsageSummary());
  const [byUser, setByUser] = useState(() => getUsageByUser());
  const [byAgent, setByAgent] = useState(() => getUsageByAgent());
  const [daily, setDaily] = useState(() => getDailyUsage(30));
  const [confirmClear, setConfirmClear] = useState(false);

  const refresh = useCallback(() => {
    setSummary(getUsageSummary());
    setByUser(getUsageByUser());
    setByAgent(getUsageByAgent());
    setDaily(getDailyUsage(30));
  }, []);

  const handleClear = useCallback(() => {
    clearUsageData();
    refresh();
    setConfirmClear(false);
  }, [refresh]);

  const fmt = (n) => typeof n === "number" ? (n < 0.1 && n > 0 ? "< $0.1" : `$${n.toFixed(1)}`) : "$0.0";
  const fmtTokens = (n) => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(1)}K` : String(n);
  const maxTokens = Math.max(...daily.map(d => d.totalTokens), 1);

  return (
    <DraggableGrid
      widgets={[
        {
          id: "usage-kpis",
          label: "Usage KPIs",
          render: () => (
            <DraggableCardRow
              items={[
                { id: "usage-tokens", render: () => <KpiCard label="Total Tokens (30d)" value={fmtTokens(summary.totalTokens)} color={T.accent} /> },
                { id: "usage-cost", render: () => <KpiCard label="Estimated Cost" value={fmt(summary.totalCost)} sub="last 30 days" color={T.blue} /> },
                { id: "usage-calls", render: () => <KpiCard label="Total Calls" value={summary.callCount} color={T.green} /> },
                { id: "usage-avg", render: () => <KpiCard label="Avg Cost/Call" value={fmt(summary.avgCostPerCall)} color={T.purple} /> },
              ]}
              storageKey="sens-settings-usage-cards"
              locked={locked}
            />
          ),
        },
        {
          id: "usage-trend",
          label: "Daily Token Usage (30 days)",
          render: () => (
            <Card title="Daily Token Usage — Last 30 Days">
              <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 140, padding: "0 4px" }}>
                {daily.map((d, i) => (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, minWidth: 0 }}>
                    {d.totalTokens > 0 && <span style={{ fontSize: 8, color: T.textDim, whiteSpace: "nowrap" }}>{fmtTokens(d.totalTokens)}</span>}
                    <div
                      style={{
                        width: "100%", minHeight: d.totalTokens > 0 ? 4 : 1,
                        height: `${(d.totalTokens / maxTokens) * 110}px`,
                        background: d.totalTokens > 0 ? T.accent + "70" : T.bg3,
                        borderRadius: 3, transition: "height .3s",
                      }}
                      title={`${d.label}: ${d.totalTokens.toLocaleString()} tokens, ${fmt(d.totalCost)}`}
                    />
                    {i % 5 === 0 && <span style={{ fontSize: 8, color: T.textDim, whiteSpace: "nowrap" }}>{d.label.split(" ")[1] || d.label}</span>}
                  </div>
                ))}
              </div>
            </Card>
          ),
        },
        {
          id: "usage-by-user",
          label: "Usage by User",
          render: () => (
            <Card title="Usage by User">
              {byUser.length > 0 ? (
                <DataTable
                  compact
                  columns={["User", "Calls", "Input Tokens", "Output Tokens", "Est. Cost"]}
                  rows={byUser.map(u => [
                    u.userId,
                    u.callCount,
                    fmtTokens(u.totalInput),
                    fmtTokens(u.totalOutput),
                    fmt(u.totalCost),
                  ])}
                />
              ) : (
                <div style={{ padding: 20, textAlign: "center", color: T.textDim, fontSize: 12 }}>No usage data yet. Send messages to AI agents to start tracking.</div>
              )}
            </Card>
          ),
        },
        {
          id: "usage-by-agent",
          label: "Usage by Agent",
          render: () => (
            <Card title="Usage by Agent">
              {byAgent.length > 0 ? (
                <DataTable
                  compact
                  columns={["Agent", "Calls", "Tokens", "Est. Cost"]}
                  rows={byAgent.map(a => [
                    a.agentName,
                    a.callCount,
                    fmtTokens(a.totalTokens),
                    fmt(a.totalCost),
                  ])}
                />
              ) : (
                <div style={{ padding: 20, textAlign: "center", color: T.textDim, fontSize: 12 }}>No usage data yet.</div>
              )}
            </Card>
          ),
        },
        {
          id: "usage-actions",
          label: "Data Management",
          render: () => (
            <Card title="Data Management">
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ fontSize: 12, color: T.textMid, lineHeight: 1.6 }}>
                  Usage data is stored in browser localStorage. Clearing will remove all historical token usage records.
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {!confirmClear ? (
                    <button onClick={() => setConfirmClear(true)} style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${T.danger}40`, background: T.danger + "15", color: T.danger, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                      Clear All Usage Data
                    </button>
                  ) : (
                    <>
                      <span style={{ fontSize: 12, color: T.warn, fontWeight: 600 }}>Are you sure?</span>
                      <button onClick={handleClear} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: T.danger, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Yes, Clear</button>
                      <button onClick={() => setConfirmClear(false)} style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg3, color: T.textMid, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                    </>
                  )}
                  <button onClick={refresh} style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg3, color: T.textMid, fontSize: 12, fontWeight: 600, cursor: "pointer", marginLeft: "auto" }}>
                    Refresh
                  </button>
                </div>
              </div>
            </Card>
          ),
        },
      ]}
      storageKey="sens-settings-usage-layout"
      locked={locked}
      onLockedChange={onLockedChange}
    />
  );
};

// ═══════════════════════════════════════════════
//  Agent Configuration Panel
// ═══════════════════════════════════════════════

/** Build the agent tree structure for the selector */
const buildAgentTree = () => {
  const branches = [
    { label: "Executive", color: T.accent, teams: [
      { key: "ceo", title: "CEO", agentTeam: ceoAgentTeam.agentTeam, color: ceoAgentTeam.color },
      { key: "coo", title: "COO", agentTeam: cooAgentTeam.agentTeam, color: cooAgentTeam.color },
    ]},
  ];
  const branchMap = {};
  Object.values(vpRegistry).forEach(vp => {
    if (!branchMap[vp.branch]) branchMap[vp.branch] = [];
    branchMap[vp.branch].push({ key: vp.key, title: vp.title, agentTeam: vp.agentTeam, color: vp.color });
  });
  Object.entries(branchMap).forEach(([branch, teams]) => {
    branches.push({ label: branch, color: teams[0]?.color || T.textMid, teams });
  });
  return branches;
};

/** Editable tag list — pills with remove + add input */
const TagEditor = ({ items, onChange, placeholder = "Add...", color = T.accent }) => {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");

  const handleAdd = () => {
    const val = draft.trim();
    if (val && !items.includes(val)) {
      onChange([...items, val]);
    }
    setDraft("");
    setAdding(false);
  };

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
      {items.map((item, i) => (
        <span key={i} style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          padding: "4px 10px", borderRadius: 12, fontSize: 11, fontWeight: 600,
          background: color + "20", color, border: `1px solid ${color}40`,
        }}>
          {item}
          <span onClick={() => onChange(items.filter((_, j) => j !== i))}
            style={{ cursor: "pointer", opacity: 0.7, fontSize: 13, lineHeight: 1 }}
            title="Remove">x</span>
        </span>
      ))}
      {adding ? (
        <input
          autoFocus
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") { setAdding(false); setDraft(""); } }}
          onBlur={handleAdd}
          placeholder={placeholder}
          style={{
            padding: "4px 10px", borderRadius: 8, border: `1px solid ${T.border}`,
            background: T.bg2, color: T.text, fontSize: 11, width: 140, outline: "none",
          }}
        />
      ) : (
        <button onClick={() => setAdding(true)} style={{
          padding: "4px 10px", borderRadius: 12, border: `1px dashed ${T.border}`,
          background: "transparent", color: T.textMid, fontSize: 11, cursor: "pointer",
        }}>+ Add</button>
      )}
    </div>
  );
};

/** Connector list editor */
const ConnectorEditor = ({ connectors, onChange }) => {
  const [adding, setAdding] = useState(false);
  const [draftName, setDraftName] = useState("");

  const handleAdd = () => {
    const name = draftName.trim();
    if (name) {
      onChange([...connectors, { name, status: "pending" }]);
    }
    setDraftName("");
    setAdding(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {connectors.map((c, i) => (
        <div key={i} style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "6px 10px", borderRadius: 6, background: T.bg2, border: `1px solid ${T.border}`,
        }}>
          <span style={{ flex: 1, fontSize: 12, color: T.text }}>{c.name}</span>
          <select
            value={c.status}
            onChange={e => {
              const updated = [...connectors];
              updated[i] = { ...c, status: e.target.value };
              onChange(updated);
            }}
            style={{
              padding: "3px 8px", borderRadius: 4, border: `1px solid ${T.border}`,
              background: T.bg3, color: T.text, fontSize: 11,
            }}
          >
            <option value="connected">Connected</option>
            <option value="pending">Pending</option>
          </select>
          <span onClick={() => onChange(connectors.filter((_, j) => j !== i))}
            style={{ cursor: "pointer", color: T.danger, fontSize: 12 }}
            title="Remove">x</span>
        </div>
      ))}
      {adding ? (
        <div style={{ display: "flex", gap: 6 }}>
          <input
            autoFocus
            value={draftName}
            onChange={e => setDraftName(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") { setAdding(false); setDraftName(""); } }}
            placeholder="Connector name..."
            style={{
              flex: 1, padding: "6px 10px", borderRadius: 6, border: `1px solid ${T.border}`,
              background: T.bg2, color: T.text, fontSize: 11, outline: "none",
            }}
          />
          <button onClick={handleAdd} style={{
            padding: "6px 12px", borderRadius: 6, border: "none",
            background: T.accent, color: "#1A1A1A", fontWeight: 700, fontSize: 11, cursor: "pointer",
          }}>Add</button>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} style={{
          padding: "6px 10px", borderRadius: 6, border: `1px dashed ${T.border}`,
          background: "transparent", color: T.textMid, fontSize: 11, cursor: "pointer", alignSelf: "flex-start",
        }}>+ Add Connector</button>
      )}
    </div>
  );
};

/** Domain picker — checkbox grid of available internal data domains */
const DomainPicker = ({ selected, onChange }) => {
  const domains = DATA_CLASSIFICATIONS.filter(d => d.domain !== "vp_landing_access");
  const toggle = (domain) => {
    if (selected.includes(domain)) onChange(selected.filter(d => d !== domain));
    else onChange([...selected, domain]);
  };
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 4 }}>
      {domains.map(d => (
        <label key={d.domain} style={{
          display: "flex", alignItems: "center", gap: 8, padding: "6px 10px",
          borderRadius: 6, cursor: "pointer", fontSize: 11,
          background: selected.includes(d.domain) ? T.blue + "15" : "transparent",
          border: `1px solid ${selected.includes(d.domain) ? T.blue + "40" : T.border}`,
        }}>
          <input type="checkbox" checked={selected.includes(d.domain)} onChange={() => toggle(d.domain)}
            style={{ accentColor: T.blue }} />
          <div>
            <div style={{ fontWeight: 600, color: T.text }}>{d.label}</div>
            <div style={{ fontSize: 10, color: T.textDim }}>{d.domain}</div>
          </div>
        </label>
      ))}
    </div>
  );
};

/** Available branches for team creation */
const BRANCH_OPTIONS = ["Executive", "Delivering", "Operations", "Finance", "Admin", "Custom"];

/** Generate a slug ID from a name */
const slugify = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const AgentConfigPanel = () => {
  const { getAgent, updateAgent, resetAgent, resetAllAgents, isAgentDirty, getGlobalRules, updateGlobalRules, resetGlobalRules, isGlobalRulesDirty, exportConfig, importConfig, createAgent, deleteAgent, isCustom, getCustomAgents, getCustomTeams, createTeam, updateTeam, deleteTeam, configVersion } = useAgentConfig();
  const [innerTab, setInnerTab] = useState("agents");
  const [selectedId, setSelectedId] = useState(null);
  const [collapsed, setCollapsed] = useState({});
  const [saved, setSaved] = useState(false);
  const [editBuffer, setEditBuffer] = useState(null);
  // ── Create agent state ──
  const [creating, setCreating] = useState(false);
  const [createBuffer, setCreateBuffer] = useState({ id: "", name: "", role: "", description: "", skills: [], dataSources: [], connectors: [], teamKey: "", isLead: false });
  // ── Team structure state ──
  const [selectedTeamKey, setSelectedTeamKey] = useState(null);
  const [creatingTeam, setCreatingTeam] = useState(false);
  const [teamBuffer, setTeamBuffer] = useState({ key: "", title: "", branch: "Custom", color: T.accent, focusAreas: [], leadAgentId: null, specialistIds: [] });

  // ── Agent tree (includes custom agents/teams) ──
  const tree = useMemo(() => {
    const base = buildAgentTree();
    const customAgents = storeGetCustomAgents();
    const customTeams = storeGetCustomTeams();

    // Build custom team entries
    const customBranchMap = {};
    Object.values(customTeams).forEach(t => {
      const branchLabel = t.branch || "Custom";
      if (!customBranchMap[branchLabel]) customBranchMap[branchLabel] = [];
      const lead = t.leadAgentId ? customAgents[t.leadAgentId] : null;
      const specialists = (t.specialistIds || []).map(id => customAgents[id]).filter(Boolean);
      customBranchMap[branchLabel].push({
        key: t.key, title: t.title,
        agentTeam: { lead: lead || { id: "__empty__", name: "(No lead assigned)", role: "—" }, specialists },
        color: t.color || T.textMid, _custom: true,
      });
    });

    // Add unassigned custom agents to an "Unassigned" section
    const assignedIds = new Set();
    Object.values(customTeams).forEach(t => {
      if (t.leadAgentId) assignedIds.add(t.leadAgentId);
      (t.specialistIds || []).forEach(id => assignedIds.add(id));
    });
    const unassigned = Object.values(customAgents).filter(a => !assignedIds.has(a.id));

    // Merge custom branches into base tree
    Object.entries(customBranchMap).forEach(([branchLabel, teams]) => {
      const existingBranch = base.find(b => b.label === branchLabel);
      if (existingBranch) {
        existingBranch.teams.push(...teams);
      } else {
        base.push({ label: branchLabel, color: teams[0]?.color || T.textMid, teams });
      }
    });

    // Show unassigned agents in their own section
    if (unassigned.length > 0) {
      base.push({
        label: "Unassigned",
        color: T.textDim,
        teams: [{
          key: "__unassigned__", title: "Unassigned Agents",
          agentTeam: { lead: unassigned[0], specialists: unassigned.slice(1) },
          color: T.textDim, _custom: true,
        }],
      });
    }

    return base;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configVersion]);

  // ── Load agent into edit buffer when selected ──
  const selectAgent = useCallback((agentId) => {
    setSelectedId(agentId);
    const agent = getAgent(agentId);
    if (agent) {
      setEditBuffer({
        name: agent.name || "",
        role: agent.role || "",
        description: agent.description || "",
        skills: [...(agent.skills || [])],
        dataSources: [...(agent.dataSources || [])],
        connectors: (agent.connectors || []).map(c => ({ ...c })),
      });
    }
    setSaved(false);
  }, [getAgent]);

  const handleSaveAgent = useCallback(() => {
    if (!selectedId || !editBuffer) return;
    updateAgent(selectedId, editBuffer);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [selectedId, editBuffer, updateAgent]);

  const handleCreateAgent = useCallback(() => {
    const id = createBuffer.id || slugify(createBuffer.name);
    if (!id || !createBuffer.name) return;
    try {
      createAgent({ ...createBuffer, id, taskHistory: [] });
      setCreating(false);
      setSelectedId(id);
      selectAgent(id);
      setCreateBuffer({ id: "", name: "", role: "", description: "", skills: [], dataSources: [], connectors: [], teamKey: "", isLead: false });
    } catch (e) {
      alert(e.message);
    }
  }, [createBuffer, createAgent, selectAgent]);

  const handleDeleteAgent = useCallback(() => {
    if (!selectedId || !isCustom(selectedId)) return;
    if (!confirm(`Delete custom agent "${editBuffer?.name}"?`)) return;
    deleteAgent(selectedId);
    setSelectedId(null);
    setEditBuffer(null);
  }, [selectedId, editBuffer, isCustom, deleteAgent]);

  const handleResetAgent = useCallback(() => {
    if (!selectedId) return;
    resetAgent(selectedId);
    // Re-load from defaults
    const agent = agentIndex[selectedId]?.agent;
    if (agent) {
      setEditBuffer({
        name: agent.name, role: agent.role, description: agent.description || "",
        skills: [...(agent.skills || [])], dataSources: [...(agent.dataSources || [])],
        connectors: (agent.connectors || []).map(c => ({ ...c })),
      });
    }
    setSaved(false);
  }, [selectedId, resetAgent]);

  // ── Global rules state ──
  const [rulesBuffer, setRulesBuffer] = useState(() => getGlobalRules());
  const [rulesSaved, setRulesSaved] = useState(false);

  const handleSaveRules = useCallback(() => {
    updateGlobalRules(rulesBuffer);
    setRulesSaved(true);
    setTimeout(() => setRulesSaved(false), 2000);
  }, [rulesBuffer, updateGlobalRules]);

  const handleResetRules = useCallback(() => {
    resetGlobalRules();
    setRulesBuffer({ accessControlRules: DEFAULT_ACCESS_CONTROL_RULES, responseGuidelines: DEFAULT_RESPONSE_GUIDELINES });
    setRulesSaved(false);
  }, [resetGlobalRules]);

  const toggleBranch = (label) => setCollapsed(p => ({ ...p, [label]: !p[label] }));

  // ── Styles ──
  const inputStyle = {
    width: "100%", padding: "8px 12px", borderRadius: 8,
    border: `1px solid ${T.border}`, background: T.bg2,
    color: T.text, fontSize: 12, fontFamily: "inherit", outline: "none",
    boxSizing: "border-box",
  };
  const textareaStyle = { ...inputStyle, resize: "vertical", minHeight: 64 };
  const labelStyle = { fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 4 };
  const subLabelStyle = { fontSize: 10, color: T.textDim, marginBottom: 8 };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <TabBar
        tabs={[
          { key: "agents", label: "Agents" },
          { key: "teams", label: "Team Structure" },
          { key: "rules", label: "Global Rules" },
        ]}
        active={innerTab}
        onChange={setInnerTab}
      />

      {/* ═══ AGENTS SUB-TAB ═══ */}
      {innerTab === "agents" && (
        <div style={{ display: "flex", gap: 16, minHeight: 500 }}>
          {/* ── Agent Tree (left) ── */}
          <div style={{
            width: 280, minWidth: 280, background: T.bg1, borderRadius: 10,
            border: `1px solid ${T.border}`, overflow: "auto", maxHeight: "70vh",
          }}>
            <div style={{ padding: "12px 14px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Agent Directory</span>
              <span style={{ fontSize: 10, color: T.textDim }}>{Object.keys(agentIndex).length} agents</span>
            </div>
            {tree.map(branch => (
              <div key={branch.label}>
                <div
                  onClick={() => toggleBranch(branch.label)}
                  style={{
                    padding: "8px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                    background: T.bg2, borderBottom: `1px solid ${T.border}`,
                  }}
                >
                  <span style={{ fontSize: 10, color: T.textDim }}>{collapsed[branch.label] ? "+" : "-"}</span>
                  <span style={{
                    width: 8, height: 8, borderRadius: "50%", background: branch.color, flexShrink: 0,
                  }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: T.text, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    {branch.label}
                  </span>
                </div>
                {!collapsed[branch.label] && branch.teams.map(team => (
                  <div key={team.key}>
                    {/* Lead agent */}
                    {team.agentTeam.lead && team.agentTeam.lead.id !== "__empty__" && (
                      <AgentTreeItem
                        agent={team.agentTeam.lead}
                        color={team.color}
                        selected={selectedId === team.agentTeam.lead.id}
                        dirty={isAgentDirty(team.agentTeam.lead.id)}
                        onClick={() => { setCreating(false); selectAgent(team.agentTeam.lead.id); }}
                        isLead
                      />
                    )}
                    {team.agentTeam.lead && team.agentTeam.lead.id === "__empty__" && (
                      <div style={{ padding: "6px 14px 6px 22px", fontSize: 11, color: T.textDim, fontStyle: "italic" }}>
                        (No lead assigned)
                      </div>
                    )}
                    {/* Specialists */}
                    {team.agentTeam.specialists.map(s => (
                      <AgentTreeItem
                        key={s.id}
                        agent={s}
                        color={team.color}
                        selected={selectedId === s.id}
                        dirty={isAgentDirty(s.id)}
                        onClick={() => { setCreating(false); selectAgent(s.id); }}
                      />
                    ))}
                  </div>
                ))}
              </div>
            ))}
            {/* Create Agent button */}
            <div style={{ padding: "10px 14px", borderTop: `1px solid ${T.border}` }}>
              <button onClick={() => { setCreating(true); setSelectedId(null); setEditBuffer(null); }} style={{
                width: "100%", padding: "8px 12px", borderRadius: 8,
                border: `1px dashed ${T.accent}40`, background: "transparent",
                color: T.accent, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              }}>+ Create Agent</button>
            </div>
          </div>

          {/* ── Edit Form / Create Form (right) ── */}
          <div style={{ flex: 1 }}>
            {/* ── Create Agent Form ── */}
            {creating ? (
              <Card title="Create New Agent">
                <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 640 }}>
                  <div>
                    <div style={labelStyle}>Name</div>
                    <input value={createBuffer.name} onChange={e => { const name = e.target.value; setCreateBuffer(b => ({ ...b, name, id: slugify(name) })); }} placeholder="e.g. Procurement EA" style={inputStyle} />
                  </div>
                  <div>
                    <div style={labelStyle}>Agent ID</div>
                    <div style={subLabelStyle}>Auto-generated from name. Must be unique.</div>
                    <input value={createBuffer.id} onChange={e => setCreateBuffer(b => ({ ...b, id: e.target.value }))} style={{ ...inputStyle, fontFamily: "monospace", fontSize: 11 }} />
                  </div>
                  <div>
                    <div style={labelStyle}>Role</div>
                    <input value={createBuffer.role} onChange={e => setCreateBuffer(b => ({ ...b, role: e.target.value }))} placeholder="e.g. Executive Assistant" style={inputStyle} />
                  </div>
                  <div>
                    <div style={labelStyle}>Description</div>
                    <textarea value={createBuffer.description} onChange={e => setCreateBuffer(b => ({ ...b, description: e.target.value }))} rows={3} placeholder="What does this agent do?" style={textareaStyle} />
                  </div>
                  <div>
                    <div style={labelStyle}>Team Assignment</div>
                    <div style={subLabelStyle}>Assign to an existing team or leave unassigned</div>
                    <select value={createBuffer.teamKey} onChange={e => setCreateBuffer(b => ({ ...b, teamKey: e.target.value }))} style={inputStyle}>
                      <option value="">(Unassigned)</option>
                      <optgroup label="Executive">
                        <option value="ceo">CEO</option>
                        <option value="coo">COO</option>
                      </optgroup>
                      {Object.entries(
                        Object.values(vpRegistry).reduce((acc, vp) => {
                          if (!acc[vp.branch]) acc[vp.branch] = [];
                          acc[vp.branch].push(vp);
                          return acc;
                        }, {})
                      ).map(([branch, vps]) => (
                        <optgroup key={branch} label={branch}>
                          {vps.map(vp => <option key={vp.key} value={vp.key}>{vp.title}</option>)}
                        </optgroup>
                      ))}
                      {Object.values(storeGetCustomTeams()).length > 0 && (
                        <optgroup label="Custom Teams">
                          {Object.values(storeGetCustomTeams()).map(t => (
                            <option key={t.key} value={t.key}>{t.title}</option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>
                  <div>
                    <div style={labelStyle}>Skills</div>
                    <TagEditor items={createBuffer.skills} onChange={skills => setCreateBuffer(b => ({ ...b, skills }))} placeholder="Add skill..." color={T.accent} />
                  </div>
                  <div>
                    <div style={labelStyle}>Data Sources</div>
                    <div style={subLabelStyle}>Select internal data domains this agent can access</div>
                    <DomainPicker selected={createBuffer.dataSources} onChange={dataSources => setCreateBuffer(b => ({ ...b, dataSources }))} />
                  </div>
                  <div>
                    <div style={labelStyle}>Connectors</div>
                    <ConnectorEditor connectors={createBuffer.connectors} onChange={connectors => setCreateBuffer(b => ({ ...b, connectors }))} />
                  </div>
                  <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                    <button onClick={handleCreateAgent} disabled={!createBuffer.name} style={{
                      padding: "10px 24px", borderRadius: 8, border: "none",
                      background: createBuffer.name ? T.accent : T.bg3, color: createBuffer.name ? "#1A1A1A" : T.textDim,
                      fontWeight: 700, fontSize: 12, cursor: createBuffer.name ? "pointer" : "default", fontFamily: "inherit",
                    }}>Create Agent</button>
                    <button onClick={() => setCreating(false)} style={{
                      padding: "10px 24px", borderRadius: 8, border: `1px solid ${T.border}`,
                      background: "transparent", color: T.textMid, fontWeight: 600, fontSize: 12,
                      cursor: "pointer", fontFamily: "inherit",
                    }}>Cancel</button>
                  </div>
                </div>
              </Card>
            ) : !selectedId ? (
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                height: 300, color: T.textDim, fontSize: 13,
              }}>
                Select an agent from the directory to edit, or click "+ Create Agent" to add a new one.
              </div>
            ) : editBuffer && (
              <Card title={
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {editBuffer.name}
                  {isAgentDirty(selectedId) && (
                    <span style={{
                      fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 8,
                      background: T.accent + "20", color: T.accent,
                    }}>MODIFIED</span>
                  )}
                  {saved && (
                    <span style={{
                      fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 8,
                      background: T.green + "20", color: T.green,
                    }}>SAVED</span>
                  )}
                </span>
              }>
                <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 640 }}>
                  {/* Name */}
                  <div>
                    <div style={labelStyle}>Name</div>
                    <input
                      value={editBuffer.name}
                      onChange={e => setEditBuffer(b => ({ ...b, name: e.target.value }))}
                      style={inputStyle}
                    />
                  </div>

                  {/* Role */}
                  <div>
                    <div style={labelStyle}>Role</div>
                    <input
                      value={editBuffer.role}
                      onChange={e => setEditBuffer(b => ({ ...b, role: e.target.value }))}
                      style={inputStyle}
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <div style={labelStyle}>Description</div>
                    <textarea
                      value={editBuffer.description}
                      onChange={e => setEditBuffer(b => ({ ...b, description: e.target.value }))}
                      rows={3}
                      style={textareaStyle}
                    />
                  </div>

                  {/* Skills */}
                  <div>
                    <div style={labelStyle}>Skills</div>
                    <div style={subLabelStyle}>Capabilities this agent advertises in its system prompt</div>
                    <TagEditor
                      items={editBuffer.skills}
                      onChange={skills => setEditBuffer(b => ({ ...b, skills }))}
                      placeholder="Add skill..."
                      color={T.accent}
                    />
                  </div>

                  {/* Data Sources */}
                  <div>
                    <div style={labelStyle}>Data Sources</div>
                    <div style={subLabelStyle}>Internal data domains this agent can access</div>
                    <DomainPicker
                      selected={editBuffer.dataSources}
                      onChange={dataSources => setEditBuffer(b => ({ ...b, dataSources }))}
                    />
                  </div>

                  {/* Connectors */}
                  <div>
                    <div style={labelStyle}>Connectors</div>
                    <div style={subLabelStyle}>Third-party system integrations</div>
                    <ConnectorEditor
                      connectors={editBuffer.connectors}
                      onChange={connectors => setEditBuffer(b => ({ ...b, connectors }))}
                    />
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                    <button onClick={handleSaveAgent} style={{
                      padding: "10px 24px", borderRadius: 8, border: "none",
                      background: T.accent, color: "#1A1A1A", fontWeight: 700, fontSize: 12,
                      cursor: "pointer", fontFamily: "inherit",
                    }}>Save Changes</button>
                    {isAgentDirty(selectedId) && !isCustom(selectedId) && (
                      <button onClick={handleResetAgent} style={{
                        padding: "10px 24px", borderRadius: 8,
                        border: `1px solid ${T.border}`, background: "transparent",
                        color: T.textMid, fontWeight: 600, fontSize: 12,
                        cursor: "pointer", fontFamily: "inherit",
                      }}>Reset to Default</button>
                    )}
                    {isCustom(selectedId) && (
                      <button onClick={handleDeleteAgent} style={{
                        padding: "10px 24px", borderRadius: 8,
                        border: `1px solid ${T.danger}40`, background: "transparent",
                        color: T.danger, fontWeight: 600, fontSize: 12,
                        cursor: "pointer", fontFamily: "inherit",
                      }}>Delete Agent</button>
                    )}
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* ═══ TEAM STRUCTURE SUB-TAB ═══ */}
      {innerTab === "teams" && (
        <div style={{ display: "flex", gap: 16, minHeight: 500 }}>
          {/* ── Team List (left) ── */}
          <div style={{
            width: 280, minWidth: 280, background: T.bg1, borderRadius: 10,
            border: `1px solid ${T.border}`, overflow: "auto", maxHeight: "70vh",
          }}>
            <div style={{ padding: "12px 14px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Teams</span>
            </div>

            {/* Base teams (read-only structure) */}
            {[
              { label: "Executive", teams: [
                { key: "ceo", title: "CEO", team: ceoAgentTeam },
                { key: "coo", title: "COO", team: cooAgentTeam },
              ]},
              ...Object.entries(
                Object.values(vpRegistry).reduce((acc, vp) => {
                  if (!acc[vp.branch]) acc[vp.branch] = [];
                  acc[vp.branch].push(vp);
                  return acc;
                }, {})
              ).map(([branch, vps]) => ({ label: branch, teams: vps.map(vp => ({ key: vp.key, title: vp.title, team: vp })) })),
            ].map(branch => (
              <div key={branch.label}>
                <div style={{ padding: "6px 14px", background: T.bg2, borderBottom: `1px solid ${T.border}`, fontSize: 10, fontWeight: 700, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {branch.label}
                </div>
                {branch.teams.map(t => (
                  <div key={t.key} onClick={() => { setSelectedTeamKey(t.key); setCreatingTeam(false); }}
                    style={{
                      padding: "8px 14px", cursor: "pointer",
                      background: selectedTeamKey === t.key ? T.accent + "15" : "transparent",
                      borderLeft: selectedTeamKey === t.key ? `3px solid ${T.accent}` : "3px solid transparent",
                      borderBottom: `1px solid ${T.border}20`,
                    }}
                    onMouseEnter={e => { if (selectedTeamKey !== t.key) e.currentTarget.style.background = T.bg3; }}
                    onMouseLeave={e => { if (selectedTeamKey !== t.key) e.currentTarget.style.background = "transparent"; }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 600, color: selectedTeamKey === t.key ? T.accent : T.text }}>{t.title}</div>
                    <div style={{ fontSize: 10, color: T.textDim }}>
                      {(t.team.agentTeam || t.team).agentTeam ? `${1 + ((t.team.agentTeam || t.team).agentTeam?.specialists?.length || 0)} agents` : ""}
                    </div>
                  </div>
                ))}
              </div>
            ))}

            {/* Custom teams */}
            {Object.values(storeGetCustomTeams()).length > 0 && (
              <div>
                <div style={{ padding: "6px 14px", background: T.bg2, borderBottom: `1px solid ${T.border}`, fontSize: 10, fontWeight: 700, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Custom Teams
                </div>
                {Object.values(storeGetCustomTeams()).map(t => (
                  <div key={t.key} onClick={() => { setSelectedTeamKey(t.key); setCreatingTeam(false); }}
                    style={{
                      padding: "8px 14px", cursor: "pointer",
                      background: selectedTeamKey === t.key ? T.accent + "15" : "transparent",
                      borderLeft: selectedTeamKey === t.key ? `3px solid ${T.accent}` : "3px solid transparent",
                      borderBottom: `1px solid ${T.border}20`,
                    }}
                    onMouseEnter={e => { if (selectedTeamKey !== t.key) e.currentTarget.style.background = T.bg3; }}
                    onMouseLeave={e => { if (selectedTeamKey !== t.key) e.currentTarget.style.background = "transparent"; }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 600, color: selectedTeamKey === t.key ? T.accent : T.text }}>{t.title}</div>
                    <div style={{ fontSize: 10, color: T.textDim }}>{(t.specialistIds?.length || 0) + (t.leadAgentId ? 1 : 0)} agents</div>
                  </div>
                ))}
              </div>
            )}

            {/* Create team button */}
            <div style={{ padding: "10px 14px", borderTop: `1px solid ${T.border}` }}>
              <button onClick={() => { setCreatingTeam(true); setSelectedTeamKey(null); setTeamBuffer({ key: "", title: "", branch: "Custom", color: T.accent, focusAreas: [], leadAgentId: null, specialistIds: [] }); }} style={{
                width: "100%", padding: "8px 12px", borderRadius: 8,
                border: `1px dashed ${T.accent}40`, background: "transparent",
                color: T.accent, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              }}>+ Create Team</button>
            </div>
          </div>

          {/* ── Team Detail (right) ── */}
          <div style={{ flex: 1 }}>
            {creatingTeam ? (
              <Card title="Create New Team">
                <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 640 }}>
                  <div>
                    <div style={labelStyle}>Team Name</div>
                    <input value={teamBuffer.title} onChange={e => { const title = e.target.value; setTeamBuffer(b => ({ ...b, title, key: "team-" + slugify(title) })); }} placeholder="e.g. Supply Chain Operations" style={inputStyle} />
                  </div>
                  <div>
                    <div style={labelStyle}>Branch</div>
                    <select value={teamBuffer.branch} onChange={e => setTeamBuffer(b => ({ ...b, branch: e.target.value }))} style={inputStyle}>
                      {BRANCH_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={labelStyle}>Focus Areas</div>
                    <TagEditor items={teamBuffer.focusAreas} onChange={focusAreas => setTeamBuffer(b => ({ ...b, focusAreas }))} placeholder="Add focus area..." color={T.accent} />
                  </div>
                  <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                    <button onClick={() => {
                      if (!teamBuffer.title) return;
                      try { createTeam(teamBuffer); setCreatingTeam(false); setSelectedTeamKey(teamBuffer.key); } catch (e) { alert(e.message); }
                    }} disabled={!teamBuffer.title} style={{
                      padding: "10px 24px", borderRadius: 8, border: "none",
                      background: teamBuffer.title ? T.accent : T.bg3, color: teamBuffer.title ? "#1A1A1A" : T.textDim,
                      fontWeight: 700, fontSize: 12, cursor: teamBuffer.title ? "pointer" : "default", fontFamily: "inherit",
                    }}>Create Team</button>
                    <button onClick={() => setCreatingTeam(false)} style={{
                      padding: "10px 24px", borderRadius: 8, border: `1px solid ${T.border}`,
                      background: "transparent", color: T.textMid, fontWeight: 600, fontSize: 12,
                      cursor: "pointer", fontFamily: "inherit",
                    }}>Cancel</button>
                  </div>
                </div>
              </Card>
            ) : !selectedTeamKey ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, color: T.textDim, fontSize: 13 }}>
                Select a team to view its structure, or click "+ Create Team" to add a new one.
              </div>
            ) : (() => {
              // Resolve team data
              const customTeams = storeGetCustomTeams();
              const customAgentsMap = storeGetCustomAgents();
              const isCustomTeam = selectedTeamKey in customTeams;
              let teamTitle, leadAgent, specialists, branchLabel, focusAreas;

              if (isCustomTeam) {
                const t = customTeams[selectedTeamKey];
                teamTitle = t.title;
                branchLabel = t.branch;
                focusAreas = t.focusAreas || [];
                leadAgent = t.leadAgentId ? (customAgentsMap[t.leadAgentId] || agentIndex[t.leadAgentId]?.agent) : null;
                specialists = (t.specialistIds || []).map(id => customAgentsMap[id] || agentIndex[id]?.agent).filter(Boolean);
              } else if (selectedTeamKey === "ceo") {
                teamTitle = "CEO"; branchLabel = "Executive"; focusAreas = ceoAgentTeam.focusAreas;
                leadAgent = ceoAgentTeam.agentTeam.lead; specialists = ceoAgentTeam.agentTeam.specialists;
              } else if (selectedTeamKey === "coo") {
                teamTitle = "COO"; branchLabel = "Executive"; focusAreas = cooAgentTeam.focusAreas;
                leadAgent = cooAgentTeam.agentTeam.lead; specialists = cooAgentTeam.agentTeam.specialists;
              } else {
                const vp = vpRegistry[selectedTeamKey];
                if (!vp) return null;
                teamTitle = vp.title; branchLabel = vp.branch; focusAreas = vp.focusAreas;
                leadAgent = vp.agentTeam.lead; specialists = vp.agentTeam.specialists;
              }

              return (
                <Card title={
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {teamTitle}
                    {isCustomTeam && <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 8, background: T.teal + "20", color: T.teal }}>CUSTOM</span>}
                  </span>
                }>
                  <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 640 }}>
                    <div style={{ display: "flex", gap: 16 }}>
                      <div><span style={{ fontSize: 11, color: T.textDim }}>Branch:</span> <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{branchLabel}</span></div>
                      <div><span style={{ fontSize: 11, color: T.textDim }}>Agents:</span> <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{1 + specialists.length}</span></div>
                    </div>

                    {focusAreas.length > 0 && (
                      <div>
                        <div style={labelStyle}>Focus Areas</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {focusAreas.map((f, i) => (
                            <span key={i} style={{ padding: "4px 10px", borderRadius: 12, fontSize: 11, fontWeight: 600, background: T.accent + "20", color: T.accent }}>{f}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Lead agent */}
                    <div>
                      <div style={labelStyle}>Lead (EA)</div>
                      {leadAgent ? (
                        <div style={{ padding: "10px 14px", borderRadius: 8, background: T.bg2, border: `1px solid ${T.border}` }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{leadAgent.name}</div>
                          <div style={{ fontSize: 11, color: T.textDim }}>{leadAgent.role}</div>
                          <div style={{ fontSize: 10, color: T.textDim, marginTop: 4 }}>Skills: {(leadAgent.skills || []).join(", ") || "—"}</div>
                        </div>
                      ) : (
                        <div style={{ padding: "10px 14px", color: T.textDim, fontSize: 12, fontStyle: "italic" }}>No lead assigned</div>
                      )}
                    </div>

                    {/* Specialists */}
                    <div>
                      <div style={labelStyle}>Specialists ({specialists.length})</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {specialists.map(s => (
                          <div key={s.id} style={{ padding: "8px 14px", borderRadius: 8, background: T.bg2, border: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{s.name}</div>
                              <div style={{ fontSize: 10, color: T.textDim }}>{s.role}</div>
                            </div>
                            <StatusPill status={s.status || "green"} />
                          </div>
                        ))}
                        {specialists.length === 0 && (
                          <div style={{ padding: "8px 14px", color: T.textDim, fontSize: 12, fontStyle: "italic" }}>No specialists assigned yet</div>
                        )}
                      </div>
                    </div>

                    {/* Delete custom team */}
                    {isCustomTeam && (
                      <div style={{ marginTop: 8 }}>
                        <button onClick={() => {
                          if (!confirm(`Delete custom team "${teamTitle}"?`)) return;
                          deleteTeam(selectedTeamKey);
                          setSelectedTeamKey(null);
                        }} style={{
                          padding: "10px 24px", borderRadius: 8,
                          border: `1px solid ${T.danger}40`, background: "transparent",
                          color: T.danger, fontWeight: 600, fontSize: 12,
                          cursor: "pointer", fontFamily: "inherit",
                        }}>Delete Team</button>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })()}
          </div>
        </div>
      )}

      {/* ═══ GLOBAL RULES SUB-TAB ═══ */}
      {innerTab === "rules" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 800 }}>
          <Card title={
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              Global Agent Rules
              {isGlobalRulesDirty() && (
                <span style={{
                  fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 8,
                  background: T.accent + "20", color: T.accent,
                }}>MODIFIED</span>
              )}
              {rulesSaved && (
                <span style={{
                  fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 8,
                  background: T.green + "20", color: T.green,
                }}>SAVED</span>
              )}
            </span>
          }>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Access Control Rules */}
              <div>
                <div style={labelStyle}>Access Control Rules</div>
                <div style={subLabelStyle}>These rules govern how agents handle data access and clearance boundaries</div>
                <textarea
                  value={rulesBuffer.accessControlRules}
                  onChange={e => setRulesBuffer(b => ({ ...b, accessControlRules: e.target.value }))}
                  rows={6}
                  style={{ ...textareaStyle, fontFamily: "monospace", fontSize: 11 }}
                />
              </div>

              {/* Response Guidelines */}
              <div>
                <div style={labelStyle}>Response Guidelines</div>
                <div style={subLabelStyle}>These guidelines shape how all agents format and structure their responses</div>
                <textarea
                  value={rulesBuffer.responseGuidelines}
                  onChange={e => setRulesBuffer(b => ({ ...b, responseGuidelines: e.target.value }))}
                  rows={6}
                  style={{ ...textareaStyle, fontFamily: "monospace", fontSize: 11 }}
                />
              </div>

              {/* System Prompt Preview */}
              <div>
                <div style={labelStyle}>System Prompt Preview</div>
                <div style={subLabelStyle}>How the rules appear in the agent system prompt (sample agent: CEO EA)</div>
                <pre style={{
                  background: T.bg0, border: `1px solid ${T.border}`, borderRadius: 8,
                  padding: 14, fontSize: 11, color: T.textMid, fontFamily: "monospace",
                  whiteSpace: "pre-wrap", wordBreak: "break-word", maxHeight: 300, overflow: "auto",
                  lineHeight: 1.5,
                }}>
{`ACCESS CONTROL RULES:
${rulesBuffer.accessControlRules}

RESPONSE GUIDELINES:
${rulesBuffer.responseGuidelines}`}
                </pre>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={handleSaveRules} style={{
                  padding: "10px 24px", borderRadius: 8, border: "none",
                  background: T.accent, color: "#1A1A1A", fontWeight: 700, fontSize: 12,
                  cursor: "pointer", fontFamily: "inherit",
                }}>Save Rules</button>
                {isGlobalRulesDirty() && (
                  <button onClick={handleResetRules} style={{
                    padding: "10px 24px", borderRadius: 8,
                    border: `1px solid ${T.border}`, background: "transparent",
                    color: T.textMid, fontWeight: 600, fontSize: 12,
                    cursor: "pointer", fontFamily: "inherit",
                  }}>Reset to Defaults</button>
                )}
              </div>
            </div>
          </Card>

          {/* Export / Import */}
          <Card title="Export & Import">
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button onClick={() => {
                const data = exportConfig();
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a"); a.href = url; a.download = "agent-config.json"; a.click();
                URL.revokeObjectURL(url);
              }} style={{
                padding: "10px 20px", borderRadius: 8, border: `1px solid ${T.border}`,
                background: T.bg3, color: T.text, fontWeight: 600, fontSize: 12,
                cursor: "pointer", fontFamily: "inherit",
              }}>Export Config</button>
              <label style={{
                padding: "10px 20px", borderRadius: 8, border: `1px solid ${T.border}`,
                background: T.bg3, color: T.text, fontWeight: 600, fontSize: 12,
                cursor: "pointer", fontFamily: "inherit",
              }}>
                Import Config
                <input type="file" accept=".json" style={{ display: "none" }} onChange={e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    try {
                      const data = JSON.parse(reader.result);
                      importConfig(data);
                      setRulesBuffer(getGlobalRules());
                      if (selectedId) selectAgent(selectedId);
                    } catch { /* ignore invalid JSON */ }
                  };
                  reader.readAsText(file);
                  e.target.value = "";
                }} />
              </label>
              <span style={{ fontSize: 10, color: T.textDim }}>
                Export saves all agent overrides and global rules as JSON.
              </span>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

/** Single agent item in the tree selector */
const AgentTreeItem = ({ agent, color, selected, dirty, onClick, isLead }) => (
  <div
    onClick={onClick}
    style={{
      padding: "6px 14px 6px " + (isLead ? "22px" : "36px"),
      cursor: "pointer",
      background: selected ? T.accent + "15" : "transparent",
      borderBottom: `1px solid ${T.border}20`,
      borderLeft: selected ? `3px solid ${T.accent}` : "3px solid transparent",
      transition: "background 0.15s",
    }}
    onMouseEnter={e => { if (!selected) e.currentTarget.style.background = T.bg3; }}
    onMouseLeave={e => { if (!selected) e.currentTarget.style.background = "transparent"; }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      {isLead && <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />}
      <span style={{ fontSize: 12, fontWeight: isLead ? 600 : 400, color: selected ? T.accent : T.text, flex: 1 }}>
        {agent.name}
      </span>
      {dirty && <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.accent, flexShrink: 0 }} title="Modified" />}
    </div>
    <div style={{ fontSize: 10, color: T.textDim, marginTop: 1, paddingLeft: isLead ? 12 : 0 }}>{agent.role}</div>
  </div>
);

// ═══════════════════════════════════════════════
//  Main Settings View
// ═══════════════════════════════════════════════
export const SettingsView = ({ initialTab, hideChrome } = {}) => {
  const [tab, setTab] = useState(initialTab || "myaccess");
  const [integrationFilter, setIntegrationFilter] = useState("all");
  const [layoutLocked, setLayoutLocked] = useState(true);
  const { can } = usePermissions();

  // When controlled externally, sync tab
  const activeTab = initialTab || tab;

  const allTabs = [
    { key: "myaccess", label: "My Access" },
    { key: "badges", label: "Badges & Clearance" },
    { key: "ai", label: "AI Agents" },
    { key: "agent-config", label: "Agent Config" },
    { key: "usage", label: "Usage & Compute" },
    { key: "tags", label: "Tags" },
    { key: "integrations", label: "Integrations", gate: () => can("settings", "integrations") },
    { key: "roam", label: "ro.am", gate: () => can("settings", "integrations") },
    { key: "api", label: "API & Endpoints", gate: () => can("settings", "apiKeys") },
    { key: "iot", label: "IoT Devices", gate: () => can("settings", "iot") },
    { key: "users", label: "Users & Access", gate: () => can("settings", "userMgmt") },
    { key: "landing", label: "Landing Pages", gate: () => can("settings", "landingPages") },
    { key: "permissions", label: "Permissions", gate: () => can("settings", "permissions") },
    { key: "config", label: "Configuration" },
  ];

  const tabs = allTabs.filter((t) => !t.gate || t.gate());

  const connected = integrations.filter(i => i.status === "connected").length;
  const degraded = integrations.filter(i => i.status === "degraded").length;
  const pending = integrations.filter(i => i.status === "pending").length;

  const filteredIntegrations = integrationFilter === "all"
    ? integrations
    : integrations.filter(i => i.status === integrationFilter);

  const categories = [...new Set(integrations.map(i => i.category))];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, padding: hideChrome ? 0 : "0 20px" }}>
      {!hideChrome && <TabBar tabs={tabs} active={activeTab} onChange={setTab} />}

      {/* ─── INTEGRATIONS TAB ─── */}
      {activeTab === "integrations" && (
        <DraggableGrid
          widgets={[
            {
              id: "settings-int-lights",
              label: "Status Lights",
              render: () => (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <EngineLight on={false} color={T.green} label={`${connected} Connected`} />
                  <EngineLight on={degraded > 0} color={T.warn} label={`${degraded} Degraded`} />
                  <EngineLight on={pending > 0} color={T.textDim} label={`${pending} Pending`} />
                </div>
              ),
            },
            {
              id: "settings-int-kpis",
              label: "KPIs",
              render: () => (
                <DraggableCardRow
                  items={[
                    { id: "int-total", render: () => <KpiCard label="Total Integrations" value={integrations.length} color={T.accent} /> },
                    { id: "int-connected", render: () => <KpiCard label="Connected" value={connected} sub={`${Math.round(connected / integrations.length * 100)}%`} color={T.green} /> },
                    { id: "int-apicalls", render: () => <KpiCard label="API Calls/Day" value="18K+" sub="aggregate" color={T.blue} /> },
                    { id: "int-throughput", render: () => <KpiCard label="Data Throughput" value="2.1 TB" sub="/day" color={T.teal} /> },
                    { id: "int-auth", render: () => <KpiCard label="Auth Methods" value="6" sub="OAuth, Cert, Key..." color={T.purple} /> },
                  ]}
                  storageKey="sens-settings-integrations-cards-kpis"
                  locked={layoutLocked}
                />
              ),
            },
            {
              id: "settings-int-filter",
              label: "Filter",
              render: () => (
                <div style={{ display: "flex", gap: 6 }}>
                  {["all", "connected", "degraded", "pending"].map(f => (
                    <button key={f} onClick={() => setIntegrationFilter(f)}
                      style={{ padding: "5px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600,
                        background: integrationFilter === f ? T.accent : T.bg3, color: integrationFilter === f ? "#1A1A1A" : T.textMid,
                        textTransform: "capitalize" }}>
                      {f}
                    </button>
                  ))}
                </div>
              ),
            },
            {
              id: "settings-int-grid",
              label: "Integration Grid",
              render: () => (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
                  {filteredIntegrations.map((item, i) => <IntegrationCard key={i} item={item} />)}
                </div>
              ),
            },
          ]}
          storageKey="sens-settings-integrations-layout"
          locked={layoutLocked}
          onLockedChange={setLayoutLocked}
        />
      )}

      {/* ─── BADGES & CLEARANCE TAB ─── */}
      {activeTab === "badges" && <BadgesClearancePanel locked={layoutLocked} onLockedChange={setLayoutLocked} />}

      {/* ─── AI AGENTS TAB ─── */}
      {activeTab === "ai" && <AiAgentsPanel locked={layoutLocked} onLockedChange={setLayoutLocked} />}

      {/* ─── AGENT CONFIG TAB ─── */}
      {activeTab === "agent-config" && <AgentConfigPanel />}

      {/* ─── USAGE & COMPUTE TAB ─── */}
      {activeTab === "usage" && <UsageComputePanel locked={layoutLocked} onLockedChange={setLayoutLocked} />}

      {/* ─── RO.AM INTEGRATION TAB ─── */}
      {activeTab === "roam" && (
        <RoamSettingsPanel />
      )}

      {/* ─── TAGS TAB ─── */}
      {activeTab === "tags" && <TagManagementPanel />}

      {/* ─── API & ENDPOINTS TAB ─── */}
      {activeTab === "api" && (
        <DraggableGrid
          widgets={[
            {
              id: "settings-api-kpis",
              label: "API KPIs",
              render: () => (
                <DraggableCardRow
                  items={[
                    { id: "api-endpoints", render: () => <KpiCard label="Total Endpoints" value={apiEndpoints.length} color={T.accent} /> },
                    { id: "api-services", render: () => <KpiCard label="Services" value={[...new Set(apiEndpoints.map(e => e.service))].length} color={T.blue} /> },
                    { id: "api-ratelimit", render: () => <KpiCard label="Avg Rate Limit" value="~75/min" color={T.teal} /> },
                    { id: "api-authtypes", render: () => <KpiCard label="Auth Types" value="5" sub="Bearer, OAuth, Key..." color={T.purple} /> },
                  ]}
                  storageKey="sens-settings-api-cards-kpis"
                  locked={layoutLocked}
                />
              ),
            },
            {
              id: "settings-api-registry",
              label: "API Endpoint Registry",
              render: () => (
                <Card title="API Endpoint Registry">
                  <DataTable
                    compact
                    columns={["Endpoint", "Method", "Service", "Purpose", "Rate Limit", "Auth"]}
                    rows={apiEndpoints.map(e => [
                      <span style={{ fontFamily: "monospace", fontSize: 11, color: T.accent }}>{e.endpoint}</span>,
                      <Badge label={e.method} color={e.method.includes("POST") ? T.warn : T.green} />,
                      e.service,
                      <span style={{ fontSize: 11 }}>{e.purpose}</span>,
                      e.rateLimit,
                      <Badge label={e.auth} color={T.purple} />,
                    ])}
                  />
                </Card>
              ),
            },
            {
              id: "settings-api-auth",
              label: "Authentication Methods",
              render: () => (
                <Card title="Authentication Methods">
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
                    {[
                      { method: "OAuth 2.0", systems: "Oracle, Salesforce, DocuSign, Procore, Autodesk", security: "High", refresh: "Auto" },
                      { method: "Bearer Token", systems: "Executive Intelligence Platform API", security: "High", refresh: "24h expiry" },
                      { method: "API Key", systems: "WakeCap, GOARC, Veriforce, LabWare, PatSnap, Notion, PagerDuty", security: "Medium", refresh: "Manual rotation" },
                      { method: "X.509 Certificate", systems: "AWS IoT Core, SCADA", security: "Very High", refresh: "Annual" },
                      { method: "Kerberos", systems: "OSIsoft PI", security: "High", refresh: "Domain-managed" },
                      { method: "IAM Role", systems: "AWS S3", security: "Very High", refresh: "Auto" },
                    ].map((a, i) => (
                      <div key={i} style={{ background: T.bg2, borderRadius: 8, padding: 14, border: `1px solid ${T.border}` }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: T.accent, marginBottom: 6 }}>{a.method}</div>
                        <div style={{ fontSize: 11, color: T.textMid, marginBottom: 4 }}>{a.systems}</div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <Badge label={a.security} color={a.security === "Very High" ? T.green : a.security === "High" ? T.blue : T.warn} />
                          <Badge label={a.refresh} color={T.textMid} />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              ),
            },
          ]}
          storageKey="sens-settings-api-layout"
          locked={layoutLocked}
          onLockedChange={setLayoutLocked}
        />
      )}

      {/* ─── IoT DEVICES TAB ─── */}
      {activeTab === "iot" && (
        <DraggableGrid
          widgets={[
            {
              id: "settings-iot-lights",
              label: "Status Lights",
              render: () => (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <EngineLight on={false} color={T.green} label={`${iotDevices.filter(d => d.status === "online").length} Online`} />
                  <EngineLight on={iotDevices.some(d => d.status === "warning")} color={T.warn} label={`${iotDevices.filter(d => d.status === "warning").length} Warning`} />
                  <EngineLight on={iotDevices.some(d => d.status === "offline")} color={T.danger} label={`${iotDevices.filter(d => d.status === "offline").length} Offline`} />
                </div>
              ),
            },
            {
              id: "settings-iot-kpis",
              label: "IoT KPIs",
              render: () => (
                <DraggableCardRow
                  items={[
                    { id: "iot-sensors", render: () => <KpiCard label="Total Sensors" value="48" sub="across 5 sites" color={T.accent} /> },
                    { id: "iot-online", render: () => <KpiCard label="Online" value={iotDevices.filter(d => d.status === "online").length} color={T.green} /> },
                    { id: "iot-protocols", render: () => <KpiCard label="Protocols" value="3" sub="MQTT, Modbus, REST" color={T.blue} /> },
                    { id: "iot-latency", render: () => <KpiCard label="Avg Latency" value="< 2s" sub="MQTT path" color={T.teal} /> },
                    { id: "iot-platform", render: () => <KpiCard label="Data Platform" value="AWS IoT" sub="Core + PI" color={T.purple} /> },
                  ]}
                  storageKey="sens-settings-iot-cards-kpis"
                  locked={layoutLocked}
                />
              ),
            },
            {
              id: "settings-iot-registry",
              label: "IoT Device Registry",
              render: () => (
                <Card title="IoT Device Registry">
                  <DataTable
                    compact
                    columns={["Device ID", "Type", "Location", "Site", "Protocol", "Threshold", "Reading", "Status", "Updated"]}
                    rows={iotDevices.map(d => [
                      <span style={{ fontFamily: "monospace", fontSize: 11, color: T.accent }}>{d.id}</span>,
                      d.type,
                      d.location,
                      d.site,
                      <Badge label={d.protocol} color={T.blue} />,
                      <span style={{ fontSize: 11, color: T.textDim }}>{d.threshold}</span>,
                      <span style={{ fontWeight: 600, color: d.status === "warning" ? T.warn : T.text }}>{d.lastReading}</span>,
                      <StatusPill status={d.status === "online" ? "green" : d.status === "warning" ? "yellow" : "red"} />,
                      <span style={{ fontSize: 10, color: T.textDim }}>{d.updated}</span>,
                    ])}
                  />
                </Card>
              ),
            },
            {
              id: "settings-iot-architecture",
              label: "IoT Architecture",
              render: () => (
                <Card title="IoT Architecture">
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
                    {[
                      { layer: "Edge Devices", desc: "48 sensors (temp, vibration, pressure, flow, electrical, quality)", tech: "Industrial-grade sensors", color: T.green },
                      { layer: "Protocol Gateway", desc: "SCADA OPC-UA / Modbus bridge to MQTT", tech: "On-prem gateway per site", color: T.blue },
                      { layer: "Cloud Ingestion", desc: "AWS IoT Core → message broker → rules engine", tech: "MQTT over TLS", color: T.teal },
                      { layer: "Data Historian", desc: "OSIsoft PI for time-series storage & analytics", tech: "PI Web API", color: T.purple },
                      { layer: "Data Lake", desc: "AWS S3 raw storage → Splunk for analytics", tech: "2.1 TB/day throughput", color: T.accent },
                      { layer: "Application Layer", desc: "Executive Intelligence Platform dashboards, AI agents, alerts", tech: "REST API consumption", color: T.warn },
                    ].map((l, i) => (
                      <div key={i} style={{ background: T.bg2, borderRadius: 8, padding: 14, border: `1px solid ${T.border}`, borderLeft: `3px solid ${l.color}` }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: l.color, marginBottom: 4 }}>{l.layer}</div>
                        <div style={{ fontSize: 11, color: T.textMid, marginBottom: 4 }}>{l.desc}</div>
                        <div style={{ fontSize: 10, color: T.textDim }}>{l.tech}</div>
                      </div>
                    ))}
                  </div>
                </Card>
              ),
            },
          ]}
          storageKey="sens-settings-iot-layout"
          locked={layoutLocked}
          onLockedChange={setLayoutLocked}
        />
      )}

      {/* ─── USERS & ACCESS TAB ─── */}
      {activeTab === "users" && <UserManagementPanel />}

      {/* ─── LANDING PAGES TAB ─── */}
      {activeTab === "landing" && <LandingPageEditorPanel />}

      {/* ─── MY ACCESS TAB ─── */}
      {activeTab === "myaccess" && <MyAccessPanel />}

      {/* ─── PERMISSIONS TAB (Admin only) ─── */}
      {activeTab === "permissions" && <PermissionsAdminPanel />}

      {/* ─── CONFIGURATION TAB ─── */}
      {activeTab === "config" && (
        <DraggableGrid
          widgets={[
            {
              id: "settings-config-kpis",
              label: "Config KPIs",
              render: () => (
                <DraggableCardRow
                  items={[
                    { id: "config-version", render: () => <KpiCard label="Platform Version" value="v4.0" color={T.accent} /> },
                    { id: "config-env", render: () => <KpiCard label="Environment" value="Production" color={T.green} /> },
                    { id: "config-region", render: () => <KpiCard label="Region" value="US-Central" color={T.blue} /> },
                    { id: "config-theme", render: () => <KpiCard label="Theme" value="Dark" color={T.purple} /> },
                  ]}
                  storageKey="sens-settings-config-cards-kpis"
                  locked={layoutLocked}
                />
              ),
            },
            {
              id: "settings-config-platform",
              label: "Platform Settings",
              render: () => (
                <Card title="Platform Settings">
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
                    {[
                      { group: "General", items: [
                        { label: "Company Name", value: "Systemic Environmental Solutions" },
                        { label: "Platform Name", value: "Executive Intelligence Platform" },
                        { label: "Default Dashboard Role", value: "COO" },
                        { label: "Session Timeout", value: "30 min" },
                        { label: "Time Zone", value: "America/Chicago (CST)" },
                      ]},
                      { group: "Data & Sync", items: [
                        { label: "SCADA Sync Interval", value: "1 second" },
                        { label: "Oracle P6 Sync", value: "45 seconds" },
                        { label: "Financial Data Refresh", value: "5 seconds" },
                        { label: "IoT Telemetry Buffer", value: "500ms" },
                        { label: "Data Retention", value: "7 years" },
                      ]},
                      { group: "Alerts & Notifications", items: [
                        { label: "Critical Alert Channel", value: "PagerDuty + Slack" },
                        { label: "Escalation Timeout", value: "15 min → VP, 30 min → COO" },
                        { label: "Daily Digest", value: "6:00 AM CST" },
                        { label: "Maintenance Window", value: "Sun 2:00–4:00 AM" },
                        { label: "Alert Retention", value: "90 days" },
                      ]},
                      { group: "Security", items: [
                        { label: "MFA Enforcement", value: "Required for Admin/Manager" },
                        { label: "Password Policy", value: "12+ chars, complexity required" },
                        { label: "API Key Rotation", value: "Every 90 days" },
                        { label: "SSL Certificate Renewal", value: "Auto (Let's Encrypt)" },
                        { label: "Audit Log Retention", value: "2 years" },
                      ]},
                    ].map((group, gi) => (
                      <div key={gi} style={{ background: T.bg2, borderRadius: 10, padding: 16, border: `1px solid ${T.border}` }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: T.accent, marginBottom: 12, borderBottom: `1px solid ${T.border}`, paddingBottom: 8 }}>{group.group}</div>
                        {group.items.map((item, ii) => (
                          <div key={ii} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: ii < group.items.length - 1 ? `1px solid ${T.border}` : "none" }}>
                            <span style={{ fontSize: 12, color: T.textMid }}>{item.label}</span>
                            <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{item.value}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </Card>
              ),
            },
          ]}
          storageKey="sens-settings-config-layout"
          locked={layoutLocked}
          onLockedChange={setLayoutLocked}
        />
      )}
    </div>
  );
};


// ═══════════════════════════════════════════════
//  My Access Panel — Current user's permissions view
// ═══════════════════════════════════════════════
const MyAccessPanel = () => {
  const { activeUser, badge, clearanceLevel, accessibleDomains } = useBadge();
  const { visibleModules, can } = usePermissions();
  const initials = activeUser.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  const moduleKeys = Object.keys(MODULE_PERMISSIONS);
  const actionKeys = ["view", "edit", "delete", "export", "configure"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Identity Card */}
      <Card title="YOUR IDENTITY" titleColor={T.accent}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            background: T.accent + "20", border: `2px solid ${badge.color}40`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, fontWeight: 700, color: T.accent,
          }}>
            {initials}
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>{activeUser.name}</div>
            <div style={{ fontSize: 12, color: T.textMid, marginTop: 2 }}>{activeUser.email}</div>
            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              <Badge label={activeUser.role} color={T.accent} />
              <Badge label={activeUser.department} color={T.blue} />
              <Badge label={badge.label} color={badge.color} />
              <Badge label={`L${clearanceLevel}`} color={badge.color} />
            </div>
          </div>
        </div>
      </Card>

      {/* Module Access Matrix */}
      <Card title="MODULE ACCESS" titleColor={T.blue}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "8px 10px", borderBottom: `1px solid ${T.border}`, color: T.textDim, fontSize: 10, fontWeight: 600, textTransform: "uppercase" }}>Module</th>
                {actionKeys.map((a) => (
                  <th key={a} style={{ textAlign: "center", padding: "8px 6px", borderBottom: `1px solid ${T.border}`, color: T.textDim, fontSize: 10, fontWeight: 600, textTransform: "uppercase" }}>{a}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {moduleKeys.map((mod) => (
                <tr key={mod}>
                  <td style={{ padding: "6px 10px", borderBottom: `1px solid ${T.border}`, color: T.text, fontWeight: 500 }}>{MODULE_LABELS[mod] || mod}</td>
                  {actionKeys.map((action) => {
                    const perm = MODULE_PERMISSIONS[mod]?.[action];
                    if (!perm) return <td key={action} style={{ textAlign: "center", padding: "6px", borderBottom: `1px solid ${T.border}`, color: T.textDim }}>—</td>;
                    const result = checkModulePermission(activeUser, mod, action);
                    return (
                      <td key={action} style={{ textAlign: "center", padding: "6px", borderBottom: `1px solid ${T.border}` }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: result.allowed ? T.green : T.danger + "60", margin: "0 auto" }} title={result.reason} />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Data Domain Access */}
      <Card title="DATA DOMAIN ACCESS" titleColor={T.green}>
        <div style={{ fontSize: 12, color: T.textMid, marginBottom: 12 }}>
          You have access to <strong style={{ color: T.accent }}>{accessibleDomains.length}</strong> of {DATA_CLASSIFICATIONS.length} data domains.
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
          {DATA_CLASSIFICATIONS.map((dc) => {
            const result = checkAccess(activeUser, dc.domain);
            return (
              <div key={dc.domain} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 8px", borderRadius: 4, background: result.allowed ? T.green + "08" : "transparent" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: result.allowed ? T.green : T.danger + "60", flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: result.allowed ? T.text : T.textDim }}>{dc.label}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* VP Dashboard Access */}
      <Card title="VP DASHBOARD ACCESS" titleColor={T.purple}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          {Object.entries(VP_DASHBOARD_ACCESS).map(([vpKey, perm]) => {
            const result = checkVpAccess(activeUser, vpKey);
            return (
              <div key={vpKey} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 6, background: result.allowed ? T.purple + "08" : "transparent", border: `1px solid ${result.allowed ? T.purple + "20" : T.border}` }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: result.allowed ? T.green : T.danger + "60", flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: result.allowed ? T.text : T.textDim }}>{vpKey.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Active Overrides */}
      {activeUser.overrides && activeUser.overrides.length > 0 && (
        <Card title="ACTIVE OVERRIDES" titleColor={T.warn}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {activeUser.overrides.map((o, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 6, background: T.bg0 }}>
                <Badge label={o.granted ? "GRANT" : "REVOKE"} color={o.granted ? T.green : T.danger} />
                <span style={{ fontSize: 12, color: T.text }}>{o.domain}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};


// ═══════════════════════════════════════════════
//  Permissions Admin Panel — Role permission editor (L4+)
// ═══════════════════════════════════════════════
const PermissionsAdminPanel = () => {
  const { activeUser, clearanceLevel, allUsers, refreshConfig } = useBadge();
  const { can, refreshPermConfig } = usePermissions();
  const [editMode, setEditMode] = useState(false);
  const [dirty, setDirty] = useState(() => isPermissionConfigDirty());
  const [, forceRender] = useState(0);

  // Gate: L4+ CEO/COO only
  if (!can("settings", "permissions")) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 60, textAlign: "center" }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: T.danger + "15", border: `2px solid ${T.danger}30`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
          <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={T.danger} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" /></svg>
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 6 }}>Restricted Area</div>
        <div style={{ fontSize: 12, color: T.textDim }}>Permission management requires L4+ clearance (CEO / COO).</div>
      </div>
    );
  }

  const canConfigure = can("settings", "configure");
  const moduleKeys = Object.keys(MODULE_PERMISSIONS);
  const actionKeys = ["view", "edit", "delete", "export", "configure"];
  const roles = ROLE_CLEARANCE.map((r) => r.role);

  const handleSave = () => { savePermissionConfig(); refreshPermConfig(); refreshConfig(); setDirty(true); forceRender(v => v + 1); };
  const handleReset = () => { resetPermissionConfig(); refreshPermConfig(); refreshConfig(); setDirty(false); setEditMode(false); forceRender(v => v + 1); };

  const toggleRole = (mod, action, role) => {
    const perm = MODULE_PERMISSIONS[mod]?.[action];
    if (!perm) return;
    const idx = perm.roles.indexOf(role);
    if (idx >= 0) perm.roles.splice(idx, 1);
    else perm.roles.push(role);
    handleSave();
  };

  const setActionLevel = (mod, action, newLevel) => {
    const perm = MODULE_PERMISSIONS[mod]?.[action];
    if (!perm) return;
    perm.level = newLevel;
    handleSave();
  };

  const toggleVpRole = (vpKey, role) => {
    const perm = VP_DASHBOARD_ACCESS[vpKey];
    if (!perm) return;
    const idx = perm.roles.indexOf(role);
    if (idx >= 0) perm.roles.splice(idx, 1);
    else perm.roles.push(role);
    handleSave();
  };

  const setVpLevel = (vpKey, newLevel) => {
    const perm = VP_DASHBOARD_ACCESS[vpKey];
    if (!perm) return;
    perm.level = newLevel;
    handleSave();
  };

  const selectStyle = { background: T.bg0, border: `1px solid ${T.border}`, borderRadius: 4, padding: "2px 4px", color: T.text, fontSize: 10, outline: "none", width: 48 };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>Permission Matrix</div>
          <div style={{ fontSize: 12, color: T.textDim, marginTop: 4 }}>
            {editMode ? "Click cells to toggle role access. Change level dropdowns to set minimum clearance." : "View the complete permission matrix for all roles across all modules."}
          </div>
        </div>
        {canConfigure && (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={() => setEditMode(!editMode)} style={{ padding: "8px 18px", borderRadius: 8, border: editMode ? `1px solid ${T.danger}40` : "none", background: editMode ? T.danger + "20" : T.accent, color: editMode ? T.danger : "#1A1A1A", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              {editMode ? "Exit Edit Mode" : "Edit Permissions"}
            </button>
            {dirty && (
              <button onClick={handleReset} style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${T.warn}40`, background: T.warn + "15", color: T.warn, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                Reset to Defaults
              </button>
            )}
            {dirty && <span style={{ fontSize: 11, color: T.warn, fontWeight: 600 }}>Modified</span>}
          </div>
        )}
      </div>

      {/* Per-Module Permission Table (all roles as columns) */}
      {moduleKeys.map((mod) => {
        const modPerms = MODULE_PERMISSIONS[mod];
        const modActions = Object.keys(modPerms);
        return (
          <Card key={mod} title={MODULE_LABELS[mod] || mod} titleColor={T.accent}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: "6px 8px", borderBottom: `1px solid ${T.border}`, color: T.textDim, fontSize: 10, fontWeight: 600 }}>Action</th>
                    {editMode && <th style={{ textAlign: "center", padding: "6px 4px", borderBottom: `1px solid ${T.border}`, color: T.textDim, fontSize: 10, fontWeight: 600 }}>Min Level</th>}
                    {roles.map((r) => (
                      <th key={r} style={{ textAlign: "center", padding: "6px 4px", borderBottom: `1px solid ${T.border}`, color: T.textDim, fontSize: 10, fontWeight: 600 }}>{r.replace("VP ", "")}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {modActions.map((action) => {
                    const perm = modPerms[action];
                    return (
                      <tr key={action}>
                        <td style={{ padding: "4px 8px", borderBottom: `1px solid ${T.border}`, color: T.textMid, fontSize: 11, textTransform: "capitalize" }}>{action}</td>
                        {editMode && (
                          <td style={{ textAlign: "center", padding: "4px", borderBottom: `1px solid ${T.border}` }}>
                            <select value={perm.level} style={selectStyle} onChange={(e) => setActionLevel(mod, action, Number(e.target.value))}>
                              {[1,2,3,4,5].map(l => <option key={l} value={l}>L{l}</option>)}
                            </select>
                          </td>
                        )}
                        {roles.map((role) => {
                          const mockUser = allUsers.find((u) => u.role === role) || { role, department: "", overrides: [] };
                          const result = checkModulePermission(mockUser, mod, action);
                          const isInRoles = perm.roles.includes(role);
                          const noRoleRestriction = perm.roles.length === 0;

                          if (editMode) {
                            return (
                              <td key={role} style={{ textAlign: "center", padding: "4px", borderBottom: `1px solid ${T.border}`, cursor: "pointer" }}
                                onClick={() => toggleRole(mod, action, role)}
                                title={noRoleRestriction && !isInRoles ? "No role restriction (open to all at level). Click to add role restriction." : isInRoles ? `Remove ${role}` : `Add ${role}`}
                              >
                                <div style={{ width: 16, height: 16, borderRadius: 3, border: `1px solid ${isInRoles || noRoleRestriction ? T.green : T.border}`, background: isInRoles ? T.green + "30" : noRoleRestriction ? T.green + "10" : "transparent", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  {(isInRoles || noRoleRestriction) && <div style={{ width: 8, height: 8, borderRadius: 2, background: result.allowed ? T.green : T.danger + "60" }} />}
                                </div>
                              </td>
                            );
                          }
                          return (
                            <td key={role} style={{ textAlign: "center", padding: "4px", borderBottom: `1px solid ${T.border}` }}>
                              <div style={{ width: 7, height: 7, borderRadius: "50%", background: result.allowed ? T.green : T.danger + "50", margin: "0 auto" }} title={result.reason} />
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        );
      })}

      {/* VP Dashboard Access Overview */}
      <Card title="VP DASHBOARD ACCESS BY ROLE" titleColor={T.purple}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "6px 8px", borderBottom: `1px solid ${T.border}`, color: T.textDim, fontSize: 10, fontWeight: 600 }}>Dashboard</th>
                {editMode && <th style={{ textAlign: "center", padding: "6px 4px", borderBottom: `1px solid ${T.border}`, color: T.textDim, fontSize: 10, fontWeight: 600 }}>Min Level</th>}
                {roles.map((r) => (
                  <th key={r} style={{ textAlign: "center", padding: "6px 4px", borderBottom: `1px solid ${T.border}`, color: T.textDim, fontSize: 10, fontWeight: 600 }}>{r.replace("VP ", "")}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(VP_DASHBOARD_ACCESS).map(([vpKey, perm]) => (
                <tr key={vpKey}>
                  <td style={{ padding: "4px 8px", borderBottom: `1px solid ${T.border}`, color: T.textMid }}>{vpKey.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</td>
                  {editMode && (
                    <td style={{ textAlign: "center", padding: "4px", borderBottom: `1px solid ${T.border}` }}>
                      <select value={perm.level} style={selectStyle} onChange={(e) => setVpLevel(vpKey, Number(e.target.value))}>
                        {[1,2,3,4,5].map(l => <option key={l} value={l}>L{l}</option>)}
                      </select>
                    </td>
                  )}
                  {roles.map((role) => {
                    const mockUser = { role, department: "", overrides: [] };
                    const result = checkVpAccess(mockUser, vpKey);
                    const isInRoles = perm.roles.includes(role);

                    if (editMode) {
                      return (
                        <td key={role} style={{ textAlign: "center", padding: "4px", borderBottom: `1px solid ${T.border}`, cursor: "pointer" }}
                          onClick={() => toggleVpRole(vpKey, role)}
                          title={isInRoles ? `Remove ${role}` : `Add ${role}`}
                        >
                          <div style={{ width: 16, height: 16, borderRadius: 3, border: `1px solid ${isInRoles ? T.green : T.border}`, background: isInRoles ? T.green + "30" : "transparent", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {isInRoles && <div style={{ width: 8, height: 8, borderRadius: 2, background: result.allowed ? T.green : T.danger + "60" }} />}
                          </div>
                        </td>
                      );
                    }
                    return (
                      <td key={role} style={{ textAlign: "center", padding: "4px", borderBottom: `1px solid ${T.border}` }}>
                        <div style={{ width: 7, height: 7, borderRadius: "50%", background: result.allowed ? T.green : T.danger + "50", margin: "0 auto" }} />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Per-User Override Summary */}
      <Card title="USER OVERRIDES" titleColor={T.warn}>
        <div style={{ fontSize: 12, color: T.textDim, marginBottom: 12 }}>
          Users with active data domain overrides (grants or revocations beyond their role defaults).
        </div>
        {allUsers.filter((u) => u.overrides && u.overrides.length > 0).length === 0 ? (
          <div style={{ textAlign: "center", padding: 20, color: T.textDim, fontSize: 12 }}>No users have active overrides</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {allUsers.filter((u) => u.overrides && u.overrides.length > 0).map((u) => (
              <div key={u.id} style={{ padding: "10px 14px", borderRadius: 8, background: T.bg0, border: `1px solid ${T.border}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{u.name}</span>
                  <Badge label={u.role} color={T.accent} />
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {u.overrides.map((o, i) => (
                    <Badge key={i} label={`${o.granted ? "+" : "-"} ${o.domain}`} color={o.granted ? T.green : T.danger} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
