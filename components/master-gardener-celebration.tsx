"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { NotificationCard } from "@/components/notification-card"

interface MasterGardenerCelebrationProps {
  isVisible: boolean
  username: string
  onHide: () => void
}

export function MasterGardenerCelebration({ isVisible, username, onHide }: MasterGardenerCelebrationProps) {
  const [showCelebration, setShowCelebration] = useState(false)

  useEffect(() => {
    if (!isVisible) {
      setShowCelebration(false)
      return
    }

    console.log("[v0] Master Gardener celebration starting for:", username)
    setShowCelebration(true)

    // Auto-hide after 40 seconds
    const hideTimer = setTimeout(() => {
      console.log("[v0] Master Gardener celebration auto-hiding after 40s")
      setShowCelebration(false)
      setTimeout(() => {
        onHide()
      }, 100)
    }, 40000)

    return () => {
      clearTimeout(hideTimer)
    }
  }, [isVisible]) // Removed username from dependencies to prevent restart loop

  if (!isVisible) return null

  return (
    <>
      <NotificationCard
        visible={showCelebration}
        fadeMs={500}
        media={
          <Image src="/images/pixelrainbow.gif" alt="Rainbow celebration" width={250} height={250} />
        }
        lines={[
          { text: `${username.toUpperCase()} PICKED 30 FLOWERS!`, size: "display" },
          { text: "GARDEN CHAMPION!", size: "title", color: "#34d399" },
        ]}
      />

      {/* Floating flowers stay pinned to the screen edges, framing the card. */}
      <div
        className="fixed inset-0 z-40 pointer-events-none overflow-hidden transition-opacity duration-500"
        style={{ opacity: showCelebration ? 1 : 0 }}
      >
          {/* Left side */}
          {[...Array(10)].map((_, i) => (
            <div
              key={`left-${i}`}
              className="absolute animate-float text-3xl"
              style={{
                left: `${2 + (i % 2) * 5}%`,
                top: `${5 + i * 9}%`,
                animationDelay: `${i * 0.3}s`,
                animationDuration: `${3 + (i % 3)}s`,
              }}
            >
              {["🌸", "🌺", "🌻", "🌷", "⭐", "✨"][i % 6]}
            </div>
          ))}
          {/* Right side */}
          {[...Array(10)].map((_, i) => (
            <div
              key={`right-${i}`}
              className="absolute animate-float text-3xl"
              style={{
                right: `${2 + (i % 2) * 5}%`,
                top: `${5 + i * 9}%`,
                animationDelay: `${i * 0.25}s`,
                animationDuration: `${3 + (i % 3)}s`,
              }}
            >
              {["✨", "⭐", "🌷", "🌻", "🌺", "🌸"][i % 6]}
            </div>
          ))}
      </div>
    </>
  )
}
