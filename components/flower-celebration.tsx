"use client"

import { useState, useEffect } from "react"

interface FlowerCelebrationProps {
  isVisible: boolean
  username: string
  onHide: () => void
}

export default function FlowerCelebration({ isVisible, username, onHide }: FlowerCelebrationProps) {
  const [opacity, setOpacity] = useState(0)

  useEffect(() => {
    if (isVisible) {
      // Fade in
      setTimeout(() => setOpacity(1), 100)

      const timer = setTimeout(() => {
        setOpacity(0)
        setTimeout(onHide, 500) // Wait for fade out
      }, 60000) // Changed from 20000 to 60000 (60 seconds)

      return () => clearTimeout(timer)
    } else {
      setOpacity(0)
    }
  }, [isVisible, onHide])

  if (!isVisible) return null

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none transition-opacity duration-500"
      style={{ opacity }}
    >
      <div className="absolute inset-0" style={{ background: `linear-gradient(to right, #ffb8ad30, #84cc1630)` }} />

      {/* Main celebration content */}
      <div className="relative text-center">
        {/* Rainbow pixel art */}
        <div className="mb-8 flex justify-center">
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/pixelrainbow-4ucgyXfdkugOukHCEUKaGrrTTxfv8O.gif"
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
            🌸 FLOWER MASTER! 🌸
          </h1>
          <h2 className="text-4xl font-bold font-sans uppercase drop-shadow-lg" style={{ color: "#ffb8ad" }}>
            {username.toUpperCase()} PICKED 10 FLOWERS!
          </h2>
          <p className="text-2xl font-bold text-white font-sans uppercase animate-pulse drop-shadow-lg">
            GARDEN CHAMPION ACHIEVEMENT UNLOCKED!
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

export { FlowerCelebration }
