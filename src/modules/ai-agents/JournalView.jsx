import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { T } from "@core/theme/theme";
import {
  participants, meetingAgents, journalEntries as initialEntries,
  sampleTeamChat, samplePrivateChat, prepBriefings, tagRegistry,
} from "./meetingData";
import { getAgentDirectory } from "./vpData";
import { useSimDate } from "@core/simulation/SimDateContext";
import { useBadge } from "@core/users/BadgeContext";
import { isLiveMode, buildDataContext } from "./services/claudeService";
import { containsFactualClaim, checkFacts, isAgentContribEnabled, getAgentContribInterval, getAgentContribSensitivity } from "./services/factCheckService";
import { useViewport } from "@core/routing/useViewport";
import { VoiceDictationButton } from "@core/ui/VoiceDictationButton";

const C = T.accent;

// Build the full agent list from the org-wide directory + meeting-specific agents
const orgAgents = getAgentDirectory().map(a => ({
  id: a.id, name: a.name, role: a.role, department: a.department,
  description: a.role + (a.department ? ` — ${a.department}` : ""),
  status: "green",
  exampleQuestions: [],
  agentTeam: a.agentTeam,
  color: a.color,
}));
// Merge: org agents first, then any meetingAgents not already in the org list
const allAgents = [
  ...orgAgents,
  ...meetingAgents.filter(ma => !orgAgents.find(oa => oa.id === ma.id)),
];

// ─── Helpers ───────────────────────────────────────────────────
const fmtDate = (d) => new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const fmtDateShort = (d) => new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
const getParticipant = (id) => participants.find((p) => p.id === id);
const getTagObj = (name) => tagRegistry.find(t => t.name === name);
const fmtSize = (b) => b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`;
const getFileExt = (name) => (name || "").split(".").pop().toUpperCase();
const stripHtml = (html) => (html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

// ─── Reusable Components ──────────────────────────────────────

const Icon = ({ d, size = 14, color = C, sw = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
);

const Avatar = ({ person, size = 28 }) => (
  <div style={{ width: size, height: size, borderRadius: "50%", background: person?.color || T.bg3, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: `2px solid ${T.bg0}` }}>
    <span style={{ fontSize: size * 0.36, fontWeight: 700, color: "#1A1A1A" }}>{person?.initials || "?"}</span>
  </div>
);

const ParticipantRow = ({ ids, max = 5 }) => {
  const people = ids.map(getParticipant).filter(Boolean);
  const shown = people.slice(0, max);
  const extra = people.length - max;
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {shown.map((p, i) => <div key={p.id} style={{ marginLeft: i > 0 ? -8 : 0, zIndex: max - i }}><Avatar person={p} size={26} /></div>)}
      {extra > 0 && <span style={{ marginLeft: 4, fontSize: 10, color: T.textDim, fontWeight: 600 }}>+{extra}</span>}
    </div>
  );
};

const Pill = ({ active, color = C, onClick, children }) => (
  <button onClick={onClick} style={{ padding: "5px 12px", borderRadius: 20, border: `1px solid ${active ? color : T.border}`, background: active ? color + "15" : "transparent", color: active ? color : T.textMid, fontSize: 11, fontWeight: active ? 600 : 400, cursor: "pointer", transition: "all .15s", whiteSpace: "nowrap" }}>{children}</button>
);

const Card = ({ title, titleColor = C, action, children }) => (
  <div style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden" }}>
    <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: titleColor, letterSpacing: 0.6, textTransform: "uppercase" }}>{title}</span>
      {action}
    </div>
    <div style={{ padding: 16 }}>{children}</div>
  </div>
);

const KpiCard = ({ label, value, sub, color = C }) => (
  <div style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 10, padding: "14px 16px" }}>
    <div style={{ fontSize: 24, fontWeight: 700, color }}>{value}</div>
    <div style={{ fontSize: 11, color: T.textMid, fontWeight: 500, marginTop: 2 }}>{label}</div>
    {sub && <div style={{ fontSize: 10, color: T.textDim, marginTop: 2 }}>{sub}</div>}
  </div>
);

// ═══════════════════════════════════════════════════════════════════
//  TAG PICKER
// ═══════════════════════════════════════════════════════════════════
const TagPicker = ({ selectedTags, onChange, accentColor = C }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [newTagName, setNewTagName] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const categories = useMemo(() => {
    const cats = {};
    tagRegistry.forEach(tag => {
      if (search && !tag.name.includes(search.toLowerCase()) && !tag.description.toLowerCase().includes(search.toLowerCase())) return;
      if (!cats[tag.category]) cats[tag.category] = [];
      cats[tag.category].push(tag);
    });
    return cats;
  }, [search]);

  const toggle = (tagName) => {
    if (selectedTags.includes(tagName)) onChange(selectedTags.filter(t => t !== tagName));
    else onChange([...selectedTags, tagName]);
  };

  const addCustomTag = () => {
    const name = newTagName.trim().toLowerCase();
    if (name && !selectedTags.includes(name)) {
      onChange([...selectedTags, name]);
      setNewTagName("");
    }
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div onClick={() => setOpen(!open)} style={{ display: "flex", gap: 4, flexWrap: "wrap", padding: "6px 10px", background: T.bg0, border: `1px solid ${open ? accentColor : T.border}`, borderRadius: 8, cursor: "pointer", minHeight: 32, alignItems: "center", transition: "border-color .15s" }}>
        {selectedTags.length === 0 && <span style={{ fontSize: 11, color: T.textDim }}>Add tags...</span>}
        {selectedTags.map(tag => {
          const obj = getTagObj(tag);
          const tagColor = obj?.color || accentColor;
          return (
            <span key={tag} onClick={(e) => { e.stopPropagation(); toggle(tag); }} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, padding: "2px 8px", borderRadius: 4, background: tagColor + "15", color: tagColor, fontWeight: 600, cursor: "pointer" }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: tagColor }} />{tag}<span style={{ marginLeft: 2, fontSize: 12 }}>&times;</span>
            </span>
          );
        })}
      </div>
      {open && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 100, background: T.bg1, border: `1px solid ${T.border}`, borderRadius: 8, marginTop: 4, maxHeight: 280, overflowY: "auto", boxShadow: "0 8px 32px rgba(0,0,0,.4)" }}>
          <div style={{ padding: "8px 10px", borderBottom: `1px solid ${T.border}` }}>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tags..." autoFocus style={{ width: "100%", background: T.bg0, border: `1px solid ${T.border}`, borderRadius: 6, padding: "6px 10px", color: T.text, fontSize: 11, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} onFocus={(e) => (e.currentTarget.style.borderColor = accentColor)} onBlur={(e) => (e.currentTarget.style.borderColor = T.border)} />
          </div>
          {Object.entries(categories).map(([cat, tags]) => (
            <div key={cat}>
              <div style={{ padding: "8px 12px 4px", fontSize: 9, color: T.textDim, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>{cat}</div>
              {tags.map(tag => (
                <button key={tag.id} onClick={() => toggle(tag.name)} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "6px 12px", background: selectedTags.includes(tag.name) ? tag.color + "10" : "transparent", border: "none", cursor: "pointer", color: T.text, fontSize: 11, fontFamily: "inherit", textAlign: "left" }} onMouseEnter={(e) => { if (!selectedTags.includes(tag.name)) e.currentTarget.style.background = T.bg3; }} onMouseLeave={(e) => { e.currentTarget.style.background = selectedTags.includes(tag.name) ? tag.color + "10" : "transparent"; }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: tag.color, flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>{tag.name}</span>
                  {selectedTags.includes(tag.name) && <Icon d="M22 11.08V12a10 10 0 1 1-5.93-9.14 M22 4L12 14.01l-3-3" color={tag.color} size={12} />}
                </button>
              ))}
            </div>
          ))}
          <div style={{ padding: "8px 10px", borderTop: `1px solid ${T.border}`, display: "flex", gap: 6 }}>
            <input value={newTagName} onChange={(e) => setNewTagName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addCustomTag(); }} placeholder="Custom tag..." style={{ flex: 1, background: T.bg0, border: `1px solid ${T.border}`, borderRadius: 6, padding: "5px 8px", color: T.text, fontSize: 10, outline: "none", fontFamily: "inherit" }} />
            <button onClick={addCustomTag} disabled={!newTagName.trim()} style={{ background: newTagName.trim() ? accentColor : T.bg3, border: "none", borderRadius: 6, padding: "4px 10px", color: newTagName.trim() ? "#1A1A1A" : T.textDim, fontSize: 10, fontWeight: 600, cursor: newTagName.trim() ? "pointer" : "default" }}>Add</button>
          </div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
//  RICH TEXT EDITOR (with toolbar)
// ═══════════════════════════════════════════════════════════════════
const RichTextToolbar = ({ exec, accentColor = C, onVoiceTranscript }) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const colors = [T.text, T.accent, T.green, T.blue, T.purple, T.teal, T.danger, T.warn, "#fff", "#888"];
  const isMobileToolbar = window.innerWidth < 768;

  const btnStyle = (active = false) => ({
    background: active ? accentColor + "20" : "transparent", border: `1px solid ${active ? accentColor + "40" : "transparent"}`,
    borderRadius: 4, padding: isMobileToolbar ? "6px 8px" : "3px 6px", cursor: "pointer", color: active ? accentColor : T.textMid, fontSize: 12, fontWeight: 600, transition: "all .1s", fontFamily: "inherit", lineHeight: 1, flexShrink: 0,
  });

  return (
    <div style={{ display: "flex", gap: 2, flexWrap: isMobileToolbar ? "nowrap" : "wrap", padding: "6px 8px", borderBottom: `1px solid ${T.border}`, background: T.bg0, alignItems: "center", overflowX: isMobileToolbar ? "auto" : "visible", WebkitOverflowScrolling: "touch" }}>
      <button style={btnStyle()} onClick={() => exec("undo")} title="Undo"><Icon d="M3 10h10a5 5 0 0 1 0 10H7" size={12} color={T.textMid} /></button>
      <button style={btnStyle()} onClick={() => exec("redo")} title="Redo"><Icon d="M21 10H11a5 5 0 0 0 0 10h6" size={12} color={T.textMid} /></button>
      <div style={{ width: 1, height: 16, background: T.border, margin: "0 4px" }} />
      <button style={btnStyle()} onClick={() => exec("bold")} title="Bold"><b>B</b></button>
      <button style={btnStyle()} onClick={() => exec("italic")} title="Italic"><i>I</i></button>
      <button style={btnStyle()} onClick={() => exec("underline")} title="Underline"><u>U</u></button>
      <button style={btnStyle()} onClick={() => exec("strikeThrough")} title="Strikethrough"><s>S</s></button>
      <div style={{ width: 1, height: 16, background: T.border, margin: "0 4px" }} />
      <select onChange={(e) => exec("fontSize", e.target.value)} style={{ background: T.bg0, border: `1px solid ${T.border}`, borderRadius: 4, color: T.textMid, fontSize: 10, padding: "2px 4px", cursor: "pointer", fontFamily: "inherit" }}>
        {[{ label: "XS", val: "1" }, { label: "S", val: "2" }, { label: "M", val: "3" }, { label: "L", val: "4" }, { label: "XL", val: "5" }, { label: "XXL", val: "6" }].map(s => (
          <option key={s.val} value={s.val}>{s.label}</option>
        ))}
      </select>
      <button style={btnStyle()} onClick={() => exec("formatBlock", "<h3>")} title="Heading">H</button>
      <button style={btnStyle()} onClick={() => exec("formatBlock", "<blockquote>")} title="Blockquote">"</button>
      <div style={{ width: 1, height: 16, background: T.border, margin: "0 4px" }} />
      <button style={btnStyle()} onClick={() => exec("insertUnorderedList")} title="Bullet List">•</button>
      <button style={btnStyle()} onClick={() => exec("insertOrderedList")} title="Numbered List">1.</button>
      <button style={btnStyle()} onClick={() => exec("indent")} title="Indent">→</button>
      <button style={btnStyle()} onClick={() => exec("outdent")} title="Outdent">←</button>
      <div style={{ width: 1, height: 16, background: T.border, margin: "0 4px" }} />
      <div style={{ position: "relative" }}>
        <button style={btnStyle(showColorPicker)} onClick={() => setShowColorPicker(!showColorPicker)} title="Text Color"><span style={{ width: 10, height: 10, borderRadius: 2, background: accentColor, display: "inline-block" }} /></button>
        {showColorPicker && (
          <div style={{ position: "absolute", top: "100%", left: 0, zIndex: 50, background: T.bg1, border: `1px solid ${T.border}`, borderRadius: 6, padding: 6, display: "flex", gap: 3, flexWrap: "wrap", width: 100, marginTop: 4, boxShadow: "0 4px 16px rgba(0,0,0,.4)" }}>
            {colors.map(c => (<button key={c} onClick={() => { exec("foreColor", c); setShowColorPicker(false); }} style={{ width: 16, height: 16, borderRadius: 3, background: c, border: `1px solid ${T.border}`, cursor: "pointer" }} />))}
          </div>
        )}
      </div>
      <button style={btnStyle(showLinkModal)} onClick={() => setShowLinkModal(!showLinkModal)} title="Insert Link"><Icon d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" size={12} color={showLinkModal ? accentColor : T.textMid} /></button>
      {showLinkModal && (
        <div style={{ position: "absolute", top: 44, left: 0, zIndex: 50, background: T.bg1, border: `1px solid ${T.border}`, borderRadius: 8, padding: 12, boxShadow: "0 4px 16px rgba(0,0,0,.4)", display: "flex", flexDirection: "column", gap: 8, width: 260 }}>
          <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://..." style={{ background: T.bg0, border: `1px solid ${T.border}`, borderRadius: 6, padding: "6px 10px", color: T.text, fontSize: 11, outline: "none", fontFamily: "inherit" }} />
          <input value={linkText} onChange={(e) => setLinkText(e.target.value)} placeholder="Display text..." style={{ background: T.bg0, border: `1px solid ${T.border}`, borderRadius: 6, padding: "6px 10px", color: T.text, fontSize: 11, outline: "none", fontFamily: "inherit" }} />
          <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
            <button onClick={() => setShowLinkModal(false)} style={{ background: T.bg3, border: "none", borderRadius: 4, padding: "4px 10px", color: T.textMid, fontSize: 10, cursor: "pointer" }}>Cancel</button>
            <button onClick={() => {
              if (linkUrl) {
                const text = linkText || linkUrl;
                exec("insertHTML", `<a href="${linkUrl}" style="color:${accentColor};text-decoration:underline">${text}</a>`);
              }
              setShowLinkModal(false); setLinkUrl(""); setLinkText("");
            }} style={{ background: accentColor, border: "none", borderRadius: 4, padding: "4px 10px", color: "#1A1A1A", fontSize: 10, fontWeight: 600, cursor: "pointer" }}>Insert</button>
          </div>
        </div>
      )}
      <button style={btnStyle()} onClick={() => exec("insertHorizontalRule")} title="Horizontal Rule">—</button>
      <button style={btnStyle()} onClick={() => exec("removeFormat")} title="Clear Formatting"><Icon d="M18 6L6 18M6 6l12 12" size={12} color={T.textMid} /></button>
      {onVoiceTranscript && (
        <>
          <div style={{ width: 1, height: 16, background: T.border, margin: "0 4px", flexShrink: 0 }} />
          <VoiceDictationButton compact onTranscript={onVoiceTranscript} />
        </>
      )}
    </div>
  );
};

const RichTextEditor = ({ content, onChange, readOnly = false, placeholder = "Start writing..." }) => {
  const editorRef = useRef(null);
  const [focused, setFocused] = useState(false);
  const exec = useCallback((cmd, val) => { document.execCommand(cmd, false, val); editorRef.current?.focus(); }, []);
  const isMobileEditor = window.innerWidth < 768;

  const handleInput = useCallback(() => {
    if (editorRef.current && onChange) onChange(editorRef.current.innerHTML);
  }, [onChange]);

  const handleVoiceTranscript = useCallback((text) => {
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand("insertText", false, text + " ");
      if (onChange) onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  return (
    <div style={{ border: `1px solid ${focused ? C : T.border}`, borderRadius: 8, overflow: "hidden", transition: "border-color .15s", background: T.bg0 }}>
      {!readOnly && <RichTextToolbar exec={exec} onVoiceTranscript={handleVoiceTranscript} />}
      <div ref={editorRef} contentEditable={!readOnly} onInput={handleInput} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        dangerouslySetInnerHTML={{ __html: content || "" }}
        onKeyDown={(e) => { if (e.key === "Tab") { e.preventDefault(); exec(e.shiftKey ? "outdent" : "indent"); } }}
        style={{
          minHeight: readOnly ? 60 : 200, padding: isMobileEditor ? "16px" : "14px 16px", fontSize: isMobileEditor ? 15 : 13, color: T.text, lineHeight: isMobileEditor ? 1.7 : 1.6, outline: "none", fontFamily: "'DM Sans', sans-serif",
          overflowY: "auto", maxHeight: 500,
        }}
        data-placeholder={placeholder}
        suppressContentEditableWarning
      />
      <style>{`
        [contenteditable]:empty:before { content: attr(data-placeholder); color: ${T.textDim}; font-style: italic; }
        [contenteditable] h3 { font-size: 15px; font-weight: 700; color: ${T.text}; margin: 16px 0 8px; }
        [contenteditable] blockquote { border-left: 3px solid ${C}; padding-left: 12px; color: ${T.textMid}; font-style: italic; margin: 8px 0; }
        [contenteditable] ul, [contenteditable] ol { padding-left: 20px; margin: 4px 0; }
        [contenteditable] li { margin-bottom: 2px; }
        [contenteditable] hr { border: none; border-top: 1px solid ${T.border}; margin: 12px 0; }
        [contenteditable] a { color: ${C}; text-decoration: underline; }
        [contenteditable] code { background: ${T.bg3}; padding: 2px 6px; border-radius: 4px; font-size: 12px; }
      `}</style>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
//  FILE ATTACHMENTS
// ═══════════════════════════════════════════════════════════════════
const FileAttachments = ({ files, onChange, readOnly = false }) => {
  const [dragOver, setDragOver] = useState(false);

  const fileTypeColors = { PDF: T.danger, DOCX: T.blue, XLSX: T.green, CSV: T.green, PNG: T.purple, JPG: T.purple, JPEG: T.purple, TXT: T.textMid };

  const handleFiles = (fileList) => {
    const newFiles = Array.from(fileList).map(f => ({
      id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: f.name, size: f.size, type: f.type,
      uploadedAt: new Date().toISOString(), url: "#",
    }));
    onChange([...files, ...newFiles]);
  };

  return (
    <div>
      <div style={{ fontSize: 11, color: T.textDim, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
        <Icon d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" size={12} color={T.textDim} />
        Attachments ({files.length})
      </div>
      {!readOnly && (
        <div onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
          style={{ border: `1px dashed ${dragOver ? C : T.border}`, borderRadius: 8, padding: "14px 16px", textAlign: "center", marginBottom: files.length > 0 ? 10 : 0, background: dragOver ? C + "06" : "transparent", transition: "all .15s", cursor: "pointer", position: "relative" }}
          onClick={() => document.getElementById("file-input-journal")?.click()}>
          <input id="file-input-journal" type="file" multiple onChange={(e) => handleFiles(e.target.files)} style={{ display: "none" }} />
          <div style={{ fontSize: 12, color: dragOver ? C : T.textDim }}>{dragOver ? "Drop files here" : "Drop files here or click to upload"}</div>
        </div>
      )}
      {files.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {files.map(file => {
            const ext = getFileExt(file.name);
            const color = fileTypeColors[ext] || T.textMid;
            return (
              <div key={file.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: T.bg0, border: `1px solid ${T.border}`, borderRadius: 6 }}>
                <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: color + "15", color, fontWeight: 700 }}>{ext}</span>
                <span style={{ fontSize: 12, color: T.text, flex: 1 }}>{file.name}</span>
                <span style={{ fontSize: 10, color: T.textDim }}>{fmtSize(file.size)}</span>
                <button style={{ background: "transparent", border: "none", color: T.blue, cursor: "pointer", fontSize: 11, fontFamily: "inherit", padding: "2px 6px" }}>Download</button>
                {!readOnly && (
                  <button onClick={() => onChange(files.filter(f => f.id !== file.id))} style={{ background: "transparent", border: "none", color: T.textDim, cursor: "pointer", fontSize: 16, padding: 0, lineHeight: 1 }}>&times;</button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
//  MEETING MONITOR HOOK — Proactive agent contribution interjection
// ═══════════════════════════════════════════════════════════════════
const useMeetingMonitor = ({ enabled, messages, simDate, user, fromFilter = "Thomas" }) => {
  const TAG = "[MeetingMonitor]";
  const [interjections, setInterjections] = useState([]);
  const [contribError, setContribError] = useState(null);
  const lastCheckedIndex = useRef(0);
  const bufferRef = useRef([]);
  const intervalMs = getAgentContribInterval() * 1000;

  // Accumulate new messages that contain factual claims
  useEffect(() => {
    if (!enabled || !isLiveMode()) {
      if (!enabled) console.log(TAG, "Disabled — not monitoring");
      else if (!isLiveMode()) console.warn(TAG, "Live mode OFF — check API key & agent_live_mode");
      return;
    }

    const newMsgs = messages.slice(lastCheckedIndex.current);
    for (const msg of newMsgs) {
      const fromMatch = msg.from === fromFilter;
      const hasClaim = containsFactualClaim(msg.text);
      if (fromMatch && hasClaim) {
        console.log(TAG, `Buffered claim from ${msg.from}: "${msg.text}"`);
        bufferRef.current.push(msg);
      }
    }
    lastCheckedIndex.current = messages.length;
  }, [enabled, messages]);

  // Batch check facts on interval
  useEffect(() => {
    if (!enabled || !isLiveMode()) return;
    console.log(TAG, `Interval started — checking every ${intervalMs / 1000}s`);

    const iv = setInterval(async () => {
      if (bufferRef.current.length === 0) return;

      const toCheck = [...bufferRef.current];
      bufferRef.current = [];
      console.log(TAG, `Batch firing with ${toCheck.length} message(s)`);

      const contribAgent = meetingAgents.find(a => a.id === "ceo-ea") || meetingAgents[0];
      const dataContext = buildDataContext(
        { dataSources: contribAgent?.dataSources || ["All VP dashboards", "Portfolio KPIs"] },
        simDate,
        user
      );

      if (!dataContext || dataContext.length < 50) {
        console.warn(TAG, "Data context is empty or very short — check user access domains");
      }

      const result = await checkFacts({ messages: toCheck, dataContext, userId: user?.id, sensitivity: getAgentContribSensitivity() });

      if (!result) {
        console.log(TAG, "No errors detected (null result)");
      } else if (result.type === "error") {
        console.error(TAG, "Error:", result.message);
        setContribError(result.message);
      } else if (result.type === "interjection") {
        console.log(TAG, "Interjection received:", result);
        setContribError(null); // Clear any previous error on success
        setInterjections(prev => [...prev, result]);
      }
    }, intervalMs);

    return () => clearInterval(iv);
  }, [enabled, simDate, user, intervalMs]);

  const clearInterjections = useCallback(() => setInterjections([]), []);
  const dismissInterjection = useCallback((id) => {
    setInterjections(prev => prev.filter(ij => ij.id !== id));
  }, []);

  return { interjections, clearInterjections, dismissInterjection, contribError };
};

// ═══════════════════════════════════════════════════════════════════
//  CHAT PANEL (team or private)
// ═══════════════════════════════════════════════════════════════════
const ChatPanel = ({ messages, onSend, isPrivate = false, color = C, interjections = [], onDismissInterjection, agentContribActive = false, contribError = null }) => {
  const [input, setInput] = useState("");
  const endRef = useRef(null);
  const inputRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, interjections]);
  const send = () => {
    if (!input.trim()) return;
    const ts = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    onSend({ id: `msg-${Date.now()}`, from: "Thomas", time: ts, text: input.trim(), type: isPrivate ? "private" : "team" });
    setInput(""); inputRef.current?.focus();
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {isPrivate && <div style={{ padding: "8px 12px", background: T.purple + "15", borderBottom: `1px solid ${T.purple}30`, display: "flex", alignItems: "center", gap: 6 }}><Icon d="M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z M7 11V7a5 5 0 0 1 10 0v4" color={T.purple} size={12} /><span style={{ fontSize: 11, color: T.purple, fontWeight: 600 }}>Private — only visible to you</span></div>}
      {agentContribActive && (
        <div style={{ padding: "6px 12px", background: T.warn + "10", borderBottom: `1px solid ${T.warn}20`, display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.warn, animation: "pulse 2s infinite" }} />
          <span style={{ fontSize: 10, color: T.warn, fontWeight: 600 }}>Agent Contribution Active</span>
        </div>
      )}
      {contribError && (
        <div style={{ padding: "6px 12px", background: "#ff4d4f12", borderBottom: "1px solid #ff4d4f30", display: "flex", alignItems: "center", gap: 6 }}>
          <Icon d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M12 8v4 M12 16h.01" color="#ff4d4f" size={11} />
          <span style={{ fontSize: 10, color: "#ff4d4f", fontWeight: 500 }}>{contribError}</span>
        </div>
      )}
      <div style={{ flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
        {messages.length === 0 && interjections.length === 0 && <div style={{ textAlign: "center", padding: 40, color: T.textDim, fontSize: 12 }}>{isPrivate ? "Your private notes will appear here." : "Team chat messages will appear here."}</div>}
        {messages.map((msg) => { const isMe = msg.from === "Thomas"; return (
          <div key={msg.id} style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
            {!isMe && <span style={{ fontSize: 10, color: T.textDim, marginBottom: 2, marginLeft: 4 }}>{msg.from}</span>}
            <div style={{ maxWidth: "80%", padding: "8px 12px", borderRadius: 12, background: isMe ? (isPrivate ? T.purple + "25" : color + "25") : T.bg2, color: T.text, fontSize: 13, lineHeight: 1.45 }}>{msg.text}</div>
            <span style={{ fontSize: 9, color: T.textDim, marginTop: 2, marginLeft: 4, marginRight: 4 }}>{msg.time}</span>
          </div>
        ); })}
        {/* Agent contribution interjections */}
        {interjections.map((ij) => (
          <div key={ij.id} style={{
            borderLeft: `3px solid ${T.warn}`, borderRadius: 8, padding: "10px 14px",
            background: T.warn + "08", border: `1px solid ${T.warn}25`, marginTop: 4,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Icon d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M12 8v4 M12 16h.01" color={T.warn} size={12} />
                <span style={{ fontSize: 11, fontWeight: 700, color: T.warn }}>AI Agent Contribution</span>
                <span style={{ fontSize: 9, color: T.textDim }}>{ij.ts}</span>
              </div>
              {onDismissInterjection && (
                <button onClick={() => onDismissInterjection(ij.id)} style={{ background: "transparent", border: "none", color: T.textDim, cursor: "pointer", fontSize: 14, padding: 0, lineHeight: 1 }}>&times;</button>
              )}
            </div>
            <div style={{ fontSize: 12, color: T.textMid, marginBottom: 4 }}>
              <strong style={{ color: T.text }}>{ij.speaker}</strong> said: <em>&ldquo;{ij.claim}&rdquo;</em>
            </div>
            <div style={{ fontSize: 12, color: T.green, fontWeight: 600 }}>
              Correction: {ij.correction}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div style={{ padding: "10px 12px", borderTop: `1px solid ${T.border}`, display: "flex", gap: 8 }}>
        <textarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder={isPrivate ? "Add a private note..." : "Message the team..."} rows={1} style={{ flex: 1, background: T.bg0, border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 12px", color: T.text, fontSize: 13, outline: "none", fontFamily: "inherit", resize: "none", lineHeight: 1.4 }} onFocus={(e) => (e.currentTarget.style.borderColor = isPrivate ? T.purple : color)} onBlur={(e) => (e.currentTarget.style.borderColor = T.border)} />
        <button onClick={send} disabled={!input.trim()} style={{ background: input.trim() ? (isPrivate ? T.purple : color) : T.bg3, border: "none", borderRadius: 8, padding: "8px 14px", color: input.trim() ? "#1A1A1A" : T.textDim, fontSize: 12, fontWeight: 600, cursor: input.trim() ? "pointer" : "default" }}>Send</button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
//  AGENT PANEL (with Prep Briefings)
// ═══════════════════════════════════════════════════════════════════
const AgentPanel = ({ entry, agents = allAgents, color = C, messages: externalMessages, onSend: externalOnSend, onReset: externalOnReset, interjections = [], onDismissInterjection, agentContribActive = false, contribError = null }) => {
  const [activeAgent, setActiveAgent] = useState(agents[0]?.id || null);
  const messages = externalMessages || [];
  const [input, setInput] = useState("");
  const [showBriefing, setShowBriefing] = useState(true);
  const endRef = useRef(null);
  const inputRef = useRef(null);
  const current = agents.find((a) => a.id === activeAgent) || agents[0];
  const briefing = prepBriefings[entry?.id];

  useEffect(() => { if (agents.length > 0 && !agents.find(a => a.id === activeAgent)) { setActiveAgent(agents[0].id); externalOnReset?.(); } }, [agents, activeAgent]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, interjections]);

  const send = () => {
    if (!input.trim()) return;
    const ts = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    externalOnSend?.({ id: `amsg-${Date.now()}`, from: "user", time: ts, text: input.trim() });
    setTimeout(() => {
      externalOnSend?.({ id: `amsg-${Date.now()}-r`, from: "agent", agentName: current?.name || "Agent", time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }), text: `Based on the journal context and SENS data, I can help with that. In production, this would connect to the ${current?.name || "agent"} backend with full access to your operational data, previous notes, and real-time metrics.` });
    }, 800);
    setInput(""); inputRef.current?.focus();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "8px 12px", borderBottom: `1px solid ${T.border}`, display: "flex", gap: 6, overflowX: "auto" }}>
        {agents.length === 0 && <div style={{ padding: "8px 0", fontSize: 11, color: T.textDim }}>No agents selected — use the Agents button in the top bar to add some.</div>}
        {agents.map((agent) => (
          <button key={agent.id} onClick={() => { setActiveAgent(agent.id); externalOnReset?.(); }} style={{ padding: "6px 12px", borderRadius: 20, border: `1px solid ${activeAgent === agent.id ? color : T.border}`, background: activeAgent === agent.id ? color + "20" : "transparent", color: activeAgent === agent.id ? T.text : T.textMid, fontSize: 11, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", transition: "all .15s" }}>
            <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: agent.status === "green" ? T.green : T.textDim, marginRight: 6 }} />{agent.name}
          </button>
        ))}
      </div>
      {agentContribActive && (
        <div style={{ padding: "6px 12px", background: T.warn + "10", borderBottom: `1px solid ${T.warn}20`, display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.warn, animation: "pulse 2s infinite" }} />
          <span style={{ fontSize: 10, color: T.warn, fontWeight: 600 }}>Agent Contribution Active</span>
        </div>
      )}
      {contribError && (
        <div style={{ padding: "6px 12px", background: "#ff4d4f12", borderBottom: "1px solid #ff4d4f30", display: "flex", alignItems: "center", gap: 6 }}>
          <Icon d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M12 8v4 M12 16h.01" color="#ff4d4f" size={11} />
          <span style={{ fontSize: 10, color: "#ff4d4f", fontWeight: 500 }}>{contribError}</span>
        </div>
      )}
      <div style={{ flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
        {briefing && showBriefing && messages.length === 0 && (
          <div style={{ background: T.teal + "10", border: `1px solid ${T.teal}25`, borderRadius: 10, padding: 14, marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Icon d="M12 2L2 7l10 5 10-5-10-5z M2 17l10 5 10-5 M2 12l10 5 10-5" color={T.teal} />
                <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>Prep Briefing</span>
              </div>
              <button onClick={() => setShowBriefing(false)} style={{ background: "transparent", border: "none", color: T.textDim, cursor: "pointer", fontSize: 16, padding: 0, lineHeight: 1 }}>&times;</button>
            </div>
            <div style={{ fontSize: 10, color: T.textDim, marginBottom: 10 }}>Generated by {briefing.generatedBy} at {briefing.generatedAt}</div>
            {briefing.sections.map((sec, si) => (
              <div key={si} style={{ marginBottom: si < briefing.sections.length - 1 ? 12 : 0 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: T.teal, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>{sec.heading}</div>
                {sec.items.map((item, ii) => (
                  <div key={ii} style={{ fontSize: 12, color: item.startsWith("OVERDUE") ? T.danger : T.textMid, lineHeight: 1.5, paddingLeft: 10, borderLeft: `2px solid ${item.startsWith("OVERDUE") ? T.danger + "40" : T.teal + "20"}`, marginBottom: 4 }}>{item}</div>
                ))}
              </div>
            ))}
          </div>
        )}
        {messages.length === 0 && current && !briefing && (
          <div style={{ background: color + "10", border: `1px solid ${color}25`, borderRadius: 10, padding: 14, marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 4 }}>{current.name}</div>
            <div style={{ fontSize: 11, color: T.textMid, marginBottom: 10, lineHeight: 1.45 }}>{current.description}</div>
            {(current.exampleQuestions?.length > 0) && <div style={{ fontSize: 10, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6, fontWeight: 600 }}>Try asking</div>}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {(current.exampleQuestions || []).map((q, i) => (
                <button key={i} onClick={() => { setInput(q); inputRef.current?.focus(); }} style={{ background: T.bg0, border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 10px", color: T.text, fontSize: 12, textAlign: "left", cursor: "pointer", transition: "all .15s" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = color; e.currentTarget.style.background = color + "08"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.bg0; }}>{q}</button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg) => { const isUser = msg.from === "user"; return (
          <div key={msg.id} style={{ display: "flex", flexDirection: "column", alignItems: isUser ? "flex-end" : "flex-start" }}>
            {!isUser && <span style={{ fontSize: 10, color, marginBottom: 2, marginLeft: 4, fontWeight: 600 }}>{msg.agentName}</span>}
            <div style={{ maxWidth: "85%", padding: "8px 12px", borderRadius: 12, background: isUser ? color + "25" : T.bg2, color: T.text, fontSize: 13, lineHeight: 1.45 }}>{msg.text}</div>
            <span style={{ fontSize: 9, color: T.textDim, marginTop: 2 }}>{msg.time}</span>
          </div>
        ); })}
        {interjections.map((ij) => (
          <div key={ij.id} style={{ borderLeft: `3px solid ${T.warn}`, borderRadius: 8, padding: "10px 14px", background: T.warn + "08", border: `1px solid ${T.warn}25`, marginTop: 4 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Icon d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M12 8v4 M12 16h.01" color={T.warn} size={12} />
                <span style={{ fontSize: 11, fontWeight: 700, color: T.warn }}>AI Agent Contribution</span>
                <span style={{ fontSize: 9, color: T.textDim }}>{ij.ts}</span>
              </div>
              {onDismissInterjection && (
                <button onClick={() => onDismissInterjection(ij.id)} style={{ background: "transparent", border: "none", color: T.textDim, cursor: "pointer", fontSize: 14, padding: 0, lineHeight: 1 }}>&times;</button>
              )}
            </div>
            <div style={{ fontSize: 12, color: T.textMid, marginBottom: 4 }}>
              <strong style={{ color: T.text }}>{ij.speaker}</strong> said: <em>&ldquo;{ij.claim}&rdquo;</em>
            </div>
            <div style={{ fontSize: 12, color: T.green, fontWeight: 600 }}>Correction: {ij.correction}</div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div style={{ padding: "10px 12px", borderTop: `1px solid ${T.border}`, display: "flex", gap: 8 }}>
        <textarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder={`Ask ${current?.name || "agent"}...`} rows={1} style={{ flex: 1, background: T.bg0, border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 12px", color: T.text, fontSize: 13, outline: "none", fontFamily: "inherit", resize: "none" }} onFocus={(e) => (e.currentTarget.style.borderColor = color)} onBlur={(e) => (e.currentTarget.style.borderColor = T.border)} />
        <button onClick={send} disabled={!input.trim()} style={{ background: input.trim() ? color : T.bg3, border: "none", borderRadius: 8, padding: "8px 14px", color: input.trim() ? "#1A1A1A" : T.textDim, fontSize: 12, fontWeight: 600, cursor: input.trim() ? "pointer" : "default" }}>Send</button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
//  EXPORT MODAL
// ═══════════════════════════════════════════════════════════════════
const ExportModal = ({ entry, onClose }) => {
  const [format, setFormat] = useState("markdown");
  const [copied, setCopied] = useState(false);

  const generateExport = () => {
    const lines = [];
    const ts = new Date().toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" });
    if (format === "markdown") {
      lines.push(`# ${entry.title}`, "");
      lines.push(`**Date:** ${entry.date} · ${entry.time}  `);
      if (entry.meetingMeta) {
        lines.push(`**Duration:** ${entry.meetingMeta.duration}  `);
        lines.push(`**Room:** ${entry.meetingMeta.room || "—"}  `);
      }
      lines.push(`**Type:** ${entry.type === "meeting" ? "Meeting" : "Journal Entry"}  `);
      lines.push(`**Exported:** ${ts}  `);
      lines.push("", "---", "");
      if (entry.participants.length > 0) {
        const people = entry.participants.map(getParticipant).filter(Boolean);
        lines.push("## Participants", "");
        people.forEach(p => lines.push(`- **${p.name}** — ${p.role}`));
        lines.push("");
      }
      lines.push("## Notes", "");
      lines.push(stripHtml(entry.content) || "*No content yet.*");
      lines.push("", "---", "", `> *Exported from SENS Journal · ${ts}*`);
    } else {
      lines.push(entry.title.toUpperCase(), "═".repeat(40));
      lines.push(`Date: ${entry.date} · ${entry.time}`);
      if (entry.meetingMeta) lines.push(`Duration: ${entry.meetingMeta.duration}`, `Room: ${entry.meetingMeta.room || "—"}`);
      lines.push(`Exported: ${ts}`, "", "═".repeat(40), "");
      lines.push("NOTES", "═".repeat(40));
      lines.push(stripHtml(entry.content) || "(No content yet.)");
      lines.push("", "═".repeat(40), `Exported from SENS Journal · ${ts}`);
    }
    return lines.join("\n");
  };

  const exportText = generateExport();

  const handleCopy = () => { navigator.clipboard?.writeText(exportText); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const handleDownload = () => {
    const ext = format === "markdown" ? "md" : "txt";
    const blob = new Blob([exportText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `${entry.title.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}-journal.${ext}`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={window.innerWidth < 768 ? { position: "fixed", inset: 0, background: T.bg1, display: "flex", flexDirection: "column", overflow: "hidden" } : { width: 680, maxHeight: "80vh", background: T.bg1, border: `1px solid ${T.border}`, borderRadius: 14, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Icon d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3" size={18} />
            <span style={{ fontSize: 15, fontWeight: 700, color: T.text }}>Export Journal Entry</span>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: T.textDim, cursor: "pointer", fontSize: 20, padding: 0, lineHeight: 1 }}>&times;</button>
        </div>
        <div style={{ padding: "12px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 11, color: T.textDim, fontWeight: 600 }}>FORMAT:</span>
          <Pill active={format === "markdown"} onClick={() => setFormat("markdown")}>Markdown</Pill>
          <Pill active={format === "plaintext"} onClick={() => setFormat("plaintext")}>Plain Text</Pill>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          <pre style={{ margin: 0, fontSize: 12, color: T.textMid, lineHeight: 1.6, fontFamily: "'DM Sans', monospace", whiteSpace: "pre-wrap", wordBreak: "break-word", background: T.bg0, borderRadius: 8, padding: 16, border: `1px solid ${T.border}` }}>{exportText}</pre>
        </div>
        <div style={{ padding: "12px 20px", borderTop: `1px solid ${T.border}`, display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={handleCopy} style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 16px", color: copied ? T.green : T.text, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            {copied ? "Copied!" : "Copy to Clipboard"}
          </button>
          <button onClick={handleDownload} style={{ background: C, border: "none", borderRadius: 8, padding: "8px 20px", color: "#1A1A1A", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            Download .{format === "markdown" ? "md" : "txt"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
//  JOURNAL ENTRY CARD (for the Feed)
// ═══════════════════════════════════════════════════════════════════
const EntryCard = ({ entry, onClick }) => {
  const [hovered, setHovered] = useState(false);
  const isMeeting = entry.type === "meeting";
  const isLive = entry.status === "live";
  const isUpcoming = entry.status === "upcoming";
  const isDraft = entry.status === "draft";
  const typeColor = isMeeting ? C : T.purple;
  const statusColors = { upcoming: T.blue, live: T.danger, completed: T.green, draft: T.teal };
  const statusColor = statusColors[entry.status] || T.textDim;
  const preview = stripHtml(entry.content).slice(0, 140);
  const attachmentCount = (entry.attachments || []).length;
  const hasRecording = entry.meetingMeta?.hasRecording;

  return (
    <div onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? typeColor + "06" : T.bg2,
        border: `1px solid ${hovered ? typeColor + "40" : T.border}`,
        borderLeft: `3px solid ${entry.pinned ? T.warn : typeColor}`,
        borderRadius: 10, padding: "16px 20px", cursor: "pointer", transition: "all .15s",
      }}>
      {/* Row 1: Type badge, status, title, date */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 4, background: typeColor + "15", color: typeColor, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" }}>
          {isMeeting ? "MEETING" : "NOTE"}
        </span>
        <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 4, background: statusColor + "15", color: statusColor, fontWeight: 700, textTransform: "uppercase" }}>
          {isLive && "● "}{entry.status}
        </span>
        {entry.pinned && <Icon d="M12 2L2 7l10 5 10-5-10-5z" color={T.warn} size={11} />}
        <span style={{ fontSize: 14, fontWeight: 700, color: T.text, flex: 1 }}>{entry.title}</span>
        <span style={{ fontSize: 11, color: T.textDim, flexShrink: 0 }}>{fmtDateShort(entry.date)} · {entry.time}</span>
      </div>

      {/* Row 2: Participants, meta, preview */}
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          {/* Meeting meta */}
          {isMeeting && entry.meetingMeta && (
            <div style={{ fontSize: 11, color: T.textDim, marginBottom: 4, display: "flex", gap: 8, alignItems: "center" }}>
              <span>{entry.meetingMeta.room}</span>
              <span>·</span>
              <span>{entry.meetingMeta.duration}</span>
              {entry.meetingMeta.recurring && <><span>·</span><span>Recurring</span></>}
              {hasRecording && <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 4, background: T.blue + "15", color: T.blue }}>Recorded</span>}
            </div>
          )}
          {/* Content preview */}
          {preview && (
            <div style={{ fontSize: 12, color: T.textMid, lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{preview}</div>
          )}
          {/* Agenda preview for upcoming meetings */}
          {isUpcoming && entry.meetingMeta?.agenda?.length > 0 && !preview && (
            <div style={{ fontSize: 11, color: T.textDim, marginTop: 2 }}>
              Agenda: {entry.meetingMeta.agenda.slice(0, 3).join(" · ")}{entry.meetingMeta.agenda.length > 3 ? ` +${entry.meetingMeta.agenda.length - 3} more` : ""}
            </div>
          )}
        </div>
        {/* Participants */}
        {entry.participants.length > 0 && (
          <div style={{ flexShrink: 0 }}>
            <ParticipantRow ids={entry.participants} max={4} />
          </div>
        )}
      </div>

      {/* Row 3: Tags, attachment count, action button */}
      <div style={{ display: "flex", gap: 4, marginTop: 8, flexWrap: "wrap", alignItems: "center" }}>
        {entry.tags.map(tag => {
          const obj = getTagObj(tag);
          const tagColor = obj?.color || typeColor;
          return (
            <span key={tag} style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 9, padding: "2px 6px", borderRadius: 4, background: tagColor + "12", color: tagColor, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: tagColor, flexShrink: 0 }} />{tag}
            </span>
          );
        })}
        {attachmentCount > 0 && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 9, padding: "2px 6px", borderRadius: 4, background: T.blue + "12", color: T.blue }}>
            <Icon d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" color={T.blue} size={8} />
            {attachmentCount} file{attachmentCount !== 1 ? "s" : ""}
          </span>
        )}
        <div style={{ flex: 1 }} />
        {(isUpcoming || isLive) && (
          <span style={{ fontSize: 10, padding: "3px 10px", borderRadius: 6, background: isLive ? T.danger : C, color: "#1A1A1A", fontWeight: 700 }}>{isLive ? "Join Live" : "Open"}</span>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
//  ADVANCED FILTER BAR — Composable dropdown filters
// ═══════════════════════════════════════════════════════════════════

const FILTER_PRESETS = [
  { id: "all", label: "All entries", icon: "M3 12h18M3 6h18M3 18h18", filters: {} },
  { id: "today", label: "Today", icon: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z M12 6v6l4 2", filters: { dateRange: "today" } },
  { id: "this-week", label: "This week", icon: "M4 9h16M4 15h16M10 3v18M16 3v18", filters: { dateRange: "week" } },
  { id: "meetings-upcoming", label: "Upcoming meetings", icon: "M23 7l-7 5 7 5V7z M16 3H3v18h13V3z", filters: { types: ["meeting"], statuses: ["upcoming", "live"] } },
  { id: "my-notes", label: "My notes", icon: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6", filters: { types: ["freeform"] } },
  { id: "pinned", label: "Pinned", icon: "M12 2L2 7l10 5 10-5-10-5z", filters: { pinned: true } },
];

const DATE_OPTIONS = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "week", label: "This week" },
  { id: "last7", label: "Last 7 days" },
  { id: "month", label: "This month" },
  { id: "last30", label: "Last 30 days" },
];

const STATUS_OPTIONS = [
  { id: "upcoming", label: "Upcoming", color: T.blue },
  { id: "live", label: "Live", color: T.danger },
  { id: "completed", label: "Completed", color: T.green },
  { id: "draft", label: "Draft", color: T.teal },
];

const TYPE_OPTIONS = [
  { id: "meeting", label: "Meeting", color: C },
  { id: "freeform", label: "Note", color: T.purple },
];

const HAS_OPTIONS = [
  { id: "recording", label: "Recording", color: T.blue },
  { id: "transcript", label: "Transcript", color: T.teal },
  { id: "attachments", label: "Attachments", color: T.purple },
  { id: "minutes", label: "Magic Minutes", color: T.green },
];

const EMPTY_FILTERS = { dateRange: null, tags: [], types: [], statuses: [], participants: [], has: [], pinned: false, search: "" };

// Generic dropdown for the filter bar
const FilterDropdown = ({ label, icon, active, color = C, children, onClear }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(!open)} style={{
        display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 7,
        border: `1px solid ${active ? color + "50" : T.border}`,
        background: active ? color + "12" : "transparent",
        color: active ? color : T.textMid, fontSize: 11, fontWeight: active ? 600 : 400,
        cursor: "pointer", transition: "all .15s", fontFamily: "inherit", whiteSpace: "nowrap",
      }}>
        <Icon d={icon} size={11} color="currentColor" />
        {label}
        {active && onClear && (
          <span onClick={(e) => { e.stopPropagation(); onClear(); }} style={{ marginLeft: 2, fontSize: 13, lineHeight: 1, opacity: 0.7 }}>&times;</span>
        )}
        <Icon d={open ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"} size={9} color="currentColor" />
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 120,
          background: T.bg1, border: `1px solid ${T.border}`, borderRadius: 10,
          boxShadow: "0 8px 32px rgba(0,0,0,.45)", minWidth: 200, maxHeight: 320, overflowY: "auto",
        }}>
          {children}
        </div>
      )}
    </div>
  );
};

// Checkbox row inside a dropdown
const FilterCheckRow = ({ checked, label, color = C, count, onClick, sub }) => (
  <button onClick={onClick} style={{
    display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "7px 12px",
    background: checked ? color + "08" : "transparent", border: "none", cursor: "pointer",
    color: T.text, fontSize: 11, fontFamily: "inherit", textAlign: "left", transition: "background .1s",
  }} onMouseEnter={(e) => { if (!checked) e.currentTarget.style.background = T.bg3; }}
     onMouseLeave={(e) => { e.currentTarget.style.background = checked ? color + "08" : "transparent"; }}>
    <div style={{
      width: 14, height: 14, borderRadius: 3, border: `1.5px solid ${checked ? color : T.border}`,
      background: checked ? color : "transparent", display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0, transition: "all .12s",
    }}>
      {checked && <Icon d="M20 6L9 17l-5-5" size={9} color="#1A1A1A" sw={3} />}
    </div>
    <span style={{ flex: 1, color: checked ? color : T.text, fontWeight: checked ? 600 : 400 }}>{label}</span>
    {sub && <span style={{ fontSize: 9, color: T.textDim }}>{sub}</span>}
    {count != null && <span style={{ fontSize: 9, color: T.textDim, background: T.bg3, padding: "1px 5px", borderRadius: 4 }}>{count}</span>}
  </button>
);

// The Advanced Filter Bar
const AdvancedFilterBar = ({ filters, onChange, entries }) => {
  const [showPresets, setShowPresets] = useState(false);
  const presetRef = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (presetRef.current && !presetRef.current.contains(e.target)) setShowPresets(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const set = (key, val) => onChange({ ...filters, [key]: val });
  const toggleInArray = (key, val) => {
    const arr = filters[key] || [];
    set(key, arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]);
  };

  // Compute counts
  const tagCounts = useMemo(() => {
    const m = {};
    entries.forEach(e => e.tags.forEach(t => { m[t] = (m[t] || 0) + 1; }));
    return m;
  }, [entries]);
  const participantCounts = useMemo(() => {
    const m = {};
    entries.forEach(e => e.participants.forEach(p => { m[p] = (m[p] || 0) + 1; }));
    return m;
  }, [entries]);

  const activeCount = (filters.dateRange ? 1 : 0) + (filters.tags?.length || 0) + (filters.types?.length || 0)
    + (filters.statuses?.length || 0) + (filters.participants?.length || 0) + (filters.has?.length || 0) + (filters.pinned ? 1 : 0);

  const tagCategories = useMemo(() => {
    const cats = {};
    tagRegistry.forEach(tag => {
      if (!cats[tag.category]) cats[tag.category] = [];
      cats[tag.category].push(tag);
    });
    return cats;
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {/* Row 1: dropdowns + search + actions */}
      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
        {/* Presets */}
        <div ref={presetRef} style={{ position: "relative" }}>
          <button onClick={() => setShowPresets(!showPresets)} style={{
            display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 7,
            border: `1px solid ${T.border}`, background: "transparent",
            color: T.textMid, fontSize: 11, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
          }}>
            <Icon d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" size={11} color="currentColor" />
            Views
            <Icon d={showPresets ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"} size={9} color="currentColor" />
          </button>
          {showPresets && (
            <div style={{
              position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 120,
              background: T.bg1, border: `1px solid ${T.border}`, borderRadius: 10,
              boxShadow: "0 8px 32px rgba(0,0,0,.45)", width: 210, overflow: "hidden",
            }}>
              <div style={{ padding: "8px 12px 4px", fontSize: 9, color: T.textDim, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>Quick Views</div>
              {FILTER_PRESETS.map(p => (
                <button key={p.id} onClick={() => { onChange({ ...EMPTY_FILTERS, ...p.filters }); setShowPresets(false); }} style={{
                  display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 12px",
                  background: "transparent", border: "none", cursor: "pointer", color: T.text,
                  fontSize: 11, fontFamily: "inherit", textAlign: "left", transition: "background .1s",
                }} onMouseEnter={(e) => (e.currentTarget.style.background = T.bg3)}
                   onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                  <Icon d={p.icon} size={12} color={C} />
                  <span>{p.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ width: 1, height: 20, background: T.border, margin: "0 2px" }} />

        {/* Date filter */}
        <FilterDropdown label={filters.dateRange ? DATE_OPTIONS.find(d => d.id === filters.dateRange)?.label || "Date" : "Date"}
          icon="M4 9h16M4 15h16M10 3v18M16 3v18"
          active={!!filters.dateRange} color={T.blue}
          onClear={() => set("dateRange", null)}>
          {DATE_OPTIONS.map(d => (
            <FilterCheckRow key={d.id} checked={filters.dateRange === d.id} label={d.label} color={T.blue}
              onClick={() => set("dateRange", filters.dateRange === d.id ? null : d.id)} />
          ))}
        </FilterDropdown>

        {/* Type filter */}
        <FilterDropdown label={filters.types?.length ? `Type (${filters.types.length})` : "Type"}
          icon="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6"
          active={filters.types?.length > 0} color={C}
          onClear={() => set("types", [])}>
          {TYPE_OPTIONS.map(t => (
            <FilterCheckRow key={t.id} checked={(filters.types || []).includes(t.id)} label={t.label} color={t.color}
              count={entries.filter(e => e.type === t.id).length}
              onClick={() => toggleInArray("types", t.id)} />
          ))}
        </FilterDropdown>

        {/* Status filter */}
        <FilterDropdown label={filters.statuses?.length ? `Status (${filters.statuses.length})` : "Status"}
          icon="M22 11.08V12a10 10 0 1 1-5.93-9.14"
          active={filters.statuses?.length > 0} color={T.green}
          onClear={() => set("statuses", [])}>
          {STATUS_OPTIONS.map(s => (
            <FilterCheckRow key={s.id} checked={(filters.statuses || []).includes(s.id)} label={s.label} color={s.color}
              count={entries.filter(e => s.id === "upcoming" ? (e.status === "upcoming" || e.status === "live") : e.status === s.id).length}
              onClick={() => toggleInArray("statuses", s.id)} />
          ))}
        </FilterDropdown>

        {/* Tags filter */}
        <FilterDropdown label={filters.tags?.length ? `Tags (${filters.tags.length})` : "Tags"}
          icon="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z M7 7h.01"
          active={filters.tags?.length > 0} color={T.accent}
          onClear={() => set("tags", [])}>
          {Object.entries(tagCategories).map(([cat, tags]) => (
            <div key={cat}>
              <div style={{ padding: "8px 12px 4px", fontSize: 9, color: T.textDim, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>{cat}</div>
              {tags.map(tag => (
                <FilterCheckRow key={tag.id} checked={(filters.tags || []).includes(tag.name)}
                  label={tag.name} color={tag.color}
                  count={tagCounts[tag.name] || 0} sub={tag.description}
                  onClick={() => toggleInArray("tags", tag.name)} />
              ))}
            </div>
          ))}
        </FilterDropdown>

        {/* Participants filter */}
        <FilterDropdown label={filters.participants?.length ? `People (${filters.participants.length})` : "People"}
          icon="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M8.5 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"
          active={filters.participants?.length > 0} color={T.teal}
          onClear={() => set("participants", [])}>
          {participants.map(p => (
            <FilterCheckRow key={p.id} checked={(filters.participants || []).includes(p.id)}
              label={p.name} color={p.color}
              count={participantCounts[p.id] || 0} sub={p.role}
              onClick={() => toggleInArray("participants", p.id)} />
          ))}
        </FilterDropdown>

        {/* Has filter */}
        <FilterDropdown label={filters.has?.length ? `Has (${filters.has.length})` : "Has"}
          icon="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"
          active={filters.has?.length > 0} color={T.purple}
          onClear={() => set("has", [])}>
          {HAS_OPTIONS.map(h => (
            <FilterCheckRow key={h.id} checked={(filters.has || []).includes(h.id)}
              label={h.label} color={h.color}
              onClick={() => toggleInArray("has", h.id)} />
          ))}
          <div style={{ borderTop: `1px solid ${T.border}`, marginTop: 4 }}>
            <FilterCheckRow checked={filters.pinned} label="Pinned only" color={T.warn}
              onClick={() => set("pinned", !filters.pinned)} />
          </div>
        </FilterDropdown>

        <div style={{ flex: 1 }} />

        {/* Search */}
        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
          <Icon d="M11 17.25a6.25 6.25 0 1 1 0-12.5 6.25 6.25 0 0 1 0 12.5z M16 16l4.5 4.5" size={12} color={T.textDim} />
          <input value={filters.search || ""} onChange={(e) => set("search", e.target.value)} placeholder="Search..."
            style={{ background: T.bg0, border: `1px solid ${T.border}`, borderRadius: 8, padding: "6px 10px 6px 6px",
              color: T.text, fontSize: 11, outline: "none", width: 160, fontFamily: "inherit", marginLeft: 4 }}
            onFocus={(e) => (e.currentTarget.style.borderColor = C)}
            onBlur={(e) => (e.currentTarget.style.borderColor = T.border)} />
          {filters.search && (
            <button onClick={() => set("search", "")} style={{ position: "absolute", right: 6, background: "transparent", border: "none", color: T.textDim, cursor: "pointer", fontSize: 13, padding: 0, lineHeight: 1 }}>&times;</button>
          )}
        </div>

        {/* Clear all */}
        {activeCount > 0 && (
          <button onClick={() => onChange({ ...EMPTY_FILTERS })} style={{
            display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 7,
            border: `1px solid ${T.danger}30`, background: T.danger + "08",
            color: T.danger, fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
          }}>
            <Icon d="M18 6L6 18M6 6l12 12" size={10} color={T.danger} />
            Clear ({activeCount})
          </button>
        )}
      </div>

      {/* Row 2: Active filter chips */}
      {activeCount > 0 && (
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 9, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600, marginRight: 4 }}>Active:</span>
          {filters.dateRange && (
            <FilterChip label={DATE_OPTIONS.find(d => d.id === filters.dateRange)?.label || filters.dateRange} color={T.blue} onRemove={() => set("dateRange", null)} />
          )}
          {(filters.types || []).map(t => (
            <FilterChip key={t} label={TYPE_OPTIONS.find(o => o.id === t)?.label || t} color={TYPE_OPTIONS.find(o => o.id === t)?.color || C} onRemove={() => toggleInArray("types", t)} />
          ))}
          {(filters.statuses || []).map(s => (
            <FilterChip key={s} label={STATUS_OPTIONS.find(o => o.id === s)?.label || s} color={STATUS_OPTIONS.find(o => o.id === s)?.color || T.green} onRemove={() => toggleInArray("statuses", s)} />
          ))}
          {(filters.tags || []).map(t => {
            const obj = getTagObj(t);
            return <FilterChip key={t} label={t} color={obj?.color || C} onRemove={() => toggleInArray("tags", t)} />;
          })}
          {(filters.participants || []).map(p => {
            const person = getParticipant(p);
            return <FilterChip key={p} label={person?.name || p} color={person?.color || T.teal} onRemove={() => toggleInArray("participants", p)} />;
          })}
          {(filters.has || []).map(h => (
            <FilterChip key={h} label={`Has: ${HAS_OPTIONS.find(o => o.id === h)?.label || h}`} color={HAS_OPTIONS.find(o => o.id === h)?.color || T.purple} onRemove={() => toggleInArray("has", h)} />
          ))}
          {filters.pinned && (
            <FilterChip label="Pinned" color={T.warn} onRemove={() => set("pinned", false)} />
          )}
        </div>
      )}
    </div>
  );
};

const FilterChip = ({ label, color = C, onRemove }) => (
  <span style={{
    display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, padding: "2px 8px",
    borderRadius: 5, background: color + "15", color: color, fontWeight: 600, whiteSpace: "nowrap",
  }}>
    <span style={{ width: 5, height: 5, borderRadius: "50%", background: color }} />
    {label}
    <span onClick={onRemove} style={{ cursor: "pointer", fontSize: 13, lineHeight: 1, marginLeft: 1, opacity: 0.7 }}>&times;</span>
  </span>
);

// ═══════════════════════════════════════════════════════════════════
//  FEED VIEW — Chronological timeline of all journal entries
// ═══════════════════════════════════════════════════════════════════
const FeedView = ({ entries, onOpenEntry, onNewEntry, onStartMeeting, simDate: simDateProp }) => {
  const [filters, setFilters] = useState({ ...EMPTY_FILTERS });

  // Date boundary helpers
  const getDateBounds = useCallback((rangeId) => {
    const now = simDateProp ? new Date(simDateProp + "T12:00:00") : new Date();
    const startOfDay = (d) => { const r = new Date(d); r.setHours(0, 0, 0, 0); return r; };
    const today = startOfDay(now);
    switch (rangeId) {
      case "today": return { from: today, to: new Date(today.getTime() + 86400000) };
      case "yesterday": { const y = new Date(today.getTime() - 86400000); return { from: y, to: today }; }
      case "week": { const d = today.getDay(); const mon = new Date(today.getTime() - ((d === 0 ? 6 : d - 1) * 86400000)); return { from: mon, to: new Date(today.getTime() + 86400000) }; }
      case "last7": return { from: new Date(today.getTime() - 7 * 86400000), to: new Date(today.getTime() + 86400000) };
      case "month": { const m = new Date(today); m.setDate(1); return { from: m, to: new Date(today.getTime() + 86400000) }; }
      case "last30": return { from: new Date(today.getTime() - 30 * 86400000), to: new Date(today.getTime() + 86400000) };
      default: return null;
    }
  }, [simDateProp]);

  const filtered = useMemo(() => {
    let items = entries;

    // Date range
    if (filters.dateRange) {
      const bounds = getDateBounds(filters.dateRange);
      if (bounds) items = items.filter(e => { const d = new Date(e.date + "T00:00:00"); return d >= bounds.from && d < bounds.to; });
    }
    // Type
    if (filters.types?.length) items = items.filter(e => filters.types.includes(e.type));
    // Status
    if (filters.statuses?.length) items = items.filter(e => {
      if (filters.statuses.includes("upcoming") && (e.status === "upcoming" || e.status === "live")) return true;
      return filters.statuses.includes(e.status);
    });
    // Tags (AND — entry must have ALL selected tags)
    if (filters.tags?.length) items = items.filter(e => filters.tags.every(t => e.tags.includes(t)));
    // Participants (OR — entry has any selected participant)
    if (filters.participants?.length) items = items.filter(e => filters.participants.some(p => e.participants.includes(p)));
    // Has
    if (filters.has?.length) {
      items = items.filter(e => {
        return filters.has.every(h => {
          if (h === "recording") return e.meetingMeta?.hasRecording;
          if (h === "transcript") return e.meetingMeta?.hasTranscript;
          if (h === "attachments") return (e.attachments || []).length > 0;
          if (h === "minutes") return !!e.meetingMeta?.magicMinutes;
          return true;
        });
      });
    }
    // Pinned
    if (filters.pinned) items = items.filter(e => e.pinned);
    // Text search
    if (filters.search) {
      const q = filters.search.toLowerCase();
      items = items.filter(e =>
        e.title.toLowerCase().includes(q) ||
        stripHtml(e.content).toLowerCase().includes(q) ||
        e.tags.some(t => t.includes(q)) ||
        e.participants.map(getParticipant).filter(Boolean).some(p => p.name.toLowerCase().includes(q))
      );
    }

    // Sort: pinned first, then live, then upcoming, then by date desc
    return items.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      const statusOrder = { live: 0, upcoming: 1, draft: 2, completed: 3 };
      const sA = statusOrder[a.status] ?? 3;
      const sB = statusOrder[b.status] ?? 3;
      if (sA !== sB) return sA - sB;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }, [entries, filters, getDateBounds]);

  const meetingCount = entries.filter(e => e.type === "meeting").length;
  const noteCount = entries.filter(e => e.type === "freeform").length;
  const withRecordings = entries.filter(e => e.meetingMeta?.hasRecording).length;
  const withAttachments = entries.filter(e => (e.attachments || []).length > 0).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* KPI strip */}
      <div style={{ display: "grid", gridTemplateColumns: window.innerWidth < 768 ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: 12 }}>
        <KpiCard label="Total Entries" value={entries.length} sub={`${meetingCount} meetings · ${noteCount} notes`} color={C} />
        <KpiCard label="Showing" value={filtered.length} sub={filtered.length === entries.length ? "all entries" : `of ${entries.length} entries`} color={T.blue} />
        <KpiCard label="With Recordings" value={withRecordings} sub="from ro.am" color={T.green} />
        <KpiCard label="With Attachments" value={withAttachments} sub={`${entries.reduce((sum, e) => sum + (e.attachments || []).length, 0)} files total`} color={T.purple} />
      </div>

      {/* Advanced filter bar */}
      <div style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 14px" }}>
        <AdvancedFilterBar filters={filters} onChange={setFilters} entries={entries} />
      </div>

      {/* Action row */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "flex-end" }}>
        <span style={{ flex: 1, fontSize: 11, color: T.textDim }}>{filtered.length} {filtered.length === 1 ? "entry" : "entries"}</span>
        <button onClick={onStartMeeting} style={{ background: T.danger + "15", border: `1px solid ${T.danger}40`, borderRadius: 8, padding: "8px 16px", color: T.danger, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, transition: "all .15s" }} onMouseEnter={(e) => { e.currentTarget.style.background = T.danger; e.currentTarget.style.color = "#fff"; }} onMouseLeave={(e) => { e.currentTarget.style.background = T.danger + "15"; e.currentTarget.style.color = T.danger; }}>
          <Icon d="M23 7l-7 5 7 5V7z M16 3H3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z" color="currentColor" size={12} />Start Meeting
        </button>
        <button onClick={onNewEntry} style={{ background: C, border: "none", borderRadius: 8, padding: "8px 18px", color: "#1A1A1A", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
          <Icon d="M12 5v14M5 12h14" color="#1A1A1A" size={12} />New Entry
        </button>
      </div>

      {/* Timeline feed */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.map(entry => (
          <EntryCard key={entry.id} entry={entry} onClick={() => onOpenEntry(entry)} />
        ))}
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: 60, color: T.textDim, fontSize: 13 }}>
            {filters.search ? "No entries match your search." : "No entries match the current filters."}
          </div>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
//  ENTRY VIEW — Full-width document with toggleable side panel
// ═══════════════════════════════════════════════════════════════════
const InvitePicker = ({ selectedIds, onChange, accentColor = C }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  const toggle = (id) => {
    if (selectedIds.includes(id)) onChange(selectedIds.filter(p => p !== id));
    else onChange([...selectedIds, id]);
  };
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(!open)} style={{ background: open ? accentColor + "20" : T.bg3, border: `1px solid ${open ? accentColor + "40" : T.border}`, borderRadius: 8, padding: "6px 10px", color: open ? accentColor : T.textMid, fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, transition: "all .15s" }}>
        <Icon d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M8.5 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M20 8v6 M23 11h-6" color="currentColor" size={12} />
        Invite
      </button>
      {open && (
        <div style={{ position: "absolute", top: "100%", right: 0, zIndex: 100, background: T.bg1, border: `1px solid ${T.border}`, borderRadius: 10, marginTop: 6, width: 260, maxHeight: 320, overflowY: "auto", boxShadow: "0 8px 32px rgba(0,0,0,.4)" }}>
          <div style={{ padding: "10px 12px", borderBottom: `1px solid ${T.border}`, fontSize: 10, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600 }}>Add Participants</div>
          {participants.map(p => {
            const selected = selectedIds.includes(p.id);
            return (
              <button key={p.id} onClick={() => toggle(p.id)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "8px 12px", background: selected ? accentColor + "10" : "transparent", border: "none", cursor: "pointer", color: T.text, fontSize: 12, fontFamily: "inherit", textAlign: "left", transition: "background .1s" }} onMouseEnter={(e) => { if (!selected) e.currentTarget.style.background = T.bg3; }} onMouseLeave={(e) => { e.currentTarget.style.background = selected ? accentColor + "10" : "transparent"; }}>
                <Avatar person={p} size={24} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: T.text }}>{p.name}</div>
                  <div style={{ fontSize: 10, color: T.textDim }}>{p.role}</div>
                </div>
                {selected && <Icon d="M22 11.08V12a10 10 0 1 1-5.93-9.14 M22 4L12 14.01l-3-3" color={accentColor} size={14} />}
                {p.online && <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.green, flexShrink: 0 }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const AgentSelector = ({ selectedAgentIds, onChange, accentColor = C }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  const toggle = (id) => {
    if (selectedAgentIds.includes(id)) onChange(selectedAgentIds.filter(a => a !== id));
    else onChange([...selectedAgentIds, id]);
  };
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(!open)} style={{ background: open ? T.teal + "20" : T.bg3, border: `1px solid ${open ? T.teal + "40" : T.border}`, borderRadius: 8, padding: "6px 10px", color: open ? T.teal : T.textMid, fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, transition: "all .15s" }}>
        <Icon d="M12 2L2 7l10 5 10-5-10-5z M2 17l10 5 10-5 M2 12l10 5 10-5" color="currentColor" size={12} />
        Agents ({selectedAgentIds.length})
      </button>
      {open && (
        <div style={{ position: "absolute", top: "100%", right: 0, zIndex: 100, background: T.bg1, border: `1px solid ${T.border}`, borderRadius: 10, marginTop: 6, width: 300, maxHeight: 360, overflowY: "auto", boxShadow: "0 8px 32px rgba(0,0,0,.4)" }}>
          <div style={{ padding: "10px 12px", borderBottom: `1px solid ${T.border}`, fontSize: 10, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600 }}>Select AI Agents ({allAgents.length} available)</div>
          {allAgents.map(agent => {
            const selected = selectedAgentIds.includes(agent.id);
            const agentColor = agent.color || T.teal;
            return (
              <button key={agent.id} onClick={() => toggle(agent.id)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px", background: selected ? agentColor + "10" : "transparent", border: "none", cursor: "pointer", color: T.text, fontSize: 12, fontFamily: "inherit", textAlign: "left", transition: "background .1s" }} onMouseEnter={(e) => { if (!selected) e.currentTarget.style.background = T.bg3; }} onMouseLeave={(e) => { e.currentTarget.style.background = selected ? agentColor + "10" : "transparent"; }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: selected ? agentColor + "25" : T.bg3, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon d="M12 2L2 7l10 5 10-5-10-5z M2 17l10 5 10-5 M2 12l10 5 10-5" color={selected ? agentColor : T.textDim} size={12} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.text, display: "flex", alignItems: "center", gap: 6 }}>
                    {agent.name}
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: agent.status === "green" ? T.green : T.textDim }} />
                  </div>
                  <div style={{ fontSize: 10, color: T.textMid, lineHeight: 1.3, marginTop: 1 }}>{agent.role}{agent.department ? ` · ${agent.department}` : ""}</div>
                </div>
                {selected ? <Icon d="M22 11.08V12a10 10 0 1 1-5.93-9.14 M22 4L12 14.01l-3-3" color={agentColor} size={14} /> : <div style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${T.border}` }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const EntryView = ({ entry, onBack, onUpdate, isLive = false }) => {
  const { simDate } = useSimDate();
  const { activeUser } = useBadge();
  const { isMobile } = useViewport();
  const [showPanel, setShowPanel] = useState(isLive);
  const [panelTab, setPanelTab] = useState(0);
  const [showExport, setShowExport] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(entry.title);
  const [activeAgentIds, setActiveAgentIds] = useState(() => allAgents.slice(0, 4).map(a => a.id));
  const titleInputRef = useRef(null);
  const panelTabs = ["Chat", "Private", "Agents"];

  // Lifted chat state — new meetings start blank, completed meetings load saved history
  const [teamMessages, setTeamMessages] = useState(entry.chatHistory?.team || []);
  const [privateMessages, setPrivateMessages] = useState(entry.chatHistory?.private || []);

  const [agentMessages, setAgentMessages] = useState([]);

  const handleTeamSend = useCallback((msg) => setTeamMessages(prev => [...prev, msg]), []);
  const handlePrivateSend = useCallback((msg) => setPrivateMessages(prev => [...prev, msg]), []);
  const handleAgentSend = useCallback((msg) => setAgentMessages(prev => [...prev, msg]), []);

  // AEI agent contribution monitors — one per conversation stream, only active during live meetings
  const agentContribEnabled = isLive && isAgentContribEnabled() && isLiveMode();
  const { interjections, dismissInterjection, contribError: teamContribError } = useMeetingMonitor({
    enabled: agentContribEnabled,
    messages: teamMessages,
    simDate,
    user: activeUser,
  });
  const { interjections: privateInterjections, dismissInterjection: dismissPrivateInterjection, contribError: privateContribError } = useMeetingMonitor({
    enabled: agentContribEnabled,
    messages: privateMessages,
    simDate,
    user: activeUser,
  });
  const { interjections: agentInterjections, dismissInterjection: dismissAgentInterjection, clearInterjections: clearAgentInterjections, contribError: agentContribError } = useMeetingMonitor({
    enabled: agentContribEnabled,
    messages: agentMessages,
    simDate,
    user: activeUser,
    fromFilter: "user",
  });

  const handleAgentReset = useCallback(() => {
    setAgentMessages([]);
    clearAgentInterjections();
  }, [clearAgentInterjections]);

  useEffect(() => {
    if (!isLive) return;
    const iv = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(iv);
  }, [isLive]);

  useEffect(() => {
    if (editingTitle && titleInputRef.current) { titleInputRef.current.focus(); titleInputRef.current.select(); }
  }, [editingTitle]);

  const commitTitle = () => {
    const trimmed = titleDraft.trim();
    if (trimmed && trimmed !== entry.title) onUpdate({ ...entry, title: trimmed });
    else setTitleDraft(entry.title);
    setEditingTitle(false);
  };

  const formatTime = (s) => `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const mm = entry.meetingMeta?.magicMinutes;
  const isMeeting = entry.type === "meeting";
  const meetingParticipants = entry.participants.map(getParticipant).filter(Boolean);
  const activeAgents = allAgents.filter(a => activeAgentIds.includes(a.id));

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 120px)", gap: 0 }}>
      {showExport && <ExportModal entry={entry} onClose={() => setShowExport(false)} />}

      {/* Top bar */}
      <div style={{ background: T.bg1, border: `1px solid ${T.border}`, borderRadius: isMobile ? 8 : 12, padding: isMobile ? "10px 14px" : "12px 20px", display: "flex", alignItems: "center", gap: isMobile ? 8 : 12, marginBottom: 12, flexShrink: 0, flexWrap: isMobile ? "wrap" : "nowrap" }}>
        <button onClick={onBack} style={{ background: "transparent", border: "none", cursor: "pointer", color: T.textDim, padding: 4, display: "flex" }} onMouseEnter={(e) => (e.currentTarget.style.color = C)} onMouseLeave={(e) => (e.currentTarget.style.color = T.textDim)}>
          <Icon d="M19 12H5M12 19l-7-7 7-7" color="currentColor" size={16} />
        </button>

        {isLive && (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: T.danger, boxShadow: `0 0 8px ${T.danger}60` }} />
            <span style={{ fontSize: 11, color: T.danger, fontWeight: 600 }}>REC</span>
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {editingTitle ? (
              <input ref={titleInputRef} value={titleDraft} onChange={(e) => setTitleDraft(e.target.value)}
                onBlur={commitTitle} onKeyDown={(e) => { if (e.key === "Enter") commitTitle(); if (e.key === "Escape") { setTitleDraft(entry.title); setEditingTitle(false); } }}
                style={{ fontSize: isMobile ? 14 : 16, fontWeight: 700, color: T.text, background: T.bg0, border: `1px solid ${C}`, borderRadius: 6, padding: "2px 8px", outline: "none", fontFamily: "inherit", width: "100%", maxWidth: 400 }} />
            ) : (
              <span onClick={() => setEditingTitle(true)} style={{ fontSize: isMobile ? 14 : 16, fontWeight: 700, color: T.text, cursor: "pointer", borderBottom: `1px dashed ${T.border}`, paddingBottom: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title="Click to edit title">{entry.title}</span>
            )}
            <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 4, background: (isMeeting ? C : T.purple) + "15", color: isMeeting ? C : T.purple, fontWeight: 700, textTransform: "uppercase", flexShrink: 0 }}>
              {isMeeting ? "MEETING" : "NOTE"}
            </span>
          </div>
          <div style={{ fontSize: 11, color: T.textDim, marginTop: 2 }}>
            {fmtDate(entry.date)} · {entry.time}
            {entry.meetingMeta && <> · {entry.meetingMeta.room} · {entry.meetingMeta.duration}</>}
          </div>
        </div>

        {isLive && <div style={{ fontFamily: "monospace", fontSize: isMobile ? 14 : 16, color: C, fontWeight: 600, letterSpacing: 1 }}>{formatTime(elapsed)}</div>}

        {!isMobile && meetingParticipants.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {meetingParticipants.slice(0, 5).map((p) => <Avatar key={p.id} person={p} size={28} />)}
            {meetingParticipants.length > 5 && <span style={{ fontSize: 10, color: T.textDim }}>+{meetingParticipants.length - 5}</span>}
          </div>
        )}

        {!isMobile && <InvitePicker selectedIds={entry.participants} onChange={(ids) => onUpdate({ ...entry, participants: ids })} accentColor={isMeeting ? C : T.purple} />}
        {!isMobile && <AgentSelector selectedAgentIds={activeAgentIds} onChange={setActiveAgentIds} accentColor={isMeeting ? C : T.purple} />}

        {!isMobile && agentContribEnabled && <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", background: T.teal + "15", borderRadius: 6, border: `1px solid ${T.teal}30` }}><div style={{ width: 6, height: 6, borderRadius: "50%", background: T.teal, boxShadow: `0 0 6px ${T.teal}` }} /><span style={{ fontSize: 10, color: T.teal, fontWeight: 600 }}>Agent Contribution</span></div>}

        {/* Toggle side panel */}
        <button onClick={() => setShowPanel(!showPanel)} style={{ background: showPanel ? C + "20" : T.bg3, border: `1px solid ${showPanel ? C + "40" : T.border}`, borderRadius: 8, padding: isMobile ? "8px 14px" : "6px 12px", color: showPanel ? C : T.textMid, fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, transition: "all .15s", minHeight: isMobile ? 44 : "auto" }}>
          <Icon d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" color="currentColor" size={12} />
          {showPanel ? "Hide Panel" : "Chat & Agents"}
        </button>

        {isLive && (
          <button onClick={onBack} style={{ background: T.danger + "20", border: `1px solid ${T.danger}40`, borderRadius: 8, padding: "8px 16px", color: T.danger, fontSize: 12, fontWeight: 600, cursor: "pointer", minHeight: isMobile ? 44 : "auto" }} onMouseEnter={(e) => { e.currentTarget.style.background = T.danger; e.currentTarget.style.color = "#fff"; }} onMouseLeave={(e) => { e.currentTarget.style.background = T.danger + "20"; e.currentTarget.style.color = T.danger; }}>End Session</button>
        )}
      </div>

      {/* Main content area */}
      <div style={{ flex: 1, display: "flex", gap: 12, minHeight: 0 }}>
        {/* Document (full-width or ~60% when panel open) */}
        <div style={{ flex: 1, background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? 14 : 20, display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Tags */}
            <div>
              <div style={{ fontSize: 10, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600, marginBottom: 6 }}>Tags</div>
              <TagPicker selectedTags={entry.tags} onChange={(tags) => onUpdate({ ...entry, tags })} accentColor={isMeeting ? C : T.purple} />
            </div>

            {/* Rich Text Editor */}
            <div>
              <div style={{ fontSize: 10, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600, marginBottom: 6 }}>Document</div>
              <RichTextEditor
                content={entry.content}
                onChange={(html) => onUpdate({ ...entry, content: html })}
                readOnly={entry.status === "completed" && !isLive}
                placeholder={isMeeting ? "Capture meeting notes, decisions, and context here..." : "Write your thoughts, ideas, and observations..."}
              />
            </div>

            {/* File Attachments */}
            <FileAttachments
              files={entry.attachments || []}
              onChange={(attachments) => onUpdate({ ...entry, attachments })}
              readOnly={entry.status === "completed" && !isLive}
            />

            {/* Meeting-specific: Recording & Transcript section */}
            {isMeeting && entry.meetingMeta?.hasRecording && mm && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ fontSize: 11, color: T.textDim, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                  <Icon d="M12 2L2 7l10 5 10-5-10-5z M2 17l10 5 10-5 M2 12l10 5 10-5" size={12} color={C} />
                  Magic Minutes
                </div>
                <div style={{ background: T.bg0, border: `1px solid ${T.border}`, borderRadius: 8, padding: isMobile ? 12 : 16 }}>
                  <p style={{ fontSize: 13, color: T.textMid, lineHeight: 1.55, margin: "0 0 14px" }}>{mm.summary}</p>
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 10, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600, marginBottom: 8 }}>Key Decisions</div>
                      {mm.keyDecisions.map((d, i) => (
                        <div key={i} style={{ display: "flex", gap: 8, fontSize: 12, color: T.text, lineHeight: 1.4, marginBottom: 6 }}>
                          <Icon d="M22 11.08V12a10 10 0 1 1-5.93-9.14 M22 4L12 14.01l-3-3" color={T.green} size={14} />{d}
                        </div>
                      ))}
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600, marginBottom: 8 }}>Action Items</div>
                      {mm.actionItems.map((a, i) => (
                        <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "4px 0", fontSize: 12, color: a.done ? T.textDim : T.text }}>
                          <input type="checkbox" checked={a.done} readOnly style={{ marginTop: 2, accentColor: C }} />
                          <div style={{ flex: 1, textDecoration: a.done ? "line-through" : "none" }}>
                            {a.task}
                            <div style={{ fontSize: 10, color: T.textDim, marginTop: 1 }}>{a.assignee} · Due {a.due.slice(5)}{!a.done && new Date(a.due) < new Date() && <span style={{ color: T.danger }}> · OVERDUE</span>}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Transcript */}
                {entry.meetingMeta.hasTranscript && entry.meetingMeta.transcript?.length > 0 && (
                  <>
                    <button onClick={() => setShowTranscript(!showTranscript)} style={{ background: "transparent", border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 14px", color: T.text, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, alignSelf: "flex-start" }} onMouseEnter={(e) => (e.currentTarget.style.borderColor = C)} onMouseLeave={(e) => (e.currentTarget.style.borderColor = T.border)}>
                      <Icon d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6" color={T.textMid} />
                      {showTranscript ? "Hide Transcript" : "View Full Transcript"}
                    </button>
                    {showTranscript && (
                      <div style={{ background: T.bg0, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                        {entry.meetingMeta.transcript.map((line, i) => (
                          <div key={i} style={{ padding: "6px 0", borderBottom: i < entry.meetingMeta.transcript.length - 1 ? `1px solid ${T.border}` : "none" }}>
                            <div style={{ display: "flex", gap: 8, marginBottom: 2 }}>
                              <span style={{ fontSize: 11, fontWeight: 600, color: C }}>{line.speaker}</span>
                              <span style={{ fontSize: 10, color: T.textDim }}>{line.time}</span>
                            </div>
                            <div style={{ fontSize: 12, color: T.text, lineHeight: 1.45 }}>{line.text}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* High Five summary (if exists) */}
            {entry.highFive && (
              <div>
                <div style={{ fontSize: 11, color: T.textDim, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                  <Icon d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" color={C} size={12} />
                  Summary
                </div>
                <div style={{ background: T.bg0, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                  {entry.highFive.bullets.map((bullet, i) => {
                    const isTherefore = bullet.toLowerCase().startsWith("therefore:");
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12, color: isTherefore ? C : T.textMid, lineHeight: 1.5, fontWeight: isTherefore ? 600 : 400, marginBottom: 4 }}>
                        <span style={{ flexShrink: 0, marginTop: 2 }}>{isTherefore ? "→" : "•"}</span>
                        <span>{bullet}</span>
                      </div>
                    );
                  })}
                  {entry.highFive.links?.length > 0 && (
                    <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                      {entry.highFive.links.map((link, i) => (
                        <span key={i} style={{ fontSize: 10, padding: "3px 8px", borderRadius: 4, background: T.blue + "12", color: T.blue, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                          <Icon d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" color={T.blue} size={9} />
                          {link.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Side panel (toggleable) — full-screen overlay on mobile */}
        {showPanel && (
          <div style={isMobile ? { position: "fixed", inset: 0, zIndex: 200, background: T.bg2, display: "flex", flexDirection: "column" } : { width: "38%", minWidth: 320, background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden", display: "flex", flexDirection: "column", transition: "all .2s" }}>
            <div style={{ borderBottom: `1px solid ${T.border}`, padding: isMobile ? "0 10px" : "0 12px", display: "flex", gap: 0, alignItems: "center" }}>
              {isMobile && (
                <button onClick={() => setShowPanel(false)} style={{ background: "transparent", border: "none", color: T.textDim, cursor: "pointer", padding: "12px 8px 12px 0", display: "flex", fontSize: 20, lineHeight: 1 }}>&times;</button>
              )}
              {panelTabs.map((tab, i) => (
                <button key={tab} onClick={() => setPanelTab(i)} style={{ padding: isMobile ? "12px 12px" : "12px 16px", background: "transparent", border: "none", borderBottom: panelTab === i ? `2px solid ${i === 1 ? T.purple : C}` : "2px solid transparent", color: panelTab === i ? T.text : T.textDim, fontSize: 12, fontWeight: panelTab === i ? 600 : 400, cursor: "pointer", transition: "all .15s", display: "flex", alignItems: "center", gap: 6 }}>
                  {i === 1 && <Icon d="M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z M7 11V7a5 5 0 0 1 10 0v4" color={panelTab === 1 ? T.purple : T.textDim} size={10} />}
                  {tab}
                </button>
              ))}
            </div>
            <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
              {panelTab === 0 && <ChatPanel messages={teamMessages} onSend={handleTeamSend} interjections={interjections} onDismissInterjection={dismissInterjection} agentContribActive={agentContribEnabled} contribError={teamContribError} />}
              {panelTab === 1 && <ChatPanel messages={privateMessages} onSend={handlePrivateSend} isPrivate interjections={privateInterjections} onDismissInterjection={dismissPrivateInterjection} agentContribActive={agentContribEnabled} contribError={privateContribError} />}
              {panelTab === 2 && <AgentPanel entry={entry} agents={activeAgents} messages={agentMessages} onSend={handleAgentSend} onReset={handleAgentReset} interjections={agentInterjections} onDismissInterjection={dismissAgentInterjection} agentContribActive={agentContribEnabled} contribError={agentContribError} />}
            </div>
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div style={{ display: "flex", gap: 10, marginTop: 12, justifyContent: "flex-end", flexShrink: 0 }}>
        <button onClick={() => setShowExport(true)} style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 16px", color: T.textMid, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, transition: "all .15s" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = C; e.currentTarget.style.color = T.text; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textMid; }}>
          <Icon d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3" color="currentColor" />Export
        </button>
        <button onClick={onBack} style={{ background: C, border: "none", borderRadius: 8, padding: "8px 20px", color: "#1A1A1A", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          {isLive ? "Save & Close" : "Back to Journal"}
        </button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
//  MAIN JOURNAL VIEW EXPORT
// ═══════════════════════════════════════════════════════════════════
export const JournalView = () => {
  const { simDate } = useSimDate();
  const [mode, setMode] = useState("feed"); // feed | entry | liveSession
  const [entries, setEntries] = useState(initialEntries);
  const [activeEntry, setActiveEntry] = useState(null);

  const handleOpenEntry = (entry) => {
    setActiveEntry(entry);
    if (entry.status === "upcoming" || entry.status === "live") {
      // Start a live session for upcoming/live meetings
      const updated = { ...entry, status: "live" };
      setEntries(entries.map(e => e.id === entry.id ? updated : e));
      setActiveEntry(updated);
      setMode("liveSession");
    } else {
      setMode("entry");
    }
  };

  const handleNewEntry = () => {
    const ts = new Date();
    const newEntry = {
      id: `j-new-${Date.now()}`,
      type: "freeform",
      title: "Untitled Entry",
      date: ts.toISOString().slice(0, 10),
      time: ts.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      status: "draft",
      participants: [],
      content: "",
      tags: [],
      attachments: [],
      pinned: false,
      createdAt: ts.toISOString(),
      updatedAt: ts.toISOString(),
      meetingMeta: null,
      chatHistory: { team: [], private: [] },
      highFive: null,
    };
    setEntries([newEntry, ...entries]);
    setActiveEntry(newEntry);
    setMode("entry");
  };

  const handleStartMeeting = () => {
    const ts = new Date();
    const newMeeting = {
      id: `j-live-${Date.now()}`,
      type: "meeting",
      title: "Ad-hoc Meeting",
      date: ts.toISOString().slice(0, 10),
      time: ts.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      status: "live",
      participants: ["thomas"],
      content: "",
      tags: [],
      attachments: [],
      pinned: false,
      createdAt: ts.toISOString(),
      updatedAt: ts.toISOString(),
      meetingMeta: {
        room: "External",
        duration: "—",
        recurring: false,
        roamLink: null,
        hasRecording: false,
        hasTranscript: false,
        transcript: [],
        agenda: [],
        magicMinutes: null,
      },
      chatHistory: { team: [], private: [] },
      highFive: null,
    };
    setEntries([newMeeting, ...entries]);
    setActiveEntry(newMeeting);
    setMode("liveSession");
  };

  const handleUpdateEntry = (updated) => {
    setEntries(entries.map(e => e.id === updated.id ? { ...updated, updatedAt: new Date().toISOString() } : e));
    setActiveEntry(updated);
  };

  const handleBack = () => {
    // If ending a live session, mark as completed
    if (mode === "liveSession" && activeEntry) {
      const completed = { ...activeEntry, status: "completed" };
      setEntries(entries.map(e => e.id === activeEntry.id ? completed : e));
    }
    setActiveEntry(null);
    setMode("feed");
  };

  if ((mode === "entry" || mode === "liveSession") && activeEntry) {
    return (
      <EntryView
        entry={activeEntry}
        onBack={handleBack}
        onUpdate={handleUpdateEntry}
        isLive={mode === "liveSession"}
      />
    );
  }

  return <FeedView entries={entries} onOpenEntry={handleOpenEntry} onNewEntry={handleNewEntry} onStartMeeting={handleStartMeeting} simDate={simDate} />;
};
