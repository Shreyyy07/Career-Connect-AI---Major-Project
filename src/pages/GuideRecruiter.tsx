import { ArrowLeft, Briefcase, FileSearch, ShieldAlert, BarChart3, Users, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect } from "react";
import Footer from "@/components/Footer";

export default function GuideRecruiter() {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  const steps = [
    {
      icon: <FileSearch className="w-5 h-5 text-primary" />,
      title: "1. Define Open Positions",
      description: "Upload roles to align the AI Engine.",
      points: [
        "Create structured Job Descriptions (JDs) defining skills and experience.",
        "The system digests the parsed JD to build dynamic behavioral and technical question bases.",
        "These definitions govern both candidate resume-matching and the live interview environment."
      ]
    },
    {
      icon: <Users className="w-5 h-5 text-primary" />,
      title: "2. Pipeline & Sourcing",
      description: "Match Candidates dynamically.",
      points: [
        "View a unified dashboard of all applicants sorted natively by AI Match scores.",
        "Sort applicants automatically by highest parsed compatibility against your uploaded JDs.",
        "Shortlist or invite candidates to automated Stage 1 AI video interviews with a single click."
      ]
    },
    {
      icon: <ShieldAlert className="w-5 h-5 text-primary" />,
      title: "3. Live Anti-Cheating Suite",
      description: "Ensure session integrity automatically.",
      points: [
        "The AI monitors visual and audio feeds during candidate interviews for suspicious behavior.",
        "Automatically flags tab switching, multiple faces in the frame, or significant audio irregularities.",
        "Review these flags objectively before finalizing the candidate's screening report."
      ]
    },
    {
      icon: <BarChart3 className="w-5 h-5 text-primary" />,
      title: "4. Review Interview Scorecards",
      description: "Make confident data-driven hiring decisions.",
      points: [
        "Read comprehensive reports detailing the candidate's exact performance against the required JD.",
        "Analyze granular metrics including confidence levels, speaking pace, and technical/cultural fit scores.",
        "Leverage the AI’s transparent recommendation engine to push candidates to human-led final rounds."
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background pt-24 font-body relative overflow-hidden">
      <div className="fixed top-[20%] right-[-10%] w-[50%] h-[50%] bg-[#00e5ff]/5 rounded-[100%] blur-[120px] pointer-events-none" />
      
      <div className="container mx-auto px-6 mb-24 relative z-10">
        <Link to="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-white transition-colors mb-8 group">
          <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
          Back to Home
        </Link>
        
        <div className="flex items-center justify-between mb-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-semibold px-3 py-1 bg-white/5 border border-white/10 rounded-full text-zinc-300">
                Recruiter Operations
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
              Recruiter Guide
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl">
              Scale your hiring lifecycle using semantic mapping and fully autonomous Live AI Interviews.
            </p>
          </div>
          
          <div className="hidden md:flex w-16 h-16 rounded-2xl bg-white/5 border border-white/10 items-center justify-center glow-primary">
            <Briefcase className="w-8 h-8 text-primary" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 flex flex-col gap-6">
            {steps.map((step, idx) => (
              <div key={idx} className="glass-strong rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                    {step.icon}
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-lg text-white">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </div>
                
                <ul className="space-y-3 pl-4">
                  {step.points.map((point, pIdx) => (
                    <li key={pIdx} className="flex items-start text-zinc-300 leading-relaxed text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 mr-3 shrink-0" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="glass rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Briefcase className="w-24 h-24" />
              </div>
              <h3 className="font-display font-semibold text-base text-white mb-2">Platform Integrity</h3>
              <p className="text-xs text-muted-foreground mb-6">Built for scale and security.</p>
              
              <ul className="space-y-4 text-sm text-zinc-300">
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  Only authenticated HR accounts can deploy JD mappings and manage pipelines.
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  Anti-cheating metrics are entirely objective, capturing timestamps for any flagged behavioral anomalies.
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  The AI reduces human bias by grading purely on content, technical depth, and measured communication cadence.
                </li>
              </ul>
            </div>
            
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <Mail className="w-4 h-4 text-primary" />
                <h3 className="font-display font-semibold text-base text-white">HR Support</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-4">Need help onboarding your team?</p>
              <a href="mailto:enterprise@careerconnect.ai" className="block w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-center transition-colors text-white">
                Contact Enterprise Support
              </a>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
