import { useState, useMemo, useCallback } from "react";
import { T } from "../data/theme";
import { Card, DataTable, KpiCard, DraggableCardRow } from "../components/ui";
import { useBadge } from "../contexts/BadgeContext";
import { ROLE_CLEARANCE, DATA_CLASSIFICATIONS, checkAccess, getRoleClearance, getClearanceLabel } from "../data/badgeData";
import { AVAILABLE_ROLES, AVAILABLE_DEPARTMENTS, USER_STATUSES, validateUser, generateRandomPassword, generateUserId, loadAuditLog } from "../data/userData";
import { LANDING_PAGE_OPTIONS, ROLE_LANDING_DEFAULTS } from "../data/landingPageData";

/* ─────────────────────────────────────────────
   User Management Panel — Full CRUD for Settings > Users & Access
   ───────────────────────────────────────────── */

const Badge = ({ label, color }) => (
  <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: color + "20", color, fontWeight: 600, whiteSpace: "nowrap" }}>{label}</span>
);

const StatusDot = ({ status }) => {
  const color = status === "active" ? T.green : status === "locked" ? T.danger : T.textDim;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <div style={{ width: 7, height: 7, borderRadius: "50%", background: color }} />
      <span style={{ fontSize: 11, color, textTransform: "capitalize" }}>{status}</span>
    </div>
  );
};

export default function UserManagementPanel() {
  const { allUsers, activeUser, addUser, updateUser, deleteUser, resetPassword, bulkUpdateStatus } = useBadge();

  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterDept, setFilterDept] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedIds, setSelectedIds] = useState([]);
  const [editUser, setEditUser] = useState(null); // null | user object
  const [isNewUser, setIsNewUser] = useState(false);
  const [showResetPw, setShowResetPw] = useState(null); // userId or null
  const [profileUser, setProfileUser] = useState(null); // userId or null
  const [showAudit, setShowAudit] = useState(false);

  // ── Filtering ──
  const filtered = useMemo(() => {
    let items = allUsers;
    if (search) {
      const q = search.toLowerCase();
      items = items.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }
    if (filterRole !== "all") items = items.filter((u) => u.role === filterRole);
    if (filterDept !== "all") items = items.filter((u) => u.department === filterDept);
    if (filterStatus !== "all") items = items.filter((u) => u.status === filterStatus);
    return items;
  }, [allUsers, search, filterRole, filterDept, filterStatus]);

  // ── KPIs ──
  const totalUsers = allUsers.length;
  const activeCount = allUsers.filter((u) => u.status === "active").length;
  const inactiveCount = allUsers.filter((u) => u.status === "inactive").length;
  const lockedCount = allUsers.filter((u) => u.status === "locked").length;
  const mfaPct = totalUsers ? Math.round((allUsers.filter((u) => u.mfaEnabled).length / totalUsers) * 100) : 0;

  // ── Checkbox selection ──
  const toggleSelect = (id) => setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  const toggleSelectAll = () => {
    const filteredIds = filtered.map((u) => u.id);
    setSelectedIds((prev) => prev.length === filteredIds.length ? [] : filteredIds);
  };

  // ── Open add/edit modal ──
  const openAddUser = () => {
    setEditUser({ id: "", name: "", email: "", role: "Operator", department: "Operations", status: "active", mfaEnabled: false, notes: "", overrides: [] });
    setIsNewUser(true);
  };
  const openEditUser = (user) => {
    setEditUser({ ...user });
    setIsNewUser(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* KPI Row */}
      <DraggableCardRow
        items={[
          { id: "um-total", render: () => <KpiCard label="Total Users" value={totalUsers} color={T.accent} /> },
          { id: "um-active", render: () => <KpiCard label="Active" value={activeCount} color={T.green} /> },
          { id: "um-inactive", render: () => <KpiCard label="Inactive" value={inactiveCount} color={T.textDim} /> },
          { id: "um-locked", render: () => <KpiCard label="Locked" value={lockedCount} color={T.danger} /> },
          { id: "um-mfa", render: () => <KpiCard label="MFA Enabled" value={`${mfaPct}%`} color={T.blue} /> },
        ]}
        storageKey="sens-user-mgmt-kpis"
        locked={true}
      />

      {/* Search / Filter Bar */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          style={{ flex: 1, minWidth: 200, background: T.bg0, border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 12px", color: T.text, fontSize: 12, outline: "none", fontFamily: "inherit" }}
          onFocus={(e) => e.currentTarget.style.borderColor = T.accent}
          onBlur={(e) => e.currentTarget.style.borderColor = T.border}
        />
        <FilterSelect value={filterRole} onChange={setFilterRole} options={["all", ...AVAILABLE_ROLES]} label="Role" />
        <FilterSelect value={filterDept} onChange={setFilterDept} options={["all", ...AVAILABLE_DEPARTMENTS]} label="Dept" />
        <FilterSelect value={filterStatus} onChange={setFilterStatus} options={["all", ...USER_STATUSES]} label="Status" />
        <button
          onClick={openAddUser}
          style={{ background: T.accent, border: "none", borderRadius: 8, padding: "8px 16px", color: "#1A1A1A", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}
        >
          + Add User
        </button>
        <button
          onClick={() => setShowAudit(!showAudit)}
          style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 12px", color: T.textMid, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}
        >
          {showAudit ? "Hide" : "Show"} Audit Log
        </button>
      </div>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: T.accent + "08", border: `1px solid ${T.accent}20`, borderRadius: 8 }}>
          <span style={{ fontSize: 12, color: T.accent, fontWeight: 600 }}>{selectedIds.length} selected</span>
          <button onClick={() => bulkUpdateStatus(selectedIds, "active")} style={bulkBtn(T.green)}>Activate</button>
          <button onClick={() => bulkUpdateStatus(selectedIds, "inactive")} style={bulkBtn(T.textDim)}>Deactivate</button>
          <button onClick={() => bulkUpdateStatus(selectedIds, "locked")} style={bulkBtn(T.danger)}>Lock</button>
          <button onClick={() => setSelectedIds([])} style={{ ...bulkBtn(T.textMid), marginLeft: "auto" }}>Clear</button>
        </div>
      )}

      {/* User Table */}
      <Card title="USER DIRECTORY" titleColor={T.accent}>
        <DataTable
          compact
          columns={[
            <input type="checkbox" checked={selectedIds.length === filtered.length && filtered.length > 0} onChange={toggleSelectAll} style={{ accentColor: T.accent }} />,
            "Name", "Email", "Role", "Department", "Clearance", "Status", "MFA", "Last Login", "Actions",
          ]}
          rows={filtered.map((u) => {
            const rc = getRoleClearance(u.role);
            const cl = getClearanceLabel(rc.level);
            return [
              <input type="checkbox" checked={selectedIds.includes(u.id)} onChange={() => toggleSelect(u.id)} style={{ accentColor: T.accent }} />,
              <button onClick={() => setProfileUser(u.id)} style={{ background: "transparent", border: "none", color: T.text, cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 600, padding: 0, textAlign: "left" }}
                onMouseEnter={(e) => e.currentTarget.style.color = T.accent} onMouseLeave={(e) => e.currentTarget.style.color = T.text}>
                {u.name}
              </button>,
              <span style={{ fontSize: 11, color: T.textDim }}>{u.email}</span>,
              <Badge label={u.role} color={T.accent} />,
              <span style={{ fontSize: 11, color: T.textMid }}>{u.department}</span>,
              <Badge label={cl.short} color={cl.color} />,
              <StatusDot status={u.status || "active"} />,
              u.mfaEnabled ? <Badge label="On" color={T.green} /> : <Badge label="Off" color={T.textDim} />,
              <span style={{ fontSize: 11, color: T.textDim }}>{u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : "Never"}</span>,
              <div style={{ display: "flex", gap: 4 }}>
                <ActionBtn icon="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7 M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" title="Edit" onClick={() => openEditUser(u)} />
                <ActionBtn icon="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" title="Reset Password" onClick={() => setShowResetPw(u.id)} />
                {u.id !== activeUser.id && (
                  <ActionBtn icon="M3 6h18 M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" title="Delete" color={T.danger} onClick={() => { if (confirm(`Delete user "${u.name}"?`)) deleteUser(u.id); }} />
                )}
              </div>,
            ];
          })}
        />
        {filtered.length === 0 && <div style={{ textAlign: "center", padding: 20, color: T.textDim, fontSize: 12 }}>No users match the current filters</div>}
      </Card>

      {/* Audit Trail */}
      {showAudit && <AuditTrailSection />}

      {/* Modals */}
      {editUser && (
        <UserEditModal
          user={editUser}
          isNew={isNewUser}
          onSave={(data) => {
            if (isNewUser) {
              addUser(data);
            } else {
              updateUser(data.id, data);
            }
            setEditUser(null);
          }}
          onClose={() => setEditUser(null)}
          existingUsers={allUsers}
        />
      )}

      {showResetPw && (
        <PasswordResetModal
          userId={showResetPw}
          userName={allUsers.find((u) => u.id === showResetPw)?.name || showResetPw}
          onReset={(pw, force) => { resetPassword(showResetPw, pw, force); setShowResetPw(null); }}
          onClose={() => setShowResetPw(null)}
        />
      )}

      {profileUser && (
        <UserProfileCard
          userId={profileUser}
          onClose={() => setProfileUser(null)}
          onEdit={(u) => { setProfileUser(null); openEditUser(u); }}
        />
      )}
    </div>
  );
}


// ═══════════════════════════════════════════════
//  Filter Select
// ═══════════════════════════════════════════════
function FilterSelect({ value, onChange, options, label }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ background: T.bg0, border: `1px solid ${T.border}`, borderRadius: 6, padding: "8px 10px", color: T.text, fontSize: 11, outline: "none", fontFamily: "inherit", cursor: "pointer" }}
    >
      {options.map((o) => (
        <option key={o} value={o}>{o === "all" ? `All ${label}s` : o}</option>
      ))}
    </select>
  );
}


// ═══════════════════════════════════════════════
//  Action Button (icon button)
// ═══════════════════════════════════════════════
function ActionBtn({ icon, title, color = T.textMid, onClick }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4, borderRadius: 4 }}
      onMouseEnter={(e) => e.currentTarget.querySelector("svg").style.stroke = T.accent}
      onMouseLeave={(e) => e.currentTarget.querySelector("svg").style.stroke = color}
    >
      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={icon} /></svg>
    </button>
  );
}

const bulkBtn = (color) => ({
  background: color + "15",
  border: `1px solid ${color}30`,
  borderRadius: 6,
  padding: "5px 12px",
  color,
  fontSize: 11,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "inherit",
});


// ═══════════════════════════════════════════════
//  Modal Overlay
// ═══════════════════════════════════════════════
function ModalOverlay({ children, onClose, title, width = 520 }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width, maxWidth: "90vw", maxHeight: "85vh", overflowY: "auto", background: T.bg1, borderRadius: 14, border: `1px solid ${T.border}`, boxShadow: "0 12px 40px rgba(0,0,0,.5)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: `1px solid ${T.border}` }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: T.text }}>{title}</h3>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: T.textDim, cursor: "pointer", fontSize: 18, padding: 4, lineHeight: 1 }}>&times;</button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════
//  User Edit Modal (Add / Edit)
// ═══════════════════════════════════════════════
function UserEditModal({ user, isNew, onSave, onClose, existingUsers }) {
  const [form, setForm] = useState({ ...user });
  const [errors, setErrors] = useState([]);

  const update = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  const handleSave = () => {
    if (isNew && !form.id) form.id = generateUserId(form.name);
    const errs = validateUser(form, existingUsers, isNew);
    if (errs.length > 0) { setErrors(errs); return; }
    onSave(form);
  };

  const FieldRow = ({ label, children }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontSize: 11, color: T.textMid, fontWeight: 500 }}>{label}</label>
      {children}
    </div>
  );

  const fieldInput = (key, placeholder, opts = {}) => (
    <input
      value={form[key] || ""}
      onChange={(e) => update(key, e.target.value)}
      placeholder={placeholder}
      disabled={opts.disabled}
      style={{ background: T.bg0, border: `1px solid ${T.border}`, borderRadius: 6, padding: "8px 12px", color: opts.disabled ? T.textDim : T.text, fontSize: 12, outline: "none", fontFamily: "inherit" }}
      onFocus={(e) => e.currentTarget.style.borderColor = T.accent}
      onBlur={(e) => e.currentTarget.style.borderColor = T.border}
    />
  );

  return (
    <ModalOverlay title={isNew ? "Add New User" : `Edit User — ${user.name}`} onClose={onClose}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <FieldRow label="Name">{fieldInput("name", "Full name")}</FieldRow>
        <FieldRow label="Email">{fieldInput("email", "user@systemicenvs.com")}</FieldRow>
        <FieldRow label="Role">
          <select value={form.role} onChange={(e) => update("role", e.target.value)}
            style={{ background: T.bg0, border: `1px solid ${T.border}`, borderRadius: 6, padding: "8px 12px", color: T.text, fontSize: 12, outline: "none", fontFamily: "inherit" }}>
            {AVAILABLE_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </FieldRow>
        <FieldRow label="Department">
          <select value={form.department} onChange={(e) => update("department", e.target.value)}
            style={{ background: T.bg0, border: `1px solid ${T.border}`, borderRadius: 6, padding: "8px 12px", color: T.text, fontSize: 12, outline: "none", fontFamily: "inherit" }}>
            {AVAILABLE_DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </FieldRow>
        <FieldRow label="Status">
          <select value={form.status || "active"} onChange={(e) => update("status", e.target.value)}
            style={{ background: T.bg0, border: `1px solid ${T.border}`, borderRadius: 6, padding: "8px 12px", color: T.text, fontSize: 12, outline: "none", fontFamily: "inherit" }}>
            {USER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </FieldRow>
        <FieldRow label="MFA Enabled">
          <label style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 0" }}>
            <input type="checkbox" checked={form.mfaEnabled || false} onChange={(e) => update("mfaEnabled", e.target.checked)} style={{ accentColor: T.accent }} />
            <span style={{ fontSize: 12, color: T.text }}>Require MFA</span>
          </label>
        </FieldRow>
        <FieldRow label="Landing Page">
          <select value={form.landingPage || ""} onChange={(e) => update("landingPage", e.target.value || null)}
            style={{ background: T.bg0, border: `1px solid ${T.border}`, borderRadius: 6, padding: "8px 12px", color: T.text, fontSize: 12, outline: "none", fontFamily: "inherit" }}>
            {LANDING_PAGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.value === "" ? `Default for Role (${ROLE_LANDING_DEFAULTS[form.role] || "dashboard"})` : opt.label}
              </option>
            ))}
          </select>
        </FieldRow>
      </div>
      <div style={{ marginTop: 14 }}>
        <label style={{ fontSize: 11, color: T.textMid, fontWeight: 500, display: "block", marginBottom: 4 }}>Notes</label>
        <textarea
          value={form.notes || ""}
          onChange={(e) => update("notes", e.target.value)}
          placeholder="Optional notes about this user..."
          rows={2}
          style={{ width: "100%", background: T.bg0, border: `1px solid ${T.border}`, borderRadius: 6, padding: "8px 12px", color: T.text, fontSize: 12, outline: "none", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }}
        />
      </div>

      {errors.length > 0 && (
        <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 8, background: T.danger + "15", border: `1px solid ${T.danger}30` }}>
          {errors.map((e, i) => <div key={i} style={{ fontSize: 12, color: T.danger }}>{e}</div>)}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
        <button onClick={onClose} style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 18px", color: T.textMid, fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
          Cancel
        </button>
        <button onClick={handleSave} style={{ background: T.accent, border: "none", borderRadius: 8, padding: "8px 18px", color: "#1A1A1A", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
          {isNew ? "Create User" : "Save Changes"}
        </button>
      </div>
    </ModalOverlay>
  );
}


// ═══════════════════════════════════════════════
//  Password Reset Modal
// ═══════════════════════════════════════════════
function PasswordResetModal({ userId, userName, onReset, onClose }) {
  const [password, setPassword] = useState("");
  const [forceChange, setForceChange] = useState(true);
  const [mode, setMode] = useState("generate"); // generate | manual

  const handleGenerate = () => {
    setPassword(generateRandomPassword());
    setMode("generate");
  };

  return (
    <ModalOverlay title={`Reset Password — ${userName}`} onClose={onClose} width={440}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={handleGenerate} style={{ flex: 1, background: mode === "generate" ? T.accent + "15" : T.bg2, border: `1px solid ${mode === "generate" ? T.accent : T.border}`, borderRadius: 8, padding: "10px", color: mode === "generate" ? T.accent : T.textMid, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            Generate Random
          </button>
          <button onClick={() => { setMode("manual"); setPassword(""); }} style={{ flex: 1, background: mode === "manual" ? T.accent + "15" : T.bg2, border: `1px solid ${mode === "manual" ? T.accent : T.border}`, borderRadius: 8, padding: "10px", color: mode === "manual" ? T.accent : T.textMid, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            Set Manual
          </button>
        </div>

        <div>
          <label style={{ fontSize: 11, color: T.textMid, fontWeight: 500, display: "block", marginBottom: 4 }}>New Password</label>
          <input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === "generate" ? "Click 'Generate Random' above" : "Enter new password"}
            readOnly={mode === "generate"}
            style={{ width: "100%", background: T.bg0, border: `1px solid ${T.border}`, borderRadius: 6, padding: "10px 12px", color: T.text, fontSize: 13, fontFamily: "monospace", outline: "none", boxSizing: "border-box" }}
          />
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <input type="checkbox" checked={forceChange} onChange={(e) => setForceChange(e.target.checked)} style={{ accentColor: T.accent }} />
          <span style={{ fontSize: 12, color: T.text }}>Force password change on next login</span>
        </label>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
          <button onClick={onClose} style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 18px", color: T.textMid, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
          <button onClick={() => onReset(password || "changeme", forceChange)} disabled={!password && mode === "manual"} style={{ background: T.accent, border: "none", borderRadius: 8, padding: "8px 18px", color: "#1A1A1A", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Reset Password</button>
        </div>
      </div>
    </ModalOverlay>
  );
}


// ═══════════════════════════════════════════════
//  User Profile Card (detail view)
// ═══════════════════════════════════════════════
function UserProfileCard({ userId, onClose, onEdit }) {
  const { allUsers } = useBadge();
  const user = allUsers.find((u) => u.id === userId);
  if (!user) return null;

  const rc = getRoleClearance(user.role);
  const cl = getClearanceLabel(rc.level);
  const initials = user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <ModalOverlay title="User Profile" onClose={onClose} width={600}>
      <div style={{ display: "flex", gap: 20, marginBottom: 20 }}>
        {/* Avatar + basic info */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            background: T.accent + "20", border: `2px solid ${cl.color}40`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, fontWeight: 700, color: T.accent,
          }}>
            {initials}
          </div>
          <Badge label={cl.short} color={cl.color} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>{user.name}</div>
          <div style={{ fontSize: 12, color: T.textMid, marginTop: 2 }}>{user.email}</div>
          <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
            <Badge label={user.role} color={T.accent} />
            <Badge label={user.department} color={T.blue} />
            <StatusDot status={user.status || "active"} />
            {user.mfaEnabled && <Badge label="MFA" color={T.green} />}
          </div>
          <div style={{ fontSize: 11, color: T.textDim, marginTop: 8 }}>
            Created: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Unknown"} &middot;
            Last login: {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "Never"}
          </div>
        </div>
        <button onClick={() => onEdit(user)} style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 8, padding: "6px 14px", color: T.textMid, fontSize: 11, cursor: "pointer", fontFamily: "inherit", height: "fit-content" }}>
          Edit
        </button>
      </div>

      {/* Access Matrix */}
      <Card title="ACCESS MATRIX" titleColor={T.accent} style={{ marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
          {DATA_CLASSIFICATIONS.map((dc) => {
            const result = checkAccess(user, dc.domain);
            return (
              <div key={dc.domain} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 8px", borderRadius: 4, background: result.allowed ? T.green + "08" : "transparent" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: result.allowed ? T.green : T.danger + "60", flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: result.allowed ? T.text : T.textDim }}>{dc.label}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Overrides */}
      {user.overrides && user.overrides.length > 0 && (
        <Card title="ACTIVE OVERRIDES" titleColor={T.warn}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {user.overrides.map((o, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 6, background: T.bg0 }}>
                <Badge label={o.granted ? "GRANT" : "REVOKE"} color={o.granted ? T.green : T.danger} />
                <span style={{ fontSize: 12, color: T.text }}>{o.domain}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {user.notes && (
        <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 8, background: T.bg0, border: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 10, color: T.textDim, fontWeight: 600, marginBottom: 4 }}>NOTES</div>
          <div style={{ fontSize: 12, color: T.textMid, lineHeight: 1.5 }}>{user.notes}</div>
        </div>
      )}
    </ModalOverlay>
  );
}


// ═══════════════════════════════════════════════
//  Audit Trail Section
// ═══════════════════════════════════════════════
function AuditTrailSection() {
  const [entries] = useState(() => loadAuditLog());
  const [filter, setFilter] = useState("");

  const filtered = useMemo(() => {
    if (!filter) return entries.slice(0, 50);
    const q = filter.toLowerCase();
    return entries.filter((e) =>
      e.action.toLowerCase().includes(q) || e.targetUser.toLowerCase().includes(q) || e.changedBy.toLowerCase().includes(q)
    ).slice(0, 50);
  }, [entries, filter]);

  return (
    <Card title="AUDIT TRAIL" titleColor={T.purple}>
      <div style={{ marginBottom: 12 }}>
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter audit log..."
          style={{ width: "100%", background: T.bg0, border: `1px solid ${T.border}`, borderRadius: 6, padding: "8px 12px", color: T.text, fontSize: 12, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
        />
      </div>
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 20, color: T.textDim, fontSize: 12 }}>No audit entries{filter ? " match filter" : " yet"}</div>
      ) : (
        <DataTable
          compact
          columns={["Time", "Action", "Target", "Changed By", "Details"]}
          rows={filtered.map((e) => [
            <span style={{ fontSize: 10, color: T.textDim, fontFamily: "monospace" }}>{new Date(e.timestamp).toLocaleString()}</span>,
            <Badge label={e.action.replace(/_/g, " ")} color={e.action.includes("delete") ? T.danger : e.action.includes("create") ? T.green : T.blue} />,
            <span style={{ fontSize: 11, color: T.text }}>{e.targetUser}</span>,
            <span style={{ fontSize: 11, color: T.textMid }}>{e.changedBy}</span>,
            <span style={{ fontSize: 10, color: T.textDim }}>{e.details}</span>,
          ])}
        />
      )}
    </Card>
  );
}
