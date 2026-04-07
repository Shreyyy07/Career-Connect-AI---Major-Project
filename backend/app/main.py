from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.config import settings
from sqlalchemy import inspect, text

from .db import Base, engine
from .routers import auth, resume, jd, match, interview, evaluation, report, profile, assessments, dashboard, history, recommendations, analysis, agent, hr


Base.metadata.create_all(bind=engine)

# Lightweight "migration" for SQLite dev DB: add embedding columns if missing.
try:
    insp = inspect(engine)
    with engine.begin() as conn:
        if "users" in insp.get_table_names():
            cols = {c["name"] for c in insp.get_columns("users")}
            if "is_verified" not in cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT 0"))
            if "company_name" not in cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN company_name VARCHAR(200) DEFAULT ''"))
        if "resumes" in insp.get_table_names():
            cols = {c["name"] for c in insp.get_columns("resumes")}
            if "embedding_csv" not in cols:
                conn.execute(text("ALTER TABLE resumes ADD COLUMN embedding_csv TEXT DEFAULT ''"))
            if "parsed_json" not in cols:
                conn.execute(text("ALTER TABLE resumes ADD COLUMN parsed_json TEXT DEFAULT '{}'"))
        if "job_descriptions" in insp.get_table_names():
            cols = {c["name"] for c in insp.get_columns("job_descriptions")}
            if "embedding_csv" not in cols:
                conn.execute(text("ALTER TABLE job_descriptions ADD COLUMN embedding_csv TEXT DEFAULT ''"))
            if "company_name" not in cols:
                conn.execute(text("ALTER TABLE job_descriptions ADD COLUMN company_name VARCHAR(200) DEFAULT ''"))
            if "experience_level" not in cols:
                conn.execute(text("ALTER TABLE job_descriptions ADD COLUMN experience_level VARCHAR(50) DEFAULT ''"))
            if "location" not in cols:
                conn.execute(text("ALTER TABLE job_descriptions ADD COLUMN location VARCHAR(200) DEFAULT ''"))
            if "updated_at" not in cols:
                conn.execute(text("ALTER TABLE job_descriptions ADD COLUMN updated_at DATETIME"))
        if "evaluations" in insp.get_table_names():
            cols = {c["name"] for c in insp.get_columns("evaluations")}
            if "hr_status" not in cols:
                conn.execute(text("ALTER TABLE evaluations ADD COLUMN hr_status VARCHAR(20) DEFAULT 'pending'"))
            if "hr_notes" not in cols:
                conn.execute(text("ALTER TABLE evaluations ADD COLUMN hr_notes TEXT DEFAULT ''"))
except Exception:
    # Non-fatal: if DB doesn't support ALTER, create_all will still work for new DBs.
    pass

app = FastAPI(title="Career Connect AI API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(resume.router)
app.include_router(jd.router)
app.include_router(match.router)
app.include_router(interview.router)
app.include_router(evaluation.router)
app.include_router(report.router)
app.include_router(profile.router)
app.include_router(assessments.router)
app.include_router(dashboard.router)
app.include_router(history.router)
app.include_router(recommendations.router)
app.include_router(analysis.router)
app.include_router(agent.router)
app.include_router(hr.router)


@app.get("/api/v1/health")
def health():
    return {"ok": True}

