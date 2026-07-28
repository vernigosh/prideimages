-- Fix the Guild of Guardians board.
--
-- Root cause: 001_create_guardians.sql enables RLS but only creates SELECT and
-- INSERT policies. lib/supabase/server.ts connects with the ANON key, so RLS is
-- fully enforced and every flower_count UPDATE from /api/guardians/add has been
-- silently rejected. Guardians were therefore frozen at whatever count they had
-- when they first crossed 50 -- which is why spazleg reads 50 instead of 66.

-- 1. Add the missing UPDATE policy so counts can rise from now on.
--    (Postgres has no CREATE POLICY IF NOT EXISTS, so drop first to stay re-runnable.)
DROP POLICY IF EXISTS "guardians_update_service" ON public.guardians;
CREATE POLICY "guardians_update_service"
  ON public.guardians FOR UPDATE USING (true) WITH CHECK (true);

-- 2. Collapse any case-variant duplicates ('SpazLeg' vs 'spazleg'). The API
--    lowercases usernames, but UNIQUE in Postgres is case-sensitive, so a
--    manually added row could shadow the real one. Keep the highest count.
UPDATE public.guardians g
SET flower_count = sub.max_count
FROM (
  SELECT LOWER(username) AS lower_name, MAX(flower_count) AS max_count
  FROM public.guardians
  GROUP BY LOWER(username)
) sub
WHERE LOWER(g.username) = sub.lower_name
  AND g.flower_count < sub.max_count;

DELETE FROM public.guardians g
WHERE EXISTS (
  SELECT 1 FROM public.guardians other
  WHERE LOWER(other.username) = LOWER(g.username)
    AND other.id <> g.id
    AND (other.username = LOWER(other.username) AND g.username <> LOWER(g.username))
);

UPDATE public.guardians
SET username = LOWER(username)
WHERE username <> LOWER(username);

-- 3. Set spazleg to their true best of 66. GREATEST means re-running this can
--    never lower a score.
INSERT INTO public.guardians (username, flower_count)
VALUES ('spazleg', 66)
ON CONFLICT (username) DO UPDATE
  SET flower_count = GREATEST(guardians.flower_count, EXCLUDED.flower_count);

-- 4. Verify before going live.
SELECT username, flower_count, achieved_at
FROM public.guardians
ORDER BY flower_count DESC;
