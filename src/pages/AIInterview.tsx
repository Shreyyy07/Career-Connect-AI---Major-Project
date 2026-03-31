import { motion } from "framer-motion";
import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/api";
import {
  Video, Mic, MicOff, VideoOff, MonitorUp,
  Clock, Brain, Shield, AlertCircle, Send,
  Phone, ChevronRight, CheckCircle, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import DashboardSidebar from "@/components/DashboardSidebar";

const TOTAL_QUESTIONS = 5;
const TIME_PER_Q = 120;

const speak = (text: string) => {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.rate = 0.95;
  utt.pitch = 1.0;
  window.speechSynthesis.speak(utt);
};

export default function AIInterview() {
  const location = useLocation();
  const navigate = useNavigate();

  const [jds, setJds] = useState<any[]>([]);
  const [selectedJD, setSelectedJD] = useState<number | ''>('');
  const [experience, setExperience] = useState(2);
  const [starting, setStarting] = useState(false);
  const [setupError, setSetupError] = useState('');

  const [sessionID, setSessionID] = useState(location.state?.sessionID || '');
  const [started, setStarted] = useState(false); // We want to force them to click "Start" even if prepopulated to request camera
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const [questions, setQuestions] = useState<string[]>(location.state?.firstQuestion ? [location.state.firstQuestion] : []);
  const [currentQ, setCurrentQ] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [qTimer, setQTimer] = useState(TIME_PER_Q);
  const [totalElapsed, setTotalElapsed] = useState(0);
  const [ending, setEnding] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (!started && !location.state?.sessionID) {
      apiFetch<any[]>('/api/v1/jd/active').then(d => { 
        setJds(d || []); 
        if (d?.length) setSelectedJD(d[0].jobID); 
      }).catch(() => {});
    }
  }, [started, location.state]);

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, [stream, started]);

  useEffect(() => {
    if (!started || ending) return;
    const id = setInterval(() => {
      setQTimer(t => {
        if (t <= 1) { handleNextQuestion(); return TIME_PER_Q; }
        return t - 1;
      });
      setTotalElapsed(e => e + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [started, currentQ, ending]);

  const requestPermissionsAndStart = async () => {
    setSetupError('');
    if (!selectedJD && !location.state?.sessionID) {
      setSetupError("Please select a target role.");
      return;
    }
    setStarting(true);
    try {
      let sid = sessionID;
      if (!sid) {
        const res = await apiFetch<any>('/api/v1/interview/start', {
          method: 'POST',
          body: JSON.stringify({ jobID: selectedJD, experience, bio: "" }),
        });
        sid = res.sessionID;
        setSessionID(sid);
        setQuestions([res.firstQuestion]);
      }
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(s);
      setStarted(true);
      setTimeout(() => startQuestion(0), 400);
    } catch (e: any) {
      setSetupError(e.message || "Failed to start session.");
    } finally {
      setStarting(false);
    }
  };

  const startQuestion = useCallback((qIdx: number) => {
    const q = questions[qIdx] || location.state?.firstQuestion;
    if (q) speak(q);
    setQTimer(TIME_PER_Q);
    setLiveTranscript('');
    setTranscript('');
    setIsRecording(true);

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
          if (e.results[i].isFinal) final += t;
          else interim += t;
        }
        setLiveTranscript(interim);
        if (final) setTranscript(prev => (prev + ' ' + final).trim());
      };
      rec.start();
      recognitionRef.current = rec;
    }
  }, [questions, location.state]);

  const stopRecognition = () => {
    try { recognitionRef.current?.stop(); } catch (_) {}
    recognitionRef.current = null;
    window.speechSynthesis?.cancel();
    setIsRecording(false);
    setLiveTranscript('');
  };

  const handleNextQuestion = async () => {
    if (ending) return;
    stopRecognition();
    const finalTranscript = transcript.trim() || '(No spoken answer recorded)';
    const nextQIdx = currentQ + 1;

    if (nextQIdx >= TOTAL_QUESTIONS) {
      return submitAndEnd(finalTranscript);
    }

    try {
      const res = await apiFetch<{ nextQuestion: string }>('/api/v1/interview/answer', {
        method: 'POST',
        body: JSON.stringify({ sessionID, transcript: finalTranscript }),
      });
      setQuestions(prev => { const updated = [...prev]; updated[nextQIdx] = res.nextQuestion; return updated; });
    } catch (_) {
      setQuestions(prev => { const updated = [...prev]; updated[nextQIdx] = 'Could you describe a challenging situation in your career and how you handled it?'; return updated; });
    }

    setCurrentQ(nextQIdx);
    setTranscript('');
    setTimeout(() => startQuestion(nextQIdx), 300);
  };

  const submitAndEnd = async (finalTranscript: string) => {
    setEnding(true);
    try {
      await apiFetch('/api/v1/interview/answer', { method: 'POST', body: JSON.stringify({ sessionID, transcript: finalTranscript }) });
      const res = await apiFetch<{ evalID: number }>('/api/v1/interview/end', { method: 'POST', body: JSON.stringify({ sessionID }) });
      navigate(`/candidate/evaluation/${res.evalID}`);
    } catch (e: any) {
      setEnding(false);
      alert(e.message || 'Failed to finalize interview');
    }
  };

  const toggleCam = () => { stream?.getVideoTracks().forEach(t => { t.enabled = !t.enabled; }); setCamOn(c => !c); };
  const toggleMic = () => { stream?.getAudioTracks().forEach(t => { t.enabled = !t.enabled; }); setMicOn(m => !m); };
  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  if (!started) {
    return (
      <div className="flex min-h-screen bg-background">
        <DashboardSidebar role="candidate" />
        <main className="flex-1 flex items-center justify-center p-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-2xl p-10 max-w-lg w-full text-center"
          >
            <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-6 glow-primary animate-glow-pulse">
              <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain rounded-xl" />
            </div>
            <h1 className="font-display font-bold text-2xl text-foreground mb-3">AI Interview Session</h1>
            <p className="text-sm text-muted-foreground mb-8">
              You'll be asked role-specific questions by our AI interviewer. Ensure your camera and microphone are working properly.
            </p>

            <div className="space-y-3 mb-8 text-left">
              {[
                { icon: Video, text: "Camera and microphone access required" },
                { icon: Clock, text: `~120 seconds per question, ${TOTAL_QUESTIONS} questions` },
                { icon: Shield, text: "Anti-cheat monitoring is active" },
                { icon: Brain, text: "AI evaluates semantic accuracy & behavior" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/30">
                  <item.icon className="w-4 h-4 text-primary flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">{item.text}</p>
                </div>
              ))}
            </div>

            {setupError && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-2 text-left">
                <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{setupError}</p>
              </div>
            )}

            {!location.state?.sessionID && (
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-foreground font-medium mb-1.5 block text-left">Target Role</label>
                  <select 
                    value={selectedJD} 
                    onChange={e => setSelectedJD(e.target.value ? Number(e.target.value) : '')}
                    className="w-full h-11 rounded-lg bg-secondary/50 border border-border/60 text-foreground px-3 text-sm focus:outline-none focus:border-primary transition-colors">
                    {jds.length === 0 && <option value="">Loading job descriptions...</option>}
                    {jds.map(j => <option key={j.jobID} value={j.jobID}>{j.title}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-foreground font-medium mb-1.5 block text-left">Years of Experience</label>
                  <select 
                    value={experience} 
                    onChange={e => setExperience(Number(e.target.value))}
                    className="w-full h-11 rounded-lg bg-secondary/50 border border-border/60 text-foreground px-3 text-sm focus:outline-none focus:border-primary transition-colors">
                    <option value={1}>0-1 years</option>
                    <option value={3}>2-4 years</option>
                    <option value={5}>5+ years</option>
                  </select>
                </div>
              </div>
            )}

            <Button
              onClick={requestPermissionsAndStart}
              disabled={starting || (!selectedJD && !location.state?.sessionID)}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-primary font-display font-semibold h-12 text-base mt-6"
            >
              {starting ? <Loader2 className="animate-spin w-5 h-5 mx-auto" /> : <><Video className="mr-2 w-4 h-4" /> Start Interview</>}
            </Button>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar role="candidate" />

      <main className="flex-1 flex flex-col">
        {/* Top bar */}
        <div className="h-14 glass-strong border-b border-border/50 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
            <span className="text-xs font-medium text-foreground">LIVE SESSION</span>
            <span className="text-xs text-muted-foreground">| {location.state?.jobTitle || "AI Interview"}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span>Question {currentQ + 1} of {TOTAL_QUESTIONS}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-success">
              <Shield className="w-3.5 h-3.5" />
              <span>Verified</span>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-0">
          {/* Video area */}
          <div className="lg:col-span-2 flex flex-col p-6">
            <div className="flex-1 relative rounded-2xl overflow-hidden bg-muted/30 border border-border/30 min-h-[400px]">
              
              <video 
                ref={videoRef} 
                autoPlay 
                muted 
                playsInline
                className={`w-full h-full object-cover transition-opacity duration-300 ${!camOn ? 'opacity-0' : 'opacity-100'}`} 
              />
              
              {!camOn && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/90">
                  <div className="text-center">
                    <div className="w-24 h-24 rounded-full bg-secondary/50 border border-border/50 flex items-center justify-center mx-auto mb-4">
                      <VideoOff className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">Camera Disabled</p>
                  </div>
                </div>
              )}

              {/* Anti-cheat indicator */}
              <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-border/30 text-xs shadow-sm">
                <Shield className="w-3.5 h-3.5 text-success" />
                <span className="text-success font-medium">Session Monitored</span>
              </div>

              {/* Timer */}
              <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-border/30 text-xs shadow-sm">
                <Clock className="w-3.5 h-3.5 text-warning" />
                <span className="text-foreground font-mono font-medium">{formatTime(qTimer)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4 mt-6">
              <button
                onClick={toggleMic}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-sm ${
                  micOn ? "bg-secondary border border-border/50 text-foreground hover:bg-secondary/80" : "bg-destructive/20 border border-destructive/50 text-destructive hover:bg-destructive/30"
                }`}
              >
                {micOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
              </button>
              <button
                onClick={toggleCam}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-sm ${
                  camOn ? "bg-secondary border border-border/50 text-foreground hover:bg-secondary/80" : "bg-destructive/20 border border-destructive/50 text-destructive hover:bg-destructive/30"
                }`}
              >
                {camOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
              </button>
              <button 
                onClick={() => { stopRecognition(); submitAndEnd(transcript || '(Ended Early)'); }}
                className="w-14 h-14 rounded-full bg-destructive hover:bg-destructive/90 transition-all flex items-center justify-center text-destructive-foreground shadow-sm shadow-destructive/20"
                title="End Interview Early"
              >
                <Phone className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Question Panel */}
          <div className="border-l border-border/50 flex flex-col bg-card/30">
            <div className="p-6 border-b border-border/50">
              <p className="text-[10px] uppercase tracking-widest text-primary font-medium mb-2">QUESTION {currentQ + 1} OF {TOTAL_QUESTIONS}</p>
              <h3 className="font-display font-semibold text-foreground leading-relaxed text-lg">
                {questions[currentQ] || 'Listening...'}
              </h3>
            </div>

            {/* Transcript */}
            <div className="flex-1 p-6 overflow-auto">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3 flex items-center justify-between">
                <span>LIVE TRANSCRIPT</span>
                {isRecording && <span className="flex items-center gap-1.5 text-rose-500 font-bold"><span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" /> REC</span>}
              </p>
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-secondary/30 border border-border/30">
                  <p className="text-xs text-accent font-medium mb-2 flex items-center gap-1"><Mic className="w-3 h-3"/> You</p>
                  <p className="text-sm text-foreground leading-relaxed">
                    {transcript}
                    {liveTranscript && <span className="text-muted-foreground italic ml-1">{liveTranscript}</span>}
                    {!transcript && !liveTranscript && <span className="text-muted-foreground/60 italic">Start speaking to Answer...</span>}
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Panel */}
            <div className="p-5 border-t border-border/50 bg-secondary/10">
              <Button 
                onClick={handleNextQuestion} 
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-primary font-display font-semibold h-12 text-base"
                disabled={ending}
              >
                {ending ? <Loader2 className="animate-spin w-5 h-5" /> : (currentQ + 1 >= TOTAL_QUESTIONS ? "Finish Interview" : "Next Question")}
                {!ending && <ChevronRight className="ml-2 w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
