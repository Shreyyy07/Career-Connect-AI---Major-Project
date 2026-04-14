import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Brain, LayoutDashboard, FileText, Target, Mic, BarChart3,
  Settings, LogOut, Users, Briefcase, Shield, Bell, X, CheckCheck
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

interface SidebarProps {
  role: "candidate" | "hr";
}

const candidateLinks = [
  { href: "/candidate/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/candidate/resume",    icon: FileText,         label: "Resume & Match" },
  { href: "/candidate/skills",    icon: Target,           label: "Skill Gap" },
  { href: "/candidate/interview", icon: Mic,              label: "AI Interview" },
  { href: "/candidate/reports",   icon: BarChart3,        label: "Reports" },
];

const hrLinks = [
  { href: "/hr/dashboard",   icon: LayoutDashboard, label: "Dashboard" },
  { href: "/hr/jobs",        icon: Briefcase,        label: "Job Descriptions" },
  { href: "/hr/candidates",  icon: Users,            label: "Candidates" },
  { href: "/hr/anticheat",   icon: Shield,           label: "Anti-Cheat" },
];

interface Notif {
  id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export default function DashboardSidebar({ role }: SidebarProps) {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { signOut } = useAuth();
  const links     = role === "candidate" ? candidateLinks : hrLinks;
  const [collapsed, setCollapsed] = useState(true);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  // Fetch notifications every 30 seconds
  const fetchNotifs = async () => {
    try {
      const data = await apiFetch<Notif[]>("/api/v1/notifications");
      if (data) {
        setNotifs(data);
        setUnread(data.filter(n => !n.is_read).length);
      }
    } catch { /* non-critical */ }
  };

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const markAllRead = async () => {
    try {
      await apiFetch("/api/v1/notifications/read-all", { method: "PATCH" });
      setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnread(0);
    } catch { /* ignore */ }
  };

  const typeIcon = (type: string) => {
    if (type === "hr_decision") return "🏷️";
    if (type === "report_ready") return "📄";
    if (type === "interview_completed") return "🎙️";
    return "🔔";
  };

  return (
    <aside
      onMouseEnter={() => setCollapsed(false)}
      onMouseLeave={() => setCollapsed(true)}
      className={cn(
        "sticky top-0 h-screen bg-card/50 border-r border-border/50 flex flex-col transition-all duration-300 ease-in-out overflow-hidden z-40",
        collapsed ? "w-[68px]" : "w-64"
      )}
    >

      {/* Logo */}
      <div className={cn("flex-shrink-0 border-b border-border/50 flex items-center", collapsed ? "p-4 justify-center" : "p-5")}>
        <Link to="/" className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#00e5ff]/10 border border-[#00e5ff]/30 flex items-center justify-center flex-shrink-0">
            <img src="/logo.png" alt="Logo" className="w-6 h-6 object-contain rounded-md" />
          </div>
          {!collapsed && (
            <span className="font-display font-bold text-sm text-foreground truncate">
              Career<span className="text-[#00e5ff]">Connect</span> AI
            </span>
          )}
        </Link>
      </div>

      {/* Nav links */}
      <nav className={cn("flex-1 overflow-y-auto space-y-1", collapsed ? "p-2" : "p-4")}>
        {!collapsed && (
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3 px-3">
            {role === "candidate" ? "Candidate" : "Recruiter"} Panel
          </p>
        )}
        {links.map((link) => {
          const active = location.pathname === link.href;
          return (
            <Link
              key={link.href}
              to={link.href}
              title={collapsed ? link.label : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
                collapsed && "justify-center px-2",
                active
                  ? "bg-[#00e5ff]/10 text-[#00e5ff] border border-[#00e5ff]/20 glow-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              )}
            >
              <link.icon className="w-[18px] h-[18px] flex-shrink-0" />
              {!collapsed && <span>{link.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className={cn("flex-shrink-0 border-t border-border/50 space-y-1", collapsed ? "p-2" : "p-4")}>

        {/* Bell Icon */}
        <div ref={bellRef} className="relative">
          <button
            onClick={() => { setBellOpen(o => !o); if (unread > 0) markAllRead(); }}
            title={collapsed ? "Notifications" : undefined}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 w-full transition-all relative",
              collapsed && "justify-center px-2"
            )}
          >
            <div className="relative flex-shrink-0">
              <Bell className="w-[18px] h-[18px]" />
              {unread > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </div>
            {!collapsed && <span>Notifications</span>}
          </button>

          {/* Notification dropdown */}
          <AnimatePresence>
            {bellOpen && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="absolute bottom-12 left-full ml-2 w-80 bg-card border border-border/50 rounded-xl shadow-2xl z-50 overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
                  <span className="text-sm font-semibold text-foreground">Notifications</span>
                  <div className="flex items-center gap-2">
                    {unread > 0 && (
                      <button onClick={markAllRead} title="Mark all read" className="text-muted-foreground hover:text-primary transition-colors">
                        <CheckCheck className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => setBellOpen(false)} className="text-muted-foreground hover:text-foreground">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifs.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                      No notifications yet
                    </div>
                  ) : (
                    notifs.map(n => (
                      <div
                        key={n.id}
                        className={cn(
                          "px-4 py-3 border-b border-border/30 last:border-0 hover:bg-secondary/30 transition-colors",
                          !n.is_read && "bg-primary/5"
                        )}
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-lg flex-shrink-0 mt-0.5">{typeIcon(n.type)}</span>
                          <div className="min-w-0">
                            <p className={cn("text-xs font-semibold truncate", !n.is_read ? "text-foreground" : "text-muted-foreground")}>
                              {n.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                            <p className="text-[10px] text-muted-foreground/50 mt-1">
                              {new Date(n.created_at).toLocaleString()}
                            </p>
                          </div>
                          {!n.is_read && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1" />}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          onClick={() => navigate(`/${role}/profile`)}
          title={collapsed ? "Settings" : undefined}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 w-full transition-all",
            collapsed && "justify-center px-2"
          )}
        >
          <Settings className="w-[18px] h-[18px] flex-shrink-0" />
          {!collapsed && "Settings"}
        </button>
        <button
          onClick={handleLogout}
          title={collapsed ? "Logout" : undefined}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-destructive hover:bg-destructive/10 w-full transition-all",
            collapsed && "justify-center px-2"
          )}
        >
          <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
          {!collapsed && "Logout"}
        </button>
      </div>
    </aside>
  );
}
