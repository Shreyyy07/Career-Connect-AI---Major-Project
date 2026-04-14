import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, FileText, Target, Mic, Calendar,
  Clock, CheckCircle2, AlertCircle, ArrowRight,
  Activity, BookOpen, Play, ChevronRight, Flame,
  LogOut, User, Settings, Sparkles
} from "lucide-react";
import DashboardSidebar from "@/components/DashboardSidebar";
import TopbarProfile from "@/components/TopbarProfile";
import StatCard from "@/components/StatCard";
import ScoreGauge from "@/components/ScoreGauge";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../lib/api";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar, CartesianGrid,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";

const radarData = [
  { subject: 'React', value: 85 },
  { subject: 'Node.js', value: 65 },
  { subject: 'TypeScript', value: 88 },
  { subject: 'System Design', value: 55 },
  { subject: 'DSA', value: 70 },
  { subject: 'Communication', value: 80 },
];

const performanceTrend = [
  { session: "S1", score: 58, semantic: 55, jd: 60, emotion: 50, comm: 52 },
  { session: "S2", score: 62, semantic: 60, jd: 65, emotion: 55, comm: 58 },
  { session: "S3", score: 68, semantic: 70, jd: 68, emotion: 60, comm: 62 },
  { session: "S4", score: 72, semantic: 75, jd: 70, emotion: 68, comm: 66 },
  { session: "S5", score: 75, semantic: 78, jd: 74, emotion: 70, comm: 68 },
  { session: "S6", score: 78, semantic: 82, jd: 78, emotion: 72, comm: 70 },
  { session: "S7", score: 82, semantic: 85, jd: 82, emotion: 75, comm: 74 },
];

const weeklyActivity = [
  { day: "Mon", sessions: 2, skills: 3 },
  { day: "Tue", sessions: 1, skills: 2 },
  { day: "Wed", sessions: 3, skills: 4 },
  { day: "Thu", sessions: 0, skills: 1 },
  { day: "Fri", sessions: 2, skills: 3 },
  { day: "Sat", sessions: 1, skills: 5 },
  { day: "Sun", sessions: 0, skills: 0 },
];

const recentInterviews = [
  { role: "Senior Frontend Developer", date: "Mar 18, 2025", score: 82, status: "completed", semantic: 85, jd: 80, emotion: 78, comm: 76 },
  { role: "Full Stack Engineer", date: "Mar 12, 2025", score: 75, status: "completed", semantic: 78, jd: 74, emotion: 70, comm: 68 },
  { role: "React Developer", date: "Mar 5, 2025", score: 68, status: "completed", semantic: 72, jd: 65, emotion: 62, comm: 60 },
  { role: "Node.js Backend Dev", date: "Feb 28, 2025", score: 72, status: "completed", semantic: 75, jd: 70, emotion: 68, comm: 66 },
];

// Static arrays removed — skill gaps & training are now driven by live API data (recProgress state)

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-strong rounded-lg p-3 text-xs">
        <p className="text-foreground font-medium mb-1">{label}</p>
        {payload.map((entry: any, i: number) => (
          <p key={i} style={{ color: entry.color }} className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: entry.color }} />
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function CandidateDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ avg: 0, done: 0, pending: 0, total: 0 });
  const [history, setHistory] = useState<any[]>([]);
  const [recProgress, setRecProgress] = useState<{ total: number; done: number; inProgress: number; skills: { skill: string; status: string }[] }>({ total: 0, done: 0, inProgress: 0, skills: [] });
  const [profilePct, setProfilePct] = useState(0);
  const [profileBadge, setProfileBadge] = useState('');  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const s = await apiFetch<any>('/api/v1/dashboard/stats');
        setStats({ avg: s.average_score || 0, done: s.completed_interviews || 0, pending: s.pending_assessments || 0, total: s.total_sessions || 0 });
      } catch (e) {
        console.error("Failed to load stats", e);
      }
      try {
        const h = await apiFetch<any[]>('/api/v1/candidate/history');
        if (h) setHistory(h);
      } catch (e) {
        console.error("Failed to load history", e);
      }
      // Load skill recommendations progress
      try {
        // Fetch latest resume + job to get rec list
        const resumes = await apiFetch<any[]>('/api/v1/resume/list');
        const jobs = await apiFetch<any[]>('/api/v1/jd/active');
        if (resumes?.length && jobs?.length) {
          const recs = await apiFetch<any[]>(
            `/api/v1/recommendations?resumeID=${resumes[0].resumeID}&jobID=${jobs[0].jobID}`
          );
          if (recs && recs.length) {
            const done = recs.filter((r: any) => r.status === 'completed').length;
            const inProg = recs.filter((r: any) => r.status === 'in_progress').length;
            setRecProgress({
              total: recs.length,
              done,
              inProgress: inProg,
              skills: recs.slice(0, 8).map((r: any) => ({ skill: r.skill, status: r.status })),
            });
          }
        }
      } catch (_) { /* non-critical */ }
    };
    load();
  }, [user]);

  // ── Compute profile completeness from real data ──────────────────────────────
  useEffect(() => {
    if (!user) return;
    const compute = async () => {
      let points = 0;
      const checks: string[] = [];

      // §1 Name set (not default 'User')
      if (user.name && user.name !== 'User' && user.name.trim().length > 1) {
        points += 25;
      } else {
        checks.push('Set your display name');
      }

      // §2 Email verified (if we got here, it's verified)
      points += 25;

      // §3 Resume uploaded
      try {
        const resumes = await apiFetch<any[]>('/api/v1/resume/list');
        if (resumes?.length > 0) {
          points += 25;
        } else {
          checks.push('Upload a resume');
        }
      } catch { checks.push('Upload a resume'); }

      // §4 At least one completed interview
      try {
        const h = await apiFetch<any[]>('/api/v1/candidate/history');
        if (h?.length > 0) {
          points += 25;
        } else {
          checks.push('Complete an AI interview');
        }
      } catch { checks.push('Complete an AI interview'); }

      setProfilePct(points);
      setProfileBadge(
        checks.length === 0 ? 'Profile Complete! 🎉' :
        checks.length === 1 ? checks[0] :
        `${checks.length} steps remaining`
      );
    };
    compute();
  }, [user]);

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar role="candidate" />

      <main className="flex-1 overflow-auto">
        <div className="p-8 w-full">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex items-center justify-between"
          >
            <div>
              <h1 className="font-display font-bold text-3xl text-foreground">
                Welcome back, {user?.name && user.name !== 'User' ? user.name.split(' ')[0] : user?.email?.split('@')[0] || 'there'} 👋
              </h1>
              <p className="text-base text-muted-foreground mt-1 mb-3">Here's your recruitment journey overview.</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 w-[200px] h-2 rounded-full bg-secondary/50 overflow-hidden border border-border/50">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${profilePct}%`,
                      background: profilePct === 100 ? '#10b981' : 'linear-gradient(90deg, #00e5ff, #8b5cf6)',
                    }}
                  />
                </div>
                <span className="text-xs font-medium text-muted-foreground">{profilePct}% Profile</span>
                <span
                  className={`text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full border ${
                    profilePct === 100
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}
                >
                  {profileBadge || 'Loading...'}
                </span>
              </div>
            </div>
            {/* User avatar dropdown */}
            <TopbarProfile />
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard icon={TrendingUp} label="Overall Score" value={`${Math.round(stats.avg)}%`} change="Live" positive />
            <StatCard icon={FileText} label="Total Sessions" value={String(stats.total)} change="Live" />
            <StatCard icon={Target} label="Pending Assessments" value={String(stats.pending)} />
            <StatCard icon={Mic} label="Interviews Done" value={String(stats.done)} change="Live" positive />
          </div>

          {/* Application Status Section */}
          {history.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="glass rounded-2xl p-6 mb-8"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-base text-foreground">Application Status</h3>
                  <p className="text-xs text-muted-foreground">Recruiter decisions on your interview submissions</p>
                </div>
              </div>
              <div className="space-y-3">
                {history.slice(0, 5).map((item: any, idx: number) => {
                  const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
                    shortlisted: { label: "Shortlisted ✅", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", dot: "bg-emerald-400" },
                    rejected:    { label: "Not Selected ❌", color: "bg-red-500/10 text-red-400 border-red-500/20",         dot: "bg-red-400" },
                    pending:     { label: "Under Review 🔄", color: "bg-amber-500/10 text-amber-400 border-amber-500/20",   dot: "bg-amber-400" },
                  };
                  const cfg = statusConfig[item.hrStatus || "pending"] || statusConfig.pending;
                  return (
                    <div key={item.sessionID || idx} className="flex items-center justify-between p-3 rounded-xl bg-secondary/20 border border-border/30 hover:border-border/60 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{item.jobTitle || "General Interview"}</p>
                          <p className="text-xs text-muted-foreground">{item.jobCompany || ""} • Score: {Math.round(item.score || 0)}%</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wide px-3 py-1 rounded-full border flex-shrink-0 ml-3 ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Skill Progress Tracker — shown when rec data loaded */}
          {recProgress.total > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="glass rounded-xl p-5 mb-6"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#00e5ff]" />
                  <h3 className="font-display font-semibold text-foreground text-sm">Skill Progress</h3>
                  <span className="text-xs text-muted-foreground">
                    {recProgress.done} of {recProgress.total} skills completed
                    {recProgress.inProgress > 0 && ` · ${recProgress.inProgress} in progress`}
                  </span>
                </div>
                <Link
                  to="/candidate/resume-match"
                  className="text-xs text-[#00e5ff] hover:underline flex items-center gap-1"
                >
                  View All <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              {/* Progress bar */}
              <div className="w-full h-2 rounded-full bg-secondary/50 overflow-hidden border border-border/30 mb-4">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${recProgress.total ? Math.round((recProgress.done / recProgress.total) * 100) : 0}%`,
                    background: recProgress.done === recProgress.total
                      ? 'hsl(160,84%,40%)'
                      : 'linear-gradient(90deg, #00e5ff, #8b5cf6)',
                  }}
                />
              </div>
              {/* Per-skill status pills */}
              <div className="flex flex-wrap gap-2">
                {recProgress.skills.map((s, i) => (
                  <span
                    key={i}
                    className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${
                      s.status === 'completed'
                        ? 'bg-emerald-900/30 text-emerald-400 border-emerald-700/40'
                        : s.status === 'in_progress'
                        ? 'bg-amber-900/30 text-amber-400 border-amber-700/40'
                        : 'bg-secondary text-muted-foreground border-border'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      s.status === 'completed' ? 'bg-emerald-400' :
                      s.status === 'in_progress' ? 'bg-amber-400' : 'bg-muted-foreground'
                    }`} />
                    {s.skill}
                  </span>
                ))}
              </div>
            </motion.div>
          )}

          {/* Row 1: Performance Trend + Score Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
            {/* Performance Trend Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-2 glass rounded-xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-display font-semibold text-foreground">Performance Trend</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Score progression across sessions</p>
                </div>
                <div className="flex items-center gap-3 text-[10px]">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#00e5ff]" />Composite</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: "hsl(160,84%,45%)" }} />Semantic</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: "hsl(270,80%,65%)" }} />JD Match</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={performanceTrend}>
                  <defs>
                    <linearGradient id="gradPrimary" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(187,100%,50%)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(187,100%,50%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(240,8%,16%)" />
                  <XAxis dataKey="session" tick={{ fill: "hsl(215,15%,55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[40, 100]} tick={{ fill: "hsl(215,15%,55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="score" stroke="hsl(187,100%,50%)" strokeWidth={2.5} fill="url(#gradPrimary)" name="Composite" />
                  <Line type="monotone" dataKey="semantic" stroke="hsl(160,84%,45%)" strokeWidth={1.5} dot={false} name="Semantic" />
                  <Line type="monotone" dataKey="jd" stroke="hsl(270,80%,65%)" strokeWidth={1.5} dot={false} name="JD Match" />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Skill Radar Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="lg:col-span-1 glass rounded-xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center gap-3">
                   <div className="p-2 bg-[#00e5ff]/10 rounded-lg">
                     <Sparkles className="w-5 h-5 text-[#00e5ff]" />
                   </div>
                   <div>
                     <h3 className="font-display font-semibold text-foreground leading-tight">Skill Radar</h3>
                     <span className="text-xs text-muted-foreground">Your competency map</span>
                   </div>
                 </div>
               </div>
              <div className="flex justify-center -mt-4">
                <ResponsiveContainer width="100%" height={240}>
                  <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: "hsl(215,15%,55%)", fontSize: 10 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                      name="Skill"
                      dataKey="value"
                      stroke="#00e5ff"
                      strokeWidth={2}
                      fill="#00e5ff"
                      fillOpacity={0.15}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Score Breakdown Gauges */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="lg:col-span-1 glass rounded-xl p-6"
            >
              <h3 className="font-display font-semibold text-foreground mb-4">Score Breakdown</h3>
              <div className="flex justify-center mb-4">
                <ScoreGauge score={78} label="Composite Score" size="lg" />
              </div>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <ScoreGauge score={85} label="Semantic" size="sm" />
                <ScoreGauge score={82} label="JD Match" size="sm" />
                <ScoreGauge score={72} label="Emotion" size="sm" />
                <ScoreGauge score={68} label="Communication" size="sm" />
              </div>
            </motion.div>
          </div>

          {/* Row 2: Weekly Activity + Upcoming Interviews */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Weekly Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass rounded-xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-display font-semibold text-foreground">Weekly Activity</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Sessions completed & skills marked done</p>
                </div>
                <div className="flex items-center gap-1 bg-success/10 text-success text-xs font-medium px-2.5 py-1 rounded-full">
                  <Flame className="w-3 h-3" /> 5-day streak
                </div>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={weeklyActivity} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(240,8%,16%)" />
                  <XAxis dataKey="day" tick={{ fill: "hsl(215,15%,55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "hsl(215,15%,55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="sessions" fill="hsl(187,100%,50%)" radius={[4, 4, 0, 0]} name="Sessions" />
                  <Bar dataKey="skills" fill="hsl(270,80%,65%)" radius={[4, 4, 0, 0]} name="Skills Done" />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-4 mt-3 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#00e5ff]" />Interview Sessions</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-accent" />Skills Completed</span>
              </div>
            </motion.div>

            {/* Upcoming Interviews */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="glass rounded-xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold text-foreground">Upcoming Interviews</h3>
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Scheduled</span>
              </div>

              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-14 h-14 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-3">
                  <Calendar className="w-7 h-7 text-accent" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">No Upcoming Interviews</p>
                <p className="text-xs text-muted-foreground mb-4">Start an AI interview to practice and build your score</p>
                <Link to="/candidate/interview">
                  <Button size="sm" className="bg-[#00e5ff]/10 text-[#00e5ff] border border-[#00e5ff]/20 hover:bg-[#00e5ff]/20 text-xs">
                    <Play className="w-3 h-3 mr-1" /> Start Interview
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>

          {/* Row 3: Interview History (Evaluation Cards) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass rounded-xl p-6 mb-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-foreground">Interview History</h3>
              <Link to="/candidate/reports">
                <Button variant="ghost" size="sm" className="text-[#00e5ff] text-xs">
                  View All Reports <ArrowRight className="ml-1 w-3 h-3" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(history.length > 0 ? history : []).slice(0,4).map((interview, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.35 + i * 0.08 }}
                  className="p-4 rounded-lg bg-secondary/20 border border-border/30 hover:border-[#00e5ff]/20 transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{interview.jobTitle || "AI Interview"}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" /> {new Date(interview.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-lg font-display font-bold ${
                        (interview.finalScore || interview.score || 0) >= 70 ? "text-success" : (interview.finalScore || interview.score || 0) >= 40 ? "text-warning" : "text-destructive"
                      }`}>
                        {Math.round(interview.finalScore || interview.score || 0)}%
                      </span>
                      <CheckCircle2 className="w-4 h-4 text-success" />
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Link to={`/candidate/reports`}>
                      <Button variant="outline" size="sm" className="h-7 text-xs">View All</Button>
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>

            <Link to="/candidate/interview" className="block mt-4">
              <Button className="w-full bg-[#00e5ff]/10 text-[#00e5ff] border border-[#00e5ff]/20 hover:bg-[#00e5ff]/20 font-display">
                <Mic className="mr-2 w-4 h-4" /> Start New Interview
              </Button>
            </Link>
          </motion.div>

          {/* Row 4: Skill Gap + Training Recommendations */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Skill Gap Analysis */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="lg:col-span-2 glass rounded-xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-display font-semibold text-foreground">Skill Gap Analysis</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Training progress for identified gaps</p>
                </div>
                <Link to="/candidate/skills">
                  <Button variant="ghost" size="sm" className="text-[#00e5ff] text-xs">
                    View Details <ArrowRight className="ml-1 w-3 h-3" />
                  </Button>
                </Link>
              </div>

              <div className="space-y-3">
                {recProgress.total === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <AlertCircle className="w-8 h-8 text-muted-foreground mb-3 opacity-40" />
                    <p className="text-sm text-muted-foreground">No skill gap data yet.</p>
                    <Link to="/candidate/resume" className="text-xs text-[#00e5ff] mt-2 hover:underline">Run a Resume Match to generate your skill plan →</Link>
                  </div>
                ) : (
                  recProgress.skills.map((gap, i) => {
                    const status = gap.status || 'pending';
                    const progress = status === 'completed' ? 100 : status === 'in_progress' ? 50 : 10;
                    const barColor = status === 'completed' ? 'bg-emerald-500' : status === 'in_progress' ? 'bg-amber-400' : 'bg-[#00e5ff]';
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + i * 0.08 }}
                        className="p-4 rounded-lg bg-secondary/20 border border-border/30"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <AlertCircle className={`w-4 h-4 ${i < 2 ? 'text-destructive' : i < 4 ? 'text-warning' : 'text-success'}`} />
                            <p className="text-sm font-medium text-foreground">{gap.skill}</p>
                          </div>
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                            status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                            status === 'in_progress' ? 'bg-amber-400/10 text-amber-400' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {status === 'in_progress' ? 'In Progress' : status === 'completed' ? 'Done ✓' : 'Pending'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${progress}%` }}
                              transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                              className={`h-full rounded-full ${barColor}`}
                            />
                          </div>
                          <span className="text-xs font-display font-bold text-foreground w-10 text-right">{progress}%</span>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </motion.div>

            {/* Training Recommendations */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="lg:col-span-1 glass rounded-xl p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-4 h-4 text-[#00e5ff]" />
                <h3 className="font-display font-semibold text-foreground">Recommended Training</h3>
              </div>

              <div className="space-y-3">
                {recProgress.total === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <BookOpen className="w-7 h-7 text-muted-foreground mb-2 opacity-40" />
                    <p className="text-xs text-muted-foreground">Complete a resume match to<br/>unlock course recommendations.</p>
                  </div>
                ) : (
                  recProgress.skills
                    .filter((s) => s.status !== 'completed')
                    .slice(0, 3)
                    .map((rec, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.45 + i * 0.1 }}
                        className="p-3 rounded-lg bg-secondary/20 border border-border/30 hover:border-[#00e5ff]/20 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-foreground">{rec.skill}</p>
                          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-[#00e5ff] transition-colors" />
                        </div>
                        <div className="text-xs">
                          <span className={`font-medium ${
                            rec.status === 'in_progress' ? 'text-amber-400' : 'text-[#00e5ff]'
                          }`}>
                            {rec.status === 'in_progress' ? 'In Progress' : 'Start Learning'}
                          </span>
                        </div>
                      </motion.div>
                    ))
                )}
              </div>

              <Button variant="ghost" className="w-full mt-3 text-[#00e5ff] text-xs border border-[#00e5ff]/10 hover:bg-[#00e5ff]/10">
                Browse All Courses <ArrowRight className="ml-1 w-3 h-3" />
              </Button>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
