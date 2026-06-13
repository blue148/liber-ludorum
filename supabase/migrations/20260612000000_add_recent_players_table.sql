-- =====================================================
-- Recent Players (Game Nite "First Player" picker)
-- =====================================================
-- Persists the player names a user has recently used so they can be re-added
-- from a recents list. Scoped per user via RLS so they follow the account
-- across sessions and devices instead of living only in device-local storage.

CREATE TABLE IF NOT EXISTS recent_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  player_name TEXT NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT fk_recent_players_user_id FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT chk_recent_player_name_not_empty CHECK (length(trim(player_name)) > 0)
);

-- Recents are listed most-recent first and filtered to the current user.
CREATE INDEX IF NOT EXISTS idx_recent_players_user_used_at
  ON recent_players(user_id, used_at DESC);

-- One row per name per user (case-insensitive); the app de-dupes before insert.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_recent_players_user_name
  ON recent_players(user_id, lower(player_name));

-- Row Level Security — a user can only see and manage their own recents.
ALTER TABLE recent_players ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own recent players" ON recent_players;
CREATE POLICY "Users can view own recent players"
  ON recent_players FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own recent players" ON recent_players;
CREATE POLICY "Users can insert own recent players"
  ON recent_players FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own recent players" ON recent_players;
CREATE POLICY "Users can update own recent players"
  ON recent_players FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own recent players" ON recent_players;
CREATE POLICY "Users can delete own recent players"
  ON recent_players FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON TABLE recent_players IS 'Per-user recent player names for the Game Nite First Player picker';
COMMENT ON COLUMN recent_players.user_id IS 'Reference to auth.users.id - recents owner';
COMMENT ON COLUMN recent_players.player_name IS 'A player name the user has recently entered';
COMMENT ON COLUMN recent_players.used_at IS 'When the name was last used; recents are ordered by this descending';
