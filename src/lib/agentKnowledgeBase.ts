/**
 * agentKnowledgeBase.ts
 * ─────────────────────
 * Van's in-app knowledge base.
 * Covers every page, feature, and FAQ about Career Connect AI.
 * Used server-side in the Gemini system prompt for grounded responses.
 */

export interface FAQEntry {
  id: string;
  keywords: string[];
  question: string;
  answer: string;
}

export const FAQ_ENTRIES: FAQEntry[] = [
  // ── Authentication ────────────────────────────────────────────────────────
  {
    id: "auth_register",
    keywords: ["register", "sign up", "create account", "new account"],
    question: "How do I create an account?",
    answer:
      "Click 'Get Started' on the landing page or go to the Register page. Enter your full name, email address, and a strong password. After registering, you'll receive a 6-digit OTP to your email. Enter it on the verification page to activate your account.",
  },
  {
    id: "auth_login",
    keywords: ["login", "sign in", "log in", "access account"],
    question: "How do I log in?",
    answer:
      "Go to the Login page from the landing page. Enter your registered email and password. You'll be taken to your dashboard automatically based on your role — candidate or HR.",
  },
  {
    id: "auth_forgot_password",
    keywords: ["forgot password", "reset password", "lost password", "change password", "otp"],
    question: "How do I reset my password?",
    answer:
      "Click 'Forgot Password' on the Login page. Enter your registered email, and Van will send a 6-digit OTP to your inbox. Enter the code, then set your new password. The OTP expires in 10 minutes.",
  },
  {
    id: "auth_verify_email",
    keywords: ["verify email", "verification", "otp email", "confirm email"],
    question: "I didn't receive my verification email. What do I do?",
    answer:
      "Check your spam folder first. On the verification page, you can click 'Resend Code' to get a new OTP. You can resend up to 3 times per hour. Make sure your email address was entered correctly during registration.",
  },

  // ── Candidate Dashboard ────────────────────────────────────────────────────
  {
    id: "dashboard_overview",
    keywords: ["dashboard", "overview", "home", "stats", "score", "summary"],
    question: "What does the candidate dashboard show?",
    answer:
      "Your dashboard shows your profile completeness percentage, the number of interviews completed, your average score, and active skill recommendations. You'll also see a score trend chart showing your performance over time.",
  },
  {
    id: "dashboard_score_trend",
    keywords: ["score trend", "chart", "history chart", "performance trend"],
    question: "What is the score trend chart?",
    answer:
      "The score trend chart on your dashboard shows your interview scores across all past sessions. It helps you see if you're improving over time. Each data point represents one completed AI interview.",
  },

  // ── Resume & JD Matching ──────────────────────────────────────────────────
  {
    id: "resume_upload",
    keywords: ["upload resume", "resume upload", "cv", "pdf upload", "docx"],
    question: "How do I upload my resume?",
    answer:
      "Go to Resume & Match from the sidebar. Click the upload area and select your resume in PDF or DOCX format. The AI will automatically parse it and extract your name, email, skills, experience, and education. This usually takes 2-3 seconds.",
  },
  {
    id: "resume_match",
    keywords: ["match", "job match", "matching", "jd match", "resume match", "hybrid score"],
    question: "How does the resume matching work?",
    answer:
      "After uploading your resume, select a Job Description and click Run Match. The system calculates a Hybrid Score — 60% from cosine similarity between your resume and the JD, and 40% from an AI semantic analysis using GPT-4.1. Higher scores mean better alignment.",
  },
  {
    id: "resume_skill_gaps",
    keywords: ["skill gap", "missing skills", "matched skills", "skill analysis"],
    question: "What do the skill categories mean on the match page?",
    answer:
      "After running a match, you'll see three skill categories: Matched Skills (green) — skills you have that the JD requires. Missing Skills (red) — skills the JD needs that aren't in your resume. Additional Strengths (blue) — skills you have beyond what the JD requires.",
  },
  {
    id: "resume_hybrid_score",
    keywords: ["hybrid score", "cosine", "semantic score", "match score percentage"],
    question: "What is a good hybrid match score?",
    answer:
      "A score above 70% is considered excellent alignment. 50-70% is good — you have most of the required skills. Below 50% suggests significant skill gaps. Focus on learning the missing skills shown in red to improve your score.",
  },

  // ── AI Interview ──────────────────────────────────────────────────────────
  {
    id: "interview_start",
    keywords: ["start interview", "begin interview", "ai interview", "interview"],
    question: "How do I start an AI interview?",
    answer:
      "Go to AI Interview from the sidebar. Allow camera and microphone access when prompted — the interview cannot start without both. Optionally select a Job Description and enter your years of experience. Click Start Interview and follow Van's lead.",
  },
  {
    id: "interview_how_it_works",
    keywords: ["how interview works", "interview process", "interview questions", "how does interview"],
    question: "How does the AI interview work?",
    answer:
      "The AI asks you questions related to your target role. Questions are spoken aloud by Van. You respond verbally — your speech is transcribed in real time. The system records your answer quality, emotional stability via your webcam, and communication clarity via speech analysis.",
  },
  {
    id: "interview_camera_mic",
    keywords: ["camera", "microphone", "webcam", "permission", "allow camera"],
    question: "Why does the interview need my camera and microphone?",
    answer:
      "The camera is used for live emotional analysis — the system detects your confidence level and engagement. The microphone records your spoken answers for transcription and speech analysis. Both are required — without them the interview cannot start.",
  },
  {
    id: "interview_anticheat",
    keywords: ["anti cheat", "cheat detection", "proctoring", "multiple persons", "phone detection"],
    question: "What anti-cheat measures are in place during the interview?",
    answer:
      "The interview uses YOLOv8 computer vision to detect if multiple people are visible or if someone is using a phone. It also monitors if your face leaves the frame. These events are logged and visible to HR reviewers as cheat flags.",
  },
  {
    id: "interview_end",
    keywords: ["end interview", "finish interview", "stop interview", "complete interview"],
    question: "How do I end the interview?",
    answer:
      "Click the 'End Interview' button when you're done. The system will automatically process your evaluation — generating scores, PDF report, and AI insights. You'll be redirected to your results page within a few seconds.",
  },

  // ── Evaluation Results ────────────────────────────────────────────────────
  {
    id: "eval_scores",
    keywords: ["scores", "evaluation", "results", "score breakdown", "final score"],
    question: "What do the evaluation scores mean?",
    answer:
      "Your final score is a composite of four components: Answer Relevance (35%) measures how well your answers matched the role. JD Alignment (30%) measures resume-to-JD similarity. Confidence (20%) is your emotional stability score from DeepFace analysis. Communication (15%) is your speech clarity score based on WPM and filler word usage.",
  },
  {
    id: "eval_emotion_timeline",
    keywords: ["emotion", "emotion timeline", "confident", "happy", "facial emotion", "deepface"],
    question: "What is the emotion timeline on my results page?",
    answer:
      "The emotion timeline shows your detected emotions throughout the interview, grouped in 10-second windows. It uses DeepFace AI to analyze your facial expressions in real time during the interview. Dominant emotions like 'neutral', 'happy', and 'confident' are color-coded.",
  },
  {
    id: "eval_speech",
    keywords: ["speech analysis", "wpm", "filler words", "words per minute", "communication score"],
    question: "What does the speech analysis show?",
    answer:
      "The speech analysis card shows your Words Per Minute (ideal is 100-170 WPM), filler word count (um, uh, basically, like, etc.), and your overall communication score. Lower filler usage and a WPM in the ideal range gives you a higher communication score.",
  },
  {
    id: "eval_pdf",
    keywords: ["pdf", "download report", "pdf report", "evaluation report", "download"],
    question: "How do I download my evaluation report?",
    answer:
      "On your Evaluation Results page, click the 'Download Full PDF Report' button. The report is a 10-section branded document covering your scores, Q&A transcript, speech analysis, emotion analysis, JD alignment, and skill recommendations.",
  },
  {
    id: "eval_insights",
    keywords: ["insights", "top strength", "improve", "ai feedback", "recommendation text"],
    question: "What are the AI insights on my results page?",
    answer:
      "The AI insights section shows your Top Strength and one key area To Improve, generated by our AI based on your interview transcript and scores. These are personalized to your specific performance — not generic feedback.",
  },

  // ── Skills & Recommendations ──────────────────────────────────────────────
  {
    id: "skills_page",
    keywords: ["skills page", "skill recommendations", "training", "learning path", "recommendations"],
    question: "What is the Skills page?",
    answer:
      "The Skills page shows personalized skill recommendations based on your resume-to-JD gap analysis. Each skill card shows what to learn, suggested resources, and estimated time. You can mark skills as 'Start Learning', 'In Progress', or 'Done' to track your learning progress.",
  },
  {
    id: "skills_progress",
    keywords: ["progress", "progress ring", "progress bar", "completion", "mark done"],
    question: "How do I track my skill learning progress?",
    answer:
      "On the Skills page, click 'Start Learning' on a skill card to mark it in progress, then 'Mark Done' when you've completed it. The circular progress ring at the top of the page updates in real time showing your overall completion percentage. Completing all skills turns it emerald green!",
  },

  // ── Assessments ───────────────────────────────────────────────────────────
  {
    id: "assessments_page",
    keywords: ["assessments", "text assessment", "smart interview", "pia", "mcq", "text based"],
    question: "What are Assessments?",
    answer:
      "The Assessments section offers a text-based interview mode called PIA Smart Interview. Unlike the video interview, this uses written scenario questions and MCQs instead of a webcam. It's ideal if you want to practice without camera access.",
  },
  {
    id: "text_assessment",
    keywords: ["text assessment", "written interview", "type answers", "scenario questions"],
    question: "How does the text assessment work?",
    answer:
      "Click on a Text Assessment from the Assessments page. You'll receive scenario-based questions and type your answers. The AI evaluates your typed responses for relevance and quality, similar to the voice interview but without the camera and microphone requirements.",
  },

  // ── Reports ───────────────────────────────────────────────────────────────
  {
    id: "reports_page",
    keywords: ["reports", "past interviews", "interview history", "all reports", "evaluation history"],
    question: "Where can I see all my past interview results?",
    answer:
      "Go to Reports from the sidebar. It shows all your completed interview sessions with their final scores and dates. Click any entry to view the full evaluation result for that session.",
  },

  // ── Profile ───────────────────────────────────────────────────────────────
  {
    id: "profile_page",
    keywords: ["profile", "edit name", "display name", "change name", "account settings"],
    question: "How do I edit my profile?",
    answer:
      "Go to Profile from the sidebar or click your avatar on the top right. You can update your display name and change your password. Changes are saved instantly when you click Update.",
  },

  // ── Navigation commands ───────────────────────────────────────────────────
  {
    id: "nav_dashboard",
    keywords: ["go to dashboard", "open dashboard", "take me to dashboard", "dashboard"],
    question: "Take me to the dashboard",
    answer: "Taking you to your dashboard right now!",
  },
  {
    id: "nav_interview",
    keywords: ["go to interview", "start interview", "open interview", "start an interview"],
    question: "Take me to the interview",
    answer: "Opening the AI Interview page for you!",
  },
  {
    id: "nav_resume",
    keywords: ["go to resume", "open resume match", "upload resume", "resume match page"],
    question: "Take me to the resume page",
    answer: "Taking you to Resume & Match!",
  },
  {
    id: "nav_skills",
    keywords: ["go to skills", "open skills", "skill recommendations page"],
    question: "Take me to the skills page",
    answer: "Opening your Skills & Recommendations page!",
  },
  {
    id: "nav_reports",
    keywords: ["go to reports", "open reports", "show my reports"],
    question: "Take me to reports",
    answer: "Taking you to your Reports!",
  },
  {
    id: "nav_profile",
    keywords: ["go to profile", "open profile", "my profile", "edit profile"],
    question: "Take me to my profile",
    answer: "Opening your Profile settings!",
  },
  {
    id: "nav_assessments",
    keywords: ["go to assessments", "open assessments", "text interview"],
    question: "Take me to assessments",
    answer: "Opening the Assessments section for you!",
  },
];

/** Full text of all FAQs — used to build the Gemini system prompt */
export const FAQ_TEXT_FOR_PROMPT = FAQ_ENTRIES.map(
  (e) => `Q: ${e.question}\nA: ${e.answer}`
).join("\n\n");

/** Page-to-route map for Van's navigation intents */
export const PAGE_ROUTES: Record<string, string> = {
  dashboard: "/candidate/dashboard",
  profile: "/candidate/profile",
  resume: "/candidate/resume",
  interview: "/candidate/interview",
  skills: "/candidate/skills",
  assessments: "/candidate/assessments",
  reports: "/candidate/reports",
  hr_dashboard: "/hr/dashboard",
  login: "/login",
  register: "/register",
  home: "/",
};
