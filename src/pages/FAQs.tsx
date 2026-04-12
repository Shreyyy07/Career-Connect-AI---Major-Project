import { ArrowLeft, Mic, MessageSquare, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function FAQs() {
  const faqCategories = [
    {
      icon: <Mic className="w-5 h-5 text-zinc-400" />,
      title: "How interview practice works",
      description: "What your first session looks like.",
      items: [
        {
          question: "What is Career Connect AI?",
          answer: "Career Connect AI is an AI interview coach that simulates live interviews and gives actionable feedback on clarity, structure, and delivery using conversational agents."
        },
        {
          question: "Do I need experience to start?",
          answer: "No prior experience is necessary. You can start practicing right away regardless of your skill level, and the AI will adapt to your background."
        },
        {
          question: "How long is a practice session?",
          answer: "A standard practice session usually takes 10 to 15 minutes, but you can configure longer behavioral and technical sessions depending on your needs."
        }
      ]
    },
    {
      icon: <MessageSquare className="w-5 h-5 text-zinc-400" />,
      title: "Feedback and scoring",
      description: "How your answers are evaluated.",
      items: [
        {
          question: "What kind of feedback do I get?",
          answer: "You get actionable feedback on communication, structure, confidence, pace, filler words, and response quality compared directly to job descriptions."
        },
        {
          question: "Can I track progress over time?",
          answer: "Yes. Your dashboard records all past sessions, logs your composite score history, and visualizes areas of improvement across multiple dimensions."
        },
        {
          question: "Can I practice technical and behavioral rounds?",
          answer: "Absolutely. The AI is specifically trained to parse any Job Description and conduct high-fidelity technical and behavioral interrogations."
        }
      ]
    },
    {
      icon: <Sparkles className="w-5 h-5 text-zinc-400" />,
      title: "Interview preparation scope",
      description: "How to use the platform effectively.",
      items: [
        {
          question: "How often should I practice?",
          answer: "A steady routine of 3 to 5 sessions per week works well for most candidates aiming for rapid improvement."
        },
        {
          question: "Can this replace real interviews?",
          answer: "While it cannot replace human final rounds, our AI screening is accurate enough that many recruiters use it to replace Stage 1 screening interviews entirely."
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background pt-24 font-body relative overflow-hidden">
      <div className="fixed top-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#00e5ff]/5 rounded-[100%] blur-[120px] pointer-events-none" />
      
      <div className="container mx-auto px-6 max-w-4xl mb-24 relative z-10">
        <Link to="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-white transition-colors mb-8 group">
          <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
          Back to Home
        </Link>
        
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-muted-foreground">
            Everything candidates ask before starting interview practice with Career Connect AI.
          </p>
        </div>

        <div className="flex flex-col gap-8">
          {faqCategories.map((category, idx) => (
            <div key={idx} className="glass-strong rounded-2xl p-6 sm:p-8">
              <div className="flex items-start sm:items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  {category.icon}
                </div>
                <div>
                  <h3 className="font-display font-semibold text-lg text-white">{category.title}</h3>
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                </div>
              </div>
              
              <Accordion type="single" collapsible className="w-full space-y-3">
                {category.items.map((item, itemIdx) => (
                  <AccordionItem 
                    key={itemIdx} 
                    value={`item-${idx}-${itemIdx}`}
                    className="border border-white/10 bg-black/40 rounded-xl px-5 py-1 data-[state=open]:bg-black/60 transition-colors"
                  >
                    <AccordionTrigger className="text-sm sm:text-base text-zinc-200 hover:text-white hover:no-underline py-4 text-left">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-zinc-400 text-sm leading-relaxed pb-4">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
