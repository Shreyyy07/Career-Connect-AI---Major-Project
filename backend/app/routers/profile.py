from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..db import get_db
from ..deps import get_current_user
from ..models import User
from ..schemas import ProfileResponse, ProfileUpdateRequest


router = APIRouter(prefix="/api/v1", tags=["profile"])


@router.get("/profile", response_model=ProfileResponse)
def get_profile(user: User = Depends(get_current_user)):
    return ProfileResponse(id=user.id, email=user.email, name=user.full_name, role=user.role.value)


@router.put("/profile", response_model=ProfileResponse)
def update_profile(
    payload: ProfileUpdateRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    user.full_name = payload.name.strip()
    db.add(user)
    db.commit()
    db.refresh(user)
    return ProfileResponse(id=user.id, email=user.email, name=user.full_name, role=user.role.value)

