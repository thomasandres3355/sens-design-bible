import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { T } from "../data/theme";
import {
  OBJECTIVE_TAGS, getObjectiveTag, executiveTasks,
  getExecFocusMetrics, getPortfolioFocusMetrics,
} from "../data/focusData";
import {
  Card, SectionHeader, StatusPill, DataTable, TabBar, Progress, KpiCard, DraggableGrid, DraggableCardRow,
} from "../components/ui";
import { JournalView } from "./JournalView";
import {
  weeklyPlans, dailyPosts, getPulseMetrics, getExecInfo, PULSE_EXECS,
} from "../data/pulseData";
import { allActionItems, participants, pastMeetings, tagRegistry } from "../data/meetingData";
import { useSimDate } from "../contexts/SimDateContext";

// ═══════════════════════════════════════════════════════════════════
//  EXECUTIVE FOCUS TRACKER
//  Are the executives working on the 3 company objectives?
// ═══════════════════════════════════════════════════════════════════

// ─── SVG Donut Ring ──────────────────────────────────────────────
const DonutRing = ({ pct, color, size = 80, stroke = 8 }) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={T.bg0} strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: "stroke-dashoffset .6s ease" }} />
    </svg>
  );
};

// ─── Focus Score Color ───────────────────────────────────────────
const focusColor = (pct) => pct >= 70 ? T.green : pct >= 50 ? T.warn : T.danger;

// ─── Objective Tag Pill ──────────────────────────────────────────
const ObjTagPill = ({ tagId }) => {
  const tag = getObjectiveTag(tagId);
  if (!tag) return <span style={{ fontSize: 10, color: T.textDim, fontStyle: "italic" }}>Untagged</span>;
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, letterSpacing: .3,
      color: tag.color, background: tag.color + "18",
      padding: "2px 8px", borderRadius: 10,
    }}>
      {tag.short}
    </span>
  );
};

// ─── SVG Icon helper ─────────────────────────────────────────────
const FIcon = ({ d, size = 14, color = T.textDim, sw = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
);

// ─── Objective Tag Picker — styled dropdown with global tags ─────
const ObjectiveTagPicker = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [newTagName, setNewTagName] = useState("");
  const [customTags, setCustomTags] = useState([]);
  const pickerRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (pickerRef.current && !pickerRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Build categories from global tagRegistry
  const categories = useMemo(() => {
    const cats = {};
    tagRegistry.forEach(t => { if (!cats[t.category]) cats[t.category] = []; cats[t.category].push(t); });
    if (customTags.length > 0) cats["Custom"] = customTags;
    return cats;
  }, [customTags]);

  const filteredCategories = useMemo(() => {
    if (!search) return categories;
    const q = search.toLowerCase();
    const result = {};
    Object.entries(categories).forEach(([cat, tags]) => {
      const matches = tags.filter(t => t.name.includes(q) || (t.description || "").toLowerCase().includes(q) || cat.toLowerCase().includes(q));
      if (matches.length > 0) result[cat] = matches;
    });
    return result;
  }, [categories, search]);

  // Filter priorities by search too
  const filteredPriorities = useMemo(() => {
    if (!search) return OBJECTIVE_TAGS;
    const q = search.toLowerCase();
    return OBJECTIVE_TAGS.filter(o => o.label.toLowerCase().includes(q) || o.short.toLowerCase().includes(q));
  }, [search]);

  const selectObjective = (id) => {
    onChange(id);
    setOpen(false);
    setSearch("");
  };

  const selectGlobalTag = (tagName) => {
    onChange(tagName);
    setOpen(false);
    setSearch("");
  };

  const addCustomTag = () => {
    const name = newTagName.trim().toLowerCase().replace(/\s+/g, "-");
    if (!name) return;
    const newTag = { id: `custom-${name}`, name, color: T.teal, category: "Custom", description: "Custom tag" };
    setCustomTags(prev => [...prev, newTag]);
    onChange(name);
    setNewTagName("");
    setOpen(false);
    setSearch("");
  };

  // Resolve display for current value
  const currentObj = OBJECTIVE_TAGS.find(o => o.id === value);
  const currentGlobal = !currentObj ? tagRegistry.find(t => t.name === value) : null;
  const currentCustom = !currentObj && !currentGlobal ? customTags.find(t => t.name === value) : null;
  const displayColor = currentObj?.color || currentGlobal?.color || currentCustom?.color || null;
  const displayLabel = currentObj?.short || currentGlobal?.name || currentCustom?.name || null;

  return (
    <div ref={pickerRef} style={{ position: "relative", minWidth: 160 }}>
      {/* Trigger button */}
      <div onClick={() => setOpen(!open)} style={{
        display: "flex", alignItems: "center", gap: 6, padding: "7px 10px", minHeight: 34,
        background: T.bg0, border: `1px solid ${open ? T.teal : T.border}`, borderRadius: 8,
        cursor: "pointer", transition: "border-color .15s",
      }}>
        {displayLabel ? (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600,
            color: displayColor, letterSpacing: 0.3,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: displayColor, flexShrink: 0, boxShadow: `0 0 5px ${displayColor}30` }} />
            {displayLabel}
          </span>
        ) : (
          <span style={{ fontSize: 11, color: T.textDim }}>Tag objective...</span>
        )}
        <span style={{ marginLeft: "auto", display: "flex", alignItems: "center" }}>
          <FIcon d={open ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"} size={12} color={T.textDim} />
        </span>
      </div>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, width: 280, zIndex: 50,
          background: T.bg1, border: `1px solid ${T.border}`, borderRadius: 10,
          boxShadow: "0 8px 24px rgba(0,0,0,0.45)", maxHeight: 360, overflowY: "auto", padding: 8,
        }}>
          {/* Search */}
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tags..."
            autoFocus style={{
              width: "100%", background: T.bg0, border: `1px solid ${T.border}`, borderRadius: 6,
              padding: "6px 10px", color: T.text, fontSize: 11, outline: "none", fontFamily: "inherit",
              marginBottom: 8, boxSizing: "border-box",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = T.teal)}
            onBlur={(e) => (e.currentTarget.style.borderColor = T.border)}
          />

          {/* Clear / No objective option */}
          <button onClick={() => selectObjective("")} style={{
            display: "flex", alignItems: "center", gap: 6, width: "100%", padding: "5px 8px",
            background: !value ? T.bg2 : "transparent", border: "none", borderRadius: 6,
            color: !value ? T.text : T.textDim, fontSize: 11, cursor: "pointer", marginBottom: 6,
            fontFamily: "inherit",
          }}
            onMouseEnter={(e) => { if (value) e.currentTarget.style.background = T.bg2; }}
            onMouseLeave={(e) => { if (value) e.currentTarget.style.background = "transparent"; }}
          >
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: T.textDim + "40", flexShrink: 0 }} />
            No objective
            {!value && <span style={{ marginLeft: "auto", fontSize: 10, opacity: 0.7 }}>✓</span>}
          </button>

          {/* ── Key Priorities (highlighted section) ── */}
          {filteredPriorities.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{
                fontSize: 9, color: T.teal, textTransform: "uppercase", letterSpacing: 1.2,
                fontWeight: 700, padding: "4px 6px", display: "flex", alignItems: "center", gap: 5,
              }}>
                <FIcon d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" size={10} color={T.teal} />
                Key Priorities
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2, padding: "0 2px" }}>
                {filteredPriorities.map(obj => {
                  const active = value === obj.id;
                  return (
                    <button key={obj.id} onClick={() => selectObjective(obj.id)} style={{
                      display: "flex", alignItems: "center", gap: 8, padding: "6px 8px",
                      borderRadius: 6, border: active ? `1px solid ${obj.color}50` : "1px solid transparent",
                      background: active ? obj.color + "18" : "transparent",
                      color: active ? obj.color : T.textMid, cursor: "pointer",
                      fontSize: 11, fontWeight: active ? 700 : 500, fontFamily: "inherit",
                      transition: "all .12s", width: "100%",
                    }}
                      onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = obj.color + "10"; e.currentTarget.style.color = obj.color; } }}
                      onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = T.textMid; } }}
                    >
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: obj.color, flexShrink: 0, boxShadow: `0 0 6px ${obj.color}40` }} />
                      {obj.label}
                      {active && <span style={{ marginLeft: "auto", fontSize: 10 }}>✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Divider ── */}
          <div style={{ height: 1, background: T.border, margin: "4px 0 8px" }} />

          {/* ── Global Tag Categories ── */}
          {Object.entries(filteredCategories).map(([cat, tags]) => (
            <div key={cat} style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 9, color: T.textDim, textTransform: "uppercase", letterSpacing: 1, fontWeight: 700, padding: "4px 6px" }}>{cat}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 3, padding: "0 4px" }}>
                {tags.map(tag => {
                  const active = value === tag.name;
                  return (
                    <button key={tag.id} onClick={() => selectGlobalTag(tag.name)} title={tag.description} style={{
                      display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10,
                      padding: "3px 8px", borderRadius: 4,
                      border: `1px solid ${active ? tag.color : "transparent"}`,
                      background: active ? tag.color + "20" : T.bg2,
                      color: active ? tag.color : T.textMid,
                      fontWeight: active ? 700 : 500, cursor: "pointer", transition: "all .1s",
                      fontFamily: "inherit",
                    }}
                      onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = tag.color + "10"; e.currentTarget.style.color = tag.color; } }}
                      onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = T.bg2; e.currentTarget.style.color = T.textMid; } }}
                    >
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: tag.color, flexShrink: 0 }} />
                      {tag.name}
                      {active && <span style={{ fontSize: 10 }}>✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* ── Create custom tag ── */}
          <div style={{ borderTop: `1px solid ${T.border}`, marginTop: 4, paddingTop: 6, display: "flex", gap: 6, alignItems: "center" }}>
            <FIcon d="M12 5v14M5 12h14" size={10} color={T.textDim} />
            <input value={newTagName} onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") addCustomTag(); }}
              placeholder="Create new tag..."
              style={{ flex: 1, background: T.bg0, border: `1px solid ${T.border}`, borderRadius: 4, padding: "4px 8px", color: T.text, fontSize: 10, outline: "none", fontFamily: "inherit" }}
            />
            {newTagName.trim() && (
              <button onClick={addCustomTag} style={{ background: T.teal, border: "none", borderRadius: 4, padding: "3px 10px", color: "#1A1A1A", fontSize: 10, fontWeight: 600, cursor: "pointer" }}>Add</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Cycle Badge ─────────────────────────────────────────────────
const CycleBadge = ({ cycle }) => {
  const m = {
    "24h": { label: "24h", color: T.danger },
    "3d": { label: "3 day", color: T.warn },
    "1w": { label: "1 week", color: T.blue },
  };
  const s = m[cycle] || m["3d"];
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, letterSpacing: .5,
      color: s.color, background: s.color + "15",
      padding: "2px 6px", borderRadius: 8, textTransform: "uppercase",
    }}>
      {s.label}
    </span>
  );
};

// ─── Status Badge ────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const m = {
    open: { label: "Open", color: T.blue },
    overdue: { label: "Overdue", color: T.danger },
    done: { label: "Done", color: T.green },
  };
  const s = m[status] || m.open;
  return (
    <span style={{
      fontSize: 10, fontWeight: 600,
      color: s.color, background: s.color + "18",
      padding: "2px 8px", borderRadius: 10,
    }}>
      {s.label}
    </span>
  );
};

// ─── Priority Badge ─────────────────────────────────────────────
const PriorityBadge = ({ priority }) => {
  const m = {
    high: { label: "High", color: T.danger },
    medium: { label: "Medium", color: T.warn },
    low: { label: "Low", color: T.textDim },
  };
  const s = m[priority] || m.medium;
  return (
    <span style={{
      fontSize: 9, fontWeight: 600, letterSpacing: .4,
      color: s.color, background: s.color + "15",
      padding: "2px 7px", borderRadius: 8, textTransform: "uppercase",
    }}>
      {s.label}
    </span>
  );
};

// ─── Task Detail Panel (inline expandable) ──────────────────────
const TaskDetailPanel = ({ task, onClose }) => {
  const objTag = getObjectiveTag(task.objectiveTag);
  return (
    <div style={{
      background: T.bg1, border: `1px solid ${T.border}`, borderRadius: 10,
      padding: 16, marginTop: 6,
      borderLeft: `3px solid ${objTag?.color || T.textDim}`,
      animation: "fadeIn .15s ease",
    }}>
      {/* Title row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.text, lineHeight: 1.5, flex: 1 }}>{task.task}</div>
        <button onClick={(e) => { e.stopPropagation(); onClose(); }} style={{
          background: "none", border: "none", color: T.textDim, cursor: "pointer",
          fontSize: 16, padding: "0 4px", lineHeight: 1, flexShrink: 0,
        }}>×</button>
      </div>

      {/* Detail grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 20px" }}>
        <div>
          <div style={{ fontSize: 9, color: T.textDim, textTransform: "uppercase", letterSpacing: .8, fontWeight: 600, marginBottom: 3 }}>Owner</div>
          <div style={{ fontSize: 12, color: T.text, fontWeight: 600 }}>{task.executive}</div>
        </div>
        <div>
          <div style={{ fontSize: 9, color: T.textDim, textTransform: "uppercase", letterSpacing: .8, fontWeight: 600, marginBottom: 3 }}>Due Date</div>
          <div style={{ fontSize: 12, color: task.status === "overdue" ? T.danger : T.text, fontWeight: 600 }}>{task.due}</div>
        </div>
        <div>
          <div style={{ fontSize: 9, color: T.textDim, textTransform: "uppercase", letterSpacing: .8, fontWeight: 600, marginBottom: 3 }}>Status</div>
          <StatusBadge status={task.status} />
        </div>
        <div>
          <div style={{ fontSize: 9, color: T.textDim, textTransform: "uppercase", letterSpacing: .8, fontWeight: 600, marginBottom: 3 }}>Priority</div>
          <PriorityBadge priority={task.priority} />
        </div>
        <div>
          <div style={{ fontSize: 9, color: T.textDim, textTransform: "uppercase", letterSpacing: .8, fontWeight: 600, marginBottom: 3 }}>Cycle</div>
          <CycleBadge cycle={task.cycle} />
        </div>
        <div>
          <div style={{ fontSize: 9, color: T.textDim, textTransform: "uppercase", letterSpacing: .8, fontWeight: 600, marginBottom: 3 }}>Objective</div>
          <ObjTagPill tagId={task.objectiveTag} />
        </div>
      </div>

      {/* Source */}
      <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${T.border}` }}>
        <div style={{ fontSize: 9, color: T.textDim, textTransform: "uppercase", letterSpacing: .8, fontWeight: 600, marginBottom: 3 }}>Source</div>
        <div style={{ fontSize: 11, color: T.textMid }}>{task.source}</div>
      </div>

      {/* Completion info (if done) */}
      {task.status === "done" && task.completedDate && (
        <div style={{ marginTop: 10, display: "flex", gap: 16 }}>
          <div>
            <div style={{ fontSize: 9, color: T.textDim, textTransform: "uppercase", letterSpacing: .8, fontWeight: 600, marginBottom: 3 }}>Completed</div>
            <div style={{ fontSize: 11, color: T.green, fontWeight: 600 }}>{task.completedDate}</div>
          </div>
          {task.daysToClose != null && (
            <div>
              <div style={{ fontSize: 9, color: T.textDim, textTransform: "uppercase", letterSpacing: .8, fontWeight: 600, marginBottom: 3 }}>Days to Close</div>
              <div style={{ fontSize: 11, color: T.text, fontWeight: 600 }}>{task.daysToClose}d</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Stacked Bar (for velocity) ──────────────────────────────────
const StackedBar = ({ data, maxVal, height = 120 }) => {
  if (!data.length) return null;
  const max = maxVal || Math.max(...data.map(d => d.total), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 16, height }}>
      {data.map((d, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{d.total}</span>
          <div style={{ display: "flex", flexDirection: "column-reverse", width: 40, height: height - 30, justifyContent: "flex-start" }}>
            {[
              { val: d.seriesC, color: OBJECTIVE_TAGS[0].color },
              { val: d.opsExcellence, color: OBJECTIVE_TAGS[1].color },
              { val: d.growthPipeline, color: OBJECTIVE_TAGS[2].color },
              { val: d.unaligned, color: T.textDim + "40" },
            ].map((seg, j) => seg.val > 0 ? (
              <div key={j} style={{
                width: "100%",
                height: `${(seg.val / max) * 100}%`,
                background: seg.color,
                borderRadius: j === 0 ? "0 0 4px 4px" : j === 3 ? "4px 4px 0 0" : 0,
                minHeight: seg.val > 0 ? 4 : 0,
              }} />
            ) : null)}
          </div>
          <span style={{ fontSize: 10, color: T.textDim, textAlign: "center" }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
};


// ═══════════════════════════════════════════════════════════════════
//  WEEK-OVER-WEEK TREND CHART — Stacked bars + focus % trendline
// ═══════════════════════════════════════════════════════════════════

const WoWTrendChart = ({ data, height = 220 }) => {
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const measure = () => {
      const w = containerRef.current?.getBoundingClientRect().width;
      if (w && w > 0) setContainerWidth(w);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  if (!data || data.length === 0) return <div ref={containerRef} />;

  const chartPadding = { top: 30, right: 50, bottom: 36, left: 40 };
  const barAreaWidth = Math.max(200, (containerWidth || 700) - chartPadding.left - chartPadding.right);
  const svgW = barAreaWidth + chartPadding.left + chartPadding.right;
  const svgH = height + chartPadding.top + chartPadding.bottom;
  const barMaxH = height;

  const maxTotal = Math.max(...data.map(d => d.total), 1);
  const barW = Math.min(48, (barAreaWidth / data.length) * 0.55);
  const barGap = (barAreaWidth - barW * data.length) / (data.length - 1 || 1);

  const segments = [
    { key: "seriesC", color: OBJECTIVE_TAGS[0].color, label: OBJECTIVE_TAGS[0].short },
    { key: "opsExcellence", color: OBJECTIVE_TAGS[1].color, label: OBJECTIVE_TAGS[1].short },
    { key: "growthPipeline", color: OBJECTIVE_TAGS[2].color, label: OBJECTIVE_TAGS[2].short },
    { key: "unaligned", color: T.textDim + "50", label: "Other" },
  ];

  // Y-axis scale for bars (task count)
  const yScale = (val) => barMaxH - (val / maxTotal) * barMaxH;

  // Focus % trendline points
  const trendPoints = data.map((d, i) => {
    const x = chartPadding.left + i * (barW + barGap) + barW / 2;
    const y = chartPadding.top + barMaxH - (d.focusPct / 100) * barMaxH;
    return { x, y, pct: d.focusPct };
  });
  const trendLine = trendPoints.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");

  // Y-axis ticks for bar count
  const yTicks = [];
  const tickStep = Math.ceil(maxTotal / 4);
  for (let v = 0; v <= maxTotal; v += tickStep) {
    yTicks.push(v);
  }

  // Y-axis ticks for focus % (right side)
  const pctTicks = [0, 25, 50, 75, 100];

  return (
    <div ref={containerRef} style={{ width: "100%" }}>
      {containerWidth > 0 && (
      <svg width="100%" height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} preserveAspectRatio="xMidYMid meet" style={{ display: "block" }}>
        {/* Grid lines */}
        {yTicks.map(v => (
          <line key={v}
            x1={chartPadding.left} y1={chartPadding.top + yScale(v)}
            x2={chartPadding.left + barAreaWidth} y2={chartPadding.top + yScale(v)}
            stroke={T.border} strokeWidth={0.5} strokeDasharray="4,4"
          />
        ))}

        {/* Y-axis labels (left - task count) */}
        {yTicks.map(v => (
          <text key={v} x={chartPadding.left - 8} y={chartPadding.top + yScale(v) + 3}
            textAnchor="end" fill={T.textDim} fontSize={9} fontFamily="inherit">
            {v}
          </text>
        ))}

        {/* Y-axis labels (right - focus %) */}
        {pctTicks.map(v => (
          <text key={v} x={chartPadding.left + barAreaWidth + 8} y={chartPadding.top + barMaxH - (v / 100) * barMaxH + 3}
            textAnchor="start" fill={T.accent} fontSize={9} fontFamily="inherit" opacity={0.7}>
            {v}%
          </text>
        ))}

        {/* Stacked bars */}
        {data.map((d, i) => {
          const barX = chartPadding.left + i * (barW + barGap);
          let cumH = 0;
          return (
            <g key={i}>
              {segments.map((seg) => {
                const val = d[seg.key];
                if (val <= 0) return null;
                const segH = (val / maxTotal) * barMaxH;
                const segY = chartPadding.top + barMaxH - cumH - segH;
                cumH += segH;
                return (
                  <rect key={seg.key} x={barX} y={segY} width={barW} height={segH}
                    fill={seg.color} rx={cumH === (d.total / maxTotal) * barMaxH ? 3 : 0}
                  />
                );
              })}
              {/* Top rounded corners on full bar */}
              <rect x={barX} y={chartPadding.top + yScale(d.total)} width={barW} height={3}
                fill="transparent" rx={3} />
              {/* Total label above bar */}
              <text x={barX + barW / 2} y={chartPadding.top + yScale(d.total) - 6}
                textAnchor="middle" fill={T.text} fontSize={10} fontWeight={700} fontFamily="inherit">
                {d.total}
              </text>
              {/* Week label */}
              <text x={barX + barW / 2} y={chartPadding.top + barMaxH + 16}
                textAnchor="middle" fill={T.textDim} fontSize={9} fontFamily="inherit">
                {d.label}
              </text>
            </g>
          );
        })}

        {/* Focus % trendline */}
        <path d={trendLine} fill="none" stroke={T.accent} strokeWidth={2.5}
          strokeLinecap="round" strokeLinejoin="round" />

        {/* Trendline dots + labels */}
        {trendPoints.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={4} fill={T.bg2} stroke={T.accent} strokeWidth={2} />
            <text x={p.x} y={p.y - 10} textAnchor="middle" fill={T.accent}
              fontSize={9} fontWeight={700} fontFamily="inherit">
              {p.pct}%
            </text>
          </g>
        ))}

        {/* Axis label - left */}
        <text x={12} y={chartPadding.top + barMaxH / 2}
          textAnchor="middle" fill={T.textDim} fontSize={9} fontFamily="inherit"
          transform={`rotate(-90, 12, ${chartPadding.top + barMaxH / 2})`}>
          Tasks
        </text>

        {/* Axis label - right */}
        <text x={svgW - 6} y={chartPadding.top + barMaxH / 2}
          textAnchor="middle" fill={T.accent} fontSize={9} fontFamily="inherit" opacity={0.7}
          transform={`rotate(90, ${svgW - 6}, ${chartPadding.top + barMaxH / 2})`}>
          Focus %
        </text>
      </svg>
      )}
    </div>
  );
};


// ═══════════════════════════════════════════════════════════════════
//  EXECUTIVE FOCUS CARD
// ═══════════════════════════════════════════════════════════════════

const ExecFocusCard = ({ metrics }) => {
  const color = focusColor(metrics.focusPct);

  return (
    <div style={{
      background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 12,
      padding: 20, flex: 1, minWidth: 220,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
        {/* Donut */}
        <div style={{ position: "relative" }}>
          <DonutRing pct={metrics.focusPct} color={color} />
          <div style={{
            position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: 18, fontWeight: 800, color }}>{metrics.focusPct}%</span>
          </div>
        </div>

        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>{metrics.executive}</div>
          <div style={{ fontSize: 11, color: T.textMid, marginTop: 2 }}>
            {metrics.open} open · {metrics.done} closed · {metrics.overdue > 0 && <span style={{ color: T.danger }}>{metrics.overdue} overdue</span>}
          </div>
          <div style={{ fontSize: 11, color: T.textDim, marginTop: 2 }}>
            Avg cycle: {metrics.avgCycleTime} days
          </div>
        </div>
      </div>

      {/* Per-objective mini bars */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {metrics.byObjective.map(obj => (
          <div key={obj.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%", background: obj.color, flexShrink: 0,
            }} />
            <span style={{ fontSize: 11, color: T.textMid, minWidth: 90, flexShrink: 0 }}>{obj.short}</span>
            <div style={{ flex: 1, height: 6, background: T.bg0, borderRadius: 3, overflow: "hidden" }}>
              <div style={{
                width: `${metrics.total > 0 ? (obj.total / metrics.total) * 100 : 0}%`,
                height: "100%", background: obj.color, borderRadius: 3,
                transition: "width .4s ease",
              }} />
            </div>
            <span style={{ fontSize: 11, color: T.text, fontWeight: 600, minWidth: 20, textAlign: "right" }}>{obj.total}</span>
          </div>
        ))}
        {/* Unaligned bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.textDim, flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: T.textDim, minWidth: 90, flexShrink: 0, fontStyle: "italic" }}>Other work</span>
          <div style={{ flex: 1, height: 6, background: T.bg0, borderRadius: 3, overflow: "hidden" }}>
            <div style={{
              width: `${metrics.total > 0 ? (metrics.unaligned / metrics.total) * 100 : 0}%`,
              height: "100%", background: T.textDim + "60", borderRadius: 3,
            }} />
          </div>
          <span style={{ fontSize: 11, color: T.textDim, fontWeight: 600, minWidth: 20, textAlign: "right" }}>{metrics.unaligned}</span>
        </div>
      </div>
    </div>
  );
};


// ═══════════════════════════════════════════════════════════════════
//  OBJECTIVE COLUMN
// ═══════════════════════════════════════════════════════════════════

const ObjectiveColumn = ({ objMetrics }) => {
  const [expandedId, setExpandedId] = useState(null);
  const activeTasks = executiveTasks.filter(
    t => t.objectiveTag === objMetrics.id && (t.status === "open" || t.status === "overdue")
  );

  return (
    <div style={{
      background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 12,
      padding: 16, flex: 1, minWidth: 260,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <div style={{
          width: 10, height: 10, borderRadius: "50%", background: objMetrics.color,
          boxShadow: `0 0 8px ${objMetrics.color}40`,
        }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{objMetrics.label}</span>
      </div>

      {/* Metrics row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
        <div style={{ background: T.bg0, borderRadius: 6, padding: "8px 10px", textAlign: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: T.text }}>{objMetrics.total}</div>
          <div style={{ fontSize: 9, color: T.textDim, textTransform: "uppercase", letterSpacing: .5 }}>Total</div>
        </div>
        <div style={{ background: T.bg0, borderRadius: 6, padding: "8px 10px", textAlign: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: T.green }}>{objMetrics.completionRate}%</div>
          <div style={{ fontSize: 9, color: T.textDim, textTransform: "uppercase", letterSpacing: .5 }}>Done</div>
        </div>
        <div style={{ background: T.bg0, borderRadius: 6, padding: "8px 10px", textAlign: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: objMetrics.open > 0 ? T.accent : T.textDim }}>{objMetrics.open}</div>
          <div style={{ fontSize: 9, color: T.textDim, textTransform: "uppercase", letterSpacing: .5 }}>Active</div>
        </div>
      </div>

      {/* Active task list */}
      {activeTasks.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {activeTasks.map(t => (
            <div key={t.id}>
              <div
                onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                style={{
                  display: "flex", alignItems: "flex-start", gap: 8,
                  padding: "8px 10px", background: expandedId === t.id ? T.bg0 : T.bg0, borderRadius: 8,
                  border: expandedId === t.id ? `1px solid ${objMetrics.color}50` : t.status === "overdue" ? `1px solid ${T.danger}30` : `1px solid ${T.border}`,
                  cursor: "pointer", transition: "border-color .15s",
                }}
                onMouseEnter={e => { if (expandedId !== t.id) e.currentTarget.style.borderColor = objMetrics.color + "40"; }}
                onMouseLeave={e => { if (expandedId !== t.id) e.currentTarget.style.borderColor = t.status === "overdue" ? T.danger + "30" : T.border; }}
              >
                <div style={{
                  width: 6, height: 6, borderRadius: "50%", marginTop: 5, flexShrink: 0,
                  background: t.status === "overdue" ? T.danger : t.priority === "high" ? T.accent : T.textDim,
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: T.text, lineHeight: 1.4 }}>{t.task}</div>
                  <div style={{ fontSize: 10, color: T.textDim, marginTop: 2 }}>
                    <span style={{ fontWeight: 600, color: T.textMid }}>{t.executive}</span>
                    {" · "}{t.due}{" · "}
                    <CycleBadge cycle={t.cycle} />
                  </div>
                </div>
                <StatusBadge status={t.status} />
              </div>
              {expandedId === t.id && (
                <TaskDetailPanel task={t} onClose={() => setExpandedId(null)} />
              )}
            </div>
          ))}
        </div>
      )}
      {activeTasks.length === 0 && (
        <div style={{ fontSize: 12, color: T.textDim, textAlign: "center", padding: 16 }}>
          No active tasks
        </div>
      )}
    </div>
  );
};


// ═══════════════════════════════════════════════════════════════════
//  THE "OTHER" BUCKET
// ═══════════════════════════════════════════════════════════════════

const OtherWorkSection = () => {
  const [expandedId, setExpandedId] = useState(null);
  const unaligned = executiveTasks.filter(
    t => t.objectiveTag === null && (t.status === "open" || t.status === "overdue")
  );

  if (unaligned.length === 0) {
    return (
      <Card title="Other Work (Not Objective-Aligned)" titleColor={T.textDim}>
        <div style={{ fontSize: 12, color: T.green, padding: "12px 0" }}>
          All active tasks are aligned to company objectives.
        </div>
      </Card>
    );
  }

  const allExecs = ["CEO", "COO", "VP Engineering", "VP Operations", "VP Finance", "VP Strategy", "VP People", "VP Risk"];
  const byExec = allExecs.map(exec => ({
    exec,
    tasks: unaligned.filter(t => t.executive === exec),
  })).filter(g => g.tasks.length > 0);

  return (
    <Card title="Other Work (Not Objective-Aligned)" titleColor={T.textDim}
      action={
        <span style={{ fontSize: 11, color: T.warn, fontWeight: 600 }}>
          {unaligned.length} task{unaligned.length !== 1 ? "s" : ""} outside objectives
        </span>
      }
    >
      <div style={{ fontSize: 11, color: T.textDim, marginBottom: 12, lineHeight: 1.5 }}>
        These tasks aren't tagged to any of the 3 company objectives. Some are necessary (tax filings, compliance) — but
        if this bucket grows, executive attention may be drifting from what matters most.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {byExec.map(g => (
          <div key={g.exec}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.textMid, textTransform: "uppercase", letterSpacing: .8, marginBottom: 6 }}>
              {g.exec} — {g.tasks.length} unaligned
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {g.tasks.map(t => (
                <div key={t.id}>
                  <div
                    onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "6px 10px", background: T.bg0, borderRadius: 6,
                      border: expandedId === t.id ? `1px solid ${T.accent}50` : t.status === "overdue" ? `1px solid ${T.danger}30` : `1px solid ${T.border}`,
                      cursor: "pointer", transition: "border-color .15s",
                    }}
                    onMouseEnter={e => { if (expandedId !== t.id) e.currentTarget.style.borderColor = T.accent + "40"; }}
                    onMouseLeave={e => { if (expandedId !== t.id) e.currentTarget.style.borderColor = t.status === "overdue" ? T.danger + "30" : T.border; }}
                  >
                    <span style={{ fontSize: 12, color: T.text, flex: 1 }}>{t.task}</span>
                    <CycleBadge cycle={t.cycle} />
                    <StatusBadge status={t.status} />
                    <span style={{ fontSize: 10, color: T.textDim }}>{t.due}</span>
                  </div>
                  {expandedId === t.id && (
                    <TaskDetailPanel task={t} onClose={() => setExpandedId(null)} />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};


// ═══════════════════════════════════════════════════════════════════
//  FULL TASK TABLE
// ═══════════════════════════════════════════════════════════════════

const TaskTable = ({ filter }) => {
  const [expandedId, setExpandedId] = useState(null);

  let tasks = executiveTasks;
  if (filter && filter !== "all") {
    tasks = tasks.filter(t => t.executive === filter);
  }

  // Sort: overdue first, then open by due date, then done
  const sorted = [...tasks].sort((a, b) => {
    const order = { overdue: 0, open: 1, done: 2 };
    if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
    return a.due.localeCompare(b.due);
  });

  const cols = ["Task", "Owner", "Objective", "Due", "Cycle", "Status"];

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr>
            {cols.map((c, i) => (
              <th key={i} style={{
                textAlign: "left", padding: "8px 10px", color: T.textDim,
                fontWeight: 600, fontSize: 11, textTransform: "uppercase",
                letterSpacing: .8, borderBottom: `1px solid ${T.border}`,
              }}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map(t => (
            <React.Fragment key={t.id}>
              <tr
                onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                style={{
                  cursor: "pointer",
                  background: expandedId === t.id ? T.accent + "08" : "transparent",
                  transition: "background .15s",
                }}
                onMouseEnter={e => { if (expandedId !== t.id) e.currentTarget.style.background = T.bg3; }}
                onMouseLeave={e => { if (expandedId !== t.id) e.currentTarget.style.background = "transparent"; }}
              >
                <td style={{ padding: "8px 10px", borderBottom: expandedId === t.id ? "none" : `1px solid ${T.border}`, color: T.text }}>
                  <span style={{
                    color: T.text, fontWeight: t.status === "overdue" ? 600 : 400,
                    maxWidth: 320, display: "inline-block", overflow: "hidden",
                    textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {t.task}
                  </span>
                </td>
                <td style={{ padding: "8px 10px", borderBottom: expandedId === t.id ? "none" : `1px solid ${T.border}`, color: T.text }}>
                  <span style={{ fontWeight: 600, color: T.textMid }}>{t.executive}</span>
                </td>
                <td style={{ padding: "8px 10px", borderBottom: expandedId === t.id ? "none" : `1px solid ${T.border}`, color: T.text }}>
                  <ObjTagPill tagId={t.objectiveTag} />
                </td>
                <td style={{ padding: "8px 10px", borderBottom: expandedId === t.id ? "none" : `1px solid ${T.border}`, color: T.text }}>
                  <span style={{
                    color: t.status === "overdue" ? T.danger : T.textMid,
                    fontWeight: t.status === "overdue" ? 600 : 400,
                  }}>
                    {t.due}
                  </span>
                </td>
                <td style={{ padding: "8px 10px", borderBottom: expandedId === t.id ? "none" : `1px solid ${T.border}`, color: T.text }}>
                  <CycleBadge cycle={t.cycle} />
                </td>
                <td style={{ padding: "8px 10px", borderBottom: expandedId === t.id ? "none" : `1px solid ${T.border}`, color: T.text }}>
                  <StatusBadge status={t.status} />
                </td>
              </tr>
              {expandedId === t.id && (
                <tr>
                  <td colSpan={6} style={{ padding: "0 10px 10px", borderBottom: `1px solid ${T.border}` }}>
                    <TaskDetailPanel task={t} onClose={() => setExpandedId(null)} />
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};


// ═══════════════════════════════════════════════════════════════════
//  MAIN VIEW
// ═══════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════
//  FOCUS TRACKER CONTENT (inner view for the Focus tab)
// ═══════════════════════════════════════════════════════════════════

const FocusTrackerContent = () => {
  const { simDate } = useSimDate();
  const [execFilter, setExecFilter] = useState("all");
  const [layoutLocked, setLayoutLocked] = useState(true);

  const portfolio = useMemo(() => getPortfolioFocusMetrics(simDate), [simDate]);
  const cSuiteMetrics = portfolio.execMetrics.filter(m => ["CEO", "COO"].includes(m.executive));
  const vpMetrics = portfolio.execMetrics.filter(m => !["CEO", "COO"].includes(m.executive));

  const tabs = [
    { key: "all", label: "All" },
    { key: "CEO", label: "CEO" },
    { key: "COO", label: "COO" },
    { key: "VP Engineering", label: "VP Eng" },
    { key: "VP Operations", label: "VP Ops" },
    { key: "VP Finance", label: "VP Fin" },
    { key: "VP Strategy", label: "VP Strat" },
    { key: "VP People", label: "VP People" },
    { key: "VP Risk", label: "VP Risk" },
  ];

  // ─── Widget definitions for draggable grid ───
  const widgets = useMemo(() => [
    {
      id: "wow-trend",
      label: "Week-over-Week Trend",
      render: () => (
        <Card title="Week-over-Week Trend" action={
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {OBJECTIVE_TAGS.map(t => (
              <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: t.color }} />
                <span style={{ fontSize: 10, color: T.textDim }}>{t.short}</span>
              </div>
            ))}
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: T.textDim + "50" }} />
              <span style={{ fontSize: 10, color: T.textDim }}>Other</span>
            </div>
            <div style={{ width: 1, height: 12, background: T.border, margin: "0 4px" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 16, height: 2.5, background: T.accent, borderRadius: 2 }} />
              <span style={{ fontSize: 10, color: T.accent }}>Focus %</span>
            </div>
          </div>
        }>
          <WoWTrendChart data={portfolio.wowTrend} />
        </Card>
      ),
    },
    {
      id: "kpis",
      label: "Portfolio KPIs",
      render: () => {
        const kpiItems = [
          { id: "kpi-focus", label: "Overall Focus", value: `${portfolio.focusPct}%`, sub: `${portfolio.aligned} of ${portfolio.total} tasks aligned`, color: focusColor(portfolio.focusPct) },
          { id: "kpi-active", label: "Active Tasks", value: portfolio.total - portfolio.execMetrics.reduce((a, m) => a + m.done, 0), sub: `${portfolio.overdue} overdue`, color: portfolio.overdue > 0 ? T.danger : T.blue },
          { id: "kpi-completed", label: "Completed", value: portfolio.execMetrics.reduce((a, m) => a + m.done, 0), sub: "this period", color: T.green },
          { id: "kpi-unaligned", label: "Unaligned Work", value: portfolio.unaligned, sub: `${Math.round((portfolio.unaligned / portfolio.total) * 100)}% of all tasks`, color: portfolio.unaligned > 4 ? T.warn : T.textDim },
        ];
        return (
          <DraggableCardRow
            items={kpiItems}
            locked={layoutLocked}
            storageKey="sens-focus-cards-kpis"
            renderItem={(item) => <KpiCard label={item.label} value={item.value} sub={item.sub} color={item.color} />}
          />
        );
      },
    },
    {
      id: "csuite",
      label: "C-Suite Focus Scores",
      render: () => {
        const csuiteItems = cSuiteMetrics.map(m => ({ id: `csuite-${m.executive}`, metrics: m }));
        return (
          <div>
            <SectionHeader sub="Focus score = % of tasks aligned to the 3 company objectives">
              C-Suite Focus Scores
            </SectionHeader>
            <div style={{ marginTop: 12 }}>
              <DraggableCardRow
                items={csuiteItems}
                locked={layoutLocked}
                storageKey="sens-focus-cards-csuite"
                renderItem={(item) => <ExecFocusCard metrics={item.metrics} />}
              />
            </div>
          </div>
        );
      },
    },
    {
      id: "vp",
      label: "VP Focus Scores",
      render: () => {
        const vpItems = vpMetrics.map(m => ({ id: `vp-${m.executive}`, metrics: m }));
        return (
          <div>
            <SectionHeader sub="VP-level task alignment against company objectives">
              VP Focus Scores
            </SectionHeader>
            <div style={{ marginTop: 12 }}>
              <DraggableCardRow
                items={vpItems}
                locked={layoutLocked}
                storageKey="sens-focus-cards-vp"
                display="grid"
                gridColumns="repeat(3, 1fr)"
                renderItem={(item) => <ExecFocusCard metrics={item.metrics} />}
              />
            </div>
          </div>
        );
      },
    },
    {
      id: "objectives",
      label: "Objective Breakdown",
      render: () => {
        const objItems = portfolio.byObjective.map(obj => ({ id: `obj-${obj.id}`, objMetrics: obj }));
        return (
          <div>
            <SectionHeader sub="Tasks distributed across the 3 company objectives, with exec ownership">
              Objective Breakdown
            </SectionHeader>
            <div style={{ marginTop: 12 }}>
              <DraggableCardRow
                items={objItems}
                locked={layoutLocked}
                storageKey="sens-focus-cards-objectives"
                renderItem={(item) => <ObjectiveColumn objMetrics={item.objMetrics} />}
              />
            </div>
          </div>
        );
      },
    },
    {
      id: "other",
      label: "Other Work",
      render: () => <OtherWorkSection />,
    },
    {
      id: "tasks",
      label: "All Tasks",
      render: () => (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
            <SectionHeader sub="All executive tasks — filterable by role">All Tasks</SectionHeader>
            <div style={{ display: "flex", gap: 2, flexWrap: "wrap", background: T.bg0, borderRadius: 6, padding: 2 }}>
              {tabs.map(t => (
                <button key={t.key} onClick={() => setExecFilter(t.key)} style={{
                  padding: "4px 8px", borderRadius: 4, border: "none", cursor: "pointer",
                  fontSize: 10, fontWeight: 600, whiteSpace: "nowrap",
                  background: execFilter === t.key ? T.accent : "transparent",
                  color: execFilter === t.key ? "#1A1A1A" : T.textDim,
                }}>{t.label}</button>
              ))}
            </div>
          </div>
          <Card>
            <TaskTable filter={execFilter} />
          </Card>
        </div>
      ),
    },
  ], [cSuiteMetrics, vpMetrics, execFilter, tabs, layoutLocked]);

  return (
    <DraggableGrid widgets={widgets} storageKey="sens-focus-layout" locked={layoutLocked} onLockedChange={setLayoutLocked} />
  );
};


// ═══════════════════════════════════════════════════════════════════
//  WEEKLY PULSE VIEW — Executive Daily/Weekly Task Channel
// ═══════════════════════════════════════════════════════════════════

const ObjDot = ({ tagId, size = 7 }) => {
  const obj = OBJECTIVE_TAGS.find(o => o.id === tagId);
  if (!obj) return <span style={{ width: size, height: size, borderRadius: "50%", background: T.textDim + "40", display: "inline-block", flexShrink: 0 }} />;
  return <span style={{ width: size, height: size, borderRadius: "50%", background: obj.color, display: "inline-block", flexShrink: 0, boxShadow: `0 0 4px ${obj.color}30` }} title={obj.label} />;
};

const ObjPill = ({ tagId }) => {
  const obj = OBJECTIVE_TAGS.find(o => o.id === tagId);
  if (!obj) return <span style={{ fontSize: 9, color: T.textDim, fontStyle: "italic" }}>Untagged</span>;
  return (
    <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: .3, color: obj.color, background: obj.color + "15", padding: "2px 7px", borderRadius: 8 }}>
      {obj.short}
    </span>
  );
};

const SourceBadge = ({ source }) => {
  const m = { meeting: { label: "Meeting", color: T.accent }, "action-item": { label: "Action Item", color: T.blue }, manual: { label: "Manual", color: T.textDim } };
  const s = m[source] || m.manual;
  return (
    <span style={{ fontSize: 8, fontWeight: 600, letterSpacing: .4, color: s.color, background: s.color + "12", padding: "1px 5px", borderRadius: 4, textTransform: "uppercase" }}>
      {s.label}
    </span>
  );
};

const ExecAvatar = ({ exec, size = 32 }) => {
  const info = getExecInfo(exec);
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", background: info.color + "20",
      border: `2px solid ${info.color}`, display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.35, fontWeight: 700, color: info.color, flexShrink: 0,
    }}>
      {info.initials}
    </div>
  );
};

// ─── Exec key → participant id mapping ──────────────────────────
const execToParticipantId = (execKey) => {
  const p = participants.find(pp => pp.role === execKey);
  return p ? p.id : null;
};

// ─── Get action items relevant to an exec ───────────────────────
const getRelevantActionItems = (execKey) => {
  const execInfo = getExecInfo(execKey);
  const pId = execToParticipantId(execKey);

  // Meetings this exec participated in
  const execMeetingIds = new Set();
  pastMeetings.forEach(m => {
    if (m.participants.includes(pId)) execMeetingIds.add(m.id);
  });

  return allActionItems.filter(ai => {
    if (ai.status === "done") return false;
    // Assigned to this exec (match by full name, first name, or role key)
    const assigneeLower = ai.assignee.toLowerCase();
    const nameLower = execInfo.name.toLowerCase();
    const assignedToExec = assigneeLower === nameLower
      || assigneeLower === execKey.toLowerCase()
      || nameLower.startsWith(assigneeLower)
      || assigneeLower.startsWith(nameLower.split(" ")[0]);
    // From a meeting they attended
    const fromExecMeeting = ai.meeting && execMeetingIds.has(ai.meeting);
    return assignedToExec || fromExecMeeting;
  });
};


// ═══════════════════════════════════════════════════════════════════
//  ACTION ITEM PICKER — select from meeting action items
// ═══════════════════════════════════════════════════════════════════

const ActionItemPicker = ({ execKey, onSelect, onClose, excludeIds = [] }) => {
  const items = useMemo(() => getRelevantActionItems(execKey), [execKey]);
  const available = items.filter(ai => !excludeIds.includes(ai.id));

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center",
    }} onClick={onClose}>
      <div style={{
        background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 14,
        width: 560, maxHeight: "70vh", display: "flex", flexDirection: "column",
        boxShadow: "0 16px 48px rgba(0,0,0,.4)",
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>Import Action Items</div>
            <div style={{ fontSize: 11, color: T.textDim, marginTop: 2 }}>
              Showing items assigned to or from meetings attended by {getExecInfo(execKey).name}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: T.textDim, cursor: "pointer", fontSize: 18, padding: 4 }}>×</button>
        </div>

        {/* Items list */}
        <div style={{ padding: "12px 20px", overflowY: "auto", flex: 1 }}>
          {available.length === 0 ? (
            <div style={{ textAlign: "center", padding: 30, color: T.textDim, fontSize: 12 }}>
              No open action items available for {getExecInfo(execKey).name}.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {available.map(ai => (
                <div key={ai.id} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                  background: T.bg0, border: `1px solid ${T.border}`, borderRadius: 8,
                  cursor: "pointer", transition: "all .15s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.background = T.accent + "08"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.bg0; }}
                  onClick={() => onSelect(ai)}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: T.text, fontWeight: 500 }}>{ai.task}</div>
                    <div style={{ fontSize: 10, color: T.textDim, marginTop: 3, display: "flex", gap: 8, alignItems: "center" }}>
                      <span>Assigned: <span style={{ color: T.textMid, fontWeight: 600 }}>{ai.assignee}</span></span>
                      <span style={{ color: T.border }}>|</span>
                      <span>From: {ai.source}</span>
                      <span style={{ color: T.border }}>|</span>
                      <span>Due: {ai.due}</span>
                    </div>
                  </div>
                  <div style={{
                    fontSize: 9, fontWeight: 600, padding: "3px 8px", borderRadius: 4,
                    color: ai.status === "overdue" ? T.danger : T.blue,
                    background: (ai.status === "overdue" ? T.danger : T.blue) + "15",
                    textTransform: "uppercase",
                  }}>
                    {ai.status}
                  </div>
                  <div style={{
                    fontSize: 10, fontWeight: 600, color: T.accent, padding: "4px 10px",
                    background: T.accent + "12", borderRadius: 6, flexShrink: 0,
                  }}>
                    + Add
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


// ═══════════════════════════════════════════════════════════════════
//  CREATE WEEKLY PLAN FORM
// ═══════════════════════════════════════════════════════════════════

const CreateWeeklyPlanForm = ({ onSave, onCancel, existingPlans, weekOf, simDate }) => {
  const [selectedExec, setSelectedExec] = useState("");
  const [tasks, setTasks] = useState([]);
  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskObj, setNewTaskObj] = useState("");
  const [showPicker, setShowPicker] = useState(false);

  const alreadyPlannedExecs = new Set(existingPlans.map(p => p.executive));
  const availableExecs = PULSE_EXECS.filter(e => !alreadyPlannedExecs.has(e.key));
  const importedActionItemIds = tasks.filter(t => t.actionItemId).map(t => t.actionItemId);

  const addManualTask = () => {
    if (!newTaskText.trim()) return;
    setTasks(prev => [...prev, {
      id: `new-wt-${Date.now()}`,
      task: newTaskText.trim(),
      objectiveTag: newTaskObj || null,
      status: "planned",
      completedDate: null,
      source: "manual",
    }]);
    setNewTaskText("");
    setNewTaskObj("");
  };

  const addFromActionItem = (ai) => {
    setTasks(prev => [...prev, {
      id: `new-wt-${Date.now()}`,
      task: ai.task,
      objectiveTag: null,
      status: "planned",
      completedDate: null,
      source: "action-item",
      actionItemId: ai.id,
    }]);
    setShowPicker(false);
  };

  const removeTask = (idx) => setTasks(prev => prev.filter((_, i) => i !== idx));

  const handleSave = () => {
    if (!selectedExec || tasks.length === 0) return;
    onSave({
      id: `wp-new-${Date.now()}`,
      executive: selectedExec,
      weekOf: weekOf,
      postedAt: new Date().toISOString(),
      tasks,
    });
  };

  return (
    <div style={{
      background: T.bg2, border: `1px solid ${T.teal}30`, borderRadius: 12,
      borderLeft: `3px solid ${T.teal}`, padding: 20,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>Create Weekly Plan</div>
        <button onClick={onCancel} style={{ background: "none", border: "none", color: T.textDim, cursor: "pointer", fontSize: 12, padding: "4px 8px" }}>Cancel</button>
      </div>

      {/* Exec selector */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: T.textDim, fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: .5 }}>Executive</div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {availableExecs.map(e => (
            <button key={e.key} onClick={() => setSelectedExec(e.key)} style={{
              padding: "6px 12px", borderRadius: 6, border: `1px solid ${selectedExec === e.key ? e.color : T.border}`,
              background: selectedExec === e.key ? e.color + "18" : T.bg0,
              color: selectedExec === e.key ? e.color : T.textDim,
              cursor: "pointer", fontSize: 11, fontWeight: 600,
            }}>
              {e.key}
            </button>
          ))}
          {availableExecs.length === 0 && (
            <div style={{ fontSize: 11, color: T.textDim, fontStyle: "italic", padding: 4 }}>All executives have plans for this week.</div>
          )}
        </div>
      </div>

      {/* Task list */}
      {tasks.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: T.textDim, fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: .5 }}>Tasks ({tasks.length})</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {tasks.map((t, i) => (
              <div key={t.id} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "6px 10px",
                background: T.bg0, border: `1px solid ${T.border}`, borderRadius: 6,
              }}>
                <span style={{ fontSize: 12, color: T.text, flex: 1 }}>{t.task}</span>
                <SourceBadge source={t.source} />
                {t.objectiveTag && <ObjPill tagId={t.objectiveTag} />}
                <button onClick={() => removeTask(i)} style={{
                  background: "none", border: "none", color: T.danger, cursor: "pointer",
                  fontSize: 11, padding: "2px 6px", opacity: 0.7,
                }}>×</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add task row */}
      <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <input
            value={newTaskText}
            onChange={e => setNewTaskText(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") addManualTask(); }}
            placeholder="Type a task..."
            style={{
              width: "100%", padding: "8px 12px", borderRadius: 6, border: `1px solid ${T.border}`,
              background: T.bg0, color: T.text, fontSize: 12, outline: "none",
              fontFamily: "inherit",
            }}
          />
        </div>
        <ObjectiveTagPicker value={newTaskObj} onChange={setNewTaskObj} />
        <button onClick={addManualTask} style={{
          padding: "8px 14px", borderRadius: 6, border: "none",
          background: T.teal, color: "#1A1A1A", fontSize: 11, fontWeight: 700,
          cursor: "pointer", whiteSpace: "nowrap",
        }}>+ Add</button>
      </div>

      {/* Import from action items */}
      {selectedExec && (
        <button onClick={() => setShowPicker(true)} style={{
          padding: "8px 14px", borderRadius: 6, border: `1px dashed ${T.blue}`,
          background: T.blue + "08", color: T.blue, fontSize: 11, fontWeight: 600,
          cursor: "pointer", width: "100%", marginBottom: 16,
        }}>
          Import from Action Items
        </button>
      )}

      {/* Save button */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <button onClick={onCancel} style={{
          padding: "8px 18px", borderRadius: 6, border: `1px solid ${T.border}`,
          background: "transparent", color: T.textDim, fontSize: 12, cursor: "pointer",
        }}>Cancel</button>
        <button onClick={handleSave} disabled={!selectedExec || tasks.length === 0} style={{
          padding: "8px 20px", borderRadius: 6, border: "none",
          background: (!selectedExec || tasks.length === 0) ? T.textDim + "30" : T.teal,
          color: (!selectedExec || tasks.length === 0) ? T.textDim : "#1A1A1A",
          fontSize: 12, fontWeight: 700, cursor: (!selectedExec || tasks.length === 0) ? "default" : "pointer",
        }}>Post Weekly Plan</button>
      </div>

      {/* Action item picker modal */}
      {showPicker && selectedExec && (
        <ActionItemPicker
          execKey={selectedExec}
          excludeIds={importedActionItemIds}
          onSelect={addFromActionItem}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
};


// ═══════════════════════════════════════════════════════════════════
//  POST DAILY STANDUP FORM
// ═══════════════════════════════════════════════════════════════════

const PostDailyStandupForm = ({ onSave, onCancel, existingPlans, existingPosts, simDate, weekOf }) => {
  const [selectedExec, setSelectedExec] = useState("");
  const [yesterdayTasks, setYesterdayTasks] = useState([]);
  const [todayTasks, setTodayTasks] = useState([]);
  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskObj, setNewTaskObj] = useState("");
  const [showPicker, setShowPicker] = useState(false);

  const alreadyPostedExecs = new Set(existingPosts.filter(p => p.date === simDate).map(p => p.executive));
  const availableExecs = PULSE_EXECS.filter(e => !alreadyPostedExecs.has(e.key));
  const importedActionItemIds = todayTasks.filter(t => t.actionItemId).map(t => t.actionItemId);

  // When exec changes, load their yesterday tasks from weekly plan
  const handleExecSelect = (key) => {
    setSelectedExec(key);
    setTodayTasks([]);
    setYesterdayTasks([]);
    // Find their weekly plan for current week
    const plan = existingPlans.find(p => p.executive === key && p.weekOf === weekOf);
    if (plan) {
      // Pull planned tasks as yesterday's items (user will mark status)
      const yesterdayItems = plan.tasks.filter(t => t.status === "planned" || t.status === "partial").slice(0, 5).map((t, i) => ({
        task: t.task,
        objectiveTag: t.objectiveTag,
        status: "planned", // user will toggle
        id: `yt-${i}`,
      }));
      setYesterdayTasks(yesterdayItems);
    }
  };

  const toggleYesterdayStatus = (idx) => {
    setYesterdayTasks(prev => prev.map((t, i) => {
      if (i !== idx) return t;
      const cycle = { planned: "done", done: "partial", partial: "planned" };
      return { ...t, status: cycle[t.status] || "planned" };
    }));
  };

  const addTodayTask = () => {
    if (!newTaskText.trim()) return;
    setTodayTasks(prev => [...prev, {
      id: `tt-${Date.now()}`,
      task: newTaskText.trim(),
      objectiveTag: newTaskObj || null,
      source: "manual",
    }]);
    setNewTaskText("");
    setNewTaskObj("");
  };

  const addFromActionItem = (ai) => {
    setTodayTasks(prev => [...prev, {
      id: `tt-${Date.now()}`,
      task: ai.task,
      objectiveTag: null,
      source: "action-item",
      actionItemId: ai.id,
    }]);
    setShowPicker(false);
  };

  const removeTodayTask = (idx) => setTodayTasks(prev => prev.filter((_, i) => i !== idx));

  const handleSave = () => {
    if (!selectedExec || todayTasks.length === 0) return;
    const completed = yesterdayTasks.filter(t => t.status === "done").length;
    onSave({
      id: `dp-new-${Date.now()}`,
      executive: selectedExec,
      date: simDate,
      postedAt: new Date().toISOString(),
      yesterdayUpdate: {
        planned: yesterdayTasks.length,
        completed,
        tasks: yesterdayTasks.map(t => ({ task: t.task, status: t.status, objectiveTag: t.objectiveTag })),
      },
      todayPlan: todayTasks.map(t => ({ task: t.task, objectiveTag: t.objectiveTag, source: t.source })),
    });
  };

  return (
    <div style={{
      background: T.bg2, border: `1px solid ${T.accent}30`, borderRadius: 12,
      borderLeft: `3px solid ${T.accent}`, padding: 20,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>Post Daily Standup</div>
        <button onClick={onCancel} style={{ background: "none", border: "none", color: T.textDim, cursor: "pointer", fontSize: 12, padding: "4px 8px" }}>Cancel</button>
      </div>

      {/* Exec selector */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: T.textDim, fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: .5 }}>Executive</div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {availableExecs.map(e => (
            <button key={e.key} onClick={() => handleExecSelect(e.key)} style={{
              padding: "6px 12px", borderRadius: 6, border: `1px solid ${selectedExec === e.key ? e.color : T.border}`,
              background: selectedExec === e.key ? e.color + "18" : T.bg0,
              color: selectedExec === e.key ? e.color : T.textDim,
              cursor: "pointer", fontSize: 11, fontWeight: 600,
            }}>
              {e.key}
            </button>
          ))}
          {availableExecs.length === 0 && (
            <div style={{ fontSize: 11, color: T.textDim, fontStyle: "italic", padding: 4 }}>All executives have posted today.</div>
          )}
        </div>
      </div>

      {/* Yesterday update */}
      {selectedExec && yesterdayTasks.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: T.textDim, fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: .5 }}>
            Yesterday's Tasks <span style={{ fontWeight: 400, textTransform: "none", fontStyle: "italic" }}>(click to toggle status)</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {yesterdayTasks.map((t, i) => (
              <div key={t.id} onClick={() => toggleYesterdayStatus(i)} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "6px 10px",
                background: t.status === "done" ? T.green + "08" : T.bg0,
                border: `1px solid ${t.status === "done" ? T.green + "30" : T.border}`,
                borderRadius: 6, cursor: "pointer",
              }}>
                <span style={{
                  fontSize: 13,
                  color: t.status === "done" ? T.green : t.status === "partial" ? T.warn : T.textDim,
                }}>
                  {t.status === "done" ? "✓" : t.status === "partial" ? "◐" : "○"}
                </span>
                <span style={{
                  fontSize: 12, flex: 1,
                  color: t.status === "done" ? T.textMid : T.text,
                  textDecoration: t.status === "done" ? "line-through" : "none",
                  opacity: t.status === "done" ? 0.7 : 1,
                }}>
                  {t.task}
                </span>
                {t.objectiveTag && <ObjPill tagId={t.objectiveTag} />}
                <span style={{
                  fontSize: 9, fontWeight: 600, padding: "2px 6px", borderRadius: 4,
                  color: t.status === "done" ? T.green : t.status === "partial" ? T.warn : T.textDim,
                  background: (t.status === "done" ? T.green : t.status === "partial" ? T.warn : T.textDim) + "15",
                  textTransform: "uppercase", minWidth: 48, textAlign: "center",
                }}>
                  {t.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Today's plan */}
      {selectedExec && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: T.teal, fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: .5 }}>Today's Plan</div>

          {todayTasks.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
              {todayTasks.map((t, i) => (
                <div key={t.id} style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "6px 10px",
                  background: T.bg0, border: `1px solid ${T.border}`, borderRadius: 6,
                }}>
                  <ObjDot tagId={t.objectiveTag} />
                  <span style={{ fontSize: 12, color: T.text, flex: 1 }}>{t.task}</span>
                  <SourceBadge source={t.source} />
                  {t.objectiveTag && <ObjPill tagId={t.objectiveTag} />}
                  <button onClick={() => removeTodayTask(i)} style={{
                    background: "none", border: "none", color: T.danger, cursor: "pointer",
                    fontSize: 11, padding: "2px 6px", opacity: 0.7,
                  }}>×</button>
                </div>
              ))}
            </div>
          )}

          {/* Add task row */}
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginBottom: 10 }}>
            <div style={{ flex: 1 }}>
              <input
                value={newTaskText}
                onChange={e => setNewTaskText(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") addTodayTask(); }}
                placeholder="What are you working on today?"
                style={{
                  width: "100%", padding: "8px 12px", borderRadius: 6, border: `1px solid ${T.border}`,
                  background: T.bg0, color: T.text, fontSize: 12, outline: "none",
                  fontFamily: "inherit",
                }}
              />
            </div>
            <ObjectiveTagPicker value={newTaskObj} onChange={setNewTaskObj} />
            <button onClick={addTodayTask} style={{
              padding: "8px 14px", borderRadius: 6, border: "none",
              background: T.teal, color: "#1A1A1A", fontSize: 11, fontWeight: 700,
              cursor: "pointer", whiteSpace: "nowrap",
            }}>+ Add</button>
          </div>

          {/* Import from action items */}
          <button onClick={() => setShowPicker(true)} style={{
            padding: "8px 14px", borderRadius: 6, border: `1px dashed ${T.blue}`,
            background: T.blue + "08", color: T.blue, fontSize: 11, fontWeight: 600,
            cursor: "pointer", width: "100%",
          }}>
            Import from Action Items
          </button>
        </div>
      )}

      {/* Save */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
        <button onClick={onCancel} style={{
          padding: "8px 18px", borderRadius: 6, border: `1px solid ${T.border}`,
          background: "transparent", color: T.textDim, fontSize: 12, cursor: "pointer",
        }}>Cancel</button>
        <button onClick={handleSave} disabled={!selectedExec || todayTasks.length === 0} style={{
          padding: "8px 20px", borderRadius: 6, border: "none",
          background: (!selectedExec || todayTasks.length === 0) ? T.textDim + "30" : T.accent,
          color: (!selectedExec || todayTasks.length === 0) ? T.textDim : "#1A1A1A",
          fontSize: 12, fontWeight: 700, cursor: (!selectedExec || todayTasks.length === 0) ? "default" : "pointer",
        }}>Post Standup</button>
      </div>

      {/* Action item picker modal */}
      {showPicker && selectedExec && (
        <ActionItemPicker
          execKey={selectedExec}
          excludeIds={importedActionItemIds}
          onSelect={addFromActionItem}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
};


const WeeklyPulseView = () => {
  const { simDate } = useSimDate();
  const [weekView, setWeekView] = useState("current"); // "current" | "last"
  const [execFilter, setExecFilter] = useState("all");
  const [feedView, setFeedView] = useState("daily"); // "daily" | "weekly"
  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);

  // ─── Mutable state: deep-clone seed data so we can modify in-place ───
  const [allPlans, setAllPlans] = useState(() => JSON.parse(JSON.stringify(weeklyPlans)));
  const [allPosts, setAllPosts] = useState(() => JSON.parse(JSON.stringify(dailyPosts)));

  // Track which plan/post is in edit mode
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [editingPostId, setEditingPostId] = useState(null);

  // Inline edit state for adding tasks
  const [inlineTaskText, setInlineTaskText] = useState("");
  const [inlineTaskObj, setInlineTaskObj] = useState("");

  // Inline edit state for editing task text
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingTaskText, setEditingTaskText] = useState("");

  const pulse = useMemo(() => getPulseMetrics(simDate), [simDate]);

  // Compute week Mondays relative to simDate
  const thisWeekMon = useMemo(() => {
    const d = new Date(simDate + "T12:00:00");
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    return d.toISOString().split("T")[0];
  }, [simDate]);
  const lastWeekMon = useMemo(() => {
    const d = new Date(thisWeekMon + "T12:00:00");
    d.setDate(d.getDate() - 7);
    return d.toISOString().split("T")[0];
  }, [thisWeekMon]);

  const currentWeekPlans = weekView === "current"
    ? allPlans.filter(p => p.weekOf === thisWeekMon)
    : allPlans.filter(p => p.weekOf === lastWeekMon);
  const filteredPlans = execFilter === "all" ? currentWeekPlans : currentWeekPlans.filter(p => p.executive === execFilter);

  const todayPosts = allPosts.filter(p => p.date === simDate);
  const allDailyPosts = execFilter === "all" ? allPosts : allPosts.filter(p => p.executive === execFilter);

  const handleSavePlan = (plan) => {
    setAllPlans(prev => [...prev, plan]);
    setShowCreatePlan(false);
  };
  const handleSavePost = (post) => {
    setAllPosts(prev => [...prev, post]);
    setShowCreatePost(false);
  };

  // ─── Toggle task status in a weekly plan (click to check off) ───
  const togglePlanTaskStatus = useCallback((planId, taskId) => {
    setAllPlans(prev => prev.map(plan => {
      if (plan.id !== planId) return plan;
      return {
        ...plan,
        tasks: plan.tasks.map(t => {
          if (t.id !== taskId) return t;
          const cycle = { planned: "done", done: "partial", partial: "planned" };
          const newStatus = cycle[t.status] || "planned";
          return {
            ...t,
            status: newStatus,
            completedDate: newStatus === "done" ? new Date().toISOString().slice(0, 10) : null,
          };
        }),
      };
    }));
  }, []);

  // ─── Toggle today's plan task in a daily post ───
  const togglePostTodayTask = useCallback((postId, taskIdx) => {
    setAllPosts(prev => prev.map(post => {
      if (post.id !== postId) return post;
      return {
        ...post,
        todayPlan: post.todayPlan.map((t, i) => {
          if (i !== taskIdx) return t;
          const cur = t._status || "planned";
          const cycle = { planned: "done", done: "partial", partial: "planned" };
          return { ...t, _status: cycle[cur] || "planned" };
        }),
      };
    }));
  }, []);

  // ─── Remove a task from a weekly plan ───
  const removePlanTask = useCallback((planId, taskId) => {
    setAllPlans(prev => prev.map(plan => {
      if (plan.id !== planId) return plan;
      return { ...plan, tasks: plan.tasks.filter(t => t.id !== taskId) };
    }));
  }, []);

  // ─── Add a task to a weekly plan ───
  const addPlanTask = useCallback((planId, task, objectiveTag) => {
    if (!task.trim()) return;
    setAllPlans(prev => prev.map(plan => {
      if (plan.id !== planId) return plan;
      return {
        ...plan,
        tasks: [...plan.tasks, {
          id: `wt-edit-${Date.now()}`,
          task: task.trim(),
          objectiveTag: objectiveTag || null,
          status: "planned",
          completedDate: null,
          source: "manual",
        }],
      };
    }));
  }, []);

  // ─── Update task text in a weekly plan ───
  const commitPlanTaskEdit = useCallback((planId, taskId, newText) => {
    if (!newText.trim()) return;
    setAllPlans(prev => prev.map(plan => {
      if (plan.id !== planId) return plan;
      return {
        ...plan,
        tasks: plan.tasks.map(t => t.id === taskId ? { ...t, task: newText.trim() } : t),
      };
    }));
    setEditingTaskId(null);
    setEditingTaskText("");
  }, []);

  // ─── Remove a today task from a daily post ───
  const removePostTodayTask = useCallback((postId, taskIdx) => {
    setAllPosts(prev => prev.map(post => {
      if (post.id !== postId) return post;
      return { ...post, todayPlan: post.todayPlan.filter((_, i) => i !== taskIdx) };
    }));
  }, []);

  // ─── Add a today task to a daily post ───
  const addPostTodayTask = useCallback((postId, task, objectiveTag) => {
    if (!task.trim()) return;
    setAllPosts(prev => prev.map(post => {
      if (post.id !== postId) return post;
      return {
        ...post,
        todayPlan: [...post.todayPlan, {
          task: task.trim(),
          objectiveTag: objectiveTag || null,
          source: "manual",
        }],
      };
    }));
  }, []);

  // ─── Commit edit of a today task text in a daily post ───
  const commitPostTaskEdit = useCallback((postId, taskIdx, newText) => {
    if (!newText.trim()) return;
    setAllPosts(prev => prev.map(post => {
      if (post.id !== postId) return post;
      return {
        ...post,
        todayPlan: post.todayPlan.map((t, i) => i === taskIdx ? { ...t, task: newText.trim() } : t),
      };
    }));
    setEditingTaskId(null);
    setEditingTaskText("");
  }, []);
  // Group daily posts by date
  const postsByDate = useMemo(() => {
    const grouped = {};
    allDailyPosts.forEach(p => {
      if (!grouped[p.date]) grouped[p.date] = [];
      grouped[p.date].push(p);
    });
    return Object.entries(grouped).sort((a, b) => b[0].localeCompare(a[0]));
  }, [allDailyPosts]);

  const fmtTime = (iso) => new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const fmtDate = (d) => {
    const dt = new Date(d + "T12:00:00");
    return dt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ─── Pulse KPIs ─── */}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        <KpiCard label="Weekly Alignment" value={`${pulse.alignmentPct}%`} sub={`tasks tagged to objectives`} color={focusColor(pulse.alignmentPct)} />
        <KpiCard label="This Week" value={`${pulse.thisWeekDone}/${pulse.thisWeekTotal}`} sub={`${pulse.thisWeekCompletionPct}% complete`} color={pulse.thisWeekCompletionPct >= 50 ? T.green : T.accent} />
        <KpiCard label="Last Week" value={`${pulse.lastWeekCompletionPct}%`} sub="completion rate" color={pulse.lastWeekCompletionPct >= 80 ? T.green : T.warn} />
        <KpiCard label="Posted Today" value={`${todayPosts.length}/${pulse.totalExecs}`} sub="daily standups" color={todayPosts.length >= pulse.totalExecs ? T.green : T.blue} />
      </div>

      {/* ─── Controls Row ─── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        {/* Feed toggle */}
        <div style={{ display: "flex", gap: 2, background: T.bg0, borderRadius: 6, padding: 2 }}>
          {[{ key: "daily", label: "Daily Feed" }, { key: "weekly", label: "Weekly Plans" }].map(v => (
            <button key={v.key} onClick={() => setFeedView(v.key)} style={{
              padding: "5px 12px", borderRadius: 4, border: "none", cursor: "pointer",
              fontSize: 11, fontWeight: 600,
              background: feedView === v.key ? T.teal : "transparent",
              color: feedView === v.key ? "#1A1A1A" : T.textDim,
            }}>{v.label}</button>
          ))}
        </div>

        <div style={{ width: 1, height: 20, background: T.border }} />

        {/* Week selector (for weekly plans) */}
        {feedView === "weekly" && (
          <div style={{ display: "flex", gap: 2, background: T.bg0, borderRadius: 6, padding: 2 }}>
            {[{ key: "current", label: "This Week" }, { key: "last", label: "Last Week" }].map(w => (
              <button key={w.key} onClick={() => setWeekView(w.key)} style={{
                padding: "5px 12px", borderRadius: 4, border: "none", cursor: "pointer",
                fontSize: 11, fontWeight: 600,
                background: weekView === w.key ? T.accent : "transparent",
                color: weekView === w.key ? "#1A1A1A" : T.textDim,
              }}>{w.label}</button>
            ))}
          </div>
        )}

        {/* Exec filter */}
        <div style={{ display: "flex", gap: 2, background: T.bg0, borderRadius: 6, padding: 2, flexWrap: "wrap" }}>
          <button onClick={() => setExecFilter("all")} style={{
            padding: "4px 8px", borderRadius: 4, border: "none", cursor: "pointer",
            fontSize: 10, fontWeight: 600,
            background: execFilter === "all" ? T.accent : "transparent",
            color: execFilter === "all" ? "#1A1A1A" : T.textDim,
          }}>All</button>
          {PULSE_EXECS.map(e => (
            <button key={e.key} onClick={() => setExecFilter(e.key)} style={{
              padding: "4px 8px", borderRadius: 4, border: "none", cursor: "pointer",
              fontSize: 10, fontWeight: 600, whiteSpace: "nowrap",
              background: execFilter === e.key ? e.color : "transparent",
              color: execFilter === e.key ? "#1A1A1A" : T.textDim,
            }}>{e.key.replace("VP ", "VP ")}</button>
          ))}
        </div>
      </div>

      {/* ─── Create Buttons ─── */}
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={() => { setShowCreatePost(false); setShowCreatePlan(!showCreatePlan); }} style={{
          padding: "9px 18px", borderRadius: 8, border: `1px solid ${showCreatePlan ? T.teal : T.border}`,
          background: showCreatePlan ? T.teal + "15" : T.bg2,
          color: showCreatePlan ? T.teal : T.text,
          fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
          transition: "all .15s",
        }}
          onMouseEnter={e => { if (!showCreatePlan) e.currentTarget.style.borderColor = T.teal; }}
          onMouseLeave={e => { if (!showCreatePlan) e.currentTarget.style.borderColor = T.border; }}
        >
          <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> New Weekly Plan
        </button>
        <button onClick={() => { setShowCreatePlan(false); setShowCreatePost(!showCreatePost); }} style={{
          padding: "9px 18px", borderRadius: 8, border: `1px solid ${showCreatePost ? T.accent : T.border}`,
          background: showCreatePost ? T.accent + "15" : T.bg2,
          color: showCreatePost ? T.accent : T.text,
          fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
          transition: "all .15s",
        }}
          onMouseEnter={e => { if (!showCreatePost) e.currentTarget.style.borderColor = T.accent; }}
          onMouseLeave={e => { if (!showCreatePost) e.currentTarget.style.borderColor = T.border; }}
        >
          <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Post Daily Standup
        </button>
      </div>

      {/* ─── Creation Forms ─── */}
      {showCreatePlan && (
        <CreateWeeklyPlanForm
          existingPlans={currentWeekPlans}
          onSave={handleSavePlan}
          onCancel={() => setShowCreatePlan(false)}
          weekOf={thisWeekMon}
          simDate={simDate}
        />
      )}
      {showCreatePost && (
        <PostDailyStandupForm
          existingPlans={allPlans.filter(p => p.weekOf === thisWeekMon)}
          existingPosts={allPosts}
          onSave={handleSavePost}
          onCancel={() => setShowCreatePost(false)}
          simDate={simDate}
          weekOf={thisWeekMon}
        />
      )}

      {/* ─── Objective Alignment This Week (mini bar) ─── */}
      <div style={{ display: "flex", gap: 16 }}>
        {pulse.byObjective.map(obj => (
          <div key={obj.id} style={{ flex: 1, background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: obj.color }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: T.text }}>{obj.label}</span>
              <span style={{ fontSize: 10, color: T.textDim, marginLeft: "auto" }}>{obj.done}/{obj.total}</span>
            </div>
            <div style={{ height: 5, background: T.bg0, borderRadius: 3, overflow: "hidden" }}>
              <div style={{ width: `${obj.pct}%`, height: "100%", background: obj.color, borderRadius: 3, transition: "width .4s" }} />
            </div>
          </div>
        ))}
      </div>

      {/* ─── DAILY FEED VIEW ─── */}
      {feedView === "daily" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <SectionHeader sub="What executives worked on yesterday and plan for today">
            Daily Standup Feed
          </SectionHeader>

          {postsByDate.map(([date, posts]) => (
            <div key={date}>
              <div style={{
                fontSize: 11, fontWeight: 700, color: T.accent, textTransform: "uppercase",
                letterSpacing: .8, padding: "8px 0", borderBottom: `1px solid ${T.border}`, marginBottom: 10,
              }}>
                {fmtDate(date)} {date === simDate && <span style={{ color: T.green, fontWeight: 600, fontSize: 9, background: T.green + "15", padding: "1px 6px", borderRadius: 4, marginLeft: 6 }}>TODAY</span>}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {posts.map(post => {
                  const info = getExecInfo(post.executive);
                  const yesterdayPct = post.yesterdayUpdate.planned > 0
                    ? Math.round((post.yesterdayUpdate.completed / post.yesterdayUpdate.planned) * 100)
                    : null;

                  return (
                    <div key={post.id} style={{
                      background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 10,
                      borderLeft: `3px solid ${info.color}`, padding: "14px 18px",
                    }}>
                      {/* Post header */}
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                        <ExecAvatar exec={post.executive} size={30} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{info.name}</div>
                          <div style={{ fontSize: 10, color: T.textDim }}>{info.key} · {fmtTime(post.postedAt)}</div>
                        </div>
                        {yesterdayPct !== null && (
                          <div style={{
                            fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 12,
                            background: yesterdayPct >= 80 ? T.green + "15" : yesterdayPct >= 50 ? T.warn + "15" : T.danger + "15",
                            color: yesterdayPct >= 80 ? T.green : yesterdayPct >= 50 ? T.warn : T.danger,
                          }}>
                            Yesterday: {post.yesterdayUpdate.completed}/{post.yesterdayUpdate.planned}
                          </div>
                        )}
                      </div>

                      {/* Yesterday update (if tasks exist) */}
                      {post.yesterdayUpdate.tasks.length > 0 && (
                        <div style={{ marginBottom: 12 }}>
                          <div style={{ fontSize: 9, color: T.textDim, textTransform: "uppercase", letterSpacing: .8, fontWeight: 600, marginBottom: 6 }}>Yesterday</div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                            {post.yesterdayUpdate.tasks.map((t, i) => (
                              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 8px", background: T.bg0, borderRadius: 5 }}>
                                <span style={{
                                  fontSize: 11, color: t.status === "done" ? T.green : t.status === "partial" ? T.warn : T.textDim,
                                }}>
                                  {t.status === "done" ? "✓" : t.status === "partial" ? "◐" : "○"}
                                </span>
                                <span style={{
                                  fontSize: 12, color: t.status === "done" ? T.textMid : T.text, flex: 1,
                                  textDecoration: t.status === "done" ? "line-through" : "none",
                                  opacity: t.status === "done" ? 0.7 : 1,
                                }}>
                                  {t.task}
                                </span>
                                <ObjPill tagId={t.objectiveTag} />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Today plan — interactive: click to toggle, edit mode available */}
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                          <div style={{ fontSize: 9, color: T.teal, textTransform: "uppercase", letterSpacing: .8, fontWeight: 600 }}>Today's Plan</div>
                          <span style={{ fontSize: 9, color: T.textDim, fontStyle: "italic" }}>(click to check off)</span>
                          <button
                            onClick={() => { setEditingPostId(editingPostId === post.id ? null : post.id); setEditingTaskId(null); setInlineTaskText(""); setInlineTaskObj(""); }}
                            style={{
                              marginLeft: "auto", background: "none", border: `1px solid ${editingPostId === post.id ? T.accent : T.border}`,
                              borderRadius: 4, padding: "2px 8px", cursor: "pointer",
                              fontSize: 9, fontWeight: 600, color: editingPostId === post.id ? T.accent : T.textDim,
                            }}
                          >
                            {editingPostId === post.id ? "Done Editing" : "Edit"}
                          </button>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                          {post.todayPlan.map((t, i) => {
                            const tStatus = t._status || "planned";
                            const isEditing = editingPostId === post.id && editingTaskId === `post-${post.id}-${i}`;
                            return (
                              <div key={i} style={{
                                display: "flex", alignItems: "center", gap: 8, padding: "4px 8px",
                                background: tStatus === "done" ? T.green + "06" : T.bg0,
                                borderRadius: 5,
                                border: `1px solid ${tStatus === "done" ? T.green + "20" : T.border}`,
                                cursor: editingPostId === post.id ? "default" : "pointer",
                                transition: "all .15s",
                              }}
                                onClick={() => { if (editingPostId !== post.id) togglePostTodayTask(post.id, i); }}
                              >
                                <span style={{
                                  fontSize: 12, flexShrink: 0,
                                  color: tStatus === "done" ? T.green : tStatus === "partial" ? T.warn : T.textDim,
                                }}>
                                  {tStatus === "done" ? "✓" : tStatus === "partial" ? "◐" : "○"}
                                </span>
                                {isEditing ? (
                                  <input
                                    autoFocus
                                    value={editingTaskText}
                                    onChange={e => setEditingTaskText(e.target.value)}
                                    onKeyDown={e => { if (e.key === "Enter") commitPostTaskEdit(post.id, i, editingTaskText); if (e.key === "Escape") { setEditingTaskId(null); setEditingTaskText(""); } }}
                                    onBlur={() => commitPostTaskEdit(post.id, i, editingTaskText)}
                                    onClick={e => e.stopPropagation()}
                                    style={{
                                      flex: 1, fontSize: 12, padding: "2px 6px", border: `1px solid ${T.accent}`,
                                      borderRadius: 4, background: T.bg2, color: T.text, outline: "none", fontFamily: "inherit",
                                    }}
                                  />
                                ) : (
                                  <span style={{
                                    fontSize: 12, flex: 1,
                                    color: tStatus === "done" ? T.textMid : T.text,
                                    textDecoration: tStatus === "done" ? "line-through" : "none",
                                    opacity: tStatus === "done" ? 0.7 : 1,
                                  }}
                                    onDoubleClick={(e) => { if (editingPostId === post.id) { e.stopPropagation(); setEditingTaskId(`post-${post.id}-${i}`); setEditingTaskText(t.task); } }}
                                  >
                                    {t.task}
                                  </span>
                                )}
                                <SourceBadge source={t.source} />
                                <ObjPill tagId={t.objectiveTag} />
                                {editingPostId === post.id && !isEditing && (
                                  <>
                                    <button onClick={(e) => { e.stopPropagation(); setEditingTaskId(`post-${post.id}-${i}`); setEditingTaskText(t.task); }} style={{
                                      background: "none", border: "none", color: T.blue, cursor: "pointer", fontSize: 10, padding: "2px 4px",
                                    }}>✎</button>
                                    <button onClick={(e) => { e.stopPropagation(); removePostTodayTask(post.id, i); }} style={{
                                      background: "none", border: "none", color: T.danger, cursor: "pointer", fontSize: 11, padding: "2px 4px", opacity: 0.7,
                                    }}>×</button>
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Inline add task (edit mode only) */}
                        {editingPostId === post.id && (
                          <div style={{ display: "flex", gap: 6, marginTop: 6, alignItems: "center" }}>
                            <input
                              value={inlineTaskText}
                              onChange={e => setInlineTaskText(e.target.value)}
                              onKeyDown={e => { if (e.key === "Enter") { addPostTodayTask(post.id, inlineTaskText, inlineTaskObj); setInlineTaskText(""); setInlineTaskObj(""); } }}
                              placeholder="Add a task..."
                              style={{
                                flex: 1, padding: "6px 10px", borderRadius: 5, border: `1px solid ${T.border}`,
                                background: T.bg0, color: T.text, fontSize: 11, outline: "none", fontFamily: "inherit",
                              }}
                            />
                            <select value={inlineTaskObj} onChange={e => setInlineTaskObj(e.target.value)} style={{
                              padding: "6px 8px", borderRadius: 5, border: `1px solid ${T.border}`,
                              background: T.bg0, color: T.textMid, fontSize: 10, outline: "none", fontFamily: "inherit", cursor: "pointer",
                            }}>
                              <option value="">No obj</option>
                              {OBJECTIVE_TAGS.map(o => <option key={o.id} value={o.id}>{o.short}</option>)}
                            </select>
                            <button onClick={() => { addPostTodayTask(post.id, inlineTaskText, inlineTaskObj); setInlineTaskText(""); setInlineTaskObj(""); }} style={{
                              padding: "6px 10px", borderRadius: 5, border: "none", background: T.teal, color: "#1A1A1A",
                              fontSize: 10, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
                            }}>+ Add</button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {postsByDate.length === 0 && (
            <div style={{ textAlign: "center", padding: 40, color: T.textDim, fontSize: 12 }}>No daily posts match the current filter.</div>
          )}
        </div>
      )}

      {/* ─── WEEKLY PLANS VIEW ─── */}
      {feedView === "weekly" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <SectionHeader sub={`${weekView === "current" ? "Feb 24–28" : "Feb 17–21"} — what each executive committed to completing`}>
            Weekly Plans {weekView === "current" ? "(This Week)" : "(Last Week)"}
          </SectionHeader>

          {filteredPlans.map(plan => {
            const info = getExecInfo(plan.executive);
            const done = plan.tasks.filter(t => t.status === "done").length;
            const partial = plan.tasks.filter(t => t.status === "partial").length;
            const total = plan.tasks.length;
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
            const aligned = plan.tasks.filter(t => t.objectiveTag !== null).length;
            const alignPct = total > 0 ? Math.round((aligned / total) * 100) : 0;

            return (
              <div key={plan.id} style={{
                background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 10,
                borderLeft: `3px solid ${info.color}`, overflow: "hidden",
              }}>
                {/* Plan header */}
                <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
                  <ExecAvatar exec={plan.executive} size={34} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{info.name}</div>
                    <div style={{ fontSize: 10, color: T.textDim }}>{info.key} · Posted {new Date(plan.postedAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</div>
                  </div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: pct >= 80 ? T.green : pct >= 40 ? T.accent : T.textDim }}>{pct}%</div>
                      <div style={{ fontSize: 9, color: T.textDim }}>DONE</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: focusColor(alignPct) }}>{alignPct}%</div>
                      <div style={{ fontSize: 9, color: T.textDim }}>ALIGNED</div>
                    </div>
                    <button
                      onClick={() => { setEditingPlanId(editingPlanId === plan.id ? null : plan.id); setEditingTaskId(null); setInlineTaskText(""); setInlineTaskObj(""); }}
                      style={{
                        background: "none", border: `1px solid ${editingPlanId === plan.id ? T.teal : T.border}`,
                        borderRadius: 5, padding: "4px 10px", cursor: "pointer",
                        fontSize: 10, fontWeight: 600, color: editingPlanId === plan.id ? T.teal : T.textDim,
                        marginLeft: 4, transition: "all .15s",
                      }}
                    >
                      {editingPlanId === plan.id ? "Done" : "Edit"}
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ height: 4, background: T.bg0 }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: pct >= 80 ? T.green : T.accent, transition: "width .4s" }} />
                </div>

                {/* Task list — clickable to toggle status */}
                <div style={{ padding: "10px 18px 14px" }}>
                  {editingPlanId !== plan.id && (
                    <div style={{ fontSize: 9, color: T.textDim, fontStyle: "italic", marginBottom: 6 }}>Click tasks to check off</div>
                  )}
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {plan.tasks.map(t => {
                      const isEditing = editingPlanId === plan.id && editingTaskId === `plan-${plan.id}-${t.id}`;
                      return (
                        <div key={t.id} style={{
                          display: "flex", alignItems: "center", gap: 8, padding: "6px 10px",
                          background: t.status === "done" ? T.green + "06" : T.bg0,
                          border: `1px solid ${t.status === "done" ? T.green + "20" : T.border}`,
                          borderRadius: 6,
                          cursor: editingPlanId === plan.id ? "default" : "pointer",
                          transition: "all .15s",
                        }}
                          onClick={() => { if (editingPlanId !== plan.id) togglePlanTaskStatus(plan.id, t.id); }}
                        >
                          <span style={{
                            fontSize: 12, flexShrink: 0,
                            color: t.status === "done" ? T.green : t.status === "partial" ? T.warn : T.textDim,
                          }}>
                            {t.status === "done" ? "✓" : t.status === "partial" ? "◐" : "○"}
                          </span>
                          {isEditing ? (
                            <input
                              autoFocus
                              value={editingTaskText}
                              onChange={e => setEditingTaskText(e.target.value)}
                              onKeyDown={e => { if (e.key === "Enter") commitPlanTaskEdit(plan.id, t.id, editingTaskText); if (e.key === "Escape") { setEditingTaskId(null); setEditingTaskText(""); } }}
                              onBlur={() => commitPlanTaskEdit(plan.id, t.id, editingTaskText)}
                              onClick={e => e.stopPropagation()}
                              style={{
                                flex: 1, fontSize: 12, padding: "2px 6px", border: `1px solid ${T.teal}`,
                                borderRadius: 4, background: T.bg2, color: T.text, outline: "none", fontFamily: "inherit",
                              }}
                            />
                          ) : (
                            <span style={{
                              fontSize: 12, flex: 1,
                              color: t.status === "done" ? T.textMid : T.text,
                              textDecoration: t.status === "done" ? "line-through" : "none",
                              opacity: t.status === "done" ? 0.7 : 1,
                            }}
                              onDoubleClick={(e) => { if (editingPlanId === plan.id) { e.stopPropagation(); setEditingTaskId(`plan-${plan.id}-${t.id}`); setEditingTaskText(t.task); } }}
                            >
                              {t.task}
                            </span>
                          )}
                          <SourceBadge source={t.source} />
                          <ObjPill tagId={t.objectiveTag} />
                          {editingPlanId === plan.id && !isEditing && (
                            <>
                              <button onClick={(e) => { e.stopPropagation(); togglePlanTaskStatus(plan.id, t.id); }} style={{
                                background: "none", border: `1px solid ${t.status === "done" ? T.warn : T.green}30`,
                                borderRadius: 4, padding: "2px 6px", cursor: "pointer",
                                fontSize: 9, fontWeight: 600, color: t.status === "done" ? T.warn : T.green,
                              }}>
                                {t.status === "done" ? "undo" : t.status === "partial" ? "done" : "done"}
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); setEditingTaskId(`plan-${plan.id}-${t.id}`); setEditingTaskText(t.task); }} style={{
                                background: "none", border: "none", color: T.blue, cursor: "pointer", fontSize: 10, padding: "2px 4px",
                              }}>✎</button>
                              <button onClick={(e) => { e.stopPropagation(); removePlanTask(plan.id, t.id); }} style={{
                                background: "none", border: "none", color: T.danger, cursor: "pointer", fontSize: 11, padding: "2px 4px", opacity: 0.7,
                              }}>×</button>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Inline add task (edit mode only) */}
                  {editingPlanId === plan.id && (
                    <div style={{ display: "flex", gap: 6, marginTop: 8, alignItems: "center" }}>
                      <input
                        value={inlineTaskText}
                        onChange={e => setInlineTaskText(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") { addPlanTask(plan.id, inlineTaskText, inlineTaskObj); setInlineTaskText(""); setInlineTaskObj(""); } }}
                        placeholder="Add a task..."
                        style={{
                          flex: 1, padding: "6px 10px", borderRadius: 5, border: `1px solid ${T.border}`,
                          background: T.bg0, color: T.text, fontSize: 11, outline: "none", fontFamily: "inherit",
                        }}
                      />
                      <select value={inlineTaskObj} onChange={e => setInlineTaskObj(e.target.value)} style={{
                        padding: "6px 8px", borderRadius: 5, border: `1px solid ${T.border}`,
                        background: T.bg0, color: T.textMid, fontSize: 10, outline: "none", fontFamily: "inherit", cursor: "pointer",
                      }}>
                        <option value="">No obj</option>
                        {OBJECTIVE_TAGS.map(o => <option key={o.id} value={o.id}>{o.short}</option>)}
                      </select>
                      <button onClick={() => { addPlanTask(plan.id, inlineTaskText, inlineTaskObj); setInlineTaskText(""); setInlineTaskObj(""); }} style={{
                        padding: "6px 10px", borderRadius: 5, border: "none", background: T.teal, color: "#1A1A1A",
                        fontSize: 10, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
                      }}>+ Add</button>
                    </div>
                  )}

                  {/* Per-objective mini summary */}
                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    {OBJECTIVE_TAGS.map(obj => {
                      const objTasks = plan.tasks.filter(t => t.objectiveTag === obj.id);
                      if (objTasks.length === 0) return null;
                      const objDone = objTasks.filter(t => t.status === "done").length;
                      return (
                        <div key={obj.id} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: T.textDim }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: obj.color }} />
                          <span>{obj.short}: {objDone}/{objTasks.length}</span>
                        </div>
                      );
                    })}
                    {(() => {
                      const unaligned = plan.tasks.filter(t => t.objectiveTag === null);
                      if (unaligned.length === 0) return null;
                      const uDone = unaligned.filter(t => t.status === "done").length;
                      return (
                        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: T.textDim, fontStyle: "italic" }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.textDim }} />
                          Other: {uDone}/{unaligned.length}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredPlans.length === 0 && (
            <div style={{ textAlign: "center", padding: 40, color: T.textDim, fontSize: 12 }}>No weekly plans match the current filter.</div>
          )}
        </div>
      )}
    </div>
  );
};


// ═══════════════════════════════════════════════════════════════════
//  MAIN VIEW — Tabbed: Focus Tracker | Weekly Pulse | Meetings
// ═══════════════════════════════════════════════════════════════════

export const FocusTrackerView = () => {
  const [topTab, setTopTab] = useState("focus");

  const topTabs = [
    { key: "focus", label: "Focus Tracker" },
    { key: "pulse", label: "Weekly Pulse" },
    { key: "journal", label: "Journal" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ─── Header ─── */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: T.accent,
            background: T.accentDim, padding: "4px 12px", borderRadius: 6,
            textTransform: "uppercase", letterSpacing: 1,
          }}>
            Executive Focus
          </div>
        </div>
        <div style={{ fontSize: 12, color: T.textMid, marginTop: 4 }}>
          Executive alignment to company objectives, meetings, and action tracking.
        </div>
      </div>

      {/* ─── Top Tabs ─── */}
      <TabBar tabs={topTabs} active={topTab} onChange={setTopTab} />

      {/* ─── Tab Content ─── */}
      {topTab === "focus" && <FocusTrackerContent />}
      {topTab === "pulse" && <WeeklyPulseView />}
      {topTab === "journal" && <JournalView />}
    </div>
  );
};
