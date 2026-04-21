import { ArrowLeft, MapPin, Mail, FolderGit2, Blocks, Globe } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect } from "react";
import Footer from "@/components/Footer";

export default function AboutAuthor() {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  return (
    <div className="min-h-screen bg-background pt-24 font-body relative overflow-hidden">
      {/* Background gradients */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#00e5ff]/5 rounded-[100%] blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/5 rounded-[100%] blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-6 mb-24 relative z-10">
        <Link to="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-white transition-colors mb-8 group">
          <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
          Back to Home
        </Link>

        <div className="flex items-center gap-2 mb-6">
          <span className="text-xs font-semibold px-3 py-1 bg-white/5 border border-white/10 rounded-full text-zinc-300">
            About the Creator
          </span>
        </div>

        <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
          Passion for Engineering, <br className="hidden md:block" />Built for Impact.
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl mb-16">
          I'm a passionate full-stack developer with a strong foundation in competitive programming and development. I love building scalable applications and solving complex problems.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content (Left) */}
          <div className="lg:col-span-8 flex flex-col gap-6">

            <div className="glass-strong rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <UserCircle className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-lg text-white">About the Builder</h3>
                  <p className="text-sm text-muted-foreground">Product, design, and engineering by Shrey Joshi</p>
                </div>
              </div>
              <div className="space-y-4 text-zinc-300 leading-relaxed">
                <p>
                  Started with a simple vision: combine AI depth with a product experience that feels human, reliable, and genuinely useful for serious tech interviews.
                </p>
                <p>
                  I'm currently pursuing a Computer Science degree and constantly learning everything from Advanced System Design & Architecture to Performance Optimization Techniques and CI/CD Pipelines.
                </p>
                <p className="text-sm text-zinc-400 mt-6 pl-4 border-l-2 border-primary/30">
                  "I'm a Night 🦉 — over 50% of my commits happen in the evening."
                </p>
              </div>
            </div>

            <div className="glass-strong rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <FolderGit2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-lg text-white">Socials</h3>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <a href="https://github.com/Shreyyy07" target="_blank" rel="noreferrer" className="flex items-center gap-3 p-4 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 rounded-xl transition-all group">
                  <div className="text-zinc-400 group-hover:text-white transition-colors">GitHub</div>
                  <ArrowRight className="w-4 h-4 ml-auto text-zinc-600 group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100" />
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="flex items-center gap-3 p-4 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 rounded-xl transition-all group">
                  <div className="text-zinc-400 group-hover:text-white transition-colors">LinkedIn</div>
                  <ArrowRight className="w-4 h-4 ml-auto text-zinc-600 group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100" />
                </a>
                <a href="https://leetcode.com/u/shreyyy___07/" target="_blank" rel="noreferrer" className="flex items-center gap-3 p-4 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 rounded-xl transition-all group">
                  <div className="text-zinc-400 group-hover:text-white transition-colors">LeetCode</div>
                  <ArrowRight className="w-4 h-4 ml-auto text-zinc-600 group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100" />
                </a>
                <a href="https://linktr.ee/shreyyy07" target="_blank" rel="noreferrer" className="flex items-center gap-3 p-4 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 rounded-xl transition-all group">
                  <div className="text-zinc-400 group-hover:text-white transition-colors">Linktree</div>
                  <ArrowRight className="w-4 h-4 ml-auto text-zinc-600 group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100" />
                </a>
              </div>
            </div>

          </div>

          {/* Profile Sidebar (Right) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="glass-strong rounded-2xl p-8 flex flex-col items-center text-center">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white/5 mb-6 shadow-2xl relative group">
                <img
                  src="public\copy.png"
                  alt="Shrey Joshi"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  onError={(e) => { e.currentTarget.src = "https://i.pravatar.cc/300"; }}
                />
              </div>
              <h2 className="text-2xl font-display font-bold text-white mb-2">Shrey Joshi</h2>
              <div className="text-xs font-semibold px-3 py-1 bg-primary/10 border border-primary/20 text-primary rounded-full mb-6">
                Full-Stack Developer
              </div>

              <div className="w-full h-px bg-white/10 mb-6"></div>

              <a href="mailto:shreyjoshi1394@gmail.com" className="flex items-center gap-2 text-sm text-锌-400 hover:text-white transition-colors">
                <Mail className="w-4 h-4" />
                shreyjoshi1394@gmail.com
              </a>
            </div>

            <div className="glass rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Blocks className="w-4 h-4 text-primary" />
                <h3 className="font-display font-semibold text-sm text-white">Current Focus</h3>
              </div>
              <ul className="space-y-3 text-sm text-zinc-400">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  Scalable Web Applications
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  Advanced Architecture & Design
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  Competitive Programming
                </li>
              </ul>
            </div>
          </div>

        </div>
      </div>

      <Footer />
    </div>
  );
}

// Quick inline icons if missing above
const UserCircle = ({ className }: { className?: string }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="5" /><path d="M20 21a8 8 0 0 0-16 0" /></svg>;
const ArrowRight = ({ className }: { className?: string }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>;
