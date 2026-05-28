import { supabase, GameSession, SessionVictory, VictoryStats } from './supabase';

// Game Session CRUD Functions

export async function createGameSession(
  userId: string,
  gameId: string,
  sessionData: {
    session_date?: string;
    duration_minutes?: number;
    player_count?: number;
    notes?: string;
  }
) {
  const { data, error } = await supabase
    .from('game_sessions')
    .insert({
      user_id: userId,
      game_id: gameId,
      session_date: sessionData.session_date || new Date().toISOString(),
      duration_minutes: sessionData.duration_minutes,
      player_count: sessionData.player_count,
      notes: sessionData.notes,
    })
    .select()
    .single();

  if (error) throw error;
  return data as GameSession;
}

export async function getUserGameSessions(userId: string) {
  const { data, error } = await supabase
    .from('game_sessions')
    .select(`
      *,
      game:shared_games(*),
      victories:session_victories(*)
    `)
    .eq('user_id', userId)
    .order('session_date', { ascending: false });

  if (error) throw error;
  return data as (GameSession & { game: any, victories: SessionVictory[] })[];
}

export async function getGameSession(sessionId: string) {
  const { data, error } = await supabase
    .from('game_sessions')
    .select(`
      *,
      game:shared_games(*),
      victories:session_victories(*)
    `)
    .eq('id', sessionId)
    .single();

  if (error) throw error;
  return data as GameSession & { game: any, victories: SessionVictory[] };
}

export async function updateGameSession(
  sessionId: string,
  updates: Partial<Pick<GameSession, 'session_date' | 'duration_minutes' | 'player_count' | 'notes'>>
) {
  const { data, error } = await supabase
    .from('game_sessions')
    .update(updates)
    .eq('id', sessionId)
    .select()
    .single();

  if (error) throw error;
  return data as GameSession;
}

export async function deleteGameSession(sessionId: string) {
  const { error } = await supabase
    .from('game_sessions')
    .delete()
    .eq('id', sessionId);

  if (error) throw error;
}

// Session Victory CRUD Functions

export async function addSessionVictory(
  sessionId: string,
  victoryData: {
    player_name: string;
    is_winner: boolean;
    score?: number;
    placement?: number;
  }
) {
  const { data, error } = await supabase
    .from('session_victories')
    .insert({
      session_id: sessionId,
      player_name: victoryData.player_name,
      is_winner: victoryData.is_winner,
      score: victoryData.score,
      placement: victoryData.placement,
    })
    .select()
    .single();

  if (error) throw error;
  return data as SessionVictory;
}

export async function addMultipleSessionVictories(
  sessionId: string,
  victories: Array<{
    player_name: string;
    is_winner: boolean;
    score?: number;
    placement?: number;
  }>
) {
  const victoryRecords = victories.map(victory => ({
    session_id: sessionId,
    player_name: victory.player_name,
    is_winner: victory.is_winner,
    score: victory.score,
    placement: victory.placement,
  }));

  const { data, error } = await supabase
    .from('session_victories')
    .insert(victoryRecords)
    .select();

  if (error) throw error;
  return data as SessionVictory[];
}

export async function updateSessionVictory(
  victoryId: string,
  updates: Partial<Pick<SessionVictory, 'player_name' | 'is_winner' | 'score' | 'placement'>>
) {
  const { data, error } = await supabase
    .from('session_victories')
    .update(updates)
    .eq('id', victoryId)
    .select()
    .single();

  if (error) throw error;
  return data as SessionVictory;
}

export async function deleteSessionVictory(victoryId: string) {
  const { error } = await supabase
    .from('session_victories')
    .delete()
    .eq('id', victoryId);

  if (error) throw error;
}

export async function getSessionVictories(sessionId: string) {
  const { data, error } = await supabase
    .from('session_victories')
    .select('*')
    .eq('session_id', sessionId)
    .order('placement', { ascending: true, nullsFirst: false });

  if (error) throw error;
  return data as SessionVictory[];
}

// Victory Statistics Functions

export async function getUserGameVictoryStats(userId: string, gameId: string): Promise<VictoryStats> {
  const { data, error } = await supabase.rpc('get_user_game_victory_stats', {
    user_id_param: userId,
    game_id_param: gameId
  });

  if (error) throw error;

  if (!data || data.length === 0) {
    return {
      total_sessions: 0,
      total_wins: 0,
      win_rate: 0,
      best_score: undefined,
      last_played: undefined,
    };
  }

  const stats = data[0];
  return {
    total_sessions: parseInt(stats.total_sessions) || 0,
    total_wins: parseInt(stats.total_wins) || 0,
    win_rate: parseFloat(stats.win_rate) || 0,
    best_score: stats.best_score || undefined,
    last_played: stats.last_played || undefined,
  };
}

export async function getUserOverallVictoryStats(userId: string) {
  const { data, error } = await supabase.rpc('get_user_overall_victory_stats', {
    user_id_param: userId
  });

  if (error) throw error;

  if (!data || data.length === 0) {
    return {
      total_sessions: 0,
      total_wins: 0,
      win_rate: 0,
      games_played: 0,
      last_session: undefined,
    };
  }

  const stats = data[0];
  return {
    total_sessions: parseInt(stats.total_sessions) || 0,
    total_wins: parseInt(stats.total_wins) || 0,
    win_rate: parseFloat(stats.win_rate) || 0,
    games_played: parseInt(stats.games_played) || 0,
    last_session: stats.last_session || undefined,
  };
}

// Utility Functions

export async function createGameSessionWithVictories(
  userId: string,
  gameId: string,
  sessionData: {
    session_date?: string;
    duration_minutes?: number;
    player_count?: number;
    notes?: string;
  },
  victories: Array<{
    player_name: string;
    is_winner: boolean;
    score?: number;
    placement?: number;
  }>
) {
  // Create the session first
  const session = await createGameSession(userId, gameId, sessionData);

  // Add all victories
  const sessionVictories = await addMultipleSessionVictories(session.id, victories);

  return {
    session,
    victories: sessionVictories,
  };
}

export async function getRecentGameSessions(userId: string, limit: number = 10) {
  const { data, error } = await supabase
    .from('game_sessions')
    .select(`
      *,
      game:shared_games(id, name, cover_image),
      victories:session_victories(*)
    `)
    .eq('user_id', userId)
    .order('session_date', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as (GameSession & { game: any, victories: SessionVictory[] })[];
}

export async function getUserWinStreak(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('game_sessions')
    .select(`
      id,
      session_date,
      victories:session_victories!inner(is_winner)
    `)
    .eq('user_id', userId)
    .eq('victories.is_winner', true)
    .order('session_date', { ascending: false })
    .limit(50); // Check last 50 sessions for streak

  if (error) throw error;

  let streak = 0;
  for (const session of data) {
    if (session.victories && session.victories.some(v => v.is_winner)) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

export async function getPlayerHeadToHeadStats(userId: string, playerName: string) {
  const { data, error } = await supabase
    .from('game_sessions')
    .select(`
      id,
      game:shared_games(name),
      victories:session_victories(player_name, is_winner)
    `)
    .eq('user_id', userId);

  if (error) throw error;

  // Filter sessions where both the user and target player participated
  const headToHeadSessions = data.filter(session => {
    const playerNames = session.victories?.map(v => v.player_name) || [];
    return playerNames.includes(playerName);
  });

  let userWins = 0;
  let playerWins = 0;
  let totalGames = headToHeadSessions.length;

  headToHeadSessions.forEach(session => {
    const userVictory = session.victories?.find(v => v.player_name !== playerName && v.is_winner);
    const playerVictory = session.victories?.find(v => v.player_name === playerName && v.is_winner);

    if (userVictory) userWins++;
    if (playerVictory) playerWins++;
  });

  return {
    totalGames,
    userWins,
    playerWins,
    userWinRate: totalGames > 0 ? (userWins / totalGames) * 100 : 0,
    playerWinRate: totalGames > 0 ? (playerWins / totalGames) * 100 : 0,
  };
}