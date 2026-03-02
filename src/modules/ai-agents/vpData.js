import { T } from "@core/theme/theme";

/**
 * Agent Detail Schema — every agent (lead or specialist) carries:
 *   skills:      string[] — what this agent can do
 *   dataSources: string[] — what data this agent reads/writes
 *   connectors:  { name, icon?, status }[] — third-party systems
 *   taskHistory:  { date, action, result, status }[] — recent task log
 */

// ─── Helper: build a standard agent detail block ──────────────────
const agentDetail = (overrides = {}) => ({
  skills: [],
  dataSources: [],
  connectors: [],
  taskHistory: [],
  ...overrides,
});

// ═══════════════════════════════════════════════════════════════════
//  CEO AGENT TEAM  — top of the hierarchy
// ═══════════════════════════════════════════════════════════════════
export const ceoAgentTeam = {
  key: "ceo",
  title: "CEO",
  branch: "Executive",
  color: T.accent,
  focusAreas: ["Strategic Growth", "Investor Relations", "Board Governance", "Portfolio Expansion", "Market Positioning"],
  kpis: [
    { label: "Portfolio Sites", value: "7", sub: "5 active, 2 construction" },
    { label: "Revenue MTD", value: "$9.1M", sub: "vs $9.4M budget" },
    { label: "Series C Progress", value: "12%", sub: "8 meetings this month" },
    { label: "Company Headcount", value: "347", sub: "+12 this quarter" },
  ],
  quickLinks: [
    { label: "Dashboard", target: "dashboard" },
    { label: "COO Dashboard", target: "coo" },
    { label: "Finance & Strategy", target: "finance" },
    { label: "Org Chart", target: "org" },
  ],
  agentTeam: {
    lead: {
      id: "ceo-ea",
      name: "CEO EA",
      role: "Chief Executive Assistant",
      description: "Your top-level executive assistant. Aggregates insights from every VP agent team, prepares board-level summaries, and routes questions to the right department.",
      exampleQuestions: [
        "Give me a full company status briefing",
        "What are the top 5 risks across the portfolio right now?",
        "Prepare talking points for tomorrow's board call",
        "How are we tracking against Series C milestones?",
      ],
      ...agentDetail({
        skills: ["Cross-department briefing", "Board prep", "Risk escalation routing", "KPI aggregation", "Meeting prep", "Decision memo drafting"],
        dataSources: ["site_kpis", "alerts", "financial_summary", "board_materials", "investor_pipeline", "risk_register", "executive_tasks", "meeting_notes"],
        connectors: [
          { name: "Oracle Financials", status: "pending" },
          { name: "Salesforce", status: "pending" },
          { name: "Slack", status: "pending" },
          { name: "Google Workspace", status: "pending" },
        ],
        taskHistory: [
          { date: "2026-02-24", action: "Generated weekly company briefing", result: "Delivered to CEO inbox", status: "green" },
          { date: "2026-02-23", action: "Compiled Series C milestone tracker", result: "12% committed, 8 meetings scheduled", status: "green" },
          { date: "2026-02-22", action: "Routed Baton Rouge uptime alert to VP Maint EA", result: "Escalated & acknowledged", status: "yellow" },
          { date: "2026-02-21", action: "Prepared board talking points on coal partnership", result: "Draft sent for review", status: "green" },
          { date: "2026-02-20", action: "Aggregated weekly risk summary from all depts", result: "3 new risks flagged", status: "yellow" },
        ],
      }),
    },
    specialists: [
      {
        id: "ceo-cos",
        name: "Chief of Staff Agent",
        role: "Strategic Operations",
        description: "Manages CEO calendar prioritization, cross-functional initiative tracking, and organizational alignment. Ensures decisions flow to the right people.",
        status: "green",
        ...agentDetail({
          skills: ["Calendar optimization", "Initiative tracking", "Decision log maintenance", "Action item follow-up", "Org alignment analysis"],
          dataSources: ["executive_tasks", "meeting_notes", "meeting_private"],
          connectors: [
            { name: "Google Calendar", status: "pending" },
            { name: "Slack", status: "pending" },
            { name: "Notion", status: "pending" },
          ],
          taskHistory: [
            { date: "2026-02-24", action: "Prioritized CEO calendar for the week", result: "3 conflicts resolved", status: "green" },
            { date: "2026-02-23", action: "Tracked 12 cross-functional action items", result: "9 complete, 3 pending", status: "yellow" },
            { date: "2026-02-22", action: "Updated decision log with board resolutions", result: "4 new entries", status: "green" },
          ],
        }),
      },
      {
        id: "ceo-board",
        name: "Board Relations Agent",
        role: "Board & Investor Intelligence",
        description: "Prepares board materials, tracks investor commitments, monitors market sentiment, and maintains the data room.",
        status: "green",
        ...agentDetail({
          skills: ["Board deck generation", "Data room management", "Investor sentiment tracking", "Competitive intel", "Regulatory watch"],
          dataSources: ["investor_pipeline", "board_materials", "mna_strategy", "strategic_negotiations", "financial_summary"],
          connectors: [
            { name: "Salesforce", status: "pending" },
            { name: "DocuSign", status: "pending" },
            { name: "S&P Capital IQ", status: "pending" },
          ],
          taskHistory: [
            { date: "2026-02-24", action: "Updated data room with Q4 financials", result: "12 documents refreshed", status: "green" },
            { date: "2026-02-22", action: "Generated investor pipeline report", result: "3 new leads identified", status: "green" },
            { date: "2026-02-20", action: "Flagged competitor patent filing", result: "Forwarded to VP Engineering EA", status: "yellow" },
          ],
        }),
      },
      {
        id: "ceo-portfolio",
        name: "Portfolio Strategy Agent",
        role: "Portfolio & Growth Analysis",
        description: "Analyzes site-level economics, expansion scenarios, M&A opportunities, and long-term portfolio optimization.",
        status: "green",
        ...agentDetail({
          skills: ["Site economics modeling", "Expansion scenario analysis", "M&A screening", "Portfolio optimization", "IRR/NPV calculations"],
          dataSources: ["financial_detail", "project_budgets", "site_kpis", "mna_strategy"],
          connectors: [
            { name: "Oracle Financials", status: "pending" },
            { name: "Bloomberg Terminal", status: "pending" },
          ],
          taskHistory: [
            { date: "2026-02-24", action: "Ran Portland OR IRR sensitivity analysis", result: "24.2% base case, 18.1% downside", status: "green" },
            { date: "2026-02-23", action: "Screened 3 potential acquisition targets", result: "1 recommended for deep dive", status: "green" },
            { date: "2026-02-21", action: "Updated Noble B economic model with latest capex", result: "IRR revised to 26.4%", status: "green" },
          ],
        }),
      },
    ],
  },
};

// ═══════════════════════════════════════════════════════════════════
//  COO AGENT TEAM  — CEO's direct report, oversees all branches
// ═══════════════════════════════════════════════════════════════════
export const cooAgentTeam = {
  key: "coo",
  title: "COO",
  branch: "Executive",
  color: T.accentLight,
  focusAreas: ["Portfolio Operations", "Site Performance", "Scalability", "Construction Oversight"],
  kpis: [
    { label: "Portfolio Ramp", value: "78%", sub: "vs 85% target" },
    { label: "Avg Uptime", value: "85%", sub: "across 5 sites" },
    { label: "Revenue MTD", value: "$9.1M", sub: "vs $9.4M budget" },
    { label: "Construction", value: "14%", sub: "Noble B + Portland OR" },
  ],
  quickLinks: [
    { label: "Dashboard", target: "dashboard" },
    { label: "Plant Operations", target: "ops-plant" },
    { label: "Engineering & Projects", target: "ops-projects" },
    { label: "Risk & Workforce", target: "risk" },
  ],
  agentTeam: {
    lead: {
      id: "coo-ea",
      name: "COO EA",
      role: "Chief Operating Assistant",
      description: "Your executive assistant for all operations. Coordinates across Delivering, Operations, Finance, and Admin branches. Aggregates site performance, flags escalations, and prepares operational briefings.",
      exampleQuestions: [
        "Give me a portfolio-wide operational status update",
        "Which site needs the most attention right now?",
        "How are we tracking on the ramp to 85% average uptime?",
        "Summarize this week's cross-functional escalations",
      ],
      ...agentDetail({
        skills: ["Cross-branch coordination", "Portfolio operations rollup", "Escalation management", "Operational briefings", "Site performance benchmarking", "Construction oversight"],
        dataSources: ["site_kpis", "alerts", "site_operations", "project_budgets", "risk_register", "hr_records", "financial_summary"],
        connectors: [
          { name: "Oracle Financials", status: "pending" },
          { name: "Oracle P6", status: "pending" },
          { name: "SCADA", status: "pending" },
          { name: "Procore", status: "pending" },
          { name: "Veriforce", status: "pending" },
          { name: "Slack", status: "pending" },
        ],
        taskHistory: [
          { date: "2026-02-24", action: "Generated daily ops briefing for CEO", result: "5 sites green, Baton Rouge watch", status: "green" },
          { date: "2026-02-23", action: "Coordinated Baton Rouge uptime recovery plan", result: "Target 85% by March 15", status: "yellow" },
          { date: "2026-02-22", action: "Reviewed Noble B & Portland OR construction milestones", result: "Noble B on track, Portland OR 3 days slip", status: "yellow" },
          { date: "2026-02-21", action: "Compiled weekly cross-functional escalation summary", result: "4 items, 2 resolved", status: "green" },
          { date: "2026-02-20", action: "Benchmarked site throughput efficiency", result: "Tucson leads at 91% uptime", status: "green" },
        ],
      }),
    },
    specialists: [
      {
        id: "coo-perf",
        name: "Site Performance Agent",
        role: "Portfolio Performance Analyst",
        description: "Monitors real-time site performance across all 5 operational sites. Benchmarks uptime, throughput, yield, and quality. Identifies underperformers and recommends interventions.",
        status: "green",
        accuracy: "92%",
        tasksPerDay: 1800,
        ...agentDetail({
          skills: ["Site benchmarking", "Uptime tracking", "Throughput analysis", "Performance trending", "Intervention recommendations"],
          dataSources: ["site_kpis", "site_operations"],
          connectors: [
            { name: "SCADA", status: "pending" },
            { name: "OSIsoft PI", status: "pending" },
            { name: "Oracle MES", status: "pending" },
          ],
          taskHistory: [
            { date: "2026-02-24", action: "Benchmarked all 5 sites", result: "Tucson best (91%), Baton Rouge worst (79%)", status: "yellow" },
            { date: "2026-02-23", action: "Analyzed Baton Rouge downtime root cause", result: "Feed quality + maintenance delay", status: "yellow" },
            { date: "2026-02-22", action: "Generated weekly performance league table", result: "Distributed to all VPs", status: "green" },
          ],
        }),
      },
      {
        id: "coo-escal",
        name: "Escalation Agent",
        role: "Cross-Functional Escalation Manager",
        description: "Monitors all department agent alerts, triages cross-functional issues, and ensures escalations reach the right decision-maker. Acts as the operational nerve center.",
        status: "green",
        ...agentDetail({
          skills: ["Alert triage", "Cross-dept routing", "Escalation tracking", "Resolution monitoring", "SLA enforcement"],
          dataSources: ["alerts", "risk_register"],
          connectors: [
            { name: "PagerDuty", status: "pending" },
            { name: "Slack", status: "pending" },
          ],
          taskHistory: [
            { date: "2026-02-24", action: "Triaged 8 cross-functional alerts", result: "3 escalated, 5 auto-resolved", status: "green" },
            { date: "2026-02-23", action: "Tracked Portland OR schedule slip", result: "Escalated to VP Project + CEO", status: "yellow" },
          ],
        }),
      },
      {
        id: "coo-constr",
        name: "Construction Oversight Agent",
        role: "Capital Projects Monitor",
        description: "Provides COO-level visibility into all construction projects. Tracks capex burn, schedule variance, and EPC contractor performance across Noble B and Portland OR.",
        status: "green",
        ...agentDetail({
          skills: ["Capex tracking", "Schedule variance monitoring", "EPC performance scoring", "Milestone reporting", "Risk flagging"],
          dataSources: ["project_budgets", "site_operations"],
          connectors: [
            { name: "Oracle P6", status: "pending" },
            { name: "Procore", status: "pending" },
            { name: "WakeCap", status: "pending" },
          ],
          taskHistory: [
            { date: "2026-02-24", action: "Compiled construction dashboard", result: "Noble B 18%, Portland OR 10%", status: "green" },
            { date: "2026-02-23", action: "Flagged Portland OR 3-day schedule variance", result: "Root cause: steel delivery delay", status: "yellow" },
          ],
        }),
      },
    ],
  },
};

// ═══════════════════════════════════════════════════════════════════
//  VP REGISTRY — all 13 VPs with full agent detail metadata
// ═══════════════════════════════════════════════════════════════════
export const vpRegistry = {
  // ─── DELIVERING ───────────────────────────────────────────
  "vp-engineering": {
    key: "vp-engineering",
    title: "VP Engineering",
    branch: "Delivering",
    branchKey: "ops-projects",
    color: T.green,
    focusAreas: ["Concept & IP", "TiPs Design", "Grade R&D"],
    kpis: [
      { label: "Active Patents", value: "4", sub: "2 pending" },
      { label: "TiPs Designs", value: "3", sub: "Series A / B / C" },
      { label: "Grade Variants", value: "6", sub: "N330 primary" },
      { label: "R&D Spend MTD", value: "$420K", sub: "vs $450K budget" },
    ],
    quickLinks: [
      { label: "Engineering & Projects", target: "ops-projects" },
      { label: "Risk Register", target: "risk" },
    ],
    agentTeam: {
      lead: {
        id: "eng-ea",
        name: "Engineering EA",
        role: "Executive Assistant",
        description: "Your executive assistant for the Engineering department. Coordinates across all engineering agents, summarizes status, and handles cross-cutting questions.",
        exampleQuestions: [
          "Give me a status update on all active engineering workstreams",
          "What are the top 3 risks in engineering right now?",
          "Prepare a summary for the board on our IP portfolio",
        ],
        ...agentDetail({
          skills: ["Engineering status rollup", "IP portfolio summary", "R&D progress tracking", "Cross-team coordination", "Board prep (engineering)"],
          dataSources: ["engineering_ip", "project_budgets", "site_operations"],
          connectors: [
            { name: "Oracle P6", status: "pending" },
            { name: "Autodesk Vault", status: "pending" },
          ],
          taskHistory: [
            { date: "2026-02-24", action: "Compiled weekly engineering status report", result: "Sent to CEO EA", status: "green" },
            { date: "2026-02-23", action: "Flagged R&D budget overrun risk", result: "Alert sent to VP", status: "yellow" },
            { date: "2026-02-22", action: "Prepared IP portfolio summary for board", result: "4 patents, 2 pending", status: "green" },
          ],
        }),
      },
      specialists: [
        {
          id: "eng-ip", name: "IP & Patents Agent", role: "Intellectual Property Specialist",
          description: "Tracks patent filings, prior art analysis, IP portfolio valuation, and competitive patent landscape.", status: "green",
          ...agentDetail({
            skills: ["Patent filing tracking", "Prior art analysis", "IP valuation", "Competitive patent monitoring", "Freedom-to-operate analysis"],
            dataSources: ["engineering_ip"],
            connectors: [{ name: "PatSnap", status: "pending" }, { name: "Google Patents", status: "pending" }],
            taskHistory: [
              { date: "2026-02-24", action: "Monitored 3 competitor patent filings", result: "No conflicts found", status: "green" },
              { date: "2026-02-21", action: "Updated IP portfolio valuation", result: "$12.4M total value", status: "green" },
            ],
          }),
        },
        {
          id: "eng-tips", name: "TiPs Design Agent", role: "Process Design Specialist",
          description: "Manages TiPs reactor design iterations, Series A/B/C configurations, and design validation.", status: "green",
          ...agentDetail({
            skills: ["Reactor design tracking", "Configuration management", "Design validation", "Change order processing"],
            dataSources: ["engineering_ip", "site_operations"],
            connectors: [{ name: "Autodesk Vault", status: "pending" }, { name: "SolidWorks PDM", status: "pending" }],
            taskHistory: [
              { date: "2026-02-24", action: "Validated Series C reactor design rev 4.2", result: "All checks passed", status: "green" },
              { date: "2026-02-22", action: "Processed design change order #DC-0147", result: "Approved & distributed", status: "green" },
            ],
          }),
        },
        {
          id: "eng-rd", name: "R&D Agent", role: "Research & Development Specialist",
          description: "Tracks grade R&D experiments, carbon black quality optimization, and lab-to-production scaling.", status: "green",
          ...agentDetail({
            skills: ["Experiment tracking", "Grade optimization", "Lab-to-production scaling", "Quality correlation analysis"],
            dataSources: ["engineering_ip", "site_operations"],
            connectors: [{ name: "LabWare LIMS", status: "pending" }],
            taskHistory: [
              { date: "2026-02-24", action: "Analyzed N330 grade consistency across sites", result: "96.2% within spec", status: "green" },
              { date: "2026-02-23", action: "Tracked 4 active experiments", result: "2 showing promise", status: "green" },
            ],
          }),
        },
      ],
    },
  },

  "vp-project": {
    key: "vp-project",
    title: "VP Project",
    branch: "Delivering",
    branchKey: "ops-projects",
    color: T.green,
    focusAreas: ["Build / Install", "PM / Fab", "Commissioning"],
    kpis: [
      { label: "Active Projects", value: "2", sub: "Noble B + Portland OR" },
      { label: "Total Capex", value: "$162M", sub: "across 2 builds" },
      { label: "Avg Completion", value: "14%", sub: "on schedule" },
      { label: "EPC Partners", value: "2", sub: "Cissell Mueller · B&R" },
    ],
    quickLinks: [
      { label: "Engineering & Projects", target: "ops-projects" },
      { label: "Risk Register", target: "risk" },
    ],
    agentTeam: {
      lead: {
        id: "proj-ea", name: "Project EA", role: "Executive Assistant",
        description: "Your executive assistant for Project Management. Coordinates across build, fabrication, and commissioning agents.",
        exampleQuestions: ["What's the construction status across all sites?", "Are there any schedule delays I should know about?", "Summarize EPC contractor performance this month"],
        ...agentDetail({
          skills: ["Construction status rollup", "Schedule variance analysis", "EPC performance tracking", "Capex monitoring", "Milestone reporting"],
          dataSources: ["project_budgets", "site_operations"],
          connectors: [{ name: "Oracle P6", status: "pending" }, { name: "Procore", status: "pending" }, { name: "WakeCap", status: "pending" }],
          taskHistory: [
            { date: "2026-02-24", action: "Generated construction status across Noble B & Portland OR", result: "18% and 10% complete", status: "green" },
            { date: "2026-02-23", action: "Flagged 3-day schedule slip at Portland OR", result: "Escalated to VP", status: "yellow" },
          ],
        }),
      },
      specialists: [
        {
          id: "proj-build", name: "Construction Agent", role: "Build & Install Tracker",
          description: "Monitors construction progress, site milestones, equipment delivery, and installation schedules.", status: "green",
          ...agentDetail({
            skills: ["Milestone tracking", "Equipment delivery monitoring", "Site progress reporting", "Weather impact analysis"],
            dataSources: ["project_budgets", "site_operations"],
            connectors: [{ name: "Procore", status: "pending" }, { name: "WakeCap", status: "pending" }],
            taskHistory: [
              { date: "2026-02-24", action: "Processed 12 daily site reports", result: "Noble B on track, Portland OR 3 days behind", status: "yellow" },
              { date: "2026-02-23", action: "Tracked 8 equipment deliveries", result: "All on schedule", status: "green" },
            ],
          }),
        },
        {
          id: "proj-fab", name: "Fabrication Agent", role: "PM & Fabrication Specialist",
          description: "Tracks fabrication schedules, procurement lead times, and vendor coordination.", status: "green",
          ...agentDetail({
            skills: ["Fabrication schedule management", "Vendor coordination", "Lead time tracking", "Quality inspection scheduling"],
            dataSources: ["project_budgets"],
            connectors: [{ name: "Oracle P6", status: "pending" }, { name: "SAP Ariba", status: "pending" }],
            taskHistory: [
              { date: "2026-02-24", action: "Updated fab schedule for Series C reactors", result: "On track for April delivery", status: "green" },
            ],
          }),
        },
        {
          id: "proj-comm", name: "Commissioning Agent", role: "Commissioning Specialist",
          description: "Manages pre-commissioning checklists, startup sequences, and performance testing.", status: "blue",
          ...agentDetail({
            skills: ["Pre-comm checklist management", "Startup sequence planning", "Performance test execution", "Punch list tracking"],
            dataSources: ["project_budgets", "site_operations"],
            connectors: [{ name: "Oracle P6", status: "pending" }],
            taskHistory: [
              { date: "2026-02-24", action: "Prepared Noble B pre-commissioning checklist", result: "142 items, 0% complete (not yet started)", status: "blue" },
            ],
          }),
        },
      ],
    },
  },

  // ─── OPERATIONS ───────────────────────────────────────────
  "vp-maint": {
    key: "vp-maint",
    title: "VP Maintenance",
    branch: "Operations",
    branchKey: "ops-plant",
    color: T.purple,
    focusAreas: ["Preventive", "IoT/Predictive", "Turnarounds"],
    kpis: [
      { label: "Avg Uptime", value: "85%", sub: "across 5 sites" },
      { label: "Open WOs", value: "34", sub: "12 critical" },
      { label: "IoT Sensors", value: "48", sub: "all reporting" },
      { label: "Next Turnaround", value: "Mar 15", sub: "Noble OK" },
    ],
    quickLinks: [{ label: "Plant Operations", target: "ops-plant" }],
    agentTeam: {
      lead: {
        id: "maint-ea", name: "Maintenance EA", role: "Executive Assistant",
        description: "Your executive assistant for Maintenance. Coordinates predictive maintenance, work orders, and turnaround planning.",
        exampleQuestions: ["Which site has the most critical open work orders?", "What does the predictive maintenance model say about Richmond?", "When is the next turnaround and are we on track?"],
        ...agentDetail({
          skills: ["Work order prioritization", "Turnaround planning", "Predictive maintenance oversight", "Maintenance budget tracking"],
          dataSources: ["maintenance_details", "site_operations", "project_budgets"],
          connectors: [{ name: "Oracle EAM", status: "pending" }, { name: "OSIsoft PI", status: "pending" }, { name: "WakeCap", status: "pending" }],
          taskHistory: [
            { date: "2026-02-24", action: "Prioritized 34 open work orders", result: "12 critical, 22 routine", status: "green" },
            { date: "2026-02-23", action: "Reviewed Noble turnaround plan", result: "On track for Mar 15 start", status: "green" },
          ],
        }),
      },
      specialists: [
        {
          id: "maint-pred", name: "Maintenance Agent", role: "Predictive Maintenance",
          description: "Runs predictive maintenance models, analyzes IoT sensor data, and forecasts equipment failures.", status: "green", accuracy: "85%", tasksPerDay: 560,
          ...agentDetail({
            skills: ["Vibration analysis", "Thermal imaging interpretation", "Failure prediction", "Remaining useful life estimation", "Sensor anomaly detection"],
            dataSources: ["maintenance_details", "site_operations"],
            connectors: [{ name: "OSIsoft PI", status: "pending" }, { name: "AWS IoT Core", status: "pending" }],
            taskHistory: [
              { date: "2026-02-24", action: "Analyzed vibration data for Richmond Processor #2", result: "Bearing wear detected, 30-day window", status: "yellow" },
              { date: "2026-02-23", action: "Processed 560 predictive tasks", result: "2 alerts generated", status: "green" },
            ],
          }),
        },
        {
          id: "maint-wo", name: "Work Order Agent", role: "Work Order Manager",
          description: "Manages preventive maintenance schedules, work order prioritization, and technician assignments.", status: "green",
          ...agentDetail({
            skills: ["WO creation & routing", "PM schedule management", "Technician assignment", "Parts availability check"],
            dataSources: ["maintenance_details"],
            connectors: [{ name: "Oracle EAM", status: "pending" }],
            taskHistory: [
              { date: "2026-02-24", action: "Created 8 new work orders", result: "All assigned and scheduled", status: "green" },
              { date: "2026-02-23", action: "Closed 14 completed work orders", result: "100% on time", status: "green" },
            ],
          }),
        },
        {
          id: "maint-ta", name: "Turnaround Agent", role: "Turnaround Planner",
          description: "Plans and tracks major turnaround events, resource allocation, and shutdown/startup sequences.", status: "blue",
          ...agentDetail({
            skills: ["Turnaround scheduling", "Resource planning", "Shutdown/startup sequencing", "Cost tracking", "Contractor coordination"],
            dataSources: ["maintenance_details", "project_budgets"],
            connectors: [{ name: "Oracle P6", status: "pending" }, { name: "Veriforce", status: "pending" }],
            taskHistory: [
              { date: "2026-02-24", action: "Updated Noble turnaround resource plan", result: "24 contractors confirmed", status: "green" },
              { date: "2026-02-22", action: "Verified all contractor Veriforce compliance", result: "100% cleared", status: "green" },
            ],
          }),
        },
      ],
    },
  },

  "vp-ops": {
    key: "vp-ops",
    title: "VP Operations",
    branch: "Operations",
    branchKey: "ops-plant",
    color: T.purple,
    focusAreas: ["Plant Ops", "Process Ctrl", "Quality"],
    kpis: [
      { label: "Throughput", value: "14 TPH", sub: "7 processors" },
      { label: "Yield Rate", value: "92%", sub: "+1.5% vs target" },
      { label: "Quality Score", value: "96%", sub: "N330 grade" },
      { label: "Process Alerts", value: "3", sub: "2 resolved today" },
    ],
    quickLinks: [{ label: "Plant Operations", target: "ops-plant" }, { label: "Risk Register", target: "risk" }],
    agentTeam: {
      lead: {
        id: "ops-ea", name: "Operations EA", role: "Executive Assistant",
        description: "Your executive assistant for Plant Operations. Coordinates across plant ops, process control, and quality agents.",
        exampleQuestions: ["How is throughput trending across all sites this week?", "Are there any process control alerts I need to see?", "What's the quality variance on our latest Tucson run?"],
        ...agentDetail({
          skills: ["Throughput monitoring", "Process alert triage", "Quality reporting", "Shift handover coordination"],
          dataSources: ["site_operations", "site_kpis", "alerts"],
          connectors: [{ name: "SCADA", status: "pending" }, { name: "Oracle MES", status: "pending" }],
          taskHistory: [
            { date: "2026-02-24", action: "Compiled daily ops report for 5 sites", result: "14 TPH aggregate, 92% yield", status: "green" },
            { date: "2026-02-23", action: "Triaged 3 process alerts", result: "2 resolved, 1 monitoring", status: "yellow" },
          ],
        }),
      },
      specialists: [
        {
          id: "ops-sched", name: "Scheduling Agent", role: "Processor Optimization",
          description: "Optimizes processor scheduling, throughput allocation, and shift planning across all sites.", status: "green", accuracy: "91%", tasksPerDay: 1240,
          ...agentDetail({
            skills: ["Throughput optimization", "Shift scheduling", "Processor allocation", "Demand balancing"],
            dataSources: ["site_operations", "maintenance_details"],
            connectors: [{ name: "SCADA", status: "pending" }, { name: "Oracle MES", status: "pending" }],
            taskHistory: [
              { date: "2026-02-24", action: "Optimized processor allocation across 5 sites", result: "14 TPH achieved, +0.5 vs yesterday", status: "green" },
            ],
          }),
        },
        {
          id: "ops-quality", name: "Quality Agent", role: "Carbon Grade Optimization",
          description: "Monitors carbon black quality parameters, grade optimization, and product consistency.", status: "green", accuracy: "96%", tasksPerDay: 3120,
          ...agentDetail({
            skills: ["Grade consistency monitoring", "Spec compliance checking", "Quality trend analysis", "Off-spec root cause"],
            dataSources: ["site_operations"],
            connectors: [{ name: "LabWare LIMS", status: "pending" }],
            taskHistory: [
              { date: "2026-02-24", action: "Checked 3,120 quality data points", result: "96.2% within N330 spec", status: "green" },
            ],
          }),
        },
        {
          id: "ops-proc", name: "Process Control Agent", role: "SCADA & Process Monitoring",
          description: "Interfaces with SCADA systems, monitors real-time process variables, and triggers alerts.", status: "green",
          ...agentDetail({
            skills: ["Real-time process monitoring", "Alarm management", "Setpoint optimization", "Process historian queries"],
            dataSources: ["site_operations", "alerts"],
            connectors: [{ name: "SCADA", status: "pending" }, { name: "OSIsoft PI", status: "pending" }],
            taskHistory: [
              { date: "2026-02-24", action: "Monitored 2.4M data points", result: "3 alerts triggered, 2 resolved", status: "yellow" },
            ],
          }),
        },
      ],
    },
  },

  "vp-hse": {
    key: "vp-hse",
    title: "VP Risk",
    branch: "Operations",
    branchKey: "ops-plant",
    color: T.purple,
    focusAreas: ["Safety", "Environmental", "Permitting"],
    kpis: [
      { label: "TRIR", value: "0.8", sub: "target < 1.0" },
      { label: "Days Since LTI", value: "142", sub: "all sites" },
      { label: "Permits Active", value: "18", sub: "2 renewal due" },
      { label: "Env Compliance", value: "100%", sub: "all sites" },
    ],
    quickLinks: [{ label: "Risk Overview", target: "risk" }, { label: "Workforce Risk", target: "risk-workforce" }, { label: "Safety & Compliance", target: "risk-safety" }, { label: "Risk Register", target: "risk-register" }],
    agentTeam: {
      lead: {
        id: "hse-ea", name: "Risk EA", role: "Executive Assistant",
        description: "Your executive assistant for Risk Management. Coordinates safety, environmental compliance, and permitting agents.",
        exampleQuestions: ["What's our safety record this quarter across all sites?", "Any environmental permits coming up for renewal?", "Give me the incident summary for Baton Rouge"],
        ...agentDetail({
          skills: ["Safety metrics rollup", "Incident investigation coordination", "Permit tracking", "Environmental reporting"],
          dataSources: ["risk_register", "site_operations", "hr_records"],
          connectors: [{ name: "Veriforce", status: "pending" }, { name: "Enablon", status: "pending" }, { name: "WakeCap", status: "pending" }],
          taskHistory: [
            { date: "2026-02-24", action: "Compiled Q1 safety metrics", result: "TRIR 0.8, 142 days LTI-free", status: "green" },
            { date: "2026-02-23", action: "Flagged 2 permits due for renewal", result: "Renewal process initiated", status: "yellow" },
          ],
        }),
      },
      specialists: [
        {
          id: "hse-safety", name: "Safety Agent", role: "Safety Monitoring",
          description: "Tracks incident reports, near-misses, safety observations, and TRIR calculations across all sites.", status: "green",
          ...agentDetail({
            skills: ["Incident tracking", "Near-miss analysis", "TRIR calculation", "Safety observation trends", "Leading indicator monitoring"],
            dataSources: ["risk_register", "hr_records"],
            connectors: [{ name: "Veriforce", status: "pending" }, { name: "WakeCap", status: "pending" }],
            taskHistory: [
              { date: "2026-02-24", action: "Processed 12 safety observations", result: "All low-risk, 3 improvement suggestions", status: "green" },
              { date: "2026-02-23", action: "Verified contractor safety certs via Veriforce", result: "148/148 compliant", status: "green" },
            ],
          }),
        },
        {
          id: "hse-env", name: "Environmental Agent", role: "Environmental Compliance",
          description: "Monitors emissions, waste management, environmental permits, and regulatory compliance.", status: "green",
          ...agentDetail({
            skills: ["Emissions monitoring", "Waste tracking", "Regulatory compliance", "Environmental reporting", "Spill response coordination"],
            dataSources: ["risk_register", "site_operations"],
            connectors: [{ name: "Enablon", status: "pending" }, { name: "EPA CEDRI", status: "pending" }],
            taskHistory: [
              { date: "2026-02-24", action: "Reviewed daily emissions data for 5 sites", result: "All within permit limits", status: "green" },
            ],
          }),
        },
        {
          id: "hse-permit", name: "Permitting Agent", role: "Permit Management",
          description: "Tracks permit status, renewal timelines, regulatory filings, and government correspondence.", status: "green",
          ...agentDetail({
            skills: ["Permit lifecycle tracking", "Renewal scheduling", "Regulatory filing", "Agency correspondence management"],
            dataSources: ["risk_register", "legal_contracts"],
            connectors: [{ name: "Enablon", status: "pending" }],
            taskHistory: [
              { date: "2026-02-24", action: "Tracked 18 active permits", result: "2 renewals due in 30 days", status: "yellow" },
            ],
          }),
        },
      ],
    },
  },

  "vp-logistics": {
    key: "vp-logistics",
    title: "VP Logistics",
    branch: "Operations",
    branchKey: "ops-plant",
    color: T.purple,
    focusAreas: ["Inbound", "Outbound", "Inventory"],
    kpis: [
      { label: "Tire Intake", value: "840 T/wk", sub: "across 5 sites" },
      { label: "Product Shipped", value: "620 T/wk", sub: "oil + carbon" },
      { label: "Inventory Days", value: "12", sub: "target 10" },
      { label: "Freight Cost", value: "$1.2M", sub: "MTD" },
    ],
    quickLinks: [{ label: "Plant Operations", target: "ops-plant" }, { label: "Finance & Strategy", target: "finance" }],
    agentTeam: {
      lead: {
        id: "log-ea", name: "Logistics EA", role: "Executive Assistant",
        description: "Your executive assistant for Logistics. Coordinates inbound supply, outbound shipping, and inventory management agents.",
        exampleQuestions: ["Do we have enough tire feedstock for next week at all sites?", "What's the outbound shipping schedule for this week?", "Which site has the highest inventory days right now?"],
        ...agentDetail({
          skills: ["Supply/demand balancing", "Freight cost analysis", "Inventory optimization oversight", "Supplier performance review"],
          dataSources: ["logistics", "site_operations", "financial_summary"],
          connectors: [{ name: "Oracle SCM", status: "pending" }, { name: "FourKites", status: "pending" }],
          taskHistory: [
            { date: "2026-02-24", action: "Reviewed weekly supply/demand balance", result: "All sites covered, Columbus OH tight", status: "yellow" },
          ],
        }),
      },
      specialists: [
        {
          id: "log-sc", name: "Supply Chain Agent", role: "Inventory Optimization",
          description: "Optimizes inventory levels, reorder points, and feedstock allocation across all sites.", status: "green", accuracy: "88%", tasksPerDay: 840,
          ...agentDetail({
            skills: ["Reorder point optimization", "Safety stock calculation", "Feedstock allocation", "Demand forecasting"],
            dataSources: ["logistics", "site_operations"],
            connectors: [{ name: "Oracle SCM", status: "pending" }],
            taskHistory: [
              { date: "2026-02-24", action: "Optimized reorder points for 5 sites", result: "Projected inventory days: 10.5", status: "green" },
            ],
          }),
        },
        {
          id: "log-in", name: "Inbound Agent", role: "Feedstock Coordination",
          description: "Manages tire supplier relationships, inbound scheduling, and feedstock quality tracking.", status: "green",
          ...agentDetail({
            skills: ["Supplier scheduling", "Feedstock quality grading", "Delivery tracking", "Supplier scorecard"],
            dataSources: ["logistics"],
            connectors: [{ name: "FourKites", status: "pending" }],
            taskHistory: [
              { date: "2026-02-24", action: "Scheduled 42 inbound tire deliveries", result: "840 tons/week target met", status: "green" },
            ],
          }),
        },
        {
          id: "log-out", name: "Outbound Agent", role: "Product Distribution",
          description: "Coordinates product shipping, offtake agreements, and freight logistics.", status: "green",
          ...agentDetail({
            skills: ["Shipment scheduling", "Offtake fulfillment tracking", "Freight optimization", "Bill of lading generation"],
            dataSources: ["logistics", "legal_contracts"],
            connectors: [{ name: "FourKites", status: "pending" }, { name: "Oracle SCM", status: "pending" }],
            taskHistory: [
              { date: "2026-02-24", action: "Dispatched 620 tons of product", result: "12 shipments, all on time", status: "green" },
            ],
          }),
        },
      ],
    },
  },

  // ─── FINANCE ──────────────────────────────────────────────
  "vp-strategy": {
    key: "vp-strategy",
    title: "VP Strategy",
    branch: "Finance",
    branchKey: "finance",
    color: T.blue,
    focusAreas: ["Corp Strategy", "Investor Relations"],
    kpis: [
      { label: "Series C Target", value: "$162M", sub: "12% committed" },
      { label: "Investor Meetings", value: "8", sub: "this month" },
      { label: "Portfolio IRR", value: "24%", sub: "projected" },
      { label: "Coal Project", value: "FL-456", sub: "12% partnership" },
    ],
    quickLinks: [{ label: "Finance & Strategy", target: "finance" }, { label: "Dashboard", target: "dashboard" }],
    agentTeam: {
      lead: {
        id: "strat-ea", name: "Strategy EA", role: "Executive Assistant",
        description: "Your executive assistant for Corporate Strategy. Coordinates investor relations, market analysis, and strategic planning agents.",
        exampleQuestions: ["Where do we stand on Series C fundraising?", "Summarize upcoming investor meetings and prep notes", "What's the latest on the coal partnership opportunity?"],
        ...agentDetail({
          skills: ["Fundraising tracking", "Investor meeting prep", "Partnership evaluation", "Market sizing"],
          dataSources: ["investor_pipeline", "financial_summary", "strategic_negotiations"],
          connectors: [{ name: "Salesforce", status: "pending" }, { name: "DocuSign", status: "pending" }],
          taskHistory: [
            { date: "2026-02-24", action: "Updated Series C pipeline", result: "$19.4M committed (12%)", status: "green" },
          ],
        }),
      },
      specialists: [
        {
          id: "strat-ir", name: "Investor Relations Agent", role: "IR & Fundraising",
          description: "Tracks investor pipeline, manages data room, prepares pitch materials, and monitors commitments.", status: "green",
          ...agentDetail({
            skills: ["Pipeline management", "Data room curation", "Pitch deck updates", "Commitment tracking", "Due diligence coordination"],
            dataSources: ["investor_pipeline", "board_materials", "strategic_negotiations"],
            connectors: [{ name: "Salesforce", status: "pending" }, { name: "DocuSign", status: "pending" }, { name: "Box", status: "pending" }],
            taskHistory: [
              { date: "2026-02-24", action: "Updated data room with latest financials", result: "12 documents refreshed", status: "green" },
              { date: "2026-02-23", action: "Prepped materials for 3 investor meetings", result: "Decks sent", status: "green" },
            ],
          }),
        },
        {
          id: "strat-mkt", name: "Market Intelligence Agent", role: "Market & Competitive Analysis",
          description: "Monitors tire pyrolysis market, competitor activity, carbon black pricing, and regulatory trends.", status: "green",
          ...agentDetail({
            skills: ["Competitive monitoring", "Market sizing", "Price trend analysis", "Regulatory impact assessment"],
            dataSources: ["financial_summary", "mna_strategy"],
            connectors: [{ name: "S&P Capital IQ", status: "pending" }, { name: "Bloomberg", status: "pending" }],
            taskHistory: [
              { date: "2026-02-24", action: "Published weekly market brief", result: "Carbon black prices up 2.1%", status: "green" },
            ],
          }),
        },
      ],
    },
  },

  "vp-finance": {
    key: "vp-finance",
    title: "VP Finance",
    branch: "Finance",
    branchKey: "finance",
    color: T.blue,
    focusAreas: ["Accounting", "Treasury", "Tax"],
    kpis: [
      { label: "Revenue MTD", value: "$9.1M", sub: "vs $9.4M budget" },
      { label: "EBITDA Margin", value: "34%", sub: "+2pp vs prior" },
      { label: "Cash Position", value: "$14.2M", sub: "across entities" },
      { label: "AR Days", value: "28", sub: "target 30" },
    ],
    quickLinks: [{ label: "Finance & Strategy", target: "finance" }, { label: "Dashboard", target: "dashboard" }],
    agentTeam: {
      lead: {
        id: "fin-ea", name: "Finance EA", role: "Executive Assistant",
        description: "Your executive assistant for Finance. Coordinates accounting, treasury, and tax agents. Your first stop for any financial question.",
        exampleQuestions: ["What's our consolidated revenue variance this month?", "Show me Baton Rouge P&L vs budget", "What's our cash position across all entities?"],
        ...agentDetail({
          skills: ["Revenue variance analysis", "P&L consolidation", "Cash flow monitoring", "Budget vs actual reporting"],
          dataSources: ["financial_detail", "financial_summary", "site_kpis"],
          connectors: [{ name: "Oracle Financials", status: "pending" }, { name: "Bank of America", status: "pending" }, { name: "Stripe", status: "pending" }],
          taskHistory: [
            { date: "2026-02-24", action: "Generated consolidated revenue variance report", result: "$8.9M vs $9.1M budget (-2.2%)", status: "yellow" },
            { date: "2026-02-23", action: "Reconciled 5 site bank accounts", result: "All balanced", status: "green" },
          ],
        }),
      },
      specialists: [
        {
          id: "fin-rev", name: "Finance Agent", role: "Revenue Forecasting",
          description: "Runs revenue forecasting models, variance analysis, and financial projections across all sites.", status: "green", accuracy: "94%", tasksPerDay: 2840,
          ...agentDetail({
            skills: ["Revenue forecasting", "Variance analysis", "Scenario modeling", "Site-level P&L projection"],
            dataSources: ["financial_detail", "financial_summary"],
            connectors: [{ name: "Oracle Financials", status: "pending" }],
            taskHistory: [
              { date: "2026-02-24", action: "Updated 30-day revenue forecast", result: "$9.2M projected (Feb)", status: "green" },
              { date: "2026-02-23", action: "Ran site-level variance analysis", result: "Baton Rouge -$180K vs budget", status: "yellow" },
            ],
          }),
        },
        {
          id: "fin-tres", name: "Treasury Agent", role: "Cash Management",
          description: "Monitors cash positions, manages banking relationships, and tracks AR/AP aging.", status: "green",
          ...agentDetail({
            skills: ["Cash position monitoring", "AR/AP aging analysis", "Wire transfer tracking", "Banking relationship management"],
            dataSources: ["financial_detail"],
            connectors: [{ name: "Bank of America", status: "pending" }, { name: "Stripe", status: "pending" }],
            taskHistory: [
              { date: "2026-02-24", action: "Monitored cash positions across 3 entities", result: "$14.2M total, healthy", status: "green" },
            ],
          }),
        },
        {
          id: "fin-tax", name: "Tax Agent", role: "Tax & Compliance",
          description: "Manages tax filings, transfer pricing, state/federal compliance, and tax credit optimization.", status: "green",
          ...agentDetail({
            skills: ["Tax filing preparation", "Transfer pricing", "Tax credit optimization", "Multi-state compliance"],
            dataSources: ["financial_detail", "legal_contracts"],
            connectors: [{ name: "Oracle Financials", status: "pending" }, { name: "Thomson Reuters", status: "pending" }],
            taskHistory: [
              { date: "2026-02-24", action: "Reviewed Q1 estimated tax payments", result: "All 5 states on track", status: "green" },
            ],
          }),
        },
      ],
    },
  },

  "vp-marketing": {
    key: "vp-marketing",
    title: "VP Marketing",
    branch: "Finance",
    branchKey: "finance",
    color: T.blue,
    focusAreas: ["Product Sales", "Offtake", "Pricing"],
    kpis: [
      { label: "Offtake Secured", value: "78%", sub: "of output" },
      { label: "Avg Oil Price", value: "$0.9/gal", sub: "Stable vs Q3" },
      { label: "Carbon Price", value: "$680/T", sub: "N330 grade" },
      { label: "New Contracts", value: "3", sub: "this quarter" },
    ],
    quickLinks: [{ label: "Finance & Strategy", target: "finance" }, { label: "Plant Operations", target: "ops-plant" }],
    agentTeam: {
      lead: {
        id: "mktg-ea", name: "Marketing EA", role: "Executive Assistant",
        description: "Your executive assistant for Marketing & Sales. Coordinates product sales, offtake management, and pricing strategy agents.",
        exampleQuestions: ["How much of our output is under offtake agreements?", "What's the current market price for pyrolysis oil?", "Which contracts are up for renewal this quarter?"],
        ...agentDetail({
          skills: ["Offtake coverage analysis", "Contract renewal tracking", "Pricing benchmarking", "Sales pipeline review"],
          dataSources: ["logistics", "financial_summary", "legal_contracts"],
          connectors: [{ name: "Salesforce", status: "pending" }, { name: "Platts", status: "pending" }],
          taskHistory: [
            { date: "2026-02-24", action: "Reviewed offtake coverage", result: "78% secured, 22% spot market", status: "green" },
          ],
        }),
      },
      specialists: [
        {
          id: "mktg-sales", name: "Sales Agent", role: "Product Sales",
          description: "Tracks sales pipeline, customer relationships, and revenue by product (oil, carbon black, steel, gas).", status: "green",
          ...agentDetail({
            skills: ["Pipeline management", "Customer relationship tracking", "Revenue by product analysis", "Lead qualification"],
            dataSources: ["financial_summary"],
            connectors: [{ name: "Salesforce", status: "pending" }],
            taskHistory: [
              { date: "2026-02-24", action: "Updated sales pipeline", result: "3 new contracts this quarter", status: "green" },
            ],
          }),
        },
        {
          id: "mktg-price", name: "Pricing Agent", role: "Pricing Strategy",
          description: "Monitors commodity markets, competitor pricing, and optimizes offtake agreement terms.", status: "green",
          ...agentDetail({
            skills: ["Commodity price tracking", "Pricing optimization", "Contract term analysis", "Margin calculation"],
            dataSources: ["financial_summary", "logistics"],
            connectors: [{ name: "Platts", status: "pending" }, { name: "Bloomberg", status: "pending" }],
            taskHistory: [
              { date: "2026-02-24", action: "Updated commodity price dashboard", result: "Oil +$0.04/gal, Carbon +2.1%", status: "green" },
            ],
          }),
        },
      ],
    },
  },

  // ─── ADMIN ────────────────────────────────────────────────
  "vp-it": {
    key: "vp-it",
    title: "VP IT",
    branch: "Admin",
    branchKey: "admin",
    color: T.teal,
    focusAreas: ["Executive Intelligence Platform", "Infrastructure", "Cybersecurity"],
    kpis: [
      { label: "Platform Uptime", value: "99.8%", sub: "EIP v4.0" },
      { label: "IoT Sensors", value: "48", sub: "all reporting" },
      { label: "Data Points/Day", value: "2.4M", sub: "18K API calls" },
      { label: "Active Users", value: "64", sub: "platform users" },
    ],
    quickLinks: [{ label: "Platform & Admin", target: "admin" }, { label: "Dashboard", target: "dashboard" }],
    agentTeam: {
      lead: {
        id: "it-ea", name: "IT EA", role: "Executive Assistant",
        description: "Your executive assistant for IT Infrastructure. Coordinates platform operations, data pipelines, and cybersecurity.",
        exampleQuestions: ["Any platform incidents or downtime in the last 7 days?", "How is our data pipeline performing?", "What's the cybersecurity status across all systems?"],
        ...agentDetail({
          skills: ["Platform health monitoring", "Incident management", "Data pipeline monitoring", "Cybersecurity oversight"],
          dataSources: ["site_kpis", "alerts"],
          connectors: [{ name: "AWS CloudWatch", status: "pending" }, { name: "Splunk", status: "pending" }, { name: "PagerDuty", status: "pending" }],
          taskHistory: [
            { date: "2026-02-24", action: "Reviewed platform uptime", result: "99.8% over 7 days", status: "green" },
            { date: "2026-02-23", action: "Resolved Oracle P6 latency spike", result: "Sync restored to < 10 sec", status: "green" },
          ],
        }),
      },
      specialists: [
        {
          id: "it-plat", name: "Platform Agent", role: "Platform Operations",
          description: "Monitors platform health, uptime, deployment pipelines, and user access management.", status: "green",
          ...agentDetail({
            skills: ["Uptime monitoring", "Deployment management", "Access control", "Performance optimization"],
            dataSources: ["site_kpis", "alerts"],
            connectors: [{ name: "AWS CloudWatch", status: "pending" }, { name: "GitHub Actions", status: "pending" }],
            taskHistory: [
              { date: "2026-02-24", action: "Deployed Platform v4.0.3 patch", result: "Zero downtime deployment", status: "green" },
            ],
          }),
        },
        {
          id: "it-data", name: "Analytics Agent", role: "Data & Analytics",
          description: "Manages data pipelines, IoT integrations, SCADA connections, and reporting dashboards.", status: "green",
          ...agentDetail({
            skills: ["Pipeline management", "IoT integration", "Dashboard creation", "Data quality monitoring"],
            dataSources: ["site_kpis", "site_operations", "alerts"],
            connectors: [{ name: "AWS S3", status: "pending" }, { name: "Splunk", status: "pending" }, { name: "Snowflake", status: "pending" }],
            taskHistory: [
              { date: "2026-02-24", action: "Processed 2.4M data points", result: "18K API calls served", status: "green" },
            ],
          }),
        },
        {
          id: "it-sec", name: "Cybersecurity Agent", role: "Security Operations",
          description: "Monitors network security, intrusion detection, patch management, and vulnerability assessments.", status: "green",
          ...agentDetail({
            skills: ["Intrusion detection", "Patch management", "Vulnerability scanning", "SSL certificate tracking", "VPN management"],
            dataSources: ["alerts"],
            connectors: [{ name: "Splunk", status: "pending" }, { name: "CrowdStrike", status: "pending" }],
            taskHistory: [
              { date: "2026-02-24", action: "Scanned all systems for vulnerabilities", result: "0 critical, 3 medium patched", status: "green" },
              { date: "2026-02-23", action: "Renewed 4 SSL certificates", result: "All certs valid through 2027", status: "green" },
            ],
          }),
        },
      ],
    },
  },

  "vp-ai": {
    key: "vp-ai",
    title: "VP AI",
    branch: "Admin",
    branchKey: "admin",
    color: T.blue,
    focusAreas: ["Agent Fleet", "ML Ops", "Skills & Data"],
    kpis: [
      { label: "AI Agents", value: "40+", sub: "across all depts" },
      { label: "Operational", value: "5/6", sub: "specialist agents" },
      { label: "Skills Registered", value: "184", sub: "across fleet" },
      { label: "Avg Accuracy", value: "92%", sub: "fleet-wide" },
    ],
    quickLinks: [{ label: "Platform & Admin", target: "admin" }, { label: "Dashboard", target: "dashboard" }],
    agentTeam: {
      lead: {
        id: "ai-ea", name: "AI EA", role: "Executive Assistant",
        description: "Your executive assistant for AI Operations. Oversees the entire agent fleet, skills registry, data source management, and ML model performance.",
        exampleQuestions: ["What's the health status of all AI agents right now?", "Which agents have accuracy below 90%?", "Show me the skills registry summary", "What data sources need attention?"],
        ...agentDetail({
          skills: ["Agent fleet oversight", "Skills registry management", "Data source coordination", "ML performance monitoring", "Agent training scheduling"],
          dataSources: ["site_kpis", "alerts"],
          connectors: [{ name: "AWS SageMaker", status: "pending" }, { name: "MLflow", status: "pending" }, { name: "Weights & Biases", status: "pending" }],
          taskHistory: [
            { date: "2026-02-24", action: "Checked all AI agent health", result: "5/6 operational, Compliance building", status: "green" },
            { date: "2026-02-23", action: "Reviewed fleet-wide accuracy metrics", result: "Avg 92%, Supply Chain flagged for retrain", status: "yellow" },
          ],
        }),
      },
      specialists: [
        {
          id: "ai-fleet", name: "AI Fleet Agent", role: "Agent Fleet Manager",
          description: "Oversees all department AI agents, monitors accuracy, task throughput, and agent health. Triggers retraining when performance degrades.", status: "green",
          ...agentDetail({
            skills: ["Agent health monitoring", "Accuracy tracking", "Throughput analysis", "Agent retraining triggers", "SLA enforcement"],
            dataSources: ["site_kpis", "alerts"],
            connectors: [{ name: "AWS SageMaker", status: "pending" }, { name: "MLflow", status: "pending" }],
            taskHistory: [
              { date: "2026-02-24", action: "Monitored 40+ agents across all departments", result: "All within SLA", status: "green" },
              { date: "2026-02-22", action: "Triggered retrain for Supply Chain Agent", result: "Accuracy improved 88% → 91%", status: "green" },
            ],
          }),
        },
        {
          id: "ai-skills", name: "Skills & Data Agent", role: "Skills Registry & Data Sources",
          description: "Manages the centralized skills registry, data source catalog, and connector health across all agent teams.", status: "green",
          ...agentDetail({
            skills: ["Skills catalog management", "Data source health monitoring", "Connector provisioning", "Access control for data sources", "Schema validation"],
            dataSources: ["site_kpis"],
            connectors: [{ name: "AWS S3", status: "pending" }, { name: "Snowflake", status: "pending" }],
            taskHistory: [
              { date: "2026-02-24", action: "Audited skills registry", result: "184 skills, 12 new this month", status: "green" },
              { date: "2026-02-23", action: "Verified all 28 connectors", result: "26 green, 2 pending setup", status: "yellow" },
            ],
          }),
        },
        {
          id: "ai-ml", name: "ML Ops Agent", role: "Model Training & Deployment",
          description: "Manages ML model training pipelines, experiment tracking, model versioning, and production deployment of AI models.", status: "green",
          ...agentDetail({
            skills: ["Model training orchestration", "Experiment tracking", "Model versioning", "A/B testing", "Production deployment", "Drift detection"],
            dataSources: ["site_kpis"],
            connectors: [{ name: "AWS SageMaker", status: "pending" }, { name: "MLflow", status: "pending" }, { name: "Weights & Biases", status: "pending" }],
            taskHistory: [
              { date: "2026-02-24", action: "Deployed Finance Agent v2.3 to production", result: "Accuracy +2% vs v2.2", status: "green" },
              { date: "2026-02-23", action: "Ran 4 training experiments", result: "2 models promoted to staging", status: "green" },
            ],
          }),
        },
      ],
    },
  },

  "vp-process": {
    key: "vp-process",
    title: "VP Process",
    branch: "Admin",
    branchKey: "admin",
    color: T.teal,
    focusAreas: ["Contractor Mgmt", "Compliance"],
    kpis: [
      { label: "Contractors", value: "148", sub: "across 8 firms" },
      { label: "Compliance", value: "100%", sub: "TRIR · Insurance" },
      { label: "Change Orders", value: "3", sub: "pending" },
      { label: "Procurement", value: "$8.2M", sub: "in pipeline" },
    ],
    quickLinks: [{ label: "Platform & Admin", target: "admin" }, { label: "Risk Register", target: "risk" }],
    agentTeam: {
      lead: {
        id: "proc-ea", name: "Process EA", role: "Executive Assistant",
        description: "Your executive assistant for Process & Compliance. Coordinates contractor management, procurement, and compliance agents.",
        exampleQuestions: ["Are all contractor certifications current?", "What change orders are pending approval?", "Show me the procurement pipeline status"],
        ...agentDetail({
          skills: ["Contractor compliance overview", "Change order management", "Procurement tracking", "Audit coordination"],
          dataSources: ["legal_contracts", "risk_register", "hr_records"],
          connectors: [{ name: "Veriforce", status: "pending" }, { name: "Oracle Procurement", status: "pending" }],
          taskHistory: [
            { date: "2026-02-24", action: "Verified all contractor compliance", result: "148/148 current via Veriforce", status: "green" },
          ],
        }),
      },
      specialists: [
        {
          id: "proc-contr", name: "Contractor Agent", role: "Contractor Management",
          description: "Tracks contractor performance, certifications, insurance, and contract compliance.", status: "green",
          ...agentDetail({
            skills: ["Certification tracking", "Insurance verification", "Performance scoring", "Onboarding management"],
            dataSources: ["hr_records", "risk_register"],
            connectors: [{ name: "Veriforce", status: "pending" }, { name: "WakeCap", status: "pending" }],
            taskHistory: [
              { date: "2026-02-24", action: "Verified 148 contractor certifications", result: "100% compliant", status: "green" },
              { date: "2026-02-23", action: "Onboarded 3 new contractors", result: "All Veriforce cleared", status: "green" },
            ],
          }),
        },
        {
          id: "proc-comp", name: "Compliance Agent", role: "Regulatory Monitoring",
          description: "Monitors regulatory requirements, audit schedules, and compliance across all jurisdictions.", status: "construction", accuracy: "99%", tasksPerDay: 12400,
          ...agentDetail({
            skills: ["Regulatory monitoring", "Audit preparation", "Compliance reporting", "Jurisdiction tracking"],
            dataSources: ["risk_register", "legal_contracts"],
            connectors: [{ name: "Enablon", status: "pending" }, { name: "LexisNexis", status: "pending" }],
            taskHistory: [
              { date: "2026-02-24", action: "Scanned 12,400 regulatory updates", result: "2 relevant changes flagged", status: "green" },
            ],
          }),
        },
      ],
    },
  },

  "vp-people": {
    key: "vp-people",
    title: "VP People",
    branch: "Admin",
    branchKey: "admin",
    color: T.teal,
    focusAreas: ["HR", "Training"],
    kpis: [
      { label: "Headcount", value: "52", sub: "+148 contractors" },
      { label: "Open Roles", value: "8", sub: "1 urgent" },
      { label: "Training", value: "93%", sub: "completion rate" },
      { label: "Engagement", value: "78%", sub: "last survey" },
    ],
    quickLinks: [{ label: "Platform & Admin", target: "admin" }],
    agentTeam: {
      lead: {
        id: "ppl-ea", name: "People EA", role: "Executive Assistant",
        description: "Your executive assistant for People & HR. Coordinates hiring, training, and employee experience agents.",
        exampleQuestions: ["What open roles are we hiring for right now?", "Which teams have the lowest training completion?", "What's the latest employee engagement trend?"],
        ...agentDetail({
          skills: ["Hiring pipeline overview", "Training compliance tracking", "Engagement analysis", "Headcount reporting"],
          dataSources: ["hr_records", "compensation"],
          connectors: [{ name: "Workday", status: "pending" }, { name: "Greenhouse", status: "pending" }],
          taskHistory: [
            { date: "2026-02-24", action: "Updated hiring dashboard", result: "8 open roles, 1 urgent", status: "yellow" },
          ],
        }),
      },
      specialists: [
        {
          id: "ppl-recruit", name: "Recruiting Agent", role: "Talent Acquisition",
          description: "Manages job postings, candidate pipelines, interview scheduling, and offer tracking.", status: "green",
          ...agentDetail({
            skills: ["Job posting management", "Candidate screening", "Interview scheduling", "Offer tracking"],
            dataSources: ["hr_records"],
            connectors: [{ name: "Greenhouse", status: "pending" }, { name: "LinkedIn Recruiter", status: "pending" }],
            taskHistory: [
              { date: "2026-02-24", action: "Screened 24 candidates for Process Engineer role", result: "4 advanced to interview", status: "green" },
            ],
          }),
        },
        {
          id: "ppl-train", name: "Training Agent", role: "Learning & Development",
          description: "Tracks training certifications, compliance training, onboarding programs, and skill development.", status: "green",
          ...agentDetail({
            skills: ["Training completion tracking", "Certification management", "Onboarding coordination", "Skills gap analysis"],
            dataSources: ["hr_records"],
            connectors: [{ name: "Workday Learning", status: "pending" }],
            taskHistory: [
              { date: "2026-02-24", action: "Checked training compliance", result: "93% completion rate, 7 overdue", status: "yellow" },
            ],
          }),
        },
      ],
    },
  },

  "vp-legal": {
    key: "vp-legal",
    title: "VP Legal",
    branch: "Admin",
    branchKey: "admin",
    color: T.teal,
    focusAreas: ["Contracts", "IP/Patents"],
    kpis: [
      { label: "Active Contracts", value: "34", sub: "5 expiring soon" },
      { label: "IP Portfolio", value: "4", sub: "patents granted" },
      { label: "Insurance", value: "$337M", sub: "total coverage" },
      { label: "Filings", value: "12", sub: "active regulatory" },
    ],
    quickLinks: [{ label: "Platform & Admin", target: "admin" }, { label: "Risk Register", target: "risk" }],
    agentTeam: {
      lead: {
        id: "legal-ea", name: "Legal EA", role: "Executive Assistant",
        description: "Your executive assistant for Legal. Coordinates contract management, IP protection, and regulatory filing agents.",
        exampleQuestions: ["Which contracts are expiring in the next 90 days?", "What's the status of our patent applications?", "Summarize our insurance coverage by category"],
        ...agentDetail({
          skills: ["Contract lifecycle overview", "IP portfolio summary", "Insurance coverage analysis", "Regulatory filing tracking"],
          dataSources: ["legal_contracts", "engineering_ip"],
          connectors: [{ name: "DocuSign", status: "pending" }, { name: "Ironclad", status: "pending" }],
          taskHistory: [
            { date: "2026-02-24", action: "Reviewed contract expiry calendar", result: "5 contracts expiring in 90 days", status: "yellow" },
          ],
        }),
      },
      specialists: [
        {
          id: "legal-contract", name: "Contract Agent", role: "Contract Management",
          description: "Tracks contract lifecycles, renewal dates, obligation management, and negotiation support.", status: "green",
          ...agentDetail({
            skills: ["Contract tracking", "Renewal management", "Obligation monitoring", "Clause library"],
            dataSources: ["legal_contracts"],
            connectors: [{ name: "Ironclad", status: "pending" }, { name: "DocuSign", status: "pending" }],
            taskHistory: [
              { date: "2026-02-24", action: "Tracked 34 active contracts", result: "5 renewals flagged", status: "yellow" },
            ],
          }),
        },
        {
          id: "legal-ip", name: "IP Agent", role: "Intellectual Property",
          description: "Monitors patent portfolio, trademark registrations, trade secret protections, and IP litigation.", status: "green",
          ...agentDetail({
            skills: ["Patent portfolio monitoring", "Trademark management", "Trade secret program", "IP litigation tracking"],
            dataSources: ["engineering_ip"],
            connectors: [{ name: "PatSnap", status: "pending" }],
            taskHistory: [
              { date: "2026-02-24", action: "Monitored IP portfolio", result: "4 granted, 2 pending, no conflicts", status: "green" },
            ],
          }),
        },
      ],
    },
  },
};

/** Get all VP keys */
export const vpKeys = Object.keys(vpRegistry);

/** Check if a navigation key is a VP dashboard */
export const isVpKey = (key) => key?.startsWith("vp-");

/** Check if a navigation key is an exec dashboard (CEO or COO) */
export const isExecKey = (key) => key === "ceo" || key === "coo";

/** Get exec data by key */
export const getExecData = (key) => key === "ceo" ? ceoAgentTeam : key === "coo" ? cooAgentTeam : null;

/** Check if a navigation key is an agent detail */
export const isAgentKey = (key) => key?.startsWith("agent-");

/**
 * Flatten all agents (lead + specialists) across CEO + all VPs into a lookup.
 * Returns { [agentId]: { agent, parentKey, parentTitle, color } }
 */
export const buildAgentIndex = () => {
  const index = {};

  // CEO team
  const ceo = ceoAgentTeam;
  index[ceo.agentTeam.lead.id] = { agent: ceo.agentTeam.lead, parentKey: "ceo", parentTitle: "CEO", color: ceo.color };
  ceo.agentTeam.specialists.forEach(s => {
    index[s.id] = { agent: s, parentKey: "ceo", parentTitle: "CEO", color: ceo.color };
  });

  // COO team
  const coo = cooAgentTeam;
  index[coo.agentTeam.lead.id] = { agent: coo.agentTeam.lead, parentKey: "coo", parentTitle: "COO", color: coo.color };
  coo.agentTeam.specialists.forEach(s => {
    index[s.id] = { agent: s, parentKey: "coo", parentTitle: "COO", color: coo.color };
  });

  // VP teams
  Object.values(vpRegistry).forEach(vp => {
    index[vp.agentTeam.lead.id] = { agent: vp.agentTeam.lead, parentKey: vp.key, parentTitle: vp.title, color: vp.color };
    vp.agentTeam.specialists.forEach(s => {
      index[s.id] = { agent: s, parentKey: vp.key, parentTitle: vp.title, color: vp.color };
    });
  });

  return index;
};

/** Pre-built agent index */
export const agentIndex = buildAgentIndex();

/**
 * Build a directory of all EA agents for the global picker.
 * Returns [{ id, name, role, department, color, parentKey }]
 */
export const getAgentDirectory = () => {
  const directory = [];

  // CEO EA first
  directory.push({
    id: ceoAgentTeam.agentTeam.lead.id,
    name: ceoAgentTeam.agentTeam.lead.name,
    role: ceoAgentTeam.agentTeam.lead.role,
    department: "Executive",
    branch: "Executive",
    color: ceoAgentTeam.color,
    parentKey: "ceo",
    teamSize: ceoAgentTeam.agentTeam.specialists.length + 1,
    agentTeam: ceoAgentTeam.agentTeam,
  });

  // COO EA
  directory.push({
    id: cooAgentTeam.agentTeam.lead.id,
    name: cooAgentTeam.agentTeam.lead.name,
    role: cooAgentTeam.agentTeam.lead.role,
    department: "Executive",
    branch: "Executive",
    color: cooAgentTeam.color,
    parentKey: "coo",
    teamSize: cooAgentTeam.agentTeam.specialists.length + 1,
    agentTeam: cooAgentTeam.agentTeam,
  });

  // VP EAs
  Object.values(vpRegistry).forEach(vp => {
    directory.push({
      id: vp.agentTeam.lead.id,
      name: vp.agentTeam.lead.name,
      role: vp.agentTeam.lead.role,
      department: vp.title,
      branch: vp.branch,
      color: vp.color,
      parentKey: vp.key,
      teamSize: vp.agentTeam.specialists.length + 1,
      agentTeam: vp.agentTeam,
    });
  });

  return directory;
};
