-- Multiplayer Flappy Bird Database Schema
-- Run this in your Supabase SQL Editor

-- Enable Realtime for tables
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE room_players;

-- Rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL, -- 6-character room code (e.g. AB4XQ)
  state TEXT NOT NULL DEFAULT 'waiting' CHECK (state IN ('waiting', 'starting', 'playing', 'finished')),
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  random_seed INTEGER, -- Shared random seed for synchronized pipe generation
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Room players table
CREATE TABLE IF NOT EXISTS room_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  player_name TEXT NOT NULL,
  avatar_color TEXT NOT NULL DEFAULT 'yellow', -- yellow, red, blue, green, black
  bird_y NUMERIC DEFAULT NULL, -- Current Y position (only updated on events)
  is_alive BOOLEAN DEFAULT TRUE,
  score INTEGER DEFAULT 0,
  is_ready BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(room_id, user_id) -- One player per room
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_rooms_code ON rooms(code);
CREATE INDEX IF NOT EXISTS idx_rooms_state ON rooms(state);
CREATE INDEX IF NOT EXISTS idx_room_players_room_id ON room_players(room_id);
CREATE INDEX IF NOT EXISTS idx_room_players_user_id ON room_players(user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update updated_at
CREATE TRIGGER update_rooms_updated_at
  BEFORE UPDATE ON rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_room_players_updated_at
  BEFORE UPDATE ON room_players
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_players ENABLE ROW LEVEL SECURITY;

-- Rooms policies: users can read all rooms, create rooms, update their own rooms
CREATE POLICY "Users can view all rooms" ON rooms
  FOR SELECT USING (true);

CREATE POLICY "Users can create rooms" ON rooms
  FOR INSERT WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Users can update their own rooms" ON rooms
  FOR UPDATE USING (auth.uid() = host_id);

-- Room players policies
CREATE POLICY "Users can view players in rooms" ON room_players
  FOR SELECT USING (true);

CREATE POLICY "Users can insert themselves as players" ON room_players
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own player data" ON room_players
  FOR UPDATE USING (auth.uid() = user_id);

-- Function to generate random room code
CREATE OR REPLACE FUNCTION generate_room_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Exclude confusing chars (0, O, I, 1)
  code TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    code := code || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  
  -- Check if code already exists (very unlikely but handle it)
  WHILE EXISTS (SELECT 1 FROM rooms WHERE rooms.code = code) LOOP
    code := '';
    FOR i IN 1..6 LOOP
      code := code || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
  END LOOP;
  
  RETURN code;
END;
$$ LANGUAGE plpgsql;
