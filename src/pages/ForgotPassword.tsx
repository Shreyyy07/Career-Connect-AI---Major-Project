import { motion, AnimatePresence } from "framer-motion";
import { Brain, Mail, Lock, KeyRound, ArrowRight, ArrowLeft, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

type Step = "email" | "otp" | "done";

export default function ForgotPassword() {
  const { resetPassword, confirmResetPassword } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  // ── Step 1: request OTP ─────────────────────────────────────────
  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email) return;
    setLoading(true); setErr("");
    try {
      await resetPassword(email);
      setStep("otp");
      
      setResendCooldown(30);
      const timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (e: any) {
      setErr(e.message || "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: verify OTP + new password ───────────────────────────
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) { setErr("Please enter the 6-digit OTP."); return; }
    if (newPassword.length < 8) { setErr("Password must be at least 8 characters."); return; }
    setLoading(true); setErr("");
    try {
      await confirmResetPassword(email, otp, newPassword);
      setStep("done");
    } catch (e: any) {
      setErr(e.message || "Invalid OTP or it has expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <div className="w-9 h-9 rounded-lg bg-[#00e5ff]/10 border border-[#00e5ff]/30 flex items-center justify-center">
            <img src="/logo.png" alt="Logo" className="w-6 h-6 object-contain rounded-md" />
          </div>
          <span className="font-display font-bold text-lg">Career<span className="text-[#00e5ff]">Connect</span> AI</span>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8 justify-center">
          {(["email", "otp", "done"] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step === s ? "bg-[#00e5ff] text-black glow-primary" :
                (i < (step === "otp" ? 1 : step === "done" ? 2 : 0)) ? "bg-emerald-500 text-white" : "bg-secondary text-muted-foreground"
              }`}>
                {i < (step === "otp" ? 1 : step === "done" ? 2 : 0) ? "✓" : i + 1}
              </div>
              {i < 2 && <div className={`w-8 h-0.5 ${i < (step === "otp" ? 1 : step === "done" ? 2 : 0) ? "bg-emerald-500" : "bg-border"}`} />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* ── Step 1: Email ─────────────────────────────────────── */}
          {step === "email" && (
            <motion.div key="email" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h1 className="font-display font-bold text-2xl text-foreground mb-2">Forgot Password</h1>
              <p className="text-sm text-muted-foreground mb-7">
                Enter your email and we'll send you a 6-digit OTP to reset your password.
              </p>
              <form onSubmit={handleRequestOtp} className="space-y-4">
                {err && <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-xl">{err}</div>}
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="pl-10 bg-secondary/50 border-border/60 focus:border-[#00e5ff] h-11"
                      required
                    />
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-[#00e5ff] text-black glow-primary h-11">
                  {loading ? "Sending OTP…" : "Send OTP"} <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </form>
              <p className="text-sm text-muted-foreground mt-6 text-center">
                <Link to="/login" className="text-[#00e5ff] hover:underline inline-flex items-center gap-1">
                  <ArrowLeft className="w-3 h-3" /> Back to Sign In
                </Link>
              </p>
            </motion.div>
          )}

          {/* ── Step 2: OTP + New Password ────────────────────────── */}
          {step === "otp" && (
            <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h1 className="font-display font-bold text-2xl text-foreground mb-2">Enter OTP</h1>
              <p className="text-sm text-muted-foreground mb-1">
                A 6-digit code was sent to <span className="text-foreground font-medium">{email}</span>
              </p>
              <p className="text-xs text-muted-foreground mb-7">Valid for 10 minutes.</p>

              <form onSubmit={handleReset} className="space-y-4">
                {err && <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-xl">{err}</div>}
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">6-Digit OTP</label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="000000"
                      className="pl-10 bg-secondary/50 border-border/60 focus:border-[#00e5ff] h-11 text-2xl tracking-[0.5em] font-mono text-center"
                      maxLength={6}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type={showPw ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      className="pl-10 pr-10 bg-secondary/50 border-border/60 focus:border-[#00e5ff] h-11"
                      required
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" disabled={loading || otp.length !== 6} className="w-full bg-[#00e5ff] text-black glow-primary h-11">
                  {loading ? "Resetting…" : "Reset Password"} <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </form>
              <p className="text-sm text-muted-foreground mt-4 text-center flex flex-col gap-2">
                <button type="button" onClick={() => handleRequestOtp()} disabled={resendCooldown > 0 || loading} className="text-[#00e5ff] hover:underline disabled:opacity-50 disabled:no-underline">
                  {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : "Resend OTP"}
                </button>
                <button onClick={() => { setStep("email"); setOtp(""); setErr(""); }} className="text-muted-foreground hover:text-foreground hover:underline inline-flex items-center justify-center gap-1">
                  <ArrowLeft className="w-3 h-3" /> Try a different email
                </button>
              </p>
            </motion.div>
          )}

          {/* ── Step 3: Done ─────────────────────────────────────── */}
          {step === "done" && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
              <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </div>
              <h1 className="font-display font-bold text-2xl text-foreground mb-3">Password Reset!</h1>
              <p className="text-muted-foreground mb-8">Your password has been updated successfully. You can now sign in with your new password.</p>
              <Button onClick={() => navigate("/login")} className="w-full bg-[#00e5ff] text-black glow-primary h-11">
                Go to Sign In <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
