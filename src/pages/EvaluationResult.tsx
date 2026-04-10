import { useEffect, useState } from 'react';
import { CheckCircle, Download, RefreshCw, BarChart2, ArrowLeft, BrainCircuit } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch, downloadAuthorizedFile } from '../lib/api';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, Cell
} from 'recharts';
import DashboardSidebar from '@/components/DashboardSidebar';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import EmotionTimeline, { EmotionPoint } from '@/components/EmotionTimeline';

interface EvalData {
  evalID: number;
  sessionID: string;
  semanticScore: number;
  similarityScore: number;
  emotionScore: number;
  audioScore: number;
  finalScore: number;
  reportURL?: string;
  // Speech analysis fields
  wpm?: number;
  fillerCount?: number;
  fillerPercentage?: number;
  wordCount?: number;
  dominantEmotion?: string;
  insightsJson?: string;
}

// ── Main component ───────────────────────────────────────────────────────────
export const EvaluationResult = () => {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const evalID = id ? parseInt(id, 10) : 0;
  const navigate = useNavigate();
  const [data, setData] = useState<EvalData | null>(null);
  const [timeline, setTimeline] = useState<EmotionPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retries, setRetries] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const fetchAll = async () => {
      setLoading(true);
      try {
        const res = await apiFetch<EvalData>(`/api/v1/evaluation/${evalID}`);
        if (cancelled) return;
        setData(res);
        try {
          const tl = await apiFetch<EmotionPoint[]>(`/api/v1/analysis/emotion-timeline/${res.sessionID}`);
          if (!cancelled) setTimeline(tl || []);
        } catch (_) {}
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load evaluation');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchAll();
    return () => { cancelled = true; };
  }, [evalID, retries]);

  const tier = data ? tierFor(data.finalScore) : null;

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <DashboardSidebar role={user?.role?.includes('hr') ? 'hr' : 'candidate'} />
      <main className="flex-1 overflow-auto">
        <div className="px-6 py-10 max-w-6xl mx-auto">
          
          {/* Header */}
          <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl lg:text-5xl font-display font-bold text-foreground mb-3 tracking-tight">AI Interview <span className="text-[#00e5ff]">Results</span></h1>
              <p className="text-lg text-muted-foreground max-w-2xl">Holistic evaluation of your semantic, audio, and visual communication.</p>
            </div>
            <button onClick={() => navigate('/candidate/dashboard')} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border bg-secondary hover:bg-secondary/80 text-foreground font-semibold transition-all">
              <ArrowLeft size={16} /> Back to Dashboard
            </button>
          </div>

          {error && (
            <div className="mb-8 px-5 py-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive font-semibold flex items-center gap-3">
              <span className="flex-1">{error}</span>
              <button onClick={() => setRetries(r => r + 1)} className="flex items-center gap-1.5 text-sm hover:text-white transition-colors bg-destructive/20 px-3 py-1.5 rounded-md">
                <RefreshCw size={14} /> Retry
              </button>
            </div>
          )}

          {loading && (
             <div className="space-y-6">
               <Shimmer className="w-full h-80 rounded-3xl" />
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><Shimmer className="h-64 rounded-3xl" /><Shimmer className="h-64 rounded-3xl" /></div>
             </div>
          )}

          {data && tier && !loading && (
            <div className="space-y-6">
              
              {/* Score rings hero */}
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={`${glass} rounded-3xl p-8 lg:p-10 relative overflow-hidden`}>
                <div className={`absolute inset-0 opacity-20 pointer-events-none ${tier.glow}`} />
                <div className="flex flex-col items-center gap-10 md:flex-row md:items-center relative z-10">
                  <div className="flex flex-col items-center gap-5 shrink-0 px-8 py-6 bg-background/40 backdrop-blur-md border border-border rounded-3xl shadow-xl">
                    <CircleRing pct={data.finalScore} size={160} stroke={14} color={tier.color} label={`${Math.round(data.finalScore)}`} sublabel="COMPOSITE" />
                    <span className="text-[11px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full" style={{ background: `${tier.color}20`, color: tier.color, border: `1px solid ${tier.color}40` }}>
                      {tier.label}
                    </span>
                  </div>
                  <div className="flex gap-6 justify-center flex-wrap flex-1">
                    {[
                      { label: 'Semantic', pct: data.semanticScore, color: '#00e5ff' },
                      { label: 'JD Match', pct: data.similarityScore, color: '#8b5cf6' },
                      { label: 'Engagement', pct: data.emotionScore, color: '#f59e0b' },
                      { label: 'Clarity', pct: data.audioScore, color: '#10b981' },
                    ].map(({ label, pct, color }) => (
                      <div key={label} className="flex flex-col items-center gap-3 p-4 rounded-2xl border border-border/40 bg-secondary/20 hover:bg-secondary/40 transition-colors">
                        <CircleRing pct={pct} size={90} stroke={8} color={color} label={`${Math.round(pct)}`} />
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              <EmotionTimeline timeline={timeline} />

              {/* Speech Analysis Card */}
              {(data.wpm != null || data.fillerCount != null) && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                  className={`${glass} rounded-3xl p-8`}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-2xl">🎙️</span>
                    <h3 className="text-xl font-display font-bold text-foreground">Speech Analysis</h3>
                    <span className="ml-auto text-xs font-bold uppercase tracking-widest text-muted-foreground bg-secondary/60 px-3 py-1 rounded-full border border-border">
                      Transcript-Based
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* WPM */}
                    <div className="bg-background/40 rounded-2xl p-5 border border-border text-center">
                      <p className="text-3xl font-display font-bold mb-1"
                        style={{ color: (data.wpm || 0) >= 100 && (data.wpm || 0) <= 170 ? '#10b981' : '#f59e0b' }}>
                        {Math.round(data.wpm || 0)}
                      </p>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Words / Min</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">Ideal: 100–170</p>
                    </div>

                    {/* Filler Words */}
                    <div className="bg-background/40 rounded-2xl p-5 border border-border text-center">
                      <p className="text-3xl font-display font-bold mb-1"
                        style={{ color: (data.fillerCount || 0) <= 5 ? '#10b981' : (data.fillerCount || 0) <= 15 ? '#f59e0b' : '#f43f5e' }}>
                        {data.fillerCount ?? 0}
                      </p>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Filler Words</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">
                        {(data.fillerPercentage || 0).toFixed(1)}% of speech
                      </p>
                    </div>

                    {/* Total Words */}
                    <div className="bg-background/40 rounded-2xl p-5 border border-border text-center">
                      <p className="text-3xl font-display font-bold text-sky-400 mb-1">{data.wordCount ?? 0}</p>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Total Words</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">Across all answers</p>
                    </div>

                    {/* Communication Score */}
                    <div className="bg-background/40 rounded-2xl p-5 border border-border text-center">
                      <p className="text-3xl font-display font-bold mb-1"
                        style={{ color: data.audioScore >= 70 ? '#10b981' : data.audioScore >= 45 ? '#f59e0b' : '#f43f5e' }}>
                        {Math.round(data.audioScore)}%
                      </p>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Clarity Score</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">Communication</p>
                    </div>
                  </div>

                  {/* WPM bar */}
                  <div className="mt-5">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                      <span>Speaking Pace</span>
                      <span className="font-mono font-bold">{Math.round(data.wpm || 0)} WPM</span>
                    </div>
                    <div className="h-2 bg-secondary/80 rounded-full overflow-hidden border border-border">
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{
                          width: `${Math.min(100, ((data.wpm || 0) / 250) * 100)}%`,
                          background: (data.wpm || 0) >= 100 && (data.wpm || 0) <= 170
                            ? 'linear-gradient(90deg, #10b981, #34d399)'
                            : 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground/50 mt-1">
                      <span>Too slow (60)</span><span className="text-emerald-500/70">Ideal zone (100-170)</span><span>Too fast (250+)</span>
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Score Breakdown Bars */}
                <motion.div initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className={`${glass} rounded-3xl p-8`}>
                  <div className="flex items-center gap-3 mb-6">
                     <BarChart2 className="w-6 h-6 text-indigo-400" />
                     <h3 className="text-xl font-display font-bold text-foreground">Score Weightings</h3>
                  </div>
                  <div className="space-y-6">
                    {[
                      { label: 'Answer Relevance (Semantic)', pct: data.semanticScore, w: '35%', color: 'from-[#00e5ff]/50 to-[#00e5ff]' },
                      { label: 'JD Requirement Alignment', pct: data.similarityScore, w: '30%', color: 'from-indigo-500/50 to-indigo-500' },
                      { label: 'Confidence & Fluency', pct: data.emotionScore, w: '20%', color: 'from-amber-400/50 to-amber-400' },
                      { label: 'Communication Clarity', pct: data.audioScore, w: '15%', color: 'from-emerald-400/50 to-emerald-400' },
                    ].map((row, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="font-semibold text-foreground">{row.label}</span>
                          <div className="text-right">
                             <span className="text-muted-foreground text-xs mr-2">{row.w} weight</span>
                             <span className="font-bold font-mono text-zinc-300">{Math.round(row.pct)}%</span>
                          </div>
                        </div>
                        <div className="h-2.5 bg-secondary/80 rounded-full overflow-hidden border border-border">
                          <div className={`h-full rounded-full bg-gradient-to-r ${row.color}`} style={{ width: `${Math.round(row.pct)}%`, transition: 'width 1s ease-out' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* What This Means summary box */}
                <motion.div initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className={`${glass} rounded-3xl p-8 flex flex-col`}>
                  <div className="flex items-center gap-3 mb-6">
                     <BrainCircuit className="w-6 h-6 text-[#00e5ff]" />
                     <h3 className="text-xl font-display font-bold text-foreground">Actionable Insights</h3>
                     <span className="ml-auto text-[10px] font-bold uppercase tracking-widest text-[#00e5ff] bg-[#00e5ff]/10 px-2.5 py-1 rounded-full border border-[#00e5ff]/20">
                       AI Generated
                     </span>
                  </div>
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-2xl">
                      <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><CheckCircle size={14}/> Top Strength</p>
                      <p className="text-sm text-foreground/90 font-medium">
                         {(() => {
                           try {
                             if (data.insightsJson) {
                               const parsed = JSON.parse(data.insightsJson);
                               if (parsed.topStrength) return parsed.topStrength;
                             }
                           } catch { /* ignore */ }
                           return data.semanticScore > data.emotionScore ? 'Your answers were highly relevant contextually to the role expectations.' : 'You maintained strong communication and engagement throughout.';
                         })()}
                      </p>
                    </div>
                    <div className="bg-amber-500/10 border border-amber-500/20 p-5 rounded-2xl">
                      <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><RefreshCw size={14}/> To Improve</p>
                      <p className="text-sm text-foreground/90 font-medium">
                         {(() => {
                           try {
                             if (data.insightsJson) {
                               const parsed = JSON.parse(data.insightsJson);
                               if (parsed.toImprove) return parsed.toImprove;
                             }
                           } catch { /* ignore */ }
                           return data.similarityScore < 70 ? 'Focus on tailoring your answers using specific vocabulary from the Job Description.' : 'Work on controlling pacing and reducing filler words for better clarity.';
                         })()}
                      </p>
                    </div>
                    <div className="bg-indigo-500/10 border border-indigo-500/20 p-5 rounded-2xl md:col-span-2 mt-auto">
                      <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">Next Step</p>
                      <p className="text-sm text-foreground/90 font-medium pb-2 border-b border-indigo-500/20 mb-3">
                        Review your full AI-generated dossier PDF, or head over to the Resume Match section to compute specific skill gaps for this profile.
                      </p>
                      <div className="flex flex-wrap gap-3 mt-1">
                         {data.reportURL && (
                           <button onClick={() => downloadAuthorizedFile(data.reportURL!, `CCAI_Report_${data.sessionID.slice(0,8)}.pdf`)}
                             className="flex-1 text-center py-2.5 rounded-xl font-bold text-sm bg-indigo-500 hover:bg-indigo-600 text-white transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2">
                             <Download size={16} /> Download Full PDF
                           </button>
                         )}
                         <button onClick={() => navigate('/candidate/interview')} className="flex-1 py-2.5 rounded-xl font-bold text-sm border border-border bg-background hover:bg-secondary text-foreground transition-all flex items-center justify-center gap-2">
                           <RefreshCw size={16} /> Retake
                         </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

            </div>
          )}
        </div>
      </main>
    </div>
  );
};
