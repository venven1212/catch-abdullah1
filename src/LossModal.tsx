import { motion } from "framer-motion";

interface LossModalProps {
  lostReward: number;
  title?: string;
  message?: string;
  onRetry: () => void;
  onHome: () => void;
}

export const LossModal = ({ lostReward, title, message, onRetry, onHome }: LossModalProps) => (
  <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
    <motion.div
      initial={{ scale: 0.7, opacity: 0, y: 30 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="game-card rounded-3xl p-8 max-w-md w-full text-center border border-destructive/50"
    >
      <div className="text-7xl mb-4">💔</div>
      <h2 className="text-4xl font-bold mb-2 text-destructive">{title ?? "Gamble Lost!"}</h2>
      <p className="text-muted-foreground mb-6">
        {message ?? (
          <>You lost <span className="font-bold text-coin">🪙 {lostReward}</span> coins. Should have walked away…</>
        )}
      </p>
      <div className="flex gap-3">
        <button onClick={onHome} className="flex-1 bg-muted text-foreground font-bold py-3 rounded-2xl hover:bg-muted/70 transition-colors">
          Main Menu
        </button>
        <button onClick={onRetry} className="flex-1 hero-gradient text-primary-foreground font-bold py-3 rounded-2xl shadow-[var(--shadow-glow)]">
          Try Again
        </button>
      </div>
    </motion.div>
  </div>
);

