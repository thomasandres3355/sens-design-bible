import { T } from "../data/theme";
import { riskDomains } from "../data/riskData";
import { Card, Progress, DraggableGrid } from "../components/ui";

/* ─── Domain Key → Domain Name mapping ─── */
const DOMAIN_KEY_MAP = {
  "risk-process-mfg": "Process & Mfg",
  "risk-project-dev": "Project Dev",
  "risk-offtake-mktg": "Offtake & Mktg",
  "risk-site-security": "Site Security",
  "risk-it-data": "IT & Data",
  "risk-regulatory": "Regulatory",
  "risk-supply-chain": "Supply Chain",
};

/* ─── Severity color mapping ─── */
const severityStyle = (sev) => ({
  HIGH: { bg: `${T.danger}18`, color: T.danger, border: `${T.danger}44` },
  MEDIUM: { bg: `${T.warn}18`, color: T.warn, border: `${T.warn}44` },
  LOW: { bg: `${T.green}18`, color: T.green, border: `${T.green}44` },
}[sev] || { bg: T.bg2, color: T.textDim, border: T.border });

export const RiskDomainDetailView = ({ domainKey }) => {
  const domainName = DOMAIN_KEY_MAP[domainKey];
  const domain = riskDomains.find(d => d.domain === domainName);

  if (!domain) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: T.textDim }}>
        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Domain Not Found</div>
        <div style={{ fontSize: 13 }}>No data available for "{domainKey}"</div>
      </div>
    );
  }

  const sev = severityStyle(domain.severity);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Domain Header Banner */}
      <div style={{
        background: `linear-gradient(135deg, ${domain.color}12, ${domain.color}06)`,
        border: `1px solid ${domain.color}33`,
        borderRadius: 12, padding: "18px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <div style={{ fontSize: 11, color: domain.color, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
            Enterprise Risk Domain
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: T.text }}>{domain.domain}</div>
          <div style={{ fontSize: 12, color: T.textDim, marginTop: 4 }}>
            Owner: <strong style={{ color: T.textMid }}>{domain.owner}</strong> · Review: {domain.freq} · Trend: {domain.trend}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 36, fontWeight: 700, color: domain.color, lineHeight: 1 }}>{domain.score}</div>
            <div style={{
              fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
              marginTop: 4, padding: "2px 10px", borderRadius: 6,
              background: sev.bg, color: sev.color, border: `1px solid ${sev.border}`,
            }}>{domain.severity}</div>
          </div>
        </div>
      </div>

      <DraggableGrid
        widgets={[
          /* ─── Risk Score Overview ─── */
          {
            id: `${domainKey}-score`,
            label: "Risk Score",
            render: () => (
              <Card title="Risk Score">
                <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 16 }}>
                  <div style={{ flex: 1 }}>
                    <Progress pct={domain.score} color={domain.color} />
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: domain.color, minWidth: 48, textAlign: "right" }}>
                    {domain.score}
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T.textDim }}>
                  <span>Review Frequency: <strong style={{ color: T.textMid }}>{domain.freq}</strong></span>
                  <span>Trend: <strong style={{ color: T.textMid }}>{domain.trend}</strong></span>
                  <span>Severity: <strong style={{ color: sev.color }}>{domain.severity}</strong></span>
                </div>
              </Card>
            ),
          },

          /* ─── Sub-Metrics ─── */
          {
            id: `${domainKey}-metrics`,
            label: "Sub-Metrics",
            render: () => (
              <Card title="Sub-Metrics">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
                  {domain.subMetrics.map((m, i) => (
                    <div key={i} style={{
                      background: T.bg0, borderRadius: 10, padding: 14,
                      borderLeft: `4px solid ${m.status === "danger" ? T.danger : m.status === "warn" ? T.warn : T.green}`,
                      border: `1px solid ${T.border}`,
                      borderLeftWidth: 4,
                      borderLeftColor: m.status === "danger" ? T.danger : m.status === "warn" ? T.warn : T.green,
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <span style={{ fontSize: 11, color: T.textDim, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em" }}>{m.label}</span>
                        <span style={{ fontSize: 16, fontWeight: 700, color: m.status === "danger" ? T.danger : m.status === "warn" ? T.warn : T.green }}>{m.value}</span>
                      </div>
                      <div style={{ fontSize: 12, color: T.textMid, lineHeight: 1.5 }}>{m.detail}</div>
                    </div>
                  ))}
                </div>
              </Card>
            ),
          },

          /* ─── Agent Insights ─── */
          {
            id: `${domainKey}-insights`,
            label: "Agent Insights",
            render: () => (
              <Card title="Agent Insights">
                {domain.agentInsights.length === 0 ? (
                  <div style={{ fontSize: 12, color: T.textDim, fontStyle: "italic" }}>No recent agent insights for this domain.</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {domain.agentInsights.map((ins, i) => (
                      <div key={i} style={{
                        background: ins.severity === "high" ? `${T.danger}08` : ins.severity === "medium" ? `${T.warn}08` : `${T.blue}08`,
                        border: `1px solid ${ins.severity === "high" ? T.danger + "22" : ins.severity === "medium" ? T.warn + "22" : T.border}`,
                        borderRadius: 10, padding: "14px 18px",
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{
                              fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em",
                              padding: "2px 8px", borderRadius: 6,
                              background: ins.severity === "high" ? `${T.danger}18` : ins.severity === "medium" ? `${T.warn}18` : `${T.blue}18`,
                              color: ins.severity === "high" ? T.danger : ins.severity === "medium" ? T.warn : T.blue,
                            }}>{ins.severity}</span>
                            <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{ins.agent}</span>
                          </div>
                          <span style={{ fontSize: 11, color: T.textDim }}>{ins.time}</span>
                        </div>
                        <div style={{ fontSize: 13, color: T.textMid, lineHeight: 1.6 }}>{ins.text}</div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ),
          },
        ]}
        storageKey={`sens-risk-domain-${domainKey}-layout`}
      />
    </div>
  );
};
