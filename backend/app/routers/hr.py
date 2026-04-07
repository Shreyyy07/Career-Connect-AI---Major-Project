"""
HR Recruiter Portal — dedicated API router.
All endpoints require JWT with role=hr (or admin).
Enforces cross-HR isolation: HR sees only candidates who interviewed for *their* JDs.
"""
from __future__ import annotations

from collections import Counter, defaultdict
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from pathlib import Path
from sqlalchemy.orm import Session

from ..db import get_db
from ..deps import get_current_user
from ..models import (
    AntiCheatEvent, AntiCheatSummary,
    Evaluation, InterviewSession, JobDescription,
    SpeechFeatures, EmotionLog, User, UserRole,
)
from ..schemas import (
    AntiCheatEventOut, AntiCheatSessionSummary,
    HRAnalyticsResponse,
    HRCandidateDetail, HRCandidateListItem,
    HRDecisionRequest, HRNotesRequest,
)

router = APIRouter(prefix="/api/v1/hr", tags=["hr"])

REPORTS_DIR = Path(__file__).resolve().parents[2] / "reports"


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _require_hr(user: User):
    if user.role not in (UserRole.hr, UserRole.admin):
        raise HTTPException(status_code=403, detail="HR access only")


def _mask_email(email: str) -> str:
    """Return a***@domain.com style masked email."""
    if "@" not in email:
        return email
    local, domain = email.split("@", 1)
    return f"{local[0]}***@{domain}"


def _ai_recommendation(score: float) -> str:
    if score >= 70:
        return "SHORTLIST"
    if score >= 45:
        return "CONSIDER"
    return "REJECT"


def _get_hr_jd_ids(db: Session, hr_user_id: int) -> list[int]:
    """Fetch all JD ids owned by this HR user."""
    return [
        row.id for row in
        db.query(JobDescription.id)
        .filter(JobDescription.hr_user_id == hr_user_id)
        .all()
    ]


def _get_anticheat_summary(db: Session, session_id: str) -> dict | None:
    acs = db.query(AntiCheatSummary).filter(AntiCheatSummary.session_id == session_id).one_or_none()
    if not acs:
        return None
    return {
        "warningCount": acs.warning_count,
        "criticalCount": acs.critical_count,
        "integrityScore": acs.integrity_score,
        "isFlagged": acs.is_flagged,
    }


def _build_list_item(
    ev: Evaluation, session: InterviewSession,
    candidate: User, jd: JobDescription,
    sf: SpeechFeatures | None, acs: AntiCheatSummary | None,
) -> HRCandidateListItem:
    first_name = (candidate.full_name or "").split()[0] if candidate.full_name else "Candidate"
    masked = _mask_email(candidate.email)
    date_str = (ev.created_at or session.completed_at or session.created_at)
    date_str = date_str.strftime("%d %b %Y") if date_str else "—"

    return HRCandidateListItem(
        evalID=ev.id,
        sessionID=session.session_id,
        candidateName=first_name,
        candidateEmail=masked,
        jobTitle=jd.title if jd else "Unknown",
        jobID=session.job_id or 0,
        finalScore=round(ev.final_score, 1),
        semanticScore=round(ev.semantic_score, 1),
        similarityScore=round(ev.similarity_score, 1),
        emotionScore=round(ev.emotion_score, 1),
        audioScore=round(ev.audio_score, 1),
        aiRecommendation=_ai_recommendation(ev.final_score),
        hrStatus=ev.hr_status or "pending",
        isFlagged=acs.is_flagged if acs else False,
        interviewDate=date_str,
        wpm=sf.wpm if sf else None,
        fillerCount=sf.filler_count if sf else None,
    )


# ─── GET /api/v1/hr/candidates ────────────────────────────────────────────────

@router.get("/candidates", response_model=list[HRCandidateListItem])
def list_hr_candidates(
    job_id: int | None = Query(default=None),
    hr_status: str | None = Query(default=None),
    flagged_only: bool = Query(default=False),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    All candidate evaluations for this HR's JDs.
    Optional filters: job_id, hr_status, flagged_only.
    Default sort: final_score desc.
    """
    _require_hr(user)
    jd_ids = _get_hr_jd_ids(db, user.id)
    if not jd_ids:
        return []

    # Filter JD ids if job_id param given
    if job_id is not None:
        if job_id not in jd_ids:
            raise HTTPException(status_code=403, detail="That JD does not belong to you")
        jd_ids = [job_id]

    # Fetch sessions for these JDs with completed evaluations
    sessions = (
        db.query(InterviewSession)
        .filter(
            InterviewSession.job_id.in_(jd_ids),
            InterviewSession.status == "completed",
        )
        .all()
    )

    results: list[HRCandidateListItem] = []
    for session in sessions:
        ev = (
            db.query(Evaluation)
            .filter(Evaluation.interview_session_id == session.id)
            .order_by(Evaluation.created_at.desc())
            .first()
        )
        if not ev:
            continue

        # HR status filter
        if hr_status and (ev.hr_status or "pending") != hr_status:
            continue

        candidate = db.query(User).filter(User.id == session.user_id).one_or_none()
        if not candidate:
            continue

        jd = db.query(JobDescription).filter(JobDescription.id == session.job_id).one_or_none()
        sf = (
            db.query(SpeechFeatures)
            .filter(SpeechFeatures.session_id == session.session_id)
            .one_or_none()
        )
        acs = (
            db.query(AntiCheatSummary)
            .filter(AntiCheatSummary.session_id == session.session_id)
            .one_or_none()
        )

        if flagged_only and (not acs or not acs.is_flagged):
            continue

        results.append(_build_list_item(ev, session, candidate, jd, sf, acs))

    # Sort by final score descending
    results.sort(key=lambda x: x.finalScore, reverse=True)
    return results


# ─── GET /api/v1/hr/candidates/{eval_id} ──────────────────────────────────────

@router.get("/candidates/{eval_id}", response_model=HRCandidateDetail)
def get_hr_candidate_detail(
    eval_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Full candidate evaluation detail for the HR slide-over panel."""
    _require_hr(user)

    ev = db.query(Evaluation).filter(Evaluation.id == eval_id).one_or_none()
    if not ev:
        raise HTTPException(status_code=404, detail="Evaluation not found")

    session = db.query(InterviewSession).filter(InterviewSession.id == ev.interview_session_id).one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Ownership check: job must belong to this HR
    jd = db.query(JobDescription).filter(JobDescription.id == session.job_id).one_or_none()
    if not jd or (jd.hr_user_id != user.id and user.role != UserRole.admin):
        raise HTTPException(status_code=403, detail="Not authorised to view this evaluation")

    candidate = db.query(User).filter(User.id == session.user_id).one_or_none()
    full_name = candidate.full_name if candidate else "Candidate"
    masked_email = _mask_email(candidate.email) if candidate else "—"

    sf = db.query(SpeechFeatures).filter(SpeechFeatures.session_id == session.session_id).one_or_none()

    # Emotion timeline
    emotion_logs = (
        db.query(EmotionLog)
        .filter(EmotionLog.session_id == session.session_id)
        .order_by(EmotionLog.timestamp_sec)
        .all()
    )
    emotion_timeline = [
        {"t": log.timestamp_sec, "emotion": log.dominant_emotion}
        for log in emotion_logs
    ]
    dominant_emotion = None
    if emotion_logs:
        counts = Counter(log.dominant_emotion for log in emotion_logs)
        dominant_emotion = counts.most_common(1)[0][0]

    # Session duration
    duration = None
    if session.completed_at and session.created_at:
        duration = int((session.completed_at - session.created_at).total_seconds())

    date_str = (ev.created_at or session.completed_at or session.created_at)
    date_str = date_str.strftime("%d %b %Y, %H:%M") if date_str else "—"

    # Anti-cheat
    acs_dict = _get_anticheat_summary(db, session.session_id)

    return HRCandidateDetail(
        evalID=ev.id,
        sessionID=session.session_id,
        candidateName=full_name,
        candidateEmail=masked_email,
        jobTitle=jd.title,
        jobID=jd.id,
        interviewDate=date_str,
        sessionDuration=duration,
        semanticScore=round(ev.semantic_score, 1),
        similarityScore=round(ev.similarity_score, 1),
        emotionScore=round(ev.emotion_score, 1),
        audioScore=round(ev.audio_score, 1),
        finalScore=round(ev.final_score, 1),
        aiRecommendation=_ai_recommendation(ev.final_score),
        hrStatus=ev.hr_status or "pending",
        hrNotes=ev.hr_notes or "",
        wpm=sf.wpm if sf else None,
        fillerCount=sf.filler_count if sf else None,
        fillerPercentage=sf.filler_percentage if sf else None,
        wordCount=sf.word_count if sf else None,
        dominantEmotion=dominant_emotion,
        emotionTimeline=emotion_timeline,
        insightsJson=ev.insights_json,
        reportUrl=ev.report_url or None,
        antiCheatSummary=acs_dict,
    )


# ─── PATCH /api/v1/hr/candidate-status ────────────────────────────────────────

@router.patch("/candidate-status")
def set_candidate_status(
    payload: HRDecisionRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Set HR decision: shortlisted | rejected | pending."""
    _require_hr(user)

    valid = {"shortlisted", "rejected", "pending"}
    if payload.hrStatus not in valid:
        raise HTTPException(status_code=422, detail=f"hrStatus must be one of {valid}")

    ev = db.query(Evaluation).filter(Evaluation.id == payload.evalID).one_or_none()
    if not ev:
        raise HTTPException(status_code=404, detail="Evaluation not found")

    session = db.query(InterviewSession).filter(InterviewSession.id == ev.interview_session_id).one_or_none()
    jd = db.query(JobDescription).filter(JobDescription.id == (session.job_id if session else None)).one_or_none()
    if not jd or (jd.hr_user_id != user.id and user.role != UserRole.admin):
        raise HTTPException(status_code=403, detail="Not authorised")

    ev.hr_status = payload.hrStatus
    db.add(ev)
    db.commit()
    return {"ok": True, "evalID": ev.id, "hrStatus": ev.hr_status}


# ─── PATCH /api/v1/hr/candidate-notes/{eval_id} ───────────────────────────────

@router.patch("/candidate-notes/{eval_id}")
def set_candidate_notes(
    eval_id: int,
    payload: HRNotesRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Add or update a private HR note on a candidate evaluation."""
    _require_hr(user)

    ev = db.query(Evaluation).filter(Evaluation.id == eval_id).one_or_none()
    if not ev:
        raise HTTPException(status_code=404, detail="Evaluation not found")

    session = db.query(InterviewSession).filter(InterviewSession.id == ev.interview_session_id).one_or_none()
    jd = db.query(JobDescription).filter(JobDescription.id == (session.job_id if session else None)).one_or_none()
    if not jd or (jd.hr_user_id != user.id and user.role != UserRole.admin):
        raise HTTPException(status_code=403, detail="Not authorised")

    ev.hr_notes = payload.note[:500]
    db.add(ev)
    db.commit()
    return {"ok": True, "evalID": ev.id}


# ─── GET /api/v1/hr/analytics ─────────────────────────────────────────────────

@router.get("/analytics", response_model=HRAnalyticsResponse)
def get_hr_analytics(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Aggregated HR analytics across all JDs and evaluations."""
    _require_hr(user)

    jd_ids = _get_hr_jd_ids(db, user.id)
    all_jds = db.query(JobDescription).filter(JobDescription.hr_user_id == user.id).all()

    active_jobs = sum(1 for j in all_jds if str(j.status.value).lower() == "active")

    if not jd_ids:
        return HRAnalyticsResponse(
            totalCandidates=0, shortlisted=0, rejected=0, pending=0,
            avgScore=0.0, activeJobs=active_jobs, totalJobs=len(all_jds),
            scoreBand90=0, scoreBand70=0, scoreBand50=0, scoreBandLow=0,
            aiShortlist=0, aiConsider=0, aiReject=0,
            totalWarnings=0, totalCriticals=0, flaggedSessions=0,
            jdPerformance=[], topSkillsGap=[],
        )

    # Evaluations for HR's JDs
    sessions = (
        db.query(InterviewSession)
        .filter(InterviewSession.job_id.in_(jd_ids), InterviewSession.status == "completed")
        .all()
    )
    session_ids = [s.session_id for s in sessions]
    session_map = {s.id: s for s in sessions}

    evals = []
    for s in sessions:
        ev = (
            db.query(Evaluation)
            .filter(Evaluation.interview_session_id == s.id)
            .order_by(Evaluation.created_at.desc())
            .first()
        )
        if ev:
            evals.append((ev, s))

    total = len(evals)
    shortlisted = sum(1 for ev, _ in evals if (ev.hr_status or "pending") == "shortlisted")
    rejected = sum(1 for ev, _ in evals if (ev.hr_status or "pending") == "rejected")
    pending = total - shortlisted - rejected
    avg_score = round(sum(ev.final_score for ev, _ in evals) / total, 1) if total else 0.0

    # Score bands
    b90 = sum(1 for ev, _ in evals if ev.final_score >= 90)
    b70 = sum(1 for ev, _ in evals if 70 <= ev.final_score < 90)
    b50 = sum(1 for ev, _ in evals if 50 <= ev.final_score < 70)
    blow = sum(1 for ev, _ in evals if ev.final_score < 50)

    # AI recommendation breakdown
    ai_sl = sum(1 for ev, _ in evals if _ai_recommendation(ev.final_score) == "SHORTLIST")
    ai_co = sum(1 for ev, _ in evals if _ai_recommendation(ev.final_score) == "CONSIDER")
    ai_rj = sum(1 for ev, _ in evals if _ai_recommendation(ev.final_score) == "REJECT")

    # Anti-cheat
    all_acs = (
        db.query(AntiCheatSummary)
        .filter(AntiCheatSummary.session_id.in_(session_ids))
        .all()
    )
    total_warnings = sum(a.warning_count for a in all_acs)
    total_criticals = sum(a.critical_count for a in all_acs)
    flagged = sum(1 for a in all_acs if a.is_flagged)

    # Per-JD performance
    jd_map = {j.id: j for j in all_jds}
    jd_scores: dict[int, list[float]] = defaultdict(list)
    for ev, sess in evals:
        if sess.job_id:
            jd_scores[sess.job_id].append(ev.final_score)

    jd_performance = []
    for jd_id, scores in jd_scores.items():
        jd = jd_map.get(jd_id)
        if jd:
            jd_performance.append({
                "jobID": jd_id,
                "title": jd.title,
                "avgScore": round(sum(scores) / len(scores), 1),
                "candidateCount": len(scores),
            })
    jd_performance.sort(key=lambda x: x["avgScore"], reverse=True)

    # Top skills gap (aggregate missing skills across all JDs)
    skill_gap_counter: Counter = Counter()
    for jd in all_jds:
        if jd.skills_csv:
            for skill in jd.skills_csv.split(","):
                skill = skill.strip().lower()
                if skill:
                    skill_gap_counter[skill] += 1
    top_skills_gap = [{"skill": k, "count": v} for k, v in skill_gap_counter.most_common(10)]

    return HRAnalyticsResponse(
        totalCandidates=total,
        shortlisted=shortlisted,
        rejected=rejected,
        pending=pending,
        avgScore=avg_score,
        activeJobs=active_jobs,
        totalJobs=len(all_jds),
        scoreBand90=b90,
        scoreBand70=b70,
        scoreBand50=b50,
        scoreBandLow=blow,
        aiShortlist=ai_sl,
        aiConsider=ai_co,
        aiReject=ai_rj,
        totalWarnings=total_warnings,
        totalCriticals=total_criticals,
        flaggedSessions=flagged,
        jdPerformance=jd_performance,
        topSkillsGap=top_skills_gap,
    )


# ─── GET /api/v1/hr/anticheat ─────────────────────────────────────────────────

@router.get("/anticheat", response_model=list[AntiCheatEventOut])
def list_anticheat_events(
    severity: str | None = Query(default=None),
    event_type: str | None = Query(default=None),
    candidate_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """All anti-cheat events for this HR's candidates. Filterable."""
    _require_hr(user)

    jd_ids = _get_hr_jd_ids(db, user.id)
    if not jd_ids:
        return []

    sessions = (
        db.query(InterviewSession)
        .filter(InterviewSession.job_id.in_(jd_ids))
        .all()
    )
    session_ids = [s.session_id for s in sessions]
    candidate_ids_for_sessions = {s.session_id: s.user_id for s in sessions}

    query = db.query(AntiCheatEvent).filter(AntiCheatEvent.session_id.in_(session_ids))
    if severity:
        query = query.filter(AntiCheatEvent.severity == severity.upper())
    if event_type:
        query = query.filter(AntiCheatEvent.event_type == event_type)
    if candidate_id:
        query = query.filter(AntiCheatEvent.candidate_id == candidate_id)

    events = query.order_by(AntiCheatEvent.created_at.desc()).all()

    result = []
    for ev in events:
        cand = db.query(User).filter(User.id == ev.candidate_id).one_or_none()
        result.append(AntiCheatEventOut(
            eventID=ev.id,
            sessionID=ev.session_id,
            candidateName=(cand.full_name or "").split()[0] if cand else "Unknown",
            candidateID=ev.candidate_id,
            timestampSec=ev.timestamp_sec,
            eventType=ev.event_type,
            severity=ev.severity,
            detailsJson=ev.details_json or "{}",
            createdAt=ev.created_at.strftime("%Y-%m-%dT%H:%M:%S") if ev.created_at else "",
        ))
    return result


# ─── GET /api/v1/hr/anticheat/{session_id} ────────────────────────────────────

@router.get("/anticheat/{session_id}", response_model=AntiCheatSessionSummary)
def get_anticheat_session(
    session_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Anti-cheat summary + events for one specific session."""
    _require_hr(user)

    # Verify ownership
    session = db.query(InterviewSession).filter(InterviewSession.session_id == session_id).one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    jd = db.query(JobDescription).filter(JobDescription.id == session.job_id).one_or_none()
    if not jd or (jd.hr_user_id != user.id and user.role != UserRole.admin):
        raise HTTPException(status_code=403, detail="Not authorised")

    acs = db.query(AntiCheatSummary).filter(AntiCheatSummary.session_id == session_id).one_or_none()
    events = (
        db.query(AntiCheatEvent)
        .filter(AntiCheatEvent.session_id == session_id)
        .order_by(AntiCheatEvent.timestamp_sec)
        .all()
    )

    candidate = db.query(User).filter(User.id == session.user_id).one_or_none()
    cand_name = (candidate.full_name or "").split()[0] if candidate else "Unknown"

    events_out = [
        AntiCheatEventOut(
            eventID=ev.id,
            sessionID=ev.session_id,
            candidateName=cand_name,
            candidateID=ev.candidate_id,
            timestampSec=ev.timestamp_sec,
            eventType=ev.event_type,
            severity=ev.severity,
            detailsJson=ev.details_json or "{}",
            createdAt=ev.created_at.strftime("%Y-%m-%dT%H:%M:%S") if ev.created_at else "",
        )
        for ev in events
    ]

    return AntiCheatSessionSummary(
        sessionID=session_id,
        candidateName=cand_name,
        warningCount=acs.warning_count if acs else 0,
        criticalCount=acs.critical_count if acs else 0,
        integrityScore=acs.integrity_score if acs else 100.0,
        isFlagged=acs.is_flagged if acs else False,
        events=events_out,
    )


# ─── GET /api/v1/hr/report/{eval_id}/download ─────────────────────────────────

@router.get("/report/{eval_id}/download")
def hr_download_report(
    eval_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Download the PDF report for a candidate (HR must own the JD)."""
    _require_hr(user)

    ev = db.query(Evaluation).filter(Evaluation.id == eval_id).one_or_none()
    if not ev:
        raise HTTPException(status_code=404, detail="Evaluation not found")

    session = db.query(InterviewSession).filter(InterviewSession.id == ev.interview_session_id).one_or_none()
    jd = db.query(JobDescription).filter(JobDescription.id == (session.job_id if session else None)).one_or_none()
    if not jd or (jd.hr_user_id != user.id and user.role != UserRole.admin):
        raise HTTPException(status_code=403, detail="Not authorised")

    pdf_path = REPORTS_DIR / f"{eval_id}.pdf"
    if not pdf_path.exists():
        raise HTTPException(status_code=404, detail="Report not yet generated")

    return FileResponse(
        path=str(pdf_path),
        media_type="application/pdf",
        filename=f"evaluation_{eval_id}.pdf",
    )
