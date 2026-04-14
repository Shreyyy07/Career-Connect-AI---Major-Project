import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import DashboardSidebar from "@/components/DashboardSidebar";
import TopbarProfile from "@/components/TopbarProfile";
import {
  Shield, AlertTriangle, Search, Filter, MonitorX, UserX,
  AlertCircle, VideoOff, History, Smartphone, ChevronDown, ChevronUp, User,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

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

const getEventIcon = (type: string) => {
  switch (type) {
    case "tab_switch":       return <MonitorX className="w-4 h-4 text-orange-400" />;
    case "face_absent":      return <UserX className="w-4 h-4 text-red-400" />;
    case "fake_video":       return <VideoOff className="w-4 h-4 text-red-500" />;
    case "multiple_persons": return <AlertCircle className="w-4 h-4 text-purple-400" />;
    case "mobile_phone":     return <Smartphone className="w-4 h-4 text-rose-500" />;
    default:                 return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
  }
};

const getEventName = (type: string) =>
  type.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

const SeverityBadge = ({ severity }: { severity: string }) => (
  <span
    className={cn(
      "px-2.5 py-0.5 rounded-full border text-[11px] font-bold tracking-wide",
      severity === "CRITICAL" ? "bg-red-500/10 text-red-400 border-red-500/20"
      : severity === "WARNING"  ? "bg-orange-500/10 text-orange-400 border-orange-500/20"
      :                           "bg-blue-500/10 text-blue-400 border-blue-500/20"
    )}
  >
    {severity}
  </span>
);

function CandidateCard({ candidateID, candidateName, events }: {
  candidateID: number;
  candidateName: string;
  events: AntiCheatEvent[];
}) {
  const [open, setOpen] = useState(true);

  const criticals = events.filter((e) => e.severity === "CRITICAL").length;
  const warnings  = events.filter((e) => e.severity === "WARNING").length;
  const isFlagged = criticals >= 2 || events.length >= 3;

  const eventTypeCounts: Record<string, number> = {};
  events.forEach((e) => { eventTypeCounts[e.eventType] = (eventTypeCounts[e.eventType] || 0) + 1; });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm overflow-hidden shadow-lg"
    >
      {/* ── Candidate Header ─────────────────────────────── */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-secondary/30 transition-colors"
      >
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-[#00e5ff]/15 border border-[#00e5ff]/30 flex items-center justify-center font-display font-bold text-[#00e5ff] text-lg flex-shrink-0">
          {candidateName.charAt(0).toUpperCase()}
        </div>

        {/* Name + flag */}
        <div className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-foreground text-sm">{candidateName}</span>
            {isFlagged && (
              <span className="text-[10px] font-bold tracking-widest bg-red-500/15 text-red-400 border border-red-500/25 px-2 py-0.5 rounded-full">
                🚩 FLAGGED
              </span>
            )}
          </div>
          {/* Event type pills */}
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {Object.entries(eventTypeCounts).map(([type, count]) => (
              <span
                key={type}
                className="flex items-center gap-1 text-[10px] bg-secondary/60 text-muted-foreground px-2 py-0.5 rounded-full border border-border/40"
              >
                {getEventIcon(type)}
                {getEventName(type)} ×{count}
              </span>
            ))}
          </div>
        </div>

        {/* Counts */}
        <div className="flex items-center gap-3 flex-shrink-0 mr-2">
          {criticals > 0 && (
            <div className="text-center">
              <div className="text-lg font-bold text-red-400 leading-none">{criticals}</div>
              <div className="text-[9px] uppercase tracking-wider text-red-400/60 mt-0.5">Critical</div>
            </div>
          )}
          {warnings > 0 && (
            <div className="text-center">
              <div className="text-lg font-bold text-orange-400 leading-none">{warnings}</div>
              <div className="text-[9px] uppercase tracking-wider text-orange-400/60 mt-0.5">Warning</div>
            </div>
          )}
          <div className="text-center">
            <div className="text-lg font-bold text-foreground leading-none">{events.length}</div>
            <div className="text-[9px] uppercase tracking-wider text-muted-foreground mt-0.5">Total</div>
          </div>
        </div>

        {/* Chevron */}
        {open
          ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        }
      </button>

      {/* ── Events Table ─────────────────────────────────── */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            {/* Sub-header */}
            <div className="grid grid-cols-[120px_1fr_100px_160px] px-5 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest border-t border-b border-border/40 bg-secondary/20">
              <div>Severity</div>
              <div>Event Type</div>
              <div>Time in Interview</div>
              <div>Detected At</div>
            </div>
            <div className="divide-y divide-border/25">
              {events.map((ev, i) => (
                <motion.div
                  key={ev.eventID}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="grid grid-cols-[120px_1fr_100px_160px] items-center px-5 py-3 hover:bg-secondary/20 transition-colors"
                >
                  <div><SeverityBadge severity={ev.severity} /></div>
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground/90">
                    {getEventIcon(ev.eventType)}
                    {getEventName(ev.eventType)}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                    <History className="w-3 h-3" />
                    {Math.floor(ev.timestampSec / 60)}:{(ev.timestampSec % 60).toString().padStart(2, "0")}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(ev.createdAt + "Z").toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function HRAntiCheatPage() {
  const [searchQuery, setSearchQuery]     = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [typeFilter, setTypeFilter]       = useState("all");

  const { data: events, isLoading } = useQuery<AntiCheatEvent[]>({
    queryKey: ["hr-anticheat", severityFilter, typeFilter],
    queryFn: () => {
      const p = new URLSearchParams();
      if (severityFilter !== "all") p.append("severity", severityFilter);
      if (typeFilter !== "all") p.append("event_type", typeFilter);
      return apiFetch(`/api/v1/hr/anticheat?${p.toString()}`);
    },
  });

  // Filter by search then group by candidate
  const filtered = events?.filter((e) =>
    e.candidateName.toLowerCase().includes(searchQuery.toLowerCase())
  ) ?? [];

  // Group by candidateID → keep insertion order (latest events first per candidate)
  const grouped = new Map<number, { name: string; events: AntiCheatEvent[] }>();
  for (const ev of filtered) {
    if (!grouped.has(ev.candidateID)) {
      grouped.set(ev.candidateID, { name: ev.candidateName, events: [] });
    }
    grouped.get(ev.candidateID)!.events.push(ev);
  }

  const totalEvents   = filtered.length;
  const totalCritical = filtered.filter((e) => e.severity === "CRITICAL").length;
  const totalWarning  = filtered.filter((e) => e.severity === "WARNING").length;

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar role="hr" />
      <div className="flex-1 p-8 h-screen overflow-y-auto">
        <div className="max-w-5xl mx-auto space-y-8">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-display font-bold flex items-center gap-3">
                <Shield className="w-8 h-8 text-[#00e5ff]" />
                Integrity Monitor
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                AI proctoring alerts grouped by candidate.
              </p>
            </div>
            <TopbarProfile />
          </div>

          {/* Summary Bar */}
          {!isLoading && totalEvents > 0 && (
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Total Events", value: totalEvents, color: "text-foreground", bg: "bg-secondary/40" },
                { label: "Critical",     value: totalCritical, color: "text-red-400",      bg: "bg-red-500/10" },
                { label: "Warnings",     value: totalWarning,  color: "text-orange-400",   bg: "bg-orange-500/10" },
              ].map((s) => (
                <div key={s.label} className={cn("rounded-xl border border-border/40 px-5 py-4", s.bg)}>
                  <div className={cn("text-2xl font-bold font-display", s.color)}>{s.value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 uppercase tracking-widest">{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Filters */}
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
                  <SelectItem value="mobile_phone">Mobile Phone</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Candidates */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center text-muted-foreground p-8">Loading events...</div>
            ) : grouped.size === 0 ? (
              <div className="glass p-12 rounded-xl text-center flex flex-col items-center">
                <Shield className="w-12 h-12 text-emerald-500 mb-3 opacity-50" />
                <h3 className="text-lg font-bold">All clear</h3>
                <p className="text-muted-foreground mt-1">No integrity violations detected for these filters.</p>
              </div>
            ) : (
              Array.from(grouped.entries()).map(([candidateID, { name, events: cevents }]) => (
                <CandidateCard
                  key={candidateID}
                  candidateID={candidateID}
                  candidateName={name}
                  events={cevents}
                />
              ))
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
