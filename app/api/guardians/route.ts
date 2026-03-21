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
      console.error("Supabase error:", error)
      return NextResponse.json({ guardians: [] })
    }
    
    return NextResponse.json({ guardians: guardians || [] })
  } catch (error) {
    console.error("Error fetching guardians:", error)
    return NextResponse.json({ guardians: [] })
  }
}
