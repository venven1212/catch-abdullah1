import { useState } from "react";
import { motion } from "framer-motion";
import { Trophy, AlertTriangle } from "lucide-react";
import { 
  submitLeaderboardScore, 
  mapLevelToLeaderboard,
  LeaderboardHub,
  LeaderboardDifficulty
} from "@/lib/supabase";
import { formatTime } from "@/lib/game";

interface ScoreSubmitModalProps {
  playerName: string;
  score: number; // Time in ms for standard, clicks for timed/endless
  difficulty: string; // Level key (e.g., "easy", "tEasy", "endlessEasy")
  isEndless: boolean;
  isLabMode?: boolean; // If Lab Mode is active, prevent submission
  onComplete: () => void;
  onChangeName: () => void;
}

export const ScoreSubmitModal = ({
  playerName,
  score,
  difficulty,
  isEndless,
  isLabMode = false,
  onComplete,
  onChangeName,
}: ScoreSubmitModalProps) => {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Map the level key to hub and difficulty
  const leaderboardMapping = mapLevelToLeaderboard(difficulty);
  
  // Determine if this is a standard mode (time-based) or score-based
  const isStandardMode = leaderboardMapping?.hub === 'STANDARD';

  const handleSubmit = async () => {
    // Prevent submission if Lab Mode is active
    if (isLabMode) {
      setError("Cannot submit scores while Lab Mode is active!");
      return;
    }

    if (!leaderboardMapping) {
      setError("Invalid game mode for leaderboard");
      return;
    }

    setSubmitting(true);
    setError(null);
    
    // Prepare the entry based on hub type
    const entry: {
      user_name: string;
      hub: LeaderboardHub;
      difficulty: LeaderboardDifficulty;
      score?: number;
      time_taken?: number;
    } = {
      user_name: playerName,
      hub: leaderboardMapping.hub,
      difficulty: leaderboardMapping.difficulty,
    };

    // Standard mode uses time_taken (convert ms to seconds)
    // Timed Trial and Mountain use score
    if (isStandardMode) {
      entry.time_taken = score / 1000; // Convert ms to seconds
    } else {
      entry.score = score;
    }
    
    const success = await submitLeaderboardScore(entry);
    
    setSubmitting(false);
    
    if (success) {
      setSubmitted(true);
      setTimeout(onComplete, 1500);
    } else {
      setError("Failed to submit score. Try again!");
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const formatScoreDisplay = () => {
    if (isStandardMode) {
      return formatTime(score);
    }
    return `${score} clicks`;
  };

  const getHubLabel = () => {
    if (!leaderboardMapping) return 'Unknown';
    switch (leaderboardMapping.hub) {
      case 'STANDARD': return 'Standard';
      case 'TIMED_TRIAL': return 'Timed Trial';
      case 'MOUNTAIN': return 'Mountain';
      default: return leaderboardMapping.hub;
    }
  };

  const getDifficultyLabel = () => {
    if (!leaderboardMapping) return difficulty;
    return leaderboardMapping.difficulty.charAt(0) + leaderboardMapping.difficulty.slice(1).toLowerCase();
  };

  return (
    <div className="fixed inset-0 z-[60] bg-background/90 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="game-card rounded-3xl p-8 max-w-md w-full text-center neon-border"
      >
        {/* Lab Mode Warning */}
        {isLabMode && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-destructive/20 border border-destructive/40 rounded-2xl p-4 mb-6"
          >
            <div className="flex items-center justify-center gap-2 text-destructive font-bold mb-2">
              <AlertTriangle className="w-5 h-5" />
              LAB MODE ACTIVE
            </div>
            <p className="text-destructive/80 text-sm">
              Scores cannot be submitted while Lab Mode settings are active.
            </p>
          </motion.div>
        )}

        {submitted ? (
          <>
            <div className="text-6xl mb-4 animate-bounce">
              <Trophy className="w-16 h-16 mx-auto text-primary" />
            </div>
            <h2 className="text-3xl font-bold mb-2 neon-text">Score Submitted!</h2>
            <p className="text-muted-foreground">Check the leaderboard to see your ranking!</p>
          </>
        ) : (
          <>
            <div className="text-6xl mb-4">
              <Trophy className="w-16 h-16 mx-auto text-primary" />
            </div>
            <h2 className="text-3xl font-bold mb-2 neon-text">Submit to Leaderboard?</h2>
            
            <div className="bg-muted rounded-2xl p-4 mb-4">
              <div className="text-sm text-muted-foreground mb-1">Your Score</div>
              <div className="text-3xl font-extrabold text-accent">{formatScoreDisplay()}</div>
              <div className="text-sm text-muted-foreground mt-2">
                as <span className="font-bold text-foreground">{playerName}</span>
              </div>
              
              {/* Show bracket info */}
              {leaderboardMapping && (
                <div className="flex items-center justify-center gap-2 mt-3">
                  <span className="px-2 py-1 rounded-full text-xs font-bold bg-primary/20 text-primary">
                    {getHubLabel()}
                  </span>
                  <span className="px-2 py-1 rounded-full text-xs font-bold bg-secondary/20 text-secondary">
                    {getDifficultyLabel()}
                  </span>
                </div>
              )}
            </div>

            {error && (
              <div className="text-destructive text-sm font-semibold mb-4 flex items-center justify-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {error}
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={handleSubmit}
                disabled={submitting || isLabMode}
                className="w-full hero-gradient text-primary-foreground font-extrabold py-4 rounded-2xl shadow-[var(--shadow-glow)] hover:scale-[1.02] transition-transform disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {submitting ? "Submitting..." : isLabMode ? "Lab Mode Active" : "Submit Score"}
              </button>
              
              <div className="flex gap-3">
                <button
                  onClick={onChangeName}
                  disabled={submitting}
                  className="flex-1 bg-muted text-foreground font-bold py-3 rounded-2xl hover:bg-muted/70 transition-colors disabled:opacity-50"
                >
                  Change Name
                </button>
                <button
                  onClick={handleSkip}
                  disabled={submitting}
                  className="flex-1 bg-muted text-muted-foreground font-bold py-3 rounded-2xl hover:bg-muted/70 transition-colors disabled:opacity-50"
                >
                  Skip
                </button>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};
