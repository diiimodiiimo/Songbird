-- Add gender field to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(50);

-- Add comment to document the field
COMMENT ON COLUMN users.gender IS 'User gender: male, female, non-binary, or prefer-not-to-say';


