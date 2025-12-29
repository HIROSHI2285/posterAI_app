-- Daily Limit Migration
-- Add daily_limit column to allowed_users table
-- This allows administrators to set custom daily generation limits per user

ALTER TABLE allowed_users
ADD COLUMN IF NOT EXISTS daily_limit INTEGER DEFAULT 100 NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN allowed_users.daily_limit IS 'Maximum number of poster generations allowed per day (default: 100)';

-- Update existing users to have the default limit
UPDATE allowed_users
SET daily_limit = 100
WHERE daily_limit IS NULL;
