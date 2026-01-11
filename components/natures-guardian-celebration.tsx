"use client"

import { useEffect, useState } from "react"
import Image from "next/image"

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
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center pointer-events-none transition-opacity duration-500 ${
        showCelebration ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="relative text-center -mt-48">
        <div className="relative mb-8">
          <Image
            src="/images/pixelrainbow.gif"
            alt="Rainbow celebration"
            width={400}
            height={400}
            className="mx-auto drop-shadow-2xl"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            {[...Array(25)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-float"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${3 + Math.random() * 2}s`,
                }}
              >
                {["🌸", "🌺", "🌻", "🌷", "⭐", "✨", "👑", "🛡️"][Math.floor(Math.random() * 8)]}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4 px-8">
          <h1
            className="font-bold drop-shadow-lg"
            style={{
              fontSize: "4.5rem",
              background: "linear-gradient(135deg, #059669 0%, #8b5cf6 50%, #f59e0b 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {username.toUpperCase()} PICKED 50 FLOWERS!
          </h1>
          <h2
            className="font-bold drop-shadow-lg"
            style={{
              fontSize: "3.5rem",
              background: "linear-gradient(135deg, #059669 0%, #8b5cf6 50%, #f59e0b 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            NATURE'S GUARDIAN - PROTECTOR OF THE GARDEN!
          </h2>
        </div>
      </div>
    </div>
  )
}
