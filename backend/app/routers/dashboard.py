from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..db import get_db
from ..deps import get_current_user
from ..models import Assessment, AssessmentStatus, Evaluation, InterviewSession, User


router = APIRouter(prefix="/api/v1", tags=["dashboard"])


@router.get("/dashboard/stats")
def get_stats(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    completed_interviews = (
        db.query(InterviewSession)
        .filter(InterviewSession.user_id == user.id, InterviewSession.status == "completed")
        .count()
    )
    pending_assessments = (
        db.query(Assessment)
        .filter(Assessment.user_id == user.id, Assessment.status == AssessmentStatus.pending)
        .count()
    )

    # Average over evaluation final_score for completed sessions (if any)
    eval_scores = (
        db.query(Evaluation.final_score)
        .join(InterviewSession, InterviewSession.id == Evaluation.interview_session_id)
        .filter(InterviewSession.user_id == user.id)
        .all()
    )
    avg = 0.0
    if eval_scores:
        avg = sum(float(r[0] or 0) for r in eval_scores) / len(eval_scores)

    total_sessions = completed_interviews + db.query(Assessment).filter(Assessment.user_id == user.id).count()

    return {
        "completed_interviews": completed_interviews,
        "pending_assessments": pending_assessments,
        "average_score": round(avg, 2),
        "total_sessions": total_sessions,
    }

