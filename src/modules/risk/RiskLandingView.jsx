import { useState } from "react";
import { T } from "@core/theme/theme";
import { riskDomains, alertsFeed, complianceData } from "./riskData";
import { Card, Progress, DraggableGrid } from "@core/ui";

/* ─── Risk Landing Page ───
   "This is all risk" — consolidated view for VP of Risk
   showing aggregated KPIs, domain summary, navigation cards, and top alerts.
─── */

const SRC = { wakecap: T.teal, goarc: T.warn, veriforce: T.purple };

/* Navigation cards for risk sub-views */
const riskSubViews = [
  { key: "risk-workforce", label: "Workforce Risk", desc: "Headcount, contractors, safety, turnover", icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75", color: T.blue },
  { key: "risk-zones", label: "Site Zones", desc: "Zone heatmaps, density, worker tracking", icon: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z", color: T.teal },
  { key: "risk-contractors", label: "Contractor Intel", desc: "Scorecards, compliance, risk ratings", icon: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75", color: T.purple },
  { key: "risk-safety", label: "Safety & Compliance", desc: "Certifications, permits, training, OQ records", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0 1 12 2.944a11.955 11.955 0 0 1-8.618 3.04A12.02 12.02 0 0 0 3 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z", color: T.green },
  { key: "risk-register", label: "Risk Register", desc: "Enterprise risk items, mitigations, owners", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2", color: T.warn },
  { key: "risk-predictive", label: "Predictive Analytics", desc: "AI-driven risk forecasting and trends", icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6", color: T.danger },
];

function SourceBadge({ source }) {
  const colorMap = { WakeCap: SRC.wakecap, GOARC: SRC.goarc, Veriforce: SRC.veriforce };
  const sources = source.split(" + ");
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {sources.map((s, i) => (
        <span key={i} style={{
          background: `${colorMap[s.trim()] || T.blue}22`,
          color: colorMap[s.trim()] || T.blue,
          fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 10,
          border: `1px solid ${colorMap[s.trim()] || T.blue}44`,
        }}>{s.trim()}</span>
      ))}
    </div>
  );
}

export const RiskLandingView = ({ onNavigate }) => {
  const [layoutLocked, setLayoutLocked] = useState(true);

  /* Aggregated KPIs */
  const avgRiskScore = Math.round(riskDomains.reduce((s, d) => s + d.score, 0) / riskDomains.length);
  const criticalDomains = riskDomains.filter(d => d.severity === "HIGH").length;
  const totalCompliant = complianceData.reduce((s, c) => s + c.compliant, 0);
  const totalExpiring = complianceData.reduce((s, c) => s + c.expiring, 0);
  const totalLapsed = complianceData.reduce((s, c) => s + c.lapsed, 0);
  const compliancePct = Math.round((totalCompliant / (totalCompliant + totalExpiring + totalLapsed)) * 100);
  const criticalAlerts = alertsFeed.filter(a => a.type === "critical").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>

      {/* VP of Risk Banner */}
      <div style={{
        background: `linear-gradient(135deg, ${T.purple}15, ${T.blue}10)`,
        border: `1px solid ${T.purple}33`,
        borderRadius: 12, padding: "16px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <div style={{ fontSize: 11, color: T.purple, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>VP of Risk — Enterprise View</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: T.text }}>All Risk Domains — Consolidated Overview</div>
          <div style={{ fontSize: 12, color: T.textDim, marginTop: 2 }}>Workforce, Compliance, Safety, Operations, Regulatory, IT, Supply Chain</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {[
            { label: "WakeCap LIVE", color: SRC.wakecap },
            { label: "GOARC LIVE", color: SRC.goarc },
            { label: "Veriforce LIVE", color: SRC.veriforce },
          ].map(s => (
            <span key={s.label} style={{
              background: `${s.color}22`, color: s.color, fontSize: 10, fontWeight: 600,
              padding: "3px 10px", borderRadius: 6, border: `1px solid ${s.color}44`,
            }}>{s.label}</span>
          ))}
        </div>
      </div>

      <DraggableGrid
        widgets={[
          /* ─── Aggregated KPIs ─── */
          {
            id: "risk-landing-kpis",
            label: "Enterprise Risk KPIs",
            render: () => (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
                <div style={{ background: T.bg2, borderRadius: 10, padding: "16px 20px", borderLeft: `4px solid ${avgRiskScore > 65 ? T.warn : T.green}` }}>
                  <div style={{ color: T.textDim, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Avg Risk Score</div>
                  <div style={{ color: T.text, fontSize: 28, fontWeight: 700, lineHeight: 1 }}>{avgRiskScore}</div>
                  <div style={{ color: T.textMid, fontSize: 11, marginTop: 6 }}>Across {riskDomains.length} domains</div>
                </div>
                <div style={{ background: T.bg2, borderRadius: 10, padding: "16px 20px", borderLeft: `4px solid ${criticalDomains > 0 ? T.danger : T.green}` }}>
                  <div style={{ color: T.textDim, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>High Severity</div>
                  <div style={{ color: T.text, fontSize: 28, fontWeight: 700, lineHeight: 1 }}>{criticalDomains}</div>
                  <div style={{ color: T.textMid, fontSize: 11, marginTop: 6 }}>Domains requiring attention</div>
                </div>
                <div style={{ background: T.bg2, borderRadius: 10, padding: "16px 20px", borderLeft: `4px solid ${compliancePct >= 90 ? T.green : T.warn}` }}>
                  <div style={{ color: T.textDim, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Compliance Rate</div>
                  <div style={{ color: T.text, fontSize: 28, fontWeight: 700, lineHeight: 1 }}>{compliancePct}%</div>
                  <div style={{ color: T.textMid, fontSize: 11, marginTop: 6 }}>{totalExpiring} expiring &middot; {totalLapsed} lapsed</div>
                </div>
                <div style={{ background: T.bg2, borderRadius: 10, padding: "16px 20px", borderLeft: `4px solid ${criticalAlerts > 0 ? T.danger : T.green}`, position: "relative" }}>
                  <div style={{ color: T.textDim, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Active Alerts</div>
                  <div style={{ color: T.text, fontSize: 28, fontWeight: 700, lineHeight: 1 }}>{alertsFeed.length}</div>
                  <div style={{ color: T.textMid, fontSize: 11, marginTop: 6 }}>{criticalAlerts} critical</div>
                  {criticalAlerts > 0 && <div style={{ position: "absolute", top: 8, right: 8, width: 8, height: 8, borderRadius: "50%", background: T.danger, animation: "pulse 2s infinite" }} />}
                </div>
              </div>
            )
          },

          /* ─── Quick Navigation Cards ─── */
          {
            id: "risk-landing-nav",
            label: "Risk Sub-Views",
            render: () => (
              <Card title="Risk Management Areas">
                <div style={{ fontSize: 11, color: T.textDim, marginBottom: 14 }}>Click any area to drill into detailed risk data. Each area is managed by a dedicated director.</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                  {riskSubViews.map(sv => (
                    <button
                      key={sv.key}
                      onClick={() => onNavigate(sv.key)}
                      style={{
                        background: T.bg0, border: `1px solid ${T.border}`, borderRadius: 10,
                        padding: "16px 18px", cursor: "pointer", textAlign: "left",
                        transition: "all .15s", display: "flex", alignItems: "flex-start", gap: 14,
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = sv.color; e.currentTarget.style.background = `${sv.color}08`; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.bg0; }}
                    >
                      <div style={{
                        width: 36, height: 36, borderRadius: 8,
                        background: `${sv.color}18`, border: `1px solid ${sv.color}33`,
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}>
                        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={sv.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={sv.icon} /></svg>
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 3 }}>{sv.label}</div>
                        <div style={{ fontSize: 11, color: T.textDim, lineHeight: 1.4 }}>{sv.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </Card>
            )
          },

          /* ─── Top Alerts ─── */
          {
            id: "risk-landing-alerts",
            label: "Live Alerts",
            render: () => (
              <Card title="Live Correlated Alerts">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color: T.textDim }}>Cross-platform intelligence — latest alerts across all risk domains</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.danger, animation: "pulse 2s infinite" }} />
                    <span style={{ fontSize: 11, color: T.textDim }}>Real-time</span>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {alertsFeed.slice(0, 5).map(a => (
                    <div key={a.id} style={{
                      background: a.type === "critical" ? T.dangerDim : a.type === "warning" ? T.warnDim : T.blueDim,
                      border: `1px solid ${a.type === "critical" ? T.danger + "33" : a.type === "warning" ? T.warn + "22" : T.border}`,
                      borderRadius: 8, padding: "12px 16px", display: "flex", gap: 12,
                    }}>
                      <div style={{ fontSize: 14, marginTop: 1 }}>
                        {a.type === "critical" ? "\uD83D\uDD34" : a.type === "warning" ? "\uD83D\uDFE1" : "\uD83D\uDD35"}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                          <SourceBadge source={a.source} />
                          <span style={{ color: T.textDim, fontSize: 10 }}>{a.time}</span>
                        </div>
                        <div style={{ color: T.text, fontSize: 12, lineHeight: 1.5 }}>{a.message}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )
          },
        ]}
        storageKey="sens-risk-landing-layout"
        locked={layoutLocked}
        onLockedChange={setLayoutLocked}
      />
    </div>
  );
};
