import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { username, flowerCount } = await request.json()

    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 })
    }

    // Service role client: RLS has no UPDATE policy on guardians, so anon-key
    // writes could never raise a stored flower_count.
    const supabase = createAdminClient()
    const lowerUsername = username.toLowerCase()

    // Check if user is already a guardian
    const { data: existing, error: fetchError } = await supabase
      .from("guardians")
      .select("id, flower_count")
      .eq("username", lowerUsername)
      .single()

    if (fetchError && fetchError.code !== "PGRST116") {
      // PGRST116 = no rows found, which is fine
      console.error("Error checking existing guardian:", fetchError)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    if (existing) {
      // Only ever raise a guardian's all-time best. The `lt` guard makes this safe
      // when several picks are in flight at once: the write is skipped unless the
      // stored count is still lower than the incoming one, so a slower request can
      // never overwrite a higher score with a stale value.
      if (flowerCount > existing.flower_count) {
        const { error: updateError } = await supabase
          .from("guardians")
          .update({ flower_count: flowerCount })
          .eq("username", lowerUsername)
          .lt("flower_count", flowerCount)

        if (updateError) {
          console.error("Error updating guardian:", updateError)
          return NextResponse.json({ error: "Failed to update guardian" }, { status: 500 })
        }
      }
      return NextResponse.json({ success: true, message: "Guardian updated" })
    }

    // Add new guardian
    const { error: insertError } = await supabase
      .from("guardians")
      .insert({ username: lowerUsername, flower_count: flowerCount || 50 })

    if (insertError) {
      console.error("Error inserting guardian:", insertError)
      return NextResponse.json({ error: "Failed to add guardian" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Guardian added!" })
  } catch (error) {
    console.error("Error in add guardian:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
