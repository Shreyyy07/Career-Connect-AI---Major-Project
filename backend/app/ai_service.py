"""
ai_service.py
─────────────
Unified AI service for Career Connect AI.
Primary: GitHub AI inference (OpenAI-compatible, GPT-4.1)
Fallback: TF-IDF cosine similarity (always offline-safe)

Usage:
    from app.ai_service import ai_semantic_score, ai_generate_question, ai_evaluate_answer
"""

from __future__ import annotations

from .core.config import settings
from .utils import tfidf_cosine_score


# ───────────────────────────────────────────────
# Internal helpers
# ───────────────────────────────────────────────

def _get_client():
    """Return an OpenAI client pointed at the GitHub AI inference endpoint."""
    from openai import OpenAI  # lazy import so the module loads even without openai
    return OpenAI(
        base_url=settings.github_ai_endpoint,
        api_key=settings.github_token,
    )


def _chat(system: str, user: str, temperature: float = 0.3, max_tokens: int = 256) -> str:
    """
    Send a single chat message and return the response text.
    Raises on any API error — callers are responsible for catching.
    """
    client = _get_client()
    resp = client.chat.completions.create(
        model=settings.github_ai_model,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        temperature=temperature,
        max_tokens=max_tokens,
    )
    return resp.choices[0].message.content or ""


# ───────────────────────────────────────────────
# Public API
# ───────────────────────────────────────────────

def ai_semantic_score(resume_text: str, jd_text: str) -> float:
    """
    Return a 0-100 score of how well the resume matches the JD semantically.
    Uses GitHub AI (GPT-4.1) with TF-IDF cosine as the offline fallback.
    """
    fallback = round(tfidf_cosine_score(resume_text or "", jd_text or "") * 100.0, 2)

    if not settings.github_token:
        return fallback

    system_prompt = (
        "You are a senior technical recruiter. "
        "Rate how well the candidate's resume matches the job description. "
        "Reply with ONLY a JSON object in the form {\"score\": <integer 0-100>}. "
        "Do not include any other text."
    )
    user_prompt = (
        f"Resume (first 4000 chars):\n{resume_text[:4000]}\n\n"
        f"Job Description (first 4000 chars):\n{jd_text[:4000]}"
    )

    try:
        text = _chat(system_prompt, user_prompt, temperature=0.1, max_tokens=32)
        import re, json
        m = re.search(r"\{.*\}", text, flags=re.DOTALL)
        if m:
            obj = json.loads(m.group(0))
            score = float(obj.get("score", fallback))
            return round(max(0.0, min(100.0, score)), 2)
    except Exception:
        pass

    return fallback


def ai_generate_question(
    job_title: str,
    jd_text: str,
    experience_years: int,
    previous_questions: list[str] | None = None,
    candidate_notes: str = "",
    resume_text: str = "",
) -> str:
    """
    Generate the next interview question using the JD + resume as RAG context.
    Falls back to a generic prompt template when the GitHub token is missing.
    """
    if not settings.github_token:
        return _fallback_question(job_title, experience_years, previous_questions)

    prev = "\n".join(f"- {q}" for q in (previous_questions or [])[-5:])
    system_prompt = (
        "You are conducting a professional job interview. "
        "Generate ONE concise, relevant interview question tailored to the candidate's resume and job description. "
        "Do NOT repeat any of the previous questions listed. "
        "Do NOT include any preamble — output ONLY the question text."
    )
    user_prompt = (
        f"Role: {job_title}\n"
        f"Candidate experience: {experience_years} years\n"
        f"Candidate notes: {candidate_notes or 'N/A'}\n\n"
        f"Job Description (key excerpt):\n{jd_text[:2000]}\n\n"
        + (f"Candidate Resume (key excerpt):\n{resume_text[:2000]}\n\n" if resume_text else "")
        + (f"Previous questions (do NOT repeat):\n{prev}\n" if prev else "")
    )

    try:
        return _chat(system_prompt, user_prompt, temperature=0.7, max_tokens=120).strip()
    except Exception:
        return _fallback_question(job_title, experience_years, previous_questions)


def ai_evaluate_answer(question: str, answer: str, jd_text: str) -> float:
    """
    Evaluate the quality and relevance of a candidate's answer (0-100).
    Falls back to 50.0 when the GitHub token is missing.
    """
    if not settings.github_token:
        return 50.0

    system_prompt = (
        "You are evaluating a candidate's interview answer. "
        "Score the answer from 0 to 100 based on correctness, relevance to the job, "
        "and communication clarity. "
        "Reply ONLY with JSON: {\"score\": <integer 0-100>}."
    )
    user_prompt = (
        f"Job context (excerpt):\n{jd_text[:2000]}\n\n"
        f"Interview question:\n{question}\n\n"
        f"Candidate answer:\n{answer[:2000]}"
    )

    try:
        import re, json
        text = _chat(system_prompt, user_prompt, temperature=0.1, max_tokens=32)
        m = re.search(r"\{.*\}", text, flags=re.DOTALL)
        if m:
            obj = json.loads(m.group(0))
            score = float(obj.get("score", 50))
            return round(max(0.0, min(100.0, score)), 2)
    except Exception:
        pass

    return 50.0


def ai_skill_recommendations(missing_skills: list[str], job_title: str) -> list[dict]:
    """
    Generate rich recommendations for each missing skill using the AI.
    Falls back to a simple template dict when the token is missing.
    """
    if not settings.github_token or not missing_skills:
        return []

    skills_str = ", ".join(missing_skills[:8])
    system_prompt = (
        "You are a career coach. For each missing skill listed, generate a JSON array of recommendation objects. "
        "Each object must have: skill (str), topicDescription (str ≤ 60 chars), "
        "courseNames (list of 2 strings), estimatedTime (str), resourceType (str). "
        "Reply ONLY with a valid JSON array — no other text."
    )
    user_prompt = (
        f"Role: {job_title}\n"
        f"Missing skills: {skills_str}\n\n"
        "Generate one recommendation object per skill."
    )

    try:
        import json
        text = _chat(system_prompt, user_prompt, temperature=0.4, max_tokens=600)
        # Strip markdown fences if present
        text = text.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
        recs = json.loads(text)
        if isinstance(recs, list):
            return recs
    except Exception:
        pass

    return []


def ai_find_resource_url(skill: str, job_title: str, resource_type: str = "") -> str:
    """
    Ask GPT-4.1 for the single best, publicly accessible learning URL for this skill.
    Returns a direct URL string.  Falls back to a Google search if the AI is unavailable
    or returns something that isn't a valid URL.
    """
    import re

    fallback = f"https://www.google.com/search?q={skill.replace(' ', '+')}+tutorial+for+{job_title.replace(' ', '+')}"

    if not settings.github_token:
        return fallback

    system_prompt = (
        "You are a career coach who recommends the single BEST publicly accessible learning resource. "
        "Reply ONLY with a valid HTTPS URL — no explanation, no markdown, just the URL. "
        "Prefer: official docs, MDN, freeCodeCamp, dev.to, GeeksForGeeks, Real Python, YouTube, Coursera, or similar reputable sites."
    )
    user_prompt = (
        f"Skill to learn: {skill}\n"
        f"Target job role: {job_title}\n"
        f"Preferred resource type: {resource_type or 'any'}\n\n"
        "Give me the single best URL to start learning this skill right now."
    )

    try:
        url = _chat(system_prompt, user_prompt, temperature=0.2, max_tokens=60).strip()
        # Basic URL sanity check
        if re.match(r"https?://", url) and len(url) < 400:
            return url
    except Exception:
        pass

    return fallback


def ai_extract_resume_details(raw_text: str) -> dict:
    """
    Extract structured candidate details (Name, Email, Phone, Skills, Experience, Education)
    from raw resume text using GitHub AI.
    Returns a dictionary matching the schema or an empty dict on failure/fallback.
    """
    if not settings.github_token or not raw_text:
        return {}

    system_prompt = (
        "You are an expert HR Resume Parser. Extract structured information from the provided resume text. "
        "Reply ONLY with a JSON object matching this schema exactly: "
        "{\"name\": \"\", \"email\": \"\", \"phone\": \"\", \"skills\": [\"\"], \"experience\": [{\"role\": \"\", \"company\": \"\", \"duration\": \"\"}], \"education\": [{\"degree\": \"\", \"institution\": \"\", \"year\": \"\"}]} "
        "If a field is missing, leave it as an empty string or empty array. Provide NO other text."
    )
    user_prompt = f"Resume Text:\n{raw_text[:6000]}"

    try:
        import json
        text = _chat(system_prompt, user_prompt, temperature=0.1, max_tokens=1000)
        # Clean potential markdown fences
        text = text.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
        parsed = json.loads(text)
        if isinstance(parsed, dict):
            return parsed
    except Exception:
        pass

    return {}


def ai_generate_insights(transcript_lines: list[dict], semantic_score: float, similarity_score: float, emotion_score: float, audio_score: float) -> dict:
    """
    Generate actionable insights (Top Strength and To Improve) based on interview scores and transcript.
    Returns: {"topStrength": "...", "toImprove": "..."}
    """
    if not settings.github_token:
        # Fallback to static rules
        return {
            "topStrength": "Your answers were highly relevant contextually to the role expectations." if semantic_score > emotion_score else "You maintained strong communication and engagement throughout.",
            "toImprove": "Focus on tailoring your answers using specific vocabulary from the Job Description." if similarity_score < 70 else "Work on controlling pacing and reducing filler words for better clarity."
        }

    system_prompt = (
        "You are an expert Interview Coach. Review the candidate's scores and interview QA. "
        "Reply ONLY with a JSON object matching this schema exactly: "
        "{\"topStrength\": \"One concise sentence describing what they did best\", \"toImprove\": \"One concise sentence describing an actionable area of improvement\"} "
        "Keep the responses encouraging and highly actionable. Provide NO other text."
    )
    
    # summarize transcript to save tokens
    text_summary = "\n".join([f"Q: {qa.get('q','')}\nA: {qa.get('a','')}" for qa in transcript_lines])[:4000]
    
    user_prompt = (
        f"Scores:\nSemantic (Relevance): {semantic_score}%\nJD Similarity: {similarity_score}%\n"
        f"Emotion (Engagement): {emotion_score}%\nAudio (Clarity): {audio_score}%\n\n"
        f"Transcript:\n{text_summary}"
    )

    try:
        import json
        text = _chat(system_prompt, user_prompt, temperature=0.4, max_tokens=200)
        text = text.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
        parsed = json.loads(text)
        if isinstance(parsed, dict) and "topStrength" in parsed and "toImprove" in parsed:
            return parsed
    except Exception:
        pass

    # fallback
    return {
        "topStrength": "Your answers were highly relevant contextually to the role expectations." if semantic_score > emotion_score else "You maintained strong communication and engagement throughout.",
        "toImprove": "Focus on tailoring your answers using specific vocabulary from the Job Description." if similarity_score < 70 else "Work on controlling pacing and reducing filler words for better clarity."
    }

# ───────────────────────────────────────────────
# Internal fallback helpers
# ───────────────────────────────────────────────

_FALLBACK_QUESTIONS = [
    "Tell me about yourself and the kind of role you're targeting.",
    "Describe a challenging technical problem you solved recently.",
    "How do you prioritise tasks when working under tight deadlines?",
    "Explain a concept from your field to someone with no technical background.",
    "What would you improve if you had extra time on your last project?",
]


def _fallback_question(
    job_title: str,
    experience_years: int,
    previous_questions: list[str] | None,
) -> str:
    prev = set(previous_questions or [])
    for q in _FALLBACK_QUESTIONS:
        if q not in prev:
            return q
    return _FALLBACK_QUESTIONS[0]
