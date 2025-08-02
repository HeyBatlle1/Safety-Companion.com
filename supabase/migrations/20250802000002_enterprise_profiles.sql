/*
  # Enterprise Profile System for 175-Person Company
  
  This migration creates a comprehensive user profile system designed for
  a construction/safety company with 175 employees, including:
  
  1. Enhanced user profiles with company hierarchy
  2. Department and role management
  3. Project assignments
  4. Safety certifications tracking
  5. Proper RLS policies for multi-tenant security
*/

-- Create companies table for multi-company support
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  license_number TEXT,
  safety_officer_email TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ
);

-- Create departments table
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  supervisor_id UUID,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(company_id, name)
);

-- Enhanced user profiles for enterprise
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  department_id UUID REFERENCES departments(id),
  employee_id TEXT UNIQUE,
  role TEXT DEFAULT 'field_worker' CHECK (role IN ('admin', 'safety_manager', 'project_manager', 'supervisor', 'field_worker')),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  hire_date DATE,
  job_title TEXT,
  supervisor_id UUID REFERENCES auth.users(id),
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relationship TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  profile_photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ
);

-- Projects table for work assignments
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  address TEXT,
  project_manager_id UUID REFERENCES auth.users(id),
  start_date DATE,
  expected_end_date DATE,
  actual_end_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('planning', 'active', 'on_hold', 'completed', 'cancelled')),
  budget DECIMAL,
  safety_requirements JSONB,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ
);

-- User project assignments
CREATE TABLE IF NOT EXISTS user_project_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id),
  role_on_project TEXT DEFAULT 'worker' CHECK (role_on_project IN ('manager', 'supervisor', 'lead', 'worker')),
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  hourly_rate DECIMAL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, project_id, is_active) DEFERRABLE INITIALLY DEFERRED
);

-- Safety certifications tracking
CREATE TABLE IF NOT EXISTS user_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  certification_name TEXT NOT NULL,
  certification_type TEXT CHECK (certification_type IN ('safety', 'trade', 'license', 'training', 'medical')),
  issuing_authority TEXT NOT NULL,
  certification_number TEXT,
  issue_date DATE NOT NULL,
  expiry_date DATE,
  renewal_required BOOLEAN DEFAULT true,
  renewal_period_months INTEGER DEFAULT 12,
  certificate_file_url TEXT,
  verification_url TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'suspended', 'revoked', 'pending')),
  reminder_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ
);

-- Time tracking for payroll integration
CREATE TABLE IF NOT EXISTS time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id),
  clock_in TIMESTAMPTZ NOT NULL,
  clock_out TIMESTAMPTZ,
  break_duration_minutes INTEGER DEFAULT 0,
  total_hours DECIMAL GENERATED ALWAYS AS (
    CASE 
      WHEN clock_out IS NOT NULL 
      THEN EXTRACT(EPOCH FROM (clock_out - clock_in)) / 3600.0 - (break_duration_minutes / 60.0)
      ELSE NULL 
    END
  ) STORED,
  location_lat DECIMAL,
  location_lng DECIMAL,
  notes TEXT,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_project_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

-- Helper functions for RLS
CREATE OR REPLACE FUNCTION get_user_company_id(user_uuid UUID)
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT company_id FROM user_profiles WHERE id = user_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_role(user_uuid UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT role FROM user_profiles WHERE id = user_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_admin_or_manager(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role IN ('admin', 'safety_manager', 'project_manager') 
    FROM user_profiles 
    WHERE id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION can_manage_user(manager_uuid UUID, target_user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  manager_role TEXT;
  same_company BOOLEAN;
BEGIN
  SELECT role INTO manager_role FROM user_profiles WHERE id = manager_uuid;
  
  -- Admins can manage anyone in their company
  IF manager_role = 'admin' THEN
    SELECT (get_user_company_id(manager_uuid) = get_user_company_id(target_user_uuid)) INTO same_company;
    RETURN same_company;
  END IF;
  
  -- Project managers can manage users on their projects
  IF manager_role IN ('project_manager', 'safety_manager') THEN
    RETURN EXISTS (
      SELECT 1 FROM user_project_assignments upa1
      JOIN user_project_assignments upa2 ON upa1.project_id = upa2.project_id
      WHERE upa1.user_id = manager_uuid 
        AND upa1.role_on_project IN ('manager', 'supervisor')
        AND upa2.user_id = target_user_uuid
        AND upa1.is_active = true
        AND upa2.is_active = true
    );
  END IF;
  
  -- Supervisors can manage direct reports
  IF manager_role = 'supervisor' THEN
    RETURN EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = target_user_uuid AND supervisor_id = manager_uuid
    );
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for companies
CREATE POLICY "Users can view their company" ON companies
  FOR SELECT USING (id = get_user_company_id(auth.uid()));

CREATE POLICY "Admins can manage their company" ON companies
  FOR ALL USING (
    id = get_user_company_id(auth.uid()) AND 
    get_user_role(auth.uid()) = 'admin'
  );

-- RLS Policies for departments
CREATE POLICY "Users can view departments in their company" ON departments
  FOR SELECT USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Managers can manage departments" ON departments
  FOR ALL USING (
    company_id = get_user_company_id(auth.uid()) AND 
    is_admin_or_manager(auth.uid())
  );

-- RLS Policies for user_profiles
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid() AND
    -- Prevent role changes by non-admins
    (role = (SELECT role FROM user_profiles WHERE id = auth.uid()) OR get_user_role(auth.uid()) = 'admin')
  );

CREATE POLICY "Managers can view managed users" ON user_profiles
  FOR SELECT USING (can_manage_user(auth.uid(), id));

CREATE POLICY "Managers can update managed users" ON user_profiles
  FOR UPDATE USING (can_manage_user(auth.uid(), id));

CREATE POLICY "Admins can insert new users" ON user_profiles
  FOR INSERT WITH CHECK (
    get_user_role(auth.uid()) = 'admin' AND
    company_id = get_user_company_id(auth.uid())
  );

-- RLS Policies for projects
CREATE POLICY "Users can view projects they're assigned to" ON projects
  FOR SELECT USING (
    id IN (
      SELECT project_id FROM user_project_assignments 
      WHERE user_id = auth.uid() AND is_active = true
    ) OR 
    company_id = get_user_company_id(auth.uid())
  );

CREATE POLICY "Project managers can manage projects" ON projects
  FOR ALL USING (
    project_manager_id = auth.uid() OR
    (company_id = get_user_company_id(auth.uid()) AND is_admin_or_manager(auth.uid()))
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_company ON user_profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_supervisor ON user_profiles(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_employee_id ON user_profiles(employee_id);
CREATE INDEX IF NOT EXISTS idx_user_project_assignments_user ON user_project_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_project_assignments_project ON user_project_assignments(project_id);
CREATE INDEX IF NOT EXISTS idx_user_certifications_user ON user_certifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_certifications_expiry ON user_certifications(expiry_date);
CREATE INDEX IF NOT EXISTS idx_time_entries_user_date ON time_entries(user_id, clock_in);

-- Insert a default company for existing users
INSERT INTO companies (id, name, active) 
VALUES ('11111111-2222-3333-4444-555555555555'::uuid, 'Safety Companion Demo Company', true)
ON CONFLICT DO NOTHING;

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user_enterprise()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into user_profiles with demo company
  INSERT INTO public.user_profiles (
    id, 
    company_id,
    role, 
    first_name,
    last_name,
    email,
    is_active
  )
  VALUES (
    new.id,
    '11111111-2222-3333-4444-555555555555'::uuid,
    'field_worker',
    COALESCE(new.raw_user_meta_data->>'first_name', 'New'),
    COALESCE(new.raw_user_meta_data->>'last_name', 'User'),
    new.email,
    true
  );
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_enterprise();

COMMENT ON TABLE user_profiles IS 'Enterprise user profiles for 175-person construction company';
COMMENT ON TABLE projects IS 'Construction project management and assignments';
COMMENT ON TABLE user_certifications IS 'Safety and trade certifications with expiry tracking';