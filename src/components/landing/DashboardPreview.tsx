import { motion } from "framer-motion";
import { Play, FileText, BarChart3, Clock, TrendingUp, Award, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import FadeInView from "./FadeInView";
import TextReveal from "./TextReveal";
import ScrollSection from "./ScrollSection";
import FloatingParticles from "./FloatingParticles";
import AnimatedCounter from "./AnimatedCounter";
import GlowingBorder from "./GlowingBorder";

const recentInterviews = [
  { role: "Full Stack Developer", date: "Apr 8, 2026", level: "Senior", score: 92 },
  { role: "ML Engineer", date: "Apr 5, 2026", level: "Mid-Level", score: 87 },
  { role: "Product Manager", date: "Apr 2, 2026", level: "Senior", score: 78 },
];

export default function DashboardPreview() {
  return (
    <section className="py-24 sm:py-32 relative overflow-hidden">
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/3 blur-[200px]" />
      <FloatingParticles count={12} color="primary" />
      <div className="container mx-auto px-6 relative">
        <ScrollSection parallaxOffset={30}>
          <div className="text-center mb-16">
            <FadeInView>
              <p className="text-xs text-primary font-display font-medium tracking-[0.3em] uppercase mb-3">
                Your Command Center
              </p>
            </FadeInView>
            <h2 className="font-display font-bold text-3xl sm:text-5xl md:text-6xl text-foreground leading-[1.1]">
              <TextReveal>Interview, then</TextReveal>
              <br />
              <span className="text-gradient-primary">
                <TextReveal delay={0.3}>deliver the proof.</TextReveal>
              </span>
            </h2>
            <FadeInView delay={0.5}>
              <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
                A full-length session, scored and ready to share.
              </p>
            </FadeInView>
          </div>
        </ScrollSection>

        <FadeInView delay={0.3}>
          <GlowingBorder>
            <motion.div
              className="glass rounded-3xl border border-border/40 overflow-hidden max-w-5xl mx-auto"
              initial={{ rotateX: 5, perspective: 1000 }}
              whileInView={{ rotateX: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              viewport={{ once: true }}
            >
              {/* Dashboard Header */}
              <div className="border-b border-border/30 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <motion.div className="w-3 h-3 rounded-full bg-destructive/60" whileHover={{ scale: 1.3 }} />
                  <motion.div className="w-3 h-3 rounded-full bg-warning/60" whileHover={{ scale: 1.3 }} />
                  <motion.div className="w-3 h-3 rounded-full bg-success/60" whileHover={{ scale: 1.3 }} />
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="px-3 py-1 rounded-full bg-secondary/60">Dashboard</span>
                  <motion.span
                    className="px-3 py-1 rounded-full bg-primary/10 text-primary"
                    animate={{ boxShadow: ["0 0 0px hsl(187 100% 50% / 0)", "0 0 12px hsl(187 100% 50% / 0.3)", "0 0 0px hsl(187 100% 50% / 0)"] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    Setup Interview
                  </motion.span>
                  <span className="px-3 py-1 rounded-full bg-secondary/60">History</span>
                </div>
                <div className="text-xs text-muted-foreground">5/5 credits</div>
              </div>

              <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Start Session Card */}
                <motion.div
                  className="lg:col-span-1 glass rounded-2xl p-6 border border-primary/20 relative overflow-hidden group cursor-pointer"
                  whileHover={{ y: -4, borderColor: "hsl(187 100% 50% / 0.4)" }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="absolute inset-0 bg-primary/[0.03] group-hover:bg-primary/[0.06] transition-colors" />
                  <motion.div
                    className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-primary/10 blur-[40px]"
                    animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                  <div className="relative z-10">
                    <motion.div
                      className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4"
                      whileHover={{ rotate: 10, scale: 1.1 }}
                    >
                      <Play className="w-5 h-5 text-primary" />
                    </motion.div>
                    <h3 className="font-display font-semibold text-foreground text-lg mb-2">Ready to Interview?</h3>
                    <p className="text-sm text-muted-foreground mb-4">Start a new session to sharpen your skills.</p>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 font-display text-xs">
                        Start Session
                      </Button>
                    </motion.div>
                  </div>
                </motion.div>

                {/* Recent Interviews */}
                <div className="lg:col-span-2 glass rounded-2xl p-6 border border-border/30">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display font-semibold text-foreground">Recent Interviews</h3>
                    <span className="text-xs text-muted-foreground">Last 3 sessions</span>
                  </div>
                  <div className="space-y-3">
                    {recentInterviews.map((interview, i) => (
                      <motion.div
                        key={i}
                        className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer group"
                        initial={{ opacity: 0, x: 40, filter: "blur(8px)" }}
                        whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                        whileHover={{ x: 4, backgroundColor: "hsl(240 10% 14% / 0.8)" }}
                        transition={{ delay: 0.4 + i * 0.15, duration: 0.5 }}
                        viewport={{ once: true }}
                      >
                        <div className="flex items-center gap-3">
                          <motion.div
                            className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"
                            whileHover={{ rotate: 5 }}
                          >
                            <FileText className="w-4 h-4 text-primary" />
                          </motion.div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{interview.role}</p>
                            <p className="text-xs text-muted-foreground">{interview.date} · {interview.level}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-display font-bold ${interview.score >= 90 ? 'text-success' : interview.score >= 80 ? 'text-primary' : 'text-warning'}`}>
                            {interview.score}%
                          </span>
                          <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Stats Row */}
              <div className="px-6 sm:px-8 pb-6 sm:pb-8">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { icon: BarChart3, label: "Avg Score", value: "85.7%", color: "text-primary" },
                    { icon: Clock, label: "Total Sessions", value: "24", color: "text-accent" },
                    { icon: TrendingUp, label: "Improvement", value: "+12%", color: "text-success" },
                    { icon: Award, label: "Top Skill", value: "System Design", color: "text-warning" },
                  ].map((stat, i) => (
                    <motion.div
                      key={i}
                      className="glass rounded-xl p-4 border border-border/20 text-center"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      whileHover={{ y: -2, borderColor: "hsl(187 100% 50% / 0.3)" }}
                      transition={{ delay: 0.6 + i * 0.1 }}
                      viewport={{ once: true }}
                    >
                      <motion.div whileHover={{ scale: 1.2, rotate: 10 }}>
                        <stat.icon className={`w-4 h-4 ${stat.color} mx-auto mb-2`} />
                      </motion.div>
                      <p className={`font-display font-bold text-lg ${stat.color}`}>
                        <AnimatedCounter value={stat.value} />
                      </p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </GlowingBorder>
        </FadeInView>
      </div>
    </section>
  );
}
