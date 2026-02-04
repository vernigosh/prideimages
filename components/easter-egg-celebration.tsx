"use client"

import { useEffect, useState } from "react"

interface EasterEggCelebrationProps {
  isVisible: boolean
  username: string
  onHide: () => void
}

export function EasterEggCelebration({ isVisible, username, onHide }: EasterEggCelebrationProps) {
  const [showCelebration, setShowCelebration] = useState(false)
  const [movedToSide, setMovedToSide] = useState(false)

  useEffect(() => {
    if (isVisible) {
      console.log("[v0] Easter egg triggered for user:", username)
      setShowCelebration(true)
      setMovedToSide(false)
      
      // After 30 seconds, move the banner to the left side
      const moveTimer = setTimeout(() => {
        console.log("[v0] Moving celebration to side")
        setMovedToSide(true)
      }, 30000)
      
      // Song is about 3:50, set timeout for 4 minutes to be safe
      const timer = setTimeout(() => {
        console.log("[v0] Easter egg timer complete, hiding")
        setShowCelebration(false)
        setMovedToSide(false)
        onHide()
      }, 240000)
      return () => {
        clearTimeout(timer)
        clearTimeout(moveTimer)
      }
    } else {
      setShowCelebration(false)
      setMovedToSide(false)
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
      {/* Celebration banner - starts top center, moves to left middle after 30s */}
      <div 
        className="absolute flex items-center transition-all duration-1000 ease-in-out"
        style={{
          top: movedToSide ? "50%" : "10%",
          left: movedToSide ? "32px" : "50%",
          transform: movedToSide ? "translateY(-50%)" : "translateX(-50%)",
        }}
      >
        {/* Left Knight */}
        <img 
          src="/images/pixel-knight.gif" 
          alt="Knight" 
          className={`transition-all duration-1000 ${movedToSide ? "w-24 h-24" : "w-40 h-40"}`}
        />
        
        {/* Text content */}
        <div 
          className={`flex flex-col transition-all duration-1000 ${movedToSide ? "mx-4" : "mx-8"}`}
          style={{ textAlign: movedToSide ? "left" : "center" }}
        >
          <div
            className={`font-black font-sans uppercase tracking-wider transition-all duration-1000 ${movedToSide ? "text-3xl mb-1" : "text-6xl mb-4"}`}
            style={{
              background: "linear-gradient(135deg, #ffd700 0%, #ffec80 50%, #ffd700 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.5))",
            }}
          >
            {username}
          </div>
          <div
            className={`font-black font-sans uppercase transition-all duration-1000 ${movedToSide ? "text-xl" : "text-5xl tracking-wide"}`}
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
            className={`font-black font-sans uppercase transition-all duration-1000 ${movedToSide ? "text-2xl mt-1" : "text-7xl tracking-widest mt-4"}`}
            style={{
              background: "linear-gradient(135deg, #ffd700 0%, #ffec80 50%, #ffd700 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: "drop-shadow(0 6px 12px rgba(0,0,0,0.6))",
            }}
          >
            Knight of the Gardenverse
          </div>
        </div>

        {/* Right Knight (mirrored) */}
        <img 
          src="/images/pixel-knight.gif" 
          alt="Knight" 
          className={`transition-all duration-1000 ${movedToSide ? "w-24 h-24" : "w-40 h-40"}`}
          style={{ transform: "scaleX(-1)" }}
        />
      </div>
    </div>
  )
}

export default EasterEggCelebration
