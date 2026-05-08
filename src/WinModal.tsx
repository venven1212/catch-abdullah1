import { motion } from "framer-motion";

interface WinModalProps {
  reward: number;
  bonusMultiplier?: number;
  unlockedExtreme: boolean;
  newBestTime?: boolean;
  elapsedMs?: number;
  canGamble: boolean;
  legendary?: boolean;
  onGamble: () => void;
  onPlayAgain: () => void;
  onHome: () => void;
}

export const WinModal = ({
  reward,
  bonusMultiplier = 1,
  unlockedExtreme,
  newBestTime,
  elapsedMs,
  canGamble,
  legendary,
  onGamble,
  onPlayAgain,
  onHome,
}: WinModalProps) => {
  const finalReward = Math.round(reward * bonusMultiplier);
  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.7, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="game-card rounded-3xl p-8 max-w-md w-full text-center neon-border"
      >
        <div className={`text-7xl mb-4 ${legendary ? "animate-legendary" : ""}`}>
          {legendary ? "👑" : "🏆"}
        </div>
        <h2 className="text-4xl font-bold mb-2 neon-text">
          {legendary ? "LEGENDARY!" : "You Win!"}
        </h2>
        <p className="text-muted-foreground mb-6">
          {legendary ? "You conquered Timed Extreme. Gilded Mode unlocked." : "Abdullah has been thoroughly caught."}
        </p>

        <div className="bg-coin/20 rounded-2xl p-5 mb-4 border border-coin/40">
          <div className="text-sm font-semibold text-coin mb-1">Coins Earned</div>
          <div className="text-5xl font-extrabold text-coin flex items-center justify-center gap-2">
            <span className="animate-coin-bounce">🪙</span>+{finalReward}
          </div>
          {bonusMultiplier > 1 && (
            <div className="text-xs text-accent mt-2 font-bold">×{bonusMultiplier} BONUS!</div>
          )}
        </div>

        {elapsedMs !== undefined && elapsedMs > 0 && (
          <div className="mb-4 text-sm">
            Time: <span className="font-bold tabular-nums">{(elapsedMs / 1000).toFixed(2)}s</span>
            {newBestTime && <span className="ml-2 text-accent font-bold">🌟 NEW BEST!</span>}
          </div>
        )}

        {unlockedExtreme && (
          <div className="extreme-gradient rounded-2xl p-5 mb-4 text-primary-foreground animate-unlock-burst">
            <div className="text-3xl mb-1">⚡ UNLOCKED ⚡</div>
            <div className="font-bold">Extreme Mode is now available!</div>
          </div>
        )}

        {legendary && (
          <div className="rounded-2xl p-5 mb-4 text-coin-foreground animate-unlock-burst" style={{ background: "var(--gradient-golden)" }}>
            <div className="text-3xl mb-1">👑 GILDED MODE 👑</div>
            <div className="font-bold">Toggle it from Timed Trials. 2× coins everywhere!</div>
          </div>
        )}

        {canGamble && (
          <button
            onClick={onGamble}
            className="w-full mb-3 extreme-gradient text-primary-foreground font-extrabold py-4 rounded-2xl shadow-[var(--shadow-glow)] hover:scale-[1.02] transition-transform"
          >
            🎲 DOUBLE OR NOTHING
            <div className="text-xs font-normal opacity-90">5s super-fast round — win to 2× the coins</div>
          </button>
        )}

        <div className="flex gap-3">
          <button onClick={onHome} className="flex-1 bg-muted text-foreground font-bold py-3 rounded-2xl hover:bg-muted/70 transition-colors">
            Main Menu
          </button>
          <button onClick={onPlayAgain} className="flex-1 hero-gradient text-primary-foreground font-bold py-3 rounded-2xl shadow-[var(--shadow-glow)]">
            Play Again
          </button>
        </div>
      </motion.div>
    </div>
  );
};

