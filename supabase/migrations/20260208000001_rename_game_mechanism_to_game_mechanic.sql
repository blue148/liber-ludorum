/*
  # Rename game_mechanism to game_mechanic

  1. Changes
    - Rename column `game_mechanism` to `game_mechanic` in shared_games table

  2. Notes
    - Simple column rename for consistency with singular form
*/

DO $$
BEGIN
  -- Check if the old column exists before renaming
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shared_games' AND column_name = 'game_mechanism'
  ) THEN
    ALTER TABLE shared_games RENAME COLUMN game_mechanism TO game_mechanic;
  END IF;
END $$;
