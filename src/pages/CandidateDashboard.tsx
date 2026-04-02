import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, FileText, Target, Mic, Calendar,
  Clock, CheckCircle2, AlertCircle, ArrowRight,
  Activity, BookOpen, Play, ChevronRight, Flame,
  LogOut, User, Settings
} from "lucide-react";
import DashboardSidebar from "@/components/DashboardSidebar";
import StatCard from "@/components/StatCard";
import ScoreGauge from "@/components/ScoreGauge";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../lib/api";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar, CartesianGrid
} from "recharts";

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

const skillGaps = [
  { skill: "System Design", priority: "high", progress: 30, resources: 4, estimatedHours: 12 },
  { skill: "Docker & K8s", priority: "high", progress: 15, resources: 6, estimatedHours: 20 },
  { skill: "GraphQL", priority: "medium", progress: 60, resources: 3, estimatedHours: 5 },
  { skill: "AWS Services", priority: "medium", progress: 45, resources: 5, estimatedHours: 15 },
  { skill: "TypeScript Advanced", priority: "low", progress: 80, resources: 2, estimatedHours: 3 },
];

const upcomingInterviews = [
  { role: "Lead React Engineer", company: "TechCorp", date: "Mar 25, 2025", time: "10:00 AM", type: "AI Interview" },
  { role: "Senior SDE", company: "InnovateLabs", date: "Mar 28, 2025", time: "2:30 PM", type: "AI Interview" },
  { role: "Frontend Architect", company: "DataFlow", date: "Apr 2, 2025", time: "11:00 AM", type: "AI Interview" },
];

const trainingRecommendations = [
  { title: "System Design Fundamentals", provider: "Educative", duration: "8h", match: 95 },
  { title: "Docker Mastery", provider: "Udemy", duration: "12h", match: 90 },
  { title: "AWS Solutions Architect", provider: "A Cloud Guru", duration: "20h", match: 85 },
];

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
  const [avatarOpen, setAvatarOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
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
    };
    load();
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
                Welcome back, {user?.name?.split(' ')[0] || 'User'} 👋
              </h1>
              <p className="text-base text-muted-foreground mt-1 mb-3">Here's your recruitment journey overview.</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 w-[200px] h-2 rounded-full bg-secondary/50 overflow-hidden border border-border/50">
                  <div className="h-full bg-emerald-500 rounded-full w-[80%]" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">80% Profile</span>
                <span className="text-[10px] uppercase font-bold tracking-widest bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">Resume Uploaded</span>
              </div>
            </div>
            {/* User avatar dropdown */}
            <div className="relative" ref={avatarRef}>
              <button
                onClick={() => setAvatarOpen(!avatarOpen)}
                className="w-11 h-11 rounded-full bg-[#00e5ff]/20 border-2 border-[#00e5ff]/40 glow-primary flex items-center justify-center font-display font-bold text-[#00e5ff] text-lg cursor-pointer hover:bg-[#00e5ff]/30 transition-all select-none"
                title={user?.name || 'User'}
              >
                {(user?.name || 'U').charAt(0).toUpperCase()}
              </button>

              <AnimatePresence>
                {avatarOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-14 z-50 w-64 glass-strong rounded-xl border border-border/60 shadow-2xl overflow-hidden"
                  >
                    {/* User info */}
                    <div className="px-4 py-3 border-b border-border/50">
                      <p className="font-semibold text-foreground text-sm truncate">{user?.name || 'User'}</p>
                      <p className="text-xs text-muted-foreground truncate">{user?.email || ''}</p>
                      <span className="mt-1 inline-block text-[10px] uppercase tracking-wider text-[#00e5ff] bg-[#00e5ff]/10 px-2 py-0.5 rounded-full border border-[#00e5ff]/20">
                        {user?.role || 'candidate'}
                      </span>
                    </div>
                    {/* Actions */}
                    <div className="p-2 space-y-0.5">
                      <button
                        onClick={() => { setAvatarOpen(false); navigate('/candidate/profile'); }}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all"
                      >
                        <User className="w-4 h-4" /> Edit Profile
                      </button>
                      <button
                        onClick={() => { setAvatarOpen(false); navigate('/candidate/profile'); }}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all"
                      >
                        <Settings className="w-4 h-4" /> Settings
                      </button>
                      <div className="border-t border-border/40 my-1" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-all"
                      >
                        <LogOut className="w-4 h-4" /> Logout
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard icon={TrendingUp} label="Overall Score" value={`${Math.round(stats.avg)}%`} change="Live" positive />
            <StatCard icon={FileText} label="Total Sessions" value={String(stats.total)} change="Live" />
            <StatCard icon={Target} label="Pending Assessments" value={String(stats.pending)} />
            <StatCard icon={Mic} label="Interviews Done" value={String(stats.done)} change="Live" positive />
          </div>

          {/* Row 1: Performance Trend + Score Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
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

              <div className="space-y-3">
                {upcomingInterviews.map((interview, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border/30 hover:border-[#00e5ff]/20 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{interview.role}</p>
                        <p className="text-xs text-muted-foreground">{interview.date} • {interview.time}</p>
                      </div>
                    </div>
                    <Link to="/candidate/interview">
                      <Button size="sm" variant="ghost" className="h-8 text-[#00e5ff] text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="w-3 h-3 mr-1" /> Join
                      </Button>
                    </Link>
                  </motion.div>
                ))}
              </div>

              <div className="mt-4 p-3 rounded-lg bg-[#00e5ff]/5 border border-[#00e5ff]/10 text-center">
                <p className="text-xs text-muted-foreground">Next interview in</p>
                <p className="font-display font-bold text-[#00e5ff] text-lg">2d 14h 30m</p>
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
                    <Link to={`/candidate/evaluation/${interview.evalID}`}>
                      <Button variant="outline" size="sm" className="h-7 text-xs">View Report</Button>
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
                {skillGaps.map((gap, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.08 }}
                    className="p-4 rounded-lg bg-secondary/20 border border-border/30"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <AlertCircle className={`w-4 h-4 ${gap.priority === "high" ? "text-destructive" : gap.priority === "medium" ? "text-warning" : "text-success"}`} />
                        <p className="text-sm font-medium text-foreground">{gap.skill}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground">{gap.resources} resources • ~{gap.estimatedHours}h</span>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                          gap.priority === "high" ? "bg-destructive/10 text-destructive" : gap.priority === "medium" ? "bg-warning/10 text-warning" : "bg-success/10 text-success"
                        }`}>
                          {gap.priority}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${gap.progress}%` }}
                          transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                          className="h-full rounded-full bg-[#00e5ff]"
                        />
                      </div>
                      <span className="text-xs font-display font-bold text-foreground w-10 text-right">{gap.progress}%</span>
                    </div>
                  </motion.div>
                ))}
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
                {trainingRecommendations.map((rec, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 + i * 0.1 }}
                    className="p-3 rounded-lg bg-secondary/20 border border-border/30 hover:border-[#00e5ff]/20 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-foreground">{rec.title}</p>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-[#00e5ff] transition-colors" />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{rec.provider}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{rec.duration}</span>
                      <span className="text-[#00e5ff] font-medium">{rec.match}% match</span>
                    </div>
                  </motion.div>
                ))}
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
