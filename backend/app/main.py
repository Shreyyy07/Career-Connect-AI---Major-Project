from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.config import settings
from .db import Base, engine
from .routers import auth, resume, jd, match, interview, evaluation, report, profile, assessments, dashboard, history, recommendations, analysis, agent, hr, notifications


Base.metadata.create_all(bind=engine, checkfirst=True)


app = FastAPI(title="Career Connect AI API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=(
        r"http://(localhost|127\.0\.0\.1)(:\d+)?"      # local dev
        r"|https://.*\.vercel\.app"                     # Vercel preview & production
        r"|https://.*\.hf\.space"                       # Hugging Face Spaces
    ),
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
app.include_router(notifications.router)


@app.get("/api/v1/health")
def health():
    return {"ok": True}

