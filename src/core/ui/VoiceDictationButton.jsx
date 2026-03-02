import { useState, useEffect, useRef } from "react";
import { T } from "@core/theme/theme";
import { useSpeechRecognition } from "@core/routing/useVoiceRecording";

const MicIcon = ({ size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

const MicOffIcon = ({ size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="1" y1="1" x2="23" y2="23" />
    <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
    <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .76-.12 1.49-.34 2.18" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

const fmtDuration = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

export const VoiceDictationButton = ({ onTranscript, compact = false }) => {
  const { isListening, transcript, interimText, isSupported, startListening, stopListening, resetTranscript } = useSpeechRecognition();
  const [duration, setDuration] = useState(0);
  const [pulse, setPulse] = useState(false);
  const timerRef = useRef(null);
  const lastTranscriptRef = useRef("");

  // Track duration while listening
  useEffect(() => {
    if (isListening) {
      setDuration(0);
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isListening]);

  // Pulse animation
  useEffect(() => {
    if (!isListening) { setPulse(false); return; }
    const interval = setInterval(() => setPulse((p) => !p), 800);
    return () => clearInterval(interval);
  }, [isListening]);

  // Push finalized transcript to parent
  useEffect(() => {
    if (transcript && transcript !== lastTranscriptRef.current) {
      const newText = transcript.slice(lastTranscriptRef.current.length);
      if (newText.trim()) onTranscript?.(newText.trim());
      lastTranscriptRef.current = transcript;
    }
  }, [transcript, onTranscript]);

  // Reset tracking ref when starting fresh
  useEffect(() => {
    if (isListening) lastTranscriptRef.current = "";
  }, [isListening]);

  const handleToggle = () => {
    if (isListening) {
      stopListening();
      resetTranscript();
    } else {
      startListening();
    }
  };

  if (!isSupported) {
    return (
      <button
        title="Speech recognition not supported in this browser"
        disabled
        style={{
          background: "transparent",
          border: `1px solid ${T.border}`,
          borderRadius: compact ? 6 : 8,
          padding: compact ? "4px 6px" : "8px 12px",
          cursor: "not-allowed",
          color: T.textDim,
          display: "flex",
          alignItems: "center",
          gap: 4,
          opacity: 0.4,
        }}
      >
        <MicOffIcon size={compact ? 14 : 16} color={T.textDim} />
        {!compact && <span style={{ fontSize: 11 }}>Not supported</span>}
      </button>
    );
  }

  if (isListening) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: compact ? 6 : 8 }}>
        {/* Pulsing mic button */}
        <button
          onClick={handleToggle}
          title="Stop dictation"
          style={{
            background: T.danger + (pulse ? "30" : "18"),
            border: `1.5px solid ${T.danger}`,
            borderRadius: compact ? 6 : 8,
            padding: compact ? "4px 6px" : "8px 12px",
            cursor: "pointer",
            color: T.danger,
            display: "flex",
            alignItems: "center",
            gap: 6,
            transition: "background .3s",
          }}
        >
          <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <MicIcon size={compact ? 14 : 16} color={T.danger} />
            <div style={{
              position: "absolute",
              width: compact ? 20 : 24,
              height: compact ? 20 : 24,
              borderRadius: "50%",
              border: `2px solid ${T.danger}`,
              opacity: pulse ? 0.6 : 0,
              transition: "opacity .3s",
            }} />
          </div>
          <span style={{ fontSize: compact ? 10 : 11, fontWeight: 700, fontFamily: "inherit" }}>
            {fmtDuration(duration)}
          </span>
        </button>

        {/* Interim text preview */}
        {interimText && !compact && (
          <span style={{
            fontSize: 11,
            color: T.textMid,
            fontStyle: "italic",
            maxWidth: 200,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
            {interimText}
          </span>
        )}

        {/* Stop label */}
        {!compact && (
          <span style={{ fontSize: 10, color: T.danger, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Listening...
          </span>
        )}
      </div>
    );
  }

  // Idle state
  return (
    <button
      onClick={handleToggle}
      title="Start voice dictation"
      style={{
        background: "transparent",
        border: `1px solid ${T.border}`,
        borderRadius: compact ? 6 : 8,
        padding: compact ? "4px 6px" : "8px 12px",
        cursor: "pointer",
        color: T.textMid,
        display: "flex",
        alignItems: "center",
        gap: 5,
        transition: "all .15s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.color = T.accent; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textMid; }}
    >
      <MicIcon size={compact ? 14 : 16} />
      {!compact && <span style={{ fontSize: 11, fontWeight: 500, fontFamily: "inherit" }}>Dictate</span>}
    </button>
  );
};
