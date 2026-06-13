-- Deduplication: Remove duplicate "Lure" entry
--
-- Both entries have the same data except barcode:
-- - Keep: 2e6b635f-3ca1-496a-990c-4c90f609b4db (Barcode: 618149323746)
-- - Delete: b81412d9-9293-4377-93f4-8f0a8e50410e (Barcode: 8681493237467)
--
-- Both have the same BGG ID (415780) and metadata, no user_library references

-- First, verify no user_library references (safety check)
DO $$
DECLARE
  ref_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO ref_count
  FROM user_library
  WHERE game_id = 'b81412d9-9293-4377-93f4-8f0a8e50410e';

  IF ref_count > 0 THEN
    RAISE EXCEPTION 'Cannot delete: % user_library references exist', ref_count;
  END IF;
END $$;

-- Delete the duplicate entry
DELETE FROM shared_games
WHERE id = 'b81412d9-9293-4377-93f4-8f0a8e50410e';

-- Verify only one "Lure" entry remains
DO $$
DECLARE
  lure_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO lure_count
  FROM shared_games
  WHERE LOWER(name) = 'lure';

  IF lure_count != 1 THEN
    RAISE EXCEPTION 'Expected 1 Lure entry, found %', lure_count;
  END IF;

  RAISE NOTICE 'Successfully deduplicated. 1 "Lure" entry remains.';
END $$;
