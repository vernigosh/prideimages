-- Backfill a guardian who earned the rank on stream but never landed in the table.
-- spazleg reached 66 flower picks, well past the 50 threshold.

-- The add-guardian API updates flower_count for returning guardians, but the
-- original schema only created SELECT and INSERT policies. With RLS enabled and
-- no UPDATE policy, every one of those updates was silently discarded. This is
-- almost certainly why spazleg's rank never showed up on the board.
-- (Postgres has no CREATE POLICY IF NOT EXISTS, so drop first to stay re-runnable.)
DROP POLICY IF EXISTS "guardians_update_service" ON public.guardians;
CREATE POLICY "guardians_update_service"
  ON public.guardians FOR UPDATE USING (true) WITH CHECK (true);

-- Insert spazleg, or correct the count if a row already exists with a lower one.
INSERT INTO public.guardians (username, flower_count)
VALUES ('spazleg', 66)
ON CONFLICT (username) DO UPDATE
  SET flower_count = GREATEST(guardians.flower_count, EXCLUDED.flower_count);

-- Verify the result before going live.
SELECT username, flower_count, achieved_at
FROM public.guardians
ORDER BY flower_count DESC;
