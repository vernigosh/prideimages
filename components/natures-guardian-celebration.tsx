"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { NotificationCard } from "@/components/notification-card"

interface NaturesGuardianCelebrationProps {
  isVisible: boolean
  username: string
  onHide: () => void
}

export function NaturesGuardianCelebration({ isVisible, username, onHide }: NaturesGuardianCelebrationProps) {
  const [showCelebration, setShowCelebration] = useState(false)

  useEffect(() => {
    if (!isVisible) {
      setShowCelebration(false)
      return
    }

    console.log("[v0] Nature's Guardian celebration starting for:", username)
    setShowCelebration(true)

    // Auto-hide after 50 seconds (ultimate achievement deserves longest display)
    const hideTimer = setTimeout(() => {
      console.log("[v0] Nature's Guardian celebration auto-hiding after 50s")
      setShowCelebration(false)
      setTimeout(() => {
        onHide()
      }, 100)
    }, 50000)

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
          // Knights scaled down and the rainbow narrowed so all three fit the card
          // width in a vertical canvas instead of overflowing it.
          <div className="flex items-center justify-center gap-3">
            {/* No drop shadow: these used to sit over the live scene where a shadow
                aided separation. On the dark card it just smudges the art. */}
            <Image
              src="/images/pixel-knight.gif"
              alt="Pixel Knight Guardian"
              width={96}
              height={96}
              style={{ imageRendering: "pixelated" }}
            />
            <Image src="/images/pixelrainbow.gif" alt="Rainbow celebration" width={200} height={200} />
            <Image
              src="/images/pixel-knight.gif"
              alt="Pixel Knight Guardian"
              width={96}
              height={96}
              className="scale-x-[-1]"
              style={{ imageRendering: "pixelated" }}
            />
          </div>
        }
        lines={[
          { text: `${username.toUpperCase()} PICKED 50 FLOWERS!`, size: "display" },
          { text: "NATURE'S GUARDIAN", size: "title", color: "#fbbf24" },
          { text: "PROTECTOR OF THE GARDEN!", size: "body" },
        ]}
      />

      {/* Floating elements stay pinned to the screen edges, framing the card. */}
      <div
        className="fixed inset-0 z-40 pointer-events-none overflow-hidden transition-opacity duration-500"
        style={{ opacity: showCelebration ? 1 : 0 }}
      >
          {/* Left side */}
          {[...Array(12)].map((_, i) => (
            <div
              key={`left-${i}`}
              className="absolute animate-float text-3xl"
              style={{
                left: `${2 + (i % 2) * 5}%`,
                top: `${3 + i * 8}%`,
                animationDelay: `${i * 0.25}s`,
                animationDuration: `${3 + (i % 3)}s`,
              }}
            >
              {["🌸", "🌺", "🌻", "🌷", "⭐", "✨", "👑", "🛡️"][i % 8]}
            </div>
          ))}
          {/* Right side */}
          {[...Array(12)].map((_, i) => (
            <div
              key={`right-${i}`}
              className="absolute animate-float text-3xl"
              style={{
                right: `${2 + (i % 2) * 5}%`,
                top: `${3 + i * 8}%`,
                animationDelay: `${i * 0.2}s`,
                animationDuration: `${3 + (i % 3)}s`,
              }}
            >
              {["🛡️", "👑", "✨", "⭐", "🌷", "🌻", "🌺", "🌸"][i % 8]}
            </div>
          ))}
      </div>
    </>
  )
}
