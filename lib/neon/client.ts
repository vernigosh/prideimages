import { neon } from "@neondatabase/serverless"

/**
 * Server-only Neon client for the overlay's persistent data.
 *
 * Replaces the Supabase clients in lib/supabase/. Supabase's free tier paused the
 * project after ~7 days idle and needed a manual click to wake, which is what made
 * the Board of Guardians come up empty mid-stream. Neon idles its compute too but
 * auto-resumes on the next query.
 *
 * There is no RLS and no anon key here: both tables are only touched by server-side
 * API routes. Never import this from a client component - it would leak the
 * connection string into the browser bundle.
 */

let cached: ReturnType<typeof neon> | null = null

export function getSql() {
  if (cached) return cached

  // Pooled URL: these routes are short-lived serverless invocations making one or
  // two queries, which is exactly what the pooler is for.
  const url = process.env.NEON_DATABASE_URL

  if (!url) {
    // Fail loudly. The guardians GET route turns a thrown error into a 500 rather
    // than an empty array, so a missing connection string surfaces as an error
    // instead of a silently blank board.
    throw new Error("NEON_DATABASE_URL is not set")
  }

  cached = neon(url)
  return cached
}

export type Guardian = {
  id: string
  username: string
  flower_count: number
  achieved_at: string
}

export type TriviaScore = {
  username: string
  score: number
}
