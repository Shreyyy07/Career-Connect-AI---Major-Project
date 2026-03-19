from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..db import get_db
from ..deps import get_current_user
from ..models import Evaluation, InterviewSession, User


router = APIRouter(prefix="/api/v1", tags=["history"])


@router.get("/candidate/history")
def candidate_history(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rows = (
        db.query(InterviewSession, Evaluation)
        .join(Evaluation, Evaluation.interview_session_id == InterviewSession.id, isouter=True)
        .filter(InterviewSession.user_id == user.id, InterviewSession.status == "completed")
        .order_by(InterviewSession.completed_at.desc())
        .all()
    )

    out = []
    for session, ev in rows:
        out.append(
            {
                "sessionID": session.session_id,
                "type": session.type.value if hasattr(session.type, "value") else str(session.type),
                "completed_at": session.completed_at.isoformat() if session.completed_at else None,
                "score": float(ev.final_score) if ev else 0.0,
                "feedback": "v1 evaluation generated",
                "evalID": ev.id if ev else None,
                "reportURL": ev.report_url if ev else None,
            }
        )
    return out

