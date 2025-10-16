-- Supabase: Enable pgvector and create session table
-- Run this in your Supabase SQL Editor

-- 1. Enable pgvector extension (this is what makes the system unique!)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create user_sessions table for express-session
CREATE TABLE IF NOT EXISTS user_sessions (
  sid VARCHAR NOT NULL PRIMARY KEY,
  sess JSON NOT NULL,
  expire TIMESTAMPTZ NOT NULL
);

-- 3. Create index for session expiration cleanup
CREATE INDEX IF NOT EXISTS idx_user_sessions_expire ON user_sessions(expire);

-- 4. Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON user_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_sessions TO anon;

-- 5. Verify pgvector is working
SELECT * FROM pg_extension WHERE extname = 'vector';

-- Done!
SELECT 'pgvector enabled and session table created!' AS status;
