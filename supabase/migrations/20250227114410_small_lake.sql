/*
  # Create Watched Videos Table

  1. New Tables
    - `watched_videos`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `video_id` (text, the YouTube video ID)
      - `watched_at` (timestamp)
      - `created_at` (timestamp)
  2. Security
    - Enable RLS on `watched_videos` table
    - Add policies for authenticated users to manage their own watched videos
*/

-- Create a new table to track watched videos
CREATE TABLE IF NOT EXISTS watched_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  video_id TEXT NOT NULL,
  watched_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, video_id)
);

-- Add comments for documentation
COMMENT ON TABLE watched_videos IS 'Tracks which ToolBox Talk videos have been watched by users';
COMMENT ON COLUMN watched_videos.user_id IS 'The user who watched the video';
COMMENT ON COLUMN watched_videos.video_id IS 'The YouTube video ID for the watched video';
COMMENT ON COLUMN watched_videos.watched_at IS 'When the user marked the video as watched';

-- Enable Row Level Security
ALTER TABLE watched_videos ENABLE ROW LEVEL SECURITY;

-- Create policy for inserting own watch records
CREATE POLICY "Users can insert their own watch records"
  ON watched_videos
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy for selecting own watch records
CREATE POLICY "Users can view their own watch records"
  ON watched_videos
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy for deleting own watch records
CREATE POLICY "Users can delete their own watch records"
  ON watched_videos
  FOR DELETE
  USING (auth.uid() = user_id);