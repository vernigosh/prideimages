import { createClient as createSupabaseClient } from "@supabase/supabase-js"

/**
 * Server-only Supabase client that uses the service role key.
 *
 * The regular server client uses the anon key, so it is subject to RLS. Both
 * guardians and trivia_scores now have RLS enabled with NO policies, which denies
 * the anon key outright — the anon key ships to every browser, so any policy
 * granted to it is effectively public. The service role bypasses RLS, so ALL
 * reads and writes for those two tables must go through this client.
 *
 * That means an anon-key read returns zero rows rather than an error. Routes that
 * degrade a failed query to an empty list will look "working but empty", so if a
 * board or leaderboard renders blank, check that it is using this client.
 *
 * Never import this from a Client Component.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  }

  return createSupabaseClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
