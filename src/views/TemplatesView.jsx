import { useState, useMemo } from "react";
import { T } from "../data/theme";
import { Card, TabBar, DataTable, MetricGrid, Progress, StatusPill, KpiCard, SectionHeader, CheckEngineLightPanel } from "../components/ui";
import { getAlertsForDept, getAllAlerts, severityColor, severityIcon } from "../data/alertData";
import { useSimDate } from "../contexts/SimDateContext";

// ═══════════════════════════════════════════════════════════════════
//  SAMPLE DATA — shared across templates for demonstration
// ═══════════════════════════════════════════════════════════════════

const SAMPLE_ITEMS = [
  { id: "ITEM-001", name: "Reactor Assembly A", category: "Manufacturing", status: "green", priority: "High", owner: "J. Martinez", progress: 87, value: "$1.2M", updated: "2026-02-28", description: "Primary reactor vessel assembly for Noble B expansion. On track for Q3 delivery." },
  { id: "ITEM-002", name: "Heat Exchanger Unit 4", category: "Manufacturing", status: "yellow", priority: "Medium", owner: "S. Chen", progress: 62, value: "$840K", updated: "2026-02-27", description: "Custom heat exchanger for Portland facility. Vendor delay on titanium tubing." },
  { id: "ITEM-003", name: "Site Permitting — Portland", category: "Regulatory", status: "red", priority: "Critical", owner: "L. Thompson", progress: 25, value: "$120K", updated: "2026-02-26", description: "Environmental impact assessment pending state review. 3-week delay expected." },
  { id: "ITEM-004", name: "Conveyor System v3", category: "Engineering", status: "green", priority: "Medium", owner: "R. Kim", progress: 94, value: "$560K", updated: "2026-02-28", description: "New conveyor design with improved throughput. Final testing phase." },
  { id: "ITEM-005", name: "Controls Software v4.0", category: "Engineering", status: "blue", priority: "High", owner: "A. Patel", progress: 45, value: "$280K", updated: "2026-02-25", description: "Major firmware upgrade for all TiPS processors. Beta testing at Richmond." },
  { id: "ITEM-006", name: "Noble B Civil Works", category: "Construction", status: "green", priority: "High", owner: "M. Davis", progress: 78, value: "$4.8M", updated: "2026-02-28", description: "Foundation and structural work on schedule. Concrete pour 90% complete." },
  { id: "ITEM-007", name: "Supply Agreement — Alcoa", category: "Commercial", status: "yellow", priority: "Medium", owner: "T. Wilson", progress: 55, value: "$12M", updated: "2026-02-24", description: "Long-term feedstock supply negotiation. Terms under legal review." },
  { id: "ITEM-008", name: "QA Certification — TiPs-010", category: "Quality", status: "blue", priority: "Low", owner: "K. Nguyen", progress: 15, value: "$45K", updated: "2026-02-23", description: "Pre-production quality certification. Awaiting fabrication milestones." },
  { id: "ITEM-009", name: "EPC Bid — Coal FL", category: "Commercial", status: "yellow", priority: "High", owner: "B. Roberts", progress: 30, value: "$22M", updated: "2026-02-27", description: "Three qualified bidders shortlisted. Technical evaluation in progress." },
  { id: "ITEM-010", name: "Safety Audit — Tucson", category: "HSE", status: "green", priority: "Low", owner: "D. Garcia", progress: 100, value: "$35K", updated: "2026-02-20", description: "Annual safety audit complete. Zero non-conformances. Exemplary rating." },
  { id: "ITEM-011", name: "Piping Layout Optimization", category: "Engineering", status: "green", priority: "Medium", owner: "R. Kim", progress: 72, value: "$180K", updated: "2026-02-26", description: "Reducing pressure drop across TiPS v3 piping layout. CFD analysis complete." },
  { id: "ITEM-012", name: "Workforce Onboarding — Q2", category: "HR", status: "blue", priority: "Medium", owner: "P. Anderson", progress: 20, value: "$95K", updated: "2026-02-22", description: "12 new technicians joining for Noble B ramp-up. Training program designed." },
];

const CATEGORIES = ["All", "Manufacturing", "Engineering", "Construction", "Commercial", "Regulatory", "Quality", "HSE", "HR"];
const PRIORITIES = ["All", "Critical", "High", "Medium", "Low"];

const statusColor = (s) => ({ green: T.green, yellow: T.warn, red: T.danger, blue: T.blue, purple: T.purple }[s] || T.textDim);
const priorityColor = (p) => ({ Critical: T.danger, High: T.accent, Medium: T.warn, Low: T.green }[p] || T.textDim);

// ═══════════════════════════════════════════════════════════════════
//  TEMPLATE 1 — KPI Dashboard + Tabbed Card List
//  Best for: Operational dashboards, status overviews
//  Pattern: Metric row → Tab filter → Card list
// ═══════════════════════════════════════════════════════════════════

export const Template1 = () => {
  const [tab, setTab] = useState("all");

  const tabs = [
    { key: "all", label: "All Items" },
    { key: "active", label: "Active" },
    { key: "watch", label: "Watch" },
    { key: "complete", label: "Complete" },
  ];

  const filtered = useMemo(() => {
    if (tab === "active") return SAMPLE_ITEMS.filter(i => i.status === "green" || i.status === "blue");
    if (tab === "watch") return SAMPLE_ITEMS.filter(i => i.status === "yellow" || i.status === "red");
    if (tab === "complete") return SAMPLE_ITEMS.filter(i => i.progress === 100);
    return SAMPLE_ITEMS;
  }, [tab]);

  const metrics = [
    { label: "Total Items", value: SAMPLE_ITEMS.length, sub: "across all categories" },
    { label: "On Track", value: SAMPLE_ITEMS.filter(i => i.status === "green").length, sub: `${((SAMPLE_ITEMS.filter(i => i.status === "green").length / SAMPLE_ITEMS.length) * 100).toFixed(0)}% of total` },
    { label: "Watch List", value: SAMPLE_ITEMS.filter(i => i.status === "yellow" || i.status === "red").length, sub: "requires attention" },
    { label: "Avg Progress", value: `${Math.round(SAMPLE_ITEMS.reduce((a, i) => a + i.progress, 0) / SAMPLE_ITEMS.length)}%`, sub: "portfolio completion" },
    { label: "Total Value", value: "$42.2M", sub: "combined portfolio" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Page description */}
      <div style={{ padding: "12px 16px", background: T.accentDim, border: `1px solid ${T.accent}33`, borderRadius: 8, fontSize: 12, color: T.textMid }}>
        <strong style={{ color: T.accent }}>Template 1 — KPI Dashboard + Tabbed Card List</strong> &middot; Top KPI metrics with tabbed filtering over a card list. Best for operational dashboards and status overviews.
      </div>

      {/* KPI Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
        {metrics.map((m, i) => (
          <div key={i} style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 10, padding: "16px 18px" }}>
            <div style={{ fontSize: 10, color: T.textDim, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>{m.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: T.text, marginTop: 4 }}>{m.value}</div>
            <div style={{ fontSize: 11, color: T.textMid, marginTop: 2 }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Tab Filter */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <TabBar tabs={tabs} active={tab} onChange={setTab} />
        <span style={{ fontSize: 12, color: T.textDim }}>{filtered.length} items</span>
      </div>

      {/* Card List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map(item => (
          <Card key={item.id} style={{ padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              {/* Status indicator */}
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: statusColor(item.status), boxShadow: `0 0 8px ${statusColor(item.status)}40`, flexShrink: 0 }} />

              {/* Main content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{item.name}</span>
                  <span style={{ fontSize: 10, color: T.textDim, fontFamily: "monospace" }}>{item.id}</span>
                  <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: priorityColor(item.priority) + "18", color: priorityColor(item.priority), fontWeight: 600 }}>{item.priority}</span>
                </div>
                <div style={{ fontSize: 11, color: T.textDim }}>{item.description}</div>
              </div>

              {/* Progress */}
              <div style={{ width: 120, flexShrink: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: T.textDim, marginBottom: 4 }}>
                  <span>Progress</span>
                  <span style={{ fontWeight: 600, color: T.text }}>{item.progress}%</span>
                </div>
                <Progress pct={item.progress} color={statusColor(item.status)} />
              </div>

              {/* Meta */}
              <div style={{ textAlign: "right", flexShrink: 0, minWidth: 80 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{item.value}</div>
                <div style={{ fontSize: 10, color: T.textDim }}>{item.owner}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};


// ═══════════════════════════════════════════════════════════════════
//  TEMPLATE 2 — Master-Detail Split View
//  Best for: Entity management, asset registers, user directories
//  Pattern: Filterable sidebar list → Detail panel
// ═══════════════════════════════════════════════════════════════════

export const Template2 = () => {
  const [selectedId, setSelectedId] = useState(SAMPLE_ITEMS[0].id);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const filtered = useMemo(() => {
    return SAMPLE_ITEMS.filter(i => {
      const matchesSearch = !searchQuery || i.name.toLowerCase().includes(searchQuery.toLowerCase()) || i.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === "All" || i.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, categoryFilter]);

  const selected = SAMPLE_ITEMS.find(i => i.id === selectedId) || SAMPLE_ITEMS[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Page description */}
      <div style={{ padding: "12px 16px", background: T.accentDim, border: `1px solid ${T.accent}33`, borderRadius: 8, fontSize: 12, color: T.textMid }}>
        <strong style={{ color: T.accent }}>Template 2 — Master-Detail Split View</strong> &middot; Filterable list on the left, detail panel on the right. Best for entity management, asset registers, and directories.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 20, minHeight: 600 }}>
        {/* Left: Master list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Search */}
          <div style={{ position: "relative" }}>
            <input
              type="text" placeholder="Search items..." value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: "100%", padding: "10px 14px 10px 36px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg2, color: T.text, fontSize: 12, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
              onFocus={e => e.target.style.borderColor = T.accent}
              onBlur={e => e.target.style.borderColor = T.border}
            />
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={T.textDim} strokeWidth="2" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}>
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>

          {/* Category filter chips */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCategoryFilter(c)} style={{
                padding: "4px 10px", borderRadius: 20, border: `1px solid ${categoryFilter === c ? T.accent : T.border}`,
                background: categoryFilter === c ? T.accentDim : "transparent",
                color: categoryFilter === c ? T.accent : T.textDim, fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              }}>{c}</button>
            ))}
          </div>

          {/* Item list */}
          <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
            {filtered.map(item => (
              <button key={item.id} onClick={() => setSelectedId(item.id)} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, border: "none", cursor: "pointer", textAlign: "left", fontFamily: "inherit", width: "100%",
                background: item.id === selectedId ? T.accentDim : T.bg2,
                borderLeft: item.id === selectedId ? `3px solid ${T.accent}` : `3px solid transparent`,
                transition: "all .15s",
              }}
                onMouseEnter={e => { if (item.id !== selectedId) e.currentTarget.style.background = T.bg3; }}
                onMouseLeave={e => { if (item.id !== selectedId) e.currentTarget.style.background = item.id === selectedId ? T.accentDim : T.bg2; }}
              >
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: statusColor(item.status), flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</div>
                  <div style={{ fontSize: 10, color: T.textDim }}>{item.category} &middot; {item.id}</div>
                </div>
                <span style={{ fontSize: 10, color: priorityColor(item.priority), fontWeight: 600, flexShrink: 0 }}>{item.priority}</span>
              </button>
            ))}
            {filtered.length === 0 && <div style={{ padding: 20, textAlign: "center", fontSize: 12, color: T.textDim }}>No items match your filters</div>}
          </div>
        </div>

        {/* Right: Detail panel */}
        <Card style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: statusColor(selected.status), boxShadow: `0 0 8px ${statusColor(selected.status)}40` }} />
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: T.text }}>{selected.name}</h3>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: T.textDim }}>
                <span style={{ fontFamily: "monospace" }}>{selected.id}</span>
                <span>&middot;</span>
                <span>{selected.category}</span>
                <span>&middot;</span>
                <span>Owner: <strong style={{ color: T.textMid }}>{selected.owner}</strong></span>
              </div>
            </div>
            <span style={{ padding: "4px 12px", borderRadius: 6, background: priorityColor(selected.priority) + "18", color: priorityColor(selected.priority), fontSize: 11, fontWeight: 700 }}>{selected.priority}</span>
          </div>

          {/* Description */}
          <div style={{ fontSize: 13, color: T.textMid, lineHeight: 1.6, padding: "12px 16px", background: T.bg0, borderRadius: 8 }}>{selected.description}</div>

          {/* Metrics Row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            <div style={{ background: T.bg0, borderRadius: 8, padding: "14px 16px" }}>
              <div style={{ fontSize: 10, color: T.textDim, textTransform: "uppercase", letterSpacing: .8, fontWeight: 600 }}>Progress</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: T.text, margin: "4px 0" }}>{selected.progress}%</div>
              <Progress pct={selected.progress} color={statusColor(selected.status)} />
            </div>
            <div style={{ background: T.bg0, borderRadius: 8, padding: "14px 16px" }}>
              <div style={{ fontSize: 10, color: T.textDim, textTransform: "uppercase", letterSpacing: .8, fontWeight: 600 }}>Value</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: T.text, margin: "4px 0" }}>{selected.value}</div>
              <div style={{ fontSize: 11, color: T.textDim }}>Budget allocation</div>
            </div>
            <div style={{ background: T.bg0, borderRadius: 8, padding: "14px 16px" }}>
              <div style={{ fontSize: 10, color: T.textDim, textTransform: "uppercase", letterSpacing: .8, fontWeight: 600 }}>Last Updated</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: T.text, margin: "4px 0" }}>{new Date(selected.updated).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
              <div style={{ fontSize: 11, color: T.textDim }}>{selected.updated}</div>
            </div>
          </div>

          {/* Activity Timeline (placeholder) */}
          <Card title="Activity Timeline" titleColor={T.textDim}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { time: "2 hours ago", action: "Progress updated to " + selected.progress + "%", user: selected.owner },
                { time: "1 day ago", action: "Status review completed", user: "System" },
                { time: "3 days ago", action: "Budget allocation approved", user: "T. Wilson" },
                { time: "1 week ago", action: "Item created and assigned", user: "Admin" },
              ].map((a, i) => (
                <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: i === 0 ? T.accent : T.border, marginTop: 4, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 12, color: T.text }}>{a.action}</div>
                    <div style={{ fontSize: 10, color: T.textDim }}>{a.time} &middot; {a.user}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Card>
      </div>
    </div>
  );
};


// ═══════════════════════════════════════════════════════════════════
//  TEMPLATE 3 — Tabbed Data Tables with Summary Cards
//  Best for: Data-heavy views, registers, inventories, logs
//  Pattern: Summary cards → TabBar → Full DataTable per tab
// ═══════════════════════════════════════════════════════════════════

export const Template3 = () => {
  const [tab, setTab] = useState("all");

  const tabs = [
    { key: "all", label: "All Records" },
    { key: "manufacturing", label: "Manufacturing" },
    { key: "engineering", label: "Engineering" },
    { key: "commercial", label: "Commercial" },
    { key: "other", label: "Other" },
  ];

  const filtered = useMemo(() => {
    if (tab === "manufacturing") return SAMPLE_ITEMS.filter(i => i.category === "Manufacturing");
    if (tab === "engineering") return SAMPLE_ITEMS.filter(i => i.category === "Engineering");
    if (tab === "commercial") return SAMPLE_ITEMS.filter(i => i.category === "Commercial");
    if (tab === "other") return SAMPLE_ITEMS.filter(i => !["Manufacturing", "Engineering", "Commercial"].includes(i.category));
    return SAMPLE_ITEMS;
  }, [tab]);

  const summaryCards = [
    { label: "Total Records", value: filtered.length, color: T.accent, icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
    { label: "On Track", value: filtered.filter(i => i.status === "green").length, color: T.green, icon: "M22 11.08V12a10 10 0 11-5.93-9.14 M22 4L12 14.01l-3-3" },
    { label: "At Risk", value: filtered.filter(i => i.status === "yellow" || i.status === "red").length, color: T.warn, icon: "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z M12 9v4 M12 17h.01" },
    { label: "Avg Completion", value: `${Math.round(filtered.reduce((a, i) => a + i.progress, 0) / (filtered.length || 1))}%`, color: T.blue, icon: "M18 20V10 M12 20V4 M6 20v-6" },
  ];

  const columns = [
    { key: "id", header: "ID", render: (v) => <span style={{ fontFamily: "monospace", fontSize: 11, color: T.textDim }}>{v}</span> },
    { key: "name", header: "Name", render: (v) => <span style={{ fontWeight: 600 }}>{v}</span> },
    { key: "category", header: "Category", render: (v) => <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: T.bg3, color: T.textMid }}>{v}</span> },
    { key: "status", header: "Status", render: (v) => <StatusPill status={v} /> },
    { key: "priority", header: "Priority", render: (v) => <span style={{ fontSize: 11, fontWeight: 600, color: priorityColor(v) }}>{v}</span> },
    { key: "progress", header: "Progress", render: (v) => (
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 100 }}>
        <Progress pct={v} color={v === 100 ? T.green : v > 60 ? T.accent : T.warn} h={5} />
        <span style={{ fontSize: 11, color: T.textMid, minWidth: 28 }}>{v}%</span>
      </div>
    )},
    { key: "owner", header: "Owner" },
    { key: "value", header: "Value", render: (v) => <span style={{ fontWeight: 600 }}>{v}</span> },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Page description */}
      <div style={{ padding: "12px 16px", background: T.accentDim, border: `1px solid ${T.accent}33`, borderRadius: 8, fontSize: 12, color: T.textMid }}>
        <strong style={{ color: T.accent }}>Template 3 — Tabbed Data Tables with Summary Cards</strong> &middot; Summary metrics at top with tabbed full-width data tables below. Best for data-heavy views, registers, and inventories.
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        {summaryCards.map((c, i) => (
          <div key={i} style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 10, padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: c.color + "15", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={c.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={c.icon} /></svg>
            </div>
            <div>
              <div style={{ fontSize: 10, color: T.textDim, textTransform: "uppercase", letterSpacing: .8, fontWeight: 600 }}>{c.label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: T.text }}>{c.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tab Bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <TabBar tabs={tabs} active={tab} onChange={setTab} />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, color: T.textDim }}>{filtered.length} records</span>
          <button style={{ padding: "6px 12px", borderRadius: 6, border: `1px solid ${T.accent}`, background: T.accentDim, color: T.accent, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Export</button>
        </div>
      </div>

      {/* Data Table */}
      <Card>
        <DataTable columns={columns} rows={filtered} />
      </Card>
    </div>
  );
};


// ═══════════════════════════════════════════════════════════════════
//  TEMPLATE 4 — Card Grid with Filters and Search
//  Best for: Catalogs, directories, inventories, browseable collections
//  Pattern: Search bar + filter chips → Responsive card grid
// ═══════════════════════════════════════════════════════════════════

export const Template4 = () => {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [viewMode, setViewMode] = useState("grid"); // grid | list

  const filtered = useMemo(() => {
    return SAMPLE_ITEMS.filter(i => {
      const matchesSearch = !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.description.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === "All" || i.category === categoryFilter;
      const matchesPriority = priorityFilter === "All" || i.priority === priorityFilter;
      return matchesSearch && matchesCategory && matchesPriority;
    });
  }, [search, categoryFilter, priorityFilter]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Page description */}
      <div style={{ padding: "12px 16px", background: T.accentDim, border: `1px solid ${T.accent}33`, borderRadius: 8, fontSize: 12, color: T.textMid }}>
        <strong style={{ color: T.accent }}>Template 4 — Card Grid with Filters</strong> &middot; Searchable, filterable grid of cards with toggle for grid/list view. Best for catalogs, directories, and browseable collections.
      </div>

      {/* Filter Bar */}
      <Card style={{ padding: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Search + view toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1, position: "relative" }}>
              <input
                type="text" placeholder="Search by name or description..." value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: "100%", padding: "10px 14px 10px 36px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg0, color: T.text, fontSize: 12, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
                onFocus={e => e.target.style.borderColor = T.accent}
                onBlur={e => e.target.style.borderColor = T.border}
              />
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={T.textDim} strokeWidth="2" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}>
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <div style={{ display: "flex", border: `1px solid ${T.border}`, borderRadius: 6, overflow: "hidden" }}>
              {["grid", "list"].map(m => (
                <button key={m} onClick={() => setViewMode(m)} style={{
                  padding: "7px 10px", border: "none", cursor: "pointer",
                  background: viewMode === m ? T.accentDim : T.bg0,
                  color: viewMode === m ? T.accent : T.textDim,
                }}>
                  {m === "grid"
                    ? <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
                    : <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
                  }
                </button>
              ))}
            </div>
          </div>

          {/* Filter chips */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 10, color: T.textDim, fontWeight: 600, textTransform: "uppercase" }}>Category:</span>
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => setCategoryFilter(c)} style={{
                  padding: "3px 8px", borderRadius: 4, border: `1px solid ${categoryFilter === c ? T.accent : T.border}`,
                  background: categoryFilter === c ? T.accentDim : "transparent",
                  color: categoryFilter === c ? T.accent : T.textDim, fontSize: 10, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
                }}>{c}</button>
              ))}
            </div>
            <div style={{ width: 1, height: 16, background: T.border }} />
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 10, color: T.textDim, fontWeight: 600, textTransform: "uppercase" }}>Priority:</span>
              {PRIORITIES.map(p => (
                <button key={p} onClick={() => setPriorityFilter(p)} style={{
                  padding: "3px 8px", borderRadius: 4, border: `1px solid ${priorityFilter === p ? T.accent : T.border}`,
                  background: priorityFilter === p ? T.accentDim : "transparent",
                  color: priorityFilter === p ? T.accent : T.textDim, fontSize: 10, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
                }}>{p}</button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Results count */}
      <div style={{ fontSize: 12, color: T.textDim }}>{filtered.length} of {SAMPLE_ITEMS.length} items</div>

      {/* Card Grid / List */}
      {viewMode === "grid" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
          {filtered.map(item => (
            <Card key={item.id} style={{ padding: 16, cursor: "pointer", transition: "border-color .15s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = T.accent + "55"}
              onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 2 }}>{item.name}</div>
                  <div style={{ fontSize: 10, color: T.textDim }}>{item.id} &middot; {item.category}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: statusColor(item.status) }} />
                  <span style={{ fontSize: 10, fontWeight: 600, color: priorityColor(item.priority) }}>{item.priority}</span>
                </div>
              </div>
              <div style={{ fontSize: 11, color: T.textDim, lineHeight: 1.5, marginBottom: 12, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{item.description}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ flex: 1, marginRight: 12 }}>
                  <Progress pct={item.progress} color={statusColor(item.status)} h={5} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: T.text }}>{item.progress}%</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 10, color: T.textDim }}>
                <span>{item.owner}</span>
                <span style={{ fontWeight: 600, color: T.textMid }}>{item.value}</span>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {filtered.map(item => (
            <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 14px", background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 8, cursor: "pointer", transition: "border-color .15s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = T.accent + "55"}
              onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: statusColor(item.status), flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: T.text, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</span>
              <span style={{ fontSize: 10, color: T.textDim, flexShrink: 0 }}>{item.category}</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: priorityColor(item.priority), flexShrink: 0, minWidth: 48 }}>{item.priority}</span>
              <div style={{ width: 80, flexShrink: 0 }}><Progress pct={item.progress} color={statusColor(item.status)} h={4} /></div>
              <span style={{ fontSize: 11, fontWeight: 600, color: T.text, flexShrink: 0, minWidth: 40, textAlign: "right" }}>{item.progress}%</span>
              <span style={{ fontSize: 11, color: T.textDim, flexShrink: 0, minWidth: 70 }}>{item.owner}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: T.textMid, flexShrink: 0, minWidth: 50, textAlign: "right" }}>{item.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


// ═══════════════════════════════════════════════════════════════════
//  TEMPLATE 5 — Multi-Section Dashboard with Collapsible Panels
//  Best for: Comprehensive overviews, executive summaries, landing pages
//  Pattern: KPI header → Collapsible sections (mixed content types)
// ═══════════════════════════════════════════════════════════════════

const CollapsibleSection = ({ title, subtitle, defaultOpen = true, count, color = T.accent, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ background: T.bg2, border: `1px solid ${open ? color + "33" : T.border}`, borderRadius: 10, overflow: "hidden", transition: "border-color .2s" }}>
      <button onClick={() => setOpen(!open)} style={{
        width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 18px", background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 4, height: 20, borderRadius: 2, background: color }} />
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{title}</div>
            {subtitle && <div style={{ fontSize: 10, color: T.textDim, marginTop: 1 }}>{subtitle}</div>}
          </div>
          {count != null && <span style={{ fontSize: 10, fontWeight: 700, background: color + "18", color, padding: "2px 8px", borderRadius: 10 }}>{count}</span>}
        </div>
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={T.textDim} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform .2s" }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && <div style={{ padding: "0 18px 18px" }}>{children}</div>}
    </div>
  );
};

export const Template5 = () => {
  const criticalItems = SAMPLE_ITEMS.filter(i => i.status === "red" || i.priority === "Critical");
  const activeItems = SAMPLE_ITEMS.filter(i => i.status === "green" || i.status === "blue");
  const watchItems = SAMPLE_ITEMS.filter(i => i.status === "yellow");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Page description */}
      <div style={{ padding: "12px 16px", background: T.accentDim, border: `1px solid ${T.accent}33`, borderRadius: 8, fontSize: 12, color: T.textMid }}>
        <strong style={{ color: T.accent }}>Template 5 — Multi-Section Dashboard with Collapsible Panels</strong> &middot; KPI header with multiple collapsible sections containing mixed content types. Best for executive summaries and comprehensive overviews.
      </div>

      {/* KPI Header Banner */}
      <div style={{ background: `linear-gradient(135deg, ${T.accent}08, ${T.accent}03)`, border: `1px solid ${T.accent}22`, borderRadius: 12, padding: "20px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: T.accent, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Portfolio Overview</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: T.text, marginTop: 2 }}>Operations Summary</div>
          </div>
          <div style={{ fontSize: 11, color: T.textDim }}>Last updated: {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14 }}>
          {[
            { label: "Total Items", value: SAMPLE_ITEMS.length, sub: "in portfolio", color: T.accent },
            { label: "Completion", value: `${Math.round(SAMPLE_ITEMS.reduce((a, i) => a + i.progress, 0) / SAMPLE_ITEMS.length)}%`, sub: "avg progress", color: T.blue },
            { label: "On Track", value: activeItems.length, sub: "proceeding normally", color: T.green },
            { label: "Watch List", value: watchItems.length, sub: "needs monitoring", color: T.warn },
            { label: "Critical", value: criticalItems.length, sub: "immediate action", color: T.danger },
          ].map((m, i) => (
            <div key={i} style={{ background: T.bg2, borderRadius: 8, padding: "12px 14px", borderTop: `3px solid ${m.color}` }}>
              <div style={{ fontSize: 10, color: T.textDim, textTransform: "uppercase", letterSpacing: .8, fontWeight: 600 }}>{m.label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: T.text, marginTop: 2 }}>{m.value}</div>
              <div style={{ fontSize: 10, color: T.textMid, marginTop: 1 }}>{m.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Collapsible Sections */}
      <CollapsibleSection title="Critical Items" subtitle="Requires immediate attention" count={criticalItems.length} color={T.danger} defaultOpen={true}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {criticalItems.length > 0 ? criticalItems.map(item => (
            <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: T.danger + "08", border: `1px solid ${T.danger}22`, borderRadius: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.danger, boxShadow: `0 0 6px ${T.danger}40` }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{item.name}</div>
                <div style={{ fontSize: 10, color: T.textDim }}>{item.category} &middot; {item.owner}</div>
              </div>
              <div style={{ width: 80 }}><Progress pct={item.progress} color={T.danger} h={4} /></div>
              <span style={{ fontSize: 11, fontWeight: 600, color: T.text, minWidth: 32 }}>{item.progress}%</span>
            </div>
          )) : (
            <div style={{ padding: 16, textAlign: "center", fontSize: 12, color: T.green }}>No critical items</div>
          )}
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Active Work Items" subtitle="Currently in progress" count={activeItems.length} color={T.green} defaultOpen={true}>
        <DataTable
          columns={[
            { key: "id", header: "ID", render: (v) => <span style={{ fontFamily: "monospace", fontSize: 11, color: T.textDim }}>{v}</span> },
            { key: "name", header: "Name", render: (v) => <span style={{ fontWeight: 600 }}>{v}</span> },
            { key: "category", header: "Category" },
            { key: "status", header: "Status", render: (v) => <StatusPill status={v} /> },
            { key: "progress", header: "Progress", render: (v) => (
              <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 80 }}>
                <Progress pct={v} color={v === 100 ? T.green : T.accent} h={4} />
                <span style={{ fontSize: 10, color: T.textMid }}>{v}%</span>
              </div>
            )},
            { key: "owner", header: "Owner" },
          ]}
          rows={activeItems}
          compact
        />
      </CollapsibleSection>

      <CollapsibleSection title="Watch List" subtitle="Monitoring for escalation" count={watchItems.length} color={T.warn} defaultOpen={false}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
          {watchItems.map(item => (
            <div key={item.id} style={{ background: T.bg0, border: `1px solid ${T.warn}22`, borderRadius: 8, padding: "12px 14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{item.name}</div>
                  <div style={{ fontSize: 10, color: T.textDim }}>{item.category}</div>
                </div>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.warn, marginTop: 4 }} />
              </div>
              <div style={{ fontSize: 11, color: T.textDim, marginBottom: 8, lineHeight: 1.4 }}>{item.description}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ flex: 1, marginRight: 8 }}><Progress pct={item.progress} color={T.warn} h={4} /></div>
                <span style={{ fontSize: 10, fontWeight: 600, color: T.text }}>{item.progress}%</span>
              </div>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Category Breakdown" subtitle="Distribution by department" color={T.blue} defaultOpen={false}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
          {[...new Set(SAMPLE_ITEMS.map(i => i.category))].map(cat => {
            const items = SAMPLE_ITEMS.filter(i => i.category === cat);
            const avgProgress = Math.round(items.reduce((a, i) => a + i.progress, 0) / items.length);
            return (
              <div key={cat} style={{ background: T.bg0, borderRadius: 8, padding: "12px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 10, color: T.textDim, textTransform: "uppercase", letterSpacing: .8, fontWeight: 600, marginBottom: 4 }}>{cat}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: T.text }}>{items.length}</div>
                <div style={{ fontSize: 10, color: T.textMid, marginTop: 2 }}>avg {avgProgress}%</div>
                <div style={{ marginTop: 6 }}><Progress pct={avgProgress} color={avgProgress > 70 ? T.green : avgProgress > 40 ? T.accent : T.warn} h={4} /></div>
              </div>
            );
          })}
        </div>
      </CollapsibleSection>
    </div>
  );
};


// ═══════════════════════════════════════════════════════════════════
//  SHARED — Department configuration for Dashboard & Dept Home templates
// ═══════════════════════════════════════════════════════════════════

const DEPT_CONFIG = {
  operations: {
    key: "vp-ops", label: "Operations", color: T.accent, branch: "OPERATIONS",
    icon: "M12 2L2 7l10 5 10-5-10-5z M2 17l10 5 10-5 M2 12l10 5 10-5",
    kpis: [
      { label: "Uptime", value: "84.2%", target: 90, sub: "portfolio avg" },
      { label: "Throughput", value: "9.8 TPH", target: 10, sub: "total capacity" },
      { label: "OEE", value: "76%", target: 85, sub: "effectiveness" },
      { label: "Incidents", value: "2", sub: "open this month" },
    ],
    subViews: [
      { key: "ops-projects", label: "Projects", desc: "Active construction & development" },
      { key: "ops-engineering", label: "Engineering", desc: "Design & technical delivery" },
      { key: "ops-maintenance", label: "Maintenance", desc: "Preventive & corrective" },
      { key: "ops-plant", label: "Plant Operations", desc: "Daily operational metrics" },
      { key: "ops-logistics", label: "Logistics", desc: "Supply chain & transport" },
    ],
    focusAreas: ["Equipment uptime above 85% target", "Noble B commissioning on track", "Maintenance backlog reduction", "Safety incident zero-harm goal"],
  },
  technology: {
    key: "vp-engineering", label: "Technology", color: T.blue, branch: "TECHNOLOGY",
    icon: "M4 4h16v16H4z M9 9h6v6H9z",
    kpis: [
      { label: "Design Complete", value: "92%", target: 95, sub: "avg across units" },
      { label: "Fabrication", value: "68%", target: 75, sub: "in-progress units" },
      { label: "Units Active", value: "11", sub: "in pipeline" },
      { label: "Eng Hours", value: "4,200", sub: "this month" },
    ],
    subViews: [
      { key: "tech-manufacturing", label: "Manufacturing", desc: "Processor fabrication pipeline" },
      { key: "tech-maintenance", label: "Maintenance", desc: "Machine maintenance programs" },
      { key: "tech-engineering", label: "Engineering", desc: "Design & development" },
      { key: "tech-ip-risk", label: "IP Risk", desc: "Patent & IP protection" },
    ],
    focusAreas: ["TiPs-008 fabrication on schedule", "Controls v4.0 beta release", "Coal gasifier design milestone", "Vendor qualification for HX tubes"],
  },
  growth: {
    key: "vp-finance", label: "Growth & Finance", color: T.green, branch: "GROWTH",
    icon: "M18 20V10 M12 20V4 M6 20v-6",
    kpis: [
      { label: "Revenue", value: "$18.4M", target: 20, sub: "YTD actual" },
      { label: "EBITDA", value: "$5.2M", sub: "32% margin" },
      { label: "Pipeline", value: "$142M", sub: "total project value" },
      { label: "Burn Rate", value: "$1.8M/mo", sub: "operating costs" },
    ],
    subViews: [
      { key: "finance", label: "Finance & Strategy", desc: "Revenue, margins, forecasts" },
      { key: "development", label: "Development", desc: "New project pipeline" },
    ],
    focusAreas: ["Series C close by Q3", "Revenue run-rate to $24M", "EBITDA margin above 30%", "Portland & Noble B CapEx tracking"],
  },
};

const deptAlertSummary = (alerts) => {
  const crit = alerts.filter(a => a.severity === "critical").length;
  const warn = alerts.filter(a => a.severity === "warning").length;
  const info = alerts.filter(a => a.severity === "info").length;
  return { crit, warn, info, total: alerts.length };
};


// ═══════════════════════════════════════════════════════════════════
//  DASHBOARD TEMPLATE A — Executive KPI Dashboard with Alert Banner
//  Pattern: Alert banner → KPI strip → Tabbed sub-views
//  Best for: C-suite / VP dashboards focused on operational metrics
// ═══════════════════════════════════════════════════════════════════

export const DashboardTemplateA = ({ onNavigate }) => {
  const { simDate } = useSimDate();
  const [activeDept, setActiveDept] = useState("operations");
  const dept = DEPT_CONFIG[activeDept];
  const alerts = useMemo(() => getAlertsForDept(dept.key, simDate), [dept.key, simDate]);
  const summary = deptAlertSummary(alerts);

  const tabs = [
    { key: "operations", label: "Operations" },
    { key: "technology", label: "Technology" },
    { key: "growth", label: "Growth" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ padding: "12px 16px", background: T.accentDim, border: `1px solid ${T.accent}33`, borderRadius: 8, fontSize: 12, color: T.textMid }}>
        <strong style={{ color: T.accent }}>Dashboard Template A — Executive KPI + Alert Banner</strong> &middot; Department-scoped alerts with KPI metrics and quick-nav to sub-views. Ideal for C-suite and VP landing dashboards.
      </div>

      {/* Department Selector */}
      <TabBar tabs={tabs} active={activeDept} onChange={setActiveDept} />

      {/* Alert Banner */}
      {alerts.length > 0 && (
        <CheckEngineLightPanel alerts={alerts} onNavigate={onNavigate} title={`${dept.label} Alerts`} color={dept.color} compact />
      )}
      {alerts.length === 0 && (
        <div style={{ padding: "14px 18px", background: T.green + "10", border: `1px solid ${T.green}33`, borderRadius: 8, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: T.green, boxShadow: `0 0 8px ${T.green}40` }} />
          <span style={{ fontSize: 12, color: T.green, fontWeight: 600 }}>All clear — no active alerts for {dept.label}</span>
        </div>
      )}

      {/* KPI Strip */}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${dept.kpis.length}, 1fr)`, gap: 12 }}>
        {dept.kpis.map((k, i) => (
          <div key={i} style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 10, padding: "16px 18px", borderTop: `3px solid ${dept.color}` }}>
            <div style={{ fontSize: 10, color: T.textDim, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>{k.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: T.text, marginTop: 4 }}>{k.value}</div>
            <div style={{ fontSize: 11, color: T.textMid, marginTop: 2 }}>{k.sub}</div>
            {k.target && (
              <div style={{ marginTop: 6 }}>
                <Progress pct={parseFloat(k.value) / k.target * 100} color={parseFloat(k.value) / k.target >= 0.9 ? T.green : T.warn} h={4} target={100} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Sub-view Navigation Cards */}
      <SectionHeader sub={`Quick access to ${dept.label.toLowerCase()} modules`}>{dept.label} Modules</SectionHeader>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
        {dept.subViews.map(sv => (
          <button key={sv.key} onClick={() => onNavigate?.(sv.key)} style={{
            background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 10, padding: "16px 18px",
            cursor: "pointer", textAlign: "left", fontFamily: "inherit", transition: "all .15s",
            display: "flex", flexDirection: "column", gap: 6,
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = dept.color + "66"; e.currentTarget.style.background = T.bg3; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.bg2; }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{sv.label}</div>
            <div style={{ fontSize: 11, color: T.textDim }}>{sv.desc}</div>
            <div style={{ fontSize: 10, color: dept.color, fontWeight: 600, marginTop: 4 }}>Open &rarr;</div>
          </button>
        ))}
      </div>

      {/* Alert Summary Footer */}
      <Card title="Alert Summary" titleColor={T.textDim}>
        <div style={{ display: "flex", gap: 20 }}>
          {[{ label: "Critical", count: summary.crit, color: T.danger }, { label: "Warning", count: summary.warn, color: T.warn }, { label: "Info", count: summary.info, color: T.blue }].map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: s.color }} />
              <span style={{ fontSize: 12, color: T.textMid }}>{s.label}: <strong style={{ color: T.text }}>{s.count}</strong></span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};


// ═══════════════════════════════════════════════════════════════════
//  DASHBOARD TEMPLATE B — Split Dashboard with Inline Alert Feed
//  Pattern: Two-column (KPIs + alerts side-by-side) → Focus areas
//  Best for: Manager-level dashboards needing alerts always visible
// ═══════════════════════════════════════════════════════════════════

export const DashboardTemplateB = ({ onNavigate }) => {
  const { simDate } = useSimDate();
  const [activeDept, setActiveDept] = useState("operations");
  const dept = DEPT_CONFIG[activeDept];
  const alerts = useMemo(() => getAlertsForDept(dept.key, simDate), [dept.key, simDate]);

  const tabs = [
    { key: "operations", label: "Operations" },
    { key: "technology", label: "Technology" },
    { key: "growth", label: "Growth" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ padding: "12px 16px", background: T.accentDim, border: `1px solid ${T.accent}33`, borderRadius: 8, fontSize: 12, color: T.textMid }}>
        <strong style={{ color: T.accent }}>Dashboard Template B — Split Dashboard + Inline Alert Feed</strong> &middot; Two-column layout with KPIs and focus areas on the left, live alert feed on the right. Always-visible alerts for managers.
      </div>

      <TabBar tabs={tabs} active={activeDept} onChange={setActiveDept} />

      {/* Two-column: metrics + alerts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20 }}>
        {/* Left: KPIs + focus */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* KPI Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {dept.kpis.map((k, i) => (
              <div key={i} style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 10, padding: "14px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: 10, color: T.textDim, textTransform: "uppercase", letterSpacing: .8, fontWeight: 600 }}>{k.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: T.text, marginTop: 4 }}>{k.value}</div>
                  </div>
                  {k.target && <div style={{ fontSize: 10, color: T.textDim }}>Target: {k.target}</div>}
                </div>
                <div style={{ fontSize: 11, color: T.textMid, marginTop: 2 }}>{k.sub}</div>
              </div>
            ))}
          </div>

          {/* Focus Areas */}
          <Card title={`${dept.label} Focus Areas`} titleColor={dept.color}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {dept.focusAreas.map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: T.bg0, borderRadius: 6 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: dept.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: T.text }}>{f}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Navigation */}
          <Card title="Quick Navigation" titleColor={T.textDim}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {dept.subViews.map(sv => (
                <button key={sv.key} onClick={() => onNavigate?.(sv.key)} style={{
                  padding: "8px 14px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg0,
                  color: T.textMid, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all .15s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = dept.color; e.currentTarget.style.color = dept.color; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textMid; }}
                >{sv.label} &rarr;</button>
              ))}
            </div>
          </Card>
        </div>

        {/* Right: Alert Feed */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h4 style={{ margin: 0, fontSize: 13, color: dept.color, letterSpacing: .5 }}>SYSTEM ALERTS</h4>
            <span style={{ fontSize: 10, color: T.textDim }}>{alerts.length} active</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 560, overflowY: "auto" }}>
            {alerts.length === 0 && (
              <div style={{ padding: 20, textAlign: "center", background: T.bg2, borderRadius: 8, color: T.green, fontSize: 12 }}>No active alerts</div>
            )}
            {alerts.map(alert => {
              const sevColor = alert.severity === "critical" ? T.danger : alert.severity === "warning" ? T.warn : T.blue;
              return (
                <div key={alert.id} style={{ background: T.bg2, border: `1px solid ${sevColor}22`, borderRadius: 8, padding: "10px 14px", borderLeft: `3px solid ${sevColor}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: sevColor, boxShadow: alert.severity === "critical" ? `0 0 6px ${sevColor}60` : "none" }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: T.text, flex: 1 }}>{alert.label}</span>
                    <span style={{ fontSize: 9, color: sevColor, fontWeight: 700, textTransform: "uppercase" }}>{alert.severity}</span>
                  </div>
                  <div style={{ fontSize: 10, color: T.textDim, lineHeight: 1.4 }}>{alert.detail}</div>
                  {alert.kpi && (
                    <div style={{ marginTop: 6 }}>
                      <Progress pct={Math.min(100, (alert.kpi.actual / alert.kpi.target) * 100)} color={sevColor} h={4} target={100} />
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: T.textDim, marginTop: 2 }}>
                        <span>Actual: {alert.kpi.actual}{alert.kpi.unit}</span>
                        <span>Target: {alert.kpi.target}{alert.kpi.unit}</span>
                      </div>
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6, fontSize: 9, color: T.textDim }}>
                    <span>Via {alert.raisedBy.agentName}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};


// ═══════════════════════════════════════════════════════════════════
//  DASHBOARD TEMPLATE C — Compact Alert-First Dashboard
//  Pattern: Full-width alert panel → Metric cards → Sub-view tiles
//  Best for: Incident-focused dashboards, control rooms
// ═══════════════════════════════════════════════════════════════════

export const DashboardTemplateC = ({ onNavigate }) => {
  const { simDate } = useSimDate();
  const allAlerts = useMemo(() => getAllAlerts(simDate), [simDate]);
  const [filterSev, setFilterSev] = useState("all");

  const filtered = useMemo(() => {
    if (filterSev === "all") return allAlerts;
    return allAlerts.filter(a => a.severity === filterSev);
  }, [allAlerts, filterSev]);

  const sevTabs = [
    { key: "all", label: `All (${allAlerts.length})` },
    { key: "critical", label: `Critical (${allAlerts.filter(a => a.severity === "critical").length})` },
    { key: "warning", label: `Warning (${allAlerts.filter(a => a.severity === "warning").length})` },
    { key: "info", label: `Info (${allAlerts.filter(a => a.severity === "info").length})` },
  ];

  // Department breakdown
  const deptBreakdown = useMemo(() => {
    const map = {};
    allAlerts.forEach(a => {
      (a.targetDepts || []).forEach(d => {
        if (!map[d]) map[d] = { key: d, label: d.replace("vp-", "").replace(/-/g, " "), count: 0, critical: 0 };
        map[d].count++;
        if (a.severity === "critical") map[d].critical++;
      });
    });
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [allAlerts]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ padding: "12px 16px", background: T.accentDim, border: `1px solid ${T.accent}33`, borderRadius: 8, fontSize: 12, color: T.textMid }}>
        <strong style={{ color: T.accent }}>Dashboard Template C — Alert-First Compact Dashboard</strong> &middot; Full-width alert system with severity filtering, department breakdown, and cross-department visibility. Ideal for control rooms and incident management.
      </div>

      {/* Top severity summary bar */}
      <div style={{ display: "flex", gap: 12 }}>
        {[
          { label: "Total Alerts", count: allAlerts.length, color: T.accent },
          { label: "Critical", count: allAlerts.filter(a => a.severity === "critical").length, color: T.danger },
          { label: "Warnings", count: allAlerts.filter(a => a.severity === "warning").length, color: T.warn },
          { label: "Departments Hit", count: deptBreakdown.length, color: T.blue },
        ].map((m, i) => (
          <div key={i} style={{ flex: 1, background: T.bg2, border: `1px solid ${m.color}22`, borderRadius: 8, padding: "12px 14px", textAlign: "center" }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: m.color }}>{m.count}</div>
            <div style={{ fontSize: 10, color: T.textDim, textTransform: "uppercase", letterSpacing: .8, fontWeight: 600 }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs + alert list */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <TabBar tabs={sevTabs} active={filterSev} onChange={setFilterSev} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: 20 }}>
        {/* Left: Alert table */}
        <Card>
          <DataTable
            columns={[
              { key: "severity", header: "Sev", render: (v) => (
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: v === "critical" ? T.danger : v === "warning" ? T.warn : T.blue, boxShadow: v === "critical" ? `0 0 6px ${T.danger}60` : "none" }} />
              )},
              { key: "label", header: "Alert", render: (v) => <span style={{ fontWeight: 600 }}>{v}</span> },
              { key: "raisedBy", header: "Source", render: (v) => <span style={{ fontSize: 11, color: T.textDim }}>{v.agentName}</span> },
              { key: "targetDepts", header: "Departments", render: (v) => (
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {(v || []).slice(0, 2).map(d => (
                    <span key={d} style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: T.bg3, color: T.textMid }}>{d.replace("vp-", "")}</span>
                  ))}
                  {(v || []).length > 2 && <span style={{ fontSize: 9, color: T.textDim }}>+{v.length - 2}</span>}
                </div>
              )},
              { key: "kpi", header: "KPI", render: (v) => v ? (
                <div style={{ minWidth: 80 }}>
                  <Progress pct={Math.min(100, (v.actual / v.target) * 100)} color={(v.actual / v.target) >= 0.9 ? T.green : T.warn} h={4} />
                  <span style={{ fontSize: 9, color: T.textDim }}>{v.actual}/{v.target}{v.unit}</span>
                </div>
              ) : <span style={{ fontSize: 10, color: T.textDim }}>—</span> },
            ]}
            rows={filtered}
            compact
          />
        </Card>

        {/* Right: Department breakdown */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <h4 style={{ margin: 0, fontSize: 12, color: T.textDim, textTransform: "uppercase", letterSpacing: .8 }}>By Department</h4>
          {deptBreakdown.map(d => (
            <div key={d.key} style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.text, textTransform: "capitalize" }}>{d.label}</div>
                <div style={{ fontSize: 10, color: T.textDim }}>{d.count} alert{d.count !== 1 ? "s" : ""}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {d.critical > 0 && <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: T.danger + "18", color: T.danger, fontWeight: 700 }}>{d.critical} crit</span>}
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: d.critical > 0 ? T.danger + "18" : T.accent + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: d.critical > 0 ? T.danger : T.accent }}>{d.count}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


// ═══════════════════════════════════════════════════════════════════
//  DEPT HOME TEMPLATE A — Banner + Alerts + Navigation Grid
//  Pattern: Department banner → Alert panel → Module nav cards → Focus areas
//  Best for: Department home pages (Operations, Technology, Growth)
// ═══════════════════════════════════════════════════════════════════

export const DeptHomeA = ({ onNavigate }) => {
  const { simDate } = useSimDate();
  const [activeDept, setActiveDept] = useState("operations");
  const dept = DEPT_CONFIG[activeDept];
  const alerts = useMemo(() => getAlertsForDept(dept.key, simDate), [dept.key, simDate]);

  const deptTabs = [
    { key: "operations", label: "Operations" },
    { key: "technology", label: "Technology" },
    { key: "growth", label: "Growth" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ padding: "12px 16px", background: T.accentDim, border: `1px solid ${T.accent}33`, borderRadius: 8, fontSize: 12, color: T.textMid }}>
        <strong style={{ color: T.accent }}>Dept Home Template A — Banner + Alerts + Navigation Grid</strong> &middot; Department header banner with scoped alerts, KPI summary, and module navigation cards. Standardized home page for each department.
      </div>

      <TabBar tabs={deptTabs} active={activeDept} onChange={setActiveDept} />

      {/* Department Header Banner */}
      <div style={{ background: `linear-gradient(135deg, ${dept.color}10, ${dept.color}04)`, border: `1px solid ${dept.color}33`, borderRadius: 12, padding: "20px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 11, color: dept.color, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{dept.branch}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: T.text }}>{dept.label} Home</div>
            <div style={{ fontSize: 12, color: T.textDim, marginTop: 4 }}>{dept.subViews.length} modules &middot; {alerts.length} active alert{alerts.length !== 1 ? "s" : ""}</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {dept.kpis.slice(0, 2).map((k, i) => (
              <div key={i} style={{ background: T.bg2, borderRadius: 8, padding: "10px 14px", textAlign: "center", minWidth: 80 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: T.text }}>{k.value}</div>
                <div style={{ fontSize: 9, color: T.textDim, textTransform: "uppercase" }}>{k.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Department Alerts */}
      {alerts.length > 0 && (
        <CheckEngineLightPanel alerts={alerts} onNavigate={onNavigate} title={`${dept.label} Alerts`} color={dept.color} compact />
      )}
      {alerts.length === 0 && (
        <div style={{ padding: "12px 16px", background: T.green + "08", border: `1px solid ${T.green}22`, borderRadius: 8, display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.green }} />
          <span style={{ fontSize: 12, color: T.green, fontWeight: 500 }}>No active alerts for {dept.label}</span>
        </div>
      )}

      {/* Module Navigation Grid */}
      <SectionHeader sub={`Navigate to ${dept.label.toLowerCase()} sub-modules`}>{dept.label} Modules</SectionHeader>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
        {dept.subViews.map((sv, i) => {
          const svAlerts = alerts.filter(a => (a.targetDepts || []).some(d => d.includes(sv.key.split("-")[1] || "")));
          return (
            <button key={sv.key} onClick={() => onNavigate?.(sv.key)} style={{
              background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 10, padding: "18px 20px",
              cursor: "pointer", textAlign: "left", fontFamily: "inherit", transition: "all .15s",
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = dept.color; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.transform = "translateY(0)"; }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: dept.color + "15", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={dept.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={dept.icon} /></svg>
                </div>
                {svAlerts.length > 0 && (
                  <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: T.warn + "18", color: T.warn, fontWeight: 700 }}>{svAlerts.length}</span>
                )}
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 4 }}>{sv.label}</div>
              <div style={{ fontSize: 11, color: T.textDim }}>{sv.desc}</div>
            </button>
          );
        })}
      </div>

      {/* Focus Areas */}
      <Card title="Department Focus Areas" titleColor={dept.color}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {dept.focusAreas.map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "8px 12px", background: T.bg0, borderRadius: 6 }}>
              <div style={{ width: 4, height: 4, borderRadius: "50%", background: dept.color, marginTop: 5, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: T.text, lineHeight: 1.4 }}>{f}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};


// ═══════════════════════════════════════════════════════════════════
//  DEPT HOME TEMPLATE B — Sidebar Alerts + Content Panels
//  Pattern: Persistent alert sidebar → Stacked content sections
//  Best for: Departments that need alerts visible while working
// ═══════════════════════════════════════════════════════════════════

export const DeptHomeB = ({ onNavigate }) => {
  const { simDate } = useSimDate();
  const [activeDept, setActiveDept] = useState("technology");
  const dept = DEPT_CONFIG[activeDept];
  const alerts = useMemo(() => getAlertsForDept(dept.key, simDate), [dept.key, simDate]);

  const deptTabs = [
    { key: "operations", label: "Operations" },
    { key: "technology", label: "Technology" },
    { key: "growth", label: "Growth" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ padding: "12px 16px", background: T.accentDim, border: `1px solid ${T.accent}33`, borderRadius: 8, fontSize: 12, color: T.textMid }}>
        <strong style={{ color: T.accent }}>Dept Home Template B — Sidebar Alerts + Content Panels</strong> &middot; Persistent alert sidebar alongside stacked KPI and navigation content. Best when alerts must remain visible during department work.
      </div>

      <TabBar tabs={deptTabs} active={activeDept} onChange={setActiveDept} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 20 }}>
        {/* Left: Main content */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Department banner (compact) */}
          <div style={{ background: dept.color + "08", border: `1px solid ${dept.color}22`, borderRadius: 10, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 10, color: dept.color, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{dept.branch}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginTop: 2 }}>{dept.label} Home</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {alerts.filter(a => a.severity === "critical").length > 0 && (
                <span style={{ padding: "4px 10px", borderRadius: 6, background: T.danger + "18", color: T.danger, fontSize: 11, fontWeight: 700 }}>{alerts.filter(a => a.severity === "critical").length} Critical</span>
              )}
              <span style={{ padding: "4px 10px", borderRadius: 6, background: T.bg3, color: T.textMid, fontSize: 11 }}>{alerts.length} alerts</span>
            </div>
          </div>

          {/* KPI Cards */}
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${dept.kpis.length}, 1fr)`, gap: 10 }}>
            {dept.kpis.map((k, i) => (
              <div key={i} style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 8, padding: "12px 14px" }}>
                <div style={{ fontSize: 10, color: T.textDim, textTransform: "uppercase", letterSpacing: .8, fontWeight: 600 }}>{k.label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: T.text, marginTop: 2 }}>{k.value}</div>
                <div style={{ fontSize: 10, color: T.textMid, marginTop: 1 }}>{k.sub}</div>
              </div>
            ))}
          </div>

          {/* Module Navigation */}
          <Card title={`${dept.label} Modules`} titleColor={dept.color}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {dept.subViews.map(sv => (
                <button key={sv.key} onClick={() => onNavigate?.(sv.key)} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px",
                  background: T.bg0, border: `1px solid ${T.border}`, borderRadius: 8, cursor: "pointer",
                  fontFamily: "inherit", textAlign: "left", transition: "all .15s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = dept.color; e.currentTarget.style.background = T.bg3; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.bg0; }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{sv.label}</div>
                    <div style={{ fontSize: 10, color: T.textDim }}>{sv.desc}</div>
                  </div>
                  <span style={{ fontSize: 12, color: dept.color }}>&#8250;</span>
                </button>
              ))}
            </div>
          </Card>

          {/* Focus areas */}
          <Card title="Focus Areas" titleColor={T.textDim}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {dept.focusAreas.map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: T.text }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: dept.color, flexShrink: 0 }} />
                  {f}
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right: Alert Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 4px" }}>
            <h4 style={{ margin: 0, fontSize: 12, color: dept.color, letterSpacing: .5, textTransform: "uppercase" }}>Alerts</h4>
            <span style={{ fontSize: 10, color: T.textDim }}>{alerts.length}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 600, overflowY: "auto" }}>
            {alerts.length === 0 && (
              <div style={{ padding: 20, textAlign: "center", background: T.bg2, borderRadius: 8, color: T.green, fontSize: 11 }}>All clear</div>
            )}
            {alerts.map(alert => {
              const sevColor = alert.severity === "critical" ? T.danger : alert.severity === "warning" ? T.warn : T.blue;
              return (
                <div key={alert.id} style={{ background: T.bg2, border: `1px solid ${sevColor}18`, borderRadius: 8, padding: "10px 12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: sevColor, flexShrink: 0, boxShadow: alert.severity === "critical" ? `0 0 4px ${sevColor}60` : "none" }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: T.text, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{alert.label}</span>
                  </div>
                  <div style={{ fontSize: 10, color: T.textDim, lineHeight: 1.4 }}>{alert.detail}</div>
                  {alert.kpi && (
                    <div style={{ marginTop: 4 }}>
                      <Progress pct={Math.min(100, (alert.kpi.actual / alert.kpi.target) * 100)} color={sevColor} h={3} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};


// ═══════════════════════════════════════════════════════════════════
//  DEPT HOME TEMPLATE C — Full-Width Sections with Embedded Alerts
//  Pattern: Header → Inline alert cards → KPI + modules as sections
//  Best for: Clean, scroll-based department pages
// ═══════════════════════════════════════════════════════════════════

export const DeptHomeC = ({ onNavigate }) => {
  const { simDate } = useSimDate();
  const [activeDept, setActiveDept] = useState("growth");
  const dept = DEPT_CONFIG[activeDept];
  const alerts = useMemo(() => getAlertsForDept(dept.key, simDate), [dept.key, simDate]);
  const summary = deptAlertSummary(alerts);

  const deptTabs = [
    { key: "operations", label: "Operations" },
    { key: "technology", label: "Technology" },
    { key: "growth", label: "Growth" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ padding: "12px 16px", background: T.accentDim, border: `1px solid ${T.accent}33`, borderRadius: 8, fontSize: 12, color: T.textMid }}>
        <strong style={{ color: T.accent }}>Dept Home Template C — Full-Width Sections + Embedded Alerts</strong> &middot; Clean vertical layout with alert summary cards, KPI sections, and module navigation. Best for departments preferring a scrollable, scannable view.
      </div>

      <TabBar tabs={deptTabs} active={activeDept} onChange={setActiveDept} />

      {/* Department Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 10, borderLeft: `4px solid ${dept.color}` }}>
        <div>
          <div style={{ fontSize: 10, color: dept.color, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{dept.branch}</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: T.text, marginTop: 2 }}>{dept.label} Department Home</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ padding: "6px 12px", borderRadius: 6, background: summary.crit > 0 ? T.danger + "18" : T.green + "15", border: `1px solid ${summary.crit > 0 ? T.danger : T.green}33`, fontSize: 11, fontWeight: 600, color: summary.crit > 0 ? T.danger : T.green }}>
            {summary.crit > 0 ? `${summary.crit} Critical` : "No Critical"}
          </div>
          <div style={{ padding: "6px 12px", borderRadius: 6, background: T.bg3, fontSize: 11, fontWeight: 500, color: T.textMid }}>
            {summary.total} Total Alerts
          </div>
        </div>
      </div>

      {/* Alert Summary Cards (inline) */}
      {alerts.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <SectionHeader sub={`${alerts.length} alert${alerts.length !== 1 ? "s" : ""} requiring attention`}>System Alerts — {dept.label}</SectionHeader>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
            {alerts.slice(0, 6).map(alert => {
              const sevColor = alert.severity === "critical" ? T.danger : alert.severity === "warning" ? T.warn : T.blue;
              return (
                <div key={alert.id} style={{ background: sevColor + "08", border: `1px solid ${sevColor}22`, borderRadius: 8, padding: "12px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: sevColor, boxShadow: alert.severity === "critical" ? `0 0 6px ${sevColor}50` : "none" }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: T.text, flex: 1 }}>{alert.label}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: sevColor, textTransform: "uppercase" }}>{alert.severity}</span>
                  </div>
                  <div style={{ fontSize: 10, color: T.textDim, lineHeight: 1.4, marginBottom: 6 }}>{alert.detail}</div>
                  {alert.kpi && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ flex: 1 }}><Progress pct={Math.min(100, (alert.kpi.actual / alert.kpi.target) * 100)} color={sevColor} h={4} /></div>
                      <span style={{ fontSize: 9, color: T.textDim }}>{alert.kpi.actual}{alert.kpi.unit} / {alert.kpi.target}{alert.kpi.unit}</span>
                    </div>
                  )}
                  <div style={{ fontSize: 9, color: T.textDim, marginTop: 4 }}>Via {alert.raisedBy.agentName} &middot; {alert.raisedBy.department}</div>
                </div>
              );
            })}
          </div>
          {alerts.length > 6 && <div style={{ fontSize: 11, color: T.textDim, textAlign: "center" }}>+ {alerts.length - 6} more alert{alerts.length - 6 !== 1 ? "s" : ""}</div>}
        </div>
      )}

      {/* KPI Section */}
      <SectionHeader sub="Key performance indicators">Department Metrics</SectionHeader>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${dept.kpis.length}, 1fr)`, gap: 12 }}>
        {dept.kpis.map((k, i) => (
          <div key={i} style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 10, padding: "16px 18px" }}>
            <div style={{ fontSize: 10, color: T.textDim, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>{k.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: T.text, marginTop: 4 }}>{k.value}</div>
            <div style={{ fontSize: 11, color: T.textMid, marginTop: 2 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Module Navigation */}
      <SectionHeader sub={`Access ${dept.label.toLowerCase()} sub-modules`}>Modules</SectionHeader>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 12 }}>
        {dept.subViews.map(sv => (
          <button key={sv.key} onClick={() => onNavigate?.(sv.key)} style={{
            display: "flex", alignItems: "center", gap: 14, padding: "14px 18px",
            background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 10,
            cursor: "pointer", fontFamily: "inherit", textAlign: "left", transition: "all .15s",
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = dept.color; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; }}
          >
            <div style={{ width: 36, height: 36, borderRadius: 8, background: dept.color + "12", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={dept.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={dept.icon} /></svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{sv.label}</div>
              <div style={{ fontSize: 10, color: T.textDim }}>{sv.desc}</div>
            </div>
            <span style={{ fontSize: 14, color: dept.color }}>&#8250;</span>
          </button>
        ))}
      </div>

      {/* Focus Areas */}
      <Card title="Department Focus" titleColor={dept.color}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {dept.focusAreas.map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 14px", background: T.bg0, borderRadius: 8 }}>
              <div style={{ width: 20, height: 20, borderRadius: "50%", background: dept.color + "15", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: dept.color }}>{i + 1}</span>
              </div>
              <span style={{ fontSize: 12, color: T.text, lineHeight: 1.4 }}>{f}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
