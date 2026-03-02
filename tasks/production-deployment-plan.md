# LMS Production Deployment Plan

## Overview

This document outlines the full production deployment plan for migrating the SENS LMS from its current client-side demo (localStorage + mock data) to a production-grade backend with persistent storage, real file uploads, SCORM support, and enterprise SSO.

The demo data layer in `src/data/learningData.js` was intentionally designed to mirror the production schema, enabling migration by swapping the data layer without UI changes.

---

## Recommended Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Backend** | Next.js API Routes or Node.js/Express | Full-stack TypeScript, end-to-end type safety |
| **Database** | PostgreSQL (Neon or Supabase) | Relational integrity for compliance data + JSONB for flexible assessment questions |
| **ORM** | Drizzle ORM | SQL-like TypeScript syntax, excellent for complex compliance reporting queries |
| **Auth** | Auth.js v5 + WorkOS (enterprise SSO) | Standard auth + SAML/SCIM for enterprise identity providers |
| **File Storage** | AWS S3 or Cloudflare R2 | R2 has zero egress fees (critical for video-heavy LMS content) |
| **Background Jobs** | BullMQ + Redis (Upstash) | Grading, notifications, report generation, SCORM processing |
| **Search** | Meilisearch or PostgreSQL full-text | Course catalog search, content indexing |
| **Deployment** | Vercel (app) + Railway (workers) + Neon (DB) | Developer productivity + automatic scaling |
| **Monitoring** | Sentry + PostHog | Error tracking + product analytics |
| **CDN** | Cloudflare | Edge caching for static assets and course content |

---

## Database Schema (28 Core Entities)

### Users & Organization

```sql
-- Core user table (extends existing BADGE_USERS)
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  first_name    VARCHAR(100) NOT NULL,
  last_name     VARCHAR(100) NOT NULL,
  role          VARCHAR(50) NOT NULL,        -- CEO, COO, VP, Manager, Operator, etc.
  department    VARCHAR(100),
  badge_number  VARCHAR(20),
  clearance     INTEGER NOT NULL DEFAULT 1,  -- L1-L5
  reports_to    UUID REFERENCES users(id),
  avatar_url    TEXT,
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_department ON users(department);
CREATE INDEX idx_users_reports_to ON users(reports_to);
CREATE INDEX idx_users_role ON users(role);

-- Department hierarchy
CREATE TABLE departments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(100) UNIQUE NOT NULL,
  parent_id     UUID REFERENCES departments(id),
  head_id       UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

### Courses & Content

```sql
-- Courses with versioning support
CREATE TABLE courses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           VARCHAR(255) NOT NULL,
  description     TEXT,
  category        VARCHAR(50) NOT NULL,      -- safety, compliance, technical, etc.
  type            VARCHAR(20) DEFAULT 'optional', -- required | optional
  content_type    VARCHAR(30),               -- document, video, scorm, interactive
  estimated_minutes INTEGER,
  passing_score   INTEGER DEFAULT 70,
  max_attempts    INTEGER DEFAULT 3,
  version         INTEGER DEFAULT 1,
  status          VARCHAR(20) DEFAULT 'draft', -- draft | published | archived
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_courses_category ON courses(category);
CREATE INDEX idx_courses_status ON courses(status);

-- Course versions for content updates without breaking in-progress enrollments
CREATE TABLE course_versions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id       UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  version_number  INTEGER NOT NULL,
  title           VARCHAR(255) NOT NULL,
  description     TEXT,
  content_snapshot JSONB,    -- Full course content at this version
  status          VARCHAR(20) DEFAULT 'draft', -- draft | published | archived
  published_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(course_id, version_number)
);

-- Modules within courses
CREATE TABLE modules (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id       UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title           VARCHAR(255) NOT NULL,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  content_html    TEXT,
  assessment_id   UUID,      -- FK added after assessments table
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_modules_course ON modules(course_id);

-- File attachments (course materials, documents, videos)
CREATE TABLE content_files (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id       UUID REFERENCES courses(id) ON DELETE CASCADE,
  module_id       UUID REFERENCES modules(id) ON DELETE SET NULL,
  name            VARCHAR(255) NOT NULL,
  file_type       VARCHAR(50) NOT NULL,     -- pdf, docx, mp4, zip (scorm), etc.
  mime_type       VARCHAR(100),
  size_bytes      BIGINT,
  storage_key     VARCHAR(500) NOT NULL,    -- S3/R2 object key
  storage_url     TEXT,                     -- CDN URL
  thumbnail_url   TEXT,                     -- For video thumbnails
  duration_seconds INTEGER,                 -- For video/audio
  scorm_entry_point VARCHAR(255),           -- For SCORM packages
  scorm_manifest  JSONB,                    -- Parsed imsmanifest.xml
  clearance_level INTEGER DEFAULT 1,        -- Minimum clearance to access
  virus_scanned   BOOLEAN DEFAULT false,
  scan_result     VARCHAR(20),              -- clean | infected | error
  uploaded_by     UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_content_files_course ON content_files(course_id);
```

### Assessments & Questions

```sql
-- Assessment definitions
CREATE TABLE assessments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           VARCHAR(255) NOT NULL,
  type            VARCHAR(20) DEFAULT 'auto-graded', -- auto-graded | manual-review
  passing_score   INTEGER DEFAULT 70,
  time_limit_min  INTEGER,
  allow_retake    BOOLEAN DEFAULT true,
  max_attempts    INTEGER DEFAULT 3,
  randomize_questions BOOLEAN DEFAULT false,
  question_pool_size  INTEGER,             -- If set, randomly select N questions
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Question bank
CREATE TABLE questions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id   UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  type            VARCHAR(30) NOT NULL,     -- multiple-choice, true-false, short-answer, essay,
                                            -- matching, ordering, fill-blank, hotspot, likert, file-upload
  prompt          TEXT NOT NULL,
  options         JSONB,                    -- For MC: ["Option A", "Option B", ...]
  correct_answer  TEXT,                     -- For auto-graded types
  points          INTEGER DEFAULT 1,
  weight          DECIMAL(3,2) DEFAULT 1.0,
  explanation     TEXT,                     -- Shown after submission
  sort_order      INTEGER DEFAULT 0,
  tags            TEXT[],                   -- For categorization/reporting
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_questions_assessment ON questions(assessment_id);

-- Add FK from modules to assessments
ALTER TABLE modules ADD CONSTRAINT fk_modules_assessment
  FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE SET NULL;
```

### Assignment Engine

```sql
-- Rule-based auto-assignment
CREATE TABLE assignment_rules (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(255) NOT NULL,
  target_type     VARCHAR(30) NOT NULL,     -- global, department, role, badge, site, individual
  target_value    VARCHAR(255),             -- Department name, role name, badge#, etc.
  due_in_days     INTEGER DEFAULT 30,
  recertify_days  INTEGER,                  -- If set, auto-re-enroll after completion
  is_active       BOOLEAN DEFAULT true,
  priority        INTEGER DEFAULT 0,
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Many-to-many: rules to courses
CREATE TABLE assignment_rule_courses (
  rule_id         UUID NOT NULL REFERENCES assignment_rules(id) ON DELETE CASCADE,
  course_id       UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  PRIMARY KEY (rule_id, course_id)
);

-- Polymorphic targets for complex rules
CREATE TABLE assignment_rule_targets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id         UUID NOT NULL REFERENCES assignment_rules(id) ON DELETE CASCADE,
  target_type     VARCHAR(30) NOT NULL,
  target_id       VARCHAR(255) NOT NULL,    -- user ID, department name, role, etc.
  include         BOOLEAN DEFAULT true      -- true = include, false = exclude
);

CREATE INDEX idx_rule_targets_rule ON assignment_rule_targets(rule_id);
```

### Enrollments & Progress

```sql
-- User-course enrollments
CREATE TABLE enrollments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id),
  course_id         UUID NOT NULL REFERENCES courses(id),
  course_version_id UUID REFERENCES course_versions(id),
  assignment_rule_id UUID REFERENCES assignment_rules(id),
  status            VARCHAR(20) DEFAULT 'not-started', -- not-started, in-progress, completed, overdue, expired
  assigned_date     TIMESTAMPTZ DEFAULT NOW(),
  due_date          TIMESTAMPTZ,
  started_date      TIMESTAMPTZ,
  completed_date    TIMESTAMPTZ,
  expires_date      TIMESTAMPTZ,
  progress          INTEGER DEFAULT 0,      -- 0-100
  current_module_id UUID REFERENCES modules(id),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, course_id, course_version_id)
);

CREATE INDEX idx_enrollments_user ON enrollments(user_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);
CREATE INDEX idx_enrollments_status ON enrollments(status);
CREATE INDEX idx_enrollments_due_date ON enrollments(due_date);

-- Immutable enrollment status history (for compliance audit trail)
CREATE TABLE enrollment_snapshots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id   UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  status          VARCHAR(20) NOT NULL,
  progress        INTEGER,
  changed_by      UUID REFERENCES users(id),
  change_reason   TEXT,
  snapshot_data   JSONB,                    -- Full enrollment state at this point
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_enrollment_snapshots_enrollment ON enrollment_snapshots(enrollment_id);

-- SCORM runtime data
CREATE TABLE scorm_tracking (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id   UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  content_file_id UUID NOT NULL REFERENCES content_files(id),
  cmi_data        JSONB NOT NULL DEFAULT '{}', -- SCORM CMI data model
  suspend_data    TEXT,                         -- Learner progress bookmark
  total_time      VARCHAR(50),
  score_raw       DECIMAL(5,2),
  score_min       DECIMAL(5,2),
  score_max       DECIMAL(5,2),
  completion_status VARCHAR(20),
  success_status  VARCHAR(20),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### Assessment Attempts & Reviews

```sql
-- Test submissions
CREATE TABLE assessment_attempts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id   UUID NOT NULL REFERENCES enrollments(id),
  assessment_id   UUID NOT NULL REFERENCES assessments(id),
  user_id         UUID NOT NULL REFERENCES users(id),
  answers         JSONB NOT NULL,           -- [{questionId, answer, isCorrect, pointsEarned}]
  score           INTEGER,                  -- 0-100
  passed          BOOLEAN,
  attempt_number  INTEGER DEFAULT 1,
  time_spent_sec  INTEGER,
  started_at      TIMESTAMPTZ,
  submitted_at    TIMESTAMPTZ DEFAULT NOW(),
  -- Manual review fields
  reviewer_id     UUID REFERENCES users(id),
  review_status   VARCHAR(20),              -- pending | approved | rejected
  reviewed_at     TIMESTAMPTZ,
  reviewer_notes  TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_attempts_enrollment ON assessment_attempts(enrollment_id);
CREATE INDEX idx_attempts_user ON assessment_attempts(user_id);
CREATE INDEX idx_attempts_reviewer ON assessment_attempts(reviewer_id) WHERE review_status = 'pending';
```

### Certificates & Credentials

```sql
-- Issued certifications
CREATE TABLE certificates (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id),
  course_id         UUID NOT NULL REFERENCES courses(id),
  enrollment_id     UUID NOT NULL REFERENCES enrollments(id),
  certificate_number VARCHAR(50) UNIQUE NOT NULL,
  issued_date       TIMESTAMPTZ DEFAULT NOW(),
  expires_date      TIMESTAMPTZ,
  renewal_chain_id  UUID REFERENCES certificates(id), -- Links to previous cert
  revoked           BOOLEAN DEFAULT false,
  revoked_reason    TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_certificates_user ON certificates(user_id);
CREATE INDEX idx_certificates_expires ON certificates(expires_date) WHERE NOT revoked;

-- Recertification schedules
CREATE TABLE recertification_schedules (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id       UUID NOT NULL REFERENCES courses(id),
  recertify_days  INTEGER NOT NULL,         -- Days after completion
  auto_enroll     BOOLEAN DEFAULT true,
  reminder_days   INTEGER[] DEFAULT '{30, 14, 7}', -- Days before expiry to notify
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### Notifications & Audit

```sql
-- In-app notifications
CREATE TABLE notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id),
  type            VARCHAR(30) NOT NULL,     -- due-soon, overdue, completed, review-needed, etc.
  title           VARCHAR(255) NOT NULL,
  message         TEXT,
  related_type    VARCHAR(30),              -- enrollment, assessment, certificate
  related_id      UUID,
  read            BOOLEAN DEFAULT false,
  read_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_unread ON notifications(user_id) WHERE NOT read;

-- Immutable audit log
CREATE TABLE audit_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id),
  action          VARCHAR(50) NOT NULL,     -- enrollment.created, assessment.submitted, etc.
  entity_type     VARCHAR(30) NOT NULL,
  entity_id       UUID NOT NULL,
  old_data        JSONB,
  new_data        JSONB,
  ip_address      INET,
  user_agent      TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_created ON audit_log(created_at);
```

### Approval Workflows

```sql
-- Generic approval requests
CREATE TABLE approval_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type            VARCHAR(30) NOT NULL,     -- assessment-review, enrollment-request,
                                            -- course-publish, exception-request,
                                            -- certificate-revoke, content-review
  requestor_id    UUID NOT NULL REFERENCES users(id),
  approver_id     UUID NOT NULL REFERENCES users(id),
  entity_type     VARCHAR(30) NOT NULL,
  entity_id       UUID NOT NULL,
  status          VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, escalated
  priority        INTEGER DEFAULT 0,
  notes           TEXT,
  due_date        TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE approval_actions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id      UUID NOT NULL REFERENCES approval_requests(id) ON DELETE CASCADE,
  actor_id        UUID NOT NULL REFERENCES users(id),
  action          VARCHAR(20) NOT NULL,     -- approve, reject, escalate, comment
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### Row-Level Security

```sql
-- Enable RLS on sensitive tables
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can see their own enrollments
CREATE POLICY enrollments_own ON enrollments
  FOR SELECT USING (user_id = current_setting('app.current_user_id')::UUID);

-- Managers can see their reports' enrollments
CREATE POLICY enrollments_manager ON enrollments
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM users WHERE reports_to = current_setting('app.current_user_id')::UUID
    )
  );

-- Admins (L4+) can see all enrollments in their department
CREATE POLICY enrollments_admin ON enrollments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = current_setting('app.current_user_id')::UUID
      AND u.clearance >= 4
    )
  );
```

---

## API Layer Design

### Service Layer Architecture

The demo's helper functions map directly to API endpoints:

| Demo Function | API Endpoint | Method |
|---|---|---|
| `getEnrollmentsForUser(userId)` | `/api/enrollments?userId={id}` | GET |
| `getEnrollmentsForManager(managerId)` | `/api/enrollments/team?managerId={id}` | GET |
| `getComplianceRate(scope, scopeId)` | `/api/compliance/rate?scope={s}&id={id}` | GET |
| `getDepartmentComplianceMatrix()` | `/api/compliance/matrix` | GET |
| `getComplianceTrend(months)` | `/api/compliance/trend?months={n}` | GET |
| `getOverdueItems(scope, scopeId)` | `/api/enrollments/overdue?scope={s}&id={id}` | GET |
| `getPendingReviews(reviewerId)` | `/api/assessments/pending-reviews` | GET |
| `getCoursesByCriteria(filters)` | `/api/courses?category={c}&type={t}&q={q}` | GET |
| `enrollUser(userId, courseId)` | `/api/enrollments` | POST |
| `updateEnrollmentProgress(id, progress)` | `/api/enrollments/{id}/progress` | PATCH |
| `submitAssessmentAttempt(data)` | `/api/assessments/{id}/attempts` | POST |
| `reviewAssessment(attemptId, data)` | `/api/assessments/attempts/{id}/review` | PATCH |
| `createCourse(data)` | `/api/courses` | POST |
| `createAssignmentRule(data)` | `/api/assignment-rules` | POST |

### Migration Strategy

```
src/
  services/
    learningService.js     <-- NEW: API client layer
  data/
    learningData.js        <-- REMOVE (replaced by API)
  views/
    LearningView.jsx       <-- UNCHANGED (swap import from data to service)
```

**Step-by-step migration:**

1. Create `src/services/learningService.js` that exports the same function signatures as `learningData.js`
2. Replace `import { ... } from "../data/learningData"` with `import { ... } from "../services/learningService"` in LearningView.jsx
3. Each service function makes a `fetch()` call to the corresponding API endpoint
4. Add React Query or SWR for caching, loading states, and optimistic updates
5. Zero UI changes required -- the view layer stays identical

---

## File Upload Pipeline

### Architecture

```
User selects file
  |
  v
Frontend requests presigned URL from API
  |
  v
API generates presigned S3/R2 PUT URL (expires in 15 min)
  |
  v
Frontend uploads directly to S3/R2 (bypasses server for large files)
  |
  v
S3 Event Notification / R2 Event triggers webhook
  |
  v
Background worker processes file:
  +-- Virus scan (ClamAV Lambda or containerized)
  +-- If SCORM zip: parse imsmanifest.xml, extract metadata, store entry point
  +-- If video: extract duration, generate thumbnail, optionally transcribe (Whisper)
  +-- If document: extract text for full-text search indexing
  +-- Generate CDN-friendly URL
  |
  v
Update content_files record with processing results
  |
  v
File available for learners (gated by clearance_level)
```

### SCORM Support

```javascript
// SCORM 1.2 / 2004 Runtime API
class SCORMRuntime {
  constructor(enrollmentId, contentFileId) {
    this.enrollmentId = enrollmentId;
    this.contentFileId = contentFileId;
    this.cmiData = {};
  }

  // SCORM 1.2 API
  LMSInitialize() { /* Load cmi_data from scorm_tracking table */ }
  LMSGetValue(element) { return this.cmiData[element]; }
  LMSSetValue(element, value) { this.cmiData[element] = value; }
  LMSCommit() { /* POST to /api/scorm/{enrollmentId}/commit */ }
  LMSFinish() { /* Finalize and update enrollment progress */ }

  // SCORM 2004 API
  Initialize() { return this.LMSInitialize(); }
  GetValue(element) { return this.LMSGetValue(element); }
  SetValue(element, value) { return this.LMSSetValue(element, value); }
  Commit() { return this.LMSCommit(); }
  Terminate() { return this.LMSFinish(); }
}
```

### File Access Control

```javascript
// Middleware: Check clearance before serving files
async function fileAccessMiddleware(req, res, next) {
  const file = await db.query.contentFiles.findFirst({
    where: eq(contentFiles.id, req.params.fileId)
  });

  if (!file) return res.status(404).json({ error: "File not found" });
  if (user.clearance < file.clearance_level) {
    return res.status(403).json({ error: "Insufficient clearance" });
  }

  // Generate short-lived signed URL for CDN delivery
  const signedUrl = await generateSignedUrl(file.storage_key, 3600);
  return res.redirect(signedUrl);
}
```

---

## Background Job Processing

### Job Queue Architecture (BullMQ + Redis)

```javascript
// Queue definitions
const queues = {
  fileProcessing:     new Queue('file-processing'),
  assignmentEngine:   new Queue('assignment-engine'),
  notifications:      new Queue('notifications'),
  compliance:         new Queue('compliance-reports'),
  certExpiry:         new Queue('cert-expiry-check'),
  scormProcessing:    new Queue('scorm-processing'),
};

// Scheduled jobs
// Check for overdue enrollments every hour
queues.compliance.add('check-overdue', {}, { repeat: { cron: '0 * * * *' }});

// Check for expiring certificates daily at 6 AM
queues.certExpiry.add('check-expiry', {}, { repeat: { cron: '0 6 * * *' }});

// Recompute compliance metrics every 15 minutes
queues.compliance.add('recompute-metrics', {}, { repeat: { cron: '*/15 * * * *' }});

// Run assignment rule engine every hour
queues.assignmentEngine.add('run-rules', {}, { repeat: { cron: '0 * * * *' }});
```

### Workers

```javascript
// File processing worker
const fileWorker = new Worker('file-processing', async (job) => {
  const { fileId, storageKey, fileType } = job.data;

  // Step 1: Virus scan
  const scanResult = await virusScan(storageKey);
  if (scanResult === 'infected') {
    await deleteFromStorage(storageKey);
    await updateFileRecord(fileId, { virus_scanned: true, scan_result: 'infected' });
    await notifyUploader(fileId, 'File rejected: virus detected');
    return;
  }

  // Step 2: Type-specific processing
  if (fileType === 'application/zip') {
    const manifest = await parseScormPackage(storageKey);
    if (manifest) {
      await updateFileRecord(fileId, { scorm_manifest: manifest, scorm_entry_point: manifest.entryPoint });
    }
  } else if (fileType.startsWith('video/')) {
    const { duration, thumbnail } = await processVideo(storageKey);
    await updateFileRecord(fileId, { duration_seconds: duration, thumbnail_url: thumbnail });
  } else if (fileType === 'application/pdf' || fileType.includes('document')) {
    const text = await extractText(storageKey);
    await indexForSearch(fileId, text);
  }

  // Step 3: Mark as processed
  await updateFileRecord(fileId, { virus_scanned: true, scan_result: 'clean' });
});
```

---

## Authentication & Authorization

### Enterprise SSO (WorkOS)

```javascript
import WorkOS from '@workos-inc/node';

const workos = new WorkOS(process.env.WORKOS_API_KEY);

// SSO login endpoint
app.get('/api/auth/sso/:organization', async (req, res) => {
  const authorizationUrl = workos.sso.getAuthorizationURL({
    organization: req.params.organization,
    redirectURI: `${process.env.APP_URL}/api/auth/callback`,
    clientID: process.env.WORKOS_CLIENT_ID,
  });
  res.redirect(authorizationUrl);
});

// SCIM directory sync for automatic user provisioning
workos.directorySync.on('user.created', async (event) => {
  await createUser({
    email: event.data.emails[0].value,
    firstName: event.data.name.givenName,
    lastName: event.data.name.familyName,
    department: event.data.groups[0]?.name,
  });
  // Auto-run assignment rules for new user
  await queues.assignmentEngine.add('new-user', { userId: newUser.id });
});
```

### Permission Middleware

```javascript
// Clearance-based access control (mirrors existing L1-L5 system)
function requireClearance(level) {
  return async (req, res, next) => {
    const user = req.user;
    if (user.clearance < level) {
      return res.status(403).json({ error: `Requires L${level} clearance` });
    }
    next();
  };
}

// Module-level permission check (mirrors permissionData.js)
function requirePermission(module, action) {
  return async (req, res, next) => {
    const perms = await getModulePermissions(module);
    const required = perms[action];
    if (req.user.clearance < required.level && !required.roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Requires ${module}.${action} permission` });
    }
    next();
  };
}
```

---

## Compliance Reporting Engine

### Pre-computed Compliance Metrics

```sql
-- Materialized view for fast compliance dashboards
CREATE MATERIALIZED VIEW compliance_dashboard AS
SELECT
  u.department,
  c.category,
  COUNT(*) AS total_enrollments,
  COUNT(*) FILTER (WHERE e.status = 'completed') AS completed,
  COUNT(*) FILTER (WHERE e.status = 'overdue') AS overdue,
  COUNT(*) FILTER (WHERE e.status = 'in-progress') AS in_progress,
  ROUND(
    COUNT(*) FILTER (WHERE e.status = 'completed')::DECIMAL /
    NULLIF(COUNT(*), 0) * 100, 1
  ) AS compliance_rate
FROM enrollments e
JOIN users u ON e.user_id = u.id
JOIN courses c ON e.course_id = c.id
WHERE c.type = 'required'
GROUP BY u.department, c.category;

-- Refresh every 15 minutes via background job
REFRESH MATERIALIZED VIEW CONCURRENTLY compliance_dashboard;
```

### Report Generation

```javascript
// Scheduled compliance report (PDF/Excel)
async function generateComplianceReport(scope, scopeId, format) {
  const data = await getComplianceData(scope, scopeId);

  if (format === 'pdf') {
    const pdf = await generatePDF({
      template: 'compliance-report',
      data: {
        generatedAt: new Date(),
        overallRate: data.complianceRate,
        departments: data.departmentBreakdown,
        overdueItems: data.overdueItems,
        expiringCerts: data.expiringCertificates,
      }
    });
    return pdf;
  }

  if (format === 'excel') {
    const workbook = new ExcelJS.Workbook();
    // ... build worksheets
    return workbook;
  }
}
```

---

## Notification System

### Multi-Channel Notifications

```javascript
const notificationChannels = {
  'in-app':   (notification) => db.insert(notifications).values(notification),
  'email':    (notification) => emailService.send(notification),
  'slack':    (notification) => slackWebhook.post(notification),
  'teams':    (notification) => teamsWebhook.post(notification),
};

// Notification triggers
const notificationTriggers = [
  { event: 'enrollment.created',     template: 'new-assignment',      channels: ['in-app', 'email'] },
  { event: 'enrollment.due-soon-7d', template: 'due-reminder-7',      channels: ['in-app', 'email'] },
  { event: 'enrollment.due-soon-1d', template: 'due-reminder-urgent', channels: ['in-app', 'email', 'slack'] },
  { event: 'enrollment.overdue',     template: 'overdue-alert',       channels: ['in-app', 'email', 'slack'] },
  { event: 'assessment.submitted',   template: 'review-needed',       channels: ['in-app', 'email'] },
  { event: 'assessment.reviewed',    template: 'review-complete',     channels: ['in-app', 'email'] },
  { event: 'certificate.expiring',   template: 'cert-expiry-warning', channels: ['in-app', 'email'] },
  { event: 'certificate.expired',    template: 'cert-expired',        channels: ['in-app', 'email', 'slack'] },
];
```

---

## xAPI / Learning Record Store (LRS) Integration

```javascript
// xAPI statement generation for learning analytics
function createXAPIStatement(actor, verb, object, result) {
  return {
    actor: {
      mbox: `mailto:${actor.email}`,
      name: `${actor.firstName} ${actor.lastName}`,
    },
    verb: {
      id: `http://adlnet.gov/expapi/verbs/${verb}`,
      display: { 'en-US': verb },
    },
    object: {
      id: `${process.env.APP_URL}/courses/${object.courseId}`,
      definition: {
        name: { 'en-US': object.title },
        type: 'http://adlnet.gov/expapi/activities/course',
      },
    },
    result: result ? {
      score: { scaled: result.score / 100, raw: result.score, max: 100 },
      completion: result.completed,
      success: result.passed,
      duration: `PT${result.durationMinutes}M`,
    } : undefined,
    timestamp: new Date().toISOString(),
  };
}
```

---

## Deployment Configuration

### Infrastructure as Code (Terraform/Pulumi)

```hcl
# Neon PostgreSQL
resource "neon_project" "lms" {
  name = "sens-lms-production"
  region_id = "aws-us-east-2"
}

# Cloudflare R2 Bucket
resource "cloudflare_r2_bucket" "lms_content" {
  account_id = var.cloudflare_account_id
  name       = "sens-lms-content"
  location   = "enam"  # Eastern North America
}

# Upstash Redis
resource "upstash_redis_database" "lms_cache" {
  database_name = "sens-lms-cache"
  region        = "us-east-1"
  tls           = true
}
```

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@host/sens_lms?sslmode=require

# File Storage (Cloudflare R2)
R2_ACCOUNT_ID=xxx
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET_NAME=sens-lms-content
R2_PUBLIC_URL=https://content.sens-lms.com

# Auth (WorkOS)
WORKOS_API_KEY=sk_xxx
WORKOS_CLIENT_ID=client_xxx

# Background Jobs (Upstash Redis)
REDIS_URL=rediss://default:xxx@host:6379

# Monitoring
SENTRY_DSN=https://xxx@sentry.io/xxx
POSTHOG_API_KEY=phc_xxx
```

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy LMS
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: test_lms
          POSTGRES_PASSWORD: test
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run test
      - run: npm run test:e2e

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'

  migrate:
    needs: deploy
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npx drizzle-kit push
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

---

## Performance Considerations

| Concern | Solution |
|---------|----------|
| Compliance dashboard load time | Materialized views refreshed every 15 min |
| Large file uploads | Presigned URLs for direct-to-storage upload |
| Assessment scoring | Auto-grading is synchronous; manual review queued |
| Notification delivery | Async via BullMQ workers |
| Course catalog search | Meilisearch index synced via database triggers |
| Concurrent test-taking | Optimistic locking on assessment_attempts |
| Report generation | Background job with progress tracking |
| SCORM content delivery | CDN-cached with signed URLs |

---

## Cost Estimates (Monthly at Scale)

| Service | Estimated Cost | Notes |
|---------|---------------|-------|
| Neon PostgreSQL | $19-69/mo | Pro plan, auto-scaling compute |
| Cloudflare R2 | $0.015/GB stored | Zero egress, ~$5-20/mo for 500GB |
| Upstash Redis | $10/mo | Pro plan, 10GB |
| Vercel | $20/mo | Pro plan |
| Railway (workers) | $5-20/mo | Usage-based |
| WorkOS SSO | $125/mo | Per-connection pricing |
| Sentry | Free-$26/mo | Depending on volume |
| **Total** | **~$200-350/mo** | For 500-1000 active learners |

---

## Migration Checklist

- [ ] Set up PostgreSQL database and run schema migrations
- [ ] Configure Cloudflare R2 bucket and access keys
- [ ] Set up Redis instance for job queues
- [ ] Implement API routes matching demo helper function signatures
- [ ] Create `src/services/learningService.js` API client
- [ ] Replace `learningData.js` imports with service imports in LearningView.jsx
- [ ] Implement file upload pipeline with presigned URLs
- [ ] Configure SCORM runtime API
- [ ] Set up WorkOS for enterprise SSO
- [ ] Implement BullMQ workers for background processing
- [ ] Configure notification channels (email, Slack, Teams)
- [ ] Set up materialized views for compliance dashboards
- [ ] Implement Row-Level Security policies
- [ ] Configure CI/CD pipeline
- [ ] Run end-to-end tests against production schema
- [ ] Seed production database with migrated demo data
- [ ] Deploy and verify all 5 LMS tabs work with real backend
- [ ] Set up monitoring dashboards (Sentry + PostHog)
- [ ] Load test compliance dashboard with 10,000+ enrollments
- [ ] Security audit: penetration testing on file upload and auth flows
