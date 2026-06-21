from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from .core.config import settings


class Base(DeclarativeBase):
    pass


connect_args = {}
if settings.database_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

# For PostgreSQL (Neon): pool_pre_ping tests connections before use,
# discarding any that were silently closed by Neon's idle timeout.
# pool_recycle forces connection renewal every 5 min (Neon idles out ~5 min).
is_postgres = not settings.database_url.startswith("sqlite")

engine = create_engine(
    settings.database_url,
    future=True,
    echo=False,
    connect_args=connect_args,
    pool_pre_ping=is_postgres,        # ← KEY FIX: detects & drops dead connections
    pool_recycle=300 if is_postgres else -1,  # recycle every 5 min
    pool_size=5 if is_postgres else 5,
    max_overflow=10 if is_postgres else 10,
)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False, future=True)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

