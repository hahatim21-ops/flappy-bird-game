-- Fix multiplayer "Start Game" stuck on loading
-- Run this in Supabase → SQL Editor

-- Allow room hosts to update room state (required for Start Game)
DROP POLICY IF EXISTS "Allow hosts to update rooms" ON public.rooms;
DROP POLICY IF EXISTS "Users can update their own rooms" ON public.rooms;

CREATE POLICY "Allow hosts to update rooms"
ON public.rooms FOR UPDATE
TO authenticated
USING (auth.uid() = host_user_id)
WITH CHECK (auth.uid() = host_user_id);

-- Ensure random_seed exists for synchronized pipes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'rooms'
      AND column_name = 'random_seed'
  ) THEN
    ALTER TABLE public.rooms ADD COLUMN random_seed integer;
  END IF;
END $$;

-- Ensure player_name exists on room_players
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'room_players'
      AND column_name = 'player_name'
  ) THEN
    ALTER TABLE public.room_players ADD COLUMN player_name text DEFAULT 'Player';
  END IF;
END $$;
