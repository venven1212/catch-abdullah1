import { useEffect, useRef, useState } from "react";

interface JoystickProps {
  /** Updated in place each move — read by 3D loop without re-rendering */
  onChange: (x: number, y: number) => void;
  disabled?: boolean;
}

/** Semi-transparent on-screen joystick (touch + mouse). */
export const Joystick = ({ onChange, disabled }: JoystickProps) => {
  const baseRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const activeId = useRef<number | null>(null);

  useEffect(() => {
    if (disabled) {
      onChange(0, 0);
      setPos(null);
      activeId.current = null;
    }
  }, [disabled, onChange]);

  const RADIUS = 48;

  const handleMove = (clientX: number, clientY: number) => {
    const el = baseRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const m = Math.hypot(dx, dy);
    if (m > RADIUS) { dx = (dx / m) * RADIUS; dy = (dy / m) * RADIUS; }
    setPos({ x: dx, y: dy });
    // Y axis: up on screen = forward (positive)
    onChange(dx / RADIUS, -dy / RADIUS);
  };

  const release = () => {
    setPos(null);
    activeId.current = null;
    onChange(0, 0);
  };

  if (disabled) return null;

  return (
    <div
      ref={baseRef}
      onPointerDown={(e) => {
        (e.target as Element).setPointerCapture?.(e.pointerId);
        activeId.current = e.pointerId;
        handleMove(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (activeId.current !== e.pointerId) return;
        handleMove(e.clientX, e.clientY);
      }}
      onPointerUp={() => release()}
      onPointerCancel={() => release()}
      className="md:hidden fixed bottom-6 left-6 z-30 w-32 h-32 rounded-full bg-card/40 backdrop-blur-md border-2 border-primary/40 shadow-[var(--shadow-soft)] touch-none select-none"
      style={{ touchAction: "none" }}
      aria-label="Movement joystick"
    >
      <div
        className="absolute top-1/2 left-1/2 w-14 h-14 -mt-7 -ml-7 rounded-full bg-primary/80 border-2 border-primary-foreground/60 shadow-lg transition-transform"
        style={{
          transform: pos ? `translate(${pos.x}px, ${pos.y}px)` : "translate(0px, 0px)",
        }}
      />
    </div>
  );
};
