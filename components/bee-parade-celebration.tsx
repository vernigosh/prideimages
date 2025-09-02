"use client"

import { useEffect, useState } from "react"

interface BeeParadeCelebrationProps {
  isVisible: boolean
  onHide: () => void
}

export function BeeParadeCelebration({ isVisible, onHide }: BeeParadeCelebrationProps) {
  const [showCelebration, setShowCelebration] = useState(false)

  useEffect(() => {
    if (isVisible) {
      console.log("[v0] Bee parade celebration starting")
      setShowCelebration(true)

      // Hide after 35 seconds
      const hideTimer = setTimeout(() => {
        console.log("[v0] Bee parade celebration ending")
        setShowCelebration(false)

        // Wait for fade out animation
        setTimeout(() => {
          console.log("[v0] Bee parade celebration calling onHide")
          onHide()
        }, 1000)
      }, 35000)

      return () => {
        clearTimeout(hideTimer)
      }
    }
  }, [isVisible, onHide])

  if (!isVisible) return null

  return (
    <div
      className={`fixed inset-0 z-50 pointer-events-none transition-opacity duration-1000 ${
        showCelebration ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Background overlay */}
      <div className="absolute inset-0 bg-black/20" />

      {/* Celebration text */}
      <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
        <div className="text-6xl font-black text-white font-sans uppercase animate-pulse mb-4 text-balance drop-shadow-lg">
          GARDEN IN FULL BLOOM!
        </div>
        <div className="text-3xl font-bold text-yellow-400 font-sans uppercase animate-bounce text-balance drop-shadow-lg">
          BEE PARADE TIME!
        </div>
      </div>

      {/* Bee parade animation */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Top row - 5 bees flying left to right */}
        {[0, 1, 2, 3, 4].map((index) => (
          <div
            key={`top-${index}`}
            className="absolute top-1/4 animate-[fly-right_10s_linear_infinite]"
            style={{ animationDelay: `${index * 0.8}s` }}
          >
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/8%20Bit%20Pixel%20Art%20Sticker-cxHk2AuIbHg27LpdEOypYnE9ey4l2l.gif"
              alt="Pixel bee"
              className="w-12 h-12 pixelated"
              style={{ imageRendering: "pixelated" }}
            />
          </div>
        ))}

        {/* Middle row - 6 bees flying right to left */}
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <div
            key={`middle-${index}`}
            className="absolute top-1/2 right-0 animate-[fly-left_12s_linear_infinite]"
            style={{ animationDelay: `${2 + index * 0.7}s` }}
          >
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/8%20Bit%20Pixel%20Art%20Sticker-cxHk2AuIbHg27LpdEOypYnE9ey4l2l.gif"
              alt="Pixel bee"
              className="w-12 h-12 pixelated scale-x-[-1]"
              style={{ imageRendering: "pixelated" }}
            />
          </div>
        ))}

        {/* Bottom row - 4 bees flying left to right */}
        {[0, 1, 2, 3].map((index) => (
          <div
            key={`bottom-${index}`}
            className="absolute top-3/4 animate-[fly-right_14s_linear_infinite]"
            style={{ animationDelay: `${6 + index * 1}s` }}
          >
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/8%20Bit%20Pixel%20Art%20Sticker-cxHk2AuIbHg27LpdEOypYnE9ey4l2l.gif"
              alt="Pixel bee"
              className="w-12 h-12 pixelated"
              style={{ imageRendering: "pixelated" }}
            />
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes fly-right {
          0% { transform: translateX(-100px); }
          100% { transform: translateX(calc(100vw + 100px)); }
        }
        
        @keyframes fly-left {
          0% { transform: translateX(100px); }
          100% { transform: translateX(calc(-100vw - 100px)); }
        }
        
        .pixelated {
          image-rendering: pixelated;
          image-rendering: -moz-crisp-edges;
          image-rendering: crisp-edges;
        }
      `}</style>
    </div>
  )
}

export default BeeParadeCelebration
