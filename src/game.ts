export type LevelKey = "easy" | "medium" | "hard" | "extreme";
export type TimedKey = "tEasy" | "tMedium" | "tHard" | "tExtreme";
export type EndlessKey = "endlessEasy" | "endlessMedium" | "endlessHard" | "endlessExtreme" | "endlessTEasy" | "endlessTMedium" | "endlessTHard" | "endlessTExtreme";
export type PeacefulKey = "peaceful";
export type MountainLevelKey = "mountain1" | "mountain2" | "mountain3" | "mountain4" | "mountain5" | "mountain6" | "mountain7" | "mountain8" | "mountain9" | "mountain10";
export type MountainModeKey = "mountainTimed" | "mountainEndless";
export type AnyLevelKey = LevelKey | TimedKey | EndlessKey | PeacefulKey | MountainLevelKey | MountainModeKey;

export interface LevelConfig {
  key: LevelKey;
  name: string;
  clicksToWin: number;
  moveIntervalMs: number;
  reward: number;
  emoji: string;
  description: string;
  decoys: boolean;
}

export const LEVELS: Record<LevelKey, LevelConfig> = {
  easy:    { key: "easy",    name: "Easy",    clicksToWin: 5,  moveIntervalMs: 1000, reward: 20,  emoji: "🌱", description: "Slow & friendly. Great for warming up.", decoys: false },
  medium:  { key: "medium",  name: "Medium",  clicksToWin: 8,  moveIntervalMs: 700,  reward: 35,  emoji: "🔥", description: "Faster moves. Stay focused!",            decoys: false },
  hard:    { key: "hard",    name: "Hard",    clicksToWin: 18, moveIntervalMs: 450,  reward: 85,  emoji: "💀", description: "Decoys appear. Beat to unlock Extreme.", decoys: true  },
  extreme: { key: "extreme", name: "Extreme", clicksToWin: 30, moveIntervalMs: 280,  reward: 200, emoji: "⚡", description: "Lightning speed + decoys. Legendary.",  decoys: true  },
};

export interface TimedLevelConfig {
  key: TimedKey;
  name: string;
  clicksToWin: number;
  timeLimitMs: number;
  moveIntervalMs: number;
  reward: number;
  emoji: string;
  description: string;
  decoys: boolean;
  unlock: { stage: AnyLevelKey; wins: number } | null;
  timerResets?: boolean; // Whether timer resets on each click (Extreme only)
}

export const TIMED_LEVELS: Record<TimedKey, TimedLevelConfig> = {
  tEasy:    { key: "tEasy",    name: "Timed Easy",    clicksToWin: 5,  timeLimitMs: 7000,  moveIntervalMs: 600, reward: 60,  emoji: "⏱️", description: "5 clicks in 7 seconds.",   decoys: false, unlock: { stage: "extreme", wins: 3 }, timerResets: false },
  tMedium:  { key: "tMedium",  name: "Timed Medium",  clicksToWin: 8,  timeLimitMs: 10000, moveIntervalMs: 500, reward: 120, emoji: "⏲️", description: "8 clicks in 10 seconds.",  decoys: false, unlock: { stage: "tEasy",   wins: 10 }, timerResets: false },
  tHard:    { key: "tHard",    name: "Timed Hard",    clicksToWin: 18, timeLimitMs: 25000, moveIntervalMs: 280, reward: 250, emoji: "⏰", description: "18 clicks in 25 seconds. Decoys.", decoys: true,  unlock: { stage: "tMedium", wins: 6 }, timerResets: false },
  tExtreme: { key: "tExtreme", name: "Timed Extreme", clicksToWin: 25, timeLimitMs: 50000, moveIntervalMs: 220, reward: 500, emoji: "👑", description: "25 clicks in 50 seconds. Timer resets on hit!", decoys: true, unlock: { stage: "tHard", wins: 3 }, timerResets: true },
};

export const TIMED_ORDER: TimedKey[] = ["tEasy", "tMedium", "tHard", "tExtreme"];

// Peaceful mode config - no timer, no game over, steady movement
export interface PeacefulConfig {
  key: PeacefulKey;
  name: string;
  moveIntervalMs: number;
  emoji: string;
  description: string;
  decoys: boolean;
}

export const PEACEFUL_CONFIG: PeacefulConfig = {
  key: "peaceful",
  name: "Peaceful",
  moveIntervalMs: 1200, // Slower, steady movement
  emoji: "🌙",
  description: "No timer, no pressure. Just relax and catch.",
  decoys: false,
};

export const isPeacefulKey = (k: AnyLevelKey): k is PeacefulKey => k === "peaceful";

// Mountain Mode Types and Configs
export interface MountainLevelConfig {
  key: MountainLevelKey;
  name: string;
  level: number; // 1-10
  scrollSpeed: number; // Base scroll speed (pixels per second)
  rockFrequency: number; // Rocks per second
  rockSpeed: number; // Rock fall speed multiplier
  caveFrequency: number; // Caves per 1000px of altitude
  altitudeRequired: number; // Altitude needed on previous level to unlock this one
  description: string;
}

export const MOUNTAIN_LEVELS: Record<MountainLevelKey, MountainLevelConfig> = {
  mountain1:  { key: "mountain1",  name: "Summit I",    level: 1,  scrollSpeed: 40,  rockFrequency: 0.3,  rockSpeed: 1.0, caveFrequency: 3,   altitudeRequired: 0,    description: "Gentle slopes. Perfect for beginners." },
  mountain2:  { key: "mountain2",  name: "Summit II",   level: 2,  scrollSpeed: 50,  rockFrequency: 0.5,  rockSpeed: 1.1, caveFrequency: 2.5, altitudeRequired: 200,  description: "Slight incline. Watch for rocks." },
  mountain3:  { key: "mountain3",  name: "Summit III",  level: 3,  scrollSpeed: 60,  rockFrequency: 0.7,  rockSpeed: 1.2, caveFrequency: 2.2, altitudeRequired: 350,  description: "Steeper terrain. Stay alert." },
  mountain4:  { key: "mountain4",  name: "Summit IV",   level: 4,  scrollSpeed: 70,  rockFrequency: 0.9,  rockSpeed: 1.3, caveFrequency: 2.0, altitudeRequired: 550,  description: "Rocks tumble more frequently." },
  mountain5:  { key: "mountain5",  name: "Summit V",    level: 5,  scrollSpeed: 85,  rockFrequency: 1.1,  rockSpeed: 1.4, caveFrequency: 1.8, altitudeRequired: 800,  description: "Halfway point. The real climb begins." },
  mountain6:  { key: "mountain6",  name: "Summit VI",   level: 6,  scrollSpeed: 100, rockFrequency: 1.3,  rockSpeed: 1.5, caveFrequency: 1.6, altitudeRequired: 1100, description: "Rapid ascent. Quick reflexes required." },
  mountain7:  { key: "mountain7",  name: "Summit VII",  level: 7,  scrollSpeed: 120, rockFrequency: 1.5,  rockSpeed: 1.7, caveFrequency: 1.4, altitudeRequired: 1500, description: "The air thins. Rocks cascade down." },
  mountain8:  { key: "mountain8",  name: "Summit VIII", level: 8,  scrollSpeed: 140, rockFrequency: 1.8,  rockSpeed: 1.9, caveFrequency: 1.2, altitudeRequired: 2000, description: "Approaching the storm zone." },
  mountain9:  { key: "mountain9",  name: "Summit IX",   level: 9,  scrollSpeed: 160, rockFrequency: 2.1,  rockSpeed: 2.1, caveFrequency: 1.0, altitudeRequired: 2700, description: "Rock storms are relentless." },
  mountain10: { key: "mountain10", name: "Summit X",    level: 10, scrollSpeed: 200, rockFrequency: 2.5,  rockSpeed: 2.5, caveFrequency: 0.8, altitudeRequired: 3500, description: "The ultimate peak. Extreme chaos." },
};

export const MOUNTAIN_LEVEL_ORDER: MountainLevelKey[] = [
  "mountain1", "mountain2", "mountain3", "mountain4", "mountain5",
  "mountain6", "mountain7", "mountain8", "mountain9", "mountain10"
];

export interface MountainModeConfig {
  key: MountainModeKey;
  name: string;
  timerMs: number; // 45000ms for Timed, 0 for Endless
  hearts: number; // 0 for Timed, 3 for Endless
  hazardPenaltySeconds: number; // Time subtracted on hit (Timed mode)
  emoji: string;
  description: string;
}

export const MOUNTAIN_MODES: Record<MountainModeKey, MountainModeConfig> = {
  mountainTimed: {
    key: "mountainTimed",
    name: "Timed Climb",
    timerMs: 45000, // 45 seconds
    hearts: 0,
    hazardPenaltySeconds: 5,
    emoji: "⏱️",
    description: "45s countdown. Hazards subtract 5s. Max altitude wins!"
  },
  mountainEndless: {
    key: "mountainEndless",
    name: "Survival Climb",
    timerMs: 0,
    hearts: 3,
    hazardPenaltySeconds: 0,
    emoji: "❤️",
    description: "3 Hearts. Hazards remove 1 heart. Climb forever!"
  }
};

export const isMountainLevelKey = (k: AnyLevelKey): k is MountainLevelKey =>
  k.startsWith("mountain") && !k.includes("Timed") && !k.includes("Endless");

export const isMountainModeKey = (k: AnyLevelKey): k is MountainModeKey =>
  k === "mountainTimed" || k === "mountainEndless";

// Endless mode configs - derived from base levels
export interface EndlessConfig {
  key: EndlessKey;
  baseKey: LevelKey | TimedKey;
  name: string;
  moveIntervalMs: number;
  emoji: string;
  description: string;
  decoys: boolean;
  timerResets?: boolean;
  timeLimitMs?: number; // Only for timed endless modes
}

export const ENDLESS_LEVELS: Record<EndlessKey, EndlessConfig> = {
  endlessEasy:     { key: "endlessEasy",     baseKey: "easy",     name: "Endless Easy",     moveIntervalMs: 1000, emoji: "🌱", description: "How many can you catch?", decoys: false },
  endlessMedium:   { key: "endlessMedium",   baseKey: "medium",   name: "Endless Medium",   moveIntervalMs: 700,  emoji: "🔥", description: "Keep the streak going!", decoys: false },
  endlessHard:     { key: "endlessHard",     baseKey: "hard",     name: "Endless Hard",     moveIntervalMs: 450,  emoji: "💀", description: "Decoys everywhere!", decoys: true },
  endlessExtreme:  { key: "endlessExtreme",  baseKey: "extreme",  name: "Endless Extreme",  moveIntervalMs: 280,  emoji: "⚡", description: "God mode unlocked.", decoys: true },
  endlessTEasy:    { key: "endlessTEasy",    baseKey: "tEasy",    name: "Endless Timed Easy",    moveIntervalMs: 600, emoji: "⏱️", description: "Survive as long as you can!", decoys: false, timerResets: false, timeLimitMs: 7000 },
  endlessTMedium:  { key: "endlessTMedium",  baseKey: "tMedium",  name: "Endless Timed Medium",  moveIntervalMs: 500, emoji: "⏲️", description: "The clock never stops!", decoys: false, timerResets: false, timeLimitMs: 10000 },
  endlessTHard:    { key: "endlessTHard",    baseKey: "tHard",    name: "Endless Timed Hard",    moveIntervalMs: 280, emoji: "⏰", description: "Pure survival mode.", decoys: true, timerResets: false, timeLimitMs: 25000 },
  endlessTExtreme: { key: "endlessTExtreme", baseKey: "tExtreme", name: "Endless Timed Extreme", moveIntervalMs: 220, emoji: "👑", description: "Timer resets. How long can you last?", decoys: true, timerResets: true, timeLimitMs: 50000 },
};

export type PowerUpKey = "slowmo" | "magnet" | "freeze" | "luck" | "auto" | "timewarp" | "doublevision" | "shield";

export interface PowerUp {
  key: PowerUpKey;
  name: string;
  cost: number;
  emoji: string;
  description: string;
  /** in-round usable button during gameplay */
  inRound: boolean;
  /** restricted to timed mode only */
  timedOnly?: boolean;
}

export const POWERUPS: PowerUp[] = [
  { key: "slowmo",       name: "Slow-Motion",    cost: 15,  emoji: "🐢", description: "Reduces target speed by 50% for 5 seconds.", inRound: true },
  { key: "magnet",       name: "Magnet",         cost: 30,  emoji: "🧲", description: "Bigger hitbox for the entire round.", inRound: true },
  { key: "freeze",       name: "Freeze",         cost: 50,  emoji: "❄️", description: "Stops the target for 3 seconds.", inRound: true },
  { key: "luck",         name: "Luck Potion",    cost: 40,  emoji: "🍀", description: "Triple Golden Target chance for the next 3 rounds.", inRound: false },
  { key: "auto",         name: "Auto-Collector", cost: 100, emoji: "🤖", description: "Auto-clicks one target every 5 seconds.", inRound: true },
  { key: "timewarp",     name: "Time Warp",      cost: 60,  emoji: "⏳", description: "Adds +5 seconds to the current timer (Timed only).", inRound: true, timedOnly: true },
  { key: "doublevision", name: "Double Vision",  cost: 75,  emoji: "👯", description: "Spawns a second target. Either one counts.", inRound: true },
  { key: "shield",       name: "Shield",         cost: 40,  emoji: "🛡️", description: "10s of immunity from miss penalties & shake.", inRound: true },
];

export interface SaveData {
  coins: number;
  extremeUnlocked: boolean;
  totalCaught: number;
  totalEarned: number;
  bestTimesMs: Partial<Record<AnyLevelKey, number>>;
  luckRoundsLeft: number;
  winCounts: Partial<Record<AnyLevelKey, number>>;
  gildedUnlocked: boolean;
  gildedActive: boolean;
  inventory: Partial<Record<PowerUpKey, number>>;
  playerName?: string; // Player name for leaderboard
  beatenLevels: Partial<Record<LevelKey | TimedKey, boolean>>; // Track which levels have been beaten for endless mode unlock
  endlessHighScores: Partial<Record<EndlessKey, number>>; // Total clicks in endless mode
  dataVersion?: number; // For data migration
  // Mountain Mode fields
  mountainUnlocked?: boolean; // Requires 2 Standard Extreme wins + 1 Timed Hard win
  mountainLevelsUnlocked?: Partial<Record<MountainLevelKey, boolean>>; // Track unlocked mountain levels
  mountainHighScores?: Partial<Record<MountainLevelKey, { timed: number; endless: number }>>; // Best altitude per level/mode
}

const KEY = "abdullah_game_data";
const LEGACY_KEYS = ["catch-abdullah-save-v3", "catch-abdullah-save-v2", "catch-abdullah-save"];
const RESET_KEY = "abdullah_game_reset_v2"; // Change this to force another reset
const CURRENT_DATA_VERSION = 2;

const DEFAULT_SAVE: SaveData = {
  coins: 0,
  extremeUnlocked: false,
  totalCaught: 0,
  totalEarned: 0,
  bestTimesMs: {},
  luckRoundsLeft: 0,
  winCounts: {},
  gildedUnlocked: false,
  gildedActive: false,
  inventory: {},
  playerName: undefined,
  beatenLevels: {},
  endlessHighScores: {},
  dataVersion: CURRENT_DATA_VERSION,
  mountainUnlocked: false,
  mountainLevelsUnlocked: { mountain1: true }, // First level always unlocked once hub is unlocked
  mountainHighScores: {},
};

// Master reset function - clears all data
export const masterReset = () => {
  try {
    localStorage.removeItem(KEY);
    LEGACY_KEYS.forEach((k) => localStorage.removeItem(k));
    // Clear any other game-related localStorage
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('abdullah') || key.startsWith('catch-abdullah'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
    localStorage.setItem(RESET_KEY, 'done');
  } catch { /* ignore */ }
};

// Check if master reset is needed (one-time on this update)
export const checkMasterReset = (): boolean => {
  try {
    if (localStorage.getItem(RESET_KEY) !== 'done') {
      masterReset();
      return true;
    }
    return false;
  } catch {
    return false;
  }
};

export const loadSave = (): SaveData => {
  // Check for master reset first
  checkMasterReset();
  
  try {
    let raw = localStorage.getItem(KEY);
    if (!raw) {
      // Migrate from any legacy key
      for (const k of LEGACY_KEYS) {
        const legacy = localStorage.getItem(k);
        if (legacy) { raw = legacy; break; }
      }
    }
    if (!raw) return { ...DEFAULT_SAVE };
    const parsed = { ...DEFAULT_SAVE, ...JSON.parse(raw) };
    // Ensure new fields exist
    if (!parsed.beatenLevels) parsed.beatenLevels = {};
    if (!parsed.endlessHighScores) parsed.endlessHighScores = {};
    if (!parsed.dataVersion) parsed.dataVersion = CURRENT_DATA_VERSION;
    // Mountain fields
    if (parsed.mountainLevelsUnlocked === undefined) parsed.mountainLevelsUnlocked = { mountain1: true };
    if (parsed.mountainHighScores === undefined) parsed.mountainHighScores = {};
    return parsed;
  } catch {
    return { ...DEFAULT_SAVE };
  }
};

export const saveSave = (data: SaveData) => {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* ignore */ }
};

export const clearSave = () => {
  try {
    localStorage.removeItem(KEY);
    LEGACY_KEYS.forEach((k) => localStorage.removeItem(k));
  } catch { /* ignore */ }
};

export const formatTime = (ms: number) => `${(ms / 1000).toFixed(2)}s`;

export const isTimedKey = (k: AnyLevelKey): k is TimedKey =>
  k === "tEasy" || k === "tMedium" || k === "tHard" || k === "tExtreme";

export const isEndlessKey = (k: AnyLevelKey): k is EndlessKey =>
  k.startsWith("endless");

export const isTimedUnlocked = (key: TimedKey, save: SaveData): boolean => {
  const cfg = TIMED_LEVELS[key];
  if (!cfg.unlock) return true;
  return (save.winCounts[cfg.unlock.stage] ?? 0) >= cfg.unlock.wins;
};

// Check if endless mode is unlocked for a given base level
export const isEndlessUnlocked = (key: EndlessKey, save: SaveData): boolean => {
  const cfg = ENDLESS_LEVELS[key];
  return save.beatenLevels[cfg.baseKey as LevelKey | TimedKey] === true;
};

// Get the base level key from an endless key
export const getBaseLevel = (key: EndlessKey): LevelKey | TimedKey => {
  return ENDLESS_LEVELS[key].baseKey;
};

export const TIMED_ITEM_LIMIT = 3;

export const DECOY_NAMES = ["Abdulah", "Abdullh", "Abdoullah", "Abdulla", "Abdullaah"];

// Speech lines for trash talk
export const MISS_LINES = ["Too slow!", "Can't catch me!", "Try harder!", "Missed me!", "Nope!"];
export const HIT_LINES = ["Ouch!", "Got me!", "Nice one!", "Ow!", "Not fair!"];

// Mountain Hub unlock check
// Requires: 2 Standard Extreme wins + 1 Timed Hard win
export const isMountainHubUnlocked = (save: SaveData): boolean => {
  if (save.mountainUnlocked) return true;
  const extremeWins = save.winCounts?.extreme ?? 0;
  const timedHardWins = save.winCounts?.tHard ?? 0;
  return extremeWins >= 2 && timedHardWins >= 1;
};

// Check if a specific mountain level is unlocked
// Unlock condition: achieve altitudeRequired on the previous level
export const isMountainLevelUnlocked = (level: MountainLevelKey, save: SaveData): boolean => {
  if (level === "mountain1") return true;
  const currentIdx = MOUNTAIN_LEVEL_ORDER.indexOf(level);
  const prevKey = MOUNTAIN_LEVEL_ORDER[currentIdx - 1];
  const prevScores = save.mountainHighScores?.[prevKey];
  const prevBest = Math.max(prevScores?.timed ?? 0, prevScores?.endless ?? 0);
  return prevBest >= MOUNTAIN_LEVELS[level].altitudeRequired;
};

// Get the next mountain level to unlock
export const getNextMountainLevel = (currentLevel: MountainLevelKey): MountainLevelKey | null => {
  const currentIdx = MOUNTAIN_LEVEL_ORDER.indexOf(currentLevel);
  if (currentIdx === -1 || currentIdx >= MOUNTAIN_LEVEL_ORDER.length - 1) return null;
  return MOUNTAIN_LEVEL_ORDER[currentIdx + 1];
};

// Map mountain level number to difficulty for leaderboard
export const getMountainDifficulty = (level: number): "EASY" | "MEDIUM" | "HARD" | "EXTREME" => {
  if (level <= 3) return "EASY";
  if (level <= 5) return "MEDIUM";
  if (level <= 8) return "HARD";
  return "EXTREME";
};
