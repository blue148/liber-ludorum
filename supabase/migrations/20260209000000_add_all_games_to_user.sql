-- Add all games from shared_games to user_library for specific user
-- Target user: d0607f47-5bdc-4ef9-aef9-fc29194b4061

INSERT INTO user_library (user_id, game_id, is_favorite, for_sale)
SELECT
  'd0607f47-5bdc-4ef9-aef9-fc29194b4061'::uuid AS user_id,
  id AS game_id,
  false AS is_favorite,
  false AS for_sale
FROM shared_games
ON CONFLICT (user_id, game_id) DO NOTHING;

-- Display results
DO $$
DECLARE
  total_games integer;
  user_library_count integer;
BEGIN
  SELECT COUNT(*) INTO total_games FROM shared_games;
  SELECT COUNT(*) INTO user_library_count
  FROM user_library
  WHERE user_id = 'd0607f47-5bdc-4ef9-aef9-fc29194b4061';

  RAISE NOTICE 'Total games in shared_games: %', total_games;
  RAISE NOTICE 'Games in user library: %', user_library_count;
END $$;
