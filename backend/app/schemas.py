from enum import Enum
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class UserRole(str, Enum):
    admin = "admin"
    hr = "hr"
    candidate = "candidate"
    analyst = "analyst"
    moderator = "moderator"


class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=200)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    role: UserRole
    company_name: Optional[str] = Field(default="", max_length=200)  # required for HR role


class AuthResponse(BaseModel):
    userID: int
    token: str


class VerifyEmailRequest(BaseModel):
    email: EmailStr
    otp: str = Field(min_length=6, max_length=6)


class ResendVerificationRequest(BaseModel):
    email: EmailStr


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordOTPRequest(BaseModel):
    email: EmailStr
    otp: str = Field(min_length=6, max_length=6)
    new_password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class LoginResponse(BaseModel):
    token: str
    refreshToken: Optional[str] = None


class JDUploadRequest(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    description: str = Field(default="", max_length=20000)
    skills: list[str] = Field(default_factory=list)


# ── Full JD Create / Edit (HR Portal) ─────────────────────────────────────────
class JDCreateRequest(BaseModel):
    title: str = Field(min_length=3, max_length=100)
    company_name: Optional[str] = Field(default="", max_length=100)
    description: str = Field(min_length=100, max_length=5000)
    skills: list[str] = Field(default_factory=list, min_length=0)
    experience_level: Optional[str] = Field(default="", max_length=50)  # Fresher/Junior/Mid/Senior/Lead
    location: Optional[str] = Field(default="", max_length=200)
    status: Optional[str] = Field(default="draft", max_length=20)  # draft | active


class JDStatusUpdateRequest(BaseModel):
    status: str = Field(min_length=1, max_length=20)  # draft | active | closed


class JDDetailItem(BaseModel):
    jobID: int
    title: str
    company_name: str
    description: str
    skills: list[str]
    experience_level: str
    location: str
    status: str
    created_at: str
    updated_at: str


class JDCreateResponse(BaseModel):
    jobID: int


class JDListItem(BaseModel):
    jobID: int
    title: str
    company_name: str
    experience_level: str
    location: str
    status: str
    skills: list[str]
    created_at: str


class ResumeUploadResponse(BaseModel):
    resumeID: int
    parsedData: dict


class MatchRequest(BaseModel):
    resumeID: int
    jobID: int


class MatchResponse(BaseModel):
    cosineScore: float
    geminiScore: float
    hybridScore: float
    skillOverlap: dict
    details: dict


class InterviewStartRequest(BaseModel):
    jobID: Optional[int] = None
    experience: int = Field(ge=0, le=60)
    description: Optional[str] = Field(default=None, max_length=4000)


class InterviewStartResponse(BaseModel):
    sessionID: str
    firstQuestion: str


class InterviewAnswerRequest(BaseModel):
    sessionID: str
    transcript: str = Field(min_length=1, max_length=8000)


class InterviewAnswerResponse(BaseModel):
    nextQuestion: str


class InterviewEndRequest(BaseModel):
    sessionID: str


class InterviewEndResponse(BaseModel):
    evalID: int
    estimatedReady: int


class EvaluationResponse(BaseModel):
    evalID: int
    sessionID: str
    semanticScore: float
    similarityScore: float
    emotionScore: float
    audioScore: float
    finalScore: float
    reportURL: Optional[str] = None
    # Speech analysis fields (from SpeechFeatures table)
    wpm: Optional[float] = None
    fillerCount: Optional[int] = None
    fillerPercentage: Optional[float] = None
    wordCount: Optional[int] = None
    dominantEmotion: Optional[str] = None
    insightsJson: Optional[str] = None


class ProfileResponse(BaseModel):
    id: int
    email: EmailStr
    name: str
    role: str


class ProfileUpdateRequest(BaseModel):
    name: str = Field(min_length=2, max_length=200)


class RecommendationStatusUpdateRequest(BaseModel):
    status: str = Field(min_length=1, max_length=32)


class RecommendationItem(BaseModel):
    recID: int
    skill: str
    impact: str
    resourceType: str
    suggestedSearch: str
    estimatedTime: str
    status: str


class RecommendationHistoryItem(BaseModel):
    fromStatus: str
    toStatus: str
    created_at: str


class AssessmentItem(BaseModel):
    id: int
    title: str
    status: str
    score: Optional[float] = None
    created_at: str


class CreateAssessmentResponse(BaseModel):
    id: int


class AgentQueryRequest(BaseModel):
    message: str = Field(min_length=1, max_length=1000)
    current_page: str = Field(default="/", max_length=200)
    user_role: str = Field(default="candidate", max_length=50)


class AgentAction(BaseModel):
    type: str  # "navigate" | "open_section" | "none"
    target: Optional[str] = None  # route path for navigate

class AgentQueryResponse(BaseModel):
    intent: str  # "navigate" | "fetch_data" | "answer_faq" | "unknown"
    action: Optional[AgentAction] = None
    response_text: str


# ── HR Candidate List / Detail ─────────────────────────────────────────────────

class HRCandidateListItem(BaseModel):
    """One row in the HR candidate evaluations table."""
    evalID: int
    sessionID: str
    candidateName: str          # first name only in list view
    candidateEmail: str         # masked e.g. a***@gmail.com
    jobTitle: str
    jobID: int
    finalScore: float
    semanticScore: float
    similarityScore: float
    emotionScore: float
    audioScore: float
    aiRecommendation: str       # SHORTLIST | CONSIDER | REJECT (AI-generated)
    hrStatus: str               # pending | shortlisted | rejected
    isFlagged: bool             # anti-cheat flagged session
    interviewDate: str
    wpm: Optional[float] = None
    fillerCount: Optional[int] = None


class HRCandidateDetail(BaseModel):
    """Full evaluation detail shown in the HR slide-over panel."""
    evalID: int
    sessionID: str
    candidateName: str          # full name in detail panel
    candidateEmail: str         # partially masked
    jobTitle: str
    jobID: int
    interviewDate: str
    sessionDuration: Optional[int] = None  # seconds
    # Scores
    semanticScore: float
    similarityScore: float
    emotionScore: float
    audioScore: float
    finalScore: float
    aiRecommendation: str
    hrStatus: str
    hrNotes: str
    # Speech
    wpm: Optional[float] = None
    fillerCount: Optional[int] = None
    fillerPercentage: Optional[float] = None
    wordCount: Optional[int] = None
    # Emotion
    dominantEmotion: Optional[str] = None
    emotionTimeline: Optional[list[dict]] = None  # [{t: sec, emotion: str}, ...]
    # Gemini insights
    insightsJson: Optional[str] = None
    # Report
    reportUrl: Optional[str] = None
    # Anti-cheat
    antiCheatSummary: Optional[dict] = None


class HRDecisionRequest(BaseModel):
    evalID: int
    hrStatus: str = Field(min_length=1, max_length=20)  # shortlisted | rejected | pending


class HRNotesRequest(BaseModel):
    note: str = Field(default="", max_length=500)


# ── HR Analytics ───────────────────────────────────────────────────────────────

class HRAnalyticsResponse(BaseModel):
    totalCandidates: int
    shortlisted: int
    rejected: int
    pending: int
    avgScore: float
    activeJobs: int
    totalJobs: int
    # Score distribution bands
    scoreBand90: int    # 90-100
    scoreBand70: int    # 70-89
    scoreBand50: int    # 50-69
    scoreBandLow: int   # 0-49
    # Recommendation distribution
    aiShortlist: int
    aiConsider: int
    aiReject: int
    # Anti-cheat
    totalWarnings: int
    totalCriticals: int
    flaggedSessions: int
    # Per-JD performance [{jobID, title, avgScore, candidateCount}]
    jdPerformance: list[dict]
    # Top missing skills [{skill, count}]
    topSkillsGap: list[dict]
    # Macro emotional distribution [{emotion, percentage, raw_count}]
    emotionHeatmap: list[dict]


# ── Anti-Cheat ─────────────────────────────────────────────────────────────────

class AntiCheatEventOut(BaseModel):
    eventID: int
    sessionID: str
    candidateName: str
    candidateID: int
    timestampSec: int
    eventType: str
    severity: str
    detailsJson: str
    createdAt: str


class AntiCheatSessionSummary(BaseModel):
    sessionID: str
    candidateName: str
    warningCount: int
    criticalCount: int
    integrityScore: float
    isFlagged: bool
    events: list[AntiCheatEventOut]


class ProfileResponse(BaseModel):
    id: int
    email: EmailStr
    name: str
    role: str
    company_name: str
