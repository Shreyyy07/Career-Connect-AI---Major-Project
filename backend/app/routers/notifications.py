"""
Notifications router — bell icon data for both candidate and HR dashboards.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..db import get_db
from ..deps import get_current_user
from ..models import Notification, User

router = APIRouter(prefix="/api/v1/notifications", tags=["notifications"])


@router.get("")
def get_notifications(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Fetch the 20 most recent notifications for the current user."""
    items = (
        db.query(Notification)
        .filter(Notification.user_id == user.id)
        .order_by(Notification.created_at.desc())
        .limit(20)
        .all()
    )
    return [
        {
            "id": n.id,
            "title": n.title,
            "message": n.message,
            "type": n.type,
            "is_read": n.is_read,
            "created_at": n.created_at.isoformat(),
        }
        for n in items
    ]


@router.get("/unread-count")
def get_unread_count(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    count = db.query(Notification).filter(
        Notification.user_id == user.id,
        Notification.is_read == False,
    ).count()
    return {"count": count}


@router.patch("/read-all")
def mark_all_read(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Mark all notifications as read for the current user."""
    db.query(Notification).filter(
        Notification.user_id == user.id,
        Notification.is_read == False,
    ).update({"is_read": True})
    db.commit()
    return {"ok": True}
