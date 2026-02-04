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
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4">
        <img src="/images/pixel-knight.gif" alt="Knight" className="w-16 h-16" />
        <span className="text-white text-3xl font-sans font-black drop-shadow-lg uppercase">
          {username} has been knighted as Knight of the Gardenverse!
        </span>
        <img src="/images/pixel-knight.gif" alt="Knight" className="w-16 h-16" style={{ transform: "scaleX(-1)" }} />
      </div>
    </div>
  )
}

export default EasterEggCelebration
