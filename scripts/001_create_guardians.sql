-- Create guardians table for tracking Nature's Guardians (50+ flower pickers)
CREATE TABLE IF NOT EXISTS public.guardians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  flower_count INTEGER DEFAULT 50
);

-- Enable RLS with NO policies.
--
-- Every read and write to this table goes through the service-role client in
-- lib/supabase/admin.ts (app/api/guardians/route.ts and app/api/guardians/add/route.ts).
-- The service role bypasses RLS, so those routes keep working; RLS-on-with-no-policies
-- denies everything else by default.
--
-- This deliberately replaces the earlier `USING (true)` / `WITH CHECK (true)` policies.
-- Those were granted to role `public`, which includes `anon` — and the anon key is
-- shipped to every browser in NEXT_PUBLIC_SUPABASE_ANON_KEY. That meant anyone could
-- read the full guardian list, and worse, INSERT themselves onto the board by calling
-- the Supabase REST endpoint directly and bypassing the overlay entirely.
--
-- Do NOT add a "public read" policy back for convenience. The board is already served
-- to the overlay by the API route; a public policy adds direct table access on top.
ALTER TABLE public.guardians ENABLE ROW LEVEL SECURITY;

-- Drop the permissive policies if an older version of this script created them.
DROP POLICY IF EXISTS "guardians_select_all" ON public.guardians;
DROP POLICY IF EXISTS "guardians_insert_service" ON public.guardians;
DROP POLICY IF EXISTS "guardians_public_read" ON public.guardians;
DROP POLICY IF EXISTS "guardians_service_insert" ON public.guardians;
