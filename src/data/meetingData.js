import { T } from "./theme";

// ═══════════════════════════════════════════════════════════════════
//  JOURNAL DATA — Unified data model for the Journal system
//  Entries can be meeting-linked (from ro.am) or freeform notes
// ═══════════════════════════════════════════════════════════════════

// ─── Participants (mapped to SENS executives) ────────────────────
export const participants = [
  { id: "thomas", name: "Thomas", role: "CEO", color: T.accent, initials: "TH", online: true },
  { id: "sarah", name: "Sarah Mitchell", role: "COO", color: T.green, initials: "SM", online: true },
  { id: "james", name: "James Park", role: "VP Finance", color: T.blue, initials: "JP", online: true },
  { id: "lena", name: "Lena Torres", role: "VP Engineering", color: T.green, initials: "LT", online: false },
  { id: "marcus", name: "Marcus Webb", role: "VP Operations", color: T.purple, initials: "MW", online: true },
  { id: "diane", name: "Diane Chen", role: "VP Finance", color: T.blue, initials: "DC", online: false },
  { id: "omar", name: "Omar Hassan", role: "VP Strategy", color: T.blue, initials: "OH", online: true },
  { id: "rachel", name: "Rachel Kim", role: "VP Risk", color: T.purple, initials: "RK", online: true },
];

// ─── Meeting agents available in live sessions ────────────────────
export const meetingAgents = [
  {
    id: "meeting-scribe",
    name: "Meeting Scribe",
    role: "Note & Action Item Tracker",
    description: "Automatically captures key discussion points, decisions, and action items from the meeting. Cross-references with previous meeting notes for continuity.",
    status: "green",
    skills: ["Meeting note synthesis", "Action item tracking", "Decision logging", "Historical cross-reference"],
    dataSources: ["Meeting notes archive", "Decision log"],
    exampleQuestions: [
      "What action items came out of last week's ops review?",
      "Summarize the key decisions from this meeting so far",
      "Who was assigned the Baton Rouge follow-up?",
      "List all open action items for the Portland project",
    ],
  },
  {
    id: "ceo-ea",
    name: "CEO EA",
    role: "Chief Executive Assistant",
    description: "Top-level executive assistant. Aggregates insights from every VP agent team, prepares summaries, and routes questions to the right department.",
    status: "green",
    skills: ["Cross-department synthesis", "Executive briefing", "Risk escalation", "Strategic analysis"],
    dataSources: ["All VP dashboards", "Portfolio KPIs", "Risk register", "CEO calendar"],
    exampleQuestions: [
      "Give me a quick status on all active sites",
      "What are this week's top 3 risks?",
      "Pull the latest revenue numbers for the board update",
      "How are we tracking against Series C milestones?",
    ],
  },
  {
    id: "coo-perf",
    name: "COO Performance Agent",
    role: "Operational Performance Analytics",
    description: "Real-time operational metrics across all sites. Provides instant answers on throughput, uptime, yields, and cross-site comparisons.",
    status: "green",
    skills: ["Operational analysis", "Cross-site comparison", "Trend detection", "Performance benchmarking"],
    dataSources: ["All site performance data", "SCADA real-time feeds", "Site KPIs"],
    exampleQuestions: [
      "Compare throughput across all 5 active sites",
      "What's the current uptime at Baton Rouge?",
      "Show me yield trends for the last 30 days",
      "Which site has the highest maintenance backlog?",
    ],
  },
  {
    id: "cfo-rev",
    name: "Finance Revenue Agent",
    role: "Revenue & Financial Analysis",
    description: "Financial data on demand — revenue tracking, budget variances, cash position, and investor metrics.",
    status: "green",
    skills: ["Revenue analysis", "Budget variance tracking", "Cash flow monitoring", "Investor metrics"],
    dataSources: ["Financial summaries", "Economic models (all sites)", "Portfolio KPIs"],
    exampleQuestions: [
      "What's our MTD revenue vs budget?",
      "Break down COGS by site",
      "Cash runway at current burn rate?",
      "Summarize the Series C fundraising status",
    ],
  },
];

// ─── Meeting Agent Directory Builder ─────────────────────────────────
// Converts meetingAgents into directory-compatible entries for GlobalAgentFab
export const buildMeetingAgentDirectory = () =>
  meetingAgents.map(agent => ({
    id: agent.id,
    name: agent.name,
    role: agent.role,
    department: "Meeting Intelligence",
    branch: "Meeting",
    color: T.teal,
    teamSize: 1,
    agentTeam: {
      lead: { id: agent.id, name: agent.name, role: agent.role, skills: agent.skills, dataSources: agent.dataSources },
      specialists: [],
    },
  }));

// ═══════════════════════════════════════════════════════════════════
//  JOURNAL ENTRIES — Unified data for all entries
//  type: "meeting" | "freeform"
//  status: "upcoming" | "live" | "completed" | "draft"
// ═══════════════════════════════════════════════════════════════════
export const journalEntries = [
  // ─── Upcoming meetings (from ro.am) ────────────────────────────
  {
    id: "j-001",
    type: "meeting",
    title: "Weekly Executive Standup",
    date: "2026-02-25",
    time: "10:00 AM",
    status: "upcoming",
    participants: ["thomas", "sarah", "james", "marcus"],
    content: "",
    tags: ["operations", "standup"],
    attachments: [],
    pinned: false,
    createdAt: "2026-02-25T09:00:00",
    updatedAt: "2026-02-25T09:00:00",
    meetingMeta: {
      room: "Executive Boardroom",
      duration: "30 min",
      roamGroupId: "grp-exec-standup",
      recurring: true,
      agenda: ["Site performance review", "Series C update", "Portland OR construction milestone", "Risk escalations"],
      hasRecording: false,
      hasTranscript: false,
      transcript: [],
      magicMinutes: null,
    },
    chatHistory: { team: [], private: [] },
    highFive: null,
  },
  {
    id: "j-002",
    type: "meeting",
    title: "Portland OR Project Review",
    date: "2026-02-25",
    time: "1:00 PM",
    status: "upcoming",
    participants: ["thomas", "sarah", "lena", "marcus"],
    content: "",
    tags: ["portland", "construction"],
    attachments: [],
    pinned: false,
    createdAt: "2026-02-25T09:00:00",
    updatedAt: "2026-02-25T09:00:00",
    meetingMeta: {
      room: "Engineering Hub",
      duration: "60 min",
      roamGroupId: "grp-portland-review",
      recurring: false,
      agenda: ["EPC contractor update", "Permitting timeline", "Capex variance analysis", "Equipment procurement status"],
      hasRecording: false,
      hasTranscript: false,
      transcript: [],
      magicMinutes: null,
    },
    chatHistory: { team: [], private: [] },
    highFive: null,
  },
  {
    id: "j-003",
    type: "meeting",
    title: "Investor Relations Prep",
    date: "2026-02-25",
    time: "3:30 PM",
    status: "upcoming",
    participants: ["thomas", "james", "omar"],
    content: "",
    tags: ["investors", "series-c"],
    attachments: [],
    pinned: false,
    createdAt: "2026-02-25T09:00:00",
    updatedAt: "2026-02-25T09:00:00",
    meetingMeta: {
      room: "CEO Office",
      duration: "45 min",
      roamGroupId: "grp-ir-prep",
      recurring: false,
      agenda: ["Series C deck final review", "Q&A preparation", "Valuation talking points"],
      hasRecording: false,
      hasTranscript: false,
      transcript: [],
      magicMinutes: null,
    },
    chatHistory: { team: [], private: [] },
    highFive: null,
  },
  {
    id: "j-004",
    type: "meeting",
    title: "HSE Monthly Review",
    date: "2026-02-26",
    time: "9:00 AM",
    status: "upcoming",
    participants: ["sarah", "marcus", "rachel"],
    content: "",
    tags: ["hse", "compliance"],
    attachments: [],
    pinned: false,
    createdAt: "2026-02-25T09:00:00",
    updatedAt: "2026-02-25T09:00:00",
    meetingMeta: {
      room: "Operations Center",
      duration: "45 min",
      roamGroupId: "grp-hse-monthly",
      recurring: true,
      agenda: ["TRIR metrics", "Incident review", "Permit compliance", "Training completion rates"],
      hasRecording: false,
      hasTranscript: false,
      transcript: [],
      magicMinutes: null,
    },
    chatHistory: { team: [], private: [] },
    highFive: null,
  },
  {
    id: "j-005",
    type: "meeting",
    title: "Finance Committee",
    date: "2026-02-26",
    time: "2:00 PM",
    status: "upcoming",
    participants: ["thomas", "james", "diane", "omar"],
    content: "",
    tags: ["budget", "revenue"],
    attachments: [],
    pinned: false,
    createdAt: "2026-02-25T09:00:00",
    updatedAt: "2026-02-25T09:00:00",
    meetingMeta: {
      room: "Finance Suite",
      duration: "60 min",
      roamGroupId: "grp-fin-committee",
      recurring: true,
      agenda: ["Monthly financial close", "Cash position", "Capex approvals", "Tax strategy update"],
      hasRecording: false,
      hasTranscript: false,
      transcript: [],
      magicMinutes: null,
    },
    chatHistory: { team: [], private: [] },
    highFive: null,
  },

  // ─── Completed meetings (with recordings & summaries) ──────────
  {
    id: "j-past-001",
    type: "meeting",
    title: "Weekly Executive Standup",
    date: "2026-02-18",
    time: "10:00 AM",
    status: "completed",
    participants: ["thomas", "sarah", "james", "marcus"],
    content: `<p>Reviewed all-site performance metrics. Baton Rouge uptime dip discussed — root cause identified as compressor maintenance delay.</p><h3>Key Takeaways</h3><ul><li>Baton Rouge recovered to <b>97.2% uptime</b> after compressor fix</li><li>Series C at 12% committed — Meridian Capital in due diligence</li><li>Portland OR permitting on track for March approval</li><li>Three new risk items escalated from Operations</li></ul><p>Approved <b>$180K emergency compressor replacement</b> at Baton Rouge and dual-sourcing strategy for reactor vessels.</p>`,
    tags: ["operations", "series-c", "risk"],
    attachments: [],
    pinned: true,
    createdAt: "2026-02-18T10:00:00",
    updatedAt: "2026-02-18T10:28:00",
    meetingMeta: {
      room: "Executive Boardroom",
      duration: "28 min",
      roamGroupId: "grp-exec-standup",
      recurring: true,
      agenda: ["Site performance review", "Series C update", "Portland OR construction milestone", "Risk escalations"],
      hasRecording: true,
      hasTranscript: true,
      transcript: [
        { speaker: "Thomas", time: "00:00:12", text: "Alright everyone, let's get started. Sarah, can you kick us off with the operations summary?" },
        { speaker: "Sarah Mitchell", time: "00:00:18", text: "Sure. Overall throughput is up 3% week over week across the portfolio. The big item is Baton Rouge — we had a 6-hour unplanned downtime on Wednesday..." },
        { speaker: "Marcus Webb", time: "00:01:45", text: "That was the #2 compressor. We've identified the root cause — bearing failure. The replacement part is in transit and we expect to be back to full capacity by Thursday." },
        { speaker: "Thomas", time: "00:02:30", text: "What's the cost impact?" },
        { speaker: "Marcus Webb", time: "00:02:35", text: "The compressor replacement runs about $180K. We have budget room under the maintenance reserve." },
        { speaker: "Thomas", time: "00:02:55", text: "Approved. James, Series C update?" },
        { speaker: "James Park", time: "00:03:10", text: "We're at 12% committed. Had a strong meeting with Meridian Capital last week — they're doing due diligence now. Next meeting is Thursday." },
      ],
      magicMinutes: {
        summary: "Reviewed all-site performance metrics. Baton Rouge uptime dip discussed — root cause identified as compressor maintenance delay. Series C update: 12% committed, next investor meeting scheduled for Thursday. Portland OR permitting on track for March approval. Three new risk items escalated from Operations.",
        keyDecisions: [
          "Approved emergency compressor replacement at Baton Rouge ($180K)",
          "Moved investor presentation to Thursday PM slot",
          "Assigned VP Ops to lead Portland equipment procurement review",
        ],
        actionItems: [
          { assignee: "Marcus Webb", task: "Submit compressor PO by EOD Tuesday", due: "2026-02-19", done: true },
          { assignee: "James Park", task: "Update Series C deck with Q4 actuals", due: "2026-02-20", done: true },
          { assignee: "Sarah Mitchell", task: "Review Portland permitting package", due: "2026-02-21", done: true },
          { assignee: "Lena Torres", task: "Provide equipment spec comparison for Portland", due: "2026-02-21", done: true },
          { assignee: "Thomas", task: "Review board talking points draft", due: "2026-02-22", done: false },
          { assignee: "Omar Hassan", task: "Schedule follow-up with Meridian Capital", due: "2026-02-24", done: false },
        ],
      },
    },
    chatHistory: {
      team: [
        { id: "tc-1", from: "Sarah Mitchell", time: "10:02 AM", text: "Baton Rouge numbers look solid this week — 97.2% uptime since the compressor fix." },
        { id: "tc-2", from: "Marcus Webb", time: "10:03 AM", text: "Confirmed. The new bearing is holding up well. Predictive maintenance flagged it before failure this time." },
        { id: "tc-3", from: "James Park", time: "10:05 AM", text: "Quick flag — Meridian Capital wants to move the Thursday meeting to 2PM. Does that work for everyone?" },
        { id: "tc-4", from: "Thomas", time: "10:05 AM", text: "Works for me. Sarah?" },
        { id: "tc-5", from: "Sarah Mitchell", time: "10:06 AM", text: "I have the Portland call at 1, should be done by 1:45. Let's do 2:15 to be safe." },
        { id: "tc-6", from: "James Park", time: "10:06 AM", text: "I'll confirm 2:15 with Meridian." },
      ],
      private: [
        { id: "pc-1", from: "Thomas", time: "10:04 AM", text: "Need to follow up with Marcus on the maintenance reserve — make sure we're not burning through it too fast." },
        { id: "pc-2", from: "Thomas", time: "10:07 AM", text: "Ask James offline about the cash position before the investor meeting." },
      ],
    },
    highFive: {
      bullets: [
        "Baton Rouge recovered to 97.2% uptime after compressor fix — maintenance reserve now at 68%",
        "Series C at 12% committed; Meridian Capital in due diligence, meeting moved to Thursday 2:15 PM",
        "Portland OR permitting on track for March approval, equipment procurement is critical path",
        "Therefore: Approved $180K emergency compressor replacement and dual-sourcing for reactor vessels",
      ],
      links: [
        { label: "Recording", url: "#recording-j-past-001" },
        { label: "Transcript", url: "#transcript-j-past-001" },
        { label: "ro.am Room", url: "https://ro.am/room/exec-standup" },
      ],
    },
  },
  {
    id: "j-past-002",
    type: "meeting",
    title: "Portland OR Project Review",
    date: "2026-02-17",
    time: "1:00 PM",
    status: "completed",
    participants: ["thomas", "sarah", "lena", "marcus"],
    content: `<p>Deep dive on Portland OR greenfield project. EPC contractor presented updated timeline — <b>2 weeks ahead of schedule</b> on foundation work.</p><h3>Budget</h3><p>$24.2M spent of $42M total ($1.3M under budget). Monthly burn rate: $3.1M within forecast.</p><h3>Critical Path</h3><p>Reactor vessels have <span style="color:${T.danger};font-weight:600">16-week lead time</span>. Dual-sourcing approved. Control system vendor selection needed by EOW.</p>`,
    tags: ["portland", "construction", "procurement"],
    attachments: [],
    pinned: false,
    createdAt: "2026-02-17T13:00:00",
    updatedAt: "2026-02-17T13:52:00",
    meetingMeta: {
      room: "Engineering Hub",
      duration: "52 min",
      roamGroupId: "grp-portland-review",
      recurring: false,
      agenda: ["EPC contractor update", "Permitting timeline", "Capex variance analysis", "Equipment procurement status"],
      hasRecording: true,
      hasTranscript: true,
      transcript: [],
      magicMinutes: {
        summary: "Deep dive on Portland OR greenfield project. EPC contractor (Turner & Townsend) presented updated timeline — 2 weeks ahead of schedule on foundation work. Permitting package submitted to Multnomah County, expecting approval by mid-March. Equipment procurement is the critical path item — reactor vessels have 16-week lead time.",
        keyDecisions: [
          "Approved dual-sourcing strategy for reactor vessels",
          "Greenlit early procurement of control systems",
          "Scheduled site visit for March 5th",
        ],
        actionItems: [
          { assignee: "Lena Torres", task: "Finalize reactor vessel RFQ with secondary supplier", due: "2026-02-21", done: true },
          { assignee: "Marcus Webb", task: "Coordinate site prep for March 5 visit", due: "2026-03-01", done: false },
          { assignee: "Sarah Mitchell", task: "Review updated project timeline with board", due: "2026-02-24", done: true },
        ],
      },
    },
    chatHistory: {
      team: [
        { id: "tc-p2-1", from: "Lena Torres", time: "1:03 PM", text: "Turner & Townsend confirmed foundation work is 2 weeks ahead. They're moving to structural steel next week." },
        { id: "tc-p2-2", from: "Marcus Webb", time: "1:05 PM", text: "Site prep for the reactor pad is done. We're ready for equipment delivery once vessels arrive." },
        { id: "tc-p2-3", from: "Sarah Mitchell", time: "1:08 PM", text: "The 16-week lead on reactor vessels is tight. Have we heard back from the secondary supplier?" },
        { id: "tc-p2-4", from: "Lena Torres", time: "1:09 PM", text: "RFQ went out Monday. Expecting quotes by end of week. The Korean supplier looks promising — similar specs, 12-week lead." },
        { id: "tc-p2-5", from: "Thomas", time: "1:12 PM", text: "Good. Let's make sure we have dual-source locked in before the board meeting. What about control systems?" },
        { id: "tc-p2-6", from: "Lena Torres", time: "1:13 PM", text: "Three vendors shortlisted. Need a decision by Friday to stay on timeline." },
      ],
      private: [
        { id: "pc-p2-1", from: "Thomas", time: "1:10 PM", text: "Lena seems on top of things. Good hire. Make sure she has what she needs for procurement." },
        { id: "pc-p2-2", from: "Thomas", time: "1:15 PM", text: "Reactor vessel lead time is the real risk here. If Korean supplier falls through, we need a plan C." },
      ],
    },
    highFive: {
      bullets: [
        "Foundation work 2 weeks ahead of schedule, $1.3M under budget at $24.2M of $42M total",
        "Reactor vessels are 16-week lead time — critical path item for Q3 commissioning",
        "Permitting package submitted to Multnomah County, expecting mid-March approval",
        "Therefore: Approved dual-sourcing strategy and greenlit early procurement of control systems",
        "Site visit scheduled for March 5 — Marcus coordinating logistics",
      ],
      links: [
        { label: "Recording", url: "#recording-j-past-002" },
        { label: "Project Dashboard", url: "#portland-dashboard" },
      ],
    },
  },
  {
    id: "j-past-003",
    type: "meeting",
    title: "Investor Relations Prep",
    date: "2026-02-14",
    time: "3:30 PM",
    status: "completed",
    participants: ["thomas", "james", "omar"],
    content: `<p>Prepared for Meridian Capital and Greenfield Partners meetings. Reviewed updated pitch deck with Q4 financials.</p><h3>Valuation</h3><p>Targeting <b>$800-900M pre-money</b>. Coal gasification roadmap added to appendix.</p>`,
    tags: ["investors", "series-c"],
    attachments: [],
    pinned: false,
    createdAt: "2026-02-14T15:30:00",
    updatedAt: "2026-02-14T16:08:00",
    meetingMeta: {
      room: "CEO Office",
      duration: "38 min",
      roamGroupId: "grp-ir-prep",
      recurring: false,
      agenda: ["Series C deck final review", "Q&A preparation", "Valuation talking points"],
      hasRecording: true,
      hasTranscript: false,
      transcript: [],
      magicMinutes: {
        summary: "Prepared for Meridian Capital and Greenfield Partners meetings. Reviewed updated pitch deck with Q4 financials. Discussed valuation positioning — targeting $850M pre-money. Omar to refine competitive landscape slide.",
        keyDecisions: [
          "Set valuation range at $800-900M pre-money",
          "Added coal gasification roadmap to appendix",
        ],
        actionItems: [
          { assignee: "Omar Hassan", task: "Update competitive landscape analysis", due: "2026-02-17", done: true },
          { assignee: "James Park", task: "Add Q4 financial waterfall to deck", due: "2026-02-17", done: true },
          { assignee: "Thomas", task: "Record walkthrough video for remote investors", due: "2026-02-19", done: true },
          { assignee: "Omar Hassan", task: "Draft follow-up email template", due: "2026-02-18", done: false },
        ],
      },
    },
    chatHistory: {
      team: [
        { id: "tc-p3-1", from: "James Park", time: "3:33 PM", text: "Updated the deck with Q4 actuals. Revenue came in at $38.2M for the quarter — 4% above forecast." },
        { id: "tc-p3-2", from: "Omar Hassan", time: "3:35 PM", text: "Competitive landscape slide needs work. Pyrowave just announced their Series B and Brightmark is expanding in Indiana." },
        { id: "tc-p3-3", from: "Thomas", time: "3:37 PM", text: "Good point. Make sure we position the coal gasification angle more prominently — that's our differentiator." },
        { id: "tc-p3-4", from: "James Park", time: "3:40 PM", text: "Should we bring the coal gas roadmap out of the appendix and into the main narrative? It's resonating well with climate-tech investors." },
        { id: "tc-p3-5", from: "Thomas", time: "3:41 PM", text: "Yes. Let's lead with tire pyrolysis proven model, then coal gasification as the growth story. Omar, can you draft that narrative?" },
        { id: "tc-p3-6", from: "Omar Hassan", time: "3:42 PM", text: "On it. I'll have a draft by Monday. Also, Meridian's DD questions were mostly about unit economics — James, can you prep a one-pager?" },
      ],
      private: [
        { id: "pc-p3-1", from: "Thomas", time: "3:38 PM", text: "Need to decide on strategic investor question before Meridian meeting. Leaning toward keeping this a pure financial round." },
        { id: "pc-p3-2", from: "Thomas", time: "3:44 PM", text: "James is doing good work but he's stretched thin. The analyst hire needs to happen ASAP." },
      ],
    },
    highFive: {
      bullets: [
        "Pitch deck updated with Q4 financials and coal gasification roadmap in appendix",
        "Therefore: Set valuation range at $800-900M pre-money for Meridian and Greenfield conversations",
        "Omar refining competitive landscape slide, James adding Q4 financial waterfall",
      ],
      links: [
        { label: "Series C Deck", url: "#series-c-deck" },
        { label: "Valuation Model", url: "#valuation-model" },
      ],
    },
  },

  // ─── Freeform journal entries (not linked to meetings) ──────────
  {
    id: "j-note-001",
    type: "freeform",
    title: "Noble Site Operator Debrief",
    date: "2026-02-16",
    time: "2:30 PM",
    status: "completed",
    participants: [],
    content: `<p>Had a walkthrough with the morning shift operator at Noble OK today. He's been running the line for <b>8 years</b> and knows these reactors inside out.</p><h3>Reactor #3 — Pressure Fluctuations</h3><p>He mentioned that over the last 2 shifts, reactor #3 has been showing intermittent pressure spikes around <span style="color:${T.danger};font-weight:600">42-44 PSI</span>. Normal operating range is <span style="color:${T.green}">36-40 PSI</span>. These aren't sustained enough to trip the SCADA threshold (45 PSI) but they're happening every 90 minutes or so.</p><blockquote>His theory is early-stage valve wear on the pressure relief valve. Said he saw the same pattern on reactor #1 about 18 months ago before it eventually failed. That was a <b>$45K unplanned repair</b> plus 8 hours downtime.</blockquote><h3>Recommended Actions</h3><ul><li>Have maintenance team do a visual inspection this week</li><li>Pull the PI historian data for reactor #3 pressure over last 30 days to confirm the trend</li><li>If confirmed, schedule a planned replacement during the next <a href="#maintenance-window" style="color:${T.accent};text-decoration:underline">maintenance window</a> (saves us the emergency premium)</li><li>Flag this for <b>Marcus</b> and the predictive maintenance team</li></ul><hr><p><i>Operator also mentioned the new feedstock blend from the Tulsa supplier is running slightly hotter through distillation. Worth monitoring but not a concern yet.</i></p><p>General vibe on the floor is <span style="color:${T.green};font-weight:600">good</span>. Team likes the new shift scheduling that Sarah rolled out.</p>`,
    tags: ["noble", "operations", "maintenance"],
    attachments: [
      { id: "file-001", name: "Noble_OK_Reactor3_Pressure_Data.pdf", size: 2457600, type: "application/pdf", uploadedAt: "2026-02-16T14:35:00Z", url: "#" },
      { id: "file-002", name: "PI_Historian_Export_Reactor3_30d.xlsx", size: 865280, type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", uploadedAt: "2026-02-16T14:38:00Z", url: "#" },
      { id: "file-003", name: "reactor3_pressure_chart_screenshot.png", size: 159744, type: "image/png", uploadedAt: "2026-02-16T14:40:00Z", url: "#" },
    ],
    pinned: false,
    createdAt: "2026-02-16T14:30:00",
    updatedAt: "2026-02-16T15:10:00",
    meetingMeta: null,
    chatHistory: { team: [], private: [] },
    highFive: {
      bullets: [
        "Reactor #3 showing intermittent pressure fluctuations not yet in SCADA alerts",
        "Likely early valve wear — operator noticed pattern over last 2 shifts",
        "Therefore: Flag for predictive maintenance review, Marcus to inspect valve assembly this week",
      ],
      links: [{ label: "Full Notes", url: "#notepad-j-note-001" }],
    },
  },
  {
    id: "j-note-002",
    type: "freeform",
    title: "Q2 Hiring Plan",
    date: "2026-02-13",
    time: "11:20 AM",
    status: "completed",
    participants: [],
    content: `<p>Need to get ahead of Q2 hiring before we hit capacity constraints on Portland and the Series C push.</p><h3>Portland OR Staffing</h3><ul><li><b>Site Manager:</b> Need someone with 10+ years greenfield experience, ideally in chemical processing or refining. This is the <span style="color:${T.danger};font-weight:600">#1 hire</span>. Start date target: May 1.</li><li><b>Process Engineer (Senior):</b> Reactor commissioning experience required. Will need to be on-site for equipment installation.</li><li><b>Process Engineer (Mid-level):</b> Can be more junior if senior hire is strong. Quality control and lab oversight.</li><li><b>Timeline:</b> Post all 3 roles by end of February. Budget for relocation packages.</li></ul><h3>Finance Team</h3><ul><li><b>Senior Financial Analyst:</b> James is running point on Series C fundraising AND monthly financial operations. He needs a dedicated analyst who can own the investor data room, financial models, and board reporting.</li><li>Consider promoting the current junior analyst and backfilling with a new hire — might be faster.</li></ul><h3>Operations</h3><ul><li>Not urgent but flagging: Marcus mentioned wanting a dedicated maintenance engineer for the <a href="#baton-rouge" style="color:${T.accent};text-decoration:underline">Baton Rouge site</a>. The compressor incident would have been caught earlier with dedicated on-site maintenance expertise.</li><li>Could defer to Q3 but should budget for it now.</li></ul><hr><p><b>Total headcount ask:</b> 4 new roles + 1 backfill = <span style="color:${T.blue};font-weight:600">5 positions</span></p><p><b>Estimated cost:</b> ~$680K/year fully loaded</p><p><b>Budget status:</b> Need finance committee approval at Feb 26 meeting</p><p><i>Talked to Sarah about it — she's supportive but wants to see the Portland roles prioritized over the Baton Rouge maintenance hire.</i></p>`,
    tags: ["hiring", "personnel", "portland"],
    attachments: [
      { id: "file-004", name: "Q2_Hiring_Budget_Model.xlsx", size: 1126400, type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", uploadedAt: "2026-02-13T11:25:00Z", url: "#" },
      { id: "file-005", name: "Portland_Site_Manager_JD_Draft.docx", size: 348160, type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", uploadedAt: "2026-02-13T11:30:00Z", url: "#" },
    ],
    pinned: false,
    createdAt: "2026-02-13T11:20:00",
    updatedAt: "2026-02-13T12:05:00",
    meetingMeta: null,
    chatHistory: { team: [], private: [] },
    highFive: {
      bullets: [
        "Portland needs site manager + 2 process engineers by May — recruiting starts now",
        "Finance team needs senior analyst for Series C workload; James is stretched thin",
        "Therefore: Approve 4 new headcount requisitions at next finance committee meeting",
      ],
      links: [{ label: "Full Notes", url: "#notepad-j-note-002" }],
    },
  },
  {
    id: "j-note-003",
    type: "freeform",
    title: "Series C Strategy Session Notes",
    date: "2026-02-21",
    time: "9:15 AM",
    status: "draft",
    participants: [],
    content: `<p>Working through the fundraise strategy with James and Omar this week.</p><h3>Current Status</h3><ul><li><span style="color:${T.green};font-weight:600">12% committed</span> (Greenfield Partners anchor)</li><li>Meridian Capital in DD, strong signals</li><li>3 more tier-1 VCs in pipeline</li><li>Target: <b>$150M raise</b> at $800-900M pre-money</li></ul><h3>Key Discussion Points</h3><ul><li>Should we bring in a strategic investor? Several industrial players have expressed interest. <span style="color:${T.green}">Pros:</span> credibility, potential offtake agreements. <span style="color:${T.danger}">Cons:</span> governance complexity, might slow close.</li><li>Coal gasification roadmap is resonating well with climate-tech investors. Consider making it more prominent in the deck rather than buried in the appendix.</li><li>Need to sharpen the <b>"why now"</b> narrative. The regulatory tailwinds on carbon-negative materials are real but we need better data.</li></ul><h3>Todo</h3><ol><li>James to model out dilution scenarios at $800M vs $850M vs $900M</li><li>Omar to compile a short-list of strategic investor candidates</li><li>I need to decide if we want to do a formal roadshow or keep it targeted</li><li>Update the competitive landscape — <a href="#pyrowave" style="color:${T.accent};text-decoration:underline">Pyrowave</a> and <a href="#brightmark" style="color:${T.accent};text-decoration:underline">Brightmark</a> have both announced expansions</li></ol>`,
    tags: ["series-c", "investors", "strategy"],
    attachments: [
      { id: "file-006", name: "Series_C_Strategy_Deck_Notes.docx", size: 348160, type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", uploadedAt: "2026-02-21T09:20:00Z", url: "#" },
      { id: "file-007", name: "Dilution_Scenarios_v3.xlsx", size: 524288, type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", uploadedAt: "2026-02-21T10:05:00Z", url: "#" },
      { id: "file-008", name: "Competitive_Landscape_Feb2026.pdf", size: 1843200, type: "application/pdf", uploadedAt: "2026-02-21T10:15:00Z", url: "#" },
    ],
    pinned: false,
    createdAt: "2026-02-21T09:15:00",
    updatedAt: "2026-02-21T10:30:00",
    meetingMeta: null,
    chatHistory: { team: [], private: [] },
    highFive: null,
  },
  {
    id: "j-note-004",
    type: "freeform",
    title: "Random thoughts — platform improvements",
    date: "2026-02-22",
    time: "7:30 PM",
    status: "draft",
    participants: [],
    content: `<p>Some ideas for the Executive Intelligence Platform after using it for a few weeks:</p><ol><li>The agent chat is great but I wish I could <b>@mention specific agents</b> in the team chat during a meeting. Like <code style="background:${T.bg3};padding:2px 6px;border-radius:4px;font-size:12px">@finance-rev what's our current cash position?</code> right in the conversation flow.</li><li>Need a way to <b>share High Fives directly to Slack</b>. Right now I'm copy-pasting the summary format into #exec-updates manually. Should be a one-click share.</li><li>The risk view should have a <span style="color:${T.green};font-weight:600">"resolved"</span> state, not just monitoring/mitigating/escalated. Some risks get closed and they should show that.</li><li>Calendar view should show which meetings have prep briefings available. Maybe a small icon on the calendar block.</li><li>Would be killer if the <b>Meeting Scribe agent</b> could auto-generate the High Five at the end of every meeting. Right now it's coming from Magic Minutes but the format should be our own standardized format.</li></ol>`,
    tags: ["sens", "product", "ideas"],
    attachments: [],
    pinned: false,
    createdAt: "2026-02-22T19:30:00",
    updatedAt: "2026-02-22T19:45:00",
    meetingMeta: null,
    chatHistory: { team: [], private: [] },
    highFive: null,
  },
  {
    id: "j-note-005",
    type: "freeform",
    title: "Coal gasification licensing thoughts",
    date: "2026-02-20",
    time: "4:12 PM",
    status: "completed",
    participants: [],
    content: `<p>Quick capture — need to think about IP strategy around coal gasification process before competitors move.</p><ul><li>PatSnap flagged 3 new filings in SE Asia related to similar processes</li><li>Our provisional patent covers the core process but not the catalyst formulation</li><li>Exclusive licensing in SE Asia could be significant revenue before others file</li></ul><p>Need to loop in VP R&D and Legal before the board meeting on March 3.</p>`,
    tags: ["strategy"],
    attachments: [],
    pinned: true,
    createdAt: "2026-02-20T16:12:00",
    updatedAt: "2026-02-20T16:20:00",
    meetingMeta: null,
    chatHistory: { team: [], private: [] },
    highFive: {
      bullets: [
        "Consider exclusive licensing in SE Asia before competitors file — PatSnap flagged 3 new filings",
        "Need to loop in VP R&D and Legal before board meeting on March 3",
        "Therefore: Schedule a 30-min strategy session with Omar and Legal this week",
      ],
      links: [],
    },
  },
  {
    id: "j-note-006",
    type: "freeform",
    title: "Board prep reminders",
    date: "2026-02-19",
    time: "8:45 AM",
    status: "completed",
    participants: [],
    content: `<p>Board meeting March 3 — need to get the deck done by Friday.</p><ul><li>Need 3 slides: (1) 90-day look-back, (2) Series C pipeline, (3) Portland construction photos</li><li>Ask James for updated cash runway projection through Q3</li><li>Block 2 hours on Friday for final review</li></ul>`,
    tags: ["board"],
    attachments: [{ label: "Board Deck Draft", url: "#board-deck" }],
    pinned: false,
    createdAt: "2026-02-19T08:45:00",
    updatedAt: "2026-02-19T08:50:00",
    meetingMeta: null,
    chatHistory: { team: [], private: [] },
    highFive: {
      bullets: [
        "Need 3 slides: (1) 90-day look-back, (2) Series C pipeline, (3) Portland construction photos",
        "Ask James for updated cash runway projection through Q3",
        "Therefore: Block 2 hours on Friday for final board deck review before March 3 meeting",
      ],
      links: [{ label: "Board Deck Draft", url: "#board-deck" }],
    },
  },
];

// ─── Sample chat messages (for live session demo) ──────────────
export const sampleTeamChat = [
  { id: "tc-1", from: "Sarah Mitchell", time: "10:02 AM", text: "Baton Rouge numbers look solid this week — 97.2% uptime since the compressor fix.", type: "team" },
  { id: "tc-2", from: "Marcus Webb", time: "10:03 AM", text: "Confirmed. The new bearing is holding up well. Predictive maintenance flagged it before failure this time.", type: "team" },
  { id: "tc-3", from: "James Park", time: "10:05 AM", text: "Quick flag — Meridian Capital wants to move the Thursday meeting to 2PM. Does that work for everyone?", type: "team" },
  { id: "tc-4", from: "Thomas", time: "10:05 AM", text: "Works for me. Sarah?", type: "team" },
  { id: "tc-5", from: "Sarah Mitchell", time: "10:06 AM", text: "I have the Portland call at 1, should be done by 1:45. Let's do 2:15 to be safe.", type: "team" },
  { id: "tc-6", from: "James Park", time: "10:06 AM", text: "I'll confirm 2:15 with Meridian.", type: "team" },
];

export const samplePrivateChat = [
  { id: "pc-1", from: "Thomas", time: "10:04 AM", text: "Need to follow up with Marcus on the maintenance reserve — make sure we're not burning through it too fast.", type: "private" },
  { id: "pc-2", from: "Thomas", time: "10:07 AM", text: "Ask James offline about the cash position before the investor meeting.", type: "private" },
];

// ─── Meeting prep briefings (agent-generated) ─────────────────
export const prepBriefings = {
  "j-001": {
    title: "Weekly Executive Standup",
    generatedBy: "CEO EA",
    generatedAt: "2026-02-25 09:30 AM",
    sections: [
      {
        heading: "Key Metrics Since Last Meeting",
        items: [
          "Portfolio-wide throughput up 3.2% WoW, driven by Baton Rouge recovery (97.2% uptime)",
          "Revenue MTD: $8.9M vs $9.1M budget (-2.2%) — gap narrowing from last week's -3.8%",
          "Series C: 12% committed, Meridian Capital due diligence in progress",
          "Portland OR: Permitting package under Multnomah County review, expected approval mid-March",
        ],
      },
      {
        heading: "Open Action Items from Last Meeting",
        items: [
          "OVERDUE: Thomas — Review board talking points draft (due Feb 22)",
          "OVERDUE: Omar — Schedule Meridian Capital follow-up (due Feb 24)",
          "IN PROGRESS: Marcus — Coordinate March 5 site visit prep",
        ],
      },
      {
        heading: "Risk Alerts",
        items: [
          "Baton Rouge: Maintenance reserve at 68% — below 75% threshold. Flag with Marcus.",
          "Portland OR: Reactor vessel lead time (16 weeks) is critical path. Dual-sourcing approved but RFQ not yet sent to secondary supplier.",
          "Noble B: Expansion permitting delayed 2 weeks due to county staffing shortage.",
        ],
      },
      {
        heading: "Suggested Discussion Points",
        items: [
          "Series C momentum — should we accelerate outreach given positive Meridian signals?",
          "Portland equipment procurement: Need final decision on control system vendor by EOW",
          "Q1 forecast implications from Baton Rouge downtime and Noble B delay",
        ],
      },
    ],
  },
  "j-002": {
    title: "Portland OR Project Review",
    generatedBy: "COO Performance Agent",
    generatedAt: "2026-02-25 12:15 PM",
    sections: [
      {
        heading: "Project Status Snapshot",
        items: [
          "Overall: 2 weeks ahead of schedule on foundation work",
          "Budget: $24.2M spent of $42M total ($1.3M under budget)",
          "Permitting: Package submitted, county review in progress",
          "Critical path: Reactor vessels (16-week lead, dual-source approved)",
        ],
      },
      {
        heading: "Changes Since Last Review (Feb 17)",
        items: [
          "COMPLETED: Reactor vessel RFQ finalized with secondary supplier",
          "COMPLETED: Project timeline reviewed with board",
          "PENDING: Site visit coordination for March 5",
          "NEW: Control system vendor selection needed by EOW",
        ],
      },
      {
        heading: "Financial Summary",
        items: [
          "Capex spent to date: $24.2M (57.6% of $42M budget)",
          "Monthly burn rate: $3.1M (within forecast)",
          "Contingency reserve: $2.8M remaining (73% of original)",
          "Equipment procurement committed: $8.4M of $12M equipment budget",
        ],
      },
    ],
  },
};

// ═══════════════════════════════════════════════════════════════════
//  TAG REGISTRY — Reusable tag objects
// ═══════════════════════════════════════════════════════════════════
export const tagRegistry = [
  // Operations & Sites
  { id: "tag-operations", name: "operations", color: T.accent, category: "Operations", description: "Day-to-day operational matters" },
  { id: "tag-noble", name: "noble", color: T.accent, category: "Operations", description: "Noble OK site" },
  { id: "tag-portland", name: "portland", color: T.green, category: "Operations", description: "Portland OR site" },
  { id: "tag-baton-rouge", name: "baton-rouge", color: T.accent, category: "Operations", description: "Baton Rouge LA site" },
  { id: "tag-maintenance", name: "maintenance", color: T.warn, category: "Operations", description: "Maintenance & equipment" },
  { id: "tag-construction", name: "construction", color: T.green, category: "Operations", description: "Construction projects" },
  { id: "tag-procurement", name: "procurement", color: T.teal, category: "Operations", description: "Procurement & supply chain" },

  // Finance & Strategy
  { id: "tag-series-c", name: "series-c", color: T.blue, category: "Finance", description: "Series C fundraising" },
  { id: "tag-investors", name: "investors", color: T.blue, category: "Finance", description: "Investor relations" },
  { id: "tag-strategy", name: "strategy", color: T.purple, category: "Finance", description: "Strategic planning" },
  { id: "tag-budget", name: "budget", color: T.blue, category: "Finance", description: "Budget & financial planning" },
  { id: "tag-revenue", name: "revenue", color: T.green, category: "Finance", description: "Revenue & sales" },

  // People & Culture
  { id: "tag-hiring", name: "hiring", color: T.teal, category: "People", description: "Recruiting & hiring" },
  { id: "tag-personnel", name: "personnel", color: T.teal, category: "People", description: "Staffing & team changes" },
  { id: "tag-leadership", name: "leadership", color: T.purple, category: "People", description: "Leadership & management" },

  // Risk & Safety
  { id: "tag-risk", name: "risk", color: T.danger, category: "Risk & Safety", description: "Risk items & mitigation" },
  { id: "tag-hse", name: "hse", color: T.danger, category: "Risk & Safety", description: "Health, safety & environment" },
  { id: "tag-compliance", name: "compliance", color: T.warn, category: "Risk & Safety", description: "Regulatory compliance" },

  // Product & Tech
  { id: "tag-sens", name: "sens", color: T.accent, category: "Product", description: "SENS platform items" },
  { id: "tag-product", name: "product", color: T.accent, category: "Product", description: "Product development" },
  { id: "tag-ideas", name: "ideas", color: T.teal, category: "Product", description: "Ideas & brainstorming" },
  { id: "tag-r-and-d", name: "r&d", color: T.purple, category: "Product", description: "Research & development" },

  // Meeting Types
  { id: "tag-board", name: "board", color: T.purple, category: "Meetings", description: "Board-related" },
  { id: "tag-standup", name: "standup", color: T.accent, category: "Meetings", description: "Standups & check-ins" },
  { id: "tag-review", name: "review", color: T.green, category: "Meetings", description: "Reviews & retrospectives" },
  { id: "tag-urgent", name: "urgent", color: T.danger, category: "Meetings", description: "Time-sensitive items" },
];

// ═══════════════════════════════════════════════════════════════════
//  BACKWARDS-COMPATIBLE DERIVED EXPORTS
//  Used by FocusTrackerView / Weekly Pulse for action item tracking
// ═══════════════════════════════════════════════════════════════════

// Past meetings (completed journal entries of type "meeting")
export const pastMeetings = journalEntries
  .filter(e => e.type === "meeting" && e.status === "completed")
  .map(e => ({
    id: e.id,
    title: e.title,
    date: e.date,
    time: e.time,
    duration: e.meetingMeta?.duration || "—",
    room: e.meetingMeta?.room || "—",
    participants: e.participants,
    hasRecording: e.meetingMeta?.hasRecording || false,
    hasTranscript: e.meetingMeta?.hasTranscript || false,
    transcript: e.meetingMeta?.transcript || [],
    magicMinutes: e.meetingMeta?.magicMinutes || null,
    actionItems: e.meetingMeta?.magicMinutes?.actionItems?.length || 0,
    actionItemsComplete: (e.meetingMeta?.magicMinutes?.actionItems || []).filter(a => a.done).length,
    notes: 0,
  }));

// All action items (flattened from completed meetings)
export const allActionItems = journalEntries
  .filter(e => e.type === "meeting" && e.status === "completed" && e.meetingMeta?.magicMinutes?.actionItems)
  .flatMap(e => e.meetingMeta.magicMinutes.actionItems.map((a, i) => ({
    id: `${e.id}-ai-${i}`,
    task: a.task,
    assignee: a.assignee,
    source: `${e.title} — ${new Date(e.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
    due: a.due,
    status: a.done ? "done" : (new Date(a.due) < new Date() ? "overdue" : "open"),
    priority: "medium",
    meeting: e.id,
  })));
