<div align="center">

# 🚀 Career Connect AI

### AI-Powered Recruitment Automation Platform

**Semantic Resume Screening · Skill Gap Analysis · AI Interviews · Multimodal Evaluation**

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![Python](https://img.shields.io/badge/Python-3.11%2B-3776AB?style=flat-square&logo=python)](https://python.org/)
[![OpenAI](https://img.shields.io/badge/AI-GPT--4.1%20via%20GitHub%20AI-412991?style=flat-square&logo=openai)](https://github.com/marketplace/models)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

</div>

---

## 📌 Overview

**Career Connect AI** is a full-stack recruitment automation platform that replaces manual resume screening with an AI-driven pipeline. It uses **Doc2Vec embeddings**, **GPT-4.1 semantic reasoning**, and upcoming **multimodal analysis** (emotion, speech, identity) to give HR teams objective, data-backed hiring decisions — and gives candidates a personalised roadmap to close their skill gaps.

---

## ✨ Features

### ✅ Implemented (Phase 1 & 2)

| Module | Feature |
|---|---|
| 🔐 **Auth** | JWT-based register/login, role-based access (Candidate / HR / Admin) |
| 📄 **Resume Upload** | PDF & DOCX parsing, Doc2Vec embedding on upload |
| 💼 **Job Descriptions** | HR creates JDs with title, description & required skills; auto-embedded |
| 🧠 **Semantic Matching** | Doc2Vec cosine similarity + GPT-4.1 hybrid score (FR-4.1, 4.4) |
| 🎨 **Match Score UI** | Circular progress rings, colour-coded tier (Green / Amber / Red) (FR-4.2) |
| 🔍 **Skill Overlap** | Matched, missing, and extra skills (FR-4.3) |
| 📊 **Recruiter View** | Sortable and filterable ranked candidate table (FR-4.5) |
| 🗺️ **Skill Gap Analysis** | AI-detected missing skills with impact ranking (FR-5.1, 5.3) |
| 📚 **Learning Recommendations** | GPT-4.1 course names, topic descriptions, estimated time (FR-5.2) |
| 📖 **Smart Article Redirect** | Start Learning opens best GPT-chosen tutorial in new tab |
| ✅ **Progress Tracking** | Mark skills In Progress / Completed; full event history (FR-5.4) |
| 🤖 **AI Interview** | Dynamic JD-contextualised question generation via GPT-4.1 RAG |

### 🔜 Roadmap (Phase 3+)

| Module | Status |
|---|---|
| 😐 **Emotion Analysis** | DeepFace integration during interview — planned |
| 🔊 **Speech Analysis** | Librosa + RAVDESS tone/sentiment — planned |
| 🛡️ **Anti-Cheat Engine** | YOLOv8 multi-person detection + tab-switch guards — planned |
| 🪪 **Identity Verification** | Face-match against uploaded ID — planned |
| 📄 **PDF Reports** | ReportLab evaluation reports — planned |
| 📨 **Event-Driven Pipeline** | RabbitMQ / Kafka for async processing — planned |
| 🐳 **Containerisation** | Docker + Kubernetes deployment — planned |

---

## 🏗️ Architecture

```mermaid
graph TB
    subgraph FE["Frontend - React + Vite + Tailwind"]
        UI_Auth[Auth Pages]
        UI_Dashboard[Dashboard]
        UI_Match[Resume Match]
        UI_Interview[AI Interview]
        UI_Reports[Reports]
    end

    subgraph BE["Backend - FastAPI"]
        API[REST API port 8000]

        subgraph Routers["Routers"]
            R_Auth["auth"]
            R_Resume["resume"]
            R_JD["jd"]
            R_Match["match"]
            R_Interview["interview"]
            R_Rec["recommendations"]
            R_HR["hr"]
        end

        subgraph AIServices["AI Services"]
            SVC_AI["ai_service.py - GPT-4.1"]
            SVC_D2V["doc2vec_service.py"]
            SVC_GEM["gemini_service.py shim"]
        end

        subgraph CoreLayer["Core"]
            SEC["security.py - JWT"]
            CFG["config.py - Settings"]
            MODELS["models.py - ORM"]
        end
    end

    subgraph Storage["Storage"]
        DB[(SQLite or PostgreSQL)]
        FS[Doc2Vec Artifacts]
    end

    subgraph ExtAI["External AI"]
        GHAI["GitHub AI - GPT-4.1"]
    end

    FE -->|HTTP + JWT| API
    API --> Routers
    Routers --> AIServices
    Routers --> CoreLayer
    AIServices --> GHAI
    AIServices --> SVC_D2V
    CoreLayer --> MODELS
    MODELS --> DB
    SVC_D2V --> FS
```

---

## 🔄 Resume Matching Pipeline

```mermaid
sequenceDiagram
    participant C as Candidate
    participant API as FastAPI
    participant D2V as Doc2Vec
    participant GPT as GPT-4.1
    participant DB as Database

    C->>API: POST resume upload PDF or DOCX
    API->>D2V: Extract text and infer embedding
    D2V-->>API: 100-dim vector
    API->>DB: Store resume and embedding

    C->>API: POST match with resumeID and jobID
    API->>DB: Fetch both embeddings
    API->>API: Compute cosine similarity
    API->>GPT: Semantic reasoning prompt
    GPT-->>API: score 0 to 100
    API->>API: hybrid = cosine 70pct + GPT 30pct
    API->>GPT: ai_skill_recommendations for missing skills
    GPT-->>API: courses and descriptions
    API->>DB: Persist SkillRecommendation rows
    API-->>C: hybridScore + tier + skillOverlap + recommendations
```

---

## 🤖 AI Interview Flow

```mermaid
sequenceDiagram
    participant C as Candidate
    participant API as FastAPI
    participant GPT as GPT-4.1
    participant DB as Database

    C->>API: POST interview start with jobID and experience
    API->>GPT: ai_generate_question with JD context
    GPT-->>API: contextual first question
    API->>DB: Store session and transcript
    API-->>C: sessionID and firstQuestion

    loop Each answer turn
        C->>API: POST interview answer with transcript
        API->>GPT: ai_generate_question with history
        GPT-->>API: next contextual question
        API-->>C: nextQuestion
    end

    C->>API: POST interview end
    API->>API: create evaluation for session
    API-->>C: evalID and estimatedReady
```

---

## 🗂️ Project Structure

```
Career-Connect-AI/
├── src/
│   ├── pages/
│   │   ├── ResumeMatch.tsx         # Full matching and skill gap UI
│   │   ├── InterviewSelection.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Reports.tsx
│   │   └── Profile.tsx
│   ├── context/AuthContext.tsx
│   ├── lib/api.ts
│   └── index.css
│
└── backend/
    ├── app/
    │   ├── main.py
    │   ├── models.py
    │   ├── schemas.py
    │   ├── db.py
    │   ├── deps.py
    │   ├── security.py
    │   ├── ai_service.py           # GPT-4.1 unified service
    │   ├── doc2vec_service.py
    │   ├── gemini_service.py
    │   ├── utils.py
    │   ├── core/config.py
    │   ├── artifacts/
    │   └── routers/
    │       ├── auth.py
    │       ├── resume.py
    │       ├── jd.py
    │       ├── match.py
    │       ├── interview.py
    │       ├── evaluation.py
    │       ├── recommendations.py
    │       ├── report.py
    │       ├── dashboard.py
    │       ├── history.py
    │       └── profile.py
    ├── requirements.txt
    └── .env
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons |
| **Backend** | FastAPI, Uvicorn, Python 3.11+ |
| **Database** | SQLite (dev) / PostgreSQL (prod) via SQLAlchemy |
| **AI — Primary** | GPT-4.1 via [GitHub AI Inference](https://github.com/marketplace/models) |
| **AI — Embeddings** | Doc2Vec (Gensim) |
| **AI — Fallback** | TF-IDF cosine similarity |
| **Auth** | JWT (python-jose) + bcrypt (passlib) |
| **File Parsing** | PyPDF2, python-docx |

---

## ⚡ Quick Start

### Prerequisites

- Python 3.11+, Node.js 18+
- A [GitHub PAT](https://github.com/settings/tokens) with model access

### 1. Clone

```bash
git clone https://github.com/Shreyyy07/Career-Connect-AI---Major-Project1.git
cd Career-Connect-AI---Major-Project1
```

### 2. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
```

Create `backend/.env`:

```env
DATABASE_URL=sqlite+pysqlite:///./career_connect_ai.db
JWT_SECRET=your-secret-key-here
CORS_ORIGINS=http://localhost:5173
GITHUB_TOKEN=github_pat_xxxxxxxxxxxx
GITHUB_AI_ENDPOINT=https://models.github.ai/inference
GITHUB_AI_MODEL=openai/gpt-4.1
```

```bash
python -m uvicorn app.main:app --reload
# API: http://localhost:8000
# Swagger: http://localhost:8000/docs
```

### 3. Frontend

```bash
cd ..
npm install
npm run dev
# App: http://localhost:5173
```

---

## 📡 Key API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/auth/register` | Register user |
| `POST` | `/api/v1/auth/login` | Login and get JWT |
| `POST` | `/api/v1/resume/upload` | Upload PDF or DOCX |
| `POST` | `/api/v1/jd/upload` | Create JD (HR only) |
| `POST` | `/api/v1/match` | Run hybrid AI match |
| `GET` | `/api/v1/hr/matches` | Recruiter ranked view |
| `GET` | `/api/v1/recommendations/{id}/resource-url` | GPT article URL |
| `POST` | `/api/v1/recommendations/{id}/status` | Update learning status |
| `POST` | `/api/v1/interview/start` | Start AI interview |
| `POST` | `/api/v1/interview/answer` | Submit answer and get next question |
| `POST` | `/api/v1/interview/end` | End session and trigger evaluation |
| `GET` | `/api/v1/health` | Health check |

---

## 🧠 AI Service Functions

All in `backend/app/ai_service.py` with graceful offline fallbacks:

| Function | Purpose | Fallback |
|---|---|---|
| `ai_semantic_score()` | Resume–JD match score 0 to 100 | TF-IDF cosine |
| `ai_generate_question()` | Dynamic interview question from JD | Static question bank |
| `ai_evaluate_answer()` | Score answer quality | 50.0 default |
| `ai_skill_recommendations()` | Courses, descriptions, time estimates | Empty list |
| `ai_find_resource_url()` | Best tutorial URL for a skill | Google search URL |

---

## 🗃️ Database Schema

```
User ──────────┬───── Resume (embedding_csv)
               ├───── JobDescription (embedding_csv, skills_csv)
               ├───── InterviewSession ── Evaluation
               ├───── Assessment
               └───── SkillRecommendation ── SkillRecommendationEvent
```

---

## 🔒 Security

- Bearer JWT required on all endpoints except `/auth/*`
- Passwords hashed with bcrypt
- Role-based access: `candidate` | `hr` | `admin`
- CORS restricted to configured origins

---

## 📄 License

MIT — see [LICENSE](LICENSE) for details.

---

<div align="center">

Built with ❤️ by **Shrey**

⭐ Star this repo if you find it useful!

</div>
