-- Migration: Add waitlist table and subscription tier field
-- Run this migration to add waitlist functionality and subscription tier tracking

-- Add subscriptionTier column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS "subscriptionTier" TEXT;

-- Create waitlist_entries table
CREATE TABLE IF NOT EXISTS "waitlist_entries" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "name" TEXT,
  "source" TEXT,
  "referralCode" TEXT,
  "joinedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "invitedAt" TIMESTAMP,
  "foundingFlockEligible" BOOLEAN NOT NULL DEFAULT true
);

-- Add stripeCustomerId column for pre-auth Founding Flock purchases
ALTER TABLE "waitlist_entries" ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT;

-- Create indexes for waitlist_entries
CREATE INDEX IF NOT EXISTS "waitlist_entries_email_idx" ON "waitlist_entries"("email");
CREATE INDEX IF NOT EXISTS "waitlist_entries_referralCode_idx" ON "waitlist_entries"("referralCode");
CREATE INDEX IF NOT EXISTS "waitlist_entries_joinedAt_idx" ON "waitlist_entries"("joinedAt");



