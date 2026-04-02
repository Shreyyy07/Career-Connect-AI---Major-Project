import { motion } from "framer-motion";
import { useState } from "react";
import {
  Upload, FileText, CheckCircle2, AlertCircle,
  Code, Briefcase, GraduationCap, Star, ArrowRight,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import DashboardSidebar from "@/components/DashboardSidebar";
import ScoreGauge from "@/components/ScoreGauge";

const extractedSkills = {
  matched: ["React", "TypeScript", "Node.js", "REST APIs", "Git", "Agile"],
  missing: ["System Design", "Docker", "Kubernetes", "GraphQL"],
  extra: ["Vue.js", "PHP", "WordPress"],
};

export default function ResumeUpload() {
  const [uploaded, setUploaded] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar role="candidate" />

      <main className="flex-1 overflow-auto p-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="font-display font-bold text-2xl text-foreground">Resume & Job Match</h1>
          <p className="text-sm text-muted-foreground mt-1">Upload your resume and see how well you match with job descriptions.</p>
        </motion.div>

        {!uploaded ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-12 max-w-2xl mx-auto text-center"
          >
            <div
              className="border-2 border-dashed border-border/60 rounded-xl p-12 hover:border-[#00e5ff]/40 transition-all cursor-pointer"
              onClick={() => setUploaded(true)}
            >
              <div className="w-16 h-16 rounded-2xl bg-[#00e5ff]/10 border border-[#00e5ff]/30 flex items-center justify-center mx-auto mb-6">
                <Upload className="w-8 h-8 text-[#00e5ff]" />
              </div>
              <h3 className="font-display font-semibold text-lg text-foreground mb-2">
                Drop your resume here
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Supports PDF and DOCX files up to 5MB
              </p>
              <Button className="bg-[#00e5ff]/10 text-[#00e5ff] border border-[#00e5ff]/20 hover:bg-[#00e5ff]/20 font-display">
                Browse Files
              </Button>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {/* Uploaded file */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-xl p-4 flex items-center justify-between max-w-2xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Shrey_Joshi_Resume.pdf</p>
                  <p className="text-xs text-muted-foreground">2.1 MB • Parsed successfully</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-success" />
                <button onClick={() => setUploaded(false)}>
                  <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                </button>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Match Score */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass rounded-xl p-6 text-center"
              >
                <h3 className="font-display font-semibold text-foreground mb-6">JD Match Score</h3>
                <ScoreGauge score={82} label="Overall Match" size="lg" />
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <ScoreGauge score={88} label="Cosine Similarity" size="sm" />
                  <ScoreGauge score={76} label="Hybrid RAG Score" size="sm" />
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  Matched against: <span className="text-foreground">Senior Frontend Developer</span>
                </p>
              </motion.div>

              {/* Extracted Profile */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass rounded-xl p-6"
              >
                <h3 className="font-display font-semibold text-foreground mb-4">Extracted Profile</h3>
                <div className="space-y-4">
                  {[
                    { icon: Briefcase, label: "Experience", value: "3+ years Full Stack Development" },
                    { icon: GraduationCap, label: "Education", value: "B.Tech CSE — SRM University" },
                    { icon: Code, label: "Primary Stack", value: "React, TypeScript, Node.js" },
                    { icon: Star, label: "Projects", value: "5 featured projects detected" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 border border-border/30">
                      <item.icon className="w-4 h-4 text-[#00e5ff] mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-[10px] uppercase text-muted-foreground">{item.label}</p>
                        <p className="text-sm text-foreground">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Skill Overlap */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass rounded-xl p-6"
              >
                <h3 className="font-display font-semibold text-foreground mb-4">Skill Analysis</h3>

                <div className="mb-4">
                  <p className="text-xs text-success font-medium mb-2 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Matched Skills
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {extractedSkills.matched.map(s => (
                      <span key={s} className="px-2.5 py-1 rounded-full bg-success/10 text-success text-xs border border-success/20">{s}</span>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-xs text-destructive font-medium mb-2 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Missing Skills
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {extractedSkills.missing.map(s => (
                      <span key={s} className="px-2.5 py-1 rounded-full bg-destructive/10 text-destructive text-xs border border-destructive/20">{s}</span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-2">Extra Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {extractedSkills.extra.map(s => (
                      <span key={s} className="px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs border border-border/30">{s}</span>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex gap-3"
            >
              <Button className="bg-[#00e5ff] text-black hover:bg-[#00e5ff]/90 glow-primary font-display font-semibold">
                Start AI Interview <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              <Button variant="outline" className="border-border/60 text-foreground hover:bg-secondary font-display">
                View Skill Recommendations
              </Button>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}
