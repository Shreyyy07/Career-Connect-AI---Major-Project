import { motion } from "framer-motion";
import { CheckCircle2, Star, TrendingUp, Award } from "lucide-react";
import FadeInView from "./FadeInView";
import TextReveal from "./TextReveal";
import ScrollSection from "./ScrollSection";
import AnimatedCounter from "./AnimatedCounter";
import FloatingParticles from "./FloatingParticles";

export default function PerformanceReport() {
  return (
    <section className="py-24 sm:py-32 relative overflow-hidden">
      <div className="absolute right-0 top-0 w-[500px] h-[500px] rounded-full bg-accent/5 blur-[200px]" />
      <FloatingParticles count={8} color="accent" />
      <div className="container mx-auto px-6 relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left - Text */}
          <ScrollSection parallaxOffset={30}>
            <FadeInView direction="left">
              <p className="text-xs text-primary font-display font-medium tracking-[0.3em] uppercase mb-3">
                Performance Report
              </p>
              <h2 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl text-foreground leading-[1.1] mb-6">
                <TextReveal>Scored, analyzed,</TextReveal>
                <br />
                <span className="text-gradient-primary">
                  <TextReveal delay={0.3}>ready to share.</TextReveal>
                </span>
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-8">
                Every interview generates a comprehensive evaluation report with composite scores,
                executive summary, key takeaways, and a clear hiring recommendation — all backed by AI analysis.
              </p>
              <div className="space-y-3">
                {[
                  "Composite score with weighted breakdown",
                  "Executive summary with strengths & improvements",
                  "Hire / No-Hire recommendation with confidence",
                  "Shareable link or downloadable PDF",
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    className="flex items-center gap-3"
                    initial={{ opacity: 0, x: -30, filter: "blur(6px)" }}
                    whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                    transition={{ delay: 0.5 + i * 0.12, duration: 0.5 }}
                    viewport={{ once: true }}
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      transition={{ delay: 0.6 + i * 0.12, type: "spring", stiffness: 200 }}
                      viewport={{ once: true }}
                    >
                      <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                    </motion.div>
                    <span className="text-sm text-muted-foreground">{item}</span>
                  </motion.div>
                ))}
              </div>
            </FadeInView>
          </ScrollSection>

          {/* Right - Mock Report Card */}
          <FadeInView direction="right" delay={0.2}>
            <motion.div
              className="glass rounded-3xl border border-border/40 p-6 sm:p-8 relative overflow-hidden"
              whileHover={{ y: -6, boxShadow: "0 20px 60px -15px hsl(187 100% 50% / 0.15)" }}
              transition={{ duration: 0.4 }}
            >
              {/* Glow */}
              <motion.div
                className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-[80px]"
                animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 4, repeat: Infinity }}
              />

              <div className="relative z-10">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Crafted interview based on</p>
                    <div className="flex items-center gap-2">
                      <motion.div
                        className="w-6 h-6 rounded bg-foreground/10 flex items-center justify-center text-xs font-bold text-foreground"
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.5 }}
                      >
                        G
                      </motion.div>
                      <span className="text-sm font-medium text-foreground">Google</span>
                      <span className="text-xs text-muted-foreground">principles and values</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">Software Engineer</p>
                    <p className="text-xs text-muted-foreground">Senior Level</p>
                  </div>
                </div>

                {/* Score */}
                <div className="flex items-center gap-8 mb-6">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Overall Score</p>
                    <div className="flex items-end gap-1">
                      <span className="font-display font-bold text-5xl text-primary">
                        <AnimatedCounter value="92" />
                      </span>
                      <span className="text-muted-foreground text-sm mb-2">/100</span>
                    </div>
                  </div>
                  <motion.div
                    className="flex-1 h-px bg-border/30"
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                    viewport={{ once: true }}
                  />
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Hiring Decision</p>
                    <motion.span
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/10 text-success text-sm font-display font-semibold"
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1, type: "spring", stiffness: 150 }}
                      viewport={{ once: true }}
                    >
                      <Award className="w-3.5 h-3.5" />
                      Strong Hire
                    </motion.span>
                  </div>
                </div>

                {/* Summary */}
                <motion.div
                  className="glass rounded-xl p-4 border border-border/20 mb-6"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  viewport={{ once: true }}
                >
                  <p className="text-xs text-primary font-display font-medium uppercase tracking-wider mb-2">Executive Summary</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    The candidate delivered exceptionally clear, structured responses with strong technical depth.
                    Answers were concise, confident, and easy to follow, consistently highlighting sound trade-offs
                    and architectural judgment.
                  </p>
                </motion.div>

                {/* Key Takeaways */}
                <div>
                  <p className="text-xs text-primary font-display font-medium uppercase tracking-wider mb-3">Key Takeaways</p>
                  <div className="space-y-2">
                    {[
                      "Explains architecture choices with clarity and conviction.",
                      "Balances performance, reliability, and cost trade-offs.",
                      "Owns constraints and drives toward measurable outcomes.",
                    ].map((item, i) => (
                      <motion.div
                        key={i}
                        className="flex items-start gap-2"
                        initial={{ opacity: 0, x: 15 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.8 + i * 0.1 }}
                        viewport={{ once: true }}
                      >
                        <motion.div
                          animate={{ rotate: [0, 10, -10, 0] }}
                          transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                        >
                          <Star className="w-3.5 h-3.5 text-warning shrink-0 mt-0.5" />
                        </motion.div>
                        <span className="text-sm text-muted-foreground">{item}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </FadeInView>
        </div>
      </div>
    </section>
  );
}
