import { motion, useInView } from "framer-motion";
import { useRef } from "react";

interface TextRevealProps {
  children: string;
  className?: string;
  delay?: number;
  splitBy?: "word" | "char";
}

export default function TextReveal({
  children,
  className = "",
  delay = 0,
  splitBy = "word",
}: TextRevealProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });

  const units =
    splitBy === "char"
      ? children.split("")
      : children.split(" ").map((w) => w + "\u00A0");

  return (
    <span ref={ref} className={`inline ${className}`}>
      {units.map((unit, i) => (
        <span key={i} className="inline-block overflow-hidden">
          <motion.span
            className="inline-block"
            initial={{ y: "110%", opacity: 0, rotateX: 40 }}
            animate={inView ? { y: "0%", opacity: 1, rotateX: 0 } : {}}
            transition={{
              duration: 0.7,
              ease: [0.25, 0.46, 0.45, 0.94],
              delay: delay + i * (splitBy === "char" ? 0.025 : 0.06),
            }}
          >
            {unit}
          </motion.span>
        </span>
      ))}
    </span>
  );
}
