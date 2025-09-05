"use client"

import { useState, useEffect } from "react"

interface GardenLegendCelebrationProps {
  isVisible: boolean
  username: string
  onHide: () => void
}

export default function GardenLegendCelebration({ isVisible, username, onHide }: GardenLegendCelebrationProps) {
  const [opacity, setOpacity] = useState(0)

  useEffect(() => {
    if (isVisible) {
      console.log("[v0] Garden Legend celebration started for", username)

      // Fade in
      const fadeInTimer = setTimeout(() => setOpacity(1), 100)

      let fadeOutTimer: NodeJS.Timeout | null = null

      const hideTimer = setTimeout(() => {
        console.log("[v0] Garden Legend celebration timeout reached, starting fade out")
        setOpacity(0)

        // Wait for fade out animation then call onHide
        fadeOutTimer = setTimeout(() => {
          console.log("[v0] Garden Legend celebration calling onHide")
          if (onHide) {
            onHide()
          }
        }, 500) // Wait for fade out
      }, 45000) // 45 seconds for Garden Legend

      return () => {
        console.log("[v0] Garden Legend celebration cleanup")
        clearTimeout(fadeInTimer)
        clearTimeout(hideTimer)
        if (fadeOutTimer) {
          clearTimeout(fadeOutTimer)
        }
      }
    } else {
      setOpacity(0)
    }
  }, [isVisible, username, onHide]) // Added username and onHide to dependencies

  if (!isVisible) return null

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none transition-opacity duration-500"
      style={{ opacity }}
    >
      <div className="absolute inset-0" style={{ background: `linear-gradient(to right, #ffd70030, #ffb50030)` }} />

      {/* Main celebration content */}
      <div className="relative text-center">
        {/* Rainbow pixel art - larger for Garden Legend */}
        <div className="mb-8 flex justify-center">
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/pixelrainbow-4ucgyXfdkugOukHCEUKaGrrTTxfv8O.gif"
            alt="Rainbow celebration"
            className="pixelated animate-pulse"
            style={{
              imageRendering: "pixelated",
              width: "300px", // Larger than Garden Champion (200px)
              height: "auto",
            }}
          />
        </div>

        <div className="space-y-4">
          <h1 className="text-7xl font-black text-white font-sans uppercase animate-bounce drop-shadow-lg">
            👑 GARDEN LEGEND! 👑
          </h1>
          <h2 className="text-5xl font-bold font-sans uppercase drop-shadow-lg" style={{ color: "#ffd700" }}>
            {username.toUpperCase()} PICKED 20 FLOWERS!
          </h2>
          <p className="text-3xl font-bold text-white font-sans uppercase animate-pulse drop-shadow-lg">
            LEGENDARY STATUS ACHIEVED!
          </p>
        </div>

        <div className="absolute inset-0 pointer-events-none">
          {[...Array(16)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                left: `${5 + i * 6}%`,
                top: `${15 + (i % 4) * 18}%`,
                animationDelay: `${i * 0.15}s`,
                animationDuration: "2s",
              }}
            >
              <span className="text-4xl">{i % 8 === 7 ? "⭐" : ["🌸", "🌺", "🌻", "🌷", "🌹", "🌼", "💐"][i % 7]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export { GardenLegendCelebration }
