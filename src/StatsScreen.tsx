import { LEVELS, ENDLESS_LEVELS, LevelKey, EndlessKey, AnyLevelKey, formatTime } from "@/lib/game";
import { ArrowLeft, Target } from "lucide-react";
import { motion } from "framer-motion";

interface StatsScreenProps {
  totalCaught: number;
  totalEarned: number;
  bestTimes: Partial<Record<AnyLevelKey, number>>;
  endlessHighScores?: Partial<Record<EndlessKey, number>>;
  onBack: () => void;
}

export const StatsScreen = ({ totalCaught, totalEarned, bestTimes, endlessHighScores = {}, onBack }: StatsScreenProps) => {
  const levels: LevelKey[] = ["easy", "medium", "hard", "extreme"];
  const endlessLevels = Object.values(ENDLESS_LEVELS).filter(l => !l.key.includes("T"));
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-3xl mx-auto"
    >
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="game-card rounded-full p-3">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-3xl md:text-4xl font-bold neon-text">🏛️ Hall of Fame</h2>
        <div className="w-11" />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="game-card rounded-2xl p-5 text-center">
          <div className="text-3xl mb-1">🎯</div>
          <div className="text-3xl font-extrabold tabular-nums">{totalCaught}</div>
          <div className="text-xs text-muted-foreground font-semibold mt-1">Total Abdullahs Caught</div>
        </div>
        <div className="game-card rounded-2xl p-5 text-center">
          <div className="text-3xl mb-1">🪙</div>
          <div className="text-3xl font-extrabold tabular-nums text-coin">{totalEarned}</div>
          <div className="text-xs text-muted-foreground font-semibold mt-1">Total Coins Earned</div>
        </div>
      </div>

      <h3 className="text-xl font-bold mb-3">⏱ Fastest Times</h3>
      <div className="grid gap-2 mb-6">
        {levels.map((k) => {
          const t = bestTimes[k];
          const lvl = LEVELS[k];
          return (
            <div key={k} className="game-card rounded-2xl p-4 flex items-center justify-between">
              <span className="font-bold flex items-center gap-2">
                <span className="text-2xl">{lvl.emoji}</span> {lvl.name}
              </span>
              <span className={`tabular-nums font-extrabold ${t ? "text-accent" : "text-muted-foreground"}`}>
                {t ? formatTime(t) : "—"}
              </span>
            </div>
          );
        })}
      </div>

      <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
        <Target className="w-5 h-5" /> Endless High Scores
      </h3>
      <div className="grid gap-2">
        {endlessLevels.map((cfg) => {
          const score = endlessHighScores[cfg.key];
          return (
            <div key={cfg.key} className="game-card rounded-2xl p-4 flex items-center justify-between">
              <span className="font-bold flex items-center gap-2">
                <span className="text-2xl">{cfg.emoji}</span> {cfg.name}
              </span>
              <span className={`tabular-nums font-extrabold ${score ? "text-accent" : "text-muted-foreground"}`}>
                {score ? `${score} clicks` : "—"}
              </span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};
