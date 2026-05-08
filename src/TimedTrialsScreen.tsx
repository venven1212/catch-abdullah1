import { TIMED_LEVELS, TIMED_ORDER, TimedKey, EndlessKey, SaveData, isTimedUnlocked } from "@/lib/game";
import { ArrowLeft, Lock, Infinity } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TimedTrialsScreenProps {
  save: SaveData;
  onSelect: (key: TimedKey | EndlessKey) => void;
  onBack: () => void;
  onToggleGilded: () => void;
}

// Map timed keys to their endless counterparts
const getEndlessKey = (timedKey: TimedKey): EndlessKey => {
  const map: Record<TimedKey, EndlessKey> = {
    tEasy: "endlessTEasy",
    tMedium: "endlessTMedium",
    tHard: "endlessTHard",
    tExtreme: "endlessTExtreme",
  };
  return map[timedKey];
};

export const TimedTrialsScreen = ({ save, onSelect, onBack, onToggleGilded }: TimedTrialsScreenProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-4xl mx-auto"
    >
      <div className="flex items-center justify-between mb-6 gap-3">
        <button onClick={onBack} className="game-card rounded-full p-3 hover:-translate-x-1 transition-transform">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-3xl md:text-4xl font-bold neon-text text-center">⏱ Timed Trials</h2>
        <div className="w-11" />
      </div>

      <p className="text-center text-muted-foreground text-sm mb-6">
        No items. No second chances. Beat the clock to ascend.
      </p>

      {save.gildedUnlocked && (
        <div className="game-card rounded-2xl p-4 mb-6 flex items-center justify-between gap-4 border-2 border-coin/40">
          <div>
            <div className="font-bold text-coin flex items-center gap-2">👑 Gilded Mode</div>
            <div className="text-xs text-muted-foreground">Golden glow + 2× coins on every level.</div>
          </div>
          <button
            onClick={onToggleGilded}
            className={cn(
              "px-4 py-2 rounded-full font-extrabold text-sm transition-all",
              save.gildedActive ? "bg-coin text-coin-foreground shadow-[var(--shadow-glow)]" : "bg-muted text-muted-foreground"
            )}
          >
            {save.gildedActive ? "ON" : "OFF"}
          </button>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {TIMED_ORDER.map((key, i) => {
          const cfg = TIMED_LEVELS[key];
          const unlocked = isTimedUnlocked(key, save);
          const wins = save.winCounts[key] ?? 0;
          const reqWins = cfg.unlock ? (save.winCounts[cfg.unlock.stage] ?? 0) : 0;
          const reqLabel =
            cfg.unlock?.stage === "extreme" ? "Standard Extreme" :
            cfg.unlock?.stage === "tEasy"   ? "Timed Easy" :
            cfg.unlock?.stage === "tMedium" ? "Timed Medium" :
            cfg.unlock?.stage === "tHard"   ? "Timed Hard" : "";

          const endlessUnlocked = save.beatenLevels[key] === true;
          const endlessKey = getEndlessKey(key);

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className={cn(
                "game-card rounded-3xl p-6 transition-all",
                !unlocked && "grayscale opacity-60"
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="text-4xl">{cfg.emoji}</div>
                {!unlocked && <Lock className="w-6 h-6 text-muted-foreground" />}
              </div>
              <h3 className="text-2xl font-bold mb-1">{cfg.name}</h3>
              <p className="text-sm mb-3 text-muted-foreground">{cfg.description}</p>

              <div className="flex gap-2 text-xs font-semibold flex-wrap mb-3">
                <span className="px-2 py-1 rounded-full bg-muted">{cfg.clicksToWin} clicks</span>
                <span className="px-2 py-1 rounded-full bg-secondary/30 text-secondary">⏱ {cfg.timeLimitMs / 1000}s</span>
                <span className="px-2 py-1 rounded-full bg-coin/30 text-coin">🪙 {cfg.reward}</span>
                {cfg.decoys && <span className="px-2 py-1 rounded-full bg-destructive/30 text-destructive">decoys</span>}
                {cfg.timerResets && <span className="px-2 py-1 rounded-full bg-accent/30 text-accent">timer resets</span>}
              </div>

              {unlocked ? (
                <div className="text-xs font-bold text-success mb-3">
                  ✓ Unlocked · Wins: {wins}
                </div>
              ) : (
                cfg.unlock && (
                  <div className="text-xs font-bold text-muted-foreground bg-muted rounded-full px-3 py-1 inline-block mb-3">
                    🔒 Progress: {Math.min(reqWins, cfg.unlock.wins)}/{cfg.unlock.wins} wins on {reqLabel}
                  </div>
                )
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => unlocked && onSelect(key)}
                  disabled={!unlocked}
                  className={cn(
                    "flex-1 py-2 rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5",
                    "bg-primary text-primary-foreground hover:bg-primary/90",
                    "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                  )}
                >
                  Play
                </button>
                {endlessUnlocked && (
                  <button
                    onClick={() => onSelect(endlessKey)}
                    className="px-3 py-2 rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5 flex items-center gap-1 bg-secondary text-secondary-foreground hover:bg-secondary/90"
                    title="Endless Mode"
                  >
                    <Infinity className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};
