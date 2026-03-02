import { useState, useMemo } from "react";
import { T } from "@core/theme/theme";
import { Card } from "@core/ui/layout";
import { KpiCard, StatusPill } from "@core/ui/indicators";
import { CheckEngineLightPanel } from "@modules/dashboard/CheckEngineLightPanel";
import { ObjectiveCard } from "@modules/dashboard/ObjectiveCard";

import { getAlertsForDept, getExecutiveAlerts } from "@modules/dashboard/alertData";
import { useSimDate } from "@core/simulation/SimDateContext";
import { getSiteMetrics, getPortfolioMetrics } from "@modules/operations/timeEngine";
import { buildObjectives } from "@modules/dashboard/objectivesData";
import { getLandingOverrides } from "@modules/admin/landingPageData";

/**
 * VpDashboardView — Dedicated dashboard / landing page for any VP or Exec.
 *
 * Props:
 *   vp:         VP data object from vpRegistry (or ceoAgentTeam / cooAgentTeam)
 *   onNavigate: function to navigate to other views
 */
export const VpDashboardView = ({ vp, onNavigate }) => {
  const { simDate } = useSimDate();
  const [hoveredLink, setHoveredLink] = useState(null);
  const [hoveredAgent, setHoveredAgent] = useState(null);

  if (!vp) return <div style={{ color: T.textDim, padding: 40 }}>VP data not found.</div>;

  // Landing page overrides
  const overrides = getLandingOverrides(vp.key);
  const showObjectives = overrides?.showCompanyObjectives !== false; // default true

  // Company objectives (from live metrics)
  const allSites = useMemo(() => getSiteMetrics(simDate), [simDate]);
  const activeSites = useMemo(() => allSites.filter(s => s.status === "operational" && s.uptime > 0), [allSites]);
  const portfolio = useMemo(() => getPortfolioMetrics(simDate), [simDate]);
  const objectives = useMemo(() => showObjectives ? buildObjectives(activeSites, portfolio) : [], [showObjectives, activeSites, portfolio]);

  // Apply overrides for focus areas, quick links, KPIs
  const focusAreas = overrides?.customFocusAreas || vp.focusAreas;
  const quickLinks = overrides?.customQuickLinks || vp.quickLinks;
  const kpis = overrides?.customKpis || vp.kpis;

  const { lead, specialists } = vp.agentTeam;
  const navigateToAgent = (agentId) => onNavigate(`agent-${agentId}`);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, position: "relative" }}>

      {/* ─── Breadcrumb + VP Header ─── */}
      <div>
        <button onClick={() => onNavigate("org")} style={{
          background: "transparent", border: "none", cursor: "pointer",
          color: T.textDim, fontSize: 12, padding: 0, marginBottom: 8,
          display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit",
        }}
          onMouseEnter={e => e.currentTarget.style.color = vp.color}
          onMouseLeave={e => e.currentTarget.style.color = T.textDim}
        >
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
          Org Chart
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: vp.color + "20", border: `2px solid ${vp.color}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={vp.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: T.text }}>{vp.title}</h2>
            <div style={{ fontSize: 12, color: vp.color, fontWeight: 600, letterSpacing: .5, marginTop: 2 }}>{vp.branch.toUpperCase()}</div>
          </div>
        </div>
      </div>

      {/* ─── KPI Row ─── */}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(kpis.length, 4)}, 1fr)`, gap: 12 }}>
        {kpis.map((kpi, i) => (
          <KpiCard key={i} label={kpi.label} value={kpi.value} sub={kpi.sub} color={vp.color} />
        ))}
      </div>

      {/* ─── Check Engine Lights — alerts relevant to this VP/Exec ─── */}
      {(() => {
        const isExec = vp.key === "ceo" || vp.key === "coo";
        const alerts = isExec ? getExecutiveAlerts(simDate) : getAlertsForDept(vp.key, simDate);
        return alerts.length > 0 ? (
          <CheckEngineLightPanel
            alerts={alerts}
            onNavigate={onNavigate}
            title={isExec ? `${vp.title} — System Alerts` : `Alerts — ${vp.title}`}
            color={vp.color}
            compact
          />
        ) : null;
      })()}

      {/* ─── Company Strategic Objectives ─── */}
      {showObjectives && objectives.length > 0 && (
        <Card title="COMPANY OBJECTIVES" titleColor={vp.color}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {objectives.map((obj, i) => (
              <ObjectiveCard key={obj.id} obj={obj} index={i} onNavigate={onNavigate} />
            ))}
          </div>
        </Card>
      )}

      {/* ─── Two-column: Focus Areas + Quick Links ─── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card title="FOCUS AREAS" titleColor={vp.color}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {focusAreas.map((area, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: vp.color + "08", border: `1px solid ${vp.color}20`, borderRadius: 8 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: vp.color }} />
                <span style={{ fontSize: 13, color: T.text, fontWeight: 500 }}>{area}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="QUICK LINKS" titleColor={vp.color}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {quickLinks.map((link, i) => (
              <button key={i} onClick={() => onNavigate(link.target)}
                onMouseEnter={() => setHoveredLink(i)} onMouseLeave={() => setHoveredLink(null)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 14px", background: hoveredLink === i ? vp.color + "12" : T.bg0,
                  border: `1px solid ${hoveredLink === i ? vp.color + "40" : T.border}`,
                  borderRadius: 8, cursor: "pointer", width: "100%", textAlign: "left",
                  transition: "all .15s", fontFamily: "inherit",
                }}>
                <span style={{ fontSize: 13, color: T.text, fontWeight: 500 }}>{link.label}</span>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={hoveredLink === i ? vp.color : T.textDim} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* ─── Agent Team Overview (clickable rows) ─── */}
      <Card title="AGENT TEAM" titleColor={vp.color}>
        {/* Lead EA — clickable */}
        <div
          onClick={() => navigateToAgent(lead.id)}
          style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "12px 16px", background: vp.color + "10",
            border: `1px solid ${vp.color}30`, borderRadius: 10, marginBottom: 14,
            cursor: "pointer", transition: "all .15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = vp.color + "18"; e.currentTarget.style.borderColor = vp.color; }}
          onMouseLeave={e => { e.currentTarget.style.background = vp.color + "10"; e.currentTarget.style.borderColor = vp.color + "30"; }}
        >
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: vp.color, boxShadow: `0 0 8px ${vp.color}` }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{lead.name}</div>
            <div style={{ fontSize: 11, color: T.textMid }}>{lead.role} — Lead</div>
          </div>
          <div style={{ fontSize: 10, color: vp.color, background: vp.color + "18", padding: "3px 10px", borderRadius: 12, fontWeight: 600, marginRight: 8 }}>Lead EA</div>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={vp.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
            <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
          </svg>
        </div>

        {/* Specialist agents — clickable rows */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {specialists.map((s, i) => {
            const isHovered = hoveredAgent === i;
            const statusColor = s.status === "green" ? T.green : s.status === "blue" ? T.blue : s.status === "construction" ? T.accent : T.textDim;
            return (
              <div
                key={i}
                onClick={() => navigateToAgent(s.id)}
                onMouseEnter={() => setHoveredAgent(i)}
                onMouseLeave={() => setHoveredAgent(null)}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 14px", borderRadius: 8,
                  background: isHovered ? vp.color + "08" : "transparent",
                  border: `1px solid ${isHovered ? vp.color + "25" : T.border}`,
                  cursor: "pointer", transition: "all .12s",
                }}
              >
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: statusColor, boxShadow: `0 0 4px ${statusColor}`, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: T.textMid }}>{s.role}</div>
                </div>
                <StatusPill status={s.status} />
                {s.accuracy && <span style={{ fontSize: 11, color: T.textDim, background: T.bg0, padding: "2px 8px", borderRadius: 4 }}>{s.accuracy}</span>}
                {s.tasksPerDay && <span style={{ fontSize: 11, color: T.textDim, minWidth: 60, textAlign: "right" }}>{s.tasksPerDay.toLocaleString()}/day</span>}
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={isHovered ? vp.color : T.textDim} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: isHovered ? 1 : 0.4, flexShrink: 0 }}>
                  <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
                </svg>
              </div>
            );
          })}
        </div>
      </Card>

    </div>
  );
};
