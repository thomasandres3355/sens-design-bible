# Enterprise Learning Management System — Data Model Specification

**Version**: 1.0
**Date**: 2026-03-01
**Status**: Design / Research Complete

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Entity Overview](#2-entity-overview)
3. [Core Organizational Entities](#3-core-organizational-entities)
4. [Content Hierarchy](#4-content-hierarchy)
5. [Assessment & Testing Model](#5-assessment--testing-model)
6. [Assignment Rules Engine](#6-assignment-rules-engine)
7. [Enrollment & Progress Tracking](#7-enrollment--progress-tracking)
8. [Compliance & Certification](#8-compliance--certification)
9. [File & Content Management](#9-file--content-management)
10. [Approval Workflows](#10-approval-workflows)
11. [Audit & History](#11-audit--history)
12. [Edge Cases & Design Decisions](#12-edge-cases--design-decisions)
13. [Full Entity-Relationship Summary](#13-full-entity-relationship-summary)

---

## 1. Design Philosophy

### Guiding Principles

- **Rule-based assignment over manual enrollment**: Assignments flow from declarative rules (global, department, role, badge, individual) rather than manual one-by-one enrollment. This means when someone joins a department, they automatically inherit that department's learning requirements.
- **Immutable compliance history**: Enrollment records and completion snapshots are never deleted or mutated — only superseded. This provides a complete audit trail for regulatory compliance.
- **Content versioning with active enrollment protection**: When content changes, existing in-progress enrollments continue against the version they started with. New enrollments pick up the latest version.
- **Polymorphic assignment targets**: A single `AssignmentRule` table handles all scope levels (global, department, role, badge, individual) through a discriminator pattern rather than N separate junction tables.
- **Separation of structure from attempts**: The course/module/lesson hierarchy defines *structure*. Enrollment and attempt records track *what happened*. These never bleed into each other.

### Integration with Existing SENS Platform

This model is designed to sit alongside the existing SENS user, role, department, and badge/clearance infrastructure defined in `badgeData.js`, `userData.js`, and `permissionData.js`. The LMS extends these entities rather than replacing them:

- `User` references the existing BADGE_USERS / DEFAULT_USERS
- `Role` maps to ROLE_CLEARANCE entries (CEO, COO, VP Engineering, Manager, Operator, Viewer)
- `Department` maps to AVAILABLE_DEPARTMENTS (Executive, Engineering, Operations, Finance, etc.)
- `ClearanceLevel` maps to CLEARANCE_LEVELS (L1-L5)

---

## 2. Entity Overview

### Entity Count: 28 tables

**Organizational (4)**: User, Department, Role, Site
**Content Hierarchy (6)**: Course, CourseVersion, Module, Lesson, LessonContent, ContentFile
**Assessment (6)**: Assessment, AssessmentConfig, Question, QuestionOption, AssessmentAttempt, AttemptAnswer
**Assignment (3)**: AssignmentRule, AssignmentRuleTarget, LearningPath
**Enrollment (4)**: Enrollment, ModuleProgress, LessonProgress, EnrollmentSnapshot
**Compliance (3)**: Certification, UserCertification, RecertificationSchedule
**Workflow (2)**: ApprovalRequest, ApprovalAction

---

## 3. Core Organizational Entities

These entities already exist in the SENS platform. The LMS references them by ID.

### User
```
User {
  id                  : string (PK)         -- e.g., "david", "thomas", "demo-op"
  name                : string (NOT NULL)
  email               : string (UNIQUE, NOT NULL)
  role                : string (FK -> Role.id)
  department          : string (FK -> Department.id)
  site_id             : string (FK -> Site.id, NULLABLE)  -- for site-assigned staff
  status              : enum [active, inactive, locked]
  manager_id          : string (FK -> User.id, NULLABLE)  -- direct report chain
  clearance_level     : int                               -- derived from role
  created_at          : timestamp
  updated_at          : timestamp
}
```

**Key design note**: `manager_id` is critical for the approval workflow — it defines who can approve completions and who gets overdue notifications for their direct reports.

### Department
```
Department {
  id                  : string (PK)         -- e.g., "engineering", "operations"
  name                : string (NOT NULL)
  parent_department_id: string (FK -> Department.id, NULLABLE) -- hierarchy
  head_user_id        : string (FK -> User.id, NULLABLE)
  created_at          : timestamp
}
```

### Role
```
Role {
  id                  : string (PK)         -- e.g., "CEO", "VP Engineering", "Operator"
  label               : string (NOT NULL)
  clearance_level     : int (NOT NULL)      -- maps to L1-L5
  scope               : enum [all, department, site, readonly]
  created_at          : timestamp
}
```

### Site
```
Site {
  id                  : string (PK)         -- e.g., "noble-ok", "richmond-va"
  name                : string (NOT NULL)
  state               : string
  status              : enum [operational, construction, development]
}
```

---

## 4. Content Hierarchy

The content model follows a strict hierarchy:
**Course -> CourseVersion -> Module -> Lesson -> LessonContent**

This separation allows content to be versioned independently from the structural definition, and supports mixed content types within a single lesson.

### Course
```
Course {
  id                  : uuid (PK)
  code                : string (UNIQUE, NOT NULL)  -- e.g., "SAF-101", "OPS-NOBLE-001"
  title               : string (NOT NULL)
  description         : text
  category            : string                      -- e.g., "Safety", "Operations", "Compliance", "Onboarding"
  subcategory         : string (NULLABLE)
  thumbnail_file_id   : uuid (FK -> ContentFile.id, NULLABLE)
  is_active           : boolean (DEFAULT true)
  is_mandatory        : boolean (DEFAULT false)     -- compliance flag
  estimated_duration_minutes : int (NULLABLE)
  tags                : string[]                    -- searchable tags
  prerequisites       : uuid[] (FK -> Course.id)    -- courses that must be completed first
  created_by          : string (FK -> User.id)
  created_at          : timestamp
  updated_at          : timestamp
  archived_at         : timestamp (NULLABLE)
}
```

**Design decision — `prerequisites` as array vs junction table**: For simplicity and because prerequisite chains are typically short (1-3 courses), an array of course IDs is sufficient. If prerequisite logic becomes complex (e.g., "any 2 of these 5"), upgrade to a `CoursePrerequisite` junction table with a `logic_type` column.

### CourseVersion
```
CourseVersion {
  id                  : uuid (PK)
  course_id           : uuid (FK -> Course.id, NOT NULL)
  version_number      : int (NOT NULL)             -- 1, 2, 3...
  version_label       : string (NULLABLE)          -- "v2.1 — Updated safety regs"
  changelog           : text (NULLABLE)
  status              : enum [draft, published, archived]
  published_at        : timestamp (NULLABLE)
  published_by        : string (FK -> User.id, NULLABLE)
  pass_threshold      : decimal (NULLABLE)          -- e.g., 0.80 for 80%
  max_attempts        : int (DEFAULT 3)             -- 0 = unlimited
  requires_sequential : boolean (DEFAULT true)      -- must complete modules in order
  created_at          : timestamp

  UNIQUE(course_id, version_number)
}
```

**Why version at the course level?** When regulations change, the entire course may need restructuring (new modules, reordered content, different assessments). Versioning at the course level means:
- Learners in-progress continue with their version
- New enrollments get the latest published version
- Historical records always reference the exact version completed
- Compliance auditors can see exactly what was taught and when

### Module
```
Module {
  id                  : uuid (PK)
  course_version_id   : uuid (FK -> CourseVersion.id, NOT NULL)
  title               : string (NOT NULL)
  description         : text (NULLABLE)
  sort_order          : int (NOT NULL)
  estimated_duration_minutes : int (NULLABLE)
  is_required         : boolean (DEFAULT true)      -- optional enrichment modules
  created_at          : timestamp
}
```

### Lesson
```
Lesson {
  id                  : uuid (PK)
  module_id           : uuid (FK -> Module.id, NOT NULL)
  title               : string (NOT NULL)
  description         : text (NULLABLE)
  sort_order          : int (NOT NULL)
  lesson_type         : enum [content, assessment, scorm, external_link, live_session]
  estimated_duration_minutes : int (NULLABLE)
  is_required         : boolean (DEFAULT true)
  completion_criteria : enum [view, time_spent, assessment_pass, manual_confirm]
  min_time_seconds    : int (NULLABLE)              -- for time_spent completion
  assessment_id       : uuid (FK -> Assessment.id, NULLABLE)  -- if lesson_type = assessment
  scorm_package_id    : uuid (FK -> ContentFile.id, NULLABLE) -- if lesson_type = scorm
  external_url        : string (NULLABLE)           -- if lesson_type = external_link
  created_at          : timestamp
}
```

### LessonContent
```
LessonContent {
  id                  : uuid (PK)
  lesson_id           : uuid (FK -> Lesson.id, NOT NULL)
  sort_order          : int (NOT NULL)
  content_type        : enum [rich_text, video, document, image, embed, audio]
  rich_text_body      : text (NULLABLE)             -- HTML/Markdown content
  file_id             : uuid (FK -> ContentFile.id, NULLABLE)
  embed_url           : string (NULLABLE)
  caption             : string (NULLABLE)
  created_at          : timestamp
}
```

**Why separate LessonContent from Lesson?** A single lesson might contain a video introduction, followed by a PDF document, followed by rich text instructions. The `LessonContent` table allows ordered, mixed-media composition within a lesson without flattening everything into a single blob.

---

## 5. Assessment & Testing Model

### Assessment
```
Assessment {
  id                  : uuid (PK)
  title               : string (NOT NULL)
  description         : text (NULLABLE)
  assessment_type     : enum [quiz, exam, survey, practical_checklist]
  grading_type        : enum [auto, manual, hybrid]
  -- auto: all questions auto-graded (MC, T/F)
  -- manual: all questions require human review (essay)
  -- hybrid: mix of auto and manual graded questions

  time_limit_minutes  : int (NULLABLE)              -- NULL = no time limit
  randomize_questions : boolean (DEFAULT false)
  randomize_options   : boolean (DEFAULT false)
  show_correct_answers: boolean (DEFAULT false)     -- after submission
  show_score_immediately : boolean (DEFAULT true)   -- for auto-graded portions

  passing_score       : decimal (NOT NULL)          -- 0.0 to 1.0 (e.g., 0.80 = 80%)
  max_attempts        : int (DEFAULT 3)             -- 0 = unlimited
  attempt_cooldown_hours : int (DEFAULT 0)          -- wait time between attempts

  question_pool_size  : int (NULLABLE)              -- if set, randomly select N questions from total

  manual_grader_role  : string (NULLABLE)           -- role required to grade (e.g., "Manager")
  manual_grader_user_id : string (FK -> User.id, NULLABLE) -- specific assigned grader

  created_by          : string (FK -> User.id)
  created_at          : timestamp
  updated_at          : timestamp
}
```

### AssessmentConfig (per-CourseVersion override)
```
AssessmentConfig {
  id                  : uuid (PK)
  course_version_id   : uuid (FK -> CourseVersion.id, NOT NULL)
  assessment_id       : uuid (FK -> Assessment.id, NOT NULL)

  -- Overrides (NULLABLE = use assessment defaults)
  passing_score_override    : decimal (NULLABLE)
  max_attempts_override     : int (NULLABLE)
  time_limit_override       : int (NULLABLE)

  weight_in_course    : decimal (DEFAULT 1.0)       -- relative weight for course grade
  is_final_exam       : boolean (DEFAULT false)     -- must pass to complete course

  UNIQUE(course_version_id, assessment_id)
}
```

**Why AssessmentConfig?** The same assessment (e.g., "Lockout/Tagout Safety Quiz") might be reused across multiple courses with different passing thresholds. `AssessmentConfig` allows per-course customization without duplicating the assessment itself.

### Question
```
Question {
  id                  : uuid (PK)
  assessment_id       : uuid (FK -> Assessment.id, NOT NULL)
  sort_order          : int (NOT NULL)
  question_type       : enum [
    multiple_choice_single,   -- radio buttons, one correct
    multiple_choice_multi,    -- checkboxes, multiple correct
    true_false,               -- boolean
    short_answer,             -- text input, auto-graded against accepted answers
    essay,                    -- long text, manual grading
    numeric,                  -- number input with tolerance
    matching,                 -- match pairs
    ordering,                 -- arrange in correct sequence
    file_upload,              -- upload evidence (practical assessment)
    practical_checklist_item  -- observer checks off (field assessment)
  ]

  question_text       : text (NOT NULL)             -- supports rich text/images
  question_media_id   : uuid (FK -> ContentFile.id, NULLABLE)  -- image/video with question
  explanation         : text (NULLABLE)             -- shown after answering (if configured)

  points              : decimal (DEFAULT 1.0)       -- weight of this question
  is_required         : boolean (DEFAULT true)      -- must answer to submit

  -- For short_answer auto-grading
  accepted_answers    : string[] (NULLABLE)         -- list of acceptable text answers
  case_sensitive      : boolean (DEFAULT false)

  -- For numeric type
  numeric_answer      : decimal (NULLABLE)
  numeric_tolerance   : decimal (NULLABLE)          -- +/- acceptable range

  -- For matching type
  matching_pairs      : jsonb (NULLABLE)            -- [{left: "...", right: "..."}]

  -- For ordering type
  correct_order       : string[] (NULLABLE)         -- ordered list of option IDs

  created_at          : timestamp
}
```

### QuestionOption (for multiple choice and true/false)
```
QuestionOption {
  id                  : uuid (PK)
  question_id         : uuid (FK -> Question.id, NOT NULL)
  sort_order          : int (NOT NULL)
  option_text         : text (NOT NULL)
  option_media_id     : uuid (FK -> ContentFile.id, NULLABLE)
  is_correct          : boolean (NOT NULL)
  points_if_selected  : decimal (NULLABLE)          -- for partial credit (multi-select)
  feedback_text       : text (NULLABLE)             -- shown if this option selected
}
```

### AssessmentAttempt
```
AssessmentAttempt {
  id                  : uuid (PK)
  enrollment_id       : uuid (FK -> Enrollment.id, NOT NULL)
  assessment_id       : uuid (FK -> Assessment.id, NOT NULL)
  attempt_number      : int (NOT NULL)              -- 1, 2, 3...

  status              : enum [in_progress, submitted, grading, graded, expired]
  started_at          : timestamp (NOT NULL)
  submitted_at        : timestamp (NULLABLE)
  graded_at           : timestamp (NULLABLE)
  expires_at          : timestamp (NULLABLE)        -- started_at + time_limit

  auto_score          : decimal (NULLABLE)          -- 0.0 to 1.0
  manual_score        : decimal (NULLABLE)          -- 0.0 to 1.0
  final_score         : decimal (NULLABLE)          -- weighted combination
  passed              : boolean (NULLABLE)

  graded_by           : string (FK -> User.id, NULLABLE)
  grader_notes        : text (NULLABLE)

  questions_presented : uuid[] (NULLABLE)           -- ordered list of question IDs (for randomized pools)

  created_at          : timestamp

  UNIQUE(enrollment_id, assessment_id, attempt_number)
}
```

### AttemptAnswer
```
AttemptAnswer {
  id                  : uuid (PK)
  attempt_id          : uuid (FK -> AssessmentAttempt.id, NOT NULL)
  question_id         : uuid (FK -> Question.id, NOT NULL)

  -- The answer (exactly one of these populated based on question_type)
  selected_option_ids : uuid[] (NULLABLE)           -- for MC single/multi and T/F
  text_answer         : text (NULLABLE)             -- for short_answer, essay
  numeric_answer      : decimal (NULLABLE)          -- for numeric
  file_id             : uuid (FK -> ContentFile.id, NULLABLE)  -- for file_upload
  matching_response   : jsonb (NULLABLE)            -- for matching
  ordering_response   : string[] (NULLABLE)         -- for ordering
  checklist_checked   : boolean (NULLABLE)          -- for practical_checklist_item

  is_correct          : boolean (NULLABLE)          -- NULL until graded
  points_earned       : decimal (NULLABLE)
  auto_graded         : boolean (DEFAULT false)

  grader_feedback     : text (NULLABLE)             -- manual grader's per-answer feedback
  graded_at           : timestamp (NULLABLE)

  answered_at         : timestamp
  time_spent_seconds  : int (NULLABLE)

  UNIQUE(attempt_id, question_id)
}
```

### Grading Workflow

The grading process follows these rules:

1. **Auto-gradable types** (multiple_choice_single, multiple_choice_multi, true_false, short_answer, numeric, matching, ordering): Graded immediately on submission. `is_correct` and `points_earned` populated automatically.

2. **Manual-grade types** (essay, file_upload, practical_checklist_item): Attempt status moves to `grading`. The assigned grader (by `manual_grader_user_id` or any user with `manual_grader_role`) reviews and scores.

3. **Hybrid assessments**: Auto-gradable questions scored immediately. `auto_score` calculated from auto-graded questions. Attempt stays in `grading` until manual questions reviewed. `final_score` = weighted average of auto and manual portions.

4. **Score calculation**:
   ```
   auto_score  = SUM(auto_graded points_earned) / SUM(auto_graded points)
   manual_score = SUM(manual_graded points_earned) / SUM(manual_graded points)
   final_score  = (auto_score * auto_weight + manual_score * manual_weight)
                  where weights are proportional to total points in each category
   ```

---

## 6. Assignment Rules Engine

This is the core innovation of the model. Rather than manually enrolling users, **AssignmentRules** declaratively define *who* must complete *what* and *when*.

### AssignmentRule
```
AssignmentRule {
  id                  : uuid (PK)

  -- WHAT to assign
  course_id           : uuid (FK -> Course.id, NULLABLE)       -- specific course
  learning_path_id    : uuid (FK -> LearningPath.id, NULLABLE) -- or entire path
  -- Exactly one of course_id or learning_path_id must be set

  -- WHO to assign (scope)
  scope               : enum [global, department, role, site, badge, individual]

  -- Rule metadata
  rule_name           : string (NOT NULL)
  description         : text (NULLABLE)
  priority            : int (DEFAULT 0)             -- higher = evaluated first (for conflicts)
  is_active           : boolean (DEFAULT true)

  -- WHEN
  effective_date      : date (NOT NULL)             -- rule starts applying
  expiry_date         : date (NULLABLE)             -- rule stops applying (NULL = forever)

  -- Deadline calculation
  due_type            : enum [fixed_date, relative_days, relative_to_hire, relative_to_assignment]
  due_fixed_date      : date (NULLABLE)             -- for fixed_date
  due_days            : int (NULLABLE)              -- for relative_* types

  -- Recertification
  requires_recertification : boolean (DEFAULT false)
  recertification_period_days : int (NULLABLE)      -- e.g., 365 for annual

  -- Notifications
  notify_days_before_due : int[] (NULLABLE)         -- e.g., [30, 14, 7, 1]
  notify_manager      : boolean (DEFAULT true)
  escalate_days_overdue : int (NULLABLE)            -- escalate to manager's manager

  created_by          : string (FK -> User.id)
  created_at          : timestamp
  updated_at          : timestamp
}
```

### AssignmentRuleTarget
```
AssignmentRuleTarget {
  id                  : uuid (PK)
  rule_id             : uuid (FK -> AssignmentRule.id, NOT NULL)

  -- Target discriminator — exactly one populated based on rule.scope
  target_department_id : string (FK -> Department.id, NULLABLE)   -- scope = department
  target_role_id       : string (FK -> Role.id, NULLABLE)         -- scope = role
  target_site_id       : string (FK -> Site.id, NULLABLE)         -- scope = site
  target_badge_level   : int (NULLABLE)                           -- scope = badge (clearance level)
  target_user_id       : string (FK -> User.id, NULLABLE)         -- scope = individual
  -- scope = global: no target needed (applies to all active users)

  include_sub_departments : boolean (DEFAULT false) -- cascade to child departments
}
```

**Why a separate target table?** A single rule might target multiple departments or multiple roles simultaneously. For example: "All Operations AND Engineering staff must complete Plant Safety Training." Rather than creating two duplicate rules, one rule has two `AssignmentRuleTarget` rows.

### LearningPath
```
LearningPath {
  id                  : uuid (PK)
  code                : string (UNIQUE, NOT NULL)
  title               : string (NOT NULL)
  description         : text (NULLABLE)
  is_sequential       : boolean (DEFAULT true)      -- must complete courses in order
  is_active           : boolean (DEFAULT true)
  category            : string (NULLABLE)
  estimated_total_duration_minutes : int (NULLABLE)
  created_by          : string (FK -> User.id)
  created_at          : timestamp
  updated_at          : timestamp
}
```

### LearningPathCourse (junction)
```
LearningPathCourse {
  id                  : uuid (PK)
  learning_path_id    : uuid (FK -> LearningPath.id, NOT NULL)
  course_id           : uuid (FK -> Course.id, NOT NULL)
  sort_order          : int (NOT NULL)
  is_required         : boolean (DEFAULT true)      -- optional electives within a path

  UNIQUE(learning_path_id, course_id)
}
```

### Assignment Resolution Algorithm

When the system evaluates assignments for a user, it follows this process:

```
1. Gather all active rules where:
   - rule.is_active = true
   - rule.effective_date <= today
   - rule.expiry_date IS NULL OR rule.expiry_date >= today

2. Filter to rules matching the user:
   - scope = global → always matches
   - scope = department → user.department IN rule targets
     (check include_sub_departments for hierarchy)
   - scope = role → user.role IN rule targets
   - scope = site → user.site_id IN rule targets
   - scope = badge → user.clearance_level >= target_badge_level
   - scope = individual → user.id IN rule targets

3. De-duplicate: If multiple rules assign the same course,
   take the one with highest priority (strictest deadline wins for ties)

4. For each resolved assignment:
   - If no active enrollment exists → create Enrollment
   - If enrollment exists but expired → check recertification rules
   - If enrollment completed but recertification due → create new Enrollment

5. Calculate due_date based on due_type:
   - fixed_date → use due_fixed_date
   - relative_days → enrollment.created_at + due_days
   - relative_to_hire → user.created_at + due_days
   - relative_to_assignment → rule.effective_date + due_days
```

### Example Assignment Scenarios

**Global Safety Training**:
```
AssignmentRule: scope=global, course="SAF-101", due_type=relative_to_hire,
               due_days=30, requires_recertification=true, recert_period=365
AssignmentRuleTarget: (none needed — global)
→ Every active user must complete SAF-101 within 30 days of hire, renewed annually
```

**Department-Specific Operations Training**:
```
AssignmentRule: scope=department, course="OPS-201", due_type=relative_days, due_days=14
AssignmentRuleTarget: target_department_id="operations"
AssignmentRuleTarget: target_department_id="maintenance"
→ All Operations and Maintenance staff get 14 days from enrollment
```

**Role-Based Executive Compliance**:
```
AssignmentRule: scope=role, learning_path="EXEC-COMPLIANCE-PATH", due_type=fixed_date,
               due_fixed_date="2026-06-30"
AssignmentRuleTarget: target_role_id="CEO"
AssignmentRuleTarget: target_role_id="COO"
AssignmentRuleTarget: target_role_id="VP Finance"
→ C-suite and VP Finance must complete the executive compliance path by June 30
```

**Individual Remediation**:
```
AssignmentRule: scope=individual, course="SAF-101-REMEDIAL", due_type=relative_days, due_days=7
AssignmentRuleTarget: target_user_id="demo-op"
→ Specific user assigned remedial training with 7-day deadline
```

---

## 7. Enrollment & Progress Tracking

### Enrollment
```
Enrollment {
  id                  : uuid (PK)
  user_id             : string (FK -> User.id, NOT NULL)
  course_id           : uuid (FK -> Course.id, NOT NULL)
  course_version_id   : uuid (FK -> CourseVersion.id, NOT NULL)  -- locked at enrollment time
  assignment_rule_id  : uuid (FK -> AssignmentRule.id, NULLABLE) -- NULL if self-enrolled
  learning_path_id    : uuid (FK -> LearningPath.id, NULLABLE)

  status              : enum [
    not_started,      -- enrolled but no activity
    in_progress,      -- started at least one lesson
    pending_grading,  -- submitted assessment awaiting manual review
    completed,        -- all requirements met and passed
    failed,           -- exhausted attempts, did not pass
    overdue,          -- past due_date without completion
    expired,          -- certification has lapsed
    waived,           -- manager/admin waived requirement
    withdrawn         -- user or admin withdrew enrollment
  ]

  enrolled_at         : timestamp (NOT NULL)
  due_date            : date (NULLABLE)
  started_at          : timestamp (NULLABLE)        -- first lesson accessed
  completed_at        : timestamp (NULLABLE)
  expired_at          : timestamp (NULLABLE)

  final_score         : decimal (NULLABLE)          -- overall course grade (0.0 to 1.0)
  time_spent_seconds  : int (DEFAULT 0)             -- total tracked time

  completion_source   : enum [system, self, manager, admin] (NULLABLE)
  completed_by        : string (FK -> User.id, NULLABLE)  -- who confirmed completion

  waived_by           : string (FK -> User.id, NULLABLE)
  waived_reason       : text (NULLABLE)
  waived_at           : timestamp (NULLABLE)

  withdrawal_reason   : text (NULLABLE)
  withdrawn_at        : timestamp (NULLABLE)
  withdrawn_by        : string (FK -> User.id, NULLABLE)

  recertification_of  : uuid (FK -> Enrollment.id, NULLABLE) -- links to prior enrollment

  created_at          : timestamp
  updated_at          : timestamp

  UNIQUE(user_id, course_version_id, assignment_rule_id)
  -- Prevents duplicate enrollments for the same rule+version
  -- A user CAN be enrolled in different versions (upgrade scenario)
}
```

### ModuleProgress
```
ModuleProgress {
  id                  : uuid (PK)
  enrollment_id       : uuid (FK -> Enrollment.id, NOT NULL)
  module_id           : uuid (FK -> Module.id, NOT NULL)

  status              : enum [not_started, in_progress, completed, skipped]
  started_at          : timestamp (NULLABLE)
  completed_at        : timestamp (NULLABLE)
  time_spent_seconds  : int (DEFAULT 0)

  UNIQUE(enrollment_id, module_id)
}
```

### LessonProgress
```
LessonProgress {
  id                  : uuid (PK)
  enrollment_id       : uuid (FK -> Enrollment.id, NOT NULL)
  lesson_id           : uuid (FK -> Lesson.id, NOT NULL)

  status              : enum [not_started, in_progress, completed, skipped]
  started_at          : timestamp (NULLABLE)
  completed_at        : timestamp (NULLABLE)
  time_spent_seconds  : int (DEFAULT 0)
  last_position       : jsonb (NULLABLE)            -- video timestamp, scroll position, SCORM bookmark

  -- SCORM tracking fields (if lesson_type = scorm)
  scorm_status        : string (NULLABLE)           -- "completed", "passed", "failed", etc.
  scorm_score         : decimal (NULLABLE)
  scorm_suspend_data  : text (NULLABLE)             -- SCORM bookmark data

  UNIQUE(enrollment_id, lesson_id)
}
```

### EnrollmentSnapshot (compliance audit trail)
```
EnrollmentSnapshot {
  id                  : uuid (PK)
  enrollment_id       : uuid (FK -> Enrollment.id, NOT NULL)
  snapshot_type       : enum [status_change, score_update, deadline_change, waiver, withdrawal]

  previous_status     : string (NULLABLE)
  new_status          : string (NOT NULL)
  previous_score      : decimal (NULLABLE)
  new_score           : decimal (NULLABLE)
  previous_due_date   : date (NULLABLE)
  new_due_date        : date (NULLABLE)

  changed_by          : string (FK -> User.id, NOT NULL)
  change_reason       : text (NULLABLE)
  metadata            : jsonb (NULLABLE)            -- any additional context

  created_at          : timestamp (NOT NULL)
}
```

**Why snapshots?** For compliance auditing, you need to answer questions like:
- "Was this person's deadline extended? By whom? When?"
- "Did they fail the first time? What was the score?"
- "Who waived this requirement and why?"

EnrollmentSnapshot provides an immutable append-only log of every meaningful change.

### Progress Calculation Logic

```
Module completion:
  All required lessons within the module have status = completed

Course completion:
  1. All required modules completed
  2. All assessments marked as is_final_exam have a passing attempt
  3. Overall course score >= course_version.pass_threshold (if set)

Course score:
  weighted_sum = SUM(assessment.final_score * assessment_config.weight_in_course)
  total_weight = SUM(assessment_config.weight_in_course)
  course_score = weighted_sum / total_weight

Overdue detection (scheduled job):
  SELECT * FROM enrollment
  WHERE status IN ('not_started', 'in_progress')
  AND due_date < CURRENT_DATE
  → Update status to 'overdue', create EnrollmentSnapshot, send notifications

Expiration detection (scheduled job):
  SELECT uc.* FROM user_certification uc
  WHERE uc.expires_at < CURRENT_DATE
  AND uc.status = 'active'
  → Update to 'expired', trigger recertification enrollment if rule exists
```

---

## 8. Compliance & Certification

### Certification
```
Certification {
  id                  : uuid (PK)
  code                : string (UNIQUE, NOT NULL)   -- e.g., "CERT-LOTO", "CERT-HAZMAT"
  title               : string (NOT NULL)
  description         : text (NULLABLE)
  issuing_authority   : string (NULLABLE)           -- "OSHA", "Internal", "State of Oklahoma"

  -- What earns this certification
  qualifying_course_id     : uuid (FK -> Course.id, NULLABLE)
  qualifying_learning_path_id : uuid (FK -> LearningPath.id, NULLABLE)
  qualifying_assessment_id : uuid (FK -> Assessment.id, NULLABLE) -- standalone cert exam

  -- Validity
  validity_period_days : int (NULLABLE)             -- NULL = never expires
  grace_period_days    : int (DEFAULT 0)            -- days after expiry before non-compliant

  -- Recertification
  recertification_course_id : uuid (FK -> Course.id, NULLABLE)  -- different from initial
  recertification_assessment_id : uuid (FK -> Assessment.id, NULLABLE)

  is_active           : boolean (DEFAULT true)
  created_at          : timestamp
  updated_at          : timestamp
}
```

### UserCertification
```
UserCertification {
  id                  : uuid (PK)
  user_id             : string (FK -> User.id, NOT NULL)
  certification_id    : uuid (FK -> Certification.id, NOT NULL)
  enrollment_id       : uuid (FK -> Enrollment.id, NULLABLE)  -- what enrollment earned it

  status              : enum [active, expired, revoked, pending_renewal]
  issued_at           : timestamp (NOT NULL)
  expires_at          : timestamp (NULLABLE)
  revoked_at          : timestamp (NULLABLE)
  revoked_by          : string (FK -> User.id, NULLABLE)
  revoked_reason      : text (NULLABLE)

  certificate_number  : string (NULLABLE)           -- external cert tracking number
  external_evidence_file_id : uuid (FK -> ContentFile.id, NULLABLE) -- uploaded cert scan

  renewed_from_id     : uuid (FK -> UserCertification.id, NULLABLE)  -- chain of renewals

  created_at          : timestamp
}
```

### RecertificationSchedule
```
RecertificationSchedule {
  id                  : uuid (PK)
  user_certification_id : uuid (FK -> UserCertification.id, NOT NULL)

  recertification_due : date (NOT NULL)
  notification_sent_at : timestamp (NULLABLE)
  escalation_sent_at  : timestamp (NULLABLE)

  enrollment_id       : uuid (FK -> Enrollment.id, NULLABLE)  -- auto-created enrollment

  status              : enum [upcoming, notified, enrolled, completed, overdue, waived]

  created_at          : timestamp
  updated_at          : timestamp
}
```

### Compliance Dashboard Queries

The model supports these key compliance views:

```sql
-- Organization-wide compliance rate
SELECT
  COUNT(*) FILTER (WHERE e.status = 'completed') * 100.0 / COUNT(*) as compliance_rate
FROM enrollment e
JOIN assignment_rule ar ON e.assignment_rule_id = ar.id
JOIN course c ON e.course_id = c.id
WHERE c.is_mandatory = true AND ar.is_active = true;

-- Department compliance breakdown
SELECT
  u.department,
  COUNT(*) FILTER (WHERE e.status = 'completed') as completed,
  COUNT(*) FILTER (WHERE e.status = 'overdue') as overdue,
  COUNT(*) FILTER (WHERE e.status IN ('not_started', 'in_progress')) as in_progress,
  COUNT(*) as total
FROM enrollment e
JOIN "user" u ON e.user_id = u.id
GROUP BY u.department;

-- Expiring certifications (next 90 days)
SELECT uc.*, u.name, u.department, u.manager_id, c.title
FROM user_certification uc
JOIN "user" u ON uc.user_id = u.id
JOIN certification c ON uc.certification_id = c.id
WHERE uc.expires_at BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '90 days'
AND uc.status = 'active';

-- Individual compliance record (for a specific user)
SELECT
  c.title as course,
  e.status,
  e.enrolled_at,
  e.due_date,
  e.completed_at,
  e.final_score,
  cv.version_number,
  ar.rule_name as assigned_by
FROM enrollment e
JOIN course c ON e.course_id = c.id
JOIN course_version cv ON e.course_version_id = cv.id
LEFT JOIN assignment_rule ar ON e.assignment_rule_id = ar.id
WHERE e.user_id = $1
ORDER BY e.enrolled_at DESC;
```

---

## 9. File & Content Management

### ContentFile
```
ContentFile {
  id                  : uuid (PK)

  -- Storage
  storage_provider    : enum [local, s3, azure_blob, gcs]
  storage_key         : string (NOT NULL)           -- path/key in storage
  storage_bucket      : string (NULLABLE)

  -- Metadata
  original_filename   : string (NOT NULL)
  mime_type           : string (NOT NULL)           -- e.g., "application/pdf", "video/mp4"
  file_size_bytes     : bigint (NOT NULL)
  checksum_sha256     : string (NULLABLE)           -- integrity verification

  -- Classification
  file_category       : enum [
    document,         -- PDF, DOCX, PPTX
    video,            -- MP4, WEBM
    audio,            -- MP3, WAV
    image,            -- PNG, JPG, SVG
    scorm_package,    -- ZIP containing imsmanifest.xml
    xapi_package,     -- xAPI/cmi5 content
    certificate_template,  -- PDF/image template for cert generation
    submission,       -- learner-uploaded file
    evidence          -- compliance evidence document
  ]

  -- SCORM-specific
  scorm_version       : string (NULLABLE)           -- "1.2", "2004_3rd", "2004_4th"
  scorm_manifest_data : jsonb (NULLABLE)            -- parsed imsmanifest.xml
  scorm_entry_point   : string (NULLABLE)           -- launch URL within package

  -- Video-specific
  duration_seconds    : int (NULLABLE)
  thumbnail_url       : string (NULLABLE)
  transcription_text  : text (NULLABLE)

  -- Access control
  clearance_level     : int (DEFAULT 1)             -- minimum clearance to download

  -- Lifecycle
  uploaded_by         : string (FK -> User.id)
  uploaded_at         : timestamp (NOT NULL)
  is_active           : boolean (DEFAULT true)
  deleted_at          : timestamp (NULLABLE)        -- soft delete

  -- Virus scan status
  scan_status         : enum [pending, clean, infected, error] (DEFAULT pending)
  scanned_at          : timestamp (NULLABLE)
}
```

### File Upload & Processing Pipeline

```
1. User uploads file
2. Store in temporary location, create ContentFile record (scan_status = pending)
3. Async: Run virus scan
   - If clean → move to permanent storage, update scan_status
   - If infected → quarantine, notify admin, mark record
4. If SCORM package:
   - Extract and parse imsmanifest.xml
   - Store manifest data in scorm_manifest_data
   - Extract entry point URL
   - Store extracted package in accessible location
5. If video:
   - Extract duration, generate thumbnail
   - Optionally trigger transcription service
6. File is now available for attachment to LessonContent, Questions, etc.
```

---

## 10. Approval Workflows

### ApprovalRequest
```
ApprovalRequest {
  id                  : uuid (PK)

  request_type        : enum [
    completion_verification,   -- manager confirms employee completed training
    waiver_request,            -- request to waive a requirement
    deadline_extension,        -- request to extend due date
    manual_grade_review,       -- grading decision review
    content_publish,           -- course content ready to publish
    enrollment_exception       -- enroll someone outside normal rules
  ]

  -- What this approval is for
  enrollment_id       : uuid (FK -> Enrollment.id, NULLABLE)
  assessment_attempt_id : uuid (FK -> AssessmentAttempt.id, NULLABLE)
  course_version_id   : uuid (FK -> CourseVersion.id, NULLABLE)

  -- Who
  requested_by        : string (FK -> User.id, NOT NULL)
  assigned_to         : string (FK -> User.id, NOT NULL)    -- primary approver
  escalation_to       : string (FK -> User.id, NULLABLE)    -- if primary doesn't respond

  -- Status
  status              : enum [pending, approved, rejected, escalated, cancelled, expired]

  -- Request details
  request_title       : string (NOT NULL)
  request_body        : text (NULLABLE)
  requested_value     : jsonb (NULLABLE)            -- e.g., {"new_due_date": "2026-04-15"}

  -- Resolution
  resolved_at         : timestamp (NULLABLE)
  resolution_notes    : text (NULLABLE)

  -- Timing
  due_by              : timestamp (NULLABLE)        -- auto-escalate after this
  escalated_at        : timestamp (NULLABLE)

  created_at          : timestamp
  updated_at          : timestamp
}
```

### ApprovalAction (audit trail for multi-step approvals)
```
ApprovalAction {
  id                  : uuid (PK)
  request_id          : uuid (FK -> ApprovalRequest.id, NOT NULL)

  action              : enum [comment, approve, reject, escalate, reassign, cancel]
  acted_by            : string (FK -> User.id, NOT NULL)
  comment             : text (NULLABLE)

  -- For reassign
  reassigned_to       : string (FK -> User.id, NULLABLE)

  created_at          : timestamp (NOT NULL)
}
```

### Workflow Rules

**Manager Completion Verification**:
```
When: lesson.completion_criteria = manual_confirm
      OR course requires manager sign-off (configurable per AssignmentRule)
Flow:
  1. Employee marks lesson/course as "ready for review"
  2. ApprovalRequest created, assigned_to = employee.manager_id
  3. Manager reviews and approves/rejects
  4. If approved → LessonProgress/Enrollment updated to completed
  5. If rejected → employee notified with feedback
```

**Deadline Extension**:
```
When: Employee or manager requests extension
Flow:
  1. ApprovalRequest with request_type = deadline_extension
  2. requested_value = {"new_due_date": "2026-04-15", "reason": "..."}
  3. Assigned to manager (or manager's manager for manager requests)
  4. If approved → Enrollment.due_date updated, EnrollmentSnapshot created
```

**Direct Report Marking** (manager marks employee complete):
```
When: Manager has permission to mark direct reports as complete
Constraints:
  - Can only mark for users where user.manager_id = current_user.id
  - Creates EnrollmentSnapshot with completion_source = "manager"
  - Optional: Require secondary approval for compliance-critical courses
```

---

## 11. Audit & History

### LmsAuditLog
```
LmsAuditLog {
  id                  : uuid (PK)

  entity_type         : string (NOT NULL)           -- "enrollment", "course", "assessment_attempt", etc.
  entity_id           : uuid (NOT NULL)
  action              : enum [create, update, delete, access, export, grade, approve, reject]

  actor_id            : string (FK -> User.id, NOT NULL)
  actor_role          : string
  actor_department    : string

  changes             : jsonb (NULLABLE)            -- {field: {old: ..., new: ...}}
  metadata            : jsonb (NULLABLE)            -- IP address, session, etc.

  created_at          : timestamp (NOT NULL)
}
```

This is separate from the existing SENS audit log (`sens-audit-log` in localStorage) and specifically tracks LMS-related activities with richer structure for compliance reporting.

---

## 12. Edge Cases & Design Decisions

### What happens when someone changes departments?

**Problem**: User transfers from Engineering to Operations. They have Engineering-specific training in progress and now need Operations training.

**Solution**:
1. The assignment rules engine runs on a schedule (or triggered by user update)
2. **Existing enrollments are NOT cancelled** — they remain with their original assignment_rule_id. This preserves the audit trail and allows in-progress training to be completed.
3. **New assignments are evaluated**: Operations rules now apply to the user, generating new enrollments.
4. **Manager gets notified**: A notification is sent when a transferred employee has outstanding training from their old department. The new manager can choose to:
   - Let them complete it (if still relevant)
   - Request a waiver (ApprovalRequest with type = waiver_request)
   - Request withdrawal (changes enrollment status to withdrawn)
5. **EnrollmentSnapshot** records the department change event for audit purposes.

**Implementation**:
```
-- Scheduled job or triggered on user.department change:
UPDATE enrollment SET metadata = jsonb_set(
  COALESCE(metadata, '{}'),
  '{department_at_enrollment}',
  to_jsonb(OLD.department)
)
WHERE user_id = $user_id AND status IN ('not_started', 'in_progress');

-- Then re-evaluate assignment rules for the user
CALL evaluate_assignments_for_user($user_id);
```

### How to handle recertification requirements?

**Problem**: Annual safety certification expires. User must re-certify.

**Solution** (multi-layered):
1. `Certification.validity_period_days` defines how long a cert lasts (e.g., 365)
2. `UserCertification.expires_at` = issued_at + validity_period_days
3. `RecertificationSchedule` is created when a cert is issued
4. Scheduled job checks daily for upcoming expirations:
   - 90 days before: `status = upcoming` (visible in dashboard)
   - 60 days before: `status = notified`, notification sent to user + manager
   - 30 days before: Auto-creates new enrollment for recertification course
   - At expiration: `UserCertification.status = expired`, `Enrollment.status = expired`
   - After grace period: Escalation to department head
5. `recertification_course_id` on Certification allows a shorter recert course vs. the full initial course
6. `UserCertification.renewed_from_id` creates a linked chain: initial -> 1st renewal -> 2nd renewal -> ...

### How to track historical compliance?

**Problem**: Auditor asks "Was John Smith compliant with OSHA Lockout/Tagout training on March 15, 2025?"

**Solution**:
1. **EnrollmentSnapshot** provides a complete timeline of every status change with timestamps
2. **UserCertification** records show issued/expired dates
3. Query approach:
```sql
-- Was user compliant at a specific date?
SELECT
  uc.status,
  uc.issued_at,
  uc.expires_at,
  CASE
    WHEN $target_date BETWEEN uc.issued_at AND COALESCE(uc.expires_at, '9999-12-31')
    THEN 'COMPLIANT'
    ELSE 'NON-COMPLIANT'
  END as compliance_status
FROM user_certification uc
JOIN certification c ON uc.certification_id = c.id
WHERE uc.user_id = $user_id
AND c.code = 'CERT-LOTO'
AND uc.issued_at <= $target_date
ORDER BY uc.issued_at DESC
LIMIT 1;
```
4. The `renewed_from_id` chain on UserCertification allows traversing the complete certification history for any user/certification combination.

### Content version transition

**Problem**: Course SAF-101 v2 is published. Some users are mid-way through v1.

**Solution**:
- Users with `enrollment.status IN ('in_progress')` stay on v1 (their `course_version_id` is locked)
- New enrollments automatically get v2 (latest published version)
- Admin can optionally force-migrate: create new v2 enrollment, withdraw v1 enrollment, with appropriate EnrollmentSnapshot records
- Historical completions of v1 remain valid unless the Certification is explicitly updated to require v2

### Self-enrollment vs. mandatory assignment

**Solution**: The `assignment_rule_id` field on Enrollment distinguishes these:
- `assignment_rule_id IS NOT NULL` → mandatory, assigned by rule
- `assignment_rule_id IS NULL` → voluntary self-enrollment
- Self-enrolled courses do not count toward compliance metrics unless explicitly tagged
- Self-enrollment can be restricted by course category or clearance level

### Assessment integrity

**Problem**: Preventing cheating on timed assessments.

**Solution** (data model support):
- `AssessmentAttempt.expires_at` = started_at + time_limit (enforced server-side)
- `AssessmentAttempt.questions_presented` records the exact randomized question set
- `AttemptAnswer.time_spent_seconds` tracks per-question timing (anomaly detection)
- `attempt_cooldown_hours` prevents rapid retry after failure
- Application layer can add: IP logging, browser focus tracking, proctoring integration

### Multi-site compliance

**Problem**: Noble OK and Richmond VA have different state regulatory requirements.

**Solution**: The `scope = site` assignment rule target allows per-site training requirements:
```
Rule: "Oklahoma OSHA State Supplement"
  scope = site
  target_site_id = "noble-ok"
  course = "OSHA-OK-SUPPLEMENT"

Rule: "Virginia DEQ Compliance"
  scope = site
  target_site_id = "richmond-va"
  course = "VA-DEQ-101"
```

This stacks with global and department rules, so a Noble OK operator gets: global safety + operations dept training + Oklahoma-specific training.

---

## 13. Full Entity-Relationship Summary

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ORGANIZATIONAL LAYER                              │
│                                                                     │
│  User ──< manages >── User (manager_id)                            │
│  User ──< belongs to >── Department                                │
│  User ──< has >── Role                                             │
│  User ──< assigned to >── Site                                     │
│  Department ──< parent of >── Department                           │
└────────────────────────────┬────────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────────┐
│                    CONTENT LAYER                                     │
│                                                                     │
│  Course ──< has versions >── CourseVersion                          │
│  CourseVersion ──< contains >── Module                              │
│  Module ──< contains >── Lesson                                    │
│  Lesson ──< contains >── LessonContent                             │
│  LessonContent ──< references >── ContentFile                      │
│  Lesson ──< may have >── Assessment                                │
│  Lesson ──< may use >── ContentFile (SCORM)                        │
│                                                                     │
│  LearningPath ──< contains >── Course (via LearningPathCourse)     │
└────────────────────────────┬────────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────────┐
│                    ASSESSMENT LAYER                                  │
│                                                                     │
│  Assessment ──< has >── Question                                   │
│  Question ──< has >── QuestionOption                               │
│  Assessment ──< configured per >── AssessmentConfig (per version)  │
│  AssessmentAttempt ──< belongs to >── Enrollment                   │
│  AssessmentAttempt ──< for >── Assessment                          │
│  AssessmentAttempt ──< has >── AttemptAnswer                       │
│  AttemptAnswer ──< answers >── Question                            │
└────────────────────────────┬────────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────────┐
│                    ASSIGNMENT LAYER                                  │
│                                                                     │
│  AssignmentRule ──< targets >── AssignmentRuleTarget (1..N)        │
│  AssignmentRule ──< assigns >── Course OR LearningPath             │
│  AssignmentRuleTarget ──< references >── Department|Role|Site|User │
│                                                                     │
│  [Rules Engine evaluates rules → creates Enrollments]              │
└────────────────────────────┬────────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────────┐
│                    ENROLLMENT & PROGRESS LAYER                      │
│                                                                     │
│  Enrollment ──< for user >── User                                  │
│  Enrollment ──< for course >── Course + CourseVersion              │
│  Enrollment ──< from rule >── AssignmentRule                       │
│  Enrollment ──< tracks >── ModuleProgress (per module)             │
│  Enrollment ──< tracks >── LessonProgress (per lesson)            │
│  Enrollment ──< has >── AssessmentAttempt (per assessment)         │
│  Enrollment ──< snapshots >── EnrollmentSnapshot (audit trail)     │
│  Enrollment ──< recertifies >── Enrollment (recertification_of)   │
└────────────────────────────┬────────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────────┐
│                    COMPLIANCE & CERTIFICATION LAYER                  │
│                                                                     │
│  Certification ──< qualifies via >── Course|LearningPath|Assessment│
│  UserCertification ──< earned by >── User                          │
│  UserCertification ──< from >── Enrollment                         │
│  UserCertification ──< renewed from >── UserCertification          │
│  RecertificationSchedule ──< for >── UserCertification             │
│  RecertificationSchedule ──< creates >── Enrollment                │
└────────────────────────────┬────────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────────┐
│                    WORKFLOW LAYER                                    │
│                                                                     │
│  ApprovalRequest ──< for >── Enrollment|Attempt|CourseVersion      │
│  ApprovalRequest ──< assigned to >── User                          │
│  ApprovalRequest ──< has >── ApprovalAction (1..N)                 │
│  ApprovalAction ──< by >── User                                    │
└────────────────────────────┬────────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────────┐
│                    AUDIT LAYER                                       │
│                                                                     │
│  LmsAuditLog ──< for any entity >── * (polymorphic)               │
│  EnrollmentSnapshot ──< for >── Enrollment                         │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Relationship Cardinalities

| Relationship | Cardinality | Notes |
|---|---|---|
| User : Enrollment | 1 : N | One user, many enrollments over time |
| Course : CourseVersion | 1 : N | Content versioning |
| CourseVersion : Module | 1 : N | Ordered modules per version |
| Module : Lesson | 1 : N | Ordered lessons per module |
| Lesson : LessonContent | 1 : N | Mixed media per lesson |
| Assessment : Question | 1 : N | Ordered questions |
| Question : QuestionOption | 1 : N | MC options |
| Enrollment : AssessmentAttempt | 1 : N | Multiple attempts allowed |
| AssessmentAttempt : AttemptAnswer | 1 : N | One answer per question per attempt |
| AssignmentRule : AssignmentRuleTarget | 1 : N | Multi-target rules |
| Enrollment : EnrollmentSnapshot | 1 : N | Audit trail |
| Certification : UserCertification | 1 : N | Many users hold same cert |
| UserCertification : UserCertification | 1 : 1 | Renewal chain |
| ApprovalRequest : ApprovalAction | 1 : N | Multi-step workflow |

### Index Recommendations

```sql
-- Enrollment lookups (most frequent queries)
CREATE INDEX idx_enrollment_user_status ON enrollment(user_id, status);
CREATE INDEX idx_enrollment_course_version ON enrollment(course_version_id);
CREATE INDEX idx_enrollment_due_date ON enrollment(due_date) WHERE status IN ('not_started', 'in_progress');
CREATE INDEX idx_enrollment_overdue ON enrollment(due_date, status) WHERE status = 'overdue';

-- Assignment rule evaluation
CREATE INDEX idx_assignment_rule_active ON assignment_rule(is_active, effective_date, expiry_date);
CREATE INDEX idx_rule_target_dept ON assignment_rule_target(target_department_id) WHERE target_department_id IS NOT NULL;
CREATE INDEX idx_rule_target_role ON assignment_rule_target(target_role_id) WHERE target_role_id IS NOT NULL;
CREATE INDEX idx_rule_target_site ON assignment_rule_target(target_site_id) WHERE target_site_id IS NOT NULL;

-- Certification expiration monitoring
CREATE INDEX idx_user_cert_expiry ON user_certification(expires_at, status) WHERE status = 'active';
CREATE INDEX idx_user_cert_user ON user_certification(user_id, certification_id);

-- Assessment grading queue
CREATE INDEX idx_attempt_grading ON assessment_attempt(status) WHERE status = 'grading';

-- Audit log queries
CREATE INDEX idx_audit_entity ON lms_audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_actor ON lms_audit_log(actor_id, created_at);
CREATE INDEX idx_snapshot_enrollment ON enrollment_snapshot(enrollment_id, created_at);

-- Progress tracking
CREATE INDEX idx_module_progress ON module_progress(enrollment_id);
CREATE INDEX idx_lesson_progress ON lesson_progress(enrollment_id);

-- Approval queue
CREATE INDEX idx_approval_assigned ON approval_request(assigned_to, status) WHERE status = 'pending';
```

---

## Appendix A: Status State Machines

### Enrollment Status Transitions
```
                    ┌──────────────┐
                    │  not_started │
                    └──────┬───────┘
                           │ (first lesson accessed)
                    ┌──────▼───────┐
              ┌─────│ in_progress  │─────┐
              │     └──────┬───────┘     │
              │            │             │
    (waived)  │  (assessment submitted)  │ (past due date)
              │            │             │
              │     ┌──────▼───────┐     │     ┌──────────┐
              │     │pending_grading│     ├────>│  overdue  │
              │     └──────┬───────┘     │     └──────┬───┘
              │            │             │            │
              │    (graded + passed)     │    (completed late)
              │            │             │            │
              │     ┌──────▼───────┐     │            │
              ├────>│  completed   │<────┼────────────┘
              │     └──────────────┘     │
              │                          │
              │     ┌──────────────┐     │     ┌──────────┐
              │     │   failed     │<────┘     │ withdrawn│
              │     └──────────────┘  (max     └──────────┘
              │                       attempts)      ▲
              │     ┌──────────────┐                 │
              └────>│   waived     │      (admin/user withdraws)
                    └──────────────┘

        completed ──(cert expires)──> expired
```

### Assessment Attempt Status Transitions
```
  in_progress ──(submit)──> submitted ──(auto-grade)──> graded
                                      ──(needs manual)──> grading ──(graded)──> graded
  in_progress ──(time expires)──> expired
```

### Approval Request Status Transitions
```
  pending ──(approved)──> approved
         ──(rejected)──> rejected
         ──(past due_by)──> escalated ──(approved)──> approved
                                      ──(rejected)──> rejected
         ──(cancelled)──> cancelled
         ──(past escalation timeout)──> expired
```
