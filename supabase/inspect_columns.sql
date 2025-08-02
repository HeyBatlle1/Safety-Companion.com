-- SAFE READ-ONLY inspection of existing table structures
-- Run this in your Supabase SQL Editor to see current schema

-- Check safety_reports structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'safety_reports' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check chat_messages structure  
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'chat_messages' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check analysis_history structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'analysis_history' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if user_profiles exists
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_name = 'user_profiles' 
  AND table_schema = 'public'
) AS user_profiles_exists;