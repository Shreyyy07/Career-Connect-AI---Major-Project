from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.config import settings
from sqlalchemy import inspect, text

from .db import Base, engine
from .routers import auth, resume, jd, match, interview, evaluation, report, profile, assessments, dashboard, history, recommendations


Base.metadata.create_all(bind=engine)

# Lightweight "migration" for SQLite dev DB: add embedding columns if missing.
try:
    insp = inspect(engine)
    with engine.begin() as conn:
        if "resumes" in insp.get_table_names():
            cols = {c["name"] for c in insp.get_columns("resumes")}
            if "embedding_csv" not in cols:
                conn.execute(text("ALTER TABLE resumes ADD COLUMN embedding_csv TEXT DEFAULT ''"))
        if "job_descriptions" in insp.get_table_names():
            cols = {c["name"] for c in insp.get_columns("job_descriptions")}
            if "embedding_csv" not in cols:
                conn.execute(text("ALTER TABLE job_descriptions ADD COLUMN embedding_csv TEXT DEFAULT ''"))
except Exception:
    # Non-fatal: if DB doesn't support ALTER, create_all will still work for new DBs.
    pass

app = FastAPI(title="Career Connect AI API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
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


@app.get("/api/v1/health")
def health():
    return {"ok": True}

