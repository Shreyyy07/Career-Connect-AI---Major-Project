"""
agent.py
────────
Van — Career Connect AI's in-app voice assistant backend.

POST /api/v1/agent/query
  Takes a natural-language message + page context from the frontend.
  Uses GitHub AI (GPT-4.1) to classify intent and optionally query
  the database for live user data.
  Returns: { intent, action, response_text }
"""

from __future__ import annotations

import json
import re
from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..db import get_db
from ..deps import optional_current_user
from ..models import Evaluation, InterviewSession, Resume, SkillRecommendation, User
from ..schemas import AgentAction, AgentQueryRequest, AgentQueryResponse

router = APIRouter(prefix="/api/v1/agent", tags=["agent"])


# ── System Prompt ─────────────────────────────────────────────────────────────

_SYSTEM_PROMPT = """
You are Van — the friendly, professional voice assistant for Career Connect AI.
You are a female AI assistant helping candidates and HR users navigate and use the application.

ABSOLUTE RULES:
1. You ONLY answer questions about the Career Connect AI application.
2. You NEVER browse the internet, discuss outside topics, or give general knowledge answers.
3. You NEVER modify user data. You are strictly read-only.
4. Always be concise — responses should be 1-2 sentences max when spoken aloud.
5. Be warm, professional, and encouraging.

APP PAGES (candidate routes):
- / → Homepage / Landing Page
- /candidate/dashboard → Overview: stats, score trend, interview history
- /candidate/profile → Edit display name, change password
- /candidate/resume → Upload resume PDF/DOCX, run JD match, see skill gaps
- /candidate/interview → Live AI interview with webcam + microphone
- /candidate/skills → Skill gap recommendations, learning progress tracker
- /candidate/assessments → Text-based Smart Interview (PIA mode)
- /candidate/evaluation/:id → Full evaluation results, PDF download
- /candidate/reports → History of all past evaluations
- /hr/dashboard → HR recruiter view (job postings, candidate rankings)

COMMON FEATURES & FAQs:
- What is Career Connect AI?: An AI-powered recruitment platform that automates JD matching, skill gap tracking, and conducts smart AI video interviews.
- Hybrid Match Score: 60% cosine similarity + 40% AI semantic score
- Evaluation scores: 35% Answer Relevance + 30% JD Alignment + 20% Emotion + 15% Speech
- Anti-cheat: YOLOv8 detects multiple persons and phones during interviews
- DeepFace: Emotion analysis every 2 seconds during interviews
- PDF Report: 10-section branded report auto-generated after each interview
- OTP Password Reset: 6-digit code sent to email, expires in 10 minutes
- Skills tracking: not_started → in_progress → completed

INTENT TYPES you must classify the user's message into:
- "greeting": user says hello, asks how you are, etc.
- "navigate": user wants to go to a specific page
- "download_report": user asks to download a PDF report
- "click_button": user asks to click a specific button on their current screen
- "toggle_theme": user asks to change to light or dark mode / theme
- "fetch_data": user asks about their own data (score, resume status, skill gaps, etc.)
- "answer_faq": user asks how something works or needs help
- "unknown": anything outside Career Connect AI scope

RESPONSE FORMAT — You MUST reply with ONLY a valid JSON object:
{
  "intent": "greeting" | "navigate" | "download_report" | "click_button" | "toggle_theme" | "fetch_data" | "answer_faq" | "unknown",
  "action": {
    "type": "navigate" | "download_report" | "click_button" | "toggle_theme",
    "target": "text of the button"
  } | null,
  "response_text": ""
}

For "greeting" intent: action = null, response_text = "I am good, tell me what help do you need".
For "navigate" or "click_button" or "toggle_theme" or "download_report": leave response_text completely empty ("") to save time.
For "fetch_data" intent: action = null.
For "answer_faq" intent: action = null.
For "unknown" intent: action = null, response_text = polite out-of-scope reply.
"""

_UNKNOWN_RESPONSE = (
    "I can only help with things inside Career Connect AI. "
    "Try asking about your dashboard, interviews, resume, or skills!"
)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _call_ai(message: str, current_page: str) -> dict:
    """Call GitHub AI (GPT-4.1) and return parsed JSON intent."""
    from ..ai_service import _chat  # reuse existing client

    user_prompt = (
        f"Current page the user is on: {current_page}\n"
        f"User said: \"{message}\""
    )

    try:
        raw = _chat(_SYSTEM_PROMPT, user_prompt, temperature=0.2, max_tokens=300)
        # Strip markdown fences if model wraps it
        raw = raw.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
        return json.loads(raw)
    except Exception:
        return {
            "intent": "unknown",
            "action": None,
            "response_text": _UNKNOWN_RESPONSE,
        }


def _fetch_user_data(intent_json: dict, user: Optional[User], db: Session) -> str:
    """
    If the intent is fetch_data, query the DB and enrich the response text.
    Returns the final spoken response string.
    """
    if not user:
        return "I can't check your data because you aren't logged in. Please log in first!"

    msg_lower = intent_json.get("response_text", "").lower()

    # Determine what data to fetch based on keywords in the AI's response
    if any(k in msg_lower for k in ["score", "interview", "evaluation", "result"]):
        # Latest evaluation score
        latest_session = (
            db.query(InterviewSession)
            .filter(InterviewSession.user_id == user.id)
            .order_by(InterviewSession.created_at.desc())
            .first()
        )
        if latest_session:
            ev = (
                db.query(Evaluation)
                .filter(Evaluation.interview_session_id == latest_session.id)
                .first()
            )
            if ev:
                score = round(ev.final_score)
                return f"This is your required result. Your latest interview score is {score}%."
        return "This is your required result. No completed interviews were found."

    if any(k in msg_lower for k in ["resume", "upload", "cv"]):
        resume = (
            db.query(Resume)
            .filter(Resume.user_id == user.id)
            .order_by(Resume.created_at.desc())
            .first()
        )
        if resume:
            return f"This is your required result. Your latest uploaded resume is {resume.filename}."
        return "This is your required result. You have not uploaded a resume yet."

    if any(k in msg_lower for k in ["skill", "gap", "missing", "recommendation"]):
        recs = (
            db.query(SkillRecommendation)
            .filter(SkillRecommendation.user_id == user.id)
            .all()
        )
        if recs:
            pending = [r for r in recs if r.status != "completed"]
            done = [r for r in recs if r.status == "completed"]
            return f"This is your required result. You have {len(done)} completed and {len(pending)} pending skill recommendations."
        return "This is your required result. No skill recommendations found."

    # Generic data response fallback
    return f"This is your required result. {intent_json.get('response_text', '')}"


def _handle_download(message: str, user: User, db: Session) -> Optional[AgentAction]:
    """Parse ordinal (first, 2nd, last) and return the download action."""
    evals = (
        db.query(Evaluation)
        .join(InterviewSession)
        .filter(InterviewSession.user_id == user.id)
        .order_by(InterviewSession.created_at.asc())
        .all()
    )
    if not evals:
        return None
        
    msg = message.lower()
    index = -1  # default to latest if no ordinal is found but download_report triggered

    # Simple ordinal parsing
    if any(k in msg for k in ["first", "1st"]):
        index = 0
    elif any(k in msg for k in ["second", "2nd"]):
        index = 1
    elif any(k in msg for k in ["third", "3rd"]):
        index = 2
    elif any(k in msg for k in ["fourth", "4th", "four"]):
        index = 3
    elif any(k in msg for k in ["fifth", "5th", "five"]):
        index = 4
    elif any(k in msg for k in ["sixth", "6th", "six"]):
        index = 5
        
    try:
        target_eval = evals[index]
        return AgentAction(type="download_report", target=str(target_eval.id))
    except IndexError:
        return None


# ── Route ─────────────────────────────────────────────────────────────────────

@router.post("/query", response_model=AgentQueryResponse)
def agent_query(
    body: AgentQueryRequest,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(optional_current_user),
) -> AgentQueryResponse:
    """
    Core Van endpoint.
    1. Calls GitHub AI to classify intent.
    2. If fetch_data → queries DB to enrich response.
    3. Returns structured { intent, action, response_text }.
    """
    result = _call_ai(body.message, body.current_page)

    intent = result.get("intent", "unknown")
    raw_action = result.get("action")
    response_text = result.get("response_text", _UNKNOWN_RESPONSE)

    # Enrich with live DB data if needed
    if intent == "fetch_data":
        response_text = _fetch_user_data(result, user, db)

    import random

    # Build action object
    action: Optional[AgentAction] = None
    if intent == "download_report" and user:
        action = _handle_download(body.message, user, db)
        response_text = random.choice(["Sure, I am downloading the file right now.", "Yes, getting that ready for you."]) if action else "I couldn't find that specific report in your history."
    elif raw_action and isinstance(raw_action, dict):
        action = AgentAction(
            type=raw_action.get("type", "none"),
            target=raw_action.get("target"),
        )
        
    # Hardcode action responses
    if intent == "navigate":
        response_text = random.choice(["Sure, taking you there right away.", "Yes, navigating there now."])
    elif intent == "click_button":
        response_text = "Sure, clicking that for you right now."
    elif intent == "toggle_theme":
        response_text = "Of course, changing the theme for you now."

    return AgentQueryResponse(
        intent=intent,
        action=action,
        response_text=response_text,
    )
