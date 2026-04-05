from datetime import datetime
from enum import Enum

from sqlalchemy import String, DateTime, Enum as SAEnum, Text, ForeignKey, Integer, Float, UniqueConstraint, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


class UserRole(str, Enum):
    admin = "admin"
    hr = "hr"
    candidate = "candidate"
    analyst = "analyst"
    moderator = "moderator"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(200), default="")
    role: Mapped[UserRole] = mapped_column(SAEnum(UserRole), index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    resumes: Mapped[list["Resume"]] = relationship(back_populates="user")
    job_descriptions: Mapped[list["JobDescription"]] = relationship(back_populates="hr_user")


class PasswordResetOTP(Base):
    __tablename__ = "password_reset_otps"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    otp_hash: Mapped[str] = mapped_column(String(255))
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    used: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)


class Resume(Base):
    __tablename__ = "resumes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    filename: Mapped[str] = mapped_column(String(500))
    content_type: Mapped[str] = mapped_column(String(100))
    raw_text: Mapped[str] = mapped_column(Text, default="")
    parsed_json: Mapped[str] = mapped_column(Text, default="{}")
    embedding_csv: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    user: Mapped["User"] = relationship(back_populates="resumes")


class JDStatus(str, Enum):
    draft = "Draft"
    active = "Active"
    closed = "Closed"


class JobDescription(Base):
    __tablename__ = "job_descriptions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    hr_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text, default="")
    skills_csv: Mapped[str] = mapped_column(Text, default="")  # comma-separated for v1
    embedding_csv: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[JDStatus] = mapped_column(SAEnum(JDStatus), default=JDStatus.draft, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    hr_user: Mapped["User"] = relationship(back_populates="job_descriptions")


class InterviewType(str, Enum):
    ai = "ai"
    hr = "hr"


class InterviewStatus(str, Enum):
    pending = "pending"
    in_progress = "in_progress"
    completed = "completed"


class InterviewSession(Base):
    __tablename__ = "interview_sessions"
    __table_args__ = (UniqueConstraint("session_id", name="uq_interview_session_id"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    session_id: Mapped[str] = mapped_column(String(64), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    job_id: Mapped[int | None] = mapped_column(ForeignKey("job_descriptions.id"), nullable=True)
    type: Mapped[InterviewType] = mapped_column(SAEnum(InterviewType), default=InterviewType.ai)
    status: Mapped[InterviewStatus] = mapped_column(SAEnum(InterviewStatus), default=InterviewStatus.pending)
    experience_years: Mapped[int] = mapped_column(Integer, default=0)
    candidate_notes: Mapped[str] = mapped_column(Text, default="")
    transcript: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class Evaluation(Base):
    __tablename__ = "evaluations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    interview_session_id: Mapped[int] = mapped_column(ForeignKey("interview_sessions.id"), index=True)
    semantic_score: Mapped[float] = mapped_column(Float, default=0.0)
    similarity_score: Mapped[float] = mapped_column(Float, default=0.0)
    emotion_score: Mapped[float] = mapped_column(Float, default=0.0)
    audio_score: Mapped[float] = mapped_column(Float, default=0.0)
    final_score: Mapped[float] = mapped_column(Float, default=0.0)
    report_url: Mapped[str] = mapped_column(String(500), default="")
    insights_json: Mapped[str] = mapped_column(Text, default="{}")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)


class AssessmentStatus(str, Enum):
    pending = "pending"
    completed = "completed"


class Assessment(Base):
    __tablename__ = "assessments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    title: Mapped[str] = mapped_column(String(200))
    status: Mapped[AssessmentStatus] = mapped_column(SAEnum(AssessmentStatus), default=AssessmentStatus.pending)
    score: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class RecommendationStatus(str, Enum):
    not_started = "not_started"
    in_progress = "in_progress"
    completed = "completed"


class SkillRecommendation(Base):
    __tablename__ = "skill_recommendations"
    __table_args__ = (UniqueConstraint("user_id", "job_id", "resume_id", "skill", name="uq_skill_recommendation"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    job_id: Mapped[int] = mapped_column(ForeignKey("job_descriptions.id"), index=True)
    resume_id: Mapped[int] = mapped_column(ForeignKey("resumes.id"), index=True)
    skill: Mapped[str] = mapped_column(String(120))
    status: Mapped[RecommendationStatus] = mapped_column(SAEnum(RecommendationStatus), default=RecommendationStatus.not_started, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)


class SkillRecommendationEvent(Base):
    __tablename__ = "skill_recommendation_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    recommendation_id: Mapped[int] = mapped_column(
        ForeignKey("skill_recommendations.id"),
        index=True,
    )
    from_status: Mapped[RecommendationStatus] = mapped_column(SAEnum(RecommendationStatus))
    to_status: Mapped[RecommendationStatus] = mapped_column(SAEnum(RecommendationStatus))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)


class EmotionLog(Base):
    """
    One row per video frame captured during an interview.
    emotions_json stores the full probability dict, e.g.
    {"happy": 0.12, "neutral": 0.74, "sad": 0.05, ...}
    """
    __tablename__ = "emotion_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    session_id: Mapped[str] = mapped_column(String(64), index=True)
    timestamp_sec: Mapped[int] = mapped_column(Integer, default=0)
    dominant_emotion: Mapped[str] = mapped_column(String(32), default="neutral")
    emotions_json: Mapped[str] = mapped_column(Text, default="{}")  # JSON string
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)


class SpeechFeatures(Base):
    """
    One row per completed interview session.
    Stores WPM, filler word count, and derived communication score.
    """
    __tablename__ = "speech_features"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    session_id: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    word_count: Mapped[int] = mapped_column(Integer, default=0)
    filler_count: Mapped[int] = mapped_column(Integer, default=0)
    filler_percentage: Mapped[float] = mapped_column(Float, default=0.0)
    wpm: Mapped[float] = mapped_column(Float, default=0.0)
    communication_score: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
