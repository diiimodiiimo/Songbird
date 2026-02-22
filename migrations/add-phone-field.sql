-- Add phone number field to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT UNIQUE;

-- Create index for phone lookups
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone) WHERE phone IS NOT NULL;



