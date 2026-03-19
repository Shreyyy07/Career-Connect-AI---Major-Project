import secrets
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..db import get_db
from ..deps import get_current_user
from ..models import InterviewSession, InterviewStatus, InterviewType, JobDescription, User
from ..schemas import (
    InterviewAnswerRequest,
    InterviewAnswerResponse,
    InterviewEndRequest,
    InterviewEndResponse,
    InterviewStartRequest,
    InterviewStartResponse,
)
from ..ai_service import ai_generate_question, ai_evaluate_answer
from .evaluation import create_evaluation_for_session


router = APIRouter(prefix="/api/v1/interview", tags=["interview"])


def _get_jd_text(db: Session, job_id: int | None) -> tuple[str, str]:
    """Return (job_title, jd_text) for the given job_id, or empty strings."""
    if not job_id:
        return ("", "")
    jd = db.query(JobDescription).filter(JobDescription.id == job_id).one_or_none()
    if not jd:
        return ("", "")
    return (jd.title or "", (jd.description or "") + " " + (jd.skills_csv or ""))


def _get_previous_questions(transcript: str) -> list[str]:
    """Extract questions from the stored transcript (we store them prefixed with 'Q:')."""
    return [
        line[2:].strip()
        for line in transcript.splitlines()
        if line.startswith("Q:")
    ]


@router.post("/start", response_model=InterviewStartResponse)
def start(payload: InterviewStartRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    session_id = secrets.token_hex(16)
    s = InterviewSession(
        session_id=session_id,
        user_id=user.id,
        job_id=payload.jobID,
        type=InterviewType.ai,
        status=InterviewStatus.in_progress,
        experience_years=payload.experience,
        candidate_notes=(payload.description or ""),
    )
    db.add(s)
    db.commit()
    db.refresh(s)

    job_title, jd_text = _get_jd_text(db, payload.jobID)

    # Generate first question via AI (with fallback)
    first_q = ai_generate_question(
        job_title=job_title or "the role",
        jd_text=jd_text,
        experience_years=payload.experience,
        previous_questions=[],
        candidate_notes=(payload.description or ""),
    )

    # Store question in transcript
    s.transcript = f"Q: {first_q}"
    db.add(s)
    db.commit()

    return InterviewStartResponse(sessionID=session_id, firstQuestion=first_q)


@router.post("/answer", response_model=InterviewAnswerResponse)
def answer(payload: InterviewAnswerRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    s = db.query(InterviewSession).filter(InterviewSession.session_id == payload.sessionID).one_or_none()
    if not s:
        raise HTTPException(status_code=404, detail="Session not found")
    if s.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not allowed")
    if str(s.status.value) != InterviewStatus.in_progress.value:
        raise HTTPException(status_code=409, detail="Session is not active")

    prev_questions = _get_previous_questions(s.transcript or "")
    job_title, jd_text = _get_jd_text(db, s.job_id)

    # Append the candidate's answer to transcript
    last_q = prev_questions[-1] if prev_questions else ""
    s.transcript = (s.transcript + f"\nA: {payload.transcript}").strip()
    db.add(s)
    db.commit()

    # Generate next question — AI uses conversation context
    next_q = ai_generate_question(
        job_title=job_title or "the role",
        jd_text=jd_text,
        experience_years=s.experience_years,
        previous_questions=prev_questions,
        candidate_notes=s.candidate_notes or "",
    )

    # Store next question in transcript
    s.transcript = s.transcript + f"\nQ: {next_q}"
    db.add(s)
    db.commit()

    return InterviewAnswerResponse(nextQuestion=next_q)


@router.post("/end", response_model=InterviewEndResponse, status_code=202)
def end(payload: InterviewEndRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    s = db.query(InterviewSession).filter(InterviewSession.session_id == payload.sessionID).one_or_none()
    if not s:
        raise HTTPException(status_code=404, detail="Session not found")
    if s.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not allowed")

    s.status = InterviewStatus.completed
    s.completed_at = datetime.utcnow()
    db.add(s)
    db.commit()
    db.refresh(s)

    eval_id = create_evaluation_for_session(db=db, session=s)
    return InterviewEndResponse(evalID=eval_id, estimatedReady=10)
