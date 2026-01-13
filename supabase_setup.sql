-- ============================================
-- Supabase Database Setup for Flappy Bird Game
-- ============================================
-- Run this SQL in your Supabase SQL Editor
-- Go to: Supabase Dashboard > SQL Editor > New Query

-- ============================================
-- 1. Create Scores Table
-- ============================================
-- This table stores high scores for each user
CREATE TABLE IF NOT EXISTS scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS scores_user_id_idx ON scores(user_id);
CREATE INDEX IF NOT EXISTS scores_score_idx ON scores(score DESC);
CREATE INDEX IF NOT EXISTS scores_created_at_idx ON scores(created_at DESC);

-- ============================================
-- 2. Create Game Statistics Table
-- ============================================
-- This table stores overall game statistics per user
CREATE TABLE IF NOT EXISTS game_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  total_games INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  best_score INTEGER DEFAULT 0,
  total_pipes_passed INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create index
CREATE INDEX IF NOT EXISTS game_stats_user_id_idx ON game_stats(user_id);
CREATE INDEX IF NOT EXISTS game_stats_best_score_idx ON game_stats(best_score DESC);

-- ============================================
-- 3. Create Leaderboard View
-- ============================================
-- This view shows top scores with user information
CREATE OR REPLACE VIEW leaderboard AS
SELECT 
  s.id,
  s.user_id,
  s.score,
  s.created_at,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', u.email) as player_name
FROM scores s
LEFT JOIN auth.users u ON s.user_id = u.id
ORDER BY s.score DESC, s.created_at ASC;

-- ============================================
-- 4. Enable Row Level Security (RLS)
-- ============================================

-- Enable RLS on scores table
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

-- Enable RLS on game_stats table
ALTER TABLE game_stats ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. Create RLS Policies for Scores Table
-- ============================================

-- Drop existing policies if they exist (to avoid errors on re-run)
DROP POLICY IF EXISTS "Users can insert their own scores" ON scores;
DROP POLICY IF EXISTS "Users can view their own scores" ON scores;
DROP POLICY IF EXISTS "Anyone can view top scores" ON scores;
DROP POLICY IF EXISTS "Users can delete their own scores" ON scores;

-- Policy: Users can insert their own scores
CREATE POLICY "Users can insert their own scores"
ON scores
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own scores
CREATE POLICY "Users can view their own scores"
ON scores
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Anyone can view top scores (for leaderboard)
CREATE POLICY "Anyone can view top scores"
ON scores
FOR SELECT
TO anon, authenticated
USING (true);

-- Policy: Users can delete their own scores
CREATE POLICY "Users can delete their own scores"
ON scores
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================
-- 6. Create RLS Policies for Game Stats Table
-- ============================================

-- Drop existing policies if they exist (to avoid errors on re-run)
DROP POLICY IF EXISTS "Users can insert their own stats" ON game_stats;
DROP POLICY IF EXISTS "Users can view their own stats" ON game_stats;
DROP POLICY IF EXISTS "Users can update their own stats" ON game_stats;
DROP POLICY IF EXISTS "Anyone can view top stats" ON game_stats;

-- Policy: Users can insert their own stats
CREATE POLICY "Users can insert their own stats"
ON game_stats
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own stats
CREATE POLICY "Users can view their own stats"
ON game_stats
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Users can update their own stats
CREATE POLICY "Users can update their own stats"
ON game_stats
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Anyone can view top stats (for leaderboard)
CREATE POLICY "Anyone can view top stats"
ON game_stats
FOR SELECT
TO anon, authenticated
USING (true);

-- ============================================
-- 7. Create Function to Save Score
-- ============================================
-- This function automatically updates game_stats when a score is saved
CREATE OR REPLACE FUNCTION save_score_and_update_stats(
  p_score INTEGER,
  p_pipes_passed INTEGER DEFAULT 0
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_score_id UUID;
  v_user_id UUID;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;
  
  -- Insert the score
  INSERT INTO scores (user_id, score)
  VALUES (v_user_id, p_score)
  RETURNING id INTO v_score_id;
  
  -- Update or insert game stats
  INSERT INTO game_stats (user_id, total_games, total_score, best_score, total_pipes_passed)
  VALUES (v_user_id, 1, p_score, p_score, p_pipes_passed)
  ON CONFLICT (user_id) DO UPDATE SET
    total_games = game_stats.total_games + 1,
    total_score = game_stats.total_score + p_score,
    best_score = GREATEST(game_stats.best_score, p_score),
    total_pipes_passed = game_stats.total_pipes_passed + p_pipes_passed,
    updated_at = TIMEZONE('utc', NOW());
  
  RETURN v_score_id;
END;
$$;

-- ============================================
-- 8. Create Function to Get User Stats
-- ============================================
CREATE OR REPLACE FUNCTION get_user_stats()
RETURNS TABLE (
  total_games INTEGER,
  total_score INTEGER,
  best_score INTEGER,
  total_pipes_passed INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;
  
  RETURN QUERY
  SELECT 
    COALESCE(gs.total_games, 0),
    COALESCE(gs.total_score, 0),
    COALESCE(gs.best_score, 0),
    COALESCE(gs.total_pipes_passed, 0)
  FROM game_stats gs
  WHERE gs.user_id = v_user_id;
END;
$$;

-- ============================================
-- 9. Create Function to Get Top Scores
-- ============================================
CREATE OR REPLACE FUNCTION get_top_scores(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  score INTEGER,
  player_name TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.score,
    COALESCE(u.raw_user_meta_data->>'full_name', u.email) as player_name,
    u.email,
    s.created_at
  FROM scores s
  LEFT JOIN auth.users u ON s.user_id = u.id
  ORDER BY s.score DESC, s.created_at ASC
  LIMIT p_limit;
END;
$$;

-- ============================================
-- Setup Complete!
-- ============================================
-- Your database is now ready to store game data!
-- 
-- Tables created:
-- - scores: Stores individual game scores
-- - game_stats: Stores aggregated statistics per user
-- 
-- Views created:
-- - leaderboard: Shows top scores with user info
-- 
-- Functions created:
-- - save_score_and_update_stats(): Saves score and updates stats
-- - get_user_stats(): Gets current user's statistics
-- - get_top_scores(): Gets top scores for leaderboard
--
-- Security:
-- - Row Level Security (RLS) enabled
-- - Users can only modify their own data
-- - Anyone can view leaderboards
