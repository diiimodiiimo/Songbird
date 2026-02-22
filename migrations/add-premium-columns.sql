-- Migration: Add premium/founding flock columns to users table
-- Run this migration to add premium subscription tracking

-- Add premium columns if they don't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS "isPremium" BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "isFoundingMember" BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "premiumSince" TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "subscriptionTier" TEXT;

-- Create indexes for premium queries
CREATE INDEX IF NOT EXISTS "users_isPremium_idx" ON "users"("isPremium");
CREATE INDEX IF NOT EXISTS "users_isFoundingMember_idx" ON "users"("isFoundingMember");
CREATE INDEX IF NOT EXISTS "users_stripeCustomerId_idx" ON "users"("stripeCustomerId");



