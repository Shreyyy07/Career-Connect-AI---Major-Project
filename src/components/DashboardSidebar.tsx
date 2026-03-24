import { Link, useLocation } from "react-router-dom";
import { Brain, LayoutDashboard, FileText, Target, Mic, BarChart3, Settings, LogOut, Users, Briefcase, Shield } from "lucide-react";

interface SidebarProps {
  role: "candidate" | "hr";
}

const candidateLinks = [
  { href: "/candidate/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/candidate/resume", icon: FileText, label: "Resume & Match" },
  { href: "/candidate/skills", icon: Target, label: "Skill Gap" },
  { href: "/candidate/interview", icon: Mic, label: "AI Interview" },
  { href: "/candidate/reports", icon: BarChart3, label: "Reports" },
];

const hrLinks = [
  { href: "/hr/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/hr/jobs", icon: Briefcase, label: "Job Descriptions" },
  { href: "/hr/candidates", icon: Users, label: "Candidates" },
  { href: "/hr/interviews", icon: Mic, label: "Interviews" },
  { href: "/hr/anticheat", icon: Shield, label: "Anti-Cheat" },
];

export default function DashboardSidebar({ role }: SidebarProps) {
  const location = useLocation();
  const links = role === "candidate" ? candidateLinks : hrLinks;

  return (
    <aside className="w-64 min-h-screen bg-card/50 border-r border-border/50 flex flex-col">
      <div className="p-5 border-b border-border/50">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
            <Brain className="w-4 h-4 text-primary" />
          </div>
          <span className="font-display font-bold text-sm text-foreground">
            Career<span className="text-primary">Connect</span>
          </span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3 px-3">
          {role === "candidate" ? "Candidate" : "Recruiter"} Panel
        </p>
        {links.map((link) => {
          const active = location.pathname === link.href;
          return (
            <Link
              key={link.href}
              to={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                active
                  ? "bg-primary/10 text-primary border border-primary/20 glow-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              <link.icon className="w-4 h-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border/50 space-y-1">
        <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 w-full transition-all">
          <Settings className="w-4 h-4" />
          Settings
        </button>
        <Link
          to="/login"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-destructive hover:bg-destructive/10 w-full transition-all"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Link>
      </div>
    </aside>
  );
}
