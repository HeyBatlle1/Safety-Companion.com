/*
  # Comprehensive Schema Fix

  This migration ensures that all database tables and columns expected by the application actually exist,
  with the correct data types, constraints, and indexes for optimal performance.

  1. Fixes
    - Ensures all required tables exist
    - Adds missing columns with proper types
    - Adds required constraints and indexes
    - Sets up proper row level security policies
    - Handles foreign key relationships correctly
  
  2. Schema Alignment
    - Aligns database schema with application expectations
    - Adds defaults and fallbacks for backward compatibility
*/

-- SAFETY AGENT TABLES --

-- Ensure risk_assessments table exists with all required fields
CREATE TABLE IF NOT EXISTS risk_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id TEXT NOT NULL,
  assessment JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ
);

-- Ensure site_conditions table exists
CREATE TABLE IF NOT EXISTS site_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id TEXT NOT NULL,
  conditions JSONB NOT NULL,
  restrictions TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ
);

-- Ensure tasks table exists
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'in-progress', 'completed', 'cancelled')),
  assigned_to TEXT[] DEFAULT '{}',
  equipment TEXT[] DEFAULT '{}',
  hazards TEXT[] DEFAULT '{}',
  safety_requirements TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ
);

-- HISTORY & ANALYSIS TABLES --

-- Ensure analysis_history table exists
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

-- NOTIFICATION PREFERENCES --

-- Fix notification_preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
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

-- CHAT & MESSAGING --

-- Ensure chat_messages table has all required fields
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_messages') THEN
    ALTER TABLE chat_messages 
      ADD COLUMN IF NOT EXISTS session_id UUID,
      ADD COLUMN IF NOT EXISTS reply_to UUID,
      ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS reactions JSONB,
      ADD COLUMN IF NOT EXISTS metadata JSONB;
  END IF;
END $$;

-- Ensure chat_sessions table exists
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'Safety Assistant Chat',
  summary TEXT,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ,
  last_message_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- SAFETY REPORTING --

-- Ensure safety_reports table has all required fields
CREATE TABLE IF NOT EXISTS safety_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  severity TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT,
  status TEXT DEFAULT 'pending' NOT NULL,
  updated_at TIMESTAMPTZ,
  attachments JSONB
);

-- PROFILE MANAGEMENT --

-- Ensure user_profiles has all required fields
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

-- Add unique constraint to employee_id if it doesn't exist already
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_profiles_employee_id_key' AND conrelid = 'user_profiles'::regclass
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'employee_id'
  ) THEN
    ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_employee_id_key UNIQUE (employee_id);
  END IF;
EXCEPTION
  WHEN undefined_table THEN
    -- Do nothing if table doesn't exist
END;
$$;

-- VIDEO TRACKING --

-- Ensure watched_videos table exists
CREATE TABLE IF NOT EXISTS watched_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  video_id TEXT NOT NULL,
  watched_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, video_id)
);

-- MAP SERVICES --

-- Ensure map_locations table exists
CREATE TABLE IF NOT EXISTS map_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  notes TEXT,
  location_type TEXT DEFAULT 'custom' CHECK (location_type IN ('custom', 'work', 'home', 'favorite')),
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ
);

-- FUNCTIONS & PROCEDURES --

-- Ensure user creation triggers work properly
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Create user profile
  INSERT INTO public.user_profiles (id, role)
  VALUES (new.id, 'field_worker')
  ON CONFLICT (id) DO NOTHING;
  
  -- Create default notification preferences
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
  
  -- Create default chat session
  INSERT INTO chat_sessions (user_id, title)
  VALUES (new.id, 'Safety Assistant Chat')
  ON CONFLICT DO NOTHING;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get user role (create or replace)
CREATE OR REPLACE FUNCTION get_user_role(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM user_profiles 
  WHERE id = user_uuid;
  
  IF user_role IS NULL THEN
    RETURN 'field_worker';
  END IF;
  
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ENABLE ROW LEVEL SECURITY --

-- Add RLS to all tables that might be missing it
DO $$
DECLARE
  table_names TEXT[] := ARRAY[
    'risk_assessments', 
    'site_conditions', 
    'tasks',
    'analysis_history',
    'notification_preferences',
    'chat_sessions',
    'chat_messages',
    'safety_reports',
    'user_profiles',
    'watched_videos',
    'map_locations'
  ];
  t TEXT;
BEGIN
  FOREACH t IN ARRAY table_names
  LOOP
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = t) THEN
      EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
    END IF;
  END LOOP;
END;
$$;

-- ADD POLICIES FOR TABLES --

-- Ensure risk_assessments has proper policies
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'risk_assessments') THEN
    DROP POLICY IF EXISTS "Users can view risk assessments" ON risk_assessments;
    CREATE POLICY "Users can view risk assessments"
      ON risk_assessments
      FOR SELECT
      TO authenticated
      USING (true);
      
    DROP POLICY IF EXISTS "Users can create risk assessments" ON risk_assessments;  
    CREATE POLICY "Users can create risk assessments"
      ON risk_assessments
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
END;
$$;

-- Ensure analysis_history has proper policies
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'analysis_history') THEN
    DROP POLICY IF EXISTS "Users can manage their own analysis history" ON analysis_history;
    CREATE POLICY "Users can manage their own analysis history"
      ON analysis_history
      FOR ALL
      USING (user_id = auth.uid() OR user_id IS NULL);
      
    DROP POLICY IF EXISTS "Allow insert even when user_id is null" ON analysis_history;
    CREATE POLICY "Allow insert even when user_id is null"
      ON analysis_history
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
END;
$$;

-- Ensure notification_preferences has proper policies
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'notification_preferences') THEN
    DROP POLICY IF EXISTS "Users can manage their own notification preferences" ON notification_preferences;
    CREATE POLICY "Users can manage their own notification preferences"
      ON notification_preferences
      FOR ALL
      USING (user_id = auth.uid());
  END IF;
END;
$$;

-- CREATE REQUIRED INDEXES --

-- Add indexes to risk_assessments
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'risk_assessments') THEN
    CREATE INDEX IF NOT EXISTS idx_risk_assessments_site_id ON risk_assessments(site_id);
    CREATE INDEX IF NOT EXISTS idx_risk_assessments_created_at ON risk_assessments(created_at);
  END IF;
END;
$$;

-- Add indexes to analysis_history
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'analysis_history') THEN
    CREATE INDEX IF NOT EXISTS idx_analysis_history_user_id ON analysis_history(user_id);
    CREATE INDEX IF NOT EXISTS idx_analysis_history_type ON analysis_history(type);
    CREATE INDEX IF NOT EXISTS idx_analysis_history_created_at ON analysis_history(created_at);
  END IF;
END;
$$;

-- Add indexes to notification_preferences
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'notification_preferences') THEN
    CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);
  END IF;
END;
$$;

-- BACKFILL MISSING DATA --

-- Ensure notification preferences exist for all users
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
    true, -- email_notifications
    false, -- sms_notifications
    true, -- push_notifications
    true, -- certification_expiry_alerts
    30, -- certification_alert_days
    true, -- drug_screen_reminders
    true, -- safety_alerts
    true, -- project_updates
    true -- training_reminders
  FROM 
    auth.users u
  WHERE 
    NOT EXISTS (
      SELECT 1 FROM notification_preferences np WHERE np.user_id = u.id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run the backfill function
SELECT ensure_notification_preferences();

-- Ensure user profiles exist for all users
CREATE OR REPLACE FUNCTION ensure_user_profiles()
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_profiles (
    id,
    role,
    is_active,
    created_at
  )
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run the backfill function
SELECT ensure_user_profiles();

-- ENSURE TRIGGERS EXIST --

-- Make sure triggers are in place for new user creation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created' AND tgrelid = 'auth.users'::regclass
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();
  END IF;
END;
$$;