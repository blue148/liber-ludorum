-- =====================================================
-- Victory Tracking System - Database Schema
-- =====================================================
-- Creates game_sessions and session_victories tables for tracking game outcomes

-- Table 1: Game Sessions
-- Stores individual gaming sessions with metadata
CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  game_id UUID NOT NULL REFERENCES shared_games(id) ON DELETE CASCADE,
  session_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  duration_minutes INTEGER,
  player_count INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT fk_game_sessions_user_id FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT chk_duration_positive CHECK (duration_minutes IS NULL OR duration_minutes > 0),
  CONSTRAINT chk_player_count_positive CHECK (player_count IS NULL OR player_count > 0)
);

-- Table 2: Session Victories
-- Stores player results for each gaming session
CREATE TABLE IF NOT EXISTS session_victories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  player_name TEXT NOT NULL,
  is_winner BOOLEAN NOT NULL DEFAULT FALSE,
  score INTEGER,
  placement INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT chk_placement_positive CHECK (placement IS NULL OR placement > 0),
  CONSTRAINT chk_player_name_not_empty CHECK (length(trim(player_name)) > 0)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_id ON game_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_game_id ON game_sessions(game_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_session_date ON game_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_session_victories_session_id ON session_victories(session_id);
CREATE INDEX IF NOT EXISTS idx_session_victories_player_name ON session_victories(player_name);
CREATE INDEX IF NOT EXISTS idx_session_victories_is_winner ON session_victories(is_winner);

-- Updated timestamp triggers
DROP TRIGGER IF EXISTS update_game_sessions_updated_at ON game_sessions;
CREATE TRIGGER update_game_sessions_updated_at
  BEFORE UPDATE ON game_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_victories ENABLE ROW LEVEL SECURITY;

-- Game sessions policies - users can only access their own sessions
DROP POLICY IF EXISTS "Users can view own game sessions" ON game_sessions;
CREATE POLICY "Users can view own game sessions"
  ON game_sessions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own game sessions" ON game_sessions;
CREATE POLICY "Users can insert own game sessions"
  ON game_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own game sessions" ON game_sessions;
CREATE POLICY "Users can update own game sessions"
  ON game_sessions FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own game sessions" ON game_sessions;
CREATE POLICY "Users can delete own game sessions"
  ON game_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Session victories policies - users can only access victories from their sessions
DROP POLICY IF EXISTS "Users can view session victories from own sessions" ON session_victories;
CREATE POLICY "Users can view session victories from own sessions"
  ON session_victories FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM game_sessions gs
      WHERE gs.id = session_victories.session_id
      AND gs.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert session victories to own sessions" ON session_victories;
CREATE POLICY "Users can insert session victories to own sessions"
  ON session_victories FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM game_sessions gs
      WHERE gs.id = session_victories.session_id
      AND gs.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update session victories in own sessions" ON session_victories;
CREATE POLICY "Users can update session victories in own sessions"
  ON session_victories FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM game_sessions gs
      WHERE gs.id = session_victories.session_id
      AND gs.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete session victories from own sessions" ON session_victories;
CREATE POLICY "Users can delete session victories from own sessions"
  ON session_victories FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM game_sessions gs
      WHERE gs.id = session_victories.session_id
      AND gs.user_id = auth.uid()
    )
  );

-- Helper function to get user's victory statistics for a specific game
CREATE OR REPLACE FUNCTION get_user_game_victory_stats(user_id_param UUID, game_id_param UUID)
RETURNS TABLE (
  total_sessions BIGINT,
  total_wins BIGINT,
  win_rate NUMERIC,
  best_score INTEGER,
  last_played TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT gs.id) as total_sessions,
    COUNT(DISTINCT CASE WHEN sv.is_winner = true THEN gs.id END) as total_wins,
    CASE
      WHEN COUNT(DISTINCT gs.id) > 0
      THEN ROUND((COUNT(DISTINCT CASE WHEN sv.is_winner = true THEN gs.id END)::NUMERIC / COUNT(DISTINCT gs.id)::NUMERIC) * 100, 1)
      ELSE 0
    END as win_rate,
    MAX(sv.score) as best_score,
    MAX(gs.session_date) as last_played
  FROM game_sessions gs
  LEFT JOIN session_victories sv ON gs.id = sv.session_id
  WHERE gs.user_id = user_id_param
    AND gs.game_id = game_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get user's overall victory statistics
CREATE OR REPLACE FUNCTION get_user_overall_victory_stats(user_id_param UUID)
RETURNS TABLE (
  total_sessions BIGINT,
  total_wins BIGINT,
  win_rate NUMERIC,
  games_played BIGINT,
  last_session TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT gs.id) as total_sessions,
    COUNT(DISTINCT CASE WHEN sv.is_winner = true THEN gs.id END) as total_wins,
    CASE
      WHEN COUNT(DISTINCT gs.id) > 0
      THEN ROUND((COUNT(DISTINCT CASE WHEN sv.is_winner = true THEN gs.id END)::NUMERIC / COUNT(DISTINCT gs.id)::NUMERIC) * 100, 1)
      ELSE 0
    END as win_rate,
    COUNT(DISTINCT gs.game_id) as games_played,
    MAX(gs.session_date) as last_session
  FROM game_sessions gs
  LEFT JOIN session_victories sv ON gs.id = sv.session_id
  WHERE gs.user_id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments for documentation
COMMENT ON TABLE game_sessions IS 'Individual gaming sessions with metadata and outcomes';
COMMENT ON TABLE session_victories IS 'Player results and scores for each gaming session';
COMMENT ON COLUMN game_sessions.user_id IS 'Reference to auth.users.id - session owner';
COMMENT ON COLUMN game_sessions.game_id IS 'Reference to shared_games.id';
COMMENT ON COLUMN game_sessions.session_date IS 'When the game session occurred';
COMMENT ON COLUMN game_sessions.duration_minutes IS 'How long the game session lasted';
COMMENT ON COLUMN game_sessions.player_count IS 'Number of players in this session';
COMMENT ON COLUMN session_victories.player_name IS 'Name of the player (can be the user or others)';
COMMENT ON COLUMN session_victories.is_winner IS 'Whether this player won the game';
COMMENT ON COLUMN session_victories.score IS 'Player final score (if applicable)';
COMMENT ON COLUMN session_victories.placement IS 'Player final placement (1st, 2nd, etc.)';