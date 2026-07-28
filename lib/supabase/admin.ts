import { createClient as createSupabaseClient } from "@supabase/supabase-js"

/**
 * Server-only Supabase client that uses the service role key.
 *
 * The regular server client uses the anon key, so it is subject to RLS. The
 * guardians table has SELECT and INSERT policies but no UPDATE policy, which
 * meant every attempt to raise a guardian's flower_count was silently rejected.
 * Writes for the guardians board go through this client instead, so the overlay
 * does not depend on policy changes being applied by hand.
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
