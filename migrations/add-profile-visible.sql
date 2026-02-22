-- Add profileVisible column to users table
-- Defaults to true so existing users remain discoverable
ALTER TABLE users ADD COLUMN IF NOT EXISTS "profileVisible" BOOLEAN DEFAULT true;
