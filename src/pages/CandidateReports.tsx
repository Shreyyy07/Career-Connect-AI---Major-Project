import { useEffect, useState } from "react";
import { FileText, Download, Eye, Calendar, Award } from "lucide-react";
import { motion } from "framer-motion";
import DashboardSidebar from "@/components/DashboardSidebar";
import { apiFetch, downloadAuthorizedFile } from "@/lib/api";
import { Link } from "react-router-dom";

type HistoryItem = {
  sessionID: string;
  type: string;
  completed_at: string;
  score: number;
  evalID: number | null;
  reportURL: string | null;
};

export default function CandidateReports() {
  const [reports, setReports] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiFetch<HistoryItem[]>('/api/v1/candidate/history');
        if (data) setReports(data);
      } catch (e) {
        console.error("Failed to load reports", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar role="candidate" />
      
      <main className="flex-1 overflow-auto">
        <div className="p-8 w-full max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="font-display font-bold text-3xl text-foreground flex items-center gap-3">
              <FileText className="w-8 h-8 text-[#00e5ff]" />
              Evaluation Reports
            </h1>
            <p className="text-base text-muted-foreground mt-2">
              View and download your AI-generated interview reports.
            </p>
          </motion.div>

          {/* Top Engagement Stats */}
          {!loading && reports.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className="glass rounded-2xl p-6 flex items-center gap-4 border-l-4 border-l-[#00e5ff] hover:bg-secondary/40 transition-all">
                <div className="p-4 rounded-xl bg-[#00e5ff]/10">
                  <FileText className="w-8 h-8 text-[#00e5ff]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Total Reports</p>
                  <p className="text-3xl font-display font-bold text-foreground">{reports.length}</p>
                </div>
              </div>
              <div className="glass rounded-2xl p-6 flex items-center gap-4 border-l-4 border-l-emerald-500 hover:bg-secondary/40 transition-all">
                <div className="p-4 rounded-xl bg-emerald-500/10">
                  <Award className="w-8 h-8 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Highest Score</p>
                  <p className="text-3xl font-display font-bold text-foreground">{Math.round(Math.max(...reports.map(r => r.score || 0), 0))}%</p>
                </div>
              </div>
              <div className="glass rounded-2xl p-6 flex items-center gap-4 border-l-4 border-l-indigo-500 hover:bg-secondary/40 transition-all">
                <div className="p-4 rounded-xl bg-indigo-500/10">
                  <Calendar className="w-8 h-8 text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Recent Activity</p>
                  <p className="text-base font-bold text-foreground mt-1">
                    {new Date(Math.max(...reports.map(r => new Date(r.completed_at).getTime()))).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* List */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-[#00e5ff] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : reports.length === 0 ? (
            <div className="glass-panel text-center py-20 rounded-2xl border border-dashed border-border">
              <div className="w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">No Reports Found</h3>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                You haven't completed any interviews yet. Start an AI interview to generate your first detailed evaluation report.
              </p>
              <Link to="/candidate/interview" className="mt-6 inline-flex items-center gap-2 bg-[#00e5ff] text-zinc-900 font-bold px-6 py-2.5 rounded-xl hover:bg-[#00cce6] transition-all">
                Start Interview
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {reports.map((r, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={r.sessionID} 
                  className="glass flex flex-col md:flex-row items-center justify-between p-5 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-lg border border-border/50 hover:border-[#00e5ff]/30"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-full bg-[#00e5ff]/10 flex items-center justify-center shrink-0 border border-[#00e5ff]/20">
                      <FileText className="w-6 h-6 text-[#00e5ff]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground text-lg mb-1">AI Interview Assessment</h3>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium">
                        <span className="flex items-center gap-1.5 bg-secondary/50 px-2.5 py-1 rounded-md border border-border">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(r.completed_at).toLocaleDateString(undefined, {
                            year: 'numeric', month: 'short', day: 'numeric'
                          })}
                        </span>
                        <span className="flex items-center gap-1.5 bg-secondary/50 px-2.5 py-1 rounded-md border border-border">
                          Session UI: <span className="font-mono">{r.sessionID.slice(0,8)}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6 mt-4 md:mt-0">
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-1">Composite Score</span>
                      <span className={`text-2xl font-bold flex items-center gap-2 ${
                        r.score >= 70 ? 'text-emerald-400' : r.score >= 45 ? 'text-amber-400' : 'text-red-400'
                      }`}>
                        <Award className="w-5 h-5" />
                        {Math.round(r.score)}%
                      </span>
                    </div>
                    
                    <div className="w-px h-12 bg-border/60 hidden md:block"></div>
                    
                    <div className="flex items-center gap-2">
                      {r.evalID && (
                        <Link 
                          to={`/candidate/evaluation/${r.evalID}`}
                          className="flex items-center gap-2 px-4 py-2.5 bg-secondary hover:bg-secondary/80 text-foreground text-sm font-semibold rounded-lg transition-colors border border-border"
                        >
                          <Eye className="w-4 h-4" /> View full dashboard
                        </Link>
                      )}
                      {r.reportURL && (
                        <button 
                          onClick={() => downloadAuthorizedFile(r.reportURL!, `Report_${r.sessionID.slice(0,8)}.pdf`)}
                          className="flex items-center gap-2 px-4 py-2.5 bg-[#00e5ff]/10 hover:bg-[#00e5ff]/20 text-[#00e5ff] text-sm font-semibold border border-[#00e5ff]/30 rounded-lg transition-colors"
                        >
                          <Download className="w-4 h-4" /> Download PDF
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
