import { motion } from "framer-motion";
import { Mic, Volume2, Timer, AlertTriangle } from "lucide-react";
import FadeInView from "./FadeInView";
import TextReveal from "./TextReveal";
import ScrollSection from "./ScrollSection";
import AnimatedCounter from "./AnimatedCounter";

const metrics = [
  { label: "Pace", value: "Strong", icon: Timer, color: "text-success" },
  { label: "WPM", value: "172", icon: Volume2, color: "text-primary" },
  { label: "Filler Words", value: "24", icon: AlertTriangle, color: "text-warning" },
  { label: "Confidence", value: "88.5%", icon: Mic, color: "text-primary" },
];

export default function VoiceAnalysis() {
  return (
    <section className="py-24 sm:py-32 bg-card/30 relative overflow-hidden">
      <div className="absolute left-0 bottom-0 w-[500px] h-[500px] rounded-full bg-accent/5 blur-[200px]" />
      <div className="container mx-auto px-6 relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left - Mock UI */}
          <FadeInView direction="left" delay={0.2}>
            <motion.div
              className="glass rounded-3xl border border-border/40 p-6 sm:p-8 relative overflow-hidden"
              whileHover={{ y: -6, boxShadow: "0 20px 60px -15px hsl(187 100% 50% / 0.15)" }}
              transition={{ duration: 0.4 }}
            >
              <motion.div
                className="absolute bottom-0 left-0 w-40 h-40 bg-accent/5 rounded-full blur-[80px]"
                animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 5, repeat: Infinity }}
              />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <p className="text-xs text-primary font-display font-medium uppercase tracking-wider">Speaking Analysis</p>
                  <motion.div
                    className="flex items-center gap-2"
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <div className="w-2 h-2 rounded-full bg-destructive" />
                    <span className="text-xs text-destructive font-medium">LIVE</span>
                  </motion.div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {metrics.map((m, i) => (
                    <motion.div
                      key={i}
                      className="glass rounded-xl p-4 border border-border/20 text-center"
                      initial={{ opacity: 0, scale: 0.8, rotateY: 20 }}
                      whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
                      whileHover={{ scale: 1.05, borderColor: "hsl(187 100% 50% / 0.3)" }}
                      transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                      viewport={{ once: true }}
                    >
                      <motion.div whileHover={{ rotate: 15, scale: 1.2 }}>
                        <m.icon className={`w-5 h-5 ${m.color} mx-auto mb-2`} />
                      </motion.div>
                      <p className="text-xs text-muted-foreground mb-1">{m.label}</p>
                      <p className={`font-display font-bold text-xl ${m.color}`}>
                        <AnimatedCounter value={m.value} />
                      </p>
                    </motion.div>
                  ))}
                </div>

                {/* Waveform Visualization */}
                <div className="glass rounded-xl p-4 border border-border/20 mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <motion.div
                      className="w-2 h-2 rounded-full bg-success"
                      animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                    <span className="text-xs text-muted-foreground">Voice Pattern</span>
                  </div>
                  <div className="flex items-end gap-[3px] h-12">
                    {Array.from({ length: 40 }).map((_, i) => {
                      const height = 15 + Math.sin(i * 0.5) * 25 + Math.random() * 20;
                      return (
                        <motion.div
                          key={i}
                          className="flex-1 rounded-full bg-primary/40"
                          initial={{ height: 4 }}
                          whileInView={{ height }}
                          transition={{ delay: 0.5 + i * 0.02, duration: 0.4, type: "spring", stiffness: 100 }}
                          viewport={{ once: true }}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Feedback */}
                <div className="space-y-2">
                  <motion.div
                    className="flex items-center gap-2 p-2 rounded-lg bg-success/5 border border-success/10"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.2 }}
                    viewport={{ once: true }}
                  >
                    <motion.span className="text-xs text-success" animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1, repeat: Infinity }}>✓</motion.span>
                    <span className="text-xs text-muted-foreground">Great speaking pace!</span>
                  </motion.div>
                  <motion.div
                    className="flex items-center gap-2 p-2 rounded-lg bg-warning/5 border border-warning/10"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.4 }}
                    viewport={{ once: true }}
                  >
                    <span className="text-xs text-warning">!</span>
                    <span className="text-xs text-muted-foreground">Try to reduce filler words like: actually, like, right</span>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </FadeInView>

          {/* Right - Text */}
          <ScrollSection parallaxOffset={30}>
            <FadeInView direction="right">
              <p className="text-xs text-primary font-display font-medium tracking-[0.3em] uppercase mb-3">
                Voice & Speech
              </p>
              <h2 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl text-foreground leading-[1.1] mb-6">
                <TextReveal>Own Your</TextReveal>{" "}
                <span className="text-gradient-primary">
                  <TextReveal delay={0.3}>Voice.</TextReveal>
                </span>
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Pace, clarity, and confidence — measured in real time. Our speech analysis engine
                evaluates your delivery, identifies filler words, and tracks speaking patterns
                to help you communicate with authority.
              </p>
              <div className="space-y-4">
                {[
                  { title: "Real-time Speech Analysis", desc: "Words per minute, pauses, and rhythm tracked continuously." },
                  { title: "Filler Word Detection", desc: "Identifies and counts verbal tics to eliminate from your delivery." },
                  { title: "Confidence Scoring", desc: "AI-powered assessment of vocal clarity and assertiveness." },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    className="glass rounded-xl p-4 border border-border/20 cursor-default"
                    initial={{ opacity: 0, y: 15, filter: "blur(6px)" }}
                    whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    whileHover={{ x: 6, borderColor: "hsl(187 100% 50% / 0.3)" }}
                    transition={{ delay: 0.5 + i * 0.12 }}
                    viewport={{ once: true }}
                  >
                    <p className="text-sm font-medium text-foreground mb-1">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </motion.div>
                ))}
              </div>
            </FadeInView>
          </ScrollSection>
        </div>
      </div>
    </section>
  );
}
