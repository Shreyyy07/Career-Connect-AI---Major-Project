import { motion } from "framer-motion";
import {
  User, Mail, Shield, Save, Lock, Eye, EyeOff, ChevronRight,
  Camera, CheckCircle2, FileText, Mic, TrendingUp
} from "lucide-react";
import DashboardSidebar from "@/components/DashboardSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../lib/api";

export default function CandidateProfile() {
  const { user, updateProfile } = useAuth();

  // Edit name state
  const [nameEdit, setNameEdit] = useState(user?.name || "");
  const [nameSaving, setNameSaving] = useState(false);
  const [nameSuccess, setNameSuccess] = useState(false);
  const [nameErr, setNameErr] = useState("");

  // Change password state
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwErr, setPwErr] = useState("");

  const initials = (user?.name || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameEdit.trim() || nameEdit.trim().length < 2) {
      setNameErr("Name must be at least 2 characters.");
      return;
    }
    setNameSaving(true);
    setNameErr("");
    setNameSuccess(false);
    try {
      await updateProfile(nameEdit.trim());
      setNameSuccess(true);
      setTimeout(() => setNameSuccess(false), 3000);
    } catch (e: any) {
      setNameErr(e.message || "Failed to update name.");
    } finally {
      setNameSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw.length < 8) { setPwErr("Password must be at least 8 characters."); return; }
    if (newPw !== confirmPw) { setPwErr("Passwords do not match."); return; }
    setPwSaving(true);
    setPwErr("");
    setPwSuccess(false);
    try {
      await apiFetch("/api/v1/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ current_password: currentPw, new_password: newPw }),
      });
      setPwSuccess(true);
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      setTimeout(() => setPwSuccess(false), 3000);
    } catch (e: any) {
      setPwErr(e.message || "Failed to change password. Check your current password.");
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar role="candidate" />

      <main className="flex-1 overflow-auto">
        <div className="p-8 w-full max-w-4xl">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className="font-display font-bold text-3xl text-foreground">My Profile</h1>
            <p className="text-base text-muted-foreground mt-1">Manage your account settings and preferences.</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ── Left: Avatar + summary ─────────────────────────── */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className="glass rounded-2xl p-6 flex flex-col items-center text-center"
            >
              {/* Avatar */}
              <div className="relative mb-5">
                <div className="w-24 h-24 rounded-full bg-primary/20 border-4 border-primary/40 glow-primary flex items-center justify-center font-display font-bold text-primary text-4xl select-none">
                  {initials}
                </div>
                <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary border-2 border-background flex items-center justify-center text-primary-foreground hover:bg-primary/80 transition-all">
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>

              <h2 className="font-display font-bold text-xl text-foreground">{user?.name || "User"}</h2>
              <p className="text-sm text-muted-foreground mb-1">{user?.email}</p>
              <span className="inline-block text-[11px] uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20 mt-1">
                {user?.role || "candidate"}
              </span>

              {/* Quick stats */}
              <div className="w-full mt-6 space-y-3 text-left">
                {[
                  { icon: FileText, label: "Resume", value: "Uploaded", color: "text-emerald-400" },
                  { icon: Mic, label: "Interviews", value: "Track on Dashboard", color: "text-primary" },
                  { icon: TrendingUp, label: "Latest Score", value: "View Reports", color: "text-accent" },
                ].map(({ icon: Icon, label, value, color }) => (
                  <div key={label} className="flex items-center gap-3 p-3 bg-secondary/40 rounded-lg border border-border/40">
                    <Icon className={`w-4 h-4 ${color} flex-shrink-0`} />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="text-sm font-medium text-foreground truncate">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* ── Right: Edit forms ─────────────────────────────── */}
            <div className="lg:col-span-2 space-y-5">

              {/* Display Name */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="glass rounded-2xl p-6"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-foreground">Display Name</h3>
                    <p className="text-xs text-muted-foreground">How you appear across the platform</p>
                  </div>
                </div>
                <form onSubmit={handleSaveName} className="space-y-4">
                  {nameErr && <p className="text-sm text-destructive">{nameErr}</p>}
                  {nameSuccess && <p className="text-sm text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Name updated!</p>}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Full Name</label>
                    <Input
                      value={nameEdit}
                      onChange={(e) => setNameEdit(e.target.value)}
                      className="bg-secondary/50 border-border/60 focus:border-primary h-11"
                      placeholder="Your full name"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        value={user?.email || ""}
                        className="pl-10 bg-secondary/30 border-border/40 h-11 cursor-not-allowed opacity-60"
                        readOnly
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Email address cannot be changed.</p>
                  </div>
                  <Button type="submit" disabled={nameSaving} className="bg-primary text-primary-foreground hover:bg-primary/90 glow-primary">
                    <Save className="w-4 h-4 mr-2" />
                    {nameSaving ? "Saving…" : "Save Changes"}
                  </Button>
                </form>
              </motion.div>

              {/* Account Security */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className="glass rounded-2xl p-6"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-foreground">Account Security</h3>
                    <p className="text-xs text-muted-foreground">Change your login password</p>
                  </div>
                </div>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  {pwErr && <p className="text-sm text-destructive">{pwErr}</p>}
                  {pwSuccess && <p className="text-sm text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Password changed!</p>}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Current Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type={showPw ? "text" : "password"}
                        value={currentPw}
                        onChange={(e) => setCurrentPw(e.target.value)}
                        placeholder="••••••••"
                        className="pl-10 pr-10 bg-secondary/50 border-border/60 focus:border-primary h-11"
                        required
                      />
                      <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">New Password</label>
                      <Input
                        type="password"
                        value={newPw}
                        onChange={(e) => setNewPw(e.target.value)}
                        placeholder="Min. 8 characters"
                        className="bg-secondary/50 border-border/60 focus:border-primary h-11"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Confirm New Password</label>
                      <Input
                        type="password"
                        value={confirmPw}
                        onChange={(e) => setConfirmPw(e.target.value)}
                        placeholder="Re-enter new password"
                        className="bg-secondary/50 border-border/60 focus:border-primary h-11"
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={pwSaving} variant="outline" className="border-accent/40 text-accent hover:bg-accent/10">
                    <Shield className="w-4 h-4 mr-2" />
                    {pwSaving ? "Updating…" : "Update Password"}
                  </Button>
                </form>
              </motion.div>

              {/* Account info */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="glass rounded-2xl p-5"
              >
                <h3 className="font-display font-semibold text-foreground mb-3 text-sm uppercase tracking-wider text-muted-foreground">Account Info</h3>
                <div className="space-y-2">
                  {[
                    { label: "Account Type", value: user?.role || "Candidate" },
                    { label: "Member Since", value: "2025" },
                    { label: "Account Status", value: "Active", color: "text-emerald-400" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="flex justify-between items-center py-2 border-b border-border/30 last:border-0">
                      <span className="text-sm text-muted-foreground">{label}</span>
                      <span className={`text-sm font-medium ${color || "text-foreground"}`}>{value}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
