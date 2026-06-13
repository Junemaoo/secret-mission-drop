import type { ReactNode } from "react";

interface EnvelopeCardProps {
  children: ReactNode;
  className?: string;
  tilt?: number;
}

export function EnvelopeCard({ children, className = "", tilt = 0 }: EnvelopeCardProps) {
  return (
    <div
      className={`envelope-shadow relative rounded-2xl border border-border bg-card p-6 ${className}`}
      style={{
        transform: tilt ? `rotate(${tilt}deg)` : undefined,
        backgroundImage:
          "linear-gradient(180deg, oklch(1 0 0 / 0.4), transparent 30%), repeating-linear-gradient(45deg, transparent 0 18px, oklch(0.5 0.16 22 / 0.04) 18px 19px)",
      }}
    >
      {/* Corner dashed accent */}
      <div className="dashed-border absolute left-4 right-4 top-3 h-px opacity-60" />
      <div className="dashed-border absolute left-4 right-4 bottom-3 h-px opacity-60" />
      {children}
    </div>
  );
}
