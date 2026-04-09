import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Settings, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function TopbarProfile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [avatarOpen, setAvatarOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const handleSettings = () => {
    setAvatarOpen(false);
    navigate(`/${user?.role || "candidate"}/profile`);
  };

  return (
    <div className="relative" ref={avatarRef}>
      <button
        onClick={() => setAvatarOpen(!avatarOpen)}
        className="w-11 h-11 rounded-full bg-[#00e5ff]/20 border-2 border-[#00e5ff]/40 glow-primary flex items-center justify-center font-display font-bold text-[#00e5ff] text-lg cursor-pointer hover:bg-[#00e5ff]/30 transition-all select-none"
        title={user?.name || "User"}
      >
        {(user?.name || "U").charAt(0).toUpperCase()}
      </button>

      <AnimatePresence>
        {avatarOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-14 z-50 w-64 bg-card/95 backdrop-blur-sm border border-border/60 shadow-2xl rounded-xl overflow-hidden"
          >
            {/* User info */}
            <div className="px-4 py-3 border-b border-border/50">
              <p className="font-semibold text-foreground text-sm truncate">{user?.name || "User"}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email || ""}</p>
              <span className="mt-1 inline-block text-[10px] uppercase tracking-wider text-[#00e5ff] bg-[#00e5ff]/10 px-2 py-0.5 rounded-full border border-[#00e5ff]/20">
                {user?.role || "candidate"}
              </span>
            </div>
            {/* Actions */}
            <div className="p-2 space-y-0.5">
              <button
                onClick={handleSettings}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all"
              >
                <User className="w-4 h-4" /> Edit Profile
              </button>
              <button
                onClick={handleSettings}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all"
              >
                <Settings className="w-4 h-4" /> Settings
              </button>
              <div className="border-t border-border/40 my-1" />
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-all"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
