import { Canvas, useFrame } from "@react-three/fiber";
import { useRef, useState, useEffect, useCallback } from "react";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Heart, Timer, Mountain, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  MOUNTAIN_LEVELS, MOUNTAIN_MODES,
  MountainLevelKey, MountainModeKey,
  MountainLevelConfig, MountainModeConfig,
} from "@/lib/game";
import { Joystick } from "./Joystick";
import { loadAdmin } from "@/lib/admin";

/* ─── Constants ─────────────────────────────────────────────────── */
const PLAYER_SPEED   = 5;
const LANE_HALF      = 2.2;
const CATCH_X_TOL    = 1.15;
const ABD_Z_BASE     = 8;
const ABD_Z_SWING    = 2.8;
const SCROLL_DIVISOR = 30;
const TILE_COUNT     = 8;
const TILE_DEPTH     = 6;
const ROCK_COUNT     = 5;

/* ─── Types ─────────────────────────────────────────────────────── */
type FloatMsg = { id: number; text: string; color: string };

interface GRef {
  playerX: number;
  abdX: number;
  abdZ: number;
  abdBob: number;
  abdTargetX: number;
  abdXTimer: number;
  abdZPhase: number;
  altitude: number;
  hearts: number;
  timeLeft: number;
  shieldUntil: number;
  invincUntil: number;
  rocks: { x: number; y: number; z: number; active: boolean; rsx: number }[];
  rockSpawnTimer: number;
  over: boolean;
  canCatch: boolean;
}

/* ─── Background mountain peaks ─────────────────────────────────── */
const BG_PEAKS = [
  { x: -8,  z: -22, r: 4,   h: 10 },
  { x: -3,  z: -29, r: 6,   h: 15 },
  { x: 2,   z: -24, r: 5,   h: 12 },
  { x: 9,   z: -20, r: 3.5, h: 9  },
  { x: -15, z: -31, r: 5,   h: 13 },
  { x: 15,  z: -26, r: 4.5, h: 11 },
  { x: 5,   z: -36, r: 8,   h: 20 },
  { x: -6,  z: -33, r: 7,   h: 18 },
  { x: 11,  z: -42, r: 6,   h: 16 },
];

function BackgroundMountains() {
  return (
    <>
      {BG_PEAKS.map((p, i) => (
        <group key={i} position={[p.x, 0, p.z]}>
          <mesh>
            <coneGeometry args={[p.r, p.h, 7]} />
            <meshStandardMaterial
              color="#050d1e"
              emissive="#0d1e3a"
              emissiveIntensity={0.6}
            />
          </mesh>
          <mesh position={[0, p.h * 0.44, 0]}>
            <coneGeometry args={[p.r * 0.2, p.h * 0.2, 6]} />
            <meshStandardMaterial
              color="#223366"
              emissive="#4466ff"
              emissiveIntensity={3.5}
            />
          </mesh>
        </group>
      ))}
    </>
  );
}

/* ─── 3D Scene (runs inside Canvas) ─────────────────────────────── */
interface SceneProps {
  g: React.MutableRefObject<GRef>;
  inputRef: React.MutableRefObject<{ x: number }>;
  keysRef: React.MutableRefObject<Set<string>>;
  levelConfig: MountainLevelConfig;
  modeConfig: MountainModeConfig;
  mode: MountainModeKey;
  speedMult: number;
  hazardDensity: number;
  godMode: boolean;
  onUpdate: (alt: number, hearts: number, time: number, canCatch: boolean) => void;
  onHit: (shielded: boolean) => void;
  onEnd: (won: boolean, alt: number) => void;
}

function Scene({
  g, inputRef, keysRef,
  levelConfig, modeConfig, mode,
  speedMult, hazardDensity, godMode,
  onUpdate, onHit, onEnd,
}: SceneProps) {
  const playerRef   = useRef<THREE.Mesh>(null);
  const playerRing  = useRef<THREE.Mesh>(null);
  const abdRef      = useRef<THREE.Mesh>(null);
  const abdGlowRef  = useRef<THREE.Mesh>(null);
  const abdLightRef = useRef<THREE.PointLight>(null);
  const tileRefs    = useRef<(THREE.Mesh | null)[]>([]);
  const rockRefs    = useRef<(THREE.Mesh | null)[]>([]);
  const syncTimer   = useRef(0);
  const ended       = useRef(false);

  const scrollSpd = (levelConfig.scrollSpeed / SCROLL_DIVISOR) * speedMult;

  const doEnd = useCallback((won: boolean, gd: GRef) => {
    if (ended.current) return;
    ended.current = true;
    gd.over = true;
    onEnd(won, Math.floor(gd.altitude));
  }, [onEnd]);

  useFrame(({ camera }, rawDelta) => {
    const gd = g.current;
    if (gd.over) return;
    const dt = Math.min(rawDelta, 0.05);

    /* ── Input ────────────────────────────────────────────────── */
    let ix = inputRef.current.x;
    if (keysRef.current.has("ArrowLeft")  || keysRef.current.has("a")) ix -= 1;
    if (keysRef.current.has("ArrowRight") || keysRef.current.has("d")) ix += 1;
    ix = Math.max(-1, Math.min(1, ix));

    /* ── Player ───────────────────────────────────────────────── */
    gd.playerX = Math.max(-LANE_HALF, Math.min(LANE_HALF, gd.playerX + ix * PLAYER_SPEED * dt));
    if (playerRef.current) {
      playerRef.current.position.x = gd.playerX;
      playerRef.current.rotation.y += dt * 2.5;
    }
    if (playerRing.current) playerRing.current.position.x = gd.playerX;

    /* ── Camera follows player X ──────────────────────────────── */
    camera.position.x += (gd.playerX * 0.22 - camera.position.x) * 0.08;

    /* ── Abdullah position (scales with level) ───────────────── */
    const lvl = levelConfig.level; // 1–10
    const abdLerpSpd  = 2.0 + (lvl - 1) * 0.22;          // 2.0 → 3.98
    const abdTimerMin = Math.max(0.5, 1.8 - (lvl - 1) * 0.1); // 1.8 → 0.9
    const abdTimerRng = Math.max(0.3, 2.0 - (lvl - 1) * 0.15); // 2.0 → 0.65
    const abdZSwing   = 2.3 + (lvl - 1) * 0.3;            // 2.3 → 5.0

    gd.abdBob    += dt * 2.8;
    gd.abdXTimer -= dt;
    if (gd.abdXTimer <= 0) {
      gd.abdTargetX = (Math.random() * 2 - 1) * LANE_HALF;
      gd.abdXTimer  = abdTimerMin + Math.random() * abdTimerRng;
    }
    gd.abdX    += (gd.abdTargetX - gd.abdX) * dt * abdLerpSpd;
    gd.abdZPhase += dt * 0.55;
    gd.abdZ     = ABD_Z_BASE + Math.sin(gd.abdZPhase) * abdZSwing;

    const awx = gd.abdX;
    const awy = 0.5 + Math.sin(gd.abdBob) * 0.22;
    const awz = -gd.abdZ;

    if (abdRef.current) {
      abdRef.current.position.set(awx, awy, awz);
      abdRef.current.rotation.y += dt * 3.5;
    }
    if (abdGlowRef.current) {
      const pulse = 1 + Math.sin(gd.abdBob * 2) * 0.15;
      abdGlowRef.current.position.set(awx, awy, awz);
      abdGlowRef.current.scale.setScalar(pulse);
    }
    if (abdLightRef.current) {
      abdLightRef.current.position.set(awx, awy + 0.6, awz);
    }

    /* ── Can Catch detection ──────────────────────────────────── */
    const xAligned = Math.abs(gd.abdX - gd.playerX) < CATCH_X_TOL;
    const zClose   = gd.abdZ < (ABD_Z_BASE - ABD_Z_SWING + 1.8);
    gd.canCatch = xAligned && zClose;

    /* ── Terrain scroll ───────────────────────────────────────── */
    tileRefs.current.forEach(t => {
      if (!t) return;
      t.position.z += scrollSpd * dt;
      if (t.position.z > 8) t.position.z -= TILE_DEPTH * TILE_COUNT;
    });

    /* ── Rock spawning & movement ─────────────────────────────── */
    const spawnInt = 1 / (levelConfig.rockFrequency * speedMult * Math.max(0.2, hazardDensity));
    gd.rockSpawnTimer += dt;
    if (gd.rockSpawnTimer >= spawnInt) {
      gd.rockSpawnTimer = 0;
      const fi = gd.rocks.findIndex(r => !r.active);
      if (fi >= 0) {
        gd.rocks[fi] = {
          x: (Math.random() * 2 - 1) * LANE_HALF,
          y: 4.5 + Math.random() * 2,
          z: -14 - Math.random() * 4,
          active: true,
          rsx: (Math.random() - 0.5) * 0.35,
        };
      }
    }

    const nowMs    = Date.now();
    const shielded = nowMs < gd.shieldUntil;
    const invinc   = nowMs < gd.invincUntil;

    gd.rocks.forEach((rock, i) => {
      const rm = rockRefs.current[i];
      if (!rock.active) {
        if (rm) rm.visible = false;
        return;
      }

      rock.z += scrollSpd * 1.5 * dt;
      rock.y  = Math.max(0.44, rock.y - 4.2 * dt);
      rock.x  = Math.max(-LANE_HALF, Math.min(LANE_HALF, rock.x + rock.rsx * scrollSpd * dt));

      if (rm) {
        rm.visible = true;
        rm.position.set(rock.x, rock.y, rock.z);
        rm.rotation.x += dt * 5;
        rm.rotation.z += dt * 3;
      }

      /* Collision check */
      if (rock.z > 0 && rock.z < 2.8 && rock.y < 1.1 && !godMode) {
        if (Math.abs(rock.x - gd.playerX) < 0.85) {
          rock.active = false;
          if (!invinc) {
            gd.invincUntil = nowMs + 1200;
            if (!shielded) {
              if (mode === "mountainTimed") {
                const pen = (modeConfig.hazardPenaltySeconds ?? 5) * 1000;
                gd.timeLeft = Math.max(0, gd.timeLeft - pen);
                if (gd.timeLeft <= 0) { doEnd(false, gd); return; }
              } else {
                gd.hearts = Math.max(0, gd.hearts - 1);
                if (gd.hearts <= 0) { doEnd(false, gd); return; }
              }
              onHit(false);
            } else {
              onHit(true);
            }
          }
        }
      }
      if (rock.z > 4.5) rock.active = false;
    });

    /* ── Altitude & timer ─────────────────────────────────────── */
    gd.altitude += scrollSpd * 12 * dt;
    if (mode === "mountainTimed") {
      gd.timeLeft -= dt * 1000;
      if (gd.timeLeft <= 0) { doEnd(true, gd); return; }
    }

    /* ── Sync UI (every ~150 ms) ──────────────────────────────── */
    syncTimer.current += dt;
    if (syncTimer.current >= 0.15) {
      syncTimer.current = 0;
      onUpdate(Math.floor(gd.altitude), gd.hearts, gd.timeLeft, gd.canCatch);
    }
  });

  return (
    <>
      {/* ── Lighting ──────────────────────────────────────────── */}
      <ambientLight intensity={0.65} color="#bbd0ff" />
      <directionalLight position={[4, 14, 6]} intensity={1.4} color="#ccd8ff" castShadow />
      <directionalLight position={[-6, 8, -4]} intensity={0.5} color="#aabbee" />
      <pointLight position={[0, 9, 4]} intensity={2.0} color="#4466cc" distance={40} />
      <pointLight ref={abdLightRef} intensity={5} color="#00ccff" distance={12} />
      <fog attach="fog" args={["#0a1428", 18, 50]} />

      <BackgroundMountains />

      {/* ── Ground tiles ──────────────────────────────────────── */}
      {Array.from({ length: TILE_COUNT }).map((_, i) => (
        <mesh
          key={i}
          ref={el => { tileRefs.current[i] = el; }}
          position={[0, 0, 4 - i * TILE_DEPTH]}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <planeGeometry args={[10, TILE_DEPTH]} />
          <meshStandardMaterial
            color={i % 2 === 0 ? "#1a2540" : "#1e2e4e"}
            emissive={i % 2 === 0 ? "#0a1428" : "#0d1932"}
            emissiveIntensity={0.4}
          />
        </mesh>
      ))}

      {/* ── Centre lane stripe ────────────────────────────────── */}
      <mesh position={[0, 0.01, -10]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.05, 54]} />
        <meshStandardMaterial
          color="#1a44aa"
          emissive="#2255ff"
          emissiveIntensity={2.5}
          transparent
          opacity={0.55}
          depthWrite={false}
        />
      </mesh>

      {/* ── Player sphere ─────────────────────────────────────── */}
      <mesh ref={playerRef} position={[0, 0.42, 1]} castShadow>
        <sphereGeometry args={[0.36, 28, 28]} />
        <meshStandardMaterial
          color="#ff7700"
          emissive="#ff4400"
          emissiveIntensity={3.2}
          metalness={0.25}
          roughness={0.3}
        />
      </mesh>
      {/* Player glow ring on ground */}
      <mesh ref={playerRing} position={[0, 0.015, 1]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.4, 0.6, 36]} />
        <meshStandardMaterial
          color="#ff6600"
          emissive="#ff4400"
          emissiveIntensity={2.8}
          transparent
          opacity={0.45}
          depthWrite={false}
        />
      </mesh>

      {/* ── Abdullah — glowing chase target ───────────────────── */}
      <mesh ref={abdRef} position={[0, 0.5, -ABD_Z_BASE]} castShadow>
        <sphereGeometry args={[0.4, 36, 36]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#00aaff"
          emissiveIntensity={5.5}
          metalness={0.5}
          roughness={0.1}
        />
      </mesh>
      {/* Outer glow shell */}
      <mesh ref={abdGlowRef} position={[0, 0.5, -ABD_Z_BASE]}>
        <sphereGeometry args={[0.58, 18, 18]} />
        <meshStandardMaterial
          color="#00ccff"
          emissive="#00aaff"
          emissiveIntensity={2.5}
          transparent
          opacity={0.18}
          depthWrite={false}
          side={THREE.BackSide}
        />
      </mesh>

      {/* ── Rocks ─────────────────────────────────────────────── */}
      {Array.from({ length: ROCK_COUNT }).map((_, i) => (
        <mesh key={i} ref={el => { rockRefs.current[i] = el; }} visible={false} castShadow>
          <dodecahedronGeometry args={[0.44, 0]} />
          <meshStandardMaterial
            color="#0044cc"
            emissive="#0033ff"
            emissiveIntensity={3.5}
            roughness={0.4}
            metalness={0.6}
          />
        </mesh>
      ))}
    </>
  );
}

/* ─── Main exported component ───────────────────────────────────── */
interface MountainGameScreenProps {
  level: MountainLevelKey;
  mode: MountainModeKey;
  onGameEnd: (altitude: number, won: boolean) => void;
  onExit: () => void;
}

export const MountainGameScreen = ({
  level, mode, onGameEnd, onExit,
}: MountainGameScreenProps) => {
  const levelConfig: MountainLevelConfig = MOUNTAIN_LEVELS[level];
  const modeConfig: MountainModeConfig   = MOUNTAIN_MODES[mode];

  const admin         = loadAdmin();
  const speedMult     = admin.labMode?.targetSpeed ?? 1;
  const hazardDensity = (admin.labMode?.hazardDensity ?? 50) / 50;
  const godMode       = admin.labMode?.godMode ?? false;

  /* Shared mutable game state */
  const g = useRef<GRef>({
    playerX: 0,
    abdX: 0,
    abdZ: ABD_Z_BASE,
    abdBob: 0,
    abdTargetX: 0,
    abdXTimer: 0,
    abdZPhase: 0,
    altitude: 0,
    hearts: modeConfig.hearts,
    timeLeft: modeConfig.timerMs,
    shieldUntil: 0,
    invincUntil: 0,
    rocks: Array.from({ length: ROCK_COUNT }, () => ({
      x: 0, y: -20, z: -100, active: false, rsx: 0,
    })),
    rockSpawnTimer: 0,
    over: false,
    canCatch: false,
  });

  const inputRef = useRef<{ x: number }>({ x: 0 });
  const keysRef  = useRef<Set<string>>(new Set());

  /* UI state */
  const [altitude,    setAltitude]    = useState(0);
  const [hearts,      setHearts]      = useState(modeConfig.hearts);
  const [timeLeft,    setTimeLeft]    = useState(modeConfig.timerMs);
  const [canCatch,    setCanCatch]    = useState(false);
  const [floats,      setFloats]      = useState<FloatMsg[]>([]);
  const [shaking,     setShaking]     = useState(false);
  const [gameOver,    setGameOver]    = useState(false);
  const [catchReady,  setCatchReady]  = useState(true);
  const catchCooldownRef = useRef(0);
  const floatId = useRef(0);

  /* Keyboard */
  useEffect(() => {
    const dn = (e: KeyboardEvent) => keysRef.current.add(e.key);
    const up = (e: KeyboardEvent) => keysRef.current.delete(e.key);
    window.addEventListener("keydown", dn);
    window.addEventListener("keyup",   up);
    return () => {
      window.removeEventListener("keydown", dn);
      window.removeEventListener("keyup",   up);
    };
  }, []);

  const addFloat = useCallback((text: string, color: string) => {
    const id = ++floatId.current;
    setFloats(f => [...f, { id, text, color }]);
    setTimeout(() => setFloats(f => f.filter(x => x.id !== id)), 1400);
  }, []);

  const handleUpdate = useCallback((alt: number, h: number, t: number, cc: boolean) => {
    setAltitude(alt);
    setHearts(h);
    setTimeLeft(t);
    setCanCatch(cc);
  }, []);

  const handleHit = useCallback((shielded: boolean) => {
    if (shielded) {
      addFloat("BLOCKED!", "#00ccff");
    } else {
      addFloat(mode === "mountainTimed" ? "-5s!" : "-1 ❤️", "#ff3333");
      setShaking(true);
      setTimeout(() => setShaking(false), 380);
    }
  }, [addFloat, mode]);

  const handleEnd = useCallback((won: boolean, alt: number) => {
    setGameOver(true);
    setTimeout(() => onGameEnd(alt, won), 700);
  }, [onGameEnd]);

  const CATCH_COOLDOWN_MS = 1500;

  const handleCatch = useCallback(() => {
    if (!g.current.canCatch || g.current.over) return;
    const now = Date.now();
    if (now - catchCooldownRef.current < CATCH_COOLDOWN_MS) return; // spam guard
    catchCooldownRef.current = now;
    g.current.altitude += 85;
    addFloat("🎯 CAUGHT! +85m", "#00ffcc");
    setCatchReady(false);
    setTimeout(() => setCatchReady(true), CATCH_COOLDOWN_MS);
  }, [addFloat]);

  const shielded = Date.now() < g.current.shieldUntil;

  return (
    <div className={cn("w-full max-w-lg mx-auto flex flex-col", shaking && "animate-shake")}>
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-3 gap-2">
        <button onClick={onExit} className="game-card rounded-full p-3 flex-shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 game-card rounded-2xl px-4 py-2">
          <div className="flex items-center justify-between text-sm font-bold">
            <span className="flex items-center gap-1">
              <Mountain className="w-4 h-4" />
              {levelConfig.name}
            </span>
            <span className="neon-text tabular-nums">{altitude}m</span>
          </div>
        </div>
        <div className="game-card rounded-2xl px-3 py-2 flex-shrink-0">
          {mode === "mountainTimed" ? (
            <div className={cn(
              "flex items-center gap-1 font-bold tabular-nums text-sm",
              timeLeft < 10000 && "text-destructive animate-pulse"
            )}>
              <Timer className="w-4 h-4" />
              {(Math.max(0, timeLeft) / 1000).toFixed(1)}s
            </div>
          ) : (
            <div className="flex items-center gap-1">
              {Array.from({ length: modeConfig.hearts }).map((_, i) => (
                <Heart
                  key={i}
                  className={cn(
                    "w-4 h-4 transition-all",
                    i < hearts ? "text-destructive fill-destructive" : "text-muted-foreground"
                  )}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Shield indicator ──────────────────────────────── */}
      {shielded && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-accent/20 px-4 py-2 rounded-full border border-accent animate-pulse pointer-events-none">
          <Shield className="w-4 h-4 text-accent" />
          <span className="text-accent font-bold text-sm">SHIELD ACTIVE</span>
        </div>
      )}

      {/* ── 3D Canvas ─────────────────────────────────────── */}
      <div className="relative rounded-3xl overflow-hidden border-2 border-primary/20" style={{ height: 480 }}>

        {/* Abdullah label */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none select-none">
          <span className="text-[11px] font-bold text-[#00aaff]/70 tracking-widest uppercase">Abdullah</span>
          <span className="text-[#00aaff]/50 text-xs">↑ chase him!</span>
        </div>

        {/* Floating feedback texts */}
        <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center">
          <AnimatePresence>
            {floats.map(fl => (
              <motion.div
                key={fl.id}
                className="absolute font-extrabold text-xl drop-shadow-lg"
                style={{ color: fl.color }}
                initial={{ opacity: 1, y: 20, scale: 0.8 }}
                animate={{ opacity: 0, y: -80, scale: 1.3 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              >
                {fl.text}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* CATCH button — appears when in range */}
        <AnimatePresence>
          {canCatch && !gameOver && (
            catchReady ? (
              <motion.button
                key="catch-btn-ready"
                className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 px-8 py-4 rounded-2xl font-extrabold text-lg border-2 border-[#00ccff] text-[#00ccff] bg-black/40 backdrop-blur-sm select-none"
                style={{ boxShadow: "0 0 28px #00ccff, 0 0 60px #0066aa" }}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: [1, 1.07, 1], opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0 }}
                transition={{ scale: { repeat: Infinity, duration: 0.65 }, opacity: { duration: 0.15 } }}
                onPointerDown={(e) => { e.preventDefault(); handleCatch(); }}
              >
                🎯 CATCH ABDULLAH!
              </motion.button>
            ) : (
              <motion.div
                key="catch-btn-cooldown"
                className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 px-8 py-4 rounded-2xl font-extrabold text-lg border-2 border-white/20 text-white/30 bg-black/30 backdrop-blur-sm select-none pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                ⏳ Cooldown...
              </motion.div>
            )
          )}
        </AnimatePresence>

        <Canvas
          camera={{ position: [0, 3.8, 10], fov: 58 }}
          gl={{ antialias: true, alpha: false }}
          style={{ background: "#000810", width: "100%", height: "100%" }}
          shadows
        >
          <Scene
            g={g}
            inputRef={inputRef}
            keysRef={keysRef}
            levelConfig={levelConfig}
            modeConfig={modeConfig}
            mode={mode}
            speedMult={speedMult}
            hazardDensity={hazardDensity}
            godMode={godMode}
            onUpdate={handleUpdate}
            onHit={handleHit}
            onEnd={handleEnd}
          />
        </Canvas>
      </div>

      {/* ── Lab / God Mode indicators ─────────────────────── */}
      {godMode && (
        <div className="mt-2 text-center text-xs text-accent font-bold">
          ⚡ GOD MODE — Invincible
        </div>
      )}

      {/* ── Desktop hint ──────────────────────────────────── */}
      <div className="mt-2 text-center text-[11px] text-muted-foreground hidden md:block select-none">
        ← → or A/D to move · Align with Abdullah and press CATCH when he's close
      </div>

      {/* ── Joystick (mobile) ─────────────────────────────── */}
      <Joystick
        disabled={gameOver}
        onChange={(x) => { inputRef.current.x = x; }}
      />
    </div>
  );
};
