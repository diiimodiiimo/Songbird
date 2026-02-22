-- Migration: Add Notification Preferences to User Table
-- Run this SQL in your Supabase SQL editor or via Prisma migrate

ALTER TABLE users
ADD COLUMN IF NOT EXISTS "notificationsEnabled" BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS "pushNotificationsEnabled" BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS "reminderTime" INTEGER DEFAULT 20,
ADD COLUMN IF NOT EXISTS "reminderEnabled" BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS "notifyOnVibe" BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS "notifyOnComment" BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS "notifyOnMention" BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS "notifyOnFriendRequest" BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS "notifyOnFriendAccepted" BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS "notifyOnThisDay" BOOLEAN DEFAULT true;

-- Add comments for documentation
COMMENT ON COLUMN users."notificationsEnabled" IS 'Master toggle for all notifications';
COMMENT ON COLUMN users."pushNotificationsEnabled" IS 'Enable/disable push notifications';
COMMENT ON COLUMN users."reminderTime" IS 'Hour of day (0-23) for daily SOTD reminder';
COMMENT ON COLUMN users."reminderEnabled" IS 'Enable/disable daily reminder';
COMMENT ON COLUMN users."notifyOnVibe" IS 'Notify when someone vibes your entry';
COMMENT ON COLUMN users."notifyOnComment" IS 'Notify when someone comments on your entry';
COMMENT ON COLUMN users."notifyOnMention" IS 'Notify when mentioned in an entry';
COMMENT ON COLUMN users."notifyOnFriendRequest" IS 'Notify when receiving friend request';
COMMENT ON COLUMN users."notifyOnFriendAccepted" IS 'Notify when friend request accepted';
COMMENT ON COLUMN users."notifyOnThisDay" IS 'Notify about On This Day memories';




