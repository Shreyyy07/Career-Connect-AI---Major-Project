import { useEffect, useState } from 'react';
import { CheckCircle, Download, RefreshCw, BarChart2, ArrowLeft } from 'lucide-react';
import { apiFetch } from '../lib/api';

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

interface EvaluationResultProps {
  evalID: number;
  onRetake: () => void;
  onDashboard: () => void;
}

const glass = 'bg-white/70 backdrop-blur-sm border border-slate-200/50';

// SVG ring (same as ResumeMatch)
const CircleRing = ({ pct, size = 120, stroke = 9, color = '#6366f1', trackColor = '#e2e8f0', label, sublabel }:
  { pct: number; size?: number; stroke?: number; color?: string; trackColor?: string; label?: string; sublabel?: string }) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(100, Math.max(0, pct)) / 100);
  const cx = size / 2;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
        <circle cx={cx} cy={cx} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(0.4,0,0.2,1)' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {label && <span className="text-2xl font-bold text-slate-900 leading-none">{label}</span>}
        {sublabel && <span className="text-xs text-slate-400 mt-0.5">{sublabel}</span>}
      </div>
    </div>
  );
};

const Shimmer = ({ className = '' }: { className?: string }) => (
  <div className={`relative overflow-hidden rounded-xl bg-slate-200/60 ${className}`}>
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
  </div>
);

const tierFor = (score: number) => {
  if (score >= 70) return { label: 'Excellent', color: '#10b981', track: '#d1fae5', text: 'text-emerald-700', ring: 'ring-emerald-200/60', bg: 'bg-emerald-50/70' };
  if (score >= 45) return { label: 'Good', color: '#f59e0b', track: '#fef3c7', text: 'text-amber-700', ring: 'ring-amber-200/60', bg: 'bg-amber-50/70' };
  return { label: 'Needs Improvement', color: '#f43f5e', track: '#ffe4e6', text: 'text-rose-700', ring: 'ring-rose-200/60', bg: 'bg-rose-50/70' };
};

export const EvaluationResult = ({ evalID, onRetake, onDashboard }: EvaluationResultProps) => {
  const [data, setData] = useState<EvalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retries, setRetries] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await apiFetch<EvalData>(`/api/v1/evaluation/${evalID}`);
        if (!cancelled) setData(res);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load evaluation');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetch();
    return () => { cancelled = true; };
  }, [evalID, retries]);

  const tier = data ? tierFor(data.finalScore) : null;

  return (
    <div className="min-h-screen px-4 py-10 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2">Interview Results</h1>
          <p className="text-slate-500">Here's how you performed in your AI interview session.</p>
        </div>
        <button onClick={onDashboard} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors">
          <ArrowLeft size={15} /> Dashboard
        </button>
      </div>

      {error && (
        <div className="mb-6 px-5 py-3.5 rounded-xl bg-rose-50/80 border border-rose-200/60 text-rose-700 flex items-center gap-3">
          <span className="flex-1">{error}</span>
          <button onClick={() => setRetries(r => r + 1)} className="flex items-center gap-1.5 text-sm font-semibold hover:text-rose-900 transition-colors">
            <RefreshCw size={13} /> Retry
          </button>
        </div>
      )}

      {loading && (
        <div className="space-y-5">
          <div className={`${glass} rounded-2xl p-8`}>
            <div className="flex flex-col md:flex-row items-center gap-8">
              <Shimmer className="w-36 h-36 rounded-full shrink-0" />
              <div className="flex gap-8 flex-wrap justify-center flex-1">
                {[0,1,2,3].map(i => (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <Shimmer className="w-24 h-24 rounded-full" />
                    <Shimmer className="h-3 w-20" />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className={`${glass} rounded-2xl p-6`}>
            <Shimmer className="h-5 w-40 mb-4" />
            {[0,1,2].map(i => <Shimmer key={i} className="h-3 w-full mb-2" />)}
          </div>
        </div>
      )}

      {data && tier && !loading && (
        <div className="space-y-6">
          {/* Score rings hero */}
          <div className={`${glass} rounded-2xl p-8 shadow-sm`}>
            <div className="flex flex-col items-center gap-8 md:flex-row md:items-center">
              {/* Primary ring */}
              <div className="flex flex-col items-center gap-3 shrink-0">
                <CircleRing pct={data.finalScore} size={150} stroke={12} color={tier.color} trackColor={tier.track}
                  label={`${Math.round(data.finalScore)}`} sublabel="%" />
                <span className={`text-sm font-bold uppercase tracking-wider px-4 py-1.5 rounded-full ring-1 ${tier.ring} ${tier.text} ${tier.bg}`}>
                  {tier.label}
                </span>
              </div>

              {/* Secondary rings */}
              <div className="flex gap-6 justify-center flex-wrap flex-1">
                {[
                  { label: 'Answer Relevance', pct: data.semanticScore, color: '#8b5cf6', track: '#ede9fe' },
                  { label: 'JD Alignment', pct: data.similarityScore, color: '#06b6d4', track: '#cffafe' },
                  { label: 'Confidence', pct: data.emotionScore, color: '#f59e0b', track: '#fef3c7' },
                  { label: 'Communication', pct: data.audioScore, color: '#10b981', track: '#d1fae5' },
                ].map(({ label, pct, color, track }) => (
                  <div key={label} className="flex flex-col items-center gap-2">
                    <CircleRing pct={pct} size={100} stroke={9} color={color} trackColor={track}
                      label={`${Math.round(pct)}`} sublabel="%" />
                    <p className="text-sm font-semibold text-slate-500 text-center">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Score breakdown table */}
          <div className={`${glass} rounded-2xl p-6 shadow-sm`}>
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <BarChart2 size={18} className="text-indigo-500" /> Score Breakdown
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Answer Relevance', score: data.semanticScore, weight: '35%', color: 'bg-violet-500' },
                { label: 'JD Alignment', score: data.similarityScore, weight: '30%', color: 'bg-cyan-500' },
                { label: 'Confidence & Fluency', score: data.emotionScore, weight: '20%', color: 'bg-amber-500' },
                { label: 'Communication Clarity', score: data.audioScore, weight: '15%', color: 'bg-emerald-500' },
              ].map(({ label, score, weight, color }) => (
                <div key={label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-slate-700">{label}</span>
                    <span className="text-slate-500">{weight} weight · <span className="font-bold text-slate-800">{Math.round(score)}%</span></span>
                  </div>
                  <div className="w-full bg-slate-100/80 rounded-full h-2">
                    <div className={`h-2 rounded-full ${color} transition-all duration-700`} style={{ width: `${Math.min(100, score)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* What the scores mean */}
          <div className={`${glass} rounded-2xl p-6 shadow-sm`}>
            <h3 className="text-lg font-bold text-slate-800 mb-3">What This Means</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-4 bg-white/50 rounded-xl border border-slate-100/80">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-1">Strength</p>
                <p className="text-sm text-slate-600">
                  {data.semanticScore >= 60
                    ? 'Your answers demonstrated strong semantic relevance to the job requirements.'
                    : data.similarityScore >= 60
                    ? 'Your experience aligns well with the job description.'
                    : 'You showed genuine interest and engagement throughout the interview.'}
                </p>
              </div>
              <div className="p-4 bg-white/50 rounded-xl border border-slate-100/80">
                <p className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-1">To Improve</p>
                <p className="text-sm text-slate-600">
                  {data.semanticScore < 50
                    ? 'Focus on tailoring your answers more closely to the job role and its requirements.'
                    : data.emotionScore < 50
                    ? 'Try to show more enthusiasm and emotional engagement in your delivery.'
                    : 'Continue building domain-specific skills to boost your JD match score.'}
                </p>
              </div>
              <div className="p-4 bg-white/50 rounded-xl border border-slate-100/80">
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-1">Next Step</p>
                <p className="text-sm text-slate-600">
                  {data.finalScore >= 70
                    ? 'Great performance! Check the Resume Match section to see which skills to polish next.'
                    : 'Head to the Skill Gap section to work on the missing skills before your next attempt.'}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            {data.reportURL && (
              <a href={data.reportURL} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-indigo-600 text-white hover:bg-indigo-700 transition-all duration-200 shadow-sm shadow-indigo-200/50">
                <Download size={15} /> Download PDF Report
              </a>
            )}
            <button onClick={onRetake}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-slate-700 border border-slate-200/70 bg-white/60 hover:bg-white/80 transition-all duration-200 shadow-sm">
              <RefreshCw size={15} /> Retake Interview
            </button>
            <button onClick={onDashboard}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-slate-700 border border-slate-200/70 bg-white/60 hover:bg-white/80 transition-all duration-200 shadow-sm">
              <CheckCircle size={15} /> Back to Dashboard
            </button>
          </div>

          <p className="text-xs text-slate-400 text-center pt-2">
            Session ID: <span className="font-mono">{data.sessionID}</span> · Eval #{data.evalID} ·{' '}
            <span className="italic">Phase 1 scoring — emotion & audio will use ML models in Phase 3</span>
          </p>
        </div>
      )}
    </div>
  );
};
