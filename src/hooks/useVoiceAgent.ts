/**
 * useVoiceAgent.ts
 * ─────────────────
 * Agent 4: Core state machine for Van.
 * Pipeline:  idle → listening → thinking → speaking → idle
 *
 * - STT: Web Speech API (browser-native, zero cost)
 * - LLM: POST /api/v1/agent/query (FastAPI → GPT-4.1)
 * - TTS: SpeechSynthesis API (browser-native, zero cost, female voice)
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { apiFetch } from "@/lib/api";
import { executeAgentAction, selectFemaleVoice } from "@/lib/agentActionRouter";
import { useAuth } from "@/context/AuthContext";

// ── Types ─────────────────────────────────────────────────────────────────────

export type VanState = "idle" | "listening" | "thinking" | "speaking" | "error";

export interface VanMessage {
  role: "user" | "van";
  text: string;
  timestamp: number;
}

interface AgentResponse {
  intent: string;
  action?: { type: string; target?: string } | null;
  response_text: string;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useVoiceAgent() {
  const [state, setState] = useState<VanState>("idle");
  const [transcript, setTranscript] = useState("");
  const [messages, setMessages] = useState<VanMessage[]>([]);
  const [isSupported, setIsSupported] = useState(true);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const recognitionRef = useRef<any>(null);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // ── On mount: check browser support + pre-load voices ────────────────────
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition || !window.speechSynthesis) {
      setIsSupported(false);
      return;
    }

    // Pre-load voices (Chrome loads them async)
    const loadVoices = () => {
      voiceRef.current = selectFemaleVoice();
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // ── Disable Van during AI Interview ──────────────────────────────────────
  const isOnInterviewPage = location.pathname === "/candidate/interview";

  // ── Speak helper ──────────────────────────────────────────────────────────
  const speak = useCallback((text: string, onEnd?: () => void) => {
    // Clear any stuck queues
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    
    // CRITICAL: Chrome often gets permanently stuck in 'paused' state silently.
    window.speechSynthesis.resume();
    
    setState("speaking");

    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text);
      (window as any)._vanUtterance = utterance;

      utterance.rate = 1.0;
      // Normal pitch prevents some glitched engines from failing
      utterance.pitch = 1.0; 
      utterance.volume = 1.0; // Max volume
      
      const v = voiceRef.current;
      if (v) utterance.voice = v;
      
      console.log(`[Van] Speaking: "${text}" | Voice: ${v ? v.name : 'Default'}`);

      const cleanup = () => {
        setState("idle");
        onEnd?.();
      };

      utterance.onend = cleanup;
      
      utterance.onerror = (e) => {
        console.error("[Van] Speech synthesis error:", e);
        cleanup();
      };

      // Force resume again right before speak
      window.speechSynthesis.resume();
      window.speechSynthesis.speak(utterance);
    }, 50);
  }, []);

  // ── Add message to panel ──────────────────────────────────────────────────
  const addMessage = useCallback((role: "user" | "van", text: string) => {
    setMessages((prev) => [
      ...prev.slice(-5), // keep last 6 exchanges max
      { role, text, timestamp: Date.now() },
    ]);
  }, []);

  // ── Call Van API ───────────────────────────────────────────────────────────
  const callVanAPI = useCallback(
    async (userMessage: string) => {
      setState("thinking");
      addMessage("user", userMessage);

      try {
        const response = await apiFetch<AgentResponse>("/api/v1/agent/query", {
          method: "POST",
          body: JSON.stringify({
            message: userMessage,
            current_page: location.pathname,
            user_role: user?.role || "candidate",
          }),
        });

        addMessage("van", response.response_text);

        // Speak the response FIRST. Only trigger the download/navigation action
        // AFTER she finishes speaking, so the browser doesn't kill the audio stream.
        speak(response.response_text, () => {
          if (response.action) {
            executeAgentAction(response.action as any, navigate);
          }
        });
      } catch {
        const errMsg =
          "Sorry, I'm having trouble connecting right now. Please try again in a moment.";
        addMessage("van", errMsg);
        speak(errMsg);
        setState("error");
        setTimeout(() => setState("idle"), 2000);
      }
    },
    [location.pathname, user, navigate, addMessage, speak]
  );

  // ── Start listening ────────────────────────────────────────────────────────
  const startListening = useCallback(async () => {
    if (!isSupported || isOnInterviewPage) return;
    if (state !== "idle") return;

    window.speechSynthesis.cancel(); // stop any current speech

    // Force ask for mic permission prior to SpeechRecognition
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      const permsMsg = "I need microphone access to hear you.";
      addMessage("van", permsMsg);
      speak(permsMsg);
      setState("error");
      setTimeout(() => setState("idle"), 2000);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    setState("listening");
    setTranscript("");
    setIsPanelOpen(true);

    recognition.onresult = (event: any) => {
      let fullTranscript = "";
      for (let i = 0; i < event.results.length; i++) {
        fullTranscript += event.results[i][0].transcript;
      }
      setTranscript(fullTranscript);
      (recognitionRef.current as any)._lastTranscript = fullTranscript;
    };

    recognition.onend = () => {
      const captured = (recognitionRef.current as any)?._lastTranscript;
      if (captured && captured.trim()) {
        callVanAPI(captured.trim());
      } else {
        // Just reset gracefully
        setState("idle");
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === "no-speech") {
        setState("idle"); // silently reset if they didn't speak
      } else {
        setState("error");
        setTimeout(() => setState("idle"), 2000);
      }
    };

    try {
      recognition.start();
    } catch (e) {
      setState("error");
      setTimeout(() => setState("idle"), 2000);
    }
  }, [isSupported, isOnInterviewPage, state, addMessage, speak, callVanAPI]);

  // ── Stop listening ─────────────────────────────────────────────────────────
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* ignore */ }
    }
  }, []);

  // ── Toggle: click robot to start/stop ─────────────────────────────────────
  const handleRobotClick = useCallback(() => {
    if (isOnInterviewPage) return;

    if (state === "listening") {
      stopListening();
    } else if (state === "idle" || state === "error") {
      startListening();
    } else if (state === "speaking") {
      window.speechSynthesis.cancel();
      setState("idle");
    }
  }, [state, isOnInterviewPage, startListening, stopListening]);

  // ── Cleanup on unmount ─────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      stopListening();
      window.speechSynthesis.cancel();
    };
  }, [stopListening]);

  return {
    state,
    transcript,
    messages,
    isSupported,
    isPanelOpen,
    setIsPanelOpen,
    isOnInterviewPage,
    handleRobotClick,
  };
}
