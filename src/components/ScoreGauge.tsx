import { motion } from "framer-motion";

interface ScoreGaugeProps {
  score: number;
  label: string;
  size?: "sm" | "md" | "lg";
}

export default function ScoreGauge({ score, label, size = "md" }: ScoreGaugeProps) {
  const sizes = { sm: 80, md: 120, lg: 160 };
  const s = sizes[size];
  const strokeWidth = size === "sm" ? 6 : 8;
  const radius = (s - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color = score >= 70 ? "hsl(160, 84%, 45%)" : score >= 40 ? "hsl(38, 92%, 55%)" : "hsl(0, 72%, 55%)";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: s, height: s }}>
        <svg width={s} height={s} className="-rotate-90">
          <circle
            cx={s / 2} cy={s / 2} r={radius}
            fill="none" stroke="hsl(240, 8%, 16%)" strokeWidth={strokeWidth}
          />
          <motion.circle
            cx={s / 2} cy={s / 2} r={radius}
            fill="none" stroke={color} strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            style={{ filter: `drop-shadow(0 0 6px ${color})` }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display font-bold text-foreground" style={{ fontSize: s * 0.25 }}>
            {score}%
          </span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
    </div>
  );
}
