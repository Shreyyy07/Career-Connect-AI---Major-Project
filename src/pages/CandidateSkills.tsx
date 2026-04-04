import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Sparkles, CheckCircle, Zap, BookOpen, AlertCircle, Bookmark, ArrowRight, Award, FileText } from 'lucide-react';
import DashboardSidebar from '@/components/DashboardSidebar';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import { motion } from 'framer-motion';

const glass = 'bg-card/50 backdrop-blur-xl border border-border/50 shadow-lg';

// ─── SVG Circular Progress Ring ───────────────────────────────────────────────
const CircleRing = ({ pct, size = 120, stroke = 9, color = '#6366f1', trackColor = '#e2e8f0', label, sublabel }:
  { pct: number; size?: number; stroke?: number; color?: string; trackColor?: string; label?: string; sublabel?: string }) => {
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
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {label && <span className="text-3xl font-display font-bold text-foreground leading-none">{label}</span>}
        {sublabel && <span className="text-xs text-muted-foreground mt-1 font-medium">{sublabel}</span>}
      </div>
    </div>
  );
};

const ResourceIcon = ({ type, size = 16 }: { type: string; size?: number }) => {
  const t = (type || '').toLowerCase();
  if (t.includes('video')) return <BookOpen size={size} className="text-violet-400" />;
  if (t.includes('cert')) return <Award size={size} className="text-amber-400" />;
  return <FileText size={size} className="text-[#00e5ff]" />;
};

const RecCard = ({ r, index }: { r: any, index: number }) => {
  const [statusBusy, setStatusBusy] = useState(false);
  const [status, setStatus] = useState(r.status);
  const isHigh = r.impact === 'high';
  const isDone = status === 'completed';

  const markDone = async () => {
    setStatusBusy(true);
    try {
      const newStatus = isDone ? 'pending' : 'completed';
      const updated = await apiFetch<any>(`/api/v1/recommendations/${r.recID}/status`, {
        method: 'POST', body: JSON.stringify({ status: newStatus }),
      });
      setStatus(updated.status);
    } catch { /* ignore */ }
    finally { setStatusBusy(false); }
  };

  const handleStart = async () => {
    try {
      if (status === 'pending') {
         await apiFetch<any>(`/api/v1/recommendations/${r.recID}/status`, {
          method: 'POST', body: JSON.stringify({ status: 'in_progress' }),
        });
        setStatus('in_progress');
      }
      const res = await apiFetch<any>(`/api/v1/recommendations/${r.recID}/resource-url`);
      if (res?.url) window.open(res.url, '_blank', 'noopener');
    } catch { /* ignore */ }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`group relative rounded-2xl p-6 transition-all duration-300 ${glass} ${
        isDone ? 'border-emerald-500/30 bg-emerald-950/20' : 
        isHigh ? 'border-indigo-500/50 hover:border-indigo-400/80 hover:shadow-[0_0_30px_rgba(99,102,241,0.15)] bg-gradient-to-br from-indigo-950/40 to-transparent' : 
        'hover:border-border hover:bg-secondary/40'
      }`}
    >
      {isHigh && !isDone && (
         <div className="absolute top-0 right-6 -translate-y-1/2 bg-indigo-500 text-white text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5">
           <Zap size={12} className="fill-white" /> High Impact
         </div>
      )}

      <div className="flex items-start gap-4 mb-5">
         <div className={`p-3 rounded-xl shrink-0 ${isHigh ? 'bg-indigo-500/20 border border-indigo-500/30' : 'bg-secondary border border-border'}`}>
           <ResourceIcon type={r.resourceType} size={20} />
         </div>
         <div>
            <h3 className="font-display font-bold text-xl text-foreground mb-1 leading-tight">{r.skill}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{r.topicDescription}</p>
         </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-background/50 rounded-xl p-3 border border-border/50">
           <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Resource</p>
           <p className="text-sm font-semibold text-foreground capitalize">{r.resourceType || 'Online Course'}</p>
        </div>
        <div className="bg-background/50 rounded-xl p-3 border border-border/50">
           <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Est. Time</p>
           <p className="text-sm font-semibold text-foreground">{r.estimatedTime || 'Self-paced'}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-auto">
         <button 
           onClick={handleStart}
           className={`flex-1 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
             isDone ? 'bg-secondary text-foreground hover:bg-secondary/80' : 
             'bg-[#00e5ff]/10 text-[#00e5ff] border border-[#00e5ff]/30 hover:bg-[#00e5ff]/20'
           }`}
         >
            {isDone ? 'Review Material' : 'Start Learning'} <ArrowRight size={16} />
         </button>
         
         <button 
           onClick={markDone} disabled={statusBusy}
           className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-all border ${
             isDone ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-secondary border-border text-muted-foreground hover:text-foreground hover:border-border/80'
           }`}
         >
           <CheckCircle size={20} className={isDone ? 'fill-emerald-500/20' : ''} />
         </button>
      </div>
    </motion.div>
  );
};

export default function CandidateSkills() {
  const { user } = useAuth();
  const location = useLocation();
  const [matchResult, setMatchResult] = useState(() => {
    if (location.state?.matchResult) {
      localStorage.setItem('latestMatchResult', JSON.stringify(location.state.matchResult));
      return location.state.matchResult;
    }
    try {
      const saved = localStorage.getItem('latestMatchResult');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  useEffect(() => {
    if (location.state?.matchResult) {
      setMatchResult(location.state.matchResult);
      localStorage.setItem('latestMatchResult', JSON.stringify(location.state.matchResult));
    }
  }, [location.state]);

  if (!matchResult) {
    return (
      <div className="flex min-h-screen bg-background">
        <DashboardSidebar role={user?.role?.includes('hr') ? 'hr' : 'candidate'} />
        <main className="flex-1 overflow-auto flex items-center justify-center p-8">
          <div className="text-center max-w-md">
             <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6 border border-border">
                <AlertCircle className="w-10 h-10 text-muted-foreground" />
             </div>
             <h2 className="font-display text-2xl font-bold mb-3 text-foreground">No Match Data Found</h2>
             <p className="text-muted-foreground mb-8">You need to compute a match between a Resume and a Job Description to see your skill gaps.</p>
             <Link to="/candidate/resume" className="inline-flex items-center justify-center px-6 py-3 bg-[#00e5ff] text-black font-bold rounded-xl hover:bg-[#00e5ff]/90 glow-primary transition-all">
                Go to Resume Match
             </Link>
          </div>
        </main>
      </div>
    );
  }

  const recommendations = matchResult.details?.recommendations || [];
  const overlap = matchResult.skillOverlap || { matched: [], missing: [], extra: [] };
  
  const tier = matchResult?.details?.tier as 'green' | 'amber' | 'red' | undefined;
  const tierConfig = {
    green: { label: 'Strong Fit', ring: '#10b981', glow: 'shadow-[0_0_40px_rgba(16,185,129,0.2)]' },
    amber: { label: 'Moderate Fit', ring: '#f59e0b', glow: 'shadow-[0_0_40px_rgba(245,158,11,0.2)]' },
    red:   { label: 'Low Fit', ring: '#f43f5e', glow: 'shadow-[0_0_40px_rgba(244,63,94,0.2)]' },
  }[tier ?? 'red'];

  const hybridScore = Math.round(matchResult.hybridScore || 0);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <DashboardSidebar role={user?.role?.includes('hr') ? 'hr' : 'candidate'} />
      <main className="flex-1 overflow-auto">
         <div className="max-w-7xl mx-auto p-8 lg:p-10">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
               <div>
                  <h1 className="font-display text-4xl lg:text-5xl font-bold tracking-tight mb-3">Skill <span className="text-[#00e5ff]">Analysis</span></h1>
                  <p className="text-lg text-muted-foreground">Detailed breakdown of your compatibility with the selected role.</p>
               </div>
               <Link to="/candidate/resume" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-semibold border border-border transition-all">
                 <Bookmark size={16} /> Re-evaluate Another Role
               </Link>
            </motion.div>

            {/* Top Stats Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
               {/* Main Score Hero */}
               <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={`col-span-1 lg:col-span-1 ${glass} rounded-3xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden`}>
                  <div className={`absolute inset-0 opacity-20 ${tierConfig.glow} pointer-events-none`} />
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-bold mb-6">Overall Compatibility</p>
                  <CircleRing pct={hybridScore} size={180} stroke={14} color={tierConfig.ring} trackColor="hsl(240 5% 15%)" label={`${hybridScore}`} sublabel="SCORE" />
                  <div className="mt-6 inline-flex px-4 py-1.5 rounded-full border bg-background/50 backdrop-blur-sm shadow-sm" style={{ borderColor: tierConfig.ring, color: tierConfig.ring }}>
                     <span className="text-sm font-bold tracking-wide uppercase">{tierConfig.label}</span>
                  </div>
               </motion.div>

               {/* Metrics & Missing */}
               <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className={`col-span-1 lg:col-span-2 ${glass} rounded-3xl p-8 flex flex-col`}>
                  <h3 className="font-display text-2xl font-bold mb-6">Metrics Breakdown</h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                     <div className="bg-background/40 rounded-2xl p-4 border border-border text-center">
                        <p className="text-3xl font-display font-bold text-indigo-400 mb-1">{Math.round(matchResult.geminiScore || 0)}%</p>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Semantic Match</p>
                     </div>
                     <div className="bg-background/40 rounded-2xl p-4 border border-border text-center">
                        <p className="text-3xl font-display font-bold text-sky-400 mb-1">{Math.round((matchResult.cosineScore || 0)*100)}%</p>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Keyword Match</p>
                     </div>
                     <div className="bg-background/40 rounded-2xl p-4 border border-border text-center">
                        <p className="text-3xl font-display font-bold text-emerald-400 mb-1">{overlap.matched?.length || 0}</p>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Skills Validated</p>
                     </div>
                     <div className="bg-background/40 rounded-2xl p-4 border border-border text-center">
                        <p className="text-3xl font-display font-bold text-rose-400 mb-1">{overlap.missing?.length || 0}</p>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Critical Gaps</p>
                     </div>
                  </div>

                  <div className="mt-auto">
                     <div className="flex items-center gap-2 mb-3">
                        <AlertCircle className="w-4 h-4 text-rose-400" />
                        <h4 className="text-sm font-bold text-foreground">Missing Requirements</h4>
                     </div>
                     <div className="flex flex-wrap gap-2">
                        {overlap.missing?.length === 0 ? (
                           <span className="text-sm text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 font-medium">None! Covering all bases.</span>
                        ) : (
                           overlap.missing?.map((s: string, i: number) => (
                              <span key={i} className="text-sm bg-rose-500/10 text-rose-400 border border-rose-500/20 px-3 py-1.5 rounded-lg font-medium shadow-sm">{s}</span>
                           ))
                        )}
                     </div>
                  </div>
               </motion.div>
            </div>

            {/* Recommendations Grid */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
               <div className="flex items-center justify-between mb-6 mt-12">
                  <h2 className="font-display text-3xl font-bold flex items-center gap-3">
                     <BookOpen className="text-indigo-400 w-8 h-8" />
                     Personalised Learning Path
                  </h2>
                  <span className="hidden sm:inline-flex bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-4 py-1.5 rounded-full text-sm font-bold tracking-wide">
                     {recommendations.length} Action Items
                  </span>
               </div>
               
               {recommendations.length === 0 ? (
                  <div className={`${glass} rounded-3xl p-12 text-center flex flex-col items-center justify-center max-w-2xl mx-auto mt-10`}>
                     <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
                        <CheckCircle className="w-10 h-10 text-emerald-400" />
                     </div>
                     <h3 className="text-2xl font-bold text-foreground mb-2">You're Fully Equipped</h3>
                     <p className="text-muted-foreground">Your resume indicates you meet or exceed all the required skills for this position. You are ready for the interview staging!</p>
                     <Link to="/candidate/interview" className="mt-8 px-8 py-3 bg-[#00e5ff] text-black font-bold rounded-xl hover:bg-[#00cce6] transition-all glow-primary inline-flex items-center gap-2">
                        Start AI Interview <ArrowRight className="w-5 h-5" />
                     </Link>
                  </div>
               ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {recommendations.map((r: any, i: number) => (
                        <RecCard key={r.recID || i} r={r} index={i} />
                     ))}
                  </div>
               )}
            </motion.div>

         </div>
      </main>
    </div>
  );
}
