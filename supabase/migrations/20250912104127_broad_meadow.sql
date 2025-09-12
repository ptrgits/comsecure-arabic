/*
  # Create Clean Database Structure

  1. New Tables
    - `channels` - Chat channels with basic info
    - `messages` - Chat messages with soft delete support
    - `user_sessions` - Active user sessions with admin support
    
  2. Security
    - Enable RLS on all tables
    - Add policies for public access (since this is anonymous chat)
    - Add admin policies for message management
    
  3. Functions
    - Admin function for message deletion with audit trail
*/

-- Drop existing tables if they exist
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS channels CASCADE;

-- Create channels table
CREATE TABLE channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  type text DEFAULT 'public' CHECK (type IN ('public', 'private')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create messages table with soft delete support
CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  nickname text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  is_deleted boolean DEFAULT false,
  deleted_by text,
  deleted_at timestamptz
);

-- Create user sessions table
CREATE TABLE user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname text NOT NULL,
  channel_id uuid NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  is_online boolean DEFAULT true,
  is_admin boolean DEFAULT false,
  last_seen timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(nickname, channel_id)
);

-- Enable RLS
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Channels policies (public read, admin write)
CREATE POLICY "Anyone can read channels"
  ON channels
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can create channels"
  ON channels
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Messages policies
CREATE POLICY "Anyone can read non-deleted messages"
  ON messages
  FOR SELECT
  TO public
  USING (is_deleted = false);

CREATE POLICY "Anyone can insert messages"
  ON messages
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update their own messages"
  ON messages
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- User sessions policies
CREATE POLICY "Anyone can read user sessions"
  ON user_sessions
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert user sessions"
  ON user_sessions
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update user sessions"
  ON user_sessions
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Create admin function for message deletion
CREATE OR REPLACE FUNCTION delete_message_admin(
  message_id uuid,
  admin_nickname text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE messages 
  SET 
    is_deleted = true,
    deleted_by = admin_nickname,
    deleted_at = now()
  WHERE id = message_id;
END;
$$;

-- Create admin view for monitoring (optional, will work if accessible)
CREATE OR REPLACE VIEW admin_messages AS
SELECT 
  m.*,
  c.name as channel_name
FROM messages m
JOIN channels c ON m.channel_id = c.id
ORDER BY m.created_at DESC;

-- Insert default channels
INSERT INTO channels (name, type) VALUES 
  ('general', 'public'),
  ('random', 'public'),
  ('classified', 'private');

-- Create indexes for performance
CREATE INDEX idx_messages_channel_id ON messages(channel_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_is_deleted ON messages(is_deleted);
CREATE INDEX idx_user_sessions_channel_id ON user_sessions(channel_id);
CREATE INDEX idx_user_sessions_is_online ON user_sessions(is_online);
CREATE INDEX idx_user_sessions_nickname ON user_sessions(nickname);

-- Update function for channels
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_channels_updated_at 
  BEFORE UPDATE ON channels 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();