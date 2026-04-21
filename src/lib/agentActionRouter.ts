/**
 * agentActionRouter.ts
 * ────────────────────
 * Translates Van's backend intent JSON into actual UI actions.
 * Called after the API responds — executes navigation, etc.
 */

import { NavigateFunction } from "react-router-dom";
import { toast } from "sonner";
import { apiFetch } from "./api";
import { generatePdfReport } from "@/components/pdfGenerator";

export interface AgentAction {
  type: "navigate" | "open_section" | "download_report" | "click_button" | "toggle_theme" | "none";
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
      // ── Use the new beautiful html2pdf-based design instead of old backend attachment ──
      (async () => {
        try {
          // Try to find the evaluation ID from action.target or current URL
          let evalId = action.target;
          if (!evalId) {
            const match = window.location.pathname.match(/\/evaluation\/(\d+)/);
            evalId = match ? match[1] : null;
          }
          if (!evalId) {
            // Navigate to reports if we can't find the ID
            navigate("/candidate/reports");
            toast.info("Navigate to your report and click Download PDF.");
            return;
          }
          toast.loading("Generating your PDF report...", { id: "van-pdf" });
          const pdfData = await apiFetch<any>(`/api/v1/evaluation/${evalId}/pdf-data`);
          await generatePdfReport(pdfData);
          toast.success("PDF Downloaded! ✅", { id: "van-pdf" });
        } catch (err) {
          toast.error("Failed to generate PDF. Please try from the Reports page.", { id: "van-pdf" });
        }
      })();
      return true;

    case "click_button":
      if (action.target) {
        const query = action.target.toLowerCase().replace(/button/g, "").trim();
        const clickableElements = Array.from(document.querySelectorAll("button, a, [role='button']"));
        const targetBtn = clickableElements.find((btn) => 
          btn.textContent?.toLowerCase().includes(query)
        );
        
        if (targetBtn) {
          (targetBtn as HTMLElement).click();
          return true;
        } else {
          toast.error(`Could not find a button matching "${action.target}"`);
        }
      }
      break;

    case "toggle_theme":
      document.body.classList.toggle("light-theme");
      const isLight = document.body.classList.contains("light-theme");
      toast.success(isLight ? "Switched to Light Mode" : "Switched to Dark Mode");
      return true;
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
