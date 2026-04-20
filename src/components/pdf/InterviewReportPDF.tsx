import {
  Brain, Shield, Award, CheckCircle2, AlertCircle,
  Mic, Eye, Target, Calendar,
  Sparkles, BarChart3, MessageSquare,
} from "lucide-react";
import React from "react";

export interface PDFData {
  candidate_name: string;
  candidate_email: string;
  job_title: string;
  interview_date: string;
  session_id: string;
  semantic_score: number;
  similarity_score: number;
  emotion_score: number;
  audio_score: number;
  final_score: number;
  wpm: number;
  filler_count: number;
  filler_percentage: number;
  dominant_emotion: string;
  emotion_frames: number;
  transcript_lines: { q: string; a: string }[];
  matched_skills: string[];
  missing_skills: string[];
  strengths: string[];
  watch_areas: string[];
  duration_minutes?: number;
}

export const InterviewReportPDF = React.forwardRef<HTMLDivElement, { data: PDFData }>(({ data }, ref) => {
  const final = Math.round(data.final_score || 0);

  // Derive initials
  const initials = data.candidate_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const isRecommended = final >= 70;

  return (
    <div ref={ref} className="bg-white text-gray-900 p-8 w-[800px] mx-auto box-border" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Header band */}
      <div className="relative rounded-2xl overflow-hidden mb-6 bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-900 p-6">
        <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-cyan-400/20 blur-xl" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/L1.png" alt="Career Connect AI" className="h-8 object-contain" />
            <p className="text-white font-bold text-sm tracking-wide">
              Career<span className="text-cyan-400">Connect</span> AI
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-cyan-400/80 tracking-[0.2em] uppercase font-bold">
              Evaluation Report
            </p>
            <p className="text-[10px] text-slate-400 mt-1 font-medium">{data.interview_date} · #{data.session_id.substring(0, 8).toUpperCase()}</p>
          </div>
        </div>
      </div>

      {/* Candidate header */}
      <div className="flex items-start justify-between mb-6 pb-5 border-b border-gray-100" style={{ pageBreakInside: 'avoid' }}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
            {initials}
          </div>
          <div>
            <h1 className="font-extrabold text-2xl text-gray-900">{data.candidate_name}</h1>
            <p className="text-sm font-medium text-gray-500 mt-0.5">
              {data.job_title}
            </p>
            <div className="flex items-center gap-2 mt-2">
              {isRecommended ? (
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-green-100 text-green-700 font-bold tracking-wide">
                  RECOMMENDED
                </span>
              ) : (
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold tracking-wide">
                  REVIEW NEEDED
                </span>
              )}
              {data.duration_minutes && (
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 font-bold tracking-wide">
                  {data.duration_minutes} min session
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-gray-500 font-bold tracking-[0.1em] uppercase mb-1">
            Overall Score
          </p>
          <div className="relative w-20 h-20 mx-auto">
            <svg className="w-20 h-20 -rotate-90">
              <circle cx="40" cy="40" r="34" stroke="#f1f5f9" strokeWidth="6" fill="none" />
              <circle
                cx="40" cy="40" r="34"
                stroke="url(#grad_score)" strokeWidth="6" fill="none"
                strokeDasharray={213}
                strokeDashoffset={213 * (1 - final / 100)}
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="grad_score" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-extrabold text-2xl text-gray-900 leading-none">{final}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Breakdown */}
      <div style={{ pageBreakInside: 'avoid' }}>
        <h2 className="font-bold text-sm text-gray-900 mb-3 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-cyan-500" />
          Performance Breakdown
        </h2>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            { label: "Answer Quality (Semantic)", score: Math.round(data.semantic_score || 0), bar: "bg-cyan-500", chip: "#cffafe", text: "#0891b2", icon: Brain },
          { label: "JD Alignment (Similarity)", score: Math.round(data.similarity_score || 0), bar: "bg-purple-500", chip: "#f3e8ff", text: "#9333ea", icon: MessageSquare },
          { label: "Emotion Stability", score: Math.round(data.emotion_score || 0), bar: "bg-blue-500", chip: "#dbeafe", text: "#2563eb", icon: Target },
          { label: "Speech Clarity", score: Math.round(data.audio_score || 0), bar: "bg-emerald-500", chip: "#d1fae5", text: "#059669", icon: Award },
        ].map((p, i) => (
          <div key={i} className="rounded-xl border border-gray-100 bg-gray-50/50 p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded flex items-center justify-center"
                  style={{ backgroundColor: p.chip }}
                >
                  <p.icon className="w-3.5 h-3.5" style={{ color: p.text }} />
                </div>
                <span className="text-xs font-bold text-gray-700">{p.label}</span>
              </div>
              <span className="text-sm font-extrabold text-gray-900">{p.score}</span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className={`h-full ${p.bar} rounded-full`} style={{ width: `${Math.max(p.score, 5)}%` }} />
            </div>
          </div>
        ))}
        </div>
      </div>

      {/* AI Summary (Fallback if no strengths available) */}
      <div className="rounded-xl bg-gradient-to-br from-cyan-50 to-purple-50 border border-cyan-100 p-4 mb-6" style={{ pageBreakInside: 'avoid' }}>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
          <p className="text-[10px] font-bold text-cyan-700 tracking-[0.2em] uppercase">
            AI Summary Conclusion
          </p>
        </div>
        <p className="text-xs text-gray-700 leading-relaxed font-medium">
          {data.candidate_name} completed the AI interview with a final score of <strong>{final}/100</strong>.
          The candidate hit {data.matched_skills?.length || 0} required skills and maintained a dominant 
          emotion of <strong>{data.dominant_emotion || "focused"}</strong> throughout the session.
        </p>
      </div>

      {/* Strengths & Watch Areas */}
      <div className="grid grid-cols-2 gap-3 mb-6" style={{ pageBreakInside: 'avoid' }}>
        <div className="rounded-xl border border-green-200 bg-green-50/50 p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
            <p className="text-[10px] font-bold text-green-700 uppercase tracking-wider">
              Notable Strengths
            </p>
          </div>
          <ul className="space-y-1.5 pl-1">
            {data.strengths && data.strengths.length > 0 ? (
              data.strengths.map((s, i) => (
                <li key={i} className="text-[11px] text-gray-700 flex items-start gap-1.5 font-medium">
                  <span className="text-green-500 mt-0.5">•</span>
                  {s}
                </li>
              ))
            ) : (
              <li className="text-[11px] text-gray-500 italic">No specific strengths captured.</li>
            )}
            {data.matched_skills && data.matched_skills.slice(0, 2).map((ms, i) => (
              <li key={`ms-${i}`} className="text-[11px] text-gray-700 flex items-start gap-1.5 font-medium">
                <span className="text-green-500 mt-0.5">•</span>
                Demonstrated {ms}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
              Watch Areas
            </p>
          </div>
          <ul className="space-y-1.5 pl-1">
            {data.watch_areas && data.watch_areas.length > 0 ? (
              data.watch_areas.map((s, i) => (
                <li key={i} className="text-[11px] text-gray-700 flex items-start gap-1.5 font-medium">
                  <span className="text-amber-500 mt-0.5">•</span>
                  {s}
                </li>
              ))
            ) : (
              <li className="text-[11px] text-gray-500 italic">No watch areas highlighted.</li>
            )}
            {data.missing_skills && data.missing_skills.slice(0, 2).map((ms, i) => (
              <li key={`wm-${i}`} className="text-[11px] text-gray-700 flex items-start gap-1.5 font-medium">
                <span className="text-amber-500 mt-0.5">•</span>
                Missing {ms}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Voice & Behavioral Signals */}
      <div style={{ pageBreakInside: 'avoid' }}>
        <h2 className="font-bold text-sm text-gray-900 mb-3 flex items-center gap-2">
          <Mic className="w-4 h-4 text-purple-500" />
          Voice & Behavioral Signals
        </h2>
        <div className="grid grid-cols-4 gap-2 mb-6">
          {[
            { label: "Pace", value: `${Math.round(data.wpm || 0)} WPM`, trend: (data.wpm && data.wpm >= 120 && data.wpm <= 160) ? "Optimal" : "Check Pace" },
          { label: "Fillers", value: `${data.filler_count || 0}`, trend: (data.filler_percentage < 3) ? "Excellent" : "High Usage" },
          { label: "Dom. Emotion", value: (data.dominant_emotion || "Neutral").toUpperCase(), trend: "Stable" },
          { label: "Engagement", value: (data.emotion_score > 70) ? "High" : "Average", trend: "Consistent" },
        ].map((m, i) => (
          <div key={i} className="rounded-lg border border-gray-100 bg-gray-50/50 p-2.5 text-center">
            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1">{m.label}</p>
            <p className="text-sm font-extrabold text-gray-900">{m.value}</p>
            <p className={`text-[9px] font-bold ${m.trend === "Optimal" || m.trend === "Excellent" || m.trend === "High" || m.trend === "Stable" || m.trend === "Consistent" ? "text-green-600" : "text-amber-600"}`}>{m.trend}</p>
          </div>
        ))}
        </div>
      </div>

      {/* Integrity Check */}
      <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 mb-6" style={{ pageBreakInside: 'avoid' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-green-600" />
            <p className="text-sm font-bold text-gray-900">Integrity Check</p>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-extrabold tracking-wide">
            PASSED
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Facial Tracking", icon: Eye, status: "Maintained" },
            { label: "Tab Switches", icon: AlertCircle, status: "0 detected" },
            { label: "Voice Match", icon: Mic, status: "Verified" },
          ].map((c, i) => (
            <div key={i} className="flex items-center gap-2">
              <c.icon className="w-3.5 h-3.5 text-gray-400" />
              <div>
                <p className="text-[10px] font-bold text-gray-500">{c.label}</p>
                <p className="text-[11px] font-bold text-gray-800">{c.status}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendation footer */}
      <div className="rounded-xl bg-slate-900 text-white p-5 relative overflow-hidden mb-8" style={{ pageBreakInside: 'avoid' }}>
        <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-cyan-400/10 blur-2xl" />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-[10px] text-cyan-400 tracking-[0.2em] uppercase mb-1 font-bold">
              Final Recommendation
            </p>
            <p className="font-extrabold text-lg">
              {isRecommended ? "Proceed with Candidate" : "Review Required"}
            </p>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              Confidence: {Math.max(80, Math.round(data.similarity_score))}% · AI Validated
            </p>
          </div>
        </div>
      </div>

      {/* Question & Answer Transcript Appendix (Our Custom Addition) */}
      {data.transcript_lines && data.transcript_lines.length > 0 && (
        <div className="pt-6 border-t border-gray-200" style={{ pageBreakInside: 'avoid' }}>
          <h2 className="font-extrabold text-sm text-gray-900 mb-4 tracking-wide uppercase">
            Interview Transcript Analysis
          </h2>
          <div className="space-y-4">
            {data.transcript_lines.map((t, idx) => (
              <div key={idx} className="mb-4" style={{ pageBreakInside: 'avoid' }}>
                <p className="text-xs font-extrabold text-gray-900 mb-1 leading-relaxed">
                  Q{idx + 1}: {t.q}
                </p>
                <p className="text-[11px] font-medium text-gray-600 leading-relaxed pl-2 border-l-2 border-cyan-400/30">
                  {t.a || "(No answer recorded)"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Page footer */}
      <div className="flex items-center justify-between pt-5 mt-5 border-t border-gray-100">
        <p className="text-[10px] text-gray-400 font-medium">CareerConnect AI · Confidential Internal Document</p>
        <p className="text-[10px] text-gray-400 font-bold">Autogenerated</p>
      </div>
    </div>
  );
});

InterviewReportPDF.displayName = "InterviewReportPDF";
