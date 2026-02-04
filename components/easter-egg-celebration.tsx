"use client"

import { useEffect, useState } from "react"

interface EasterEggCelebrationProps {
  isVisible: boolean
  username: string
  onHide: () => void
}

export function EasterEggCelebration({ isVisible, username, onHide }: EasterEggCelebrationProps) {
  const [showCelebration, setShowCelebration] = useState(false)

  useEffect(() => {
    if (isVisible) {
      console.log("[v0] Easter egg triggered for user:", username)
      setShowCelebration(true)
      // Song is about 3:50, set timeout for 4 minutes to be safe
      const timer = setTimeout(() => {
        console.log("[v0] Easter egg timer complete, hiding")
        setShowCelebration(false)
        onHide()
      }, 240000)
      return () => clearTimeout(timer)
    } else {
      setShowCelebration(false)
    }
  }, [isVisible])

  if (!isVisible && !showCelebration) return null

  return (
    <div
      className={`fixed inset-0 z-[9999] transition-opacity duration-1000 ${
        showCelebration ? "opacity-75" : "opacity-0"
      }`}
    >
      <iframe
        className="absolute inset-0 w-full h-full"
        src="https://www.youtube.com/embed/lWqJTKdznaM?autoplay=1&controls=0&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3&start=0"
        title="Easter Egg"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
      {/* Big celebration banner in top third of screen */}
      <div className="absolute top-[10%] left-1/2 -translate-x-1/2 flex flex-col items-center gap-6">
        <div className="flex items-center gap-8">
          <img src="/images/pixel-knight.gif" alt="Knight" className="w-40 h-40" />
          <img src="/images/pixel-knight.gif" alt="Knight" className="w-40 h-40" style={{ transform: "scaleX(-1)" }} />
        </div>
        <div className="text-center">
          <div
            className="text-6xl font-black font-sans uppercase tracking-wider mb-4"
            style={{
              background: "linear-gradient(135deg, #ffd700 0%, #ffec80 50%, #ffd700 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              textShadow: "0 0 40px rgba(255, 215, 0, 0.8)",
              filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.5))",
            }}
          >
            {username}
          </div>
          <div
            className="text-5xl font-black font-sans uppercase tracking-wide"
            style={{
              background: "linear-gradient(135deg, #ffffff 0%, #f0f0f0 50%, #ffffff 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.5))",
            }}
          >
            Has Been Knighted As
          </div>
          <div
            className="text-7xl font-black font-sans uppercase tracking-widest mt-4"
            style={{
              background: "linear-gradient(135deg, #ffd700 0%, #ffec80 50%, #ffd700 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              textShadow: "0 0 60px rgba(255, 215, 0, 0.9)",
              filter: "drop-shadow(0 6px 12px rgba(0,0,0,0.6))",
            }}
          >
            Knight of the Gardenverse
          </div>
        </div>
      </div>
    </div>
  )
}

export default EasterEggCelebration
