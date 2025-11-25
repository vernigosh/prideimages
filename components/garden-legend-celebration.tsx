"use client"

import { useState, useEffect } from "react"

interface GardenLegendCelebrationProps {
  isVisible: boolean
  username: string
  onHide: () => void
}

export default function GardenLegendCelebration({ isVisible, username, onHide }: GardenLegendCelebrationProps) {
  const [showCelebration, setShowCelebration] = useState(false)

  useEffect(() => {
    if (isVisible) {
      console.log("[v0] Garden Legend celebration started for", username)
      setShowCelebration(true)

      const hideTimer = setTimeout(() => {
        console.log("[v0] Garden Legend celebration timeout reached, hiding")
        setShowCelebration(false)
        onHide()
      }, 45000) // 45 seconds for Garden Legend

      return () => {
        console.log("[v0] Garden Legend celebration cleanup")
        clearTimeout(hideTimer)
      }
    } else {
      setShowCelebration(false)
    }
  }, [isVisible, username])

  if (!showCelebration) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none transition-opacity duration-500 opacity-100">
      <div className="absolute inset-0" style={{ background: `linear-gradient(to right, #ffd70030, #ffb50030)` }} />

      {/* Main celebration content */}
      <div className="relative text-center">
        {/* Rainbow pixel art - larger for Garden Legend */}
        <div className="mb-8 flex justify-center">
          <img
            src="/images/pixelrainbow.gif"
            alt="Rainbow celebration"
            className="pixelated animate-pulse"
            style={{
              imageRendering: "pixelated",
              width: "300px",
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
