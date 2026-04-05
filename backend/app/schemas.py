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


class JDCreateResponse(BaseModel):
    jobID: int


class JDListItem(BaseModel):
    jobID: int
    title: str
    status: str


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
