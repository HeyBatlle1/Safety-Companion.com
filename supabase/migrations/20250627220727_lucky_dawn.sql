/*
  # Enterprise User Profile and Permissions System

  1. New Tables
    - `user_profiles` - Extended user profile information with roles and company data
    - `companies` - Company/organization management
    - `projects` - Project management and assignments
    - `user_project_assignments` - Many-to-many relationship for user-project assignments
    - `drug_screens` - Drug screening records with expiration tracking
    - `user_certifications` - User certifications with expiration alerts
    - `notification_preferences` - User notification settings
    - `role_permissions` - Define what each role can do

  2. Security
    - Enable RLS on all tables
    - Implement role-based policies
    - Secure by default - no elevated permissions without admin assignment

  3. Roles
    - Admin: Full access, can assign roles
    - Project Manager: Can view team data, assign field workers
    - Field Worker: Can only view/edit own profile and assigned checklists
*/

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  license_number TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'on_hold', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ
);

-- Create enhanced user profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  role TEXT DEFAULT 'field_worker' CHECK (role IN ('admin', 'project_manager', 'field_worker')),
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  employee_id TEXT UNIQUE,
  hire_date DATE,
  department TEXT,
  supervisor_id UUID REFERENCES auth.users(id),
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ
);

-- Create user project assignments table
CREATE TABLE IF NOT EXISTS user_project_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  role_on_project TEXT DEFAULT 'worker' CHECK (role_on_project IN ('manager', 'supervisor', 'worker')),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, project_id)
);

-- Create drug screens table (enhanced from existing)
CREATE TABLE IF NOT EXISTS drug_screens_enhanced (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  test_date DATE NOT NULL,
  test_type TEXT DEFAULT 'pre_employment' CHECK (test_type IN ('pre_employment', 'random', 'post_incident', 'return_to_duty', 'follow_up')),
  result TEXT NOT NULL CHECK (result IN ('pending', 'passed', 'failed', 'cancelled')),
  testing_facility TEXT,
  chain_of_custody_number TEXT,
  expiry_date DATE, -- For certifications that require periodic testing
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ
);

-- Create user certifications table (enhanced from existing)
CREATE TABLE IF NOT EXISTS user_certifications_enhanced (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  certification_name TEXT NOT NULL,
  certification_type TEXT CHECK (certification_type IN ('safety', 'trade', 'license', 'training')),
  issuing_authority TEXT NOT NULL,
  certification_number TEXT,
  issue_date DATE NOT NULL,
  expiry_date DATE,
  renewal_required BOOLEAN DEFAULT true,
  renewal_period_months INTEGER, -- How many months before expiry to send alerts
  certificate_file_url TEXT,
  verification_url TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'suspended', 'revoked')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ
);

-- Create notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT false,
  push_notifications BOOLEAN DEFAULT true,
  certification_expiry_alerts BOOLEAN DEFAULT true,
  certification_alert_days INTEGER DEFAULT 30, -- Days before expiry to alert
  drug_screen_reminders BOOLEAN DEFAULT true,
  safety_alerts BOOLEAN DEFAULT true,
  project_updates BOOLEAN DEFAULT true,
  training_reminders BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ,
  UNIQUE(user_id)
);

-- Create role permissions table
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL,
  resource TEXT NOT NULL, -- e.g., 'profiles', 'projects', 'safety_reports'
  action TEXT NOT NULL, -- e.g., 'read', 'write', 'delete', 'assign'
  scope TEXT DEFAULT 'own' CHECK (scope IN ('own', 'team', 'company', 'all')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(role, resource, action)
);

-- Insert default role permissions
INSERT INTO role_permissions (role, resource, action, scope) VALUES
-- Admin permissions
('admin', 'profiles', 'read', 'all'),
('admin', 'profiles', 'write', 'all'),
('admin', 'profiles', 'delete', 'all'),
('admin', 'profiles', 'assign_role', 'all'),
('admin', 'projects', 'read', 'all'),
('admin', 'projects', 'write', 'all'),
('admin', 'projects', 'delete', 'all'),
('admin', 'safety_reports', 'read', 'all'),
('admin', 'safety_reports', 'write', 'all'),
('admin', 'certifications', 'read', 'all'),
('admin', 'certifications', 'write', 'all'),

-- Project Manager permissions
('project_manager', 'profiles', 'read', 'team'),
('project_manager', 'profiles', 'write', 'team'),
('project_manager', 'projects', 'read', 'team'),
('project_manager', 'projects', 'write', 'team'),
('project_manager', 'safety_reports', 'read', 'team'),
('project_manager', 'safety_reports', 'write', 'team'),
('project_manager', 'certifications', 'read', 'team'),
('project_manager', 'user_assignments', 'write', 'team'),

-- Field Worker permissions
('field_worker', 'profiles', 'read', 'own'),
('field_worker', 'profiles', 'write', 'own'),
('field_worker', 'safety_reports', 'read', 'own'),
('field_worker', 'safety_reports', 'write', 'own'),
('field_worker', 'certifications', 'read', 'own'),
('field_worker', 'certifications', 'write', 'own'),
('field_worker', 'checklists', 'read', 'own'),
('field_worker', 'checklists', 'write', 'own');

-- Enable Row Level Security on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_project_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE drug_screens_enhanced ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_certifications_enhanced ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- Helper function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_uuid UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role 
    FROM user_profiles 
    WHERE id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role = 'admin' 
    FROM user_profiles 
    WHERE id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is project manager
CREATE OR REPLACE FUNCTION is_project_manager(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role IN ('admin', 'project_manager') 
    FROM user_profiles 
    WHERE id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get user's team members (for project managers)
CREATE OR REPLACE FUNCTION get_team_members(manager_uuid UUID)
RETURNS TABLE(user_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT upa.user_id
  FROM user_project_assignments upa
  JOIN user_project_assignments manager_projects ON manager_projects.project_id = upa.project_id
  WHERE manager_projects.user_id = manager_uuid
    AND manager_projects.role_on_project IN ('manager', 'supervisor')
    AND upa.is_active = true
    AND manager_projects.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for companies
CREATE POLICY "Admins can manage all companies"
  ON companies FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Users can view their company"
  ON companies FOR SELECT
  USING (
    id IN (
      SELECT company_id 
      FROM user_profiles 
      WHERE id = auth.uid()
    )
  );

-- RLS Policies for projects
CREATE POLICY "Admins can manage all projects"
  ON projects FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Project managers can view assigned projects"
  ON projects FOR SELECT
  USING (
    is_project_manager(auth.uid()) AND
    id IN (
      SELECT project_id 
      FROM user_project_assignments 
      WHERE user_id = auth.uid() 
        AND role_on_project IN ('manager', 'supervisor')
        AND is_active = true
    )
  );

CREATE POLICY "Users can view their assigned projects"
  ON projects FOR SELECT
  USING (
    id IN (
      SELECT project_id 
      FROM user_project_assignments 
      WHERE user_id = auth.uid() 
        AND is_active = true
    )
  );

-- RLS Policies for user_profiles
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid() AND
    -- Prevent users from changing their own role (only admins can do this)
    (role = (SELECT role FROM user_profiles WHERE id = auth.uid()) OR is_admin(auth.uid()))
  );

CREATE POLICY "Admins can manage all profiles"
  ON user_profiles FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Project managers can view team profiles"
  ON user_profiles FOR SELECT
  USING (
    is_project_manager(auth.uid()) AND
    id IN (SELECT user_id FROM get_team_members(auth.uid()))
  );

CREATE POLICY "Project managers can update team profiles"
  ON user_profiles FOR UPDATE
  USING (
    is_project_manager(auth.uid()) AND
    id IN (SELECT user_id FROM get_team_members(auth.uid()))
  )
  WITH CHECK (
    -- Project managers cannot change roles
    role = (SELECT role FROM user_profiles WHERE id = user_profiles.id)
  );

-- RLS Policies for user_project_assignments
CREATE POLICY "Admins can manage all assignments"
  ON user_project_assignments FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Project managers can manage team assignments"
  ON user_project_assignments FOR ALL
  USING (
    is_project_manager(auth.uid()) AND
    project_id IN (
      SELECT project_id 
      FROM user_project_assignments 
      WHERE user_id = auth.uid() 
        AND role_on_project IN ('manager', 'supervisor')
        AND is_active = true
    )
  );

CREATE POLICY "Users can view their own assignments"
  ON user_project_assignments FOR SELECT
  USING (user_id = auth.uid());

-- RLS Policies for drug_screens_enhanced
CREATE POLICY "Users can view their own drug screens"
  ON drug_screens_enhanced FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all drug screens"
  ON drug_screens_enhanced FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Project managers can view team drug screens"
  ON drug_screens_enhanced FOR SELECT
  USING (
    is_project_manager(auth.uid()) AND
    user_id IN (SELECT user_id FROM get_team_members(auth.uid()))
  );

-- RLS Policies for user_certifications_enhanced
CREATE POLICY "Users can manage their own certifications"
  ON user_certifications_enhanced FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all certifications"
  ON user_certifications_enhanced FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Project managers can view team certifications"
  ON user_certifications_enhanced FOR SELECT
  USING (
    is_project_manager(auth.uid()) AND
    user_id IN (SELECT user_id FROM get_team_members(auth.uid()))
  );

-- RLS Policies for notification_preferences
CREATE POLICY "Users can manage their own notification preferences"
  ON notification_preferences FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all notification preferences"
  ON notification_preferences FOR SELECT
  USING (is_admin(auth.uid()));

-- RLS Policies for role_permissions (read-only for most users)
CREATE POLICY "Everyone can view role permissions"
  ON role_permissions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can modify role permissions"
  ON role_permissions FOR ALL
  USING (is_admin(auth.uid()));

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Create user profile with default field_worker role
  INSERT INTO public.user_profiles (id, role)
  VALUES (new.id, 'field_worker');
  
  -- Create default notification preferences
  INSERT INTO public.notification_preferences (user_id)
  VALUES (new.id);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the existing trigger or create new one
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_company ON user_profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_user_project_assignments_user ON user_project_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_project_assignments_project ON user_project_assignments(project_id);
CREATE INDEX IF NOT EXISTS idx_user_certifications_expiry ON user_certifications_enhanced(expiry_date) WHERE expiry_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_drug_screens_expiry ON drug_screens_enhanced(expiry_date) WHERE expiry_date IS NOT NULL;

-- Create view for certification expiry alerts
CREATE OR REPLACE VIEW certification_expiry_alerts AS
SELECT 
  uc.id,
  uc.user_id,
  up.first_name,
  up.last_name,
  up.employee_id,
  uc.certification_name,
  uc.expiry_date,
  uc.expiry_date - CURRENT_DATE as days_until_expiry,
  np.certification_alert_days
FROM user_certifications_enhanced uc
JOIN user_profiles up ON uc.user_id = up.id
JOIN notification_preferences np ON uc.user_id = np.user_id
WHERE uc.expiry_date IS NOT NULL
  AND uc.status = 'active'
  AND uc.expiry_date - CURRENT_DATE <= np.certification_alert_days
  AND np.certification_expiry_alerts = true;

-- Grant access to the view
GRANT SELECT ON certification_expiry_alerts TO authenticated;