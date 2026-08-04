-- Create table for storing all-time trivia scores
CREATE TABLE IF NOT EXISTS trivia_scores (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster score lookups
CREATE INDEX IF NOT EXISTS idx_trivia_scores_score ON trivia_scores(score DESC);
CREATE INDEX IF NOT EXISTS idx_trivia_scores_username ON trivia_scores(username);

-- Enable RLS with NO policies.
--
-- This table originally shipped with RLS switched off completely, which is what
-- Supabase emailed about: the table sits in the `public` schema, so it was readable
-- AND writable by anyone holding the public anon key. Scores could be rewritten
-- from outside the overlay.
--
-- All access goes through the service-role client in lib/supabase/admin.ts
-- (app/api/trivia-scores/route.ts), and the service role bypasses RLS, so leaving
-- this policy-less is correct — it denies the anon key by default.
ALTER TABLE trivia_scores ENABLE ROW LEVEL SECURITY;
