import { POWERUPS } from "@/lib/game";
import { CoinBadge } from "./CoinBadge";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface ShopProps {
  coins: number;
  inventory: Record<string, number>;
  luckRoundsLeft: number;
  onBuy: (key: string, cost: number) => void;
  onBack: () => void;
}

export const Shop = ({ coins, inventory, luckRoundsLeft, onBuy, onBack }: ShopProps) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="w-full max-w-3xl mx-auto"
  >
    <div className="flex items-center justify-between mb-6">
      <button onClick={onBack} className="game-card rounded-full p-3 hover:-translate-x-1 transition-transform">
        <ArrowLeft className="w-5 h-5" />
      </button>
      <h2 className="text-3xl md:text-4xl font-bold neon-text">🛒 Power-Up Shop</h2>
      <CoinBadge coins={coins} />
    </div>

    <div className="grid gap-4">
      {POWERUPS.map((p, i) => {
        const owned = p.key === "luck" ? luckRoundsLeft : inventory[p.key] ?? 0;
        const ownedLabel = p.key === "luck" ? `${owned} rounds` : `x${owned}`;
        const canAfford = coins >= p.cost;
        return (
          <motion.div
            key={p.key}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="game-card rounded-3xl p-5 flex items-center gap-4"
          >
            <div className="text-5xl">{p.emoji}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 className="text-xl font-bold">{p.name}</h3>
                {owned > 0 && (
                  <span className="text-xs font-bold bg-success text-success-foreground px-2 py-0.5 rounded-full">
                    {ownedLabel}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{p.description}</p>
            </div>
            <button
              onClick={() => {
                if (!canAfford) {
                  toast.error("Not enough coins!");
                  return;
                }
                onBuy(p.key, p.cost);
                toast.success(`${p.name} purchased!`);
              }}
              disabled={!canAfford}
              className="hero-gradient text-primary-foreground font-bold px-5 py-3 rounded-2xl shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-glow)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 shrink-0"
            >
              🪙 {p.cost}
            </button>
          </motion.div>
        );
      })}
    </div>
  </motion.div>
);
