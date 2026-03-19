from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..db import get_db
from ..deps import get_current_user
from ..models import RecommendationStatus, SkillRecommendation, SkillRecommendationEvent, User
from ..schemas import RecommendationHistoryItem, RecommendationItem, RecommendationStatusUpdateRequest
from ..ai_service import ai_find_resource_url
from ..models import JobDescription


router = APIRouter(prefix="/api/v1/recommendations", tags=["recommendations"])


@router.get("")
def list_recommendations(
    resumeID: int,
    jobID: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    rows = (
        db.query(SkillRecommendation)
        .filter(SkillRecommendation.user_id == user.id, SkillRecommendation.resume_id == resumeID, SkillRecommendation.job_id == jobID)
        .order_by(SkillRecommendation.created_at.asc())
        .all()
    )
    # We return only status/skill; UI can still display static recommendation text from match response.
    return [r for r in rows]


@router.post("/{rec_id}/status", response_model=RecommendationItem)
def update_recommendation_status(
    rec_id: int,
    payload: RecommendationStatusUpdateRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    rec = db.query(SkillRecommendation).filter(SkillRecommendation.id == rec_id).one_or_none()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    if rec.user_id != user.id:
        # v1: only the candidate owning the recommendation can update status
        raise HTTPException(status_code=403, detail="Not allowed")

    try:
        new_status = RecommendationStatus(payload.status)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid status")

    prev_status = rec.status
    if prev_status != new_status:
        rec.status = new_status
        db.add(rec)
        db.add(
            SkillRecommendationEvent(
                recommendation_id=rec.id,
                from_status=prev_status,
                to_status=new_status,
            )
        )
        db.commit()
    else:
        db.commit()
    db.refresh(rec)

    # For now, we don't persist impact/resource fields; UI uses them from match response.
    # Return minimal fields required for frontend status badge.
    return RecommendationItem(
        recID=rec.id,
        skill=rec.skill,
        impact="medium",
        resourceType="video/course/article",
        suggestedSearch=f"{rec.skill} interview preparation",
        estimatedTime="1-2 hours",
        status=rec.status.value,
    )


@router.get("/{rec_id}/resource-url")
def get_resource_url(
    rec_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Ask the AI for the best learning URL for this skill.
    Returns {"url": "https://...", "skill": "..."} — frontend opens it in a new tab.
    """
    rec = db.query(SkillRecommendation).filter(SkillRecommendation.id == rec_id).one_or_none()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    if rec.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not allowed")

    job_title = "software engineering"
    if rec.job_id:
        jd = db.query(JobDescription).filter(JobDescription.id == rec.job_id).one_or_none()
        if jd:
            job_title = jd.title or job_title

    url = ai_find_resource_url(skill=rec.skill, job_title=job_title)
    return {"url": url, "skill": rec.skill}


@router.get("/{rec_id}/history", response_model=list[RecommendationHistoryItem])
def recommendation_history(
    rec_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    rec = db.query(SkillRecommendation).filter(SkillRecommendation.id == rec_id).one_or_none()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    if rec.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not allowed")

    events = (
        db.query(SkillRecommendationEvent)
        .filter(SkillRecommendationEvent.recommendation_id == rec_id)
        .order_by(SkillRecommendationEvent.created_at.asc())
        .all()
    )
    return [
        RecommendationHistoryItem(
            fromStatus=e.from_status.value,
            toStatus=e.to_status.value,
            created_at=e.created_at.isoformat(),
        )
        for e in events
    ]

