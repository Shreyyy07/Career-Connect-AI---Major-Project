import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Settings, LogOut, Bell, CheckCheck, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Notif {
  id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export default function TopbarProfile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);

  // Fetch notifications
  const fetchNotifs = async () => {
    try {
      const data = await apiFetch<Notif[]>("/api/v1/notifications");
      if (data) {
        setNotifs(data);
        setUnread(data.filter((n) => !n.is_read).length);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarOpen(false);
      }
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
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

  const markAllRead = async () => {
    try {
      await apiFetch("/api/v1/notifications/read-all", { method: "PATCH" });
      setNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnread(0);
    } catch {
      // ignore
    }
  };

  const typeIcon = (type: string) => {
    if (type === "hr_decision") return "🏷️";
    if (type === "report_ready") return "📄";
    if (type === "interview_completed") return "🎙️";
    return "🔔";
  };

  return (
    <div className="flex items-center gap-4">
      {/* Bell Icon & Dropdown */}
      <div className="relative" ref={bellRef}>
        <button
          onClick={() => {
            setBellOpen(!bellOpen);
            setAvatarOpen(false);
            if (unread > 0) markAllRead();
          }}
          className="relative w-11 h-11 rounded-full bg-secondary/50 border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
        >
          <Bell className="w-5 h-5" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center border border-background">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>

        <AnimatePresence>
          {bellOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-14 z-50 w-80 bg-card/95 backdrop-blur-sm border border-border/60 shadow-2xl rounded-xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
                <span className="text-sm font-semibold text-foreground">Notifications</span>
                <div className="flex items-center gap-2">
                  {unread > 0 && (
                    <button
                      onClick={markAllRead}
                      title="Mark all read"
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      <CheckCheck className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setBellOpen(false)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
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
                  notifs.map((n) => (
                    <div
                      key={n.id}
                      className={cn(
                        "px-4 py-3 border-b border-border/30 last:border-0 hover:bg-secondary/30 transition-colors",
                        !n.is_read && "bg-primary/5"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-lg flex-shrink-0 mt-0.5">{typeIcon(n.type)}</span>
                        <div className="min-w-0">
                          <p
                            className={cn(
                              "text-xs font-semibold truncate",
                              !n.is_read ? "text-foreground" : "text-muted-foreground"
                            )}
                          >
                            {n.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {n.message}
                          </p>
                          <p className="text-[10px] text-muted-foreground/50 mt-1">
                            {new Date(n.created_at).toLocaleString()}
                          </p>
                        </div>
                        {!n.is_read && (
                          <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Avatar Profile */}
      <div className="relative" ref={avatarRef}>
        <button
          onClick={() => {
            setAvatarOpen(!avatarOpen);
            setBellOpen(false);
          }}
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
    </div>
  );
}
