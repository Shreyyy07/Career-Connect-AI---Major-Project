/**
 * VanPanel.tsx
 * ────────────
 * Agent 1: The speech bubble conversation panel.
 * Slides up from above Van's robot when she speaks or is listening.
 * Shows last 3 exchanges in a glassmorphism bubble.
 */

import { motion, AnimatePresence } from "framer-motion";
import { X, Mic, Volume2, Loader2 } from "lucide-react";
import { VanMessage, VanState } from "@/hooks/useVoiceAgent";

interface VanPanelProps {
  messages: VanMessage[];
  transcript: string;
  state: VanState;
  isOpen: boolean;
  onClose: () => void;
}

const stateIcon = {
  idle: null,
  listening: <Mic className="w-3 h-3 text-[#ff007f] animate-pulse" />,
  thinking: <Loader2 className="w-3 h-3 text-purple-400 animate-spin" />,
  speaking: <Volume2 className="w-3 h-3 text-[#ff007f]" />,
  error: null,
};

const stateLabel = {
  idle: "",
  listening: "Listening...",
  thinking: "Thinking...",
  speaking: "Van is speaking",
  error: "Something went wrong",
};

export function VanPanel({ messages, transcript, state, isOpen, onClose }: VanPanelProps) {
  // Decide what tip text to show at top of panel
  const tipText =
    state === "idle" && messages.length === 0
      ? 'Try: "Go to my dashboard" or "What is my interview score?"'
      : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
          className="absolute bottom-[110px] right-0 w-[300px] z-50"
          style={{
            background: "linear-gradient(135deg, rgba(13,17,23,0.98) 0%, rgba(26,35,50,0.98) 100%)",
            border: "1px solid rgba(255,0,127,0.2)",
            borderRadius: "16px",
            boxShadow: "0 8px 40px rgba(0,0,0,0.6), 0 0 20px rgba(255,0,127,0.08)",
            backdropFilter: "blur(20px)",
          }}
        >
          {/* ── Header ── */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(255,0,127,0.1)]">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#ff007f] animate-pulse" />
              <span className="text-xs font-bold text-[#ff007f] tracking-wider uppercase">Van</span>
              {stateIcon[state] && (
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  {stateIcon[state]}
                  {stateLabel[state]}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-white/5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* ── Messages ── */}
          <div className="px-3 py-3 space-y-2 max-h-[220px] overflow-y-auto scrollbar-thin">
            {/* Hint when empty */}
            {tipText && (
              <p className="text-[10px] text-muted-foreground text-center italic px-2 py-1">
                {tipText}
              </p>
            )}

            {messages.map((msg, i) => (
              <motion.div
                key={msg.timestamp}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-2xl text-[11px] leading-relaxed ${
                    msg.role === "user"
                      ? "bg-[rgba(255,0,127,0.12)] text-[#ff007f] rounded-br-sm border border-[rgba(255,0,127,0.2)]"
                      : "bg-[rgba(255,255,255,0.05)] text-foreground rounded-bl-sm border border-[rgba(255,255,255,0.08)]"
                  }`}
                >
                  {msg.role === "van" && (
                    <span className="text-[9px] font-bold text-[#ff007f] block mb-1 uppercase tracking-wider">
                      Van
                    </span>
                  )}
                  {msg.text}
                </div>
              </motion.div>
            ))}

            {/* Live transcript while listening */}
            {state === "listening" && transcript && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-end"
              >
                <div className="max-w-[85%] px-3 py-2 rounded-2xl rounded-br-sm text-[11px] leading-relaxed bg-[rgba(255,0,127,0.06)] text-[#ff007f]/60 border border-[rgba(255,0,127,0.1)] italic">
                  {transcript}
                </div>
              </motion.div>
            )}

            {/* Thinking dots */}
            {state === "thinking" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="px-3 py-2 rounded-2xl rounded-bl-sm bg-[rgba(139,92,246,0.1)] border border-[rgba(139,92,246,0.2)] flex items-center gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-purple-400"
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15 }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* ── Footer hint ── */}
          <div className="px-4 py-2 border-t border-[rgba(255,0,127,0.08)]">
            <p className="text-[9px] text-muted-foreground text-center">
              {state === "listening"
                ? "🎤 Speak now — I'm listening!"
                : state === "idle"
                ? "Click Van to start talking"
                : state === "thinking"
                ? "⚡ Processing your request..."
                : state === "speaking"
                ? "🔊 Click Van to interrupt"
                : "Press me to try again"}
            </p>
          </div>

          {/* ── Pointer arrow ── */}
          <div
            className="absolute -bottom-2 right-8"
            style={{
              width: 0,
              height: 0,
              borderLeft: "8px solid transparent",
              borderRight: "8px solid transparent",
              borderTop: "8px solid rgba(255,0,127,0.2)",
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
