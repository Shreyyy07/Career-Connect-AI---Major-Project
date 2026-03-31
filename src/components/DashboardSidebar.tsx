import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Brain, LayoutDashboard, FileText, Target, Mic, BarChart3,
  Settings, LogOut, Users, Briefcase, Shield, ChevronLeft, ChevronRight
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

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
  { href: "/hr/interviews",  icon: Mic,              label: "Interviews" },
  { href: "/hr/anticheat",   icon: Shield,           label: "Anti-Cheat" },
];

export default function DashboardSidebar({ role }: SidebarProps) {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { signOut } = useAuth();
  const links     = role === "candidate" ? candidateLinks : hrLinks;
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    /* sticky full-height sidebar — does NOT scroll with the page */
    <aside
      className={cn(
        "sticky top-0 h-screen bg-card/50 border-r border-border/50 flex flex-col transition-all duration-300 ease-in-out overflow-hidden",
        collapsed ? "w-[68px]" : "w-64"
      )}
    >
      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3.5 top-6 z-20 w-7 h-7 rounded-full bg-card border border-border/60 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 transition-all shadow-md"
      >
        {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>

      {/* Logo — flex-shrink-0 so it never compresses */}
      <div className={cn("flex-shrink-0 border-b border-border/50 flex items-center", collapsed ? "p-4 justify-center" : "p-5")}>
        <Link to="/" className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center flex-shrink-0">
            <img src="/logo.png" alt="Logo" className="w-6 h-6 object-contain rounded-md" />
          </div>
          {!collapsed && (
            <span className="font-display font-bold text-sm text-foreground truncate">
              Career<span className="text-primary">Connect</span> AI
            </span>
          )}
        </Link>
      </div>

      {/* Nav links — flex-1 + overflow-y-auto so this scrolls if needed */}
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
                  ? "bg-primary/10 text-primary border border-primary/20 glow-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              )}
            >
              <link.icon className="w-[18px] h-[18px] flex-shrink-0" />
              {!collapsed && <span>{link.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom actions — flex-shrink-0 so always visible */}
      <div className={cn("flex-shrink-0 border-t border-border/50 space-y-1", collapsed ? "p-2" : "p-4")}>
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
