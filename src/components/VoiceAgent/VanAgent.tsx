/**
 * VanAgent.tsx
 * ─────────────
 * Agent 1: Root container that wires the robot + panel together.
 * Renders as a fixed overlay — appears on every page automatically.
 * Hidden during AI Interview to avoid mic conflict.
 */

import { AnimatePresence, motion } from "framer-motion";
import { VanRobot } from "./VanRobot";
import { VanPanel } from "./VanPanel";
import { useVoiceAgent } from "@/hooks/useVoiceAgent";

export function VanAgent() {
  const {
    state,
    transcript,
    messages,
    isSupported,
    isPanelOpen,
    setIsPanelOpen,
    isOnInterviewPage,
    handleRobotClick,
  } = useVoiceAgent();

  // Don't render on interview page (mic conflict) or unsupported browsers
  if (!isSupported || isOnInterviewPage) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end"
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 1.2, type: "spring", stiffness: 200, damping: 18 }}
      >
        {/* ── Speech Panel (above the robot) ── */}
        <VanPanel
          messages={messages}
          transcript={transcript}
          state={state}
          isOpen={isPanelOpen}
          onClose={() => setIsPanelOpen(false)}
        />

        {/* ── Tooltip on first load ── */}
        <AnimatePresence>
          {state === "idle" && messages.length === 0 && !isPanelOpen && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ delay: 2.5, duration: 0.4 }}
              className="absolute bottom-[102px] right-0 whitespace-nowrap text-[10px] font-medium px-2.5 py-1.5 rounded-xl pointer-events-none"
              style={{
                background: "rgba(13,17,23,0.95)",
                border: "1px solid rgba(255,0,127,0.2)",
                color: "#ff007f",
                boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
              }}
            >
              👋 Hi! I'm Van. Click me to chat!
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Robot Avatar ── */}
        <div
          onClick={() => {
            handleRobotClick();
            if (state === "idle") setIsPanelOpen(true);
          }}
        >
          <VanRobot
            state={state}
            onClick={handleRobotClick}
            disabled={isOnInterviewPage}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
