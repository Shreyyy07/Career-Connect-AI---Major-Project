import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, UserPlus, LogIn, LayoutDashboard, Workflow, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const dashboardLink = user?.role === "hr" || user?.role === "admin" 
    ? "/hr/dashboard" 
    : "/candidate/dashboard";

  // Build the nav items dynamically based on auth
  const navItems = user ? [
    { href: "/", icon: Home, label: "Home" },
    { href: "/#capabilities", icon: Sparkles, label: "Capabilities" },
    { href: "/#workflow", icon: Workflow, label: "Workflow" },
    { href: dashboardLink, icon: LayoutDashboard, label: "Dashboard" }
  ] : [
    { href: "/", icon: Home, label: "Home" },
    { href: "/#capabilities", icon: Sparkles, label: "Capabilities" },
    { href: "/#workflow", icon: Workflow, label: "Workflow" },
    { href: "/login", icon: LogIn, label: "Login" },
    { href: "/register", icon: UserPlus, label: "Register" },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("/#")) {
      e.preventDefault();
      const targetId = href.substring(2);
      if (location.pathname !== "/") {
        navigate("/");
        setTimeout(() => {
          document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      } else {
        document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <>
      {/* Top Logo Header */}
      <header className="fixed top-0 left-0 right-0 z-50 p-6 pointer-events-none">
        <div className="container mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group pointer-events-auto">
            <div className="w-9 h-9 rounded-lg bg-[#00e5ff]/10 border border-[#00e5ff]/30 flex items-center justify-center glow-primary">
              <img src="/logo.png" alt="Logo" className="w-6 h-6 object-contain rounded-sm" />
            </div>
            <span className="font-display font-bold text-lg text-foreground">
              Career<span className="text-[#00e5ff]">Connect</span> AI
            </span>
          </Link>
        </div>
      </header>

      {/* Bottom Floating Pill Navigation */}
      <motion.nav
        initial={{ y: 50, opacity: 0, x: "-50%" }}
        animate={{ y: 0, opacity: 1, x: "-50%" }}
        className="fixed bottom-6 left-1/2 z-50 p-1.5 flex items-center gap-2 rounded-full bg-[#181820]/95 backdrop-blur-2xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.8)] transition-all duration-400 ease-in-out hover:gap-4 hover:px-3 hover:scale-105 hover:bg-[#181820]"
      >
        {navItems.map((item) => {
          const isActive = location.pathname === item.href || (item.href !== "/" && !item.href.startsWith("/#") && location.pathname.startsWith(item.href));
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              to={item.href}
              className="relative group block"
              onClick={(e) => handleNavClick(e, item.href)}
            >
              <div 
                className={`w-12 h-12 flex items-center justify-center rounded-full transition-all duration-400 ${
                  isActive 
                    ? "bg-gradient-to-tr from-[#00e5ff] to-purple-600 shadow-[0_0_20px_rgba(0,229,255,0.4)] text-white" 
                    : "text-zinc-300 hover:text-white hover:bg-white/10 hover:scale-110"
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              
              {/* Tooltip on hover */}
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none bg-black/90 text-white text-[11px] font-semibold py-1.5 px-3 rounded-md whitespace-nowrap border border-white/10 shadow-lg translate-y-1 group-hover:translate-y-0">
                {item.label}
              </div>
            </Link>
          );
        })}
      </motion.nav>
    </>
  );
}
