-- Fix tables if they don't match expected structure
-- Run this in Supabase SQL Editor if tables are missing columns

-- Ensure rooms table has required columns
DO $$ 
BEGIN
    -- Add code column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'rooms' 
          AND column_name = 'code'
    ) THEN
        ALTER TABLE public.rooms ADD COLUMN code text UNIQUE;
    END IF;

    -- Add state column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'rooms' 
          AND column_name = 'state'
    ) THEN
        ALTER TABLE public.rooms ADD COLUMN state text DEFAULT 'waiting';
    END IF;
END $$;

-- Ensure room_players table has required columns
DO $$ 
BEGIN
    -- Add avatar column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'room_players' 
          AND column_name = 'avatar'
    ) THEN
        ALTER TABLE public.room_players ADD COLUMN avatar text DEFAULT 'yellow';
    END IF;

    -- Add score column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'room_players' 
          AND column_name = 'score'
    ) THEN
        ALTER TABLE public.room_players ADD COLUMN score int DEFAULT 0;
    END IF;

    -- Add is_alive column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'room_players' 
          AND column_name = 'is_alive'
    ) THEN
        ALTER TABLE public.room_players ADD COLUMN is_alive boolean DEFAULT true;
    END IF;
END $$;

-- Enable RLS if not already enabled
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_players ENABLE ROW LEVEL SECURITY;

-- Create policies to allow authenticated users to insert/select
-- Drop existing policies if they exist (optional - comment out if you want to keep existing policies)
DROP POLICY IF EXISTS "Allow authenticated users to create rooms" ON public.rooms;
DROP POLICY IF EXISTS "Allow authenticated users to view rooms" ON public.rooms;
DROP POLICY IF EXISTS "Allow authenticated users to insert room_players" ON public.room_players;
DROP POLICY IF EXISTS "Allow authenticated users to view room_players" ON public.room_players;

-- Create new policies
CREATE POLICY "Allow authenticated users to create rooms" 
ON public.rooms FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to view rooms" 
ON public.rooms FOR SELECT 
TO authenticated 
USING (true);

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
