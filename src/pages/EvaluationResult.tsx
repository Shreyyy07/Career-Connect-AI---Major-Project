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

interface EvalData {
  evalID: number;
  sessionID: string;
  semanticScore: number;
  similarityScore: number;
  emotionScore: number;
  audioScore: number;
  finalScore: number;
  reportURL?: string;
}

interface EmotionPoint {
  timestamp_sec: number;
  dominant_emotion: string;
  emotions: Record<string, number>;
}

const glass = 'bg-card/50 backdrop-blur-xl border border-border/50 shadow-lg';

const CircleRing = ({ pct, size = 120, stroke = 9, color = '#6366f1', label, sublabel }:
  { pct: number; size?: number; stroke?: number; color?: string; label?: string; sublabel?: string }) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(100, Math.max(0, pct)) / 100);
  const cx = size / 2;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="hsl(240 8% 18%)" strokeWidth={stroke} />
        <circle cx={cx} cy={cx} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {label && <span className="text-3xl font-display font-bold text-foreground leading-none">{label}</span>}
        {sublabel && <span className="text-xs text-muted-foreground font-medium mt-1 uppercase tracking-widest">{sublabel}</span>}
      </div>
    </div>
  );
};

const Shimmer = ({ className = '' }: { className?: string }) => (
  <div className={`relative overflow-hidden rounded-xl bg-secondary/50 ${className}`}>
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
  </div>
);

const tierFor = (score: number) => {
  if (score >= 70) return { label: 'Excellent Fit', color: '#10b981', glow: 'shadow-[0_0_40px_rgba(16,185,129,0.2)]' };
  if (score >= 45) return { label: 'Moderate Fit', color: '#f59e0b', glow: 'shadow-[0_0_40px_rgba(245,158,11,0.2)]' };
  return { label: 'Needs Polish', color: '#f43f5e', glow: 'shadow-[0_0_40px_rgba(244,63,94,0.2)]' };
};

// Vibrant Neon Emotion Colors
const EMOTION_COLORS: Record<string, string> = {
  happy:   '#10b981', // Emerald
  neutral: '#475569', // Slate
  sad:     '#818cf8', // Indigo
  angry:   '#f43f5e', // Rose
  surprise:'#00e5ff', // Cyan
  fear:    '#fb923c', // Orange
  disgust: '#a78bfa', // Purple
};
const EMOTION_KEYS = ['happy', 'surprise', 'neutral', 'sad', 'angry', 'fear', 'disgust'];

// ── Timeline chart component ─────────────────────────────────────────────────
const EmotionTimeline = ({ timeline }: { timeline: EmotionPoint[] }) => {
  if (!timeline || !timeline.length) return null;

  const buckets: Record<number, Record<string, number>> = {};
  timeline.forEach(pt => {
    const bucket = Math.floor(pt.timestamp_sec / 10) * 10;
    if (!buckets[bucket]) buckets[bucket] = {};
    Object.entries(pt.emotions).forEach(([emotion, score]) => {
      buckets[bucket][emotion] = (buckets[bucket][emotion] || 0) + score;
    });
  });

  const chartData = Object.entries(buckets)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([sec, emotions]) => {
      const total = Object.values(emotions).reduce((s, v) => s + v, 0) || 1;
      const row: Record<string, any> = { time: `${sec}s` };
      EMOTION_KEYS.forEach(k => {
        row[k] = parseFloat((((emotions[k] || 0) / total) * 100).toFixed(1));
      });
      return row;
    });

  const domCounts: Record<string, number> = {};
  timeline.forEach(pt => {
    domCounts[pt.dominant_emotion] = (domCounts[pt.dominant_emotion] || 0) + 1;
  });
  const overallDom = Object.entries(domCounts).sort(([,a],[,b]) => b - a)[0]?.[0] || 'neutral';

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={`${glass} rounded-3xl p-8`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-display font-bold text-foreground mb-1">Emotion Dynamics</h3>
          <p className="text-sm text-muted-foreground">AI Facial analysis across your session.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Overall:</span>
          <span
            className="font-bold uppercase tracking-widest px-3 py-1 rounded-md text-zinc-900 text-xs shadow-lg"
            style={{ background: EMOTION_COLORS[overallDom] ?? '#475569', boxShadow: `0 0 15px ${EMOTION_COLORS[overallDom]}40` }}
          >
            {overallDom}
          </span>
        </div>
      </div>
      
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barCategoryGap="15%" margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#334155' }} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              contentStyle={{ background: 'rgba(15,23,42,0.9)', border: '1px solid #334155', borderRadius: '12px', fontSize: '13px', color: '#fff', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
              itemStyle={{ textTransform: 'capitalize', fontWeight: '600' }}
              formatter={(val: number) => [`${val}%`]}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 15, fontWeight: '500' }}
              formatter={(val) => <span style={{ textTransform: 'capitalize', color: '#94a3b8' }}>{val}</span>}
              iconType="circle"
            />
            {EMOTION_KEYS.map((key, i) => (
              <Bar key={key} dataKey={key} stackId="a" fill={EMOTION_COLORS[key]} 
                radius={i === EMOTION_KEYS.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} 
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap gap-2 mt-6 p-4 rounded-2xl bg-background/40 border border-border/50">
        <span className="text-xs font-bold uppercase text-muted-foreground mr-2 shrink-0 py-1.5 tracking-wider">Frames captured:</span>
        {Object.entries(domCounts)
          .sort(([,a],[,b]) => b - a)
          .slice(0, 5)
          .map(([emotion, count]) => (
            <div
              key={emotion}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold tracking-widest text-zinc-900 uppercase"
              style={{ background: EMOTION_COLORS[emotion] ?? '#475569' }}
            >
              <span>{emotion}</span> <span className="opacity-60 text-black">|</span> <span>{count}</span>
            </div>
          ))}
      </div>
    </motion.div>
  );
};

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
                  </div>
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-2xl">
                      <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><CheckCircle size={14}/> Top Strength</p>
                      <p className="text-sm text-foreground/90 font-medium">
                         {data.semanticScore > data.emotionScore ? 'Your answers were highly relevant contextually to the role expectations.' : 'You maintained strong communication and engagement throughout.'}
                      </p>
                    </div>
                    <div className="bg-amber-500/10 border border-amber-500/20 p-5 rounded-2xl">
                      <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><RefreshCw size={14}/> To Improve</p>
                      <p className="text-sm text-foreground/90 font-medium">
                         {data.similarityScore < 70 ? 'Focus on tailoring your answers using specific vocabulary from the Job Description.' : 'Work on controlling pacing and reducing filler words for better clarity.'}
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
