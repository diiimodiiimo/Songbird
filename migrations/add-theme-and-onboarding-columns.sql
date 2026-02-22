-- Migration: Add ALL missing columns to users table
-- The Prisma schema defines these but they were never created via SQL migration
-- Using IF NOT EXISTS so this is safe to run even if some columns already exist

-- Core profile columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS "phone" TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "clerkId" TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "bio" TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "gender" TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "favoriteArtists" TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "favoriteSongs" TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "theme" TEXT NOT NULL DEFAULT 'american-robin';

-- Onboarding tracking
ALTER TABLE users ADD COLUMN IF NOT EXISTS "onboardingCompletedAt" TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "onboardingSkippedAt" TIMESTAMP;

-- Streak system
ALTER TABLE users ADD COLUMN IF NOT EXISTS "currentStreak" INT NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "longestStreak" INT NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "lastStreakDate" TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "streakFreezeAvailable" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "streakFreezeUsedAt" TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "lastStreakRestoreAt" TIMESTAMP;

-- Invite system
ALTER TABLE users ADD COLUMN IF NOT EXISTS "inviteCode" TEXT UNIQUE;

-- Premium / Founding Flock
ALTER TABLE users ADD COLUMN IF NOT EXISTS "isPremium" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "isFoundingMember" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "premiumSince" TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "subscriptionTier" TEXT;

-- Notification preferences
ALTER TABLE users ADD COLUMN IF NOT EXISTS "notificationsEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "pushNotificationsEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "reminderTime" INT NOT NULL DEFAULT 20;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "reminderEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "notifyOnVibe" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "notifyOnComment" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "notifyOnMention" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "notifyOnFriendRequest" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "notifyOnFriendAccepted" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "notifyOnThisDay" BOOLEAN NOT NULL DEFAULT true;

-- Profile visibility
ALTER TABLE users ADD COLUMN IF NOT EXISTS "profileVisible" BOOLEAN NOT NULL DEFAULT true;

-- Waitlist stripeCustomerId
ALTER TABLE waitlist_entries ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT;
