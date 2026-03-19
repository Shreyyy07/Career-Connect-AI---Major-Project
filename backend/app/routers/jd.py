from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..db import get_db
from ..deps import get_current_user
from ..models import JobDescription, JDStatus, User, UserRole
from ..schemas import JDCreateResponse, JDListItem, JDUploadRequest
from ..doc2vec_service import ensure_model, infer_embedding_csv


router = APIRouter(prefix="/api/v1/jd", tags=["job-description"])


def _require_hr(user: User):
    if user.role not in (UserRole.hr, UserRole.admin):
        raise HTTPException(status_code=403, detail="Only HR users can manage job descriptions")


@router.post("/upload", response_model=JDCreateResponse, status_code=201)
def upload_jd(payload: JDUploadRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    _require_hr(user)

    skills_clean = [s.strip() for s in payload.skills if s and s.strip()]
    jd = JobDescription(
        hr_user_id=user.id,
        title=payload.title.strip(),
        description=payload.description.strip(),
        skills_csv=",".join(skills_clean),
        status=JDStatus.active,
    )
    db.add(jd)
    db.commit()
    db.refresh(jd)

    # Doc2Vec embedding
    try:
        model = ensure_model(db)
        jd.embedding_csv = infer_embedding_csv(model, (jd.description or "") + " " + (jd.skills_csv or ""))
        db.add(jd)
        db.commit()
    except Exception:
        pass
    return JDCreateResponse(jobID=jd.id)


@router.get("/list", response_model=list[JDListItem])
def list_jds(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    _require_hr(user)
    rows = (
        db.query(JobDescription)
        .filter(JobDescription.hr_user_id == user.id)
        .order_by(JobDescription.created_at.desc())
        .all()
    )
    return [JDListItem(jobID=r.id, title=r.title, status=str(r.status.value)) for r in rows]


@router.get("/active")
def list_active_jds(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    # Candidate needs to view active JDs for matching. HR can view all active too.
    rows = (
        db.query(JobDescription)
        .filter(JobDescription.status == JDStatus.active)
        .order_by(JobDescription.created_at.desc())
        .all()
    )
    return [
        {"jobID": r.id, "title": r.title, "status": str(r.status.value), "skills": r.skills_csv}
        for r in rows
    ]

