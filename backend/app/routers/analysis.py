"""
analysis.py — Multimodal analysis endpoints
  POST /api/v1/analysis/emotion-frame   → stores one DeepFace result per video frame
  GET  /api/v1/analysis/emotion-timeline/{session_id} → full timeline for eval screen
"""
from __future__ import annotations

import json
import re
import base64
import io
import logging
import os
import time
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

try:
    from ultralytics import YOLO
    _yolo_model = YOLO("yolov8n.pt")  # Auto-downloads weights and loads to memory
except ImportError:
    _yolo_model = None

from ..db import get_db
from ..deps import get_current_user
from ..models import EmotionLog, SpeechFeatures, InterviewSession, User, AntiCheatEvent

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/analysis", tags=["analysis"])

# ─────────────────────────────────────────────────────────────────────────────
# Filler word set  (from Vocalyst index.py)
# ─────────────────────────────────────────────────────────────────────────────
FILLER_WORDS: set[str] = {
    "um", "uh", "like", "you know", "well", "so", "actually", "basically",
    "i mean", "right", "okay", "er", "hmm", "literally", "anyway",
    "of course", "i guess", "in other words", "obviously", "to be honest",
    "just", "seriously", "you see", "i suppose", "frankly", "kind of",
    "sort of", "the thing is", "for sure", "yeah", "umm", "ummm", "uhh",
    "uhhh", "hmmm", "mm", "mmm", "mhm", "ah", "ahh", "oh", "ohh",
    "uh huh", "mm hmm",
}


# ─────────────────────────────────────────────────────────────────────────────
# Lazy DeepFace loader  (avoids importing TF at startup)
# ─────────────────────────────────────────────────────────────────────────────
_deepface_available: bool | None = None


def _try_deepface(image_arr):  # type: ignore[return]
    """
    Attempt DeepFace emotion analysis.
    Returns dict with keys: dominant_emotion, emotions (normalised 0-1).
    Falls back gracefully if DeepFace is not installed.
    """
    global _deepface_available
    if _deepface_available is False:
        return None

    try:
        os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
        from deepface import DeepFace  # type: ignore

        _deepface_available = True

        for backend in ("ssd", "opencv"):
            try:
                result = DeepFace.analyze(
                    image_arr,
                    actions=["emotion"],
                    detector_backend=backend,
                    enforce_detection=False,
                )
                break
            except Exception:
                result = None

        if not result:
            return None

        face = result[0] if isinstance(result, list) else result
        emotions: dict[str, float] = face.get("emotion", {})
        total = sum(emotions.values()) or 1
        normalised = {k: round(v / total, 3) for k, v in emotions.items()}
        dominant = max(normalised, key=normalised.get)  # type: ignore[arg-type]
        return {"dominant_emotion": dominant, "emotions": normalised}

    except ImportError:
        _deepface_available = False
        logger.warning("DeepFace not installed — emotion frames will be skipped")
        return None
    except Exception as exc:
        logger.warning(f"DeepFace analysis failed: {exc}")
        return None


# ─────────────────────────────────────────────────────────────────────────────
# Speech analysis helpers  (adapted from Vocalyst analyse_filler_words)
# ─────────────────────────────────────────────────────────────────────────────

def _ngrams(words: list[str], n: int) -> list[str]:
    return [" ".join(words[i : i + n]) for i in range(len(words) - n + 1)]


def analyse_transcript(transcript: str, duration_seconds: int = 0) -> dict[str, Any]:
    """
    Returns wpm, filler_count, filler_percentage, communication_score (0-100).
    """
    words = re.findall(r"\b\w+\b", transcript.lower())
    total_words = len(words)

    filler_count = 0
    for w in words:
        if w in FILLER_WORDS:
            filler_count += 1
    for bigram in _ngrams(words, 2):
        if bigram in FILLER_WORDS:
            filler_count += 1

    filler_pct = round((filler_count / total_words * 100) if total_words else 0, 2)

    # WPM — use session duration if available; fall back to 130 wpm assumption
    if duration_seconds and duration_seconds > 10:
        wpm = round(total_words / (duration_seconds / 60), 1)
    else:
        wpm = 130.0  # neutral assumption

    # Communication score formula (simplified from PRD)
    # 30% filler inverse, 40% ideal WPM (target 120-160), 30% base
    wpm_score = 100 - min(100, abs(wpm - 140) * 1.5)  # 140 is sweet spot
    filler_score = max(0, 100 - (filler_pct * 5))       # -5 pts per 1% filler
    comm_score = round((0.40 * wpm_score) + (0.30 * filler_score) + 30, 2)
    comm_score = max(0.0, min(100.0, comm_score))

    return {
        "word_count": total_words,
        "filler_count": filler_count,
        "filler_percentage": filler_pct,
        "wpm": wpm,
        "communication_score": comm_score,
    }


def compute_emotion_score_from_logs(logs: list[EmotionLog]) -> float:
    """
    Emotional stability score (0-100) from Vocalyst analyze_emotional_journey logic.
    High stability (low variance in emotions) → high score.
    """
    if not logs:
        return 50.0

    emotion_sums: dict[str, list[float]] = {}
    prev_dominant = None
    mood_shifts = 0

    for log in logs:
        try:
            em: dict[str, float] = json.loads(log.emotions_json)
        except Exception:
            em = {}
        for emotion, score in em.items():
            emotion_sums.setdefault(emotion, []).append(score)

        curr = log.dominant_emotion
        if prev_dominant and curr != prev_dominant:
            mood_shifts += 1
        prev_dominant = curr

    # Variance across emotions → stability
    variances = []
    for scores in emotion_sums.values():
        mean = sum(scores) / len(scores)
        variance = sum((x - mean) ** 2 for x in scores) / len(scores)
        variances.append(variance)

    avg_variance = sum(variances) / len(variances) if variances else 0
    stability = max(0.0, 1.0 - (avg_variance * 10))

    # Mood consistency bonus
    mood_consistency = max(0.0, 1.0 - (mood_shifts / len(logs))) if len(logs) > 1 else 1.0

    raw = (stability * 0.7 + mood_consistency * 0.3) * 100
    return round(min(100.0, max(0.0, raw)), 2)


# ─────────────────────────────────────────────────────────────────────────────
# Schemas
# ─────────────────────────────────────────────────────────────────────────────

class EmotionFrameRequest(BaseModel):
    session_id: str
    frame_b64: str = ""          # JPEG base64 — optional when precomputed_emotions provided
    timestamp_sec: int = 0
    precomputed_emotions: dict[str, float] | None = None  # from face-api.js browser detection


class EmotionFrameResponse(BaseModel):
    stored: bool
    dominant_emotion: str
    emotions: dict[str, float]
    cheat_warning: str | None = None


# In-memory debounce: {session_id: {event_type: last_timestamp}}
# Prevents DB spam for repeated face-event warnings
import time as _time
_face_event_debounce: dict[str, dict[str, float]] = {}


class EmotionTimelineItem(BaseModel):
    timestamp_sec: int
    dominant_emotion: str
    emotions: dict[str, float]


class AntiCheatEventRequest(BaseModel):
    session_id: str
    event_type: str      # e.g. "tab_switch", "multiple_persons", "face_absent"
    severity: str = "WARNING"  # WARNING | CRITICAL | LOW
    timestamp_sec: int = 0
    details: dict | None = None


# ─────────────────────────────────────────────────────────────────────────────
# Endpoints
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/emotion-frame", response_model=EmotionFrameResponse)
def submit_emotion_frame(
    payload: EmotionFrameRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Receives a single JPEG frame (base64), runs DeepFace, stores result.
    Called every ~2 seconds from the browser during an active interview.
    """
    # Validate session belongs to this user
    session = (
        db.query(InterviewSession)
        .filter(InterviewSession.session_id == payload.session_id)
        .one_or_none()
    )
    if not session or session.user_id != user.id:
        raise HTTPException(status_code=403, detail="Session not found or not yours")

    dominant = "neutral"
    emotions: dict[str, float] = {"neutral": 1.0}
    stored = False

    # ── Priority 1: Use pre-computed browser-side face-api.js scores ─────────
    if payload.precomputed_emotions:
        emotions = payload.precomputed_emotions
        # Normalise so values sum to 1.0
        total = sum(emotions.values()) or 1.0
        emotions = {k: round(v / total, 4) for k, v in emotions.items()}
        dominant = max(emotions, key=emotions.get)  # type: ignore[arg-type]
        logger.debug(f"Using precomputed emotions: dominant={dominant}")

    # ── Priority 2: Fallback — try DeepFace on the raw JPEG frame ────────────
    elif payload.frame_b64:
        try:
            import numpy as np
            from PIL import Image  # type: ignore

            raw = base64.b64decode(payload.frame_b64)
            img = Image.open(io.BytesIO(raw)).convert("RGB")
            arr = np.array(img)

            result = _try_deepface(arr)
            if result:
                dominant = result["dominant_emotion"]
                emotions = result["emotions"]
        except Exception as exc:
            logger.warning(f"Frame decode/analysis error: {exc}")

    # ── Priority 3: Anti-Cheat YOLOv8 Detections ──────────────────────────────
    cheat_warning = None
    if _yolo_model and payload.frame_b64:
        try:
            from PIL import Image as PILImage
            raw = base64.b64decode(payload.frame_b64)
            img = PILImage.open(io.BytesIO(raw)).convert("RGB")
            results = _yolo_model(img, verbose=False)

            if len(results) > 0:
                boxes = results[0].boxes
                classes = boxes.cls.cpu().numpy()
                person_count = int((classes == 0).sum())   # COCO class 0 = person
                cell_phone_count = int((classes == 67).sum())  # COCO class 67 = cell phone

                if cell_phone_count > 0:
                    cheat_warning = "⚠️ Mobile phone detected! Please put it away."
                    ace = AntiCheatEvent(
                        session_id=payload.session_id,
                        candidate_id=session.user_id,
                        event_type="mobile_phone",
                        severity="CRITICAL",
                        timestamp_sec=payload.timestamp_sec,
                        details_json=json.dumps({"source": "yolo", "count": cell_phone_count}),
                    )
                    db.add(ace)
                    logger.info("[AntiCheat] Phone detected by YOLO – session %s", payload.session_id)

                elif person_count > 1:
                    cheat_warning = f"🚨 Multiple people detected ({person_count})! Only the candidate should be visible."
                    ace = AntiCheatEvent(
                        session_id=payload.session_id,
                        candidate_id=session.user_id,
                        event_type="multiple_persons",
                        severity="CRITICAL",
                        timestamp_sec=payload.timestamp_sec,
                        details_json=json.dumps({"source": "yolo", "person_count": person_count}),
                    )
                    db.add(ace)

        except Exception as exc:
            logger.warning("YOLO detection error: %s", exc)

    # ── Build face-absent / multi-person events from browser face-api count ─────
    FACE_EVENT_COOLDOWN = 30  # seconds between DB writes per event type
    faces_detected: int | None = getattr(payload, "faces_detected", None)
    if faces_detected is not None:
        sess_debounce = _face_event_debounce.setdefault(payload.session_id, {})
        now_ts = _time.time()

        if faces_detected == 0:
            last = sess_debounce.get("face_absent", 0)
            if now_ts - last > FACE_EVENT_COOLDOWN:
                sess_debounce["face_absent"] = now_ts
                db.add(AntiCheatEvent(
                    session_id=payload.session_id,
                    candidate_id=session.user_id,
                    event_type="face_absent",
                    severity="WARNING",
                    timestamp_sec=payload.timestamp_sec,
                    details_json=json.dumps({"source": "face_api"}),
                ))
        elif faces_detected >= 2 and not cheat_warning:
            last = sess_debounce.get("multiple_persons", 0)
            if now_ts - last > FACE_EVENT_COOLDOWN:
                sess_debounce["multiple_persons"] = now_ts
                # Only add if YOLO didn't already catch it above
                cheat_warning = f"🚨 Multiple people detected ({faces_detected} faces)!"
                db.add(AntiCheatEvent(
                    session_id=payload.session_id,
                    candidate_id=session.user_id,
                    event_type="multiple_persons",
                    severity="CRITICAL",
                    timestamp_sec=payload.timestamp_sec,
                    details_json=json.dumps({"source": "face_api", "faces": faces_detected}),
                ))

    # Always persist emotion log
    log = EmotionLog(
        session_id=payload.session_id,
        timestamp_sec=payload.timestamp_sec,
        dominant_emotion=dominant,
        emotions_json=json.dumps(emotions),
    )
    db.add(log)
    db.commit()
    stored = True


    return EmotionFrameResponse(
        stored=stored, 
        dominant_emotion=dominant, 
        emotions=emotions,
        cheat_warning=cheat_warning
    )


@router.get("/emotion-timeline/{session_id}", response_model=list[EmotionTimelineItem])
def get_emotion_timeline(
    session_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Returns all emotion log entries for a session, ordered by timestamp."""
    session = (
        db.query(InterviewSession)
        .filter(InterviewSession.session_id == session_id)
        .one_or_none()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.user_id != user.id and str(user.role) not in ("admin", "hr", "moderator", "analyst"):
        raise HTTPException(status_code=403, detail="Not allowed")

    logs = (
        db.query(EmotionLog)
        .filter(EmotionLog.session_id == session_id)
        .order_by(EmotionLog.timestamp_sec)
        .all()
    )

    return [
        EmotionTimelineItem(
            timestamp_sec=log.timestamp_sec,
            dominant_emotion=log.dominant_emotion,
            emotions=json.loads(log.emotions_json or "{}"),
        )
        for log in logs
    ]


@router.post("/anticheat-event", status_code=201)
def submit_anticheat_event(
    payload: AntiCheatEventRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Receives discrete anti-cheat events from the browser (tab switch, etc.)
    and persists them to AntiCheatEvent table so HR can view them.
    """
    session = (
        db.query(InterviewSession)
        .filter(InterviewSession.session_id == payload.session_id)
        .one_or_none()
    )
    if not session or session.user_id != user.id:
        raise HTTPException(status_code=403, detail="Session not found or not yours")

    ace = AntiCheatEvent(
        session_id=payload.session_id,
        candidate_id=session.user_id,
        event_type=payload.event_type,
        severity=payload.severity,
        timestamp_sec=payload.timestamp_sec,
        details_json=json.dumps(payload.details or {}),
    )
    db.add(ace)
    db.commit()
    return {"ok": True, "event_type": payload.event_type}
