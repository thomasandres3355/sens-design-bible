/**
 * ═══════════════════════════════════════════════════════════════════
 *  NOTEPAD RICH TEXT EDITOR & FILE SYSTEM — PREVIEW
 *
 *  This file contains:
 *  1. RichTextToolbar — formatting toolbar (bold, italic, underline,
 *     font size, text color, bullet/numbered lists, heading)
 *  2. LinkModal — hyperlink insertion dialog
 *  3. RichTextEditor — contentEditable-based editor with toolbar
 *  4. FileAttachments — file upload & attachment tracker for notes
 *  5. FilesView — third Journal sub-tab showing all files across notes
 *  6. Updated NotepadView — integrates editor, attachments, files
 *  7. Updated JournalView — three sub-tabs: High Fives, Notepad, Files
 *
 *  DEPLOY: Replace the existing NotepadView and JournalView in
 *          MeetingView.jsx with these components
 * ═══════════════════════════════════════════════════════════════════
 */

import { useState, useRef, useEffect, useMemo, useCallback } from "react";

// Placeholder: these come from the existing MeetingView.jsx context
// import { T } from "@core/theme/theme";
// import { KpiCard } from "@core/ui";
// import { highFives, notepadEntries, tagRegistry } from "@modules/ai-agents/meetingData";

// ─── SVG icon paths used in toolbar ──────────────────────────────
const ICONS = {
  bold:        "M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z",
  italic:      "M19 4h-9 M14 20H5 M15 4L9 20",
  underline:   "M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3 M4 21h16",
  strikethrough: "M16 4H9a3 3 0 0 0 0 6h6a3 3 0 0 1 0 6H8 M4 12h16",
  heading:     "M4 12h8 M4 18V6 M12 18V6",
  bulletList:  "M8 6h13 M8 12h13 M8 18h13 M3 6h.01 M3 12h.01 M3 18h.01",
  numberList:  "M10 6h11 M10 12h11 M10 18h11 M4 6h1v4 M4 10h2 M6 18H4c0-1 2-2 2-3s-1-1.5-2-1",
  link:        "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71 M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
  unlink:      "M18.84 12.25l1.72-1.71a5 5 0 0 0-7.07-7.07l-1.72 1.71 M5.16 11.75l-1.72 1.71a5 5 0 0 0 7.07 7.07l1.72-1.71 M8 2v3 M2 8h3 M16 22v-3 M22 16h-3",
  image:       "M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z M8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z M21 15l-5-5L5 21",
  attach:      "M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48",
  download:    "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3",
  trash:       "M3 6h18 M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
  file:        "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6",
  filePlus:    "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M12 18v-6 M9 15h6",
  folder:      "M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z",
  alignLeft:   "M17 10H3 M21 6H3 M21 14H3 M17 18H3",
  indent:      "M3 8h18 M3 12h18 M3 16h18 M7 4L3 8l4 4",
  outdent:     "M3 8h18 M3 12h18 M3 16h18 M7 4l4 4-4 4",
  undo:        "M3 7v6h6 M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6.69 3L3 13",
  redo:        "M21 7v6h-6 M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6.69 3L21 13",
  quote:       "M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v4z",
  clearFormat: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7 M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z",
  divider:     "M5 12h14",
};

// ═══════════════════════════════════════════════════════════════════
//  1. LINK MODAL
// ═══════════════════════════════════════════════════════════════════
const LinkModal = ({ T, C, Icon, onInsert, onClose }) => {
  const [url, setUrl] = useState("https://");
  const [text, setText] = useState("");
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleInsert = () => {
    if (!url.trim() || url.trim() === "https://") return;
    onInsert(url.trim(), text.trim() || url.trim());
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: T.bg1, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24, width: 400, boxShadow: "0 12px 40px rgba(0,0,0,0.5)" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <Icon d={ICONS.link} color={C} size={16} />Insert Hyperlink
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <div style={{ fontSize: 10, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600, marginBottom: 4 }}>Display Text</div>
            <input ref={inputRef} value={text} onChange={(e) => setText(e.target.value)} placeholder="Link text (optional)" style={{ width: "100%", background: T.bg0, border: `1px solid ${T.border}`, borderRadius: 6, padding: "8px 12px", color: T.text, fontSize: 12, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} onFocus={(e) => (e.currentTarget.style.borderColor = C)} onBlur={(e) => (e.currentTarget.style.borderColor = T.border)} />
          </div>
          <div>
            <div style={{ fontSize: 10, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600, marginBottom: 4 }}>URL</div>
            <input value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleInsert(); }} placeholder="https://..." style={{ width: "100%", background: T.bg0, border: `1px solid ${T.border}`, borderRadius: 6, padding: "8px 12px", color: T.text, fontSize: 12, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} onFocus={(e) => (e.currentTarget.style.borderColor = C)} onBlur={(e) => (e.currentTarget.style.borderColor = T.border)} />
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
            <button onClick={onClose} style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 6, padding: "6px 14px", color: T.textMid, fontSize: 12, cursor: "pointer" }}>Cancel</button>
            <button onClick={handleInsert} style={{ background: C, border: "none", borderRadius: 6, padding: "6px 18px", color: "#1A1A1A", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Insert Link</button>
          </div>
        </div>
      </div>
    </div>
  );
};


// ═══════════════════════════════════════════════════════════════════
//  2. RICH TEXT TOOLBAR
// ═══════════════════════════════════════════════════════════════════
const RichTextToolbar = ({ T, C, Icon, editorRef, onLinkClick, readOnly = false }) => {
  const [fontSize, setFontSize] = useState("3"); // execCommand fontSize 1-7
  const [showColorPicker, setShowColorPicker] = useState(false);
  const colorRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (colorRef.current && !colorRef.current.contains(e.target)) setShowColorPicker(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const exec = useCallback((cmd, value = null) => {
    if (readOnly) return;
    editorRef.current?.focus();
    document.execCommand(cmd, false, value);
  }, [editorRef, readOnly]);

  const textColors = [
    { label: "Default", value: T.text },
    { label: "Accent", value: C },
    { label: "Green", value: T.green },
    { label: "Blue", value: T.blue },
    { label: "Purple", value: T.purple },
    { label: "Teal", value: T.teal },
    { label: "Warning", value: T.warn },
    { label: "Danger", value: T.danger },
    { label: "Dim", value: T.textDim },
  ];

  const ToolBtn = ({ icon, cmd, value, title, active, onClick }) => (
    <button
      onClick={(e) => { e.preventDefault(); onClick ? onClick() : exec(cmd, value); }}
      title={title}
      style={{
        width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
        background: active ? C + "20" : "transparent", border: active ? `1px solid ${C}40` : `1px solid transparent`,
        borderRadius: 4, cursor: readOnly ? "default" : "pointer", opacity: readOnly ? 0.4 : 1,
        transition: "all .1s",
      }}
      onMouseEnter={(e) => { if (!readOnly) e.currentTarget.style.background = C + "15"; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
    >
      <Icon d={icon} size={13} color={active ? C : T.textMid} />
    </button>
  );

  const Divider = () => <div style={{ width: 1, height: 20, background: T.border, margin: "0 4px", flexShrink: 0 }} />;

  if (readOnly) return null;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2, padding: "6px 10px", background: T.bg2, borderBottom: `1px solid ${T.border}`, borderRadius: "10px 10px 0 0", flexWrap: "wrap" }}>
      {/* Undo / Redo */}
      <ToolBtn icon={ICONS.undo} cmd="undo" title="Undo (Ctrl+Z)" />
      <ToolBtn icon={ICONS.redo} cmd="redo" title="Redo (Ctrl+Y)" />
      <Divider />

      {/* Text Formatting */}
      <ToolBtn icon={ICONS.bold} cmd="bold" title="Bold (Ctrl+B)" />
      <ToolBtn icon={ICONS.italic} cmd="italic" title="Italic (Ctrl+I)" />
      <ToolBtn icon={ICONS.underline} cmd="underline" title="Underline (Ctrl+U)" />
      <ToolBtn icon={ICONS.strikethrough} cmd="strikeThrough" title="Strikethrough" />
      <Divider />

      {/* Font Size */}
      <select
        value={fontSize}
        onChange={(e) => { setFontSize(e.target.value); exec("fontSize", e.target.value); }}
        style={{ background: T.bg0, border: `1px solid ${T.border}`, borderRadius: 4, padding: "2px 4px", color: T.text, fontSize: 10, outline: "none", fontFamily: "inherit", cursor: "pointer", height: 28 }}
        title="Font Size"
      >
        <option value="1">XS</option>
        <option value="2">Small</option>
        <option value="3">Normal</option>
        <option value="4">Medium</option>
        <option value="5">Large</option>
        <option value="6">XL</option>
        <option value="7">XXL</option>
      </select>
      <Divider />

      {/* Heading */}
      <ToolBtn icon={ICONS.heading} title="Heading" onClick={() => exec("formatBlock", "<h3>")} />
      <ToolBtn icon={ICONS.quote} cmd="formatBlock" value="<blockquote>" title="Block Quote" />
      <Divider />

      {/* Text Color */}
      <div ref={colorRef} style={{ position: "relative" }}>
        <button
          onClick={() => setShowColorPicker(!showColorPicker)}
          title="Text Color"
          style={{
            width: 28, height: 28, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
            background: showColorPicker ? C + "15" : "transparent", border: "1px solid transparent",
            borderRadius: 4, cursor: "pointer",
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 700, color: T.text, lineHeight: 1 }}>A</span>
          <span style={{ width: 14, height: 3, borderRadius: 1, background: `linear-gradient(90deg, ${T.danger}, ${C}, ${T.blue}, ${T.green})` }} />
        </button>
        {showColorPicker && (
          <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 60, background: T.bg1, border: `1px solid ${T.border}`, borderRadius: 8, padding: 8, boxShadow: "0 8px 20px rgba(0,0,0,0.4)", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4, minWidth: 120 }}>
            {textColors.map(c => (
              <button key={c.value} onClick={() => { exec("foreColor", c.value); setShowColorPicker(false); }} title={c.label} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 6px", background: "transparent", border: `1px solid ${T.border}`, borderRadius: 4, cursor: "pointer", fontSize: 9, color: T.textMid }}
                onMouseEnter={(e) => { e.currentTarget.style.background = c.value + "15"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: c.value, flexShrink: 0, border: `1px solid ${T.border}` }} />
                {c.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <Divider />

      {/* Lists */}
      <ToolBtn icon={ICONS.bulletList} cmd="insertUnorderedList" title="Bullet List" />
      <ToolBtn icon={ICONS.numberList} cmd="insertOrderedList" title="Numbered List" />
      <ToolBtn icon={ICONS.indent} cmd="indent" title="Indent" />
      <ToolBtn icon={ICONS.outdent} cmd="outdent" title="Outdent" />
      <Divider />

      {/* Link & Divider */}
      <ToolBtn icon={ICONS.link} title="Insert Link" onClick={onLinkClick} />
      <ToolBtn icon={ICONS.divider} title="Horizontal Rule" onClick={() => exec("insertHorizontalRule")} />
      <Divider />

      {/* Clear Formatting */}
      <ToolBtn icon={ICONS.clearFormat} cmd="removeFormat" title="Clear Formatting" />
    </div>
  );
};


// ═══════════════════════════════════════════════════════════════════
//  3. RICH TEXT EDITOR (combines toolbar + contentEditable)
// ═══════════════════════════════════════════════════════════════════
const RichTextEditor = ({ T, C, Icon, content, onChange, readOnly = false, placeholder = "Start writing..." }) => {
  const editorRef = useRef(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const savedSelection = useRef(null);

  // Initialize content
  useEffect(() => {
    if (editorRef.current && content && !editorRef.current.innerHTML) {
      editorRef.current.innerHTML = content;
    }
  }, []);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleKeyDown = useCallback((e) => {
    // Tab key for indentation
    if (e.key === "Tab") {
      e.preventDefault();
      document.execCommand(e.shiftKey ? "outdent" : "indent", false, null);
    }
  }, []);

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel.rangeCount > 0) savedSelection.current = sel.getRangeAt(0).cloneRange();
  };

  const restoreSelection = () => {
    if (savedSelection.current) {
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(savedSelection.current);
    }
  };

  const handleLinkInsert = (url, text) => {
    editorRef.current?.focus();
    restoreSelection();
    const linkHtml = `<a href="${url}" target="_blank" rel="noopener" style="color:${C};text-decoration:underline;cursor:pointer">${text}</a>`;
    document.execCommand("insertHTML", false, linkHtml);
    handleInput();
  };

  const handleLinkClick = () => {
    saveSelection();
    setShowLinkModal(true);
  };

  return (
    <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden", transition: "border-color .15s" }}
      onFocus={(e) => { if (!readOnly) e.currentTarget.style.borderColor = T.purple; }}
      onBlur={(e) => { e.currentTarget.style.borderColor = T.border; }}
    >
      <RichTextToolbar T={T} C={C} Icon={Icon} editorRef={editorRef} onLinkClick={handleLinkClick} readOnly={readOnly} />

      <div
        ref={editorRef}
        contentEditable={!readOnly}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        suppressContentEditableWarning
        data-placeholder={placeholder}
        style={{
          minHeight: 350, padding: 20, color: T.text, fontSize: 13, lineHeight: 1.7,
          fontFamily: "'DM Sans', sans-serif", outline: "none", background: T.bg1,
          overflowY: "auto", maxHeight: 600, wordBreak: "break-word",
          ...(readOnly ? { opacity: 0.85, cursor: "default" } : {}),
        }}
      />

      {showLinkModal && <LinkModal T={T} C={C} Icon={Icon} onInsert={handleLinkInsert} onClose={() => setShowLinkModal(false)} />}

      {/* Empty-state placeholder via CSS-in-JS */}
      <style>{`
        [data-placeholder]:empty::before {
          content: attr(data-placeholder);
          color: ${T.textDim};
          font-style: italic;
          pointer-events: none;
        }
        [contenteditable] h3 { font-size: 16px; font-weight: 700; color: ${T.text}; margin: 16px 0 8px; }
        [contenteditable] blockquote { border-left: 3px solid ${C}; margin: 8px 0; padding: 6px 16px; color: ${T.textMid}; background: ${C}08; border-radius: 0 6px 6px 0; }
        [contenteditable] ul, [contenteditable] ol { padding-left: 24px; margin: 8px 0; }
        [contenteditable] li { margin: 4px 0; }
        [contenteditable] hr { border: none; border-top: 1px solid ${T.border}; margin: 16px 0; }
        [contenteditable] a { color: ${C}; text-decoration: underline; }
        [contenteditable] a:hover { opacity: 0.8; }
      `}</style>
    </div>
  );
};


// ═══════════════════════════════════════════════════════════════════
//  4. FILE ATTACHMENTS — Upload & track files on a note
// ═══════════════════════════════════════════════════════════════════
const FileAttachments = ({ T, C, Icon, files = [], onChange, readOnly = false }) => {
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const fileIcons = {
    pdf: { color: T.danger, label: "PDF" },
    doc: { color: T.blue, label: "DOC" },
    docx: { color: T.blue, label: "DOCX" },
    xls: { color: T.green, label: "XLS" },
    xlsx: { color: T.green, label: "XLSX" },
    ppt: { color: C, label: "PPT" },
    pptx: { color: C, label: "PPTX" },
    png: { color: T.purple, label: "PNG" },
    jpg: { color: T.purple, label: "JPG" },
    jpeg: { color: T.purple, label: "JPEG" },
    csv: { color: T.teal, label: "CSV" },
    txt: { color: T.textMid, label: "TXT" },
    zip: { color: T.warn, label: "ZIP" },
  };

  const getFileInfo = (name) => {
    const ext = name.split(".").pop().toLowerCase();
    return fileIcons[ext] || { color: T.textDim, label: ext.toUpperCase() };
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const addFiles = (newFiles) => {
    const additions = Array.from(newFiles).map(f => ({
      id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: f.name,
      size: f.size,
      type: f.type,
      uploadedAt: new Date().toISOString(),
      // In production: upload to S3/storage and store the URL
      url: URL.createObjectURL(f),
    }));
    onChange([...files, ...additions]);
  };

  const removeFile = (fileId) => {
    onChange(files.filter(f => f.id !== fileId));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (readOnly) return;
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 11, color: T.textDim, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
          <Icon d={ICONS.attach} color={T.textDim} size={12} />
          Attachments ({files.length})
        </div>
        {!readOnly && (
          <button onClick={() => fileInputRef.current?.click()} style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 6, padding: "4px 12px", color: T.textMid, fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = C; e.currentTarget.style.color = C; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textMid; }}
          >
            <Icon d={ICONS.filePlus} color="currentColor" size={11} />Upload File
          </button>
        )}
        <input ref={fileInputRef} type="file" multiple hidden onChange={(e) => { if (e.target.files?.length) addFiles(e.target.files); e.target.value = ""; }} />
      </div>

      {/* Drop zone (when no files yet or dragging) */}
      {(!files.length || dragOver) && !readOnly && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${dragOver ? C : T.border}`, borderRadius: 10, padding: "24px 16px",
            textAlign: "center", cursor: "pointer", background: dragOver ? C + "08" : "transparent",
            transition: "all .15s",
          }}
        >
          <Icon d={ICONS.filePlus} color={dragOver ? C : T.textDim} size={24} />
          <div style={{ fontSize: 12, color: dragOver ? C : T.textDim, marginTop: 8 }}>
            {dragOver ? "Drop files here" : "Drag & drop files or click to browse"}
          </div>
          <div style={{ fontSize: 10, color: T.textDim, marginTop: 4 }}>PDF, DOCX, XLSX, images, and more</div>
        </div>
      )}

      {/* File list */}
      {files.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {files.map(file => {
            const info = getFileInfo(file.name);
            return (
              <div key={file.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 6, borderLeft: `3px solid ${info.color}` }}>
                <div style={{ width: 32, height: 32, borderRadius: 6, background: info.color + "15", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: 8, fontWeight: 800, color: info.color, letterSpacing: 0.3 }}>{info.label}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</div>
                  <div style={{ fontSize: 10, color: T.textDim }}>{formatSize(file.size)} · {new Date(file.uploadedAt).toLocaleDateString()}</div>
                </div>
                <a href={file.url} download={file.name} title="Download" style={{ display: "flex", padding: 4, color: T.textDim, textDecoration: "none" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = C)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = T.textDim)}
                >
                  <Icon d={ICONS.download} color="currentColor" size={13} />
                </a>
                {!readOnly && (
                  <button onClick={() => removeFile(file.id)} style={{ background: "transparent", border: "none", padding: 4, color: T.textDim, cursor: "pointer" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = T.danger)}
                    onMouseLeave={(e) => (e.currentTarget.style.color = T.textDim)}
                  >
                    <Icon d={ICONS.trash} color="currentColor" size={13} />
                  </button>
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
//  5. FILES VIEW — Third Journal sub-tab, all files across all notes
// ═══════════════════════════════════════════════════════════════════
const FilesView = ({ T, C, Icon, KpiCard, notes, getTagObj }) => {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");

  const allFiles = useMemo(() => {
    const result = [];
    notes.forEach(note => {
      (note.attachments || []).forEach(file => {
        result.push({ ...file, noteId: note.id, noteTitle: note.title, noteDate: note.date, noteTags: note.tags });
      });
    });
    return result.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
  }, [notes]);

  const fileTypes = useMemo(() => {
    const types = {};
    allFiles.forEach(f => {
      const ext = f.name.split(".").pop().toLowerCase();
      types[ext] = (types[ext] || 0) + 1;
    });
    return types;
  }, [allFiles]);

  const filtered = useMemo(() => {
    let items = allFiles;
    if (filterType !== "all") items = items.filter(f => f.name.toLowerCase().endsWith(`.${filterType}`));
    if (search) { const q = search.toLowerCase(); items = items.filter(f => f.name.toLowerCase().includes(q) || f.noteTitle.toLowerCase().includes(q)); }
    return items;
  }, [allFiles, filterType, search]);

  const totalSize = allFiles.reduce((sum, f) => sum + (f.size || 0), 0);
  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const fileIcons = { pdf: T.danger, doc: T.blue, docx: T.blue, xls: T.green, xlsx: T.green, ppt: C, pptx: C, png: T.purple, jpg: T.purple, csv: T.teal, txt: T.textMid, zip: T.warn };
  const getFileColor = (name) => fileIcons[name.split(".").pop().toLowerCase()] || T.textDim;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ fontSize: 13, color: T.textMid, lineHeight: 1.5 }}>All files attached across your notes — searchable, filterable, downloadable.</div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <KpiCard label="Total Files" value={allFiles.length} sub="across all notes" color={C} />
        <KpiCard label="File Types" value={Object.keys(fileTypes).length} sub="unique formats" color={T.purple} />
        <KpiCard label="Total Size" value={formatSize(totalSize)} color={T.blue} />
        <KpiCard label="Notes w/ Files" value={notes.filter(n => n.attachments?.length > 0).length} sub={`of ${notes.length} notes`} color={T.green} />
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
        <button onClick={() => setFilterType("all")} style={{ padding: "5px 12px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 10, fontWeight: 600, background: filterType === "all" ? C : T.bg3, color: filterType === "all" ? "#1A1A1A" : T.textMid }}>All</button>
        {Object.entries(fileTypes).sort((a, b) => b[1] - a[1]).map(([ext, count]) => (
          <button key={ext} onClick={() => setFilterType(ext)} style={{ padding: "5px 12px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 10, fontWeight: 600, background: filterType === ext ? C : T.bg3, color: filterType === ext ? "#1A1A1A" : T.textMid }}>{ext.toUpperCase()} ({count})</button>
        ))}
        <div style={{ flex: 1 }} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search files..." style={{ background: T.bg0, border: `1px solid ${T.border}`, borderRadius: 6, padding: "6px 12px", color: T.text, fontSize: 12, outline: "none", width: 180, fontFamily: "inherit" }} onFocus={(e) => (e.currentTarget.style.borderColor = C)} onBlur={(e) => (e.currentTarget.style.borderColor = T.border)} />
      </div>

      {/* File List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {filtered.map(file => {
          const ext = file.name.split(".").pop().toUpperCase();
          const color = getFileColor(file.name);
          return (
            <div key={file.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 8, borderLeft: `3px solid ${color}`, transition: "all .15s" }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = color + "40")}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.borderLeftColor = color; }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 8, background: color + "15", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: 9, fontWeight: 800, color: color, letterSpacing: 0.3 }}>{ext}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</div>
                <div style={{ fontSize: 11, color: T.textDim, display: "flex", gap: 8, alignItems: "center", marginTop: 2 }}>
                  <span>{formatSize(file.size)}</span>
                  <span>·</span>
                  <span>from: {file.noteTitle}</span>
                  <span>·</span>
                  <span>{new Date(file.uploadedAt).toLocaleDateString()}</span>
                </div>
              </div>
              {/* Tags from parent note */}
              {file.noteTags?.length > 0 && (
                <div style={{ display: "flex", gap: 3, flexWrap: "wrap", maxWidth: 200 }}>
                  {file.noteTags.slice(0, 3).map(tag => {
                    const obj = getTagObj(tag);
                    const tagColor = obj?.color || T.purple;
                    return <span key={tag} style={{ fontSize: 8, padding: "1px 5px", borderRadius: 3, background: tagColor + "12", color: tagColor, fontWeight: 600, textTransform: "uppercase" }}>{tag}</span>;
                  })}
                </div>
              )}
              <a href={file.url} download={file.name} title="Download" style={{ display: "flex", padding: 6, color: T.textDim, textDecoration: "none", borderRadius: 4, background: T.bg3, border: `1px solid ${T.border}` }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = C; e.currentTarget.style.color = C; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textDim; }}
              >
                <Icon d={ICONS.download} color="currentColor" size={14} />
              </a>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: 40, color: T.textDim }}>
            <Icon d={ICONS.folder} color={T.textDim} size={32} />
            <div style={{ fontSize: 12, marginTop: 8 }}>{allFiles.length === 0 ? "No files uploaded yet. Attach files to your notes to see them here." : "No files match the current filter."}</div>
          </div>
        )}
      </div>
    </div>
  );
};


// ═══════════════════════════════════════════════════════════════════
//  EXPORT NOTE: These components get integrated into MeetingView.jsx
//
//  The NotepadView's note detail view replaces <textarea> with:
//    <RichTextEditor ... />
//    <FileAttachments ... />
//
//  The JournalView gets a third sub-tab "Files" rendering <FilesView />
//
//  notepadEntries data structure gains: attachments: []
// ═══════════════════════════════════════════════════════════════════

export { LinkModal, RichTextToolbar, RichTextEditor, FileAttachments, FilesView, ICONS };
