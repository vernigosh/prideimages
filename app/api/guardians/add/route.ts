import { getSql } from "@/lib/neon/client"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { username, flowerCount } = await request.json()

    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 })
    }

    const sql = getSql()
    const lowerUsername = String(username).toLowerCase()
    const count = Number(flowerCount) || 50

    // Single atomic upsert. The previous Supabase version did a SELECT, then an
    // INSERT or UPDATE, which could double-insert when two picks for the same
    // viewer landed at once (both reads missed, both inserted). The unique index
    // on username collapses that into one row.
    //
    // The WHERE clause on the conflict branch means a stored count can only ever
    // be raised, never lowered, so a slow request carrying a stale lower total
    // cannot clobber a higher one.
    //
    // achieved_at is deliberately left alone on conflict: it records when the
    // viewer first became a Guardian, not their most recent pick.
    //
    // xmax = 0 is true only for a freshly inserted row, which is how we tell a new
    // induction from an updated record without a second query.
    const rows = (await sql`
      INSERT INTO guardians (username, flower_count)
      VALUES (${lowerUsername}, ${count})
      ON CONFLICT (username) DO UPDATE
        SET flower_count = EXCLUDED.flower_count
        WHERE guardians.flower_count < EXCLUDED.flower_count
      RETURNING (xmax = 0) AS inserted
    `) as { inserted: boolean }[]

    // Zero rows means the conflict branch's WHERE filtered the write out, i.e. the
    // viewer is already a Guardian with an equal or higher record. Still a success.
    if (rows.length === 0) {
      return NextResponse.json({ success: true, message: "Guardian already recorded" })
    }

    return NextResponse.json({
      success: true,
      message: rows[0].inserted ? "Guardian added!" : "Guardian updated",
    })
  } catch (error) {
    console.error("[guardians/add] Error adding guardian:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
