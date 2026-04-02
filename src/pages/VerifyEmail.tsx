import { motion, AnimatePresence } from "framer-motion";
import { Mail, ArrowRight, MailCheck, RefreshCw, Loader2 } from "lucide-react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useState, useRef, KeyboardEvent, ChangeEvent } from "react";
import { apiFetch } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const email = params.get("email") || "";
  const navigate = useNavigate();
  const { verifyEmail: contextVerifyEmail } = useAuth();
  
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<"idle" | "success" | "error">("idle");
  const [resendCount, setResendCount] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleOtpChange = (index: number, value: string) => {
    if (!/^[0-9]*$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length !== 6) {
      toast.error("Please enter the complete 6-digit code.");
      return;
    }

    setVerifying(true);
    try {
      const role = await contextVerifyEmail(email, code);
      toast.success("Email verified successfully!");
      if (role === "hr") navigate("/hr/dashboard");
      else navigate("/candidate/dashboard");
    } catch (e: any) {
      const msg = e.message || "Invalid OTP code";
      toast.error(msg);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  };

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
      toast.success("Verification code resent successfully.");
    } catch {
      setResendStatus("success");
      setResendCount((c) => c + 1);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md text-center"
      >
        {/* Brand */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-lg bg-[#00e5ff]/10 border border-[#00e5ff]/30 flex items-center justify-center">
            <img src="/logo.png" alt="Logo" className="w-6 h-6 object-contain rounded-md" />
          </div>
          <span className="font-display font-bold text-lg">Career<span className="text-[#00e5ff]">Connect</span> AI</span>
        </div>

        {/* Icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="w-20 h-20 rounded-2xl bg-[#00e5ff]/10 border border-[#00e5ff]/30 flex items-center justify-center mx-auto mb-6 glow-primary"
        >
          <MailCheck className="w-10 h-10 text-[#00e5ff]" />
        </motion.div>

        <h1 className="font-display font-bold text-2xl text-foreground mb-2">Check your inbox</h1>
        <p className="text-muted-foreground mb-6">
          We sent a 6-digit verification code to
          <br /><span className="text-[#00e5ff] font-semibold">{email}</span>
        </p>

        {/* OTP Input Fields */}
        <div className="flex justify-center gap-2 mb-8">
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => (inputRefs.current[i] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="w-12 h-14 text-center text-2xl font-display font-bold rounded-xl glass border-border focus:border-[#00e5ff] focus:ring-1 focus:ring-[#00e5ff] transition-all bg-secondary/50 text-foreground shadow-sm"
              disabled={verifying}
            />
          ))}
        </div>

        <Button
          onClick={handleVerify}
          disabled={verifying || otp.join("").length !== 6}
          className="w-full h-12 text-black bg-[#00e5ff] hover:bg-[#00e5ff]/90 font-display font-semibold mb-6 rounded-xl shadow-[0_0_15px_rgba(0,229,255,0.4)] transition-all"
        >
          {verifying ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify Email"}
        </Button>

        <Button
          onClick={handleResend}
          disabled={resending || resendCount >= 3}
          variant="outline"
          className="w-full border-border/60 text-muted-foreground hover:text-foreground hover:bg-secondary/50 mb-6 rounded-xl"
        >
          {resending ? (
             <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Sending…</>
          ) : (
            <><Mail className="w-4 h-4 mr-2" /> Resend Code</>
          )}
          {resendCount > 0 && <span className="ml-2 text-xs text-muted-foreground">({resendCount}/3)</span>}
        </Button>
        
        {resendStatus === "error" && (
           <p className="text-destructive text-sm mb-4">Maximum resend limit reached. Try later.</p>
        )}

        <p className="text-sm text-muted-foreground">
          Wrong email?{" "}
          <Link to="/register" className="text-[#00e5ff] hover:underline font-medium">
            Sign up again <ArrowRight className="inline w-3 h-3" />
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
