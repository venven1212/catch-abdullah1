interface CoinBadgeProps {
  coins: number;
}

export const CoinBadge = ({ coins }: CoinBadgeProps) => (
  <div className="flex items-center gap-2 rounded-full bg-coin px-4 py-2 text-coin-foreground shadow-[var(--shadow-coin)]">
    <span className="text-xl animate-coin-bounce">🪙</span>
    <span className="font-bold tabular-nums text-lg">{coins}</span>
  </div>
);
