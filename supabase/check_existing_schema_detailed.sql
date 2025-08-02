-- Check the exact column structure of existing tables
-- Run this in Supabase SQL Editor to see current schema

SELECT 
  table_name,
  column_name, 
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('safety_reports', 'chat_messages', 'analysis_history')
ORDER BY table_name, ordinal_position;