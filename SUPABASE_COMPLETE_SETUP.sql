-- COMPLETE SUPABASE SETUP
-- Run this ENTIRE script in your Supabase SQL Editor

-- ========== ENABLE PGVECTOR (Makes your system unique!) ==========
CREATE EXTENSION IF NOT EXISTS vector;

-- ========== CREATE USERS TABLE ==========
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'field_worker' CHECK (role IN ('admin', 'safety_manager', 'project_manager', 'supervisor', 'field_worker')),
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ========== CREATE SESSION TABLE ==========
CREATE TABLE IF NOT EXISTS user_sessions (
  sid VARCHAR NOT NULL PRIMARY KEY,
  sess JSON NOT NULL,
  expire TIMESTAMPTZ NOT NULL
);

-- ========== ENABLE RLS ==========
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ========== RLS POLICIES FOR USERS ==========
DROP POLICY IF EXISTS "Users can view their own data" ON users;
CREATE POLICY "Users can view their own data" 
  ON users FOR SELECT 
  USING (auth.uid()::text = id::text OR true);

DROP POLICY IF EXISTS "Users can update their own data" ON users;
CREATE POLICY "Users can update their own data" 
  ON users FOR UPDATE 
  USING (auth.uid()::text = id::text);

DROP POLICY IF EXISTS "Users can insert" ON users;
CREATE POLICY "Users can insert" 
  ON users FOR INSERT 
  WITH CHECK (true);

-- ========== CREATE INDEXES ==========
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expire ON user_sessions(expire);

-- ========== GRANT PERMISSIONS ==========
GRANT SELECT, INSERT, UPDATE ON users TO authenticated;
GRANT SELECT, INSERT, UPDATE ON users TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_sessions TO anon;

-- ========== VERIFY PGVECTOR ==========
SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';

-- Done!
SELECT 'Supabase setup complete! pgvector enabled, users and sessions created!' AS status;
