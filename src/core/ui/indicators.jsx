import { T } from "@core/theme/theme";

export const Spark = ({ data, color = T.accent, w = 80, h = 28, target }) => {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, target || 0), min = Math.min(...data, 0), range = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 6) - 3}`).join(" ");
  const tY = target != null ? h - ((target - min) / range) * (h - 6) - 3 : null;
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      {tY != null && <line x1={0} x2={w} y1={tY} y2={tY} stroke={T.textDim} strokeWidth="1" strokeDasharray="2,2" opacity={0.6} />}
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
};

export const StatusPill = ({ status }) => {
  const m = {
    green: { bg: T.greenDim, color: T.green, label: "On Track" },
    yellow: { bg: T.warnDim, color: T.warn, label: "Watch" },
    red: { bg: T.dangerDim, color: T.danger, label: "Alert" },
    blue: { bg: T.blueDim, color: T.blue, label: "Active" },
    purple: { bg: T.purpleDim, color: T.purple, label: "Planned" },
    construction: { bg: T.accentDim, color: T.accent, label: "Construction" },
  };
  const s = m[status] || m.green;
  return <span style={{ background: s.bg, color: s.color, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, letterSpacing: .3, whiteSpace: "nowrap" }}>{s.label}</span>;
};

export const EngineLight = ({ on, color = T.green, label }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 8, background: on ? (color + "18") : T.bg2, border: `1px solid ${on ? color : T.border}`, transition: "all .25s" }}>
    <div style={{ width: 10, height: 10, borderRadius: "50%", background: on ? color : T.textDim, boxShadow: on ? `0 0 8px ${color}` : "none", transition: "all .25s" }} />
    <span style={{ fontSize: 12, color: on ? T.text : T.textDim, fontWeight: 500 }}>{label}</span>
  </div>
);

/* ─── Trend Arrow ─── */
const TrendArrow = ({ value, invert, size = 12 }) => {
  if (value == null || value === 0) return <span style={{ fontSize: size, color: T.textDim, fontWeight: 600 }}>→ 0%</span>;
  const isPositive = invert ? value < 0 : value > 0;
  const arrow = value > 0 ? "▲" : "▼";
  const clr = isPositive ? T.green : T.danger;
  return <span style={{ fontSize: size, color: clr, fontWeight: 600 }}>{arrow} {Math.abs(value).toFixed(1)}%</span>;
};

/* ─── Variance Badge ─── */
const VarianceBadge = ({ actual, target, unit = "", invert = false, format }) => {
  if (actual == null || target == null || target === 0) return null;
  const diff = actual - target;
  const pct = ((diff / Math.abs(target)) * 100);
  const isGood = invert ? diff <= 0 : diff >= 0;
  const clr = isGood ? T.green : Math.abs(pct) > 20 ? T.danger : T.warn;
  const display = format ? format(diff) : `${diff >= 0 ? "+" : ""}${typeof actual === "number" && actual % 1 !== 0 ? diff.toFixed(1) : Math.round(diff)}${unit}`;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
      <span style={{ color: clr, fontWeight: 700 }}>{display}</span>
      <span style={{ color: clr, fontSize: 10 }}>({pct >= 0 ? "+" : ""}{pct.toFixed(0)}%)</span>
    </div>
  );
};

/* ─── Enhanced KPI Card with target, threshold, and variance ─── */
export const KpiCard = ({ label, value, sub, spark, trend, color = T.accent, target, threshold, unit, sparkTarget, invert }) => {
  // Determine status color based on target/threshold
  let statusIndicator = null;
  if (target != null && value != null) {
    const numVal = typeof value === "string" ? parseFloat(value.replace(/[^0-9.\-]/g, "")) : value;
    const numTarget = typeof target === "string" ? parseFloat(target.replace(/[^0-9.\-]/g, "")) : target;
    if (!isNaN(numVal) && !isNaN(numTarget)) {
      const diff = numVal - numTarget;
      const pct = numTarget !== 0 ? (diff / Math.abs(numTarget)) * 100 : 0;
      const isGood = invert ? diff <= 0 : diff >= 0;
      const isFail = threshold != null && (invert ? numVal > threshold : numVal < threshold);
      const dotColor = isFail ? T.danger : isGood ? T.green : Math.abs(pct) > 15 ? T.danger : T.warn;
      statusIndicator = (
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: dotColor, boxShadow: `0 0 6px ${dotColor}40`, flexShrink: 0 }} />
          <span style={{ fontSize: 10, color: T.textDim }}>
            Target: <span style={{ color: T.textMid, fontWeight: 600 }}>{typeof target === "number" ? (target % 1 !== 0 ? target.toFixed(1) : target.toLocaleString()) : target}{unit || ""}</span>
          </span>
          {threshold != null && (
            <span style={{ fontSize: 10, color: T.danger, marginLeft: 4 }}>
              Fail: {typeof threshold === "number" ? (threshold % 1 !== 0 ? threshold.toFixed(1) : threshold.toLocaleString()) : threshold}{unit || ""}
            </span>
          )}
        </div>
      );
    }
  }

  return (
    <div style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 10, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 6, minWidth: 155, flex: 1 }}>
      <div style={{ fontSize: 11, color: T.textDim, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
        <span style={{ fontSize: 26, fontWeight: 700, color: T.text, lineHeight: 1 }}>{value}</span>
        {trend != null && <TrendArrow value={trend} invert={invert} />}
      </div>
      {sub && <div style={{ fontSize: 12, color: T.textMid }}>{sub}</div>}
      {statusIndicator}
      {spark && <Spark data={spark} color={color} target={sparkTarget} />}
    </div>
  );
};

export { TrendArrow, VarianceBadge };

export const MetricGrid = ({ metrics = [] }) => (
  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12 }}>
    {metrics.map((m, i) => (
      <div key={i} style={{ background: T.bg1, border: `1px solid ${T.border}`, borderRadius: 8, padding: "12px 14px" }}>
        <div style={{ fontSize: 11, color: T.textDim, textTransform: "uppercase", letterSpacing: .8, fontWeight: 600, marginBottom: 4 }}>{m.label}</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: T.text }}>{m.value}</div>
        {m.sub && <div style={{ fontSize: 11, color: T.textMid, marginTop: 2 }}>{m.sub}</div>}
        {m.target != null && (
          <div style={{ fontSize: 10, color: T.textDim, marginTop: 4 }}>
            Target: <span style={{ fontWeight: 600, color: T.textMid }}>{m.target}{m.unit || ""}</span>
          </div>
        )}
      </div>
    ))}
  </div>
);

export const Progress = ({ pct, color = T.accent, h = 6, showLabel, target, threshold }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
    <div style={{ background: T.bg0, borderRadius: h, height: h, flex: 1, overflow: "hidden", position: "relative" }}>
      <div style={{ width: `${Math.min(pct, 100)}%`, height: "100%", background: color, borderRadius: h, transition: "width .6s ease" }} />
      {target != null && (
        <div style={{ position: "absolute", left: `${Math.min(target, 100)}%`, top: -2, bottom: -2, width: 2, background: T.text, borderRadius: 1, opacity: 0.7 }} title={`Target: ${target}%`} />
      )}
      {threshold != null && (
        <div style={{ position: "absolute", left: `${Math.min(threshold, 100)}%`, top: -2, bottom: -2, width: 2, background: T.danger, borderRadius: 1, opacity: 0.8 }} title={`Fail threshold: ${threshold}%`} />
      )}
    </div>
    {showLabel && <span style={{ fontSize: 11, color: T.textMid, minWidth: 32, textAlign: "right" }}>{pct}%</span>}
  </div>
);
