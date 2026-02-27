import { useState } from "react";
import { T } from "../data/theme";
import { activeSites, SITES } from "../data/sites";
import { EngineLight, KpiCard, StatusPill, Progress, Card, DataTable, TabBar, DraggableGrid, DraggableCardRow } from "../components/ui";

export const AdminView = ({ initialTab, hideChrome } = {}) => {
  const [tab, setTab] = useState(initialTab || "it");
  const [layoutLocked, setLayoutLocked] = useState(true);

  const tabs = [
    { key: "it", label: "IT" },
    { key: "ai", label: "AI" },
    { key: "process", label: "Process" },
    { key: "legal", label: "Legal" }
  ];

  // When controlled externally, sync tab
  const activeTab = initialTab || tab;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, padding: hideChrome ? 0 : "0 20px" }}>
      {!hideChrome && <TabBar tabs={tabs} active={activeTab} onChange={setTab} />}

      {/* IT TAB */}
      {activeTab === "it" && (
        <DraggableGrid
          widgets={[
            {
              id: "admin-it-lights",
              label: "Engine Lights",
              render: () => (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <EngineLight on={false} color={T.green} label="Platform Online" />
                  <EngineLight on={true} color={T.warn} label="Oracle P6 latency" />
                  <EngineLight on={false} color={T.green} label="IoT Network" />
                  <EngineLight on={false} color={T.green} label="Data Pipeline" />
                  <EngineLight on={false} color={T.green} label="VPN Gateway" />
                </div>
              ),
            },
            {
              id: "admin-it-kpis",
              label: "KPIs",
              render: () => (
                <DraggableCardRow
                  items={[
                    { id: "kpi-sens-master", label: "Platform", value: "v4.0", sub: "Executive Intelligence", color: T.accent },
                    { id: "kpi-iot-sensors", label: "IoT Sensors", value: "48", sub: "Active", color: T.green, target: 60 },
                    { id: "kpi-platform-uptime", label: "Platform Uptime", value: "99.8%", color: T.green, target: "99.9%", threshold: "99.0%" },
                    { id: "kpi-data-points", label: "Data Points/Day", value: "2.4M", sub: "~", color: T.teal, target: "3M" },
                    { id: "kpi-api-calls", label: "API Calls/Day", value: "18K", sub: "~", color: T.accent },
                    { id: "kpi-active-users", label: "Active Users", value: "64", sub: "Platform", color: T.blue },
                  ]}
                  locked={layoutLocked}
                  storageKey="sens-admin-it-cards-kpis"
                  renderItem={(item) => <KpiCard label={item.label} value={item.value} sub={item.sub} color={item.color} target={item.target} threshold={item.threshold} />}
                />
              ),
            },
            {
              id: "admin-it-health",
              label: "System Health — 7 Day",
              render: () => (
                <Card title="System Health — 7 Day">
                  <div style={{ display: "flex", gap: 6, marginBottom: 8, fontSize: 10 }}>
                    <span style={{ color: T.textDim }}>Target: <span style={{ color: T.green, fontWeight: 600 }}>99.9%</span></span>
                    <span style={{ color: T.textDim, marginLeft: 8 }}>Fail: <span style={{ color: T.danger, fontWeight: 600 }}>&lt;99.5%</span></span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
                    {[
                      { day: "Mon", val: 99.9 },
                      { day: "Tue", val: 99.8 },
                      { day: "Wed", val: 99.7 },
                      { day: "Thu", val: 99.9 },
                      { day: "Fri", val: 99.6 },
                      { day: "Sat", val: 99.4 },
                      { day: "Sun", val: 99.8 },
                    ].map((item, i) => (
                      <div key={i} style={{ background: T.bg3, borderRadius: 8, padding: "12px 10px", textAlign: "center", border: item.val < 99.5 ? `1px solid ${T.danger}40` : "1px solid transparent" }}>
                        <div style={{ fontSize: 10, color: T.textDim, marginBottom: 6 }}>{item.day}</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: item.val < 99.5 ? T.danger : item.val >= 99.9 ? T.green : T.warn }}>
                          {item.val.toFixed(1)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              ),
            },
            {
              id: "admin-it-systems",
              label: "Platform Systems",
              render: () => (
                <Card title="Platform Systems">
                  <DataTable
                    compact
                    columns={["System", "Status", "Scope", "Uptime", "Last Sync"]}
                    rows={[
                      ["Executive Intelligence Platform", <StatusPill status="green" />, "All Sites", "99.9%", "2 sec"],
                      ["Oracle P6", <StatusPill status="yellow" />, "Construction", "98.2%", "45 sec"],
                      ["IoT Network", <StatusPill status="green" />, "5 sites", "99.7%", "1 sec"],
                      ["Oracle Financials", <StatusPill status="green" />, "All", "99.9%", "5 sec"],
                      ["SCADA Gateway", <StatusPill status="green" />, "5 sites", "99.8%", "1 sec"],
                      ["Veriforce", <StatusPill status="green" />, "Contractors", "99.6%", "15 min"],
                    ]}
                  />
                </Card>
              ),
            },
            {
              id: "admin-it-pipeline",
              label: "Data Pipeline & Integrations",
              render: () => (
                <Card title="Data Pipeline & Integrations">
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
                    {[
                      { label: "SCADA Import", value: "48 streams", status: "green" },
                      { label: "Oracle P6 Sync", value: "4 tables", status: "yellow" },
                      { label: "AWS S3 Export", value: "2.1 TB/day", status: "green" },
                      { label: "Splunk Logs", value: "18.4M/day", status: "green" },
                      { label: "Finance API", value: "847 calls/day", status: "green" },
                      { label: "GeoIP Tracking", value: "52 locations", status: "green" },
                    ].map((item, i) => (
                      <div key={i} style={{ background: T.bg3, borderRadius: 8, padding: "12px 14px", border: `1px solid ${T.border}` }}>
                        <div style={{ fontSize: 10, color: T.textDim, textTransform: "uppercase", letterSpacing: .8, marginBottom: 4 }}>{item.label}</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 8 }}>{item.value}</div>
                        <StatusPill status={item.status} />
                      </div>
                    ))}
                  </div>
                </Card>
              ),
            },
            {
              id: "admin-it-security",
              label: "Cybersecurity",
              render: () => (
                <Card title="Cybersecurity">
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
                    {[
                      { label: "Firewall Rules", value: "2,847" },
                      { label: "Intrusion Events", value: "12" },
                      { label: "Patch Status", value: "99%" },
                      { label: "SSL Certificates", value: "34" },
                      { label: "VPN Users", value: "22" },
                      { label: "Security Alerts", value: "0" },
                    ].map((item, i) => (
                      <div key={i} style={{ background: T.bg1, borderRadius: 8, padding: "12px 14px", border: `1px solid ${T.border}` }}>
                        <div style={{ fontSize: 10, color: T.textDim, textTransform: "uppercase", letterSpacing: .8, marginBottom: 4 }}>{item.label}</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: T.text }}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                </Card>
              ),
            },
            {
              id: "admin-it-budget",
              label: "IT Budget",
              render: () => (
                <Card title="IT Budget">
                  <DataTable
                    compact
                    columns={["Category", "Budget", "Spent", "Remaining", "% Used"]}
                    rows={[
                      ["Infrastructure", "$2.4M", "$1.8M", "$600K", <span style={{ color: T.green, fontWeight: 600 }}>75%</span>],
                      ["Software Licenses", "$680K", "$510K", "$170K", <span style={{ color: T.green, fontWeight: 600 }}>75%</span>],
                      ["Security & Compliance", "$450K", "$340K", "$110K", <span style={{ color: T.green, fontWeight: 600 }}>76%</span>],
                      ["Training & Support", "$280K", "$195K", "$85K", <span style={{ color: T.green, fontWeight: 600 }}>70%</span>],
                    ]}
                  />
                </Card>
              ),
            },
          ]}
          storageKey="sens-admin-it-layout"
          locked={layoutLocked}
          onLockedChange={setLayoutLocked}
        />
      )}

      {/* AI TAB */}
      {activeTab === "ai" && (
        <DraggableGrid
          widgets={[
            {
              id: "admin-ai-lights",
              label: "Engine Lights",
              render: () => (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <EngineLight on={false} color={T.green} label="AI Agents 5/6" />
                  <EngineLight on={true} color={T.blue} label="Finance Agent training" />
                  <EngineLight on={true} color={T.warn} label="Compliance Agent building" />
                  <EngineLight on={false} color={T.green} label="Model Accuracy > 90%" />
                  <EngineLight on={false} color={T.green} label="Skills Registry synced" />
                </div>
              ),
            },
            {
              id: "admin-ai-kpis",
              label: "KPIs",
              render: () => (
                <DraggableCardRow
                  items={[
                    { id: "kpi-ai-agents", label: "AI Agents", value: "40+", sub: "Across all depts", color: T.blue },
                    { id: "kpi-operational", label: "Operational", value: "5/6", sub: "Specialist agents", color: T.green, target: "6/6", threshold: "4/6" },
                    { id: "kpi-skills", label: "Skills", value: "184", sub: "Registered", color: T.accent, target: 200 },
                    { id: "kpi-data-sources", label: "Data Sources", value: "62", sub: "Connected", color: T.teal },
                    { id: "kpi-connectors", label: "Connectors", value: "28", sub: "Active", color: T.purple },
                    { id: "kpi-tasks-day", label: "Tasks/Day", value: "21K+", sub: "All agents", color: T.orange },
                  ]}
                  locked={layoutLocked}
                  storageKey="sens-admin-ai-cards-kpis"
                  renderItem={(item) => <KpiCard label={item.label} value={item.value} sub={item.sub} color={item.color} target={item.target} threshold={item.threshold} />}
                />
              ),
            },
            {
              id: "admin-ai-fleet",
              label: "Agent Fleet",
              render: () => (
                <Card title="Agent Fleet — Specialist Agents">
                  <DataTable
                    compact
                    columns={["Agent", "Function", "Coverage", "Accuracy", "Tasks/Day", "Status"]}
                    rows={[
                      ["Finance Agent", "Revenue forecasting", "All sites", "94%", "2,840", <StatusPill status="green" />],
                      ["Scheduling Agent", "Processor optimization", "Noble, Richmond", "91%", "1,240", <StatusPill status="green" />],
                      ["Quality Agent", "Carbon grade optimization", "All ops", "96%", "3,120", <StatusPill status="green" />],
                      ["Supply Chain Agent", "Inventory optimization", "All", "88%", "840", <StatusPill status="green" />],
                      ["Maintenance Agent", "Predictive maintenance", "All", "85%", "560", <StatusPill status="blue" />],
                      ["Compliance Agent", "Regulatory monitoring", "All", "—", "12,400", <StatusPill status="construction" />],
                    ]}
                  />
                </Card>
              ),
            },
            {
              id: "admin-ai-teams",
              label: "Agent Teams",
              render: () => (
                <Card title="Agent Teams by Department">
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
                    {[
                      { dept: "Executive", teams: 2, agents: 8, color: T.accent },
                      { dept: "Engineering", teams: 1, agents: 4, color: T.green },
                      { dept: "Project Mgmt", teams: 1, agents: 4, color: T.green },
                      { dept: "Maintenance", teams: 1, agents: 4, color: T.purple },
                      { dept: "Operations", teams: 1, agents: 4, color: T.purple },
                      { dept: "Risk", teams: 1, agents: 4, color: T.purple },
                      { dept: "Logistics", teams: 1, agents: 4, color: T.purple },
                      { dept: "Strategy", teams: 1, agents: 3, color: T.blue },
                      { dept: "Finance", teams: 1, agents: 4, color: T.blue },
                      { dept: "Marketing", teams: 1, agents: 3, color: T.blue },
                      { dept: "Process", teams: 1, agents: 3, color: T.teal },
                      { dept: "People", teams: 1, agents: 3, color: T.teal },
                      { dept: "Legal", teams: 1, agents: 3, color: T.teal },
                    ].map((item, i) => (
                      <div key={i} style={{ background: T.bg3, borderRadius: 8, padding: "12px 14px", border: `1px solid ${T.border}` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: item.color }} />
                          <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{item.dept}</div>
                        </div>
                        <div style={{ display: "flex", gap: 16 }}>
                          <div>
                            <div style={{ fontSize: 10, color: T.textDim, textTransform: "uppercase", letterSpacing: .8 }}>Teams</div>
                            <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>{item.teams}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 10, color: T.textDim, textTransform: "uppercase", letterSpacing: .8 }}>Agents</div>
                            <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>{item.agents}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              ),
            },
            {
              id: "admin-ai-skills",
              label: "Skills Registry",
              render: () => (
                <Card title="Skills Registry">
                  <DataTable
                    compact
                    columns={["Skill Category", "Skills", "Agents Using", "Dept Coverage", "Status"]}
                    rows={[
                      ["Financial Analysis", "12", "6", "Finance, Strategy", <StatusPill status="green" />],
                      ["Process Monitoring", "18", "8", "Operations, Maint", <StatusPill status="green" />],
                      ["Predictive Analytics", "9", "4", "Maint, Operations, Finance", <StatusPill status="green" />],
                      ["Document & Contract Mgmt", "14", "5", "Legal, Process", <StatusPill status="green" />],
                      ["Safety & Compliance", "11", "6", "Risk, Process", <StatusPill status="green" />],
                      ["Supply Chain Optimization", "8", "4", "Logistics, Operations", <StatusPill status="green" />],
                      ["Investor & Board Relations", "7", "3", "Strategy, Executive", <StatusPill status="green" />],
                      ["Recruitment & HR", "6", "3", "People", <StatusPill status="green" />],
                      ["Construction & Project", "10", "5", "Delivering", <StatusPill status="green" />],
                      ["Cross-Dept Coordination", "8", "4", "Executive, All", <StatusPill status="blue" />],
                    ]}
                  />
                </Card>
              ),
            },
            {
              id: "admin-ai-datasources",
              label: "Data Sources",
              render: () => (
                <Card title="Data Sources">
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                    {[
                      { label: "SCADA Real-Time", value: "48 streams", status: "green", agents: "8 agents" },
                      { label: "Oracle Financials", value: "Full GL", status: "green", agents: "6 agents" },
                      { label: "Oracle P6 Schedules", value: "2 projects", status: "yellow", agents: "5 agents" },
                      { label: "IoT Sensor Feeds", value: "48 sensors", status: "green", agents: "4 agents" },
                      { label: "Lab LIMS", value: "Quality data", status: "green", agents: "3 agents" },
                      { label: "Incident Database", value: "Risk records", status: "green", agents: "4 agents" },
                      { label: "Investor Pipeline", value: "CRM data", status: "green", agents: "3 agents" },
                      { label: "Contract Repository", value: "34 contracts", status: "green", agents: "4 agents" },
                      { label: "HRIS / ATS", value: "HR data", status: "green", agents: "3 agents" },
                      { label: "Market Pricing Feeds", value: "Commodities", status: "green", agents: "3 agents" },
                      { label: "Data Lake (S3)", value: "2.1 TB/day", status: "green", agents: "12 agents" },
                      { label: "Training Datasets", value: "ML models", status: "green", agents: "6 agents" },
                    ].map((item, i) => (
                      <div key={i} style={{ background: T.bg3, borderRadius: 8, padding: "12px 14px", border: `1px solid ${T.border}` }}>
                        <div style={{ fontSize: 10, color: T.textDim, textTransform: "uppercase", letterSpacing: .8, marginBottom: 4 }}>{item.label}</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 4 }}>{item.value}</div>
                        <div style={{ fontSize: 10, color: T.textMid, marginBottom: 8 }}>{item.agents}</div>
                        <StatusPill status={item.status} />
                      </div>
                    ))}
                  </div>
                </Card>
              ),
            },
            {
              id: "admin-ai-connectors",
              label: "Connectors",
              render: () => (
                <Card title="Third-Party Connectors">
                  <DataTable
                    compact
                    columns={["Connector", "Category", "Agents Connected", "Status", "Last Sync"]}
                    rows={[
                      ["Oracle Financials", "ERP", "6", <StatusPill status="green" />, "5 sec"],
                      ["Oracle P6", "Project Mgmt", "5", <StatusPill status="yellow" />, "45 sec"],
                      ["Salesforce", "CRM", "4", <StatusPill status="green" />, "30 sec"],
                      ["AWS CloudWatch", "Monitoring", "3", <StatusPill status="green" />, "Real-time"],
                      ["Splunk", "Logging", "3", <StatusPill status="green" />, "Real-time"],
                      ["Veriforce", "Safety", "4", <StatusPill status="green" />, "15 min"],
                      ["Procore", "Construction", "3", <StatusPill status="green" />, "5 min"],
                      ["DocuSign", "Legal", "3", <StatusPill status="green" />, "On demand"],
                      ["Slack", "Comms", "5", <StatusPill status="green" />, "Real-time"],
                      ["Workday", "HR", "2", <StatusPill status="green" />, "1 hr"],
                      ["MLflow", "ML Ops", "2", <StatusPill status="green" />, "On demand"],
                      ["AWS SageMaker", "ML Training", "2", <StatusPill status="green" />, "On demand"],
                      ["S&P Capital IQ", "Market Data", "1", <StatusPill status="yellow" />, "Pending"],
                      ["Bloomberg Terminal", "Market Data", "1", <StatusPill status="yellow" />, "Pending"],
                    ]}
                  />
                </Card>
              ),
            },
            {
              id: "admin-ai-performance",
              label: "Agent Performance",
              render: () => (
                <Card title="Agent Performance & Training">
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                    {[
                      { agent: "Finance Agent", accuracy: 94, trend: "+2%" },
                      { agent: "Scheduling Agent", accuracy: 91, trend: "+1%" },
                      { agent: "Quality Agent", accuracy: 96, trend: "stable" },
                      { agent: "Supply Chain Agent", accuracy: 88, trend: "+3%" },
                      { agent: "Maintenance Agent", accuracy: 85, trend: "+4%" },
                      { agent: "Site Performance", accuracy: 92, trend: "+1%" },
                    ].map((item, i) => (
                      <div key={i} style={{ background: T.bg3, borderRadius: 8, padding: "12px 14px", border: `1px solid ${T.border}` }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: T.text, marginBottom: 8 }}>{item.agent}</div>
                        <Progress pct={item.accuracy} color={item.accuracy >= 95 ? T.green : item.accuracy >= 85 ? T.warn : T.danger} showLabel target={95} threshold={85} />
                        <div style={{ fontSize: 10, color: item.trend.startsWith("+") ? T.green : T.textMid, marginTop: 6 }}>{item.trend} vs last month</div>
                      </div>
                    ))}
                  </div>
                </Card>
              ),
            },
            {
              id: "admin-ai-budget",
              label: "AI / ML Budget",
              render: () => (
                <Card title="AI / ML Budget">
                  <DataTable
                    compact
                    columns={["Category", "Budget", "Spent", "Remaining", "% Used"]}
                    rows={[
                      ["Agent Development", "$480K", "$360K", "$120K", <span style={{ color: T.green, fontWeight: 600 }}>75%</span>],
                      ["ML Model Training", "$320K", "$240K", "$80K", <span style={{ color: T.green, fontWeight: 600 }}>75%</span>],
                      ["Cloud Compute (AI)", "$260K", "$210K", "$50K", <span style={{ color: T.warn, fontWeight: 600 }}>81%</span>],
                      ["Data Labeling & QA", "$80K", "$55K", "$25K", <span style={{ color: T.green, fontWeight: 600 }}>69%</span>],
                      ["AI Research & Innovation", "$60K", "$35K", "$25K", <span style={{ color: T.green, fontWeight: 600 }}>58%</span>],
                    ]}
                  />
                </Card>
              ),
            },
          ]}
          storageKey="sens-admin-ai-layout"
          locked={layoutLocked}
          onLockedChange={setLayoutLocked}
        />
      )}

      {/* PROCESS TAB */}
      {activeTab === "process" && (
        <DraggableGrid
          widgets={[
            {
              id: "admin-process-lights",
              label: "Engine Lights",
              render: () => (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <EngineLight on={false} color={T.green} label="All firms pre-qualified" />
                  <EngineLight on={false} color={T.green} label="TRIR compliance" />
                  <EngineLight on={false} color={T.green} label="Insurance current" />
                  <EngineLight on={true} color={T.warn} label="WSP contract renewal Q4" />
                  <EngineLight on={true} color={T.warn} label="Spend MTD 105%" />
                </div>
              ),
            },
            {
              id: "admin-process-kpis",
              label: "KPIs",
              render: () => (
                <DraggableCardRow
                  items={[
                    { id: "kpi-contractors", label: "Contractors", value: "148", sub: "8 firms", color: T.accent },
                    { id: "kpi-active-contracts", label: "Active Contracts", value: "12", color: T.blue },
                    { id: "kpi-compliance", label: "Compliance", value: "100%", color: T.green, target: "100%", threshold: "95%" },
                    { id: "kpi-spend-mtd", label: "Spend MTD", value: "$4.2M", color: T.warn, target: "$4.0M", threshold: "$5.0M", invert: true },
                    { id: "kpi-spend-ytd", label: "Spend YTD", value: "$12.8M", color: T.accent },
                    { id: "kpi-open-changes", label: "Open Change Orders", value: "3", color: T.orange },
                  ]}
                  locked={layoutLocked}
                  storageKey="sens-admin-process-cards-kpis"
                  renderItem={(item) => <KpiCard label={item.label} value={item.value} sub={item.sub} color={item.color} target={item.target} threshold={item.threshold} invert={item.invert} />}
                />
              ),
            },
            {
              id: "admin-process-contractors",
              label: "Contractor Performance",
              render: () => (
                <Card title="Contractor Performance">
                  <DataTable
                    compact
                    columns={["Firm", "Scope", "Sites", "HC", "Quality Score", "Safety Score", "Status"]}
                    rows={[
                      ["Cissell Mueller", "EPC", "Noble B", "42", "94%", "98%", <StatusPill status="green" />],
                      ["Brown & Root", "EPC", "Portland OR", "28", "91%", "96%", <StatusPill status="green" />],
                      ["Texas Vessel", "Fabrication", "All", "32", "88%", "94%", <StatusPill status="green" />],
                      ["RTR Environmental", "Supply", "Noble OK", "12", "96%", "99%", <StatusPill status="green" />],
                      ["Mid-Atlantic Tire Recycling", "Supply", "Richmond/Tucson", "8", "93%", "95%", <StatusPill status="green" />],
                      ["Gulf Coast Rubber", "Supply", "Baton Rouge", "6", "89%", "92%", <StatusPill status="green" />],
                      ["Midwest Tire Recyclers", "Supply", "Columbus OH", "4", "90%", "97%", <StatusPill status="green" />],
                      ["WSP Global", "Engineering", "Coal FL-456", "12", "85%", "91%", <StatusPill status="yellow" />],
                    ]}
                  />
                </Card>
              ),
            },
            {
              id: "admin-process-actions",
              label: "Action Items",
              render: () => (
                <Card title="Action Items">
                  <DataTable
                    compact
                    columns={["Item", "Owner", "Due Date", "Priority", "Status"]}
                    rows={[
                      ["Review WSP contract terms", "Legal", "2026-03-15", "High", <StatusPill status="yellow" />],
                      ["Approve change order #3", "Finance", "2026-02-28", "High", <StatusPill status="yellow" />],
                      ["Site safety audit — Portland OR", "Operations", "2026-03-10", "Medium", <StatusPill status="green" />],
                      ["Procurement RFQ round 2", "Supply Chain", "2026-03-01", "Medium", <StatusPill status="green" />],
                      ["Contractor performance review", "HR", "2026-03-05", "Low", <StatusPill status="green" />],
                    ]}
                  />
                </Card>
              ),
            },
            {
              id: "admin-process-changeorders",
              label: "Change Orders",
              render: () => (
                <Card title="Change Orders">
                  <DataTable
                    compact
                    columns={["Order", "Description", "Amount", "Status", "Impact"]}
                    rows={[
                      ["CO-2024-001", "Noble B — Additional EPC scope", "$2.1M", <StatusPill status="green" />, "Schedule +30d"],
                      ["CO-2024-002", "Portland OR — Design modifications", "$840K", <StatusPill status="green" />, "Schedule +14d"],
                      ["CO-2025-003", "WSP Global — Extended services", "$320K", <StatusPill status="yellow" />, "Pending approval"],
                    ]}
                  />
                </Card>
              ),
            },
            {
              id: "admin-process-compliance",
              label: "Compliance Calendar",
              render: () => (
                <Card title="Compliance Calendar">
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
                    {[
                      { event: "TRIR Audit", date: "Mar 10", status: "green" },
                      { event: "Insurance Renewal", date: "Sep 15", status: "yellow" },
                      { event: "EPA Reporting", date: "Apr 1", status: "green" },
                      { event: "OSHA Inspection", date: "Mar 25", status: "green" },
                      { event: "Permit Renewal", date: "May 30", status: "green" },
                      { event: "Contract Audit", date: "Feb 28", status: "yellow" },
                    ].map((item, i) => (
                      <div key={i} style={{ background: T.bg3, borderRadius: 8, padding: "12px 14px", border: `1px solid ${T.border}` }}>
                        <div style={{ fontSize: 11, color: T.textDim, textTransform: "uppercase", letterSpacing: .8, marginBottom: 4 }}>{item.event}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 8 }}>{item.date}</div>
                        <StatusPill status={item.status} />
                      </div>
                    ))}
                  </div>
                </Card>
              ),
            },
            {
              id: "admin-process-procurement",
              label: "Procurement Pipeline",
              render: () => (
                <Card title="Procurement Pipeline">
                  <DataTable
                    compact
                    columns={["Item", "Category", "Stage", "Est. Value", "Timeline"]}
                    rows={[
                      ["Tire feedstock — 2026 contract", "Materials", "RFQ Phase", "$8.2M", "Q2 2026"],
                      ["SCADA upgrades", "IT", "Evaluation", "$340K", "Q3 2026"],
                      ["Maintenance equipment", "Equipment", "Requirements", "$180K", "Q4 2026"],
                      ["Engineering services", "Professional Services", "RFP Draft", "$520K", "Q2 2026"],
                    ]}
                  />
                </Card>
              ),
            },
          ]}
          storageKey="sens-admin-process-layout"
          locked={layoutLocked}
          onLockedChange={setLayoutLocked}
        />
      )}

      {/* People tab removed — now served by dedicated Workforce view */}
      {false && (
        <DraggableGrid
          widgets={[
            {
              id: "admin-people-lights",
              label: "Engine Lights",
              render: () => (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <EngineLight on={true} color={T.warn} label="Turnover 14%" />
                  <EngineLight on={true} color={T.danger} label="Process Eng Baton Rouge urgent" />
                  <EngineLight on={true} color={T.warn} label="8 open roles" />
                  <EngineLight on={false} color={T.green} label="Training 93%" />
                  <EngineLight on={true} color={T.warn} label="Engagement 78%" />
                </div>
              ),
            },
            {
              id: "admin-people-kpis",
              label: "KPIs",
              render: () => (
                <DraggableCardRow
                  items={[
                    { id: "kpi-employees", label: "Employees", value: "52", sub: "All sites + HQ", color: T.accent },
                    { id: "kpi-open-roles", label: "Open Roles", value: "8", color: T.danger, target: 0, threshold: 10, invert: true },
                    { id: "kpi-turnover", label: "Turnover", value: "14%", color: T.warn, target: "10%", threshold: "20%", invert: true },
                    { id: "kpi-engagement", label: "Engagement", value: "78%", color: T.warn, target: "85%", threshold: "70%" },
                    { id: "kpi-training", label: "Training", value: "93%", color: T.green, target: "95%", threshold: "85%" },
                    { id: "kpi-avg-tenure", label: "Avg Tenure", value: "1.8 yrs", color: T.blue },
                  ]}
                  locked={layoutLocked}
                  storageKey="sens-admin-people-cards-kpis"
                  renderItem={(item) => <KpiCard label={item.label} value={item.value} sub={item.sub} color={item.color} target={item.target} threshold={item.threshold} invert={item.invert} />}
                />
              ),
            },
            {
              id: "admin-people-headcount",
              label: "Headcount by Site",
              render: () => (
                <Card title="Headcount by Site">
                  <DataTable
                    compact
                    columns={["Site", "Operations", "Maintenance", "Management", "Total", "Status"]}
                    rows={[
                      ...activeSites.map(s => [
                        s.short,
                        Math.ceil(s.processors * 3),
                        Math.ceil(s.processors * 1.5),
                        "2",
                        Math.ceil(s.processors * 3) + Math.ceil(s.processors * 1.5) + 2,
                        <StatusPill status="green" />
                      ]),
                      ["HQ", "—", "—", "12", "12", <StatusPill status="green" />],
                    ]}
                  />
                </Card>
              ),
            },
            {
              id: "admin-people-openroles",
              label: "Open Positions",
              render: () => (
                <Card title="Open Positions">
                  <DataTable
                    compact
                    columns={["Role", "Location", "Level", "Salary Band", "Timeline", "Status"]}
                    rows={[
                      ["Process Engineer", "Baton Rouge", "Mid", "$85-95K", "Urgent (1 week)", <StatusPill status="red" />],
                      ["Operations Manager", "Noble OK", "Senior", "$110-130K", "2 weeks", <StatusPill status="yellow" />],
                      ["Maintenance Technician", "Richmond VA", "Mid", "$65-75K", "3 weeks", <StatusPill status="green" />],
                      ["QA/Lab Analyst", "Tucson AZ", "Entry", "$55-65K", "3 weeks", <StatusPill status="green" />],
                      ["Safety Officer", "All sites", "Senior", "$95-110K", "2 weeks", <StatusPill status="yellow" />],
                      ["Data Analyst", "HQ", "Mid", "$80-95K", "4 weeks", <StatusPill status="green" />],
                      ["IT Systems Admin", "HQ", "Mid", "$75-90K", "3 weeks", <StatusPill status="green" />],
                      ["HR Coordinator", "HQ", "Entry", "$50-60K", "2 weeks", <StatusPill status="green" />],
                    ]}
                  />
                </Card>
              ),
            },
            {
              id: "admin-people-training",
              label: "Training Matrix",
              render: () => (
                <Card title="Training & Certification Matrix">
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
                    {[
                      { program: "Safety Training", completed: 49, total: 52 },
                      { program: "Process Certification", completed: 45, total: 52 },
                      { program: "Quality Control", completed: 42, total: 52 },
                      { program: "Equipment Operation", completed: 48, total: 52 },
                      { program: "Leadership Development", completed: 18, total: 22 },
                      { program: "Technical Specialization", completed: 38, total: 52 },
                    ].map((item, i) => {
                      const pct = Math.round((item.completed / item.total) * 100);
                      return (
                        <div key={i} style={{ background: T.bg3, borderRadius: 8, padding: "12px 14px", border: `1px solid ${T.border}` }}>
                          <div style={{ fontSize: 10, color: T.textDim, textTransform: "uppercase", letterSpacing: .8, marginBottom: 8 }}>{item.program}</div>
                          <Progress pct={pct} color={pct >= 100 ? T.green : pct >= 85 ? T.green : T.warn} showLabel target={100} threshold={85} />
                          <div style={{ fontSize: 11, color: T.textMid, marginTop: 6 }}>{item.completed}/{item.total} employees</div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              ),
            },
            {
              id: "admin-people-certifications",
              label: "Certifications Expiring",
              render: () => (
                <Card title="Certifications Expiring">
                  <DataTable
                    compact
                    columns={["Employee", "Certification", "Expires", "Days Left", "Action"]}
                    rows={[
                      ["Mike Johnson", "OSHA 30-Hour", "2026-03-15", "19", <StatusPill status="yellow" />],
                      ["Sarah Chen", "Forklift Operation", "2026-03-08", "12", <StatusPill status="yellow" />],
                      ["David Martinez", "First Aid/CPR", "2026-02-28", "4", <StatusPill status="red" />],
                      ["Lisa Anderson", "Environmental Safety", "2026-04-12", "47", <StatusPill status="green" />],
                      ["James Wilson", "Confined Space Entry", "2026-05-20", "85", <StatusPill status="green" />],
                    ]}
                  />
                </Card>
              ),
            },
            {
              id: "admin-people-succession",
              label: "Succession Planning",
              render: () => (
                <Card title="Succession Planning">
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                    {[
                      { role: "Plant Manager", current: "Bob Stevens", successor: "Mike Johnson", readiness: "75%" },
                      { role: "Ops Director", current: "Karen Lee", successor: "Sarah Chen", readiness: "85%" },
                      { role: "Chief Engineer", current: "Tom Bradley", successor: "David Martinez", readiness: "60%" },
                      { role: "HR Manager", current: "Jennifer Wu", successor: "None identified", readiness: "0%" },
                    ].map((item, i) => (
                      <div key={i} style={{ background: T.bg3, borderRadius: 8, padding: "12px 14px", border: `1px solid ${T.border}` }}>
                        <div style={{ fontSize: 10, color: T.textDim, textTransform: "uppercase", letterSpacing: .8, marginBottom: 6 }}>{item.role}</div>
                        <div style={{ fontSize: 11, color: T.textMid, marginBottom: 4 }}>Current: <strong style={{ color: T.text }}>{item.current}</strong></div>
                        <div style={{ fontSize: 11, color: T.textMid, marginBottom: 8 }}>Successor: <strong style={{ color: T.text }}>{item.successor}</strong></div>
                        <Progress pct={parseInt(item.readiness)} color={parseInt(item.readiness) > 70 ? T.green : T.warn} showLabel />
                      </div>
                    ))}
                  </div>
                </Card>
              ),
            },
            {
              id: "admin-people-engagement",
              label: "Employee Engagement",
              render: () => (
                <Card title="Employee Engagement">
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
                    {[
                      { metric: "Overall Engagement", score: 78 },
                      { metric: "Job Satisfaction", score: 82 },
                      { metric: "Management Trust", score: 74 },
                      { metric: "Career Development", score: 71 },
                      { metric: "Work-Life Balance", score: 68 },
                      { metric: "Company Culture", score: 79 },
                    ].map((item, i) => (
                      <div key={i} style={{ background: T.bg1, borderRadius: 8, padding: "12px 14px", border: `1px solid ${T.border}` }}>
                        <div style={{ fontSize: 10, color: T.textDim, textTransform: "uppercase", letterSpacing: .8, marginBottom: 8 }}>{item.metric}</div>
                        <Progress pct={item.score} color={item.score >= 85 ? T.green : item.score >= 70 ? T.warn : T.danger} showLabel target={85} threshold={70} />
                      </div>
                    ))}
                  </div>
                </Card>
              ),
            },
          ]}
          storageKey="sens-admin-people-layout"
          locked={layoutLocked}
          onLockedChange={setLayoutLocked}
        />
      )}

      {/* LEGAL TAB */}
      {activeTab === "legal" && (
        <DraggableGrid
          widgets={[
            {
              id: "admin-legal-lights",
              label: "Engine Lights",
              render: () => (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <EngineLight on={true} color={T.warn} label="Property Insurance renewal Sep" />
                  <EngineLight on={true} color={T.warn} label="Environmental Insurance renewal Dec" />
                  <EngineLight on={false} color={T.green} label="EPC contracts current" />
                  <EngineLight on={false} color={T.green} label="IP portfolio secure" />
                  <EngineLight on={false} color={T.green} label="Regulatory compliant" />
                </div>
              ),
            },
            {
              id: "admin-legal-kpis",
              label: "KPIs",
              render: () => (
                <DraggableCardRow
                  items={[
                    { id: "kpi-active-contracts-legal", label: "Active Contracts", value: "34", color: T.accent },
                    { id: "kpi-renewals-due", label: "Renewals Due", value: "3", color: T.warn },
                    { id: "kpi-insurance", label: "Insurance", value: "$337M", color: T.blue },
                    { id: "kpi-ip-patents", label: "IP/Patents", value: "4", color: T.green },
                    { id: "kpi-litigation", label: "Litigation", value: "0", color: T.green },
                    { id: "kpi-regulatory-filings", label: "Regulatory Filings", value: "12", color: T.accent },
                  ]}
                  locked={layoutLocked}
                  storageKey="sens-admin-legal-cards-kpis"
                  renderItem={(item) => <KpiCard label={item.label} value={item.value} sub={item.sub} color={item.color} />}
                />
              ),
            },
            {
              id: "admin-legal-insurance",
              label: "Insurance Portfolio",
              render: () => (
                <Card title="Insurance Portfolio">
                  <DataTable
                    compact
                    columns={["Coverage", "Limit", "Premium", "Scope", "Renewal", "Status"]}
                    rows={[
                      ["General Liability", "$25M", "$180K/yr", "All operations", "Jun 2026", <StatusPill status="green" />],
                      ["Property", "$85M", "$420K/yr", "Operational facilities", "Sep 2026", <StatusPill status="yellow" />],
                      ["Environmental", "$50M", "$280K/yr", "All sites", "Dec 2026", <StatusPill status="yellow" />],
                      ["Builder's Risk", "$162M", "$520K/yr", "Construction sites", "Dec 2026", <StatusPill status="green" />],
                      ["D&O (Directors & Officers)", "$15M", "$95K/yr", "Corporate", "Aug 2026", <StatusPill status="green" />],
                      ["Workers' Compensation", "$5M", "$340K/yr", "All employees", "Jan 2027", <StatusPill status="green" />],
                    ]}
                  />
                </Card>
              ),
            },
            {
              id: "admin-legal-contracts",
              label: "Key Contracts",
              render: () => (
                <Card title="Key Contracts">
                  <DataTable
                    compact
                    columns={["Contract", "Counterparty", "Value", "Start", "End", "Status"]}
                    rows={[
                      ["EPC — Noble B", "Cissell Mueller", "$110M", "2024-06", "2028-06", <StatusPill status="green" />],
                      ["EPC — Portland OR", "Brown & Root", "$52M", "2024-09", "2028-09", <StatusPill status="green" />],
                      ["Engineering Services", "WSP Global", "$2.4M", "2024-01", "2025-12", <StatusPill status="yellow" />],
                      ["Tire Feedstock Supply", "Multiple", "$24M/yr", "2025-01", "2026-12", <StatusPill status="green" />],
                      ["Technology Platform", "Various", "$1.8M/yr", "Ongoing", "Ongoing", <StatusPill status="green" />],
                      ["Real Estate Leases", "Multiple", "$480K/yr", "Various", "Various", <StatusPill status="green" />],
                    ]}
                  />
                </Card>
              ),
            },
            {
              id: "admin-legal-regulatory",
              label: "Regulatory Calendar",
              render: () => (
                <Card title="Regulatory Calendar">
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
                    {[
                      { filing: "EPA Quarterly Report", dueDate: "Apr 15", status: "green" },
                      { filing: "State Environmental Filing", dueDate: "Mar 1", status: "yellow" },
                      { filing: "OSHA Annual Report", dueDate: "Feb 28", status: "yellow" },
                      { filing: "RIN Biofuel Filing", dueDate: "May 31", status: "green" },
                      { filing: "Property Tax Assessment", dueDate: "Jun 30", status: "green" },
                      { filing: "Permit Renewal — All Sites", dueDate: "May 30", status: "green" },
                    ].map((item, i) => (
                      <div key={i} style={{ background: T.bg3, borderRadius: 8, padding: "12px 14px", border: `1px solid ${T.border}` }}>
                        <div style={{ fontSize: 10, color: T.textDim, textTransform: "uppercase", letterSpacing: .8, marginBottom: 4 }}>{item.filing}</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 8 }}>{item.dueDate}</div>
                        <StatusPill status={item.status} />
                      </div>
                    ))}
                  </div>
                </Card>
              ),
            },
            {
              id: "admin-legal-ip",
              label: "IP Portfolio",
              render: () => (
                <Card title="IP Portfolio">
                  <DataTable
                    compact
                    columns={["Patent", "Technology", "Scope", "Filing Date", "Expiration", "Status"]}
                    rows={[
                      ["TiPs Process", "Core pyrolysis methodology", "Thermal pyrolysis", "2021-03", "2041-03", <StatusPill status="green" />],
                      ["Selective Depolymerization", "Temperature control optimization", "Process efficiency", "2022-06", "2042-06", <StatusPill status="green" />],
                      ["Diluent Fractionation", "Separation & purification IP", "Product quality", "2023-01", "2043-01", <StatusPill status="blue" />],
                      ["Carbon Grade N330", "Optimization algorithms", "Carbon product", "2023-09", "2043-09", <StatusPill status="green" />],
                    ]}
                  />
                </Card>
              ),
            },
            {
              id: "admin-legal-spend",
              label: "Legal Spend",
              render: () => (
                <Card title="Legal Spend">
                  <DataTable
                    compact
                    columns={["Category", "Budget", "Spent YTD", "Remaining", "% Used"]}
                    rows={[
                      ["Contract Management", "$320K", "$85K", "$235K", <span style={{ color: T.green, fontWeight: 600 }}>27%</span>],
                      ["Litigation & Disputes", "$180K", "$12K", "$168K", <span style={{ color: T.green, fontWeight: 600 }}>7%</span>],
                      ["Regulatory Compliance", "$240K", "$140K", "$100K", <span style={{ color: T.green, fontWeight: 600 }}>58%</span>],
                      ["IP Protection & Patents", "$160K", "$95K", "$65K", <span style={{ color: T.green, fontWeight: 600 }}>59%</span>],
                      ["Corporate Governance", "$100K", "$45K", "$55K", <span style={{ color: T.green, fontWeight: 600 }}>45%</span>],
                    ]}
                  />
                </Card>
              ),
            },
          ]}
          storageKey="sens-admin-legal-layout"
          locked={layoutLocked}
          onLockedChange={setLayoutLocked}
        />
      )}
    </div>
  );
};
