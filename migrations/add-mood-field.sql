-- Migration: Add mood field to Entry table
-- Run this SQL in your Supabase SQL editor or via Prisma migrate

ALTER TABLE entries
ADD COLUMN IF NOT EXISTS mood TEXT;

COMMENT ON COLUMN entries.mood IS 'Emoji mood tag for the entry (e.g., 😊, 😌, 😢, 🔥, 😴, 🎉)';



