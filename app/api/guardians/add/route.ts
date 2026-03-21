import { neon } from "@neondatabase/serverless"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { username, flowerCount } = await request.json()

    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 })
    }

    const sql = neon(process.env.DATABASE_URL!)
    const lowerUsername = username.toLowerCase()

    // Check if user is already a guardian
    const existing = await sql`
      SELECT id, flower_count FROM guardians 
      WHERE username = ${lowerUsername}
    `

    if (existing.length > 0) {
      // Update flower count if the new count is higher
      if (flowerCount > existing[0].flower_count) {
        await sql`
          UPDATE guardians 
          SET flower_count = ${flowerCount}
          WHERE username = ${lowerUsername}
        `
      }
      return NextResponse.json({ success: true, message: "Guardian updated" })
    }

    // Add new guardian
    await sql`
      INSERT INTO guardians (username, flower_count)
      VALUES (${lowerUsername}, ${flowerCount || 50})
    `

    return NextResponse.json({ success: true, message: "Guardian added!" })
  } catch (error) {
    console.error("Error in add guardian:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
