import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, ReactNode } from "react";

interface ScrollSectionProps {
  children: ReactNode;
  className?: string;
  parallaxOffset?: number;
  fadeIn?: boolean;
  scaleIn?: boolean;
}

export default function ScrollSection({
  children,
  className = "",
  parallaxOffset = 60,
  fadeIn = true,
  scaleIn = false,
}: ScrollSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [parallaxOffset, -parallaxOffset]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.92, 1, 1, 0.96]);

  return (
    <motion.div
      ref={ref}
      style={{
        y,
        opacity: fadeIn ? opacity : 1,
        scale: scaleIn ? scale : 1,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
