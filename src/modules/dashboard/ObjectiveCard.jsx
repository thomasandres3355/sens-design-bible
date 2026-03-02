import { useState } from "react";
import { T } from "@core/theme/theme";
import { StatusPill, Progress } from "@core/ui/indicators";

const sevColor = (s) => s === "critical" ? T.danger : s === "warning" ? T.warn : s === "green" ? T.green : T.blue;

const IntelBullet = ({ item }) => (
  <div style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: `1px solid ${T.border}` }}>
    <div style={{ width: 6, height: 6, borderRadius: "50%", background: sevColor(item.severity), marginTop: 5, flexShrink: 0, boxShadow: `0 0 6px ${sevColor(item.severity)}40` }} />
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 12, color: T.text, lineHeight: 1.5 }}>{item.text}</div>
      <div style={{ fontSize: 10, color: T.textDim, marginTop: 3 }}>
        <span style={{ color: T.accent }}>{item.agent}</span> · {item.dept}
      </div>
    </div>
  </div>
);

export const ObjectiveCard = ({ obj, index, onNavigate }) => {
  const [expanded, setExpanded] = useState(false);
  const statusColor = obj.status === "red" ? T.danger : obj.status === "yellow" ? T.warn : obj.status === "green" ? T.green : T.blue;

  return (
    <div style={{
      background: T.bg2,
      border: `1px solid ${expanded ? statusColor + "40" : T.border}`,
      borderRadius: 12,
      overflow: "hidden",
      transition: "border-color .25s",
    }}>
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: "flex", alignItems: "center", gap: 14,
          padding: "16px 20px", cursor: "pointer",
          background: expanded ? statusColor + "06" : "transparent",
          transition: "background .2s",
        }}
      >
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          background: statusColor + "20", border: `2px solid ${statusColor}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14, fontWeight: 800, color: statusColor, flexShrink: 0,
        }}>
          {index + 1}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.text, lineHeight: 1.3 }}>{obj.title}</div>
          <div style={{ fontSize: 11, color: T.textDim, marginTop: 3 }}>{obj.owner}</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <div style={{ width: 100 }}>
            <Progress pct={obj.pct} color={statusColor} target={obj.progressTarget} threshold={obj.progressThreshold} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: statusColor, minWidth: 36, textAlign: "right" }}>{obj.pct}%</span>
          <StatusPill status={obj.status === "red" ? "red" : obj.status} />
        </div>

        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={T.textDim} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0, transform: expanded ? "rotate(180deg)" : "rotate(0)", transition: "transform .2s" }}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>

      {expanded && (
        <div style={{ padding: "0 20px 20px 20px" }}>
          <p style={{ margin: "0 0 16px 0", fontSize: 12, color: T.textMid, lineHeight: 1.6 }}>{obj.summary}</p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
            {obj.metrics.map((m, i) => (
              <div key={i} style={{ background: T.bg0, borderRadius: 8, padding: "10px 12px" }}>
                <div style={{ fontSize: 10, color: T.textDim, textTransform: "uppercase", letterSpacing: .8, marginBottom: 3 }}>{m.label}</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: T.text }}>{m.value}</div>
                {m.sub && <div style={{ fontSize: 10, color: T.textMid, marginTop: 2 }}>{m.sub}</div>}
              </div>
            ))}
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: T.textDim, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600, marginBottom: 8 }}>
              Cross-Department Intelligence
            </div>
            {obj.intelligence.map((item, i) => (
              <IntelBullet key={i} item={item} />
            ))}
          </div>

          <div
            onClick={() => onNavigate?.(obj.nav)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              fontSize: 12, color: T.accent, cursor: "pointer", fontWeight: 600,
              padding: "6px 0",
            }}
          >
            Drill into details →
          </div>
        </div>
      )}
    </div>
  );
};
