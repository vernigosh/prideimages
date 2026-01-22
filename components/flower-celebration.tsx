"use client"

import { useState, useEffect } from "react"

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
    <div
      className={`fixed inset-0 flex items-center justify-center z-50 pointer-events-none transition-opacity duration-1000 ${
        showCelebration ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="absolute inset-0" style={{ background: `linear-gradient(to right, #ffb8ad30, #84cc1630)` }} />

      {/* Main celebration content */}
      <div className="relative text-center -mt-48">
        {/* Rainbow pixel art */}
        <div className="mb-8 flex justify-center">
          <img
            src="/images/pixelrainbow.gif"
            alt="Rainbow celebration"
            className="pixelated animate-pulse"
            style={{
              imageRendering: "pixelated",
              width: "200px",
              height: "auto",
            }}
          />
        </div>

        <div className="space-y-4">
          <h1 className="text-6xl font-black text-white font-sans uppercase animate-bounce drop-shadow-lg">
            GOLDEN GREENTHUMB!
          </h1>
          <h2 className="text-4xl font-bold font-sans uppercase drop-shadow-lg" style={{ color: "#ffd700" }}>
            {username.toUpperCase()} PICKED 10 FLOWERS!
          </h2>
          <p className="text-2xl font-bold text-white font-sans uppercase animate-pulse drop-shadow-lg">
            GOLDEN GREENTHUMB UNLOCKED!
          </p>
        </div>

        {/* Floating flowers animation */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                left: `${10 + i * 7}%`,
                top: `${20 + (i % 3) * 20}%`,
                animationDelay: `${i * 0.2}s`,
                animationDuration: "2s",
              }}
            >
              <span className="text-4xl">{["🌸", "🌺", "🌻", "🌷", "🌹", "🌼"][i % 6]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default FlowerCelebration
