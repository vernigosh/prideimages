"use client"

import { useEffect, useRef, useState } from "react"

interface StreamElementsEvent {
  type: string
  data: {
    amount?: number
    username?: string
    message?: string
    activity?: {
      type: string
      data: {
        username?: string
        amount?: string
        message?: string
        displayName?: string
        viewers?: number
      }
    }
  }
}

export interface StreamCredits {
  followers: string[]
  tippers: Array<{ name: string; amount: number }>
  cheerers: Array<{ name: string; bits: number }>
  raiders: Array<{ name: string; viewers: number }>
}

export function useStreamElements() {
  const [recentTippers, setRecentTippers] = useState<Array<{ name: string; amount: number }>>([])
  const [streamCredits, setStreamCredits] = useState<StreamCredits>({
    followers: [],
    tippers: [],
    cheerers: [],
    raiders: [],
  })
  const [isConnected, setIsConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    const JWT_TOKEN =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJjaXRhZGVsIiwiZXhwIjoxNzcxNjEyOTk1LCJqdGkiOiI4MGZiMjUxZi1lNDNhLTRjMTMtOGFkMS04MzRmNjBmZWMzODMiLCJjaGFubmVsIjoiNjRhZTk3ZWNjOTBjNWJjMjZiMGMwZjk3Iiwicm9sZSI6Im93bmVyIiwiYXV0aFRva2VuIjoiY1JwbjJhdmVlMjVMSFZHMUlUcVdLOXViVG1KYTNtQmw3ZFBSZTR3UkFGRDBRX3Q0IiwidXNlciI6IjY0YWU5N2VjYzkwYzViYzI2YjBjMGY5NiIsInVzZXJfaWQiOiJiNjM0NmM2ZS0yZjA2LTQwNmEtOTQ0ZC04NzQ5YjM1ODZhYTYiLCJ1c2VyX3JvbGUiOiJjcmVhdG9yIiwicHJvdmlkZXIiOiJ0d2l0Y2giLCJwcm92aWRlcl9pZCI6Ijg1NzczMTUxNyIsImNoYW5uZWxfaWQiOiI3N2QyYTU2NS1hM2JhLTRkNzktYjg5ZS05ODEzZTQyMmViNDYiLCJjcmVhdG9yX2lkIjoiODc2YjIxOGItMThmNi00YzkzLTg5MTEtYTc3MTBjYTc0YjdiIn0.tk56AEzeBCVFApK8WRN2YWSxmki-GHXFc6nk1TbaVfI"

    const connectToStreamElements = () => {
      try {
        const ws = new WebSocket("wss://astro.streamelements.com")
        wsRef.current = ws

        ws.onopen = () => {
          console.log("[v0] Connected to StreamElements")
          setIsConnected(true)

          // Authenticate with JWT token
          ws.send(
            JSON.stringify({
              type: "authenticate",
              data: {
                token: JWT_TOKEN,
                token_type: "jwt",
              },
            }),
          )

          // Subscribe to tip events using correct topic
          ws.send(
            JSON.stringify({
              type: "subscribe",
              nonce: `nonce-${Date.now()}-activities`,
              data: {
                topic: "channel.activities",
                room: "64ae97ecc90c5bc26b0c0f97",
                token: JWT_TOKEN,
                token_type: "jwt",
              },
            }),
          )
        }

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data)
            console.log("[v0] StreamElements message:", message)

            if (message.type === "authenticated") {
              console.log("[v0] StreamElements authenticated successfully")
            }

            if (message.type === "response" && message.data?.subscribed) {
              console.log("[v0] Successfully subscribed to:", message.data.topic)
            }

            // Handle various activity events
            if (message.type === "event" && message.data?.activity) {
              const activityType = message.data.activity.type
              const activityData = message.data.activity.data

              // Handle tip events
              if (activityType === "tip" && activityData.username && activityData.amount) {
                const tipAmount = Number.parseFloat(activityData.amount)
                setRecentTippers((prev) => [
                  { name: activityData.username, amount: tipAmount },
                  ...prev.slice(0, 4),
                ])
                setStreamCredits((prev) => ({
                  ...prev,
                  tippers: [...prev.tippers.filter((t) => t.name !== activityData.username), { name: activityData.username, amount: tipAmount }],
                }))
                console.log("[v0] Tip event received:", activityData.username, tipAmount)
              }

              // Handle follow events
              if (activityType === "follow" && activityData.username) {
                setStreamCredits((prev) => ({
                  ...prev,
                  followers: prev.followers.includes(activityData.username) ? prev.followers : [...prev.followers, activityData.username],
                }))
                console.log("[v0] Follow event received:", activityData.username)
              }

              // Handle cheer/bits events
              if (activityType === "cheer" && activityData.username && activityData.amount) {
                const bitsAmount = Number.parseInt(activityData.amount)
                setStreamCredits((prev) => ({
                  ...prev,
                  cheerers: [...prev.cheerers.filter((c) => c.name !== activityData.username), { name: activityData.username, bits: bitsAmount }],
                }))
                console.log("[v0] Cheer event received:", activityData.username, bitsAmount)
              }

              // Handle raid events
              if (activityType === "raid" && activityData.username) {
                const viewers = activityData.viewers || 0
                setStreamCredits((prev) => ({
                  ...prev,
                  raiders: [...prev.raiders, { name: activityData.username, viewers }],
                }))
                console.log("[v0] Raid event received:", activityData.username, viewers)
              }
            }
          } catch (error) {
            console.error("[v0] Error parsing StreamElements message:", error)
          }
        }

        ws.onclose = () => {
          console.log("[v0] StreamElements connection closed")
          setIsConnected(false)
          // Reconnect after 5 seconds
          setTimeout(connectToStreamElements, 5000)
        }

        ws.onerror = (error) => {
          console.error("[v0] StreamElements connection error:", error)
          setIsConnected(false)
        }
      } catch (error) {
        console.error("[v0] Failed to connect to StreamElements:", error)
        setTimeout(connectToStreamElements, 5000)
      }
    }

    connectToStreamElements()

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [])

  return {
    recentTippers,
    streamCredits,
    isConnected,
  }
}
