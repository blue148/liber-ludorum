-- Create a function to add all shared games to a user's library
-- This function runs with SECURITY DEFINER to bypass RLS

CREATE OR REPLACE FUNCTION populate_user_library_with_all_games(target_user_id UUID)
RETURNS TABLE (
  total_games INTEGER,
  already_in_library INTEGER,
  newly_added INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER -- Run with function creator's privileges, bypassing RLS
AS $$
DECLARE
  v_total_games INTEGER;
  v_already_in_library INTEGER;
  v_newly_added INTEGER;
BEGIN
  -- Count total games in shared_games
  SELECT COUNT(*) INTO v_total_games FROM shared_games;

  -- Count games already in user's library
  SELECT COUNT(*) INTO v_already_in_library
  FROM user_library
  WHERE user_id = target_user_id;

  -- Insert all games from shared_games into user_library
  INSERT INTO user_library (user_id, game_id, is_favorite, for_sale)
  SELECT
    target_user_id,
    id,
    false,
    false
  FROM shared_games
  ON CONFLICT (user_id, game_id) DO NOTHING;

  -- Get count of newly added games
  GET DIAGNOSTICS v_newly_added = ROW_COUNT;

  -- Return the results
  RETURN QUERY
  SELECT v_total_games, v_already_in_library, v_newly_added;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION populate_user_library_with_all_games(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION populate_user_library_with_all_games(UUID) TO anon;

-- Add a comment explaining the function
COMMENT ON FUNCTION populate_user_library_with_all_games IS
'Adds all games from shared_games to the specified user''s library. Returns counts of total games, already in library, and newly added.';
