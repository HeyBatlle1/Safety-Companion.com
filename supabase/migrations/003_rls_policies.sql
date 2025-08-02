/*
  # Step 3: Row Level Security Policies
  
  Run this AFTER all tables are created (steps 1-2)
  CRITICAL: Test with different user roles after setup
*/

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_project_assignments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SECURITY HELPER FUNCTIONS
-- ============================================================================

-- Function to get user role securely
CREATE OR REPLACE FUNCTION get_user_role_secure(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role 
    FROM user_profiles 
    WHERE (id = user_uuid OR auth_user_id = user_uuid) 
    AND is_active = true;
    
    RETURN COALESCE(user_role, 'none');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check admin status
CREATE OR REPLACE FUNCTION is_admin_user(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT role = 'admin' 
        FROM user_profiles 
        WHERE (id = user_uuid OR auth_user_id = user_uuid) 
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check manager relationship
CREATE OR REPLACE FUNCTION is_manager_of(manager_uuid UUID, target_user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Direct supervisor relationship
    IF EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE (id = target_user_uuid OR auth_user_id = target_user_uuid)
        AND supervisor_id = manager_uuid
        AND is_active = true
    ) THEN
        RETURN true;
    END IF;
    
    -- Project-based management relationship
    IF EXISTS (
        SELECT 1 FROM user_project_assignments upa
        JOIN user_project_assignments upa_mgr ON upa.project_id = upa_mgr.project_id
        WHERE upa.user_id = target_user_uuid
        AND upa_mgr.user_id = manager_uuid
        AND upa_mgr.role_on_project IN ('manager', 'supervisor')
        AND upa.is_active = true
        AND upa_mgr.is_active = true
    ) THEN
        RETURN true;
    END IF;
    
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user company
CREATE OR REPLACE FUNCTION get_user_company(user_uuid UUID)
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT company_id 
        FROM user_profiles 
        WHERE (id = user_uuid OR auth_user_id = user_uuid)
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- USER PROFILES POLICIES (Most Critical)
-- ============================================================================

-- Drop any existing policies first
DROP POLICY IF EXISTS "Allow all operations on user_profiles" ON user_profiles;

-- Users can view their own profile
CREATE POLICY "user_profiles_own_view" ON user_profiles
    FOR SELECT USING (
        auth.uid() = auth_user_id OR auth.uid() = id
    );

-- Users can update their own basic info (restricted fields)
CREATE POLICY "user_profiles_own_update" ON user_profiles
    FOR UPDATE USING (
        auth.uid() = auth_user_id OR auth.uid() = id
    ) WITH CHECK (
        (auth.uid() = auth_user_id OR auth.uid() = id) AND
        -- Prevent users from changing sensitive fields
        role = (SELECT role FROM user_profiles WHERE id = user_profiles.id) AND
        employee_id = (SELECT employee_id FROM user_profiles WHERE id = user_profiles.id) AND
        company_id = (SELECT company_id FROM user_profiles WHERE id = user_profiles.id)
    );

-- Managers can view their direct reports and project team members
CREATE POLICY "user_profiles_manager_view" ON user_profiles
    FOR SELECT USING (
        is_manager_of(auth.uid(), id) OR 
        is_manager_of(auth.uid(), auth_user_id)
    );

-- Safety managers can view all profiles in their company for compliance
CREATE POLICY "user_profiles_safety_manager_view" ON user_profiles
    FOR SELECT USING (
        get_user_role_secure(auth.uid()) = 'safety_manager' AND
        company_id = get_user_company(auth.uid())
    );

-- Admins have full access within their company
CREATE POLICY "user_profiles_admin_all" ON user_profiles
    FOR ALL USING (
        is_admin_user(auth.uid()) AND
        company_id = get_user_company(auth.uid())
    );

-- ============================================================================
-- SAFETY REPORTS POLICIES
-- ============================================================================

-- Users can view and create their own reports
CREATE POLICY "safety_reports_own_access" ON safety_reports
    FOR ALL USING (
        user_profile_id IN (
            SELECT id FROM user_profiles 
            WHERE auth_user_id = auth.uid()
        )
    );

-- Safety managers can view all reports in their company
CREATE POLICY "safety_reports_safety_manager_view" ON safety_reports
    FOR ALL USING (
        get_user_role_secure(auth.uid()) = 'safety_manager' AND
        user_profile_id IN (
            SELECT id FROM user_profiles 
            WHERE company_id = get_user_company(auth.uid())
        )
    );

-- Managers can view team reports
CREATE POLICY "safety_reports_manager_view" ON safety_reports
    FOR SELECT USING (
        is_manager_of(auth.uid(), user_profile_id)
    );

-- ============================================================================
-- CHAT AND ANALYSIS POLICIES
-- ============================================================================

-- Users can access their own chat messages
CREATE POLICY "chat_messages_own_access" ON chat_messages
    FOR ALL USING (
        user_profile_id IN (
            SELECT id FROM user_profiles 
            WHERE auth_user_id = auth.uid()
        )
    );

-- Users can access their own analysis history
CREATE POLICY "analysis_history_own_access" ON analysis_history
    FOR ALL USING (
        user_profile_id IN (
            SELECT id FROM user_profiles 
            WHERE auth_user_id = auth.uid()
        )
    );

-- ============================================================================
-- AUDIT AND DOCUMENT POLICIES
-- ============================================================================

-- Users can view their own audit log
CREATE POLICY "audit_log_own_view" ON profile_audit_log
    FOR SELECT USING (
        user_profile_id IN (
            SELECT id FROM user_profiles 
            WHERE auth_user_id = auth.uid()
        )
    );

-- Admins can view all audit logs in their company
CREATE POLICY "audit_log_admin_view" ON profile_audit_log
    FOR SELECT USING (
        is_admin_user(auth.uid()) AND
        user_profile_id IN (
            SELECT id FROM user_profiles 
            WHERE company_id = get_user_company(auth.uid())
        )
    );

-- System can insert audit logs (bypass RLS for system operations)
CREATE POLICY "audit_log_system_insert" ON profile_audit_log
    FOR INSERT WITH CHECK (true);

-- Users can view and manage their own documents
CREATE POLICY "documents_own_access" ON profile_documents
    FOR ALL USING (
        user_profile_id IN (
            SELECT id FROM user_profiles 
            WHERE auth_user_id = auth.uid()
        ) AND is_active = true
    );

-- Safety managers can view certifications across their company
CREATE POLICY "documents_safety_manager_view" ON profile_documents
    FOR SELECT USING (
        get_user_role_secure(auth.uid()) = 'safety_manager' AND
        document_type IN ('certification', 'training_certificate', 'safety_record') AND
        user_profile_id IN (
            SELECT id FROM user_profiles 
            WHERE company_id = get_user_company(auth.uid())
        ) AND is_active = true
    );

-- Admins have full document access within their company
CREATE POLICY "documents_admin_all" ON profile_documents
    FOR ALL USING (
        is_admin_user(auth.uid()) AND
        user_profile_id IN (
            SELECT id FROM user_profiles 
            WHERE company_id = get_user_company(auth.uid())
        )
    );

-- ============================================================================
-- SESSION POLICIES
-- ============================================================================

-- Users can view and manage their own sessions
CREATE POLICY "sessions_own_access" ON user_sessions
    FOR ALL USING (user_id = auth.uid());

-- Admins can view sessions for security monitoring
CREATE POLICY "sessions_admin_view" ON user_sessions
    FOR SELECT USING (
        is_admin_user(auth.uid()) AND
        user_id IN (
            SELECT auth_user_id FROM user_profiles 
            WHERE company_id = get_user_company(auth.uid())
        )
    );

-- Project assignments - users can view their own assignments
CREATE POLICY "project_assignments_own_view" ON user_project_assignments
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM user_profiles 
            WHERE auth_user_id = auth.uid()
        )
    );

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON user_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON safety_reports TO authenticated;
GRANT SELECT, INSERT, UPDATE ON chat_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE ON analysis_history TO authenticated;
GRANT SELECT, INSERT ON profile_audit_log TO authenticated;
GRANT SELECT, INSERT, UPDATE ON profile_documents TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_project_assignments TO authenticated;

-- Test RLS policies
DO $$
DECLARE
    test_user_id UUID;
    policy_count INTEGER;
BEGIN
    -- Count created policies
    SELECT COUNT(*) INTO policy_count 
    FROM pg_policies 
    WHERE schemaname = 'public';
    
    RAISE NOTICE '
================================================================================
🔐 RLS POLICIES SETUP COMPLETE
================================================================================
✅ Created % security policies across all tables
✅ Enabled Row Level Security on all tables
✅ Set up role-based access control functions
✅ Configured company-level data isolation

🚨 CRITICAL NEXT STEPS:
1. Create test users with different roles
2. Verify data isolation between user types  
3. Test edge cases (role changes, user deletion)
4. Set up environment variables in Replit Secrets

Environment Variables Needed:
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY  
- SUPABASE_SERVICE_ROLE_KEY (for admin operations)
================================================================================
    ', policy_count;
END $$;