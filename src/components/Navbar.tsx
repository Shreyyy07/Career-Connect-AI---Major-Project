import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Home, UserPlus, LogIn, LayoutDashboard, Sparkles, UserCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [hovered, setHovered] = useState(false);
  
  const dashboardLink = user?.role === "hr" || user?.role === "admin" 
    ? "/hr/dashboard" 
    : "/candidate/dashboard";

  // Build the nav items dynamically based on auth
  const navItems = user ? [
    { href: "/", icon: Home, label: "Home" },
    { href: "/#capabilities", icon: Sparkles, label: "Capabilities" },
    { href: "/about", icon: UserCircle, label: "About" },
    { href: dashboardLink, icon: LayoutDashboard, label: "Dashboard" }
  ] : [
    { href: "/", icon: Home, label: "Home" },
    { href: "/#capabilities", icon: Sparkles, label: "Capabilities" },
    { href: "/about", icon: UserCircle, label: "About" },
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
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <motion.nav
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="flex items-center rounded-full bg-[#111116]/95 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.8)] overflow-hidden transition-colors hover:bg-[#181820] p-1.5 gap-2"
      >
        {/* Logo / Brand Name */}
        <Link to="/" className="flex items-center gap-2 pl-3 pr-2 py-2 shrink-0 group">
          <div className="w-8 h-8 rounded-lg bg-[#00e5ff]/10 border border-[#00e5ff]/30 flex items-center justify-center glow-primary shrink-0">
            <img src="/logo.png" alt="Logo" className="w-5 h-5 object-contain rounded-sm" />
          </div>
          <span className="font-display font-bold text-sm sm:text-base text-foreground whitespace-nowrap hidden sm:block">
            Career<span className="text-[#00e5ff]">Connect</span> AI
          </span>
        </Link>

        {/* Divider */}
        <div className="w-px h-8 bg-white/10 shrink-0 mx-1"></div>

        {/* Nav Items */}
        <div className="flex items-center gap-1.5 pr-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href || (item.href !== "/" && !item.href.startsWith("/#") && location.pathname.startsWith(item.href));
            const Icon = item.icon;
            
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`relative flex items-center justify-center gap-2 rounded-full transition-all duration-300 py-2 overflow-hidden ${
                  isActive 
                    ? "bg-gradient-to-tr from-[#00e5ff] to-purple-600 text-white shadow-[0_0_20px_rgba(0,229,255,0.4)]" 
                    : "text-zinc-300 hover:text-white hover:bg-white/10"
                } ${hovered ? "px-4" : "px-0 w-11"}`}
                onClick={(e) => handleNavClick(e, item.href)}
              >
                <Icon size={isActive ? 18 : 20} strokeWidth={isActive ? 2.5 : 2} className="shrink-0" />
                <AnimatePresence>
                  {hovered && (
                    <motion.span
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: "auto", opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      className="text-sm font-semibold whitespace-nowrap overflow-hidden"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            );
          })}
        </div>
      </motion.nav>
    </div>
  );
}
