"use client"

import { useEffect, useState } from "react"

interface GardenEliteCelebrationProps {
  username: string
  isVisible: boolean
  onHide: () => void
}

export function GardenEliteCelebration({ username, isVisible, onHide }: GardenEliteCelebrationProps) {
  const [showCelebration, setShowCelebration] = useState(false)

  useEffect(() => {
    if (isVisible) {
      setShowCelebration(true)

      const timer = setTimeout(() => {
        setShowCelebration(false)
        setTimeout(() => {
          onHide()
        }, 500)
      }, 43000) // 43 seconds display time

      return () => clearTimeout(timer)
    } else {
      setShowCelebration(false)
    }
  }, [isVisible])

  if (!isVisible) return null

  const flowers = Array.from({ length: 22 }, (_, i) => ({
    id: i,
    delay: Math.random() * 5,
    duration: 8 + Math.random() * 4,
    startX: Math.random() * 100,
  }))

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center z-50 pointer-events-none transition-opacity duration-500 ${
        showCelebration ? "opacity-100" : "opacity-0"
      }`}
      style={{
        background:
          "linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(59, 130, 246, 0.15) 50%, rgba(168, 85, 247, 0.15) 100%)",
      }}
    >
      {flowers.map((flower) => (
        <div
          key={flower.id}
          className="absolute text-4xl animate-float"
          style={{
            left: `${flower.startX}%`,
            top: "-10%",
            animationDelay: `${flower.delay}s`,
            animationDuration: `${flower.duration}s`,
          }}
        >
          {Math.random() > 0.7 ? "⭐" : Math.random() > 0.5 ? "🌸" : "🌺"}
        </div>
      ))}

      <div className="text-center px-4 relative z-10 -mt-48">
        <img
          src="/images/pixelrainbow.gif"
          alt="Rainbow"
          className="mx-auto mb-6"
          style={{ width: "375px", height: "auto" }}
        />

        <h1 className="text-7xl md:text-8xl font-black mb-6 text-white drop-shadow-lg font-sans">
          {username.toUpperCase()}
        </h1>

        <h2 className="text-6xl md:text-7xl font-black mb-4 text-white drop-shadow-lg font-sans">PICKED 40 FLOWERS!</h2>

        <h3 className="text-5xl md:text-6xl font-bold text-white drop-shadow-lg font-sans">
          GARDEN ELITE TITLE EARNED!
        </h3>
      </div>
    </div>
  )
}
