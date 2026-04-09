import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import DashboardSidebar from "@/components/DashboardSidebar";
import TopbarProfile from "@/components/TopbarProfile";
import { Shield, AlertTriangle, Search, Filter, MonitorX, UserX, AlertCircle, VideoOff, History } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";

interface AntiCheatEvent {
  eventID: number;
  sessionID: string;
  candidateName: string;
  candidateID: number;
  timestampSec: number;
  eventType: string;
  severity: string;
  detailsJson: string;
  createdAt: string;
}

export default function HRAntiCheatPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const { data: events, isLoading } = useQuery<AntiCheatEvent[]>({
    queryKey: ["hr-anticheat", severityFilter, typeFilter],
    queryFn: () => {
      const p = new URLSearchParams();
      if (severityFilter !== "all") p.append("severity", severityFilter);
      if (typeFilter !== "all") p.append("event_type", typeFilter);
      return apiFetch(`/api/v1/hr/anticheat?${p.toString()}`);
    },
  });

  const filteredEvents = events?.filter(e => 
    e.candidateName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getEventIcon = (type: string) => {
    switch(type) {
      case "tab_switch": return <MonitorX className="w-4 h-4 text-orange-400" />;
      case "face_absent": return <UserX className="w-4 h-4 text-red-400" />;
      case "fake_video": return <VideoOff className="w-4 h-4 text-red-500" />;
      case "multiple_persons": return <AlertCircle className="w-4 h-4 text-purple-400" />;
      default: return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
    }
  };

  const getEventName = (type: string) => {
    return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar role="hr" />
      <div className="flex-1 p-8 h-screen overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-display font-bold flex items-center gap-3">
                <Shield className="w-8 h-8 text-[#00e5ff]" /> 
                Integrity Monitor
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">Real-time alerts and logs from AI proctoring.</p>
            </div>
            <TopbarProfile />
          </div>

          <div className="glass p-4 rounded-xl flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search candidates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-secondary/50 border-border/50"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-[150px] bg-secondary/50 border-border/50">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                  <SelectItem value="WARNING">Warning</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[200px] bg-secondary/50 border-border/50">
                  <SelectValue placeholder="Event Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  <SelectItem value="tab_switch">Tab Switch</SelectItem>
                  <SelectItem value="face_absent">Face Absent</SelectItem>
                  <SelectItem value="multiple_persons">Multiple Persons</SelectItem>
                  <SelectItem value="face_mismatch">Face Mismatch</SelectItem>
                  <SelectItem value="fake_video">Fake Video</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            {isLoading ? (
               <div className="text-center text-muted-foreground p-8">Loading events...</div>
            ) : filteredEvents?.length === 0 ? (
               <div className="glass p-12 rounded-xl text-center flex flex-col items-center">
                 <Shield className="w-12 h-12 text-emerald-500 mb-3 opacity-50" />
                 <h3 className="text-lg font-bold">All clear</h3>
                 <p className="text-muted-foreground mt-1">No integrity violations detected for these filters.</p>
               </div>
            ) : (
               <div className="glass rounded-xl overflow-hidden border border-border/50">
                 <div className="grid grid-cols-[1fr_2fr_1.5fr_1fr_1.5fr] p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/50 bg-secondary/30">
                   <div>Severity</div>
                   <div>Event Type</div>
                   <div>Candidate</div>
                   <div>Time Offset</div>
                   <div>Log Date</div>
                 </div>
                 <div className="divide-y divide-border/50">
                   {filteredEvents?.map(ev => (
                     <motion.div initial={{opacity: 0}} animate={{opacity: 1}} key={ev.eventID} className="grid grid-cols-[1fr_2fr_1.5fr_1fr_1.5fr] p-4 items-center hover:bg-secondary/20 transition-colors">
                        <div>
                          <span className={`px-2.5 py-1 rounded border text-xs font-bold ${
                             ev.severity === 'CRITICAL' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                             ev.severity === 'WARNING' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                             'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          }`}>
                            {ev.severity}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 font-medium">
                          {getEventIcon(ev.eventType)}
                          {getEventName(ev.eventType)}
                        </div>
                        <div className="font-semibold">{ev.candidateName}</div>
                        <div className="flex items-center gap-1.5 text-muted-foreground text-sm font-mono">
                          <History className="w-3.5 h-3.5" />
                          {Math.floor(ev.timestampSec / 60)}:{(ev.timestampSec % 60).toString().padStart(2, '0')}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(ev.createdAt + 'Z').toLocaleString()}
                        </div>
                     </motion.div>
                   ))}
                 </div>
               </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
