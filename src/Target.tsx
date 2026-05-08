import { cn } from "@/lib/utils";

type Variant = "normal" | "golden" | "decoy";

interface TargetProps {
  x: number;
  y: number;
  size: number;
  onHit: (e: React.MouseEvent) => void;
  frozen?: boolean;
  variant?: Variant;
  label?: string;
  gilded?: boolean;
}

export const Target = ({ x, y, size, onHit, frozen, variant = "normal", label = "Abdullah", gilded }: TargetProps) => (
  <button
    onClick={onHit}
    style={{
      left: x,
      top: y,
      width: size,
      height: size,
      transition: frozen ? "none" : "left 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), top 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
    }}
    className={cn(
      "absolute target-btn rounded-full font-bold text-white select-none z-10",
      "flex items-center justify-center text-center leading-tight",
      variant === "normal" && !gilded && "animate-target-pulse",
      variant === "golden" && "target-golden animate-golden-pulse",
      variant === "decoy" && "target-decoy",
      gilded && variant === "normal" && "target-gilded",
      frozen && "ring-4 ring-secondary"
    )}
    aria-label={`Catch ${label}`}
  >
    <span style={{ fontSize: size * 0.18 }}>{label}</span>
  </button>
);
