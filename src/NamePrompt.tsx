import { useState } from "react";
import { motion } from "framer-motion";

interface NamePromptProps {
  onSubmit: (name: string) => void;
  title?: string;
  subtitle?: string;
}

export const NamePrompt = ({ 
  onSubmit, 
  title = "Enter Your Name",
  subtitle = "This will be shown on the leaderboard" 
}: NamePromptProps) => {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError("Name must be at least 2 characters");
      return;
    }
    if (trimmed.length > 20) {
      setError("Name must be 20 characters or less");
      return;
    }
    onSubmit(trimmed);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="game-card rounded-3xl p-8 max-w-md w-full text-center neon-border"
      >
        <div className="text-6xl mb-4">👤</div>
        <h2 className="text-3xl font-bold mb-2 neon-text">{title}</h2>
        <p className="text-muted-foreground mb-6">{subtitle}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
              placeholder="Your name..."
              maxLength={20}
              autoFocus
              className="w-full px-4 py-3 rounded-2xl bg-muted border-2 border-border text-foreground font-bold text-lg text-center focus:outline-none focus:border-primary transition-colors"
            />
            {error && (
              <p className="text-destructive text-sm mt-2 font-semibold">{error}</p>
            )}
          </div>
          
          <button
            type="submit"
            disabled={name.trim().length < 2}
            className="w-full hero-gradient text-primary-foreground font-extrabold py-4 rounded-2xl shadow-[var(--shadow-glow)] hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            Start Playing
          </button>
        </form>
      </motion.div>
    </div>
  );
};
