import { useState, useEffect, useRef } from "react";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";

// --- Data ---
const siteRiskTrend = [
  { date: "Mon", overall: 34, wakecap: 28, goarc: 42, veriforce: 31 },
  { date: "Tue", overall: 38, wakecap: 32, goarc: 45, veriforce: 36 },
  { date: "Wed", overall: 31, wakecap: 25, goarc: 38, veriforce: 30 },
  { date: "Thu", overall: 45, wakecap: 41, goarc: 52, veriforce: 42 },
  { date: "Fri", overall: 52, wakecap: 48, goarc: 58, veriforce: 49 },
  { date: "Sat", overall: 29, wakecap: 22, goarc: 35, veriforce: 28 },
  { date: "Sun", overall: 24, wakecap: 18, goarc: 30, veriforce: 23 },
];

const zoneData = [
  { zone: "Zone A - Tower Crane", workers: 24, permits: 3, risk: 72, density: 89, status: "critical", alerts: 2, wakecapWorkers: 24, goarcPermits: 3, veriforceHighRisk: 4 },
  { zone: "Zone B - Foundation", workers: 18, permits: 2, risk: 45, density: 62, status: "elevated", alerts: 1, wakecapWorkers: 18, goarcPermits: 2, veriforceHighRisk: 1 },
  { zone: "Zone C - MEP Rough-In", workers: 31, permits: 5, risk: 58, density: 74, status: "elevated", alerts: 3, wakecapWorkers: 31, goarcPermits: 5, veriforceHighRisk: 3 },
  { zone: "Zone D - Exterior Envelope", workers: 12, permits: 1, risk: 28, density: 35, status: "normal", alerts: 0, wakecapWorkers: 12, goarcPermits: 1, veriforceHighRisk: 0 },
  { zone: "Zone E - Interior Finishes", workers: 22, permits: 4, risk: 38, density: 51, status: "normal", alerts: 0, wakecapWorkers: 22, goarcPermits: 4, veriforceHighRisk: 1 },
  { zone: "Zone F - Confined Space", workers: 6, permits: 2, risk: 81, density: 95, status: "critical", alerts: 4, wakecapWorkers: 6, goarcPermits: 2, veriforceHighRisk: 2 },
];

const contractorScorecard = [
  { name: "Apex Steel", trir: 1.2, riskScore: 34, certCompliance: 98, permitAdherence: 95, behaviorScore: 88, workers: 45, trend: "improving" },
  { name: "ProBuild Mechanical", trir: 2.8, riskScore: 67, certCompliance: 82, permitAdherence: 71, behaviorScore: 62, workers: 32, trend: "declining" },
  { name: "Summit Electrical", trir: 0.8, riskScore: 22, certCompliance: 100, permitAdherence: 98, behaviorScore: 94, workers: 28, trend: "stable" },
  { name: "CoreTech Plumbing", trir: 1.9, riskScore: 48, certCompliance: 91, permitAdherence: 88, behaviorScore: 79, workers: 19, trend: "improving" },
  { name: "National Concrete", trir: 3.4, riskScore: 78, certCompliance: 74, permitAdherence: 65, behaviorScore: 55, workers: 38, trend: "declining" },
  { name: "Elite Glazing", trir: 0.5, riskScore: 18, certCompliance: 100, permitAdherence: 99, behaviorScore: 96, workers: 14, trend: "stable" },
];

const complianceData = [
  { category: "Certifications", compliant: 142, expiring: 18, lapsed: 5 },
  { category: "Insurance", compliant: 158, expiring: 8, lapsed: 2 },
  { category: "Permits", compliant: 17, expiring: 3, lapsed: 1 },
  { category: "Training", compliant: 134, expiring: 22, lapsed: 11 },
  { category: "OQ Records", compliant: 89, expiring: 7, lapsed: 3 },
];

const alertsFeed = [
  { id: 1, time: "2 min ago", type: "critical", source: "WakeCap + GOARC", message: "3 unauthorized workers entered confined space Zone F — no active permit for personnel", icon: "🔴" },
  { id: 2, time: "8 min ago", type: "critical", source: "Veriforce + WakeCap", message: "National Concrete crew (high-risk score: 78) assigned to elevated work Zone A without updated fall protection cert", icon: "🔴" },
  { id: 3, time: "15 min ago", type: "warning", source: "GOARC", message: "Hot work permit PTW-2847 overlaps spatially with Zone C MEP work — cumulative risk threshold exceeded", icon: "🟡" },
  { id: 4, time: "22 min ago", type: "warning", source: "WakeCap", message: "Zone A worker density at 89% of permitted capacity — approaching overcrowding threshold", icon: "🟡" },
  { id: 5, time: "34 min ago", type: "info", source: "Veriforce", message: "ProBuild Mechanical insurance policy expires in 12 days — auto-notification sent to contractor", icon: "🔵" },
  { id: 6, time: "41 min ago", type: "warning", source: "WakeCap + Veriforce", message: "Unregistered sub-tier worker detected in Zone B — no Veriforce prequalification record found", icon: "🟡" },
  { id: 7, time: "55 min ago", type: "info", source: "GOARC + WakeCap", message: "Permit PTW-2845 completed — all workers confirmed evacuated from isolation zone via WakeCap", icon: "🔵" },
];

const radarData = [
  { metric: "Worker Location", value: 92, fullMark: 100 },
  { metric: "Permit Compliance", value: 78, fullMark: 100 },
  { metric: "Contractor Qual.", value: 85, fullMark: 100 },
  { metric: "Density Mgmt", value: 71, fullMark: 100 },
  { metric: "Incident Predict.", value: 88, fullMark: 100 },
  { metric: "Cert Currency", value: 82, fullMark: 100 },
];

const predictiveData = [
  { hour: "6AM", predicted: 18, actual: 15 },
  { hour: "7AM", predicted: 32, actual: 29 },
  { hour: "8AM", predicted: 54, actual: 58 },
  { hour: "9AM", predicted: 62, actual: 65 },
  { hour: "10AM", predicted: 58, actual: 52 },
  { hour: "11AM", predicted: 71, actual: 74 },
  { hour: "12PM", predicted: 45, actual: null },
  { hour: "1PM", predicted: 68, actual: null },
  { hour: "2PM", predicted: 73, actual: null },
  { hour: "3PM", predicted: 55, actual: null },
  { hour: "4PM", predicted: 38, actual: null },
  { hour: "5PM", predicted: 22, actual: null },
];

// --- Components ---

const COLORS = {
  critical: "#ef4444",
  elevated: "#f59e0b",
  normal: "#22c55e",
  bg: "#0f172a",
  card: "#1e293b",
  cardHover: "#334155",
  border: "#334155",
  text: "#f8fafc",
  textMuted: "#94a3b8",
  accent: "#3b82f6",
  wakecap: "#06b6d4",
  goarc: "#f59e0b",
  veriforce: "#8b5cf6",
};

function MetricCard({ label, value, subtext, color, icon, pulse }) {
  return (
    <div style={{
      background: COLORS.card,
      borderRadius: 12,
      padding: "20px 24px",
      borderLeft: `4px solid ${color || COLORS.accent}`,
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ color: COLORS.textMuted, fontSize: 13, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>{label}</div>
          <div style={{ color: COLORS.text, fontSize: 32, fontWeight: 700, lineHeight: 1 }}>{value}</div>
          {subtext && <div style={{ color: COLORS.textMuted, fontSize: 12, marginTop: 6 }}>{subtext}</div>}
        </div>
        <div style={{ fontSize: 28, opacity: 0.7 }}>{icon}</div>
      </div>
      {pulse && (
        <div style={{
          position: "absolute", top: 8, right: 8, width: 8, height: 8,
          borderRadius: "50%", background: COLORS.critical,
          animation: "pulse 2s infinite",
        }} />
      )}
    </div>
  );
}

function SourceBadge({ source }) {
  const colorMap = { WakeCap: COLORS.wakecap, GOARC: COLORS.goarc, Veriforce: COLORS.veriforce };
  const sources = source.split(" + ");
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {sources.map((s, i) => (
        <span key={i} style={{
          background: `${colorMap[s.trim()] || COLORS.accent}22`,
          color: colorMap[s.trim()] || COLORS.accent,
          fontSize: 10,
          fontWeight: 600,
          padding: "2px 8px",
          borderRadius: 10,
          border: `1px solid ${colorMap[s.trim()] || COLORS.accent}44`,
        }}>{s.trim()}</span>
      ))}
    </div>
  );
}

function ZoneHeatmap({ zones, onZoneClick, selectedZone }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
      {zones.map((z, i) => {
        const bg = z.status === "critical" ? `${COLORS.critical}20` : z.status === "elevated" ? `${COLORS.elevated}15` : `${COLORS.normal}10`;
        const border = z.status === "critical" ? COLORS.critical : z.status === "elevated" ? COLORS.elevated : COLORS.normal;
        const selected = selectedZone === i;
        return (
          <div
            key={i}
            onClick={() => onZoneClick(i)}
            style={{
              background: selected ? `${border}30` : bg,
              border: `2px solid ${selected ? border : border + "44"}`,
              borderRadius: 10,
              padding: 14,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ color: COLORS.text, fontSize: 13, fontWeight: 600 }}>{z.zone.split(" - ")[0]}</span>
              {z.alerts > 0 && (
                <span style={{ background: COLORS.critical, color: "#fff", fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 8 }}>
                  {z.alerts}
                </span>
              )}
            </div>
            <div style={{ color: COLORS.textMuted, fontSize: 11, marginBottom: 4 }}>{z.zone.split(" - ")[1]}</div>
            <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ color: COLORS.wakecap, fontSize: 16, fontWeight: 700 }}>{z.workers}</div>
                <div style={{ color: COLORS.textMuted, fontSize: 9 }}>workers</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ color: COLORS.goarc, fontSize: 16, fontWeight: 700 }}>{z.permits}</div>
                <div style={{ color: COLORS.textMuted, fontSize: 9 }}>permits</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ color: border, fontSize: 16, fontWeight: 700 }}>{z.risk}</div>
                <div style={{ color: COLORS.textMuted, fontSize: 9 }}>risk</div>
              </div>
            </div>
            {/* Density bar */}
            <div style={{ marginTop: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ color: COLORS.textMuted, fontSize: 9 }}>Density</span>
                <span style={{ color: z.density > 80 ? COLORS.critical : z.density > 60 ? COLORS.elevated : COLORS.normal, fontSize: 9, fontWeight: 600 }}>{z.density}%</span>
              </div>
              <div style={{ background: "#0f172a", borderRadius: 4, height: 4, overflow: "hidden" }}>
                <div style={{
                  width: `${z.density}%`,
                  height: "100%",
                  borderRadius: 4,
                  background: z.density > 80 ? COLORS.critical : z.density > 60 ? COLORS.elevated : COLORS.normal,
                  transition: "width 0.5s",
                }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function RiskIntelligenceDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedZone, setSelectedZone] = useState(null);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const tabs = [
    { id: "overview", label: "Executive Overview" },
    { id: "zones", label: "Site Zones" },
    { id: "contractors", label: "Contractor Intel" },
    { id: "compliance", label: "Compliance" },
    { id: "predictive", label: "Predictive" },
  ];

  const totalWorkers = zoneData.reduce((s, z) => s + z.workers, 0);
  const totalAlerts = zoneData.reduce((s, z) => s + z.alerts, 0);
  const avgRisk = Math.round(zoneData.reduce((s, z) => s + z.risk, 0) / zoneData.length);
  const criticalZones = zoneData.filter(z => z.status === "critical").length;

  return (
    <div style={{ background: COLORS.bg, minHeight: "100vh", color: COLORS.text, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: ${COLORS.bg}; }
        ::-webkit-scrollbar-thumb { background: ${COLORS.border}; border-radius: 3px; }
      `}</style>

      {/* Header */}
      <div style={{ background: COLORS.card, borderBottom: `1px solid ${COLORS.border}`, padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 18 }}>SE</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em" }}>Systemic Environments</div>
            <div style={{ fontSize: 12, color: COLORS.textMuted }}>Integrated Risk Intelligence Platform</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <span style={{ background: `${COLORS.wakecap}22`, color: COLORS.wakecap, fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 6, border: `1px solid ${COLORS.wakecap}44` }}>WakeCap LIVE</span>
            <span style={{ background: `${COLORS.goarc}22`, color: COLORS.goarc, fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 6, border: `1px solid ${COLORS.goarc}44` }}>GOARC LIVE</span>
            <span style={{ background: `${COLORS.veriforce}22`, color: COLORS.veriforce, fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 6, border: `1px solid ${COLORS.veriforce}44` }}>Veriforce LIVE</span>
          </div>
          <div style={{ color: COLORS.textMuted, fontSize: 13, fontFamily: "monospace" }}>
            {time.toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, padding: "0 32px", background: COLORS.card, borderBottom: `1px solid ${COLORS.border}` }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: "none",
              border: "none",
              color: activeTab === tab.id ? COLORS.accent : COLORS.textMuted,
              borderBottom: activeTab === tab.id ? `2px solid ${COLORS.accent}` : "2px solid transparent",
              padding: "12px 20px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: "24px 32px", maxWidth: 1400, margin: "0 auto" }}>

        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div>
            {/* KPI Row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
              <MetricCard label="Workers On Site" value={totalWorkers} subtext="via WakeCap real-time tracking" color={COLORS.wakecap} icon="👷" />
              <MetricCard label="Active Permits" value={17} subtext="5 hot work · 3 confined space · 9 general" color={COLORS.goarc} icon="📋" />
              <MetricCard label="Site Risk Score" value={avgRisk} subtext={avgRisk > 50 ? "Above threshold — review recommended" : "Within acceptable range"} color={avgRisk > 50 ? COLORS.elevated : COLORS.normal} icon="⚡" />
              <MetricCard label="Active Alerts" value={totalAlerts} subtext={`${criticalZones} critical zones`} color={COLORS.critical} icon="🚨" pulse />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
              {/* Risk Trend Chart */}
              <div style={{ background: COLORS.card, borderRadius: 12, padding: 24 }}>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Correlated Risk Trend</div>
                <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 20 }}>7-day rolling · Data from all three sources</div>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={siteRiskTrend}>
                    <defs>
                      <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.accent} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={COLORS.accent} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                    <XAxis dataKey="date" stroke={COLORS.textMuted} fontSize={11} />
                    <YAxis stroke={COLORS.textMuted} fontSize={11} />
                    <Tooltip contentStyle={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 12 }} />
                    <Area type="monotone" dataKey="overall" stroke={COLORS.accent} fill="url(#riskGrad)" strokeWidth={2} name="Overall" />
                    <Line type="monotone" dataKey="wakecap" stroke={COLORS.wakecap} strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="WakeCap" />
                    <Line type="monotone" dataKey="goarc" stroke={COLORS.goarc} strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="GOARC" />
                    <Line type="monotone" dataKey="veriforce" stroke={COLORS.veriforce} strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="Veriforce" />
                  </AreaChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 12 }}>
                  {[{ label: "Overall", color: COLORS.accent }, { label: "WakeCap", color: COLORS.wakecap }, { label: "GOARC", color: COLORS.goarc }, { label: "Veriforce", color: COLORS.veriforce }].map(l => (
                    <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 10, height: 3, background: l.color, borderRadius: 2 }} />
                      <span style={{ fontSize: 10, color: COLORS.textMuted }}>{l.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Safety Radar */}
              <div style={{ background: COLORS.card, borderRadius: 12, padding: 24 }}>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Safety Posture Radar</div>
                <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 20 }}>Composite score across all integration points</div>
                <ResponsiveContainer width="100%" height={260}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke={COLORS.border} />
                    <PolarAngleAxis dataKey="metric" stroke={COLORS.textMuted} fontSize={10} />
                    <PolarRadiusAxis stroke={COLORS.border} fontSize={9} domain={[0, 100]} />
                    <Radar name="Score" dataKey="value" stroke={COLORS.accent} fill={COLORS.accent} fillOpacity={0.2} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Live Alerts Feed */}
            <div style={{ background: COLORS.card, borderRadius: 12, padding: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>Live Correlated Alerts</div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted }}>Cross-platform intelligence — alerts that no single tool could generate alone</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS.critical, animation: "pulse 2s infinite" }} />
                  <span style={{ fontSize: 11, color: COLORS.textMuted }}>Real-time</span>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {alertsFeed.map(alert => (
                  <div key={alert.id} style={{
                    background: alert.type === "critical" ? `${COLORS.critical}10` : alert.type === "warning" ? `${COLORS.elevated}08` : `${COLORS.accent}08`,
                    border: `1px solid ${alert.type === "critical" ? COLORS.critical + "33" : alert.type === "warning" ? COLORS.elevated + "22" : COLORS.border}`,
                    borderRadius: 8,
                    padding: "12px 16px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                  }}>
                    <span style={{ fontSize: 14, marginTop: 1 }}>{alert.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <SourceBadge source={alert.source} />
                        <span style={{ color: COLORS.textMuted, fontSize: 10 }}>{alert.time}</span>
                      </div>
                      <div style={{ color: COLORS.text, fontSize: 13, lineHeight: 1.5 }}>{alert.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ZONES TAB */}
        {activeTab === "zones" && (
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Site Zone Heatmap</div>
            <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 20 }}>WakeCap location data + GOARC permit zones + Veriforce risk scores — click a zone for details</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 20 }}>
              <ZoneHeatmap zones={zoneData} onZoneClick={setSelectedZone} selectedZone={selectedZone} />
              <div style={{ background: COLORS.card, borderRadius: 12, padding: 24 }}>
                {selectedZone !== null ? (
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{zoneData[selectedZone].zone}</div>
                    <div style={{
                      display: "inline-block",
                      background: zoneData[selectedZone].status === "critical" ? `${COLORS.critical}22` : zoneData[selectedZone].status === "elevated" ? `${COLORS.elevated}22` : `${COLORS.normal}22`,
                      color: zoneData[selectedZone].status === "critical" ? COLORS.critical : zoneData[selectedZone].status === "elevated" ? COLORS.elevated : COLORS.normal,
                      fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 6, marginBottom: 20,
                      textTransform: "uppercase",
                    }}>{zoneData[selectedZone].status}</div>

                    <div style={{ marginBottom: 20 }}>
                      <div style={{ fontSize: 12, color: COLORS.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>Data Sources</div>
                      {[
                        { label: "WakeCap — Workers Present", value: zoneData[selectedZone].wakecapWorkers, color: COLORS.wakecap },
                        { label: "GOARC — Active Permits", value: zoneData[selectedZone].goarcPermits, color: COLORS.goarc },
                        { label: "Veriforce — High-Risk Workers", value: zoneData[selectedZone].veriforceHighRisk, color: COLORS.veriforce },
                      ].map((item, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${COLORS.border}` }}>
                          <span style={{ color: item.color, fontSize: 13 }}>{item.label}</span>
                          <span style={{ color: COLORS.text, fontSize: 18, fontWeight: 700 }}>{item.value}</span>
                        </div>
                      ))}
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 12, color: COLORS.textMuted }}>Zone Density</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: zoneData[selectedZone].density > 80 ? COLORS.critical : COLORS.text }}>{zoneData[selectedZone].density}%</span>
                      </div>
                      <div style={{ background: "#0f172a", borderRadius: 6, height: 8, overflow: "hidden" }}>
                        <div style={{
                          width: `${zoneData[selectedZone].density}%`,
                          height: "100%",
                          borderRadius: 6,
                          background: zoneData[selectedZone].density > 80 ? `linear-gradient(90deg, ${COLORS.elevated}, ${COLORS.critical})` : `linear-gradient(90deg, ${COLORS.normal}, ${COLORS.elevated})`,
                        }} />
                      </div>
                    </div>

                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 12, color: COLORS.textMuted }}>Composite Risk</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: zoneData[selectedZone].risk > 60 ? COLORS.critical : COLORS.text }}>{zoneData[selectedZone].risk}/100</span>
                      </div>
                      <div style={{ background: "#0f172a", borderRadius: 6, height: 8, overflow: "hidden" }}>
                        <div style={{
                          width: `${zoneData[selectedZone].risk}%`,
                          height: "100%",
                          borderRadius: 6,
                          background: zoneData[selectedZone].risk > 60 ? `linear-gradient(90deg, ${COLORS.elevated}, ${COLORS.critical})` : `linear-gradient(90deg, ${COLORS.normal}, ${COLORS.elevated})`,
                        }} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: COLORS.textMuted, fontSize: 13 }}>
                    Click a zone to see correlated details
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* CONTRACTORS TAB */}
        {activeTab === "contractors" && (
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Contractor Intelligence Scorecards</div>
            <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 20 }}>Veriforce prequalification + WakeCap behavior analytics + GOARC permit adherence</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {contractorScorecard.map((c, i) => (
                <div key={i} style={{ background: COLORS.card, borderRadius: 12, padding: 20, borderLeft: `4px solid ${c.riskScore > 60 ? COLORS.critical : c.riskScore > 40 ? COLORS.elevated : COLORS.normal}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <div>
                      <span style={{ fontSize: 16, fontWeight: 700 }}>{c.name}</span>
                      <span style={{ fontSize: 12, color: COLORS.textMuted, marginLeft: 12 }}>{c.workers} workers on site</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{
                        color: c.trend === "improving" ? COLORS.normal : c.trend === "declining" ? COLORS.critical : COLORS.textMuted,
                        fontSize: 12, fontWeight: 600,
                      }}>
                        {c.trend === "improving" ? "↗ Improving" : c.trend === "declining" ? "↘ Declining" : "→ Stable"}
                      </span>
                      <div style={{
                        background: c.riskScore > 60 ? `${COLORS.critical}22` : c.riskScore > 40 ? `${COLORS.elevated}22` : `${COLORS.normal}22`,
                        color: c.riskScore > 60 ? COLORS.critical : c.riskScore > 40 ? COLORS.elevated : COLORS.normal,
                        padding: "4px 12px", borderRadius: 8, fontSize: 14, fontWeight: 700,
                      }}>
                        Risk: {c.riskScore}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
                    {[
                      { label: "TRIR", value: c.trir, source: "Veriforce", color: COLORS.veriforce, bar: Math.min(c.trir / 4 * 100, 100), bad: c.trir > 2 },
                      { label: "Cert Compliance", value: `${c.certCompliance}%`, source: "Veriforce", color: COLORS.veriforce, bar: c.certCompliance, bad: c.certCompliance < 85 },
                      { label: "Permit Adherence", value: `${c.permitAdherence}%`, source: "GOARC", color: COLORS.goarc, bar: c.permitAdherence, bad: c.permitAdherence < 80 },
                      { label: "Behavior Score", value: c.behaviorScore, source: "WakeCap", color: COLORS.wakecap, bar: c.behaviorScore, bad: c.behaviorScore < 70 },
                    ].map((m, j) => (
                      <div key={j}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                          <span style={{ fontSize: 11, color: COLORS.textMuted }}>{m.label}</span>
                          <span style={{ fontSize: 9, color: m.color, fontWeight: 600 }}>{m.source}</span>
                        </div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: m.bad ? COLORS.critical : COLORS.text, marginBottom: 6 }}>{m.value}</div>
                        <div style={{ background: "#0f172a", borderRadius: 3, height: 4, overflow: "hidden" }}>
                          <div style={{
                            width: `${m.bar}%`,
                            height: "100%",
                            borderRadius: 3,
                            background: m.bad ? COLORS.critical : COLORS.normal,
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* COMPLIANCE TAB */}
        {activeTab === "compliance" && (
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Compliance Readiness Dashboard</div>
            <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 20 }}>Real-time compliance status across all contractor qualifications</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
              <MetricCard label="Fully Compliant" value={`${Math.round((complianceData.reduce((s, c) => s + c.compliant, 0) / (complianceData.reduce((s, c) => s + c.compliant + c.expiring + c.lapsed, 0))) * 100)}%`} subtext="Across all categories" color={COLORS.normal} icon="✅" />
              <MetricCard label="Expiring (30 days)" value={complianceData.reduce((s, c) => s + c.expiring, 0)} subtext="Auto-notifications sent" color={COLORS.elevated} icon="⏰" />
              <MetricCard label="Lapsed / Non-Compliant" value={complianceData.reduce((s, c) => s + c.lapsed, 0)} subtext="Immediate action required" color={COLORS.critical} icon="❌" pulse />
            </div>
            <div style={{ background: COLORS.card, borderRadius: 12, padding: 24 }}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={complianceData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                  <XAxis type="number" stroke={COLORS.textMuted} fontSize={11} />
                  <YAxis dataKey="category" type="category" stroke={COLORS.textMuted} fontSize={12} width={100} />
                  <Tooltip contentStyle={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="compliant" stackId="a" fill={COLORS.normal} name="Compliant" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="expiring" stackId="a" fill={COLORS.elevated} name="Expiring" />
                  <Bar dataKey="lapsed" stackId="a" fill={COLORS.critical} name="Lapsed" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 12 }}>
                {[{ label: "Compliant", color: COLORS.normal }, { label: "Expiring (30d)", color: COLORS.elevated }, { label: "Lapsed", color: COLORS.critical }].map(l => (
                  <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 10, height: 10, background: l.color, borderRadius: 2 }} />
                    <span style={{ fontSize: 11, color: COLORS.textMuted }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PREDICTIVE TAB */}
        {activeTab === "predictive" && (
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Predictive Risk Intelligence</div>
            <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 20 }}>Veriforce predictive model + WakeCap environmental data + GOARC cumulative risk scoring</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
              <div style={{ background: COLORS.card, borderRadius: 12, padding: 24 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Risk Forecast — Today</div>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={predictiveData}>
                    <defs>
                      <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.veriforce} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={COLORS.veriforce} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                    <XAxis dataKey="hour" stroke={COLORS.textMuted} fontSize={10} />
                    <YAxis stroke={COLORS.textMuted} fontSize={10} />
                    <Tooltip contentStyle={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 12 }} />
                    <Area type="monotone" dataKey="predicted" stroke={COLORS.veriforce} fill="url(#predGrad)" strokeWidth={2} strokeDasharray="6 3" name="Predicted Risk" />
                    <Area type="monotone" dataKey="actual" stroke={COLORS.accent} fill={`${COLORS.accent}15`} strokeWidth={2} name="Actual Risk" />
                  </AreaChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 16, height: 2, background: COLORS.veriforce, borderRadius: 1 }} />
                    <span style={{ fontSize: 10, color: COLORS.textMuted }}>Predicted</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 16, height: 2, background: COLORS.accent, borderRadius: 1 }} />
                    <span style={{ fontSize: 10, color: COLORS.textMuted }}>Actual</span>
                  </div>
                </div>
              </div>
              <div style={{ background: COLORS.card, borderRadius: 12, padding: 24 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>High-Risk Windows — Next 24 Hours</div>
                {[
                  { time: "1:00 PM – 2:30 PM", risk: 73, reason: "Peak congestion in Zone A + hot work permit overlap + 3 high-risk contractors on shift" },
                  { time: "3:00 PM – 4:00 PM", risk: 68, reason: "Shift changeover creates unmonitored gap + confined space work in Zone F" },
                  { time: "Tomorrow 7:00 AM", risk: 61, reason: "National Concrete crew (declining trend) scheduled for elevated work + expiring fall cert" },
                ].map((w, i) => (
                  <div key={i} style={{
                    background: `${COLORS.critical}10`,
                    border: `1px solid ${COLORS.critical}22`,
                    borderRadius: 8,
                    padding: 16,
                    marginBottom: 10,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span style={{ color: COLORS.text, fontSize: 14, fontWeight: 700 }}>{w.time}</span>
                      <span style={{
                        background: `${COLORS.critical}22`,
                        color: COLORS.critical,
                        padding: "2px 10px",
                        borderRadius: 6,
                        fontSize: 13,
                        fontWeight: 700,
                      }}>Risk: {w.risk}</span>
                    </div>
                    <div style={{ color: COLORS.textMuted, fontSize: 12, lineHeight: 1.5 }}>{w.reason}</div>
                  </div>
                ))}
                <div style={{ background: `${COLORS.accent}10`, border: `1px solid ${COLORS.accent}22`, borderRadius: 8, padding: 14, marginTop: 16 }}>
                  <div style={{ color: COLORS.accent, fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Model Accuracy</div>
                  <div style={{ color: COLORS.text, fontSize: 24, fontWeight: 700 }}>92.4%</div>
                  <div style={{ color: COLORS.textMuted, fontSize: 11 }}>Based on 150M+ labor hours from Veriforce + site-specific calibration from WakeCap & GOARC</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: 32, paddingTop: 16, borderTop: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ color: COLORS.textMuted, fontSize: 11 }}>Systemic Environments — Integrated Risk Intelligence Platform · Prototype v0.1</div>
          <div style={{ display: "flex", gap: 12 }}>
            {[
              { label: "WakeCap", color: COLORS.wakecap, desc: "IoT · Location · Behavior" },
              { label: "GOARC", color: COLORS.goarc, desc: "Permits · Hazards · Compliance" },
              { label: "Veriforce", color: COLORS.veriforce, desc: "Qualification · Risk · Prediction" },
            ].map(s => (
              <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color }} />
                <span style={{ fontSize: 10, color: s.color, fontWeight: 600 }}>{s.label}</span>
                <span style={{ fontSize: 9, color: COLORS.textMuted }}>{s.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}