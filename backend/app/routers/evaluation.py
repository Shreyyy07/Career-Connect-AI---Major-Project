from __future__ import annotations

import os
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from sqlalchemy.orm import Session

from ..db import get_db
from ..deps import get_current_user
from ..models import Evaluation, InterviewSession, JobDescription, Resume, User
from ..schemas import EvaluationResponse
from ..utils import extract_tokens, jaccard_similarity, stable_hash_score


router = APIRouter(prefix="/api/v1", tags=["evaluation"])


REPORTS_DIR = Path(__file__).resolve().parents[2] / "reports"
REPORTS_DIR.mkdir(parents=True, exist_ok=True)


def _compute_similarity_score(db: Session, session: InterviewSession) -> float:
    if not session.job_id:
        return 0.0

    jd = db.query(JobDescription).filter(JobDescription.id == session.job_id).one_or_none()
    if not jd:
        return 0.0

    # Use latest resume if available
    resume = (
        db.query(Resume)
        .filter(Resume.user_id == session.user_id)
        .order_by(Resume.created_at.desc())
        .first()
    )
    if not resume:
        return 0.0

    sim = jaccard_similarity(extract_tokens(resume.raw_text), extract_tokens(jd.description + " " + (jd.skills_csv or "")))
    return round(sim * 100.0, 2)


def _render_pdf(eval_id: int, payload: dict) -> Path:
    path = REPORTS_DIR / f"{eval_id}.pdf"
    c = canvas.Canvas(str(path), pagesize=A4)
    width, height = A4

    y = height - 72
    c.setFont("Helvetica-Bold", 18)
    c.drawString(72, y, "Career Connect AI — Evaluation Report")
    y -= 28

    c.setFont("Helvetica", 11)
    for k, v in payload.items():
        c.drawString(72, y, f"{k}: {v}")
        y -= 16
        if y < 72:
            c.showPage()
            y = height - 72
            c.setFont("Helvetica", 11)

    c.showPage()
    c.save()
    return path


def create_evaluation_for_session(db: Session, session: InterviewSession) -> int:
    similarity = _compute_similarity_score(db, session)
    semantic = round(stable_hash_score(session.transcript) * 0.9, 2)
    emotion = round(stable_hash_score(session.session_id) * 0.6, 2)
    audio = round(stable_hash_score(session.candidate_notes) * 0.5, 2)

    final = round((0.35 * semantic) + (0.30 * similarity) + (0.20 * emotion) + (0.15 * audio), 2)

    ev = Evaluation(
        interview_session_id=session.id,
        semantic_score=semantic,
        similarity_score=similarity,
        emotion_score=emotion,
        audio_score=audio,
        final_score=final,
        report_url="",  # set after render
    )
    db.add(ev)
    db.commit()
    db.refresh(ev)

    pdf_payload = {
        "Eval ID": ev.id,
        "Session ID": session.session_id,
        "Semantic Score": semantic,
        "JD Similarity Score": similarity,
        "Emotion Score": emotion,
        "Audio Score": audio,
        "Final Composite Score": final,
        "Note": "v1 report is generated from lightweight scoring; ML modules will replace these in later phases.",
    }
    _render_pdf(ev.id, pdf_payload)
    ev.report_url = f"/api/v1/report/{ev.id}/download"
    db.add(ev)
    db.commit()
    return ev.id


@router.get("/evaluation/{id}", response_model=EvaluationResponse)
def get_evaluation(id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    ev = db.query(Evaluation).filter(Evaluation.id == id).one_or_none()
    if not ev:
        raise HTTPException(status_code=404, detail="Evaluation not found")

    session = db.query(InterviewSession).filter(InterviewSession.id == ev.interview_session_id).one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if session.user_id != user.id and str(user.role) not in ("admin", "hr", "moderator", "analyst"):
        raise HTTPException(status_code=403, detail="Not allowed")

    return EvaluationResponse(
        evalID=ev.id,
        sessionID=session.session_id,
        semanticScore=ev.semantic_score,
        similarityScore=ev.similarity_score,
        emotionScore=ev.emotion_score,
        audioScore=ev.audio_score,
        finalScore=ev.final_score,
        reportURL=ev.report_url or None,
    )

