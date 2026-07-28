import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// The board must always reflect the live table, never a cached snapshot.
export const dynamic = "force-dynamic"
export const revalidate = 0

/**
 * One-time corrections for guardians whose stored count is lower than the score
 * they actually reached. Session totals reset every stream by design, and the
 * board used to only save at the exact moment someone crossed 50, so anything
 * picked after that crossing was never recorded.
 *
 * Add `username: count` pairs here, then open /api/guardians?backfill=1 to apply.
 * Counts are only ever raised, never lowered.
 */
const CORRECTIONS: Record<string, number> = {
  spazleg: 66,
}

async function applyCorrections() {
  // Service role: RLS on guardians has no UPDATE policy, so anon-key writes
  // could never raise a stored flower_count.
  const supabase = createAdminClient()
  const applied: Array<{ username: string; flowerCount: number; action: string }> = []

  for (const [rawUsername, targetCount] of Object.entries(CORRECTIONS)) {
    const username = rawUsername.toLowerCase()

    // Case-variant rows (e.g. "SpazLeg" vs "spazleg") are distinct rows to
    // Postgres, so collapse any duplicates into the canonical lowercase row.
    const { data: matches, error: matchError } = await supabase
      .from("guardians")
      .select("id, username, flower_count")
      .ilike("username", username)

    if (matchError) throw matchError

    const rows = matches ?? []
    const canonical = rows.find((row) => row.username === username)
    const highest = Math.max(targetCount, ...rows.map((row) => row.flower_count ?? 0))

    const duplicates = rows.filter((row) => row.username !== username)
    if (duplicates.length > 0) {
      await supabase
        .from("guardians")
        .delete()
        .in(
          "id",
          duplicates.map((row) => row.id),
        )
    }

    if (canonical) {
      if ((canonical.flower_count ?? 0) < highest) {
        const { error } = await supabase
          .from("guardians")
          .update({ flower_count: highest })
          .eq("id", canonical.id)
        if (error) throw error
        applied.push({ username, flowerCount: highest, action: "raised" })
      } else {
        applied.push({ username, flowerCount: canonical.flower_count ?? 0, action: "already higher" })
      }
    } else {
      const { error } = await supabase.from("guardians").insert({ username, flower_count: highest })
      if (error) throw error
      applied.push({ username, flowerCount: highest, action: "inserted" })
    }
  }

  const { data: board } = await supabase
    .from("guardians")
    .select("username, flower_count")
    .order("flower_count", { ascending: false })

  return { applied, board: board ?? [] }
}

export async function GET(request: Request) {
  const shouldBackfill = new URL(request.url).searchParams.get("backfill") === "1"

  if (shouldBackfill) {
    try {
      const result = await applyCorrections()
      return NextResponse.json(
        { success: true, ...result },
        { headers: { "Cache-Control": "no-store, max-age=0" } },
      )
    } catch (error) {
      console.error("[v0] Guardian backfill failed:", error)
      return NextResponse.json(
        { success: false, error: error instanceof Error ? error.message : "Unknown error" },
        { status: 500 },
      )
    }
  }

  try {
    const supabase = await createClient()

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
