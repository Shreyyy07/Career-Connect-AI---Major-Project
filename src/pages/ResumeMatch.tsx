import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileUp, Briefcase, Sparkles, RefreshCw, FileText, Zap } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import DashboardSidebar from '@/components/DashboardSidebar';

type ResumeListItem = { resumeID: number; filename: string; created_at: string };
type JDListItem = { jobID: number; title: string; status: string; skills?: string[] };

const glass = 'bg-card/60 backdrop-blur-sm border border-border/50 shadow-lg';
const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">{children}</p>
);

export default function ResumeMatch() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isHr = user?.role === 'hr';

  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  // Resume state
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumes, setResumes] = useState<ResumeListItem[]>([]);
  const [selectedResumeID, setSelectedResumeID] = useState<number | ''>('');

  // JD state
  const [jdTitle, setJdTitle] = useState('');
  const [jdDesc, setJdDesc] = useState('');
  const [jdSkills, setJdSkills] = useState('');
  const [jds, setJds] = useState<JDListItem[]>([]);
  const [selectedJobID, setSelectedJobID] = useState<number | ''>('');

  // Match state
  const [matchComputing, setMatchComputing] = useState(false);

  const canMatch = selectedResumeID !== '' && selectedJobID !== '';

  const refreshLists = async () => {
    setBusy(true); setMessage('');
    try {
      const r = await apiFetch<ResumeListItem[]>('/api/v1/resume/list');
      const jUrl = isHr ? '/api/v1/jd/list' : '/api/v1/jd/active';
      const j = await apiFetch<JDListItem[]>(jUrl);
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
      setResumeFile(null); setMessage('Resume uploaded successfully.'); await refreshLists();
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
    setMatchComputing(true); setMessage('');
    try {
      const res = await apiFetch('/api/v1/match', { method: 'POST', body: JSON.stringify({ resumeID: selectedResumeID, jobID: selectedJobID }) });
      // Redirect to CandidateSkills with the match payload
      navigate('/candidate/skills', { state: { matchResult: res } });
    } catch (e: any) { setMessage(e?.message || 'Match failed'); } finally { setMatchComputing(false); }
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <DashboardSidebar role={isHr ? 'hr' : 'candidate'} />
      <main className="flex-1 overflow-auto">
      <div className="p-8 lg:p-10 w-full max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-4xl font-display font-bold tracking-tight mb-2">Resume Configuration</h1>
            <p className="text-muted-foreground text-lg">Upload resumes and select the target role before computing your skill gaps.</p>
          </div>
          <button onClick={refreshLists} disabled={busy}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold border border-border bg-secondary hover:bg-secondary/80 disabled:opacity-40 transition-all duration-200`}>
            <RefreshCw size={15} className={busy ? 'animate-spin' : ''} />Refresh
          </button>
        </div>

        {/* Status */}
        {message && (
          <div className={`mb-8 px-5 py-3.5 rounded-xl text-sm border backdrop-blur-sm font-semibold flex items-center justify-between ${
            message.toLowerCase().includes('fail') || message.toLowerCase().includes('error')
              ? 'bg-destructive/10 border-destructive/30 text-destructive'
              : 'bg-emerald-900/20 border-emerald-700/30 text-emerald-400'}`}>
            {message}
            <button onClick={() => setMessage('')} className="opacity-60 hover:opacity-100">×</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* UPLOAD RESUME */}
          <div className={`${glass} rounded-2xl p-6 lg:p-8 flex flex-col`}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-[#00e5ff]/10 rounded-xl"><FileUp size={22} className="text-[#00e5ff]" /></div>
              <div>
                 <h2 className="text-xl font-bold font-display text-foreground">Upload Resume</h2>
                 <p className="text-sm text-muted-foreground">Add your latest PDF</p>
              </div>
            </div>
            
            <label className="block w-full cursor-pointer group mb-5">
              <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                resumeFile ? 'border-[#00e5ff] bg-[#00e5ff]/5' : 'border-border/60 group-hover:border-[#00e5ff]/40 group-hover:bg-secondary/30'}`}>
                <FileUp size={36} className={`mx-auto mb-3 transition-colors ${resumeFile ? 'text-[#00e5ff]' : 'text-muted-foreground/40 group-hover:text-[#00e5ff]/60'}`} />
                {resumeFile
                  ? <p className="font-semibold text-[#00e5ff] truncate max-w-full">{resumeFile.name}</p>
                  : <><p className="font-semibold text-foreground">Click or drop file here</p><p className="text-xs text-muted-foreground mt-1.5">Max 5 MB (.pdf or .docx)</p></>}
              </div>
              <input type="file" accept=".pdf,.docx,application/pdf"
                onChange={e => setResumeFile(e.target.files?.[0] || null)} className="hidden" />
            </label>
            
            <button onClick={uploadResume} disabled={busy || !resumeFile}
              className="mt-auto w-full bg-[#00e5ff] text-zinc-900 py-3.5 rounded-xl font-bold hover:bg-[#00cce6] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
              {busy ? 'Uploading…' : 'Upload & Save'}
            </button>
          </div>

          {/* CREATE JD (HR) OR ACTIVE JDS (CANDIDATE) */}
          <div className={`${glass} rounded-2xl p-6 lg:p-8 flex flex-col`}>
             {isHr ? (
               <>
                 <div className="flex items-center gap-3 mb-6">
                   <div className="p-2.5 bg-indigo-500/10 rounded-xl"><Briefcase size={22} className="text-indigo-400" /></div>
                   <div>
                      <h2 className="text-xl font-bold font-display text-foreground">Create Job Description</h2>
                      <p className="text-sm text-muted-foreground">HR Management</p>
                   </div>
                 </div>
                 <div className="space-y-4 mb-5">
                   <input value={jdTitle} onChange={e => setJdTitle(e.target.value)} placeholder="Role Title (e.g. Frontend Engineer)"
                     className="w-full px-4 py-3 bg-secondary/30 border border-border rounded-xl focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none transition-all placeholder:text-muted-foreground/60" />
                   <input value={jdSkills} onChange={e => setJdSkills(e.target.value)} placeholder="Primary Skills (comma separated)"
                     className="w-full px-4 py-3 bg-secondary/30 border border-border rounded-xl focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none transition-all placeholder:text-muted-foreground/60" />
                   <textarea value={jdDesc} onChange={e => setJdDesc(e.target.value)} placeholder="Detailed job description..." rows={3}
                     className="w-full px-4 py-3 bg-secondary/30 border border-border rounded-xl focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none transition-all resize-none placeholder:text-muted-foreground/60" />
                 </div>
                 <button onClick={uploadJD} disabled={busy}
                   className="mt-auto w-full bg-indigo-500 text-white py-3.5 rounded-xl font-bold hover:bg-indigo-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20">
                   {busy ? 'Saving…' : 'Create JD Record'}
                 </button>
               </>
             ) : (
               <>
                 <div className="flex items-center gap-3 mb-6">
                   <div className="p-2.5 bg-indigo-500/10 rounded-xl"><Briefcase size={22} className="text-indigo-400" /></div>
                   <div>
                      <h2 className="text-xl font-bold font-display text-foreground">Active Job Roles</h2>
                      <p className="text-sm text-muted-foreground">Target your application</p>
                   </div>
                 </div>
                 
                 {jds.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-muted-foreground border-2 border-dashed border-border/60 rounded-xl bg-secondary/20">
                       <Briefcase size={36} className="mb-3 opacity-30" />
                       <p className="font-medium text-sm">No active roles published yet.</p>
                       <p className="text-xs mt-1">HR adds roles here.</p>
                    </div>
                 ) : (
                    <ul className="space-y-3 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                       {jds.map(j => (
                         <li key={j.jobID} className="p-4 bg-secondary/30 rounded-xl border border-border hover:border-indigo-500/30 transition-all duration-200">
                           <div className="flex justify-between items-start mb-2.5">
                             <span className="font-bold text-foreground text-sm">{j.title}</span>
                             <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 px-2.5 py-1 rounded-md">{j.status}</span>
                           </div>
                           {j.skills && Array.isArray(j.skills) && (
                              <div className="flex flex-wrap gap-1.5">
                                 {j.skills.slice(0, 4).map((s, i) => (
                                    <span key={i} className="text-xs text-muted-foreground bg-background border border-border px-2 py-0.5 rounded shadow-sm">{s.trim()}</span>
                                 ))}
                                 {j.skills.length > 4 && <span className="text-xs text-muted-foreground">+{j.skills.length - 4}</span>}
                              </div>
                           )}
                         </li>
                       ))}
                    </ul>
                 )}
               </>
             )}
          </div>
        </div>

        {/* COMPUTE MATCH SECTION */}
        <div className={`${glass} rounded-2xl p-6 lg:p-8 relative overflow-hidden group`}>
          <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-[#00e5ff]/50 to-transparent opacity-50" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-6">
             <div className="flex items-center gap-4">
               <div className="p-3 bg-[#00e5ff]/10 rounded-2xl mt-1">
                  <Sparkles size={28} className="text-[#00e5ff]" />
               </div>
               <div>
                  <h2 className="text-2xl font-bold font-display text-foreground mb-1">Compute Match</h2>
                  <p className="text-muted-foreground text-sm max-w-sm">Select your resume against the target job description to run our multi-modal hybrid analysis.</p>
               </div>
             </div>
             
             <button onClick={runMatch} disabled={matchComputing || !canMatch}
               className="flex items-center justify-center gap-2 px-10 py-4 bg-white text-zinc-900 rounded-xl font-bold hover:bg-white/90 transition-all duration-300 disabled:opacity-50 hover:shadow-lg hover:shadow-white/20 whitespace-nowrap">
               {matchComputing ? <RefreshCw size={18} className="animate-spin" /> : <Zap size={18} />}
               {matchComputing ? 'Analyzing...' : 'Generate Profile Gap'}
             </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Resume Select */}
            <div className="bg-secondary/40 p-5 rounded-2xl border border-border">
              <div className="flex items-start gap-3 mb-3">
                 <FileText size={18} className="text-muted-foreground mt-0.5" />
                 <SectionLabel>1. Select Baseline Profile</SectionLabel>
              </div>
              <select value={selectedResumeID} onChange={e => setSelectedResumeID(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-4 py-3 text-sm bg-background/50 border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-[#00e5ff]/50 focus:border-[#00e5ff]/50 transition-all cursor-pointer">
                <option value="">— Choose a resume —</option>
                {resumes.map(r => <option key={r.resumeID} value={r.resumeID}>#{r.resumeID} — {r.filename}</option>)}
              </select>
            </div>

            {/* JD Select */}
            <div className="bg-secondary/40 p-5 rounded-2xl border border-border">
              <div className="flex items-start gap-3 mb-3">
                 <Briefcase size={18} className="text-muted-foreground mt-0.5" />
                 <SectionLabel>2. Select Target Role</SectionLabel>
              </div>
              <select value={selectedJobID} onChange={e => setSelectedJobID(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-4 py-3 text-sm bg-background/50 border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-[#00e5ff]/50 focus:border-[#00e5ff]/50 transition-all cursor-pointer">
                <option value="">— Choose a job description —</option>
                {jds.map(j => <option key={j.jobID} value={j.jobID}>#{j.jobID} — {j.title}</option>)}
              </select>
            </div>
          </div>
        </div>

      </div>
      </main>
    </div>
  );
}
