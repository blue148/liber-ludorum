import { supabase } from './supabase';
import { UserLibraryEntry, Game } from './supabase';
import { getUserOverallVictoryStats } from './sessions';

export interface DashboardStats {
  totalGames: number;
  totalPlays: number;
  favoriteCount: number;
  unplayedCount: number;
  victoryStats?: {
    totalSessions: number;
    totalWins: number;
    winRate: number;
    gamesPlayed: number;
    lastSession?: string;
  };
}

export interface PlayedGameStat extends UserLibraryEntry {
  game: Game;
  playCount: number;
  victoryStats?: {
    totalSessions: number;
    totalWins: number;
    winRate: number;
  };
}

export interface PlayActivity {
  month: string;
  playCount: number;
}

/**
 * Get aggregate statistics for the user's library
 */
export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const { data, error } = await supabase
    .from('user_library')
    .select('id, is_favorite, played_dates')
    .eq('user_id', userId);

  if (error) throw error;

  const totalGames = data.length;
  const favoriteCount = data.filter(e => e.is_favorite).length;
  const totalPlays = data.reduce((sum, e) => sum + (e.played_dates?.length || 0), 0);
  const unplayedCount = data.filter(e => !e.played_dates || e.played_dates.length === 0).length;

  // Get victory statistics
  let victoryStats;
  try {
    const overallStats = await getUserOverallVictoryStats(userId);
    victoryStats = {
      totalSessions: overallStats.total_sessions,
      totalWins: overallStats.total_wins,
      winRate: overallStats.win_rate,
      gamesPlayed: overallStats.games_played,
      lastSession: overallStats.last_session,
    };
  } catch (error) {
    console.warn('Error fetching victory stats:', error);
    victoryStats = undefined;
  }

  return {
    totalGames,
    favoriteCount,
    totalPlays,
    unplayedCount,
    victoryStats,
  };
}

/**
 * Get the most played games with play counts
 */
export async function getMostPlayedGames(userId: string, limit = 10): Promise<PlayedGameStat[]> {
  const { data, error } = await supabase
    .from('user_library')
    .select('*, game:shared_games(*)')
    .eq('user_id', userId);

  if (error) throw error;

  // Calculate play counts and sort
  const withCounts = data.map(entry => ({
    ...entry,
    playCount: entry.played_dates?.length || 0,
  })) as PlayedGameStat[];

  return withCounts
    .sort((a, b) => b.playCount - a.playCount)
    .slice(0, limit);
}

/**
 * Get recently added games to the library
 */
export async function getRecentlyAddedGames(userId: string, limit = 10): Promise<PlayedGameStat[]> {
  const { data, error } = await supabase
    .from('user_library')
    .select('*, game:shared_games(*)')
    .eq('user_id', userId)
    .order('added_date', { ascending: false })
    .limit(limit);

  if (error) throw error;

  // Add play count for consistency
  return data.map(entry => ({
    ...entry,
    playCount: entry.played_dates?.length || 0,
  })) as PlayedGameStat[];
}

/**
 * Get play activity aggregated by month
 */
export async function getPlayActivityByMonth(userId: string, months = 12): Promise<PlayActivity[]> {
  // First, get all library entries with their played_dates
  const { data, error } = await supabase
    .from('user_library')
    .select('played_dates')
    .eq('user_id', userId);

  if (error) throw error;

  // Flatten all played_dates into a single array
  const allPlayDates: string[] = [];
  data.forEach(entry => {
    if (entry.played_dates && Array.isArray(entry.played_dates)) {
      allPlayDates.push(...entry.played_dates);
    }
  });

  // Group by month
  const monthCounts: { [key: string]: number } = {};
  allPlayDates.forEach(dateStr => {
    try {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
      }
    } catch (e) {
      // Skip invalid dates
    }
  });

  // Generate last N months
  const now = new Date();
  const result: PlayActivity[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;

    result.push({
      month: monthKey,
      playCount: monthCounts[monthKey] || 0,
    });
  }

  return result;
}
