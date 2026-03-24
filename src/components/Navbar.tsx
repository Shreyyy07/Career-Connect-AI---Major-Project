import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Brain, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const isLanding = location.pathname === "/";

  const { user } = useAuth();

  const links = [
    { href: "/", label: "Home" },
  ];

  const dashboardLink = user?.role === "hr" || user?.role === "admin" 
    ? "/hr/dashboard" 
    : "/candidate/dashboard";

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 glass-strong"
    >
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center glow-primary">
            <Brain className="w-5 h-5 text-primary" />
          </div>
          <span className="font-display font-bold text-lg text-foreground">
            Career<span className="text-primary">Connect</span> AI
          </span>
        </Link>

          {links.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {link.label}
            </Link>
          ))}
          {user ? (
            <Link to={dashboardLink}>
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 glow-primary font-display font-semibold">
                Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/login" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Login
              </Link>
              <Link to="/register">
                <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 glow-primary font-display font-semibold">
                  Get Started
                </Button>
              </Link>
            </>
          )}

        <button className="md:hidden text-foreground" onClick={() => setOpen(!open)}>
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="md:hidden glass-strong border-t border-border/50 px-6 pb-4"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="block py-3 text-sm text-muted-foreground hover:text-primary transition-colors"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          {user ? (
            <Link to={dashboardLink} onClick={() => setOpen(false)}>
              <Button className="w-full mt-2 bg-primary text-primary-foreground font-display font-semibold">
                Go to Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/login" className="block py-3 text-sm text-muted-foreground hover:text-primary transition-colors" onClick={() => setOpen(false)}>
                Login
              </Link>
              <Link to="/register" onClick={() => setOpen(false)}>
                <Button className="w-full mt-2 bg-primary text-primary-foreground font-display font-semibold">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </motion.div>
      )}
    </motion.nav>
  );
}
