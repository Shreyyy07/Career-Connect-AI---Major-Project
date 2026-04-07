from datetime import datetime, timedelta, timezone

from jose import jwt
from passlib.context import CryptContext

from .core.config import settings


# NOTE: bcrypt has compatibility issues on some Windows/Python builds.
# PBKDF2-SHA256 is widely supported and stable for local dev + v1.
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)


def create_access_token(*, sub: str, role: str, name: str = "", company_name: str = "") -> str:
    now = datetime.now(timezone.utc)
    exp = now + timedelta(minutes=settings.access_token_exp_minutes)
    payload = {"sub": sub, "role": role, "name": name, "company_name": company_name, "iat": int(now.timestamp()), "exp": exp}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> dict:
    return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])

