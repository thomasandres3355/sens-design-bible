import { useState, useMemo, useCallback } from "react";
import { T } from "@core/theme/theme";
import { Card, TabBar, DataTable, KpiCard, Progress, StatusPill, SectionHeader, StyledSelect, DraggableCardRow } from "@core/ui";
import { AssessmentPlayer } from "./AssessmentPlayer";
import { useBadge } from "@core/users/BadgeContext";
import { usePermissions } from "@core/permissions/PermissionContext";
import { BADGE_USERS, getDirectReports, getAllReports, getDepartmentUsers } from "@core/users/badgeData";
import {
  COURSES, MODULES, ASSESSMENTS, ASSIGNMENT_RULES, ENROLLMENTS,
  ASSESSMENT_ATTEMPTS, CERTIFICATES, NOTIFICATIONS, FILE_ATTACHMENTS,
  COURSE_CATEGORIES, CONTENT_TYPES,
  getEnrollmentsForUser, getEnrollmentsForManager, getEnrollmentsForTeam,
  getEnrollmentsForDepartment, calcComplianceRate, getComplianceRate,
  getOverdueItems, getUpcomingDeadlines, getAssessmentAttempts,
  getPendingReviews, getCourse, getCourseModules, getCourseAssessment,
  getUserCertificates, getUserNotifications, getUnreadNotificationCount,
  getCourseAttachments, getCoursesByCriteria, getDepartmentComplianceMatrix,
  getComplianceTrend, enrollUser, updateEnrollmentProgress,
  submitAssessmentAttempt, reviewAssessment, markNotificationRead,
  createCourse, createAssignmentRule, saveLearningData,
} from "./learningData";

/* ═══════════════════════════════════════════════════════════════════
   LEARNING VIEW — 5-tab LMS interface
   ═══════════════════════════════════════════════════════════════════ */

const fmtDate = (d) => d ? new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
const fmtFileSize = (bytes) => bytes >= 1e6 ? `${(bytes / 1e6).toFixed(1)} MB` : `${(bytes / 1e3).toFixed(0)} KB`;

const STATUS_MAP = {
  "completed": { label: "Completed", color: T.green },
  "in-progress": { label: "In Progress", color: T.blue },
  "not-started": { label: "Not Started", color: T.textDim },
  "overdue": { label: "Overdue", color: T.danger },
  "expired": { label: "Expired", color: T.warn },
};

export function LearningView({ onNavigate, defaultTab = "my" }) {
  const [tab, setTab] = useState(defaultTab);
  const { activeUser } = useBadge();
  const { can } = usePermissions();

  const canManage = can("learning", "manage");
  const canAdmin = can("learning", "admin");

  const tabs = [
    { key: "my", label: "My Learning" },
    { key: "compliance", label: "Compliance" },
    { key: "catalog", label: "Course Catalog" },
    { key: "assessments", label: "Assessments" },
    ...(canAdmin ? [{ key: "admin", label: "LMS Admin" }] : []),
  ];

  return (
    <div>
      <TabBar tabs={tabs} active={tab} onChange={setTab} />
      <div style={{ marginTop: 24 }}>
        {tab === "my" && <MyLearningTab userId={activeUser.id} />}
        {tab === "compliance" && <ComplianceTab userId={activeUser.id} canManage={canManage} canAdmin={canAdmin} />}
        {tab === "catalog" && <CatalogTab userId={activeUser.id} canManage={canManage} />}
        {tab === "assessments" && <AssessmentsTab userId={activeUser.id} canManage={canManage} />}
        {tab === "admin" && canAdmin && <AdminTab userId={activeUser.id} />}
      </div>
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   TAB 1: MY LEARNING — Individual learner dashboard
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function MyLearningTab({ userId }) {
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [takingAssessment, setTakingAssessment] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");

  const enrollments = useMemo(() => getEnrollmentsForUser(userId), [userId]);
  const notifications = useMemo(() => getUserNotifications(userId), [userId]);
  const certificates = useMemo(() => getUserCertificates(userId), [userId]);
  const unreadCount = useMemo(() => getUnreadNotificationCount(userId), [userId]);

  const completed = enrollments.filter((e) => e.status === "completed").length;
  const overdue = enrollments.filter((e) => e.status === "overdue").length;
  const inProgress = enrollments.filter((e) => e.status === "in-progress").length;
  const complianceRate = calcComplianceRate(enrollments);

  const filteredEnrollments = statusFilter === "all"
    ? enrollments
    : enrollments.filter((e) => e.status === statusFilter);

  // If taking an assessment, show the player
  if (takingAssessment) {
    const assessment = ASSESSMENTS.find((a) => a.id === takingAssessment.assessmentId);
    const enrollment = ENROLLMENTS.find((e) => e.id === takingAssessment.enrollmentId);
    return (
      <AssessmentPlayer
        assessment={assessment}
        onSubmit={(answers) => {
          submitAssessmentAttempt(enrollment.id, assessment.id, userId, answers);
          setTakingAssessment(null);
        }}
        onCancel={() => setTakingAssessment(null)}
      />
    );
  }

  // If viewing a course detail
  if (selectedEnrollment) {
    const enr = ENROLLMENTS.find((e) => e.id === selectedEnrollment);
    const course = enr ? getCourse(enr.courseId) : null;
    const modules = course ? getCourseModules(course.id) : [];
    const assessment = course ? getCourseAssessment(course.id) : null;
    const attachments = course ? getCourseAttachments(course.id) : [];
    const attempts = getAssessmentAttempts(enr?.id);
    const cat = COURSE_CATEGORIES.find((c) => c.key === course?.category);

    return (
      <div>
        <button onClick={() => setSelectedEnrollment(null)} style={{ background: "transparent", border: "none", cursor: "pointer", color: T.textDim, fontSize: 12, fontFamily: "inherit", marginBottom: 16, padding: 0, display: "flex", alignItems: "center", gap: 6 }}
          onMouseEnter={(e) => e.currentTarget.style.color = T.accent} onMouseLeave={(e) => e.currentTarget.style.color = T.textDim}>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          Back to My Learning
        </button>
        <Card title={course?.title} titleColor={cat?.color || T.accent}>
          <div style={{ padding: 20 }}>
            {/* Course meta */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
              <Pill label={cat?.label} color={cat?.color} />
              <Pill label={course?.type === "required" ? "Required" : "Optional"} color={course?.type === "required" ? T.danger : T.blue} />
              <Pill label={course?.contentType} color={T.textMid} />
              <Pill label={`~${course?.estimatedMinutes} min`} color={T.textMid} />
              <Pill label={`v${course?.version}`} color={T.textDim} />
            </div>
            <p style={{ fontSize: 13, color: T.textMid, lineHeight: 1.7, margin: "0 0 20px" }}>{course?.description}</p>

            {/* Progress */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>Progress</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: STATUS_MAP[enr?.status]?.color }}>{enr?.progress}%</span>
              </div>
              <div style={{ height: 8, borderRadius: 4, background: T.bg0 }}>
                <div style={{ width: `${enr?.progress}%`, height: "100%", borderRadius: 4, background: STATUS_MAP[enr?.status]?.color, transition: "width .3s" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11, color: T.textDim }}>
                <span>Assigned: {fmtDate(enr?.assignedDate)}</span>
                <span>Due: {fmtDate(enr?.dueDate)}</span>
              </div>
            </div>

            {/* Modules */}
            {modules.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <SectionHeader>Course Modules</SectionHeader>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {modules.map((m, i) => (
                    <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 8, background: T.bg0, border: `1px solid ${T.border}` }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: T.accentDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: T.accent }}>{i + 1}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{m.title}</div>
                        {m.assessmentId && <span style={{ fontSize: 10, color: T.warn, fontWeight: 600 }}>Includes assessment</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Assessment */}
            {assessment && (
              <div style={{ marginBottom: 20 }}>
                <SectionHeader>Assessment</SectionHeader>
                <div style={{ padding: 16, borderRadius: 8, background: T.bg0, border: `1px solid ${T.border}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{assessment.title}</div>
                      <div style={{ fontSize: 11, color: T.textDim, marginTop: 4 }}>
                        {assessment.questions.length} questions · {assessment.timeLimit} min · Pass: {assessment.passingScore}%
                        {assessment.type === "manual-review" && " · Manager review required"}
                      </div>
                    </div>
                    {enr?.status !== "completed" && (
                      <button onClick={() => setTakingAssessment({ assessmentId: assessment.id, enrollmentId: enr?.id })}
                        style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: T.accent, color: "#1A1A1A", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                        Take Assessment
                      </button>
                    )}
                  </div>
                  {attempts.length > 0 && (
                    <div style={{ marginTop: 12, borderTop: `1px solid ${T.border}`, paddingTop: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: T.textDim, marginBottom: 8 }}>Previous Attempts</div>
                      {attempts.map((att) => (
                        <div key={att.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", fontSize: 12 }}>
                          <span style={{ color: T.textMid }}>Attempt {att.attemptNumber} — {fmtDate(att.submittedAt)}</span>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontWeight: 700, color: att.passed ? T.green : T.danger }}>{att.score}%</span>
                            {att.reviewStatus && <Pill label={att.reviewStatus} color={att.reviewStatus === "approved" ? T.green : att.reviewStatus === "rejected" ? T.danger : T.warn} />}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* File attachments */}
            {attachments.length > 0 && (
              <div>
                <SectionHeader>Files &amp; Resources</SectionHeader>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {attachments.map((f) => (
                    <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 6, background: T.bg0, border: `1px solid ${T.border}` }}>
                      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={T.blue} strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                      <span style={{ fontSize: 12, color: T.text, flex: 1 }}>{f.name}</span>
                      <span style={{ fontSize: 10, color: T.textDim }}>{fmtFileSize(f.size)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  }

  // ─── Dashboard view ───
  const kpis = [
    { id: "lk1", label: "Compliance", value: `${complianceRate}%`, sub: `${completed}/${enrollments.length} courses`, spark: [60, 65, 70, 75, complianceRate], color: complianceRate >= 80 ? T.green : complianceRate >= 60 ? T.warn : T.danger, target: 90, sparkTarget: 90 },
    { id: "lk2", label: "Completed", value: completed, sub: "courses finished", spark: [0, 1, 2, 3, completed], color: T.green },
    { id: "lk3", label: "In Progress", value: inProgress, sub: "active courses", spark: [0, 1, 1, 2, inProgress], color: T.blue },
    { id: "lk4", label: "Overdue", value: overdue, sub: "need attention", spark: [0, 0, 1, 1, overdue], color: T.danger, target: 0, invert: true, threshold: 1 },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* KPIs */}
      <DraggableCardRow items={kpis} locked={true} storageKey="learning-my-kpis" renderItem={(k) => <KpiCard key={k.id} {...k} />} />

      {/* Notifications banner */}
      {unreadCount > 0 && (
        <Card title={`Notifications (${unreadCount} unread)`} titleColor={T.warn}>
          <div style={{ maxHeight: 180, overflowY: "auto" }}>
            {notifications.slice(0, 8).map((n) => (
              <div key={n.id} onClick={() => markNotificationRead(n.id)}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", borderBottom: `1px solid ${T.border}`, cursor: "pointer", background: n.read ? "transparent" : T.accentBg }}
                onMouseEnter={(e) => e.currentTarget.style.background = T.bg3} onMouseLeave={(e) => e.currentTarget.style.background = n.read ? "transparent" : T.accentBg}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: n.read ? "transparent" : T.accent, flexShrink: 0 }} />
                <NotifIcon type={n.type} />
                <div style={{ flex: 1, fontSize: 12, color: T.text }}>{n.message}</div>
                <span style={{ fontSize: 10, color: T.textDim, whiteSpace: "nowrap" }}>{fmtDate(n.createdAt)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Course list */}
      <Card title="My Courses" titleColor={T.accent} action={
        <div style={{ display: "flex", gap: 6 }}>
          {["all", "in-progress", "overdue", "not-started", "completed"].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)} style={{
              padding: "4px 10px", borderRadius: 6, border: `1px solid ${statusFilter === s ? T.accent : T.border}`,
              background: statusFilter === s ? T.accentDim : "transparent",
              color: statusFilter === s ? T.accent : T.textDim,
              fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", textTransform: "capitalize",
            }}>{s === "all" ? "All" : STATUS_MAP[s]?.label || s}</button>
          ))}
        </div>
      }>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 14, padding: "0 0 4px" }}>
          {filteredEnrollments.map((enr) => {
            const course = getCourse(enr.courseId);
            const cat = COURSE_CATEGORIES.find((c) => c.key === course?.category);
            const st = STATUS_MAP[enr.status];
            return (
              <div key={enr.id} onClick={() => setSelectedEnrollment(enr.id)}
                style={{ padding: 16, borderRadius: 10, background: T.bg0, border: `1px solid ${T.border}`, cursor: "pointer", transition: "border-color .15s" }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = T.accent} onMouseLeave={(e) => e.currentTarget.style.borderColor = T.border}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <Pill label={cat?.label} color={cat?.color} />
                  <Pill label={st?.label} color={st?.color} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 6, lineHeight: 1.4 }}>{course?.title}</div>
                <div style={{ fontSize: 11, color: T.textDim, marginBottom: 10, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{course?.description}</div>
                {/* Progress bar */}
                <div style={{ marginBottom: 6 }}>
                  <div style={{ height: 4, borderRadius: 2, background: T.bg3 }}>
                    <div style={{ width: `${enr.progress}%`, height: "100%", borderRadius: 2, background: st?.color }} />
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: T.textDim }}>
                  <span>{enr.progress}% complete</span>
                  <span>Due: {fmtDate(enr.dueDate)}</span>
                </div>
              </div>
            );
          })}
          {filteredEnrollments.length === 0 && (
            <div style={{ gridColumn: "1 / -1", padding: 40, textAlign: "center", color: T.textDim, fontSize: 13 }}>
              No courses match this filter.
            </div>
          )}
        </div>
      </Card>

      {/* Certificates */}
      {certificates.length > 0 && (
        <Card title={`Certificates (${certificates.length})`} titleColor={T.green}>
          <DataTable
            columns={[
              { key: "course", header: "Course", render: (_, r) => getCourse(r.courseId)?.title },
              { key: "issued", header: "Issued", render: (_, r) => fmtDate(r.issuedDate) },
              { key: "expires", header: "Expires", render: (_, r) => r.expiresDate ? fmtDate(r.expiresDate) : "No expiry" },
              { key: "number", header: "Certificate #", render: (_, r) => <span style={{ fontFamily: "monospace", fontSize: 11 }}>{r.certificateNumber}</span> },
            ]}
            rows={certificates}
          />
        </Card>
      )}
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   TAB 2: COMPLIANCE — Corporate & department dashboards
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function ComplianceTab({ userId, canManage, canAdmin }) {
  const [scope, setScope] = useState(canAdmin ? "org" : "team");
  const user = BADGE_USERS.find((u) => u.id === userId);
  const departments = useMemo(() => [...new Set(BADGE_USERS.map((u) => u.department))], []);
  const [selectedDept, setSelectedDept] = useState(user?.department || departments[0]);

  // Compliance metrics
  const orgRate = getComplianceRate("org");
  const deptRate = getComplianceRate("department", selectedDept);
  const teamRate = getComplianceRate("team", userId);
  const userRate = getComplianceRate("user", userId);

  const orgOverdue = getOverdueItems("org").length;
  const deptOverdue = getOverdueItems("department", selectedDept).length;
  const orgUpcoming = getUpcomingDeadlines("org", null, 14).length;

  const complianceMatrix = useMemo(() => getDepartmentComplianceMatrix(), []);
  const trendData = useMemo(() => getComplianceTrend(6), []);

  // Direct reports compliance
  const directReports = getDirectReports(userId);
  const reportCompliance = directReports.map((r) => {
    const enrs = getEnrollmentsForUser(r.id);
    return { ...r, compliance: calcComplianceRate(enrs), overdue: enrs.filter((e) => e.status === "overdue").length, total: enrs.length };
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Scope selector */}
      <div style={{ display: "flex", gap: 8 }}>
        {canAdmin && <ScopeButton label="Organization" active={scope === "org"} onClick={() => setScope("org")} />}
        <ScopeButton label="Department" active={scope === "dept"} onClick={() => setScope("dept")} />
        {directReports.length > 0 && <ScopeButton label="My Team" active={scope === "team"} onClick={() => setScope("team")} />}
        <ScopeButton label="My Compliance" active={scope === "user"} onClick={() => setScope("user")} />
      </div>

      {/* ─── Organization scope ─── */}
      {scope === "org" && (
        <>
          {/* KPIs */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
            <ComplianceGauge label="Overall Compliance" value={orgRate} target={90} />
            <MetricCard label="Overdue Items" value={orgOverdue} color={orgOverdue > 0 ? T.danger : T.green} icon="!" />
            <MetricCard label="Due Next 14 Days" value={orgUpcoming} color={T.warn} icon="&#x23F3;" />
            <MetricCard label="Total Enrollments" value={ENROLLMENTS.length} color={T.blue} icon="&#x1F4DA;" />
          </div>

          {/* Department heatmap */}
          <Card title="Department Compliance Matrix" titleColor={T.accent}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: "8px 12px", color: T.textDim, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>Department</th>
                    {COURSE_CATEGORIES.map((cat) => (
                      <th key={cat.key} style={{ textAlign: "center", padding: "8px 12px", color: cat.color, fontWeight: 600, borderBottom: `1px solid ${T.border}`, fontSize: 11 }}>{cat.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {complianceMatrix.map((row) => (
                    <tr key={row.department}>
                      <td style={{ padding: "8px 12px", color: T.text, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{row.department}</td>
                      {COURSE_CATEGORIES.map((cat) => {
                        const val = row[cat.key];
                        const bg = val === null ? "transparent" : val >= 80 ? T.greenDim : val >= 60 ? T.warnDim : T.dangerDim;
                        const fg = val === null ? T.textDim : val >= 80 ? T.green : val >= 60 ? T.warn : T.danger;
                        return (
                          <td key={cat.key} style={{ textAlign: "center", padding: "8px 12px", borderBottom: `1px solid ${T.border}`, background: bg }}>
                            <span style={{ fontWeight: 700, color: fg }}>{val === null ? "—" : `${val}%`}</span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Trend */}
          <Card title="Compliance Trend (6 months)" titleColor={T.blue}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 12, padding: "12px 0", height: 160 }}>
              {trendData.map((d) => {
                const h = Math.max(4, (d.rate / 100) * 140);
                const color = d.rate >= 90 ? T.green : d.rate >= 70 ? T.warn : T.danger;
                return (
                  <div key={d.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color }}>{d.rate}%</span>
                    <div style={{ width: "100%", maxWidth: 48, height: h, borderRadius: "6px 6px 0 0", background: color + "40", border: `1px solid ${color}60` }} />
                    <span style={{ fontSize: 10, color: T.textDim }}>{d.month}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ borderTop: `1px dashed ${T.border}`, padding: "8px 0 0", fontSize: 11, color: T.textDim, textAlign: "center" }}>
              Target: 90% compliance
            </div>
          </Card>
        </>
      )}

      {/* ─── Department scope ─── */}
      {scope === "dept" && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 12, color: T.textMid, fontWeight: 600 }}>Department:</span>
            <StyledSelect value={selectedDept} onChange={setSelectedDept} options={departments.map((d) => ({ value: d, label: d }))} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
            <ComplianceGauge label={`${selectedDept} Compliance`} value={deptRate} target={90} />
            <MetricCard label="Overdue" value={deptOverdue} color={deptOverdue > 0 ? T.danger : T.green} icon="!" />
            <MetricCard label="Team Members" value={getDepartmentUsers(selectedDept).length} color={T.blue} icon="&#x1F465;" />
          </div>
          {/* Department user grid */}
          <Card title={`${selectedDept} Team Compliance`} titleColor={T.accent}>
            <DataTable
              columns={[
                { key: "name", header: "Name", render: (_, r) => <span style={{ fontWeight: 600 }}>{r.name}</span> },
                { key: "role", header: "Role" },
                { key: "compliance", header: "Compliance", render: (_, r) => {
                  const enrs = getEnrollmentsForUser(r.id);
                  const rate = calcComplianceRate(enrs);
                  const color = rate >= 80 ? T.green : rate >= 60 ? T.warn : T.danger;
                  return <span style={{ fontWeight: 700, color }}>{rate}%</span>;
                }},
                { key: "overdue", header: "Overdue", render: (_, r) => {
                  const count = getEnrollmentsForUser(r.id).filter((e) => e.status === "overdue").length;
                  return <span style={{ color: count > 0 ? T.danger : T.green, fontWeight: 600 }}>{count}</span>;
                }},
                { key: "total", header: "Enrollments", render: (_, r) => getEnrollmentsForUser(r.id).length },
              ]}
              rows={getDepartmentUsers(selectedDept)}
            />
          </Card>
        </>
      )}

      {/* ─── Team scope ─── */}
      {scope === "team" && directReports.length > 0 && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
            <ComplianceGauge label="Team Compliance" value={teamRate} target={90} />
            <MetricCard label="Direct Reports" value={directReports.length} color={T.blue} icon="&#x1F465;" />
            <MetricCard label="Team Overdue" value={reportCompliance.reduce((s, r) => s + r.overdue, 0)} color={T.danger} icon="!" />
          </div>
          <Card title="Direct Reports" titleColor={T.accent}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
              {reportCompliance.map((r) => (
                <div key={r.id} style={{ padding: 16, borderRadius: 10, background: T.bg0, border: `1px solid ${T.border}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: T.accent + "20", border: `1.5px solid ${T.accent}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: T.accent }}>
                      {r.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{r.name}</div>
                      <div style={{ fontSize: 11, color: T.textDim }}>{r.role} · {r.department}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 24, fontWeight: 800, color: r.compliance >= 80 ? T.green : r.compliance >= 60 ? T.warn : T.danger }}>{r.compliance}%</div>
                      <div style={{ fontSize: 10, color: T.textDim }}>compliance · {r.overdue} overdue</div>
                    </div>
                    <MiniRing value={r.compliance} size={48} color={r.compliance >= 80 ? T.green : r.compliance >= 60 ? T.warn : T.danger} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {/* ─── User scope ─── */}
      {scope === "user" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
          <ComplianceGauge label="My Compliance" value={userRate} target={90} />
          <MetricCard label="My Overdue" value={getOverdueItems("user", userId).length} color={T.danger} icon="!" />
          <MetricCard label="My Courses" value={getEnrollmentsForUser(userId).length} color={T.blue} icon="&#x1F4DA;" />
          <MetricCard label="Certificates" value={getUserCertificates(userId).length} color={T.green} icon="&#x1F3C6;" />
        </div>
      )}
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   TAB 3: COURSE CATALOG
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function CatalogTab({ userId, canManage }) {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const courses = useMemo(() => getCoursesByCriteria({ search, category: catFilter || undefined, type: typeFilter || undefined }), [search, catFilter, typeFilter]);
  const userEnrollments = useMemo(() => getEnrollmentsForUser(userId), [userId]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Filters */}
      <Card>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", padding: "4px 0" }}>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search courses..."
            style={{ flex: 1, minWidth: 200, padding: "8px 14px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg0, color: T.text, fontSize: 13, fontFamily: "inherit", outline: "none" }}
            onFocus={(e) => e.currentTarget.style.borderColor = T.accent} onBlur={(e) => e.currentTarget.style.borderColor = T.border} />
          <StyledSelect value={catFilter} onChange={setCatFilter} options={[{ value: "", label: "All Categories" }, ...COURSE_CATEGORIES.map((c) => ({ value: c.key, label: c.label }))]} />
          <StyledSelect value={typeFilter} onChange={setTypeFilter} options={[{ value: "", label: "All Types" }, { value: "required", label: "Required" }, { value: "optional", label: "Optional" }]} />
        </div>
      </Card>

      {/* Course grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
        {courses.map((c) => {
          const cat = COURSE_CATEGORIES.find((cc) => cc.key === c.category);
          const enrolled = userEnrollments.find((e) => e.courseId === c.id);
          const attachments = getCourseAttachments(c.id);
          return (
            <Card key={c.id}>
              <div style={{ padding: 4 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <Pill label={cat?.label} color={cat?.color} />
                    <Pill label={c.type === "required" ? "Required" : "Optional"} color={c.type === "required" ? T.danger : T.blue} />
                  </div>
                  <span style={{ fontSize: 10, color: T.textDim }}>v{c.version}</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 6 }}>{c.title}</div>
                <div style={{ fontSize: 11, color: T.textDim, lineHeight: 1.6, marginBottom: 12, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{c.description}</div>
                <div style={{ display: "flex", gap: 12, fontSize: 11, color: T.textMid, marginBottom: 12 }}>
                  <span>{c.estimatedMinutes} min</span>
                  <span>·</span>
                  <span>Pass: {c.passingScore}%</span>
                  <span>·</span>
                  <span style={{ textTransform: "capitalize" }}>{c.contentType}</span>
                  {attachments.length > 0 && <>
                    <span>·</span>
                    <span>{attachments.length} file{attachments.length !== 1 ? "s" : ""}</span>
                  </>}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  {enrolled ? (
                    <Pill label={STATUS_MAP[enrolled.status]?.label} color={STATUS_MAP[enrolled.status]?.color} />
                  ) : (
                    <button onClick={() => enrollUser(userId, c.id)}
                      style={{ padding: "6px 14px", borderRadius: 6, border: "none", background: T.accent, color: "#1A1A1A", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                      Enroll
                    </button>
                  )}
                  <span style={{ fontSize: 10, color: T.textDim }}>Updated {fmtDate(c.updatedAt)}</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      {courses.length === 0 && (
        <div style={{ padding: 60, textAlign: "center", color: T.textDim, fontSize: 14 }}>
          No courses match your search criteria.
        </div>
      )}
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   TAB 4: ASSESSMENTS — Pending reviews & assessment management
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function AssessmentsTab({ userId, canManage }) {
  const [reviewNotes, setReviewNotes] = useState({});
  const pendingReviews = useMemo(() => getPendingReviews(userId), [userId]);
  const myAttempts = useMemo(() => ASSESSMENT_ATTEMPTS.filter((a) => a.userId === userId), [userId]);

  const handleReview = useCallback((attemptId, status) => {
    const notes = reviewNotes[attemptId] || "";
    reviewAssessment(attemptId, userId, status, notes);
    setReviewNotes((prev) => { const next = { ...prev }; delete next[attemptId]; return next; });
  }, [reviewNotes, userId]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Pending reviews (for managers) */}
      {pendingReviews.length > 0 && (
        <Card title={`Pending Reviews (${pendingReviews.length})`} titleColor={T.warn}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {pendingReviews.map((att) => {
              const assessment = ASSESSMENTS.find((a) => a.id === att.assessmentId);
              const learner = BADGE_USERS.find((u) => u.id === att.userId);
              const course = assessment ? getCourse(assessment.courseId) : null;
              return (
                <div key={att.id} style={{ padding: 16, borderRadius: 10, background: T.bg0, border: `1px solid ${T.border}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{learner?.name}</div>
                      <div style={{ fontSize: 12, color: T.textDim }}>{course?.title} — {assessment?.title}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: att.passed ? T.green : T.danger }}>{att.score}%</div>
                      <div style={{ fontSize: 10, color: T.textDim }}>Submitted {fmtDate(att.submittedAt)}</div>
                    </div>
                  </div>

                  {/* Show essay/short-answer responses */}
                  <div style={{ marginBottom: 12 }}>
                    {att.answers.filter((a) => {
                      const q = assessment?.questions.find((q) => q.id === a.questionId);
                      return q?.type === "essay" || q?.type === "short-answer";
                    }).map((a) => {
                      const q = assessment?.questions.find((qq) => qq.id === a.questionId);
                      return (
                        <div key={a.questionId} style={{ padding: 10, borderRadius: 6, background: T.bg1, border: `1px solid ${T.border}`, marginBottom: 8 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: T.textMid, marginBottom: 4 }}>Q: {q?.prompt}</div>
                          <div style={{ fontSize: 12, color: T.text, lineHeight: 1.5 }}>{a.answer || "(no answer)"}</div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Review actions */}
                  <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                    <input type="text" value={reviewNotes[att.id] || ""} onChange={(e) => setReviewNotes((prev) => ({ ...prev, [att.id]: e.target.value }))}
                      placeholder="Notes (optional)..."
                      style={{ flex: 1, padding: "8px 12px", borderRadius: 6, border: `1px solid ${T.border}`, background: T.bg1, color: T.text, fontSize: 12, fontFamily: "inherit", outline: "none" }} />
                    <button onClick={() => handleReview(att.id, "approved")} style={{ padding: "8px 18px", borderRadius: 6, border: "none", background: T.green, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Approve</button>
                    <button onClick={() => handleReview(att.id, "rejected")} style={{ padding: "8px 18px", borderRadius: 6, border: "none", background: T.danger, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Reject</button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {pendingReviews.length === 0 && canManage && (
        <Card>
          <div style={{ padding: 40, textAlign: "center", color: T.textDim, fontSize: 13 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>&#x2705;</div>
            No pending reviews. All assessment submissions have been reviewed.
          </div>
        </Card>
      )}

      {/* My assessment history */}
      <Card title="My Assessment History" titleColor={T.blue}>
        {myAttempts.length > 0 ? (
          <DataTable
            columns={[
              { key: "assessment", header: "Assessment", render: (_, r) => ASSESSMENTS.find((a) => a.id === r.assessmentId)?.title },
              { key: "attempt", header: "Attempt", render: (_, r) => `#${r.attemptNumber}` },
              { key: "score", header: "Score", render: (_, r) => <span style={{ fontWeight: 700, color: r.passed ? T.green : T.danger }}>{r.score}%</span> },
              { key: "passed", header: "Result", render: (_, r) => <Pill label={r.passed ? "Passed" : "Failed"} color={r.passed ? T.green : T.danger} /> },
              { key: "review", header: "Review", render: (_, r) => r.reviewStatus ? <Pill label={r.reviewStatus} color={r.reviewStatus === "approved" ? T.green : r.reviewStatus === "rejected" ? T.danger : T.warn} /> : "Auto-graded" },
              { key: "date", header: "Date", render: (_, r) => fmtDate(r.submittedAt) },
            ]}
            rows={myAttempts.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))}
          />
        ) : (
          <div style={{ padding: 40, textAlign: "center", color: T.textDim, fontSize: 13 }}>
            No assessments taken yet.
          </div>
        )}
      </Card>
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   TAB 5: LMS ADMIN — Course & rule management
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function AdminTab({ userId }) {
  const [subTab, setSubTab] = useState("rules");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Sub-navigation */}
      <div style={{ display: "flex", gap: 8 }}>
        {[
          { key: "rules", label: "Assignment Rules" },
          { key: "courses", label: "Course Management" },
          { key: "enrollments", label: "All Enrollments" },
          { key: "stats", label: "Statistics" },
        ].map((st) => (
          <button key={st.key} onClick={() => setSubTab(st.key)} style={{
            padding: "8px 18px", borderRadius: 8,
            border: `1px solid ${subTab === st.key ? T.accent : T.border}`,
            background: subTab === st.key ? T.accentDim : "transparent",
            color: subTab === st.key ? T.accent : T.textMid,
            fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
          }}>{st.label}</button>
        ))}
      </div>

      {subTab === "rules" && <AdminRulesSection />}
      {subTab === "courses" && <AdminCoursesSection />}
      {subTab === "enrollments" && <AdminEnrollmentsSection />}
      {subTab === "stats" && <AdminStatsSection />}
    </div>
  );
}

function AdminRulesSection() {
  return (
    <Card title="Assignment Rules" titleColor={T.accent}>
      <DataTable
        columns={[
          { key: "name", header: "Rule Name", render: (_, r) => <span style={{ fontWeight: 600 }}>{r.name}</span> },
          { key: "target", header: "Target", render: (_, r) => <Pill label={`${r.targetType}: ${r.targetValue}`} color={T.blue} /> },
          { key: "courses", header: "Courses", render: (_, r) => r.courseIds.map((id) => getCourse(id)?.title?.substring(0, 25)).join(", ") },
          { key: "due", header: "Due In", render: (_, r) => `${r.dueInDays} days` },
          { key: "recertify", header: "Recertify", render: (_, r) => r.recertifyDays ? `${r.recertifyDays} days` : "One-time" },
          { key: "status", header: "Status", render: (_, r) => <Pill label={r.isActive ? "Active" : "Inactive"} color={r.isActive ? T.green : T.textDim} /> },
          { key: "priority", header: "Priority", render: (_, r) => r.priority },
        ]}
        rows={ASSIGNMENT_RULES}
      />
    </Card>
  );
}

function AdminCoursesSection() {
  return (
    <Card title="Course Management" titleColor={T.blue}>
      <DataTable
        columns={[
          { key: "title", header: "Course", render: (_, r) => <span style={{ fontWeight: 600 }}>{r.title}</span> },
          { key: "category", header: "Category", render: (_, r) => {
            const cat = COURSE_CATEGORIES.find((c) => c.key === r.category);
            return <Pill label={cat?.label} color={cat?.color} />;
          }},
          { key: "type", header: "Type", render: (_, r) => <Pill label={r.type} color={r.type === "required" ? T.danger : T.blue} /> },
          { key: "content", header: "Format", render: (_, r) => r.contentType },
          { key: "time", header: "Duration", render: (_, r) => `${r.estimatedMinutes} min` },
          { key: "pass", header: "Pass %", render: (_, r) => `${r.passingScore}%` },
          { key: "version", header: "Version", render: (_, r) => `v${r.version}` },
          { key: "enrolled", header: "Enrolled", render: (_, r) => ENROLLMENTS.filter((e) => e.courseId === r.id).length },
        ]}
        rows={COURSES}
      />
    </Card>
  );
}

function AdminEnrollmentsSection() {
  const [deptFilter, setDeptFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const departments = [...new Set(BADGE_USERS.map((u) => u.department))];

  const filtered = useMemo(() => {
    return ENROLLMENTS.filter((e) => {
      if (statusFilter && e.status !== statusFilter) return false;
      if (deptFilter) {
        const user = BADGE_USERS.find((u) => u.id === e.userId);
        if (user?.department !== deptFilter) return false;
      }
      return true;
    });
  }, [deptFilter, statusFilter]);

  return (
    <>
      <Card>
        <div style={{ display: "flex", gap: 12, padding: "4px 0" }}>
          <StyledSelect value={deptFilter} onChange={setDeptFilter} options={[{ value: "", label: "All Departments" }, ...departments.map((d) => ({ value: d, label: d }))]} />
          <StyledSelect value={statusFilter} onChange={setStatusFilter} options={[{ value: "", label: "All Statuses" }, ...Object.entries(STATUS_MAP).map(([k, v]) => ({ value: k, label: v.label }))]} />
          <span style={{ fontSize: 12, color: T.textDim, display: "flex", alignItems: "center" }}>{filtered.length} enrollments</span>
        </div>
      </Card>
      <Card title={`Enrollments (${filtered.length})`} titleColor={T.accent}>
        <DataTable
          columns={[
            { key: "user", header: "User", render: (_, r) => { const u = BADGE_USERS.find((u) => u.id === r.userId); return <span style={{ fontWeight: 600 }}>{u?.name || r.userId}</span>; }},
            { key: "dept", header: "Dept", render: (_, r) => BADGE_USERS.find((u) => u.id === r.userId)?.department },
            { key: "course", header: "Course", render: (_, r) => getCourse(r.courseId)?.title },
            { key: "status", header: "Status", render: (_, r) => <Pill label={STATUS_MAP[r.status]?.label} color={STATUS_MAP[r.status]?.color} /> },
            { key: "progress", header: "Progress", render: (_, r) => (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 60, height: 4, borderRadius: 2, background: T.bg0 }}>
                  <div style={{ width: `${r.progress}%`, height: "100%", borderRadius: 2, background: STATUS_MAP[r.status]?.color }} />
                </div>
                <span style={{ fontSize: 11 }}>{r.progress}%</span>
              </div>
            )},
            { key: "assigned", header: "Assigned", render: (_, r) => fmtDate(r.assignedDate) },
            { key: "due", header: "Due", render: (_, r) => fmtDate(r.dueDate) },
          ]}
          rows={filtered.slice(0, 100)}
        />
      </Card>
    </>
  );
}

function AdminStatsSection() {
  const totalEnrollments = ENROLLMENTS.length;
  const completedEnr = ENROLLMENTS.filter((e) => e.status === "completed").length;
  const overdueEnr = ENROLLMENTS.filter((e) => e.status === "overdue").length;
  const avgCompletion = totalEnrollments > 0 ? Math.round(ENROLLMENTS.reduce((s, e) => s + e.progress, 0) / totalEnrollments) : 0;
  const totalAttempts = ASSESSMENT_ATTEMPTS.length;
  const avgScore = totalAttempts > 0 ? Math.round(ASSESSMENT_ATTEMPTS.reduce((s, a) => s + a.score, 0) / totalAttempts) : 0;
  const passRate = totalAttempts > 0 ? Math.round(ASSESSMENT_ATTEMPTS.filter((a) => a.passed).length / totalAttempts * 100) : 0;

  const catStats = COURSE_CATEGORIES.map((cat) => {
    const catCourses = COURSES.filter((c) => c.category === cat.key);
    const catEnrollments = ENROLLMENTS.filter((e) => catCourses.some((c) => c.id === e.courseId));
    const completed = catEnrollments.filter((e) => e.status === "completed").length;
    return { ...cat, courses: catCourses.length, enrollments: catEnrollments.length, completed, rate: catEnrollments.length > 0 ? Math.round((completed / catEnrollments.length) * 100) : 0 };
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14 }}>
        <MetricCard label="Total Enrollments" value={totalEnrollments} color={T.blue} icon="&#x1F4DA;" />
        <MetricCard label="Completed" value={completedEnr} color={T.green} icon="&#x2705;" />
        <MetricCard label="Overdue" value={overdueEnr} color={T.danger} icon="&#x26A0;" />
        <MetricCard label="Avg Completion" value={`${avgCompletion}%`} color={T.accent} icon="&#x1F4CA;" />
        <MetricCard label="Total Attempts" value={totalAttempts} color={T.purple} icon="&#x1F4DD;" />
        <MetricCard label="Avg Score" value={`${avgScore}%`} color={T.blue} icon="&#x1F3AF;" />
        <MetricCard label="Pass Rate" value={`${passRate}%`} color={passRate >= 70 ? T.green : T.warn} icon="&#x2705;" />
        <MetricCard label="Active Rules" value={ASSIGNMENT_RULES.filter((r) => r.isActive).length} color={T.teal} icon="&#x1F4CB;" />
      </div>

      <Card title="Category Breakdown" titleColor={T.accent}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
          {catStats.map((cat) => (
            <div key={cat.key} style={{ padding: 16, borderRadius: 10, background: T.bg0, border: `1px solid ${T.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <Pill label={cat.label} color={cat.color} />
                <span style={{ fontSize: 11, color: T.textDim }}>{cat.courses} courses</span>
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: cat.rate >= 80 ? T.green : cat.rate >= 60 ? T.warn : T.danger }}>{cat.rate}%</div>
              <div style={{ fontSize: 10, color: T.textDim }}>{cat.completed}/{cat.enrollments} enrollments completed</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   SHARED SUB-COMPONENTS
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function Pill({ label, color }) {
  if (!label) return null;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", padding: "2px 8px",
      borderRadius: 4, background: (color || T.textDim) + "18",
      color: color || T.textDim, fontSize: 10, fontWeight: 700,
      textTransform: "capitalize", letterSpacing: 0.3,
    }}>{label}</span>
  );
}

function ScopeButton({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: "8px 18px", borderRadius: 8,
      border: `1px solid ${active ? T.accent : T.border}`,
      background: active ? T.accentDim : "transparent",
      color: active ? T.accent : T.textMid,
      fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
    }}>{label}</button>
  );
}

function ComplianceGauge({ label, value, target = 90 }) {
  const color = value >= target ? T.green : value >= 60 ? T.warn : T.danger;
  return (
    <div style={{ padding: 20, borderRadius: 12, background: T.bg2, border: `1px solid ${T.border}`, textAlign: "center" }}>
      <MiniRing value={value} size={80} color={color} />
      <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginTop: 8 }}>{label}</div>
      <div style={{ fontSize: 10, color: T.textDim, marginTop: 2 }}>Target: {target}%</div>
    </div>
  );
}

function MiniRing({ value, size = 48, color }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <svg width={size} height={size} style={{ display: "block", margin: "0 auto" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={T.bg0} strokeWidth={4} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={4}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset .5s" }} />
      <text x={size / 2} y={size / 2 + 1} textAnchor="middle" dominantBaseline="central"
        style={{ fontSize: size * 0.25, fontWeight: 800, fill: color, fontFamily: "'DM Sans', sans-serif" }}>
        {value}%
      </text>
    </svg>
  );
}

function MetricCard({ label, value, color, icon }) {
  return (
    <div style={{ padding: 18, borderRadius: 12, background: T.bg2, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{ fontSize: 24, lineHeight: 1 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 800, color: color || T.text }}>{value}</div>
        <div style={{ fontSize: 11, color: T.textDim, marginTop: 2 }}>{label}</div>
      </div>
    </div>
  );
}

function NotifIcon({ type }) {
  const icons = {
    "overdue": { d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", color: T.danger },
    "due-soon": { d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", color: T.warn },
    "completed": { d: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", color: T.green },
    "review-needed": { d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z", color: T.blue },
  };
  const ic = icons[type] || icons["due-soon"];
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={ic.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d={ic.d} />
    </svg>
  );
}
