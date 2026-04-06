/**
 * agentActionRouter.ts
 * ────────────────────
 * Translates Van's backend intent JSON into actual UI actions.
 * Called after the API responds — executes navigation, etc.
 */

import { NavigateFunction } from "react-router-dom";
import { downloadAuthorizedFile } from "./api";
import { toast } from "sonner";

export interface AgentAction {
  type: "navigate" | "open_section" | "download_report" | "click_button" | "none";
  target?: string;
}

/**
 * Execute the action returned by the Van backend.
 * Returns true if an action was performed, false otherwise.
 */
export function executeAgentAction(
  action: AgentAction | null | undefined,
  navigate: NavigateFunction
): boolean {
  if (!action || action.type === "none") return false;

  switch (action.type) {
    case "navigate":
      if (action.target) {
        navigate(action.target);
        return true;
      }
      break;

    case "open_section":
      if (action.target) {
        const el = document.getElementById(action.target);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
          return true;
        }
      }
      break;

    case "download_report":
      if (action.target) {
        toast.info("Starting your PDF download...");
        downloadAuthorizedFile(action.target).catch((err) => {
          toast.error("Failed to download the report.");
        });
        return true;
      }
      break;

    case "click_button":
      if (action.target) {
        const query = action.target.toLowerCase();
        const buttons = Array.from(document.querySelectorAll("button"));
        const targetBtn = buttons.find((btn) => 
          btn.textContent?.toLowerCase().includes(query)
        );
        
        if (targetBtn) {
          targetBtn.click();
          return true;
        } else {
          toast.error(`Could not find a button matching "${action.target}"`);
        }
      }
      break;
  }

  return false;
}

/**
 * Pick the best female voice available in the browser.
 * Priority: Google UK English Female > Microsoft Zira > Samantha > any female > first available
 */
export function selectFemaleVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  // It is CRITICAL we prefer local voices on Windows, because Google remote voices often fail silently
  const priority = [
    "Microsoft Zira Desktop",
    "Microsoft Zira - English (United States)",
    "Google UK English Female",
    "Google US English",
    "Microsoft Zira Desktop",
    "Microsoft Zira - English (United States)",
    "Samantha",
    "Karen",
    "Moira",
    "Tessa",
    "Fiona",
    "Victoria",
  ];

  for (const name of priority) {
    const v = voices.find((vo) => vo.name === name);
    if (v) return v;
  }

  // Fallback: any voice with "female" in name (case-insensitive)
  const femaleVoice = voices.find((v) =>
    v.name.toLowerCase().includes("female")
  );
  if (femaleVoice) return femaleVoice;

  // Last resort: first English voice
  const engVoice = voices.find((v) => v.lang.startsWith("en"));
  return engVoice || voices[0] || null;
}
