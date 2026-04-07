import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import DashboardSidebar from "@/components/DashboardSidebar";
import StatCard from "@/components/StatCard";
import { Users, Briefcase, Activity, ShieldAlert, Award, FileText } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { motion } from "framer-motion";

interface HRAnalyticsData {
  totalCandidates: number;
  shortlisted: number;
  rejected: number;
  pending: number;
  avgScore: number;
  activeJobs: number;
  totalJobs: number;
  scoreBand90: number;
  scoreBand70: number;
  scoreBand50: number;
  scoreBandLow: number;
  aiShortlist: number;
  aiConsider: number;
  aiReject: number;
  totalWarnings: number;
  totalCriticals: number;
  flaggedSessions: number;
  jdPerformance: { jobID: number; title: string; avgScore: number; candidateCount: number }[];
  topSkillsGap: { skill: string; count: number }[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card/95 border border-border/50 p-3 rounded-lg shadow-xl backdrop-blur-md">
        <p className="text-sm font-semibold mb-1">{label}</p>
        <p className="text-xs text-[#00e5ff]">
          Count: <span className="font-bold">{payload[0].value}</span>
        </p>
      </div>
    );
  }
  return null;
};

export default function HRDashboard() {
  const { data, isLoading } = useQuery<HRAnalyticsData>({
    queryKey: ["hr-analytics"],
    queryFn: () => apiFetch("/api/v1/hr/analytics"),
  });

  if (isLoading || !data) {
    return (
      <div className="flex min-h-screen bg-background">
        <DashboardSidebar role="hr" />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground animate-pulse">Loading Analytics Dashboard...</p>
        </div>
      </div>
    );
  }

  const scoreData = [
    { name: "90-100", value: data.scoreBand90 },
    { name: "70-89", value: data.scoreBand70 },
    { name: "50-69", value: data.scoreBand50 },
    { name: "< 50", value: data.scoreBandLow },
  ];

  const aiRecData = [
    { name: "Shortlist", value: data.aiShortlist, color: "hsl(160,84%,45%)" },
    { name: "Consider", value: data.aiConsider, color: "hsl(38,92%,55%)" },
    { name: "Reject", value: data.aiReject, color: "hsl(0,72%,55%)" },
  ];

  return (
    <div className="flex min-h-screen bg-background overflow-hidden relative">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00e5ff]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#00e5ff]/5 rounded-full blur-[120px] pointer-events-none" />

      <DashboardSidebar role="hr" />
      <div className="flex-1 p-8 h-screen overflow-y-auto w-full">
        <div className="max-w-7xl mx-auto space-y-6">
          
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground tracking-tight">Recruiting Overview</h1>
            <p className="text-muted-foreground mt-1 text-sm">Aggregated analytics across all your active job postings.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
             <StatCard label="Total Candidates" value={data.totalCandidates.toString()} icon={Users} />
             <StatCard label="Active JDs" value={data.activeJobs.toString()} change={`out of ${data.totalJobs} total`} icon={Briefcase} />
             <StatCard label="Avg AI Score" value={`${data.avgScore}%`} icon={Award} />
             <StatCard label="Pending Review" value={data.pending.toString()} change={`${data.shortlisted} shortlisted`} icon={Activity} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Score Distribution */}
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="lg:col-span-2 glass rounded-2xl p-6 border border-border/50 shadow-sm relative overflow-hidden">
               <h3 className="font-semibold text-lg flex items-center gap-2 mb-6"><Activity className="w-5 h-5 text-[#00e5ff]" /> Score Distribution</h3>
               <div className="h-[280px]">
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={scoreData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                     <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                     <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                     <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                     <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0, 229, 255, 0.05)" }} />
                     <Bar dataKey="value" fill="#00e5ff" radius={[4, 4, 0, 0]} maxBarSize={40} />
                   </BarChart>
                 </ResponsiveContainer>
               </div>
            </motion.div>

            {/* AI Recommendations */}
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="glass rounded-2xl p-6 border border-border/50 shadow-sm">
              <h3 className="font-semibold text-lg flex items-center gap-2 mb-6"><Award className="w-5 h-5 text-[#00e5ff]" /> AI Recommendations</h3>
              <div className="h-[220px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={aiRecData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={2} dataKey="value" stroke="none">
                      {aiRecData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <p className="text-3xl font-display font-bold text-foreground">{data.totalCandidates}</p>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">Total</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {aiRecData.map((item) => (
                  <div key={item.name} className="text-center bg-secondary/30 rounded-lg p-2 border border-border/30">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-[10px] text-muted-foreground uppercase">{item.name}</span>
                    </div>
                    <p className="font-bold text-sm text-foreground">{item.value}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
            {/* Anti-Cheat Summary */}
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="glass rounded-2xl p-6 border border-border/50">
               <h3 className="font-semibold text-lg flex items-center gap-2 mb-4"><ShieldAlert className="w-5 h-5 text-red-500" /> Integrity Monitoring</h3>
               <div className="grid grid-cols-3 gap-4 mb-6">
                 <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-center flex flex-col items-center">
                    <p className="text-xs text-red-400 mb-1">Flagged Sessions</p>
                    <p className="text-2xl font-bold text-red-500">{data.flaggedSessions}</p>
                 </div>
                 <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-xl text-center flex flex-col items-center">
                    <p className="text-xs text-orange-400 mb-1">Critical Evts</p>
                    <p className="text-2xl font-bold text-orange-500">{data.totalCriticals}</p>
                 </div>
                 <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl text-center flex flex-col items-center">
                    <p className="text-xs text-yellow-400 mb-1">Warnings</p>
                    <p className="text-2xl font-bold text-yellow-500">{data.totalWarnings}</p>
                 </div>
               </div>
               <p className="text-sm text-muted-foreground text-center">Visit the Anti-Cheat page to view playback timestamps.</p>
            </motion.div>

            {/* Top JD Performance */}
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="glass rounded-2xl p-6 border border-border/50">
               <h3 className="font-semibold text-lg flex items-center gap-2 mb-4"><FileText className="w-5 h-5 text-purple-400" /> Pipeline by JD</h3>
               <div className="space-y-3">
                 {data.jdPerformance.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No data available.</p>
                 ): (
                   data.jdPerformance.slice(0,4).map((jd) => (
                     <div key={jd.jobID} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/30 hover:bg-secondary/50 transition-colors">
                        <div>
                          <p className="font-medium text-sm">{jd.title}</p>
                          <p className="text-xs text-muted-foreground">{jd.candidateCount} candidates processed</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[#00e5ff] font-bold text-lg">{jd.avgScore}%</p>
                          <p className="text-[10px] text-muted-foreground uppercase">Avg Score</p>
                        </div>
                     </div>
                   ))
                 )}
               </div>
            </motion.div>
          </div>

        </div>
      </div>
    </div>
  );
}
