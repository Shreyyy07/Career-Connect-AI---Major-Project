from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from .db import get_db
from .models import User
from .security import decode_token


bearer = HTTPBearer(auto_error=False)


def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    if not creds or not creds.credentials:
        raise HTTPException(status_code=401, detail="Missing Authorization header")

    try:
        payload = decode_token(creds.credentials)
        user_id = int(payload.get("sub"))
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.id == user_id).one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    if getattr(user, "is_verified", True) is False:
        raise HTTPException(status_code=403, detail="Email not verified")
    return user


def optional_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> User | None:
    if not creds or not creds.credentials:
        return None
    try:
        payload = decode_token(creds.credentials)
        user_id = int(payload.get("sub"))
        return db.query(User).filter(User.id == user_id).one_or_none()
    except Exception:
        return None

