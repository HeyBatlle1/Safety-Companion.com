-- Ensure risk_assessments table exists with proper schema
CREATE TABLE IF NOT EXISTS risk_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id TEXT NOT NULL,
  assessment JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ
);

-- Ensure analysis_history table exists with proper schema
CREATE TABLE IF NOT EXISTS analysis_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  response TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('safety_assessment', 'risk_assessment', 'sds_analysis', 'chat_response')),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ
);

-- Ensure user_profiles table exists with all required fields
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  company_id UUID,
  role TEXT DEFAULT 'field_worker' CHECK (role IN ('admin', 'project_manager', 'field_worker')),
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  employee_id TEXT,
  hire_date DATE,
  department TEXT,
  supervisor_id UUID,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ
);

-- Ensure notification_preferences table exists with all required fields
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT false,
  push_notifications BOOLEAN DEFAULT true,
  certification_expiry_alerts BOOLEAN DEFAULT true,
  certification_alert_days INTEGER DEFAULT 30,
  drug_screen_reminders BOOLEAN DEFAULT true,
  safety_alerts BOOLEAN DEFAULT true,
  project_updates BOOLEAN DEFAULT true,
  training_reminders BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ,
  UNIQUE(user_id)
);

-- Ensure watched_videos table exists
CREATE TABLE IF NOT EXISTS watched_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  video_id TEXT NOT NULL,
  watched_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, video_id)
);

-- Enable Row Level Security on all tables
ALTER TABLE risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE watched_videos ENABLE ROW LEVEL SECURITY;

-- Create policies for risk_assessments
CREATE POLICY IF NOT EXISTS "Users can view risk assessments"
  ON risk_assessments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY IF NOT EXISTS "Users can insert risk assessments"
  ON risk_assessments FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policies for analysis_history
CREATE POLICY IF NOT EXISTS "Users can manage their own analysis history"
  ON analysis_history FOR ALL
  USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY IF NOT EXISTS "Allow insert even when user_id is null"
  ON analysis_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policies for user_profiles
CREATE POLICY IF NOT EXISTS "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY IF NOT EXISTS "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (id = auth.uid());

-- Create policies for notification_preferences
CREATE POLICY IF NOT EXISTS "Users can manage their own notification preferences"
  ON notification_preferences FOR ALL
  USING (user_id = auth.uid());

-- Create policies for watched_videos
CREATE POLICY IF NOT EXISTS "Users can insert their own watch records"
  ON watched_videos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can view their own watch records"
  ON watched_videos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete their own watch records"
  ON watched_videos FOR DELETE
  USING (auth.uid() = user_id);

-- Helper function to create default notification preferences
CREATE OR REPLACE FUNCTION ensure_notification_preferences()
RETURNS VOID AS $$
BEGIN
  INSERT INTO notification_preferences (
    user_id, 
    email_notifications, 
    sms_notifications, 
    push_notifications,
    certification_expiry_alerts,
    certification_alert_days,
    drug_screen_reminders,
    safety_alerts,
    project_updates,
    training_reminders
  )
  SELECT 
    id, 
    true, 
    false, 
    true,
    true,
    30,
    true,
    true,
    true,
    true
  FROM 
    auth.users u
  WHERE 
    NOT EXISTS (
      SELECT 1 FROM notification_preferences np WHERE np.user_id = u.id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run the function to ensure all users have notification preferences
SELECT ensure_notification_preferences();

-- Helper function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into profiles table
  INSERT INTO public.user_profiles (id, role, is_active)
  VALUES (new.id, 'field_worker', true);
  
  -- Insert into notification_preferences
  INSERT INTO public.notification_preferences (
    user_id, 
    email_notifications, 
    sms_notifications, 
    push_notifications,
    certification_expiry_alerts,
    certification_alert_days,
    drug_screen_reminders,
    safety_alerts,
    project_updates,
    training_reminders
  )
  VALUES (
    new.id,
    true,
    false,
    true,
    true,
    30,
    true,
    true,
    true,
    true
  );
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create exec_sql function for admin database operations
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void AS $$
BEGIN
  EXECUTE sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;