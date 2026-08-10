"use client"

import { useEffect, useRef, useState } from "react"

interface BeeParadeCelebrationProps {
  isVisible: boolean
  onHide: () => void
}

export function BeeParadeCelebration({ isVisible, onHide }: BeeParadeCelebrationProps) {
  const [showCelebration, setShowCelebration] = useState(false)

  // Held in a ref because the parent passes a fresh inline arrow on every render.
  // With onHide in the dependency array the effect re-ran constantly, restarting the
  // 35s timer, so the parade never ended and the bees looped forever.
  const onHideRef = useRef(onHide)
  useEffect(() => {
    onHideRef.current = onHide
  }, [onHide])

  useEffect(() => {
    if (isVisible) {
      setShowCelebration(true)

      // Both timers are tracked so cleanup cancels the fade-out too; previously the
      // inner timeout could still fire onHide after unmount.
      let fadeTimer: ReturnType<typeof setTimeout> | undefined

      // Hide after 35 seconds
      const hideTimer = setTimeout(() => {
        setShowCelebration(false)

        // Wait for fade out animation
        fadeTimer = setTimeout(() => {
          onHideRef.current()
        }, 1000)
      }, 35000)

      return () => {
        clearTimeout(hideTimer)
        if (fadeTimer) clearTimeout(fadeTimer)
      }
    }
  }, [isVisible])

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
      <div className="absolute top-[15%] left-1/2 transform -translate-x-1/2 text-center">
        <div className="text-4xl font-black text-white font-sans uppercase animate-pulse mb-2 text-balance drop-shadow-lg">
          GARDEN IN FULL BLOOM!
        </div>
        <div className="text-2xl font-bold text-yellow-400 font-sans uppercase animate-bounce text-balance drop-shadow-lg">
          THE BEES THANK THE COMMUNITY WITH A PARADE
        </div>
      </div>

      {/* Bee parade animation */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Top row - 5 bees flying left to right */}
        {[0, 1, 2, 3, 4].map((index) => (
          <div
            key={`top-${index}`}
            className="absolute top-1/4 animate-[fly-right_10s_linear_infinite]"
            // backwards fill applies the 0% keyframe during the delay. Without it a
            // delayed bee sits at its untransformed position, parked on screen and
            // motionless until its delay elapses.
            style={{ animationDelay: `${index * 0.8}s`, animationFillMode: "backwards" }}
          >
            <img
              src="/images/8-20bit-20pixel-20art-20sticker.gif"
              alt="Pixel bee"
              className="w-32 h-32 pixelated"
              style={{ imageRendering: "pixelated" }}
            />
          </div>
        ))}

        {/* Middle row - 6 bees flying right to left */}
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <div
            key={`middle-${index}`}
            className="absolute top-1/2 right-0 animate-[fly-left_12s_linear_infinite]"
            style={{ animationDelay: `${2 + index * 0.7}s`, animationFillMode: "backwards" }}
          >
            <img
              src="/images/8-20bit-20pixel-20art-20sticker.gif"
              alt="Pixel bee"
              className="w-32 h-32 pixelated scale-x-[-1]"
              style={{ imageRendering: "pixelated" }}
            />
          </div>
        ))}

        {/* Bottom row - 4 bees flying left to right */}
        {[0, 1, 2, 3].map((index) => (
          <div
            key={`bottom-${index}`}
            className="absolute top-3/4 animate-[fly-right_14s_linear_infinite]"
            style={{ animationDelay: `${6 + index * 1}s`, animationFillMode: "backwards" }}
          >
            <img
              src="/images/8-20bit-20pixel-20art-20sticker.gif"
              alt="Pixel bee"
              className="w-32 h-32 pixelated"
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
