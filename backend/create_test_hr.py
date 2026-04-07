
import sys
from pathlib import Path

# Add backend directory to path
sys.path.append(str(Path(__file__).parent))

from app.db import SessionLocal
from app.models import User, UserRole
from app.security import hash_password

def create_hr():
    db = SessionLocal()
    try:
        email = "hr_test@careerconnect.ai"
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            print(f"User {email} already exists.")
            return

        user = User(
            email=email,
            full_name="HR Test User",
            company_name="Test Corp",
            role=UserRole.hr,
            password_hash=hash_password("Password123!"),
            is_verified=True
        )
        db.add(user)
        db.commit()
        print(f"Test HR User created successfully!")
        print(f"Email: {email}")
        print(f"Password: Password123!")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_hr()
