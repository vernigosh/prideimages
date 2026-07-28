import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

/**
 * One-time corrections for guardians whose stored count is lower than the score
 * they actually reached. Session totals reset every stream by design, and the
 * board used to only save on the exact moment someone crossed 50, so anything
 * picked after that crossing was never recorded.
 *
 * Add `username: count` pairs here and re-open the endpoint to apply them.
 * Counts are only ever raised, never lowered.
 */
const CORRECTIONS: Record<string, number> = {
  spazleg: 66,
}

export async function GET() {
  try {
    const supabase = createAdminClient()
    const results: Array<{ username: string; flowerCount: number; action: string }> = []

    for (const [rawUsername, targetCount] of Object.entries(CORRECTIONS)) {
      const username = rawUsername.toLowerCase()

      // Case-variant rows (e.g. "SpazLeg" vs "spazleg") are separate rows to
      // Postgres, so collapse any duplicates into the canonical lowercase row.
      const { data: matches } = await supabase
        .from("guardians")
        .select("id, username, flower_count")
        .ilike("username", username)

      const duplicates = (matches ?? []).filter((row) => row.username !== username)
      if (duplicates.length > 0) {
        await supabase
          .from("guardians")
          .delete()
          .in(
            "id",
            duplicates.map((row) => row.id),
          )
      }

      const canonical = (matches ?? []).find((row) => row.username === username)
      const highest = Math.max(targetCount, ...(matches ?? []).map((row) => row.flower_count ?? 0))

      if (canonical) {
        if ((canonical.flower_count ?? 0) < highest) {
          const { error } = await supabase
            .from("guardians")
            .update({ flower_count: highest })
            .eq("id", canonical.id)
          if (error) throw error
          results.push({ username, flowerCount: highest, action: "raised" })
        } else {
          results.push({ username, flowerCount: canonical.flower_count, action: "already higher" })
        }
      } else {
        const { error } = await supabase
          .from("guardians")
          .insert({ username, flower_count: highest })
        if (error) throw error
        results.push({ username, flowerCount: highest, action: "inserted" })
      }
    }

    const { data: board } = await supabase
      .from("guardians")
      .select("username, flower_count")
      .order("flower_count", { ascending: false })

    return NextResponse.json(
      { success: true, applied: results, board: board ?? [] },
      { headers: { "Cache-Control": "no-store" } },
    )
  } catch (error) {
    console.error("[v0] Guardian backfill failed:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
