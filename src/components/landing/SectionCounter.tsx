import { motion, useScroll, useTransform } from "framer-motion";

interface SectionCounterProps {
  total: number;
}

export default function SectionCounter({ total }: SectionCounterProps) {
  const { scrollYProgress } = useScroll();
  const currentSection = useTransform(scrollYProgress, [0, 1], [1, total]);

  return (
    <motion.div className="fixed left-6 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col items-center gap-3">
      <motion.span className="text-xs font-display text-[#00e5ff] font-bold tracking-widest writing-vertical">
        <motion.span>
          {Array.from({ length: total }, (_, i) => (
            <motion.span
              key={i}
              className="block text-center"
              style={{
                opacity: useTransform(
                  currentSection,
                  [i + 0.5, i + 1, i + 1.5],
                  [0.2, 1, 0.2]
                ),
              }}
            >
              {String(i + 1).padStart(2, "0")}
            </motion.span>
          ))}
        </motion.span>
      </motion.span>
      <div className="w-px h-16 bg-border/40 relative overflow-hidden">
        <motion.div
          className="absolute inset-x-0 top-0 bg-[#00e5ff]"
          style={{ height: useTransform(scrollYProgress, [0, 1], ["0%", "100%"]) }}
        />
      </div>
      <span className="text-[10px] text-muted-foreground font-display tracking-widest">
        /{String(total).padStart(2, "0")}
      </span>
    </motion.div>
  );
}
