/*
  # Initial Database Schema Setup

  1. New Tables
    - `profiles`: User profile information linked to auth.users
    - `safety_reports`: Safety incident reports submitted by users
    - `checklist_responses`: Responses to safety checklists
    - `chat_messages`: History of chat conversations with the AI

  2. Security
    - Enable Row Level Security (RLS) on all tables
    - Set up policies for each table to control access
*/

-- Create profiles table to store user profile data (linked to auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  email TEXT
);

-- Create table for safety reports
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

-- Create table for checklist responses
CREATE TABLE IF NOT EXISTS checklist_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  template_id TEXT NOT NULL,
  title TEXT NOT NULL,
  responses JSONB NOT NULL,
  updated_at TIMESTAMPTZ
);

-- Create table for chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  text TEXT NOT NULL,
  sender TEXT NOT NULL,
  attachments JSONB
);

-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Create policies for safety reports
CREATE POLICY "Users can view all safety reports" 
  ON safety_reports FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Users can insert their own safety reports" 
  ON safety_reports FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own safety reports" 
  ON safety_reports FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own safety reports" 
  ON safety_reports FOR DELETE 
  USING (auth.uid() = user_id);

-- Create policies for checklist responses
CREATE POLICY "Users can view their own checklist responses" 
  ON checklist_responses FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own checklist responses" 
  ON checklist_responses FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own checklist responses" 
  ON checklist_responses FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own checklist responses" 
  ON checklist_responses FOR DELETE 
  USING (auth.uid() = user_id);

-- Create policies for chat messages
CREATE POLICY "Users can view their own chat messages" 
  ON chat_messages FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert chat messages" 
  ON chat_messages FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();