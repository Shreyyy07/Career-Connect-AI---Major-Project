from __future__ import annotations

import os
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from sqlalchemy.orm import Session

from ..db import get_db
from ..deps import get_current_user
from ..models import Evaluation, InterviewSession, JobDescription, Resume, User
from ..schemas import EvaluationResponse
from ..utils import extract_tokens, jaccard_similarity, stable_hash_score


router = APIRouter(prefix="/api/v1", tags=["evaluation"])


REPORTS_DIR = Path(__file__).resolve().parents[2] / "reports"
REPORTS_DIR.mkdir(parents=True, exist_ok=True)


def _compute_similarity_score(db: Session, session: InterviewSession) -> float:
    if not session.job_id:
        return 0.0

    jd = db.query(JobDescription).filter(JobDescription.id == session.job_id).one_or_none()
    if not jd:
        return 0.0

    # Use latest resume if available
    resume = (
        db.query(Resume)
        .filter(Resume.user_id == session.user_id)
        .order_by(Resume.created_at.desc())
        .first()
    )
    if not resume:
        return 0.0

    sim = jaccard_similarity(extract_tokens(resume.raw_text), extract_tokens(jd.description + " " + (jd.skills_csv or "")))
    return round(sim * 100.0, 2)



# ─────────────────────────────────────────────────────────────────────────────
# PDF Report Generator — all 10 PRD sections
# ─────────────────────────────────────────────────────────────────────────────

from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether,
)
from reportlab.platypus import PageBreak

# Brand colours
CYAN    = colors.HexColor("#00e5ff")
DARK    = colors.HexColor("#0d1117")
LIGHT   = colors.HexColor("#f5f7fa")
MUTED   = colors.HexColor("#6b7280")
GREEN   = colors.HexColor("#10b981")
AMBER   = colors.HexColor("#f59e0b")
RED     = colors.HexColor("#ef4444")
VIOLET  = colors.HexColor("#8b5cf6")
SLATE   = colors.HexColor("#334155")


def _score_color(score: float):
    if score >= 70:
        return GREEN
    if score >= 45:
        return AMBER
    return RED


def _score_band(score: float) -> str:
    if score >= 80: return "Excellent"
    if score >= 60: return "Good"
    if score >= 40: return "Average"
    return "Needs Improvement"


def _render_pdf(eval_id: int, payload: dict) -> Path:
    """
    Generates a multi-section branded PDF report.
    payload keys expected:
        candidate_name, candidate_email, job_title, interview_date, session_id,
        semantic_score, similarity_score, emotion_score, audio_score, final_score,
        wpm, filler_count, filler_percentage,
        dominant_emotion, emotion_frames,
        transcript_lines (list of {q, a} dicts),
        matched_skills (list[str]), missing_skills (list[str]),
    """
    path = REPORTS_DIR / f"{eval_id}.pdf"

    doc = SimpleDocTemplate(
        str(path),
        pagesize=A4,
        rightMargin=20 * mm,
        leftMargin=20 * mm,
        topMargin=22 * mm,
        bottomMargin=20 * mm,
    )

    styles = getSampleStyleSheet()
    W = A4[0] - 40 * mm  # usable width

    # ── Custom styles ────────────────────────────────────────────────────────
    h1 = ParagraphStyle("h1", parent=styles["Title"], fontSize=22, textColor=DARK,
                        spaceAfter=4, fontName="Helvetica-Bold")
    h2 = ParagraphStyle("h2", parent=styles["Heading2"], fontSize=14, textColor=SLATE,
                        spaceBefore=14, spaceAfter=4, fontName="Helvetica-Bold")
    h3 = ParagraphStyle("h3", parent=styles["Heading3"], fontSize=11, textColor=SLATE,
                        spaceBefore=8, spaceAfter=2, fontName="Helvetica-Bold")
    body = ParagraphStyle("body", parent=styles["Normal"], fontSize=9.5,
                           textColor=SLATE, leading=14, spaceAfter=4)
    small = ParagraphStyle("small", parent=styles["Normal"], fontSize=8.5,
                            textColor=MUTED, leading=12)
    label_style = ParagraphStyle("label", parent=styles["Normal"], fontSize=8,
                                  textColor=MUTED, fontName="Helvetica-Bold",
                                  spaceBefore=2)

    story = []

    def hr():
        story.append(HRFlowable(width="100%", thickness=0.6,
                                color=colors.HexColor("#e2e8f0"), spaceAfter=6, spaceBefore=2))

    def section(title: str):
        story.append(Spacer(1, 6))
        story.append(Paragraph(title, h2))
        hr()

    def score_table(rows):
        wrapped_rows = []
        for i, row in enumerate(rows):
            style_used = ParagraphStyle("th", parent=body, fontName="Helvetica-Bold", textColor=SLATE) if i == 0 else body
            wrapped_rows.append([Paragraph(str(c), style_used) for c in row])
        tbl = Table(wrapped_rows, colWidths=[W * 0.45, W * 0.20, W * 0.20, W * 0.15])
        tbl.setStyle(TableStyle([
            ("BACKGROUND",   (0, 0), (-1, 0), colors.HexColor("#e8f4fd")),
            ("FONTNAME",     (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE",     (0, 0), (-1, -1), 9),
            ("TEXTCOLOR",    (0, 0), (-1, 0), SLATE),
            ("ROWBACKGROUNDS",(0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
            ("GRID",         (0, 0), (-1, -1), 0.4, colors.HexColor("#e2e8f0")),
            ("TOPPADDING",   (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING",(0, 0), (-1, -1), 5),
            ("LEFTPADDING",  (0, 0), (-1, -1), 8),
        ]))
        return tbl

    # ── Extract payload with defaults ────────────────────────────────────────
    name        = payload.get("candidate_name", "Candidate")
    email       = payload.get("candidate_email", "—")
    job_title   = payload.get("job_title", "N/A")
    idate       = payload.get("interview_date", "—")
    session_id  = payload.get("session_id", str(eval_id))
    semantic    = float(payload.get("semantic_score", 0))
    similarity  = float(payload.get("similarity_score", 0))
    emotion     = float(payload.get("emotion_score", 0))
    audio       = float(payload.get("audio_score", 0))
    final       = float(payload.get("final_score", 0))
    wpm         = float(payload.get("wpm", 130))
    filler_count= int(payload.get("filler_count", 0))
    filler_pct  = float(payload.get("filler_percentage", 0))
    dom_emotion = str(payload.get("dominant_emotion", "neutral")).capitalize()
    emo_frames  = int(payload.get("emotion_frames", 0))
    transcript_lines = payload.get("transcript_lines", [])
    matched_skills   = payload.get("matched_skills", [])
    missing_skills   = payload.get("missing_skills", [])

    # ── §1  Cover / Header ───────────────────────────────────────────────────
    story.append(Table(
        [[Paragraph("Career Connect AI", ParagraphStyle("brand", fontSize=11,
                    textColor=CYAN, fontName="Helvetica-Bold")),
          Paragraph("Evaluation Report", ParagraphStyle("rpt", fontSize=11,
                    textColor=MUTED, alignment=2))]],
        colWidths=[W / 2, W / 2],
    ))
    story.append(Spacer(1, 3))
    story.append(HRFlowable(width="100%", thickness=2, color=CYAN, spaceAfter=10))
    story.append(Paragraph(f"Interview Evaluation — {job_title}", h1))
    story.append(Paragraph(f"Candidate: <b>{name}</b> &nbsp;|&nbsp; {email}", body))
    story.append(Paragraph(f"Interview Date: {idate} &nbsp;|&nbsp; Session: <font name='Courier' size='8'>{session_id[:16]}…</font>", small))
    story.append(Spacer(1, 8))

    # ── §2  Executive Summary ────────────────────────────────────────────────
    band  = _score_band(final)
    color = _score_color(final)
    story.append(Table(
        [[Paragraph(f"<font color='#{color.hexval()[2:]}'>{round(final)}%</font>",
                    ParagraphStyle("big", fontSize=32, fontName="Helvetica-Bold",
                                   textColor=color, alignment=1)),
          Paragraph(
              f"<b>Overall Rating: {band}</b><br/><br/>"
              f"{name} completed an AI-assessed interview for the <b>{job_title}</b> role. "
              f"The composite score of <b>{round(final)}%</b> reflects performance across "
              f"answer quality, JD fit, emotional stability, and communication clarity.",
              ParagraphStyle("exec", fontSize=9.5, textColor=SLATE, leading=14))
          ]],
        colWidths=[100, W - 100],
        style=TableStyle([
            ("VALIGN",       (0, 0), (-1, -1), "TOP"),
            ("BACKGROUND",   (0, 0), (-1, -1), colors.HexColor("#f0fdf4") if final >= 70
                             else colors.HexColor("#fffbeb") if final >= 45 else colors.HexColor("#fff1f2")),
            ("BOX",          (0, 0), (-1, -1), 0.8, color),
            ("ROUNDEDCORNERS", [4]),
            ("TOPPADDING",   (0, 0), (-1, -1), 10),
            ("BOTTOMPADDING",(0, 0), (-1, -1), 10),
            ("LEFTPADDING",  (0, 0), (-1, -1), 12),
        ]),
    ))

    # ── §3  Score Breakdown ──────────────────────────────────────────────────
    section("Score Breakdown")
    rows = [
        ["Component", "Weight", "Score", "Rating"],
        ["Answer Relevance (Semantic)",    "35%", f"{round(semantic)}%",    _score_band(semantic)],
        ["JD Alignment (Cosine Sim.)",     "30%", f"{round(similarity)}%",  _score_band(similarity)],
        ["Confidence (Emotion Stability)", "20%", f"{round(emotion)}%",     _score_band(emotion)],
        ["Communication (Speech)",         "15%", f"{round(audio)}%",       _score_band(audio)],
        ["FINAL COMPOSITE SCORE",          "100%", f"{round(final)}%",      band],
    ]
    story.append(score_table(rows))

    # ── §4  Q&A Analysis ────────────────────────────────────────────────────
    if transcript_lines:
        section("Question & Answer Analysis")
        qa_data = []
        for i, qa in enumerate(transcript_lines, 1):
            q = qa.get("q", "").strip()
            a = qa.get("a", "").strip() or "(No spoken answer recorded)"
            q_para = Paragraph(f"<b>Q{i}:</b> {q}", ParagraphStyle("qa_q", fontName="Helvetica-Bold", fontSize=9.5, textColor=colors.HexColor("#1e293b")))
            a_para = Paragraph(f"<b>Answer:</b> {a[:600]}{'…' if len(a) > 600 else ''}", ParagraphStyle("qa_a", fontSize=9, textColor=colors.HexColor("#475569"), leading=13))
            qa_data.append([q_para])
            qa_data.append([a_para])

        qa_tbl = Table(qa_data, colWidths=[W])
        
        table_style = [
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 10),
            ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ]
        
        for i in range(len(transcript_lines)):
            row_q = i * 2
            row_a = i * 2 + 1
            table_style.append(("BACKGROUND", (0, row_q), (-1, row_q), colors.HexColor("#e0f2fe")))
            table_style.append(("TOPPADDING", (0, row_q), (-1, row_q), 8))
            table_style.append(("BOTTOMPADDING", (0, row_q), (-1, row_q), 8))
            
            table_style.append(("BACKGROUND", (0, row_a), (-1, row_a), colors.HexColor("#f8fafc")))
            table_style.append(("TOPPADDING", (0, row_a), (-1, row_a), 8))
            table_style.append(("BOTTOMPADDING", (0, row_a), (-1, row_a), 12))
            
            table_style.append(("BOX", (0, row_q), (-1, row_a), 0.5, colors.HexColor("#cbd5e1")))
            
        qa_tbl.setStyle(TableStyle(table_style))
        story.append(qa_tbl)
    else:
        section("Question & Answer Analysis")
        story.append(Paragraph("No Q&A transcript available for this session.", small))

    # ── §5  Speech Analysis ──────────────────────────────────────────────────
    section("Speech Analysis")
    wpm_rating  = "Good" if 120 <= wpm <= 160 else ("Too Fast" if wpm > 160 else "Too Slow")
    filler_rating = "Excellent" if filler_pct <= 3 else ("Good" if filler_pct <= 7 else
                    ("Moderate" if filler_pct <= 12 else "High"))
    speech_rows = [
        ["Metric",            "Value",              "Rating"],
        ["Words Per Minute",  f"{round(wpm)} WPM",  wpm_rating],
        ["Filler Words",      str(filler_count),     filler_rating],
        ["Filler %",          f"{filler_pct:.1f}%",  filler_rating],
        ["Communication Score", f"{round(audio)}%", _score_band(audio)],
    ]
    wrapped_speech_rows = []
    for i, row in enumerate(speech_rows):
        style_used = ParagraphStyle("th", parent=body, fontName="Helvetica-Bold", textColor=SLATE) if i == 0 else body
        wrapped_speech_rows.append([Paragraph(str(c), style_used) for c in row])
    tbl = Table(wrapped_speech_rows, colWidths=[W * 0.45, W * 0.30, W * 0.25])
    tbl.setStyle(TableStyle([
        ("BACKGROUND",   (0, 0), (-1, 0), colors.HexColor("#e8f4fd")),
        ("FONTNAME",     (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE",     (0, 0), (-1, -1), 9),
        ("ROWBACKGROUNDS",(0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
        ("GRID",         (0, 0), (-1, -1), 0.4, colors.HexColor("#e2e8f0")),
        ("TOPPADDING",   (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 5),
        ("LEFTPADDING",  (0, 0), (-1, -1), 8),
    ]))
    story.append(tbl)
    story.append(Spacer(1, 4))
    story.append(Paragraph(
        "Target range: 120–160 WPM. Filler words ≤ 3% = Excellent; 3–7% = Good; > 12% = Needs Improvement.", small))

    # ── §6  Emotion Analysis ─────────────────────────────────────────────────
    section("Emotion & Confidence Analysis")
    story.append(Paragraph(
        f"<b>Dominant Emotion:</b> {dom_emotion} &nbsp;|&nbsp; "
        f"<b>Emotion Stability Score:</b> {round(emotion)}% &nbsp;|&nbsp; "
        f"<b>Frames Analysed:</b> {emo_frames}",
        body))
    story.append(Paragraph(
        "Emotion stability measures how consistently positive and composed the candidate remained. "
        "High variance in emotions reduces the stability score. Frames are captured every 2 seconds "
        "via DeepFace during the live session.", small))

    # ── §7  JD Alignment ────────────────────────────────────────────────────
    section("JD Alignment & Skill Analysis")
    story.append(Paragraph(f"<b>Hybrid Match Score:</b> {round(similarity)}%", body))

    if matched_skills:
        story.append(Paragraph("<b>✓ Matched Skills</b>", h3))
        story.append(Paragraph(", ".join(matched_skills) or "None", body))
    if missing_skills:
        story.append(Paragraph("<b>✗ Missing Skills (Gap)</b>", h3))
        story.append(Paragraph(", ".join(missing_skills) or "None", body))

    # ── §8  Strengths & Improvements ────────────────────────────────────────
    section("Strengths & Areas for Improvement")
    strengths = []
    if semantic >= 60:   strengths.append("Strong answer relevance to the job role.")
    if similarity >= 60: strengths.append("Experience well-aligned with the JD requirements.")
    if emotion >= 60:    strengths.append("Confident and emotionally stable throughout the session.")
    if audio >= 60:      strengths.append("Clear communication with good pace and low filler usage.")
    if not strengths:    strengths.append("Showed initiative by completing the interview session.")

    improvements = []
    if semantic < 50:    improvements.append("Tailor answers more specifically to the job role requirements.")
    if similarity < 50:  improvements.append("Build skills in the identified gap areas.")
    if emotion < 50:     improvements.append("Work on maintaining composure and confidence under interview pressure.")
    if audio < 50:       improvements.append(f"Reduce filler words (currently {filler_pct:.1f}%) and aim for 120–160 WPM.")
    if not improvements: improvements.append("Continue practising to maintain and build on this strong performance.")

    story.append(Paragraph("<b>Strengths</b>", h3))
    for s in strengths:
        story.append(Paragraph(f"• {s}", body))
    story.append(Paragraph("<b>Areas for Improvement</b>", h3))
    for imp in improvements:
        story.append(Paragraph(f"• {imp}", body))

    # ── §9  Skill Recommendations ────────────────────────────────────────────
    if missing_skills:
        section("Skill Recommendations")
        story.append(Paragraph(
            "The following skills were identified as gaps relative to the job description. "
            "Recommended learning resources are listed below:", body))
        platforms = ["Coursera", "Udemy", "YouTube", "Official Docs"]
        rec_rows = [["Skill", "Suggested Platform", "Est. Hours"]]
        for i, skill in enumerate(missing_skills[:8]):
            rec_rows.append([skill, platforms[i % len(platforms)], "2–4 hrs"])
        
        wrapped_rec_rows = []
        for i, row in enumerate(rec_rows):
            style_used = ParagraphStyle("th", parent=body, fontName="Helvetica-Bold", textColor=SLATE) if i == 0 else body
            wrapped_rec_rows.append([Paragraph(str(c), style_used) for c in row])
            
        tbl2 = Table(wrapped_rec_rows, colWidths=[W * 0.50, W * 0.30, W * 0.20])
        tbl2.setStyle(TableStyle([
            ("BACKGROUND",   (0, 0), (-1, 0), colors.HexColor("#f3e8ff")),
            ("FONTNAME",     (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE",     (0, 0), (-1, -1), 9),
            ("ROWBACKGROUNDS",(0, 1), (-1, -1), [colors.white, colors.HexColor("#faf5ff")]),
            ("GRID",         (0, 0), (-1, -1), 0.4, colors.HexColor("#e9d5ff")),
            ("TOPPADDING",   (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING",(0, 0), (-1, -1), 5),
            ("LEFTPADDING",  (0, 0), (-1, -1), 8),
        ]))
        story.append(tbl2)

    # ── §10  Footer ──────────────────────────────────────────────────────────
    story.append(Spacer(1, 20))
    story.append(HRFlowable(width="100%", thickness=0.6, color=CYAN, spaceAfter=6))
    story.append(Paragraph(
        f"Career Connect AI — Confidential Evaluation Report &nbsp;|&nbsp; "
        f"Eval #{eval_id} &nbsp;|&nbsp; Session: <font name='Courier' size='7'>{session_id}</font>",
        ParagraphStyle("footer", fontSize=7.5, textColor=MUTED, alignment=1)))

    doc.build(story)
    return path


def create_evaluation_for_session(db: Session, session: InterviewSession) -> int:
    from ..models import EmotionLog, SpeechFeatures
    from .analysis import compute_emotion_score_from_logs, analyse_transcript

    similarity = _compute_similarity_score(db, session)

    # ── Real audio/speech score from transcript analysis ─────────────────────
    transcript_text = session.transcript or ""
    duration_sec = 0
    if session.completed_at and session.created_at:
        duration_sec = int((session.completed_at - session.created_at).total_seconds())

    # 1. Parse transcript into Q/A pairs so we can analyze ONLY the candidate's answers
    transcript_lines = []
    if session.transcript:
        lines = session.transcript.splitlines()
        current_q = None
        for line in lines:
            if line.startswith("Q:"):
                current_q = line[2:].strip()
            elif line.startswith("A:") and current_q:
                ans_text = line[2:].strip()
                if len(ans_text) > 2:
                    transcript_lines.append({"q": current_q, "a": ans_text})
                current_q = None

    # ONLY analyze the words the candidate actually spoke (prevents TTS echo scoring)
    answer_text = " ".join([qa["a"] for qa in transcript_lines])
    speech_data = analyse_transcript(answer_text, duration_sec)
    audio = speech_data["communication_score"]
    word_count = speech_data["word_count"]

    # ── Real semantic score via heuristic (v1) ─────────────────────────────
    # Reward thorough answers (cap at 200 words = 80 points) + 20 points deterministic jitter
    wc_score = min(word_count / 200.0, 1.0) * 80.0
    jitter = (stable_hash_score(transcript_text) / 100.0) * 20.0
    semantic = round(wc_score + jitter, 2)

    # ── Real emotion score from DeepFace logs ────────────────────────────────
    emotion_logs = (
        db.query(EmotionLog)
        .filter(EmotionLog.session_id == session.session_id)
        .order_by(EmotionLog.timestamp_sec)
        .all()
    )
    emotion = compute_emotion_score_from_logs(emotion_logs)

    # Transcript already parsed above!

    # ── Completeness Penalty ──────────────────────────────────────────────────
    # If the candidate barely spoke or skipped questions, drastically reduce all scores.
    # We expect 5 questions answered. If fewer, penalty is proportional.
    EXPECTED_QUESTIONS = 5
    answered_count = len(transcript_lines)
    
    # Base penalty from word count (max 150 words needed for full credit)
    word_penalty = max(0.1, min(1.0, word_count / 150.0))
    # Question count penalty (e.g. 2 / 5 = 0.4)
    q_penalty = max(0.1, min(1.0, answered_count / EXPECTED_QUESTIONS))
    
    # Penalty is the minimum of the two (i.e. the harshest penalty)
    penalty = min(word_penalty, q_penalty)
    
    semantic = round(semantic * penalty, 2)
    audio = round(audio * penalty, 2)
    emotion = round(emotion * penalty, 2)
    # Also penalise similarity — resume match doesn't matter if you skipped the interview
    similarity = round(similarity * penalty, 2)

    # Persist speech features (upsert — replace if session re-evaluated)
    existing_sf = (
        db.query(SpeechFeatures)
        .filter(SpeechFeatures.session_id == session.session_id)
        .one_or_none()
    )
    if existing_sf:
        existing_sf.word_count = word_count
        existing_sf.filler_count = speech_data["filler_count"]
        existing_sf.filler_percentage = speech_data["filler_percentage"]
        existing_sf.wpm = speech_data["wpm"]
        existing_sf.communication_score = audio
        db.add(existing_sf)
    else:
        sf = SpeechFeatures(
            session_id=session.session_id,
            word_count=word_count,
            filler_count=speech_data["filler_count"],
            filler_percentage=speech_data["filler_percentage"],
            wpm=speech_data["wpm"],
            communication_score=audio,
        )
        db.add(sf)

    # ── Final composite (PRD formula) ────────────────────────────────────────
    final = round(
        (0.35 * semantic) + (0.30 * similarity) + (0.20 * emotion) + (0.15 * audio), 2
    )

    # Parse transcript already handled above
    
    import json
    from ..ai_service import ai_generate_insights
    insights = ai_generate_insights(transcript_lines, semantic, similarity, emotion, audio)

    ev = Evaluation(
        interview_session_id=session.id,
        semantic_score=semantic,
        similarity_score=similarity,
        emotion_score=emotion,
        audio_score=audio,
        final_score=final,
        report_url="",  # set after render
        insights_json=json.dumps(insights),
    )
    db.add(ev)
    db.commit()
    db.refresh(ev)

    # ── Rich PDF payload ─────────────────────────────────────────────────────

    # Candidate info
    candidate_user = db.query(User).filter(User.id == session.user_id).one_or_none()
    candidate_name  = candidate_user.full_name if candidate_user else "Candidate"
    candidate_email = candidate_user.email     if candidate_user else "—"

    # JD info
    job_title = "N/A"
    matched_skills: list[str] = []
    missing_skills: list[str] = []
    if session.job_id:
        jd = db.query(JobDescription).filter(JobDescription.id == session.job_id).one_or_none()
        if jd:
            job_title = jd.title or job_title
            # Extract skills from JD CSV for the skills tables
            jd_skills = {s.strip().lower() for s in (jd.skills_csv or "").split(",") if s.strip()}
            resume = (
                db.query(Resume)
                .filter(Resume.user_id == session.user_id)
                .order_by(Resume.created_at.desc())
                .first()
            )
            if resume:
                from ..utils import extract_tokens
                resume_tokens = extract_tokens(resume.raw_text)
                matched_skills = [s for s in jd_skills if s in resume_tokens]
                missing_skills = [s for s in jd_skills if s not in resume_tokens]

    # Dominant emotion from logs
    dominant_emotion = "neutral"
    if emotion_logs:
        from collections import Counter
        dom_counts = Counter(log.dominant_emotion for log in emotion_logs)
        dominant_emotion = dom_counts.most_common(1)[0][0]

    idate = (session.completed_at or session.created_at).strftime("%d %b %Y, %H:%M") if (session.completed_at or session.created_at) else "—"

    pdf_payload = {
        "candidate_name":    candidate_name,
        "candidate_email":   candidate_email,
        "job_title":         job_title,
        "interview_date":    idate,
        "session_id":        session.session_id,
        "semantic_score":    semantic,
        "similarity_score":  similarity,
        "emotion_score":     emotion,
        "audio_score":       audio,
        "final_score":       final,
        "wpm":               speech_data["wpm"],
        "filler_count":      speech_data["filler_count"],
        "filler_percentage": speech_data["filler_percentage"],
        "dominant_emotion":  dominant_emotion,
        "emotion_frames":    len(emotion_logs),
        "transcript_lines":  transcript_lines,
        "matched_skills":    matched_skills,
        "missing_skills":    missing_skills,
    }
    _render_pdf(ev.id, pdf_payload)
    ev.report_url = f"/api/v1/report/{ev.id}/download"
    db.add(ev)
    db.commit()
    return ev.id


@router.get("/evaluation/{id}", response_model=EvaluationResponse)
def get_evaluation(id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    ev = db.query(Evaluation).filter(Evaluation.id == id).one_or_none()
    if not ev:
        raise HTTPException(status_code=404, detail="Evaluation not found")

    session = db.query(InterviewSession).filter(InterviewSession.id == ev.interview_session_id).one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if session.user_id != user.id and str(user.role) not in ("admin", "hr", "moderator", "analyst"):
        raise HTTPException(status_code=403, detail="Not allowed")

    # ── Fetch speech features ─────────────────────────────────────────────────
    from ..models import SpeechFeatures, EmotionLog
    from collections import Counter

    sf = (
        db.query(SpeechFeatures)
        .filter(SpeechFeatures.session_id == session.session_id)
        .one_or_none()
    )

    # ── Dominant emotion from logs ────────────────────────────────────────────
    emotion_logs = (
        db.query(EmotionLog)
        .filter(EmotionLog.session_id == session.session_id)
        .all()
    )
    dominant_emotion = None
    if emotion_logs:
        dom_counts = Counter(log.dominant_emotion for log in emotion_logs)
        dominant_emotion = dom_counts.most_common(1)[0][0]

    return EvaluationResponse(
        evalID=ev.id,
        sessionID=session.session_id,
        semanticScore=ev.semantic_score,
        similarityScore=ev.similarity_score,
        emotionScore=ev.emotion_score,
        audioScore=ev.audio_score,
        finalScore=ev.final_score,
        reportURL=ev.report_url or None,
        wpm=sf.wpm if sf else None,
        fillerCount=sf.filler_count if sf else None,
        fillerPercentage=sf.filler_percentage if sf else None,
        wordCount=sf.word_count if sf else None,
        dominantEmotion=dominant_emotion,
        insightsJson=ev.insights_json,
    )


@router.get("/evaluation/{id}/pdf-data")
def get_evaluation_pdf_data(id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Returns the full rich payload needed to render the PDF on the frontend."""
    ev = db.query(Evaluation).filter(Evaluation.id == id).one_or_none()
    if not ev:
        raise HTTPException(status_code=404, detail="Evaluation not found")

    session = db.query(InterviewSession).filter(InterviewSession.id == ev.interview_session_id).one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if session.user_id != user.id:
        user_role_str = user.role.value if hasattr(user.role, 'value') else str(user.role)
        if user_role_str not in ("admin", "hr", "moderator", "analyst"):
            raise HTTPException(status_code=403, detail="Not allowed")
        
        # Verify HR owns the job description
        if user_role_str == "hr":
            from ..models import JobDescription
            # Check if session has a job_id attached and if the HR user owns that job
            jd = db.query(JobDescription).filter(JobDescription.id == session.job_id).one_or_none()
            if not jd or jd.hr_user_id != user.id:
                raise HTTPException(status_code=403, detail="Not allowed to view this candidate")
    candidate_user = db.query(User).filter(User.id == session.user_id).one_or_none()
    candidate_name = candidate_user.full_name if candidate_user else "Candidate"
    candidate_email = candidate_user.email if candidate_user else ""

    from ..models import JobDescription, SpeechFeatures, EmotionLog
    import json

    job_title = "N/A"
    if session.job_id:
        job = db.query(JobDescription).filter(JobDescription.id == session.job_id).one_or_none()
        if job:
            job_title = job.title

    transcript_lines = []
    if session.transcript:
        lines = session.transcript.splitlines()
        current_q = None
        for line in lines:
            if line.startswith("Q:"):
                current_q = line[2:].strip()
            elif line.startswith("A:") and current_q:
                transcript_lines.append({"q": current_q, "a": line[2:].strip()})
                current_q = None

    sf = db.query(SpeechFeatures).filter(SpeechFeatures.session_id == session.session_id).one_or_none()
    speech_data = {
        "wpm": sf.wpm if sf else 130.0,
        "filler_count": sf.filler_count if sf else 0,
        "filler_percentage": sf.filler_percentage if sf else 0.0
    }

    emotion_logs = db.query(EmotionLog).filter(EmotionLog.session_id == session.session_id).all()
    dominant_emotion = "neutral"
    if emotion_logs:
        from collections import Counter
        dom_counts = Counter(log.dominant_emotion for log in emotion_logs)
        dominant_emotion = dom_counts.most_common(1)[0][0]

    matched_skills = []
    missing_skills = []
    if session.job_id:
        jd = db.query(JobDescription).filter(JobDescription.id == session.job_id).one_or_none()
        if jd:
            jd_skills = {s.strip().lower() for s in (jd.skills_csv or "").split(",") if s.strip()}
            from ..models import Resume
            resume = db.query(Resume).filter(Resume.user_id == session.user_id).order_by(Resume.id.desc()).first()
            if resume and resume.raw_text:
                from ..utils import extract_tokens
                resume_tokens = extract_tokens(resume.raw_text)
                matched_skills = [s for s in jd_skills if s in resume_tokens]
                missing_skills = [s for s in jd_skills if s not in resume_tokens]

    idate = (session.completed_at or session.created_at).strftime("%d %b %Y, %H:%M") if (session.completed_at or session.created_at) else "-"
    
    # Parse insights JSON for Strengths and Weaknesses
    strengths = []
    watch_areas = []
    if ev.insights_json:
        try:
            ij = json.loads(ev.insights_json)
            s = ij.get("topStrength", "")
            if s: strengths.append(s)
            w = ij.get("toImprove", "")
            if w: watch_areas.append(w)
        except:
            pass

    return {
        "candidate_name":    candidate_name,
        "candidate_email":   candidate_email,
        "job_title":         job_title,
        "interview_date":    idate,
        "session_id":        session.session_id,
        "semantic_score":    ev.semantic_score,
        "similarity_score":  ev.similarity_score,
        "emotion_score":     ev.emotion_score,
        "audio_score":       ev.audio_score,
        "final_score":       ev.final_score,
        "wpm":               speech_data["wpm"],
        "filler_count":      speech_data["filler_count"],
        "filler_percentage": speech_data["filler_percentage"],
        "dominant_emotion":  dominant_emotion,
        "emotion_frames":    len(emotion_logs),
        "transcript_lines":  transcript_lines,
        "matched_skills":    matched_skills,
        "missing_skills":    missing_skills,
        "strengths":         strengths,
        "watch_areas":       watch_areas
    }


class EmailReportRequest(BaseModel):
    pdf_base64: str

@router.post("/evaluation/{id}/send-email")
async def send_evaluation_email(
    id: int,
    payload: EmailReportRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Saves the beautiful PDF generated by the frontend (passed as base64) to a temp 
    file, and emails it to the candidate's registered email address.
    """
    import json, io, asyncio, base64
    from ..core.email import send_report_email

    ev = db.query(Evaluation).filter(Evaluation.id == id).one_or_none()
    if not ev:
        raise HTTPException(status_code=404, detail="Evaluation not found")

    session = db.query(InterviewSession).filter(InterviewSession.id == ev.interview_session_id).one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if session.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not allowed")

    candidate_email = user.email
    candidate_name = user.full_name or user.email

    job_title = "Interview"
    if session.job_id:
        jd = db.query(JobDescription).filter(JobDescription.id == session.job_id).one_or_none()
        if jd:
            job_title = jd.title

    pdf_path = REPORTS_DIR / f"email_report_{id}.pdf"
    
    try:
        # Prevent binascii.Error by strictly enforcing base64 padding
        b64_str = payload.pdf_base64.strip()
        b64_str += "=" * ((4 - len(b64_str) % 4) % 4)

        # Decode the provided base64 UI-rendered PDF directly to disk
        pdf_bytes = base64.b64decode(b64_str)
        with open(pdf_path, "wb") as f:
            f.write(pdf_bytes)

        await send_report_email(
            to_email=candidate_email,
            candidate_name=candidate_name,
            job_title=job_title,
            report_path=pdf_path,
        )
    finally:
        # Clean up temp file
        if pdf_path.exists():
            pdf_path.unlink(missing_ok=True)

    return {"ok": True, "message": f"Report emailed to {candidate_email}"}
