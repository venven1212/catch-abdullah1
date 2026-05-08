import { motion } from "framer-motion";
import { ArrowLeft, Lock, Mountain, Timer, Heart, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  MOUNTAIN_LEVELS, MOUNTAIN_MODES, MOUNTAIN_LEVEL_ORDER,
  MountainLevelKey, MountainModeKey, SaveData,
  isMountainLevelUnlocked
} from "@/lib/game";
import { useState } from "react";

interface MountainScreenProps {
  save: SaveData;
  onSelectLevel: (level: MountainLevelKey, mode: MountainModeKey) => void;
  onBack: () => void;
}

export const MountainScreen = ({ save, onSelectLevel, onBack }: MountainScreenProps) => {
  const [selectedMode, setSelectedMode] = useState<MountainModeKey>("mountainTimed");
  const [selectedLevel, setSelectedLevel] = useState<MountainLevelKey | null>(null);

  const handleLevelClick = (level: MountainLevelKey) => {
    if (!isMountainLevelUnlocked(level, save)) return;
    setSelectedLevel(level);
  };

  const handleStartGame = () => {
    if (!selectedLevel) return;
    onSelectLevel(selectedLevel, selectedMode);
  };

  // Get best scores for display
  const getBestScore = (level: MountainLevelKey, mode: MountainModeKey): number | null => {
    const scores = save.mountainHighScores?.[level];
    if (!scores) return null;
    return mode === "mountainTimed" ? scores.timed : scores.endless;
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 mb-6"
      >
        <button
          onClick={onBack}
          className="game-card rounded-full p-3 hover:-translate-y-0.5 transition-transform"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-extrabold neon-text flex items-center gap-2">
            <Mountain className="w-8 h-8" />
            Mountain Hub
          </h1>
          <p className="text-muted-foreground text-sm">Climb the neon peaks. Dodge falling rocks.</p>
        </div>
      </motion.div>

      {/* Mode Selector */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="game-card rounded-2xl p-4 mb-6"
      >
        <h2 className="font-bold text-lg mb-3 text-muted-foreground">Select Mode</h2>
        <div className="grid grid-cols-2 gap-3">
          {(Object.keys(MOUNTAIN_MODES) as MountainModeKey[]).map((modeKey) => {
            const mode = MOUNTAIN_MODES[modeKey];
            const isSelected = selectedMode === modeKey;
            
            return (
              <button
                key={modeKey}
                onClick={() => setSelectedMode(modeKey)}
                className={cn(
                  "p-4 rounded-xl text-left transition-all hover:-translate-y-0.5",
                  isSelected 
                    ? "hero-gradient text-primary-foreground shadow-[var(--shadow-glow)]" 
                    : "bg-muted/50 hover:bg-muted"
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  {modeKey === "mountainTimed" ? (
                    <Timer className="w-5 h-5" />
                  ) : (
                    <Heart className="w-5 h-5" />
                  )}
                  <span className="font-bold">{mode.name}</span>
                </div>
                <p className={cn(
                  "text-xs",
                  isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                )}>
                  {mode.description}
                </p>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Level Selector Grid */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="game-card rounded-2xl p-4 mb-6"
      >
        <h2 className="font-bold text-lg mb-3 text-muted-foreground">Select Summit</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {MOUNTAIN_LEVEL_ORDER.map((levelKey, idx) => {
            const level = MOUNTAIN_LEVELS[levelKey];
            const isUnlocked = isMountainLevelUnlocked(levelKey, save);
            const isSelected = selectedLevel === levelKey;
            const bestScore = getBestScore(levelKey, selectedMode);
            
            // Difficulty color coding
            let difficultyColor = "text-green-400";
            if (level.level >= 4 && level.level <= 5) difficultyColor = "text-yellow-400";
            if (level.level >= 6 && level.level <= 8) difficultyColor = "text-orange-400";
            if (level.level >= 9) difficultyColor = "text-red-400";
            
            return (
              <motion.button
                key={levelKey}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.05 * idx }}
                onClick={() => handleLevelClick(levelKey)}
                disabled={!isUnlocked}
                className={cn(
                  "relative p-3 rounded-xl text-center transition-all",
                  isUnlocked && "hover:-translate-y-0.5",
                  isSelected 
                    ? "hero-gradient text-primary-foreground shadow-[var(--shadow-glow)] ring-2 ring-primary" 
                    : isUnlocked 
                      ? "bg-muted/50 hover:bg-muted" 
                      : "bg-muted/20 cursor-not-allowed opacity-50"
                )}
              >
                {!isUnlocked && (
                  <Lock className="absolute top-2 right-2 w-3 h-3 text-muted-foreground" />
                )}
                <div className={cn(
                  "text-2xl font-extrabold mb-1",
                  isSelected ? "text-primary-foreground" : difficultyColor
                )}>
                  {level.level}
                </div>
                <div className={cn(
                  "text-xs font-medium",
                  isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                )}>
                  {level.name}
                </div>
                {isUnlocked && bestScore !== null && (
                  <div className={cn(
                    "text-xs mt-1 font-bold",
                    isSelected ? "text-primary-foreground/70" : "text-accent"
                  )}>
                    {bestScore}m
                  </div>
                )}
                {!isUnlocked && (
                  <div className="text-xs mt-1 text-muted-foreground/70 leading-tight">
                    Need {level.altitudeRequired}m on Lv.{level.level - 1}
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Selected Level Details */}
      {selectedLevel && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="game-card rounded-2xl p-4 mb-6 border-2 border-primary/40"
        >
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-bold text-xl neon-text">
                {MOUNTAIN_LEVELS[selectedLevel].name}
              </h3>
              <p className="text-muted-foreground text-sm mt-1">
                {MOUNTAIN_LEVELS[selectedLevel].description}
              </p>
              <div className="flex gap-2 mt-3 text-xs">
                <span className="px-2 py-1 rounded-full bg-muted">
                  Speed: {MOUNTAIN_LEVELS[selectedLevel].scrollSpeed}
                </span>
                <span className="px-2 py-1 rounded-full bg-destructive/30 text-destructive">
                  Rocks: {MOUNTAIN_LEVELS[selectedLevel].rockFrequency}/s
                </span>
                <span className="px-2 py-1 rounded-full bg-accent/30 text-accent">
                  Caves: {MOUNTAIN_LEVELS[selectedLevel].caveFrequency}/1000m
                </span>
              </div>
            </div>
            <button
              onClick={handleStartGame}
              className="hero-gradient text-primary-foreground px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:-translate-y-0.5 transition-transform shadow-[var(--shadow-glow)]"
            >
              Start Climb
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Instructions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="game-card rounded-2xl p-4 text-sm text-muted-foreground"
      >
        <h3 className="font-bold text-foreground mb-2">How to Play</h3>
        <ul className="space-y-1">
          <li>Use the joystick to dodge falling rocks as you climb.</li>
          <li>Blue glowing caves grant a 3-second shield.</li>
          <li>Grey caves are traps - avoid them!</li>
          <li>In Timed mode, rocks subtract 5 seconds from your timer.</li>
          <li>In Survival mode, rocks remove 1 heart.</li>
          <li>Clear a level to unlock the next summit.</li>
        </ul>
      </motion.div>
    </div>
  );
};
