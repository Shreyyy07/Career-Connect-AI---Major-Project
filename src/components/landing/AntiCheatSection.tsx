import { motion } from "framer-motion";
import { Shield, Eye, Fingerprint, AlertTriangle, Lock, UserCheck } from "lucide-react";
import FadeInView from "./FadeInView";
import TextReveal from "./TextReveal";
import ScrollSection from "./ScrollSection";
import FloatingParticles from "./FloatingParticles";

const checks = [
  { icon: Eye, label: "Person Detection", desc: "YOLOv8 ensures only the candidate is visible", status: "Active" },
  { icon: Fingerprint, label: "Identity Verification", desc: "Face match against uploaded photo ID", status: "Verified" },
  { icon: UserCheck, label: "Liveness Detection", desc: "Anti-spoofing checks throughout the session", status: "Passed" },
  { icon: Lock, label: "Tab Switch Monitoring", desc: "Detects window focus changes and alt-tabs", status: "Clean" },
];

export default function AntiCheatSection() {
  return (
    <section className="py-24 sm:py-32 bg-card/30 relative overflow-hidden">
      <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-destructive/3 blur-[200px]" />
      <FloatingParticles count={10} color="primary" />
      <div className="container mx-auto px-6 relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left - Text */}
          <ScrollSection parallaxOffset={30}>
            <FadeInView direction="left">
              <p className="text-xs text-primary font-display font-medium tracking-[0.3em] uppercase mb-3">
                Integrity & Privacy
              </p>
              <h2 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl text-foreground leading-[1.1] mb-6">
                <TextReveal>Your Data.</TextReveal>
                <br />
                <span className="text-muted-foreground">
                  <TextReveal delay={0.3}>Remains Yours.</TextReveal>
                </span>
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Our multi-layered anti-cheat system ensures interview integrity without compromising
                candidate privacy. All data is encrypted, processed securely, and never shared.
              </p>

              <motion.div
                className="glass rounded-2xl p-6 border border-border/30"
                whileHover={{ borderColor: "hsl(187 100% 50% / 0.3)" }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 3, repeat: Infinity }}>
                    <Shield className="w-5 h-5 text-primary" />
                  </motion.div>
                  <span className="text-sm font-display font-semibold text-foreground">Security Features</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {["End-to-end encryption", "GDPR compliant", "SOC 2 ready", "Data auto-deletion", "No third-party sharing", "Audit logging"].map((f, i) => (
                    <motion.div
                      key={i}
                      className="flex items-center gap-2"
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + i * 0.08 }}
                      viewport={{ once: true }}
                    >
                      <motion.div
                        className="w-1.5 h-1.5 rounded-full bg-success"
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        transition={{ delay: 0.7 + i * 0.08, type: "spring" }}
                        viewport={{ once: true }}
                      />
                      <span className="text-xs text-muted-foreground">{f}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </FadeInView>
          </ScrollSection>

          {/* Right - Anti-cheat Monitor */}
          <FadeInView direction="right" delay={0.2}>
            <motion.div
              className="glass rounded-3xl border border-border/40 p-6 sm:p-8 relative overflow-hidden"
              whileHover={{ y: -6, boxShadow: "0 20px 60px -15px hsl(160 84% 45% / 0.15)" }}
              transition={{ duration: 0.4 }}
            >
              <motion.div
                className="absolute top-0 left-0 w-40 h-40 bg-success/5 rounded-full blur-[80px]"
                animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.5, 0.2] }}
                transition={{ duration: 4, repeat: Infinity }}
              />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <p className="text-xs text-primary font-display font-medium uppercase tracking-wider">Anti-Cheat Monitor</p>
                  <motion.div
                    className="flex items-center gap-2"
                    animate={{ opacity: [1, 0.6, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                    <span className="text-xs text-success">All Clear</span>
                  </motion.div>
                </div>

                <div className="space-y-3">
                  {checks.map((c, i) => (
                    <motion.div
                      key={i}
                      className="glass rounded-xl p-4 border border-border/20 flex items-center gap-4 cursor-default"
                      initial={{ opacity: 0, x: 30, filter: "blur(8px)" }}
                      whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                      whileHover={{ x: 4, borderColor: "hsl(160 84% 45% / 0.3)" }}
                      transition={{ delay: 0.3 + i * 0.12 }}
                      viewport={{ once: true }}
                    >
                      <motion.div
                        className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0"
                        whileHover={{ rotate: 10, scale: 1.1 }}
                      >
                        <c.icon className="w-5 h-5 text-primary" />
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{c.label}</p>
                        <p className="text-xs text-muted-foreground truncate">{c.desc}</p>
                      </div>
                      <motion.span
                        className="px-2.5 py-1 rounded-full bg-success/10 text-success text-xs font-medium shrink-0"
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        transition={{ delay: 0.5 + i * 0.12, type: "spring", stiffness: 200 }}
                        viewport={{ once: true }}
                      >
                        {c.status}
                      </motion.span>
                    </motion.div>
                  ))}
                </div>

                {/* Alert Log */}
                <motion.div
                  className="mt-4 glass rounded-xl p-4 border border-border/20"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  viewport={{ once: true }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                      <AlertTriangle className="w-3.5 h-3.5 text-warning" />
                    </motion.div>
                    <span className="text-xs text-muted-foreground">Integrity Log</span>
                  </div>
                  <div className="space-y-2 text-xs font-mono">
                    {[
                      { time: "00:12:34", msg: "Single person detected ✓", type: "ok" },
                      { time: "00:15:22", msg: "Identity re-verified ✓", type: "ok" },
                      { time: "00:22:05", msg: "Tab switch detected — flagged", type: "warn" },
                      { time: "00:22:06", msg: "Candidate returned — session continued", type: "ok" },
                    ].map((log, i) => (
                      <motion.div
                        key={i}
                        className="flex items-center gap-2"
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1 + i * 0.15 }}
                        viewport={{ once: true }}
                      >
                        <span className="text-muted-foreground/60">{log.time}</span>
                        <span className={log.type === "ok" ? "text-muted-foreground" : "text-warning"}>{log.msg}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </FadeInView>
        </div>
      </div>
    </section>
  );
}
