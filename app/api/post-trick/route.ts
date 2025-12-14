import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { trick } = await request.json()

    if (!trick || !trick.name || !trick.definition) {
      return NextResponse.json({ error: "Invalid trick data" }, { status: 400 })
    }

    const channelId = process.env.STREAMELEMENTS_CHANNEL_ID
    const jwtToken = process.env.STREAMELEMENTS_JWT_TOKEN

    if (!channelId || !jwtToken) {
      console.log("[v0] StreamElements credentials not configured on server")
      return NextResponse.json({ error: "StreamElements not configured" }, { status: 500 })
    }

    const message = `DJ Challenge: ${trick.name} - ${trick.definition}`

    const response = await fetch(`https://api.streamelements.com/kappa/v2/bot/${channelId}/say`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwtToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    })

    if (response.ok) {
      console.log("[v0] Successfully posted trick to chat:", trick.name)
      return NextResponse.json({ success: true })
    } else {
      const errorText = await response.text()
      console.error("[v0] Failed to post to chat:", errorText)
      return NextResponse.json({ error: "Failed to post to chat" }, { status: response.status })
    }
  } catch (error) {
    console.error("[v0] Error posting trick to chat:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
