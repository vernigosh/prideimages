import { type NextRequest, NextResponse } from "next/server"

/**
 * Duplicate suppression for outgoing bot messages.
 *
 * Every overlay instance posts through this one route, and each instance keeps its
 * own in-memory dedup state. So when the overlay is open in more than one place at
 * once (an OBS browser source plus a browser tab, or two OBS sources), a single
 * chat command produces one confirmation PER instance and viewers see it twice.
 * Those instances cannot coordinate client-side: OBS and Chrome are separate
 * processes with separate localStorage, so BroadcastChannel/localStorage locks do
 * not reach across them. The server is the only shared point, so the last-write
 * wins here instead.
 */
const recentMessages = new Map<string, number>()
const DUPLICATE_WINDOW_MS = 5000

function isDuplicate(message: string): boolean {
  const now = Date.now()
  // Drop expired entries so the map cannot grow across a long stream.
  for (const [key, sentAt] of recentMessages) {
    if (now - sentAt > DUPLICATE_WINDOW_MS) recentMessages.delete(key)
  }
  const previous = recentMessages.get(message)
  if (previous !== undefined && now - previous < DUPLICATE_WINDOW_MS) return true
  recentMessages.set(message, now)
  return false
}

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    // Reported as 200 so the calling overlay treats it as handled rather than
    // logging a failure and potentially retrying.
    if (isDuplicate(message)) {
      console.log("[v0] Suppressed duplicate chat message:", message)
      return NextResponse.json({ success: true, deduplicated: true })
    }

    const channelId = process.env.STREAMELEMENTS_CHANNEL_ID
    const jwtToken = process.env.STREAMELEMENTS_JWT_TOKEN

    if (!channelId || !jwtToken) {
      console.log("[v0] StreamElements credentials not configured on server")
      return NextResponse.json({ error: "StreamElements not configured" }, { status: 500 })
    }

    const response = await fetch(`https://api.streamelements.com/kappa/v2/bot/${channelId}/say`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwtToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    })

    if (response.ok) {
      console.log("[v0] Successfully sent chat message:", message)
      return NextResponse.json({ success: true })
    } else {
      const errorText = await response.text()
      console.error("[v0] Failed to send chat message:", errorText)
      return NextResponse.json({ error: "Failed to send chat message" }, { status: response.status })
    }
  } catch (error) {
    console.error("[v0] Error sending chat message:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
