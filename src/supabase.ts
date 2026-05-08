// Supabase replaced with Replit API server

export type LeaderboardHub = 'STANDARD' | 'TIMED_TRIAL' | 'MOUNTAIN';
export type LeaderboardDifficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'EXTREME';

export interface LeaderboardEntry {
  id?: number;
  user_name: string;
  hub: LeaderboardHub;
  difficulty: LeaderboardDifficulty;
  level?: number;
  score?: number;
  time_taken?: number;
  created_at?: string;
}

export interface LegacyLeaderboardEntry {
  id?: number;
  player_name: string;
  score: number;
  difficulty: string;
  created_at?: string;
}

const API_BASE = "/api";

export async function submitLeaderboardScore(entry: {
  user_name: string;
  hub: LeaderboardHub;
  difficulty: LeaderboardDifficulty;
  level?: number;
  score?: number;
  time_taken?: number;
}): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/leaderboard`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    });
    return res.ok;
  } catch (err) {
    console.error("Error submitting score:", err);
    return false;
  }
}

export async function getLeaderboardScores(
  hub: LeaderboardHub,
  difficulty: LeaderboardDifficulty,
  level?: number,
  limit: number = 10
): Promise<LeaderboardEntry[]> {
  try {
    const params = new URLSearchParams({ hub, difficulty, limit: String(limit) });
    if (level !== undefined) params.set("level", String(level));
    const res = await fetch(`${API_BASE}/leaderboard?${params}`);
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error("Error fetching leaderboard:", err);
    return [];
  }
}

export async function getHubTopScores(
  hub: LeaderboardHub,
  limit: number = 10
): Promise<LeaderboardEntry[]> {
  // Default to EASY difficulty for hub top scores
  return getLeaderboardScores(hub, 'EASY', undefined, limit);
}

// Legacy stubs
export async function submitScore(_entry: Omit<LegacyLeaderboardEntry, 'id' | 'created_at'>): Promise<boolean> {
  return false;
}
export async function getTopScores(_difficulty?: string, _limit: number = 10): Promise<LegacyLeaderboardEntry[]> {
  return [];
}
export async function getTopTimeScores(_difficulty: string, _limit: number = 10): Promise<LegacyLeaderboardEntry[]> {
  return [];
}
export async function getTopEndlessScores(_difficulty: string, _limit: number = 10): Promise<LegacyLeaderboardEntry[]> {
  return [];
}

export function mapLevelToLeaderboard(levelKey: string): { hub: LeaderboardHub; difficulty: LeaderboardDifficulty; level?: number } | null {
  if (['easy', 'medium', 'hard', 'extreme'].includes(levelKey)) {
    return {
      hub: 'STANDARD',
      difficulty: levelKey.toUpperCase() as LeaderboardDifficulty
    };
  }

  if (levelKey.startsWith('mountain')) {
    const match = levelKey.match(/mountain(\d+)_(timed|endless)/);
    if (match) {
      const levelNum = parseInt(match[1], 10);
      let difficulty: LeaderboardDifficulty;
      if (levelNum <= 3) difficulty = 'EASY';
      else if (levelNum <= 5) difficulty = 'MEDIUM';
      else if (levelNum <= 8) difficulty = 'HARD';
      else difficulty = 'EXTREME';
      return { hub: 'MOUNTAIN', difficulty, level: levelNum };
    }
  }

  if (levelKey.startsWith('endless') && !levelKey.includes('T')) {
    const base = levelKey.replace('endless', '').toUpperCase();
    const endlessDiffMap: Record<string, LeaderboardDifficulty> = {
      'EASY': 'EASY',
      'MEDIUM': 'MEDIUM',
      'HARD': 'HARD',
      'EXTREME': 'EXTREME',
    };
    const difficulty = endlessDiffMap[base];
    if (!difficulty) return null;
    return { hub: 'TIMED_TRIAL', difficulty };
  }

  if (levelKey.startsWith('t') || (levelKey.startsWith('endless') && levelKey.includes('T'))) {
    let base = levelKey;
    if (levelKey.startsWith('endlessT')) {
      base = levelKey.replace('endlessT', 't');
    }
    const diffMap: Record<string, LeaderboardDifficulty> = {
      'tEasy': 'EASY',
      'tMedium': 'MEDIUM',
      'tHard': 'HARD',
      'tExtreme': 'EXTREME'
    };
    if (diffMap[base]) {
      return { hub: 'TIMED_TRIAL', difficulty: diffMap[base] };
    }
  }

  return null;
}
