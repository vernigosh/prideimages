"use client"

import { useEffect, useRef, useState } from "react"

interface StreamElementsData {
  tipGoal: {
    amount: number
    target: number
  }
  session: {
    data: {
      "tip-goal": {
        amount: number
        target: number
      }
    }
  }
}

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
      }
    }
  }
}

export function useStreamElements() {
  const [goalData, setGoalData] = useState({
    current: 0,
    target: 100,
    percentage: 0,
  })
  const [recentTippers, setRecentTippers] = useState<Array<{ name: string; amount: number }>>([])
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

          // Subscribe to channel session updates for tip goal data
          ws.send(
            JSON.stringify({
              type: "subscribe",
              nonce: `nonce-${Date.now()}`,
              data: {
                topic: "channel.session.update",
                room: "64ae97ecc90c5bc26b0c0f97", // Channel ID from JWT
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
                topic: "channel.activities", // Fixed invalid topic from channel.tip to channel.activities
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

            // Handle session data (includes tip goal info)
            if (message.type === "session:update" || message.type === "authenticated") {
              const sessionData = message.data?.session?.data || message.data
              if (sessionData && sessionData["tip-goal"]) {
                const tipGoalData = sessionData["tip-goal"]
                const current = tipGoalData.amount || 0
                const target = tipGoalData.target || 100
                const percentage = target > 0 ? Math.round((current / target) * 100) : 0

                setGoalData({ current, target, percentage })
                console.log("[v0] Updated tip goal:", { current, target, percentage })
              }
            }

            if (message.type === "response" && message.data?.subscribed) {
              console.log("[v0] Successfully subscribed to:", message.data.topic)
            }

            // Handle tip events from activities
            if (message.type === "event" && message.data?.activity?.type === "tip") {
              // Updated to handle activities structure
              const tipData = message.data.activity.data
              if (tipData.username && tipData.amount) {
                setRecentTippers((prev) => [
                  { name: tipData.username, amount: Number.parseFloat(tipData.amount) },
                  ...prev.slice(0, 4), // Keep last 5 tippers
                ])

                // Dispatch custom event for tip goal popup
                window.dispatchEvent(
                  new CustomEvent("streamelements-tip", {
                    detail: {
                      username: tipData.username,
                      amount: Number.parseFloat(tipData.amount),
                      message: tipData.message || "",
                    },
                  }),
                )

                console.log("[v0] Tip event dispatched:", {
                  username: tipData.username,
                  amount: tipData.amount,
                  message: tipData.message,
                })
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
    goalData,
    recentTippers,
    isConnected,
  }
}
