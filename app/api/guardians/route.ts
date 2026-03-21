import { neon } from "@neondatabase/serverless"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!)

    const guardians = await sql`
      SELECT * FROM guardians 
      ORDER BY flower_count DESC
    `

    return NextResponse.json({ guardians: guardians || [] })
  } catch (error) {
    console.error("Error fetching guardians:", error)
    return NextResponse.json({ error: "Failed to fetch guardians" }, { status: 500 })
  }
}
