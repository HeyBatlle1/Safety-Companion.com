/*
  # Fix Database Issues

  1. Changes
    - Fix inconsistencies between migrations
    - Ensure all required tables exist with proper schemas
    - Verify and fix RLS policies
    - Add missing columns to existing tables
*/

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

-- Fix notification_preferences table
-- Add missing columns if they don't exist
ALTER TABLE IF EXISTS notification_preferences 
  ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS sms_notifications BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS push_notifications BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS certification_expiry_alerts BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS certification_alert_days INTEGER DEFAULT 30,
  ADD COLUMN IF NOT EXISTS drug_screen_reminders BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS safety_alerts BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS project_updates BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS training_reminders BOOLEAN DEFAULT true;

-- Fix missing user_id unique constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'notification_preferences_user_id_key' AND conrelid = 'notification_preferences'::regclass
  ) THEN
    ALTER TABLE notification_preferences ADD CONSTRAINT notification_preferences_user_id_key UNIQUE (user_id);
  END IF;
EXCEPTION
  WHEN undefined_table THEN
    -- Do nothing if table doesn't exist
END;
$$;

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

-- Make sure Row Level Security is enabled
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'risk_assessments') THEN
    ALTER TABLE risk_assessments ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'analysis_history') THEN
    ALTER TABLE analysis_history ENABLE ROW LEVEL SECURITY;
  END IF;
END;
$$;

-- Create or replace policies for risk_assessments
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'risk_assessments') THEN
    DROP POLICY IF EXISTS "Users can view risk assessments" ON risk_assessments;
    CREATE POLICY "Users can view risk assessments"
      ON risk_assessments
      FOR SELECT
      TO authenticated
      USING (true);
      
    DROP POLICY IF EXISTS "Users can insert risk assessments" ON risk_assessments;
    CREATE POLICY "Users can insert risk assessments"
      ON risk_assessments
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
END;
$$;

-- Create or replace policies for analysis_history
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'analysis_history') THEN
    DROP POLICY IF EXISTS "Users can manage their own analysis history" ON analysis_history;
    CREATE POLICY "Users can manage their own analysis history"
      ON analysis_history
      FOR ALL
      USING (user_id = auth.uid());
  END IF;
END;
$$;

-- Create indexes for better performance
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'risk_assessments') THEN
    CREATE INDEX IF NOT EXISTS idx_risk_assessments_site_id ON risk_assessments(site_id);
    CREATE INDEX IF NOT EXISTS idx_risk_assessments_created_at ON risk_assessments(created_at);
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'analysis_history') THEN
    CREATE INDEX IF NOT EXISTS idx_analysis_history_user_id ON analysis_history(user_id);
    CREATE INDEX IF NOT EXISTS idx_analysis_history_type ON analysis_history(type);
    CREATE INDEX IF NOT EXISTS idx_analysis_history_created_at ON analysis_history(created_at);
  END IF;
END;
$$;