import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, downloadAuthorizedFile } from "@/lib/api";
import DashboardSidebar from "@/components/DashboardSidebar";
import TopbarProfile from "@/components/TopbarProfile";
import ScoreGauge from "@/components/ScoreGauge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, Briefcase, Eye, User, ShieldAlert, Award, FileText, FileDown, Activity, Mic, Brain } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from "recharts";

// TypeScript interfaces matching backend models
interface CandidateList {
  evalID: number;
  sessionID: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  finalScore: number;
  aiRecommendation: string;
  hrStatus: string;
  isFlagged: boolean;
  interviewDate: string;
}

interface CandidateDetail extends CandidateList {
  semanticScore: number;
  similarityScore: number;
  emotionScore: number;
  audioScore: number;
  hrNotes: string;
  wpm: number;
  fillerCount: number;
  dominantEmotion: string;
  emotionTimeline: { t: number; emotion: string }[];
  insightsJson: string;
  antiCheatSummary: any;
}

export default function HRCandidatesPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedEvalID, setSelectedEvalID] = useState<number | null>(null);

  const { data: candidates, isLoading } = useQuery<CandidateList[]>({
    queryKey: ["hr-candidates"],
    queryFn: () => apiFetch("/api/v1/hr/candidates"),
  });

  const { data: detailData, isLoading: detailLoading } = useQuery<CandidateDetail>({
    queryKey: ["hr-candidate-detail", selectedEvalID],
    queryFn: () => apiFetch(`/api/v1/hr/candidates/${selectedEvalID}`),
    enabled: !!selectedEvalID,
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => apiFetch("/api/v1/hr/candidate-status", { method: "PATCH", body: JSON.stringify({ evalID: selectedEvalID, hrStatus: status }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr-candidates"] });
      queryClient.invalidateQueries({ queryKey: ["hr-candidate-detail", selectedEvalID] });
      toast.success("Status updated successfully");
    },
  });

  const notesMutation = useMutation({
    mutationFn: (note: string) => apiFetch(`/api/v1/hr/candidate-notes/${selectedEvalID}`, { method: "PATCH", body: JSON.stringify({ note }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr-candidate-detail", selectedEvalID] });
      toast.success("Notes saved");
    },
  });

  const filteredCandidates = candidates?.filter((c) => {
    const matchesQuery = c.candidateName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         c.jobTitle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || c.hrStatus === statusFilter;
    return matchesQuery && matchesStatus;
  });

  const handleDownloadReport = async (evalId: number) => {
    try {
      await downloadAuthorizedFile(`/api/v1/hr/report/${evalId}/download`, `evaluation_${evalId}.pdf`);
    } catch {
      toast.error("Failed to download report");
    }
  };

  return (
    <div className="flex min-h-screen bg-background overflow-hidden">
      <DashboardSidebar role="hr" />
      
      {/* Main Content Area */}
      <div className="flex-1 p-8 h-screen overflow-y-auto w-full relative">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-display font-bold">Candidates</h1>
              <p className="text-muted-foreground mt-1 text-sm">Review interview results and manage pipeline.</p>
            </div>
            <TopbarProfile />
          </div>

          <div className="glass p-4 rounded-xl flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search candidates by name or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-secondary/50 border-border/50"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px] bg-secondary/50 border-border/50">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="shortlisted">Shortlisted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table View */}
          <div className="glass rounded-xl border border-border/50 overflow-hidden">
            <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr] p-4 border-b border-border/50 text-sm font-medium text-muted-foreground bg-secondary/30">
              <div>Candidate</div>
              <div>Applied Role</div>
              <div>AI Score</div>
              <div>Status</div>
              <div className="text-right">Action</div>
            </div>
            <div className="divide-y divide-border/50">
              {isLoading ? (
                <div className="p-8 text-center text-muted-foreground">Loading candidates...</div>
              ) : filteredCandidates?.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">No candidates match your filters.</div>
              ) : (
                filteredCandidates?.map((cand) => (
                  <div key={cand.evalID} className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr] p-4 items-center hover:bg-secondary/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#00e5ff]/10 text-[#00e5ff] flex items-center justify-center font-bold relative">
                        {cand.candidateName.charAt(0)}
                        {cand.isFlagged && <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse border border-background" />}
                      </div>
                      <div>
                        <p className="font-semibold">{cand.candidateName}</p>
                        <p className="text-xs text-muted-foreground">{cand.candidateEmail} • {cand.interviewDate}</p>
                      </div>
                    </div>
                    <div className="text-sm">{cand.jobTitle}</div>
                    <div className="flex items-center gap-2">
                       <ScoreGauge score={cand.finalScore} size="sm" label="Match" />
                       <span className="text-xs font-semibold">{cand.aiRecommendation}</span>
                    </div>
                    <div>
                       <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                          cand.hrStatus === 'shortlisted' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          cand.hrStatus === 'rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                          'bg-orange-400/10 text-orange-400 border-orange-400/20'
                        }`}>
                          {cand.hrStatus.charAt(0).toUpperCase() + cand.hrStatus.slice(1)}
                        </span>
                    </div>
                    <div className="text-right">
                      <Button variant="outline" size="sm" onClick={() => setSelectedEvalID(cand.evalID)}>
                        View Details
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Slide-over Detail Panel */}
      <AnimatePresence>
        {selectedEvalID && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedEvalID(null)}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 w-full max-w-2xl h-screen bg-card border-l border-border/50 shadow-2xl z-50 overflow-y-auto flex flex-col"
            >
              {!detailData || detailLoading ? (
                 <div className="flex-1 flex items-center justify-center">Loading details...</div>
              ) : (
                <>
                  <div className="p-6 border-b border-border/50 sticky top-0 bg-card/95 backdrop-blur z-10 flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-display font-bold">{detailData.candidateName}</h2>
                      <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                        <Briefcase className="w-3.5 h-3.5" /> {detailData.jobTitle}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                       <Button variant="outline" onClick={() => handleDownloadReport(detailData.evalID)}>
                         <FileDown className="w-4 h-4 mr-2"/> Full PDF Report
                       </Button>
                       <Button variant="ghost" onClick={() => setSelectedEvalID(null)}>Close</Button>
                    </div>
                  </div>

                  <div className="p-6 space-y-8">
                    {/* Action Bar */}
                    <div className="glass p-4 rounded-xl flex items-center justify-between bg-primary/5 border-primary/20">
                      <div>
                        <p className="text-sm font-semibold">HR Decision</p>
                        <p className="text-xs text-muted-foreground">Current status: {detailData.hrStatus}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant={detailData.hrStatus === "shortlisted" ? "default" : "outline"}
                          className={detailData.hrStatus === "shortlisted" ? "bg-emerald-500 hover:bg-emerald-600 text-white" : ""}
                          onClick={() => statusMutation.mutate("shortlisted")}
                        >
                          Shortlist
                        </Button>
                        <Button 
                          variant={detailData.hrStatus === "rejected" ? "default" : "outline"}
                          className={detailData.hrStatus === "rejected" ? "bg-red-500 hover:bg-red-600 text-white" : ""}
                          onClick={() => statusMutation.mutate("rejected")}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-4 gap-4">
                      <div className="glass p-4 rounded-xl flex flex-col items-center justify-center text-center">
                        <ScoreGauge score={detailData.finalScore} size="lg" label="Overall AI Match" />
                      </div>
                      <div className="glass p-4 rounded-xl flex flex-col justify-center">
                        <Award className="w-5 h-5 text-[#00e5ff] mb-2" />
                        <p className="text-2xl font-bold">{detailData.semanticScore}</p>
                        <p className="text-xs text-muted-foreground">Semantic</p>
                      </div>
                      <div className="glass p-4 rounded-xl flex flex-col justify-center">
                        <Activity className="w-5 h-5 text-purple-400 mb-2" />
                        <p className="text-2xl font-bold">{detailData.similarityScore}</p>
                        <p className="text-xs text-muted-foreground">Knowledge</p>
                      </div>
                      <div className="glass p-4 rounded-xl flex flex-col justify-center">
                        <Mic className="w-5 h-5 text-emerald-400 mb-2" />
                        <p className="text-2xl font-bold">{detailData.audioScore}</p>
                        <p className="text-xs text-muted-foreground">Communication</p>
                      </div>
                    </div>

                    {/* Anti-cheat Alert if any */}
                    {detailData.antiCheatSummary?.isFlagged && (
                      <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-4">
                        <ShieldAlert className="w-6 h-6 text-red-500 flex-shrink-0" />
                        <div>
                           <h4 className="font-semibold text-red-500">Integrity Flags Detected</h4>
                           <p className="text-sm text-red-400/80 mt-1">This session was flagged by the anti-cheat monitor. Integrity Score: {detailData.antiCheatSummary.integrityScore}/100. Check the Anti-Cheat dashboard for detailed playback events.</p>
                        </div>
                      </div>
                    )}

                    {/* Insights */}
                    {detailData.insightsJson && (
                      <div className="space-y-3">
                         <h3 className="font-semibold flex items-center gap-2"><Brain className="w-4 h-4 text-[#00e5ff]"/> AI Assessment</h3>
                         <div className="glass p-4 rounded-xl prose prose-invert prose-sm max-w-none">
                           <pre className="whitespace-pre-wrap font-sans bg-transparent border-0 p-0 m-0">
                             {(() => {
                               try {
                                 const parsed = JSON.parse(detailData.insightsJson);
                                 return parsed?.summary || "AI Analysis unavailable.";
                               } catch {
                                 return "AI Analysis unavailable (legacy data format).";
                               }
                             })()}
                           </pre>
                         </div>
                      </div>
                    )}

                    {/* HR Notes section */}
                    <div className="space-y-3">
                       <h3 className="font-semibold flex items-center gap-2"><FileText className="w-4 h-4 text-emerald-400"/> Recruiter Notes</h3>
                       <div className="flex gap-2">
                         <textarea 
                           className="w-full min-h-[100px] p-3 rounded-md bg-secondary border border-border/60 focus:border-[#00e5ff] focus:outline-none text-sm resize-y"
                           placeholder="Add internal notes about this candidate..."
                           defaultValue={detailData.hrNotes}
                           onBlur={(e) => {
                             if(e.target.value !== detailData.hrNotes) notesMutation.mutate(e.target.value);
                           }}
                         />
                       </div>
                       <p className="text-xs text-muted-foreground">Notes are saved automatically on blur. Only visible to HR.</p>
                    </div>

                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
