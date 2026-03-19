from __future__ import annotations

import hashlib
import json
from pathlib import Path

from gensim.models.doc2vec import Doc2Vec, TaggedDocument
from gensim.utils import simple_preprocess
from sqlalchemy.orm import Session

from .models import JobDescription, Resume


MODEL_DIR = Path(__file__).resolve().parent / "artifacts"
MODEL_DIR.mkdir(parents=True, exist_ok=True)
MODEL_PATH = MODEL_DIR / "doc2vec.model"
META_PATH = MODEL_DIR / "doc2vec.meta.json"

SEED_CORPUS: list[tuple[str, str]] = [
    (
        "seed:backend_python",
        "Backend Engineer Python FastAPI Django REST APIs PostgreSQL SQLAlchemy Redis Celery Docker Kubernetes microservices",
    ),
    (
        "seed:frontend_react",
        "Frontend Engineer React TypeScript Next.js Tailwind CSS performance accessibility responsive design state management",
    ),
    (
        "seed:data_analyst",
        "Data Analyst SQL Power BI Tableau dashboards KPI analysis data cleaning reporting Excel statistics",
    ),
    (
        "seed:ml_engineer",
        "Machine Learning Engineer Python PyTorch TensorFlow feature engineering model training evaluation deployment MLOps",
    ),
    (
        "seed:devops",
        "DevOps Engineer CI CD pipelines AWS GCP Terraform Docker Kubernetes monitoring logging SRE",
    ),
    (
        "seed:product_manager",
        "Product Manager requirements PRD roadmap user research analytics stakeholder management experiments",
    ),
]


def _corpus_rows(db: Session) -> list[tuple[str, str]]:
    rows: list[tuple[str, str]] = []
    rows.extend(SEED_CORPUS)
    for r in db.query(Resume).order_by(Resume.id.asc()).all():
        rows.append((f"resume:{r.id}", r.raw_text or ""))
    for j in db.query(JobDescription).order_by(JobDescription.id.asc()).all():
        rows.append((f"jd:{j.id}", (j.description or "") + " " + (j.skills_csv or "")))
    return rows


def _corpus_hash(rows: list[tuple[str, str]]) -> str:
    h = hashlib.sha256()
    for tag, text in rows:
        h.update(tag.encode("utf-8"))
        h.update(b"\0")
        h.update(text.encode("utf-8", errors="ignore"))
        h.update(b"\0")
    return h.hexdigest()


def _load_meta() -> dict:
    if not META_PATH.exists():
        return {}
    try:
        return json.loads(META_PATH.read_text(encoding="utf-8"))
    except Exception:
        return {}


def _save_meta(meta: dict) -> None:
    META_PATH.write_text(json.dumps(meta, indent=2), encoding="utf-8")


def ensure_model(db: Session) -> Doc2Vec:
    """
    Train (or retrain) a Doc2Vec model on all stored resumes + JDs.
    This is lightweight and deterministic enough for v1. For production,
    we'd train offline on Kaggle datasets and only infer here.
    """
    rows = _corpus_rows(db)
    meta = _load_meta()
    current_hash = _corpus_hash(rows)

    if MODEL_PATH.exists() and meta.get("corpus_hash") == current_hash:
        return Doc2Vec.load(str(MODEL_PATH))

    documents: list[TaggedDocument] = []
    for tag, text in rows:
        tokens = simple_preprocess(text or "", deacc=True, min_len=2, max_len=40)
        if not tokens:
            tokens = ["empty"]
        documents.append(TaggedDocument(words=tokens, tags=[tag]))

    # Train even with small corpus; vectors will improve as more docs added.
    model = Doc2Vec(
        vector_size=200,
        window=10,
        min_count=1,
        workers=1,  # stable on Windows
        epochs=60,
        dm=1,
        negative=10,
        hs=0,
    )
    model.build_vocab(documents)
    model.train(documents, total_examples=len(documents), epochs=model.epochs)

    model.save(str(MODEL_PATH))
    _save_meta({"corpus_hash": current_hash, "docs": len(documents)})
    return model


def infer_embedding_csv(model: Doc2Vec, text: str) -> str:
    tokens = simple_preprocess(text or "", deacc=True, min_len=2, max_len=40)
    if not tokens:
        tokens = ["empty"]
    vec = model.infer_vector(tokens, epochs=30)
    return ",".join(f"{float(x):.6f}" for x in vec.tolist())


def parse_embedding_csv(csv: str) -> list[float]:
    if not csv:
        return []
    try:
        return [float(x) for x in csv.split(",") if x]
    except Exception:
        return []

