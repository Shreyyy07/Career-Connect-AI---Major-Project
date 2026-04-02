import { useEffect, useState } from 'react';
import {
  FileUp, Briefcase, Sparkles, RefreshCw, Users,
  BookOpen, FileText, Award, ChevronDown, ChevronUp,
  Zap, CheckCircle, ArrowRight, TrendingUp, ExternalLink, Loader2,
  GraduationCap, Mail, Phone, Code, User as UserIcon
} from 'lucide-react';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import DashboardSidebar from '@/components/DashboardSidebar';

type ResumeListItem = { resumeID: number; filename: string; created_at: string };
type JDListItem = { jobID: number; title: string; status: string; skills?: string };
type RecruiterMatchRow = {
  candidateUserID: number;
  resumeID: number;
  cosineScore: number;
  geminiScore: number;
  hybridScore: number;
  tier: 'green' | 'amber' | 'red';
  matchedSkills: string[];
  missingSkills: string[];
  candidateName?: string;
};

// ─── Shared glass class (dark theme) ─────────────────────────────────────────
const glass = 'bg-card/60 backdrop-blur-sm border border-border/50 shadow-lg';

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
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {label && <span className="text-2xl font-bold text-foreground leading-none">{label}</span>}
        {sublabel && <span className="text-sm text-muted-foreground mt-0.5">{sublabel}</span>}
      </div>
    </div>
  );
};

// ─── Shimmer skeleton ─────────────────────────────────────────────────────────
const Shimmer = ({ className = '' }: { className?: string }) => (
  <div className={`relative overflow-hidden rounded-xl bg-secondary/50 ${className}`}>
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
  </div>
);
const MatchSkeleton = () => (
  <div className="space-y-5">
    <div className={`${glass} rounded-2xl p-8`}>
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
        <Shimmer className="w-36 h-36 shrink-0 rounded-full" />
        <div className="flex-1 space-y-3 w-full">
          {[0, 1, 2].map(i => <Shimmer key={i} className={`h-3 ${i === 1 ? 'w-full' : i === 0 ? 'w-2/3' : 'w-4/6'}`} />)}
        </div>
      </div>
    </div>
    <div className={`${glass} rounded-2xl p-6`}>
      <Shimmer className="h-5 w-32 mb-4" />
      <div className="grid grid-cols-3 gap-4">
        {[0,1,2].map(i => <div key={i} className="space-y-2"><Shimmer className="h-3 w-16" />{[0,1,2].map(j => <Shimmer key={j} className="h-5 w-14" />)}</div>)}
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {[0,1,2].map(i => <div key={i} className={`${glass} rounded-2xl p-5 space-y-3`}><div className="flex justify-between"><Shimmer className="h-5 w-28" /><Shimmer className="h-5 w-12 rounded-full" /></div><Shimmer className="h-3 w-full" /><Shimmer className="h-3 w-4/5" /><div className="flex gap-2"><Shimmer className="h-9 flex-1 rounded-xl" /><Shimmer className="h-9 flex-1 rounded-xl" /></div></div>)}
    </div>
  </div>
);

// ─── Section label helper ─────────────────────────────────────────────────────
const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">{children}</p>
);

// ─── Resource icon ────────────────────────────────────────────────────────────
const ResourceIcon = ({ type, size = 14 }: { type: string; size?: number }) => {
  const t = (type || '').toLowerCase();
  if (t.includes('video')) return <BookOpen size={size} className="text-violet-500" />;
  if (t.includes('cert')) return <Award size={size} className="text-amber-500" />;
  return <FileText size={size} className="text-blue-500" />;
};

// ─── Status pill ──────────────────────────────────────────────────────────────
const StatusPill = ({ status }: { status: string }) => {
  const cfg: Record<string, string> = {
    completed:   'bg-emerald-900/30 text-emerald-400 border-emerald-700/40',
    in_progress: 'bg-amber-900/30 text-amber-400 border-amber-700/40',
    pending:     'bg-secondary text-muted-foreground border-border',
  };
  const labels: Record<string, string> = { completed: 'Completed', in_progress: 'In Progress', pending: 'Not Started' };
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg[status] ?? cfg.pending}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === 'completed' ? 'bg-emerald-400' : status === 'in_progress' ? 'bg-amber-400' : 'bg-muted-foreground'}`} />
      {labels[status] ?? 'Not Started'}
    </span>
  );
};

// ─── Recommendation Card ──────────────────────────────────────────────────────
const RecCard = ({ r, onUpdate, onError }: { r: any; onUpdate: (rec: any) => void; onError: (msg: string) => void }) => {
  const [open, setOpen] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const [linkBusy, setLinkBusy] = useState(false);
  const isHigh = r.impact === 'high';
  const isDone = r.status === 'completed';

  const updateStatus = async (status: string) => {
    setStatusBusy(true);
    try {
      const updated = await apiFetch<any>(`/api/v1/recommendations/${r.recID}/status`, {
        method: 'POST', body: JSON.stringify({ status }),
      });
      onUpdate({ ...r, status: updated.status });
    } catch (e: any) { onError(e?.message || 'Failed to update'); }
    finally { setStatusBusy(false); }
  };

  const handleStart = async () => {
    setLinkBusy(true);
    // First mark as in_progress
    try {
      const updated = await apiFetch<any>(`/api/v1/recommendations/${r.recID}/status`, {
        method: 'POST', body: JSON.stringify({ status: 'in_progress' }),
      });
      onUpdate({ ...r, status: updated.status });
    } catch { /* non-critical */ }

    // Then fetch & open article URL
    try {
      const res = await apiFetch<any>(`/api/v1/recommendations/${r.recID}/resource-url`);
      if (res?.url) window.open(res.url, '_blank', 'noopener');
    } catch (e: any) {
      onError(e?.message || 'Could not fetch article URL');
    } finally { setLinkBusy(false); }
  };

  return (
    <div className={`group relative rounded-2xl border transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 flex flex-col ${glass} ${isDone ? 'border-emerald-200/60' : isHigh ? 'border-indigo-200/60 hover:border-indigo-300/80' : 'border-slate-200/50'}`}>
      {/* High-impact glow */}
      {isHigh && !isDone && (
        <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-indigo-400/10 via-violet-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      )}

      <div className="p-5 flex flex-col gap-4 flex-1 relative z-10">

        {/* ── Section: Skill Name + Impact ── */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${isHigh ? 'bg-indigo-50/80' : 'bg-slate-50/80'}`}>
              <ResourceIcon type={r.resourceType} size={16} />
            </div>
            <span className="text-base font-bold text-foreground">{r.skill}</span>
          </div>
          {isHigh
            ? <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#00e5ff]/20 text-[#00e5ff] border border-[#00e5ff]/30 shrink-0"><Zap size={10} />HIGH</span>
            : <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide shrink-0">Medium</span>}
        </div>

        {/* ── Section: Topic Description ── */}
        {r.topicDescription && (
          <div>
            <SectionLabel>What you'll learn</SectionLabel>
            <p className="text-sm text-muted-foreground leading-relaxed">{r.topicDescription}</p>
          </div>
        )}

        {/* ── Section: Recommended Courses ── */}
        {r.courseNames && r.courseNames.length > 0 && (
          <div>
            <SectionLabel>Recommended Courses</SectionLabel>
            <div className="flex flex-col gap-1.5">
              {r.courseNames.map((c: string, i: number) => (
                <div key={i} className="flex items-center gap-2 text-sm text-[#00e5ff] bg-[#00e5ff]/10 border border-[#00e5ff]/20 px-3 py-1.5 rounded-lg font-medium">
                  <BookOpen size={13} className="shrink-0 text-[#00e5ff]/70" />{c}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Section: Meta info grid ── */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <SectionLabel>Resource Type</SectionLabel>
            <div className="flex items-center gap-1.5 text-sm text-slate-700 font-medium">
              <ResourceIcon type={r.resourceType} size={14} />
              {r.resourceType || 'Online Course'}
            </div>
          </div>
          <div>
            <SectionLabel>Est. Time</SectionLabel>
            <p className="text-sm font-semibold text-slate-700">{r.estimatedTime || 'N/A'}</p>
          </div>
          <div>
            <SectionLabel>Impact on Match</SectionLabel>
            <span className={`text-sm font-bold ${isHigh ? 'text-indigo-600' : 'text-amber-500'}`}>
              {isHigh ? '🔥 High' : '⚡ Medium'}
            </span>
          </div>
          <div>
            <SectionLabel>Status</SectionLabel>
            <StatusPill status={r.status} />
          </div>
        </div>

        {/* ── Expandable: Search suggestion ── */}
        <div>
          <button onClick={() => setOpen(!open)}
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-indigo-500 transition-colors duration-150">
            {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {open ? 'Hide search hint' : 'View search hint'}
          </button>
          {open && (
            <div className="mt-2 flex items-start gap-2 bg-slate-50/80 backdrop-blur-sm rounded-xl p-3 border border-slate-100/80">
              <ArrowRight size={13} className="text-indigo-400 shrink-0 mt-0.5" />
              <p className="text-sm text-slate-500">{r.suggestedSearch}</p>
            </div>
          )}
        </div>

        {/* ── Actions ── */}
        {!isDone ? (
          <div className="flex gap-2.5 mt-auto pt-2">
            <button onClick={handleStart} disabled={linkBusy || statusBusy}
              className="flex-1 flex items-center justify-center gap-2 text-sm font-bold py-2.5 px-4 rounded-xl border border-indigo-200 text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100 transition-all duration-150 disabled:opacity-40">
              {linkBusy ? <Loader2 size={14} className="animate-spin" /> : <ExternalLink size={14} />}
              {linkBusy ? 'Finding article…' : 'Start Learning →'}
            </button>
            <button onClick={() => updateStatus('completed')} disabled={statusBusy}
              className="flex-1 text-sm font-bold py-2.5 px-4 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-all duration-150 disabled:opacity-40 flex items-center justify-center gap-2">
              {statusBusy ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
              Mark Done
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 mt-auto pt-2 text-sm font-semibold text-emerald-600">
            <CheckCircle size={16} />Completed
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Avatar ───────────────────────────────────────────────────────────────────
const Avatar = ({ name, id }: { name?: string; id: number }) => {
  const label = name ? name.slice(0, 2).toUpperCase() : `U${id}`;
  const colors = ['bg-indigo-100 text-indigo-700', 'bg-violet-100 text-violet-700', 'bg-cyan-100 text-cyan-700', 'bg-rose-100 text-rose-700'];
  return <span className={`inline-flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold shrink-0 ${colors[id % colors.length]}`}>{label}</span>;
};

const TierBadge = ({ score, tier }: { score: number; tier: string }) => {
  const styles = { green: 'bg-emerald-900/30 text-emerald-400 ring-1 ring-emerald-700/40', amber: 'bg-amber-900/30 text-amber-400 ring-1 ring-amber-700/40', red: 'bg-red-900/30 text-red-400 ring-1 ring-red-700/40' }[tier] ?? 'bg-secondary text-muted-foreground';
  const dot = tier === 'green' ? 'bg-emerald-400' : tier === 'amber' ? 'bg-amber-400' : 'bg-red-400';
  return <span className={`inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1 rounded-full ${styles}`}><span className={`w-2 h-2 rounded-full ${dot}`} />{Math.round(score)}%</span>;
};

// ─── Main Component ───────────────────────────────────────────────────────────
export const ResumeMatch = () => {
  const { user } = useAuth();
  const isHr = (user?.role || '').includes('hr');

  const [tab, setTab] = useState<'resume' | 'jd' | 'match'>('resume');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumes, setResumes] = useState<ResumeListItem[]>([]);
  const [jds, setJds] = useState<JDListItem[]>([]);
  const [jdTitle, setJdTitle] = useState('');
  const [jdDesc, setJdDesc] = useState('');
  const [jdSkills, setJdSkills] = useState('');
  const [selectedResumeID, setSelectedResumeID] = useState<number | ''>('');
  const [selectedJobID, setSelectedJobID] = useState<number | ''>('');
  const [matchResult, setMatchResult] = useState<any>(null);
  const [matchComputing, setMatchComputing] = useState(false);
  const [recruiterRows, setRecruiterRows] = useState<RecruiterMatchRow[]>([]);
  const [recruiterLoading, setRecruiterLoading] = useState(false);
  const [recruiterSort, setRecruiterSort] = useState<'hybrid' | 'cosine'>('hybrid');
  const [recruiterTierFilter, setRecruiterTierFilter] = useState<'all' | 'green' | 'amber' | 'red'>('all');
  const canMatch = selectedResumeID !== '' && selectedJobID !== '';

  const refreshLists = async () => {
    setBusy(true); setMessage('');
    try {
      const [r, j] = await Promise.all([apiFetch<ResumeListItem[]>('/api/v1/resume/list'), apiFetch<JDListItem[]>('/api/v1/jd/active')]);
      setResumes(r || []); setJds(j || []);
      if (r?.length && selectedResumeID === '') setSelectedResumeID(r[0].resumeID);
      if (j?.length && selectedJobID === '') setSelectedJobID(j[0].jobID);
    } catch (e: any) { setMessage(e?.message || 'Failed to refresh'); }
    finally { setBusy(false); }
  };
  useEffect(() => { refreshLists(); /* eslint-disable-next-line */ }, []);

  const uploadResume = async () => {
    if (!resumeFile) { setMessage('Please select a PDF/DOCX file.'); return; }
    setBusy(true); setMessage('');
    try {
      const fd = new FormData(); fd.append('file', resumeFile);
      await apiFetch('/api/v1/resume/upload', { method: 'POST', body: fd });
      setResumeFile(null); setMessage('Resume uploaded.'); await refreshLists();
    } catch (e: any) { setMessage(e?.message || 'Upload failed'); } finally { setBusy(false); }
  };

  const uploadJD = async () => {
    if (!jdTitle.trim()) { setMessage('Job title required.'); return; }
    setBusy(true); setMessage('');
    try {
      await apiFetch('/api/v1/jd/upload', { method: 'POST', body: JSON.stringify({ title: jdTitle.trim(), description: jdDesc.trim(), skills: jdSkills.split(',').map(s => s.trim()).filter(Boolean) }) });
      setJdTitle(''); setJdDesc(''); setJdSkills('');
      setMessage('Job description created.'); await refreshLists();
    } catch (e: any) { setMessage(e?.message || 'JD creation failed (HR only)'); } finally { setBusy(false); }
  };

  const runMatch = async () => {
    if (!canMatch) return;
    setMatchResult(null); setMatchComputing(true); setMessage('');
    try {
      const res = await apiFetch('/api/v1/match', { method: 'POST', body: JSON.stringify({ resumeID: selectedResumeID, jobID: selectedJobID }) });
      setMatchResult(res);
    } catch (e: any) { setMessage(e?.message || 'Match failed'); } finally { setMatchComputing(false); }
  };

  const tier = matchResult?.details?.tier as 'green' | 'amber' | 'red' | undefined;
  const tierConfig = {
    green: { label: 'Strong Fit', ringColor: '#10b981', trackColor: '#d1fae5', text: 'text-emerald-700', bg: 'bg-emerald-50/70', ring: 'ring-emerald-200/60' },
    amber: { label: 'Moderate Fit', ringColor: '#f59e0b', trackColor: '#fef3c7', text: 'text-amber-700', bg: 'bg-amber-50/70', ring: 'ring-amber-200/60' },
    red:   { label: 'Low Fit',      ringColor: '#f43f5e', trackColor: '#ffe4e6', text: 'text-rose-700', bg: 'bg-rose-50/70', ring: 'ring-rose-200/60' },
  }[tier ?? 'red'] ?? { label: '', ringColor: '#94a3b8', trackColor: '#e2e8f0', text: 'text-slate-600', bg: 'bg-slate-50/70', ring: '' };

  const TABS = [
    { key: 'resume', label: 'Resume', icon: FileUp },
    { key: 'jd', label: 'Job Description', icon: Briefcase },
    { key: 'match', label: 'Match', icon: Sparkles },
  ] as const;

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar role={isHr ? 'hr' : 'candidate'} />
      <main className="flex-1 overflow-auto">
      <style>{`@keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }`}</style>
      <div className="p-8 w-full">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground tracking-tight mb-2">Resume &amp; Job Matching</h1>
          <p className="text-muted-foreground">Upload resumes, manage job descriptions, and compute AI-powered match scores.</p>
        </div>

        {/* Status */}
        {message && (
          <div className={`mb-6 px-5 py-3.5 rounded-xl text-base border backdrop-blur-sm ${
            message.toLowerCase().includes('fail') || message.toLowerCase().includes('error')
              ? 'bg-destructive/10 border-destructive/30 text-destructive'
              : 'bg-emerald-900/20 border-emerald-700/30 text-emerald-400'}`}>
            {message}
          </div>
        )}

        {/* Tab bar */}
        <div className="flex items-center gap-2 mb-8">
          <div className={`flex ${glass} rounded-xl p-1 gap-1`}>
            {TABS.map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => setTab(key)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  tab === key
                    ? 'bg-[#00e5ff] text-black shadow-sm glow-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'}`}>
                <Icon size={16} />{label}
              </button>
            ))}
          </div>
          <button onClick={refreshLists} disabled={busy}
            className={`ml-auto flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold ${glass} text-muted-foreground hover:text-foreground disabled:opacity-40 transition-all duration-200`}>
            <RefreshCw size={15} className={busy ? 'animate-spin' : ''} />Refresh
          </button>
        </div>

        {/* ── TAB: RESUME ── */}
        {tab === 'resume' && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className={`lg:col-span-2 ${glass} rounded-2xl p-6`}>
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 bg-[#00e5ff]/10 rounded-xl"><FileUp size={20} className="text-[#00e5ff]" /></div>
                <h2 className="text-xl font-bold text-foreground">Upload Resume</h2>
              </div>
              <label className="block w-full cursor-pointer">
                <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                  resumeFile ? 'border-[#00e5ff]/50 bg-[#00e5ff]/5' : 'border-border hover:border-[#00e5ff]/40 hover:bg-secondary/30'}`}>
                  <FileUp size={30} className={`mx-auto mb-2 ${resumeFile ? 'text-[#00e5ff]' : 'text-muted-foreground/40'}`} />
                  {resumeFile
                    ? <p className="font-semibold text-[#00e5ff]">{resumeFile.name}</p>
                    : <><p className="font-semibold text-foreground">Drop PDF or DOCX here</p><p className="text-sm text-muted-foreground mt-1">Max 5 MB</p></>}
                </div>
                <input type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={e => setResumeFile(e.target.files?.[0] || null)} className="hidden" />
              </label>
              <button onClick={uploadResume} disabled={busy || !resumeFile}
                className="mt-4 w-full bg-[#00e5ff] text-black py-3 rounded-xl font-bold hover:bg-[#00e5ff]/90 transition-all duration-200 disabled:opacity-40 glow-primary">
                {busy ? 'Uploading…' : 'Upload Resume'}
              </button>
            </div>
            <div className={`lg:col-span-3 ${glass} rounded-2xl p-6`}>
              <h3 className="text-lg font-bold text-foreground mb-4">Your Resumes</h3>
              {resumes.length === 0
                ? <div className="flex flex-col items-center justify-center py-14 text-muted-foreground"><FileUp size={36} className="mb-2 opacity-30" /><p>No resumes uploaded yet</p></div>
                : <ul className="space-y-2">{resumes.map(r => (
                    <li key={r.resumeID} className="flex items-center justify-between p-4 bg-secondary/40 rounded-xl border border-border/60 hover:border-[#00e5ff]/30 transition-all duration-150">
                      <div className="flex items-center gap-3"><div className="p-2 bg-[#00e5ff]/10 rounded-lg"><FileText size={15} className="text-[#00e5ff]" /></div><span className="font-semibold text-foreground">{r.filename}</span></div>
                      <span className="text-sm text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                    </li>
                  ))}</ul>}
            </div>
          </div>
        )}

        {/* ── TAB: JD ── */}
        {tab === 'jd' && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className={`lg:col-span-2 ${glass} rounded-2xl p-6`}>
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 bg-accent/10 rounded-xl"><Briefcase size={20} className="text-accent" /></div>
                <div><h2 className="text-xl font-bold text-foreground">Create JD</h2>{!isHr && <p className="text-sm text-muted-foreground">HR accounts only</p>}</div>
              </div>
              <div className="space-y-3">
                {[{ value: jdTitle, set: setJdTitle, ph: 'Job Title (e.g. Backend Engineer)' },
                  { value: jdSkills, set: setJdSkills, ph: 'Skills: python, fastapi, sql' }].map((f, i) => (
                  <input key={i} value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.ph}
                    className="w-full px-4 py-3 text-base rounded-xl transition-all" />
                ))}
                <textarea value={jdDesc} onChange={e => setJdDesc(e.target.value)} placeholder="Describe the role…" rows={4}
                  className="w-full px-4 py-3 text-base rounded-xl transition-all resize-none" />
              </div>
              <button onClick={uploadJD} disabled={busy}
                className="mt-4 w-full bg-accent text-accent-foreground py-3 rounded-xl font-bold hover:bg-accent/90 transition-all duration-200 disabled:opacity-40">
                {busy ? 'Saving…' : 'Create Job Description'}
              </button>
            </div>
            <div className={`lg:col-span-3 ${glass} rounded-2xl p-6`}>
              <h3 className="text-lg font-bold text-foreground mb-4">Active Job Descriptions</h3>
              {jds.length === 0
                ? <div className="flex flex-col items-center justify-center py-14 text-muted-foreground"><Briefcase size={36} className="mb-2 opacity-30" /><p>No active JDs yet</p></div>
                : <ul className="space-y-2">{jds.map(j => (
                    <li key={j.jobID} className="p-4 bg-secondary/40 rounded-xl border border-border/60 hover:border-accent/30 transition-all duration-150">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-foreground">{j.title}</span>
                        <span className="text-xs font-semibold bg-accent/10 text-accent px-2 py-0.5 rounded-full border border-accent/20">{j.status}</span>
                      </div>
                      {j.skills && <div className="flex flex-wrap gap-1.5">{j.skills.split(',').slice(0, 6).map((s, i) => <span key={i} className="text-sm text-muted-foreground bg-secondary border border-border/60 px-2 py-0.5 rounded-md">{s.trim()}</span>)}</div>}
                    </li>
                  ))}</ul>}
            </div>
          </div>
        )}

        {/* ── TAB: MATCH ── */}
        {tab === 'match' && (
          <div className="space-y-6">

            {/* Recruiter view */}
            {isHr && (
              <div className={`${glass} rounded-2xl p-6`}>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#00e5ff]/10 rounded-xl"><Users size={18} className="text-[#00e5ff]" /></div>
                    <div><h3 className="text-lg font-bold text-foreground">Recruiter View</h3><p className="text-sm text-muted-foreground">All applicants ranked for selected JD</p></div>
                  </div>
                  <button onClick={async () => { if (!selectedJobID) return; setRecruiterLoading(true); try { const rows = await apiFetch<RecruiterMatchRow[]>(`/api/v1/hr/matches?jobID=${selectedJobID}`); setRecruiterRows(rows || []); } catch (e: any) { setMessage(e?.message || 'Failed'); } finally { setRecruiterLoading(false); } }}
                    disabled={!selectedJobID || recruiterLoading}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm bg-[#00e5ff] text-black hover:bg-[#00e5ff]/90 disabled:opacity-40 transition-all duration-200 glow-primary">
                    {recruiterLoading ? <RefreshCw size={14} className="animate-spin" /> : <TrendingUp size={14} />}{recruiterLoading ? 'Loading…' : 'Load Rankings'}
                  </button>
                </div>
                {recruiterRows.length > 0 && (
                  <>
                    <div className="flex flex-wrap gap-3 mb-5 p-4 bg-secondary/40 backdrop-blur-sm rounded-xl border border-border/60">
                      <div>
                        <SectionLabel>Sort by</SectionLabel>
                        <select value={recruiterSort} onChange={e => setRecruiterSort(e.target.value as any)}
                          className="text-sm px-3 py-2 rounded-lg">
                          <option value="hybrid">Hybrid Score</option><option value="cosine">Doc2Vec Cosine</option>
                        </select>
                      </div>
                      <div>
                        <SectionLabel>Tier filter</SectionLabel>
                        <div className="flex gap-1.5">{(['all','green','amber','red'] as const).map(t => (
                          <button key={t} onClick={() => setRecruiterTierFilter(t)}
                            className={`text-sm px-3 py-1.5 rounded-lg font-semibold border transition-all duration-150 ${
                              recruiterTierFilter === t
                                ? 'bg-[#00e5ff] text-black border-[#00e5ff]'
                                : 'bg-secondary/60 text-muted-foreground border-border hover:border-[#00e5ff]/40'}`}>
                            {t.charAt(0).toUpperCase()+t.slice(1)}
                          </button>
                        ))}</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {recruiterRows.filter(r => recruiterTierFilter === 'all' || r.tier === recruiterTierFilter)
                        .sort((a, b) => recruiterSort === 'cosine' ? b.cosineScore - a.cosineScore : b.hybridScore - a.hybridScore)
                        .slice(0, 10).map((r, idx) => (
                          <div key={`${r.resumeID}_${idx}`} className="flex items-center gap-4 p-4 bg-secondary/40 backdrop-blur-sm rounded-xl border border-border/60 hover:border-[#00e5ff]/30 hover:bg-secondary/60 transition-all duration-200">
                            <span className="text-xl font-bold text-slate-300 w-8 text-center shrink-0">{idx+1}</span>
                            <Avatar name={r.candidateName} id={r.candidateUserID} />
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-slate-800 truncate">{r.candidateName || `Candidate ${r.candidateUserID}`}</p>
                              <p className="text-sm text-slate-400">Resume #{r.resumeID}</p>
                            </div>
                            <div className="hidden md:block text-right">
                              <p className="text-sm font-semibold text-slate-600">{r.missingSkills.length} missing</p>
                              <p className="text-sm text-slate-400 truncate max-w-[160px]">{r.missingSkills.slice(0,2).join(', ') || '—'}</p>
                            </div>
                            <TierBadge score={r.hybridScore} tier={r.tier} />
                          </div>
                        ))}
                    </div>
                  </>
                )}
                {recruiterRows.length === 0 && !recruiterLoading && <p className="text-muted-foreground text-center py-8">Select a JD and click "Load Rankings".</p>}
              </div>
            )}

            {/* Match selectors */}
            <div className={`${glass} rounded-2xl p-6`}>
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 bg-[#00e5ff]/10 rounded-xl"><Sparkles size={18} className="text-[#00e5ff]" /></div>
                <h2 className="text-xl font-bold text-foreground">Compute Match Score</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                {[{ label: 'Resume', val: selectedResumeID, set: (v: string) => setSelectedResumeID(v ? Number(v) : ''), opts: resumes.map(r => ({ v: r.resumeID, l: `#${r.resumeID} — ${r.filename}` })) },
                  { label: 'Job Description', val: selectedJobID, set: (v: string) => setSelectedJobID(v ? Number(v) : ''), opts: jds.map(j => ({ v: j.jobID, l: `#${j.jobID} — ${j.title}` })) }].map(({ label, val, set, opts }) => (
                  <div key={label}>
                    <SectionLabel>{label}</SectionLabel>
                    <select value={val} onChange={e => set(e.target.value)}
                      className="w-full px-4 py-3 text-base border border-slate-200/70 bg-white/60 backdrop-blur-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300/60 transition-all">
                      <option value="">— Select {label.toLowerCase()} —</option>
                      {opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <button onClick={runMatch} disabled={matchComputing || !canMatch}
                className="flex items-center gap-2 px-7 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all duration-200 disabled:opacity-40 shadow-sm shadow-indigo-200/50">
                <Sparkles size={17} className={matchComputing ? 'animate-pulse' : ''} />{matchComputing ? 'Computing…' : 'Compute Match'}
              </button>
            </div>

            {matchComputing && <MatchSkeleton />}

            {matchResult && !matchComputing && (
              <div className="space-y-5">
                {/* Hero rings */}
                <div className={`${glass} rounded-2xl p-8`}>
                  <div className="flex flex-col items-center gap-8 md:flex-row md:items-center">
                    <div className="flex flex-col items-center gap-3 shrink-0">
                      <CircleRing pct={matchResult.hybridScore || 0} size={150} stroke={12} color={tierConfig.ringColor} trackColor={tierConfig.trackColor}
                        label={`${Math.round(matchResult.hybridScore || 0)}`} sublabel="%" />
                      <span className={`text-sm font-bold uppercase tracking-wider px-4 py-1.5 rounded-full ring-1 ${tierConfig.ring} ${tierConfig.text} ${tierConfig.bg}`}>{tierConfig.label}</span>
                    </div>
                    <div className="flex gap-8 justify-center flex-wrap flex-1">
                      {[
                        { pct: matchResult.geminiScore || 0, color: '#8b5cf6', track: '#ede9fe', label: 'AI Semantic' },
                        { pct: (matchResult.cosineScore || 0) * 100, color: '#06b6d4', track: '#cffafe', label: 'Doc2Vec' },
                        ...(typeof matchResult?.details?.percentile === 'number' ? [{ pct: matchResult.details.percentile, color: '#f59e0b', track: '#fef3c7', label: 'Percentile' }] : []),
                      ].map(({ pct, color, track, label }) => (
                        <div key={label} className="flex flex-col items-center gap-2">
                          <CircleRing pct={pct} size={104} stroke={9} color={color} trackColor={track} label={`${Math.round(pct)}`} sublabel="%" />
                          <p className="text-sm font-semibold text-slate-500 text-center">{label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {matchResult.details?.parsedProfile && Object.keys(matchResult.details.parsedProfile).length > 0 && (
                  <div className={`${glass} rounded-2xl p-6`}>
                    <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                      <FileText size={18} className="text-indigo-500" />
                      Extracted Resume Profile
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {matchResult.details.parsedProfile.name && (
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 border border-border/30">
                          <UserIcon size={16} className="text-indigo-500 mt-0.5" />
                          <div><p className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Candidate Name</p><p className="text-sm font-semibold text-foreground">{matchResult.details.parsedProfile.name}</p></div>
                        </div>
                      )}
                      {(matchResult.details.parsedProfile.email || matchResult.details.parsedProfile.phone) && (
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 border border-border/30">
                          <Mail size={16} className="text-violet-500 mt-0.5" />
                          <div><p className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Contact</p><p className="text-sm font-semibold text-foreground">{matchResult.details.parsedProfile.email}{matchResult.details.parsedProfile.phone && ` • ${matchResult.details.parsedProfile.phone}`}</p></div>
                        </div>
                      )}
                      {matchResult.details.parsedProfile.experience && matchResult.details.parsedProfile.experience.length > 0 && (
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 border border-border/30">
                          <Briefcase size={16} className="text-emerald-500 mt-0.5" />
                          <div><p className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Recent Experience</p><p className="text-sm font-semibold text-foreground">{matchResult.details.parsedProfile.experience[0].role} @ {matchResult.details.parsedProfile.experience[0].company}</p></div>
                        </div>
                      )}
                      {matchResult.details.parsedProfile.education && matchResult.details.parsedProfile.education.length > 0 && (
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 border border-border/30">
                          <GraduationCap size={16} className="text-amber-500 mt-0.5" />
                          <div><p className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Education</p><p className="text-sm font-semibold text-foreground">{matchResult.details.parsedProfile.education[0].degree}</p></div>
                        </div>
                      )}
                      {matchResult.details.parsedProfile.skills && matchResult.details.parsedProfile.skills.length > 0 && (
                        <div className="col-span-full flex items-start gap-3 p-3 rounded-lg bg-secondary/30 border border-border/30">
                          <Code size={16} className="text-sky-500 mt-0.5" />
                          <div><p className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Extracted Skills ({matchResult.details.parsedProfile.skills.length})</p><p className="text-sm font-semibold text-foreground">{(Array.isArray(matchResult.details.parsedProfile.skills) ? matchResult.details.parsedProfile.skills : []).slice(0,10).join(', ')}{Array.isArray(matchResult.details.parsedProfile.skills) && matchResult.details.parsedProfile.skills.length > 10 ? '...' : ''}</p></div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Skill overlap */}
                <div className={`${glass} rounded-2xl p-6`}>
                  <h3 className="text-lg font-bold text-slate-700 mb-4">Skill Overlap</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { label: 'Matched', skills: matchResult.skillOverlap?.matched || [], chip: 'bg-emerald-50/80 text-emerald-700 border-emerald-200/70', title: 'text-emerald-600' },
                      { label: 'Missing', skills: matchResult.skillOverlap?.missing || [], chip: 'bg-rose-50/80 text-rose-700 border-rose-200/70', title: 'text-rose-600' },
                      { label: 'Extra / Bonus', skills: (matchResult.skillOverlap?.extra || []).slice(0,8), chip: 'bg-slate-100/80 text-slate-500 border-slate-200/60', title: 'text-slate-500' },
                    ].map(({ label, skills, chip, title }) => (
                      <div key={label}>
                        <SectionLabel><span className={title}>{label}</span></SectionLabel>
                        <div className="flex flex-wrap gap-1.5">
                          {skills.length === 0 ? <span className="text-sm text-slate-400">—</span>
                            : (skills as string[]).map((s, i) => <span key={i} className={`text-sm px-2.5 py-1 rounded-lg font-medium border ${chip}`}>{s}</span>)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommendations */}
                {(matchResult.details?.recommendations || []).length > 0 && (
                  <div>
                    <div className="flex items-center gap-3 mb-5">
                      <h3 className="text-xl font-bold text-slate-800">Learning Recommendations</h3>
                      <span className="text-sm bg-indigo-50/80 text-indigo-600 px-3 py-1 rounded-full border border-indigo-100/80 font-semibold">{matchResult.details.recommendations.length} skill gaps</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                      {matchResult.details.recommendations.map((r: any) => (
                        <RecCard key={r.recID} r={r}
                          onUpdate={updated => setMatchResult((prev: any) => ({ ...prev, details: { ...prev.details, recommendations: prev.details.recommendations.map((x: any) => x.recID === updated.recID ? updated : x) } }))}
                          onError={setMessage} />
                      ))}
                    </div>
                  </div>
                )}

                {matchResult.details?.recommendations?.length === 0 && (
                  <div className={`${glass} rounded-2xl p-10 text-center`}>
                    <CheckCircle size={36} className="mx-auto text-emerald-400 mb-3" />
                    <p className="text-lg font-bold text-slate-700">No skill gaps detected</p>
                    <p className="text-slate-400 mt-1">Your resume covers all JD requirements.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      </main>
    </div>
  );
};
