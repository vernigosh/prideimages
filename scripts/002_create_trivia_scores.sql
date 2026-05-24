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
