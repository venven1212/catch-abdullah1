import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LEVELS, TIMED_LEVELS, ENDLESS_LEVELS, PEACEFUL_CONFIG, LevelKey, TimedKey, EndlessKey, AnyLevelKey, 
  isTimedKey, isEndlessKey, isPeacefulKey, POWERUPS, DECOY_NAMES, TIMED_ITEM_LIMIT,
  MISS_LINES, HIT_LINES
} from "@/lib/game";
import { loadAdmin } from "@/lib/admin";
import { Chase3D, Chase3DTarget, Chase3DVariant, InputVector } from "./Chase3D";
import { Joystick } from "./Joystick";
import { CoinBadge } from "./CoinBadge";
import { ProgressBar } from "./ProgressBar";
import { ParticleLayer } from "./Particles";
import { ArrowLeft, Infinity } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = Chase3DVariant;

interface GameScreenProps {
  level: AnyLevelKey;
  coins: number;
  inventory: Record<string, number>;
  luckActive: boolean;
  gildedActive?: boolean;
  superFast?: boolean;
  superFastDurationMs?: number;
  timerResets?: boolean;
  onUsePowerUp: (key: string) => void;
  onWin: (elapsedMs: number) => void;
  onLose?: () => void;
  onEndlessEnd?: (totalClicks: number) => void;
  onCoinDelta: (delta: number, caught: number) => void;
  onExit: () => void;
}

interface FloatText { id: number; x: number; y: number; text: string; color: string; }
interface Burst { id: number; x: number; y: number; color?: string; }

const COMBO_WINDOW_MS = 500;

const makeTarget = (variant: Variant, label: string): Chase3DTarget => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  variant,
  label,
  laneSeed: Math.random() * 2 - 1,
  forwardSeed: Math.random(),
});

export const GameScreen = ({
  level,
  coins,
  inventory,
  luckActive,
  gildedActive = false,
  superFast = false,
  superFastDurationMs = 5000,
  timerResets = false,
  onUsePowerUp,
  onWin,
  onLose,
  onEndlessEnd,
  onCoinDelta,
  onExit,
}: GameScreenProps) => {
  const endless = isEndlessKey(level);
  const peaceful = isPeacefulKey(level);
  const timed = isTimedKey(level) || (endless && level.includes("T"));
  const endlessConfig = endless ? ENDLESS_LEVELS[level as EndlessKey] : null;
  
  // Get configuration based on level type
  const getConfig = () => {
    if (peaceful) {
      return {
        clicksToWin: Infinity, // Never ends
        moveIntervalMs: PEACEFUL_CONFIG.moveIntervalMs,
        timeLimitMs: 0, // No timer
        decoys: PEACEFUL_CONFIG.decoys,
        name: PEACEFUL_CONFIG.name,
        emoji: PEACEFUL_CONFIG.emoji,
        timerResets: false,
      };
    } else if (endless) {
      const endlessCfg = ENDLESS_LEVELS[level as EndlessKey];
      return {
        clicksToWin: Infinity,
        moveIntervalMs: endlessCfg.moveIntervalMs,
        timeLimitMs: endlessCfg.timeLimitMs || 0,
        decoys: endlessCfg.decoys,
        name: endlessCfg.name,
        emoji: endlessCfg.emoji,
        timerResets: endlessCfg.timerResets || false,
      };
    } else if (isTimedKey(level)) {
      const timedCfg = TIMED_LEVELS[level as TimedKey];
      return {
        clicksToWin: timedCfg.clicksToWin,
        moveIntervalMs: timedCfg.moveIntervalMs,
        timeLimitMs: timedCfg.timeLimitMs,
        decoys: timedCfg.decoys,
        name: timedCfg.name,
        emoji: timedCfg.emoji,
        timerResets: timedCfg.timerResets || false,
      };
    } else {
      const levelCfg = LEVELS[level as LevelKey];
      return {
        clicksToWin: levelCfg.clicksToWin,
        moveIntervalMs: levelCfg.moveIntervalMs,
        timeLimitMs: 0,
        decoys: levelCfg.decoys,
        name: levelCfg.name,
        emoji: levelCfg.emoji,
        timerResets: false,
      };
    }
  };

  const config = getConfig();
  const itemsAllowed = !superFast && !endless && !peaceful;
  const baseTimeLimitMs = timed ? config.timeLimitMs : (superFast ? superFastDurationMs : 0);
  const shouldTimerReset = timerResets || config.timerResets;

  const [adminTick, setAdminTick] = useState(0);
  useEffect(() => {
    const handler = () => setAdminTick((t) => t + 1);
    window.addEventListener("abdullah_admin_change", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("abdullah_admin_change", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);
  const admin = loadAdmin();
  const adminSpeed = admin.speeds[level];
  const baseMoveIntervalMs = superFast ? 200 : (adminSpeed ?? config.moveIntervalMs);
  void adminTick;

  // Speed scaling: increase by 5% per click
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const moveIntervalMs = Math.max(100, baseMoveIntervalMs / speedMultiplier);

  const [totalClicks, setTotalClicks] = useState(0);
  const [remaining, setRemaining] = useState(endless ? Infinity : config.clicksToWin);
  const [primary, setPrimary] = useState<Chase3DTarget>(() => makeTarget("normal", "Abdullah"));
  const [secondary, setSecondary] = useState<Chase3DTarget | null>(null);
  const [decoys, setDecoys] = useState<Chase3DTarget[]>([]);
  const [floats, setFloats] = useState<FloatText[]>([]);
  const [bursts, setBursts] = useState<Burst[]>([]);
  const [shaking, setShaking] = useState(false);
  const [slowmoUntil, setSlowmoUntil] = useState(0);
  const [freezeUntil, setFreezeUntil] = useState(0);
  const [magnetActive, setMagnetActive] = useState(false);
  const [autoActive, setAutoActive] = useState(false);
  const [shieldUntil, setShieldUntil] = useState(0);
  const [doubleVisionUntil, setDoubleVisionUntil] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bonusTimeMs, setBonusTimeMs] = useState(0);
  const [speech, setSpeech] = useState<{ id: number; text: string } | null>(null);
  const timeLimitMs = baseTimeLimitMs + bonusTimeMs;
  const [timeLeft, setTimeLeft] = useState(timeLimitMs);
  const [itemsUsed, setItemsUsed] = useState(0);
  const [catchFlash, setCatchFlash] = useState(false);

  // Phase tracking for Hard/Extreme modes
  const [currentPhase, setCurrentPhase] = useState(1);
  const isHardOrExtreme = level === "hard" || level === "extreme" || level === "tHard" || level === "tExtreme" ||
                          level === "endlessHard" || level === "endlessExtreme" || level === "endlessTHard" || level === "endlessTExtreme";

  const containerRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);
  const endedRef = useRef(false);
  const lastClickRef = useRef(0);
  const startTimeRef = useRef(Date.now());
  const intervalsRef = useRef<number[]>([]);
  const inputRef = useRef<InputVector>({ x: 0, y: 0 });
  const timerResetRef = useRef(Date.now());

  const nextId = () => ++idRef.current;

  // Calculate current phase based on clicks
  useEffect(() => {
    if (!isHardOrExtreme) return;
    
    let phase = 1;
    if (totalClicks >= 26) {
      phase = endless ? 4 : 3; // Phase 4 is "God Mode" for endless
    } else if (totalClicks >= 11) {
      phase = 2;
    } else if (totalClicks >= 0) {
      phase = 1;
    }
    
    // For endless post-win (after normal win target), enter God Mode
    if (endless && totalClicks >= 30) {
      phase = 4;
    }
    
    setCurrentPhase(phase);
  }, [totalClicks, isHardOrExtreme, endless]);

  const respawn = useCallback(() => {
    if (endedRef.current) return;
    const goldenChance = luckActive ? 0.15 : 0.05;
    const variant: Variant = Math.random() < goldenChance ? "golden" : "normal";
    setPrimary(makeTarget(variant, "Abdullah"));

    if (Date.now() < doubleVisionUntil) {
      setSecondary(makeTarget("normal", "Abdullah"));
    } else {
      setSecondary(null);
    }

    if (config.decoys && Math.random() < 0.5) {
      const numDecoys = Math.random() < 0.3 ? 2 : 1;
      const arr: Chase3DTarget[] = [];
      for (let i = 0; i < numDecoys; i++) {
        arr.push(makeTarget("decoy", DECOY_NAMES[Math.floor(Math.random() * DECOY_NAMES.length)]));
      }
      setDecoys(arr);
    } else {
      setDecoys([]);
    }
  }, [config.decoys, luckActive, doubleVisionUntil]);

  // Initial spawn + cleanup
  useEffect(() => {
    respawn();
    startTimeRef.current = Date.now();
    timerResetRef.current = Date.now();
    return () => {
      endedRef.current = true;
      intervalsRef.current.forEach(clearInterval);
      intervalsRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Periodic respawn drives chase tempo (matches 2D moveIntervalMs semantics)
  useEffect(() => {
    if (Date.now() < freezeUntil) {
      const t = setTimeout(() => setFreezeUntil(0), freezeUntil - Date.now());
      return () => clearTimeout(t);
    }
    const slowed = Date.now() < slowmoUntil;
    const interval = moveIntervalMs * (slowed ? 2 : 1);
    const id = window.setInterval(() => {
      if (endedRef.current) return;
      respawn();
    }, interval);
    intervalsRef.current.push(id);
    return () => {
      clearInterval(id);
      intervalsRef.current = intervalsRef.current.filter((x) => x !== id);
    };
  }, [respawn, slowmoUntil, freezeUntil, moveIntervalMs]);

  // Blinking (teleporting) for Phase 2+ in Hard/Extreme
  useEffect(() => {
    if (!isHardOrExtreme || currentPhase < 2) return;
    
    // Blink rate: 2s for phase 2, 1s for phase 3+
    const blinkRate = currentPhase >= 3 ? 1000 : 2000;
    
    const id = window.setInterval(() => {
      if (endedRef.current) return;
      respawn();
    }, blinkRate);
    
    return () => clearInterval(id);
  }, [isHardOrExtreme, currentPhase, respawn]);

  // Golden auto-decay
  useEffect(() => {
    if (primary.variant !== "golden") return;
    const t = setTimeout(() => {
      setPrimary((p) => (p.variant === "golden" ? { ...p, variant: "normal" } : p));
    }, 2000);
    return () => clearTimeout(t);
  }, [primary.id, primary.variant]);

  useEffect(() => {
    if (slowmoUntil === 0) return;
    const t = setTimeout(() => setSlowmoUntil(0), Math.max(0, slowmoUntil - Date.now()));
    return () => clearTimeout(t);
  }, [slowmoUntil]);

  useEffect(() => {
    if (combo === 0) return;
    const t = setTimeout(() => setCombo(0), COMBO_WINDOW_MS + 50);
    return () => clearTimeout(t);
  }, [combo]);

  // Speech auto-clear after 2s
  useEffect(() => {
    if (!speech) return;
    const t = setTimeout(() => setSpeech((s) => (s && s.id === speech.id ? null : s)), 2000);
    return () => clearTimeout(t);
  }, [speech]);

  // Countdown timer with reset support
  useEffect(() => {
    if (!timed && !superFast) return;
    
    const id = window.setInterval(() => {
      if (endedRef.current) { clearInterval(id); return; }
      
      const elapsed = Date.now() - timerResetRef.current;
      const left = (shouldTimerReset ? timeLimitMs : timeLimitMs) - elapsed;
      
      // For non-resetting timers, calculate from start
      const actualLeft = shouldTimerReset 
        ? timeLimitMs - (Date.now() - timerResetRef.current)
        : timeLimitMs - (Date.now() - startTimeRef.current);
      
      setTimeLeft(Math.max(0, actualLeft));
      
      if (actualLeft <= 0) {
        clearInterval(id);
        if (!endedRef.current) {
          endedRef.current = true;
          intervalsRef.current.forEach(clearInterval);
          intervalsRef.current = [];
          if (endless) {
            onEndlessEnd?.(totalClicks);
          } else {
            onLose?.();
          }
        }
      }
    }, 50);
    intervalsRef.current.push(id);
    return () => clearInterval(id);
  }, [timed, superFast, timeLimitMs, onLose, onEndlessEnd, endless, totalClicks, shouldTimerReset]);

  const addFloat = (x: number, y: number, text: string, color: string) =>
    setFloats((f) => [...f, { id: nextId(), x, y, text, color }]);
  const addBurst = (x: number, y: number, color?: string) =>
    setBursts((b) => [...b, { id: nextId(), x, y, color }]);

  const handleHit = (e: { clientX: number; clientY: number }, hitVariant: Variant) => {
    if (endedRef.current) return;
    if ((timed || superFast) && timeLeft <= 0) return;

    const rect = containerRef.current?.getBoundingClientRect();
    const px = rect ? e.clientX - rect.left : 0;
    const py = rect ? e.clientY - rect.top : 0;

    const shielded = Date.now() < shieldUntil;

    if (hitVariant === "decoy") {
      if (!shielded) {
        onCoinDelta(-5, 0);
        addFloat(px, py, "-5 🪙", "hsl(var(--destructive))");
        addBurst(px, py, "hsl(var(--destructive))");
        triggerShake();
        setCombo(0);
        // Trash talk on miss
        setSpeech({ id: nextId(), text: MISS_LINES[Math.floor(Math.random() * MISS_LINES.length)] });
      } else {
        addFloat(px, py, "🛡 BLOCKED", "hsl(var(--secondary))");
      }
      return;
    }

    // Reset timer for Timed Extreme
    if (shouldTimerReset) {
      timerResetRef.current = Date.now();
      setTimeLeft(timeLimitMs);
    }

    // Increase speed by 5% (not in peaceful mode)
    if (!peaceful) {
      setSpeedMultiplier(m => m * 1.05);
    }
    setTotalClicks(c => c + 1);

    const now = Date.now();
    const inWindow = now - lastClickRef.current <= COMBO_WINDOW_MS;
    lastClickRef.current = now;
    const newCombo = inWindow ? combo + 1 : 1;
    setCombo(newCombo);

    let mult = 1;
    if (newCombo >= 5) mult = 1.5;
    else if (newCombo >= 3) mult = 1.2;

    addBurst(px, py, hitVariant === "golden" ? "hsl(45 100% 60%)" : "hsl(var(--accent))");

    // Visual flash on catch
    setCatchFlash(true);
    setTimeout(() => setCatchFlash(false), 150);

    if (hitVariant === "golden") {
      const g = gildedActive ? 100 : 50;
      onCoinDelta(g, 1);
      addFloat(px, py, `+${g} 🪙 GOLDEN!`, "hsl(45 100% 65%)");
    } else {
      addFloat(px, py, mult > 1 ? `+1 ×${mult.toFixed(1)}` : "+1", "hsl(var(--accent))");
      onCoinDelta(0, 1);
    }

    // Trash talk on hit
    setSpeech({ id: nextId(), text: HIT_LINES[Math.floor(Math.random() * HIT_LINES.length)] });

    if (!endless && !peaceful) {
      setRemaining((r) => {
        const next = r - 1;
        if (next <= 0 && !endedRef.current) {
          endedRef.current = true;
          intervalsRef.current.forEach(clearInterval);
          intervalsRef.current = [];
          const elapsed = Date.now() - startTimeRef.current;
          setTimeout(() => onWin(elapsed), 250);
        }
        return next;
      });
    }

    // Teleport ahead by respawning
    respawn();
  };

  const triggerShake = () => {
    if (Date.now() < shieldUntil) return;
    setShaking(false);
    requestAnimationFrame(() => setShaking(true));
    setTimeout(() => setShaking(false), 500);
  };

  const handleMiss = () => {
    if (endedRef.current) return;
    if ((timed || superFast) && timeLeft <= 0) return;
    triggerShake();
    setCombo(0);
    // Trash talk on miss
    setSpeech({ id: nextId(), text: MISS_LINES[Math.floor(Math.random() * MISS_LINES.length)] });
  };

  const usePowerUp = (key: string) => {
    if (!itemsAllowed || endedRef.current) return;
    if ((inventory[key] ?? 0) <= 0) return;
    if (timed && itemsUsed >= TIMED_ITEM_LIMIT) return;

    onUsePowerUp(key);
    setItemsUsed((n) => n + 1);

    if (key === "slowmo") setSlowmoUntil(Date.now() + 5000);
    if (key === "freeze") setFreezeUntil(Date.now() + 3000);
    if (key === "magnet") setMagnetActive(true);
    if (key === "auto") setAutoActive(true);
    if (key === "shield") setShieldUntil(Date.now() + 10000);
    if (key === "doublevision") {
      setDoubleVisionUntil(Date.now() + 15000);
      setSecondary(makeTarget("normal", "Abdullah"));
    }
    if (key === "timewarp") setBonusTimeMs((b) => b + 5000);
  };

  // Auto-collector: simulate a click on the primary target
  useEffect(() => {
    if (!autoActive) return;
    const id = window.setInterval(() => {
      if (endedRef.current) return;
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      handleHit(
        { clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 },
        primary.variant
      );
    }, 5000);
    intervalsRef.current.push(id);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoActive, primary]);

  const progress = endless ? 0 : ((config.clicksToWin as number) - remaining) / (config.clicksToWin as number);
  const frozen = Date.now() < freezeUntil;
  const slowed = Date.now() < slowmoUntil;
  const shielded = Date.now() < shieldUntil;
  const showTimer = timed || superFast;
  const timerLow = showTimer && timeLeft < 3000;
  const timeUp = showTimer && timeLeft <= 0;

  const inRoundPowerups = POWERUPS.filter((p) => p.inRound && (!p.timedOnly || timed));

  const headerLabel = superFast
    ? "⚡ SUPER FAST"
    : endless
    ? `${config.emoji} ${config.name}`
    : timed
    ? `${config.emoji} ${config.name}`
    : `${config.emoji} ${config.name}`;

  // Calculate size for Phase 3 shrink (65%)
  const targetScale = currentPhase >= 3 ? 0.65 : 1;

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col h-[calc(100vh-2rem)]">
      <div className="flex items-center justify-between mb-4 gap-3">
        <button onClick={onExit} className="game-card rounded-full p-3">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 game-card rounded-2xl px-4 py-2">
          <div className="flex items-center justify-between text-sm font-bold mb-1">
            <span className="flex items-center gap-1">
              {endless && <Infinity className="w-4 h-4" />}
              {headerLabel}
            </span>
            <span className="tabular-nums">
              {endless 
                ? `${totalClicks} clicks`
                : `${(config.clicksToWin as number) - remaining}/${config.clicksToWin}`
              }
            </span>
          </div>
          {!endless && <ProgressBar value={progress} />}
          {endless && (
            <div className="text-xs text-muted-foreground mt-1">
              Speed: {(speedMultiplier * 100).toFixed(0)}%
              {isHardOrExtreme && ` • Phase ${currentPhase}`}
            </div>
          )}
        </div>
        <CoinBadge coins={coins} />
      </div>

      {showTimer && (
        <div className={cn(
          "mb-3 text-center game-card rounded-2xl py-2 font-extrabold tabular-nums text-3xl transition-all",
          timerLow ? "text-destructive animate-pulse" : "neon-text",
          catchFlash && "scale-105"
        )}>
          ⏱ {(timeLeft / 1000).toFixed(2)}s
          {shouldTimerReset && <span className="text-sm ml-2 text-accent">RESETS ON HIT!</span>}
          {timed && !endless && (
            <span className="ml-3 text-sm font-bold text-muted-foreground">
              Charges: {itemsUsed}/{TIMED_ITEM_LIMIT}
            </span>
          )}
        </div>
      )}

      <div
        ref={containerRef}
        className={cn(
          "relative flex-1 game-card rounded-3xl overflow-hidden border-4 transition-all",
          shielded ? "border-secondary/50" : "border-primary/20",
          shaking && "animate-shake",
          catchFlash && "ring-4 ring-accent/50"
        )}
      >
        {/* 3D chase scene */}
        <Chase3D
          moveIntervalMs={moveIntervalMs}
          frozen={frozen}
          slowed={slowed}
          magnet={magnetActive}
          gilded={gildedActive}
          disabled={timeUp || endedRef.current}
          inputRef={inputRef}
          primary={primary}
          secondary={secondary}
          decoys={decoys}
          speech={speech}
          targetScale={targetScale}
          currentPhase={currentPhase}
          isHardOrExtreme={isHardOrExtreme}
          onHit={handleHit}
          onMiss={handleMiss}
        />

        {/* On-screen joystick (mobile only via CSS) */}
        <Joystick
          disabled={timeUp || endedRef.current}
          onChange={(x, y) => { inputRef.current.x = x; inputRef.current.y = y; }}
        />

        {/* 2D overlay for floats / bursts / combo / badges */}
        <div className="absolute inset-0 pointer-events-none">
          <ParticleLayer
            bursts={bursts}
            onDone={(id) => setBursts((b) => b.filter((x) => x.id !== id))}
          />

          {floats.map((f) => (
            <div
              key={f.id}
              onAnimationEnd={() => setFloats((arr) => arr.filter((x) => x.id !== f.id))}
              className="absolute text-xl font-extrabold animate-float-up z-20"
              style={{ left: f.x, top: f.y, color: f.color, textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}
            >
              {f.text}
            </div>
          ))}

          <AnimatePresence>
            {combo >= 2 && (
              <motion.div
                initial={{ scale: 0, opacity: 0, y: -20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.5, opacity: 0 }}
                className="absolute top-4 left-1/2 -translate-x-1/2 z-20"
              >
                <div className={cn(
                  "px-5 py-2 rounded-full font-extrabold text-2xl neon-text",
                  combo >= 5 ? "bg-accent text-accent-foreground" : combo >= 3 ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                )}>
                  COMBO ×{combo}
                  {combo >= 5 && <span className="text-sm ml-2">1.5× COINS</span>}
                  {combo >= 3 && combo < 5 && <span className="text-sm ml-2">1.2× COINS</span>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Phase indicator for Hard/Extreme */}
          {isHardOrExtreme && (
            <div className="absolute top-4 right-4 z-20">
              <div className={cn(
                "px-3 py-1 rounded-full font-bold text-sm",
                currentPhase === 4 ? "bg-destructive text-destructive-foreground animate-pulse" :
                currentPhase === 3 ? "bg-accent text-accent-foreground" :
                currentPhase === 2 ? "bg-secondary text-secondary-foreground" :
                "bg-muted text-muted-foreground"
              )}>
                {currentPhase === 4 ? "GOD MODE" :
                 currentPhase === 3 ? "Phase 3" :
                 currentPhase === 2 ? "Phase 2" : "Phase 1"}
              </div>
            </div>
          )}

          <div className="absolute bottom-3 left-3 flex flex-col gap-2 z-20">
            {frozen && <Badge>❄️ FROZEN</Badge>}
            {slowed && <Badge>🐢 SLOW-MO</Badge>}
            {magnetActive && <Badge>🧲 MAGNET</Badge>}
            {autoActive && <Badge>🤖 AUTO</Badge>}
            {shielded && <Badge>🛡 SHIELD</Badge>}
            {Date.now() < doubleVisionUntil && <Badge>👯 DOUBLE</Badge>}
            {luckActive && <Badge>🍀 LUCKY</Badge>}
            {gildedActive && <Badge>👑 GILDED 2×</Badge>}
            {timed && !endless && <Badge>⏱ Charges {itemsUsed}/{TIMED_ITEM_LIMIT}</Badge>}
            {endless && <Badge>∞ ENDLESS</Badge>}
          </div>
        </div>
      </div>

      {itemsAllowed && (
        <div className="mt-4 flex gap-2 justify-center flex-wrap">
          {inRoundPowerups.map((p) => {
            const count = inventory[p.key] ?? 0;
            const limitReached = timed && itemsUsed >= TIMED_ITEM_LIMIT;
            const disabled =
              count <= 0 ||
              limitReached ||
              (p.key === "magnet" && magnetActive) ||
              (p.key === "auto" && autoActive);
            return (
              <button
                key={p.key}
                onClick={() => usePowerUp(p.key)}
                disabled={disabled}
                title={p.name}
                className={cn(
                  "game-card rounded-2xl px-4 py-3 font-bold transition-all hover:-translate-y-0.5",
                  "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                )}
              >
                <div className="text-2xl">{p.emoji}</div>
                <div className="text-xs mt-1">x{count}</div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const Badge = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-card/90 backdrop-blur-sm text-foreground px-3 py-1 rounded-full font-bold text-xs shadow-[var(--shadow-soft)] border border-border">
    {children}
  </div>
);
