import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, FileText, Target, Mic, BarChart3,
  Settings, LogOut, Users, Briefcase, Shield
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

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <aside
      className={cn(
        "group sticky top-0 h-screen bg-card/50 border-r border-border/50 flex flex-col z-40 overflow-hidden",
        "w-[68px] hover:w-64",
        "transition-[width] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
        "delay-150 hover:delay-75" // Delay to prevent accidental expansion when moving mouse across
      )}
    >
      {/* Logo */}
      <div className="flex-shrink-0 border-b border-border/50 flex items-center p-3 h-[73px] transition-all duration-500">
        <Link to="/" className="flex items-center gap-3 overflow-hidden whitespace-nowrap w-full">
          <div className="w-10 h-10 rounded-xl bg-[#00e5ff]/10 border border-[#00e5ff]/30 flex items-center justify-center flex-shrink-0">
            <img src="/L1.png" alt="Logo" className="w-8 h-8 object-contain rounded-lg" />
          </div>
          <span className="font-display font-bold text-sm text-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-0 group-hover:delay-200">
            Career<span className="text-[#00e5ff]">Connect</span> AI
          </span>
        </Link>
      </div>

      {/* Nav links */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-1 mt-2">
        <div className="h-6 mb-2 px-2 overflow-hidden whitespace-nowrap">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-0 group-hover:delay-200">
            {role === "candidate" ? "Candidate" : "Recruiter"} Panel
          </p>
        </div>
        
        {links.map((link) => {
          const active = location.pathname === link.href;
          return (
            <Link
              key={link.href}
              to={link.href}
              className={cn(
                "flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-sm transition-colors duration-300 overflow-hidden whitespace-nowrap",
                active
                  ? "bg-[#00e5ff]/10 text-[#00e5ff] border border-[#00e5ff]/20 glow-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50 border border-transparent"
              )}
            >
              <link.icon className="w-5 h-5 flex-shrink-0 mx-auto group-hover:mx-0 transition-all duration-300" />
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-0 group-hover:delay-200 font-medium">
                {link.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="flex-shrink-0 border-t border-border/50 p-3 space-y-1">
        <button
          onClick={() => navigate(`/${role}/profile`)}
          className="flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 w-full transition-colors overflow-hidden whitespace-nowrap"
        >
          <Settings className="w-5 h-5 flex-shrink-0 mx-auto group-hover:mx-0 transition-all duration-300" />
          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-0 group-hover:delay-200 font-medium">
            Settings
          </span>
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-sm text-destructive hover:bg-destructive/10 w-full transition-colors overflow-hidden whitespace-nowrap"
        >
          <LogOut className="w-5 h-5 flex-shrink-0 mx-auto group-hover:mx-0 transition-all duration-300" />
          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-0 group-hover:delay-200 font-medium tracking-wide">
            Logout
          </span>
        </button>
      </div>
    </aside>
  );
}
