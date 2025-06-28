/*
  # Enhanced Chat System

  1. New Tables
    - `chat_sessions` - Store chat session metadata
    - `chat_attachments` - Store file attachments for chat messages
    
  2. Changes
    - Add additional fields to `chat_messages` table
    - Add support for message reactions and replies
    
  3. Security
    - Enable RLS on all tables
    - Add policies for users to manage their own chat data
*/

-- Create chat_sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  summary TEXT,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ,
  last_message_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Add additional fields to chat_messages
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS reply_to UUID REFERENCES chat_messages(id) ON DELETE SET NULL;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT false;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS reactions JSONB;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Create chat_attachments table
CREATE TABLE IF NOT EXISTS chat_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  storage_path TEXT
);

-- Enable Row Level Security
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_attachments ENABLE ROW LEVEL SECURITY;

-- Create policies for chat_sessions
CREATE POLICY "Users can manage their own chat sessions"
  ON chat_sessions
  FOR ALL
  USING (auth.uid() = user_id);

-- Create policies for chat_attachments
CREATE POLICY "Users can manage their own chat attachments"
  ON chat_attachments
  FOR ALL
  USING (
    message_id IN (
      SELECT id FROM chat_messages WHERE user_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id_created_at ON chat_messages(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id_last_message ON chat_sessions(user_id, last_message_at);
CREATE INDEX IF NOT EXISTS idx_chat_attachments_message_id ON chat_attachments(message_id);

-- Create function to update session last_message_at
CREATE OR REPLACE FUNCTION update_chat_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.session_id IS NOT NULL THEN
    UPDATE chat_sessions
    SET last_message_at = NEW.created_at,
        updated_at = NEW.created_at
    WHERE id = NEW.session_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update session timestamp
CREATE TRIGGER on_chat_message_created
  AFTER INSERT ON chat_messages
  FOR EACH ROW EXECUTE FUNCTION update_chat_session_timestamp();

-- Create function to create default chat session for new users
CREATE OR REPLACE FUNCTION create_default_chat_session()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO chat_sessions (user_id, title)
  VALUES (NEW.id, 'Safety Assistant Chat');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to create default chat session for new users
CREATE TRIGGER on_auth_user_created_chat_session
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_default_chat_session();

-- Add comments for documentation
COMMENT ON TABLE chat_sessions IS 'Stores metadata for chat conversations';
COMMENT ON TABLE chat_attachments IS 'Stores file attachments for chat messages';
COMMENT ON COLUMN chat_messages.session_id IS 'Reference to the chat session this message belongs to';
COMMENT ON COLUMN chat_messages.reply_to IS 'Reference to the message this message is replying to';
COMMENT ON COLUMN chat_messages.reactions IS 'JSON array of user reactions to this message';
COMMENT ON COLUMN chat_messages.metadata IS 'Additional metadata for the message (e.g., read status, delivery status)';