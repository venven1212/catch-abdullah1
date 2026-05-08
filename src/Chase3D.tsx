import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, Sky } from "@react-three/drei";
import { useMemo, useRef, useState, useEffect } from "react";
import * as THREE from "three";

export type Chase3DVariant = "normal" | "golden" | "decoy";

export interface Chase3DTarget {
  id: string;
  variant: Chase3DVariant;
  label: string;
  laneSeed: number;
  forwardSeed: number;
}

export interface InputVector {
  x: number; // -1..1 strafe
  y: number; // -1..1 forward(+)/back(-)
}

interface Chase3DProps {
  moveIntervalMs: number;
  frozen: boolean;
  slowed: boolean;
  magnet: boolean;
  gilded: boolean;
  /** When true: no movement and no catching (timer expired) */
  disabled?: boolean;
  /** Live joystick / external input vector (mutated externally) */
  inputRef?: React.MutableRefObject<InputVector>;
  primary: Chase3DTarget;
  secondary?: Chase3DTarget | null;
  decoys: Chase3DTarget[];
  speech?: { id: number; text: string } | null;
  /** Scale factor for the target (0.65 for phase 3) */
  targetScale?: number;
  /** Current phase (1-4) for movement behavior */
  currentPhase?: number;
  /** Whether this is Hard/Extreme mode */
  isHardOrExtreme?: boolean;
  onHit: (e: { clientX: number; clientY: number }, variant: Chase3DVariant) => void;
  onMiss: () => void;
}

export const Chase3D = (props: Chase3DProps) => {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 3.2, 6], fov: 65 }}
      onPointerMissed={() => !props.disabled && props.onMiss()}
      gl={{ antialias: true }}
    >
      <Sky sunPosition={[80, 40, 20]} turbidity={4} rayleigh={1} />
      <hemisphereLight args={["#cfeaff", "#3b6e1e", 0.9]} />
      <directionalLight
        position={[20, 30, 10]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <World {...props} />
    </Canvas>
  );
};

const World = ({
  moveIntervalMs,
  frozen,
  slowed,
  magnet,
  gilded,
  disabled,
  inputRef,
  primary,
  secondary,
  decoys,
  speech,
  targetScale = 1,
  currentPhase = 1,
  isHardOrExtreme = false,
  onHit,
}: Chase3DProps) => {
  const playerRef = useRef(new THREE.Vector3(0, 0, 0));
  const camTargetRef = useRef(new THREE.Vector3(0, 1.2, -4));
  const { camera } = useThree();
  const keysRef = useRef<Record<string, boolean>>({});

  // Auto-forward chase speed (units/sec)
  const autoSpeed = useMemo(() => {
    const base = 3000 / Math.max(120, moveIntervalMs);
    return slowed ? base * 0.5 : base;
  }, [moveIntervalMs, slowed]);

  // Keyboard listeners (WASD + arrows)
  useEffect(() => {
    const down = (e: KeyboardEvent) => { keysRef.current[e.key.toLowerCase()] = true; };
    const up = (e: KeyboardEvent) => { keysRef.current[e.key.toLowerCase()] = false; };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  useFrame((_, dt) => {
    if (frozen || disabled) {
      // Still smooth-follow camera, but no movement
      const tx = playerRef.current.x;
      const tz = playerRef.current.z;
      camera.position.lerp(new THREE.Vector3(tx, 3.4, tz + 6.5), 0.1);
      camTargetRef.current.lerp(new THREE.Vector3(tx, 1.2, tz - 4), 0.1);
      camera.lookAt(camTargetRef.current);
      return;
    }

    // Read keyboard
    const k = keysRef.current;
    let inX = 0;
    let inY = 0;
    if (k["w"] || k["arrowup"]) inY += 1;
    if (k["s"] || k["arrowdown"]) inY -= 1;
    if (k["a"] || k["arrowleft"]) inX -= 1;
    if (k["d"] || k["arrowright"]) inX += 1;

    // Joystick input
    if (inputRef?.current) {
      inX += inputRef.current.x;
      inY += inputRef.current.y;
    }

    // Clamp
    const mag = Math.hypot(inX, inY);
    if (mag > 1) { inX /= mag; inY /= mag; }

    const manualSpeed = 8 * (slowed ? 0.5 : 1);
    // Auto-forward + manual control
    playerRef.current.z -= (autoSpeed + inY * manualSpeed) * dt;
    playerRef.current.x += inX * manualSpeed * dt;
    // Soft lateral clamp
    playerRef.current.x = THREE.MathUtils.clamp(playerRef.current.x, -18, 18);

    // Smooth chase cam
    const desired = new THREE.Vector3(playerRef.current.x, 3.4, playerRef.current.z + 6.5);
    camera.position.lerp(desired, 0.12);
    camTargetRef.current.lerp(
      new THREE.Vector3(playerRef.current.x, 1.2, playerRef.current.z - 4),
      0.15
    );
    camera.lookAt(camTargetRef.current);
  });

  const playerZ = () => playerRef.current.z;

  return (
    <>
      <InfiniteGround playerRef={playerRef} />
      <Ponds playerRef={playerRef} />
      <ScatterTrees playerRef={playerRef} />

      <Runner
        target={primary}
        gilded={gilded}
        magnet={magnet}
        playerZ={playerZ}
        speech={speech}
        disabled={disabled}
        targetScale={targetScale}
        currentPhase={currentPhase}
        isHardOrExtreme={isHardOrExtreme}
        onHit={(e) => !disabled && onHit(e, primary.variant)}
      />
      {secondary && (
        <Runner
          target={secondary}
          gilded={gilded}
          magnet={magnet}
          playerZ={playerZ}
          disabled={disabled}
          targetScale={targetScale}
          currentPhase={currentPhase}
          isHardOrExtreme={isHardOrExtreme}
          onHit={(e) => !disabled && onHit(e, secondary.variant)}
        />
      )}
      {decoys.map((d) => (
        <Runner
          key={d.id}
          target={d}
          gilded={false}
          magnet={magnet}
          playerZ={playerZ}
          disabled={disabled}
          targetScale={targetScale}
          currentPhase={currentPhase}
          isHardOrExtreme={isHardOrExtreme}
          onHit={(e) => !disabled && onHit(e, "decoy")}
        />
      ))}
    </>
  );
};

const InfiniteGround = ({ playerRef }: { playerRef: React.MutableRefObject<THREE.Vector3> }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (!meshRef.current) return;
    const z = Math.round(playerRef.current.z / 10) * 10;
    const x = Math.round(playerRef.current.x / 10) * 10;
    meshRef.current.position.set(x, 0, z);
  });
  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[600, 600, 1, 1]} />
      <meshStandardMaterial color="#5fbf3a" />
    </mesh>
  );
};

/** Several blue water ponds that recycle ahead */
const Ponds = ({ playerRef }: { playerRef: React.MutableRefObject<THREE.Vector3> }) => {
  const ponds = useMemo(() => {
    const arr: { x: number; z: number; rx: number; rz: number }[] = [];
    for (let i = 0; i < 10; i++) {
      arr.push({
        x: (Math.random() - 0.5) * 60,
        z: -Math.random() * 250 - 20,
        rx: 4 + Math.random() * 6,
        rz: 4 + Math.random() * 8,
      });
    }
    return arr;
  }, []);
  const groupRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.children.forEach((child) => {
      if (child.position.z > playerRef.current.z + 20) {
        child.position.z -= 280;
        child.position.x = playerRef.current.x + (Math.random() - 0.5) * 70;
      }
      // gentle ripple via scale bob
      const m = child as THREE.Mesh;
      const t = clock.elapsedTime + child.position.x;
      m.scale.y = 1 + Math.sin(t * 1.5) * 0.05;
    });
  });
  return (
    <group ref={groupRef}>
      {ponds.map((p, i) => (
        <mesh
          key={i}
          position={[p.x, 0.02, p.z]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[p.rx, p.rz, 1]}
          receiveShadow
        >
          <circleGeometry args={[1, 32]} />
          <meshStandardMaterial color="#2a8fd6" emissive="#1e4f7a" emissiveIntensity={0.25} metalness={0.2} roughness={0.3} transparent opacity={0.92} />
        </mesh>
      ))}
    </group>
  );
};

/** Lots of taller, varied trees — densely scattered, recycling behind player */
const ScatterTrees = ({ playerRef }: { playerRef: React.MutableRefObject<THREE.Vector3> }) => {
  const trees = useMemo(() => {
    const arr: { x: number; z: number; s: number; h: number; tall: boolean }[] = [];
    for (let i = 0; i < 140; i++) {
      arr.push({
        x: (Math.random() - 0.5) * 90,
        z: -Math.random() * 280 + 20,
        s: 0.9 + Math.random() * 1.4,
        h: Math.random(),
        tall: Math.random() < 0.45,
      });
    }
    return arr;
  }, []);
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.children.forEach((child) => {
      if (child.position.z > playerRef.current.z + 18) {
        child.position.z -= 280;
        child.position.x = playerRef.current.x + (Math.random() - 0.5) * 90;
      }
    });
  });

  return (
    <group ref={groupRef}>
      {trees.map((t, i) => {
        const trunkH = t.tall ? 3.2 : 1.6;
        const foliageY = trunkH + (t.tall ? 1.6 : 1.0);
        const foliageR = t.tall ? 1.6 : 1.1;
        const foliageH = t.tall ? 4.2 : 2.4;
        return (
          <group key={i} position={[t.x, 0, t.z]} scale={t.s}>
            <mesh position={[0, trunkH / 2, 0]} castShadow>
              <cylinderGeometry args={[0.22, 0.3, trunkH, 7]} />
              <meshStandardMaterial color="#7a4a22" />
            </mesh>
            <mesh position={[0, foliageY, 0]} castShadow>
              <coneGeometry args={[foliageR, foliageH, 8]} />
              <meshStandardMaterial color={t.h > 0.6 ? "#2e8a25" : t.h > 0.3 ? "#3f9a2e" : "#56c143"} />
            </mesh>
            {t.tall && (
              <mesh position={[0, foliageY + foliageH * 0.45, 0]} castShadow>
                <coneGeometry args={[foliageR * 0.7, foliageH * 0.55, 8]} />
                <meshStandardMaterial color="#3aa030" />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
};

const Runner = ({
  target,
  gilded,
  magnet,
  playerZ,
  speech,
  disabled,
  targetScale = 1,
  currentPhase = 1,
  isHardOrExtreme = false,
  onHit,
}: {
  target: Chase3DTarget;
  gilded: boolean;
  magnet: boolean;
  playerZ: () => number;
  speech?: { id: number; text: string } | null;
  disabled?: boolean;
  targetScale?: number;
  currentPhase?: number;
  isHardOrExtreme?: boolean;
  onHit: (e: { clientX: number; clientY: number }) => void;
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const [catchFlash, setCatchFlash] = useState(false);
  const basePositionRef = useRef({ x: 0, z: 0 });
  const yJumpRef = useRef(0);
  const lastJumpTimeRef = useRef(0);

  useEffect(() => {
    if (!groupRef.current) return;
    const lane = target.laneSeed * 4;
    const ahead = 8 + target.forwardSeed * 8;
    basePositionRef.current = { x: lane, z: playerZ() - ahead };
    groupRef.current.position.set(lane, 0, playerZ() - ahead);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target.id]);

  useFrame((state) => {
    if (!groupRef.current) return;
    if (disabled) return;

    const time = state.clock.elapsedTime;
    
    // Base bounce animation
    let yOffset = Math.abs(Math.sin(time * 8)) * 0.15;

    // Phase-based movement for Hard/Extreme modes
    if (isHardOrExtreme) {
      // Phase 1: Fast horizontal sine-wave movement (10+ units range)
      const sineAmplitude = 5; // ±5 units = 10+ units total range
      const sineSpeed = 3; // Fast movement
      const sineOffset = Math.sin(time * sineSpeed + target.laneSeed * Math.PI) * sineAmplitude;
      
      groupRef.current.position.x = basePositionRef.current.x + sineOffset;

      // Phase 4 (God Mode): Add random vertical Y-axis jumps
      if (currentPhase >= 4) {
        // Random Y jumps every ~0.5-1 seconds
        if (time - lastJumpTimeRef.current > 0.5 + Math.random() * 0.5) {
          lastJumpTimeRef.current = time;
          yJumpRef.current = Math.random() * 2; // Random height 0-2 units
        }
        // Smooth lerp to target Y
        const currentY = groupRef.current.position.y;
        const targetY = yOffset + yJumpRef.current;
        yOffset = THREE.MathUtils.lerp(currentY, targetY, 0.1);
      }
    }

    groupRef.current.position.y = yOffset;
  });

  const handleClick = (e: React.PointerEvent) => {
    if (disabled) return;
    e.stopPropagation();
    
    // Visual flash on catch
    setCatchFlash(true);
    setTimeout(() => setCatchFlash(false), 150);
    
    onHit({ clientX: e.nativeEvent.clientX, clientY: e.nativeEvent.clientY });
  };

  const headColor =
    target.variant === "golden" ? "#ffd24a"
    : target.variant === "decoy" ? "#b94a4a"
    : gilded ? "#ffd24a" : "#ffd1a8";

  const shirtColor =
    target.variant === "golden" ? "#ffb700"
    : target.variant === "decoy" ? "#7a1f1f"
    : gilded ? "#d99400" : "#3a78ff";

  const scale = (magnet ? 1.35 : 1.0) * targetScale;

  return (
    <group
      ref={groupRef}
      scale={scale}
      onPointerOver={(e) => {
        if (disabled) return;
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "";
      }}
      onClick={handleClick}
    >
      {/* 2x oversized invisible hitbox */}
      <mesh position={[0, 1.3, 0]}>
        <sphereGeometry args={[1.6, 12, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {/* Body */}
      <mesh position={[0, 0.9, 0]} castShadow>
        <capsuleGeometry args={[0.45, 0.9, 6, 12]} />
        <meshStandardMaterial 
          color={shirtColor} 
          emissive={catchFlash ? "#ffffff" : hovered ? shirtColor : "#000"} 
          emissiveIntensity={catchFlash ? 1 : hovered ? 0.4 : 0} 
        />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.95, 0]} castShadow>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshStandardMaterial
          color={headColor}
          emissive={catchFlash ? "#ffffff" : target.variant === "golden" || gilded ? "#ffb300" : "#000"}
          emissiveIntensity={catchFlash ? 1 : target.variant === "golden" ? 0.7 : gilded ? 0.35 : 0}
        />
      </mesh>
      <Html position={[0, 2.55, 0]} center distanceFactor={10} zIndexRange={[10, 0]}>
        <div className="pointer-events-none px-2 py-0.5 rounded-full bg-card/90 border border-border text-foreground text-xs font-extrabold whitespace-nowrap">
          {target.label}
        </div>
      </Html>
      {/* Speech bubble for trash talk */}
      {speech && target.variant !== "decoy" && (
        <Html key={speech.id} position={[0, 3.2, 0]} center distanceFactor={8} zIndexRange={[20, 0]}>
          <div className="pointer-events-none px-3 py-1.5 rounded-2xl bg-white text-slate-900 text-sm font-bold shadow-lg whitespace-nowrap relative animate-scale-in max-w-[220px]">
            {speech.text}
            <span className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-3 h-3 bg-white rotate-45" />
          </div>
        </Html>
      )}
    </group>
  );
};
