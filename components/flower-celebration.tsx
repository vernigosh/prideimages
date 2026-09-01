"use client"

import { useState, useEffect } from "react"
import { NotificationCard } from "@/components/notification-card"

interface FlowerCelebrationProps {
  isVisible: boolean
  username: string
  onHide: () => void
}

export function FlowerCelebration({ isVisible, username, onHide }: FlowerCelebrationProps) {
  const [showCelebration, setShowCelebration] = useState(false)

  useEffect(() => {
    if (isVisible) {
      console.log("[v0] Flower celebration starting")
      setShowCelebration(true)

      // Hide after 35 seconds
      const hideTimer = setTimeout(() => {
        console.log("[v0] Flower celebration ending")
        setShowCelebration(false)

        // Wait for fade out animation
        setTimeout(() => {
          console.log("[v0] Flower celebration calling onHide")
          onHide()
        }, 1000)
      }, 35000)

      return () => {
        clearTimeout(hideTimer)
      }
    }
  }, [isVisible])

  if (!isVisible) return null

  return (
    <>
      <NotificationCard
        visible={showCelebration}
        media={
          <img
            src="/images/pixelrainbow.gif"
            alt="Rainbow celebration"
            className="pixelated"
            style={{ imageRendering: "pixelated", width: "160px", height: "auto" }}
          />
        }
        lines={[
          { text: "GOLDEN GREENTHUMB!", size: "display" },
          { text: `${username.toUpperCase()} PICKED 10 FLOWERS!`, size: "title", color: "#ffd700" },
          { text: "GOLDEN GREENTHUMB UNLOCKED!", size: "body" },
        ]}
      />

      {/* Floating flowers stay pinned to the screen edges, framing the card. */}
      <div
        className="fixed inset-0 z-40 pointer-events-none overflow-hidden transition-opacity duration-1000"
        style={{ opacity: showCelebration ? 1 : 0 }}
      >
        {/* Left side flowers */}
        {[...Array(6)].map((_, i) => (
          <div
            key={`left-${i}`}
            className="absolute animate-bounce"
            style={{
              left: `${2 + (i % 2) * 5}%`,
              top: `${10 + i * 14}%`,
              animationDelay: `${i * 0.2}s`,
              animationDuration: "2s",
            }}
          >
            <span className="text-4xl">{["🌸", "🌺", "🌻", "🌷", "🌹", "🌼"][i % 6]}</span>
          </div>
        ))}
        {/* Right side flowers */}
        {[...Array(6)].map((_, i) => (
          <div
            key={`right-${i}`}
            className="absolute animate-bounce"
            style={{
              right: `${2 + (i % 2) * 5}%`,
              top: `${10 + i * 14}%`,
              animationDelay: `${i * 0.25}s`,
              animationDuration: "2s",
            }}
          >
            <span className="text-4xl">{["🌼", "🌹", "🌷", "🌻", "🌺", "🌸"][i % 6]}</span>
          </div>
        ))}
      </div>
    </>
  )
}

export default FlowerCelebration
