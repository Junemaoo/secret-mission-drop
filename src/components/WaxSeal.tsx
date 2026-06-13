interface WaxSealProps {
  label?: string;
  size?: number;
  className?: string;
}

export function WaxSeal({ label = "MB", size = 72, className = "" }: WaxSealProps) {
  return (
    <div
      className={`wax-shadow flex items-center justify-center rounded-full font-serif text-primary-foreground ${className}`}
      style={{
        width: size,
        height: size,
        background:
          "radial-gradient(circle at 30% 30%, oklch(0.65 0.2 25), var(--wax) 60%, oklch(0.35 0.16 22) 100%)",
        transform: "rotate(-8deg)",
      }}
    >
      <span style={{ fontSize: size * 0.32 }} className="italic tracking-wider">
        {label}
      </span>
    </div>
  );
}
