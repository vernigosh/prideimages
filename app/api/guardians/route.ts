import { getSql, type Guardian } from "@/lib/neon/client"
import { NextResponse } from "next/server"

// The board must always reflect the live table, never a cached snapshot.
export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  try {
    const sql = getSql()

    const guardians = (await sql`
      SELECT id, username, flower_count, achieved_at
      FROM guardians
      ORDER BY flower_count DESC
    `) as Guardian[]

    return NextResponse.json({ guardians }, { headers: { "Cache-Control": "no-store, max-age=0" } })
  } catch (error) {
    // Never degrade a failed query to an empty list: an empty list is a valid
    // answer ("no guardians yet") and would hide the failure as a blank board,
    // which is exactly how the previous outage went unnoticed on stream.
    console.error("[guardians] Error fetching guardians:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500, headers: { "Cache-Control": "no-store, max-age=0" } },
    )
  }
}
