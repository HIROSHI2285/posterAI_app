-- Daily Limit Migration (Updated to 50)
-- Add daily_limit column to allowed_users table
-- This allows administrators to set custom daily generation limits per user

ALTER TABLE allowed_users
ADD COLUMN IF NOT EXISTS daily_limit INTEGER DEFAULT 50 NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN allowed_users.daily_limit IS 'Maximum number of poster generations allowed per day (default: 50)';

-- Update existing users to have the default limit
UPDATE allowed_users
SET daily_limit = 50
WHERE daily_limit = 100 OR daily_limit IS NULL;
