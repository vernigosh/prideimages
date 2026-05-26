import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("trivia_scores")
      .select("username, score")
      .order("score", { ascending: false })
      .limit(5)

    if (error) {
      console.error("[v0] Error fetching trivia scores:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ scores: data || [] })
  } catch (error) {
    console.error("[v0] Error in trivia scores GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { winners } = await request.json()

    if (!winners || !Array.isArray(winners) || winners.length === 0) {
      return NextResponse.json({ success: true, message: "No winners to update" })
    }

    // Update scores for each winner (increment by 1)
    for (const username of winners) {
      const lowerUsername = username.toLowerCase()
      
      // First, try to get existing record
      const { data: existing } = await supabase
        .from("trivia_scores")
        .select("score")
        .eq("username", lowerUsername)
        .single()

      if (existing) {
        // Update existing record - increment score
        const { error: updateError } = await supabase
          .from("trivia_scores")
          .update({ score: existing.score + 1, updated_at: new Date().toISOString() })
          .eq("username", lowerUsername)
        
        if (updateError) {
          console.error("[v0] Error updating score for", lowerUsername, updateError)
        }
      } else {
        // Insert new record with score of 1
        const { error: insertError } = await supabase
          .from("trivia_scores")
          .insert({ username: lowerUsername, score: 1 })
        
        if (insertError) {
          console.error("[v0] Error inserting score for", lowerUsername, insertError)
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error in trivia scores POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
