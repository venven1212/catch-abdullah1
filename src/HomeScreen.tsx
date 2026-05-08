import { LEVELS, ENDLESS_LEVELS, PEACEFUL_CONFIG, LevelKey, EndlessKey, TimedKey, PeacefulKey, SaveData, isMountainHubUnlocked } from "@/lib/game";
import { Lock, Trophy, ShoppingBag, Timer, Globe, Infinity, Moon, Mountain, FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface HomeScreenProps {
  extremeUnlocked: boolean;
  gildedUnlocked?: boolean;
  gildedActive?: boolean;
  beatenLevels?: Partial<Record<LevelKey | TimedKey, boolean>>;
  save: SaveData;
  onToggleGilded?: () => void;
  onSelect: (key: LevelKey | EndlessKey | PeacefulKey) => void;
  onOpenShop: () => void;
  onOpenStats: () => void;
  onOpenTimed: () => void;
  onOpenLeaderboard: () => void;
  onOpenMountain: () => void;
  onOpenLab: () => void;
}

export const HomeScreen = ({ 
  extremeUnlocked, 
  gildedUnlocked, 
  gildedActive, 
  beatenLevels = {},
  save,
  onToggleGilded, 
  onSelect, 
  onOpenShop, 
  onOpenStats, 
  onOpenTimed,
  onOpenLeaderboard,
  onOpenMountain,
  onOpenLab,
}: HomeScreenProps) => {
  const levels: LevelKey[] = ["easy", "medium", "hard", "extreme"];

  // Map level keys to their endless counterparts
  const getEndlessKey = (levelKey: LevelKey): EndlessKey => {
    const map: Record<LevelKey, EndlessKey> = {
      easy: "endlessEasy",
      medium: "endlessMedium",
      hard: "endlessHard",
      extreme: "endlessExtreme",
    };
    return map[levelKey];
  };

  return (
    <div className="w-full max-w-4xl mx-auto relative">
      {/* Floating Lab Button - Top Right */}
      <button
        onClick={onOpenLab}
        className="fixed top-4 right-4 z-50 game-card p-3 rounded-full hover:scale-110 transition-transform border-2 border-accent/40 bg-background/90 backdrop-blur-sm"
        title="Custom Lab"
      >
        <FlaskConical className="w-5 h-5 text-accent" />
      </button>

      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <div className="inline-block hero-gradient text-primary-foreground px-6 py-2 rounded-full text-sm font-bold mb-4 shadow-[var(--shadow-glow)]">
          🎯 Reflex Arcade
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold mb-3 neon-text">
          Catch <span className="bg-clip-text text-transparent hero-gradient">Abdullah</span>
        </h1>
        <p className="text-muted-foreground text-lg">Click. Combo. Conquer.</p>
      </motion.header>

      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        {levels.map((key, i) => {
          const lvl = LEVELS[key];
          const locked = key === "extreme" && !extremeUnlocked;
          const endlessUnlocked = beatenLevels[key] === true;
          const endlessKey = getEndlessKey(key);
          
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className={cn(
                "game-card rounded-3xl p-6 transition-all",
                key === "extreme" && !locked && "extreme-gradient text-primary-foreground border-0"
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="text-4xl">{lvl.emoji}</div>
                {locked && <Lock className="w-6 h-6 text-muted-foreground" />}
              </div>
              <h3 className="text-2xl font-bold mb-1">{lvl.name}</h3>
              <p className={cn("text-sm mb-3", key === "extreme" && !locked ? "text-primary-foreground/90" : "text-muted-foreground")}>
                {locked ? "Beat Hard mode to unlock" : lvl.description}
              </p>
              <div className="flex gap-2 text-xs font-semibold flex-wrap mb-4">
                <span className={cn("px-2 py-1 rounded-full", key === "extreme" && !locked ? "bg-white/20" : "bg-muted")}>
                  {lvl.clicksToWin} clicks
                </span>
                <span className={cn("px-2 py-1 rounded-full flex items-center gap-1", key === "extreme" && !locked ? "bg-white/20" : "bg-coin/30 text-coin")}>
                  🪙 {lvl.reward}
                </span>
                {lvl.decoys && (
                  <span className={cn("px-2 py-1 rounded-full", key === "extreme" && !locked ? "bg-white/20" : "bg-destructive/30 text-destructive")}>
                    decoys
                  </span>
                )}
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => !locked && onSelect(key)}
                  disabled={locked}
                  className={cn(
                    "flex-1 py-2 rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5",
                    key === "extreme" && !locked 
                      ? "bg-white/20 hover:bg-white/30" 
                      : "bg-primary text-primary-foreground hover:bg-primary/90",
                    "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                  )}
                >
                  Play
                </button>
                {endlessUnlocked && (
                  <button
                    onClick={() => onSelect(endlessKey)}
                    className={cn(
                      "px-3 py-2 rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5 flex items-center gap-1",
                      key === "extreme" 
                        ? "bg-white/20 hover:bg-white/30" 
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/90"
                    )}
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

      <div className="grid grid-cols-3 gap-3 mb-3">
        <button
          onClick={onOpenTimed}
          className="game-card rounded-2xl py-4 font-bold text-base flex items-center justify-center gap-2 hover:-translate-y-0.5 transition-transform border-2 border-secondary/40"
        >
          <Timer className="w-5 h-5" /> Timed
        </button>
        <button
          onClick={onOpenMountain}
          disabled={!isMountainHubUnlocked(save)}
          className={cn(
            "game-card rounded-2xl py-4 font-bold text-base flex items-center justify-center gap-2 transition-transform",
            isMountainHubUnlocked(save)
              ? "border-2 border-accent/40 hover:-translate-y-0.5 bg-gradient-to-br from-accent/10 to-accent/5"
              : "opacity-50 cursor-not-allowed"
          )}
        >
          {isMountainHubUnlocked(save) ? (
            <Mountain className="w-5 h-5" />
          ) : (
            <Lock className="w-5 h-5" />
          )}
          Mountain
        </button>
        <button
          onClick={() => onSelect("peaceful")}
          className="game-card rounded-2xl py-4 font-bold text-base flex items-center justify-center gap-2 hover:-translate-y-0.5 transition-transform border-2 border-primary/40 neon-border"
        >
          <Moon className="w-5 h-5" /> Peaceful
        </button>
      </div>

      {/* Mountain unlock progress */}
      {!isMountainHubUnlocked(save) && (
        <div className="game-card rounded-2xl p-3 mb-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="w-4 h-4" />
            <span className="font-bold text-foreground">Unlock Mountain Hub</span>
          </div>
          <div className="flex gap-4 text-xs">
            <span className={cn(
              "flex items-center gap-1",
              (save.winCounts?.extreme ?? 0) >= 2 && "text-green-400"
            )}>
              Extreme wins: {save.winCounts?.extreme ?? 0}/2
            </span>
            <span className={cn(
              "flex items-center gap-1",
              (save.winCounts?.tHard ?? 0) >= 1 && "text-green-400"
            )}>
              Timed Hard wins: {save.winCounts?.tHard ?? 0}/1
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={onOpenShop}
          className="game-card rounded-2xl py-4 font-bold text-base flex items-center justify-center gap-2 hover:-translate-y-0.5 transition-transform"
        >
          <ShoppingBag className="w-5 h-5" /> Shop
        </button>
        <button
          onClick={onOpenLeaderboard}
          className="game-card rounded-2xl py-4 font-bold text-base flex items-center justify-center gap-2 hover:-translate-y-0.5 transition-transform hero-gradient text-primary-foreground"
        >
          <Globe className="w-5 h-5" /> Leaderboard
        </button>
        <button
          onClick={onOpenStats}
          className="game-card rounded-2xl py-4 font-bold text-base flex items-center justify-center gap-2 hover:-translate-y-0.5 transition-transform"
        >
          <Trophy className="w-5 h-5" /> Stats
        </button>
      </div>

      {gildedUnlocked && onToggleGilded && (
        <div className="mt-4 game-card rounded-2xl p-4 flex items-center justify-between gap-3 border-2 border-coin/40">
          <div>
            <div className="font-bold text-coin">👑 Gilded Mode</div>
            <div className="text-xs text-muted-foreground">Golden glow + 2× coins on every level.</div>
          </div>
          <button
            onClick={onToggleGilded}
            className={cn(
              "px-4 py-2 rounded-full font-extrabold text-sm transition-all",
              gildedActive ? "bg-coin text-coin-foreground shadow-[var(--shadow-glow)]" : "bg-muted text-muted-foreground"
            )}
          >
            {gildedActive ? "ON" : "OFF"}
          </button>
        </div>
      )}
    </div>
  );
};
