import { useEffect, useState } from "react";
import { HomeScreen } from "@/components/HomeScreen";
import { GameScreen } from "@/components/GameScreen";
import { Shop } from "@/components/Shop";
import { WinModal } from "@/components/WinModal";
import { LossModal } from "@/components/LossModal";
import { StatsScreen } from "@/components/StatsScreen";
import { TimedTrialsScreen } from "@/components/TimedTrialsScreen";
import { LeaderboardScreen } from "@/components/LeaderboardScreen";
import { MountainScreen } from "@/components/MountainScreen";
import { MountainGameScreen } from "@/components/MountainGameScreen";
import { NamePrompt } from "@/components/NamePrompt";
import { ScoreSubmitModal } from "@/components/ScoreSubmitModal";
import { LabPanel } from "@/components/LabPanel";
import { AnimatePresence, motion } from "framer-motion";
import {
  LEVELS, TIMED_LEVELS, ENDLESS_LEVELS, PEACEFUL_CONFIG, MOUNTAIN_LEVELS,
  LevelKey, TimedKey, EndlessKey, AnyLevelKey, PeacefulKey, MountainLevelKey, MountainModeKey,
  loadSave, saveSave, SaveData, isTimedKey, isEndlessKey, isPeacefulKey, isMountainLevelKey, isMountainModeKey,
  PowerUpKey, getNextMountainLevel, getMountainDifficulty,
} from "@/lib/game";
import { Announcement, readLastAnnouncement, isLabModeActive } from "@/lib/admin";

type View = "home" | "game" | "shop" | "stats" | "gamble" | "timed" | "leaderboard" | "mountain" | "mountainGame";

const Index = () => {
  const [view, setView] = useState<View>("home");
  const [save, setSave] = useState<SaveData>(loadSave);
  const [activeLevel, setActiveLevel] = useState<AnyLevelKey>("easy");
  const [roundKey, setRoundKey] = useState(0); // forces GameScreen remount on retry
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [pendingScoreSubmit, setPendingScoreSubmit] = useState<{
    score: number;
    difficulty: string;
    isEndless: boolean;
  } | null>(null);
  const [showLab, setShowLab] = useState(false);
  const [mountainLevel, setMountainLevel] = useState<MountainLevelKey | null>(null);
  const [mountainMode, setMountainMode] = useState<MountainModeKey>("mountainTimed");
  const [winState, setWinState] = useState<{
    reward: number;
    bonusMultiplier: number;
    unlocked: boolean;
    elapsedMs: number;
    newBest: boolean;
    canGamble: boolean;
    legendary: boolean;
  } | null>(null);
  const [lossState, setLossState] = useState<{
    lostReward: number;
    title?: string;
    message?: string;
    endlessScore?: number;
  } | null>(null);
  const [pendingGambleReward, setPendingGambleReward] = useState(0);
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);

  // Check if player needs to enter name
  useEffect(() => {
    if (!save.playerName) {
      setShowNamePrompt(true);
    }
  }, []);

  // Persist save on every change
  useEffect(() => { saveSave(save); }, [save]);

  // Inventory is part of save (persistent)
  const inventory: Record<string, number> = save.inventory as Record<string, number>;

  // Announcement listener (in-tab + cross-tab)
  useEffect(() => {
    const showAnnouncement = (a: Announcement | null) => {
      if (!a) return;
      setAnnouncement(a);
      window.setTimeout(() => {
        setAnnouncement((cur) => (cur && cur.id === a.id ? null : cur));
      }, 10000);
    };
    const onCustom = (e: Event) => showAnnouncement((e as CustomEvent<Announcement>).detail);
    const onStorage = (e: StorageEvent) => {
      if (e.key === "abdullah_admin_announce" && e.newValue) {
        try { showAnnouncement(JSON.parse(e.newValue)); } catch { /* ignore */ }
      }
    };
    window.addEventListener("abdullah_admin_announce", onCustom as EventListener);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("abdullah_admin_announce", onCustom as EventListener);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const cameFromTimed = isTimedKey(activeLevel) || (isEndlessKey(activeLevel) && activeLevel.includes("T"));
  const isPeaceful = isPeacefulKey(activeLevel);

  const handleNameSubmit = (name: string) => {
    setSave(s => ({ ...s, playerName: name }));
    setShowNamePrompt(false);
  };

  const startLevel = (key: AnyLevelKey) => {
    setActiveLevel(key);
    setWinState(null);
    setLossState(null);
    setRoundKey((k) => k + 1); // force fresh GameScreen
    setView("game");
  };

  const handleWin = (elapsedMs: number) => {
    const isEndless = isEndlessKey(activeLevel);
    const peaceful = isPeacefulKey(activeLevel);
    
    if (isEndless) {
      // Endless mode doesn't have a traditional "win" - this shouldn't be called
      return;
    }
    
    // Peaceful mode - no rewards, no saves
    if (peaceful) {
      setWinState(null);
      setView("home");
      return;
    }

    const isTimed = isTimedKey(activeLevel);
    const cfg = isTimed ? TIMED_LEVELS[activeLevel as TimedKey] : LEVELS[activeLevel as LevelKey];
    const baseReward = cfg.reward;
    const gildedMult = save.gildedActive ? 2 : 1;
    const reward = baseReward * gildedMult;

    const newlyUnlockedExtreme = activeLevel === "hard" && !save.extremeUnlocked;
    const prevBest = save.bestTimesMs[activeLevel];
    const newBest = !prevBest || elapsedMs < prevBest;

    const prevWins = save.winCounts[activeLevel] ?? 0;
    const newWins = prevWins + 1;

    const isFirstTimedExtremeWin = activeLevel === "tExtreme" && !save.gildedUnlocked;

    // Mark level as beaten for endless mode unlock
    const baseKey = activeLevel as LevelKey | TimedKey;

    setSave((s) => ({
      ...s,
      coins: s.coins + reward,
      totalEarned: s.totalEarned + reward,
      extremeUnlocked: s.extremeUnlocked || newlyUnlockedExtreme,
      bestTimesMs: newBest ? { ...s.bestTimesMs, [activeLevel]: elapsedMs } : s.bestTimesMs,
      luckRoundsLeft: Math.max(0, s.luckRoundsLeft - 1),
      winCounts: { ...s.winCounts, [activeLevel]: newWins },
      gildedUnlocked: s.gildedUnlocked || isFirstTimedExtremeWin,
      beatenLevels: { ...s.beatenLevels, [baseKey]: true },
    }));

    setWinState({
      reward,
      bonusMultiplier: 1,
      unlocked: newlyUnlockedExtreme,
      elapsedMs,
      newBest,
      canGamble: !isTimed,
      legendary: isFirstTimedExtremeWin,
    });

    // Prepare score submission
    setPendingScoreSubmit({
      score: elapsedMs,
      difficulty: activeLevel,
      isEndless: false,
    });
  };

  const handleEndlessEnd = (totalClicks: number) => {
    const endlessKey = activeLevel as EndlessKey;
    const prevBest = save.endlessHighScores[endlessKey] ?? 0;
    const newBest = totalClicks > prevBest;

    setSave((s) => ({
      ...s,
      totalCaught: s.totalCaught + totalClicks,
      endlessHighScores: newBest ? { ...s.endlessHighScores, [endlessKey]: totalClicks } : s.endlessHighScores,
    }));

    setLossState({
      lostReward: 0,
      title: "Game Over!",
      message: `You caught ${totalClicks} Abdullahs!${newBest ? " NEW RECORD!" : ""}`,
      endlessScore: totalClicks,
    });

    // Prepare score submission for endless
    setPendingScoreSubmit({
      score: totalClicks,
      difficulty: activeLevel,
      isEndless: true,
    });
  };

  const handleTimedLose = () => {
    if (isEndlessKey(activeLevel)) {
      // This shouldn't happen for endless timed modes - they use handleEndlessEnd
      return;
    }
    setLossState({
      lostReward: 0,
      title: "Time's Up!",
      message: "You ran out of time. The Trials demand more speed.",
    });
  };

  const handleGambleStart = () => {
    if (!winState) return;
    setSave((s) => ({ ...s, coins: s.coins - winState.reward, totalEarned: s.totalEarned - winState.reward }));
    setPendingGambleReward(winState.reward);
    setWinState(null);
    setPendingScoreSubmit(null); // Clear pending score when gambling
    setRoundKey((k) => k + 1);
    setView("gamble");
  };

  const handleGambleWin = () => {
    const doubled = pendingGambleReward * 2;
    setSave((s) => ({ ...s, coins: s.coins + doubled, totalEarned: s.totalEarned + doubled }));
    setWinState({
      reward: pendingGambleReward,
      bonusMultiplier: 2,
      unlocked: false,
      elapsedMs: 0,
      newBest: false,
      canGamble: false,
      legendary: false,
    });
    setPendingGambleReward(0);
    setView("home");
  };

  const handleGambleLose = () => {
    setLossState({ lostReward: pendingGambleReward });
    setPendingGambleReward(0);
    setView("home");
  };

  const handleBuy = (key: string, cost: number) => {
    setSave((s) => {
      if (key === "luck") {
        return { ...s, coins: s.coins - cost, luckRoundsLeft: s.luckRoundsLeft + 3 };
      }
      const k = key as PowerUpKey;
      const inv = { ...s.inventory };
      inv[k] = (inv[k] ?? 0) + 1;
      return { ...s, coins: s.coins - cost, inventory: inv };
    });
  };

  const handleUsePowerUp = (key: string) => {
    setSave((s) => {
      const k = key as PowerUpKey;
      const inv = { ...s.inventory };
      inv[k] = Math.max(0, (inv[k] ?? 0) - 1);
      return { ...s, inventory: inv };
    });
  };

  const handleCoinDelta = (delta: number, caught: number) => {
    const mult = save.gildedActive && delta > 0 ? 2 : 1;
    const adj = delta * (delta > 0 ? mult : 1);
    setSave((s) => ({
      ...s,
      coins: Math.max(0, s.coins + adj),
      totalEarned: s.totalEarned + Math.max(0, adj),
      totalCaught: s.totalCaught + caught,
    }));
  };

  const handleScoreSubmitComplete = () => {
    setPendingScoreSubmit(null);
  };

  const handleChangeNameForScore = () => {
    setShowNamePrompt(true);
  };

  // Mountain mode handlers
  const handleMountainLevelSelect = (level: MountainLevelKey, mode: MountainModeKey) => {
    setMountainLevel(level);
    setMountainMode(mode);
    setWinState(null);
    setLossState(null);
    setView("mountainGame");
  };

  const handleMountainGameEnd = (altitude: number, won: boolean) => {
    if (!mountainLevel) return;

    const levelNum = MOUNTAIN_LEVELS[mountainLevel].level;
    const prevScores = save.mountainHighScores?.[mountainLevel] || { timed: 0, endless: 0 };
    const isNewRecord = mountainMode === "mountainTimed" 
      ? altitude > prevScores.timed 
      : altitude > prevScores.endless;

    // Update high scores
    const newHighScores = { ...save.mountainHighScores };
    if (isNewRecord) {
      newHighScores[mountainLevel] = {
        ...prevScores,
        [mountainMode === "mountainTimed" ? "timed" : "endless"]: altitude,
      };
    }

    // Unlock next level if won (reached good altitude or survived)
    const shouldUnlockNext = won && altitude >= 100 * levelNum; // Threshold based on level
    const nextLevel = getNextMountainLevel(mountainLevel);
    const newUnlockedLevels = { ...save.mountainLevelsUnlocked };
    if (shouldUnlockNext && nextLevel) {
      newUnlockedLevels[nextLevel] = true;
    }

    setSave(s => ({
      ...s,
      mountainHighScores: newHighScores,
      mountainLevelsUnlocked: newUnlockedLevels,
      mountainUnlocked: true, // Mark as unlocked once played
    }));

    // Show result modal
    if (won) {
      setWinState({
        reward: Math.floor(altitude / 10), // Coins based on altitude
        bonusMultiplier: 1,
        unlocked: shouldUnlockNext && nextLevel !== null,
        elapsedMs: altitude, // Use altitude as "time" for display
        newBest: isNewRecord,
        canGamble: false,
        legendary: levelNum === 10 && altitude >= 1000, // Legendary for Summit X with 1000m+
      });
    } else {
      setLossState({
        lostReward: 0,
        title: "Climb Ended!",
        message: `You reached ${altitude}m altitude!${isNewRecord ? " NEW RECORD!" : ""}`,
        endlessScore: altitude,
      });
    }

    // Prepare score submission for mountain
    if (!isLabModeActive()) {
      setPendingScoreSubmit({
        score: altitude,
        difficulty: `mountain${levelNum}_${mountainMode === "mountainTimed" ? "timed" : "endless"}`,
        isEndless: mountainMode === "mountainEndless",
      });
    }
  };

  // Show last announcement on mount if it's <10s old
  useEffect(() => {
    const a = readLastAnnouncement();
    if (a && Date.now() - a.ts < 10000) {
      setAnnouncement(a);
      const remaining = 10000 - (Date.now() - a.ts);
      window.setTimeout(() => setAnnouncement((cur) => (cur && cur.id === a.id ? null : cur)), remaining);
    }
  }, []);

  const luckActive = save.luckRoundsLeft > 0;

  // Determine if current level needs timer reset (Timed Extreme only)
  const getTimerResets = (): boolean => {
    if (activeLevel === "tExtreme") return true;
    if (activeLevel === "endlessTExtreme") return true;
    return false;
  };

  return (
    <main className="min-h-screen p-4 md:p-6 flex items-center justify-center relative">
      {/* Name Prompt */}
      {showNamePrompt && (
        <NamePrompt
          onSubmit={handleNameSubmit}
          title={save.playerName ? "Change Your Name" : "Enter Your Name"}
          subtitle="This will be shown on the global leaderboard"
        />
      )}

      {/* Score Submit Modal */}
      {pendingScoreSubmit && save.playerName && !showNamePrompt && !isPeaceful && (winState || lossState?.endlessScore) && (
        <ScoreSubmitModal
          playerName={save.playerName}
          score={pendingScoreSubmit.score}
          difficulty={pendingScoreSubmit.difficulty}
          isEndless={pendingScoreSubmit.isEndless}
          isLabMode={isLabModeActive()}
          onComplete={handleScoreSubmitComplete}
          onChangeName={handleChangeNameForScore}
        />
      )}

      {/* Global announcement banner */}
      <AnimatePresence>
        {announcement && (
          <motion.div
            key={announcement.id}
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.4 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] hero-gradient text-primary-foreground px-6 py-3 rounded-full font-bold shadow-[var(--shadow-glow)] max-w-[90vw] text-center"
          >
            📣 {announcement.message}
          </motion.div>
        )}
      </AnimatePresence>

      {view === "home" && (
        <HomeScreen
          extremeUnlocked={save.extremeUnlocked}
          gildedUnlocked={save.gildedUnlocked}
          gildedActive={save.gildedActive}
          beatenLevels={save.beatenLevels}
          save={save}
          onToggleGilded={() => setSave((s) => ({ ...s, gildedActive: !s.gildedActive }))}
          onSelect={startLevel}
          onOpenShop={() => setView("shop")}
          onOpenStats={() => setView("stats")}
          onOpenTimed={() => setView("timed")}
          onOpenLeaderboard={() => setView("leaderboard")}
          onOpenMountain={() => setView("mountain")}
          onOpenLab={() => setShowLab(true)}
        />
      )}
      {showLab && <LabPanel onClose={() => setShowLab(false)} />}
      {view === "timed" && (
        <TimedTrialsScreen
          save={save}
          onSelect={(k) => startLevel(k)}
          onBack={() => setView("home")}
          onToggleGilded={() => setSave((s) => ({ ...s, gildedActive: !s.gildedActive }))}
        />
      )}
      {view === "leaderboard" && (
        <LeaderboardScreen onBack={() => setView("home")} />
      )}
      {view === "mountain" && (
        <MountainScreen
          save={save}
          onSelectLevel={handleMountainLevelSelect}
          onBack={() => setView("home")}
        />
      )}
      {view === "mountainGame" && mountainLevel && (
        <MountainGameScreen
          key={`mountain-${roundKey}`}
          level={mountainLevel}
          mode={mountainMode}
          onGameEnd={handleMountainGameEnd}
          onExit={() => setView("mountain")}
        />
      )}
      {view === "shop" && (
        <Shop
          coins={save.coins}
          inventory={inventory}
          luckRoundsLeft={save.luckRoundsLeft}
          onBuy={handleBuy}
          onBack={() => setView("home")}
        />
      )}
      {view === "stats" && (
        <StatsScreen
          totalCaught={save.totalCaught}
          totalEarned={save.totalEarned}
          bestTimes={save.bestTimesMs}
          endlessHighScores={save.endlessHighScores}
          onBack={() => setView("home")}
        />
      )}
      {view === "game" && (
        <GameScreen
          key={`game-${roundKey}`}
          level={activeLevel}
          coins={save.coins}
          inventory={inventory}
          luckActive={!isTimedKey(activeLevel) && !isEndlessKey(activeLevel) && luckActive}
          gildedActive={save.gildedActive}
          timerResets={getTimerResets()}
          onUsePowerUp={handleUsePowerUp}
          onWin={handleWin}
          onLose={isTimedKey(activeLevel) ? handleTimedLose : undefined}
          onEndlessEnd={isEndlessKey(activeLevel) ? handleEndlessEnd : undefined}
          onCoinDelta={handleCoinDelta}
          onExit={() => setView(cameFromTimed ? "timed" : "home")}
        />
      )}
      {view === "gamble" && (
        <GameScreen
          key={`gamble-${roundKey}`}
          level={activeLevel}
          coins={save.coins}
          inventory={{}}
          luckActive={false}
          gildedActive={save.gildedActive}
          superFast
          superFastDurationMs={5000}
          onUsePowerUp={() => {}}
          onWin={handleGambleWin}
          onLose={handleGambleLose}
          onCoinDelta={() => {}}
          onExit={handleGambleLose}
        />
      )}
      {winState && !pendingScoreSubmit && (
        <WinModal
          reward={winState.reward}
          bonusMultiplier={winState.bonusMultiplier}
          unlockedExtreme={winState.unlocked}
          newBestTime={winState.newBest}
          elapsedMs={winState.elapsedMs}
          canGamble={winState.canGamble}
          legendary={winState.legendary}
          onGamble={handleGambleStart}
          onPlayAgain={() => {
            setWinState(null);
            if (view === "mountainGame" && mountainLevel) {
              setRoundKey(k => k + 1);
            } else {
              startLevel(activeLevel);
            }
          }}
          onHome={() => {
            setWinState(null);
            if (view === "mountainGame") {
              setView("mountain");
            } else {
              setView(cameFromTimed ? "timed" : "home");
            }
          }}
        />
      )}
      {lossState && !pendingScoreSubmit && (
        <LossModal
          lostReward={lossState.lostReward}
          title={lossState.title}
          message={lossState.message}
          onRetry={() => {
            setLossState(null);
            if (view === "mountainGame" && mountainLevel) {
              setRoundKey(k => k + 1);
            } else {
              startLevel(activeLevel);
            }
          }}
          onHome={() => {
            setLossState(null);
            if (view === "mountainGame") {
              setView("mountain");
            } else {
              setView(cameFromTimed ? "timed" : "home");
            }
          }}
        />
      )}
    </main>
  );
};

export default Index;
