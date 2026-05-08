import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Trophy, RefreshCw, Crown, Timer, Zap, Mountain } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getLeaderboardScores,
  LeaderboardEntry,
  LeaderboardHub,
  LeaderboardDifficulty,
} from "@/lib/supabase";

interface LeaderboardScreenProps {
  onBack: () => void;
}

const HUBS: { key: LeaderboardHub; label: string; icon: React.ReactNode; description: string }[] = [
  { key: "STANDARD",    label: "Standard",    icon: <Timer    className="w-4 h-4" />, description: "Fastest time wins" },
  { key: "TIMED_TRIAL", label: "Timed Trial", icon: <Zap     className="w-4 h-4" />, description: "Highest clicks wins" },
  { key: "MOUNTAIN",    label: "Mountain",    icon: <Mountain className="w-4 h-4" />, description: "Highest altitude wins" },
];

const DIFFICULTIES: LeaderboardDifficulty[] = ["EASY", "MEDIUM", "HARD", "EXTREME"];

const DIFFICULTY_COLORS: Record<LeaderboardDifficulty, string> = {
  EASY:    "bg-green-500/20  text-green-400  border-green-500/30",
  MEDIUM:  "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  HARD:    "bg-orange-500/20 text-orange-400 border-orange-500/30",
  EXTREME: "bg-red-500/20    text-red-400    border-red-500/30",
};

const DIFFICULTY_LABELS: Record<LeaderboardDifficulty, string> = {
  EASY: "Easy", MEDIUM: "Medium", HARD: "Hard", EXTREME: "Extreme",
};

const MOUNTAIN_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

function getMountainDifficulty(level: number): LeaderboardDifficulty {
  if (level <= 3)  return "EASY";
  if (level <= 5)  return "MEDIUM";
  if (level <= 8)  return "HARD";
  return "EXTREME";
}

const LEVEL_COLORS: Record<number, string> = {
  1: "text-green-400",  2: "text-green-400",  3: "text-green-400",
  4: "text-yellow-400", 5: "text-yellow-400",
  6: "text-orange-400", 7: "text-orange-400", 8: "text-orange-400",
  9: "text-red-400",    10: "text-red-400",
};

export const LeaderboardScreen = ({ onBack }: LeaderboardScreenProps) => {
  const [selectedHub,        setSelectedHub]        = useState<LeaderboardHub>("STANDARD");
  const [selectedDifficulty, setSelectedDifficulty] = useState<LeaderboardDifficulty>("EASY");
  const [selectedLevel,      setSelectedLevel]      = useState<number>(1);
  const [entries,            setEntries]            = useState<LeaderboardEntry[]>([]);
  const [loading,            setLoading]            = useState(true);
  const [error,              setError]              = useState<string | null>(null);

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);
    try {
      let data: LeaderboardEntry[];
      if (selectedHub === "MOUNTAIN") {
        const diff = getMountainDifficulty(selectedLevel);
        data = await getLeaderboardScores("MOUNTAIN", diff, selectedLevel, 10);
      } else {
        data = await getLeaderboardScores(selectedHub, selectedDifficulty, undefined, 10);
      }
      setEntries(data);
    } catch {
      setError("Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [selectedHub, selectedDifficulty, selectedLevel]);

  const formatScore = (entry: LeaderboardEntry) => {
    if (selectedHub === "STANDARD") {
      return `${(entry.time_taken ?? 0).toFixed(2)}s`;
    }
    return `${entry.score ?? 0}${selectedHub === "MOUNTAIN" ? "m" : " clicks"}`;
  };

  const getScoreLabel = () => {
    if (selectedHub === "STANDARD") return "Time";
    if (selectedHub === "MOUNTAIN") return "Altitude";
    return "Score";
  };

  const currentSelectionLabel =
    selectedHub === "MOUNTAIN"
      ? `Mountain · Level ${selectedLevel}`
      : `${HUBS.find(h => h.key === selectedHub)?.label} · ${DIFFICULTY_LABELS[selectedDifficulty]}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-3xl mx-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-3">
        <button
          onClick={onBack}
          className="game-card rounded-full p-3 hover:-translate-x-1 transition-transform neon-border"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-3xl md:text-4xl font-bold neon-text text-center flex items-center gap-2">
          <Trophy className="w-8 h-8" /> Leaderboard
        </h2>
        <button
          onClick={fetchLeaderboard}
          disabled={loading}
          className="game-card rounded-full p-3 hover:rotate-180 transition-transform disabled:opacity-50 neon-border"
        >
          <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
        </button>
      </div>

      {/* Hub Selector */}
      <div className="game-card rounded-2xl p-4 mb-4 neon-border">
        <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
          Select Hub
        </div>
        <div className="grid grid-cols-3 gap-2">
          {HUBS.map((hub) => (
            <button
              key={hub.key}
              onClick={() => setSelectedHub(hub.key)}
              className={cn(
                "flex flex-col items-center gap-1 p-3 rounded-xl font-bold text-sm transition-all",
                selectedHub === hub.key
                  ? "hero-gradient text-primary-foreground shadow-[var(--shadow-glow)]"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {hub.icon}
              <span>{hub.label}</span>
            </button>
          ))}
        </div>
        <div className="text-center text-xs text-muted-foreground mt-3">
          {HUBS.find(h => h.key === selectedHub)?.description}
        </div>
      </div>

      {/* Filter row: level picker (Mountain) or difficulty tabs (others) */}
      <div className="game-card rounded-2xl p-4 mb-4 neon-border">
        {selectedHub === "MOUNTAIN" ? (
          <>
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
              Summit Level
            </div>
            <div className="grid grid-cols-5 gap-2">
              {MOUNTAIN_LEVELS.map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setSelectedLevel(lvl)}
                  className={cn(
                    "py-2 rounded-xl font-extrabold text-sm transition-all border",
                    selectedLevel === lvl
                      ? "hero-gradient text-primary-foreground shadow-[var(--shadow-glow)] border-primary"
                      : "bg-muted/30 border-transparent hover:bg-muted/50",
                    selectedLevel !== lvl && LEVEL_COLORS[lvl]
                  )}
                >
                  {lvl}
                </button>
              ))}
            </div>
            <div className="text-center text-xs text-muted-foreground mt-2">
              Difficulty: {DIFFICULTY_LABELS[getMountainDifficulty(selectedLevel)]}
              {" "}(Levels 1–3 Easy · 4–5 Medium · 6–8 Hard · 9–10 Extreme)
            </div>
          </>
        ) : (
          <>
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
              Difficulty
            </div>
            <div className="flex gap-2 flex-wrap">
              {DIFFICULTIES.map((diff) => (
                <button
                  key={diff}
                  onClick={() => setSelectedDifficulty(diff)}
                  className={cn(
                    "flex-1 min-w-[70px] py-2 px-3 rounded-xl font-bold text-sm transition-all border",
                    selectedDifficulty === diff
                      ? DIFFICULTY_COLORS[diff]
                      : "bg-muted/30 text-muted-foreground border-transparent hover:bg-muted/50"
                  )}
                >
                  {DIFFICULTY_LABELS[diff]}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Current Selection Badge */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <span className={cn(
          "px-3 py-1 rounded-full text-xs font-bold border",
          selectedHub === "MOUNTAIN"
            ? DIFFICULTY_COLORS[getMountainDifficulty(selectedLevel)]
            : DIFFICULTY_COLORS[selectedDifficulty]
        )}>
          {currentSelectionLabel}
        </span>
      </div>

      {/* Leaderboard Table */}
      <div className="game-card rounded-3xl p-4 md:p-6 neon-border">
        <div className="grid grid-cols-[auto_1fr_auto] gap-4 px-4 py-3 border-b border-primary/30 mb-2">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">#</span>
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Player</span>
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">
            {getScoreLabel()}
          </span>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Trophy className="w-12 h-12 mx-auto text-primary animate-bounce mb-4" />
            <p className="text-muted-foreground font-semibold">Loading leaderboard...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4 text-destructive">!</div>
            <p className="text-destructive font-semibold">{error}</p>
            <button
              onClick={fetchLeaderboard}
              className="mt-4 px-6 py-2 rounded-full bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all"
            >
              Try Again
            </button>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground font-semibold">No scores yet for this bracket.</p>
            <p className="text-muted-foreground text-sm mt-1">Be the first to set a record!</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${selectedHub}-${selectedDifficulty}-${selectedLevel}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-1"
            >
              {entries.map((entry, index) => (
                <motion.div
                  key={entry.id ?? index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "grid grid-cols-[auto_1fr_auto] gap-4 items-center px-4 py-3 rounded-xl transition-all",
                    index === 0
                      ? "bg-gradient-to-r from-yellow-500/20 via-yellow-400/10 to-transparent border border-yellow-500/40 shadow-[0_0_20px_rgba(234,179,8,0.3)]"
                      : index === 1
                      ? "bg-primary/10 border border-primary/20"
                      : index === 2
                      ? "bg-primary/5 border border-primary/10"
                      : "bg-muted/30 hover:bg-muted/50 border border-transparent"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-sm",
                    index === 0
                      ? "bg-gradient-to-br from-yellow-400 to-yellow-600 text-yellow-900 shadow-[0_0_12px_rgba(234,179,8,0.6)]"
                      : index === 1 ? "bg-primary/60 text-primary-foreground"
                      : index === 2 ? "bg-primary/40 text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}>
                    {index === 0 ? <Crown className="w-4 h-4" /> : index + 1}
                  </div>

                  <div className={cn(
                    "font-bold truncate flex items-center gap-2",
                    index === 0 ? "text-yellow-400" : "text-foreground"
                  )}>
                    {index === 0 && <Crown className="w-4 h-4 text-yellow-400 flex-shrink-0" />}
                    {entry.user_name}
                  </div>

                  <div className={cn(
                    "font-extrabold tabular-nums text-right",
                    index === 0 ? "text-yellow-400" : index < 3 ? "text-primary" : "text-foreground"
                  )}>
                    {formatScore(entry)}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      <p className="text-center text-muted-foreground text-sm mt-4">
        Top 10 · {currentSelectionLabel}
      </p>
    </motion.div>
  );
};
