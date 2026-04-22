<div align="center">

# 🚀 Career Connect AI

### An Enterprise-Grade AI Recruitment Automation Platform

**Semantic Resume Screening • Adaptive AI Interviews • Multimodal Behavioral Analysis • Real-Time Proctoring • n8n Call Automation**

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI_0.110-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React_18_%2B_Vite-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![Python](https://img.shields.io/badge/Python-3.11%2B-3776AB?style=flat-square&logo=python)](https://python.org/)
[![Google Gemini](https://img.shields.io/badge/LLM-Google_Gemini_1.5-4285F4?style=flat-square&logo=google)](https://ai.google.dev/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-4169E1?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

</div>

---

## 📖 Overview

**Career Connect AI** is a production-ready, full-stack AI recruitment platform that replaces manual screening pipelines with a fully automated, intelligent hiring engine. It features two dedicated portals — a **Candidate Dashboard** for interviews and skill growth, and an **HR Command Center** for pipeline management and integrity monitoring.

![Landing Page](public/images_readme/Landing_Page.gif)

---

## 🗺️ System Flows

### 🎓 Candidate Journey

```mermaid
flowchart LR
    %% Styles
    classDef purple fill:#6b21a8,stroke:#d8b4fe,stroke-width:2px,color:#fff,rx:5px,ry:5px
    classDef blue fill:#1e3a8a,stroke:#93c5fd,stroke-width:2px,color:#fff,rx:5px,ry:5px
    classDef yellow fill:#b45309,stroke:#fcd34d,stroke-width:2px,color:#fff,rx:5px,ry:5px
    classDef green fill:#14532d,stroke:#86efac,stroke-width:2px,color:#fff,rx:5px,ry:5px
    classDef red fill:#7f1d1d,stroke:#fca5a5,stroke-width:2px,color:#fff,rx:5px,ry:5px
    classDef cyan fill:#164e63,stroke:#67e8f9,stroke-width:2px,color:#fff,rx:5px,ry:5px

    %% Nodes
    A["👤 Register / Login<br/>Authentication"]:::purple
    B["✉️ Email OTP<br/>Verification"]:::purple
    C["🎛️ Candidate<br/>Dashboard"]:::blue

    %% Branch 1: Resume Upload
    D["📄 Upload Resume<br/>(PDF/DOCX)"]:::yellow
    E["📋 Paste Job<br/>Description"]:::yellow
    F["🧠 Doc2Vec Semantic<br/>Matching"]:::green
    G["🔍 AI Skill Gap<br/>Analysis (Gemini)"]:::green
    H["📚 Auto-fetch Learning<br/>Resources"]:::green

    %% Branch 2: AI Interview
    I["🎙️ Start AI<br/>Interview (Van)"]:::yellow
    J["🤖 Gemini: Generate<br/>Context-Aware Q's"]:::green
    K["🗣️ Candidate Answers<br/>via Voice (STT)"]:::yellow

    %% Evaluation Engine
    L["📹 Real-Time Proctoring<br/>(Face-API + COCO)"]:::red
    M["⚙️ Multimodal<br/>Evaluation Engine"]:::blue
    
    N["📊 Semantic Score"]:::cyan
    O["🗣️ Speech Analysis<br/>(WPM, Fillers)"]:::cyan
    P["🎭 Emotion Score<br/>(DeepFace)"]:::cyan
    Q["📝 JD Similarity"]:::cyan

    %% Results
    R["📑 Interview<br/>Results Page"]:::purple
    S["📄 HD PDF Report<br/>(html2pdf.js)"]:::purple
    T["📧 Email Report<br/>(Gmail SMTP)"]:::purple

    %% Connections
    A --> B --> C
    
    C -->|"Selects Job"| D
    D --> E --> F --> G --> H
    
    C -->|"Starts Assessment"| I
    I --> J --> K
    
    K -->|"Analyzes Audio"| M
    K -->|"Monitors Video"| L
    
    M --> N
    M --> O
    M --> P
    M --> Q
    
    F --> R
    L --> R
    N --> R
    O --> R
    P --> R
    Q --> R
    
    R --> S --> T
```

### 🏢 HR / Recruiter Journey

```mermaid
flowchart LR
    %% Styles
    classDef purple fill:#6b21a8,stroke:#d8b4fe,stroke-width:2px,color:#fff,rx:5px,ry:5px
    classDef blue fill:#1e3a8a,stroke:#93c5fd,stroke-width:2px,color:#fff,rx:5px,ry:5px
    classDef yellow fill:#b45309,stroke:#fcd34d,stroke-width:2px,color:#fff,rx:5px,ry:5px
    classDef green fill:#14532d,stroke:#86efac,stroke-width:2px,color:#fff,rx:5px,ry:5px
    classDef red fill:#7f1d1d,stroke:#fca5a5,stroke-width:2px,color:#fff,rx:5px,ry:5px
    classDef cyan fill:#164e63,stroke:#67e8f9,stroke-width:2px,color:#fff,rx:5px,ry:5px

    A["👤 HR Registration /<br/>Login"]:::purple --> B["🏢 HR Command<br/>Center"]:::blue
    
    B --> C["📈 View Pipeline &<br/>Analytics"]:::cyan
    B --> D["📋 View Job<br/>Descriptions"]:::yellow
    B --> E["👥 Browse Candidate<br/>Pool"]:::blue
    
    E --> F["🔍 Open Candidate<br/>Detail Panel"]:::cyan
    
    F --> G["📊 Review AI Scores<br/>& Emotion Data"]:::green
    F --> H["🛡️ Check Anti-Cheat<br/>Integrity Logs"]:::red
    
    G --> I{"✅ Make Hiring<br/>Decision"}:::purple
    H --> I
    
    I -->|"Reject"| J["❌ Send Rejection<br/>Email"]:::red
    I -->|"Shortlist"| K["⭐ Mark as<br/>Shortlisted"]:::green
    
    K --> L["⚡ Trigger n8n<br/>Automation"]:::yellow
    L --> M["📞 Auto-Schedule<br/>Phone Screen"]:::blue
```

---

## ✨ Features

### 🔐 Authentication & Onboarding
- Separate registration and login flows for Candidates and HR Recruiters
- **6-digit OTP email verification** before account activation
- JWT-based protected routes with secure token handling
- Full OTP-based **Forgot Password** reset flow

![Email Verification](public/images_readme/Id_verification_mail.png)

---

### 📄 Semantic Resume Matching
- Upload PDF or DOCX — parsed instantly via `pdfplumber` / `python-docx`
- **Doc2Vec embeddings** + **cosine similarity** for meaning-based matching (not keywords)
- Produces a precise **Match Score (%)** measuring conceptual alignment with the JD
- Google Gemini identifies **Matched Skills** and **Missing Skills** with priority ranking
- **SerpAPI** auto-discovers the best free learning resource for every skill gap

![Skill & Match Analysis](public/images_readme/Skill_Analysis.gif)

---

### 🤖 AI Virtual Interview (Van)
- **Van** — a voice AI persona powered by browser-native Web Speech API (TTS + STT)
- **Google Gemini 1.5 Pro** generates 5 role-specific, resume-aware questions per session
- Candidates answer naturally by speaking; Van listens and moves to the next question
- Voice commands supported: *"Van, show my score"*, *"Van, download my report"*
- Full Q&A transcript stored in structured `Q: / A:` format for downstream analysis

---

### 📊 Multimodal Evaluation Engine
- **Semantic Score** — candidate answers embedded and compared against JD vectors
- **Speech Analysis** — real WPM, filler word count (um, uh, like…), clarity score
- **Emotion Score** — per-frame DeepFace classification aggregated across the session
- **JD Similarity Score** — overall answer-to-JD text alignment
- **Incompleteness Penalty** — strict score reduction if questions are skipped or session ended early

![Evaluation Report](public/images_readme/Evaluation_Report.gif)

---

### 🛡️ Real-Time Anti-Cheat Proctoring
- **Multiple persons / no face** — detected via `face-api.js`, triggers `CRITICAL` log
- **Mobile phone in frame** — detected via `COCO-SSD` TensorFlow.js, instant 3.5s visual warning
- **Tab switch / focus loss** — captured via `visibilitychange` + `blur` events, logs `WARNING`
- All events are POST'd to the backend with timestamp and severity, stored per session
- Debounced per detection type (15s cooldown) to prevent event spam

![Anti-Cheat Monitor](public/images_readme/Anti_cheating.png)

---

### 📑 Reports & Email Delivery
- Full **Interview Results page** with animated score gauges, per-answer AI feedback, and emotion timeline
- **HD PDF Report** — React component rendered off-screen at 794px (A4), captured at 2x retina scale via `html2pdf.js`
- **"Email My Report"** — PDF encoded as Base64 on the frontend, sent to backend, attached and delivered via **Gmail SMTP/TLS**

![Report Email](public/images_readme/Report_Mail.png)

---

### 🧑‍💻 Candidate Dashboard
- Live stats: Average Score, Total Sessions, Interviews Done, Pending Assessments
- **Application Status Tracker** — shows HR decision (Shortlisted ✅ / Under Review 🔄 / Not Selected ❌) per submission
- **Skill Progress Panel** — live sync of recommendation statuses (Not Started / In Progress / Completed)
- Performance trend charts powered by Recharts
- Profile completion tracker with actionable upgrade prompts

![Candidate Dashboard](public/images_readme/Candidate_Dashboard.gif)

---

### 🏢 HR Command Center

#### Dashboard
- Hiring funnel visualization, score distribution histogram, top-performer feed
- Week-on-week session and application trend charts

![HR Dashboard](public/images_readme/HR_Dashboard.gif)

#### Candidate Management
- Search and filter candidates by name, job, or score
- Full detail panel per candidate: sub-scores, transcript, emotion timeline, anti-cheat summary
- One-click **Shortlist / Reject** with candidate notification

![HR Candidate View](public/images_readme/Candidate_Reportview4HR.png)

#### Job Description Management
- Create, edit, and archive JDs used to auto-generate interview questions
- View the full candidate pool per JD

#### Integrity Monitor
- Anti-cheat events grouped per **interview session** (not just candidate) — so you can isolate violations per date
- 🚩 **FLAGGED** badge auto-applied for sessions with 2+ CRITICAL events
- Filter by severity: `CRITICAL` / `WARNING` / event type

---

### 📞 n8n Call Automation
- Webhook-compatible HR endpoints ready for **n8n.io** workflow integration
- Shortlisted candidates can be auto-queued for phone-screening calls or SMS follow-ups
- Fully removes manual recruiter outreach from early-stage pipeline

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Framer Motion, Recharts |
| Styling | Tailwind CSS (Glassmorphism design system) |
| Backend | FastAPI, SQLAlchemy, Pydantic, Python 3.11 |
| LLM | Google Gemini 1.5 Pro |
| Semantic NLP | Doc2Vec (gensim), Cosine Similarity |
| Computer Vision | YOLOv8 (Ultralytics), DeepFace, face-api.js, COCO-SSD |
| Speech | Web Speech API (STT + TTS) |
| PDF Generation | html2pdf.js + html2canvas |
| Email | Gmail SMTP/TLS |
| Database | PostgreSQL |
| Automation | n8n Workflows |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+, Python 3.11+, PostgreSQL instance
- API Keys: `GEMINI_API_KEY`, `SERPAPI_KEY`, Gmail App Password

### Backend
```bash
cd backend
python -m venv venv && venv\Scripts\activate
pip install -r requirements.txt
# Configure .env (see .env.example)
uvicorn app.main:app --reload
```

### Frontend
```bash
npm install
npm run dev
# Runs at http://localhost:8085
```

---

## 🔌 Key API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/v1/auth/register` | Candidate / HR registration |
| `POST` | `/api/v1/auth/login` | Login & JWT token issue |
| `POST` | `/api/v1/resume/upload` | Upload & parse resume |
| `POST` | `/api/v1/match/` | Semantic resume-JD matching |
| `POST` | `/api/v1/interview/start` | Begin AI interview session |
| `POST` | `/api/v1/interview/end` | End session & trigger evaluation |
| `GET`  | `/api/v1/evaluation/{id}` | Fetch full evaluation results |
| `POST` | `/api/v1/evaluation/{id}/send-email` | Email HD PDF report |
| `POST` | `/api/v1/analysis/anticheat-event` | Log proctoring violation |
| `GET`  | `/api/v1/hr/candidates` | HR: List all candidates |
| `POST` | `/api/v1/hr/decision/{id}` | HR: Shortlist or reject |
| `GET`  | `/api/v1/hr/anticheat` | HR: Integrity monitor events |

---

## 🗺️ Roadmap

- [ ] Mobile responsive layout for Candidate portal
- [ ] Recruiter bulk-action on candidates (multi-select shortlist)
- [ ] Custom scoring weight configuration per JD
- [ ] Webhook-based real-time notification delivery
- [ ] n8n full integration testing and deployment guide
- [ ] Multilingual interview support

---

## 👨‍💻 Author

Built with ❤️ by **Shrey**, demonstrating a complete applied-AI engineering stack from NLP and computer vision to full-stack web development.

---

<div align="center">
  <i>Redefining how talent meets opportunity — one AI conversation at a time.</i>
</div>
