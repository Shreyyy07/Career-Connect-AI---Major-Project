import { Brain } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";

export default function Footer() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("/#")) {
      e.preventDefault();
      const targetId = href.substring(2);
      if (location.pathname !== "/") {
        navigate("/");
        setTimeout(() => {
          document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      } else {
        document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <footer className="border-t border-border/50 bg-card/30">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
                <Brain className="w-4 h-4 text-primary" />
              </div>
              <span className="font-display font-bold text-foreground">
                Career<span className="text-primary">Connect</span> AI
              </span>
            </div>
            <p className="text-sm text-muted-foreground max-w-sm">
              AI-powered recruitment automation platform. Semantic matching, live AI interviews, and multimodal candidate evaluation.
            </p>
          </div>
          <div className="md:col-span-2 md:pl-10">
            <h4 className="font-display font-semibold text-foreground mb-4">Platform</h4>
            <div className="flex flex-col gap-3">
              <Link to="/#capabilities" onClick={(e) => handleNavClick(e, "/#capabilities")} className="text-sm text-muted-foreground w-fit hover:text-primary transition-colors">Features</Link>
              <Link to="/guide-candidate" className="text-sm text-muted-foreground w-fit hover:text-primary transition-colors">For Candidates</Link>
              <Link to="/guide-recruiter" className="text-sm text-muted-foreground w-fit hover:text-primary transition-colors">For Recruiters</Link>
              <Link to="/about" className="text-sm text-muted-foreground w-fit hover:text-primary transition-colors">About Author</Link>
              <Link to="/faqs" className="text-sm text-muted-foreground w-fit hover:text-primary transition-colors">FAQs</Link>
            </div>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">© 2025 Career Connect AI. SRM Institute of Science and Technology.</p>
          <p className="text-xs text-muted-foreground">Built by Shrey Joshi & Shatakshi Singh</p>
        </div>
      </div>
    </footer>
  );
}
