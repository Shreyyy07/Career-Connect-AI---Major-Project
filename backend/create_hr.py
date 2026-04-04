import sys
from pathlib import Path

# Add backend to path
sys.path.append(str(Path(__file__).parent))

from app.db import SessionLocal
from app.models import User, UserRole
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

def run():
    db = SessionLocal()
    hr_email = "hr@careerconnect.ai"
    user = db.query(User).filter(User.email == hr_email).first()
    if user:
        user.role = UserRole.hr
        user.password_hash = pwd_context.hash("12345678")
    else:
        user = User(
            email=hr_email,
            full_name="HR Manager (Demo)",
            password_hash=pwd_context.hash("12345678"),
            role=UserRole.hr,
            is_verified=True
        )
        db.add(user)
    
    db.commit()
    print(f"HR user created/updated.")
    print(f"Email: {hr_email}")
    print(f"Password: 12345678")

if __name__ == "__main__":
    run()
