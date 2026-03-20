import { useEffect, useState } from 'react';
import { Bot, Users, Sparkles, Clock, Zap, Shield, ChevronRight, Loader2, Briefcase } from 'lucide-react';
import { apiFetch } from '../lib/api';

interface InterviewSelectionProps {
  onNavigate: (page: string, state?: any) => void;
}

type JDItem = { jobID: number; title: string; status: string };

const glass = 'bg-white/70 backdrop-blur-sm border border-slate-200/50';

export const InterviewSelection = ({ onNavigate }: InterviewSelectionProps) => {
  const [jds, setJds] = useState<JDItem[]>([]);
  const [selectedJD, setSelectedJD] = useState<number | ''>('');
  const [experience, setExperience] = useState<number>(2);
  const [bio, setBio] = useState('');
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch<JDItem[]>('/api/v1/jd/active')
      .then(d => { setJds(d || []); if (d?.length) setSelectedJD(d[0].jobID); })
      .catch(() => {});
  }, []);

  const startAI = async () => {
    if (!selectedJD) { setError('Please select a Job Description first.'); return; }
    setStarting(true); setError('');
    try {
      const res = await apiFetch<{ sessionID: string; firstQuestion: string }>('/api/v1/interview/start', {
        method: 'POST',
        body: JSON.stringify({ jobID: selectedJD, experience, description: bio.trim() }),
      });
      const jdTitle = jds.find(j => j.jobID === selectedJD)?.title;
      onNavigate('ai-interview', { sessionID: res.sessionID, firstQuestion: res.firstQuestion, jobTitle: jdTitle });
    } catch (e: any) {
      setError(e?.message || 'Failed to start interview');
    } finally { setStarting(false); }
  };

  return (
    <div className="min-h-screen px-4 py-10 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2">Select Interview Type</h1>
        <p className="text-slate-500">Choose how you want to be evaluated for your target role.</p>
      </div>

      {error && (
        <div className="mb-6 px-5 py-3.5 rounded-xl bg-rose-50/80 border border-rose-200/60 text-rose-700 text-base">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── AI Interview Card ── */}
        <div className={`${glass} rounded-2xl shadow-sm overflow-hidden flex flex-col`}>
          {/* Top accent */}
          <div className="h-1 bg-gradient-to-r from-indigo-500 to-violet-500" />
          <div className="p-8 flex flex-col flex-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-200/50">
                <Bot size={28} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">AI-Powered Interview</h2>
                <p className="text-sm text-indigo-600 font-semibold">Available now</p>
              </div>
            </div>

            <p className="text-slate-600 mb-5 leading-relaxed">
              Get interviewed by our GPT-4.1 powered AI. Questions are dynamically generated from your target
              job description and adapted to your experience level in real time.
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-2 mb-6">
              {[
                { icon: Sparkles, label: 'GPT-4.1 Questions', color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
                { icon: Clock, label: 'Instant Results', color: 'text-violet-600 bg-violet-50 border-violet-100' },
                { icon: Zap, label: 'JD-Contextual', color: 'text-amber-600 bg-amber-50 border-amber-100' },
                { icon: Shield, label: 'Semantic Scoring', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
              ].map(({ icon: Icon, label, color }) => (
                <span key={label} className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${color}`}>
                  <Icon size={11} />{label}
                </span>
              ))}
            </div>

            {/* Setup form */}
            <div className="space-y-3 mb-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  <Briefcase size={11} className="inline mr-1" />Job Description
                </label>
                <select value={selectedJD} onChange={e => setSelectedJD(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-4 py-2.5 text-base border border-slate-200/70 bg-white/60 backdrop-blur-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300/60 transition-all">
                  <option value="">— Select a Job Description —</option>
                  {jds.map(j => <option key={j.jobID} value={j.jobID}>#{j.jobID} — {j.title}</option>)}
                </select>
                {jds.length === 0 && <p className="text-xs text-amber-600 mt-1">No active JDs — ask HR to create one first.</p>}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Years of Experience</label>
                <div className="flex items-center gap-3">
                  <input type="range" min={0} max={15} step={1} value={experience}
                    onChange={e => setExperience(Number(e.target.value))}
                    className="flex-1 accent-indigo-600" />
                  <span className="text-base font-bold text-indigo-700 w-12 text-center">{experience} yr{experience !== 1 ? 's' : ''}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Brief Introduction <span className="text-slate-400 normal-case font-normal">(optional)</span></label>
                <textarea value={bio} onChange={e => setBio(e.target.value)} rows={2} placeholder="e.g. I'm a backend developer with 2 years in Python and FastAPI…"
                  className="w-full px-4 py-2.5 text-base border border-slate-200/70 bg-white/60 backdrop-blur-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300/60 transition-all resize-none" />
              </div>
            </div>

            <button onClick={startAI} disabled={starting || !selectedJD}
              className="mt-auto w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-base bg-indigo-600 text-white hover:bg-indigo-700 transition-all duration-200 disabled:opacity-40 shadow-sm shadow-indigo-200/50">
              {starting ? <Loader2 size={18} className="animate-spin" /> : <Bot size={18} />}
              {starting ? 'Starting interview…' : 'Start AI Interview'}
              {!starting && <ChevronRight size={16} />}
            </button>
          </div>
        </div>

        {/* ── HR Interview Card (coming soon) ── */}
        <div className={`${glass} rounded-2xl shadow-sm overflow-hidden flex flex-col opacity-70`}>
          <div className="h-1 bg-gradient-to-r from-violet-400 to-fuchsia-400" />
          <div className="p-8 flex flex-col flex-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-violet-500 flex items-center justify-center shadow-md shadow-violet-200/50">
                <Users size={28} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">HR Live Interview</h2>
                <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 text-slate-500 rounded-full border border-slate-200">Coming Soon</span>
              </div>
            </div>

            <p className="text-slate-600 mb-5 leading-relaxed">
              Schedule a live interview with an HR professional. Pick a time slot, join the video call, and receive
              personalised feedback from an experienced interviewer.
            </p>

            <div className="flex flex-wrap gap-2 mb-6">
              {['Live Video', 'Flexible Scheduling', 'Human Feedback', 'Recording Available'].map(l => (
                <span key={l} className="text-xs font-semibold px-3 py-1.5 rounded-full border border-violet-100 bg-violet-50 text-violet-600">{l}</span>
              ))}
            </div>

            <div className="mt-auto space-y-3">
              <div className="p-4 bg-violet-50/60 rounded-xl border border-violet-100/80 text-sm text-violet-700">
                🚀 HR scheduling module is in Phase 3 of our roadmap — stay tuned!
              </div>
              <button disabled
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-base bg-violet-500 text-white cursor-not-allowed opacity-40">
                <Users size={18} /> Book HR Interview
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
