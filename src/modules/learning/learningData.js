import { BADGE_USERS, getDirectReports, getAllReports } from "@core/users/badgeData";

/* ═══════════════════════════════════════════════════════════════════
   Learning Data — LMS data models, mock data, and helper functions
   ═══════════════════════════════════════════════════════════════════ */

const STORAGE_KEY = "sens-learning-data";

// ═══ COURSE CATEGORIES ══════════════════════════════════════════════════
export const COURSE_CATEGORIES = [
  { key: "safety", label: "Safety", color: "#C44B3B" },
  { key: "compliance", label: "Compliance", color: "#D4945F" },
  { key: "technical", label: "Technical", color: "#5B8FB9" },
  { key: "onboarding", label: "Onboarding", color: "#6B9B6B" },
  { key: "leadership", label: "Leadership", color: "#9B7EC8" },
  { key: "professional", label: "Professional Dev", color: "#5BA89F" },
];

export const CONTENT_TYPES = ["document", "video", "scorm", "interactive"];

// ═══ DEFAULT COURSES ════════════════════════════════════════════════════
const DEFAULT_COURSES = [
  { id: "c-001", title: "Workplace Safety Fundamentals", description: "Core safety training covering hazard identification, PPE requirements, emergency procedures, and incident reporting for all site personnel.", category: "safety", type: "required", contentType: "interactive", estimatedMinutes: 90, passingScore: 80, maxAttempts: 3, version: "2.1", createdBy: "thomas", createdAt: "2025-06-15", updatedAt: "2025-12-01" },
  { id: "c-002", title: "Chemical Handling & HAZMAT", description: "Specialized training for personnel handling hazardous materials. Covers WHMIS, SDS interpretation, spill response, and chemical storage protocols.", category: "safety", type: "required", contentType: "video", estimatedMinutes: 120, passingScore: 85, maxAttempts: 3, version: "1.4", createdBy: "thomas", createdAt: "2025-07-01", updatedAt: "2025-11-15" },
  { id: "c-003", title: "Confined Space Entry", description: "Mandatory training for confined space operations including atmospheric testing, entry permits, rescue procedures, and ventilation requirements.", category: "safety", type: "required", contentType: "interactive", estimatedMinutes: 60, passingScore: 90, maxAttempts: 2, version: "3.0", createdBy: "marcus", createdAt: "2025-04-10", updatedAt: "2025-10-20" },
  { id: "c-004", title: "Environmental Compliance", description: "Annual environmental compliance training covering emissions monitoring, waste management, water treatment protocols, and regulatory reporting requirements.", category: "compliance", type: "required", contentType: "document", estimatedMinutes: 75, passingScore: 80, maxAttempts: 3, version: "2.0", createdBy: "rachel", createdAt: "2025-05-20", updatedAt: "2025-11-01" },
  { id: "c-005", title: "Anti-Bribery & Ethics", description: "Corporate ethics training covering anti-corruption policies, gift and entertainment guidelines, conflict of interest reporting, and whistleblower protections.", category: "compliance", type: "required", contentType: "interactive", estimatedMinutes: 45, passingScore: 80, maxAttempts: 3, version: "1.2", createdBy: "thomas", createdAt: "2025-08-01", updatedAt: "2026-01-15" },
  { id: "c-006", title: "Data Privacy & Cybersecurity", description: "Training on data protection regulations, secure information handling, phishing awareness, password management, and incident reporting procedures.", category: "compliance", type: "required", contentType: "interactive", estimatedMinutes: 60, passingScore: 80, maxAttempts: 3, version: "2.3", createdBy: "thomas", createdAt: "2025-03-15", updatedAt: "2025-12-15" },
  { id: "c-007", title: "Process Control Systems", description: "Technical training on DCS/SCADA operation, alarm management, process interlocks, and safe shutdown procedures for plant control systems.", category: "technical", type: "required", contentType: "scorm", estimatedMinutes: 180, passingScore: 75, maxAttempts: 3, version: "1.8", createdBy: "lena", createdAt: "2025-06-01", updatedAt: "2025-11-20" },
  { id: "c-008", title: "Reactor Operations & Monitoring", description: "Advanced training on reactor startup/shutdown sequences, parameter monitoring, catalyst management, and emergency response for reactor systems.", category: "technical", type: "required", contentType: "interactive", estimatedMinutes: 240, passingScore: 85, maxAttempts: 2, version: "2.5", createdBy: "lena", createdAt: "2025-04-01", updatedAt: "2025-10-15" },
  { id: "c-009", title: "Predictive Maintenance Techniques", description: "Training on vibration analysis, thermography, oil analysis, ultrasonic testing, and condition-based maintenance planning.", category: "technical", type: "optional", contentType: "video", estimatedMinutes: 150, passingScore: 70, maxAttempts: 5, version: "1.3", createdBy: "marcus", createdAt: "2025-07-15", updatedAt: "2025-12-01" },
  { id: "c-010", title: "New Employee Orientation", description: "Comprehensive onboarding program covering company history, organizational structure, policies, benefits, IT systems access, and site familiarization.", category: "onboarding", type: "required", contentType: "interactive", estimatedMinutes: 120, passingScore: 70, maxAttempts: 5, version: "3.1", createdBy: "thomas", createdAt: "2025-01-15", updatedAt: "2025-09-01" },
  { id: "c-011", title: "Leadership Essentials", description: "Core leadership skills including effective communication, coaching and feedback, performance management, conflict resolution, and team development.", category: "leadership", type: "optional", contentType: "video", estimatedMinutes: 180, passingScore: 70, maxAttempts: 5, version: "1.5", createdBy: "thomas", createdAt: "2025-05-01", updatedAt: "2025-11-10" },
  { id: "c-012", title: "Project Management Fundamentals", description: "Introduction to project management methodologies, scheduling, resource planning, risk management, and stakeholder communication.", category: "professional", type: "optional", contentType: "document", estimatedMinutes: 120, passingScore: 70, maxAttempts: 5, version: "2.0", createdBy: "omar", createdAt: "2025-06-20", updatedAt: "2025-12-05" },
  { id: "c-013", title: "Lockout/Tagout (LOTO)", description: "Mandatory energy isolation training covering lockout/tagout procedures, verification methods, group isolation, and equipment-specific protocols.", category: "safety", type: "required", contentType: "interactive", estimatedMinutes: 60, passingScore: 90, maxAttempts: 2, version: "2.2", createdBy: "marcus", createdAt: "2025-03-01", updatedAt: "2025-09-15" },
  { id: "c-014", title: "Financial Reporting Standards", description: "Training on IFRS/GAAP reporting requirements, internal controls, audit preparation, and financial disclosure obligations.", category: "compliance", type: "required", contentType: "document", estimatedMinutes: 90, passingScore: 80, maxAttempts: 3, version: "1.1", createdBy: "james", createdAt: "2025-08-15", updatedAt: "2026-01-10" },
  { id: "c-015", title: "Diversity, Equity & Inclusion", description: "Building an inclusive workplace through unconscious bias awareness, inclusive communication, allyship practices, and accessibility considerations.", category: "professional", type: "optional", contentType: "video", estimatedMinutes: 60, passingScore: 70, maxAttempts: 5, version: "1.0", createdBy: "thomas", createdAt: "2025-09-01", updatedAt: "2025-12-20" },
];

// ═══ DEFAULT MODULES (Course sections) ══════════════════════════════════
const DEFAULT_MODULES = [
  // c-001 Workplace Safety
  { id: "m-001-1", courseId: "c-001", title: "Hazard Identification", order: 1, contentHtml: "<p>Learn to identify workplace hazards using the hierarchy of controls.</p>", assessmentId: null },
  { id: "m-001-2", courseId: "c-001", title: "Personal Protective Equipment", order: 2, contentHtml: "<p>PPE selection, inspection, and proper use for various hazards.</p>", assessmentId: null },
  { id: "m-001-3", courseId: "c-001", title: "Emergency Procedures", order: 3, contentHtml: "<p>Emergency response, evacuation, muster points, and first aid.</p>", assessmentId: "a-001" },
  // c-002 HAZMAT
  { id: "m-002-1", courseId: "c-002", title: "WHMIS & SDS", order: 1, contentHtml: "<p>Understanding Safety Data Sheets and WHMIS classifications.</p>", assessmentId: null },
  { id: "m-002-2", courseId: "c-002", title: "Spill Response", order: 2, contentHtml: "<p>Chemical spill containment, cleanup, and reporting procedures.</p>", assessmentId: "a-002" },
  // c-005 Ethics
  { id: "m-005-1", courseId: "c-005", title: "Anti-Corruption Policies", order: 1, contentHtml: "<p>Understanding corporate anti-bribery and corruption policies.</p>", assessmentId: null },
  { id: "m-005-2", courseId: "c-005", title: "Ethics Scenarios", order: 2, contentHtml: "<p>Real-world ethical scenarios and decision-making frameworks.</p>", assessmentId: "a-005" },
  // c-008 Reactor
  { id: "m-008-1", courseId: "c-008", title: "Reactor Fundamentals", order: 1, contentHtml: "<p>Reactor chemistry, thermodynamics, and operating principles.</p>", assessmentId: null },
  { id: "m-008-2", courseId: "c-008", title: "Startup & Shutdown", order: 2, contentHtml: "<p>Step-by-step procedures for reactor startup and shutdown sequences.</p>", assessmentId: null },
  { id: "m-008-3", courseId: "c-008", title: "Emergency Response", order: 3, contentHtml: "<p>Emergency procedures for reactor upset conditions and incidents.</p>", assessmentId: "a-008" },
  // c-010 Onboarding
  { id: "m-010-1", courseId: "c-010", title: "Company Overview", order: 1, contentHtml: "<p>Welcome to SENS: our mission, values, and organizational structure.</p>", assessmentId: null },
  { id: "m-010-2", courseId: "c-010", title: "Policies & Benefits", order: 2, contentHtml: "<p>Key policies, benefits overview, and HR resources.</p>", assessmentId: null },
  { id: "m-010-3", courseId: "c-010", title: "Systems & Access", order: 3, contentHtml: "<p>IT systems access, security protocols, and getting help.</p>", assessmentId: "a-010" },
];

// ═══ DEFAULT ASSESSMENTS ════════════════════════════════════════════════
const DEFAULT_ASSESSMENTS = [
  {
    id: "a-001", title: "Workplace Safety Final Assessment", type: "auto-graded", courseId: "c-001",
    passingScore: 80, timeLimit: 30, allowRetake: true, maxAttempts: 3,
    questions: [
      { id: "q-001-1", type: "multiple-choice", prompt: "What is the first step in the hierarchy of controls?", options: ["Elimination", "Engineering controls", "PPE", "Administrative controls"], correctAnswer: "Elimination", points: 10 },
      { id: "q-001-2", type: "true-false", prompt: "PPE is the most effective control measure in the hierarchy of controls.", correctAnswer: "false", points: 10 },
      { id: "q-001-3", type: "multiple-choice", prompt: "When should you report a near-miss incident?", options: ["Immediately", "At end of shift", "Only if someone was hurt", "Weekly"], correctAnswer: "Immediately", points: 10 },
      { id: "q-001-4", type: "multiple-choice", prompt: "What color is used for fire safety equipment signage?", options: ["Red", "Blue", "Green", "Yellow"], correctAnswer: "Red", points: 10 },
      { id: "q-001-5", type: "short-answer", prompt: "Name three types of PPE used in industrial settings.", correctAnswer: null, points: 10 },
    ],
  },
  {
    id: "a-002", title: "Chemical Handling Assessment", type: "auto-graded", courseId: "c-002",
    passingScore: 85, timeLimit: 25, allowRetake: true, maxAttempts: 3,
    questions: [
      { id: "q-002-1", type: "multiple-choice", prompt: "What does SDS stand for?", options: ["Safety Data Sheet", "Standard Data Summary", "Safety Document System", "Site Data Standard"], correctAnswer: "Safety Data Sheet", points: 10 },
      { id: "q-002-2", type: "true-false", prompt: "Incompatible chemicals can be stored in the same cabinet if properly labeled.", correctAnswer: "false", points: 10 },
      { id: "q-002-3", type: "multiple-choice", prompt: "What is the first action in a chemical spill response?", options: ["Evacuate the area", "Contain the spill", "Call emergency services", "Identify the chemical"], correctAnswer: "Evacuate the area", points: 10 },
    ],
  },
  {
    id: "a-005", title: "Ethics & Anti-Bribery Assessment", type: "auto-graded", courseId: "c-005",
    passingScore: 80, timeLimit: 20, allowRetake: true, maxAttempts: 3,
    questions: [
      { id: "q-005-1", type: "multiple-choice", prompt: "What should you do if offered an inappropriate gift from a vendor?", options: ["Politely decline and report", "Accept if under $50", "Accept but don't tell anyone", "Accept on behalf of the company"], correctAnswer: "Politely decline and report", points: 10 },
      { id: "q-005-2", type: "true-false", prompt: "Facilitation payments are acceptable under the company's anti-corruption policy.", correctAnswer: "false", points: 10 },
      { id: "q-005-3", type: "essay", prompt: "Describe a scenario where a conflict of interest might arise and how you would handle it.", correctAnswer: null, points: 20 },
    ],
  },
  {
    id: "a-008", title: "Reactor Operations Final", type: "manual-review", courseId: "c-008",
    passingScore: 85, timeLimit: 60, allowRetake: true, maxAttempts: 2,
    questions: [
      { id: "q-008-1", type: "multiple-choice", prompt: "What is the critical temperature threshold for emergency shutdown?", options: ["350°C", "400°C", "450°C", "500°C"], correctAnswer: "450°C", points: 15 },
      { id: "q-008-2", type: "essay", prompt: "Describe the complete reactor emergency shutdown sequence, including all required verification steps.", correctAnswer: null, points: 30 },
      { id: "q-008-3", type: "short-answer", prompt: "List the three primary catalyst deactivation mechanisms.", correctAnswer: null, points: 15 },
      { id: "q-008-4", type: "multiple-choice", prompt: "During startup, what must be verified before introducing feedstock?", options: ["Inert gas purge complete", "All valves open", "Cooling system off", "Alarms silenced"], correctAnswer: "Inert gas purge complete", points: 15 },
    ],
  },
  {
    id: "a-010", title: "Onboarding Knowledge Check", type: "auto-graded", courseId: "c-010",
    passingScore: 70, timeLimit: 15, allowRetake: true, maxAttempts: 5,
    questions: [
      { id: "q-010-1", type: "multiple-choice", prompt: "Who should you contact for IT access issues?", options: ["IT Help Desk", "Your manager", "HR", "CEO"], correctAnswer: "IT Help Desk", points: 10 },
      { id: "q-010-2", type: "true-false", prompt: "You can share your system password with a trusted colleague.", correctAnswer: "false", points: 10 },
    ],
  },
];

// ═══ DEFAULT ASSIGNMENT RULES ═══════════════════════════════════════════
const DEFAULT_ASSIGNMENT_RULES = [
  { id: "ar-001", name: "Global Safety Training", targetType: "global", targetValue: "all", courseIds: ["c-001", "c-013"], dueInDays: 30, recertifyDays: 365, isActive: true, priority: 1, createdBy: "thomas" },
  { id: "ar-002", name: "Corporate Compliance", targetType: "global", targetValue: "all", courseIds: ["c-005", "c-006"], dueInDays: 60, recertifyDays: 365, isActive: true, priority: 2, createdBy: "thomas" },
  { id: "ar-003", name: "Operations Technical Training", targetType: "department", targetValue: "Operations", courseIds: ["c-002", "c-003", "c-007"], dueInDays: 45, recertifyDays: 365, isActive: true, priority: 3, createdBy: "marcus" },
  { id: "ar-004", name: "Engineering Technical Training", targetType: "department", targetValue: "Engineering", courseIds: ["c-007", "c-008", "c-009"], dueInDays: 60, recertifyDays: 365, isActive: true, priority: 3, createdBy: "lena" },
  { id: "ar-005", name: "Environmental Compliance", targetType: "role", targetValue: "VP Operations", courseIds: ["c-004"], dueInDays: 30, recertifyDays: 365, isActive: true, priority: 2, createdBy: "rachel" },
  { id: "ar-006", name: "New Hire Onboarding", targetType: "global", targetValue: "all", courseIds: ["c-010"], dueInDays: 14, recertifyDays: null, isActive: true, priority: 1, createdBy: "thomas" },
  { id: "ar-007", name: "Leadership Development", targetType: "role", targetValue: "Manager", courseIds: ["c-011", "c-012"], dueInDays: 90, recertifyDays: null, isActive: true, priority: 4, createdBy: "thomas" },
  { id: "ar-008", name: "Financial Reporting", targetType: "department", targetValue: "Finance", courseIds: ["c-014"], dueInDays: 45, recertifyDays: 365, isActive: true, priority: 3, createdBy: "james" },
  { id: "ar-009", name: "Executive Ethics", targetType: "badge", targetValue: "L5", courseIds: ["c-005"], dueInDays: 30, recertifyDays: 180, isActive: true, priority: 1, createdBy: "thomas" },
];

// ═══ DEFAULT FILE ATTACHMENTS ═══════════════════════════════════════════
const DEFAULT_FILE_ATTACHMENTS = [
  { id: "f-001", name: "Safety_Handbook_v2.1.pdf", type: "application/pdf", size: 4200000, url: "/mock/safety-handbook.pdf", courseId: "c-001", moduleId: null },
  { id: "f-002", name: "HAZMAT_Quick_Reference.pdf", type: "application/pdf", size: 1800000, url: "/mock/hazmat-ref.pdf", courseId: "c-002", moduleId: null },
  { id: "f-003", name: "Reactor_Operations_Manual.pdf", type: "application/pdf", size: 8500000, url: "/mock/reactor-manual.pdf", courseId: "c-008", moduleId: null },
  { id: "f-004", name: "Safety_Video_Intro.mp4", type: "video/mp4", size: 45000000, url: "/mock/safety-intro.mp4", courseId: "c-001", moduleId: "m-001-1" },
  { id: "f-005", name: "LOTO_Procedure_Template.docx", type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", size: 250000, url: "/mock/loto-template.docx", courseId: "c-013", moduleId: null },
  { id: "f-006", name: "Ethics_Policy_2026.pdf", type: "application/pdf", size: 1200000, url: "/mock/ethics-policy.pdf", courseId: "c-005", moduleId: null },
  { id: "f-007", name: "Environmental_Regs_Summary.pdf", type: "application/pdf", size: 3100000, url: "/mock/env-regs.pdf", courseId: "c-004", moduleId: null },
  { id: "f-008", name: "Onboarding_Checklist.xlsx", type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", size: 85000, url: "/mock/onboard-checklist.xlsx", courseId: "c-010", moduleId: null },
];

// ═══ GENERATE ENROLLMENTS FROM RULES ════════════════════════════════════

function matchesRule(user, rule) {
  if (rule.targetType === "global") return true;
  if (rule.targetType === "department") return user.department === rule.targetValue;
  if (rule.targetType === "role") return user.role === rule.targetValue;
  if (rule.targetType === "badge") {
    const levelMap = { L1: 1, L2: 2, L3: 3, L4: 4, L5: 5 };
    const { getRoleClearance } = require("./badgeData");
    const rc = getRoleClearance(user.role);
    return rc.level >= (levelMap[rule.targetValue] || 99);
  }
  if (rule.targetType === "individual") return user.id === rule.targetValue;
  return false;
}

// Seeded random for deterministic mock data
function seededRandom(seed) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

function generateEnrollments() {
  const enrollments = [];
  const rand = seededRandom(42);
  let eid = 1;
  const today = new Date("2026-03-01");

  for (const user of BADGE_USERS) {
    const userCourses = new Set();
    for (const rule of DEFAULT_ASSIGNMENT_RULES) {
      if (!rule.isActive) continue;
      // Simple match (avoid dynamic require — inline badge check)
      let matches = false;
      if (rule.targetType === "global") matches = true;
      else if (rule.targetType === "department") matches = user.department === rule.targetValue;
      else if (rule.targetType === "role") matches = user.role === rule.targetValue;
      else if (rule.targetType === "badge") {
        const levelMap = { L1: 1, L2: 2, L3: 3, L4: 4, L5: 5 };
        const roleLevels = { CEO: 5, COO: 5, "VP Engineering": 3, "VP Operations": 3, "VP Finance": 3, "VP Strategy": 3, "VP People": 4, "VP Risk": 3, Manager: 2, Operator: 1, Viewer: 1 };
        matches = (roleLevels[user.role] || 1) >= (levelMap[rule.targetValue] || 99);
      }
      else if (rule.targetType === "individual") matches = user.id === rule.targetValue;
      if (!matches) continue;

      for (const courseId of rule.courseIds) {
        if (userCourses.has(courseId)) continue;
        userCourses.add(courseId);

        const r = rand();
        const assignedDate = new Date(today);
        assignedDate.setDate(assignedDate.getDate() - Math.floor(r * 180 + 30)); // assigned 30-210 days ago
        const dueDate = new Date(assignedDate);
        dueDate.setDate(dueDate.getDate() + rule.dueInDays);
        const expiresDate = rule.recertifyDays ? new Date(dueDate.getTime() + rule.recertifyDays * 86400000) : null;

        // Determine status based on random
        let status, progress, completedDate, currentModuleId;
        const r2 = rand();
        if (r2 < 0.35) {
          status = "completed";
          progress = 100;
          completedDate = new Date(assignedDate);
          completedDate.setDate(completedDate.getDate() + Math.floor(rand() * rule.dueInDays * 0.8));
          currentModuleId = null;
        } else if (r2 < 0.55) {
          status = "in-progress";
          progress = Math.floor(rand() * 70 + 10);
          completedDate = null;
          currentModuleId = null;
        } else if (r2 < 0.75 && dueDate < today) {
          status = "overdue";
          progress = Math.floor(rand() * 50);
          completedDate = null;
          currentModuleId = null;
        } else if (r2 < 0.85) {
          status = "not-started";
          progress = 0;
          completedDate = null;
          currentModuleId = null;
        } else {
          status = dueDate < today ? "overdue" : "not-started";
          progress = status === "overdue" ? Math.floor(rand() * 30) : 0;
          completedDate = null;
          currentModuleId = null;
        }

        const fmtDate = (d) => d ? d.toISOString().slice(0, 10) : null;

        enrollments.push({
          id: `e-${String(eid++).padStart(4, "0")}`,
          userId: user.id,
          courseId,
          assignmentRuleId: rule.id,
          status,
          assignedDate: fmtDate(assignedDate),
          dueDate: fmtDate(dueDate),
          completedDate: fmtDate(completedDate),
          expiresDate: fmtDate(expiresDate),
          progress,
          currentModuleId,
        });
      }
    }
  }
  return enrollments;
}

// ═══ GENERATE ASSESSMENT ATTEMPTS ═══════════════════════════════════════

function generateAttempts(enrollments) {
  const attempts = [];
  const rand = seededRandom(123);
  let aid = 1;

  for (const enr of enrollments) {
    if (enr.status !== "completed" && enr.status !== "in-progress") continue;
    if (enr.progress < 50 && enr.status === "in-progress") continue;

    const course = DEFAULT_COURSES.find((c) => c.id === enr.courseId);
    if (!course) continue;
    const assessment = DEFAULT_ASSESSMENTS.find((a) => a.courseId === enr.courseId);
    if (!assessment) continue;

    const numAttempts = enr.status === "completed" ? (rand() < 0.7 ? 1 : 2) : 1;
    for (let attempt = 1; attempt <= numAttempts; attempt++) {
      const answers = assessment.questions.map((q) => {
        const isCorrect = rand() < (enr.status === "completed" ? 0.85 : 0.6);
        return {
          questionId: q.id,
          answer: q.correctAnswer || "Sample answer text",
          isCorrect: q.type === "essay" ? null : isCorrect,
          pointsEarned: q.type === "essay" ? Math.floor(q.points * rand() * 0.5 + q.points * 0.4) : (isCorrect ? q.points : 0),
        };
      });

      const totalPoints = assessment.questions.reduce((s, q) => s + q.points, 0);
      const earned = answers.reduce((s, a) => s + a.pointsEarned, 0);
      const score = Math.round((earned / totalPoints) * 100);
      const passed = score >= assessment.passingScore;

      const submittedAt = new Date(enr.assignedDate);
      submittedAt.setDate(submittedAt.getDate() + Math.floor(rand() * 30 + 5) + (attempt - 1) * 7);

      const isManual = assessment.type === "manual-review";
      const reviewStatus = isManual ? (rand() < 0.6 ? "approved" : (rand() < 0.5 ? "rejected" : "pending")) : null;

      attempts.push({
        id: `att-${String(aid++).padStart(4, "0")}`,
        enrollmentId: enr.id,
        assessmentId: assessment.id,
        userId: enr.userId,
        answers,
        score,
        passed,
        attemptNumber: attempt,
        submittedAt: submittedAt.toISOString().slice(0, 10),
        reviewerId: isManual ? (enr.userId === "demo-op" ? "demo-mgr" : "thomas") : null,
        reviewStatus,
        reviewedAt: isManual && reviewStatus !== "pending" ? new Date(submittedAt.getTime() + 86400000 * Math.floor(rand() * 5 + 1)).toISOString().slice(0, 10) : null,
        reviewerNotes: isManual && reviewStatus === "rejected" ? "Please review the shutdown sequence section and resubmit." : null,
      });
    }
  }
  return attempts;
}

// ═══ GENERATE CERTIFICATES ══════════════════════════════════════════════

function generateCertificates(enrollments) {
  const certs = [];
  let cid = 1;
  const rand = seededRandom(456);

  for (const enr of enrollments) {
    if (enr.status !== "completed") continue;
    const course = DEFAULT_COURSES.find((c) => c.id === enr.courseId);
    if (!course) continue;

    const rule = DEFAULT_ASSIGNMENT_RULES.find((r) => r.id === enr.assignmentRuleId);
    const expiresDate = rule?.recertifyDays
      ? new Date(new Date(enr.completedDate).getTime() + rule.recertifyDays * 86400000).toISOString().slice(0, 10)
      : null;

    certs.push({
      id: `cert-${String(cid++).padStart(4, "0")}`,
      userId: enr.userId,
      courseId: enr.courseId,
      enrollmentId: enr.id,
      issuedDate: enr.completedDate,
      expiresDate,
      certificateNumber: `SENS-${enr.courseId.toUpperCase()}-${String(Math.floor(rand() * 90000 + 10000))}`,
    });
  }
  return certs;
}

// ═══ GENERATE NOTIFICATIONS ═════════════════════════════════════════════

function generateNotifications(enrollments, attempts) {
  const notifs = [];
  let nid = 1;
  const today = new Date("2026-03-01");

  for (const enr of enrollments) {
    const course = DEFAULT_COURSES.find((c) => c.id === enr.courseId);
    if (!course) continue;

    if (enr.status === "overdue") {
      const daysDiff = Math.floor((today - new Date(enr.dueDate)) / 86400000);
      notifs.push({
        id: `n-${String(nid++).padStart(4, "0")}`,
        userId: enr.userId,
        type: "overdue",
        message: `"${course.title}" is ${daysDiff} days overdue`,
        relatedId: enr.id,
        read: false,
        createdAt: enr.dueDate,
      });
    }

    if (enr.status === "not-started" || enr.status === "in-progress") {
      const dueDate = new Date(enr.dueDate);
      const daysUntil = Math.floor((dueDate - today) / 86400000);
      if (daysUntil > 0 && daysUntil <= 14) {
        notifs.push({
          id: `n-${String(nid++).padStart(4, "0")}`,
          userId: enr.userId,
          type: "due-soon",
          message: `"${course.title}" is due in ${daysUntil} days`,
          relatedId: enr.id,
          read: daysUntil > 7,
          createdAt: today.toISOString().slice(0, 10),
        });
      }
    }

    if (enr.status === "completed") {
      notifs.push({
        id: `n-${String(nid++).padStart(4, "0")}`,
        userId: enr.userId,
        type: "completed",
        message: `Congratulations! You completed "${course.title}"`,
        relatedId: enr.id,
        read: true,
        createdAt: enr.completedDate,
      });
    }
  }

  // Review-needed for managers
  for (const att of attempts) {
    if (att.reviewStatus === "pending" && att.reviewerId) {
      const assessment = DEFAULT_ASSESSMENTS.find((a) => a.id === att.assessmentId);
      const user = BADGE_USERS.find((u) => u.id === att.userId);
      notifs.push({
        id: `n-${String(nid++).padStart(4, "0")}`,
        userId: att.reviewerId,
        type: "review-needed",
        message: `${user?.name || att.userId} submitted "${assessment?.title}" for review (Score: ${att.score}%)`,
        relatedId: att.id,
        read: false,
        createdAt: att.submittedAt,
      });
    }
  }

  return notifs;
}

// ═══ BUILD DEFAULT DATA SET ═════════════════════════════════════════════

const defaultEnrollments = generateEnrollments();
const defaultAttempts = generateAttempts(defaultEnrollments);
const defaultCertificates = generateCertificates(defaultEnrollments);
const defaultNotifications = generateNotifications(defaultEnrollments, defaultAttempts);

// ═══ MUTABLE STATE (mutated in-place, persisted to localStorage) ════════

export const COURSES = [...DEFAULT_COURSES];
export const MODULES = [...DEFAULT_MODULES];
export const ASSESSMENTS = [...DEFAULT_ASSESSMENTS.map((a) => ({ ...a, questions: a.questions.map((q) => ({ ...q, options: q.options ? [...q.options] : undefined })) }))];
export const ASSIGNMENT_RULES = [...DEFAULT_ASSIGNMENT_RULES.map((r) => ({ ...r, courseIds: [...r.courseIds] }))];
export const ENROLLMENTS = [...defaultEnrollments];
export const ASSESSMENT_ATTEMPTS = [...defaultAttempts.map((a) => ({ ...a, answers: a.answers.map((ans) => ({ ...ans })) }))];
export const CERTIFICATES = [...defaultCertificates];
export const NOTIFICATIONS = [...defaultNotifications];
export const FILE_ATTACHMENTS = [...DEFAULT_FILE_ATTACHMENTS];

// ═══ PERSISTENCE ════════════════════════════════════════════════════════

export function saveLearningData() {
  const data = {
    courses: COURSES,
    modules: MODULES,
    assessments: ASSESSMENTS,
    assignmentRules: ASSIGNMENT_RULES,
    enrollments: ENROLLMENTS,
    attempts: ASSESSMENT_ATTEMPTS,
    certificates: CERTIFICATES,
    notifications: NOTIFICATIONS,
    fileAttachments: FILE_ATTACHMENTS,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function loadLearningData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const saved = JSON.parse(raw);

    if (saved.courses) { COURSES.splice(0, COURSES.length, ...saved.courses); }
    if (saved.modules) { MODULES.splice(0, MODULES.length, ...saved.modules); }
    if (saved.assessments) { ASSESSMENTS.splice(0, ASSESSMENTS.length, ...saved.assessments); }
    if (saved.assignmentRules) { ASSIGNMENT_RULES.splice(0, ASSIGNMENT_RULES.length, ...saved.assignmentRules); }
    if (saved.enrollments) { ENROLLMENTS.splice(0, ENROLLMENTS.length, ...saved.enrollments); }
    if (saved.attempts) { ASSESSMENT_ATTEMPTS.splice(0, ASSESSMENT_ATTEMPTS.length, ...saved.attempts); }
    if (saved.certificates) { CERTIFICATES.splice(0, CERTIFICATES.length, ...saved.certificates); }
    if (saved.notifications) { NOTIFICATIONS.splice(0, NOTIFICATIONS.length, ...saved.notifications); }
    if (saved.fileAttachments) { FILE_ATTACHMENTS.splice(0, FILE_ATTACHMENTS.length, ...saved.fileAttachments); }
    return true;
  } catch { return false; }
}

export function resetLearningData() {
  localStorage.removeItem(STORAGE_KEY);
  const fresh = generateEnrollments();
  const freshAttempts = generateAttempts(fresh);
  const freshCerts = generateCertificates(fresh);
  const freshNotifs = generateNotifications(fresh, freshAttempts);
  COURSES.splice(0, COURSES.length, ...DEFAULT_COURSES);
  MODULES.splice(0, MODULES.length, ...DEFAULT_MODULES);
  ASSESSMENTS.splice(0, ASSESSMENTS.length, ...DEFAULT_ASSESSMENTS.map((a) => ({ ...a, questions: a.questions.map((q) => ({ ...q, options: q.options ? [...q.options] : undefined })) })));
  ASSIGNMENT_RULES.splice(0, ASSIGNMENT_RULES.length, ...DEFAULT_ASSIGNMENT_RULES.map((r) => ({ ...r, courseIds: [...r.courseIds] })));
  ENROLLMENTS.splice(0, ENROLLMENTS.length, ...fresh);
  ASSESSMENT_ATTEMPTS.splice(0, ASSESSMENT_ATTEMPTS.length, ...freshAttempts);
  CERTIFICATES.splice(0, CERTIFICATES.length, ...freshCerts);
  NOTIFICATIONS.splice(0, NOTIFICATIONS.length, ...freshNotifs);
  FILE_ATTACHMENTS.splice(0, FILE_ATTACHMENTS.length, ...DEFAULT_FILE_ATTACHMENTS);
}

// Load on init
loadLearningData();

// ═══ HELPER FUNCTIONS ═══════════════════════════════════════════════════

/** Get all enrollments for a user */
export function getEnrollmentsForUser(userId) {
  return ENROLLMENTS.filter((e) => e.userId === userId);
}

/** Get all enrollments for a manager's direct reports */
export function getEnrollmentsForManager(managerId) {
  const reports = getDirectReports(managerId);
  const reportIds = new Set(reports.map((r) => r.id));
  return ENROLLMENTS.filter((e) => reportIds.has(e.userId));
}

/** Get all enrollments for a manager's entire team (direct + indirect) */
export function getEnrollmentsForTeam(managerId) {
  const reports = getAllReports(managerId);
  const reportIds = new Set(reports.map((r) => r.id));
  return ENROLLMENTS.filter((e) => reportIds.has(e.userId));
}

/** Get enrollments by department */
export function getEnrollmentsForDepartment(department) {
  const deptUsers = BADGE_USERS.filter((u) => u.department === department);
  const userIds = new Set(deptUsers.map((u) => u.id));
  return ENROLLMENTS.filter((e) => userIds.has(e.userId));
}

/** Calculate compliance rate for a set of enrollments */
export function calcComplianceRate(enrollments) {
  const required = enrollments.filter((e) => {
    const course = COURSES.find((c) => c.id === e.courseId);
    return course?.type === "required";
  });
  if (required.length === 0) return 100;
  const compliant = required.filter((e) => e.status === "completed");
  return Math.round((compliant.length / required.length) * 100);
}

/** Get compliance rate for a scope (org, department, team, user) */
export function getComplianceRate(scope, scopeId) {
  let enrollments;
  if (scope === "org") enrollments = ENROLLMENTS;
  else if (scope === "department") enrollments = getEnrollmentsForDepartment(scopeId);
  else if (scope === "team") enrollments = getEnrollmentsForTeam(scopeId);
  else if (scope === "user") enrollments = getEnrollmentsForUser(scopeId);
  else return 0;
  return calcComplianceRate(enrollments);
}

/** Get overdue items for a scope */
export function getOverdueItems(scope, scopeId) {
  let enrollments;
  if (scope === "org") enrollments = ENROLLMENTS;
  else if (scope === "department") enrollments = getEnrollmentsForDepartment(scopeId);
  else if (scope === "team") enrollments = getEnrollmentsForTeam(scopeId);
  else if (scope === "user") enrollments = getEnrollmentsForUser(scopeId);
  else return [];
  return enrollments.filter((e) => e.status === "overdue");
}

/** Get upcoming deadlines within N days */
export function getUpcomingDeadlines(scope, scopeId, days = 14) {
  let enrollments;
  if (scope === "org") enrollments = ENROLLMENTS;
  else if (scope === "department") enrollments = getEnrollmentsForDepartment(scopeId);
  else if (scope === "team") enrollments = getEnrollmentsForTeam(scopeId);
  else if (scope === "user") enrollments = getEnrollmentsForUser(scopeId);
  else return [];

  const today = new Date();
  const cutoff = new Date(today.getTime() + days * 86400000);
  return enrollments.filter((e) => {
    if (e.status === "completed" || e.status === "overdue") return false;
    const due = new Date(e.dueDate);
    return due >= today && due <= cutoff;
  });
}

/** Get assessment attempts for an enrollment */
export function getAssessmentAttempts(enrollmentId) {
  return ASSESSMENT_ATTEMPTS.filter((a) => a.enrollmentId === enrollmentId);
}

/** Get pending reviews for a reviewer */
export function getPendingReviews(reviewerId) {
  return ASSESSMENT_ATTEMPTS.filter((a) => a.reviewerId === reviewerId && a.reviewStatus === "pending");
}

/** Get course by ID */
export function getCourse(courseId) {
  return COURSES.find((c) => c.id === courseId);
}

/** Get modules for a course */
export function getCourseModules(courseId) {
  return MODULES.filter((m) => m.courseId === courseId).sort((a, b) => a.order - b.order);
}

/** Get assessment for a course */
export function getCourseAssessment(courseId) {
  return ASSESSMENTS.find((a) => a.courseId === courseId);
}

/** Get certificates for a user */
export function getUserCertificates(userId) {
  return CERTIFICATES.filter((c) => c.userId === userId);
}

/** Get notifications for a user */
export function getUserNotifications(userId) {
  return NOTIFICATIONS.filter((n) => n.userId === userId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/** Get unread notification count */
export function getUnreadNotificationCount(userId) {
  return NOTIFICATIONS.filter((n) => n.userId === userId && !n.read).length;
}

/** Get file attachments for a course */
export function getCourseAttachments(courseId) {
  return FILE_ATTACHMENTS.filter((f) => f.courseId === courseId);
}

/** Search courses by criteria */
export function getCoursesByCriteria({ search, category, type, contentType } = {}) {
  return COURSES.filter((c) => {
    if (search && !c.title.toLowerCase().includes(search.toLowerCase()) && !c.description.toLowerCase().includes(search.toLowerCase())) return false;
    if (category && c.category !== category) return false;
    if (type && c.type !== type) return false;
    if (contentType && c.contentType !== contentType) return false;
    return true;
  });
}

/** Get department compliance matrix (dept x category) */
export function getDepartmentComplianceMatrix() {
  const departments = [...new Set(BADGE_USERS.map((u) => u.department))];
  const categories = COURSE_CATEGORIES.map((c) => c.key);

  return departments.map((dept) => {
    const deptEnrollments = getEnrollmentsForDepartment(dept);
    const row = { department: dept };
    for (const cat of categories) {
      const catEnrollments = deptEnrollments.filter((e) => {
        const course = COURSES.find((c) => c.id === e.courseId);
        return course?.category === cat && course?.type === "required";
      });
      if (catEnrollments.length === 0) {
        row[cat] = null; // N/A
      } else {
        const completed = catEnrollments.filter((e) => e.status === "completed").length;
        row[cat] = Math.round((completed / catEnrollments.length) * 100);
      }
    }
    return row;
  });
}

/** Get compliance trend (mock historical data) */
export function getComplianceTrend(months = 6) {
  const rand = seededRandom(789);
  const data = [];
  const baseRate = getComplianceRate("org");
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date("2026-03-01");
    d.setMonth(d.getMonth() - i);
    const variance = Math.floor(rand() * 15 - 5);
    data.push({
      month: d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      rate: Math.min(100, Math.max(0, baseRate + variance - (months - i) * 2)),
      target: 90,
    });
  }
  return data;
}

// ═══ MUTATION FUNCTIONS ═════════════════════════════════════════════════

/** Enroll a user in a course (manual assignment) */
export function enrollUser(userId, courseId, dueInDays = 30) {
  const existing = ENROLLMENTS.find((e) => e.userId === userId && e.courseId === courseId && e.status !== "completed");
  if (existing) return existing;

  const today = new Date().toISOString().slice(0, 10);
  const dueDate = new Date(Date.now() + dueInDays * 86400000).toISOString().slice(0, 10);

  const enrollment = {
    id: `e-${String(ENROLLMENTS.length + 1).padStart(4, "0")}`,
    userId,
    courseId,
    assignmentRuleId: null,
    status: "not-started",
    assignedDate: today,
    dueDate,
    completedDate: null,
    expiresDate: null,
    progress: 0,
    currentModuleId: null,
  };
  ENROLLMENTS.push(enrollment);
  saveLearningData();
  return enrollment;
}

/** Update enrollment progress */
export function updateEnrollmentProgress(enrollmentId, progress, status) {
  const enr = ENROLLMENTS.find((e) => e.id === enrollmentId);
  if (!enr) return null;
  enr.progress = progress;
  if (status) enr.status = status;
  if (progress >= 100) {
    enr.status = "completed";
    enr.completedDate = new Date().toISOString().slice(0, 10);
  }
  saveLearningData();
  return enr;
}

/** Submit an assessment attempt */
export function submitAssessmentAttempt(enrollmentId, assessmentId, userId, answers) {
  const assessment = ASSESSMENTS.find((a) => a.id === assessmentId);
  if (!assessment) return null;

  const totalPoints = assessment.questions.reduce((s, q) => s + q.points, 0);
  const earned = answers.reduce((s, a) => s + (a.pointsEarned || 0), 0);
  const score = Math.round((earned / totalPoints) * 100);
  const passed = score >= assessment.passingScore;

  const existing = ASSESSMENT_ATTEMPTS.filter((a) => a.enrollmentId === enrollmentId && a.assessmentId === assessmentId);
  const isManual = assessment.type === "manual-review";

  // Find the manager for this user
  const user = BADGE_USERS.find((u) => u.id === userId);
  const reviewerId = isManual ? (user?.reportsTo || "thomas") : null;

  const attempt = {
    id: `att-${String(ASSESSMENT_ATTEMPTS.length + 1).padStart(4, "0")}`,
    enrollmentId,
    assessmentId,
    userId,
    answers,
    score,
    passed,
    attemptNumber: existing.length + 1,
    submittedAt: new Date().toISOString().slice(0, 10),
    reviewerId,
    reviewStatus: isManual ? "pending" : null,
    reviewedAt: null,
    reviewerNotes: null,
  };
  ASSESSMENT_ATTEMPTS.push(attempt);

  // Auto-grade: update enrollment
  if (!isManual && passed) {
    updateEnrollmentProgress(enrollmentId, 100, "completed");
  }

  // Generate notification for reviewer
  if (isManual && reviewerId) {
    const course = COURSES.find((c) => c.id === assessment.courseId);
    NOTIFICATIONS.push({
      id: `n-${String(NOTIFICATIONS.length + 1).padStart(4, "0")}`,
      userId: reviewerId,
      type: "review-needed",
      message: `${user?.name || userId} submitted "${assessment.title}" for review (Score: ${score}%)`,
      relatedId: attempt.id,
      read: false,
      createdAt: new Date().toISOString().slice(0, 10),
    });
  }

  saveLearningData();
  return attempt;
}

/** Review an assessment (approve/reject) */
export function reviewAssessment(attemptId, reviewerId, status, notes) {
  const attempt = ASSESSMENT_ATTEMPTS.find((a) => a.id === attemptId);
  if (!attempt || attempt.reviewStatus !== "pending") return null;

  attempt.reviewStatus = status; // "approved" or "rejected"
  attempt.reviewedAt = new Date().toISOString().slice(0, 10);
  attempt.reviewerNotes = notes || null;
  attempt.reviewerId = reviewerId;

  if (status === "approved" && attempt.passed) {
    updateEnrollmentProgress(attempt.enrollmentId, 100, "completed");
  }

  // Notify the learner
  const user = BADGE_USERS.find((u) => u.id === attempt.userId);
  const assessment = ASSESSMENTS.find((a) => a.id === attempt.assessmentId);
  NOTIFICATIONS.push({
    id: `n-${String(NOTIFICATIONS.length + 1).padStart(4, "0")}`,
    userId: attempt.userId,
    type: status === "approved" ? "completed" : "review-needed",
    message: status === "approved"
      ? `Your "${assessment?.title}" submission was approved!`
      : `Your "${assessment?.title}" submission needs revision. ${notes || ""}`,
    relatedId: attemptId,
    read: false,
    createdAt: new Date().toISOString().slice(0, 10),
  });

  saveLearningData();
  return attempt;
}

/** Mark a notification as read */
export function markNotificationRead(notificationId) {
  const n = NOTIFICATIONS.find((n) => n.id === notificationId);
  if (n) { n.read = true; saveLearningData(); }
  return n;
}

/** Create a new course (admin) */
export function createCourse(courseData) {
  const id = `c-${String(COURSES.length + 1).padStart(3, "0")}`;
  const course = {
    id,
    ...courseData,
    createdAt: new Date().toISOString().slice(0, 10),
    updatedAt: new Date().toISOString().slice(0, 10),
  };
  COURSES.push(course);
  saveLearningData();
  return course;
}

/** Create a new assignment rule (admin) */
export function createAssignmentRule(ruleData) {
  const id = `ar-${String(ASSIGNMENT_RULES.length + 1).padStart(3, "0")}`;
  const rule = { id, ...ruleData, isActive: true };
  ASSIGNMENT_RULES.push(rule);
  saveLearningData();
  return rule;
}

/** Apply assignment rules for a specific user (generate new enrollments) */
export function applyAssignmentRules(userId) {
  const user = BADGE_USERS.find((u) => u.id === userId);
  if (!user) return [];
  const newEnrollments = [];

  for (const rule of ASSIGNMENT_RULES) {
    if (!rule.isActive) continue;
    let matches = false;
    if (rule.targetType === "global") matches = true;
    else if (rule.targetType === "department") matches = user.department === rule.targetValue;
    else if (rule.targetType === "role") matches = user.role === rule.targetValue;
    else if (rule.targetType === "individual") matches = user.id === rule.targetValue;

    if (!matches) continue;

    for (const courseId of rule.courseIds) {
      const existing = ENROLLMENTS.find((e) => e.userId === userId && e.courseId === courseId && e.status !== "expired");
      if (existing) continue;
      newEnrollments.push(enrollUser(userId, courseId, rule.dueInDays));
    }
  }
  return newEnrollments;
}

// ═══ AUDIT LOG ══════════════════════════════════════════════════════════

const AUDIT_LOG = [];

export function addAuditEntry(action, userId, details) {
  AUDIT_LOG.push({
    id: `audit-${AUDIT_LOG.length + 1}`,
    action,
    userId,
    details,
    timestamp: new Date().toISOString(),
  });
}

export function getAuditLog() {
  return [...AUDIT_LOG].reverse();
}
