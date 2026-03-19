from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from ..db import get_db
from ..deps import get_current_user
from ..models import Evaluation, InterviewSession, User
from .evaluation import REPORTS_DIR


router = APIRouter(prefix="/api/v1", tags=["report"])


@router.get("/report/{id}/download")
def download_report(id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    ev = db.query(Evaluation).filter(Evaluation.id == id).one_or_none()
    if not ev:
        raise HTTPException(status_code=404, detail="Evaluation not found")

    session = db.query(InterviewSession).filter(InterviewSession.id == ev.interview_session_id).one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if session.user_id != user.id and str(user.role) not in ("admin", "hr", "moderator", "analyst"):
        raise HTTPException(status_code=403, detail="Not allowed")

    path = REPORTS_DIR / f"{id}.pdf"
    if not path.exists():
        raise HTTPException(status_code=404, detail="Report file not found")

    return FileResponse(
        path=str(path),
        media_type="application/pdf",
        filename=f"{session.user_id}_{session.job_id or 'NA'}_{id}.pdf",
    )

