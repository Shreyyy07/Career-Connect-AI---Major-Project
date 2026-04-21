import { Link } from "react-router-dom";
import {
  Brain, FileSearch, Target, Mic, Shield, BarChart3,
  ArrowRight, ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TextReveal from "@/components/landing/TextReveal";
import ScrollSection from "@/components/landing/ScrollSection";
import Marquee from "@/components/landing/Marquee";
import SectionCounter from "@/components/landing/SectionCounter";
import FadeInView from "@/components/landing/FadeInView";
import HeroSection from "@/components/landing/HeroSection";
import DashboardPreview from "@/components/landing/DashboardPreview";
import PerformanceReport from "@/components/landing/PerformanceReport";
import VoiceAnalysis from "@/components/landing/VoiceAnalysis";
import DecisionSignals from "@/components/landing/DecisionSignals";
import AntiCheatSection from "@/components/landing/AntiCheatSection";
import StreakSection from "@/components/landing/StreakSection";
import ShareReport from "@/components/landing/ShareReport";
import FloatingParticles from "@/components/landing/FloatingParticles";
import AnimatedCounter from "@/components/landing/AnimatedCounter";
import { motion } from "framer-motion";
import { useEffect } from "react";

const features = [
  { icon: FileSearch, title: "Semantic Resume Matching", desc: "Doc2Vec embeddings + cosine similarity for meaning-based matching, not keyword filtering." },
  { icon: Target, title: "Skill Gap Analysis", desc: "Identifies missing skills and recommends personalized training paths with priority ranking." },
  { icon: Mic, title: "AI-Powered Interviews", desc: "Gemini LLM + RAG pipeline generates context-aware, role-specific questions in real time." },
  { icon: Brain, title: "Multimodal Analysis", desc: "DeepFace emotion recognition + speech analysis for comprehensive behavioral evaluation." },
  { icon: Shield, title: "Anti-Cheat System", desc: "YOLOv8 person detection, liveness checks, and identity verification throughout interviews." },
  { icon: BarChart3, title: "Weighted Scoring", desc: "Explainable composite scores with configurable weights for fair, data-driven decisions." },
];

const stats = [
  { value: "85%+", label: "Matching Accuracy" },
  { value: "60%", label: "Faster Shortlisting" },
  { value: "95%", label: "Cheat Detection" },
  { value: "4.9★", label: "User Rating" },
];

const steps = [
  { num: "01", title: "Upload Resume", desc: "PDF or DOCX — our NLP engine extracts and structures your profile." },
  { num: "02", title: "Get Matched", desc: "Semantic matching against job descriptions with hybrid scoring." },
  { num: "03", title: "AI Interview", desc: "Live video interview with context-aware AI-generated questions." },
  { num: "04", title: "Get Results", desc: "Comprehensive evaluation report with scores and recommendations." },
];

export default function Index() {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />
      <SectionCounter total={12} />

      {/* 01 — Hero */}
      <HeroSection />

      {/* 02 — Stats Marquee */}
      <section className="py-8 border-y border-border/30 relative overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <Marquee speed={25} className="py-4">
          <div className="flex items-center gap-16 px-8">
            {[...stats, ...stats].map((stat, i) => (
              <div key={i} className="flex items-center gap-4 min-w-fit">
                <span className="font-display font-bold text-3xl sm:text-4xl text-primary">
                  <AnimatedCounter value={stat.value} />
                </span>
                <span className="text-sm text-muted-foreground uppercase tracking-widest font-display">{stat.label}</span>
                <motion.span
                  className="text-primary/40 text-2xl"
                  animate={{ rotate: [0, 180, 360], scale: [1, 1.2, 1] }}
                  transition={{ duration: 4, repeat: Infinity, delay: i * 0.3 }}
                >
                  ✦
                </motion.span>
              </div>
            ))}
          </div>
        </Marquee>
      </section>

      {/* 03 — Manifesto */}
      <section className="py-32 sm:py-44 relative">
        <div className="absolute inset-0 bg-dots opacity-20" />
        <FloatingParticles count={15} color="mixed" />
        <div className="container mx-auto px-6 relative">
          <ScrollSection parallaxOffset={40} scaleIn>
            <div className="max-w-5xl mx-auto text-center">
              <FadeInView>
                <motion.p
                  className="text-xs text-primary font-display font-medium tracking-[0.3em] uppercase mb-8"
                  animate={{ letterSpacing: ["0.3em", "0.5em", "0.3em"] }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  The Future of Hiring
                </motion.p>
              </FadeInView>
              <h2 className="font-display font-bold text-3xl sm:text-5xl md:text-7xl leading-[1.1] text-foreground">
                <TextReveal>Most companies screen resumes.</TextReveal>
                <br />
                <span className="text-muted-foreground"><TextReveal delay={0.4}>We understand candidates.</TextReveal></span>
              </h2>
              <FadeInView delay={0.8}>
                <p className="mt-10 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                  Our AI doesn't just match keywords — it comprehends context, evaluates potential,
                  and ensures authenticity through multimodal analysis.
                </p>
              </FadeInView>
            </div>
          </ScrollSection>
        </div>
      </section>

      {/* 04 — Dashboard Preview */}
      <DashboardPreview />

      {/* 05 — Performance Report */}
      <PerformanceReport />

      {/* 06 — Voice Analysis */}
      <VoiceAnalysis />

      {/* 07 — Decision Signals & Panel Feedback */}
      <DecisionSignals />

      {/* 08 — Features Grid */}
      <section id="capabilities" className="py-24 sm:py-32 relative overflow-hidden">
        <FloatingParticles count={10} color="accent" />
        <div className="container mx-auto px-6 relative">
          <ScrollSection parallaxOffset={30}>
            <FadeInView>
              <p className="text-xs text-primary font-display font-medium tracking-[0.3em] uppercase mb-3">Capabilities</p>
              <h2 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl text-foreground mb-16">
                <TextReveal>Everything You Need to Hire Right</TextReveal>
              </h2>
            </FadeInView>
          </ScrollSection>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, rotateY: -180, z: -200, scale: 0.8 }}
                whileInView={{ opacity: 1, rotateY: 0, z: 0, scale: 1 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 1.2, delay: i * 0.12, type: "spring", stiffness: 70, damping: 15 }}
                style={{ perspective: 1000 }}
                className="h-full"
              >
                <motion.div
                  className="glass rounded-2xl p-8 h-full hover:border-primary/30 transition-all duration-500 group cursor-default relative overflow-hidden"
                  whileHover={{ y: -8, boxShadow: "0 20px 60px -15px hsl(187 100% 50% / 0.15)" }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Animated corner glow */}
                  <motion.div
                    className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-primary/10 blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                  />
                  <div className="relative z-10">
                    <motion.div
                      className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 group-hover:glow-primary transition-shadow duration-500"
                      whileHover={{ rotate: 15, scale: 1.1 }}
                    >
                      <f.icon className="w-6 h-6 text-primary" />
                    </motion.div>
                    <h3 className="font-display font-semibold text-foreground text-xl mb-3">{f.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                  {/* Bottom shimmer line */}
                  <motion.div
                    className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent w-full opacity-0 group-hover:opacity-100 transition-opacity"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: "100%" }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 09 — How it Works */}
      <section className="py-24 sm:py-32 bg-card/30 relative overflow-hidden">
        <motion.div
          className="absolute right-0 top-0 w-[500px] h-[500px] rounded-full bg-primary/3 blur-[200px]"
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        <div className="container mx-auto px-6 relative">
          <ScrollSection parallaxOffset={30}>
            <div className="text-center mb-20">
              <FadeInView>
                <p className="text-xs text-primary font-display font-medium tracking-[0.3em] uppercase mb-3">Workflow</p>
              </FadeInView>
              <h2 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl text-foreground">
                <TextReveal>Four Steps to Better Hiring</TextReveal>
              </h2>
            </div>
          </ScrollSection>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <FadeInView key={step.num} delay={i * 0.15} direction="up">
                <motion.div
                  className="relative group cursor-default"
                  whileHover={{ y: -8 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="glass rounded-2xl p-8 h-full transition-all duration-500 group-hover:border-primary/30 relative overflow-hidden">
                    {/* Hover glow */}
                    <motion.div className="absolute inset-0 bg-primary/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <motion.span
                      className="font-display font-bold text-7xl text-primary/10 group-hover:text-primary/25 transition-colors duration-500 leading-none relative z-10"
                      initial={{ opacity: 0, scale: 0.5 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 + i * 0.15, type: "spring", stiffness: 100 }}
                      viewport={{ once: true }}
                    >
                      {step.num}
                    </motion.span>
                    <h3 className="font-display font-semibold text-foreground text-xl mt-4 mb-3 relative z-10">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed relative z-10">{step.desc}</p>
                  </div>
                  {i < 3 && (
                    <div className="hidden lg:block absolute top-1/2 -right-4 w-8 text-primary/20">
                      <motion.div
                        animate={{ x: [0, 4, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <ArrowRight className="w-6 h-6" />
                      </motion.div>
                    </div>
                  )}
                </motion.div>
              </FadeInView>
            ))}
          </div>
        </div>
      </section>

      {/* 10 — Streak & Consistency */}
      <StreakSection />

      {/* 11 — Anti-Cheat & Privacy */}
      <AntiCheatSection />

      {/* 12 — Share & Export */}
      <ShareReport />

      {/* Final CTA */}
      <section className="py-32 sm:py-44 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-15" />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/5 blur-[200px]"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 6, repeat: Infinity }}
        />
        <FloatingParticles count={20} color="mixed" />
        <div className="container mx-auto px-6 relative text-center">
          <ScrollSection parallaxOffset={50} scaleIn>
            <FadeInView>
              <p className="text-xs text-primary font-display font-medium tracking-[0.3em] uppercase mb-6">Get the Offer</p>
            </FadeInView>
            <h2 className="font-display font-bold text-3xl sm:text-5xl md:text-7xl text-foreground mb-8 max-w-4xl mx-auto leading-[1.1]">
              <TextReveal>Ready to Transform</TextReveal>
              <br />
              <TextReveal delay={0.3}>Your Hiring?</TextReveal>
            </h2>
            <FadeInView delay={0.6}>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-12">
                Built to win. AI-driven, data-backed, bias-reduced.
              </p>
            </FadeInView>
            <FadeInView delay={0.8}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/register">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                    <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 glow-primary font-display font-semibold px-10 h-13 text-base group relative overflow-hidden">
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-foreground/10 to-transparent"
                        animate={{ x: ["-100%", "100%"] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                      />
                      <span className="relative z-10 flex items-center">
                        Get Started Free
                        <ArrowUpRight className="ml-2 w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </span>
                    </Button>
                  </motion.div>
                </Link>
                <Link to="/register?role=hr">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                    <Button size="lg" variant="outline" className="border-border/60 text-foreground hover:bg-secondary font-display px-10 h-13 text-base">
                      I'm a Recruiter
                    </Button>
                  </motion.div>
                </Link>
              </div>
            </FadeInView>
          </ScrollSection>
        </div>
      </section>

      <Footer />
    </div>
  );
}
