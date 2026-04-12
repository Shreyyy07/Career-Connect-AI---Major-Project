import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, downloadAuthorizedFile } from "@/lib/api";
import DashboardSidebar from "@/components/DashboardSidebar";
import TopbarProfile from "@/components/TopbarProfile";
import ScoreGauge from "@/components/ScoreGauge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, Briefcase, Eye, User, ShieldAlert, Award, FileText, FileDown, Activity, Mic, Brain, CheckCircle, RefreshCw, Phone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import EmotionTimeline from "@/components/EmotionTimeline";

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
  const [showFlaggedOnly, setShowFlaggedOnly] = useState(false);
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

  const reminderMutation = useMutation({
    mutationFn: (evalID: number) => apiFetch(`/api/v1/hr/candidates/${evalID}/remind`, { method: "POST" }),
    onSuccess: () => toast.success("📞 Voice reminder triggered via n8n!"),
    onError: (e: any) => toast.error(e?.message || "Reminder failed. Check phone number or n8n config."),
  });

  const sortedCandidates = candidates ? [...candidates].sort((a, b) => {
    if (a.isFlagged && !b.isFlagged) return -1;
    if (!a.isFlagged && b.isFlagged) return 1;
    return 0; 
  }) : [];

  const filteredCandidates = sortedCandidates?.filter((c) => {
    const matchesQuery = c.candidateName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         c.jobTitle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || c.hrStatus === statusFilter;
    const matchesFlagged = !showFlaggedOnly || c.isFlagged;
    return matchesQuery && matchesStatus && matchesFlagged;
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
              <Button
                variant={showFlaggedOnly ? "default" : "outline"}
                onClick={() => setShowFlaggedOnly((prev) => !prev)}
                className={`h-9 mr-2 text-xs font-semibold uppercase tracking-wider transition-all 
                  ${showFlaggedOnly 
                    ? "bg-red-500 hover:bg-red-600 text-white border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]" 
                    : "border-border/50 bg-secondary/50 hover:bg-red-500/10 hover:text-red-500 text-muted-foreground"
                  }`}
              >
                <ShieldAlert className="w-3.5 h-3.5 mr-1.5" />
                Integrity Risk
              </Button>
              <Filter className="w-4 h-4 text-muted-foreground mr-1" />
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
                     <div className="text-right flex items-center justify-end gap-2">
                       <Button
                         variant="outline" size="sm"
                         onClick={() => reminderMutation.mutate(cand.evalID)}
                         disabled={reminderMutation.isPending}
                         className="border-[#00e5ff]/30 text-[#00e5ff] hover:bg-[#00e5ff]/10 hidden sm:flex items-center gap-1.5"
                         title="Trigger n8n voice call reminder"
                       >
                         <Phone className="w-3.5 h-3.5" />
                         <span className="text-xs">Call</span>
                       </Button>
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

                    {/* Emotion Dynamics */}
                    {detailData.emotionTimeline && detailData.emotionTimeline.length > 0 && (
                       <EmotionTimeline timeline={detailData.emotionTimeline} />
                    )}

                    {/* Speech Analysis Card */}
                    {(detailData.wpm != null || detailData.fillerCount != null) && (
                      <motion.div
                        initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                        className="glass rounded-3xl p-8 shadow-lg"
                      >
                        <div className="flex items-center gap-3 mb-6">
                          <Mic className="w-6 h-6 text-emerald-400" />
                          <h3 className="text-xl font-display font-bold text-foreground">Speech Analysis</h3>
                          <span className="ml-auto text-xs font-bold uppercase tracking-widest text-muted-foreground bg-secondary/60 px-3 py-1 rounded-full border border-border">
                            Transcript-Based
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="bg-background/40 rounded-2xl p-5 border border-border text-center">
                            <p className="text-3xl font-display font-bold mb-1"
                               style={{ color: (detailData.wpm || 0) >= 100 && (detailData.wpm || 0) <= 170 ? '#10b981' : '#f59e0b' }}>
                              {Math.round(detailData.wpm || 0)}
                            </p>
                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Words / Min</p>
                            <p className="text-[10px] text-muted-foreground/60 mt-1">Ideal: 100–170</p>
                          </div>
                          
                          <div className="bg-background/40 rounded-2xl p-5 border border-border text-center">
                            <p className="text-3xl font-display font-bold mb-1"
                               style={{ color: (detailData.fillerCount || 0) <= 5 ? '#10b981' : (detailData.fillerCount || 0) <= 15 ? '#f59e0b' : '#f43f5e' }}>
                              {detailData.fillerCount ?? 0}
                            </p>
                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Filler Words</p>
                            <p className="text-[10px] text-muted-foreground/60 mt-1">
                              {(detailData.fillerPercentage || 0).toFixed(1)}% of speech
                            </p>
                          </div>
                          
                          <div className="bg-background/40 rounded-2xl p-5 border border-border text-center">
                            <p className="text-3xl font-display font-bold text-sky-400 mb-1">{detailData.wordCount ?? 0}</p>
                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Total Words</p>
                          </div>
                          
                          <div className="bg-background/40 rounded-2xl p-5 border border-border text-center">
                            <p className="text-3xl font-display font-bold mb-1"
                               style={{ color: detailData.audioScore >= 70 ? '#10b981' : detailData.audioScore >= 45 ? '#f59e0b' : '#f43f5e' }}>
                              {Math.round(detailData.audioScore)}%
                            </p>
                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Clarity Score</p>
                          </div>
                        </div>

                        <div className="mt-5">
                          <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                            <span>Speaking Pace</span>
                            <span className="font-mono font-bold">{Math.round(detailData.wpm || 0)} WPM</span>
                          </div>
                          <div className="h-2 bg-secondary/80 rounded-full overflow-hidden border border-border">
                            <div
                              className="h-full rounded-full transition-all duration-1000"
                              style={{
                                width: `${Math.min(100, ((detailData.wpm || 0) / 250) * 100)}%`,
                                background: (detailData.wpm || 0) >= 100 && (detailData.wpm || 0) <= 170
                                  ? 'linear-gradient(90deg, #10b981, #34d399)'
                                  : 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                              }}
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* AI Assessment (Advanced Insights) */}
                    {detailData.insightsJson && (
                      <div className="glass rounded-3xl p-8 shadow-lg">
                        <div className="flex items-center gap-3 mb-6">
                           <Brain className="w-6 h-6 text-[#00e5ff]" />
                           <h3 className="text-xl font-display font-bold text-foreground">Actionable Insights</h3>
                           <span className="ml-auto text-[10px] font-bold uppercase tracking-widest text-[#00e5ff] bg-[#00e5ff]/10 px-2.5 py-1 rounded-full border border-[#00e5ff]/20">
                             AI Generated
                           </span>
                        </div>
                        {(() => {
                           try {
                             const parsed = JSON.parse(detailData.insightsJson);
                             const strength = parsed?.topStrength || "Maintained strong communication and engagement throughout.";
                             const improvement = parsed?.toImprove || "Focus on tailoring answers using specific vocabulary from the Job Description.";
                             
                             return (
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-2xl">
                                   <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><CheckCircle size={14}/> Top Strength</p>
                                   <p className="text-sm text-foreground/90 font-medium">{strength}</p>
                                 </div>
                                 <div className="bg-amber-500/10 border border-amber-500/20 p-5 rounded-2xl">
                                   <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><RefreshCw size={14}/> To Improve</p>
                                   <p className="text-sm text-foreground/90 font-medium">{improvement}</p>
                                 </div>
                               </div>
                             );
                           } catch {
                             return <p className="text-muted-foreground text-sm">AI Analysis unavailable (legacy data format).</p>;
                           }
                        })()}
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
