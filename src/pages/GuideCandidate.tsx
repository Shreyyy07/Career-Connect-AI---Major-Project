import { ArrowLeft, User, UploadCloud, Brain, FileOutput, Target, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";

export default function GuideCandidate() {
  const steps = [
    {
      icon: <UploadCloud className="w-5 h-5 text-primary" />,
      title: "1. Build Your Profile",
      description: "Getting start is effortless.",
      points: [
        "Upload your existing resume securely (PDF format supported).",
        "Or instantly parse your data by pasting your LinkedIn profile link.",
        "Your skills and experience are extracted safely into your private vault."
      ]
    },
    {
      icon: <Target className="w-5 h-5 text-primary" />,
      title: "2. Resume Semantic Matching",
      description: "See where you stand against live roles.",
      points: [
        "View active Job Descriptions (JDs) uploaded by recruiters.",
        "Let the AI Match Engine calculate your Resume-to-JD compatibility.",
        "Identify exact missing skills or gaps before even starting an interview."
      ]
    },
    {
      icon: <Brain className="w-5 h-5 text-primary" />,
      title: "3. Live AI Multimodal Interview",
      description: "Simulate a real technical or behavioral screening.",
      points: [
        "Take a timed, live video session with our AI voice-agent.",
        "The AI generates completely dynamic questions based specifically on the Job Description you're applying for.",
        "Advanced tracking limits tab switching and monitors voice and visual presence to guarantee session integrity."
      ]
    },
    {
      icon: <FileOutput className="w-5 h-5 text-primary" />,
      title: "4. Actionable Evaluation Scorecards",
      description: "Receive deep analytical feedback instantly.",
      points: [
        "Dashboard delivers standard composite scores for Technical, Communication, and Culture fits.",
        "Assess emotion analysis graphs, confidence scoring, and verbal filler word tracking.",
        "Share your successful scorecard digitally to prove proficiency to actual hiring managers."
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background pt-24 font-body relative overflow-hidden">
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-[100%] blur-[120px] pointer-events-none" />
      
      <div className="container mx-auto px-6 mb-24 relative z-10">
        <Link to="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-white transition-colors mb-8 group">
          <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
          Back to Home
        </Link>
        
        <div className="flex items-center justify-between mb-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-semibold px-3 py-1 bg-white/5 border border-white/10 rounded-full text-zinc-300">
                Candidate Operations
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
              Candidate Guide
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl">
              We provide tools to transform practice into verifiable proof of ability. Learn how to navigate the platform.
            </p>
          </div>
          
          <div className="hidden md:flex w-16 h-16 rounded-2xl bg-white/5 border border-white/10 items-center justify-center glow-primary">
            <User className="w-8 h-8 text-primary" />
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
                <Brain className="w-24 h-24" />
              </div>
              <h3 className="font-display font-semibold text-base text-white mb-2">At a Glance</h3>
              <p className="text-xs text-muted-foreground mb-6">Quick summary of the platform's core mechanics.</p>
              
              <ul className="space-y-4 text-sm text-zinc-300">
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  We do not sell candidate data at any time. Your training history stays yours.
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  Multimodal tracking uses your camera strictly locally to verify session integrity.
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  Scorecards are weighted by real industry hiring models and contextual JDs.
                </li>
              </ul>
            </div>
            
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <Mail className="w-4 h-4 text-primary" />
                <h3 className="font-display font-semibold text-base text-white">Questions</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-4">We are here to help.</p>
              <a href="mailto:support@careerconnect.ai" className="block w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-center transition-colors text-white">
                Contact Support
              </a>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
