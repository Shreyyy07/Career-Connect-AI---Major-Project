import { motion } from "framer-motion";
import { ReactNode } from "react";

interface GlowingBorderProps {
  children: ReactNode;
  className?: string;
  glowColor?: string;
}

export default function GlowingBorder({ children, className = "", glowColor = "primary" }: GlowingBorderProps) {
  return (
    <motion.div
      className={`relative group ${className}`}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      {/* Animated gradient border */}
      <div className="absolute -inset-[1px] rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 overflow-hidden">
        <motion.div
          className="absolute inset-0"
          style={{
            background: `conic-gradient(from 0deg, hsl(var(--${glowColor})), transparent, hsl(var(--${glowColor})), transparent, hsl(var(--${glowColor})))`,
            opacity: 0.4,
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />
      </div>
      <div className="relative">{children}</div>
    </motion.div>
  );
}
