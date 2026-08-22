import { getSql, type TriviaScore } from "@/lib/neon/client"
import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const sql = getSql()

    const scores = (await sql`
      SELECT username, score
      FROM trivia_scores
      ORDER BY score DESC
      LIMIT 5
    `) as TriviaScore[]

    return NextResponse.json({ scores })
  } catch (error) {
    console.error("[trivia-scores] Error fetching trivia scores:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { winners } = await request.json()

    if (!winners || !Array.isArray(winners) || winners.length === 0) {
      return NextResponse.json({ success: true, message: "No winners to update" })
    }

    const sql = getSql()

    // De-duplicate within the payload so the same name listed twice in one round
    // cannot be counted twice.
    const names = [...new Set(winners.map((w: string) => String(w).toLowerCase()))]

    // One atomic upsert per winner. The previous Supabase version read the score
    // and then wrote score + 1, which loses increments when two rounds resolve at
    // once. Incrementing in SQL means the database does the arithmetic and no
    // update can be lost.
    for (const username of names) {
      try {
        await sql`
          INSERT INTO trivia_scores (username, score)
          VALUES (${username}, 1)
          ON CONFLICT (username) DO UPDATE
            SET score = trivia_scores.score + 1,
                updated_at = NOW()
        `
      } catch (error) {
        // One bad name should not drop the rest of the round's winners.
        console.error("[trivia-scores] Error recording score for", username, error)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[trivia-scores] Error in trivia scores POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
