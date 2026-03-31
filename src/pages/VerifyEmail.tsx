import { motion, AnimatePresence } from "framer-motion";
import { Brain, Mail, ArrowRight, MailCheck, RefreshCw } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { apiFetch } from "../lib/api";

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const email = params.get("email") || "your inbox";
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<"idle" | "success" | "error">("idle");
  const [resendCount, setResendCount] = useState(0);

  const handleResend = async () => {
    if (resendCount >= 3) {
      setResendStatus("error");
      return;
    }
    setResending(true);
    setResendStatus("idle");
    try {
      await apiFetch("/api/v1/auth/resend-verification", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setResendStatus("success");
      setResendCount((c) => c + 1);
    } catch {
      // Always show success to prevent enumeration
      setResendStatus("success");
      setResendCount((c) => c + 1);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md text-center"
      >
        {/* Brand */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
            <img src="/logo.png" alt="Logo" className="w-6 h-6 object-contain rounded-md" />
          </div>
          <span className="font-display font-bold text-lg">Career<span className="text-primary">Connect</span> AI</span>
        </div>

        {/* Icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="w-24 h-24 rounded-3xl bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-7 glow-primary"
        >
          <MailCheck className="w-12 h-12 text-primary" />
        </motion.div>

        <h1 className="font-display font-bold text-2xl text-foreground mb-3">Check your inbox</h1>
        <p className="text-muted-foreground mb-2">We sent a verification link to</p>
        <p className="text-primary font-semibold mb-6 break-all">{email}</p>

        <div className="glass rounded-2xl p-6 text-left space-y-3 mb-8">
          <p className="text-sm text-muted-foreground">📩 Open the email from <span className="text-foreground">Career Connect AI</span></p>
          <p className="text-sm text-muted-foreground">🔗 Click the verification button inside</p>
          <p className="text-sm text-muted-foreground">⏰ The link is valid for <span className="text-foreground font-medium">24 hours</span></p>
          <p className="text-sm text-muted-foreground">📁 Check your spam/junk folder if you can't find it</p>
        </div>

        <AnimatePresence>
          {resendStatus === "success" && (
            <motion.p
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-emerald-400 text-sm mb-4"
            >
              ✓ A new verification email has been sent.
            </motion.p>
          )}
          {resendStatus === "error" && (
            <motion.p
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-destructive text-sm mb-4"
            >
              Maximum resend limit reached. Please wait before trying again.
            </motion.p>
          )}
        </AnimatePresence>

        <Button
          onClick={handleResend}
          disabled={resending || resendCount >= 3}
          variant="outline"
          className="w-full border-border/60 text-muted-foreground hover:text-foreground hover:bg-secondary/50 mb-4"
        >
          {resending ? (
            <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Sending…</>
          ) : (
            <><Mail className="w-4 h-4 mr-2" /> Resend verification email</>
          )}
          {resendCount > 0 && <span className="ml-2 text-xs text-muted-foreground">({resendCount}/3)</span>}
        </Button>

        <p className="text-sm text-muted-foreground">
          Already verified?{" "}
          <Link to="/login" className="text-primary hover:underline font-medium">
            Sign in <ArrowRight className="inline w-3 h-3" />
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
