from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..db import get_db
from ..deps import get_current_user
from ..models import JobDescription, JDStatus, User, UserRole
from ..schemas import (
    JDCreateResponse, JDListItem, JDUploadRequest,
    JDCreateRequest, JDStatusUpdateRequest, JDDetailItem,
)
from ..doc2vec_service import ensure_model, infer_embedding_csv


router = APIRouter(prefix="/api/v1/jd", tags=["job-description"])


def _require_hr(user: User):
    if user.role not in (UserRole.hr, UserRole.admin):
        raise HTTPException(status_code=403, detail="Only HR users can manage job descriptions")


def _jd_to_list_item(r: JobDescription) -> JDListItem:
    skills = [s.strip() for s in (r.skills_csv or "").split(",") if s.strip()]
    return JDListItem(
        jobID=r.id,
        title=r.title,
        company_name=r.company_name or "",
        experience_level=r.experience_level or "",
        location=r.location or "",
        status=str(r.status.value),
        skills=skills,
        created_at=r.created_at.strftime("%Y-%m-%dT%H:%M:%S") if r.created_at else "",
    )


def _jd_to_detail(r: JobDescription) -> JDDetailItem:
    skills = [s.strip() for s in (r.skills_csv or "").split(",") if s.strip()]
    updated = r.updated_at or r.created_at
    return JDDetailItem(
        jobID=r.id,
        title=r.title,
        company_name=r.company_name or "",
        description=r.description or "",
        skills=skills,
        experience_level=r.experience_level or "",
        location=r.location or "",
        status=str(r.status.value),
        created_at=r.created_at.strftime("%Y-%m-%dT%H:%M:%S") if r.created_at else "",
        updated_at=updated.strftime("%Y-%m-%dT%H:%M:%S") if updated else "",
    )


def _run_embedding(db: Session, jd: JobDescription):
    """Re-generate Doc2Vec embedding for a JD (non-fatal if model unavailable)."""
    try:
        model = ensure_model(db)
        text = f"{jd.title} {jd.description} {jd.skills_csv or ''}"
        jd.embedding_csv = infer_embedding_csv(model, text)
        db.add(jd)
        db.commit()
    except Exception:
        pass


# ─── Legacy upload endpoint (kept for backward compat) ────────────────────────
@router.post("/upload", response_model=JDCreateResponse, status_code=201)
def upload_jd(payload: JDUploadRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    _require_hr(user)
    skills_clean = [s.strip() for s in payload.skills if s and s.strip()]
    jd = JobDescription(
        hr_user_id=user.id,
        title=payload.title.strip(),
        description=payload.description.strip(),
        skills_csv=",".join(skills_clean),
        company_name=getattr(user, "company_name", "") or "",
        status=JDStatus.active,
    )
    db.add(jd)
    db.commit()
    db.refresh(jd)
    _run_embedding(db, jd)
    return JDCreateResponse(jobID=jd.id)


# ─── Full HR JD CRUD ───────────────────────────────────────────────────────────

@router.post("", response_model=JDCreateResponse, status_code=201)
def create_jd(payload: JDCreateRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Create a new JD (defaults to Draft unless status=active passed)."""
    _require_hr(user)
    skills_clean = [s.strip() for s in payload.skills if s and s.strip()]
    status = JDStatus.active if (payload.status or "").lower() == "active" else JDStatus.draft
    jd = JobDescription(
        hr_user_id=user.id,
        title=payload.title.strip(),
        company_name=(payload.company_name or getattr(user, "company_name", "") or "").strip(),
        description=payload.description.strip(),
        skills_csv=",".join(skills_clean),
        experience_level=(payload.experience_level or "").strip(),
        location=(payload.location or "").strip(),
        status=status,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(jd)
    db.commit()
    db.refresh(jd)
    _run_embedding(db, jd)
    return JDCreateResponse(jobID=jd.id)


@router.get("/mine", response_model=list[JDListItem])
def list_my_jds(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """List all JDs created by this HR user (all statuses except deleted)."""
    _require_hr(user)
    rows = (
        db.query(JobDescription)
        .filter(JobDescription.hr_user_id == user.id)
        .order_by(JobDescription.created_at.desc())
        .all()
    )
    return [_jd_to_list_item(r) for r in rows]


@router.get("/list", response_model=list[JDListItem])
def list_jds(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Legacy list endpoint — returns HR's JDs."""
    _require_hr(user)
    rows = (
        db.query(JobDescription)
        .filter(JobDescription.hr_user_id == user.id)
        .order_by(JobDescription.created_at.desc())
        .all()
    )
    return [_jd_to_list_item(r) for r in rows]


@router.get("/active")
def list_active_jds(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """All active JDs — visible to candidates for browsing."""
    rows = (
        db.query(JobDescription)
        .filter(JobDescription.status == JDStatus.active)
        .order_by(JobDescription.created_at.desc())
        .all()
    )
    return [
        {
            "jobID": r.id,
            "title": r.title,
            "company_name": r.company_name or "",
            "experience_level": r.experience_level or "",
            "location": r.location or "",
            "status": str(r.status.value),
            "skills": [s.strip() for s in (r.skills_csv or "").split(",") if s.strip()],
        }
        for r in rows
    ]


@router.get("/{jd_id}", response_model=JDDetailItem)
def get_jd(jd_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Get full JD detail. HR must own it."""
    _require_hr(user)
    jd = db.query(JobDescription).filter(JobDescription.id == jd_id).one_or_none()
    if not jd:
        raise HTTPException(status_code=404, detail="JD not found")
    if jd.hr_user_id != user.id and user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Not your JD")
    return _jd_to_detail(jd)


@router.put("/{jd_id}", response_model=JDDetailItem)
def update_jd(jd_id: int, payload: JDCreateRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Edit a JD. Re-generates embedding. Must be owner."""
    _require_hr(user)
    jd = db.query(JobDescription).filter(JobDescription.id == jd_id).one_or_none()
    if not jd:
        raise HTTPException(status_code=404, detail="JD not found")
    if jd.hr_user_id != user.id and user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Not your JD")

    skills_clean = [s.strip() for s in payload.skills if s and s.strip()]
    jd.title = payload.title.strip()
    jd.company_name = (payload.company_name or jd.company_name or "").strip()
    jd.description = payload.description.strip()
    jd.skills_csv = ",".join(skills_clean)
    jd.experience_level = (payload.experience_level or "").strip()
    jd.location = (payload.location or "").strip()
    jd.updated_at = datetime.utcnow()

    db.add(jd)
    db.commit()
    db.refresh(jd)
    _run_embedding(db, jd)
    return _jd_to_detail(jd)


@router.patch("/{jd_id}/status")
def update_jd_status(jd_id: int, payload: JDStatusUpdateRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Change JD status: draft | active | closed."""
    _require_hr(user)
    jd = db.query(JobDescription).filter(JobDescription.id == jd_id).one_or_none()
    if not jd:
        raise HTTPException(status_code=404, detail="JD not found")
    if jd.hr_user_id != user.id and user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Not your JD")

    status_map = {"draft": JDStatus.draft, "active": JDStatus.active, "closed": JDStatus.closed}
    new_status = status_map.get(payload.status.lower())
    if not new_status:
        raise HTTPException(status_code=422, detail=f"Invalid status. Use: draft, active, closed")

    jd.status = new_status
    jd.updated_at = datetime.utcnow()
    db.add(jd)
    db.commit()
    return {"jobID": jd.id, "status": payload.status}


@router.delete("/{jd_id}")
def delete_jd(jd_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Soft-delete a JD by setting status=closed. Data preserved for analytics."""
    _require_hr(user)
    jd = db.query(JobDescription).filter(JobDescription.id == jd_id).one_or_none()
    if not jd:
        raise HTTPException(status_code=404, detail="JD not found")
    if jd.hr_user_id != user.id and user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Not your JD")

    jd.status = JDStatus.closed   # soft-delete: keep data, just close it
    jd.updated_at = datetime.utcnow()
    db.add(jd)
    db.commit()
    return {"ok": True, "jobID": jd_id}
