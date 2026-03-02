import { useState, useEffect, useRef, useCallback } from "react";

export function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimText, setInterimText] = useState("");
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef(null);
  const shouldRestartRef = useRef(false);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    setIsSupported(true);

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let finalText = "";
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript + " ";
        } else {
          interim += result[0].transcript;
        }
      }
      if (finalText) {
        setTranscript((prev) => prev + finalText);
      }
      setInterimText(interim);
    };

    recognition.onerror = (e) => {
      if (e.error === "no-speech" || e.error === "aborted") return;
      setIsListening(false);
      shouldRestartRef.current = false;
    };

    recognition.onend = () => {
      // Auto-restart if user hasn't explicitly stopped
      if (shouldRestartRef.current) {
        try { recognition.start(); } catch (_) { /* already running */ }
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      shouldRestartRef.current = false;
      try { recognition.stop(); } catch (_) { /* not running */ }
    };
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    shouldRestartRef.current = true;
    setIsListening(true);
    setTranscript("");
    setInterimText("");
    try { recognitionRef.current.start(); } catch (_) { /* already running */ }
  }, []);

  const stopListening = useCallback(() => {
    shouldRestartRef.current = false;
    setIsListening(false);
    setInterimText("");
    try { recognitionRef.current?.stop(); } catch (_) { /* not running */ }
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setInterimText("");
  }, []);

  return { isListening, transcript, interimText, isSupported, startListening, stopListening, resetTranscript };
}
