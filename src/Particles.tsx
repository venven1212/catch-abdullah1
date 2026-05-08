import { motion, AnimatePresence } from "framer-motion";
import { useMemo } from "react";

interface ParticleBurstProps {
  id: number;
  x: number;
  y: number;
  color?: string;
  count?: number;
  onDone: (id: number) => void;
}

export const ParticleBurst = ({ id, x, y, color = "hsl(var(--accent))", count = 12, onDone }: ParticleBurstProps) => {
  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2;
        const distance = 40 + Math.random() * 40;
        return {
          dx: Math.cos(angle) * distance,
          dy: Math.sin(angle) * distance,
          size: 6 + Math.random() * 6,
        };
      }),
    [count]
  );

  return (
    <div className="absolute pointer-events-none" style={{ left: x, top: y }}>
      {particles.map((p, i) => (
        <motion.div
          key={i}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{ x: p.dx, y: p.dy, opacity: 0, scale: 0.2 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          onAnimationComplete={i === 0 ? () => onDone(id) : undefined}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            background: color,
            boxShadow: `0 0 8px ${color}`,
            transform: "translate(-50%, -50%)",
          }}
        />
      ))}
    </div>
  );
};

interface ParticleLayerProps {
  bursts: { id: number; x: number; y: number; color?: string }[];
  onDone: (id: number) => void;
}

export const ParticleLayer = ({ bursts, onDone }: ParticleLayerProps) => (
  <AnimatePresence>
    {bursts.map((b) => (
      <ParticleBurst key={b.id} {...b} onDone={onDone} />
    ))}
  </AnimatePresence>
);
