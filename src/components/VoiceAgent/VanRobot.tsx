/**
 * VanRobot.tsx
 * ─────────────
 * Agent 1: The elegant female AI avatar for Van.
 * Redesigned to be a sleek, glowing holographic orb with orbital rings.
 * Color scheme: Vibrant Hot Pink / Magenta & Violet to pop from the dark UI.
 *
 * States:
 *  idle     → slow floating, gentle core pulse, rotating outer rings
 *  listening → bright magenta glow, rapid waveform rings
 *  thinking  → fast spinning orbits, violet energy waves
 *  speaking  → equalizer energy spikes from the core
 *  error     → red pulse
 */

import { motion, AnimatePresence } from "framer-motion";
import { VanState } from "@/hooks/useVoiceAgent";

interface VanRobotProps {
  state: VanState;
  onClick: () => void;
  disabled?: boolean;
}

const MAGENTA = "#ff007f";
const VIOLET = "#a200ff";
const RED = "#ef4444";

export function VanRobot({ state, onClick, disabled }: VanRobotProps) {
  const primaryColor =
    state === "error"
      ? RED
      : state === "thinking"
      ? VIOLET
      : MAGENTA;

  return (
    <div className="relative flex items-center justify-center select-none w-24 h-24">
      {/* ── Background Aura (Listening only) ── */}
      <AnimatePresence>
        {state === "listening" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1.5 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 rounded-full z-0 pointer-events-none"
            style={{
              background: `radial-gradient(circle, ${MAGENTA}40 0%, transparent 70%)`,
              filter: "blur(12px)",
            }}
            transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
          />
        )}
      </AnimatePresence>

      {/* ── Extruded Sonar Waves (Listening) ── */}
      <AnimatePresence>
        {state === "listening" && (
          <>
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="absolute rounded-full border pointer-events-none"
                style={{ borderColor: `${MAGENTA}80` }}
                initial={{ width: 80, height: 80, opacity: 0.8 }}
                animate={{ width: 150 + i * 30, height: 150 + i * 30, opacity: 0 }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.4,
                  ease: "easeOut",
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* ── Avatar Base (Clickable) ── */}
      <motion.button
        onClick={onClick}
        disabled={disabled}
        aria-label={`Van AI Assistant — ${state}`}
        className="relative z-10 cursor-pointer focus:outline-none flex items-center justify-center"
        style={{
          width: 80,
          height: 80,
          background: "rgba(13, 17, 23, 0.85)", // Dark glass base
          borderRadius: "50%",
          border: `2px solid ${primaryColor}70`,
          backdropFilter: "blur(8px)",
          boxShadow: `0 0 20px ${primaryColor}50, inset 0 0 15px ${primaryColor}40`,
        }}
        animate={
          state === "idle"
            ? { y: [0, -5, 0], boxShadow: [`0 0 15px ${primaryColor}40`, `0 0 25px ${primaryColor}70`, `0 0 15px ${primaryColor}40`] }
            : state === "listening"
            ? { scale: [1, 1.05, 1], boxShadow: `0 0 30px ${primaryColor}AA` }
            : state === "thinking"
            ? { scale: [1, 0.95, 1], rotate: [0, 5, -5, 0] }
            : {} /* speaking is handled internally */
        }
        transition={
          state === "idle"
            ? { duration: 4, repeat: Infinity, ease: "easeInOut" }
            : state === "listening"
            ? { duration: 1, repeat: Infinity, ease: "easeInOut" }
            : state === "thinking"
            ? { duration: 0.6, repeat: Infinity }
            : {}
        }
        whileHover={{ scale: disabled ? 1 : 1.1, filter: "brightness(1.2)" }}
        whileTap={{ scale: disabled ? 1 : 0.9 }}
      >
        {/* Outer Orbital Ring */}
        <motion.div
          className="absolute inset-2 rounded-full border border-dashed"
          style={{ borderColor: `${primaryColor}90` }}
          animate={{ rotate: state === "thinking" ? 360 : 360 }}
          transition={{
            duration: state === "thinking" ? 3 : 15,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        {/* Inner Orbital Ring (counter-rotate) */}
        <motion.div
          className="absolute inset-4 rounded-full border border-dotted"
          style={{ borderColor: primaryColor }}
          animate={{ rotate: state === "thinking" ? -360 : -360 }}
          transition={{
            duration: state === "thinking" ? 2 : 10,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        {/* ── Central Avatar Image Core ── */}
        <div className="relative z-20 w-[60px] h-[60px] rounded-full overflow-hidden flex items-center justify-center">
          <motion.img 
            src="/bot.avif" 
            alt="Van Avatar" 
            className="absolute inset-0 w-full h-full object-cover"
            animate={
              state === "listening"
                ? { scale: [1, 1.15, 1], filter: "brightness(1.5)" }
                : { scale: 1, filter: "brightness(1)" }
            }
            transition={{
              duration: state === "listening" ? 0.8 : 2,
              repeat: Infinity,
            }}
          />

          {/* Speaking Equalizer Overlay */}
          {state === "speaking" && (
            <div className="absolute inset-0 bg-black/60 flex gap-[3px] items-center justify-center backdrop-blur-[2px]">
              {[0, 1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  className="w-1 rounded-full z-10"
                  style={{ backgroundColor: primaryColor, boxShadow: `0 0 8px ${primaryColor}` }}
                  animate={{
                    height: ["6px", `${10 + Math.random() * 14}px`, "6px"],
                  }}
                  transition={{
                    duration: 0.2 + i * 0.05,
                    repeat: Infinity,
                    delay: i * 0.02,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Subtext */}
        <span
          className="absolute -bottom-6 text-[9px] font-bold tracking-[0.2em] font-sans z-30"
          style={{ color: primaryColor, textShadow: `0 0 10px ${primaryColor}` }}
        >
          VAN
        </span>
      </motion.button>

      {/* ── State label tooltip ── */}
      {state !== "idle" && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-xl"
          style={{
            background: "rgba(13,17,23,0.9)",
            color: primaryColor,
            border: `1px solid ${primaryColor}50`,
            backdropFilter: "blur(4px)",
          }}
        >
          {state === "listening"
            ? "🎤 Listening..."
            : state === "thinking"
            ? "⚡ Thinking..."
            : state === "speaking"
            ? "🔊 Speaking"
            : "❌ Error"}
        </motion.div>
      )}
    </div>
  );
}
