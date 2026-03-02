import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { T } from "@core/theme/theme";

export const Card = ({ children, title, titleColor = T.accent, action, style: s }) => (
  <div style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, ...s }}>
    {(title || action) && <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
      {title && <h4 style={{ margin: 0, fontSize: 13, color: titleColor, letterSpacing: .5 }}>{title}</h4>}
      {action}
    </div>}
    {children}
  </div>
);

export const TabBar = ({ tabs, active, onChange }) => {
  const containerRef = useRef(null);
  const [pillStyle, setPillStyle] = useState({ width: 0, left: 0 });

  const updatePill = useCallback(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const activeIndex = tabs.findIndex(t => t.key === active);
    if (activeIndex === -1) return;
    const buttons = container.querySelectorAll("[data-tab-button]");
    const btn = buttons[activeIndex];
    if (!btn) return;
    const containerRect = container.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    setPillStyle({ width: btnRect.width, left: btnRect.left - containerRect.left });
  }, [active, tabs]);

  useEffect(() => {
    requestAnimationFrame(updatePill);
    window.addEventListener("resize", updatePill);
    return () => window.removeEventListener("resize", updatePill);
  }, [updatePill]);

  return (
    <div ref={containerRef} style={{ display: "flex", position: "relative", background: T.bg1, borderRadius: 10, padding: 4, width: "fit-content", border: `1px solid ${T.border}` }}>
      {/* Sliding pill — orange border outline style */}
      <div style={{
        position: "absolute", top: 4, left: pillStyle.left, width: pillStyle.width,
        height: "calc(100% - 8px)", background: T.accentDim, border: `1.5px solid ${T.accent}`,
        borderRadius: 8,
        transition: "left 0.25s cubic-bezier(0.4,0,0.2,1), width 0.25s cubic-bezier(0.4,0,0.2,1)", zIndex: 0,
      }} />
      {tabs.map((t) => (
        <button key={t.key} data-tab-button onClick={() => onChange(t.key)} style={{
          padding: "8px 20px", borderRadius: 8, border: "none", cursor: "pointer",
          fontSize: 12, fontWeight: 600, background: "transparent",
          color: active === t.key ? T.text : T.textMid,
          position: "relative", zIndex: 1, transition: "color 0.2s ease",
        }}>{t.label}</button>
      ))}
    </div>
  );
};

export const DataTable = ({ columns, rows, onRowClick, compact }) => {
  // Support both simple (string[] columns, array[] rows) and object ({ key, header, render }[] columns, object[] rows) formats
  const isObjectColumns = columns.length > 0 && typeof columns[0] === "object" && columns[0] !== null && !Array.isArray(columns[0]) && "key" in columns[0];

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: compact ? 12 : 13 }}>
        <thead><tr>{columns.map((c, i) => (
          <th key={i} style={{ textAlign: "left", padding: compact ? "8px 10px" : "10px 14px", color: T.textDim, fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: .8, borderBottom: `1px solid ${T.border}` }}>
            {isObjectColumns ? c.header : c}
          </th>
        ))}</tr></thead>
        <tbody>{rows.map((r, i) => (
          <tr key={i} onClick={() => onRowClick?.(r, i)} style={{ cursor: onRowClick ? "pointer" : "default" }} onMouseEnter={e => e.currentTarget.style.background = T.bg3} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            {isObjectColumns
              ? columns.map((col, j) => {
                  const val = r[col.key];
                  return <td key={j} style={{ padding: compact ? "8px 10px" : "12px 14px", borderBottom: `1px solid ${T.border}`, color: T.text }}>{col.render ? col.render(val, r) : val}</td>;
                })
              : r.map((cell, j) => <td key={j} style={{ padding: compact ? "8px 10px" : "12px 14px", borderBottom: `1px solid ${T.border}`, color: T.text }}>{cell}</td>)
            }
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
};

export const BarChart = ({ data, maxH = 140, targetLine, thresholdLine }) => {
  const max = Math.max(...data.map(d => Math.max(d.actual || 0, d.budget || 0)), targetLine || 0, thresholdLine || 0);
  const barAreaH = maxH - 24;
  return (
    <div style={{ position: "relative", height: maxH }}>
      {/* Target line */}
      {targetLine != null && max > 0 && (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 24 + (targetLine / max) * barAreaH, height: 0, borderTop: `2px dashed ${T.green}`, opacity: 0.7, zIndex: 1 }}>
          <span style={{ position: "absolute", right: 0, top: -14, fontSize: 9, color: T.green, fontWeight: 600 }}>Target</span>
        </div>
      )}
      {/* Threshold / fail line */}
      {thresholdLine != null && max > 0 && (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 24 + (thresholdLine / max) * barAreaH, height: 0, borderTop: `2px dashed ${T.danger}`, opacity: 0.6, zIndex: 1 }}>
          <span style={{ position: "absolute", right: 0, top: -14, fontSize: 9, color: T.danger, fontWeight: 600 }}>Fail</span>
        </div>
      )}
      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: maxH, position: "relative", zIndex: 2 }}>
        {data.map((d, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1 }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: barAreaH }}>
              <div style={{ width: 14, height: Math.max(4, (d.budget / max) * (barAreaH - 20)), background: T.textDim + "35", borderRadius: 3 }} />
              <div style={{ width: 14, height: Math.max(4, ((d.actual || 0) / max) * (barAreaH - 20)), background: (d.actual || 0) >= d.budget ? T.accent : T.danger, borderRadius: 3 }} />
            </div>
            <span style={{ fontSize: 10, color: T.textDim }}>{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const MetricGrid = ({ metrics }) => (
  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 10 }}>
    {metrics.map((m, i) => (
      <div key={i} style={{ background: T.bg0, borderRadius: 8, padding: "12px 14px" }}>
        <div style={{ fontSize: 10, color: T.textDim, textTransform: "uppercase", letterSpacing: .8, marginBottom: 4 }}>{m.label}</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: T.text }}>{m.value}</div>
        {m.sub && <div style={{ fontSize: 11, color: T.textMid, marginTop: 2 }}>{m.sub}</div>}
      </div>
    ))}
  </div>
);

export const SectionHeader = ({ children, sub }) => (
  <div style={{ marginBottom: 4 }}>
    <h3 style={{ margin: 0, fontSize: 13, color: T.textDim, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>{children}</h3>
    {sub && <div style={{ fontSize: 11, color: T.textDim, marginTop: 2 }}>{sub}</div>}
  </div>
);

export const StyledSelect = ({ value, onChange, options, style: s, minWidth = 160 }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = options.find(o => o.value === value);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", minWidth, ...s }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 8, padding: "7px 12px", borderRadius: 8, cursor: "pointer",
          background: T.bg1, border: `1px solid ${open ? T.accent : T.border}`,
          color: T.text, fontSize: 12, fontWeight: 600, fontFamily: "inherit",
          transition: "border-color 0.2s",
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selected?.label ?? value}</span>
        <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={T.textMid} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}><path d="M6 9l6 6 6-6" /></svg>
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 50,
          background: T.bg1, border: `1px solid ${T.border}`, borderRadius: 8,
          boxShadow: "0 8px 24px rgba(0,0,0,.45)", maxHeight: 220, overflowY: "auto",
          padding: 4,
        }}>
          {options.map(o => (
            <div
              key={o.value}
              onClick={() => { onChange(o.value); setOpen(false); }}
              style={{
                padding: "8px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12,
                fontWeight: o.value === value ? 600 : 400,
                color: o.value === value ? T.text : T.textMid,
                background: o.value === value ? T.accentDim : "transparent",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => { if (o.value !== value) e.currentTarget.style.background = T.bg3; }}
              onMouseLeave={e => { if (o.value !== value) e.currentTarget.style.background = "transparent"; }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {o.value === value && <div style={{ width: 4, height: 4, borderRadius: "50%", background: T.accent }} />}
                {o.label}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


// ═══════════════════════════════════════════════════════════════════
//  DRAGGABLE GRID — reorderable section layout with lock/unlock
// ═══════════════════════════════════════════════════════════════════

const DragHandle = () => (
  <svg width={14} height={14} viewBox="0 0 14 14" fill={T.textDim} style={{ flexShrink: 0 }}>
    <circle cx="4" cy="2.5" r="1.3" /><circle cx="10" cy="2.5" r="1.3" />
    <circle cx="4" cy="7" r="1.3" /><circle cx="10" cy="7" r="1.3" />
    <circle cx="4" cy="11.5" r="1.3" /><circle cx="10" cy="11.5" r="1.3" />
  </svg>
);

const LockIcon = ({ locked }) => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    {locked ? (
      <>
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </>
    ) : (
      <>
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 9.9-1" />
      </>
    )}
  </svg>
);

const ResetIcon = () => (
  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1 4 1 10 7 10" />
    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
  </svg>
);

export const DraggableGrid = ({ widgets, storageKey = "sens-layout", gap = 24, locked: externalLocked, onLockedChange }) => {
  const defaultOrder = useMemo(() => widgets.map(w => w.id), [widgets]);

  // Load saved order from localStorage
  const [order, setOrder] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Validate: must contain exactly the same IDs
        if (Array.isArray(parsed) && parsed.length === defaultOrder.length &&
            defaultOrder.every(id => parsed.includes(id))) {
          return parsed;
        }
      }
    } catch (e) { /* ignore */ }
    return defaultOrder;
  });

  // Support both controlled (external) and uncontrolled (internal) lock state
  const [internalLocked, setInternalLocked] = useState(true);
  const locked = externalLocked !== undefined ? externalLocked : internalLocked;
  const setLocked = onLockedChange || setInternalLocked;
  const [dragId, setDragId] = useState(null);
  const [dropTarget, setDropTarget] = useState(null); // index to insert before
  const dragRef = useRef(null);

  // Persist order
  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(order)); } catch (e) { /* ignore */ }
  }, [order, storageKey]);

  // Sync if widgets change
  useEffect(() => {
    const currentIds = new Set(order);
    const widgetIds = new Set(defaultOrder);
    if (defaultOrder.length !== order.length || !defaultOrder.every(id => currentIds.has(id))) {
      setOrder(defaultOrder);
    }
  }, [defaultOrder]);

  const orderedWidgets = useMemo(() => {
    const widgetMap = {};
    widgets.forEach(w => { widgetMap[w.id] = w; });
    return order.map(id => widgetMap[id]).filter(Boolean);
  }, [order, widgets]);

  const handleDragStart = (e, id) => {
    if (locked) return;
    setDragId(id);
    dragRef.current = id;
    e.dataTransfer.effectAllowed = "move";
    // Make the ghost semi-transparent
    requestAnimationFrame(() => {
      const el = document.querySelector(`[data-grid-id="${id}"]`);
      if (el) el.style.opacity = "0.4";
    });
  };

  const handleDragOver = (e, idx) => {
    if (locked || !dragRef.current) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropTarget(idx);
  };

  const handleDragEnd = () => {
    if (dragRef.current) {
      const el = document.querySelector(`[data-grid-id="${dragRef.current}"]`);
      if (el) el.style.opacity = "1";
    }

    if (dragId != null && dropTarget != null) {
      setOrder(prev => {
        const next = prev.filter(id => id !== dragId);
        // Adjust index since we removed an item
        const fromIdx = prev.indexOf(dragId);
        let toIdx = dropTarget;
        if (fromIdx < dropTarget) toIdx = Math.max(0, toIdx - 1);
        next.splice(toIdx, 0, dragId);
        return next;
      });
    }

    setDragId(null);
    setDropTarget(null);
    dragRef.current = null;
  };

  const handleReset = () => {
    setOrder(defaultOrder);
    try { localStorage.removeItem(storageKey); } catch (e) { /* ignore */ }
  };

  const isDefault = order.every((id, i) => id === defaultOrder[i]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap }}>
      {/* Controls row */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
        {!locked && !isDefault && (
          <button onClick={handleReset} style={{
            display: "flex", alignItems: "center", gap: 5, padding: "5px 10px",
            borderRadius: 6, border: `1px solid ${T.border}`, background: T.bg0,
            color: T.textDim, fontSize: 10, fontWeight: 600, cursor: "pointer",
            transition: "all .15s",
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.color = T.accent; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textDim; }}
          >
            <ResetIcon /> Reset Layout
          </button>
        )}
        <button onClick={() => setLocked(!locked)} style={{
          display: "flex", alignItems: "center", gap: 5, padding: "5px 10px",
          borderRadius: 6, border: `1px solid ${locked ? T.border : T.accent}`,
          background: locked ? T.bg0 : T.accent + "18",
          color: locked ? T.textDim : T.accent,
          fontSize: 10, fontWeight: 600, cursor: "pointer", transition: "all .15s",
        }}>
          <LockIcon locked={locked} />
          {locked ? "Unlock Layout" : "Lock Layout"}
        </button>
      </div>

      {/* Grid items */}
      {orderedWidgets.map((w, idx) => (
        <div key={w.id}>
          {/* Drop indicator line */}
          {!locked && dropTarget === idx && dragId !== w.id && (
            <div style={{
              height: 3, background: T.accent, borderRadius: 2,
              marginBottom: gap / 2, boxShadow: `0 0 8px ${T.accent}40`,
              transition: "all .15s",
            }} />
          )}

          <div
            data-grid-id={w.id}
            draggable={!locked}
            onDragStart={(e) => handleDragStart(e, w.id)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDragEnd={handleDragEnd}
            style={{
              position: "relative",
              border: !locked ? `1px dashed ${T.borderLight}` : "1px solid transparent",
              borderRadius: !locked ? 12 : 0,
              padding: !locked ? 4 : 0,
              cursor: !locked ? "grab" : "default",
              transition: "border .2s, padding .2s, opacity .2s",
              opacity: dragId === w.id ? 0.4 : 1,
            }}
          >
            {/* Drag handle + label overlay */}
            {!locked && (
              <div style={{
                position: "absolute", top: -1, left: 12, zIndex: 2,
                display: "flex", alignItems: "center", gap: 6,
                padding: "3px 10px 3px 6px", borderRadius: "0 0 8px 8px",
                background: T.bg3, border: `1px solid ${T.borderLight}`, borderTop: "none",
                opacity: 0.85, transition: "opacity .15s",
              }}>
                <DragHandle />
                <span style={{ fontSize: 9, fontWeight: 600, color: T.textDim, textTransform: "uppercase", letterSpacing: .5 }}>
                  {w.label}
                </span>
              </div>
            )}

            {w.render()}
          </div>

          {/* Final drop zone (after last item) */}
          {!locked && idx === orderedWidgets.length - 1 && (
            <div
              onDragOver={(e) => handleDragOver(e, idx + 1)}
              style={{ height: 24 }}
            >
              {dropTarget === idx + 1 && dragId !== w.id && (
                <div style={{
                  height: 3, background: T.accent, borderRadius: 2,
                  marginTop: gap / 2, boxShadow: `0 0 8px ${T.accent}40`,
                }} />
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};


// ═══════════════════════════════════════════════════════════════════
//  DRAGGABLE CARD ROW — reorderable cards within a flex/grid row
// ═══════════════════════════════════════════════════════════════════

const SmallDragHandle = () => (
  <svg width={10} height={10} viewBox="0 0 14 14" fill={T.textDim} style={{ flexShrink: 0 }}>
    <circle cx="4" cy="3" r="1.2" /><circle cx="10" cy="3" r="1.2" />
    <circle cx="4" cy="7" r="1.2" /><circle cx="10" cy="7" r="1.2" />
    <circle cx="4" cy="11" r="1.2" /><circle cx="10" cy="11" r="1.2" />
  </svg>
);

export const DraggableCardRow = ({ items, locked, storageKey, display = "flex", gridColumns, gap = 14, renderItem }) => {
  const defaultOrder = useMemo(() => items.map(item => item.id), [items]);

  const [order, setOrder] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === defaultOrder.length &&
            defaultOrder.every(id => parsed.includes(id))) {
          return parsed;
        }
      }
    } catch (e) { /* ignore */ }
    return defaultOrder;
  });

  const [dragId, setDragId] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const dragRef = useRef(null);

  // Persist order
  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(order)); } catch (e) { /* ignore */ }
  }, [order, storageKey]);

  // Sync if items change
  useEffect(() => {
    const currentIds = new Set(order);
    if (defaultOrder.length !== order.length || !defaultOrder.every(id => currentIds.has(id))) {
      setOrder(defaultOrder);
    }
  }, [defaultOrder]);

  const orderedItems = useMemo(() => {
    const itemMap = {};
    items.forEach(item => { itemMap[item.id] = item; });
    return order.map(id => itemMap[id]).filter(Boolean);
  }, [order, items]);

  const handleDragStart = (e, id) => {
    if (locked) return;
    e.stopPropagation(); // Prevent section-level drag
    setDragId(id);
    dragRef.current = id;
    e.dataTransfer.effectAllowed = "move";
    requestAnimationFrame(() => {
      const el = document.querySelector(`[data-card-id="${storageKey}-${id}"]`);
      if (el) el.style.opacity = "0.4";
    });
  };

  const handleDragOver = (e, idx) => {
    if (locked || !dragRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    setDropTarget(idx);
  };

  const handleDragEnd = (e) => {
    if (e) e.stopPropagation();
    if (dragRef.current) {
      const el = document.querySelector(`[data-card-id="${storageKey}-${dragRef.current}"]`);
      if (el) el.style.opacity = "1";
    }

    if (dragId != null && dropTarget != null) {
      setOrder(prev => {
        const next = prev.filter(id => id !== dragId);
        const fromIdx = prev.indexOf(dragId);
        let toIdx = dropTarget;
        if (fromIdx < dropTarget) toIdx = Math.max(0, toIdx - 1);
        next.splice(toIdx, 0, dragId);
        return next;
      });
    }

    setDragId(null);
    setDropTarget(null);
    dragRef.current = null;
  };

  const containerStyle = display === "grid" ? {
    display: "grid",
    gridTemplateColumns: gridColumns || `repeat(${items.length}, 1fr)`,
    gap,
  } : {
    display: "flex",
    gap,
    flexWrap: "wrap",
  };

  return (
    <div style={containerStyle}>
      {orderedItems.map((item, idx) => (
        <div key={item.id} style={{ display: "flex", position: "relative", flex: display === "flex" ? 1 : undefined, minWidth: 0 }}>
          {/* Drop indicator (vertical line before card) */}
          {!locked && dropTarget === idx && dragId !== item.id && (
            <div style={{
              width: 3, background: T.accent, borderRadius: 2,
              position: "absolute", top: 0, bottom: 0, left: -Math.floor(gap / 2) - 1,
              zIndex: 5, boxShadow: `0 0 8px ${T.accent}40`,
            }} />
          )}

          <div
            data-card-id={`${storageKey}-${item.id}`}
            draggable={!locked}
            onDragStart={(e) => handleDragStart(e, item.id)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDragEnd={handleDragEnd}
            style={{
              position: "relative", flex: 1, minWidth: 0,
              border: !locked ? `1px dashed ${T.borderLight}` : "1px solid transparent",
              borderRadius: !locked ? 10 : 0,
              padding: !locked ? 3 : 0,
              cursor: !locked ? "grab" : "default",
              transition: "border .2s, padding .2s, opacity .2s",
              opacity: dragId === item.id ? 0.4 : 1,
            }}
          >
            {/* Mini drag handle */}
            {!locked && (
              <div style={{
                position: "absolute", top: -1, left: 8, zIndex: 3,
                display: "flex", alignItems: "center", gap: 4,
                padding: "2px 6px 2px 4px", borderRadius: "0 0 6px 6px",
                background: T.bg3, border: `1px solid ${T.borderLight}`, borderTop: "none",
                opacity: 0.85,
              }}>
                <SmallDragHandle />
              </div>
            )}

            {renderItem ? renderItem(item) : item.render()}
          </div>

          {/* Final drop zone (after last item) */}
          {!locked && idx === orderedItems.length - 1 && (
            <div
              onDragOver={(e) => handleDragOver(e, idx + 1)}
              style={{ width: 12, flexShrink: 0 }}
            >
              {dropTarget === idx + 1 && dragId !== item.id && (
                <div style={{
                  width: 3, background: T.accent, borderRadius: 2,
                  position: "absolute", top: 0, bottom: 0, right: -Math.floor(gap / 2) - 1,
                  zIndex: 5, boxShadow: `0 0 8px ${T.accent}40`,
                }} />
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
