-- =========================================================
-- FINAL MULTIPLAYER SCHEMA FIX FOR FLAPPY BIRD
-- =========================================================
-- Paste and run this SQL script in your Supabase SQL Editor:
-- Supabase Dashboard -> SQL Editor -> New Query -> Run
-- =========================================================

-- 1. Ensure rooms table columns exist
DO $$
BEGIN
  -- Check and add 'code'
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'rooms' AND column_name = 'code'
  ) THEN
    ALTER TABLE public.rooms ADD COLUMN code text UNIQUE;
  END IF;

  -- Check and add 'state'
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'rooms' AND column_name = 'state'
  ) THEN
    ALTER TABLE public.rooms ADD COLUMN state text DEFAULT 'waiting';
  END IF;

  -- Check and add 'host_user_id'
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'rooms' AND column_name = 'host_user_id'
  ) THEN
    ALTER TABLE public.rooms ADD COLUMN host_user_id uuid REFERENCES auth.users(id);
  END IF;

  -- Check and add 'random_seed'
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'rooms' AND column_name = 'random_seed'
  ) THEN
    ALTER TABLE public.rooms ADD COLUMN random_seed integer;
  END IF;
END $$;

-- 2. Ensure room_players table columns exist
DO $$
BEGIN
  -- Check and add 'room_id'
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'room_players' AND column_name = 'room_id'
  ) THEN
    ALTER TABLE public.room_players ADD COLUMN room_id uuid REFERENCES public.rooms(id) ON DELETE CASCADE;
  END IF;

  -- Check and add 'user_id'
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'room_players' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.room_players ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  -- Check and add 'player_name'
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'room_players' AND column_name = 'player_name'
  ) THEN
    ALTER TABLE public.room_players ADD COLUMN player_name text DEFAULT 'Player';
  END IF;

  -- Check and add 'avatar'
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'room_players' AND column_name = 'avatar'
  ) THEN
    ALTER TABLE public.room_players ADD COLUMN avatar text DEFAULT 'yellow';
  END IF;

  -- Check and add 'avatar_color'
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'room_players' AND column_name = 'avatar_color'
  ) THEN
    ALTER TABLE public.room_players ADD COLUMN avatar_color text DEFAULT 'yellow';
  END IF;

  -- Check and add 'bird_y'
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'room_players' AND column_name = 'bird_y'
  ) THEN
    ALTER TABLE public.room_players ADD COLUMN bird_y numeric DEFAULT NULL;
  END IF;

  -- Check and add 'is_alive'
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'room_players' AND column_name = 'is_alive'
  ) THEN
    ALTER TABLE public.room_players ADD COLUMN is_alive boolean DEFAULT true;
  END IF;

  -- Check and add 'score'
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'room_players' AND column_name = 'score'
  ) THEN
    ALTER TABLE public.room_players ADD COLUMN score int DEFAULT 0;
  END IF;

  -- Check and add 'is_ready'
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'room_players' AND column_name = 'is_ready'
  ) THEN
    ALTER TABLE public.room_players ADD COLUMN is_ready boolean DEFAULT false;
  END IF;

  -- Check and add 'joined_at'
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'room_players' AND column_name = 'joined_at'
  ) THEN
    ALTER TABLE public.room_players ADD COLUMN joined_at timestamptz DEFAULT now();
  END IF;

  -- Check and add 'updated_at'
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'room_players' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.room_players ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_players ENABLE ROW LEVEL SECURITY;

-- 4. Set up rooms Policies
DROP POLICY IF EXISTS "Allow authenticated users to create rooms" ON public.rooms;
DROP POLICY IF EXISTS "Allow authenticated users to view rooms" ON public.rooms;
DROP POLICY IF EXISTS "Allow hosts to update rooms" ON public.rooms;
DROP POLICY IF EXISTS "Allow hosts to delete rooms" ON public.rooms;
DROP POLICY IF EXISTS "Allow anyone to view rooms" ON public.rooms;

CREATE POLICY "Allow authenticated users to create rooms"
ON public.rooms FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow anyone to view rooms"
ON public.rooms FOR SELECT
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

-- 5. Set up room_players Policies
DROP POLICY IF EXISTS "Allow authenticated users to insert room_players" ON public.room_players;
DROP POLICY IF EXISTS "Allow authenticated users to view room_players" ON public.room_players;
DROP POLICY IF EXISTS "Allow users to update their own room_players" ON public.room_players;
DROP POLICY IF EXISTS "Allow users to delete their own room_players" ON public.room_players;
DROP POLICY IF EXISTS "Allow anyone to view room_players" ON public.room_players;

CREATE POLICY "Allow authenticated users to insert room_players"
ON public.room_players FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow anyone to view room_players"
ON public.room_players FOR SELECT
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

-- 6. Enable Realtime Replication for Synchronization
DO $$
BEGIN
  -- Safely drop tables from publication (ignoring error if they weren't in it)
  BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.rooms;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.room_players;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  -- Add tables back to publication
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.room_players;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END $$;

