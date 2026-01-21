-- Analytics Events - Track user behavior throughout the app
CREATE TABLE IF NOT EXISTS analytics_events (
  id TEXT PRIMARY KEY,
  "userId" TEXT,
  event TEXT NOT NULL,
  properties JSONB DEFAULT '{}',
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_userId ON analytics_events("userId");
CREATE INDEX IF NOT EXISTS idx_analytics_events_event ON analytics_events(event);
CREATE INDEX IF NOT EXISTS idx_analytics_events_createdAt ON analytics_events("createdAt");

-- Bird Unlocks - Track which birds users have unlocked
CREATE TABLE IF NOT EXISTS unlocked_birds (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "birdId" TEXT NOT NULL,
  "unlockedAt" TIMESTAMPTZ DEFAULT NOW(),
  method TEXT NOT NULL, -- 'milestone', 'purchased', 'premium', 'default'
  UNIQUE("userId", "birdId")
);

CREATE INDEX IF NOT EXISTS idx_unlocked_birds_userId ON unlocked_birds("userId");

-- Grant access if using Supabase RLS
-- ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE unlocked_birds ENABLE ROW LEVEL SECURITY;

-- Example RLS policies (uncomment and customize as needed):
-- CREATE POLICY "Users can view their own analytics" ON analytics_events
--   FOR SELECT USING (auth.uid()::text = "userId");

-- CREATE POLICY "Users can view their own unlocked birds" ON unlocked_birds
--   FOR SELECT USING (auth.uid()::text = "userId");



