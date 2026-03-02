import { useState } from "react";
import { T } from "@core/theme/theme";
import { Card, DataTable } from "@core/ui/layout";
import { StatusPill } from "@core/ui/indicators";


/**
 * AgentDetailView — Deep drilldown into any individual agent.
 * Shows: skills, data sources, connectors, task history, and a chat interface.
 *
 * Props:
 *   agent:       the agent object (with skills, dataSources, connectors, taskHistory)
 *   parentKey:   VP key or "ceo" to navigate back
 *   parentTitle: e.g. "VP Finance" or "CEO"
 *   color:       branch color
 *   agentTeam:   the full team this agent belongs to (for chat)
 *   onNavigate:  navigation function
 */
export const AgentDetailView = ({ agent, parentKey, parentTitle, color, agentTeam, onNavigate }) => {
  const [hoveredConnector, setHoveredConnector] = useState(null);

  if (!agent) return <div style={{ color: T.textDim, padding: 40 }}>Agent not found.</div>;

  const connectorStatusColor = (s) => s === "connected" ? T.green : s === "pending" ? T.warn : T.textDim;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, position: "relative" }}>
      {/* ─── Breadcrumb ─── */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
          <button onClick={() => onNavigate("org")} style={{ background: "transparent", border: "none", cursor: "pointer", color: T.textDim, fontSize: 12, padding: 0, fontFamily: "inherit" }}
            onMouseEnter={e => e.currentTarget.style.color = T.accent} onMouseLeave={e => e.currentTarget.style.color = T.textDim}>Org Chart</button>
          <span style={{ color: T.textDim, fontSize: 12 }}>/</span>
          <button onClick={() => onNavigate(parentKey)} style={{ background: "transparent", border: "none", cursor: "pointer", color: T.textDim, fontSize: 12, padding: 0, fontFamily: "inherit" }}
            onMouseEnter={e => e.currentTarget.style.color = color} onMouseLeave={e => e.currentTarget.style.color = T.textDim}>{parentTitle}</button>
          <span style={{ color: T.textDim, fontSize: 12 }}>/</span>
          <span style={{ fontSize: 12, color: color, fontWeight: 600 }}>{agent.name}</span>
        </div>

        {/* Agent header */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: color + "20", border: `2px solid ${color}`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
              <circle cx="12" cy="16" r="1" />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: T.text }}>{agent.name}</h2>
            <div style={{ fontSize: 13, color: T.textMid, marginTop: 2 }}>{agent.role}</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {agent.accuracy && <div style={{ background: color + "18", border: `1px solid ${color}30`, borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 600, color }}>{agent.accuracy} accuracy</div>}
            {agent.tasksPerDay && <div style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 8, padding: "6px 14px", fontSize: 12, color: T.textMid }}>{agent.tasksPerDay.toLocaleString()} tasks/day</div>}
            {agent.status && <StatusPill status={agent.status} />}
          </div>
        </div>
      </div>

      {/* Description */}
      <div style={{ fontSize: 14, color: T.textMid, lineHeight: 1.6, maxWidth: 700 }}>{agent.description}</div>

      {/* ─── Two column: Skills + Data Sources ─── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card title="SKILLS & CAPABILITIES" titleColor={color}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {(agent.skills || []).map((skill, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: color + "08", border: `1px solid ${color}15`, borderRadius: 8 }}>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span style={{ fontSize: 13, color: T.text }}>{skill}</span>
              </div>
            ))}
            {(!agent.skills || agent.skills.length === 0) && <div style={{ fontSize: 12, color: T.textDim, padding: 8 }}>No skills defined yet</div>}
          </div>
        </Card>

        <Card title="DATA SOURCES" titleColor={color}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {(agent.dataSources || []).map((ds, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: T.bg0, border: `1px solid ${T.border}`, borderRadius: 8 }}>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={T.textMid} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                </svg>
                <span style={{ fontSize: 13, color: T.text }}>{ds}</span>
              </div>
            ))}
            {(!agent.dataSources || agent.dataSources.length === 0) && <div style={{ fontSize: 12, color: T.textDim, padding: 8 }}>No data sources defined yet</div>}
          </div>
        </Card>
      </div>

      {/* ─── Connectors ─── */}
      <Card title="THIRD-PARTY CONNECTORS" titleColor={color}>
        {(agent.connectors || []).length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
            {agent.connectors.map((conn, i) => (
              <div
                key={i}
                onMouseEnter={() => setHoveredConnector(i)}
                onMouseLeave={() => setHoveredConnector(null)}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "14px 16px", background: hoveredConnector === i ? color + "08" : T.bg0,
                  border: `1px solid ${hoveredConnector === i ? color + "40" : T.border}`,
                  borderRadius: 10, transition: "all .15s",
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 8, background: T.bg3,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: `1px solid ${T.border}`,
                }}>
                  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={connectorStatusColor(conn.status)} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{conn.name}</div>
                  <div style={{ fontSize: 11, color: connectorStatusColor(conn.status), fontWeight: 500, textTransform: "capitalize" }}>{conn.status}</div>
                </div>
                <div style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: connectorStatusColor(conn.status),
                  boxShadow: `0 0 6px ${connectorStatusColor(conn.status)}`,
                }} />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 12, color: T.textDim, padding: 8 }}>No connectors configured</div>
        )}
      </Card>

      {/* ─── Task History ─── */}
      <Card title="RECENT TASK HISTORY" titleColor={color}>
        {(agent.taskHistory || []).length > 0 ? (
          <DataTable
            compact
            columns={["Date", "Action", "Result", "Status"]}
            rows={(agent.taskHistory || []).map(t => [
              t.date,
              t.action,
              t.result,
              <StatusPill status={t.status} />,
            ])}
          />
        ) : (
          <div style={{ fontSize: 12, color: T.textDim, padding: 8 }}>No task history available</div>
        )}
      </Card>

    </div>
  );
};
