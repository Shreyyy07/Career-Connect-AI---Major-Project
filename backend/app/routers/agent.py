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
- /candidate/dashboard → Overview: stats, score trend, interview history
- /candidate/profile → Edit display name, change password
- /candidate/resume → Upload resume PDF/DOCX, run JD match, see skill gaps
- /candidate/interview → Live AI interview with webcam + microphone
- /candidate/skills → Skill gap recommendations, learning progress tracker
- /candidate/assessments → Text-based Smart Interview (PIA mode)
- /candidate/evaluation/:id → Full evaluation results, PDF download
- /candidate/reports → History of all past evaluations
- /hr/dashboard → HR recruiter view (job postings, candidate rankings)

COMMON FEATURES:
- Hybrid Match Score: 60% cosine similarity + 40% AI semantic score
- Evaluation scores: 35% Answer Relevance + 30% JD Alignment + 20% Emotion + 15% Speech
- Anti-cheat: YOLOv8 detects multiple persons and phones during interviews
- DeepFace: Emotion analysis every 2 seconds during interviews
- PDF Report: 10-section branded report auto-generated after each interview
- OTP Password Reset: 6-digit code sent to email, expires in 10 minutes
- Skills tracking: not_started → in_progress → completed

INTENT TYPES you must classify the user's message into:
- "navigate": user wants to go to a specific page
- "fetch_data": user asks about their own data (score, resume status, skill gaps, etc.)
- "answer_faq": user asks how something works or needs help
- "unknown": anything outside Career Connect AI scope

RESPONSE FORMAT — You MUST reply with ONLY a valid JSON object:
{
  "intent": "navigate" | "fetch_data" | "answer_faq" | "unknown",
  "action": {
    "type": "navigate",
    "target": "/candidate/dashboard"
  } | null,
  "response_text": "The text Van will speak aloud (1-2 short sentences)"
}

For "navigate" intent: action.type = "navigate", action.target = the route path.
For "fetch_data" intent: action = null (data is injected separately by backend).
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
                band = (
                    "Excellent" if score >= 80
                    else "Good" if score >= 60
                    else "Average" if score >= 40
                    else "Needs Improvement"
                )
                return (
                    f"Your latest interview score is {score}%, rated as {band}. "
                    f"Head to your Reports page to see the full breakdown!"
                )
        return "I couldn't find any completed interviews yet. Try starting one from the AI Interview page!"

    if any(k in msg_lower for k in ["resume", "upload", "cv"]):
        resume = (
            db.query(Resume)
            .filter(Resume.user_id == user.id)
            .order_by(Resume.created_at.desc())
            .first()
        )
        if resume:
            return f"Your latest resume '{resume.filename}' is uploaded and parsed. Head to Resume & Match to run a JD comparison!"
        return "You haven't uploaded a resume yet. Go to Resume & Match to upload your PDF or DOCX file!"

    if any(k in msg_lower for k in ["skill", "gap", "missing", "recommendation"]):
        recs = (
            db.query(SkillRecommendation)
            .filter(SkillRecommendation.user_id == user.id)
            .all()
        )
        if recs:
            pending = [r for r in recs if r.status != "completed"]
            done = [r for r in recs if r.status == "completed"]
            return (
                f"You have {len(recs)} skill recommendations. "
                f"{len(done)} completed, {len(pending)} still in progress. "
                f"Check the Skills page to track your learning!"
            )
        return "No skill recommendations yet. Run a JD match on the Resume page to generate personalized skill gaps!"

    # Generic data response fallback
    return intent_json.get("response_text", _UNKNOWN_RESPONSE)


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

    # Build action object
    action: Optional[AgentAction] = None
    if raw_action and isinstance(raw_action, dict):
        action = AgentAction(
            type=raw_action.get("type", "none"),
            target=raw_action.get("target"),
        )

    return AgentQueryResponse(
        intent=intent,
        action=action,
        response_text=response_text,
    )
