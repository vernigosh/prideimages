-- Create guardians table for tracking Nature's Guardians (50+ flower pickers)
CREATE TABLE IF NOT EXISTS public.guardians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  flowers_picked INTEGER DEFAULT 50
);

-- Enable RLS but allow public read access (no auth required for this feature)
ALTER TABLE public.guardians ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read guardians (public leaderboard)
CREATE POLICY "guardians_select_all" ON public.guardians FOR SELECT USING (true);

-- Allow inserts from server (using service role key)
CREATE POLICY "guardians_insert_service" ON public.guardians FOR INSERT WITH CHECK (true);
