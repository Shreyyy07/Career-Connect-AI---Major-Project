import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Brain, Mail, Lock, User, ArrowRight, Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

// PRD §2.1: Password must be 8+ chars, ≥1 uppercase, ≥1 number, ≥1 special char
const validatePassword = (pw: string) => ({
  length: pw.length >= 8,
  uppercase: /[A-Z]/.test(pw),
  number: /[0-9]/.test(pw),
  special: /[^A-Za-z0-9]/.test(pw),
});

// PRD §2.1: Name must be 2-50 chars, letters and spaces only
const validateName = (n: string) => /^[A-Za-z\s]{2,50}$/.test(n.trim());

function PasswordStrengthBar({ password }: { password: string }) {
  const r = validatePassword(password);
  const score = Object.values(r).filter(Boolean).length; // 0-4
  const colors = ["", "bg-red-500", "bg-orange-400", "bg-yellow-400", "bg-emerald-500"];
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  if (!password) return null;
  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= score ? colors[score] : "bg-border"}`} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
        {[
          { ok: r.length, label: "8+ characters" },
          { ok: r.uppercase, label: "Uppercase letter" },
          { ok: r.number, label: "Number" },
          { ok: r.special, label: "Special character" },
        ].map(({ ok, label }) => (
          <p key={label} className={`text-[11px] flex items-center gap-1 ${ok ? "text-emerald-400" : "text-muted-foreground"}`}>
            {ok ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
            {label}
          </p>
        ))}
      </div>
      <p className={`text-xs font-medium ${colors[score].replace("bg-", "text-")}`}>{labels[score]}</p>
    </div>
  );
}

export default function Register() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedRole = searchParams.get("role") === "hr" ? "hr" : "candidate";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [globalErr, setGlobalErr] = useState("");
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleRoleToggle = (newRole: "hr" | "candidate") => {
    setSearchParams({ role: newRole });
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!validateName(name)) errs.name = "Name must be 2–50 characters with letters only.";
    if (!email.includes("@")) errs.email = "Invalid email address.";
    const pw = validatePassword(password);
    if (!pw.length || !pw.uppercase || !pw.number || !pw.special)
      errs.password = "Password must be 8+ chars with uppercase, number, and special character.";
    if (password !== confirmPassword) errs.confirm = "Passwords do not match.";
    return errs;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    setGlobalErr("");
    try {
      await signUp(email, password, name, selectedRole);
      navigate(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch (e: any) {
      const msg = e.message || "";
      if (msg.toLowerCase().includes("already registered") || msg.includes("409")) {
        setFieldErrors({ email: "This email is already registered." });
      } else {
        setGlobalErr(msg || "Failed to create account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const isHr = selectedRole === "hr";

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-1 items-center justify-center relative overflow-hidden bg-card/30">
        <div className="absolute inset-0 bg-dots opacity-30" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-[#00e5ff]/5 blur-[200px]" />
        <motion.div
          key={selectedRole}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 text-center px-12"
        >
          <div className="w-20 h-20 rounded-2xl bg-[#00e5ff]/10 border border-[#00e5ff]/30 flex items-center justify-center mx-auto mb-8 glow-primary">
            <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain rounded-xl" />
          </div>
          <h2 className="font-display font-bold text-3xl text-foreground mb-4">
            {isHr ? "Hire Top Talent" : "Join Career Connect AI"}
          </h2>
          <p className="text-muted-foreground max-w-sm">
            {isHr 
               ? "Post AI-driven job applications, track candidates instantly, and eliminate subjective bias."
               : "Access AI-powered resume matching, live interviews with emotion analysis, and personalised skill gap coaching."}
          </p>
          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            {[
              { val: "95%", label: "Match Accuracy" },
              { val: "10s", label: "Avg. Match Time" },
              { val: "5★", label: "Automated Checks" },
            ].map((s) => (
              <div key={s.label} className="glass rounded-xl p-3">
                <p className="text-[#00e5ff] font-display font-bold text-xl">{s.val}</p>
                <p className="text-muted-foreground text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-lg bg-[#00e5ff]/10 border border-[#00e5ff]/30 flex items-center justify-center">
              <img src="/logo.png" alt="Logo" className="w-6 h-6 object-contain rounded-md" />
            </div>
            <span className="font-display font-bold text-lg">Career<span className="text-[#00e5ff]">Connect</span> AI</span>
          </div>

          <h1 className="font-display font-bold text-2xl text-foreground mb-2">Create an account</h1>
          <p className="text-sm text-muted-foreground mb-6">Start your journey with us today.</p>

          {/* Role Toggle Tabs */}
          <div className="flex p-1 bg-secondary/50 rounded-lg mb-6 border border-border/50">
            <button
              type="button"
              onClick={() => handleRoleToggle("candidate")}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                !isHr ? "bg-background text-foreground shadow-sm border border-white/5" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              }`}
            >
              For Candidates
            </button>
            <button
              type="button"
              onClick={() => handleRoleToggle("hr")}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                isHr ? "bg-[#00e5ff]/10 text-[#00e5ff] shadow-[0_0_15px_rgba(0,229,255,0.15)] border border-[#00e5ff]/20" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              }`}
            >
              For Recruiters
            </button>
          </div>

          <form className="space-y-5" onSubmit={handleRegister}>
            {globalErr && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-xl">
                {globalErr}
              </div>
            )}

            {/* Full Name */}
            <div>
              <label className="text-sm text-foreground font-medium mb-1.5 block">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={name}
                  onChange={(e) => { setName(e.target.value); setFieldErrors((p) => ({ ...p, name: "" })); }}
                  placeholder="John Doe"
                  className={`pl-10 bg-secondary/50 border-border/60 focus:border-[#00e5ff] h-11 ${fieldErrors.name ? "border-destructive" : ""}`}
                  required
                />
              </div>
              {fieldErrors.name && <p className="text-xs text-destructive mt-1">{fieldErrors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="text-sm text-foreground font-medium mb-1.5 block">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setFieldErrors((p) => ({ ...p, email: "" })); }}
                  type="email"
                  placeholder="you@example.com"
                  className={`pl-10 bg-secondary/50 border-border/60 focus:border-[#00e5ff] h-11 ${fieldErrors.email ? "border-destructive" : ""}`}
                  required
                />
              </div>
              {fieldErrors.email && <p className="text-xs text-destructive mt-1">{fieldErrors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="text-sm text-foreground font-medium mb-1.5 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: "" })); }}
                  type={showPw ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  className={`pl-10 pr-10 bg-secondary/50 border-border/60 focus:border-[#00e5ff] h-11 ${fieldErrors.password ? "border-destructive" : ""}`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.password && <p className="text-xs text-destructive mt-1">{fieldErrors.password}</p>}
              <PasswordStrengthBar password={password} />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="text-sm text-foreground font-medium mb-1.5 block">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setFieldErrors((p) => ({ ...p, confirm: "" })); }}
                  type="password"
                  placeholder="Re-enter password"
                  className={`pl-10 bg-secondary/50 border-border/60 focus:border-[#00e5ff] h-11 ${fieldErrors.confirm ? "border-destructive" : ""}`}
                  required
                />
              </div>
              {fieldErrors.confirm && <p className="text-xs text-destructive mt-1">{fieldErrors.confirm}</p>}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00e5ff] text-black hover:bg-[#00e5ff]/90 glow-primary font-display font-semibold h-11 mt-2"
            >
              {loading ? "Creating Account…" : "Create Account"} <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </form>

          <p className="text-sm text-muted-foreground mt-6 text-center">
            Already have an account?{" "}
            <Link to="/login" className="text-[#00e5ff] hover:underline font-medium">Sign in</Link>
          </p>
          <p className="text-xs text-muted-foreground mt-3 text-center">
            Are you a recruiter?{" "}
            <Link to="/login" className="text-accent hover:underline">Sign in as HR</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
