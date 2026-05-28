-- =====================================================
-- Shared Library Feature - Phase 1
-- =====================================================
-- Creates tables for friend management and library sharing functionality
-- Enables users to connect with friends and share their game libraries

-- Create enum types for friend status and access levels
DO $$ BEGIN
    CREATE TYPE friend_status AS ENUM ('pending', 'accepted', 'blocked');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE library_access_level AS ENUM ('view', 'suggest');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Table 1: User Friends (manages friend relationships)
-- Stores bidirectional friend connections between users
CREATE TABLE IF NOT EXISTS user_friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status friend_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure users can't friend themselves and prevent duplicate relationships
  CONSTRAINT user_friends_no_self_friendship CHECK (user_id != friend_id),
  CONSTRAINT user_friends_unique_relationship UNIQUE (user_id, friend_id)
);

-- Table 2: Shared Library Access (manages library sharing permissions)
-- Grants friends access to view each other's game libraries
CREATE TABLE IF NOT EXISTS shared_library_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  access_level library_access_level NOT NULL DEFAULT 'view',
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure owners can't grant access to themselves and prevent duplicate access grants
  CONSTRAINT shared_library_access_no_self_access CHECK (owner_id != viewer_id),
  CONSTRAINT shared_library_access_unique_grant UNIQUE (owner_id, viewer_id)
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_user_friends_user_id ON user_friends(user_id);
CREATE INDEX IF NOT EXISTS idx_user_friends_friend_id ON user_friends(friend_id);
CREATE INDEX IF NOT EXISTS idx_user_friends_status ON user_friends(status);
CREATE INDEX IF NOT EXISTS idx_user_friends_user_status ON user_friends(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_friends_friend_status ON user_friends(friend_id, status);

CREATE INDEX IF NOT EXISTS idx_shared_library_access_owner_id ON shared_library_access(owner_id);
CREATE INDEX IF NOT EXISTS idx_shared_library_access_viewer_id ON shared_library_access(viewer_id);
CREATE INDEX IF NOT EXISTS idx_shared_library_access_access_level ON shared_library_access(access_level);

-- Updated timestamp triggers
DROP TRIGGER IF EXISTS update_user_friends_updated_at ON user_friends;
CREATE TRIGGER update_user_friends_updated_at
  BEFORE UPDATE ON user_friends
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_shared_library_access_updated_at ON shared_library_access;
CREATE TRIGGER update_shared_library_access_updated_at
  BEFORE UPDATE ON shared_library_access
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE user_friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_library_access ENABLE ROW LEVEL SECURITY;

-- ===== USER_FRIENDS RLS POLICIES =====

-- Users can view friend relationships where they are either the user or the friend
DROP POLICY IF EXISTS "Users can view own friend relationships" ON user_friends;
CREATE POLICY "Users can view own friend relationships"
  ON user_friends FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Users can send friend requests (insert where they are the user_id)
DROP POLICY IF EXISTS "Users can send friend requests" ON user_friends;
CREATE POLICY "Users can send friend requests"
  ON user_friends FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can manage friend requests they sent or received
-- This allows accepting/declining requests and blocking users
DROP POLICY IF EXISTS "Users can manage friend relationships" ON user_friends;
CREATE POLICY "Users can manage friend relationships"
  ON user_friends FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Users can delete friend relationships they are part of
DROP POLICY IF EXISTS "Users can delete friend relationships" ON user_friends;
CREATE POLICY "Users can delete friend relationships"
  ON user_friends FOR DELETE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- ===== SHARED_LIBRARY_ACCESS RLS POLICIES =====

-- Users can view library access where they are owner or viewer
DROP POLICY IF EXISTS "Users can view library access" ON shared_library_access;
CREATE POLICY "Users can view library access"
  ON shared_library_access FOR SELECT
  USING (auth.uid() = owner_id OR auth.uid() = viewer_id);

-- Users can grant access to their own libraries
DROP POLICY IF EXISTS "Users can grant library access" ON shared_library_access;
CREATE POLICY "Users can grant library access"
  ON shared_library_access FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Users can modify access they granted (change access levels)
DROP POLICY IF EXISTS "Users can modify granted access" ON shared_library_access;
CREATE POLICY "Users can modify granted access"
  ON shared_library_access FOR UPDATE
  USING (auth.uid() = owner_id);

-- Users can revoke access they granted
DROP POLICY IF EXISTS "Users can revoke granted access" ON shared_library_access;
CREATE POLICY "Users can revoke granted access"
  ON shared_library_access FOR DELETE
  USING (auth.uid() = owner_id);

-- Helper function to check if users are friends with accepted status
CREATE OR REPLACE FUNCTION are_users_friends(user_a UUID, user_b UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_friends
    WHERE ((user_id = user_a AND friend_id = user_b)
           OR (user_id = user_b AND friend_id = user_a))
    AND status = 'accepted'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get mutual friends between two users
CREATE OR REPLACE FUNCTION get_mutual_friends(user_a UUID, user_b UUID)
RETURNS TABLE(friend_id UUID, username TEXT, avatar_url TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT p.id, p.username, p.avatar_url
  FROM profiles p
  WHERE p.id IN (
    -- Friends of user_a
    SELECT CASE
      WHEN uf1.user_id = user_a THEN uf1.friend_id
      ELSE uf1.user_id
    END
    FROM user_friends uf1
    WHERE (uf1.user_id = user_a OR uf1.friend_id = user_a)
    AND uf1.status = 'accepted'

    INTERSECT

    -- Friends of user_b
    SELECT CASE
      WHEN uf2.user_id = user_b THEN uf2.friend_id
      ELSE uf2.user_id
    END
    FROM user_friends uf2
    WHERE (uf2.user_id = user_b OR uf2.friend_id = user_b)
    AND uf2.status = 'accepted'
  )
  AND p.id != user_a
  AND p.id != user_b;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments for documentation
COMMENT ON TABLE user_friends IS 'Manages friend relationships between users for social features';
COMMENT ON TABLE shared_library_access IS 'Controls who can view each users game library';

COMMENT ON COLUMN user_friends.user_id IS 'User who initiated the friend request';
COMMENT ON COLUMN user_friends.friend_id IS 'User who received the friend request';
COMMENT ON COLUMN user_friends.status IS 'Current status of the friendship: pending, accepted, or blocked';

COMMENT ON COLUMN shared_library_access.owner_id IS 'User who owns the game library';
COMMENT ON COLUMN shared_library_access.viewer_id IS 'User who has been granted access to view the library';
COMMENT ON COLUMN shared_library_access.access_level IS 'Level of access granted: view (read-only) or suggest (can recommend games)';
COMMENT ON COLUMN shared_library_access.granted_at IS 'Timestamp when access was first granted';

COMMENT ON FUNCTION are_users_friends(UUID, UUID) IS 'Helper function to check if two users are friends with accepted status';
COMMENT ON FUNCTION get_mutual_friends(UUID, UUID) IS 'Returns mutual friends between two users for friend discovery';