-- Supabase Migration: Create Missing Tables for Safety Companion
-- Run this in your Supabase SQL Editor

-- 1. Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  employee_id TEXT UNIQUE,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  role TEXT DEFAULT 'field_worker' CHECK (role IN ('admin', 'safety_manager', 'project_manager', 'supervisor', 'field_worker')),
  department TEXT,
  company_id UUID DEFAULT gen_random_uuid(),
  supervisor_id UUID REFERENCES user_profiles(id),
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

-- 2. Create analysis_history table for JHA/EAP results
CREATE TABLE IF NOT EXISTS analysis_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  response TEXT NOT NULL,
  type TEXT NOT NULL, -- 'jha_multi_agent_analysis', 'eap_generation', 'chat_response', etc.
  risk_score INTEGER,
  sentiment_score INTEGER,
  urgency_level TEXT,
  safety_categories JSONB,
  keyword_tags JSONB,
  confidence_score INTEGER,
  behavior_indicators JSONB,
  compliance_score INTEGER,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ
);

-- 3. Enable RLS on tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_history ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for user_profiles
CREATE POLICY "Users can view their own profile" 
  ON user_profiles FOR SELECT 
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update their own profile" 
  ON user_profiles FOR UPDATE 
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can insert their own profile" 
  ON user_profiles FOR INSERT 
  WITH CHECK (auth.uid() = auth_user_id);

-- 5. RLS Policies for analysis_history  
CREATE POLICY "Users can view their own analysis history" 
  ON analysis_history FOR SELECT 
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own analysis" 
  ON analysis_history FOR INSERT 
  WITH CHECK (auth.uid()::text = user_id::text);

-- 6. Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Apply triggers
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analysis_history_updated_at 
    BEFORE UPDATE ON analysis_history 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_auth_user_id ON user_profiles(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_employee_id ON user_profiles(employee_id);

CREATE INDEX IF NOT EXISTS idx_analysis_history_user_id ON analysis_history(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_history_type ON analysis_history(type);
CREATE INDEX IF NOT EXISTS idx_analysis_history_created_at ON analysis_history(created_at);

-- 9. Grant permissions
GRANT SELECT, INSERT, UPDATE ON user_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON analysis_history TO authenticated;
GRANT SELECT, INSERT, UPDATE ON agent_outputs TO authenticated;

-- Done!
SELECT 'Supabase migration complete!' AS status;
