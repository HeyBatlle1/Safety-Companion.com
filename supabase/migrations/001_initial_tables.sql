/*
  # Step 1: Core Tables Setup (Migration Order Critical)
  
  Run this FIRST - other tables depend on user_profiles
*/

-- Main user profiles table (foundation table - run first)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id TEXT UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'safety_manager', 'project_manager', 'supervisor', 'field_worker')),
  department TEXT,
  company_id UUID DEFAULT gen_random_uuid(), -- Multi-tenant support
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

-- Safety reports table (depends on user_profiles)
CREATE TABLE IF NOT EXISTS safety_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_profile_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN ('incident', 'near_miss', 'hazard', 'inspection')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
  location TEXT,
  photos JSONB DEFAULT '[]'::jsonb,
  assigned_to UUID REFERENCES user_profiles(id),
  resolved_by UUID REFERENCES user_profiles(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Chat messages table (depends on user_profiles)
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_profile_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  message_type TEXT CHECK (message_type IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Analysis history table (depends on user_profiles)
CREATE TABLE IF NOT EXISTS analysis_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_profile_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  analysis_type TEXT CHECK (analysis_type IN ('sds', 'safety_check', 'risk_assessment')),
  input_data JSONB NOT NULL,
  output_data JSONB NOT NULL,
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_safety_reports_updated_at 
    BEFORE UPDATE ON safety_reports 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert demo company data
DO $$
DECLARE
    demo_company_id UUID := gen_random_uuid();
BEGIN
    -- Insert demo users with proper role hierarchy
    INSERT INTO user_profiles (
        auth_user_id, employee_id, first_name, last_name, email, role, 
        department, company_id, is_active, hire_date
    ) VALUES 
        (gen_random_uuid(), 'ADMIN001', 'Sarah', 'Chen', 'admin@safetycompanion.demo', 'admin', 
         'Administration', demo_company_id, true, '2024-01-01'),
        (gen_random_uuid(), 'SAFE001', 'Mike', 'Rodriguez', 'safety@safetycompanion.demo', 'safety_manager', 
         'Safety & Compliance', demo_company_id, true, '2024-01-15'),
        (gen_random_uuid(), 'PM001', 'Jennifer', 'Kim', 'pm@safetycompanion.demo', 'project_manager', 
         'Construction Operations', demo_company_id, true, '2024-02-01'),
        (gen_random_uuid(), 'SUP001', 'David', 'Thompson', 'supervisor@safetycompanion.demo', 'supervisor', 
         'Field Operations', demo_company_id, true, '2024-02-15'),
        (gen_random_uuid(), 'WORK001', 'Maria', 'Lopez', 'worker@safetycompanion.demo', 'field_worker', 
         'Construction Crew', demo_company_id, true, '2024-03-01')
    ON CONFLICT (employee_id) DO NOTHING;
    
    -- Set supervisor relationships
    UPDATE user_profiles SET supervisor_id = (
        SELECT id FROM user_profiles WHERE employee_id = 'SUP001'
    ) WHERE employee_id = 'WORK001';
    
    UPDATE user_profiles SET supervisor_id = (
        SELECT id FROM user_profiles WHERE employee_id = 'PM001'
    ) WHERE employee_id = 'SUP001';
    
    RAISE NOTICE 'Demo company created with ID: %', demo_company_id;
END $$;