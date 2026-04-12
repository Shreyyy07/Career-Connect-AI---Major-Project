import { lazy, Suspense, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import TextReveal from "./TextReveal";
import FloatingParticles from "./FloatingParticles";

const NeuralNetwork3D = lazy(() => import("@/components/NeuralNetwork3D"));

export default function HeroSection() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: heroScroll } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(heroScroll, [0, 1], [0, 200]);
  const heroOpacity = useTransform(heroScroll, [0, 0.6], [1, 0]);
  const heroScale = useTransform(heroScroll, [0, 0.6], [1, 0.9]);

  return (
    <section ref={heroRef} className="relative min-h-[110vh] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-40" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-primary/5 blur-[150px]" />

      {/* Animated gradient orbs */}
      <motion.div
        className="absolute top-[20%] left-[15%] w-[300px] h-[300px] rounded-full bg-accent/10 blur-[120px]"
        animate={{ x: [0, 40, -20, 0], y: [0, -30, 20, 0], scale: [1, 1.2, 0.9, 1] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[20%] right-[10%] w-[400px] h-[400px] rounded-full bg-primary/8 blur-[150px]"
        animate={{ x: [0, -50, 30, 0], y: [0, 40, -20, 0], scale: [1, 0.8, 1.1, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />

      <FloatingParticles count={30} color="mixed" />

      <Suspense fallback={null}>
        <NeuralNetwork3D />
      </Suspense>

      <motion.div
        style={{ y: heroY, opacity: heroOpacity, scale: heroScale }}
        className="relative z-10 container mx-auto px-6 text-center"
      >
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2, type: "spring", stiffness: 100 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs text-primary font-medium mb-8 animate-pulse-glow"
        >
          <motion.div animate={{ rotate: [0, 180, 360] }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }}>
            <Sparkles className="w-3.5 h-3.5" />
          </motion.div>
          AI-Powered Recruitment Platform
        </motion.div>

        <h1 className="font-display font-bold text-4xl sm:text-6xl md:text-8xl leading-[0.95] mb-8 max-w-5xl mx-auto">
          <TextReveal delay={0.3}>Hire Smarter with</TextReveal>
          <br />
          <span className="text-gradient-primary">
            <TextReveal delay={0.6}>Neural Intelligence</TextReveal>
          </span>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.8, delay: 1 }}
          className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-12"
        >
          Semantic resume matching, AI-conducted interviews, multimodal behavioral analysis,
          and anti-cheat verification — all in one platform.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link to="/register">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 glow-primary font-display font-semibold px-8 h-13 text-base group relative overflow-hidden">
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-foreground/10 to-transparent"
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                />
                <span className="relative z-10 flex items-center">
                  Start Free
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </Button>
            </motion.div>
          </Link>
          <Link to="/login">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
              <Button size="lg" variant="outline" className="border-border/60 text-foreground hover:bg-secondary font-display px-8 h-13 text-base">
                Sign In
              </Button>
            </motion.div>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
          className="mt-20"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 mx-auto flex justify-center pt-2"
          >
            <motion.div className="w-1 h-2 rounded-full bg-primary" />
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}
