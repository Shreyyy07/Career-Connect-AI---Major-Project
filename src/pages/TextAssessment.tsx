import { useState, useEffect, useRef } from 'react';
import { Bot, Send, Square, Loader2, MessageSquare, Clock } from 'lucide-react';
import { apiFetch } from '../lib/api';

interface Message {
  role: 'ai' | 'candidate';
  text: string;
  ts: number;
}

interface TextAssessmentProps {
  sessionID: string;
  firstQuestion: string;
  jobTitle?: string;
  onEnd: (evalID: number) => void;
  onBack: () => void;
}

const glass = 'bg-white/70 backdrop-blur-sm border border-slate-200/50';

export const TextAssessment = ({ sessionID, firstQuestion, jobTitle, onEnd, onBack }: TextAssessmentProps) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', text: firstQuestion, ts: Date.now() },
  ]);
  const [draft, setDraft] = useState('');
  const [thinking, setThinking] = useState(false);
  const [ending, setEnding] = useState(false);
  const [qCount, setQCount] = useState(1);
  const [error, setError] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const startTime = useRef(Date.now());

  useEffect(() => {
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startTime.current) / 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const sendAnswer = async () => {
    const text = draft.trim();
    if (!text || thinking || ending) return;
    setDraft(''); setError('');
    setMessages(prev => [...prev, { role: 'candidate', text, ts: Date.now() }]);
    setThinking(true);
    try {
      const res = await apiFetch<{ nextQuestion: string }>('/api/v1/interview/answer', {
        method: 'POST',
        body: JSON.stringify({ sessionID, transcript: text }),
      });
      setMessages(prev => [...prev, { role: 'ai', text: res.nextQuestion, ts: Date.now() }]);
      setQCount(q => q + 1);
    } catch (e: any) { setError(e?.message || 'Failed to get next question'); }
    finally { setThinking(false); }
  };

  const endInterview = async () => {
    if (ending) return;
    setEnding(true); setError('');
    try {
      const res = await apiFetch<{ evalID: number }>('/api/v1/interview/end', {
        method: 'POST', body: JSON.stringify({ sessionID }),
      });
      onEnd(res.evalID);
    } catch (e: any) { setError(e?.message || 'Failed to end'); setEnding(false); }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAnswer(); }
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className={`${glass} rounded-2xl px-6 py-4 flex items-center justify-between shadow-sm`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
            <Bot size={18} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-slate-800 text-sm leading-tight">Practice Assessment</p>
            <p className="text-xs text-slate-400">{jobTitle || 'Text Q&A'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500 flex items-center gap-1"><MessageSquare size={13} /> Q <b className="text-slate-800">{qCount}</b></span>
          <span className="text-sm text-slate-500 flex items-center gap-1 font-mono"><Clock size={13} />{formatTime(elapsed)}</span>
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />Live
          </span>
        </div>
      </div>
      {error && <div className="px-4 py-3 rounded-xl bg-rose-50/80 border border-rose-200/60 text-rose-700 text-sm">{error}</div>}
      <div className={`${glass} rounded-2xl shadow-sm flex-1 overflow-y-auto p-5`} style={{ minHeight: '320px', maxHeight: '460px' }}>
        <div className="space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-2.5 ${m.role === 'candidate' ? 'flex-row-reverse' : ''}`}>
              {m.role === 'ai'
                ? <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0 mt-0.5"><Bot size={13} className="text-white" /></div>
                : <div className="w-7 h-7 rounded-lg bg-slate-200 flex items-center justify-center shrink-0 text-xs font-bold text-slate-600 mt-0.5">You</div>}
              <div className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${m.role === 'ai' ? 'bg-white border border-slate-200/60 text-slate-800 rounded-tl-sm' : 'bg-indigo-600 text-white rounded-tr-sm'}`}>
                {m.text}
              </div>
            </div>
          ))}
          {thinking && (
            <div className="flex gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0"><Bot size={13} className="text-white" /></div>
              <div className="bg-white border border-slate-200/60 rounded-2xl rounded-tl-sm px-4 py-2.5 flex items-center gap-2 shadow-sm">
                <Loader2 size={13} className="text-indigo-400 animate-spin" /><span className="text-sm text-slate-400 italic">Thinking…</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>
      <div className={`${glass} rounded-2xl shadow-sm p-4`}>
        <textarea value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={handleKeyDown}
          placeholder="Type your answer… (Enter to send)" rows={2} disabled={thinking || ending}
          className="w-full resize-none bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none leading-relaxed" />
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/60">
          <button onClick={onBack} className="text-sm text-slate-400 hover:text-slate-600 transition-colors">← Back</button>
          <div className="flex gap-2">
            <button onClick={endInterview} disabled={ending || thinking}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold border border-rose-200/70 text-rose-600 bg-rose-50/60 hover:bg-rose-100 transition-all disabled:opacity-40">
              {ending ? <Loader2 size={13} className="animate-spin" /> : <Square size={13} />}{ending ? 'Ending…' : 'End'}
            </button>
            <button onClick={sendAnswer} disabled={!draft.trim() || thinking || ending}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-all disabled:opacity-40 shadow-sm shadow-indigo-200/50">
              <Send size={13} />Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
