from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..db import get_db
from ..deps import get_current_user
from ..models import Assessment, AssessmentStatus, User
from ..schemas import AssessmentItem, CreateAssessmentResponse


router = APIRouter(prefix="/api/v1", tags=["assessments"])


@router.get("/assessments", response_model=list[AssessmentItem])
def list_assessments(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rows = (
        db.query(Assessment)
        .filter(Assessment.user_id == user.id)
        .order_by(Assessment.created_at.desc())
        .all()
    )
    return [
        AssessmentItem(
            id=a.id,
            title=a.title,
            status=a.status.value,
            score=a.score,
            created_at=a.created_at.isoformat(),
        )
        for a in rows
    ]


@router.post("/assessments", response_model=CreateAssessmentResponse, status_code=201)
def create_assessment(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    count = db.query(Assessment).filter(Assessment.user_id == user.id).count()
    a = Assessment(user_id=user.id, title=f"Assessment {count + 1}", status=AssessmentStatus.pending)
    db.add(a)
    db.commit()
    db.refresh(a)
    return CreateAssessmentResponse(id=a.id)

