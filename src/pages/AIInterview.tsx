import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera, CameraOff, Mic, MicOff, Video, AlertCircle,
  ChevronRight, Square, Loader2, CheckCircle, Clock
} from 'lucide-react';
import { apiFetch } from '../lib/api';

interface AIInterviewProps {
  sessionID: string;
  firstQuestion: string;
  jobTitle?: string;
  onEnd: (evalID: number) => void;
  onBack: () => void;
}

type Screen = 'permission' | 'live' | 'processing';

interface AnswerMetrics {
  wordCount: number;
  wordsPerMinute: number;
  durationSec: number;
  keywordsHit: number;
}

const glass = 'bg-white/70 backdrop-blur-sm border border-slate-200/50';
const TOTAL_QUESTIONS = 5;
const TIME_PER_Q = 120; // seconds per question

// Speak a string using Web Speech Synthesis
const speak = (text: string) => {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.rate = 0.95;
  utt.pitch = 1.0;
  window.speechSynthesis.speak(utt);
};

export const AIInterview = ({ sessionID, firstQuestion, jobTitle, onEnd, onBack }: AIInterviewProps) => {
  const [screen, setScreen] = useState<Screen>('permission');
  const [permError, setPermError] = useState('');
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Interview state
  const [questions, setQuestions] = useState<string[]>([firstQuestion]);
  const [currentQ, setCurrentQ] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [qTimer, setQTimer] = useState(TIME_PER_Q);
  const [totalElapsed, setTotalElapsed] = useState(0);
  const [ending, setEnding] = useState(false);
  const [error, setError] = useState('');
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const recognitionRef = useRef<any>(null);
  const answerStartRef = useRef(Date.now());
  const answerWordsRef = useRef<string[]>([]);

  // Attach stream to video element
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, [stream]);

  // Timer for current question
  useEffect(() => {
    if (screen !== 'live') return;
    const id = setInterval(() => {
      setQTimer(t => {
        if (t <= 1) { handleNextQuestion(); return TIME_PER_Q; }
        return t - 1;
      });
      setTotalElapsed(e => e + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [screen, currentQ]);

  // Request permissions
  const requestPermissions = async () => {
    setPermError('');
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(s);
      setScreen('live');
      setTimeout(() => startQuestion(0), 400);
    } catch (e: any) {
      setPermError(
        e.name === 'NotAllowedError'
          ? 'Camera and microphone access was denied. Please allow access in your browser settings and try again.'
          : `Could not access camera/mic: ${e.message}`
      );
    }
  };

  // Start a question — speak it and begin speech recognition
  const startQuestion = useCallback((qIdx: number) => {
    const q = questions[qIdx] || firstQuestion;
    speak(q);
    setQTimer(TIME_PER_Q);
    setLiveTranscript('');
    setTranscript('');
    answerStartRef.current = Date.now();
    answerWordsRef.current = [];
    setIsRecording(true);

    // Web Speech API
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const rec = new SR();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';
      rec.onresult = (e: any) => {
        let interim = '', final = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const t = e.results[i][0].transcript;
          if (e.results[i].isFinal) { final += t; answerWordsRef.current.push(...t.trim().split(/\s+/)); }
          else interim += t;
        }
        setLiveTranscript(interim);
        if (final) setTranscript(prev => (prev + ' ' + final).trim());
      };
      rec.onerror = () => {};
      rec.start();
      recognitionRef.current = rec;
    }
  }, [questions, firstQuestion]);

  const stopRecognition = () => {
    try { recognitionRef.current?.stop(); } catch (_) {}
    recognitionRef.current = null;
    window.speechSynthesis?.cancel();
    setIsRecording(false);
    setLiveTranscript('');
  };

  const collectMetrics = (): AnswerMetrics => {
    const durationSec = Math.max(1, Math.round((Date.now() - answerStartRef.current) / 1000));
    const wordCount = answerWordsRef.current.length;
    return { wordCount, wordsPerMinute: Math.round((wordCount / durationSec) * 60), durationSec, keywordsHit: 0 };
  };

  const handleNextQuestion = async () => {
    if (ending) return;
    stopRecognition();
    const finalTranscript = transcript.trim() || '(No spoken answer recorded)';
    collectMetrics(); // captured for future Phase 3 use

    const nextQIdx = currentQ + 1;

    if (nextQIdx >= TOTAL_QUESTIONS) {
      // Last question answered — end interview
      await submitAndEnd(finalTranscript);
      return;
    }

    // Submit this answer and get next question
    try {
      const res = await apiFetch<{ nextQuestion: string }>('/api/v1/interview/answer', {
        method: 'POST',
        body: JSON.stringify({ sessionID, transcript: finalTranscript }),
      });
      setQuestions(prev => {
        const updated = [...prev];
        updated[nextQIdx] = res.nextQuestion;
        return updated;
      });
    } catch (_) {
      // fallback question already set from questions array or use generic
      if (!questions[nextQIdx]) {
        setQuestions(prev => {
          const u = [...prev];
          u[nextQIdx] = 'Describe a challenge you faced and how you resolved it.';
          return u;
        });
      }
    }

    setCurrentQ(nextQIdx);
    setTranscript('');
    setTimeout(() => startQuestion(nextQIdx), 300);
  };

  const submitAndEnd = async (finalTranscript: string) => {
    setEnding(true);
    // send final answer
    try {
      await apiFetch('/api/v1/interview/answer', {
        method: 'POST',
        body: JSON.stringify({ sessionID, transcript: finalTranscript }),
      });
    } catch (_) {}

    setScreen('processing');
    try {
      const res = await apiFetch<{ evalID: number }>('/api/v1/interview/end', {
        method: 'POST',
        body: JSON.stringify({ sessionID }),
      });
      setTimeout(() => onEnd(res.evalID), 1800);
    } catch (e: any) {
      setError(e?.message || 'Failed to finalize interview');
      setScreen('live');
      setEnding(false);
    }
  };

  const handleEndEarly = () => {
    if (ending) return;
    stopRecognition();
    submitAndEnd(transcript.trim() || '(Ended early)');
  };

  const toggleCam = () => {
    stream?.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
    setCamOn(c => !c);
  };

  const toggleMic = () => {
    stream?.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
    setMicOn(m => !m);
  };

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const qTimerPct = ((TIME_PER_Q - qTimer) / TIME_PER_Q) * 100;

  // ── Permission Screen ─────────────────────────────────────────────────────
  if (screen === 'permission') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className={`${glass} rounded-3xl p-10 max-w-md w-full text-center shadow-sm`}>
          <div className="w-20 h-20 rounded-2xl bg-indigo-600 flex items-center justify-center mx-auto mb-6 shadow-md shadow-indigo-200/50">
            <Video size={36} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Enable Camera & Mic</h2>
          <p className="text-slate-500 mb-8 leading-relaxed">
            Your AI interview requires camera and microphone access. Your recording stays local — nothing is uploaded to any third-party server.
          </p>
          <div className="flex justify-center gap-8 mb-8">
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                <Camera size={22} className="text-indigo-600" />
              </div>
              <span className="text-sm font-medium text-slate-600">Camera</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                <Mic size={22} className="text-indigo-600" />
              </div>
              <span className="text-sm font-medium text-slate-600">Microphone</span>
            </div>
          </div>
          {permError && (
            <div className="flex items-start gap-2 bg-rose-50/80 border border-rose-200/60 rounded-xl p-4 mb-5 text-left">
              <AlertCircle size={16} className="text-rose-500 mt-0.5 shrink-0" />
              <p className="text-sm text-rose-700">{permError}</p>
            </div>
          )}
          <button onClick={requestPermissions}
            className="w-full py-3.5 rounded-xl font-bold text-base bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-200/50">
            Allow & Begin Interview
          </button>
          <button onClick={onBack} className="mt-3 text-sm text-slate-400 hover:text-slate-600 transition-colors">← Go back</button>
        </div>
      </div>
    );
  }

  // ── Processing Screen ─────────────────────────────────────────────────────
  if (screen === 'processing') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className={`${glass} rounded-3xl p-12 max-w-sm w-full text-center shadow-sm`}>
          <div className="w-20 h-20 rounded-2xl bg-indigo-600 flex items-center justify-center mx-auto mb-6 shadow-md shadow-indigo-200/50">
            <Loader2 size={36} className="text-white animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Analysing Your Interview</h2>
          <p className="text-slate-500 leading-relaxed">Our AI is evaluating your answers for relevance, fluency, and confidence…</p>
          <div className="mt-6 space-y-3">
            {['Transcribing answers', 'Scoring semantic relevance', 'Calculating fluency metrics', 'Generating your report'].map((s, i) => (
              <div key={s} className="flex items-center gap-3 text-sm text-slate-500">
                <CheckCircle size={15} className={i < 2 ? 'text-emerald-500' : 'text-slate-300'} />
                {s}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Live Interview Screen ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col px-4 py-6 max-w-4xl mx-auto gap-4">

      {/* Top bar */}
      <div className={`${glass} rounded-2xl px-6 py-4 flex items-center justify-between shadow-sm`}>
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
          <span className="text-sm font-bold text-slate-700 uppercase tracking-wide">Recording</span>
          <span className="text-sm text-slate-400">· {jobTitle || 'AI Interview'}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold text-slate-600">Q <span className="text-indigo-600 font-bold">{currentQ + 1}</span> / {TOTAL_QUESTIONS}</span>
          <span className="font-mono text-sm text-slate-600 flex items-center gap-1"><Clock size={13} />{formatTime(totalElapsed)}</span>
        </div>
      </div>

      {error && <div className="px-4 py-3 rounded-xl bg-rose-50/80 border border-rose-200/60 text-rose-700 text-sm">{error}</div>}

      <div className="flex flex-col lg:flex-row gap-4 flex-1">

        {/* Left — Question + Transcript */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Question card */}
          <div className={`${glass} rounded-2xl p-6 shadow-sm`}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Question {currentQ + 1}</span>
              <div className="flex-1 h-px bg-slate-200/60" />
              <span className="text-xs text-slate-400">{qTimer}s remaining</span>
            </div>
            {/* Timer bar */}
            <div className="w-full h-1 bg-slate-100 rounded-full mb-4">
              <div className={`h-1 rounded-full transition-all duration-1000 ${qTimerPct > 75 ? 'bg-rose-500' : qTimerPct > 50 ? 'bg-amber-500' : 'bg-indigo-500'}`}
                style={{ width: `${qTimerPct}%` }} />
            </div>
            <p className="text-xl font-semibold text-slate-800 leading-relaxed">
              {questions[currentQ] || '…'}
            </p>
          </div>

          {/* Live transcript */}
          <div className={`${glass} rounded-2xl p-5 shadow-sm flex-1`} style={{ minHeight: '160px' }}>
            <div className="flex items-center gap-2 mb-3">
              {isRecording && <span className="flex items-center gap-1.5 text-xs font-bold text-rose-600"><span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />Listening…</span>}
              {!isRecording && <span className="text-xs text-slate-400">Your answer will appear here as you speak</span>}
            </div>
            <p className="text-base text-slate-700 leading-relaxed">
              {transcript}
              {liveTranscript && <span className="text-slate-400 italic"> {liveTranscript}</span>}
              {!transcript && !liveTranscript && <span className="text-slate-300 italic">Start speaking…</span>}
            </p>
          </div>
        </div>

        {/* Right — Camera + controls */}
        <div className="flex flex-col gap-4 lg:w-64">
          {/* Camera feed */}
          <div className={`${glass} rounded-2xl overflow-hidden shadow-sm relative`} style={{ aspectRatio: '4/3' }}>
            <video ref={videoRef} autoPlay muted playsInline
              className={`w-full h-full object-cover ${!camOn ? 'opacity-0' : ''}`} />
            {!camOn && (
              <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center">
                <CameraOff size={28} className="text-slate-400" />
              </div>
            )}
            {/* REC badge */}
            <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />REC
            </div>
          </div>

          {/* Camera / Mic toggles */}
          <div className="flex gap-2">
            <button onClick={toggleCam}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-150 ${camOn ? 'bg-white/60 border-slate-200/70 text-slate-700' : 'bg-slate-800 border-slate-700 text-white'}`}>
              {camOn ? <Camera size={14} /> : <CameraOff size={14} />}
              {camOn ? 'Cam On' : 'Cam Off'}
            </button>
            <button onClick={toggleMic}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-150 ${micOn ? 'bg-white/60 border-slate-200/70 text-slate-700' : 'bg-slate-800 border-slate-700 text-white'}`}>
              {micOn ? <Mic size={14} /> : <MicOff size={14} />}
              {micOn ? 'Mic On' : 'Mic Off'}
            </button>
          </div>

          {/* Progress dots */}
          <div className={`${glass} rounded-2xl p-4 shadow-sm`}>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Progress</p>
            <div className="flex gap-2">
              {Array.from({ length: TOTAL_QUESTIONS }).map((_, i) => (
                <div key={i} className={`flex-1 h-2 rounded-full transition-all duration-300 ${i < currentQ ? 'bg-emerald-400' : i === currentQ ? 'bg-indigo-500' : 'bg-slate-200'}`} />
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-2 text-center">{currentQ} of {TOTAL_QUESTIONS} answered</p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2">
            <button onClick={handleNextQuestion} disabled={ending}
              className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm bg-indigo-600 text-white hover:bg-indigo-700 transition-all disabled:opacity-40 shadow-sm shadow-indigo-200/50">
              {currentQ + 1 >= TOTAL_QUESTIONS
                ? <><CheckCircle size={15} />Finish Interview</>
                : <><ChevronRight size={15} />Next Question</>}
            </button>
            <button onClick={handleEndEarly} disabled={ending}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm border border-rose-200/70 text-rose-600 bg-rose-50/60 hover:bg-rose-100 transition-all disabled:opacity-40">
              {ending ? <Loader2 size={14} className="animate-spin" /> : <Square size={14} />}
              {ending ? 'Ending…' : 'End Early'}
            </button>
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-400 text-center">
        Speak clearly — your answers are transcribed in real time. Click <strong>Next Question</strong> when done with each answer.
      </p>
    </div>
  );
};
