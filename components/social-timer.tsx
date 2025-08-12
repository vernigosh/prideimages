"use client"

import { useState, useEffect, useRef } from "react"

interface SocialTimerProps {
  isVisible: boolean
  onConnectionChange: (connected: boolean) => void
  onHide: () => void
}

export function SocialTimer({ isVisible, onConnectionChange, onHide }: SocialTimerProps) {
  const [timeLeft, setTimeLeft] = useState(2 * 60) // 2 minutes for social
  const [isRunning, setIsRunning] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const wsRef = useRef<WebSocket | null>(null)

  const isAuthorizedUser = (tags: string) => {
    // Check for broadcaster badge
    if (tags.includes("broadcaster/1")) return true

    // Check for moderator badge
    if (tags.includes("moderator/1")) return true

    return false
  }

  useEffect(() => {
    const connectToTwitchChat = () => {
      const ws = new WebSocket("wss://irc-ws.chat.twitch.tv:443")
      wsRef.current = ws

      ws.onopen = () => {
        ws.send("CAP REQ :twitch.tv/tags")
        ws.send("PASS SCHMOOPIIE")
        ws.send("NICK justinfan54321")
        ws.send("JOIN #vernigosh")
        setIsConnected(true)
        onConnectionChange(true)
      }

      ws.onmessage = (event) => {
        const message = event.data

        if (message.startsWith("PING")) {
          ws.send("PONG :tmi.twitch.tv")
          return
        }

        if (message.includes("PRIVMSG")) {
          const tags = message.split(" ")[0]
          const chatMessage = message.split("PRIVMSG")[1]?.split(":")[1]?.trim().toLowerCase()

          if (!isAuthorizedUser(tags)) {
            return
          }

          if (chatMessage === "!social") {
            startSocialTimer()
          } else if (chatMessage === "!hidesocial") {
            hideSocialTimer()
          }
        }
      }

      ws.onclose = () => {
        setIsConnected(false)
        onConnectionChange(false)
        setTimeout(connectToTwitchChat, 5000)
      }
    }

    connectToTwitchChat()

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [onConnectionChange])

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false)
            if (intervalRef.current) {
              clearInterval(intervalRef.current)
            }
            // Auto-hide after completion
            setTimeout(() => {
              onHide()
            }, 3000)
            return 0
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
  }, [isRunning, onHide])

  const startSocialTimer = () => {
    setTimeLeft(2 * 60)
    setIsRunning(true)
  }

  const hideSocialTimer = () => {
    setIsRunning(false)
    setTimeLeft(2 * 60)
    onHide()
  }

  const totalTime = 2 * 60
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

    const angle = percentage * 2 * Math.PI - Math.PI / 2
    const x = centerX + radius * Math.cos(angle)
    const y = centerY + radius * Math.sin(angle)
    const largeArcFlag = percentage > 0.5 ? 1 : 0

    return `M ${centerX} ${centerY} L ${centerX} ${centerY - radius} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x} ${y} Z`
  }

  if (!isVisible) return null

  if (timeLeft === 0) {
    return (
      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 w-1/3 max-w-md">
        <div className="flex flex-col items-center justify-center font-bold">
          <div className="relative w-64 h-64 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl text-white mb-2 drop-shadow-lg">Cheers everyone!</div>
              <div className="text-2xl text-lime-400 drop-shadow-lg">Thank you for being here!</div>
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
          <div className="absolute inset-6 flex items-center justify-center">
            <svg className="absolute w-full h-full" viewBox="0 0 200 200">
              <path
                d={createPieSlicePath(1 - progress)}
                fill="#32cd32"
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

        <div className="text-xl text-white text-center drop-shadow-lg">Social Timer</div>
      </div>
    </div>
  )
}
