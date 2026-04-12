import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Play, ArrowUpRight, Link2, FileDown } from "lucide-react";
import FadeInView from "./FadeInView";
import TextReveal from "./TextReveal";
import ScrollSection from "./ScrollSection";

export default function ShareReport() {
  return (
    <section className="py-24 sm:py-32 bg-card/30 relative overflow-hidden">
      <motion.div
        className="absolute left-0 top-0 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[200px]"
        animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
        transition={{ duration: 12, repeat: Infinity }}
      />
      <div className="container mx-auto px-6 relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left - Text */}
          <ScrollSection parallaxOffset={30}>
            <FadeInView direction="left">
              <p className="text-xs text-primary font-display font-medium tracking-[0.3em] uppercase mb-3">
                Export & Share
              </p>
              <h2 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl text-foreground leading-[1.1] mb-6">
                <TextReveal>Ship the</TextReveal>{" "}
                <span className="text-gradient-primary">
                  <TextReveal delay={0.3}>Report.</TextReveal>
                </span>
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-8">
                Share a link or export a PDF in seconds. Your evaluation report is always ready
                to send to hiring managers, recruiters, or keep for your own records.
              </p>
            </FadeInView>
          </ScrollSection>

          {/* Right - Action Cards */}
          <FadeInView direction="right" delay={0.2}>
            <div className="space-y-4">
              {[
                { icon: Link2, title: "Share Report", desc: "Generate a secure, shareable link to your evaluation report.", color: "bg-primary/10 text-primary", border: "border-primary/20", glow: "hsl(187 100% 50% / 0.15)" },
                { icon: FileDown, title: "Download PDF", desc: "Export a beautifully formatted PDF report for offline use.", color: "bg-accent/10 text-accent", border: "border-accent/20", glow: "hsl(270 80% 65% / 0.15)" },
                { icon: Play, title: "Start New Session", desc: "Jump into another interview to keep improving your scores.", color: "bg-success/10 text-success", border: "border-success/20", glow: "hsl(160 84% 45% / 0.15)" },
              ].map((action, i) => (
                <motion.div
                  key={i}
                  className={`glass rounded-2xl p-6 border ${action.border} flex items-center gap-5 cursor-pointer group transition-all duration-300`}
                  whileHover={{ x: 8, boxShadow: `0 15px 40px -10px ${action.glow}`, borderColor: "hsl(187 100% 50% / 0.4)" }}
                  initial={{ opacity: 0, x: -30, filter: "blur(8px)" }}
                  whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                  transition={{ delay: 0.3 + i * 0.15 }}
                  viewport={{ once: true }}
                >
                  <motion.div
                    className={`w-12 h-12 rounded-2xl ${action.color} flex items-center justify-center shrink-0`}
                    whileHover={{ rotate: 10, scale: 1.1 }}
                  >
                    <action.icon className="w-5 h-5" />
                  </motion.div>
                  <div className="flex-1">
                    <p className="text-foreground font-medium mb-1">{action.title}</p>
                    <p className="text-xs text-muted-foreground">{action.desc}</p>
                  </div>
                  <motion.div
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    animate={{ x: [0, 3, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </FadeInView>
        </div>
      </div>
    </section>
  );
}
