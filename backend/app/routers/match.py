from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..db import get_db
from ..deps import get_current_user
from ..models import JobDescription, RecommendationStatus, Resume, SkillRecommendation, User, UserRole
from ..schemas import MatchRequest, MatchResponse
from ..doc2vec_service import ensure_model, infer_embedding_csv, parse_embedding_csv
from ..gemini_service import gemini_semantic_reasoning_score
from ..ai_service import ai_skill_recommendations
from ..gemini_service import gemini_semantic_reasoning_score
from ..ai_service import ai_skill_recommendations
from ..utils import extract_tokens, levenshtein_distance
from datetime import datetime
import json


def _cosine_similarity(a: list[float], b: list[float]) -> float:
    if not a or not b or len(a) != len(b):
        return 0.0
    import numpy as np

    va = np.array(a, dtype=np.float32)
    vb = np.array(b, dtype=np.float32)
    denom = float(np.linalg.norm(va) * np.linalg.norm(vb))
    if denom == 0.0:
        return 0.0
    return float(np.dot(va, vb) / denom)


def _recommendations(missing: list[str], jd_title: str, base_status: str | None = None, rec_ids: dict[str, int] | None = None) -> list[dict]:
    recs = []
    for i, skill in enumerate(missing[:8]):
        rec_id = rec_ids.get(skill) if rec_ids else None
        recs.append(
            {
                "recID": rec_id,
                "skill": skill,
                "impact": "high" if i < 3 else "medium",
                "resourceType": "video/course/article",
                "suggestedSearch": f"{skill} for {jd_title} interview preparation",
                "topicDescription": f"Learn {skill} in the context of {jd_title}.",
                "courseNames": [
                    f"{skill.title()} Fundamentals",
                    f"Practical {skill.title()} for Interview",
                ],
                "estimatedTime": "2-5 hours" if i < 3 else "1-2 hours",
                "status": base_status,
            }
        )
    return recs


def _is_fuzzy_match(skill: str, text: str) -> bool:
    if skill in text:
        return True
    
    skill_tokens = skill.split()
    text_tokens = text.split()
    n = len(skill_tokens)
    if n == 0 or len(text_tokens) < n:
        return False
        
    for i in range(len(text_tokens) - n + 1):
        window = " ".join(text_tokens[i:i+n])
        if levenshtein_distance(skill, window) <= 2:
            return True
    return False


router = APIRouter(prefix="/api/v1", tags=["match"])


@router.post("/match", response_model=MatchResponse)
def match(payload: MatchRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    resume = db.query(Resume).filter(Resume.id == payload.resumeID).one_or_none()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    if resume.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not allowed")

    jd = db.query(JobDescription).filter(JobDescription.id == payload.jobID).one_or_none()
    if not jd:
        raise HTTPException(status_code=404, detail="Job description not found")

    # --- Doc2Vec cosine similarity (PRD) ---
    model = ensure_model(db)

    if not resume.embedding_csv:
        resume.embedding_csv = infer_embedding_csv(model, resume.raw_text or "")
        db.add(resume)
        db.commit()

    if not jd.embedding_csv:
        jd.embedding_csv = infer_embedding_csv(model, (jd.description or "") + " " + (jd.skills_csv or ""))
        db.add(jd)
        db.commit()

    v_resume = parse_embedding_csv(resume.embedding_csv)
    v_jd = parse_embedding_csv(jd.embedding_csv)

    cos_raw = _cosine_similarity(v_resume, v_jd)  # [-1, 1]
    cosine = max(0.0, min(1.0, (cos_raw + 1.0) / 2.0))  # normalize -> [0, 1]

    gemini = 0.0  # v1: Gemini integration comes later
    hybrid = (cosine * 100.0 + gemini) / 2.0

    required_skills = [s.strip().lower() for s in (jd.skills_csv or "").split(",") if s.strip()]
    resume_text_lower = (resume.raw_text or "").lower()

    matched = [s for s in required_skills if _is_fuzzy_match(s, resume_text_lower)]
    missing = [s for s in required_skills if s not in matched]

    resume_tokens = extract_tokens(resume.raw_text)
    extra = sorted((resume_tokens - set(required_skills)) & set(list(resume_tokens)[:500]))[:15]

    # Prioritize recommendations by how strongly each missing skill appears in the JD text.
    jd_text_lower = ((jd.description or "") + " " + (jd.skills_csv or "")).lower()
    missing = sorted(missing, key=lambda s: jd_text_lower.count(s), reverse=True)

    # Percentile/rank against all active JDs
    try:
        all_jds = db.query(JobDescription).all()
        scores = []
        for j in all_jds:
            if not j.embedding_csv:
                j.embedding_csv = infer_embedding_csv(model, (j.description or "") + " " + (j.skills_csv or ""))
                db.add(j)
                db.commit()
            s = _cosine_similarity(v_resume, parse_embedding_csv(j.embedding_csv))
            scores.append(s)
        scores.sort()
        rank = sum(1 for s in scores if s <= cos_raw)
        percentile = round((rank / max(1, len(scores))) * 100.0, 2)
    except Exception:
        percentile = None

    jd_text = (jd.description or "") + " " + (jd.skills_csv or "")
    gemini = gemini_semantic_reasoning_score(resume.raw_text or "", jd_text)
    hybrid = round((cosine * 100.0) * 0.6 + gemini * 0.4, 2)
    tier = "green" if hybrid >= 70 else "amber" if hybrid >= 40 else "red"

    # Persist & return skill-gap recommendations (FR-5.4 tracking)
    rec_ids: dict[str, int] = {}
    rec_status: dict[str, str] = {}
    rec_rows: list[SkillRecommendation] = []
    for skill in missing[:8]:
        rec = (
            db.query(SkillRecommendation)
            .filter(
                SkillRecommendation.user_id == user.id,
                SkillRecommendation.job_id == jd.id,
                SkillRecommendation.resume_id == resume.id,
                SkillRecommendation.skill == skill,
            )
            .one_or_none()
        )
        if not rec:
            rec = SkillRecommendation(
                user_id=user.id,
                job_id=jd.id,
                resume_id=resume.id,
                skill=skill,
                status=RecommendationStatus.not_started,
            )
            db.add(rec)
            db.commit()
            db.refresh(rec)
        rec_rows.append(rec)
        rec_ids[skill] = rec.id
        rec_status[skill] = rec.status.value

    # Build static recommendation base objects
    details_recs = []
    for r in rec_rows:
        base = _recommendations([r.skill], jd.title, base_status=r.status.value, rec_ids={r.skill: r.id})[0]
        base["recID"] = r.id
        details_recs.append(base)

    # Enrich with AI-generated descriptions (FR-5.2) — merges on top of static base
    try:
        ai_recs = ai_skill_recommendations(
            missing_skills=[r["skill"] for r in details_recs],
            job_title=jd.title,
        )
        # Build a lookup keyed by skill name (lowercase) for safe merge
        ai_lookup = {item.get("skill", "").lower(): item for item in ai_recs if isinstance(item, dict)}
        for rec in details_recs:
            ai_data = ai_lookup.get(rec["skill"].lower(), {})
            if ai_data:
                rec["topicDescription"] = ai_data.get("topicDescription", rec.get("topicDescription", ""))
                rec["courseNames"] = ai_data.get("courseNames", rec.get("courseNames", []))
                rec["estimatedTime"] = ai_data.get("estimatedTime", rec.get("estimatedTime", "1-2 hours"))
                rec["resourceType"] = ai_data.get("resourceType", rec.get("resourceType", "video/course/article"))
    except Exception:
        pass  # AI enrichment is non-critical; static base is always returned

    return MatchResponse(
        cosineScore=round(cosine, 4),
        geminiScore=gemini,
        hybridScore=hybrid,
        skillOverlap={"matched": matched, "missing": missing, "extra": extra},
        details={
            "cosineRaw": round(cos_raw, 4),
            "percentile": percentile,
            "tier": tier,
            "recommendations": details_recs,
            "parsedProfile": json.loads(resume.parsed_json) if getattr(resume, "parsed_json", None) else {},
        },
    )


@router.get("/hr/matches")
def hr_matches(jobID: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if user.role not in (UserRole.hr, UserRole.admin):
        raise HTTPException(status_code=403, detail="Only HR users can view recruiter matches")

    jd = db.query(JobDescription).filter(JobDescription.id == jobID).one_or_none()
    if not jd:
        raise HTTPException(status_code=404, detail="Job description not found")
    model = ensure_model(db)

    required_skills = [s.strip().lower() for s in (jd.skills_csv or "").split(",") if s.strip()]
    jd_text = (jd.description or "") + " " + (jd.skills_csv or "")
    if not jd.embedding_csv:
        jd.embedding_csv = infer_embedding_csv(model, jd_text)
        db.add(jd)
        db.commit()
        db.refresh(jd)
    v_jd = parse_embedding_csv(jd.embedding_csv)

    out = []
    resumes = db.query(Resume).order_by(Resume.created_at.desc()).all()
    for r in resumes:
        if not r.embedding_csv:
            r.embedding_csv = infer_embedding_csv(model, r.raw_text or "")
            db.add(r)
            db.commit()
            db.refresh(r)

        v_resume = parse_embedding_csv(r.embedding_csv)
        cos_raw = _cosine_similarity(v_resume, v_jd)
        cosine = max(0.0, min(1.0, (cos_raw + 1.0) / 2.0))

        gemini = gemini_semantic_reasoning_score(r.raw_text or "", jd_text)
        hybrid = round((cosine * 100.0) * 0.6 + gemini * 0.4, 2)
        tier = "green" if hybrid >= 70 else "amber" if hybrid >= 40 else "red"

        resume_text_lower = (r.raw_text or "").lower()
        matched = [s for s in required_skills if _is_fuzzy_match(s, resume_text_lower)]
        missing = [s for s in required_skills if s not in matched]

        jd_text_lower = jd_text.lower()
        missing = sorted(missing, key=lambda s: jd_text_lower.count(s), reverse=True)

        out.append(
            {
                "candidateUserID": r.user_id,
                "candidateName": r.user.full_name if r.user else None,
                "resumeID": r.id,
                "cosineScore": round(cosine, 4),
                "geminiScore": gemini,
                "hybridScore": hybrid,
                "tier": tier,
                "matchedSkills": matched,
                "missingSkills": missing,
            }
        )

    out.sort(key=lambda x: x["hybridScore"], reverse=True)
    return out
