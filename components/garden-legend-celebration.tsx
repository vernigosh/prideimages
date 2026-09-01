"use client"

import { useState, useEffect } from "react"
import { NotificationCard } from "@/components/notification-card"

interface GardenLegendCelebrationProps {
  isVisible: boolean
  username: string
  onHide: () => void
}

export function GardenLegendCelebration({ isVisible, username, onHide }: GardenLegendCelebrationProps) {
  const [showCelebration, setShowCelebration] = useState(false)

  useEffect(() => {
    if (isVisible) {
      console.log("[v0] Garden Legend celebration starting")
      setShowCelebration(true)

      const hideTimer = setTimeout(() => {
        console.log("[v0] Garden Legend celebration ending")
        setShowCelebration(false)

        setTimeout(() => {
          console.log("[v0] Garden Legend celebration calling onHide")
          onHide()
        }, 1000)
      }, 45000) // 45 seconds for Garden Legend

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
            style={{ imageRendering: "pixelated", width: "220px", height: "auto" }}
          />
        }
        lines={[
          { text: "FLOWER SPECIALIST!", size: "display" },
          { text: `${username.toUpperCase()} PICKED 20 FLOWERS!`, size: "title", color: "#a3e635" },
          { text: "FLOWER SPECIALIST UNLOCKED!", size: "body" },
        ]}
      />

      {/* Floating flowers stay pinned to the screen edges, framing the card. */}
      <div
        className="fixed inset-0 z-40 pointer-events-none overflow-hidden transition-opacity duration-1000"
        style={{ opacity: showCelebration ? 1 : 0 }}
      >
        {/* Left side flowers */}
        {[...Array(8)].map((_, i) => (
          <div
            key={`left-${i}`}
            className="absolute animate-bounce"
            style={{
              left: `${2 + (i % 2) * 5}%`,
              top: `${8 + i * 11}%`,
              animationDelay: `${i * 0.15}s`,
              animationDuration: "2s",
            }}
          >
            <span className="text-4xl">{i % 8 === 7 ? "⭐" : ["🌸", "🌺", "🌻", "🌷", "🌹", "🌼", "💐"][i % 7]}</span>
          </div>
        ))}
        {/* Right side flowers */}
        {[...Array(8)].map((_, i) => (
          <div
            key={`right-${i}`}
            className="absolute animate-bounce"
            style={{
              right: `${2 + (i % 2) * 5}%`,
              top: `${8 + i * 11}%`,
              animationDelay: `${i * 0.2}s`,
              animationDuration: "2s",
            }}
          >
            <span className="text-4xl">{i % 8 === 0 ? "⭐" : ["💐", "🌼", "🌹", "🌷", "🌻", "🌺", "🌸"][i % 7]}</span>
          </div>
        ))}
      </div>
    </>
  )
}
