"use client"

import { useEffect, useState, useRef, useCallback } from "react"

interface BrbOverlayProps {
  isVisible: boolean
  onHide: () => void
  duration?: number // Duration in minutes, undefined means no timer
}

// Rainbow colors to cycle through on bounce
const COLORS = [
  "#ff0000", // Red
  "#ff8000", // Orange
  "#ffff00", // Yellow
  "#00ff00", // Green
  "#00ffff", // Cyan
  "#0080ff", // Blue
  "#8000ff", // Purple
  "#ff00ff", // Magenta
  "#ff0080", // Pink
]

export function BrbOverlay({ isVisible, onHide, duration }: BrbOverlayProps) {
  const [timeLeft, setTimeLeft] = useState(duration ? duration * 60 : 0)
  const [position, setPosition] = useState({ x: 100, y: 100 })
  const [velocity, setVelocity] = useState({ x: 2, y: 1.5 })
  const [colorIndex, setColorIndex] = useState(0)
  const animationRef = useRef<number>()
  const containerRef = useRef<HTMLDivElement>(null)

  // Logo dimensions
  const logoWidth = 300
  const logoHeight = 150

  // Timer countdown
  useEffect(() => {
    if (!isVisible || !duration) return

    setTimeLeft(duration * 60)

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          onHide()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isVisible, duration, onHide])

  // Bouncing animation
  const animate = useCallback(() => {
    if (!containerRef.current) return

    const containerWidth = window.innerWidth
    const containerHeight = window.innerHeight

    setPosition((prev) => {
      let newX = prev.x + velocity.x
      let newY = prev.y + velocity.y
      let bounced = false

      // Check horizontal bounds
      if (newX <= 0) {
        newX = 0
        setVelocity((v) => ({ ...v, x: Math.abs(v.x) }))
        bounced = true
      } else if (newX + logoWidth >= containerWidth) {
        newX = containerWidth - logoWidth
        setVelocity((v) => ({ ...v, x: -Math.abs(v.x) }))
        bounced = true
      }

      // Check vertical bounds
      if (newY <= 0) {
        newY = 0
        setVelocity((v) => ({ ...v, y: Math.abs(v.y) }))
        bounced = true
      } else if (newY + logoHeight >= containerHeight) {
        newY = containerHeight - logoHeight
        setVelocity((v) => ({ ...v, y: -Math.abs(v.y) }))
        bounced = true
      }

      // Change color on bounce
      if (bounced) {
        setColorIndex((prev) => (prev + 1) % COLORS.length)
      }

      return { x: newX, y: newY }
    })

    animationRef.current = requestAnimationFrame(animate)
  }, [velocity])

  useEffect(() => {
    if (!isVisible) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      return
    }

    // Initialize random position
    setPosition({
      x: Math.random() * (window.innerWidth - logoWidth),
      y: Math.random() * (window.innerHeight - logoHeight),
    })

    // Initialize random velocity (direction)
    setVelocity({
      x: (Math.random() > 0.5 ? 1 : -1) * (1.5 + Math.random()),
      y: (Math.random() > 0.5 ? 1 : -1) * (1.5 + Math.random()),
    })

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isVisible, animate])

  if (!isVisible) return null

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const currentColor = COLORS[colorIndex]

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden"
      style={{
        background: "rgba(0, 0, 0, 0.3)"
      }}
    >
      {/* Bouncing BRB logo */}
      <div
        className="absolute flex flex-col items-center justify-center font-bold font-sans"
        style={{
          left: position.x,
          top: position.y,
          width: logoWidth,
          height: logoHeight,
          transition: "color 0.3s ease",
        }}
      >
        {/* BRB Text */}
        <div
          className="text-8xl font-bold drop-shadow-2xl"
          style={{
            color: currentColor,
            textShadow: `0 0 30px ${currentColor}, 0 0 60px ${currentColor}`,
          }}
        >
          BRB
        </div>

        {/* Timer if duration is set */}
        {duration && (
          <div
            className="text-3xl font-bold mt-2"
            style={{
              color: currentColor,
              textShadow: `0 0 20px ${currentColor}`,
            }}
          >
            {formatTime(timeLeft)}
          </div>
        )}
      </div>
    </div>
  )
}
