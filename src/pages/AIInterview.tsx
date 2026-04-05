import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/api";
import {
  Video, Mic, MicOff, VideoOff,
  Clock, Brain, Shield, AlertCircle, Send,
  Phone, ChevronRight, Loader2, Smile
} from "lucide-react";
import { Button } from "@/components/ui/button";
import DashboardSidebar from "@/components/DashboardSidebar";
import * as faceapi from "face-api.js";

const TOTAL_QUESTIONS = 5;
const TIME_PER_Q = 120;
const FRAME_INTERVAL_MS = 2000; // Capture frame every 2 seconds

const speak = (text: string) => {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.rate = 0.95;
  utt.pitch = 1.0;
  window.speechSynthesis.speak(utt);
};

// Emotion → display label + color
const EMOTION_DISPLAY: Record<string, { label: string; color: string; emoji: string }> = {
  happy:     { label: "Confident",  color: "text-emerald-400", emoji: "😊" },
  neutral:   { label: "Neutral",    color: "text-blue-400",    emoji: "😐" },
  sad:       { label: "Uncertain",  color: "text-indigo-400",  emoji: "😔" },
  angry:     { label: "Tense",      color: "text-rose-400",    emoji: "😤" },
  surprise:  { label: "Engaged",    color: "text-yellow-400",  emoji: "😮" },
  fear:      { label: "Anxious",    color: "text-amber-400",   emoji: "😰" },
  disgust:   { label: "Skeptical",  color: "text-orange-400",  emoji: "😒" },
};

export default function AIInterview() {
  const location = useLocation();
  const navigate = useNavigate();

  const [jds, setJds] = useState<any[]>([]);
  const [selectedJD, setSelectedJD] = useState<number | "">("");
  const [experience, setExperience] = useState(2);
  const [starting, setStarting] = useState(false);
  const [setupError, setSetupError] = useState("");
  const [roleDescription, setRoleDescription] = useState(""); // §7.2 optional free-text

  const [sessionID, setSessionID] = useState(location.state?.sessionID || "");
  const [started, setStarted] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const [questions, setQuestions] = useState<string[]>(
    location.state?.firstQuestion ? [location.state.firstQuestion] : []
  );
  const [currentQ, setCurrentQ] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [liveTranscript, setLiveTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [qTimer, setQTimer] = useState(TIME_PER_Q);
  const [totalElapsed, setTotalElapsed] = useState(0);
  const [ending, setEnding] = useState(false);
  const [cheatWarning, setCheatWarning] = useState(""); // Anti-cheat warning from backend

  // Emotion tracking state
  const [liveEmotion, setLiveEmotion] = useState<{
    dominant: string;
    label: string;
    color: string;
    emoji: string;
  } | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const recognitionRef = useRef<any>(null);
  const frameIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionIdRef = useRef(sessionID); // always fresh inside interval
  const elapsedRef = useRef(0);
  const faceApiReadyRef = useRef(false);

  // Keep refs in sync
  useEffect(() => { sessionIdRef.current = sessionID; }, [sessionID]);
  useEffect(() => { elapsedRef.current = totalElapsed; }, [totalElapsed]);

  // ── Load face-api.js models once on mount ─────────────────────────────────
  useEffect(() => {
    const MODEL_URL = '/models';
    Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
    ])
      .then(() => { faceApiReadyRef.current = true; console.log('[face-api.js] Models loaded'); })
      .catch((err) => console.warn('[face-api.js] Model load failed:', err));
  }, []);

  useEffect(() => {
    if (!started && !location.state?.sessionID) {
      apiFetch<any[]>("/api/v1/jd/active")
        .then((d) => {
          setJds(d || []);
          if (d?.length) setSelectedJD(d[0].jobID);
        })
        .catch(() => {});
    }
  }, [started, location.state]);

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [stream, started]);

  // Q timer
  useEffect(() => {
    if (!started || ending) return;
    const id = setInterval(() => {
      setQTimer((t) => {
        if (t <= 1) { handleNextQuestion(); return TIME_PER_Q; }
        return t - 1;
      });
      setTotalElapsed((e) => e + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [started, currentQ, ending]);

  // ── Frame capture loop (face-api.js browser-side detection) ─────────────
  const startFrameCapture = useCallback((sid: string) => {
    if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);

    frameIntervalRef.current = setInterval(async () => {
      const video = videoRef.current;
      if (!video || video.readyState < 2) return;

      let dominant = 'neutral';
      let emotions: Record<string, number> = { neutral: 1.0 };

      // ── face-api.js (browser-side, instant) ─────────────────────────────
      if (faceApiReadyRef.current) {
        try {
          const detection = await faceapi
            .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.3 }))
            .withFaceExpressions();

          if (detection?.expressions) {
            const raw = detection.expressions as unknown as Record<string, number>;
            const total = Object.values(raw).reduce((s, v) => s + v, 0) || 1;
            emotions = Object.fromEntries(
              Object.entries(raw).map(([k, v]) => [k, parseFloat((v / total).toFixed(4))])
            );
            dominant = Object.entries(emotions).sort(([, a], [, b]) => b - a)[0][0];
          }
        } catch (_) { /* non-fatal */ }
      }

      // Update live badge immediately (no round-trip delay)
      const display = EMOTION_DISPLAY[dominant] ?? { label: dominant, color: 'text-foreground', emoji: '😐' };
      setLiveEmotion({ dominant, ...display });

      // ── Priority 3: YOLOv8 Anti-Cheat (Send frame to backend) ─────────
      let frameB64 = '';
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth / 2; // scale down to save bandwidth
        canvas.height = video.videoHeight / 2;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          frameB64 = canvas.toDataURL('image/jpeg', 0.5).split(',')[1] || '';
        }
      } catch (e) {
        console.warn("Failed to grab base64 frame", e);
      }

      // Persist to backend (send precomputed scores and frame)
      try {
        const res = await apiFetch<any>('/api/v1/analysis/emotion-frame', {
          method: 'POST',
          body: JSON.stringify({
            session_id: sid,
            frame_b64: frameB64,
            timestamp_sec: elapsedRef.current,
            precomputed_emotions: emotions,
          }),
        });
        
        // Handle Anti-Cheat YOLO Response
        if (res?.cheat_warning) {
          setCheatWarning(res.cheat_warning);
          // clear it after 4 seconds
          setTimeout(() => setCheatWarning(""), 4000);
        }
      } catch (_) { /* Non-fatal */ }
    }, FRAME_INTERVAL_MS);
  }, []);

  const stopFrameCapture = useCallback(() => {
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }
  }, []);

  // ── Session start ────────────────────────────────────────────────────────
  const requestPermissionsAndStart = async () => {
    setSetupError("");
    if (!selectedJD && !location.state?.sessionID) {
      setSetupError("Please select a target role.");
      return;
    }

    // §7.1 Hard camera permission block – verify BEFORE creating a session
    try {
      const testStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      testStream.getTracks().forEach(t => t.stop()); // release immediately
    } catch {
      setSetupError(
        "🚫 Camera & microphone access is required to start the interview. " +
        "Please click the lock 🔒 icon in your browser URL bar, allow Camera & Mic, then refresh."
      );
      return; // Hard block — do NOT proceed
    }

    setStarting(true);
    try {
      let sid = sessionID;
      if (!sid) {
        const res = await apiFetch<any>("/api/v1/interview/start", {
          method: "POST",
          body: JSON.stringify({
            jobID: selectedJD,
            experience,
            bio: roleDescription.trim().slice(0, 300), // §7.2 role description context
          }),
        });
        sid = res.sessionID;
        setSessionID(sid);
        sessionIdRef.current = sid;
        setQuestions([res.firstQuestion]);
      }
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(s);
      setStarted(true);
      setTimeout(() => {
        startQuestion(0);
        startFrameCapture(sid);
      }, 400);
    } catch (e: any) {
      setSetupError(e.message || "Failed to start session.");
    } finally {
      setStarting(false);
    }
  };


  const startQuestion = useCallback(
    (qIdx: number) => {
      const q = questions[qIdx] || location.state?.firstQuestion;
      if (q) speak(q);
      setQTimer(TIME_PER_Q);
      setLiveTranscript("");
      setTranscript("");
      setIsRecording(true);

      if ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) {
        const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const rec = new SR();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = "en-US";
        rec.onresult = (e: any) => {
          let interim = "",
            final = "";
          for (let i = e.resultIndex; i < e.results.length; i++) {
            const t = e.results[i][0].transcript;
            if (e.results[i].isFinal) final += t;
            else interim += t;
          }
          setLiveTranscript(interim);
          if (final) setTranscript((prev) => (prev + " " + final).trim());
        };
        rec.start();
        recognitionRef.current = rec;
      }
    },
    [questions, location.state]
  );

  const stopRecognition = () => {
    try { recognitionRef.current?.stop(); } catch (_) {}
    recognitionRef.current = null;
    window.speechSynthesis?.cancel();
    setIsRecording(false);
    setLiveTranscript("");
  };

  const handleNextQuestion = async () => {
    if (ending) return;
    stopRecognition();
    const finalTranscript = transcript.trim() || "(No spoken answer recorded)";
    const nextQIdx = currentQ + 1;

    if (nextQIdx >= TOTAL_QUESTIONS) {
      return submitAndEnd(finalTranscript);
    }

    try {
      const res = await apiFetch<{ nextQuestion: string }>("/api/v1/interview/answer", {
        method: "POST",
        body: JSON.stringify({ sessionID, transcript: finalTranscript }),
      });
      setQuestions((prev) => {
        const updated = [...prev];
        updated[nextQIdx] = res.nextQuestion;
        return updated;
      });
    } catch (_) {
      setQuestions((prev) => {
        const updated = [...prev];
        updated[nextQIdx] =
          "Could you describe a challenging situation in your career and how you handled it?";
        return updated;
      });
    }

    setCurrentQ(nextQIdx);
    setTranscript("");
    setTimeout(() => startQuestion(nextQIdx), 300);
  };

  const submitAndEnd = async (finalTranscript: string) => {
    setEnding(true);
    stopFrameCapture(); // Stop capturing frames before ending
    try {
      await apiFetch("/api/v1/interview/answer", {
        method: "POST",
        body: JSON.stringify({ sessionID, transcript: finalTranscript }),
      });
      const res = await apiFetch<{ evalID: number }>("/api/v1/interview/end", {
        method: "POST",
        body: JSON.stringify({ sessionID }),
      });
      navigate(`/candidate/evaluation/${res.evalID}`);
    } catch (e: any) {
      setEnding(false);
      alert(e.message || "Failed to finalize interview");
    }
  };

  const toggleCam = () => {
    stream?.getVideoTracks().forEach((t) => { t.enabled = !t.enabled; });
    setCamOn((c) => !c);
  };
  const toggleMic = () => {
    stream?.getAudioTracks().forEach((t) => { t.enabled = !t.enabled; });
    setMicOn((m) => !m);
  };
  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // ── Pre-interview setup screen ───────────────────────────────────────────
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
            <div className="w-20 h-20 rounded-2xl bg-[#00e5ff]/10 border border-[#00e5ff]/30 flex items-center justify-center mx-auto mb-6 glow-primary animate-glow-pulse">
              <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain rounded-xl" />
            </div>
            <h1 className="font-display font-bold text-2xl text-foreground mb-3">
              AI Interview Session
            </h1>
            <p className="text-sm text-muted-foreground mb-8">
              You'll be asked role-specific questions by our AI interviewer. Ensure your camera and
              microphone are working properly.
            </p>

            <div className="space-y-3 mb-8 text-left">
              {[
                { icon: Video, text: "Camera and microphone access required" },
                { icon: Clock, text: `~120 seconds per question, ${TOTAL_QUESTIONS} questions` },
                { icon: Shield, text: "Anti-cheat monitoring active — stay in frame" },
                { icon: Brain, text: "AI evaluates semantic accuracy & emotional signals" },
                { icon: Smile, text: "Real-time face-api.js emotion analysis (7 emotions)" },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/30"
                >
                  <item.icon className="w-4 h-4 text-[#00e5ff] flex-shrink-0" />
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
                  <label className="text-sm text-foreground font-medium mb-1.5 block text-left">
                    Target Role
                  </label>
                  <select
                    value={selectedJD}
                    onChange={(e) => setSelectedJD(e.target.value ? Number(e.target.value) : "")}
                    className="w-full h-11 rounded-lg bg-secondary/50 border border-border/60 text-foreground px-3 text-sm focus:outline-none focus:border-[#00e5ff] transition-colors"
                  >
                    {jds.length === 0 && (
                      <option value="">Loading job descriptions...</option>
                    )}
                    {jds.map((j) => (
                      <option key={j.jobID} value={j.jobID}>
                        {j.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-foreground font-medium mb-1.5 block text-left">
                    Years of Experience
                  </label>
                  <select
                    value={experience}
                    onChange={(e) => setExperience(Number(e.target.value))}
                    className="w-full h-11 rounded-lg bg-secondary/50 border border-border/60 text-foreground px-3 text-sm focus:outline-none focus:border-[#00e5ff] transition-colors"
                  >
                    <option value={1}>0-1 years</option>
                    <option value={3}>2-4 years</option>
                    <option value={5}>5+ years</option>
                  </select>
                </div>

                {/* §7.2 Optional role description */}
                <div>
                  <label className="text-sm text-foreground font-medium mb-1.5 block text-left">
                    Role Description
                    <span className="ml-2 text-[11px] text-muted-foreground font-normal">(optional — helps AI tailor questions)</span>
                  </label>
                  <textarea
                    value={roleDescription}
                    onChange={(e) => setRoleDescription(e.target.value.slice(0, 300))}
                    placeholder="e.g. Looking for a senior frontend role at a fintech startup focusing on React and performance optimisation..."
                    rows={3}
                    className="w-full rounded-lg bg-secondary/50 border border-border/60 text-foreground px-3 py-2.5 text-sm focus:outline-none focus:border-[#00e5ff] transition-colors resize-none"
                  />
                  <p className="text-right text-[11px] text-muted-foreground mt-1">{roleDescription.length}/300</p>
                </div>
              </div>
            )}

            <Button
              onClick={requestPermissionsAndStart}
              disabled={starting || (!selectedJD && !location.state?.sessionID)}
              className="w-full bg-[#00e5ff] text-black hover:bg-[#00e5ff]/90 glow-primary font-display font-semibold h-12 text-base mt-6"
            >
              {starting ? (
                <Loader2 className="animate-spin w-5 h-5 mx-auto" />
              ) : (
                <>
                  <Video className="mr-2 w-4 h-4" /> Start Interview
                </>
              )}
            </Button>
          </motion.div>
        </main>
      </div>
    );
  }

  // ── Active interview screen ──────────────────────────────────────────────
  return (
    <div className="flex min-h-screen bg-background">
      {/* Hidden canvas for frame capture — never shown */}
      <canvas ref={canvasRef} className="hidden" />

      <DashboardSidebar role="candidate" />

      <main className="flex-1 flex flex-col">
        {/* Top bar */}
        <div className="h-14 glass-strong border-b border-border/50 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
            <span className="text-xs font-medium text-foreground">LIVE SESSION</span>
            <span className="text-xs text-muted-foreground">
              | {location.state?.jobTitle || "AI Interview"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {liveEmotion && (
              <div className={`flex items-center gap-1.5 text-xs font-medium ${liveEmotion.color}`}>
                <span>{liveEmotion.emoji}</span>
                <span>{liveEmotion.label}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span>
                Question {currentQ + 1} of {TOTAL_QUESTIONS}
              </span>
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
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  !camOn ? "opacity-0" : "opacity-100"
                }`}
              />

              {/* Anti-Cheat Overlay */}
              <AnimatePresence>
                {cheatWarning && (
                  <motion.div 
                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute top-4 inset-x-4 z-50 bg-rose-500/90 backdrop-blur-md border border-rose-400 text-white p-4 rounded-2xl shadow-xl flex items-center gap-3 !pointer-events-none"
                  >
                    <div className="bg-white/20 p-2 rounded-full animate-pulse flex-shrink-0">
                      <AlertCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-[10px] tracking-widest uppercase text-white/80">System Warning</p>
                      <p className="text-sm font-medium">{cheatWarning}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
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

              {/* Emotion badge overlay */}
              {liveEmotion && camOn && (
                <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-border/30 text-xs shadow-sm">
                  <span>{liveEmotion.emoji}</span>
                  <span className={`font-medium ${liveEmotion.color}`}>{liveEmotion.label}</span>
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
                  micOn
                    ? "bg-secondary border border-border/50 text-foreground hover:bg-secondary/80"
                    : "bg-destructive/20 border border-destructive/50 text-destructive hover:bg-destructive/30"
                }`}
              >
                {micOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
              </button>
              <button
                onClick={toggleCam}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-sm ${
                  camOn
                    ? "bg-secondary border border-border/50 text-foreground hover:bg-secondary/80"
                    : "bg-destructive/20 border border-destructive/50 text-destructive hover:bg-destructive/30"
                }`}
              >
                {camOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
              </button>
              <button
                onClick={() => {
                  stopRecognition();
                  submitAndEnd(transcript || "(Ended Early)");
                }}
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
              <p className="text-[10px] uppercase tracking-widest text-[#00e5ff] font-medium mb-2">
                QUESTION {currentQ + 1} OF {TOTAL_QUESTIONS}
              </p>
              <h3 className="font-display font-semibold text-foreground leading-relaxed text-lg">
                {questions[currentQ] || "Listening..."}
              </h3>
            </div>

            {/* Transcript */}
            <div className="flex-1 p-6 overflow-auto">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3 flex items-center justify-between">
                <span>LIVE TRANSCRIPT</span>
                {isRecording && (
                  <span className="flex items-center gap-1.5 text-rose-500 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" /> REC
                  </span>
                )}
              </p>
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-secondary/30 border border-border/30">
                  <p className="text-xs text-accent font-medium mb-2 flex items-center gap-1">
                    <Mic className="w-3 h-3" /> You
                  </p>
                  <p className="text-sm text-foreground leading-relaxed">
                    {transcript}
                    {liveTranscript && (
                      <span className="text-muted-foreground italic ml-1">{liveTranscript}</span>
                    )}
                    {!transcript && !liveTranscript && (
                      <span className="text-muted-foreground/60 italic">
                        Start speaking to Answer...
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Panel */}
            <div className="p-5 border-t border-border/50 bg-secondary/10">
              <Button
                onClick={handleNextQuestion}
                className="w-full bg-[#00e5ff] text-black hover:bg-[#00e5ff]/90 glow-primary font-display font-semibold h-12 text-base"
                disabled={ending}
              >
                {ending ? (
                  <Loader2 className="animate-spin w-5 h-5" />
                ) : currentQ + 1 >= TOTAL_QUESTIONS ? (
                  "Finish Interview"
                ) : (
                  "Next Question"
                )}
                {!ending && <ChevronRight className="ml-2 w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
