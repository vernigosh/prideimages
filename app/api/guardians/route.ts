import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: guardians, error } = await supabase
      .from("guardians")
      .select("*")
      .order("flower_count", { ascending: false })

    if (error) {
      console.error("Error fetching guardians:", error)
      return NextResponse.json({ error: "Failed to fetch guardians" }, { status: 500 })
    }

    return NextResponse.json({ guardians: guardians || [] })
  } catch (error) {
    console.error("Error in get guardians:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
