-- Add theme column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'american-robin';

-- Create song_associations table for "songs you associate with a person"
CREATE TABLE IF NOT EXISTS song_associations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "friendId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "songTitle" TEXT NOT NULL,
  artist TEXT NOT NULL,
  "albumTitle" TEXT,
  "albumArt" TEXT,
  "trackId" TEXT,
  note TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- A user can only associate a specific song with a friend once
  UNIQUE("userId", "friendId", "trackId")
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_song_associations_user ON song_associations("userId");
CREATE INDEX IF NOT EXISTS idx_song_associations_friend ON song_associations("friendId");
CREATE INDEX IF NOT EXISTS idx_song_associations_user_friend ON song_associations("userId", "friendId");

-- Grant permissions (for Supabase RLS - adjust as needed)
-- ALTER TABLE song_associations ENABLE ROW LEVEL SECURITY;

