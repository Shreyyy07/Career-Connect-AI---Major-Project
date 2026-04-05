import random
import string
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import User
from ..schemas import (
    RegisterRequest, AuthResponse, LoginRequest, LoginResponse,
    ProfileResponse, ProfileUpdateRequest, VerifyEmailRequest, ResendVerificationRequest,
    ForgotPasswordRequest, ResetPasswordOTPRequest
)
import smtplib
from email.message import EmailMessage
import os
from ..core.config import settings
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
        is_verified=False
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    otp = _gen_otp()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
    _otp_store[user.email] = {"otp": otp, "expires_at": expires_at, "used": False}

    success = _send_otp_email(user.email, otp)
    if not success:
        # If email fails, rollback so they can try again and let them know.
        db.delete(user)
        db.commit()
        raise HTTPException(status_code=500, detail="Failed to dispatch verification email. Please check SMTP App Password.")

    # Return empty token so frontend knows it must verify email next
    return AuthResponse(userID=user.id, token="")

def _send_otp_email(to_email: str, otp: str):
    smtp_user = settings.smtp_email
    smtp_pass = settings.smtp_password
    if not smtp_user or not smtp_pass:
        print(f"[DEV] Missing SMTP config. OTP for {to_email} is {otp}")
        return True # Dev fallback allows registration to succeed so testing continues

    try:
        msg = EmailMessage()
        msg["Subject"] = "Verify your email - Career Connect AI"
        msg["From"] = f"Career Connect AI <{smtp_user}>"
        msg["To"] = to_email
        
        # Set plaintext fallback
        msg.set_content(f"Hello,\n\nYour Career Connect AI verification code is: {otp}\n\nThis code will expire in 15 minutes.\n\nThank you!")

        # Add Beautiful HTML version matching Loveable screenshot style
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                    background-color: #fafbfc;
                    margin: 0;
                    padding: 50px 20px;
                }}
                .logo-header {{
                    text-align: center;
                    font-size: 26px;
                    font-weight: 800;
                    color: #000000;
                    margin-bottom: 25px;
                    letter-spacing: -0.5px;
                }}
                .highlight {{
                    color: #00e5ff;
                }}
                .container {{
                    max-width: 480px;
                    margin: 0 auto;
                    background-color: #ffffff;
                    border: 1px solid #e1e4e8;
                    border-radius: 16px;
                    padding: 45px 40px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.03);
                }}
                h1 {{
                    font-size: 22px;
                    color: #1f2328;
                    margin-bottom: 12px;
                    margin-top: 0;
                    font-weight: 700;
                    letter-spacing: -0.3px;
                }}
                p {{
                    font-size: 15px;
                    line-height: 1.6;
                    color: #424a53;
                    margin-bottom: 30px;
                }}
                .otp-box {{
                    text-align: center;
                    margin-bottom: 20px;
                }}
                .otp-button {{
                    display: inline-block;
                    background-color: #00e5ff;
                    color: #000000;
                    font-size: 28px;
                    font-weight: 700;
                    letter-spacing: 8px;
                    padding: 16px 32px;
                    border-radius: 12px;
                    text-decoration: none;
                    margin: 0 auto;
                    box-shadow: 0 0 20px rgba(0, 229, 255, 0.4);
                }}
                .footer {{
                    text-align: center;
                    margin-top: 35px;
                    font-size: 13px;
                    color: #8c959f;
                }}
            </style>
        </head>
        <body>
            <div class="logo-header">Career<span class="highlight">Connect</span> AI</div>
            <div class="container">
                <h1>Verify your <b>Career<span class="highlight">Connect</span></b> email</h1>
                <p>Welcome to CareerConnect. Please use the verification code below to securely verify your email address and activate your sign in.</p>
                
                <div class="otp-box">
                    <div class="otp-button">{otp}</div>
                </div>
                
                <p style="font-size: 13px; color: #6e7781; margin-bottom: 0; margin-top: 30px;">
                    This code will expire in 15 minutes. If you did not request this, you can safely ignore this email.
                </p>
            </div>
            <div class="footer">Recruitment. Redesigned.</div>
        </body>
        </html>
        """
        msg.add_alternative(html_content, subtype='html')

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(smtp_user, smtp_pass)
            server.send_message(msg)
        print(f"[DEV] Real HTML email sent to {to_email}")
        return True
    except Exception as e:
        print(f"[ERROR] Failed to send email to {to_email}: {e}")
        return False

@router.post("/verify-email", response_model=AuthResponse)
def verify_email(payload: VerifyEmailRequest, db: Session = Depends(get_db)):
    email = payload.email.lower().strip()
    otp = payload.otp.strip()

    record = _otp_store.get(email)
    if not record or record.get("used"):
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    if datetime.now(timezone.utc) > record["expires_at"]:
        raise HTTPException(status_code=410, detail="OTP has expired")

    if record["otp"] != otp:
        raise HTTPException(status_code=400, detail="Invalid OTP code")

    user = db.query(User).filter(User.email == email).one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_verified = True
    record["used"] = True
    db.commit()

    token = create_access_token(sub=str(user.id), role=user.role.value, name=user.full_name)
    return AuthResponse(userID=user.id, token=token)

@router.post("/resend-verification")
def resend_verification(payload: ResendVerificationRequest, db: Session = Depends(get_db)):
    email = payload.email.lower().strip()
    user = db.query(User).filter(User.email == email).one_or_none()
    if not user or user.is_verified:
        return {"message": "If unverified, an email was sent"}
        
    otp = _gen_otp()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
    _otp_store[email] = {"otp": otp, "expires_at": expires_at, "used": False}
    _send_otp_email(email, otp)
    return {"message": "Verification email resent"}


# ──────────────────────────────────────────────────────────────────
# Password Reset Logic
# ──────────────────────────────────────────────────────────────────

def _send_password_reset_email(to_email: str, otp: str):
    smtp_user = settings.smtp_email
    smtp_pass = settings.smtp_password
    if not smtp_user or not smtp_pass:
        print(f"[DEV] Missing SMTP config. Reset OTP for {to_email} is {otp}")
        return True

    try:
        msg = EmailMessage()
        msg["Subject"] = "Reset your password - Career Connect AI"
        msg["From"] = f"Career Connect AI <{smtp_user}>"
        msg["To"] = to_email
        msg.set_content(f"Hello,\n\nYour Career Connect AI password reset code is: {otp}\n\nThis code will expire in 10 minutes.\n\nThank you!")
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{ font-family: sans-serif; background-color: #fafbfc; padding: 50px 20px; }}
                .container {{ max-width: 480px; margin: 0 auto; background-color: #ffffff; padding: 45px 40px; border-radius: 16px; border: 1px solid #e1e4e8; }}
                .highlight {{ color: #00e5ff; }}
                .otp-button {{ background-color: #00e5ff; font-size: 28px; padding: 16px 32px; border-radius: 12px; letter-spacing: 8px; font-weight: bold; display: inline-block; }}
            </style>
        </head>
        <body>
            <div style="text-align:center; font-size: 26px; font-weight: bold; margin-bottom: 25px;">Career<span class="highlight">Connect</span> AI</div>
            <div class="container">
                <h1 style="margin-top: 0;">Reset your Password</h1>
                <p>We received a request to reset your password. Use the code below to securely reset it.</p>
                <div style="text-align:center; margin: 20px 0;"><div class="otp-button">{otp}</div></div>
                <p style="font-size: 13px; color: #6e7781;">This code expires in 10 minutes. If you did not request this, you can safely ignore this email.</p>
            </div>
        </body>
        </html>
        """
        msg.add_alternative(html_content, subtype='html')

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(smtp_user, smtp_pass)
            server.send_message(msg)
        return True
    except Exception as e:
        print(f"[ERROR] Failed to send email to {to_email}: {e}")
        return False

@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    email = payload.email.lower().strip()
    user = db.query(User).filter(User.email == email).one_or_none()
    if not user:
        return {"message": "If that email is registered, we have sent a reset code."}
        
    otp = _gen_otp()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
    
    from ..models import PasswordResetOTP
    record = PasswordResetOTP(
        user_id=user.id,
        otp_hash=hash_password(otp),
        expires_at=expires_at,
        used=False
    )
    db.add(record)
    db.commit()
    
    _send_password_reset_email(user.email, otp)
    return {"message": "If that email is registered, we have sent a reset code."}

@router.post("/reset-password")
def reset_password(payload: ResetPasswordOTPRequest, db: Session = Depends(get_db)):
    email = payload.email.lower().strip()
    user = db.query(User).filter(User.email == email).one_or_none()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid request")
        
    from ..models import PasswordResetOTP
    # Get latest active
    record = (
        db.query(PasswordResetOTP)
        .filter(PasswordResetOTP.user_id == user.id, PasswordResetOTP.used == False)
        .order_by(PasswordResetOTP.created_at.desc())
        .first()
    )
    
    if not record:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
        
    if datetime.now(timezone.utc) > record.expires_at:
        raise HTTPException(status_code=410, detail="OTP has expired")
        
    if not verify_password(payload.otp, record.otp_hash):
        raise HTTPException(status_code=400, detail="Invalid OTP code")
        
    # Valid OTP -> Wipe password
    user.password_hash = hash_password(payload.new_password)
    record.used = True
    db.commit()
    
    return {"message": "Password reset successfully!"}


# ──────────────────────────────────────────────────────────────────
# POST /login
# ──────────────────────────────────────────────────────────────────
@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower()).one_or_none()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user.is_verified:
        raise HTTPException(status_code=403, detail="Please verify your email to log in.")

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

    success = _send_otp_email(email, otp)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to dispatch verification email. Please check SMTP App Password.")

    return {"message": "If that account exists, an OTP has been sent."}


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
