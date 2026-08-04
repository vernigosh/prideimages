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
      console.error("Supabase error:", error)
      return NextResponse.json({ guardians: [] })
    }

    return NextResponse.json(
      { guardians: guardians || [] },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    )
  } catch (error) {
    console.error("Error fetching guardians:", error)
    return NextResponse.json({ guardians: [] })
  }
}
