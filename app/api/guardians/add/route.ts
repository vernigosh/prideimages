import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { username, flowerCount } = await request.json()

    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Check if user is already a guardian
    const { data: existing } = await supabase
      .from("guardians")
      .select("id")
      .eq("username", username.toLowerCase())
      .single()

    if (existing) {
      // Update flower count if higher
      const { error: updateError } = await supabase
        .from("guardians")
        .update({ flower_count: flowerCount })
        .eq("username", username.toLowerCase())
        .gt("flower_count", flowerCount)

      return NextResponse.json({ success: true, message: "Guardian already exists" })
    }

    // Add new guardian
    const { error } = await supabase.from("guardians").insert({
      username: username.toLowerCase(),
      flower_count: flowerCount || 50,
    })

    if (error) {
      console.error("Error adding guardian:", error)
      return NextResponse.json({ error: "Failed to add guardian" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Guardian added!" })
  } catch (error) {
    console.error("Error in add guardian:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
