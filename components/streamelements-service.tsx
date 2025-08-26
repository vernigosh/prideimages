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
    current: 66.9, // Current cumulative tips since Aug 1, 2025
    target: 2500, // Third deck fund target
    percentage: Math.round((66.9 / 2500) * 100),
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

          setGoalData({
            current: 66.9, // Current cumulative tips since Aug 1, 2025
            target: 2500, // Third deck fund target
            percentage: Math.round((66.9 / 2500) * 100),
          })
          console.log("[v0] Set baseline tip goal data on connection")

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

          setTimeout(() => {
            ws.send(
              JSON.stringify({
                type: "get",
                nonce: `nonce-session-${Date.now()}`,
                data: {
                  resource: "session",
                  room: "64ae97ecc90c5bc26b0c0f97",
                },
              }),
            )
          }, 1000)

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

            if (message.type === "authenticated") {
              console.log("[v0] StreamElements authenticated successfully")
              setGoalData((prev) => ({
                current: Math.max(prev.current, 66.9), // Ensure we don't go below baseline
                target: 2500,
                percentage: Math.round((Math.max(prev.current, 66.9) / 2500) * 100),
              }))
              console.log("[v0] Confirmed baseline tip goal data after authentication")
            }

            // Handle session data (includes tip goal info)
            if (message.type === "session:update" || message.type === "session" || message.data?.session) {
              console.log("[v0] Received session data:", message.data)
              const sessionData = message.data?.session?.data || message.data
              if (sessionData && sessionData["tip-goal"]) {
                const tipGoalData = sessionData["tip-goal"]
                const sessionAmount = tipGoalData.amount || 0
                const cumulativeBase = 66.9 // Tips since Aug 1, 2025
                const current = sessionAmount + cumulativeBase
                const target = 2500 // Third deck fund target
                const percentage = target > 0 ? Math.round((current / target) * 100) : 0

                setGoalData({ current, target, percentage })
                console.log("[v0] Updated cumulative tip goal:", {
                  current,
                  target,
                  percentage,
                  sessionAmount,
                  cumulativeBase,
                })
              }
            }

            if (message.type === "response" && message.data?.subscribed) {
              console.log("[v0] Successfully subscribed to:", message.data.topic)
            }

            // Handle tip events from activities
            if (message.type === "event" && message.data?.activity?.type === "tip") {
              const tipData = message.data.activity.data
              if (tipData.username && tipData.amount) {
                const tipAmount = Number.parseFloat(tipData.amount)

                setGoalData((prev) => {
                  const newCurrent = prev.current + tipAmount
                  const newPercentage = Math.round((newCurrent / prev.target) * 100)
                  console.log("[v0] Updated tip goal with new tip:", { newCurrent, tipAmount, newPercentage })
                  return {
                    ...prev,
                    current: newCurrent,
                    percentage: newPercentage,
                  }
                })

                setRecentTippers((prev) => [
                  { name: tipData.username, amount: tipAmount },
                  ...prev.slice(0, 4), // Keep last 5 tippers
                ])

                // Dispatch custom event for tip goal popup
                window.dispatchEvent(
                  new CustomEvent("streamelements-tip", {
                    detail: {
                      username: tipData.username,
                      amount: tipAmount,
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
