import { motion } from "framer-motion";
import FadeInView from "./FadeInView";
import TextReveal from "./TextReveal";
import ScrollSection from "./ScrollSection";
import AnimatedCounter from "./AnimatedCounter";
import FloatingParticles from "./FloatingParticles";

const signals = [
  { label: "Communication", score: 78, color: "bg-primary" },
  { label: "Technical", score: 86, color: "bg-accent" },
  { label: "Problem Solving", score: 82, color: "bg-success" },
  { label: "Culture Fit", score: 76, color: "bg-warning" },
];

const panelFeedback = [
  {
    role: "Technical Lead",
    score: 82,
    strengths: ["Architecture choices are crisp and defensible.", "Explains trade-offs with clarity."],
    improvements: ["Quantify performance impact with concrete numbers.", "Tie scalability decisions to real-world constraints."],
  },
  {
    role: "HR Manager",
    score: 78,
    strengths: ["Clear ownership language and accountability.", "Communicates with a calm, confident tone."],
    improvements: ["Add more story structure to behavioral answers.", "Highlight collaboration wins with outcomes."],
  },
  {
    role: "Hiring Manager",
    score: 80,
    strengths: ["Decision-making is fast and well-reasoned.", "Balances impact, cost, and risk."],
    improvements: ["Surface business impact earlier.", "Call out success metrics before diving into details."],
  },
];

export default function DecisionSignals() {
  return (
    <section className="py-24 sm:py-32 relative overflow-hidden">
      <div className="absolute right-0 top-1/3 w-[500px] h-[500px] rounded-full bg-primary/3 blur-[200px]" />
      <FloatingParticles count={10} color="mixed" />
      <div className="container mx-auto px-6 relative">
        <ScrollSection parallaxOffset={30}>
          <div className="text-center mb-16">
            <FadeInView>
              <p className="text-xs text-primary font-display font-medium tracking-[0.3em] uppercase mb-3">
                Decision Intelligence
              </p>
            </FadeInView>
            <h2 className="font-display font-bold text-3xl sm:text-5xl md:text-6xl text-foreground leading-[1.1]">
              <TextReveal>Call the</TextReveal>{" "}
              <span className="text-gradient-primary">
                <TextReveal delay={0.3}>Decision.</TextReveal>
              </span>
            </h2>
            <FadeInView delay={0.5}>
              <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
                Clear signals, organized and immediate. Multi-panel evaluation with structured feedback.
              </p>
            </FadeInView>
          </div>
        </ScrollSection>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Decision Signals */}
          <FadeInView direction="left">
            <motion.div
              className="glass rounded-3xl border border-border/40 p-6 sm:p-8 h-full"
              whileHover={{ boxShadow: "0 20px 60px -15px hsl(187 100% 50% / 0.1)" }}
            >
              <p className="text-xs text-primary font-display font-medium uppercase tracking-wider mb-6">
                Decision Signals
              </p>
              <div className="space-y-5">
                {signals.map((s, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.12 }}
                    viewport={{ once: true }}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-foreground">{s.label}</span>
                      <span className="text-sm font-display font-bold text-primary">
                        <AnimatedCounter value={`${s.score}%`} />
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-secondary/60 overflow-hidden relative">
                      <motion.div
                        className={`h-full rounded-full ${s.color} relative`}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${s.score}%` }}
                        transition={{ delay: 0.5 + i * 0.12, duration: 1, ease: "easeOut" }}
                        viewport={{ once: true }}
                      >
                        {/* Shimmer effect on bar */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                          animate={{ x: ["-100%", "200%"] }}
                          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3, delay: 1 + i * 0.2 }}
                        />
                      </motion.div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </FadeInView>

          {/* Panel Feedback */}
          <FadeInView direction="right" delay={0.2}>
            <div className="glass rounded-3xl border border-border/40 p-6 sm:p-8 h-full">
              <p className="text-xs text-primary font-display font-medium uppercase tracking-wider mb-6">
                Panel Feedback
              </p>
              <div className="space-y-4">
                {panelFeedback.map((p, i) => (
                  <motion.div
                    key={i}
                    className="glass rounded-xl p-4 border border-border/20 cursor-default"
                    initial={{ opacity: 0, y: 15, filter: "blur(6px)" }}
                    whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    whileHover={{ x: 4, borderColor: "hsl(187 100% 50% / 0.2)" }}
                    transition={{ delay: 0.4 + i * 0.15 }}
                    viewport={{ once: true }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-foreground">{p.role}</span>
                      <motion.span
                        className="text-sm font-display font-bold text-primary"
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        transition={{ delay: 0.6 + i * 0.15, type: "spring" }}
                        viewport={{ once: true }}
                      >
                        {p.score}/100
                      </motion.span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[10px] text-success uppercase tracking-wider mb-1.5">Strengths</p>
                        {p.strengths.map((s, j) => (
                          <p key={j} className="text-xs text-muted-foreground mb-1">• {s}</p>
                        ))}
                      </div>
                      <div>
                        <p className="text-[10px] text-warning uppercase tracking-wider mb-1.5">Improvements</p>
                        {p.improvements.map((s, j) => (
                          <p key={j} className="text-xs text-muted-foreground mb-1">• {s}</p>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </FadeInView>
        </div>
      </div>
    </section>
  );
}
