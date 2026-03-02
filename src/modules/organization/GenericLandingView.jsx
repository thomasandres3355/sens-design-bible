import { useState, useMemo } from "react";
import { T } from "@core/theme/theme";
import { Card } from "@core/ui/layout";
import { CheckEngineLightPanel } from "@modules/dashboard/CheckEngineLightPanel";
import { ObjectiveCard } from "@modules/dashboard/ObjectiveCard";

import { getDashboardAlerts } from "@modules/dashboard/alertData";
import { useSimDate } from "@core/simulation/SimDateContext";
import { getSiteMetrics, getPortfolioMetrics } from "@modules/operations/timeEngine";
import { buildObjectives } from "@modules/dashboard/objectivesData";
import { getGenericLandingConfig } from "@modules/admin/landingPageData";
import { useBadge } from "@core/users/BadgeContext";
import { WorldNews } from "@core/ui/WorldNews";

/**
 * GenericLandingView — Landing page for Manager / Operator / Viewer roles.
 * Simpler layout: objectives, alerts (filtered by department), focus areas, quick links.
 * No agent team section (non-VP roles).
 */
export const GenericLandingView = ({ pageKey, onNavigate }) => {
  const { simDate } = useSimDate();
  const { activeUser } = useBadge();
  const [hoveredLink, setHoveredLink] = useState(null);

  const config = getGenericLandingConfig(pageKey);
  if (!config) return <div style={{ color: T.textDim, padding: 40 }}>Landing page not configured.</div>;

  const { title, color, branch, showCompanyObjectives, focusAreas, quickLinks, showWorldNews, newsPosition, newsDeptKey } = config;

  // Company objectives
  const allSites = useMemo(() => getSiteMetrics(simDate), [simDate]);
  const activeSites = useMemo(() => allSites.filter(s => s.status === "operational" && s.uptime > 0), [allSites]);
  const portfolio = useMemo(() => getPortfolioMetrics(simDate), [simDate]);
  const objectives = useMemo(() => showCompanyObjectives ? buildObjectives(activeSites, portfolio) : [], [showCompanyObjectives, activeSites, portfolio]);

  // Alerts filtered by user's department
  const alerts = getDashboardAlerts(activeUser.role, simDate);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, position: "relative" }}>

      {/* ─── Header ─── */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: color + "20", border: `2px solid ${color}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: T.text }}>{title}</h2>
            <div style={{ fontSize: 12, color, fontWeight: 600, letterSpacing: .5, marginTop: 2 }}>{branch.toUpperCase()}</div>
          </div>
        </div>
      </div>

      {/* ─── System Alerts ─── */}
      {alerts.length > 0 && (
        <CheckEngineLightPanel
          alerts={alerts}
          onNavigate={onNavigate}
          title="System Alerts"
          color={color}
          compact
        />
      )}

      {/* ─── World News (top position) ─── */}
      {showWorldNews && newsPosition === "top" && (
        <WorldNews deptKey={newsDeptKey || "company"} simDate={simDate} compact />
      )}

      {/* ─── Company Strategic Objectives ─── */}
      {showCompanyObjectives && objectives.length > 0 && (
        <Card title="COMPANY OBJECTIVES" titleColor={color}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {objectives.map((obj, i) => (
              <ObjectiveCard key={obj.id} obj={obj} index={i} onNavigate={onNavigate} />
            ))}
          </div>
        </Card>
      )}

      {/* ─── Two-column: Focus Areas + Quick Links ─── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card title="FOCUS AREAS" titleColor={color}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {focusAreas.map((area, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: color + "08", border: `1px solid ${color}20`, borderRadius: 8 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />
                <span style={{ fontSize: 13, color: T.text, fontWeight: 500 }}>{area}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="QUICK LINKS" titleColor={color}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {quickLinks.map((link, i) => (
              <button key={i} onClick={() => onNavigate(link.target)}
                onMouseEnter={() => setHoveredLink(i)} onMouseLeave={() => setHoveredLink(null)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 14px", background: hoveredLink === i ? color + "12" : T.bg0,
                  border: `1px solid ${hoveredLink === i ? color + "40" : T.border}`,
                  borderRadius: 8, cursor: "pointer", width: "100%", textAlign: "left",
                  transition: "all .15s", fontFamily: "inherit",
                }}>
                <span style={{ fontSize: 13, color: T.text, fontWeight: 500 }}>{link.label}</span>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={hoveredLink === i ? color : T.textDim} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* ─── World News (bottom position, default) ─── */}
      {showWorldNews && newsPosition !== "top" && (
        <WorldNews deptKey={newsDeptKey || "company"} simDate={simDate} compact />
      )}

    </div>
  );
};
