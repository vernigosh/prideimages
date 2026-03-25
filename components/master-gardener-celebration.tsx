"use client"

import { useEffect, useState } from "react"
import Image from "next/image"

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
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center pointer-events-none transition-opacity duration-500 ${
        showCelebration ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="relative text-center -mt-72">
        <div className="relative mb-4">
          <Image
            src="/images/pixelrainbow.gif"
            alt="Rainbow celebration"
            width={250}
            height={250}
            className="mx-auto drop-shadow-2xl"
          />
        </div>

        {/* Floating flowers - positioned at edges */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
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

        <div className="space-y-2 px-8">
          <h1
            className="font-bold drop-shadow-lg"
            style={{
              fontSize: "2.75rem",
              background: "linear-gradient(135deg, #10b981 0%, #3b82f6 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {username.toUpperCase()} PICKED 30 FLOWERS!
          </h1>
          <h2
            className="font-bold drop-shadow-lg"
            style={{
              fontSize: "2.25rem",
              background: "linear-gradient(135deg, #10b981 0%, #3b82f6 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            GARDEN CHAMPION!
          </h2>
        </div>
      </div>
    </div>
  )
}
