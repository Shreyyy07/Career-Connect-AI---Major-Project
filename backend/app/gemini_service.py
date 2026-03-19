"""
gemini_service.py  (compatibility shim)
────────────────────────────────────────
The match router imports `gemini_semantic_reasoning_score` from here.
We now delegate to the unified ai_service which uses GitHub AI (GPT-4.1)
with a TF-IDF cosine fallback — no code changes needed in the router.
"""

from .ai_service import ai_semantic_score


def gemini_semantic_reasoning_score(resume_text: str, jd_text: str) -> float:
    """
    Semantic match score [0, 100] between a resume and a JD.
    Delegates to ai_service (GitHub AI / TF-IDF fallback).
    """
    return ai_semantic_score(resume_text, jd_text)
