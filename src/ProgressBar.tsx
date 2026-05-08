interface ProgressBarProps {
  value: number; // 0..1
  label?: string;
}

export const ProgressBar = ({ value, label }: ProgressBarProps) => (
  <div className="flex-1">
    {label && <div className="text-xs font-bold mb-1 text-muted-foreground">{label}</div>}
    <div className="h-3 bg-muted rounded-full overflow-hidden relative">
      <div
        className="h-full hero-gradient rounded-full transition-[width] duration-300 ease-out relative"
        style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
      </div>
    </div>
  </div>
);
