import { lazy, Suspense, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Brain, FileSearch, Target, Mic, Shield, BarChart3,
  ArrowRight, Sparkles, Users, Zap, CheckCircle2, ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TextReveal from "@/components/landing/TextReveal";
import ScrollSection from "@/components/landing/ScrollSection";
import Marquee from "@/components/landing/Marquee";
import SectionCounter from "@/components/landing/SectionCounter";
import FadeInView from "@/components/landing/FadeInView";
import { useAuth } from "../context/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
const NeuralNetwork3D = lazy(() => import("@/components/NeuralNetwork3D"));

const features = [
  {
    icon: FileSearch,
    title: "Semantic Resume Matching",
    desc: "Doc2Vec embeddings + cosine similarity for meaning-based matching, not keyword filtering.",
  },
  {
    icon: Target,
    title: "Skill Gap Analysis",
    desc: "Identifies missing skills and recommends personalized training paths with priority ranking.",
  },
  {
    icon: Mic,
    title: "AI-Powered Interviews",
    desc: "Gemini LLM + RAG pipeline generates context-aware, role-specific questions in real time.",
  },
  {
    icon: Brain,
    title: "Multimodal Analysis",
    desc: "DeepFace emotion recognition + speech analysis for comprehensive behavioral evaluation.",
  },
  {
    icon: Shield,
    title: "Anti-Cheat System",
    desc: "YOLOv8 person detection, liveness checks, and identity verification throughout interviews.",
  },
  {
    icon: BarChart3,
    title: "Weighted Scoring",
    desc: "Explainable composite scores with configurable weights for fair, data-driven decisions.",
  },
];

const steps = [
  { num: "01", title: "Upload Resume", desc: "PDF or DOCX — our NLP engine extracts and structures your profile." },
  { num: "02", title: "Get Matched", desc: "Semantic matching against job descriptions with hybrid scoring." },
  { num: "03", title: "AI Interview", desc: "Live video interview with context-aware AI-generated questions." },
  { num: "04", title: "Get Results", desc: "Comprehensive evaluation report with scores and recommendations." },
];

const stats = [
  { value: "85%+", label: "Matching Accuracy" },
  { value: "60%", label: "Faster Shortlisting" },
  { value: "95%", label: "Cheat Detection" },
  { value: "4.9★", label: "User Rating" },
];

export default function Index() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: heroScroll } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(heroScroll, [0, 1], [0, 200]);
  const heroOpacity = useTransform(heroScroll, [0, 0.6], [1, 0]);
  const heroScale = useTransform(heroScroll, [0, 0.6], [1, 0.9]);

  const { user } = useAuth();
  const dashboardLink = user?.role === "hr" || user?.role === "admin" 
    ? "/hr/dashboard" 
    : "/candidate/dashboard";

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />
      <SectionCounter total={6} />

      {/* ═══ SECTION 01 — Hero ═══ */}
      <section ref={heroRef} className="relative min-h-[110vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-40" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-[#00e5ff]/5 blur-[150px]" />

        <ErrorBoundary>
          <Suspense fallback={null}>
            <NeuralNetwork3D />
          </Suspense>
        </ErrorBoundary>

        <motion.div
          style={{ y: heroY, opacity: heroOpacity, scale: heroScale }}
          className="relative z-10 container mx-auto px-6 text-center"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs text-[#00e5ff] font-medium mb-8"
          >
            <Sparkles className="w-3.5 h-3.5" />
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
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
            {user ? (
               <Link to={dashboardLink}>
                 <Button size="lg" className="bg-[#00e5ff] text-black hover:text-black hover:bg-[#00e5ff]/90 shadow-[0_0_20px_rgba(0,229,255,0.4)] font-display font-semibold transition-all duration-300 px-8 h-13 text-base rounded-full group">
                   Go to Dashboard
                   <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                 </Button>
               </Link>
            ) : (
              <>
                <Link to="/register">
                  <Button size="lg" className="bg-[#00e5ff] text-black hover:text-black hover:bg-[#00e5ff]/90 shadow-[0_0_20px_rgba(0,229,255,0.4)] font-display font-semibold transition-all duration-300 px-8 h-13 text-base rounded-full group">
                    Start Free
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline" className="border-border/60 text-white hover:text-white hover:bg-white/10 font-display px-8 h-13 text-base rounded-full transition-all duration-300">
                    Sign In
                  </Button>
                </Link>
              </>
            )}
          </motion.div>

          {/* Scroll indicator */}
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
              <motion.div className="w-1 h-2 rounded-full bg-[#00e5ff]" />
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* ═══ SECTION 02 — Stats Marquee ═══ */}
      <section className="py-8 border-y border-border/30 relative">
        <Marquee speed={25} className="py-4">
          <div className="flex items-center gap-16 px-8">
            {[...stats, ...stats].map((stat, i) => (
              <div key={i} className="flex items-center gap-4 min-w-fit">
                <span className="font-display font-bold text-3xl sm:text-4xl text-[#00e5ff]">{stat.value}</span>
                <span className="text-sm text-muted-foreground uppercase tracking-widest font-display">{stat.label}</span>
                <span className="text-border/60 text-2xl">✦</span>
              </div>
            ))}
          </div>
        </Marquee>
      </section>

      {/* ═══ SECTION 03 — Manifesto ═══ */}
      <section className="py-32 sm:py-44 relative">
        <div className="absolute inset-0 bg-dots opacity-20" />
        <div className="container mx-auto px-6 relative">
          <ScrollSection parallaxOffset={40} scaleIn>
            <div className="max-w-5xl mx-auto text-center">
              <FadeInView>
                <p className="text-xs text-[#00e5ff] font-display font-medium tracking-[0.3em] uppercase mb-8">
                  The Future of Hiring
                </p>
              </FadeInView>
              <h2 className="font-display font-bold text-3xl sm:text-5xl md:text-7xl leading-[1.1] text-foreground">
                <TextReveal>Most companies screen resumes.</TextReveal>
                <br />
                <span className="text-muted-foreground">
                  <TextReveal delay={0.4}>We understand candidates.</TextReveal>
                </span>
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

      {/* ═══ SECTION 04 — Features ═══ */}
      <section id="capabilities" className="py-24 sm:py-32 relative">
        <div className="container mx-auto px-6 relative">
          <ScrollSection parallaxOffset={30}>
            <FadeInView>
              <p className="text-xs text-[#00e5ff] font-display font-medium tracking-[0.3em] uppercase mb-3">
                Capabilities
              </p>
              <h2 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl text-foreground mb-16">
                <TextReveal>Everything You Need to Hire Right</TextReveal>
              </h2>
            </FadeInView>
          </ScrollSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <FadeInView key={f.title} delay={i * 0.1}>
                <motion.div
                  className="glass rounded-2xl p-8 h-full hover:border-[#00e5ff]/30 transition-all duration-500 group cursor-default relative overflow-hidden"
                  whileHover={{ y: -4, transition: { duration: 0.3 } }}
                >
                  {/* Hover glow */}
                  <div className="absolute inset-0 bg-[#00e5ff]/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <div className="relative z-10">
                    <div className="w-14 h-14 rounded-2xl bg-[#00e5ff]/10 border border-[#00e5ff]/20 flex items-center justify-center mb-6 group-hover:glow-primary transition-shadow duration-500">
                      <f.icon className="w-6 h-6 text-[#00e5ff]" />
                    </div>
                    <h3 className="font-display font-semibold text-foreground text-xl mb-3">{f.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                </motion.div>
              </FadeInView>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SECTION 05 — How it Works ═══ */}
      <section id="workflow" className="py-24 sm:py-32 bg-card/30 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-[500px] h-[500px] rounded-full bg-[#00e5ff]/3 blur-[200px]" />
        <div className="container mx-auto px-6 relative">
          <ScrollSection parallaxOffset={30}>
            <div className="text-center mb-20">
              <FadeInView>
                <p className="text-xs text-[#00e5ff] font-display font-medium tracking-[0.3em] uppercase mb-3">
                  Workflow
                </p>
              </FadeInView>
              <h2 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl text-foreground">
                <TextReveal>Four Steps to Better Hiring</TextReveal>
              </h2>
            </div>
          </ScrollSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <FadeInView key={step.num} delay={i * 0.15} direction="up">
                <div className="relative group">
                  <div className="glass rounded-2xl p-8 h-full transition-all duration-500 group-hover:border-[#00e5ff]/30">
                    <span className="font-display font-bold text-7xl text-[#00e5ff]/10 group-hover:text-[#00e5ff]/20 transition-colors duration-500 leading-none">
                      {step.num}
                    </span>
                    <h3 className="font-display font-semibold text-foreground text-xl mt-4 mb-3">
                      {step.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                  </div>

                  {i < 3 && (
                    <div className="hidden lg:block absolute top-1/2 -right-4 w-8 text-[#00e5ff]/20">
                      <ArrowRight className="w-6 h-6" />
                    </div>
                  )}
                </div>
              </FadeInView>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SECTION 06 — CTA ═══ */}
      <section className="py-32 sm:py-44 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-15" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-[#00e5ff]/5 blur-[200px]" />
        <div className="container mx-auto px-6 relative text-center">
          <ScrollSection parallaxOffset={50} scaleIn>
            <FadeInView>
              <p className="text-xs text-[#00e5ff] font-display font-medium tracking-[0.3em] uppercase mb-6">
                Get Started
              </p>
            </FadeInView>
            <h2 className="font-display font-bold text-3xl sm:text-5xl md:text-7xl text-foreground mb-8 max-w-4xl mx-auto leading-[1.1]">
              <TextReveal>Ready to Transform</TextReveal>
              <br />
              <TextReveal delay={0.3}>Your Hiring?</TextReveal>
            </h2>
            <FadeInView delay={0.6}>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-12">
                Join the future of recruitment. AI-driven, data-backed, bias-reduced.
              </p>
            </FadeInView>
            <FadeInView delay={0.8}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                {user ? (
                   <Link to={dashboardLink}>
                     <Button size="lg" className="bg-[#00e5ff] text-black hover:text-black hover:bg-[#00e5ff]/90 shadow-[0_0_20px_rgba(0,229,255,0.4)] font-display font-semibold transition-all duration-300 px-10 h-13 text-base rounded-full group">
                       Go to Dashboard
                       <ArrowUpRight className="ml-2 w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                     </Button>
                   </Link>
                ) : (
                  <>
                    <Link to="/register">
                      <Button size="lg" className="bg-[#00e5ff] text-black hover:text-black hover:bg-[#00e5ff]/90 shadow-[0_0_20px_rgba(0,229,255,0.4)] font-display font-semibold transition-all duration-300 px-10 h-13 text-base rounded-full group">
                        Get Started Free
                        <ArrowUpRight className="ml-2 w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </Button>
                    </Link>
                    <Link to="/register?role=hr">
                      <Button size="lg" variant="outline" className="border-border/60 text-white hover:text-white hover:bg-white/10 font-display px-10 h-13 text-base rounded-full transition-all duration-300">
                        I'm a Recruiter
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </FadeInView>
          </ScrollSection>
        </div>
      </section>

      <Footer />
    </div>
  );
}
