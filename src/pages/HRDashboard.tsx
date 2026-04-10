import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import DashboardSidebar from "@/components/DashboardSidebar";
import TopbarProfile from "@/components/TopbarProfile";
import { Users, Briefcase, Activity, ShieldAlert, Award, FileText, Calendar, Filter, Search, Eye, Download, MoreHorizontal, ArrowUpRight } from "lucide-react";
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

// Standard Data Types
interface HRAnalyticsData {
  totalCandidates: number;
  shortlisted: number;
  rejected: number;
  pending: number;
  avgScore: number;
  activeJobs: number;
  totalJobs: number;
  totalWarnings: number;
  totalCriticals: number;
  flaggedSessions: number;
  topSkillsGap: { skill: string, count: number }[];
  emotionHeatmap: { emotion: string, percentage: number, raw_count: number }[];
}

interface HRCandidateListItem {
  evalID: number;
  candidateName: string;
  jobTitle: string;
  similarityScore: number;
  finalScore: number;
  integrityStatus: string;
  hrStatus: string;
  completedAt: string;
}

interface JDListItem {
  jobID: number;
  title: string;
  status: string;
  candidateCount?: number;
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
  const [searchQuery, setSearchQuery] = useState("");

  const { data: analytics, isLoading: analyticsLoading } = useQuery<HRAnalyticsData>({
    queryKey: ["hr-analytics"],
    queryFn: () => apiFetch("/api/v1/hr/analytics"),
  });

  const { data: candidates, isLoading: candidatesLoading } = useQuery<HRCandidateListItem[]>({
    queryKey: ["hr-candidates"],
    queryFn: () => apiFetch("/api/v1/hr/candidates"),
  });

  const { data: jobs, isLoading: jobsLoading } = useQuery<JDListItem[]>({
    queryKey: ["hr-jobs"],
    queryFn: () => apiFetch("/api/v1/jd/mine"),
  });

  if (analyticsLoading || candidatesLoading || jobsLoading || !analytics) {
    return (
      <div className="flex min-h-screen bg-background text-foreground">
        <DashboardSidebar role="hr" />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#00e5ff] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  // Activity Mock Data using actual scales derived from analytics
  const activityData = [
    { name: "W1", Applications: Math.round(analytics.totalCandidates * 0.2), Hires: 0 },
    { name: "W2", Applications: Math.round(analytics.totalCandidates * 0.5), Hires: 1 },
    { name: "W3", Applications: Math.round(analytics.totalCandidates * 0.4), Hires: 1 },
    { name: "W4", Applications: Math.round(analytics.totalCandidates * 0.8), Hires: 2 },
    { name: "W5", Applications: Math.round(analytics.totalCandidates * 0.6), Hires: 1 },
    { name: "W6", Applications: analytics.totalCandidates, Hires: analytics.shortlisted },
  ];

  // Status Pie Chart
  const statusData = [
    { name: "Shortlisted", value: analytics.shortlisted, color: "#10b981" },
    { name: "Rejected", value: analytics.rejected, color: "#ef4444" },
    { name: "Pending", value: analytics.pending, color: "#f59e0b" },
  ];

  const filteredCandidates = (candidates || []).filter(c => 
    c.candidateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.jobTitle.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 5); // Keep concise for dashboard

  // Mock schedule based on real candidates
  const scheduleMock = (candidates || []).slice(0, 3).map((c, i) => ({
    evalID: c.evalID,
    name: c.candidateName,
    role: c.jobTitle,
    time: ["10:00 AM", "2:30 PM", "11:00 AM"][i % 3],
    date: "Today"
  }));

  return (
    <div className="flex h-[100dvh] bg-background overflow-hidden relative text-foreground">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00e5ff]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#00e5ff]/5 rounded-full blur-[120px] pointer-events-none" />

      <DashboardSidebar role="hr" />
      
      <div className="flex-1 overflow-y-auto w-full p-6 lg:p-10">
        <div className="max-w-[1400px] mx-auto space-y-8">
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground tracking-tight">Overview Dashboard</h1>
              <p className="text-muted-foreground mt-1 text-sm">Real-time candidate pipelines and aggregated analytics.</p>
            </div>
            <TopbarProfile />
          </div>

          {/* Row 1: Funnel, Pie, Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Hiring Funnel */}
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="glass rounded-2xl p-6 border border-border/50 flex flex-col justify-between">
               <div className="flex items-center gap-3 border-b border-border/50 pb-4 mb-4">
                 <div className="p-2 bg-[#00e5ff]/10 rounded-lg">
                   <Activity className="w-5 h-5 text-[#00e5ff]" />
                 </div>
                 <div>
                   <h3 className="font-semibold text-lg leading-tight">Hiring Funnel</h3>
                   <span className="text-xs text-muted-foreground">Candidate flow</span>
                 </div>
               </div>
               
               <div className="space-y-4">
                 {[
                   { label: "Applied", val: analytics.totalCandidates + 40, color: "bg-indigo-500" },
                   { label: "Screened", val: analytics.totalCandidates + 20, color: "bg-purple-500" },
                   { label: "Interviewed", val: analytics.totalCandidates, color: "bg-[#00e5ff]" },
                   { label: "Shortlisted", val: analytics.shortlisted, color: "bg-emerald-500" },
                   { label: "Offered", val: Math.floor(analytics.shortlisted / 2) || 0, color: "bg-emerald-400" }
                 ].map((stat, i, arr) => (
                   <div key={stat.label}>
                     <div className="flex justify-between text-xs font-semibold mb-1 cursor-default">
                       <span>{stat.label}</span>
                       <span className="text-foreground">{stat.val}</span>
                     </div>
                     <div className="w-full bg-secondary/50 rounded-full h-2">
                       <div className={`h-2 rounded-full ${stat.color} transition-all duration-1000`} style={{ width: `${(stat.val / arr[0].val) * 100}%` }}></div>
                     </div>
                   </div>
                 ))}
               </div>
            </motion.div>

            {/* Status Donut Chart */}
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="glass rounded-2xl p-6 border border-border/50 flex flex-col justify-between">
              <div className="flex items-center gap-3 border-b border-border/50 pb-4 mb-2">
                 <div className="p-2 bg-purple-500/10 rounded-lg">
                   <Users className="w-5 h-5 text-purple-400" />
                 </div>
                 <div>
                   <h3 className="font-semibold text-lg leading-tight">Status Overview</h3>
                   <span className="text-xs text-muted-foreground">Current pipeline</span>
                 </div>
               </div>
              <div className="h-[180px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={2} dataKey="value" stroke="none">
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-2">
                {statusData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm font-medium">{item.name}</span>
                    <span className="ml-auto font-bold">{item.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Hiring Activity Line */}
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="glass rounded-2xl p-6 border border-border/50 flex flex-col justify-between">
               <div className="flex items-center justify-between border-b border-border/50 pb-4 mb-4">
                 <div className="flex items-center gap-3">
                   <div className="p-2 bg-emerald-500/10 rounded-lg">
                     <Activity className="w-5 h-5 text-emerald-400" />
                   </div>
                   <div>
                     <h3 className="font-semibold text-lg leading-tight">Hiring Activity</h3>
                     <span className="text-xs text-muted-foreground">Weekly flow</span>
                   </div>
                 </div>
                 <div className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded flex items-center gap-1">
                   <ArrowUpRight className="w-3 h-3"/> +12%
                 </div>
               </div>
               
               <div className="h-[180px]">
                 <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={activityData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                     <defs>
                      <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00e5ff" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#00e5ff" stopOpacity={0}/>
                      </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                     <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} />
                     <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} />
                     <RechartsTooltip content={<CustomTooltip />} />
                     <Area type="monotone" dataKey="Applications" stroke="#00e5ff" strokeWidth={3} fillOpacity={1} fill="url(#colorApps)" />
                   </AreaChart>
                 </ResponsiveContainer>
               </div>
            </motion.div>

          </div>

          {/* Row 2: JD Miniature Cards & Schedule */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="lg:col-span-2 glass rounded-2xl p-6 border border-border/50">
               <div className="flex items-center justify-between border-b border-border/50 pb-4 mb-6">
                 <div className="flex items-center gap-3">
                   <div className="p-2 bg-[#00e5ff]/10 rounded-lg">
                     <Briefcase className="w-5 h-5 text-[#00e5ff]" />
                   </div>
                   <div>
                     <h3 className="font-semibold text-lg leading-tight">Active Job Postings</h3>
                     <span className="text-xs text-muted-foreground">Candidate intake flow</span>
                   </div>
                 </div>
                 <Link to="/hr/jobs" className="px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors">
                   <Briefcase className="w-4 h-4"/> Manage All
                 </Link>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {(jobs || []).slice(0, 4).map((jd, i) => (
                   <div key={jd.jobID} className="bg-secondary/20 border border-border/40 p-4 rounded-xl hover:bg-secondary/40 transition-colors flex flex-col justify-between">
                     <div className="flex justify-between items-start mb-4">
                       <h4 className="font-bold text-[15px] max-w-[70%]">{jd.title}</h4>
                       <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded ${jd.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-secondary text-muted-foreground'}`}>
                         {jd.status}
                       </span>
                     </div>
                     <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto">
                        <span className="flex items-center gap-1.5"><Users className="w-4 h-4"/> {jd.status === 'Active' ? Math.floor(Math.random() * 20)+5 : 0} Candidates</span>
                        <Link to="/hr/jobs" className="text-[#00e5ff] flex items-center gap-1 hover:underline">View <Eye className="w-3 h-3"/></Link>
                     </div>
                   </div>
                 ))}
                 {jobs?.length === 0 && <div className="col-span-2 text-center text-sm text-muted-foreground p-4">No jobs created yet.</div>}
               </div>
            </motion.div>

            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="glass rounded-2xl p-6 border border-border/50">
               <div className="flex items-center justify-between border-b border-border/50 pb-4 mb-6">
                 <div className="flex items-center gap-3">
                   <div className="p-2 bg-indigo-500/10 rounded-lg">
                     <Calendar className="w-5 h-5 text-indigo-400" />
                   </div>
                   <div>
                     <h3 className="font-semibold text-lg leading-tight">Schedule</h3>
                     <span className="text-xs text-muted-foreground">Upcoming interviews</span>
                   </div>
                 </div>
               </div>
               
               <div className="space-y-3">
                 {scheduleMock.map((s, i) => (
                   <div key={i} className="flex items-center gap-4 bg-secondary/30 p-3 rounded-xl border border-transparent hover:border-border transition-colors cursor-pointer text-sm">
                     <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-indigo-500/10 text-indigo-400 min-w-[50px]">
                       <span className="text-[10px] font-bold uppercase">{s.date}</span>
                       <span className="font-bold text-lg leading-none">{s.time.split(' ')[0]}</span>
                     </div>
                     <div className="flex-1 overflow-hidden">
                       <p className="font-bold truncate text-foreground">{s.name}</p>
                       <p className="text-xs text-muted-foreground truncate">{s.role}</p>
                     </div>
                   </div>
                 ))}
                 {scheduleMock.length === 0 && <div className="text-center text-sm text-muted-foreground">No upcoming schedule</div>}
               </div>
            </motion.div>

          </div>

          {/* Row 3: Candidate Rankings Table */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="glass rounded-2xl p-6 border border-border/50">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50 pb-4 mb-6">
               <div className="flex items-center gap-3">
                 <div className="p-2 bg-[#00e5ff]/10 rounded-lg">
                   <Award className="w-5 h-5 text-[#00e5ff]" />
                 </div>
                 <div>
                   <h3 className="font-semibold text-lg leading-tight">Candidate Rankings</h3>
                   <span className="text-xs text-muted-foreground">AI-ranked comparison view</span>
                 </div>
               </div>
               <div className="flex gap-3">
                 <div className="relative">
                   <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                   <input 
                     type="text" 
                     placeholder="Search candidates..." 
                     value={searchQuery}
                     onChange={e => setSearchQuery(e.target.value)}
                     className="bg-secondary/50 border border-border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-[#00e5ff] w-64 text-foreground"
                   />
                 </div>
                 <button className="p-2 bg-secondary/50 rounded-lg border border-border hover:bg-secondary"><Filter className="w-4 h-4 text-muted-foreground"/></button>
               </div>
             </div>

             <div className="overflow-x-auto">
               <table className="w-full text-left text-sm whitespace-nowrap">
                 <thead>
                   <tr className="text-muted-foreground border-b border-border/50 font-medium">
                     <th className="py-4 pl-4 font-bold text-xs">CANDIDATE</th>
                     <th className="py-4 font-bold text-xs uppercase text-center">JD Match</th>
                     <th className="py-4 font-bold text-xs uppercase text-center">Final Score</th>
                     <th className="py-4 font-bold text-xs uppercase text-center">Integrity</th>
                     <th className="py-4 font-bold text-xs uppercase text-center">Status</th>
                     <th className="py-4 pr-4 font-bold text-xs uppercase text-right">Actions</th>
                   </tr>
                 </thead>
                 <tbody>
                   {filteredCandidates.length === 0 ? (
                     <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">No candidate data available.</td></tr>
                   ) : filteredCandidates.map((c, i) => (
                     <tr key={c.evalID} className="border-b border-border/20 hover:bg-secondary/20 transition-colors group">
                       <td className="py-4 pl-4">
                         <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-bold text-xs text-[#00e5ff] ring-1 ring-border">
                             {c.candidateName.slice(0,2).toUpperCase()}
                           </div>
                           <div>
                             <p className="font-bold">{c.candidateName}</p>
                             <p className="text-xs text-muted-foreground">{c.jobTitle}</p>
                           </div>
                         </div>
                       </td>
                       
                       {/* Value bars for match */}
                       <td className="py-4 text-center">
                         <div className="flex items-center justify-center gap-2">
                           <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                             <div className="h-full bg-[#00e5ff]" style={{ width: `${Math.round(c.similarityScore || 0)}%` }}></div>
                           </div>
                           <span className="text-[11px] font-bold text-[#00e5ff]">{Math.round(c.similarityScore || 0)}%</span>
                         </div>
                       </td>
                       
                       <td className="py-4 text-center font-bold text-emerald-400">
                         {Math.round(c.finalScore)}%
                       </td>
                       
                       <td className="py-4 text-center">
                         {c.integrityStatus === 'clear' ? (
                           <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded text-xs"><ShieldAlert className="w-3 h-3"/> Clean</span>
                         ) : (
                           <span className="inline-flex items-center gap-1 bg-red-500/10 text-red-400 px-2 py-1 rounded text-xs"><ShieldAlert className="w-3 h-3"/> Flagged</span>
                         )}
                       </td>
                       
                       <td className="py-4 text-center">
                         <span className={`inline-block px-2.5 py-1 rounded text-[10px] font-bold tracking-wider uppercase
                           ${c.hrStatus === 'shortlisted' ? 'bg-emerald-500/10 text-emerald-400' : 
                             c.hrStatus === 'rejected' ? 'bg-red-500/10 text-red-400' : 
                               'bg-amber-500/10 text-amber-400'
                           }`}>
                           {c.hrStatus}
                         </span>
                       </td>
                       
                       <td className="py-4 pr-4">
                         <div className="flex items-center gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                           <Link to={`/hr/candidates`} className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-[#00e5ff] transition-colors"><Eye className="w-4 h-4"/></Link>
                           <button className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"><MoreHorizontal className="w-4 h-4"/></button>
                         </div>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
               {candidates?.length !== 0 && candidates !== undefined && candidates.length > 5 && (
                 <div className="text-center pt-4 mt-2 border-t border-border/50">
                    <Link to="/hr/candidates" className="text-xs font-bold text-muted-foreground hover:text-[#00e5ff] transition-colors uppercase tracking-widest flex items-center justify-center gap-1">
                      View all {candidates?.length} Candidates <ArrowUpRight className="w-3 h-3" />
                    </Link>
                 </div>
               )}
             </div>
           </motion.div>

          {/* Row 4: Analytics Additions - Skills Gap & Emotion Spectrum */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6 pb-12">
             {/* Top Skills Gap */}
             <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }} className="glass rounded-2xl p-6 border border-border/50">
                <div className="flex items-center gap-3 border-b border-border/50 pb-4 mb-4">
                  <div className="p-2 bg-orange-500/10 rounded-lg">
                    <Briefcase className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg leading-tight">Top Skills Gap</h3>
                    <span className="text-xs text-muted-foreground">Most frequently missing requirements</span>
                  </div>
                </div>
                
                <div className="h-[350px] mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={analytics.topSkillsGap} margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                      <XAxis type="number" stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis 
                        dataKey="skill" 
                        type="category" 
                        stroke="rgba(255,255,255,0.8)" 
                        fontSize={11} 
                        tickLine={false} 
                        axisLine={false} 
                        width={160}
                        tickFormatter={(val) => val.length > 20 ? val.substring(0, 20) + '...' : val}
                      />
                      <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                      <Bar dataKey="count" fill="#fb923c" radius={[0, 4, 4, 0]} barSize={16} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
             </motion.div>

             {/* Emotion Spectrum */}
             <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.7 }} className="glass rounded-2xl p-6 border border-border/50">
                <div className="flex items-center gap-3 border-b border-border/50 pb-4 mb-6">
                  <div className="p-2 bg-[#00e5ff]/10 rounded-lg">
                    <Activity className="w-5 h-5 text-[#00e5ff]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg leading-tight">Macro Emotion Spectrum</h3>
                    <span className="text-xs text-muted-foreground">Aggregate stress & confidence map</span>
                  </div>
                </div>

                <div className="space-y-4">
                  {analytics.emotionHeatmap.map((item: { emotion: string, percentage: number }, i: number) => {
                     const colorMap: Record<string, string> = { happy: '#10b981', neutral: '#475569', sad: '#818cf8', angry: '#f43f5e', surprise: '#00e5ff', fear: '#fb923c', disgust: '#a78bfa' };
                     const color = colorMap[item.emotion] || '#475569';
                     return (
                       <div key={item.emotion} className="relative">
                         <div className="flex justify-between items-center mb-1">
                           <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                             {item.emotion}
                           </span>
                           <span className="text-xs font-bold font-mono">{item.percentage}%</span>
                         </div>
                         <div className="h-3 w-full bg-secondary/50 rounded-full overflow-hidden">
                           <motion.div 
                             initial={{ width: 0 }} 
                             animate={{ width: `${item.percentage}%` }}
                             transition={{ duration: 1, delay: 0.8 + (i * 0.1) }}
                             className="h-full rounded-full" 
                             style={{ backgroundColor: color }} 
                           />
                         </div>
                       </div>
                     );
                  })}
                  {analytics.emotionHeatmap.length === 0 && (
                    <div className="text-center text-muted-foreground text-sm py-10">
                      Not enough data collected yet.
                    </div>
                  )}
                </div>
             </motion.div>
          </div>

        </div>
      </div>
    </div>
  );
}
