"use client"

import { useState, useEffect, useRef } from "react"

interface WorkTimerProps {
  isVisible: boolean
  onConnectionChange: (connected: boolean) => void
  onHide: () => void
}

export function WorkTimer({ isVisible, onConnectionChange, onHide }: WorkTimerProps) {
  const [phase, setPhase] = useState<"work" | "break" | "complete">("work")
  const [timeLeft, setTimeLeft] = useState(25 * 60) // Start with 25 minutes for work
  const [isRunning, setIsRunning] = useState(false) // Timer doesn't auto-start
  const [isConnected, setIsConnected] = useState(false) // Track chat connection
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const wsRef = useRef<WebSocket | null>(null)

  const isAuthorizedUser = (tags: string) => {
    // Parse tags properly - they're semicolon-separated key=value pairs
    const tagPairs = tags.split(";")
    const badges = tagPairs.find((tag) => tag.startsWith("badges="))?.split("=")[1] || ""

    // Check for broadcaster, moderator, or VIP badges
    if (badges.includes("broadcaster/1")) return true
    if (badges.includes("moderator/1")) return true
    if (badges.includes("vip/1")) return true

    return false
  }

  useEffect(() => {
    const connectToTwitchChat = () => {
      // Close existing connection if any
      if (wsRef.current) {
        wsRef.current.close()
      }

      const ws = new WebSocket("wss://irc-ws.chat.twitch.tv:443")
      wsRef.current = ws

      ws.onopen = () => {
        console.log("Work Timer: WebSocket opened")
        ws.send("CAP REQ :twitch.tv/tags twitch.tv/commands")
        ws.send("PASS SCHMOOPIIE")
        ws.send("NICK justinfan" + Math.floor(Math.random() * 100000))
        ws.send("JOIN #vernigosh")
      }

      ws.onmessage = (event) => {
        const message = event.data
        console.log("Work Timer received:", message)

        // Handle successful join
        if (message.includes("366")) {
          console.log("Work Timer: Successfully joined channel")
          setIsConnected(true)
          onConnectionChange(true)
        }

        // Handle PING/PONG to keep connection alive
        if (message.startsWith("PING")) {
          ws.send("PONG :tmi.twitch.tv")
          return
        }

        // Parse chat messages for commands
        if (message.includes("PRIVMSG")) {
          try {
            const parts = message.split(" ")
            const tags = parts[0].startsWith("@") ? parts[0].substring(1) : ""
            const messageContent = message.split("PRIVMSG")[1]?.split(":").slice(1).join(":").trim().toLowerCase()

            console.log("Work Timer - Tags:", tags)
            console.log("Work Timer - Message:", messageContent)
            console.log("Work Timer - Is Authorized:", isAuthorizedUser(tags))

            if (!isAuthorizedUser(tags)) {
              return
            }

            if (messageContent === "!worktimer" || messageContent === "!timer") {
              console.log("Work Timer: Starting timer")
              startTimer()
            } else if (messageContent === "!stoptimer") {
              console.log("Work Timer: Stopping timer")
              stopTimer()
            } else if (messageContent === "!resettimer") {
              console.log("Work Timer: Resetting timer")
              resetTimer()
            } else if (messageContent === "!hidetimer") {
              console.log("Work Timer: Hiding timer")
              hideTimer()
            }
          } catch (error) {
            console.error("Work Timer: Error parsing message:", error)
          }
        }
      }

      ws.onclose = (event) => {
        console.log("Work Timer: WebSocket closed", event.code, event.reason)
        setIsConnected(false)
        onConnectionChange(false)
        // Reconnect after 3 seconds if not manually closed
        if (event.code !== 1000) {
          setTimeout(connectToTwitchChat, 3000)
        }
      }

      ws.onerror = (error) => {
        console.error("Work Timer: WebSocket error:", error)
        setIsConnected(false)
        onConnectionChange(false)
      }
    }

    // Only connect if the timer is visible
    if (isVisible) {
      connectToTwitchChat()
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [isVisible, onConnectionChange])

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (phase === "work") {
              setPhase("break")
              return 5 * 60 // 5 minutes for break
            } else {
              setPhase("complete")
              setIsRunning(false)
              if (intervalRef.current) {
                clearInterval(intervalRef.current)
              }
              return 0
            }
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, phase])

  const startTimer = () => {
    if (phase === "complete") {
      resetTimer()
    }
    setIsRunning(true)
  }

  const stopTimer = () => {
    setIsRunning(false)
  }

  const resetTimer = () => {
    setIsRunning(false)
    setPhase("work")
    setTimeLeft(25 * 60)
  }

  const hideTimer = () => {
    setIsRunning(false)
    setPhase("work")
    setTimeLeft(25 * 60)
    onHide()
  }

  const totalTime = phase === "work" ? 25 * 60 : 5 * 60
  const progress = (totalTime - timeLeft) / totalTime

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  const createPieSlicePath = (percentage: number) => {
    const radius = 90
    const centerX = 100
    const centerY = 100

    if (percentage <= 0) return ""
    if (percentage >= 1) {
      return `M ${centerX} ${centerY} L ${centerX} ${centerY - radius} A ${radius} ${radius} 0 1 1 ${centerX - 0.1} ${centerY - radius} Z`
    }

    const angle = percentage * 2 * Math.PI - Math.PI / 2 // Start from top (-90 degrees)
    const x = centerX + radius * Math.cos(angle)
    const y = centerY + radius * Math.sin(angle)
    const largeArcFlag = percentage > 0.5 ? 1 : 0

    return `M ${centerX} ${centerY} L ${centerX} ${centerY - radius} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x} ${y} Z`
  }

  if (!isVisible) return null

  if (phase === "complete") {
    // Auto-hide after 1 minute instead of immediately
    setTimeout(() => {
      onHide()
    }, 60000) // Changed from 3000ms to 60000ms (1 minute)

    return (
      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 w-1/3 max-w-md">
        <div className="flex flex-col items-center justify-center font-bold">
          <div className="relative w-64 h-64 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl text-white mb-2 drop-shadow-lg font-bold">{"Time's up!"}</div>
              <div className="text-2xl text-green-400 drop-shadow-lg font-bold">Great job!</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 w-1/3 max-w-md">
      <div className="flex flex-col items-center justify-center gap-4 font-bold">
        <div className="relative w-64 h-64">
          <div className="absolute inset-0">
            {[0, 5, 10, 15, 20, 25].map((num, index) => {
              const angle = (index * 360) / 6 - 90
              const radian = (angle * Math.PI) / 180
              const distance = 120 // Reduced distance for smaller size
              const x = 128 + distance * Math.cos(radian)
              const y = 128 + distance * Math.sin(radian)

              return (
                <div
                  key={num}
                  className="absolute text-lg text-white drop-shadow-lg"
                  style={{
                    left: `${x}px`,
                    top: `${y}px`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  {num}
                </div>
              )
            })}
          </div>

          <div className="absolute inset-6 flex items-center justify-center">
            <svg className="absolute w-full h-full" viewBox="0 0 200 200">
              <path
                d={createPieSlicePath(1 - progress)}
                fill={phase === "work" ? "#ef4444" : "#3b82f6"}
                style={{
                  transition: "d 1s ease-linear",
                }}
              />
            </svg>

            <div className="text-center z-10 relative">
              <div className="text-4xl text-white drop-shadow-lg font-bold">
                {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
              </div>
              <div className="text-sm text-gray-300 mt-1 drop-shadow-md font-semibold">
                {isRunning ? "Running" : "Paused"}
              </div>
            </div>
          </div>
        </div>

        <div className="text-xl text-white text-center drop-shadow-lg font-semibold">
          {phase === "work" ? "25 No Mic Work Challenge" : "Break time!"}
        </div>
      </div>
    </div>
  )
}
