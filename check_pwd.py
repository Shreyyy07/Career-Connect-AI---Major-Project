import sqlite3
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
conn = sqlite3.connect('backend/career_connect_ai.db')
cursor = conn.cursor()
cursor.execute("SELECT password_hash, is_verified FROM users WHERE email='hr_test@careerconnect.ai'")
row = cursor.fetchone()

if not row:
    print('User missing')
else:
    print(f'Verified: {row[1]}')
    print(f'Pwd Match: {pwd_context.verify("Password123!", row[0])}')
