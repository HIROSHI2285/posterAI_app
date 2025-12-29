-- ================================================================
-- Audit Logs Table
-- Purpose: Track all important user actions for security audit
-- ================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    actor_email TEXT NOT NULL,
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id TEXT,
    details JSONB,
    ip_address TEXT,
    user_agent TEXT,
    success BOOLEAN DEFAULT true
);

-- Indexes for performance
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_email);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- RLS: 管理者のみ閲覧可能
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_read_audit_logs ON audit_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM allowed_users
            WHERE email = current_setting('app.current_user_email', true)
            AND is_admin = true
            AND is_active = true
        )
    );

-- Service Roleは全アクセス可能
CREATE POLICY service_role_bypass_audit ON audit_logs
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

COMMENT ON TABLE audit_logs IS 'Security audit trail for all important user actions';
COMMENT ON COLUMN audit_logs.actor_email IS 'Email of the user who performed the action';
COMMENT ON COLUMN audit_logs.action IS 'Action type (e.g., user.created, auth.signin.success)';
COMMENT ON COLUMN audit_logs.resource_type IS 'Type of resource affected (e.g., user, poster)';
COMMENT ON COLUMN audit_logs.resource_id IS 'ID of the affected resource';
COMMENT ON COLUMN audit_logs.details IS 'Additional details about the action in JSON format';
COMMENT ON COLUMN audit_logs.success IS 'Whether the action was successful';

-- ================================================================
-- Verification
-- ================================================================

-- Check if table exists
SELECT tablename, tableowner FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'audit_logs';

-- Check RLS policies
SELECT policyname, permissive, roles, cmd 
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'audit_logs';
