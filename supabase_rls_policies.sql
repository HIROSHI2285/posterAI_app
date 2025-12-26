-- ================================================================
-- Supabase RLS (Row Level Security) Policies
-- PosterAI Application - allowed_users Table
-- ================================================================

-- Step 1: Enable Row Level Security
ALTER TABLE allowed_users ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- Policy 1: Service Role Bypass
-- Purpose: Allow backend (Service Role Key) to bypass all RLS
-- ================================================================
CREATE POLICY service_role_bypass ON allowed_users
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ================================================================
-- Policy 2: Admin All Access (Future Use)
-- Purpose: Allow admins to access all records when using user tokens
-- Note: Currently commented out as we use Service Role Key
-- Uncomment when migrating to user-token-based authentication
-- ================================================================
-- CREATE POLICY admin_all_access ON allowed_users
--     FOR ALL
--     USING (
--         EXISTS (
--             SELECT 1 FROM allowed_users admin_check
--             WHERE admin_check.email = current_setting('app.current_user_email', true)
--             AND admin_check.is_admin = true
--             AND admin_check.is_active = true
--         )
--     );

-- ================================================================
-- Policy 3: User Self Read (Future Use)
-- Purpose: Allow users to read their own record
-- Note: Currently commented out as we use Service Role Key
-- Uncomment when migrating to user-token-based authentication
-- ================================================================
-- CREATE POLICY user_self_read ON allowed_users
--     FOR SELECT
--     USING (email = current_setting('app.current_user_email', true));

-- ================================================================
-- Verification
-- ================================================================

-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'allowed_users';

-- List all policies on allowed_users table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'allowed_users';

-- ================================================================
-- Notes
-- ================================================================
-- 1. Service Role Key bypasses RLS automatically in Supabase
-- 2. These policies provide defense in depth for future migrations
-- 3. When migrating to user tokens, uncomment admin and user policies
-- 4. Test policies in development before applying to production
-- ================================================================
