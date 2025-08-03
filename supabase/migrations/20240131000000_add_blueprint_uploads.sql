-- Create blueprint_uploads table
CREATE TABLE IF NOT EXISTS blueprint_uploads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  checklist_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  analysis_status TEXT DEFAULT 'pending' CHECK (analysis_status IN ('pending', 'processing', 'completed', 'error')),
  ai_analysis JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_blueprint_uploads_user_id ON blueprint_uploads(user_id);
CREATE INDEX idx_blueprint_uploads_checklist_id ON blueprint_uploads(checklist_id);
CREATE INDEX idx_blueprint_uploads_item_id ON blueprint_uploads(item_id);
CREATE INDEX idx_blueprint_uploads_analysis_status ON blueprint_uploads(analysis_status);

-- Enable RLS
ALTER TABLE blueprint_uploads ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own blueprints" ON blueprint_uploads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own blueprints" ON blueprint_uploads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own blueprints" ON blueprint_uploads
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own blueprints" ON blueprint_uploads
  FOR DELETE USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_blueprint_uploads_updated_at BEFORE UPDATE ON blueprint_uploads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();