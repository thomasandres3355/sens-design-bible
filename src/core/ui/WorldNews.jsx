/**
 * WorldNews — Reusable world news display widget for department home pages.
 * Renders AI-generated news items as styled cards with impact indicators.
 */

import { useState, useEffect, useCallback } from "react";
import { T } from "@core/theme/theme";
import { Card } from "./layout";
import { getCachedNews, generateNews, isCacheFresh } from "@modules/ai-agents/services/newsService";
import { isNewsEnabled, getDepartmentConfig, getDepartmentKeys } from "@core/data/newsConfigStore";
import { isLiveMode } from "@modules/ai-agents/services/claudeService";

// ─── Impact Badge ────────────────────────────────────────────────────
const IMPACT_COLORS = {
  high: { bg: T.dangerDim, color: T.danger, label: "High Impact" },
  medium: { bg: T.warnDim, color: T.warn, label: "Medium" },
  low: { bg: T.greenDim, color: T.green, label: "Low" },
};

const ImpactBadge = ({ impact }) => {
  const style = IMPACT_COLORS[impact] || IMPACT_COLORS.medium;
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 4,
      background: style.bg, color: style.color, textTransform: "uppercase", letterSpacing: 0.5,
    }}>
      {style.label}
    </span>
  );
};

// ─── Category Tag ────────────────────────────────────────────────────
const CATEGORY_COLORS = {
  Policy: T.blue, Technology: T.teal, Market: T.accent, Safety: T.danger,
  Regulation: T.purple || T.blue, Industry: T.textMid, Finance: T.green,
  Workforce: T.warn, Environment: T.teal,
};

const CategoryTag = ({ category }) => {
  const color = CATEGORY_COLORS[category] || T.textMid;
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 3,
      background: color + "18", color, textTransform: "uppercase", letterSpacing: 0.8,
    }}>
      {category}
    </span>
  );
};

// ─── News Item Card ──────────────────────────────────────────────────
const NewsItemCard = ({ item, index }) => (
  <div style={{
    background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 8,
    padding: 16, display: "flex", flexDirection: "column", gap: 10,
    transition: "border-color 0.2s",
  }}
    onMouseEnter={e => e.currentTarget.style.borderColor = T.accent + "44"}
    onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
  >
    {/* Header row: category + impact */}
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <CategoryTag category={item.category} />
      <ImpactBadge impact={item.impact} />
    </div>

    {/* Headline */}
    <div style={{ fontSize: 14, fontWeight: 700, color: T.text, lineHeight: 1.4 }}>
      {item.headline}
    </div>

    {/* Summary */}
    <div style={{ fontSize: 12, color: T.textMid, lineHeight: 1.5 }}>
      {item.summary}
    </div>

    {/* Relevance */}
    <div style={{
      fontSize: 11, color: T.accent, lineHeight: 1.4, padding: "8px 10px",
      background: T.accentDim || (T.accent + "10"), borderRadius: 6,
      borderLeft: `3px solid ${T.accent}`,
    }}>
      <span style={{ fontWeight: 600 }}>Why it matters: </span>
      {item.relevance}
    </div>
  </div>
);

// ─── Loading Skeleton ────────────────────────────────────────────────
const SkeletonCard = () => (
  <div style={{
    background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 8,
    padding: 16, display: "flex", flexDirection: "column", gap: 12,
  }}>
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <div style={{ width: 60, height: 16, background: T.border, borderRadius: 4, animation: "pulse 1.5s infinite" }} />
      <div style={{ width: 80, height: 16, background: T.border, borderRadius: 4, animation: "pulse 1.5s infinite" }} />
    </div>
    <div style={{ width: "80%", height: 18, background: T.border, borderRadius: 4, animation: "pulse 1.5s infinite" }} />
    <div style={{ width: "100%", height: 36, background: T.border, borderRadius: 4, animation: "pulse 1.5s infinite" }} />
    <div style={{ width: "100%", height: 40, background: T.border, borderRadius: 4, animation: "pulse 1.5s infinite" }} />
  </div>
);

// ─── Refresh Icon ────────────────────────────────────────────────────
const RefreshIcon = ({ spinning }) => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={{ animation: spinning ? "spin 1s linear infinite" : "none" }}>
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
  </svg>
);

// ─── Main WorldNews Component ────────────────────────────────────────
export const WorldNews = ({ deptKey: initialDeptKey, simDate, showDeptSelector = false, compact = false }) => {
  const [deptKey, setDeptKey] = useState(initialDeptKey || "company");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastGenerated, setLastGenerated] = useState(null);

  const enabled = isNewsEnabled();
  const live = isLiveMode();
  const deptConfig = getDepartmentConfig(deptKey);

  // Load cached news on mount / dept change
  useEffect(() => {
    const cached = getCachedNews(deptKey);
    if (cached) {
      setItems(cached.items || []);
      setLastGenerated(cached.generatedAt);
      setError(null);
    } else {
      setItems([]);
      setLastGenerated(null);
    }
  }, [deptKey]);

  const handleRefresh = useCallback(async () => {
    if (!enabled || !live) return;
    setLoading(true);
    setError(null);
    try {
      const result = await generateNews(deptKey, simDate);
      setItems(result);
      setLastGenerated(Date.now());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [deptKey, simDate, enabled, live]);

  // Auto-load if cache is stale and module is enabled
  useEffect(() => {
    if (enabled && live && !loading && !isCacheFresh(deptKey) && items.length === 0) {
      handleRefresh();
    }
  }, [deptKey, enabled, live]); // eslint-disable-line react-hooks/exhaustive-deps

  const deptKeys = getDepartmentKeys();

  // ─── Disabled State ──────────────────────────────────────────────
  if (!enabled) {
    return (
      <Card title="World News" style={compact ? { padding: 14 } : undefined}>
        <div style={{ textAlign: "center", padding: "32px 16px" }}>
          <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.4 }}>&#127758;</div>
          <div style={{ fontSize: 13, color: T.textMid, fontWeight: 600, marginBottom: 6 }}>
            World News Module Disabled
          </div>
          <div style={{ fontSize: 11, color: T.textDim }}>
            Enable it in Platform &gt; AI &amp; Agents &gt; World News
          </div>
        </div>
      </Card>
    );
  }

  // ─── Active State ────────────────────────────────────────────────
  return (
    <Card
      title="World News"
      style={compact ? { padding: 14 } : undefined}
      action={
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {lastGenerated && (
            <span style={{ fontSize: 10, color: T.textDim }}>
              {new Date(lastGenerated).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={loading || !live}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "4px 10px", borderRadius: 6,
              background: loading ? T.bg3 : T.accentDim || (T.accent + "18"),
              border: `1px solid ${loading ? T.border : T.accent + "44"}`,
              color: loading ? T.textDim : T.accent,
              cursor: loading || !live ? "not-allowed" : "pointer",
              fontSize: 11, fontWeight: 600, fontFamily: "inherit",
            }}
          >
            <RefreshIcon spinning={loading} />
            {loading ? "Generating…" : "Refresh"}
          </button>
        </div>
      }
    >
      {/* Inline CSS for animations */}
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      {/* Department selector (admin preview mode) */}
      {showDeptSelector && (
        <div style={{ marginBottom: 14 }}>
          <select
            value={deptKey}
            onChange={e => setDeptKey(e.target.value)}
            style={{
              width: "100%", padding: "8px 12px", borderRadius: 6,
              background: T.bg3, border: `1px solid ${T.border}`,
              color: T.text, fontSize: 12, fontFamily: "inherit",
              cursor: "pointer", outline: "none",
            }}
          >
            {deptKeys.map(key => {
              const cfg = getDepartmentConfig(key);
              return (
                <option key={key} value={key} style={{ background: T.bg2, color: T.text }}>
                  {cfg?.label || key}{!cfg?.enabled ? " (disabled)" : ""}
                </option>
              );
            })}
          </select>
        </div>
      )}

      {/* Not live warning */}
      {!live && (
        <div style={{
          padding: "10px 14px", borderRadius: 6, marginBottom: 12,
          background: T.warnDim, border: `1px solid ${T.warn}40`,
          fontSize: 11, color: T.warn,
        }}>
          Live mode is off. Enable it in AI Settings to generate news.
        </div>
      )}

      {/* Error state */}
      {error && (
        <div style={{
          padding: "10px 14px", borderRadius: 6, marginBottom: 12,
          background: T.dangerDim, border: `1px solid ${T.danger}40`,
          fontSize: 11, color: T.danger,
        }}>
          {error}
        </div>
      )}

      {/* Loading skeletons */}
      {loading && items.length === 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {/* News items */}
      {items.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {items.map((item, i) => (
            <NewsItemCard key={i} item={item} index={i} />
          ))}
        </div>
      )}

      {/* Empty state (no cache, not loading) */}
      {!loading && items.length === 0 && !error && live && (
        <div style={{ textAlign: "center", padding: "24px 16px" }}>
          <div style={{ fontSize: 24, marginBottom: 8, opacity: 0.4 }}>&#128240;</div>
          <div style={{ fontSize: 12, color: T.textDim }}>
            No news generated yet. Click Refresh to generate.
          </div>
        </div>
      )}
    </Card>
  );
};

export default WorldNews;
