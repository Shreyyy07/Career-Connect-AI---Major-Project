import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Brain, Mail, Lock, User, ArrowRight, Briefcase, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const [role, setRole] = useState<"candidate" | "hr">("candidate");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setErr("");
    try {
      await signUp(email, password, name, role);
      navigate(role === "candidate" ? "/candidate/dashboard" : "/hr/dashboard");
    } catch (e: any) {
      setErr(e.message || "Failed to register account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-1 items-center justify-center relative overflow-hidden bg-card/30">
        <div className="absolute inset-0 bg-dots opacity-30" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-accent/10 blur-[100px]" />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 text-center px-12"
        >
          <div className="w-20 h-20 rounded-2xl bg-accent/10 border border-accent/30 flex items-center justify-center mx-auto mb-8 glow-accent">
            <Brain className="w-10 h-10 text-accent" />
          </div>
          <h2 className="font-display font-bold text-3xl text-foreground mb-4">
            Join the Future
          </h2>
          <p className="text-muted-foreground max-w-sm">
            Create your account and experience AI-driven recruitment — whether you're hiring or getting hired.
          </p>
        </motion.div>
      </div>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <span className="font-display font-bold text-lg">Career<span className="text-primary">Connect</span> AI</span>
          </div>

          <h1 className="font-display font-bold text-2xl text-foreground mb-2">Create Account</h1>
          <p className="text-sm text-muted-foreground mb-6">Choose your role and get started</p>

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { key: "candidate" as const, icon: GraduationCap, label: "Candidate", desc: "Looking for jobs" },
              { key: "hr" as const, icon: Briefcase, label: "Recruiter", desc: "Hiring talent" },
            ].map((r) => (
              <button
                key={r.key}
                onClick={() => setRole(r.key)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  role === r.key
                    ? "border-primary/50 bg-primary/5 glow-primary"
                    : "border-border/50 bg-secondary/30 hover:border-border"
                }`}
              >
                <r.icon className={`w-5 h-5 mb-2 ${role === r.key ? "text-primary" : "text-muted-foreground"}`} />
                <p className={`font-display font-semibold text-sm ${role === r.key ? "text-primary" : "text-foreground"}`}>{r.label}</p>
                <p className="text-xs text-muted-foreground">{r.desc}</p>
              </button>
            ))}
          </div>

          <form className="space-y-4" onSubmit={handleRegister}>
            {err && <div className="p-3 text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl">{err}</div>}
            <div>
              <label className="text-sm text-foreground font-medium mb-1.5 block">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="John Doe" className="pl-10 bg-secondary/50 border-border/60 focus:border-primary h-11" />
              </div>
            </div>

            <div>
              <label className="text-sm text-foreground font-medium mb-1.5 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input value={email} onChange={(e) => setEmail(e.target.value)} required type="email" placeholder="you@example.com" className="pl-10 bg-secondary/50 border-border/60 focus:border-primary h-11" />
              </div>
            </div>

            <div>
              <label className="text-sm text-foreground font-medium mb-1.5 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input value={password} onChange={(e) => setPassword(e.target.value)} required type="password" placeholder="Min. 8 characters" className="pl-10 bg-secondary/50 border-border/60 focus:border-primary h-11" />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-primary font-display font-semibold h-11 mt-2">
              {loading ? "Creating Account..." : "Create Account"} <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </form>

          <p className="text-sm text-muted-foreground mt-6 text-center">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline font-medium">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
