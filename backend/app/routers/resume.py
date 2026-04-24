from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from ..db import get_db
from ..deps import get_current_user
from ..models import Resume, User
from ..schemas import ResumeUploadResponse
from ..doc2vec_service import ensure_model, infer_embedding_csv
from ..ai_service import ai_extract_resume_details
import json


router = APIRouter(prefix="/api/v1/resume", tags=["resume"])


MAX_BYTES = 5 * 1024 * 1024
ALLOWED_CT = {
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
}


def _read_limited(file: UploadFile) -> bytes:
    data = file.file.read(MAX_BYTES + 1)
    if len(data) > MAX_BYTES:
        raise HTTPException(status_code=413, detail="File too large (max 5 MB)")
    return data


def _extract_text(content_type: str, data: bytes) -> str:
    if content_type == "application/pdf":
        try:
            from PyPDF2 import PdfReader

            reader = PdfReader(io_bytes := __import__("io").BytesIO(data))
            pages = []
            for p in reader.pages:
                pages.append(p.extract_text() or "")
            return "\n".join(pages).strip()
        except Exception:
            raise HTTPException(status_code=400, detail="Failed to parse PDF document. Please ensure it is a valid text-based PDF.")

    if content_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        try:
            from docx import Document

            doc = Document(__import__("io").BytesIO(data))
            return "\n".join(p.text for p in doc.paragraphs).strip()
        except Exception:
            raise HTTPException(status_code=400, detail="Failed to parse DOCX document. Please ensure it is a valid Word document.")

    return ""


@router.post("/upload", response_model=ResumeUploadResponse)
def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="Missing file")

    if file.content_type not in ALLOWED_CT:
        raise HTTPException(status_code=400, detail="Unsupported format. Only PDF/DOCX allowed.")

    data = _read_limited(file)
    raw_text = _extract_text(file.content_type, data)

    parsed_dict = ai_extract_resume_details(raw_text)
    parsed_json_str = json.dumps(parsed_dict) if parsed_dict else "{}"

    resume = Resume(
        user_id=user.id,
        filename=file.filename,
        content_type=file.content_type,
        raw_text=raw_text,
        parsed_json=parsed_json_str,
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)

    # Doc2Vec embedding
    try:
        model = ensure_model(db)
        resume.embedding_csv = infer_embedding_csv(model, raw_text)
        db.add(resume)
        db.commit()
    except Exception:
        # Don't block upload if embedding fails; match can retrain later.
        pass

    parsed = {
        "filename": resume.filename,
        "contentType": resume.content_type,
        "textLength": len(raw_text),
        "ai_extracted": parsed_dict,
    }
    return ResumeUploadResponse(resumeID=resume.id, parsedData=parsed)


@router.get("/list")
def list_resumes(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rows = (
        db.query(Resume)
        .filter(Resume.user_id == user.id)
        .order_by(Resume.created_at.desc())
        .all()
    )
    return [
        {
            "resumeID": r.id,
            "filename": r.filename,
            "created_at": r.created_at.isoformat(),
        }
        for r in rows
    ]

