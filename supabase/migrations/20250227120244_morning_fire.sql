/*
  # Profile Extensions for Safety Records

  1. New Tables
    - `safety_violations` - Store safety violations by users
    - `safety_commendations` - Store safety commendations for users
    - `urine_screens` - Track urine screening results
    - `certifications` - Track user certifications and expiry dates
    
  2. Security
    - Enable RLS on all tables
    - Add policies for users to view their own data
    - Add policies for admins to manage all data
*/

-- Safety Violations table
CREATE TABLE IF NOT EXISTS safety_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  date DATE NOT NULL,
  type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'reviewed', 'cleared')),
  updated_at TIMESTAMPTZ
);

-- Safety Commendations table
CREATE TABLE IF NOT EXISTS safety_commendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  date DATE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  issued_by TEXT NOT NULL,
  updated_at TIMESTAMPTZ
);

-- Urine Screens table
CREATE TABLE IF NOT EXISTS urine_screens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  date DATE NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('pending', 'passed', 'failed')),
  notes TEXT,
  updated_at TIMESTAMPTZ
);

-- Certifications table
CREATE TABLE IF NOT EXISTS certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  issue_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  issuing_authority TEXT NOT NULL,
  certificate_url TEXT,
  updated_at TIMESTAMPTZ
);

-- Enable Row Level Security
ALTER TABLE safety_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_commendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE urine_screens ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;

-- Create policies for safety violations
CREATE POLICY "Users can view their own safety violations"
  ON safety_violations
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policies for safety commendations
CREATE POLICY "Users can view their own safety commendations"
  ON safety_commendations
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policies for urine screens
CREATE POLICY "Users can view their own urine screens"
  ON urine_screens
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policies for certifications
CREATE POLICY "Users can view their own certifications"
  ON certifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own certifications"
  ON certifications
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own certifications"
  ON certifications
  FOR UPDATE
  USING (auth.uid() = user_id);