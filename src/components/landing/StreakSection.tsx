import { motion } from "framer-motion";
import { Flame, Calendar, TrendingUp, Target } from "lucide-react";
import FadeInView from "./FadeInView";
import TextReveal from "./TextReveal";
import ScrollSection from "./ScrollSection";
import AnimatedCounter from "./AnimatedCounter";

const weekDays = ["M", "T", "W", "T", "F", "S", "S"];
const streakData = [
  [1, 1, 0, 1, 1, 0, 0],
  [1, 1, 1, 1, 0, 1, 0],
  [1, 1, 1, 1, 1, 0, 0],
  [1, 1, 1, 1, 1, 1, 1],
];

export default function StreakSection() {
  return (
    <section className="py-24 sm:py-32 relative overflow-hidden">
      <div className="absolute right-0 bottom-0 w-[500px] h-[500px] rounded-full bg-warning/5 blur-[200px]" />
      <div className="container mx-auto px-6 relative">
        <ScrollSection parallaxOffset={30}>
          <div className="text-center mb-16">
            <FadeInView>
              <p className="text-xs text-primary font-display font-medium tracking-[0.3em] uppercase mb-3">
                Consistency
              </p>
            </FadeInView>
            <h2 className="font-display font-bold text-3xl sm:text-5xl md:text-6xl text-foreground leading-[1.1]">
              <TextReveal>Consistent effort</TextReveal>
              <br />
              <span className="text-muted-foreground">
                <TextReveal delay={0.3}>beats raw intelligence.</TextReveal>
              </span>
            </h2>
            <FadeInView delay={0.5}>
              <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
                Momentum compounds when you show up every day. Track your practice streak and watch your scores climb.
              </p>
            </FadeInView>
          </div>
        </ScrollSection>

        <FadeInView delay={0.3}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {/* Streak Heatmap */}
            <motion.div
              className="md:col-span-2 glass rounded-3xl border border-border/40 p-6 sm:p-8"
              whileHover={{ boxShadow: "0 20px 60px -15px hsl(38 92% 55% / 0.1)" }}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                    <Flame className="w-5 h-5 text-warning" />
                  </motion.div>
                  <span className="font-display font-semibold text-foreground">Activity Streak</span>
                </div>
                <span className="text-sm text-muted-foreground">Last 4 weeks</span>
              </div>

              <div className="space-y-2">
                <div className="flex gap-2 mb-1">
                  <div className="w-8" />
                  {weekDays.map((d, i) => (
                    <div key={i} className="flex-1 text-center text-xs text-muted-foreground">{d}</div>
                  ))}
                </div>
                {streakData.map((week, wi) => (
                  <div key={wi} className="flex gap-2">
                    <div className="w-8 text-xs text-muted-foreground flex items-center">W{wi + 1}</div>
                    {week.map((active, di) => (
                      <motion.div
                        key={di}
                        className={`flex-1 aspect-square rounded-lg cursor-default ${active ? "bg-primary/60" : "bg-secondary/40"}`}
                        initial={{ scale: 0, opacity: 0, rotateZ: -10 }}
                        whileInView={{ scale: 1, opacity: 1, rotateZ: 0 }}
                        whileHover={active ? { scale: 1.15, boxShadow: "0 0 15px hsl(187 100% 50% / 0.4)" } : { scale: 1.05 }}
                        transition={{ delay: 0.3 + wi * 0.06 + di * 0.04, type: "spring", stiffness: 150 }}
                        viewport={{ once: true }}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Stats Column */}
            <div className="space-y-4">
              {[
                { icon: Flame, label: "Current Streak", value: "7", suffix: " days", color: "text-warning" },
                { icon: Target, label: "Best Streak", value: "14", suffix: " days", color: "text-primary" },
                { icon: TrendingUp, label: "This Month", value: "18", suffix: " sessions", color: "text-success" },
                { icon: Calendar, label: "Consistency", value: "82%", suffix: "", color: "text-accent" },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  className="glass rounded-2xl p-4 border border-border/30 flex items-center gap-3 cursor-default"
                  initial={{ opacity: 0, x: 30, filter: "blur(6px)" }}
                  whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                  whileHover={{ x: -4, borderColor: "hsl(187 100% 50% / 0.3)" }}
                  transition={{ delay: 0.4 + i * 0.12 }}
                  viewport={{ once: true }}
                >
                  <motion.div
                    className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"
                    whileHover={{ rotate: 15, scale: 1.1 }}
                  >
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </motion.div>
                  <div>
                    <p className={`font-display font-bold text-lg ${stat.color}`}>
                      <AnimatedCounter value={stat.value} />{stat.suffix}
                    </p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </FadeInView>
      </div>
    </section>
  );
}
