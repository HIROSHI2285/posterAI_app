-- Add one_time_credit column to allowed_users
-- Default is 0 (no credits)

ALTER TABLE allowed_users
ADD COLUMN IF NOT EXISTS one_time_credit INTEGER DEFAULT 0 NOT NULL;

COMMENT ON COLUMN allowed_users.one_time_credit IS 'Extra execution credits that do not expire daily. Consumed when daily_limit is exceeded.';
