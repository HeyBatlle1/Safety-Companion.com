# 🏗️ Enterprise Supabase Setup Guide for Safety Companion

**CRITICAL: Follow this exact order for 175+ employee deployment**

## 📋 Pre-Setup Checklist

### Environment Variables Required
```bash
# Add these to your Replit Secrets:
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### Supabase Project Configuration
1. Create new Supabase project
2. Enable Row Level Security by default
3. Set up custom domain (optional but recommended)

## 🔢 Migration Order (CRITICAL - DO NOT CHANGE)

### Step 1: Core Tables
```sql
-- Run in Supabase SQL Editor:
-- File: supabase/migrations/001_initial_tables.sql
```
**Wait for completion before proceeding**

### Step 2: Audit & Documents
```sql
-- Run in Supabase SQL Editor:
-- File: supabase/migrations/002_audit_and_documents.sql
```
**Verify all tables created successfully**

### Step 3: RLS Policies
```sql
-- Run in Supabase SQL Editor:
-- File: supabase/migrations/003_rls_policies.sql
```
**CRITICAL: Test immediately after this step**

### Step 4: Performance Indexes
```sql
-- Run in Supabase SQL Editor:
-- File: supabase/migrations/004_performance_indexes.sql
```
**Essential for 175+ employee performance**

### Step 5: Triggers & Functions
```sql
-- Run in Supabase SQL Editor:
-- File: supabase/migrations/005_triggers_and_functions.sql
```

### Step 6: RLS Testing
```sql
-- Run in Supabase SQL Editor:
-- File: supabase/test_rls_policies.sql
```
**Verify all tests pass before production**

## 🛡️ Security Configuration

### File Storage Setup
1. Go to Storage in Supabase Dashboard
2. Create bucket: `profile-documents`
3. Set bucket policies:

```sql
-- Allow authenticated users to upload to their own folder
INSERT INTO storage.policies (id, name, bucket_id, operation, definition)
VALUES (
  'profile-documents-upload',
  'Users can upload to own folder',
  'profile-documents',
  'INSERT',
  'auth.uid()::text = (storage.foldername(name))[1]'
);

-- Allow users to view their own documents
INSERT INTO storage.policies (id, name, bucket_id, operation, definition)
VALUES (
  'profile-documents-select',
  'Users can view own documents',
  'profile-documents', 
  'SELECT',
  'auth.uid()::text = (storage.foldername(name))[1]'
);
```

### File Size Limits
```sql
-- In your bucket settings:
-- Max file size: 25MB
-- Allowed MIME types: 
-- - application/pdf
-- - image/jpeg, image/png, image/webp
-- - application/msword
-- - application/vnd.openxmlformats-officedocument.wordprocessingml.document
```

## 🧪 Critical Testing Steps

### 1. Create Test Users Immediately
```sql
-- After RLS setup, create users with different roles:
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'admin@test.com', 'encrypted_pw', now()),
  ('550e8400-e29b-41d4-a716-446655440002', 'worker@test.com', 'encrypted_pw', now());
```

### 2. Verify Data Isolation
- [ ] Worker can only see own profile
- [ ] Admin can see all company profiles  
- [ ] Managers can see team members only
- [ ] Safety managers can see certifications
- [ ] Cross-company data is isolated

### 3. Test Edge Cases
- [ ] User role changes are prevented
- [ ] Supervisor relationships work correctly
- [ ] Document approval workflow functions
- [ ] Audit trail captures all changes

## ⚡ Performance Optimization

### Required Indexes (Auto-created in migration 4)
```sql
-- Critical indexes for 175+ employees:
idx_user_profiles_role          -- Role-based queries
idx_user_profiles_supervisor    -- Team lookups  
idx_user_profiles_company_role  -- Company isolation
idx_documents_expiry           -- Certificate monitoring
idx_audit_log_user_profile     -- Security auditing
```

### Query Performance Targets
- Profile lookup: < 50ms
- Team view: < 100ms  
- Document search: < 200ms
- Audit queries: < 500ms

## 🚨 Security Verification

### RLS Policy Checklist
- [ ] `user_profiles_own_view` - Users see own profile
- [ ] `user_profiles_admin_all` - Admins see company profiles
- [ ] `user_profiles_manager_view` - Managers see team
- [ ] `documents_own_access` - Users access own documents
- [ ] `audit_log_admin_view` - Admins see audit trails

### Data Protection Verification
```sql
-- Test these scenarios:
-- 1. Worker trying to see admin profile (should fail)
-- 2. User trying to change their own role (should fail)  
-- 3. Cross-company data access (should fail)
-- 4. Document access by unauthorized user (should fail)
```

## 📊 Monitoring Setup

### Enable Supabase Monitoring
1. Go to Settings > Database
2. Enable log collection
3. Set up alerts for:
   - Failed authentication attempts
   - High-risk audit events
   - Performance degradation

### Custom Monitoring Queries
```sql
-- High-risk security events (last 24 hours)
SELECT * FROM profile_audit_log 
WHERE risk_level IN ('high', 'critical') 
AND created_at >= now() - INTERVAL '24 hours';

-- Certificate expiration monitoring
SELECT * FROM check_expiring_certifications();

-- Suspicious login patterns
SELECT ip_address, COUNT(*) as login_count
FROM user_sessions 
WHERE created_at >= now() - INTERVAL '1 hour'
GROUP BY ip_address 
HAVING COUNT(*) > 10;
```

## 🔧 Maintenance Tasks

### Daily
- [ ] Run session cleanup: `SELECT cleanup_expired_sessions();`
- [ ] Check certificate expiry: `SELECT check_expiring_certifications();`
- [ ] Monitor high-risk audit events

### Weekly  
- [ ] Review audit trail for anomalies
- [ ] Verify backup completion
- [ ] Check storage usage and cleanup

### Monthly
- [ ] Performance review and optimization
- [ ] Security policy audit
- [ ] User access review

## 🚀 Production Deployment

### Final Checklist Before Go-Live
- [ ] All migrations completed successfully
- [ ] RLS policies tested with different user roles
- [ ] File storage configured with proper limits
- [ ] Environment variables set in production
- [ ] Monitoring and alerting configured
- [ ] Backup strategy implemented
- [ ] Test users removed from database

### Performance Validation
```sql
-- Verify query performance meets targets
EXPLAIN ANALYZE SELECT * FROM user_profiles WHERE role = 'field_worker' AND is_active = true;
-- Should use idx_user_profiles_role index and complete in < 50ms
```

## 🆘 Troubleshooting

### Common Issues

**RLS Policies Not Working**
```sql
-- Check if RLS is enabled:
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
-- All should show 't' for rowsecurity
```

**Performance Issues**
```sql
-- Check if indexes are being used:
EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM user_profiles WHERE company_id = 'uuid';
-- Should show Index Scan, not Seq Scan
```

**Authentication Errors**
1. Verify JWT secret matches Supabase project
2. Check environment variables are set correctly
3. Ensure RLS policies allow the operation

### Support Contacts
- Supabase Documentation: https://supabase.com/docs
- Security Issues: Check audit trail and RLS policies
- Performance Issues: Review query plans and indexes

## 📈 Scaling Considerations

### For 500+ Employees
- Enable connection pooling
- Consider read replicas for reporting
- Implement data archiving strategy

### For 1000+ Employees  
- Partition large tables by company_id
- Implement advanced caching strategy
- Consider database clustering

---

**🎯 Success Criteria: When all tests pass and performance targets are met, your enterprise-grade Safety Companion is ready for production deployment!**