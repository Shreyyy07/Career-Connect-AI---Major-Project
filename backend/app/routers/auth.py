import random
import string
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import User
from ..schemas import (
    RegisterRequest, AuthResponse, LoginRequest, LoginResponse,
    ProfileResponse, ProfileUpdateRequest
)
from ..security import hash_password, verify_password, create_access_token, decode_token
from ..deps import get_current_user

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

# In-memory OTP store (for dev; replace with DB table in production)
# { email: { otp_hash: str, expires_at: datetime } }
_otp_store: dict = {}


def _gen_otp() -> str:
    return "".join(random.choices(string.digits, k=6))


# ──────────────────────────────────────────────────────────────────
# POST /register
# ──────────────────────────────────────────────────────────────────
@router.post("/register", response_model=AuthResponse, status_code=201)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email.lower()).one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="This email is already registered.")

    user = User(
        email=payload.email.lower(),
        full_name=payload.name.strip(),
        role=payload.role.value,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(sub=str(user.id), role=user.role.value, name=user.full_name)
    return AuthResponse(userID=user.id, token=token)


# ──────────────────────────────────────────────────────────────────
# POST /login
# ──────────────────────────────────────────────────────────────────
@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower()).one_or_none()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(sub=str(user.id), role=user.role.value, name=user.full_name)
    return LoginResponse(token=token, refreshToken=None)


# ──────────────────────────────────────────────────────────────────
# GET /me  — returns authenticated user's profile
# ──────────────────────────────────────────────────────────────────
@router.get("/me", response_model=ProfileResponse)
def me(current_user: User = Depends(get_current_user)):
    return ProfileResponse(
        id=current_user.id,
        email=current_user.email,
        name=current_user.full_name,
        role=current_user.role.value,
    )


# ──────────────────────────────────────────────────────────────────
# PATCH /me  — update display name
# ──────────────────────────────────────────────────────────────────
@router.patch("/me", response_model=ProfileResponse)
def update_me(
    payload: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    current_user.full_name = payload.name.strip()
    db.commit()
    db.refresh(current_user)
    return ProfileResponse(
        id=current_user.id,
        email=current_user.email,
        name=current_user.full_name,
        role=current_user.role.value,
    )


# ──────────────────────────────────────────────────────────────────
# POST /forgot-password  — generate 6-digit OTP
# ──────────────────────────────────────────────────────────────────
@router.post("/forgot-password")
def forgot_password(payload: dict, db: Session = Depends(get_db)):
    email = (payload.get("email") or "").lower().strip()
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")

    user = db.query(User).filter(User.email == email).one_or_none()
    # Always return 200 to prevent email enumeration
    if not user:
        return {"message": "If that account exists, an OTP has been sent."}

    otp = _gen_otp()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
    _otp_store[email] = {"otp": otp, "expires_at": expires_at, "used": False}

    # Log OTP to console in dev (replace with email send in production)
    print(f"[DEV] Password reset OTP for {email}: {otp}  (valid 10 min)")

    return {"message": "If that account exists, an OTP has been sent.", "dev_otp": otp}


# ──────────────────────────────────────────────────────────────────
# POST /reset-password  — verify OTP + update password
# ──────────────────────────────────────────────────────────────────
@router.post("/reset-password")
def reset_password(payload: dict, db: Session = Depends(get_db)):
    email = (payload.get("email") or "").lower().strip()
    otp = str(payload.get("otp") or "").strip()
    new_password = str(payload.get("new_password") or "").strip()

    if not email or not otp or not new_password:
        raise HTTPException(status_code=400, detail="email, otp and new_password are required")

    if len(new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    record = _otp_store.get(email)
    if not record:
        raise HTTPException(status_code=400, detail="No OTP requested for this email")

    if record.get("used"):
        raise HTTPException(status_code=409, detail="OTP already used")

    if datetime.now(timezone.utc) > record["expires_at"]:
        raise HTTPException(status_code=410, detail="OTP has expired. Please request a new one.")

    if record["otp"] != otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    user = db.query(User).filter(User.email == email).one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.password_hash = hash_password(new_password)
    record["used"] = True
    db.commit()

    return {"message": "Password updated successfully. You can now log in."}


# ──────────────────────────────────────────────────────────────────
# POST /change-password  — logged-in user changes their own password
# ──────────────────────────────────────────────────────────────────
@router.post("/change-password")
def change_password(
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    current_pw = str(payload.get("current_password") or "")
    new_pw = str(payload.get("new_password") or "")

    if not current_pw or not new_pw:
        raise HTTPException(status_code=400, detail="current_password and new_password are required")

    if not verify_password(current_pw, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect current password")

    if len(new_pw) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters")

    current_user.password_hash = hash_password(new_pw)
    db.commit()

    return {"message": "Password updated successfully"}
