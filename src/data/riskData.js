import { T } from "./theme";

/* ═══ Shared Risk Data ═══════════════════════════════════════════════
   Data used by both RiskLandingView and RiskView.
   Extracted to avoid duplication across views.
   ═══════════════════════════════════════════════════════════════════ */

export const riskDomains = [
  { domain: "Workforce", score: 68, severity: "MEDIUM", color: T.warn, owner: "VP HR", freq: "Monthly", trend: "\u2191",
    subMetrics: [
      { label: "Turnover Rate", value: "18%", status: "warn", detail: "Above 15% target \u2014 operations roles driving attrition" },
      { label: "Open Positions", value: "12", status: "warn", detail: "3 critical ops roles unfilled > 60 days" },
      { label: "Training Compliance", value: "91%", status: "ok", detail: "Slight improvement from 88% last month" },
      { label: "Overtime Hours", value: "2,140", status: "warn", detail: "Baton Rouge & Richmond above sustainable threshold" },
    ],
    agentInsights: [
      { agent: "Workforce AI", time: "2h ago", text: "Turnover pattern at Baton Rouge correlates with shift schedule changes implemented in January. Recommend reverting to 4x10 schedule \u2014 similar reversion at Noble reduced attrition 22%.", severity: "high" },
      { agent: "Risk Analyst", time: "6h ago", text: "Open headcount in operations is creating cascading overtime risk. If unfilled by March 15, projected 30% increase in fatigue-related incidents based on historical data.", severity: "medium" },
    ],
  },
  { domain: "Process & Mfg", score: 55, severity: "HIGH", color: T.danger, owner: "VP Ops", freq: "Weekly", trend: "\u2192",
    subMetrics: [
      { label: "Unplanned Downtime", value: "6.2%", status: "danger", detail: "Baton Rouge reactor contributing 68% of total downtime" },
      { label: "Throughput Efficiency", value: "82%", status: "warn", detail: "Target is 90% \u2014 feed quality issues at 2 sites" },
      { label: "Quality Incidents", value: "3", status: "warn", detail: "2 off-spec distillate batches, 1 carbon grade deviation" },
      { label: "Equipment Health", value: "74%", status: "warn", detail: "Predictive maintenance flagging 4 items across fleet" },
    ],
    agentInsights: [
      { agent: "Process AI", time: "1h ago", text: "Baton Rouge reactor temperature variance exceeding \u00b18\u00b0C threshold 3x this week. Root cause likely worn thermal couple in Zone 2 \u2014 maintenance window recommended within 48h.", severity: "high" },
      { agent: "Ops Analyst", time: "4h ago", text: "Feed quality from Gulf Coast Rubber trending 2.1% below spec on moisture content. This correlates with the off-spec distillate batches. Suggest supplier quality hold.", severity: "medium" },
    ],
  },
  { domain: "Project Dev", score: 58, severity: "HIGH", color: T.danger, owner: "VP Project", freq: "Weekly", trend: "\u2191",
    subMetrics: [
      { label: "Schedule Variance", value: "-4.2%", status: "warn", detail: "Noble B 2 weeks behind on structural steel" },
      { label: "Cost Variance", value: "+3.8%", status: "warn", detail: "Portland OR EPC estimate revised upward" },
      { label: "Permit Status", value: "2 pending", status: "warn", detail: "Portland OR air quality + Noble B water discharge" },
      { label: "Contractor Performance", value: "78%", status: "warn", detail: "National Concrete underperforming on Noble B" },
    ],
    agentInsights: [
      { agent: "Project AI", time: "3h ago", text: "Noble B structural steel delay likely to cascade to mechanical installation if not recovered by Week 12. Fast-tracking fabrication with alternate vendor could recover 8 of 14 lost days.", severity: "high" },
    ],
  },
  { domain: "Offtake & Mktg", score: 70, severity: "MEDIUM", color: T.warn, owner: "VP Mktg", freq: "Monthly", trend: "\u2193",
    subMetrics: [
      { label: "Contracted Volume", value: "78%", status: "ok", detail: "Diluent offtake well-contracted through Q3" },
      { label: "Spot Pricing", value: "$2.1/gal", status: "ok", detail: "Favorable vs. $2.0 budget assumption" },
      { label: "Carbon Credit Pipeline", value: "$1.2M", status: "ok", detail: "Q1 credits verified, pending sale" },
      { label: "Customer Concentration", value: "42%", status: "warn", detail: "Top 2 customers = 42% of revenue" },
    ],
    agentInsights: [
      { agent: "Market AI", time: "8h ago", text: "Diluent spot price trending favorably but WTI correlation suggests potential 8-12% correction in Q2. Recommend accelerating forward contracts for uncommitted volume.", severity: "low" },
    ],
  },
  { domain: "Site Security", score: 82, severity: "LOW", color: T.green, owner: "VP Security", freq: "Quarterly", trend: "\u2191",
    subMetrics: [
      { label: "Access Violations", value: "2", status: "ok", detail: "Both minor \u2014 unauthorized vehicle entry at Noble" },
      { label: "Camera Uptime", value: "98.5%", status: "ok", detail: "All sites above 97% threshold" },
      { label: "Incident Response Time", value: "4.2 min", status: "ok", detail: "Well within 10-minute SLA" },
      { label: "Perimeter Integrity", value: "96%", status: "ok", detail: "Tucson fence repair scheduled this week" },
    ],
    agentInsights: [
      { agent: "Security AI", time: "12h ago", text: "No significant security concerns. Recommend extending quarterly review cycle to semi-annual given consistent 80+ scores for 6 consecutive months.", severity: "low" },
    ],
  },
  { domain: "IT & Data", score: 74, severity: "MEDIUM", color: T.warn, owner: "CIO", freq: "Monthly", trend: "\u2192",
    subMetrics: [
      { label: "System Uptime", value: "99.2%", status: "ok", detail: "Minor SCADA latency at Richmond resolved" },
      { label: "Cyber Threat Level", value: "ELEVATED", status: "warn", detail: "3 phishing attempts blocked this week" },
      { label: "Patch Compliance", value: "87%", status: "warn", detail: "13% of endpoints awaiting critical patches" },
      { label: "Data Backup Status", value: "Current", status: "ok", detail: "All sites backed up within 24h RPO" },
    ],
    agentInsights: [
      { agent: "Cyber AI", time: "5h ago", text: "Phishing campaign targeting energy sector detected by threat intel feeds. All 3 blocked attempts match this campaign signature. Recommend mandatory security awareness refresher for all staff within 7 days.", severity: "medium" },
    ],
  },
  { domain: "Regulatory", score: 75, severity: "MEDIUM", color: T.warn, owner: "VP Risk", freq: "Monthly", trend: "\u2192",
    subMetrics: [
      { label: "Permit Compliance", value: "94%", status: "ok", detail: "Noble B water permit renewal in progress" },
      { label: "Audit Findings Open", value: "5", status: "warn", detail: "2 high-priority from last EPA inspection" },
      { label: "Reporting Timeliness", value: "100%", status: "ok", detail: "All regulatory reports filed on time" },
      { label: "Upcoming Deadlines", value: "3", status: "warn", detail: "March: EPA Noble, TCEQ Tucson, OSHA annual" },
    ],
    agentInsights: [
      { agent: "Regulatory AI", time: "1h ago", text: "EPA proposed rule change on pyrolysis emissions monitoring (Federal Register 2026-02-20) could impact Noble and Richmond permits. 60-day comment period \u2014 recommend legal review and industry coalition response.", severity: "high" },
    ],
  },
  { domain: "Supply Chain", score: 67, severity: "MEDIUM", color: T.warn, owner: "VP Sourcing", freq: "Bi-weekly", trend: "\u2191",
    subMetrics: [
      { label: "Feed Inventory (days)", value: "8.2", status: "warn", detail: "Below 10-day target at Baton Rouge & Columbus" },
      { label: "Supplier On-Time", value: "88%", status: "warn", detail: "Gulf Coast Rubber 3 late deliveries this month" },
      { label: "Price Variance", value: "+2.4%", status: "warn", detail: "Tire crumb cost trending above budget" },
      { label: "Alternate Sources", value: "2 active", status: "ok", detail: "Backup suppliers qualified for 3 of 5 sites" },
    ],
    agentInsights: [
      { agent: "Supply Chain AI", time: "3h ago", text: "Gulf Coast Rubber delivery reliability dropped from 95% to 82% over 6 weeks. Correlates with their reported equipment issues. Recommend activating secondary supplier for Baton Rouge to maintain 10-day buffer.", severity: "medium" },
    ],
  },
];

export const alertsFeed = [
  { id: 1, time: "2 min ago", type: "critical", source: "WakeCap + GOARC", message: "3 unauthorized workers entered confined space Zone F \u2014 no active permit for personnel" },
  { id: 2, time: "8 min ago", type: "critical", source: "Veriforce + WakeCap", message: "National Concrete crew (risk score: 78) assigned to reactor zone without updated hot work cert" },
  { id: 3, time: "15 min ago", type: "warning", source: "GOARC", message: "Hot work permit PTW-2847 overlaps spatially with Zone C distillation work \u2014 cumulative risk exceeded" },
  { id: 4, time: "22 min ago", type: "warning", source: "WakeCap", message: "Zone A worker density at 89% of permitted capacity \u2014 approaching overcrowding threshold" },
  { id: 5, time: "34 min ago", type: "info", source: "Veriforce", message: "Cissell Mueller insurance policy expires in 12 days \u2014 auto-notification sent to contractor" },
  { id: 6, time: "41 min ago", type: "warning", source: "WakeCap + Veriforce", message: "Unregistered sub-tier worker detected in Zone B \u2014 no Veriforce prequalification record found" },
];

export const complianceData = [
  { category: "Certifications", compliant: 142, expiring: 18, lapsed: 5 },
  { category: "Insurance", compliant: 158, expiring: 8, lapsed: 2 },
  { category: "Permits", compliant: 17, expiring: 3, lapsed: 1 },
  { category: "Training", compliant: 134, expiring: 22, lapsed: 11 },
  { category: "OQ Records", compliant: 89, expiring: 7, lapsed: 3 },
];

export const riskRegisterData = [
  ["Series C Financing", "Financial", "Portfolio", "Critical", 4, 4, 16, "VP Strategy", "Investor roadshow", "2026-04-30", 85, "yellow"],
  ["Diluent Price Vol.", "Financial", "All sites", "High", 3, 4, 12, "VP Finance", "Hedging program", "2026-05-31", 60, "yellow"],
  ["Multi-site Complexity", "Execution", "4 sites", "High", 3, 4, 12, "COO", "Integration mgmt", "2026-06-30", 75, "yellow"],
  ["Baton Rouge Uptime", "Operational", "Baton Rouge", "Medium", 3, 3, 9, "VP Ops", "Equipment overhaul", "2026-07-31", 45, "yellow"],
  ["Noble B Permitting", "Regulatory", "Noble B", "Critical", 2, 5, 10, "VP Risk", "Regulatory filing", "2026-03-31", 90, "green"],
  ["EPC Cost Overrun", "Execution", "Construction", "Medium", 3, 3, 9, "VP Project", "Budget review", "2026-08-31", 50, "yellow"],
  ["Processor Delay", "Execution", "TX Vessel", "High", 2, 4, 8, "VP Eng", "Vendor management", "2026-04-30", 70, "green"],
  ["Portland OR Permit", "Regulatory", "Portland OR", "High", 2, 4, 8, "VP Risk", "Agency negotiations", "2026-05-31", 80, "green"],
  ["Carbon Price", "Market", "All", "Medium", 2, 3, 6, "VP Mktg", "Compliance strategy", "2026-09-30", 40, "green"],
  ["Feed Quality", "Operations", "Multi-supplier", "Medium", 1, 4, 4, "VP Ops", "Supplier audit", "2026-06-30", 55, "green"],
  ["Cyber Security", "IT/Data", "Corporate", "High", 2, 4, 8, "CIO", "Security upgrade", "2026-05-31", 65, "yellow"],
  ["Supply Disruption", "Supply Chain", "Vendors", "Medium", 2, 3, 6, "VP Sourcing", "Dual sourcing", "2026-07-31", 48, "yellow"],
];
