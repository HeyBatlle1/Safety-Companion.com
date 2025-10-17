-- Verify Supabase setup is complete
-- Run this to confirm everything is working

-- 1. Check if pgvector is enabled
SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';

-- 2. Check if agent_outputs table exists
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'agent_outputs';

-- 3. Check if analysis_history table exists
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'analysis_history';

-- 4. Check if user_profiles table exists
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'user_profiles';

-- 5. Check Supabase Auth users count
SELECT COUNT(*) as auth_users FROM auth.users;

-- Done! If you see results, everything is working ✅
