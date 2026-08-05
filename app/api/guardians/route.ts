import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

// The board must always reflect the live table, never a cached snapshot.
export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  try {
    // Must be the service-role client, not the anon-key server client.
    // guardians now has RLS enabled with no policies, so the anon key reads back
    // zero rows — and because the error branch below degrades to an empty array,
    // that failure would show up as a silently blank board rather than an error.
    const supabase = createAdminClient()

    const { data: guardians, error } = await supabase
      .from("guardians")
      .select("*")
      .order("flower_count", { ascending: false })

    if (error) {
      // Never degrade a failed query to an empty list: an empty list is a valid
      // answer ("no guardians yet") and hides the failure as a blank board.
      console.error("[guardians] Supabase error:", error)
      return NextResponse.json(
        { error: error.message },
        { status: 500, headers: { "Cache-Control": "no-store, max-age=0" } },
      )
    }

    return NextResponse.json(
      { guardians: guardians || [] },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    )
  } catch (error) {
    // Also covers createAdminClient() throwing when SUPABASE_SERVICE_ROLE_KEY is
    // missing from the deployed environment.
    console.error("[guardians] Error fetching guardians:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500, headers: { "Cache-Control": "no-store, max-age=0" } },
    )
  }
}
