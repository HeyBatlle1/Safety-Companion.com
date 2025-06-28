/*
  # Analysis History Table

  1. New Tables
    - `analysis_history` - Store AI analysis history for users
    
  2. Security
    - Enable RLS on the table
    - Add policies for users to manage their own analysis history
*/

-- Create analysis_history table
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

-- Enable Row Level Security
ALTER TABLE analysis_history ENABLE ROW LEVEL SECURITY;

-- Create policies for analysis_history
CREATE POLICY "Users can manage their own analysis history"
  ON analysis_history
  FOR ALL
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_analysis_history_user_id ON analysis_history(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_history_type ON analysis_history(type);
CREATE INDEX IF NOT EXISTS idx_analysis_history_created_at ON analysis_history(created_at);

-- Add comments for documentation
COMMENT ON TABLE analysis_history IS 'Stores history of AI analyses performed by users';
COMMENT ON COLUMN analysis_history.query IS 'The original query or prompt sent to the AI';
COMMENT ON COLUMN analysis_history.response IS 'The AI response or analysis result';
COMMENT ON COLUMN analysis_history.type IS 'The type of analysis performed';
COMMENT ON COLUMN analysis_history.metadata IS 'Additional metadata about the analysis (model, parameters, etc.)';