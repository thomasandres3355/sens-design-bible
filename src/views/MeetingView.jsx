import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { T } from "../data/theme";
import { Card } from "../components/ui";
import { KpiCard } from "../components/ui";
import {
  participants, meetingAgents, upcomingMeetings, pastMeetings,
  notesArchive, sampleTeamChat, samplePrivateChat, meetingKpis,
  meetingTemplates, analyticsData, allActionItems, prepBriefings,
  meetingRisks, calendarMeetings, highFives, notepadEntries, tagRegistry,
  buildMeetingAgentDirectory,
} from "../data/meetingData";
import { getRoamStatus } from "../data/roamService";
import { useSimDate } from "../contexts/SimDateContext";
import { useBadge } from "../contexts/BadgeContext";
import { isLiveMode, askAgent, buildDataContext } from "../services/claudeService";
import { getAgentDirectory } from "../data/vpData";
import { containsFactualClaim, checkFacts, isAgentContribEnabled, getAgentContribInterval, getAgentContribSensitivity } from "../services/factCheckService";
import { useViewport } from "../hooks/useViewport";
import { VoiceDictationButton } from "../components/ui/VoiceDictationButton";

const C = T.accent;

// ─── Shared Helpers ───────────────────────────────────────────────
const getParticipant = (id) => participants.find((p) => p.id === id);
const fmtDate = (d) => new Date(d + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
const fmtDateShort = (d) => new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });

const Icon = ({ d, size = 14, color = C, sw = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
);

const Avatar = ({ person, size = 28 }) => (
  <div title={person?.name || "Unknown"} style={{ width: size, height: size, borderRadius: "50%", background: (person?.color || T.textDim) + "30", border: `2px solid ${person?.color || T.textDim}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.36, fontWeight: 700, color: person?.color || T.textDim, flexShrink: 0 }}>
    {person?.initials || "?"}
  </div>
);

const ParticipantRow = ({ ids, max = 5 }) => {
  const people = ids.map(getParticipant).filter(Boolean);
  const shown = people.slice(0, max);
  const extra = people.length - max;
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {shown.map((p, i) => (<div key={p.id} style={{ marginLeft: i > 0 ? -6 : 0, zIndex: max - i }}><Avatar person={p} size={24} /></div>))}
      {extra > 0 && <span style={{ fontSize: 11, color: T.textDim, marginLeft: 6 }}>+{extra}</span>}
    </div>
  );
};

const Pill = ({ children, color = C, active, onClick }) => (
  <button onClick={onClick} style={{ padding: "5px 14px", borderRadius: 20, border: `1px solid ${active ? color : T.border}`, background: active ? color + "20" : "transparent", color: active ? T.text : T.textMid, fontSize: 11, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", transition: "all .15s" }}>{children}</button>
);

const SeverityDot = ({ severity }) => {
  const colors = { red: T.danger, yellow: T.warn, green: T.green };
  return <div style={{ width: 8, height: 8, borderRadius: "50%", background: colors[severity] || T.textDim, flexShrink: 0 }} />;
};

// ─── Tag Picker — reusable tag selection + inline create ─────────
const getTagObj = (name) => tagRegistry.find(t => t.name === name);

const TagPicker = ({ selectedTags = [], onChange, accentColor = C }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [newTagName, setNewTagName] = useState("");
  const pickerRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (pickerRef.current && !pickerRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const categories = useMemo(() => {
    const cats = {};
    tagRegistry.forEach(t => { if (!cats[t.category]) cats[t.category] = []; cats[t.category].push(t); });
    return cats;
  }, []);

  const filteredCategories = useMemo(() => {
    if (!search) return categories;
    const q = search.toLowerCase();
    const result = {};
    Object.entries(categories).forEach(([cat, tags]) => {
      const matches = tags.filter(t => t.name.includes(q) || t.description.toLowerCase().includes(q) || cat.toLowerCase().includes(q));
      if (matches.length > 0) result[cat] = matches;
    });
    return result;
  }, [categories, search]);

  const toggle = (tagName) => {
    if (selectedTags.includes(tagName)) onChange(selectedTags.filter(t => t !== tagName));
    else onChange([...selectedTags, tagName]);
  };

  const addCustomTag = () => {
    const name = newTagName.trim().toLowerCase().replace(/\s+/g, "-");
    if (!name || selectedTags.includes(name)) return;
    onChange([...selectedTags, name]);
    setNewTagName("");
  };

  return (
    <div ref={pickerRef} style={{ position: "relative" }}>
      {/* Selected tags display + trigger */}
      <div onClick={() => setOpen(!open)} style={{ display: "flex", flexWrap: "wrap", gap: 4, padding: "6px 10px", minHeight: 36, background: T.bg0, border: `1px solid ${open ? accentColor : T.border}`, borderRadius: 8, cursor: "pointer", alignItems: "center", transition: "border-color .15s" }}>
        {selectedTags.length === 0 && <span style={{ fontSize: 12, color: T.textDim }}>Click to add tags...</span>}
        {selectedTags.map(tagName => {
          const obj = getTagObj(tagName);
          const color = obj?.color || accentColor;
          return (
            <span key={tagName} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, padding: "2px 8px", borderRadius: 4, background: color + "15", color: color, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />
              {tagName}
              <button onClick={(e) => { e.stopPropagation(); toggle(tagName); }} style={{ background: "transparent", border: "none", color: color, cursor: "pointer", fontSize: 12, padding: 0, marginLeft: 2, lineHeight: 1 }}>&times;</button>
            </span>
          );
        })}
        <Icon d={open ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"} size={12} color={T.textDim} />
      </div>

      {/* Dropdown */}
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 50, background: T.bg1, border: `1px solid ${T.border}`, borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.4)", maxHeight: 320, overflowY: "auto", padding: 8 }}>
          {/* Search */}
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tags..." autoFocus style={{ width: "100%", background: T.bg0, border: `1px solid ${T.border}`, borderRadius: 6, padding: "6px 10px", color: T.text, fontSize: 11, outline: "none", fontFamily: "inherit", marginBottom: 6, boxSizing: "border-box" }} onFocus={(e) => (e.currentTarget.style.borderColor = accentColor)} onBlur={(e) => (e.currentTarget.style.borderColor = T.border)} />

          {/* Tag categories */}
          {Object.entries(filteredCategories).map(([cat, tags]) => (
            <div key={cat} style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 9, color: T.textDim, textTransform: "uppercase", letterSpacing: 1, fontWeight: 700, padding: "4px 6px" }}>{cat}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 3, padding: "0 4px" }}>
                {tags.map(tag => {
                  const active = selectedTags.includes(tag.name);
                  return (
                    <button key={tag.id} onClick={() => toggle(tag.name)} title={tag.description} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, padding: "3px 8px", borderRadius: 4, border: `1px solid ${active ? tag.color : "transparent"}`, background: active ? tag.color + "20" : T.bg2, color: active ? tag.color : T.textMid, fontWeight: active ? 700 : 500, cursor: "pointer", transition: "all .1s" }} onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = tag.color + "10"; e.currentTarget.style.color = tag.color; } }} onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = T.bg2; e.currentTarget.style.color = T.textMid; } }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: tag.color, flexShrink: 0 }} />
                      {tag.name}
                      {active && <span style={{ fontSize: 10 }}>✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Create custom tag */}
          <div style={{ borderTop: `1px solid ${T.border}`, marginTop: 4, paddingTop: 6, display: "flex", gap: 6, alignItems: "center" }}>
            <Icon d="M12 5v14M5 12h14" size={10} color={T.textDim} />
            <input value={newTagName} onChange={(e) => setNewTagName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addCustomTag(); }} placeholder="Create new tag..." style={{ flex: 1, background: T.bg0, border: `1px solid ${T.border}`, borderRadius: 4, padding: "4px 8px", color: T.text, fontSize: 10, outline: "none", fontFamily: "inherit" }} />
            {newTagName.trim() && (
              <button onClick={addCustomTag} style={{ background: accentColor, border: "none", borderRadius: 4, padding: "3px 10px", color: "#1A1A1A", fontSize: 10, fontWeight: 600, cursor: "pointer" }}>Add</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Link Insert Modal ───────────────────────────────────────────
const LinkModal = ({ onInsert, onClose }) => {
  const [url, setUrl] = useState("https://");
  const [text, setText] = useState("");
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);
  const handleInsert = () => { if (!url.trim() || url.trim() === "https://") return; onInsert(url.trim(), text.trim() || url.trim()); onClose(); };
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: T.bg1, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24, width: 400, boxShadow: "0 12px 40px rgba(0,0,0,0.5)" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <Icon d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71 M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" color={C} size={16} />Insert Hyperlink
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div><div style={{ fontSize: 10, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600, marginBottom: 4 }}>Display Text</div>
          <input ref={inputRef} value={text} onChange={(e) => setText(e.target.value)} placeholder="Link text (optional)" style={{ width: "100%", background: T.bg0, border: `1px solid ${T.border}`, borderRadius: 6, padding: "8px 12px", color: T.text, fontSize: 12, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} onFocus={(e) => (e.currentTarget.style.borderColor = C)} onBlur={(e) => (e.currentTarget.style.borderColor = T.border)} /></div>
          <div><div style={{ fontSize: 10, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600, marginBottom: 4 }}>URL</div>
          <input value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleInsert(); }} placeholder="https://..." style={{ width: "100%", background: T.bg0, border: `1px solid ${T.border}`, borderRadius: 6, padding: "8px 12px", color: T.text, fontSize: 12, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} onFocus={(e) => (e.currentTarget.style.borderColor = C)} onBlur={(e) => (e.currentTarget.style.borderColor = T.border)} /></div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
            <button onClick={onClose} style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 6, padding: "6px 14px", color: T.textMid, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
            <button onClick={handleInsert} style={{ background: C, border: "none", borderRadius: 6, padding: "6px 18px", color: "#1A1A1A", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Insert Link</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Rich Text Toolbar ───────────────────────────────────────────
const RichTextToolbar = ({ editorRef, onLinkClick, readOnly = false }) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const colorRef = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (colorRef.current && !colorRef.current.contains(e.target)) setShowColorPicker(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const exec = useCallback((cmd, value = null) => { if (readOnly) return; editorRef.current?.focus(); document.execCommand(cmd, false, value); }, [editorRef, readOnly]);

  const textColors = [
    { label: "Default", value: T.text }, { label: "Accent", value: C }, { label: "Green", value: T.green },
    { label: "Blue", value: T.blue }, { label: "Purple", value: T.purple }, { label: "Teal", value: T.teal },
    { label: "Warning", value: T.warn }, { label: "Danger", value: T.danger }, { label: "Dim", value: T.textDim },
  ];

  const ToolBtn = ({ icon, cmd, value, title, active, onClick }) => (
    <button onClick={(e) => { e.preventDefault(); onClick ? onClick() : exec(cmd, value); }} title={title} style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: active ? C + "20" : "transparent", border: active ? `1px solid ${C}40` : "1px solid transparent", borderRadius: 4, cursor: readOnly ? "default" : "pointer", opacity: readOnly ? 0.4 : 1, transition: "all .1s" }}
      onMouseEnter={(e) => { if (!readOnly) e.currentTarget.style.background = C + "15"; }} onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}>
      <Icon d={icon} size={13} color={active ? C : T.textMid} />
    </button>
  );
  const Div = () => <div style={{ width: 1, height: 20, background: T.border, margin: "0 4px", flexShrink: 0 }} />;
  if (readOnly) return null;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2, padding: "6px 10px", background: T.bg2, borderBottom: `1px solid ${T.border}`, borderRadius: "10px 10px 0 0", flexWrap: "wrap" }}>
      <ToolBtn icon="M3 7v6h6 M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6.69 3L3 13" cmd="undo" title="Undo" />
      <ToolBtn icon="M21 7v6h-6 M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6.69 3L21 13" cmd="redo" title="Redo" />
      <Div />
      <ToolBtn icon="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" cmd="bold" title="Bold (Ctrl+B)" />
      <ToolBtn icon="M19 4h-9 M14 20H5 M15 4L9 20" cmd="italic" title="Italic (Ctrl+I)" />
      <ToolBtn icon="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3 M4 21h16" cmd="underline" title="Underline (Ctrl+U)" />
      <ToolBtn icon="M16 4H9a3 3 0 0 0 0 6h6a3 3 0 0 1 0 6H8 M4 12h16" cmd="strikeThrough" title="Strikethrough" />
      <Div />
      <select onChange={(e) => exec("fontSize", e.target.value)} defaultValue="3" style={{ background: T.bg0, border: `1px solid ${T.border}`, borderRadius: 4, padding: "2px 4px", color: T.text, fontSize: 10, outline: "none", fontFamily: "inherit", cursor: "pointer", height: 28 }} title="Font Size">
        <option value="1">XS</option><option value="2">Small</option><option value="3">Normal</option><option value="4">Medium</option><option value="5">Large</option><option value="6">XL</option><option value="7">XXL</option>
      </select>
      <Div />
      <ToolBtn icon="M4 12h8 M4 18V6 M12 18V6" title="Heading" onClick={() => exec("formatBlock", "<h3>")} />
      <ToolBtn icon="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v4z" cmd="formatBlock" value="<blockquote>" title="Block Quote" />
      <Div />
      <div ref={colorRef} style={{ position: "relative" }}>
        <button onClick={() => setShowColorPicker(!showColorPicker)} title="Text Color" style={{ width: 28, height: 28, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, background: showColorPicker ? C + "15" : "transparent", border: "1px solid transparent", borderRadius: 4, cursor: "pointer" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: T.text, lineHeight: 1 }}>A</span>
          <span style={{ width: 14, height: 3, borderRadius: 1, background: `linear-gradient(90deg, ${T.danger}, ${C}, ${T.blue}, ${T.green})` }} />
        </button>
        {showColorPicker && (
          <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 60, background: T.bg1, border: `1px solid ${T.border}`, borderRadius: 8, padding: 8, boxShadow: "0 8px 20px rgba(0,0,0,0.4)", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4, minWidth: 120 }}>
            {textColors.map(c => (
              <button key={c.value} onClick={() => { exec("foreColor", c.value); setShowColorPicker(false); }} title={c.label} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 6px", background: "transparent", border: `1px solid ${T.border}`, borderRadius: 4, cursor: "pointer", fontSize: 9, color: T.textMid }}
                onMouseEnter={(e) => (e.currentTarget.style.background = c.value + "15")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: c.value, flexShrink: 0, border: `1px solid ${T.border}` }} />{c.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <Div />
      <ToolBtn icon="M8 6h13 M8 12h13 M8 18h13 M3 6h.01 M3 12h.01 M3 18h.01" cmd="insertUnorderedList" title="Bullet List" />
      <ToolBtn icon="M10 6h11 M10 12h11 M10 18h11 M4 6h1v4 M4 10h2 M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" cmd="insertOrderedList" title="Numbered List" />
      <ToolBtn icon="M3 8h18 M3 12h18 M3 16h18 M7 4L3 8l4 4" cmd="indent" title="Indent" />
      <ToolBtn icon="M3 8h18 M3 12h18 M3 16h18 M7 4l4 4-4 4" cmd="outdent" title="Outdent" />
      <Div />
      <ToolBtn icon="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71 M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" title="Insert Link" onClick={onLinkClick} />
      <ToolBtn icon="M5 12h14" title="Horizontal Rule" onClick={() => exec("insertHorizontalRule")} />
      <Div />
      <ToolBtn icon="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7 M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" cmd="removeFormat" title="Clear Formatting" />
    </div>
  );
};

// ─── Rich Text Editor (Toolbar + contentEditable) ────────────────
const RichTextEditor = ({ content, onChange, readOnly = false, placeholder = "Start writing..." }) => {
  const editorRef = useRef(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const savedSelection = useRef(null);
  const initialized = useRef(false);

  const lastContentId = useRef(null);
  useEffect(() => {
    if (editorRef.current && content !== undefined) {
      // Initialize on first render or when content identity changes (switching notes)
      const contentId = content?.slice(0, 80) || "";
      if (!initialized.current || (lastContentId.current !== null && lastContentId.current !== contentId && editorRef.current.innerHTML !== content)) {
        editorRef.current.innerHTML = content || "";
        initialized.current = true;
        lastContentId.current = contentId;
      } else if (!initialized.current) {
        lastContentId.current = contentId;
      }
    }
  }, [content]);
  const handleInput = useCallback(() => { if (editorRef.current) onChange(editorRef.current.innerHTML); }, [onChange]);
  const handleKeyDown = useCallback((e) => { if (e.key === "Tab") { e.preventDefault(); document.execCommand(e.shiftKey ? "outdent" : "indent", false, null); } }, []);
  const saveSelection = () => { const sel = window.getSelection(); if (sel.rangeCount > 0) savedSelection.current = sel.getRangeAt(0).cloneRange(); };
  const restoreSelection = () => { if (savedSelection.current) { const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(savedSelection.current); } };
  const handleLinkInsert = (url, text) => { editorRef.current?.focus(); restoreSelection(); document.execCommand("insertHTML", false, `<a href="${url}" target="_blank" rel="noopener" style="color:${C};text-decoration:underline;cursor:pointer">${text}</a>`); handleInput(); };
  const handleLinkClick = () => { saveSelection(); setShowLinkModal(true); };

  return (
    <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden", transition: "border-color .15s" }}
      onFocus={(e) => { if (!readOnly) e.currentTarget.style.borderColor = T.purple; }} onBlur={(e) => (e.currentTarget.style.borderColor = T.border)}>
      <RichTextToolbar editorRef={editorRef} onLinkClick={handleLinkClick} readOnly={readOnly} />
      <div ref={editorRef} contentEditable={!readOnly} onInput={handleInput} onKeyDown={handleKeyDown} suppressContentEditableWarning
        data-placeholder={placeholder}
        style={{ minHeight: 350, padding: 20, color: T.text, fontSize: 13, lineHeight: 1.7, fontFamily: "'DM Sans', sans-serif", outline: "none", background: T.bg1, overflowY: "auto", maxHeight: 600, wordBreak: "break-word", ...(readOnly ? { opacity: 0.85, cursor: "default" } : {}) }} />
      {showLinkModal && <LinkModal onInsert={handleLinkInsert} onClose={() => setShowLinkModal(false)} />}
      <style>{`
        [data-placeholder]:empty::before { content: attr(data-placeholder); color: ${T.textDim}; font-style: italic; pointer-events: none; }
        [contenteditable] h3 { font-size: 16px; font-weight: 700; color: ${T.text}; margin: 16px 0 8px; }
        [contenteditable] blockquote { border-left: 3px solid ${C}; margin: 8px 0; padding: 6px 16px; color: ${T.textMid}; background: ${C}08; border-radius: 0 6px 6px 0; }
        [contenteditable] ul, [contenteditable] ol { padding-left: 24px; margin: 8px 0; }
        [contenteditable] li { margin: 4px 0; }
        [contenteditable] hr { border: none; border-top: 1px solid ${T.border}; margin: 16px 0; }
        [contenteditable] a { color: ${C}; text-decoration: underline; }
      `}</style>
    </div>
  );
};

// ─── File Attachments — upload & track files per note ────────────
const FileAttachments = ({ files = [], onChange, readOnly = false }) => {
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const fileTypeColors = { pdf: T.danger, doc: T.blue, docx: T.blue, xls: T.green, xlsx: T.green, ppt: C, pptx: C, png: T.purple, jpg: T.purple, jpeg: T.purple, csv: T.teal, txt: T.textMid, zip: T.warn };
  const getFileColor = (name) => fileTypeColors[name.split(".").pop().toLowerCase()] || T.textDim;
  const getFileExt = (name) => name.split(".").pop().toUpperCase();
  const fmtSize = (b) => b < 1024 ? b + " B" : b < 1048576 ? (b / 1024).toFixed(1) + " KB" : (b / 1048576).toFixed(1) + " MB";

  const addFiles = (newFiles) => {
    const additions = Array.from(newFiles).map(f => ({ id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, name: f.name, size: f.size, type: f.type, uploadedAt: new Date().toISOString(), url: URL.createObjectURL(f) }));
    onChange([...files, ...additions]);
  };
  const removeFile = (fileId) => onChange(files.filter(f => f.id !== fileId));
  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); if (!readOnly && e.dataTransfer.files?.length) addFiles(e.dataTransfer.files); };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 11, color: T.textDim, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
          <Icon d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" color={T.textDim} size={12} />Attachments ({files.length})
        </div>
        {!readOnly && (
          <button onClick={() => fileInputRef.current?.click()} style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 6, padding: "4px 12px", color: T.textMid, fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontFamily: "inherit" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = C; e.currentTarget.style.color = C; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textMid; }}>
            <Icon d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M12 18v-6 M9 15h6" color="currentColor" size={11} />Upload File
          </button>
        )}
        <input ref={fileInputRef} type="file" multiple hidden onChange={(e) => { if (e.target.files?.length) addFiles(e.target.files); e.target.value = ""; }} />
      </div>
      {(!files.length || dragOver) && !readOnly && (
        <div onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()}
          style={{ border: `2px dashed ${dragOver ? C : T.border}`, borderRadius: 10, padding: "20px 16px", textAlign: "center", cursor: "pointer", background: dragOver ? C + "08" : "transparent", transition: "all .15s" }}>
          <Icon d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M12 18v-6 M9 15h6" color={dragOver ? C : T.textDim} size={22} />
          <div style={{ fontSize: 11, color: dragOver ? C : T.textDim, marginTop: 6 }}>{dragOver ? "Drop files here" : "Drag & drop files or click to browse"}</div>
          <div style={{ fontSize: 9, color: T.textDim, marginTop: 3 }}>PDF, DOCX, XLSX, images, and more</div>
        </div>
      )}
      {files.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {files.map(file => { const color = getFileColor(file.name); return (
            <div key={file.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 6, borderLeft: `3px solid ${color}` }}>
              <div style={{ width: 32, height: 32, borderRadius: 6, background: color + "15", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: 8, fontWeight: 800, color: color, letterSpacing: 0.3 }}>{getFileExt(file.name)}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</div>
                <div style={{ fontSize: 10, color: T.textDim }}>{fmtSize(file.size)} · {new Date(file.uploadedAt).toLocaleDateString()}</div>
              </div>
              <a href={file.url} download={file.name} title="Download" style={{ display: "flex", padding: 4, color: T.textDim, textDecoration: "none" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = C)} onMouseLeave={(e) => (e.currentTarget.style.color = T.textDim)}>
                <Icon d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3" color="currentColor" size={13} />
              </a>
              {!readOnly && (
                <button onClick={() => removeFile(file.id)} style={{ background: "transparent", border: "none", padding: 4, color: T.textDim, cursor: "pointer" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = T.danger)} onMouseLeave={(e) => (e.currentTarget.style.color = T.textDim)}>
                  <Icon d="M3 6h18 M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" color="currentColor" size={13} />
                </button>
              )}
            </div>
          ); })}
        </div>
      )}
    </div>
  );
};

// ─── Files View — all files across all notes (3rd Journal tab) ───
const FilesView = ({ notes }) => {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const fileTypeColors = { pdf: T.danger, doc: T.blue, docx: T.blue, xls: T.green, xlsx: T.green, ppt: C, pptx: C, png: T.purple, jpg: T.purple, jpeg: T.purple, csv: T.teal, txt: T.textMid, zip: T.warn };
  const getFileColor = (name) => fileTypeColors[name.split(".").pop().toLowerCase()] || T.textDim;
  const fmtSize = (b) => b < 1024 ? b + " B" : b < 1048576 ? (b / 1024).toFixed(1) + " KB" : (b / 1048576).toFixed(1) + " MB";

  const allFiles = useMemo(() => {
    const result = [];
    notes.forEach(note => { (note.attachments || []).forEach(file => { result.push({ ...file, noteId: note.id, noteTitle: note.title, noteDate: note.date, noteTags: note.tags }); }); });
    return result.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
  }, [notes]);
  const fileTypes = useMemo(() => { const t = {}; allFiles.forEach(f => { const ext = f.name.split(".").pop().toLowerCase(); t[ext] = (t[ext] || 0) + 1; }); return t; }, [allFiles]);
  const filtered = useMemo(() => {
    let items = allFiles;
    if (filterType !== "all") items = items.filter(f => f.name.toLowerCase().endsWith(`.${filterType}`));
    if (search) { const q = search.toLowerCase(); items = items.filter(f => f.name.toLowerCase().includes(q) || f.noteTitle.toLowerCase().includes(q)); }
    return items;
  }, [allFiles, filterType, search]);
  const totalSize = allFiles.reduce((sum, f) => sum + (f.size || 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ fontSize: 13, color: T.textMid, lineHeight: 1.5 }}>All files attached across your notes — searchable, filterable, downloadable.</div>
      <div style={{ display: "grid", gridTemplateColumns: window.innerWidth < 768 ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: 12 }}>
        <KpiCard label="Total Files" value={allFiles.length} sub="across all notes" color={C} />
        <KpiCard label="File Types" value={Object.keys(fileTypes).length} sub="unique formats" color={T.purple} />
        <KpiCard label="Total Size" value={fmtSize(totalSize)} color={T.blue} />
        <KpiCard label="Notes w/ Files" value={notes.filter(n => n.attachments?.length > 0).length} sub={`of ${notes.length} notes`} color={T.green} />
      </div>
      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
        <Pill active={filterType === "all"} color={C} onClick={() => setFilterType("all")}>All</Pill>
        {Object.entries(fileTypes).sort((a, b) => b[1] - a[1]).map(([ext, count]) => (
          <Pill key={ext} active={filterType === ext} color={C} onClick={() => setFilterType(ext)}>{ext.toUpperCase()} ({count})</Pill>
        ))}
        <div style={{ flex: 1 }} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search files..." style={{ background: T.bg0, border: `1px solid ${T.border}`, borderRadius: 6, padding: "6px 12px", color: T.text, fontSize: 12, outline: "none", width: 180, fontFamily: "inherit" }} onFocus={(e) => (e.currentTarget.style.borderColor = C)} onBlur={(e) => (e.currentTarget.style.borderColor = T.border)} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {filtered.map(file => { const color = getFileColor(file.name); const ext = file.name.split(".").pop().toUpperCase(); return (
          <div key={file.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 8, borderLeft: `3px solid ${color}`, transition: "all .15s" }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = color + "40")} onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.borderLeftColor = color; }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: color + "15", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontSize: 9, fontWeight: 800, color: color, letterSpacing: 0.3 }}>{ext}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</div>
              <div style={{ fontSize: 11, color: T.textDim, display: "flex", gap: 8, alignItems: "center", marginTop: 2 }}>
                <span>{fmtSize(file.size)}</span><span>·</span><span>from: {file.noteTitle}</span><span>·</span><span>{new Date(file.uploadedAt).toLocaleDateString()}</span>
              </div>
            </div>
            {file.noteTags?.length > 0 && (
              <div style={{ display: "flex", gap: 3, flexWrap: "wrap", maxWidth: 200 }}>
                {file.noteTags.slice(0, 3).map(tag => { const obj = getTagObj(tag); const tagColor = obj?.color || T.purple; return <span key={tag} style={{ fontSize: 8, padding: "1px 5px", borderRadius: 3, background: tagColor + "12", color: tagColor, fontWeight: 600, textTransform: "uppercase" }}>{tag}</span>; })}
              </div>
            )}
            <a href={file.url} download={file.name} title="Download" style={{ display: "flex", padding: 6, color: T.textDim, textDecoration: "none", borderRadius: 4, background: T.bg3, border: `1px solid ${T.border}` }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = C; e.currentTarget.style.color = C; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textDim; }}>
              <Icon d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3" color="currentColor" size={14} />
            </a>
          </div>
        ); })}
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: 40, color: T.textDim }}>
            <Icon d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" color={T.textDim} size={28} />
            <div style={{ fontSize: 12, marginTop: 8 }}>{allFiles.length === 0 ? "No files uploaded yet. Attach files to your notes to see them here." : "No files match the current filter."}</div>
          </div>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
//  NOTES EDITOR (Left panel of Active Meeting)
// ═══════════════════════════════════════════════════════════════════
const NotesEditor = ({ meeting, templateSections }) => {
  const sections = [
    { key: "agenda", label: "Agenda", icon: "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2 M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z" },
    { key: "discussion", label: "Discussion", icon: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" },
    { key: "decisions", label: "Decisions", icon: "M22 11.08V12a10 10 0 1 1-5.93-9.14 M22 4L12 14.01l-3-3" },
    { key: "actionItems", label: "Action Items", icon: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M12 6v6l4 2" },
    { key: "takeaways", label: "Key Takeaways", icon: "M12 2L2 7l10 5 10-5-10-5z M2 17l10 5 10-5 M2 12l10 5 10-5" },
  ];

  const initAgenda = templateSections?.agenda || meeting?.agenda || [];
  const [expanded, setExpanded] = useState({ agenda: true, discussion: true, decisions: true, actionItems: true, takeaways: true });
  const [items, setItems] = useState({
    agenda: initAgenda.map((a, i) => ({ id: i, text: a, done: false })),
    discussion: (templateSections?.discussion || []).map((a, i) => ({ id: 100 + i, text: a, done: false })),
    decisions: [], actionItems: [], takeaways: [],
  });
  const [editingSection, setEditingSection] = useState(null);
  const [newItemText, setNewItemText] = useState("");
  const inputRef = useRef(null);

  useEffect(() => { if (editingSection && inputRef.current) inputRef.current.focus(); }, [editingSection]);

  const addItem = (sectionKey) => {
    if (!newItemText.trim()) return;
    const ts = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    setItems((prev) => ({ ...prev, [sectionKey]: [...prev[sectionKey], { id: Date.now(), text: newItemText.trim(), done: false, time: ts }] }));
    setNewItemText(""); setEditingSection(null);
  };
  const toggleItem = (sectionKey, itemId) => { setItems((prev) => ({ ...prev, [sectionKey]: prev[sectionKey].map((it) => (it.id === itemId ? { ...it, done: !it.done } : it)) })); };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, height: "100%", overflowY: "auto", paddingRight: 4 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <div style={{ fontSize: 11, color: T.textDim, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>Meeting Notes</div>
        <VoiceDictationButton compact onTranscript={(text) => {
          setItems((prev) => ({ ...prev, discussion: [...prev.discussion, { id: Date.now(), text, done: false, time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) }] }));
          setExpanded((e) => ({ ...e, discussion: true }));
        }} />
      </div>
      {sections.map((sec) => (
        <div key={sec.key} style={{ background: T.bg1, border: `1px solid ${T.border}`, borderRadius: 8, overflow: "hidden" }}>
          <button onClick={() => setExpanded((e) => ({ ...e, [sec.key]: !e[sec.key] }))} style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "transparent", border: "none", cursor: "pointer", color: T.text }}>
            <Icon d={sec.icon} /><span style={{ fontSize: 12, fontWeight: 600, flex: 1, textAlign: "left" }}>{sec.label}</span>
            <span style={{ fontSize: 10, color: T.textDim }}>{items[sec.key].length}</span>
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={T.textDim} strokeWidth="2" style={{ transform: expanded[sec.key] ? "rotate(180deg)" : "rotate(0)", transition: "transform .2s" }}><path d="M6 9l6 6 6-6" /></svg>
          </button>
          {expanded[sec.key] && (
            <div style={{ padding: "0 12px 10px", display: "flex", flexDirection: "column", gap: 4 }}>
              {items[sec.key].map((item) => (
                <div key={item.id} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "6px 8px", borderRadius: 6, background: T.bg0, fontSize: 12, color: item.done ? T.textDim : T.text, textDecoration: item.done ? "line-through" : "none" }}>
                  {(sec.key === "actionItems" || sec.key === "agenda") && <input type="checkbox" checked={item.done} onChange={() => toggleItem(sec.key, item.id)} style={{ marginTop: 2, accentColor: C, cursor: "pointer" }} />}
                  <span style={{ flex: 1, lineHeight: 1.4 }}>{item.text}</span>
                  {item.time && <span style={{ fontSize: 10, color: T.textDim, flexShrink: 0 }}>{item.time}</span>}
                </div>
              ))}
              {editingSection === sec.key ? (
                <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                  <input ref={inputRef} value={newItemText} onChange={(e) => setNewItemText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addItem(sec.key); if (e.key === "Escape") { setEditingSection(null); setNewItemText(""); } }} placeholder={`Add ${sec.label.toLowerCase()} item...`} style={{ flex: 1, background: T.bg0, border: `1px solid ${T.border}`, borderRadius: 6, padding: "6px 10px", color: T.text, fontSize: 12, outline: "none", fontFamily: "inherit" }} onFocus={(e) => (e.currentTarget.style.borderColor = C)} onBlur={(e) => (e.currentTarget.style.borderColor = T.border)} />
                  <button onClick={() => addItem(sec.key)} style={{ background: C, border: "none", borderRadius: 6, padding: "6px 12px", color: "#1A1A1A", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Add</button>
                </div>
              ) : (
                <button onClick={() => setEditingSection(sec.key)} style={{ background: "transparent", border: `1px dashed ${T.border}`, borderRadius: 6, padding: "6px 10px", color: T.textDim, fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, marginTop: 2 }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = C; e.currentTarget.style.color = C; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textDim; }}>
                  <Icon d="M12 5v14M5 12h14" size={12} color="currentColor" />Add item
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
//  CHAT PANEL
// ═══════════════════════════════════════════════════════════════════
const ChatPanel = ({ messages: initialMessages, isPrivate = false, color = C, interjections = [], onDismissInterjection, agentContribActive = false }) => {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const endRef = useRef(null);
  const inputRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, interjections]);
  const send = () => {
    if (!input.trim()) return;
    const ts = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    setMessages((prev) => [...prev, { id: `msg-${Date.now()}`, from: "Thomas", time: ts, text: input.trim(), type: isPrivate ? "private" : "team" }]);
    setInput(""); inputRef.current?.focus();
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {isPrivate && <div style={{ padding: "8px 12px", background: T.purple + "15", borderBottom: `1px solid ${T.purple}30`, display: "flex", alignItems: "center", gap: 6 }}><Icon d="M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z M7 11V7a5 5 0 0 1 10 0v4" color={T.purple} size={12} /><span style={{ fontSize: 11, color: T.purple, fontWeight: 600 }}>Private — only visible to you</span></div>}
      {/* Agent contribution indicator */}
      {agentContribActive && !isPrivate && (
        <div style={{ padding: "6px 12px", background: T.warn + "10", borderBottom: `1px solid ${T.warn}20`, display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.warn, animation: "pulse 2s infinite" }} />
          <span style={{ fontSize: 10, color: T.warn, fontWeight: 600 }}>Agent Contribution Active</span>
        </div>
      )}
      <div style={{ flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
        {messages.length === 0 && <div style={{ textAlign: "center", padding: 40, color: T.textDim, fontSize: 12 }}>{isPrivate ? "Your private notes will appear here." : "Team chat messages will appear here."}</div>}
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
              <strong style={{ color: T.text }}>{ij.speaker}</strong> said: <em>"{ij.claim}"</em>
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
//  AGENT PANEL — Multi-agent selection with Claude integration
// ═══════════════════════════════════════════════════════════════════
const AgentPanel = ({ meeting, color = C }) => {
  const { simDate } = useSimDate();
  const { activeUser } = useBadge();
  const liveMode = isLiveMode();

  // Build merged directory: meeting agents first, then org agents
  const meetingDir = useMemo(() => buildMeetingAgentDirectory(), []);
  const orgDir = useMemo(() => getAgentDirectory(), []);
  const fullDir = useMemo(() => [...meetingDir, ...orgDir], [meetingDir, orgDir]);

  // Pre-select all meeting agents by default
  const [checkedIds, setCheckedIds] = useState(() => new Set(meetingAgents.map(a => a.id)));
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showBriefing, setShowBriefing] = useState(true);
  const endRef = useRef(null);
  const inputRef = useRef(null);
  const briefing = prepBriefings[meeting?.id];

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const toggleAgent = (id) => {
    setCheckedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectedEntries = fullDir.filter(e => checkedIds.has(e.id));

  const send = async () => {
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setInput("");
    const ts = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    setMessages(prev => [...prev, { id: `amsg-${Date.now()}`, from: "user", time: ts, text: msg }]);

    if (liveMode && selectedEntries.length > 0) {
      setLoading(true);
      try {
        const results = await Promise.all(
          selectedEntries.map(async (entry) => {
            try {
              const response = await askAgent({
                agent: entry.agentTeam.lead,
                question: msg,
                history: messages.filter(m => m.agentId === entry.id || m.from === "user").map(m => ({
                  role: m.from === "user" ? "user" : "assistant",
                  content: m.text,
                })).slice(-10),
                simDate,
                user: activeUser,
                source: "meeting",
              });
              return { id: entry.id, name: entry.name, text: response };
            } catch (err) {
              return { id: entry.id, name: entry.name, text: `[Error] ${err.message}` };
            }
          })
        );
        const rts = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
        results.forEach(r => {
          setMessages(prev => [...prev, {
            id: `amsg-${Date.now()}-${r.id}`, from: "agent", agentId: r.id,
            agentName: r.name, time: rts, text: r.text,
          }]);
        });
      } catch (err) {
        setMessages(prev => [...prev, { id: `amsg-err-${Date.now()}`, from: "agent", agentName: "System", time: ts, text: `[Error] ${err.message}` }]);
      }
      setLoading(false);
    } else {
      // Simulated mode
      setTimeout(() => {
        selectedEntries.forEach(entry => {
          setMessages(prev => [...prev, {
            id: `amsg-${Date.now()}-${entry.id}`, from: "agent", agentId: entry.id,
            agentName: entry.name,
            time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
            text: `Based on the meeting context and SENS data, I can help with that. In production, this would connect to the ${entry.name} backend with full access to your operational data, previous meeting notes, and real-time metrics.`,
          }]);
        });
      }, 800);
    }
    inputRef.current?.focus();
  };

  // Group agents by branch for the selector
  const meetingGroup = fullDir.filter(e => e.branch === "Meeting");
  const orgGroup = fullDir.filter(e => e.branch !== "Meeting");

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Agent selector bar */}
      <div style={{ padding: "8px 12px", borderBottom: `1px solid ${T.border}`, maxHeight: 100, overflowY: "auto" }}>
        {meetingGroup.length > 0 && (
          <div style={{ marginBottom: 4 }}>
            <span style={{ fontSize: 9, color: T.textDim, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>Meeting</span>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 3 }}>
              {meetingGroup.map(agent => (
                <button key={agent.id} onClick={() => toggleAgent(agent.id)} style={{
                  padding: "4px 10px", borderRadius: 14,
                  border: `1px solid ${checkedIds.has(agent.id) ? T.teal : T.border}`,
                  background: checkedIds.has(agent.id) ? T.teal + "20" : "transparent",
                  color: checkedIds.has(agent.id) ? T.text : T.textDim,
                  fontSize: 10, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
                }}>
                  <span style={{ display: "inline-block", width: 5, height: 5, borderRadius: "50%", background: checkedIds.has(agent.id) ? T.green : T.textDim, marginRight: 5 }} />
                  {agent.name}
                </button>
              ))}
            </div>
          </div>
        )}
        {orgGroup.length > 0 && (
          <div>
            <span style={{ fontSize: 9, color: T.textDim, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>Organization</span>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 3 }}>
              {orgGroup.slice(0, 8).map(agent => (
                <button key={agent.id} onClick={() => toggleAgent(agent.id)} style={{
                  padding: "4px 10px", borderRadius: 14,
                  border: `1px solid ${checkedIds.has(agent.id) ? (agent.color || C) : T.border}`,
                  background: checkedIds.has(agent.id) ? (agent.color || C) + "20" : "transparent",
                  color: checkedIds.has(agent.id) ? T.text : T.textDim,
                  fontSize: 10, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
                }}>
                  {agent.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Chat area */}
      <div style={{ flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
        {/* Prep Briefing */}
        {briefing && showBriefing && messages.length === 0 && (
          <div style={{ background: T.teal + "10", border: `1px solid ${T.teal}25`, borderRadius: 10, padding: 14, marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Icon d="M12 2L2 7l10 5 10-5-10-5z M2 17l10 5 10-5 M2 12l10 5 10-5" color={T.teal} />
                <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>Meeting Prep Briefing</span>
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
        {/* Starter card when no messages and no briefing */}
        {messages.length === 0 && !briefing && selectedEntries.length > 0 && (
          <div style={{ background: color + "10", border: `1px solid ${color}25`, borderRadius: 10, padding: 14, marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 4 }}>{selectedEntries.length} agent{selectedEntries.length > 1 ? "s" : ""} selected</div>
            <div style={{ fontSize: 11, color: T.textMid, marginBottom: 10, lineHeight: 1.45 }}>
              {selectedEntries.map(e => e.name).join(", ")}
            </div>
            <div style={{ fontSize: 10, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6, fontWeight: 600 }}>Try asking</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {(selectedEntries[0]?.agentTeam?.lead?.skills ? [
                "Give me a status update on this topic",
                "What should I bring up in this meeting?",
              ] : meetingAgents[0]?.exampleQuestions?.slice(0, 2) || []).map((q, i) => (
                <button key={i} onClick={() => { setInput(q); inputRef.current?.focus(); }} style={{ background: T.bg0, border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 10px", color: T.text, fontSize: 12, textAlign: "left", cursor: "pointer", transition: "all .15s" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = color; e.currentTarget.style.background = color + "08"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.bg0; }}>{q}</button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg) => { const isUser = msg.from === "user"; return (
          <div key={msg.id} style={{ display: "flex", flexDirection: "column", alignItems: isUser ? "flex-end" : "flex-start" }}>
            {!isUser && <span style={{ fontSize: 10, color: T.teal, marginBottom: 2, marginLeft: 4, fontWeight: 600 }}>{msg.agentName}</span>}
            <div style={{ maxWidth: "85%", padding: "8px 12px", borderRadius: 12, background: isUser ? color + "25" : T.bg2, color: T.text, fontSize: 13, lineHeight: 1.45 }}>{msg.text}</div>
            <span style={{ fontSize: 9, color: T.textDim, marginTop: 2 }}>{msg.time}</span>
          </div>
        ); })}
        {loading && <div style={{ fontSize: 12, color: T.textDim, padding: 8, fontStyle: "italic" }}>Agents are thinking...</div>}
        <div ref={endRef} />
      </div>
      <div style={{ padding: "10px 12px", borderTop: `1px solid ${T.border}`, display: "flex", gap: 8 }}>
        <textarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder={checkedIds.size > 0 ? `Ask ${checkedIds.size} agent${checkedIds.size > 1 ? "s" : ""}...` : "Select agents above..."} rows={1} style={{ flex: 1, background: T.bg0, border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 12px", color: T.text, fontSize: 13, outline: "none", fontFamily: "inherit", resize: "none" }} onFocus={(e) => (e.currentTarget.style.borderColor = color)} onBlur={(e) => (e.currentTarget.style.borderColor = T.border)} />
        <button onClick={send} disabled={!input.trim() || checkedIds.size === 0 || loading} style={{ background: input.trim() && checkedIds.size > 0 ? color : T.bg3, border: "none", borderRadius: 8, padding: "8px 14px", color: input.trim() && checkedIds.size > 0 ? "#1A1A1A" : T.textDim, fontSize: 12, fontWeight: 600, cursor: input.trim() && checkedIds.size > 0 ? "pointer" : "default" }}>Send</button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
//  RECORDINGS PANEL
// ═══════════════════════════════════════════════════════════════════
const RecordingsPanel = ({ meeting, color = C }) => {
  const [viewingTranscript, setViewingTranscript] = useState(false);
  const past = pastMeetings.find((m) => m.title === meeting?.title) || pastMeetings[0];
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflowY: "auto", padding: 12, gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: T.danger + "15", border: `1px solid ${T.danger}30`, borderRadius: 8 }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: T.danger }} /><span style={{ fontSize: 12, color: T.text, fontWeight: 600 }}>Recording in progress</span><span style={{ fontSize: 11, color: T.textDim, marginLeft: "auto" }}>via ro.am</span>
      </div>
      {past?.magicMinutes && (<>
        <div style={{ fontSize: 11, color: T.textDim, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>Previous Meeting Summary</div>
        <div style={{ background: T.bg1, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}><Icon d="M12 2L2 7l10 5 10-5-10-5z M2 17l10 5 10-5 M2 12l10 5 10-5" /><span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>Magic Minutes</span><span style={{ fontSize: 10, color: T.textDim, marginLeft: "auto" }}>{past.date}</span></div>
          <p style={{ fontSize: 12, color: T.textMid, lineHeight: 1.5, margin: "0 0 12px" }}>{past.magicMinutes.summary}</p>
          <div style={{ fontSize: 10, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600, marginBottom: 6 }}>Key Decisions</div>
          {past.magicMinutes.keyDecisions.map((d, i) => (<div key={i} style={{ display: "flex", gap: 8, padding: "4px 0", fontSize: 12, color: T.text }}><Icon d="M22 11.08V12a10 10 0 1 1-5.93-9.14 M22 4L12 14.01l-3-3" color={T.green} />{d}</div>))}
          <div style={{ fontSize: 10, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600, marginTop: 12, marginBottom: 6 }}>Action Items</div>
          {past.magicMinutes.actionItems.map((a, i) => (<div key={i} style={{ display: "flex", gap: 8, padding: "4px 0", fontSize: 12, color: a.done ? T.textDim : T.text }}><input type="checkbox" checked={a.done} readOnly style={{ accentColor: color, marginTop: 2 }} /><div style={{ flex: 1 }}><span style={{ textDecoration: a.done ? "line-through" : "none" }}>{a.task}</span><span style={{ fontSize: 10, color: T.textDim, marginLeft: 8 }}>— {a.assignee}</span></div><span style={{ fontSize: 10, color: T.textDim, flexShrink: 0 }}>Due {a.due.slice(5)}</span></div>))}
        </div>
        {past.transcript?.length > 0 && (<>
          <button onClick={() => setViewingTranscript(!viewingTranscript)} style={{ background: "transparent", border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 14px", color: T.text, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = color; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; }}><Icon d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6" />{viewingTranscript ? "Hide Transcript" : "View Full Transcript"}</button>
          {viewingTranscript && <div style={{ background: T.bg1, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>{past.transcript.map((line, i) => (<div key={i} style={{ padding: "6px 0", borderBottom: i < past.transcript.length - 1 ? `1px solid ${T.border}` : "none" }}><div style={{ display: "flex", gap: 8, marginBottom: 2 }}><span style={{ fontSize: 11, fontWeight: 600, color }}>{line.speaker}</span><span style={{ fontSize: 10, color: T.textDim }}>{line.time}</span></div><div style={{ fontSize: 12, color: T.text, lineHeight: 1.45 }}>{line.text}</div></div>))}</div>}
        </>)}
      </>)}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
//  EXPORT MODAL
// ═══════════════════════════════════════════════════════════════════
const ExportModal = ({ meeting, template, onClose }) => {
  const [format, setFormat] = useState("markdown");
  const [copied, setCopied] = useState(false);
  const [sections, setSections] = useState({ agenda: true, discussion: true, decisions: true, actionItems: true, takeaways: true, participants: true, metadata: true });

  const generateExport = () => {
    const lines = [];
    const divider = format === "markdown" ? "---" : "════════════════════════════════════════";
    const ts = new Date().toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" });

    if (sections.metadata) {
      if (format === "markdown") {
        lines.push(`# ${meeting.title}`, "");
        lines.push(`**Date:** ${meeting.date} · ${meeting.time}  `);
        lines.push(`**Duration:** ${meeting.duration}  `);
        lines.push(`**Room:** ${meeting.room || "—"}  `);
        if (template) lines.push(`**Template:** ${template.name}  `);
        lines.push(`**Exported:** ${ts}  `);
        lines.push(`**Source:** SENS Meeting Intelligence Module  `);
        lines.push("", divider, "");
      } else {
        lines.push(meeting.title.toUpperCase(), divider);
        lines.push(`Date: ${meeting.date} · ${meeting.time}`);
        lines.push(`Duration: ${meeting.duration}`);
        lines.push(`Room: ${meeting.room || "—"}`);
        if (template) lines.push(`Template: ${template.name}`);
        lines.push(`Exported: ${ts}`);
        lines.push(`Source: SENS Meeting Intelligence Module`);
        lines.push("", divider, "");
      }
    }

    if (sections.participants) {
      const people = meeting.participants.map(getParticipant).filter(Boolean);
      if (format === "markdown") {
        lines.push("## Participants", "");
        people.forEach(p => lines.push(`- **${p.name}** — ${p.role}${p.online ? " *(online)*" : ""}`));
      } else {
        lines.push("PARTICIPANTS", divider);
        people.forEach(p => lines.push(`  • ${p.name} — ${p.role}${p.online ? " (online)" : ""}`));
      }
      lines.push("");
    }

    const sectionMap = [
      { key: "agenda", label: "Agenda", data: meeting.agenda || [] },
      { key: "discussion", label: "Discussion", data: template?.sections?.discussion || [] },
      { key: "decisions", label: "Decisions", data: [] },
      { key: "actionItems", label: "Action Items", data: [] },
      { key: "takeaways", label: "Key Takeaways", data: [] },
    ];
    sectionMap.forEach(sec => {
      if (!sections[sec.key]) return;
      if (format === "markdown") {
        lines.push(`## ${sec.label}`, "");
        if (sec.data.length > 0) sec.data.forEach((item, i) => lines.push(`${sec.key === "actionItems" ? `- [ ] ` : `${i + 1}. `}${item}`));
        else lines.push("*No items recorded yet.*");
      } else {
        lines.push(sec.label.toUpperCase(), divider);
        if (sec.data.length > 0) sec.data.forEach((item, i) => lines.push(`  ${i + 1}. ${item}`));
        else lines.push("  (No items recorded yet.)");
      }
      lines.push("");
    });

    if (format === "markdown") {
      lines.push("---", "", `> *Generated by SENS Meeting Intelligence Module · ${ts}*`);
    } else {
      lines.push(divider, `Generated by SENS Meeting Intelligence Module · ${ts}`);
    }

    return lines.join("\n");
  };

  const exportText = generateExport();

  const handleCopy = () => {
    navigator.clipboard?.writeText(exportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = format === "markdown" ? "md" : "txt";
    const blob = new Blob([exportText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${meeting.title.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}-notes.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ ...(window.innerWidth < 768 ? { position: "fixed", inset: 0, width: "100%", maxHeight: "100vh", borderRadius: 0 } : { width: 680, maxHeight: "80vh", borderRadius: 14 }), background: T.bg1, border: `1px solid ${T.border}`, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Icon d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3" size={18} />
            <span style={{ fontSize: 15, fontWeight: 700, color: T.text }}>Export Meeting Notes</span>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: T.textDim, cursor: "pointer", fontSize: 20, padding: 0, lineHeight: 1 }}>&times;</button>
        </div>

        {/* Options */}
        <div style={{ padding: "12px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 11, color: T.textDim, fontWeight: 600 }}>FORMAT:</span>
            {[{ key: "markdown", label: "Markdown" }, { key: "plaintext", label: "Plain Text" }].map(f => (
              <Pill key={f.key} active={format === f.key} onClick={() => setFormat(f.key)}>{f.label}</Pill>
            ))}
          </div>
          <div style={{ width: 1, height: 20, background: T.border }} />
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, color: T.textDim, fontWeight: 600 }}>INCLUDE:</span>
            {Object.entries(sections).map(([key, val]) => (
              <label key={key} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: val ? T.text : T.textDim, cursor: "pointer" }}>
                <input type="checkbox" checked={val} onChange={() => setSections(s => ({ ...s, [key]: !s[key] }))} style={{ accentColor: C }} />
                {key.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase()).trim()}
              </label>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          <pre style={{ margin: 0, fontSize: 12, color: T.textMid, lineHeight: 1.6, fontFamily: "'DM Sans', monospace", whiteSpace: "pre-wrap", wordBreak: "break-word", background: T.bg0, borderRadius: 8, padding: 16, border: `1px solid ${T.border}` }}>
            {exportText}
          </pre>
        </div>

        {/* Actions */}
        <div style={{ padding: "12px 20px", borderTop: `1px solid ${T.border}`, display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={handleCopy} style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 16px", color: copied ? T.green : T.text, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, transition: "all .15s" }}>
            <Icon d={copied ? "M22 11.08V12a10 10 0 1 1-5.93-9.14 M22 4L12 14.01l-3-3" : "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2 M9 2h6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z"} color={copied ? T.green : "currentColor"} size={12} />
            {copied ? "Copied!" : "Copy to Clipboard"}
          </button>
          <button onClick={handleDownload} style={{ background: C, border: "none", borderRadius: 8, padding: "8px 20px", color: "#1A1A1A", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <Icon d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3" color="#1A1A1A" size={12} />
            Download .{format === "markdown" ? "md" : "txt"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
//  TAG MEETING MODAL
// ═══════════════════════════════════════════════════════════════════
const TagModal = ({ meeting, onClose }) => {
  const [tags, setTags] = useState(["executive", "strategy"]);
  const [newTag, setNewTag] = useState("");
  const suggestedTags = ["operations", "finance", "safety", "portland", "investor", "board", "quarterly", "urgent", "follow-up", "budgeting", "personnel", "regulatory"];

  const addTag = (t) => { if (t && !tags.includes(t.toLowerCase())) setTags([...tags, t.toLowerCase()]); setNewTag(""); };
  const removeTag = (t) => setTags(tags.filter(tag => tag !== t));

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 440, background: T.bg1, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Icon d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z M7 7h.01" size={16} />
            <span style={{ fontSize: 15, fontWeight: 700, color: T.text }}>Tag Meeting</span>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: T.textDim, cursor: "pointer", fontSize: 20, padding: 0, lineHeight: 1 }}>&times;</button>
        </div>
        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontSize: 12, color: T.textMid }}>{meeting.title}</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {tags.map(tag => (
              <span key={tag} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 16, background: C + "20", color: C, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                {tag}
                <button onClick={() => removeTag(tag)} style={{ background: "transparent", border: "none", color: C, cursor: "pointer", padding: 0, fontSize: 14, lineHeight: 1 }}>&times;</button>
              </span>
            ))}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <input value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addTag(newTag); }} placeholder="Add custom tag..." style={{ flex: 1, background: T.bg0, border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 12px", color: T.text, fontSize: 12, outline: "none", fontFamily: "inherit" }} onFocus={(e) => (e.currentTarget.style.borderColor = C)} onBlur={(e) => (e.currentTarget.style.borderColor = T.border)} />
            <button onClick={() => addTag(newTag)} disabled={!newTag.trim()} style={{ background: newTag.trim() ? C : T.bg3, border: "none", borderRadius: 8, padding: "8px 14px", color: newTag.trim() ? "#1A1A1A" : T.textDim, fontSize: 12, fontWeight: 600, cursor: newTag.trim() ? "pointer" : "default" }}>Add</button>
          </div>
          <div>
            <div style={{ fontSize: 10, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600, marginBottom: 8 }}>Suggested Tags</div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {suggestedTags.filter(t => !tags.includes(t)).map(t => (
                <button key={t} onClick={() => addTag(t)} style={{ fontSize: 10, padding: "3px 8px", borderRadius: 4, background: T.bg0, border: `1px solid ${T.border}`, color: T.textMid, cursor: "pointer", transition: "all .15s" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = C; e.currentTarget.style.color = C; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textMid; }}>+ {t}</button>
              ))}
            </div>
          </div>
        </div>
        <div style={{ padding: "12px 20px", borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 16px", color: T.textMid, fontSize: 12, cursor: "pointer" }}>Cancel</button>
          <button onClick={onClose} style={{ background: C, border: "none", borderRadius: 8, padding: "8px 20px", color: "#1A1A1A", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Save Tags</button>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
//  MEETING MONITOR HOOK — Proactive agent contribution interjection
// ═══════════════════════════════════════════════════════════════════
const useMeetingMonitor = ({ enabled, messages, simDate, user }) => {
  const TAG = "[MeetingMonitor]";
  const [interjections, setInterjections] = useState([]);
  const [contribError, setContribError] = useState(null);
  const lastCheckedIndex = useRef(0);
  const bufferRef = useRef([]);
  const intervalMs = getAgentContribInterval() * 1000;

  useEffect(() => {
    if (!enabled || !isLiveMode()) return;

    // Accumulate new messages that contain factual claims
    const newMsgs = messages.slice(lastCheckedIndex.current);
    for (const msg of newMsgs) {
      if (msg.from !== "Thomas") continue; // Only check human messages
      if (containsFactualClaim(msg.text)) {
        console.log(TAG, `Buffered claim: "${msg.text}"`);
        bufferRef.current.push(msg);
      }
    }
    lastCheckedIndex.current = messages.length;
  }, [enabled, messages]);

  useEffect(() => {
    if (!enabled || !isLiveMode()) return;

    const iv = setInterval(async () => {
      if (bufferRef.current.length === 0) return;

      const toCheck = [...bufferRef.current];
      bufferRef.current = [];
      console.log(TAG, `Batch firing with ${toCheck.length} message(s)`);

      // Build data context for agent contribution (use CEO EA as reference agent)
      const contribAgent = meetingAgents.find(a => a.id === "ceo-ea") || meetingAgents[0];
      const dataContext = buildDataContext(
        { dataSources: contribAgent?.dataSources || ["All VP dashboards", "Portfolio KPIs"] },
        simDate,
        user
      );

      const result = await checkFacts({ messages: toCheck, dataContext, userId: user?.id, sensitivity: getAgentContribSensitivity() });

      if (!result) {
        console.log(TAG, "No errors detected");
      } else if (result.type === "error") {
        console.error(TAG, "Error:", result.message);
        setContribError(result.message);
      } else if (result.type === "interjection") {
        console.log(TAG, "Interjection received:", result);
        setContribError(null);
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
//  ACTIVE MEETING WORKSPACE
// ═══════════════════════════════════════════════════════════════════
const ActiveMeetingWorkspace = ({ meeting, onClose, template }) => {
  const { simDate } = useSimDate();
  const { activeUser } = useBadge();
  const { isMobile } = useViewport();
  const [rightTab, setRightTab] = useState(0);
  const rightTabs = ["Team Chat", "Private", "Agents", "Recordings"];
  const [mobilePanel, setMobilePanel] = useState("notes"); // "notes" | "chat"
  const [elapsed, setElapsed] = useState(0);
  const [showExport, setShowExport] = useState(false);
  const [showTag, setShowTag] = useState(false);
  const [teamMessages] = useState(sampleTeamChat);
  const agentContribEnabled = isAgentContribEnabled() && isLiveMode();
  useEffect(() => { const iv = setInterval(() => setElapsed((e) => e + 1), 1000); return () => clearInterval(iv); }, []);
  const formatTime = (s) => `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const meetingParticipants = meeting.participants.map(getParticipant).filter(Boolean);

  // Agent contribution monitor
  const { interjections, dismissInterjection } = useMeetingMonitor({
    enabled: agentContribEnabled,
    messages: teamMessages,
    simDate,
    user: activeUser,
  });

  // Risk alerts for this meeting
  const risks = meetingRisks.filter(r => r.linkedMeeting === meeting.id || meeting.agenda?.some(a => r.description.toLowerCase().includes(a.toLowerCase().split(" ")[0])));

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 120px)", gap: 0 }}>
      {/* Export & Tag Modals */}
      {showExport && <ExportModal meeting={meeting} template={template} onClose={() => setShowExport(false)} />}
      {showTag && <TagModal meeting={meeting} onClose={() => setShowTag(false)} />}

      {/* Meeting Header */}
      <div style={{ background: T.bg1, border: `1px solid ${T.border}`, borderRadius: 12, padding: isMobile ? "10px 12px" : "14px 20px", display: "flex", alignItems: "center", gap: isMobile ? 8 : 16, marginBottom: 12, flexWrap: isMobile ? "wrap" : "nowrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 10, height: 10, borderRadius: "50%", background: T.danger, boxShadow: `0 0 8px ${T.danger}60` }} /><span style={{ fontSize: 11, color: T.danger, fontWeight: 600 }}>REC</span></div>
        <div style={{ flex: 1, minWidth: isMobile ? "60%" : "auto" }}><div style={{ fontSize: isMobile ? 14 : 15, fontWeight: 700, color: T.text }}>{meeting.title}</div><div style={{ fontSize: 11, color: T.textDim }}>{meeting.room} · {meeting.duration}{template ? ` · ${template.name}` : ""}</div></div>
        <div style={{ fontFamily: "monospace", fontSize: isMobile ? 14 : 16, color: C, fontWeight: 600, letterSpacing: 1 }}>{formatTime(elapsed)}</div>
        {!isMobile && <div style={{ display: "flex", alignItems: "center", gap: 8 }}>{meetingParticipants.map((p) => (<Avatar key={p.id} person={p} size={30} />))}</div>}
        {!isMobile && risks.length > 0 && <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", background: T.warn + "15", borderRadius: 6, border: `1px solid ${T.warn}30` }}><Icon d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M12 8v4 M12 16h.01" color={T.warn} size={12} /><span style={{ fontSize: 10, color: T.warn, fontWeight: 600 }}>{risks.length} Risk{risks.length > 1 ? "s" : ""}</span></div>}
        {!isMobile && agentContribEnabled && <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", background: T.teal + "15", borderRadius: 6, border: `1px solid ${T.teal}30` }}><div style={{ width: 6, height: 6, borderRadius: "50%", background: T.teal, boxShadow: `0 0 6px ${T.teal}` }} /><span style={{ fontSize: 10, color: T.teal, fontWeight: 600 }}>Agent Contribution</span></div>}
        <button onClick={onClose} style={{ background: T.danger + "20", border: `1px solid ${T.danger}40`, borderRadius: 8, padding: isMobile ? "6px 12px" : "8px 16px", color: T.danger, fontSize: 12, fontWeight: 600, cursor: "pointer" }} onMouseEnter={(e) => { e.currentTarget.style.background = T.danger; e.currentTarget.style.color = "#fff"; }} onMouseLeave={(e) => { e.currentTarget.style.background = T.danger + "20"; e.currentTarget.style.color = T.danger; }}>End Meeting</button>
      </div>

      {/* Mobile panel toggle */}
      {isMobile && (
        <div style={{ display: "flex", gap: 0, marginBottom: 8, background: T.bg2, borderRadius: 8, border: `1px solid ${T.border}`, overflow: "hidden" }}>
          {["notes", "chat"].map(p => (
            <button key={p} onClick={() => setMobilePanel(p)} style={{ flex: 1, padding: "10px 0", background: mobilePanel === p ? C + "20" : "transparent", border: "none", borderBottom: mobilePanel === p ? `2px solid ${C}` : "2px solid transparent", color: mobilePanel === p ? T.text : T.textDim, fontSize: 13, fontWeight: mobilePanel === p ? 600 : 400, cursor: "pointer", textTransform: "capitalize" }}>
              {p === "notes" ? "Notes" : "Chat & Agents"}
            </button>
          ))}
        </div>
      )}

      {/* Main Workspace */}
      <div style={{ flex: 1, display: "flex", gap: 12, minHeight: 0, flexDirection: isMobile ? "column" : "row" }}>
        {(!isMobile || mobilePanel === "notes") && (
          <div style={{ width: isMobile ? "100%" : "45%", background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 12, padding: isMobile ? 12 : 16, overflow: "hidden", display: "flex", flexDirection: "column", flex: isMobile ? 1 : undefined }}>
            <NotesEditor meeting={meeting} templateSections={template?.sections} />
          </div>
        )}
        {(!isMobile || mobilePanel === "chat") && (
          <div style={{ flex: 1, background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ borderBottom: `1px solid ${T.border}`, padding: "0 12px", display: "flex", gap: 0, overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
              {rightTabs.map((tab, i) => (
                <button key={tab} onClick={() => setRightTab(i)} style={{ padding: isMobile ? "10px 12px" : "12px 16px", background: "transparent", border: "none", borderBottom: rightTab === i ? `2px solid ${i === 1 ? T.purple : C}` : "2px solid transparent", color: rightTab === i ? T.text : T.textDim, fontSize: 12, fontWeight: rightTab === i ? 600 : 400, cursor: "pointer", transition: "all .15s", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                  {i === 1 && <Icon d="M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z M7 11V7a5 5 0 0 1 10 0v4" color={rightTab === 1 ? T.purple : T.textDim} size={10} />}{tab}
                </button>
              ))}
            </div>
            <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
              {rightTab === 0 && <ChatPanel messages={sampleTeamChat} interjections={interjections} onDismissInterjection={dismissInterjection} agentContribActive={agentContribEnabled} />}
              {rightTab === 1 && <ChatPanel messages={samplePrivateChat} isPrivate />}
              {rightTab === 2 && <AgentPanel meeting={meeting} />}
              {rightTab === 3 && <RecordingsPanel meeting={meeting} />}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Bar */}
      <div style={{ display: "flex", gap: isMobile ? 6 : 10, marginTop: 12, justifyContent: "flex-end", flexWrap: isMobile ? "wrap" : "nowrap" }}>
        <button onClick={() => setShowExport(true)} style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 16px", color: T.textMid, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, transition: "all .15s" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = C; e.currentTarget.style.color = T.text; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textMid; }}>
          <Icon d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3" color="currentColor" />Export Notes
        </button>
        <button onClick={() => setShowTag(true)} style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 16px", color: T.textMid, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, transition: "all .15s" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = C; e.currentTarget.style.color = T.text; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textMid; }}>
          <Icon d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z M7 7h.01" color="currentColor" />Tag Meeting
        </button>
        <button onClick={onClose} style={{ background: C, border: "none", borderRadius: 8, padding: "8px 20px", color: "#1A1A1A", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Save & Close</button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
//  TEMPLATES VIEW
// ═══════════════════════════════════════════════════════════════════
const TemplatesView = ({ onStartFromTemplate }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
    <div style={{ fontSize: 13, color: T.textMid, lineHeight: 1.5 }}>Start a new meeting from a pre-configured template with suggested agenda items, recommended agents, and default participants.</div>
    <div style={{ display: "grid", gridTemplateColumns: window.innerWidth < 768 ? "1fr" : "repeat(3, 1fr)", gap: 12 }}>
      {meetingTemplates.map((tpl) => (
        <div key={tpl.id} style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, cursor: "pointer", transition: "all .15s" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = tpl.color + "60"; e.currentTarget.style.background = tpl.color + "08"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.bg2; }} onClick={() => onStartFromTemplate(tpl)}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: tpl.color + "20", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon d={tpl.icon} color={tpl.color} size={16} /></div>
            <div><div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{tpl.name}</div><div style={{ fontSize: 10, color: T.textDim }}>{tpl.duration}</div></div>
          </div>
          <div style={{ fontSize: 11, color: T.textMid, lineHeight: 1.45, marginBottom: 10 }}>{tpl.description}</div>
          <div style={{ fontSize: 10, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600, marginBottom: 6 }}>Agenda ({tpl.sections.agenda.length} items)</div>
          {tpl.sections.agenda.slice(0, 3).map((a, i) => (<div key={i} style={{ fontSize: 11, color: T.textMid, paddingLeft: 8, borderLeft: `2px solid ${tpl.color}30`, marginBottom: 3 }}>{a}</div>))}
          {tpl.sections.agenda.length > 3 && <div style={{ fontSize: 10, color: T.textDim, marginTop: 2 }}>+{tpl.sections.agenda.length - 3} more</div>}
          <div style={{ display: "flex", gap: 4, marginTop: 10 }}>
            {tpl.suggestedAgents.slice(0, 3).map((aid) => { const ag = meetingAgents.find(a => a.id === aid); return ag ? <span key={aid} style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: tpl.color + "15", color: tpl.color }}>{ag.name}</span> : null; })}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════
//  ANALYTICS DASHBOARD
// ═══════════════════════════════════════════════════════════════════
const AnalyticsView = () => {
  const ad = analyticsData;
  const maxCount = Math.max(...ad.weeklyMeetings.map(w => w.count));
  const maxType = Math.max(...ad.meetingsByType.map(t => t.count));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Summary KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: window.innerWidth < 768 ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: 12 }}>
        <KpiCard label="Avg Meeting Duration" value={`${ad.avgMeetingDuration}m`} sub="across all types" color={C} />
        <KpiCard label="Action Item Completion" value={`${ad.actionItemCompletion.completionRate}%`} sub={`${ad.actionItemCompletion.completed} of ${ad.actionItemCompletion.total}`} color={T.green} />
        <KpiCard label="Recording Hours" value={ad.totalRecordingHours} sub="total captured" color={T.blue} />
        <KpiCard label="Transcripts Generated" value={ad.transcriptsGenerated} sub="via Magic Minutes" color={T.purple} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Weekly Meeting Trend */}
        <Card title="WEEKLY MEETING TREND" titleColor={C}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 140 }}>
            {ad.weeklyMeetings.map((w, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 10, color: T.textDim }}>{w.count}</span>
                <div style={{ width: "100%", height: `${(w.count / maxCount) * 100}px`, background: C + "60", borderRadius: 4, transition: "height .3s" }} />
                <span style={{ fontSize: 9, color: T.textDim, whiteSpace: "nowrap" }}>{w.week.split(" ")[1]}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Meetings by Type */}
        <Card title="MEETINGS BY TYPE" titleColor={C}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {ad.meetingsByType.map((t, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 11, color: T.textMid, minWidth: 110, textAlign: "right" }}>{t.type}</span>
                <div style={{ flex: 1, height: 16, background: T.bg0, borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ width: `${(t.count / maxType) * 100}%`, height: "100%", background: t.color + "70", borderRadius: 4, transition: "width .3s" }} />
                </div>
                <span style={{ fontSize: 11, color: T.text, fontWeight: 600, minWidth: 24 }}>{t.count}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Action Item Completion */}
      <Card title="ACTION ITEM COMPLETION" titleColor={T.green}>
        <div style={{ display: "grid", gridTemplateColumns: window.innerWidth < 768 ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: 12 }}>
          {[{ label: "Completed", value: ad.actionItemCompletion.completed, color: T.green }, { label: "Pending", value: ad.actionItemCompletion.pending, color: T.blue }, { label: "Overdue", value: ad.actionItemCompletion.overdue, color: T.danger }, { label: "Completion Rate", value: `${ad.actionItemCompletion.completionRate}%`, color: C }].map((m, i) => (
            <div key={i} style={{ background: T.bg0, borderRadius: 8, padding: 14, textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: m.color }}>{m.value}</div>
              <div style={{ fontSize: 11, color: T.textDim, marginTop: 4 }}>{m.label}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Top Contributors */}
      <Card title="TOP CONTRIBUTORS" titleColor={T.purple}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {ad.topContributors.map((c, i) => { const p = participants.find(pp => pp.name === c.name || pp.name.startsWith(c.name)); return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 10px", background: T.bg0, borderRadius: 6 }}>
              <span style={{ fontSize: 12, color: T.textDim, fontWeight: 600, minWidth: 20 }}>#{i + 1}</span>
              {p && <Avatar person={p} size={24} />}
              <span style={{ fontSize: 12, color: T.text, fontWeight: 600, flex: 1 }}>{c.name}</span>
              <span style={{ fontSize: 10, color: T.textDim }}>{c.meetings} meetings</span>
              <span style={{ fontSize: 10, color: T.textDim }}>{c.notes} notes</span>
              <span style={{ fontSize: 10, color: T.textDim }}>{c.actionItems} actions</span>
            </div>
          ); })}
        </div>
      </Card>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
//  ACTION ITEM TRACKER (Cross-meeting)
// ═══════════════════════════════════════════════════════════════════
const ActionItemTracker = () => {
  const [filter, setFilter] = useState("open"); // open | overdue | done | all
  const [assigneeFilter, setAssigneeFilter] = useState("all");

  const filtered = useMemo(() => {
    let items = allActionItems;
    if (filter === "open") items = items.filter(i => i.status === "open" || i.status === "overdue");
    else if (filter === "overdue") items = items.filter(i => i.status === "overdue");
    else if (filter === "done") items = items.filter(i => i.status === "done");
    if (assigneeFilter !== "all") items = items.filter(i => i.assignee === assigneeFilter);
    return items;
  }, [filter, assigneeFilter]);

  const assignees = [...new Set(allActionItems.map(i => i.assignee))];
  const overdueCount = allActionItems.filter(i => i.status === "overdue").length;
  const openCount = allActionItems.filter(i => i.status === "open" || i.status === "overdue").length;
  const doneCount = allActionItems.filter(i => i.status === "done").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: window.innerWidth < 768 ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: 12 }}>
        <KpiCard label="Total Open" value={openCount} sub={`${overdueCount} overdue`} color={C} />
        <KpiCard label="Overdue" value={overdueCount} sub="need attention" color={T.danger} />
        <KpiCard label="Completed" value={doneCount} sub="this month" color={T.green} />
        <KpiCard label="Total Tracked" value={allActionItems.length} sub="across all meetings" color={T.blue} />
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: 11, color: T.textDim, fontWeight: 600 }}>STATUS:</span>
        {[{ key: "open", label: `Open (${openCount})` }, { key: "overdue", label: `Overdue (${overdueCount})` }, { key: "done", label: `Done (${doneCount})` }, { key: "all", label: "All" }].map(f => (
          <Pill key={f.key} active={filter === f.key} color={f.key === "overdue" ? T.danger : C} onClick={() => setFilter(f.key)}>{f.label}</Pill>
        ))}
        <div style={{ width: 1, height: 20, background: T.border, margin: "0 8px" }} />
        <span style={{ fontSize: 11, color: T.textDim, fontWeight: 600 }}>ASSIGNEE:</span>
        <Pill active={assigneeFilter === "all"} onClick={() => setAssigneeFilter("all")}>All</Pill>
        {assignees.map(a => (<Pill key={a} active={assigneeFilter === a} onClick={() => setAssigneeFilter(a)}>{a.split(" ")[0]}</Pill>))}
      </div>

      {/* Items */}
      <Card title={`ACTION ITEMS (${filtered.length})`} titleColor={C}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {filtered.map((item) => (
            <div key={item.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", background: item.status === "overdue" ? T.danger + "08" : T.bg0, border: `1px solid ${item.status === "overdue" ? T.danger + "25" : T.border}`, borderRadius: 8 }}>
              <input type="checkbox" checked={item.status === "done"} readOnly style={{ marginTop: 3, accentColor: C }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: item.status === "done" ? T.textDim : T.text, textDecoration: item.status === "done" ? "line-through" : "none", lineHeight: 1.4 }}>{item.task}</div>
                <div style={{ display: "flex", gap: 12, marginTop: 4, fontSize: 11 }}>
                  <span style={{ color: T.textDim }}>Assigned: <span style={{ color: T.textMid, fontWeight: 500 }}>{item.assignee}</span></span>
                  <span style={{ color: T.textDim }}>From: <span style={{ color: T.textMid }}>{item.source}</span></span>
                  <span style={{ color: item.status === "overdue" ? T.danger : T.textDim }}>Due: {item.due.slice(5)}</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                {item.priority === "high" && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: T.danger + "20", color: T.danger, fontWeight: 600 }}>HIGH</span>}
                {item.status === "overdue" && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: T.danger + "20", color: T.danger, fontWeight: 600 }}>OVERDUE</span>}
                {item.status === "done" && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: T.green + "20", color: T.green, fontWeight: 600 }}>DONE</span>}
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div style={{ textAlign: "center", padding: 30, color: T.textDim, fontSize: 12 }}>No action items match the current filter.</div>}
        </div>
      </Card>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
//  CALENDAR VIEW
// ═══════════════════════════════════════════════════════════════════
const CalendarView = ({ onStartMeeting }) => {
  const today = "2026-02-25";
  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  // Build two weeks of dates
  const weeks = useMemo(() => {
    const w1Start = new Date("2026-02-24T00:00:00");
    const w2Start = new Date("2026-03-03T00:00:00");
    return [
      Array.from({ length: 5 }, (_, i) => { const d = new Date(w1Start); d.setDate(d.getDate() + i); return d.toISOString().slice(0, 10); }),
      Array.from({ length: 5 }, (_, i) => { const d = new Date(w2Start); d.setDate(d.getDate() + i); return d.toISOString().slice(0, 10); }),
    ];
  }, []);

  const getMeetingsForDate = (date) => {
    const entry = calendarMeetings.find(cm => cm.date === date);
    return entry?.meetings || [];
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 13, color: T.textMid }}>2-week view synced with ro.am calendar</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: T.green }} /><span style={{ fontSize: 11, color: T.textMid }}>Live sync active</span></div>
      </div>

      {weeks.map((week, wi) => (
        <div key={wi}>
          <div style={{ fontSize: 11, color: T.textDim, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600, marginBottom: 8 }}>{wi === 0 ? "This Week" : "Next Week"}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
            {week.map((date, di) => {
              const meetings = getMeetingsForDate(date);
              const isToday = date === today;
              return (
                <div key={date} style={{ background: isToday ? C + "08" : T.bg2, border: `1px solid ${isToday ? C + "40" : T.border}`, borderRadius: 8, padding: 10, minHeight: 120 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 10, color: T.textDim, fontWeight: 600 }}>{daysOfWeek[di]}</span>
                    <span style={{ fontSize: 12, fontWeight: isToday ? 700 : 400, color: isToday ? C : T.text }}>{new Date(date + "T00:00:00").getDate()}</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {meetings.map((mtg) => (
                      <div key={mtg.id} onClick={() => onStartMeeting(mtg)} style={{ padding: "4px 6px", borderRadius: 4, background: mtg.color + "15", borderLeft: `3px solid ${mtg.color}`, cursor: "pointer", transition: "all .15s" }} onMouseEnter={(e) => { e.currentTarget.style.background = mtg.color + "25"; }} onMouseLeave={(e) => { e.currentTarget.style.background = mtg.color + "15"; }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: T.text }}>{mtg.title}</div>
                        <div style={{ fontSize: 9, color: T.textDim }}>{mtg.time} · {mtg.duration}</div>
                      </div>
                    ))}
                    {meetings.length === 0 && <div style={{ fontSize: 10, color: T.textDim, fontStyle: "italic", textAlign: "center", padding: "8px 0" }}>No meetings</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
//  RISK INTEGRATION VIEW
// ═══════════════════════════════════════════════════════════════════
const RiskView = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
    <div style={{ fontSize: 13, color: T.textMid, lineHeight: 1.5 }}>Risks identified during meetings, automatically linked to action items and meeting context.</div>
    <div style={{ display: "grid", gridTemplateColumns: window.innerWidth < 768 ? "1fr" : "repeat(3, 1fr)", gap: 12 }}>
      {[{ label: "Active Risks", value: meetingRisks.length, color: T.warn }, { label: "Escalated", value: meetingRisks.filter(r => r.status === "escalated").length, color: T.danger }, { label: "Monitoring", value: meetingRisks.filter(r => r.status === "monitoring").length, color: T.blue }].map((k, i) => (
        <div key={i} style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: k.color }}>{k.value}</div>
          <div style={{ fontSize: 11, color: T.textDim, marginTop: 4 }}>{k.label}</div>
        </div>
      ))}
    </div>
    {meetingRisks.map((risk) => (
      <div key={risk.id} style={{ background: T.bg2, border: `1px solid ${risk.severity === "red" ? T.danger + "40" : risk.severity === "yellow" ? T.warn + "30" : T.border}`, borderRadius: 10, padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <SeverityDot severity={risk.severity} />
          <span style={{ fontSize: 14, fontWeight: 600, color: T.text, flex: 1 }}>{risk.title}</span>
          <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: risk.status === "escalated" ? T.danger + "20" : risk.status === "mitigating" ? T.blue + "20" : T.warn + "20", color: risk.status === "escalated" ? T.danger : risk.status === "mitigating" ? T.blue : T.warn, fontWeight: 600, textTransform: "uppercase" }}>{risk.status}</span>
        </div>
        <div style={{ fontSize: 12, color: T.textMid, lineHeight: 1.5, marginBottom: 10 }}>{risk.description}</div>
        <div style={{ display: "flex", gap: 16, fontSize: 11, color: T.textDim }}>
          <span>Owner: <span style={{ color: T.textMid }}>{risk.owner}</span></span>
          <span>Source: <span style={{ color: T.textMid }}>{risk.source}</span></span>
          <span>Raised: <span style={{ color: T.textMid }}>{fmtDateShort(risk.raisedDate)}</span></span>
        </div>
      </div>
    ))}
  </div>
);

// ═══════════════════════════════════════════════════════════════════
//  MEETING LIST VIEW (updated with templates)
// ═══════════════════════════════════════════════════════════════════
const MeetingListView = ({ onJoinMeeting, onViewPastMeeting }) => {
  const [hoveredRow, setHoveredRow] = useState(null);
  const [search, setSearch] = useState("");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "grid", gridTemplateColumns: window.innerWidth < 768 ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: 12 }}>
        <KpiCard label="Meetings This Week" value={meetingKpis.meetingsThisWeek} sub="3 remaining" color={C} />
        <KpiCard label="Notes Captured" value={meetingKpis.notesCaptured} sub="across 8 meetings" color={C} />
        <KpiCard label="Action Items Open" value={meetingKpis.actionItemsOpen} sub="2 overdue" color={T.warn} />
        <KpiCard label="Recordings Synced" value={meetingKpis.recordingsSynced} sub="from ro.am" color={T.green} />
      </div>
      <Card title="UPCOMING MEETINGS" titleColor={C} action={<div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: T.green }} /><span style={{ fontSize: 11, color: T.textMid }}>Synced with ro.am</span></div>}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {upcomingMeetings.map((mtg) => (
            <div key={mtg.id} onMouseEnter={() => setHoveredRow(mtg.id)} onMouseLeave={() => setHoveredRow(null)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", background: hoveredRow === mtg.id ? C + "08" : T.bg0, border: `1px solid ${hoveredRow === mtg.id ? C + "25" : T.border}`, borderRadius: 8, transition: "all .15s", cursor: "pointer" }} onClick={() => onJoinMeeting(mtg)}>
              <div style={{ minWidth: 80 }}><div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{mtg.time}</div><div style={{ fontSize: 10, color: T.textDim }}>{fmtDate(mtg.date)}</div></div>
              <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{mtg.title}</div><div style={{ fontSize: 11, color: T.textDim }}>{mtg.room} · {mtg.duration}{mtg.recurring ? " · Recurring" : ""}</div></div>
              <ParticipantRow ids={mtg.participants} />
              <div style={{ fontSize: 11, color: T.textDim, minWidth: 60, textAlign: "right" }}>{mtg.agenda.length} items</div>
              <button onClick={(e) => { e.stopPropagation(); onJoinMeeting(mtg); }} style={{ background: C, border: "none", borderRadius: 8, padding: "6px 16px", color: "#1A1A1A", fontSize: 11, fontWeight: 700, cursor: "pointer", opacity: hoveredRow === mtg.id ? 1 : 0.7 }}>Open</button>
            </div>
          ))}
        </div>
      </Card>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card title="RECENT RECORDINGS" titleColor={C}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {pastMeetings.filter((m) => m.hasRecording).map((mtg) => (
              <div key={mtg.id} style={{ padding: "10px 12px", background: T.bg0, border: `1px solid ${T.border}`, borderRadius: 8, cursor: "pointer", transition: "all .15s" }} onClick={() => onViewPastMeeting(mtg)} onMouseEnter={(e) => { e.currentTarget.style.borderColor = C + "40"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{mtg.title}</span><span style={{ fontSize: 10, color: T.textDim }}>{mtg.duration}</span></div>
                <div style={{ fontSize: 11, color: T.textDim, marginBottom: 6 }}>{fmtDate(mtg.date)} · {mtg.room}</div>
                <div style={{ fontSize: 11, color: T.textMid, lineHeight: 1.4 }}>{mtg.magicMinutes?.summary?.slice(0, 120)}...</div>
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>{mtg.hasTranscript && <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: T.blue + "20", color: T.blue }}>Transcript</span>}<span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: T.green + "20", color: T.green }}>{mtg.actionItemsComplete}/{mtg.actionItems} done</span></div>
              </div>
            ))}
          </div>
        </Card>
        <Card title="NOTES ARCHIVE" titleColor={C} action={<input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search notes..." style={{ background: T.bg0, border: `1px solid ${T.border}`, borderRadius: 6, padding: "4px 10px", color: T.text, fontSize: 11, outline: "none", width: 140, fontFamily: "inherit" }} onFocus={(e) => (e.currentTarget.style.borderColor = C)} onBlur={(e) => (e.currentTarget.style.borderColor = T.border)} />}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {notesArchive.filter((n) => !search || n.title.toLowerCase().includes(search.toLowerCase()) || n.tags.some((t) => t.includes(search.toLowerCase()))).map((note) => (
              <div key={note.id} style={{ padding: "10px 12px", background: T.bg0, border: `1px solid ${T.border}`, borderRadius: 8, cursor: "pointer", transition: "all .15s" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = C + "40"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{note.title}</span><span style={{ fontSize: 10, color: T.textDim }}>{note.noteCount} notes</span></div>
                <div style={{ fontSize: 11, color: T.textDim, marginBottom: 6 }}>{fmtDate(note.date)} · {note.author}</div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>{note.tags.map((tag) => (<span key={tag} style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: C + "15", color: C, textTransform: "uppercase", letterSpacing: 0.5 }}>{tag}</span>))}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
//  HIGH FIVE CARD — The compact summary format
//  Title — Attendees — Links
//  1-5 bullet points (one line each, one "Therefore:" action statement)
// ═══════════════════════════════════════════════════════════════════
const HighFiveCard = ({ entry, onExpand, compact = false }) => {
  const sourceColors = { meeting: C, manual: T.teal, notepad: T.purple };
  const sourceLabels = { meeting: "MEETING", manual: "QUICK", notepad: "FROM NOTES" };
  const accentColor = sourceColors[entry.source] || C;
  const therefores = entry.bullets.filter(b => b.toLowerCase().startsWith("therefore:"));
  const regularBullets = entry.bullets.filter(b => !b.toLowerCase().startsWith("therefore:"));

  return (
    <div style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 10, padding: compact ? "12px 14px" : "16px 20px", borderLeft: `3px solid ${entry.pinned ? T.warn : accentColor}`, transition: "all .15s" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = accentColor + "60"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.borderLeftColor = entry.pinned ? T.warn : accentColor; }}>
      {/* Header: Title — Date — Source badge */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
            {entry.pinned && <Icon d="M12 2L2 7l10 5 10-5-10-5z" color={T.warn} size={11} />}
            <span style={{ fontSize: compact ? 13 : 14, fontWeight: 700, color: T.text }}>{entry.title}</span>
            <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 4, background: accentColor + "15", color: accentColor, fontWeight: 700, letterSpacing: 0.5 }}>{sourceLabels[entry.source] || "HIGH FIVE"}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: T.textDim, flexWrap: "wrap" }}>
            <span>{fmtDate(entry.date)}</span>
            {entry.time && <><span>·</span><span>{entry.time}</span></>}
            {entry.attendees.length > 0 && <><span>—</span><span style={{ color: T.textMid }}>{entry.attendees.join(", ")}</span></>}
          </div>
        </div>
        {onExpand && entry.source === "meeting" && (
          <button onClick={() => onExpand(entry)} style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 6, padding: "4px 10px", color: T.textMid, fontSize: 10, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = C; e.currentTarget.style.color = C; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textMid; }}>
            Full Details
          </button>
        )}
      </div>

      {/* Links */}
      {entry.links.length > 0 && (
        <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
          {entry.links.map((link, i) => (
            <span key={i} style={{ fontSize: 10, padding: "3px 8px", borderRadius: 4, background: T.blue + "12", color: T.blue, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
              <Icon d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" color={T.blue} size={9} />
              {link.label}
            </span>
          ))}
        </div>
      )}

      {/* Bullets — single-line, no wrapping */}
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {regularBullets.map((bullet, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12, color: T.textMid, lineHeight: 1.4, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
            <span style={{ color: T.textDim, flexShrink: 0, marginTop: 1 }}>•</span>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{bullet}</span>
          </div>
        ))}
        {therefores.map((bullet, i) => (
          <div key={`t-${i}`} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12, color: C, lineHeight: 1.4, fontWeight: 600, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", marginTop: 2 }}>
            <span style={{ flexShrink: 0, marginTop: 1 }}>→</span>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{bullet}</span>
          </div>
        ))}
      </div>

      {/* Tags */}
      {entry.tags.length > 0 && (
        <div style={{ display: "flex", gap: 4, marginTop: 8, flexWrap: "wrap" }}>
          {entry.tags.map(tag => {
            const obj = getTagObj(tag);
            const tagColor = obj?.color || accentColor;
            return (
              <span key={tag} style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 9, padding: "2px 6px", borderRadius: 4, background: tagColor + "12", color: tagColor, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: tagColor, flexShrink: 0 }} />
                {tag}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
//  NOTEPAD VIEW — Long-form general-purpose notes
//  When completed, auto-generates a High Five summary
// ═══════════════════════════════════════════════════════════════════
const NotepadView = () => {
  const [notes, setNotes] = useState(notepadEntries);
  const [activeNote, setActiveNote] = useState(null);
  const [showNewNote, setShowNewNote] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newTags, setNewTags] = useState([]);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return notes;
    const q = search.toLowerCase();
    return notes.filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q) || n.tags.some(t => t.includes(q)));
  }, [notes, search]);

  const draftCount = notes.filter(n => n.status === "draft").length;
  const completedCount = notes.filter(n => n.status === "completed").length;

  const createNote = () => {
    if (!newTitle.trim()) return;
    const ts = new Date();
    const note = {
      id: `np-new-${Date.now()}`,
      title: newTitle.trim(),
      date: ts.toISOString().slice(0, 10),
      time: ts.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      status: "draft",
      linkedMeeting: null,
      highFiveId: null,
      tags: newTags,
      content: newContent,
      attachments: [],
    };
    setNotes([note, ...notes]);
    setActiveNote(note);
    setShowNewNote(false);
    setNewTitle("");
    setNewContent("");
    setNewTags([]);
  };

  const updateNoteContent = (id, content) => {
    setNotes(notes.map(n => n.id === id ? { ...n, content } : n));
    if (activeNote?.id === id) setActiveNote({ ...activeNote, content });
  };

  const updateNoteAttachments = (id, attachments) => {
    setNotes(notes.map(n => n.id === id ? { ...n, attachments } : n));
    if (activeNote?.id === id) setActiveNote({ ...activeNote, attachments });
  };

  const completeNote = (id) => {
    setNotes(notes.map(n => n.id === id ? { ...n, status: "completed" } : n));
    if (activeNote?.id === id) setActiveNote({ ...activeNote, status: "completed" });
  };

  const reopenNote = (id) => {
    setNotes(notes.map(n => n.id === id ? { ...n, status: "draft" } : n));
    if (activeNote?.id === id) setActiveNote({ ...activeNote, status: "draft" });
  };

  // If viewing a single note
  if (activeNote) {
    const note = notes.find(n => n.id === activeNote.id) || activeNote;
    const linkedHF = highFives.find(hf => hf.notepadId === note.id);

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <button onClick={() => setActiveNote(null)} style={{ background: "transparent", border: "none", cursor: "pointer", color: T.textDim, fontSize: 12, padding: 0, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6, alignSelf: "flex-start" }} onMouseEnter={(e) => (e.currentTarget.style.color = C)} onMouseLeave={(e) => (e.currentTarget.style.color = T.textDim)}>
          <Icon d="M19 12H5M12 19l-7-7 7-7" color="currentColor" />Back to Notepad
        </button>

        {/* Note Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: T.text }}>{note.title}</h2>
              <span style={{ fontSize: 10, padding: "3px 10px", borderRadius: 20, background: note.status === "completed" ? T.green + "20" : T.blue + "20", color: note.status === "completed" ? T.green : T.blue, fontWeight: 600, textTransform: "uppercase" }}>{note.status}</span>
            </div>
            <div style={{ fontSize: 12, color: T.textDim, marginTop: 4 }}>{fmtDate(note.date)} · {note.time}</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {note.status === "draft" && (
              <button onClick={() => completeNote(note.id)} style={{ background: T.green, border: "none", borderRadius: 8, padding: "8px 16px", color: "#1A1A1A", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                <Icon d="M22 11.08V12a10 10 0 1 1-5.93-9.14 M22 4L12 14.01l-3-3" color="#1A1A1A" size={12} />Complete & Generate High Five
              </button>
            )}
            {note.status === "completed" && (
              <button onClick={() => reopenNote(note.id)} style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 16px", color: T.textMid, fontSize: 12, cursor: "pointer" }}>Reopen as Draft</button>
            )}
          </div>
        </div>

        {/* Tags (editable via TagPicker) */}
        <div>
          <div style={{ fontSize: 10, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600, marginBottom: 6 }}>Tags</div>
          <TagPicker selectedTags={note.tags} onChange={(tags) => { setNotes(notes.map(n => n.id === note.id ? { ...n, tags } : n)); if (activeNote?.id === note.id) setActiveNote({ ...activeNote, tags }); }} accentColor={T.purple} />
        </div>

        {/* Generated High Five (if completed) */}
        {note.status === "completed" && linkedHF && (
          <div>
            <div style={{ fontSize: 11, color: T.textDim, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
              <Icon d="M22 11.08V12a10 10 0 1 1-5.93-9.14 M22 4L12 14.01l-3-3" color={T.green} size={12} />
              Auto-Generated High Five
            </div>
            <HighFiveCard entry={linkedHF} compact />
          </div>
        )}
        {note.status === "completed" && !linkedHF && (
          <div style={{ background: T.green + "08", border: `1px solid ${T.green}20`, borderRadius: 10, padding: 14, display: "flex", alignItems: "center", gap: 10 }}>
            <Icon d="M22 11.08V12a10 10 0 1 1-5.93-9.14 M22 4L12 14.01l-3-3" color={T.green} size={16} />
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>High Five will be generated</div>
              <div style={{ fontSize: 11, color: T.textDim }}>In production, SENS AI will summarize your notes into the High Five format automatically.</div>
            </div>
          </div>
        )}

        {/* Rich Text Editor */}
        <div style={{ fontSize: 11, color: T.textDim, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>Full Notes</div>
        <RichTextEditor
          content={note.content}
          onChange={(html) => updateNoteContent(note.id, html)}
          readOnly={note.status === "completed"}
          placeholder="Start writing your notes here. Use the toolbar for formatting — bold, italic, headings, lists, links, and more. When you mark this as complete, SENS will auto-generate a High Five summary."
        />

        {/* File Attachments */}
        <FileAttachments
          files={note.attachments || []}
          onChange={(attachments) => updateNoteAttachments(note.id, attachments)}
          readOnly={note.status === "completed"}
        />
      </div>
    );
  }

  // Main Notepad list view
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 13, color: T.textMid, lineHeight: 1.5 }}>Long-form notes. Write freely, then complete to auto-generate a High Five summary.</div>
        <button onClick={() => setShowNewNote(!showNewNote)} style={{ background: showNewNote ? T.danger + "20" : T.purple, border: showNewNote ? `1px solid ${T.danger}40` : "none", borderRadius: 8, padding: "8px 18px", color: showNewNote ? T.danger : "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
          {showNewNote ? <><Icon d="M18 6L6 18M6 6l12 12" color={T.danger} size={12} />Cancel</> : <><Icon d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6" color="#fff" size={12} />New Note</>}
        </button>
      </div>

      {/* New Note Form */}
      {showNewNote && (
        <div style={{ background: T.purple + "08", border: `1px solid ${T.purple}25`, borderRadius: 10, padding: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.purple, marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.8 }}>New Notepad Entry</div>
          <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Note title..." style={{ width: "100%", background: T.bg0, border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 14px", color: T.text, fontSize: 14, fontWeight: 600, outline: "none", fontFamily: "inherit", marginBottom: 12, boxSizing: "border-box" }} onFocus={(e) => (e.currentTarget.style.borderColor = T.purple)} onBlur={(e) => (e.currentTarget.style.borderColor = T.border)} />
          <div style={{ marginBottom: 12 }}>
            <RichTextEditor
              content={newContent}
              onChange={(html) => setNewContent(html)}
              readOnly={false}
              placeholder="Start writing... Use the toolbar for formatting — bold, italic, headings, lists, links, and more."
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600, marginBottom: 6 }}>Tags</div>
            <TagPicker selectedTags={newTags} onChange={setNewTags} accentColor={T.purple} />
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button onClick={() => setShowNewNote(false)} style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 16px", color: T.textMid, fontSize: 12, cursor: "pointer" }}>Cancel</button>
            <button onClick={createNote} disabled={!newTitle.trim()} style={{ background: newTitle.trim() ? T.purple : T.bg3, border: "none", borderRadius: 8, padding: "8px 20px", color: newTitle.trim() ? "#fff" : T.textDim, fontSize: 12, fontWeight: 600, cursor: newTitle.trim() ? "pointer" : "default" }}>Create Note</button>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: window.innerWidth < 768 ? "1fr" : "repeat(3, 1fr)", gap: 12 }}>
        <KpiCard label="Total Notes" value={notes.length} sub="in notepad" color={T.purple} />
        <KpiCard label="Drafts" value={draftCount} sub="in progress" color={T.blue} />
        <KpiCard label="Completed" value={completedCount} sub="with High Fives" color={T.green} />
      </div>

      {/* Search */}
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search notes..." style={{ background: T.bg0, border: `1px solid ${T.border}`, borderRadius: 6, padding: "8px 14px", color: T.text, fontSize: 12, outline: "none", fontFamily: "inherit" }} onFocus={(e) => (e.currentTarget.style.borderColor = T.purple)} onBlur={(e) => (e.currentTarget.style.borderColor = T.border)} />

      {/* Notes List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.map(note => (
          <div key={note.id} onClick={() => setActiveNote(note)} style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 10, padding: "14px 18px", cursor: "pointer", borderLeft: `3px solid ${note.status === "completed" ? T.green : T.purple}`, transition: "all .15s" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.purple + "60"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.borderLeftColor = note.status === "completed" ? T.green : T.purple; }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: T.text, flex: 1 }}>{note.title}</span>
              <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 4, background: note.status === "completed" ? T.green + "20" : T.blue + "20", color: note.status === "completed" ? T.green : T.blue, fontWeight: 700, textTransform: "uppercase" }}>{note.status}</span>
            </div>
            <div style={{ fontSize: 11, color: T.textDim, marginBottom: 6, display: "flex", gap: 8, alignItems: "center" }}>
              <span>{fmtDate(note.date)} · {note.time}</span>
              {(note.attachments?.length > 0) && <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 9, padding: "1px 6px", borderRadius: 4, background: T.blue + "12", color: T.blue }}><Icon d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" color={T.blue} size={8} />{note.attachments.length} file{note.attachments.length !== 1 ? "s" : ""}</span>}
            </div>
            <div style={{ fontSize: 12, color: T.textMid, lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{note.content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 200)}</div>
            {(note.tags.length > 0 || note.status === "completed") && (
              <div style={{ display: "flex", gap: 4, marginTop: 8, flexWrap: "wrap" }}>
                {note.tags.map(tag => { const obj = getTagObj(tag); const tagColor = obj?.color || T.purple; return (<span key={tag} style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 9, padding: "2px 6px", borderRadius: 4, background: tagColor + "12", color: tagColor, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 }}><span style={{ width: 5, height: 5, borderRadius: "50%", background: tagColor, flexShrink: 0 }} />{tag}</span>); })}
                {note.status === "completed" && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: T.green + "12", color: T.green, marginLeft: "auto" }}>HIGH FIVE GENERATED</span>}
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && <div style={{ textAlign: "center", padding: 40, color: T.textDim, fontSize: 12 }}>No notes yet. Create your first note above.</div>}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
//  HIGH FIVES VIEW — All summary cards (meetings, manual, from notes)
// ═══════════════════════════════════════════════════════════════════
const HighFivesView = ({ onViewPastMeeting }) => {
  const [filter, setFilter] = useState("all"); // all | meeting | manual | notepad | pinned
  const [search, setSearch] = useState("");
  const [showNewHF, setShowNewHF] = useState(false);
  const [newHFTitle, setNewHFTitle] = useState("");
  const [newHFBullets, setNewHFBullets] = useState(["", "", ""]);
  const [newHFTags, setNewHFTags] = useState([]);
  const [entries, setEntries] = useState(highFives);

  const filtered = useMemo(() => {
    let items = entries;
    if (filter === "meeting") items = items.filter(e => e.source === "meeting");
    else if (filter === "manual") items = items.filter(e => e.source === "manual");
    else if (filter === "notepad") items = items.filter(e => e.source === "notepad");
    else if (filter === "pinned") items = items.filter(e => e.pinned);
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(e => e.title.toLowerCase().includes(q) || e.bullets.some(b => b.toLowerCase().includes(q)) || e.tags.some(t => t.includes(q)));
    }
    return items.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.date) - new Date(a.date);
    });
  }, [entries, filter, search]);

  const meetingCount = entries.filter(e => e.source === "meeting").length;
  const manualCount = entries.filter(e => e.source === "manual").length;
  const notepadCount = entries.filter(e => e.source === "notepad").length;
  const pinnedCount = entries.filter(e => e.pinned).length;

  const handleExpand = (entry) => {
    const pm = pastMeetings.find(m => m.id === entry.meetingId);
    if (pm) onViewPastMeeting(pm);
  };

  const addBulletField = () => { if (newHFBullets.length < 5) setNewHFBullets([...newHFBullets, ""]); };
  const updateBullet = (idx, val) => { const u = [...newHFBullets]; u[idx] = val; setNewHFBullets(u); };
  const removeBullet = (idx) => { if (newHFBullets.length > 1) setNewHFBullets(newHFBullets.filter((_, i) => i !== idx)); };

  const saveNewHF = () => {
    if (!newHFTitle.trim()) return;
    const validBullets = newHFBullets.filter(b => b.trim());
    if (validBullets.length === 0) return;
    const ts = new Date();
    const newEntry = {
      id: `hf-new-${Date.now()}`, source: "manual", meetingId: null, notepadId: null,
      title: newHFTitle.trim(), date: ts.toISOString().slice(0, 10),
      time: ts.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      attendees: [], links: [], bullets: validBullets,
      tags: newHFTags, pinned: false,
    };
    setEntries([newEntry, ...entries]);
    setShowNewHF(false);
    setNewHFTitle(""); setNewHFBullets(["", "", ""]); setNewHFTags([]);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 13, color: T.textMid, lineHeight: 1.5 }}>Compact summaries — auto-generated from meetings and notes, or written manually.</div>
        <button onClick={() => setShowNewHF(!showNewHF)} style={{ background: showNewHF ? T.danger + "20" : C, border: showNewHF ? `1px solid ${T.danger}40` : "none", borderRadius: 8, padding: "8px 18px", color: showNewHF ? T.danger : "#1A1A1A", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
          {showNewHF ? <><Icon d="M18 6L6 18M6 6l12 12" color={T.danger} size={12} />Cancel</> : <><Icon d="M12 5v14M5 12h14" color="#1A1A1A" size={12} />Write High Five</>}
        </button>
      </div>

      {/* New High Five Form */}
      {showNewHF && (
        <div style={{ background: C + "08", border: `1px solid ${C}25`, borderRadius: 10, padding: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C, marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.8 }}>New High Five</div>
          <input value={newHFTitle} onChange={(e) => setNewHFTitle(e.target.value)} placeholder="Title..." style={{ width: "100%", background: T.bg0, border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 14px", color: T.text, fontSize: 14, fontWeight: 600, outline: "none", fontFamily: "inherit", marginBottom: 12, boxSizing: "border-box" }} onFocus={(e) => (e.currentTarget.style.borderColor = C)} onBlur={(e) => (e.currentTarget.style.borderColor = T.border)} />
          <div style={{ fontSize: 10, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600, marginBottom: 8 }}>Bullet Points (1-5, keep each to one line)</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
            {newHFBullets.map((bullet, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: T.textDim, fontSize: 12, minWidth: 14 }}>{idx + 1}.</span>
                <input value={bullet} onChange={(e) => updateBullet(idx, e.target.value)} placeholder={idx === newHFBullets.length - 1 ? 'Start with "Therefore:" for the action/outcome' : "Key point..."} style={{ flex: 1, background: T.bg0, border: `1px solid ${T.border}`, borderRadius: 6, padding: "8px 12px", color: T.text, fontSize: 12, outline: "none", fontFamily: "inherit" }} onFocus={(e) => (e.currentTarget.style.borderColor = C)} onBlur={(e) => (e.currentTarget.style.borderColor = T.border)} />
                {newHFBullets.length > 1 && <button onClick={() => removeBullet(idx)} style={{ background: "transparent", border: "none", color: T.textDim, cursor: "pointer", padding: 4, fontSize: 14 }}>&times;</button>}
              </div>
            ))}
            {newHFBullets.length < 5 && (
              <button onClick={addBulletField} style={{ background: "transparent", border: `1px dashed ${T.border}`, borderRadius: 6, padding: "6px 10px", color: T.textDim, fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = C; e.currentTarget.style.color = C; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textDim; }}>
                <Icon d="M12 5v14M5 12h14" size={10} color="currentColor" />Add bullet ({5 - newHFBullets.length} remaining)
              </button>
            )}
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600, marginBottom: 6 }}>Tags</div>
            <TagPicker selectedTags={newHFTags} onChange={setNewHFTags} accentColor={C} />
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button onClick={() => setShowNewHF(false)} style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 16px", color: T.textMid, fontSize: 12, cursor: "pointer" }}>Cancel</button>
            <button onClick={saveNewHF} disabled={!newHFTitle.trim()} style={{ background: newHFTitle.trim() ? C : T.bg3, border: "none", borderRadius: 8, padding: "8px 20px", color: newHFTitle.trim() ? "#1A1A1A" : T.textDim, fontSize: 12, fontWeight: 600, cursor: newHFTitle.trim() ? "pointer" : "default" }}>Save</button>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: window.innerWidth < 768 ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: 12 }}>
        <KpiCard label="Total" value={entries.length} sub="high fives" color={C} />
        <KpiCard label="From Meetings" value={meetingCount} sub="auto-generated" color={C} />
        <KpiCard label="From Notes" value={notepadCount} sub="auto-summarized" color={T.purple} />
        <KpiCard label="Manual" value={manualCount} sub="quick write" color={T.teal} />
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        {[{ key: "all", label: "All" }, { key: "meeting", label: `Meetings (${meetingCount})` }, { key: "notepad", label: `From Notes (${notepadCount})` }, { key: "manual", label: `Manual (${manualCount})` }].map(f => (
          <Pill key={f.key} active={filter === f.key} color={C} onClick={() => setFilter(f.key)}>{f.label}</Pill>
        ))}
        {pinnedCount > 0 && <Pill active={filter === "pinned"} color={T.warn} onClick={() => setFilter("pinned")}>Pinned ({pinnedCount})</Pill>}
        <div style={{ flex: 1 }} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search high fives..." style={{ background: T.bg0, border: `1px solid ${T.border}`, borderRadius: 6, padding: "6px 12px", color: T.text, fontSize: 12, outline: "none", width: 180, fontFamily: "inherit" }} onFocus={(e) => (e.currentTarget.style.borderColor = C)} onBlur={(e) => (e.currentTarget.style.borderColor = T.border)} />
      </div>

      {/* Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map(entry => (
          <HighFiveCard key={entry.id} entry={entry} onExpand={handleExpand} />
        ))}
        {filtered.length === 0 && <div style={{ textAlign: "center", padding: 40, color: T.textDim, fontSize: 12 }}>No high fives match the current filter.</div>}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
//  JOURNAL TAB — Combines Notepad + High Fives as two sub-views
// ═══════════════════════════════════════════════════════════════════
const JournalView = ({ onViewPastMeeting }) => {
  const [subTab, setSubTab] = useState(0);
  const totalFiles = notepadEntries.reduce((sum, n) => sum + (n.attachments?.length || 0), 0);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Sub-tabs */}
      <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${T.border}` }}>
        {[
          { label: "High Fives", icon: "M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z M4 22h-1a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h1", color: C, count: highFives.length },
          { label: "Notepad", icon: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8", color: T.purple, count: notepadEntries.length },
          { label: "Files", icon: "M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z", color: T.blue, count: totalFiles },
        ].map((tab, i) => (
          <button key={i} onClick={() => setSubTab(i)} style={{ padding: "10px 20px", background: "transparent", border: "none", borderBottom: subTab === i ? `2px solid ${tab.color}` : "2px solid transparent", color: subTab === i ? T.text : T.textDim, fontSize: 13, fontWeight: subTab === i ? 600 : 400, cursor: "pointer", transition: "all .15s", display: "flex", alignItems: "center", gap: 8 }}>
            <Icon d={tab.icon} color={subTab === i ? tab.color : T.textDim} size={14} />
            {tab.label}
            <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 8, background: subTab === i ? tab.color + "20" : T.bg3, color: subTab === i ? tab.color : T.textDim, fontWeight: 600 }}>{tab.count}</span>
          </button>
        ))}
      </div>

      {subTab === 0 && <HighFivesView onViewPastMeeting={onViewPastMeeting} />}
      {subTab === 1 && <NotepadView />}
      {subTab === 2 && <FilesView notes={notepadEntries} />}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
//  PAST MEETING DETAIL (Completed Meeting View)
// ═══════════════════════════════════════════════════════════════════
const PastMeetingDetail = ({ meeting, onBack }) => {
  const [showTranscript, setShowTranscript] = useState(false);
  const mm = meeting.magicMinutes;
  const risks = meetingRisks.filter(r => r.linkedMeeting === meeting.id);
  const hf = highFives.find(e => e.meetingId === meeting.id);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <button onClick={onBack} style={{ background: "transparent", border: "none", cursor: "pointer", color: T.textDim, fontSize: 12, padding: 0, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6, alignSelf: "flex-start" }} onMouseEnter={(e) => (e.currentTarget.style.color = C)} onMouseLeave={(e) => (e.currentTarget.style.color = T.textDim)}><Icon d="M19 12H5M12 19l-7-7 7-7" color="currentColor" />Back</button>

      {/* Completed Meeting Header */}
      <div style={{ background: T.bg1, border: `1px solid ${T.border}`, borderRadius: 12, padding: "18px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: T.green + "15", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon d="M22 11.08V12a10 10 0 1 1-5.93-9.14 M22 4L12 14.01l-3-3" color={T.green} size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: T.text }}>{meeting.title}</h2>
              <span style={{ fontSize: 10, padding: "3px 10px", borderRadius: 20, background: T.green + "20", color: T.green, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Completed</span>
            </div>
            <div style={{ fontSize: 12, color: T.textDim, marginTop: 4, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <span>{fmtDate(meeting.date)} · {meeting.time} · {meeting.duration}</span>
              <span>·</span>
              <span>{meeting.room}</span>
              {meeting.hasRecording && <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: T.blue + "15", color: T.blue }}>Recorded</span>}
              {meeting.hasTranscript && <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: T.purple + "15", color: T.purple }}>Transcript</span>}
              <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: T.green + "15", color: T.green }}>{meeting.actionItemsComplete}/{meeting.actionItems} actions done</span>
            </div>
          </div>
          <ParticipantRow ids={meeting.participants} max={8} />
        </div>
      </div>

      {/* High Five Summary */}
      {hf && (
        <div>
          <div style={{ fontSize: 11, color: T.textDim, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <Icon d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" color={C} size={12} />
            High Five
          </div>
          <HighFiveCard entry={hf} compact />
        </div>
      )}

      {/* Magic Minutes Full Detail */}
      {mm && <Card title="MAGIC MINUTES — FULL SUMMARY" titleColor={C}><p style={{ fontSize: 13, color: T.textMid, lineHeight: 1.55, margin: 0 }}>{mm.summary}</p></Card>}

      {mm && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Card title="KEY DECISIONS" titleColor={T.green}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {mm.keyDecisions.map((d, i) => (
                <div key={i} style={{ display: "flex", gap: 8, fontSize: 13, color: T.text, lineHeight: 1.4 }}>
                  <Icon d="M22 11.08V12a10 10 0 1 1-5.93-9.14 M22 4L12 14.01l-3-3" color={T.green} size={16} />{d}
                </div>
              ))}
            </div>
          </Card>
          <Card title="ACTION ITEMS" titleColor={C}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {mm.actionItems.map((a, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "6px 8px", background: a.done ? T.green + "06" : (!a.done && new Date(a.due) < new Date()) ? T.danger + "08" : T.bg0, borderRadius: 6, fontSize: 12, border: `1px solid ${a.done ? T.green + "15" : (!a.done && new Date(a.due) < new Date()) ? T.danger + "20" : "transparent"}` }}>
                  <input type="checkbox" checked={a.done} readOnly style={{ marginTop: 2, accentColor: C }} />
                  <div style={{ flex: 1, color: a.done ? T.textDim : T.text, textDecoration: a.done ? "line-through" : "none" }}>
                    {a.task}
                    <div style={{ fontSize: 10, color: a.done ? T.textDim : (!a.done && new Date(a.due) < new Date()) ? T.danger : T.textDim, marginTop: 2 }}>
                      {a.assignee} · Due {a.due.slice(5)}{!a.done && new Date(a.due) < new Date() && " · OVERDUE"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Linked Risks */}
      {risks.length > 0 && (
        <Card title="LINKED RISKS" titleColor={T.warn}>
          {risks.map((risk) => (
            <div key={risk.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: T.bg0, borderRadius: 6, marginBottom: 6 }}>
              <SeverityDot severity={risk.severity} /><span style={{ fontSize: 12, color: T.text, flex: 1 }}>{risk.title}</span>
              <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: risk.status === "escalated" ? T.danger + "20" : T.warn + "20", color: risk.status === "escalated" ? T.danger : T.warn, fontWeight: 600 }}>{risk.status}</span>
            </div>
          ))}
        </Card>
      )}

      {/* Transcript */}
      {meeting.hasTranscript && meeting.transcript?.length > 0 && (
        <Card title="TRANSCRIPT" titleColor={T.blue} action={<button onClick={() => setShowTranscript(!showTranscript)} style={{ background: "transparent", border: `1px solid ${T.border}`, borderRadius: 6, padding: "4px 12px", color: T.textMid, fontSize: 11, cursor: "pointer" }}>{showTranscript ? "Collapse" : "Expand"}</button>}>
          {showTranscript ? (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {meeting.transcript.map((line, i) => (
                <div key={i} style={{ padding: "8px 0", borderBottom: i < meeting.transcript.length - 1 ? `1px solid ${T.border}` : "none" }}>
                  <div style={{ display: "flex", gap: 8, marginBottom: 2 }}><span style={{ fontSize: 12, fontWeight: 600, color: C }}>{line.speaker}</span><span style={{ fontSize: 10, color: T.textDim }}>{line.time}</span></div>
                  <div style={{ fontSize: 13, color: T.text, lineHeight: 1.5 }}>{line.text}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 12, color: T.textDim }}>{meeting.transcript.length} entries · Click expand to view</div>
          )}
        </Card>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
//  MAIN MEETING VIEW EXPORT
// ═══════════════════════════════════════════════════════════════════
export const MeetingView = () => {
  const [mode, setMode] = useState("list");
  const [activeMeeting, setActiveMeeting] = useState(null);
  const [activeTemplate, setActiveTemplate] = useState(null);
  const [pastMeeting, setPastMeeting] = useState(null);
  const [topTab, setTopTab] = useState(0);
  const topTabs = ["Overview", "Journal", "Calendar", "Templates", "Action Items", "Analytics", "Risks"];
  const { isMobile } = useViewport();

  const handleJoinMeeting = (mtg) => { setActiveMeeting(mtg); setActiveTemplate(null); setMode("active"); };
  const handleStartFromTemplate = (tpl) => {
    const mtg = { id: `new-${Date.now()}`, title: `New ${tpl.name}`, time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }), date: "2026-02-25", duration: tpl.duration, room: "Select Room", roamGroupId: null, participants: tpl.suggestedParticipants, recurring: false, status: "active", agenda: tpl.sections.agenda };
    setActiveMeeting(mtg); setActiveTemplate(tpl); setMode("active");
  };
  const handleCalendarMeeting = (calMtg) => {
    const tpl = meetingTemplates.find(t => t.id === calMtg.template);
    const mtg = { id: calMtg.id, title: calMtg.title, time: calMtg.time, date: "2026-02-25", duration: calMtg.duration, room: "Meeting Room", roamGroupId: null, participants: tpl?.suggestedParticipants || ["thomas"], recurring: false, status: "active", agenda: tpl?.sections?.agenda || [] };
    setActiveMeeting(mtg); setActiveTemplate(tpl); setMode("active");
  };
  const handleViewPastMeeting = (mtg) => { setPastMeeting(mtg); setMode("pastDetail"); };
  const handleClose = () => { setActiveMeeting(null); setActiveTemplate(null); setPastMeeting(null); setMode("list"); };

  if (mode === "active" && activeMeeting) return <ActiveMeetingWorkspace meeting={activeMeeting} onClose={handleClose} template={activeTemplate} />;
  if (mode === "pastDetail" && pastMeeting) return <PastMeetingDetail meeting={pastMeeting} onBack={handleClose} />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Top navigation tabs */}
      <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${T.border}`, marginBottom: -4, overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        {topTabs.map((tab, i) => (
          <button key={tab} onClick={() => setTopTab(i)} style={{ padding: isMobile ? "10px 14px" : "10px 20px", background: "transparent", border: "none", borderBottom: topTab === i ? `2px solid ${i === 1 ? T.teal : C}` : "2px solid transparent", color: topTab === i ? T.text : T.textDim, fontSize: isMobile ? 12 : 13, fontWeight: topTab === i ? 600 : 400, cursor: "pointer", transition: "all .15s", whiteSpace: "nowrap" }}>{tab}
            {i === 1 && highFives.filter(e => e.pinned).length > 0 && <span style={{ marginLeft: 6, fontSize: 9, padding: "1px 5px", borderRadius: 8, background: T.teal, color: "#fff", fontWeight: 700 }}>{highFives.filter(e => e.pinned).length}</span>}
            {i === 4 && allActionItems.filter(a => a.status === "overdue").length > 0 && <span style={{ marginLeft: 6, fontSize: 9, padding: "1px 5px", borderRadius: 8, background: T.danger, color: "#fff", fontWeight: 700 }}>{allActionItems.filter(a => a.status === "overdue").length}</span>}
            {i === 6 && meetingRisks.filter(r => r.severity === "red").length > 0 && <span style={{ marginLeft: 6, fontSize: 9, padding: "1px 5px", borderRadius: 8, background: T.danger, color: "#fff", fontWeight: 700 }}>{meetingRisks.filter(r => r.severity === "red").length}</span>}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {topTab === 0 && <MeetingListView onJoinMeeting={handleJoinMeeting} onViewPastMeeting={handleViewPastMeeting} />}
      {topTab === 1 && <JournalView onViewPastMeeting={handleViewPastMeeting} />}
      {topTab === 2 && <CalendarView onStartMeeting={handleCalendarMeeting} />}
      {topTab === 3 && <TemplatesView onStartFromTemplate={handleStartFromTemplate} />}
      {topTab === 4 && <ActionItemTracker />}
      {topTab === 5 && <AnalyticsView />}
      {topTab === 6 && <RiskView />}
    </div>
  );
};
