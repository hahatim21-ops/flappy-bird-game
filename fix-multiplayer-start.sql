-- Complete multiplayer fix for Flappy Bird
-- Run this once in Supabase → SQL Editor

-- Rooms table columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'rooms' AND column_name = 'code'
  ) THEN
    ALTER TABLE public.rooms ADD COLUMN code text UNIQUE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'rooms' AND column_name = 'state'
  ) THEN
    ALTER TABLE public.rooms ADD COLUMN state text DEFAULT 'waiting';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'rooms' AND column_name = 'host_user_id'
  ) THEN
    ALTER TABLE public.rooms ADD COLUMN host_user_id uuid REFERENCES auth.users(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'rooms' AND column_name = 'random_seed'
  ) THEN
    ALTER TABLE public.rooms ADD COLUMN random_seed integer;
  END IF;
END $$;

-- Room players table columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'room_players' AND column_name = 'avatar'
  ) THEN
    ALTER TABLE public.room_players ADD COLUMN avatar text DEFAULT 'yellow';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'room_players' AND column_name = 'player_name'
  ) THEN
    ALTER TABLE public.room_players ADD COLUMN player_name text DEFAULT 'Player';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'room_players' AND column_name = 'score'
  ) THEN
    ALTER TABLE public.room_players ADD COLUMN score int DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'room_players' AND column_name = 'is_alive'
  ) THEN
    ALTER TABLE public.room_players ADD COLUMN is_alive boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'room_players' AND column_name = 'is_ready'
  ) THEN
    ALTER TABLE public.room_players ADD COLUMN is_ready boolean DEFAULT false;
  END IF;
END $$;

ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_players ENABLE ROW LEVEL SECURITY;

-- Rooms policies
DROP POLICY IF EXISTS "Allow authenticated users to create rooms" ON public.rooms;
DROP POLICY IF EXISTS "Allow authenticated users to view rooms" ON public.rooms;
DROP POLICY IF EXISTS "Allow hosts to update rooms" ON public.rooms;
DROP POLICY IF EXISTS "Allow hosts to delete rooms" ON public.rooms;

CREATE POLICY "Allow authenticated users to create rooms"
ON public.rooms FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to view rooms"
ON public.rooms FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow hosts to update rooms"
ON public.rooms FOR UPDATE
TO authenticated
USING (auth.uid() = host_user_id)
WITH CHECK (auth.uid() = host_user_id);

CREATE POLICY "Allow hosts to delete rooms"
ON public.rooms FOR DELETE
TO authenticated
USING (auth.uid() = host_user_id);

-- Room players policies
DROP POLICY IF EXISTS "Allow authenticated users to insert room_players" ON public.room_players;
DROP POLICY IF EXISTS "Allow authenticated users to view room_players" ON public.room_players;
DROP POLICY IF EXISTS "Allow users to update their own room_players" ON public.room_players;
DROP POLICY IF EXISTS "Allow users to delete their own room_players" ON public.room_players;

CREATE POLICY "Allow authenticated users to insert room_players"
ON public.room_players FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to view room_players"
ON public.room_players FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow users to update their own room_players"
ON public.room_players FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own room_players"
ON public.room_players FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE room_players;
