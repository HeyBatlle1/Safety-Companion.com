import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_DATABASE_URL;

if (!supabaseUrl) {
  console.error('❌ SUPABASE_DATABASE_URL not found in environment variables');
  process.exit(1);
}

const pool = new Pool({
  connectionString: supabaseUrl,
  ssl: { rejectUnauthorized: false },
});

const extensionsSQL = `
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
`;

const tablesSQL = `
-- Create users table
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

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  employee_id TEXT UNIQUE,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  role TEXT DEFAULT 'field_worker' CHECK (role IN ('admin', 'safety_manager', 'project_manager', 'supervisor', 'field_worker')),
  department TEXT,
  company_id UUID,
  supervisor_id UUID,
  hire_date DATE,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  profile_photo_url TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relationship TEXT,
  certifications_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create analysis_history table
CREATE TABLE IF NOT EXISTS analysis_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  response TEXT NOT NULL,
  type TEXT NOT NULL,
  risk_score INTEGER,
  sentiment_score INTEGER,
  urgency_level TEXT,
  safety_categories JSONB,
  keyword_tags JSONB,
  confidence_score INTEGER,
  behavior_indicators JSONB,
  compliance_score INTEGER,
  metadata JSONB,
  embedding vector(768),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ
);

-- Create agent_outputs table
CREATE TABLE IF NOT EXISTS agent_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID REFERENCES analysis_history(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,
  agent_name TEXT NOT NULL,
  agent_type TEXT NOT NULL,
  output_data JSONB NOT NULL,
  execution_metadata JSONB,
  success BOOLEAN DEFAULT true NOT NULL,
  error_details TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create jha_updates table
CREATE TABLE IF NOT EXISTS jha_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  baseline_analysis_id UUID REFERENCES analysis_history(id) ON DELETE CASCADE NOT NULL,
  update_analysis_id UUID REFERENCES analysis_history(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  update_number INTEGER NOT NULL,
  changed_categories JSONB NOT NULL,
  new_wind_speed TEXT,
  new_crew_members JSONB,
  new_hazards JSONB,
  risk_assessment TEXT NOT NULL,
  comparison_result JSONB,
  go_no_go_decision TEXT,
  decision_reason TEXT,
  change_highlights JSONB,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
`;

const indexesSQL = `
-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_employee_id ON user_profiles(employee_id);
CREATE INDEX IF NOT EXISTS idx_analysis_history_user_id ON analysis_history(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_history_type ON analysis_history(type);
CREATE INDEX IF NOT EXISTS idx_analysis_history_created_at ON analysis_history(created_at);
CREATE INDEX IF NOT EXISTS idx_agent_outputs_analysis_id ON agent_outputs(analysis_id);
CREATE INDEX IF NOT EXISTS idx_agent_outputs_agent_type ON agent_outputs(agent_type);
CREATE INDEX IF NOT EXISTS idx_agent_outputs_created_at ON agent_outputs(created_at);
CREATE INDEX IF NOT EXISTS jha_updates_baseline_analysis_id_idx ON jha_updates(baseline_analysis_id);
CREATE INDEX IF NOT EXISTS jha_updates_user_id_idx ON jha_updates(user_id);
CREATE INDEX IF NOT EXISTS jha_updates_created_at_idx ON jha_updates(created_at);
`;

const rlsSQL = `
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE jha_updates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
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

-- RLS Policies for user_profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
CREATE POLICY "Users can view their own profile" 
  ON user_profiles FOR SELECT 
  USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
CREATE POLICY "Users can update their own profile" 
  ON user_profiles FOR UPDATE 
  USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
CREATE POLICY "Users can insert their own profile" 
  ON user_profiles FOR INSERT 
  WITH CHECK (auth.uid()::text = user_id::text);

-- RLS Policies for analysis_history
DROP POLICY IF EXISTS "Users can view their own analysis history" ON analysis_history;
CREATE POLICY "Users can view their own analysis history" 
  ON analysis_history FOR SELECT 
  USING (auth.uid()::text = user_id::text OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can insert their own analysis" ON analysis_history;
CREATE POLICY "Users can insert their own analysis" 
  ON analysis_history FOR INSERT 
  WITH CHECK (auth.uid()::text = user_id::text OR user_id IS NULL);

-- RLS Policies for agent_outputs
DROP POLICY IF EXISTS "Users can view agent outputs" ON agent_outputs;
CREATE POLICY "Users can view agent outputs" 
  ON agent_outputs FOR SELECT 
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can insert agent outputs" ON agent_outputs;
CREATE POLICY "Users can insert agent outputs" 
  ON agent_outputs FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- RLS Policies for jha_updates
DROP POLICY IF EXISTS "Users can view their own jha updates" ON jha_updates;
CREATE POLICY "Users can view their own jha updates" 
  ON jha_updates FOR SELECT 
  USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can insert their own jha updates" ON jha_updates;
CREATE POLICY "Users can insert their own jha updates" 
  ON jha_updates FOR INSERT 
  WITH CHECK (auth.uid()::text = user_id::text);
`;

const grantsSQL = `
-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON users TO authenticated;
GRANT SELECT, INSERT, UPDATE ON users TO anon;
GRANT SELECT, INSERT, UPDATE ON user_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON analysis_history TO authenticated;
GRANT SELECT, INSERT, UPDATE ON agent_outputs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON jha_updates TO authenticated;
`;

const triggersSQL = `
-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_analysis_history_updated_at ON analysis_history;
CREATE TRIGGER update_analysis_history_updated_at 
    BEFORE UPDATE ON analysis_history 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;

async function setupSupabaseSchema() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting Supabase schema setup...');
    
    // Execute in batches to handle dependencies properly
    console.log('📦 Creating extensions...');
    await client.query(extensionsSQL);
    
    console.log('📋 Creating tables...');
    await client.query(tablesSQL);
    
    console.log('🔍 Creating indexes...');
    await client.query(indexesSQL);
    
    console.log('🔒 Configuring RLS policies...');
    await client.query(rlsSQL);
    
    console.log('✅ Granting permissions...');
    await client.query(grantsSQL);
    
    console.log('⚡ Creating triggers...');
    await client.query(triggersSQL);
    
    console.log('\n✅ Supabase schema setup complete!');
    console.log('📋 Tables created: users, user_profiles, analysis_history, agent_outputs, jha_updates');
    console.log('🔒 RLS policies and permissions configured');
    console.log('🎯 Indexes created for optimal performance');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

setupSupabaseSchema();
