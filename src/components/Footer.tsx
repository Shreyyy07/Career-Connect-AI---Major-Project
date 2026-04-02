import { Brain } from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-transparent relative z-10">
      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-[#00e5ff]/10 border border-[#00e5ff]/30 flex items-center justify-center glow-primary">
                <img src="/logo.png" alt="Logo" className="w-5 h-5 object-contain rounded-sm" />
              </div>
              <span className="font-display font-bold text-foreground">
                Career<span className="text-[#00e5ff]">Connect</span> AI
              </span>
            </div>
            <p className="text-sm text-muted-foreground max-w-sm">
              AI-powered recruitment automation platform. Semantic matching, live AI interviews, and multimodal candidate evaluation.
            </p>
          </div>
          <div>
            <h4 className="font-display font-semibold text-foreground mb-3">Platform</h4>
            <div className="space-y-2">
              {["Features", "For Candidates", "For Recruiters", "Pricing"].map(item => (
                <p key={item} className="text-sm text-muted-foreground hover:text-[#00e5ff] cursor-pointer transition-colors">{item}</p>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-display font-semibold text-foreground mb-3">Company</h4>
            <div className="space-y-2">
              {["About", "Blog", "Careers", "Contact"].map(item => (
                <p key={item} className="text-sm text-muted-foreground hover:text-[#00e5ff] cursor-pointer transition-colors">{item}</p>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">© 2025 Career Connect AI. SRM Institute of Science and Technology.</p>
          <p className="text-xs text-muted-foreground">Built by Shrey Joshi & Shatakshi Singh</p>
        </div>
      </div>
    </footer>
  );
}
