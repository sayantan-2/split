-- Add username column to users table
-- This migration adds a unique username column for better user identification

-- Add username column (initially nullable)
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(50);

-- Create a unique index on username (will be enforced after populating data)
-- We'll make it unique after we populate existing users with usernames
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Add constraint to make username unique (will be added after data population)
-- ALTER TABLE users ADD CONSTRAINT unique_username UNIQUE (username);
