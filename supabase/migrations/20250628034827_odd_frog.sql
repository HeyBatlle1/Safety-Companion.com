/*
  # Fix Notification Preferences

  1. Changes
    - Add missing columns to notification_preferences table
    - Create default notification preferences for existing users
    - Update notification preferences policies
*/

-- Add missing columns to notification_preferences if they don't exist
ALTER TABLE notification_preferences 
  ADD COLUMN IF NOT EXISTS sms_notifications BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS push_notifications BOOLEAN DEFAULT true;

-- Create a function to ensure notification preferences exist for all users
CREATE OR REPLACE FUNCTION ensure_notification_preferences()
RETURNS VOID AS $$
BEGIN
  -- Insert notification preferences for users who don't have them
  INSERT INTO notification_preferences (user_id, email_notifications, sms_notifications, push_notifications)
  SELECT 
    id, 
    true, -- Default email_notifications to true
    false, -- Default sms_notifications to false
    true -- Default push_notifications to true
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

-- Update RLS policies for notification_preferences
DROP POLICY IF EXISTS "Users can manage their own notification preferences" ON notification_preferences;

CREATE POLICY "Users can manage their own notification preferences"
  ON notification_preferences
  FOR ALL
  USING (user_id = auth.uid());

-- Create a trigger to automatically create notification preferences for new users
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
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
  VALUES (
    NEW.id,
    true,  -- email_notifications
    false, -- sms_notifications
    true,  -- push_notifications
    true,  -- certification_expiry_alerts
    30,    -- certification_alert_days
    true,  -- drug_screen_reminders
    true,  -- safety_alerts
    true,  -- project_updates
    true   -- training_reminders
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace the trigger
DROP TRIGGER IF EXISTS on_auth_user_created_notification_preferences ON auth.users;

CREATE TRIGGER on_auth_user_created_notification_preferences
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_default_notification_preferences();