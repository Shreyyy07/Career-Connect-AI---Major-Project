import { useEffect, useState } from 'react';
import { FileText, Plus, Clock, CheckCircle, Bot, Briefcase, Loader2, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Assessment } from '../types';
import { apiFetch } from '../lib/api';
import { TextAssessment } from './TextAssessment';
import { useNavigate } from 'react-router-dom';

type JDItem = { jobID: number; title: string };

const glass = 'bg-white/70 backdrop-blur-sm border border-slate-200/50';

type AssessTab = 'history' | 'practice';
type PracticeState = 'setup' | 'session' | 'done';

export const Assessments = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState<AssessTab>('history');
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Practice Assessment state
  const [practiceState, setPracticeState] = useState<PracticeState>('setup');
  const [jds, setJds] = useState<JDItem[]>([]);
  const [selectedJD, setSelectedJD] = useState<number | ''>('');
  const [experience, setExperience] = useState(2);
  const [bio, setBio] = useState('');
  const [starting, setStarting] = useState(false);
  const [sessionID, setSessionID] = useState('');
  const [firstQuestion, setFirstQuestion] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [startError, setStartError] = useState('');

  useEffect(() => {
    if (user) {
      fetchAssessments();
      apiFetch<JDItem[]>('/api/v1/jd/active')
        .then(d => { setJds(d || []); if (d?.length) setSelectedJD(d[0].jobID); })
        .catch(() => {});
    }
  }, [user]);

  const fetchAssessments = async () => {
    try {
      const data = await apiFetch<Assessment[]>('/api/v1/assessments');
      setAssessments(data || []);
    } catch { } finally { setLoadingHistory(false); }
  };

  const createNewAssessment = async () => {
    try {
      await apiFetch('/api/v1/assessments', { method: 'POST' });
      fetchAssessments();
    } catch { }
  };

  const startPractice = async () => {
    if (!selectedJD) { setStartError('Please select a Job Description.'); return; }
    setStarting(true); setStartError('');
    try {
      const res = await apiFetch<{ sessionID: string; firstQuestion: string }>('/api/v1/interview/start', {
        method: 'POST',
        body: JSON.stringify({ jobID: selectedJD, experience, description: bio.trim() }),
      });
      setSessionID(res.sessionID);
      setFirstQuestion(res.firstQuestion);
      setJobTitle(jds.find(j => j.jobID === selectedJD)?.title || '');
      setPracticeState('session');
    } catch (e: any) { setStartError(e?.message || 'Failed to start'); }
    finally { setStarting(false); }
  };

  const TABS: { key: AssessTab; label: string; icon: any }[] = [
    { key: 'history', label: 'Assessment History', icon: FileText },
    { key: 'practice', label: 'AI Practice Assessment', icon: Bot },
  ];

  return (
    <div className="min-h-screen px-4 py-10 max-w-5xl mx-auto">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2">Assessments</h1>
          <p className="text-slate-500">Track your formal assessments and practice with our AI text Q&A tool.</p>
        </div>
        {tab === 'history' && (
          <button onClick={createNewAssessment}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-200/50">
            <Plus size={15} />New Assessment
          </button>
        )}
      </div>

      {/* Tab bar */}
      <div className={`flex ${glass} rounded-xl p-1 gap-1 mb-7 w-fit`}>
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => { setTab(key); setPracticeState('setup'); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${tab === key ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-white/60'}`}>
            <Icon size={15} />{label}
          </button>
        ))}
      </div>

      {/* ── History Tab ── */}
      {tab === 'history' && (
        loadingHistory ? (
          <div className="text-slate-400 text-center py-12">Loading…</div>
        ) : assessments.length === 0 ? (
          <div className={`${glass} rounded-2xl p-14 text-center shadow-sm`}>
            <FileText className="mx-auto text-slate-300 mb-4" size={44} />
            <h3 className="text-xl font-bold text-slate-700 mb-2">No assessments yet</h3>
            <p className="text-slate-400 mb-6">Create your first formal assessment to get started</p>
            <button onClick={createNewAssessment}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-200/50">
              <Plus size={15} />Create Assessment
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {assessments.map(a => (
              <div key={a.id} className={`${glass} rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-11 h-11 bg-amber-50 border border-amber-100/80 rounded-xl flex items-center justify-center">
                    <FileText className="text-amber-600" size={20} />
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${a.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/70' : 'bg-amber-50 text-amber-700 border-amber-200/70'}`}>
                    {a.status === 'completed'
                      ? <span className="flex items-center gap-1"><CheckCircle size={11} />Done</span>
                      : <span className="flex items-center gap-1"><Clock size={11} />Pending</span>}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-800 mb-1">{a.title}</h3>
                {a.score != null && <p className="text-3xl font-bold text-slate-900 mb-1">{Math.round(a.score)}%</p>}
                <p className="text-sm text-slate-400">Created {new Date(a.created_at).toLocaleDateString()}</p>
                {a.status === 'pending' && (
                  <button className="w-full mt-4 py-2 rounded-xl text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-200/50">
                    Start Assessment
                  </button>
                )}
              </div>
            ))}
          </div>
        )
      )}

      {/* ── Practice Tab ── */}
      {tab === 'practice' && practiceState === 'setup' && (
        <div className={`${glass} rounded-2xl p-8 shadow-sm max-w-xl`}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center shadow-sm shadow-indigo-200/50">
              <Bot size={22} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">AI Practice Assessment</h2>
              <p className="text-sm text-slate-500">Text-based Q&A — practice answering job-specific questions</p>
            </div>
          </div>
          {startError && <div className="mb-4 px-4 py-3 rounded-xl bg-rose-50/80 border border-rose-200/60 text-rose-700 text-sm">{startError}</div>}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5"><Briefcase size={11} className="inline mr-1" />Job Description</label>
              <select value={selectedJD} onChange={e => setSelectedJD(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-4 py-2.5 text-base border border-slate-200/70 bg-white/60 backdrop-blur-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300/60 transition-all">
                <option value="">— Select a JD —</option>
                {jds.map(j => <option key={j.jobID} value={j.jobID}>#{j.jobID} — {j.title}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Experience</label>
              <div className="flex items-center gap-3">
                <input type="range" min={0} max={15} value={experience} onChange={e => setExperience(Number(e.target.value))} className="flex-1 accent-indigo-600" />
                <span className="font-bold text-indigo-700 w-10 text-center text-sm">{experience}yr</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Brief Intro <span className="text-slate-400 normal-case font-normal">(optional)</span></label>
              <textarea value={bio} onChange={e => setBio(e.target.value)} rows={2}
                placeholder="e.g. Python developer, 2 years experience…"
                className="w-full px-4 py-2.5 text-base border border-slate-200/70 bg-white/60 backdrop-blur-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300/60 resize-none transition-all" />
            </div>
          </div>
          <button onClick={startPractice} disabled={starting || !selectedJD}
            className="mt-5 w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-base bg-indigo-600 text-white hover:bg-indigo-700 transition-all disabled:opacity-40 shadow-sm shadow-indigo-200/50">
            {starting ? <Loader2 size={18} className="animate-spin" /> : <><Bot size={18} /><ChevronRight size={15} /></>}
            {starting ? 'Starting…' : 'Start Practice'}
          </button>
        </div>
      )}

      {tab === 'practice' && practiceState === 'session' && (
        <TextAssessment
          sessionID={sessionID}
          firstQuestion={firstQuestion}
          jobTitle={jobTitle}
          onEnd={() => setPracticeState('done')}
          onBack={() => setPracticeState('setup')}
        />
      )}

      {tab === 'practice' && practiceState === 'done' && (
        <div className={`${glass} rounded-2xl p-10 text-center shadow-sm max-w-md`}>
          <CheckCircle size={44} className="mx-auto text-emerald-400 mb-4" />
          <h3 className="text-xl font-bold text-slate-800 mb-2">Practice Complete!</h3>
          <p className="text-slate-500 mb-5">Your session has been saved. Head to the AI Interview section for a full video interview evaluation.</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <button onClick={() => setPracticeState('setup')}
              className="px-5 py-2.5 rounded-xl font-bold text-sm bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-200/50">
              Practice Again
            </button>
            {true && (
              <button onClick={() => navigate('/candidate/interview')}
                className="px-5 py-2.5 rounded-xl font-bold text-sm border border-slate-200/70 text-slate-700 bg-white/60 hover:bg-white/80 transition-all shadow-sm">
                Go to Video Interview →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
