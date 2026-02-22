-- Migration: Add blocking and reporting system
-- Run this SQL in your Supabase SQL editor or via psql

-- Create blocked_users table
CREATE TABLE IF NOT EXISTS blocked_users (
  id TEXT PRIMARY KEY,
  "blockerId" TEXT NOT NULL,
  "blockedId" TEXT NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT blocked_users_blockerId_fkey FOREIGN KEY ("blockerId") REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT blocked_users_blockedId_fkey FOREIGN KEY ("blockedId") REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT blocked_users_unique UNIQUE ("blockerId", "blockedId")
);

-- Create indexes for blocked_users
CREATE INDEX IF NOT EXISTS blocked_users_blockerId_idx ON blocked_users("blockerId");
CREATE INDEX IF NOT EXISTS blocked_users_blockedId_idx ON blocked_users("blockedId");

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  "reporterId" TEXT NOT NULL,
  "reportedUserId" TEXT,
  "reportedEntryId" TEXT,
  "reportedCommentId" TEXT,
  type TEXT NOT NULL CHECK (type IN ('user', 'entry', 'comment')),
  reason TEXT NOT NULL CHECK (reason IN ('harassment', 'spam', 'inappropriate', 'other')),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "reviewedAt" TIMESTAMP WITH TIME ZONE,
  "reviewedBy" TEXT,
  CONSTRAINT reports_reporterId_fkey FOREIGN KEY ("reporterId") REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT reports_reportedUserId_fkey FOREIGN KEY ("reportedUserId") REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes for reports
CREATE INDEX IF NOT EXISTS reports_reporterId_idx ON reports("reporterId");
CREATE INDEX IF NOT EXISTS reports_reportedUserId_idx ON reports("reportedUserId");
CREATE INDEX IF NOT EXISTS reports_status_idx ON reports(status);
CREATE INDEX IF NOT EXISTS reports_createdAt_idx ON reports("createdAt");



