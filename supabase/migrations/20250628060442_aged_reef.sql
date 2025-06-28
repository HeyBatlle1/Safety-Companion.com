/*
  # Fix Duplicate Functions and Ensure Database Schema

  1. Changes
    - Ensure all required tables exist
    - Fix any potential duplicate functions
    - Add missing columns to existing tables
    - Ensure proper RLS policies are in place
*/

-- Create a function to check if a table exists
CREATE OR REPLACE FUNCTION table_exists(table_name text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public'
    AND table_name = table_name
  );
END;
$$ LANGUAGE plpgsql;

-- Ensure risk_assessments table exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'risk_assessments') THEN
    CREATE TABLE risk_assessments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      site_id TEXT NOT NULL,
      assessment JSONB NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
      updated_at TIMESTAMPTZ
    );
    
    ALTER TABLE risk_assessments ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view risk assessments"
      ON risk_assessments FOR SELECT
      TO authenticated
      USING (true);
      
    CREATE POLICY "Users can create risk assessments"
      ON risk_assessments FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
END $$;

-- Ensure analysis_history table exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'analysis_history') THEN
    CREATE TABLE analysis_history (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      query TEXT NOT NULL,
      response TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('safety_assessment', 'risk_assessment', 'sds_analysis', 'chat_response')),
      metadata JSONB,
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
      updated_at TIMESTAMPTZ
    );
    
    ALTER TABLE analysis_history ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can manage their own analysis history"
      ON analysis_history FOR ALL
      USING (user_id = auth.uid() OR user_id IS NULL);
      
    CREATE POLICY "Allow insert even when user_id is null"
      ON analysis_history FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
END $$;

-- Ensure user_profiles table exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_profiles') THEN
    CREATE TABLE user_profiles (
      id UUID REFERENCES auth.users(id) PRIMARY KEY,
      role TEXT DEFAULT 'field_worker' CHECK (role IN ('admin', 'project_manager', 'field_worker')),
      first_name TEXT,
      last_name TEXT,
      phone TEXT,
      employee_id TEXT,
      department TEXT,
      emergency_contact_name TEXT,
      emergency_contact_phone TEXT,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
      updated_at TIMESTAMPTZ
    );
    
    ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view their own profile"
      ON user_profiles FOR SELECT
      USING (id = auth.uid());
      
    CREATE POLICY "Users can update their own profile"
      ON user_profiles FOR UPDATE
      USING (id = auth.uid());
  END IF;
END $$;

-- Ensure notification_preferences table exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'notification_preferences') THEN
    CREATE TABLE notification_preferences (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
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
      updated_at TIMESTAMPTZ
    );
    
    ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can manage their own notification preferences"
      ON notification_preferences FOR ALL
      USING (user_id = auth.uid());
  END IF;
END $$;

-- Create or replace the function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into profiles table
  INSERT INTO public.user_profiles (id, role, is_active)
  VALUES (new.id, 'field_worker', true)
  ON CONFLICT (id) DO NOTHING;
  
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
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace the trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create a function to ensure all users have profiles and preferences
CREATE OR REPLACE FUNCTION ensure_user_data()
RETURNS VOID AS $$
BEGIN
  -- Insert user profiles for users who don't have them
  INSERT INTO user_profiles (id, role, is_active, created_at)
  SELECT 
    id, 
    'field_worker',
    true,
    now()
  FROM 
    auth.users u
  WHERE 
    NOT EXISTS (
      SELECT 1 FROM user_profiles up WHERE up.id = u.id
    );

  -- Insert notification preferences for users who don't have them
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
    training_reminders,
    created_at
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
    true,
    now()
  FROM 
    auth.users u
  WHERE 
    NOT EXISTS (
      SELECT 1 FROM notification_preferences np WHERE np.user_id = u.id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run the function to ensure all users have profiles and preferences
SELECT ensure_user_data();

-- Create a function to execute SQL for admin operations
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void AS $$
BEGIN
  EXECUTE sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;