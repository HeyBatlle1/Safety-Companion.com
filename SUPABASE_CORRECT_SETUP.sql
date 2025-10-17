-- CORRECT SUPABASE SETUP (Works WITH Supabase Auth/Microsoft SSO)
-- Run this in your Supabase SQL Editor

-- ========== ENABLE PGVECTOR (Your unique AI capability) ==========
CREATE EXTENSION IF NOT EXISTS vector;

-- ========== CREATE AGENT_OUTPUTS TABLE ==========
CREATE TABLE IF NOT EXISTS agent_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID,
  agent_id TEXT NOT NULL,
  agent_name TEXT NOT NULL,
  agent_type TEXT NOT NULL,
  output_data JSONB NOT NULL,
  execution_metadata JSONB,
  success BOOLEAN DEFAULT true NOT NULL,
  error_details TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ========== ENABLE RLS ON AGENT_OUTPUTS ==========
ALTER TABLE agent_outputs ENABLE ROW LEVEL SECURITY;

-- ========== RLS POLICIES (Uses Supabase Auth) ==========

-- agent_outputs: Allow authenticated users to view and create
DROP POLICY IF EXISTS "Authenticated users can view agent outputs" ON agent_outputs;
CREATE POLICY "Authenticated users can view agent outputs" 
  ON agent_outputs FOR SELECT 
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can create agent outputs" ON agent_outputs;
CREATE POLICY "Authenticated users can create agent outputs" 
  ON agent_outputs FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- analysis_history: Users can only see their own analyses
DROP POLICY IF EXISTS "Users can view their own analysis history" ON analysis_history;
CREATE POLICY "Users can view their own analysis history" 
  ON analysis_history FOR SELECT 
  USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can create their own analysis" ON analysis_history;
CREATE POLICY "Users can create their own analysis" 
  ON analysis_history FOR INSERT 
  WITH CHECK (auth.uid()::text = user_id::text);

-- user_profiles: Users can view/update their own profile
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
CREATE POLICY "Users can view their own profile" 
  ON user_profiles FOR SELECT 
  USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
CREATE POLICY "Users can update their own profile" 
  ON user_profiles FOR UPDATE 
  USING (auth.uid()::text = user_id::text);

-- ========== CREATE INDEXES ==========
CREATE INDEX IF NOT EXISTS idx_agent_outputs_analysis_id ON agent_outputs(analysis_id);
CREATE INDEX IF NOT EXISTS idx_agent_outputs_agent_type ON agent_outputs(agent_type);
CREATE INDEX IF NOT EXISTS idx_agent_outputs_created_at ON agent_outputs(created_at);

-- ========== GRANT PERMISSIONS ==========
GRANT SELECT, INSERT ON agent_outputs TO authenticated;

-- ========== VERIFY SETUP ==========
SELECT 
  'Setup complete!' AS status,
  (SELECT COUNT(*) FROM auth.users) AS active_users,
  (SELECT extversion FROM pg_extension WHERE extname = 'vector') AS pgvector_version;
