import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../lib/api";
import {
  Users, Briefcase, Clock, TrendingUp,
  Search, Filter, ArrowRight, Star, MoreHorizontal,
  Eye, Download, CheckCircle2, Shield, AlertTriangle,
  Calendar, FileText, Plus, Edit, Archive, XCircle,
  ChevronRight, Bell
} from "lucide-react";
import DashboardSidebar from "@/components/DashboardSidebar";
import StatCard from "@/components/StatCard";
import ScoreGauge from "@/components/ScoreGauge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, LineChart, Line
} from "recharts";

const candidates = [
  { name: "Aarav Mehta", role: "Senior Frontend Developer", match: 92, final: 88, status: "Shortlisted", avatar: "AM", interview: "Completed", cheatFlags: 0 },
  { name: "Priya Sharma", role: "Senior Frontend Developer", match: 87, final: 82, status: "Shortlisted", avatar: "PS", interview: "Completed", cheatFlags: 0 },
  { name: "Rahul Verma", role: "Senior Frontend Developer", match: 78, final: 74, status: "Pending", avatar: "RV", interview: "Scheduled", cheatFlags: 1 },
  { name: "Sneha Gupta", role: "Senior Frontend Developer", match: 65, final: 60, status: "Pending", avatar: "SG", interview: "Not Started", cheatFlags: 0 },
  { name: "Vikram Singh", role: "Senior Frontend Developer", match: 45, final: 42, status: "Rejected", avatar: "VS", interview: "Completed", cheatFlags: 3 },
];


const antiCheatAlerts = [
  { candidate: "Vikram Singh", event: "Multiple persons detected", severity: "Critical", timestamp: "Mar 15, 10:42 AM", type: "person_detection" },
  { candidate: "Vikram Singh", event: "Face out of frame > 5s", severity: "Warning", timestamp: "Mar 15, 10:38 AM", type: "face_out" },
  { candidate: "Vikram Singh", event: "Tab switching detected", severity: "Warning", timestamp: "Mar 15, 10:35 AM", type: "tab_switch" },
  { candidate: "Rahul Verma", event: "Liveness check failed", severity: "Warning", timestamp: "Mar 14, 2:15 PM", type: "liveness" },
];

const scheduledSlots = [
  { candidate: "Sneha Gupta", role: "Sr. Frontend Dev", date: "Mar 25", time: "10:00 AM" },
  { candidate: "Amit Patel", role: "ML Engineer", date: "Mar 25", time: "2:30 PM" },
  { candidate: "Neha Jain", role: "DevOps Lead", date: "Mar 26", time: "11:00 AM" },
  { candidate: "Raj Kapoor", role: "Backend Dev", date: "Mar 27", time: "3:00 PM" },
];

const hiringFunnel = [
  { stage: "Applied", count: 102 },
  { stage: "Screened", count: 68 },
  { stage: "Interviewed", count: 32 },
  { stage: "Shortlisted", count: 10 },
  { stage: "Offered", count: 4 },
];

const statusDistribution = [
  { name: "Shortlisted", value: 10, color: "hsl(160,84%,45%)" },
  { name: "Pending", value: 52, color: "hsl(38,92%,55%)" },
  { name: "Rejected", value: 12, color: "hsl(0,72%,55%)" },
  { name: "In Review", value: 28, color: "hsl(187,100%,50%)" },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-strong rounded-lg p-3 text-xs">
        <p className="text-foreground font-medium mb-1">{label}</p>
        {payload.map((entry: any, i: number) => (
          <p key={i} style={{ color: entry.color || "hsl(187,100%,50%)" }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function HRDashboard() {
  const { user } = useAuth();
  const [jds, setJds] = useState<any[]>([]);

  useEffect(() => {
    if (user && (user.role === 'hr' || user.role === 'admin')) {
      apiFetch<any[]>('/api/v1/jd/list')
        .then(data => setJds(data || []))
        .catch(err => console.error("Failed to fetch JDs", err));
    }
  }, [user]);

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar role="hr" />

      <main className="flex-1 overflow-auto">
        <div className="p-8 max-w-[1400px]">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="font-display font-bold text-2xl text-foreground">Recruiter Dashboard</h1>
              <p className="text-sm text-muted-foreground mt-1">Manage job descriptions, review candidates, and monitor integrity.</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" className="relative h-9 w-9 p-0">
                <Bell className="w-4 h-4 text-muted-foreground" />
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive rounded-full text-[9px] font-bold text-destructive-foreground flex items-center justify-center">4</span>
              </Button>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-display text-sm h-9 glow-primary">
                <Plus className="w-4 h-4 mr-1" /> Post New Job
              </Button>
            </div>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard icon={Briefcase} label="Active Jobs" value={String(jds.filter(j=>j.status.toLowerCase()==='active').length)} change="+Live" positive />
            <StatCard icon={Users} label="Total Applicants" value="120" change="+18" positive />
            <StatCard icon={TrendingUp} label="Shortlisted" value="10" change="+3" positive />
            <StatCard icon={Clock} label="Avg. Time to Shortlist" value="2.4h" change="-40%" positive />
          </div>

          {/* Row 1: Hiring Funnel + Status Pie + Score Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Hiring Funnel */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="lg:col-span-2 glass rounded-xl p-6"
            >
              <h3 className="font-display font-semibold text-foreground mb-1">Hiring Funnel</h3>
              <p className="text-xs text-muted-foreground mb-4">Candidate progression across stages</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={hiringFunnel} layout="vertical" barSize={24}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(240,8%,16%)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: "hsl(215,15%,55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="stage" type="category" tick={{ fill: "hsl(215,15%,55%)", fontSize: 11 }} axisLine={false} tickLine={false} width={85} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="hsl(187,100%,50%)" radius={[0, 6, 6, 0]} name="Candidates" />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Status Distribution */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="glass rounded-xl p-6"
            >
              <h3 className="font-display font-semibold text-foreground mb-1">Status Distribution</h3>
              <p className="text-xs text-muted-foreground mb-4">Current candidate statuses</p>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={statusDistribution} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                    {statusDistribution.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {statusDistribution.map((s, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-[10px]">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-muted-foreground">{s.name}</span>
                    <span className="font-bold text-foreground ml-auto">{s.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Row 2: JD Management + Interview Schedule */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Job Description Management */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="glass rounded-xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-display font-semibold text-foreground">Job Descriptions</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Create, edit, and archive JDs</p>
                </div>
                <Button size="sm" className="bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 text-xs h-8">
                  <Plus className="w-3 h-3 mr-1" /> New JD
                </Button>
              </div>

              <div className="space-y-3">
                {jds.length === 0 && <p className="text-sm text-muted-foreground p-4">No jobs posted yet.</p>}
                {jds.map((job, i) => (
                  <motion.div
                    key={job.jobID}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + i * 0.06 }}
                    className="p-3.5 rounded-lg bg-secondary/20 border border-border/30 hover:border-primary/20 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-foreground">{job.title}</p>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                          job.status.toLowerCase() === "active" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                        }`}>
                          {job.status}
                        </span>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <Edit className="w-3 h-3 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <Archive className="w-3 h-3 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />-- applicants</span>
                      <span className="flex items-center gap-1"><Star className="w-3 h-3" />-- shortlisted</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Live</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Interview Schedule Calendar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              className="glass rounded-xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-display font-semibold text-foreground">Interview Schedule</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Upcoming interview slots</p>
                </div>
                <Button size="sm" className="bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20 text-xs h-8">
                  <Calendar className="w-3 h-3 mr-1" /> Schedule
                </Button>
              </div>

              <div className="space-y-3">
                {scheduledSlots.map((slot, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.06 }}
                    className="flex items-center justify-between p-3.5 rounded-lg bg-secondary/20 border border-border/30 group hover:border-accent/20 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/20 flex flex-col items-center justify-center">
                        <span className="text-[9px] text-accent font-bold leading-tight">{slot.date.split(" ")[0]}</span>
                        <span className="text-xs text-accent font-bold leading-tight">{slot.date.split(" ")[1]}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{slot.candidate}</p>
                        <p className="text-xs text-muted-foreground">{slot.role} • {slot.time}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors" />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Row 3: Candidate Rankings Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="glass rounded-xl p-6 mb-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display font-semibold text-foreground">Candidate Rankings</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Ranked comparison view for all applicants</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input placeholder="Search candidates..." className="pl-9 h-8 w-52 bg-secondary/50 border-border/60 text-xs" />
                </div>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-xs text-muted-foreground border-b border-border/30">
                    <th className="text-left pb-3 font-medium">#</th>
                    <th className="text-left pb-3 font-medium">Candidate</th>
                    <th className="text-center pb-3 font-medium">JD Match</th>
                    <th className="text-center pb-3 font-medium">Final Score</th>
                    <th className="text-center pb-3 font-medium">Interview</th>
                    <th className="text-center pb-3 font-medium">Flags</th>
                    <th className="text-center pb-3 font-medium">Status</th>
                    <th className="text-right pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((c, i) => (
                    <tr key={i} className="border-b border-border/20 hover:bg-secondary/20 transition-colors">
                      <td className="py-3 text-xs text-muted-foreground font-display font-bold">{i + 1}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                            {c.avatar}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{c.name}</p>
                            <p className="text-xs text-muted-foreground">{c.role}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-center">
                        <span className={`text-sm font-display font-bold ${
                          c.match >= 70 ? "text-success" : c.match >= 40 ? "text-warning" : "text-destructive"
                        }`}>{c.match}%</span>
                      </td>
                      <td className="text-center">
                        <span className={`text-sm font-display font-bold ${
                          c.final >= 70 ? "text-success" : c.final >= 40 ? "text-warning" : "text-destructive"
                        }`}>{c.final}%</span>
                      </td>
                      <td className="text-center">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          c.interview === "Completed" ? "bg-success/10 text-success" :
                          c.interview === "Scheduled" ? "bg-accent/10 text-accent" :
                          "bg-muted text-muted-foreground"
                        }`}>
                          {c.interview}
                        </span>
                      </td>
                      <td className="text-center">
                        {c.cheatFlags > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
                            <AlertTriangle className="w-3 h-3" /> {c.cheatFlags}
                          </span>
                        ) : (
                          <span className="text-[10px] text-success">✓ Clean</span>
                        )}
                      </td>
                      <td className="text-center">
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                          c.status === "Shortlisted" ? "bg-success/10 text-success" :
                          c.status === "Rejected" ? "bg-destructive/10 text-destructive" :
                          "bg-warning/10 text-warning"
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="View Report">
                            <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Download Report">
                            <Download className="w-3.5 h-3.5 text-muted-foreground" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="More">
                            <MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Row 4: Anti-Cheat Alert Log */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="glass rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-destructive" />
                <div>
                  <h3 className="font-display font-semibold text-foreground">Anti-Cheat Alert Log</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Real-time integrity monitoring events</p>
                </div>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-destructive bg-destructive/10 px-2.5 py-1 rounded-full">
                {antiCheatAlerts.length} Alerts
              </span>
            </div>

            <div className="space-y-2">
              {antiCheatAlerts.map((alert, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.06 }}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                    alert.severity === "Critical"
                      ? "bg-destructive/5 border-destructive/20"
                      : "bg-warning/5 border-warning/20"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      alert.severity === "Critical" ? "bg-destructive/10" : "bg-warning/10"
                    }`}>
                      {alert.severity === "Critical" ? (
                        <XCircle className="w-4 h-4 text-destructive" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-warning" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{alert.event}</p>
                      <p className="text-xs text-muted-foreground">
                        {alert.candidate} • {alert.timestamp}
                      </p>
                    </div>
                  </div>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                    alert.severity === "Critical" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"
                  }`}>
                    {alert.severity}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
