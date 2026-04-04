import sys
from pathlib import Path

# Add backend to path
sys.path.append(str(Path(__file__).parent))

from app.db import SessionLocal
from app.models import Evaluation, InterviewSession, User, JobDescription, Resume, EmotionLog, SpeechFeatures
from app.routers.evaluation import _render_pdf

def regenerate_all_pdfs():
    db = SessionLocal()
    evals = db.query(Evaluation).all()
    for ev in evals:
        session = db.query(InterviewSession).filter(InterviewSession.id == ev.interview_session_id).first()
        if not session:
            continue
            
        emotion_logs = db.query(EmotionLog).filter(EmotionLog.session_id == session.session_id).order_by(EmotionLog.timestamp_sec).all()
        sf = db.query(SpeechFeatures).filter(SpeechFeatures.session_id == session.session_id).first()
        
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

        candidate_user = db.query(User).filter(User.id == session.user_id).one_or_none()
        candidate_name  = candidate_user.full_name if candidate_user else "Candidate"
        candidate_email = candidate_user.email     if candidate_user else "—"

        job_title = "N/A"
        matched_skills = []
        missing_skills = []
        if session.job_id:
            jd = db.query(JobDescription).filter(JobDescription.id == session.job_id).one_or_none()
            if jd:
                job_title = jd.title or job_title
                jd_skills = {s.strip().lower() for s in (jd.skills_csv or "").split(",") if s.strip()}
                resume = db.query(Resume).filter(Resume.user_id == session.user_id).order_by(Resume.created_at.desc()).first()
                if resume:
                    from app.utils import extract_tokens
                    resume_tokens = extract_tokens(resume.raw_text)
                    matched_skills = [s for s in jd_skills if s in resume_tokens]
                    missing_skills = [s for s in jd_skills if s not in resume_tokens]

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
            "semantic_score":    ev.semantic_score,
            "similarity_score":  ev.similarity_score,
            "emotion_score":     ev.emotion_score,
            "audio_score":       ev.audio_score,
            "final_score":       ev.final_score,
            "wpm":               sf.wpm if sf else 130,
            "filler_count":      sf.filler_count if sf else 0,
            "filler_percentage": sf.filler_percentage if sf else 0,
            "dominant_emotion":  dominant_emotion,
            "emotion_frames":    len(emotion_logs),
            "transcript_lines":  transcript_lines,
            "matched_skills":    matched_skills,
            "missing_skills":    missing_skills,
        }
        
        print(f"Regenerating PDF for evaluation {ev.id}...")
        _render_pdf(ev.id, pdf_payload)

    db.close()
    print("Done!")

if __name__ == "__main__":
    regenerate_all_pdfs()
