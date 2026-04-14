import secrets
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from pathlib import Path

from ..db import get_db, SessionLocal
from ..deps import get_current_user
from ..models import InterviewSession, InterviewStatus, InterviewType, JobDescription, Resume, User
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

    # Fetch candidate's latest resume for personalised questions
    latest_resume = (
        db.query(Resume)
        .filter(Resume.user_id == user.id)
        .order_by(Resume.created_at.desc())
        .first()
    )
    resume_text = latest_resume.raw_text if latest_resume else ""

    # Generate first question via AI (with fallback)
    first_q = ai_generate_question(
        job_title=job_title or "the role",
        jd_text=jd_text,
        experience_years=payload.experience,
        previous_questions=[],
        candidate_notes=(payload.description or ""),
        resume_text=resume_text,
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

    # Fetch candidate resume for context
    latest_resume = (
        db.query(Resume)
        .filter(Resume.user_id == user.id)
        .order_by(Resume.created_at.desc())
        .first()
    )
    resume_text = latest_resume.raw_text if latest_resume else ""

    # Append the candidate's answer to transcript
    last_q = prev_questions[-1] if prev_questions else ""
    s.transcript = (s.transcript + f"\nA: {payload.transcript}").strip()
    db.add(s)
    db.commit()

    # Generate next question — AI uses conversation context + resume
    next_q = ai_generate_question(
        job_title=job_title or "the role",
        jd_text=jd_text,
        experience_years=s.experience_years,
        previous_questions=prev_questions,
        candidate_notes=s.candidate_notes or "",
        resume_text=resume_text,
    )

    # Store next question in transcript
    s.transcript = s.transcript + f"\nQ: {next_q}"
    db.add(s)
    db.commit()

    return InterviewAnswerResponse(nextQuestion=next_q)


async def handle_post_evaluation(user_id: int, email: str, name: str, job_title: str, eval_id: int, hr_user_id: int | None, job_id: int | None):
    from ..core.email import send_report_email
    from ..routers.evaluation import REPORTS_DIR
    
    report_path = REPORTS_DIR / f"{eval_id}.pdf"
    
    # Send email to candidate
    await send_report_email(email, name, job_title, report_path)
    
    with SessionLocal() as db:
        from ..models import Notification
        # 1. Notify the candidate that their report is ready
        notif_candidate = Notification(
            user_id=user_id,
            title="Report Generated ✅",
            message=f"Your AI interview report for '{job_title}' is ready. We have also emailed you a copy.",
            type="report_ready",
        )
        db.add(notif_candidate)

        # 2. Notify the HR that a candidate completed an interview for their JD
        if hr_user_id:
            notif_hr = Notification(
                user_id=hr_user_id,
                title="New Interview Completed 🎙️",
                message=f"{name} ({email}) has completed an AI interview for the '{job_title}' role. View their results in the Candidates section.",
                type="interview_completed",
            )
            db.add(notif_hr)

        db.commit()


@router.post("/end", response_model=InterviewEndResponse, status_code=202)
def end(payload: InterviewEndRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
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
    
    job_title, _ = _get_jd_text(db, s.job_id)
    
    # Find the HR who owns this JD
    hr_user_id = None
    if s.job_id:
        jd = db.query(JobDescription).filter(JobDescription.id == s.job_id).one_or_none()
        if jd:
            hr_user_id = jd.hr_user_id

    background_tasks.add_task(
        handle_post_evaluation,
        user_id=user.id,
        email=user.email,
        name=user.full_name or user.email,
        job_title=job_title or "General Interview",
        eval_id=eval_id,
        hr_user_id=hr_user_id,
        job_id=s.job_id,
    )

    return InterviewEndResponse(evalID=eval_id, estimatedReady=10)

