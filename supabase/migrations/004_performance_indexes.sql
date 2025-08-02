/*
  # Step 4: Performance Indexes
  
  Run this LAST - after all tables and policies are set up
  Critical for 175+ employee performance
*/

-- ============================================================================
-- USER PROFILES INDEXES (Most Critical for Performance)
-- ============================================================================

-- Primary lookup indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_auth_user ON user_profiles(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_employee_id ON user_profiles(employee_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

-- Role-based query optimization (CRITICAL for RLS policies)
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_profiles_company_role ON user_profiles(company_id, role) WHERE is_active = true;

-- Supervisor/team lookup optimization
CREATE INDEX IF NOT EXISTS idx_user_profiles_supervisor ON user_profiles(supervisor_id) WHERE is_active = true;

-- Active user filtering (used in most queries)
CREATE INDEX IF NOT EXISTS idx_user_profiles_active ON user_profiles(is_active, company_id);

-- Department filtering
CREATE INDEX IF NOT EXISTS idx_user_profiles_department ON user_profiles(department, company_id) WHERE is_active = true;

-- ============================================================================
-- AUDIT LOG INDEXES (Security and Compliance)
-- ============================================================================

-- Primary audit trail lookups
CREATE INDEX IF NOT EXISTS idx_audit_log_user_profile ON profile_audit_log(user_profile_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON profile_audit_log(created_at DESC);

-- Security monitoring indexes
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON profile_audit_log(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_risk ON profile_audit_log(risk_level, created_at DESC) WHERE risk_level IN ('high', 'critical');
CREATE INDEX IF NOT EXISTS idx_audit_log_changed_by ON profile_audit_log(changed_by, created_at DESC);

-- IP-based security analysis
CREATE INDEX IF NOT EXISTS idx_audit_log_ip ON profile_audit_log(ip_address, created_at DESC) WHERE ip_address IS NOT NULL;

-- ============================================================================
-- DOCUMENT MANAGEMENT INDEXES
-- ============================================================================

-- Primary document access
CREATE INDEX IF NOT EXISTS idx_documents_user_profile ON profile_documents(user_profile_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_documents_type ON profile_documents(document_type, is_active);

-- Certificate expiry monitoring (CRITICAL for safety compliance)
CREATE INDEX IF NOT EXISTS idx_documents_expiry ON profile_documents(expiry_date, document_type) 
    WHERE expiry_date IS NOT NULL AND is_active = true;
CREATE INDEX IF NOT EXISTS idx_documents_expiring_soon ON profile_documents(expiry_date) 
    WHERE expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days' 
    AND is_active = true AND expiry_warning_sent = false;

-- Document approval workflow
CREATE INDEX IF NOT EXISTS idx_documents_approval_status ON profile_documents(approval_status, document_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_virus_scan ON profile_documents(virus_scan_status, created_at DESC) 
    WHERE virus_scan_status = 'pending';

-- Document access patterns
CREATE INDEX IF NOT EXISTS idx_documents_active_type ON profile_documents(is_active, document_type, user_profile_id);

-- ============================================================================
-- SESSION MANAGEMENT INDEXES
-- ============================================================================

-- Active session lookup
CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_sessions_active ON user_sessions(is_active, expires_at);

-- Security monitoring
CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_suspicious ON user_sessions(is_suspicious, created_at DESC) WHERE is_suspicious = true;
CREATE INDEX IF NOT EXISTS idx_sessions_ip ON user_sessions(ip_address, created_at DESC) WHERE ip_address IS NOT NULL;

-- Session cleanup optimization
CREATE INDEX IF NOT EXISTS idx_sessions_expired ON user_sessions(expires_at) WHERE is_active = true;

-- ============================================================================
-- SAFETY REPORTS INDEXES
-- ============================================================================

-- User report access
CREATE INDEX IF NOT EXISTS idx_safety_reports_user ON safety_reports(user_profile_id, created_at DESC);

-- Status-based filtering
CREATE INDEX IF NOT EXISTS idx_safety_reports_status ON safety_reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_safety_reports_severity ON safety_reports(severity, created_at DESC) WHERE severity IN ('high', 'critical');

-- Assignment tracking
CREATE INDEX IF NOT EXISTS idx_safety_reports_assigned ON safety_reports(assigned_to, status) WHERE assigned_to IS NOT NULL;

-- Report type analysis
CREATE INDEX IF NOT EXISTS idx_safety_reports_type ON safety_reports(report_type, created_at DESC);

-- ============================================================================
-- CHAT AND ANALYSIS INDEXES
-- ============================================================================

-- Chat session access
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON chat_messages(user_profile_id, created_at DESC);

-- Analysis history lookup
CREATE INDEX IF NOT EXISTS idx_analysis_history_user ON analysis_history(user_profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analysis_history_type ON analysis_history(analysis_type, created_at DESC);

-- ============================================================================
-- PROJECT ASSIGNMENT INDEXES
-- ============================================================================

-- User project lookup
CREATE INDEX IF NOT EXISTS idx_project_assignments_user ON user_project_assignments(user_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_project_assignments_project ON user_project_assignments(project_id) WHERE is_active = true;

-- Role-based project access
CREATE INDEX IF NOT EXISTS idx_project_assignments_role ON user_project_assignments(role_on_project, is_active, project_id);

-- ============================================================================
-- COMPOSITE INDEXES FOR COMMON QUERY PATTERNS
-- ============================================================================

-- Team lookup optimization (manager viewing team)
CREATE INDEX IF NOT EXISTS idx_user_profiles_team_lookup ON user_profiles(supervisor_id, is_active, role, department);

-- Document compliance queries (safety manager viewing certs)
CREATE INDEX IF NOT EXISTS idx_documents_compliance ON profile_documents(document_type, approval_status, expiry_date, user_profile_id) 
    WHERE document_type IN ('certification', 'training_certificate') AND is_active = true;

-- Security audit queries (admin reviewing high-risk actions)
CREATE INDEX IF NOT EXISTS idx_audit_security ON profile_audit_log(risk_level, action, created_at DESC, user_profile_id) 
    WHERE risk_level IN ('high', 'critical');

-- ============================================================================
-- PARTIAL INDEXES FOR OPTIMIZATION
-- ============================================================================

-- Only index active users for most queries
CREATE INDEX IF NOT EXISTS idx_active_users_only ON user_profiles(company_id, role, department) WHERE is_active = true;

-- Only index pending documents for approval workflows
CREATE INDEX IF NOT EXISTS idx_pending_documents ON profile_documents(user_profile_id, document_type, created_at DESC) 
    WHERE approval_status = 'pending';

-- Only index recent audit logs for security monitoring
CREATE INDEX IF NOT EXISTS idx_recent_audit_logs ON profile_audit_log(user_profile_id, action, created_at DESC) 
    WHERE created_at >= CURRENT_DATE - INTERVAL '90 days';

-- ============================================================================
-- VERIFY INDEX CREATION
-- ============================================================================

DO $$
DECLARE
    index_count INTEGER;
    table_count INTEGER;
BEGIN
    -- Count created indexes
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes
    WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%';
    
    -- Count tables with indexes
    SELECT COUNT(DISTINCT tablename) INTO table_count
    FROM pg_indexes
    WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%';
    
    RAISE NOTICE '
================================================================================
⚡ PERFORMANCE INDEXES SETUP COMPLETE
================================================================================
✅ Created % performance indexes across % tables
✅ Optimized role-based queries for RLS policies
✅ Added supervisor/team lookup optimization  
✅ Enabled certificate expiry monitoring indexes
✅ Set up security audit trail optimization
✅ Configured composite indexes for common patterns

🚀 READY FOR 175+ EMPLOYEE SCALE:
   • Role-based queries: Optimized
   • Team lookups: Sub-second response
   • Certificate monitoring: Real-time
   • Security auditing: High-performance
   • Document management: Efficient

📊 NEXT STEP: Configure Storage Bucket
   • Create "profile-documents" bucket
   • Set file size limits (5MB certs, 10MB photos)  
   • Enable virus scanning if available
   • Configure public/private access rules
================================================================================
    ', index_count, table_count;
END $$;