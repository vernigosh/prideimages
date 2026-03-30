"use client"

import { useEffect, useState, useRef } from "react"

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
  const [colorIndex, setColorIndex] = useState(0)
  
  const intervalRef = useRef<NodeJS.Timeout>()
  const autoHideRef = useRef<NodeJS.Timeout>()
  const logoRef = useRef<HTMLDivElement>(null)
  const positionRef = useRef({ x: 100, y: 100 })
  const velocityRef = useRef({ x: 3, y: 2.25 })

  // Auto-hide after 2 minutes if no duration specified
  useEffect(() => {
    if (!isVisible) return

    // If no duration specified, auto-hide after 2 minutes
    if (!duration) {
      autoHideRef.current = setTimeout(() => {
        onHide()
      }, 2 * 60 * 1000) // 2 minutes
    }

    return () => {
      if (autoHideRef.current) {
        clearTimeout(autoHideRef.current)
      }
    }
  }, [isVisible, duration, onHide])

  // Timer countdown (only if duration is specified)
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

  // Bouncing animation - using setInterval for slower, smoother movement
  useEffect(() => {
    if (!isVisible) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      return
    }

    // Initialize random position (estimate initial size, will adjust on first frame)
    const estimatedWidth = 200
    const estimatedHeight = 100
    positionRef.current = {
      x: Math.random() * (window.innerWidth - estimatedWidth),
      y: Math.random() * (window.innerHeight - estimatedHeight),
    }

    // Initialize random velocity (faster like the DVD website)
    velocityRef.current = {
      x: (Math.random() > 0.5 ? 1 : -1) * 3,
      y: (Math.random() > 0.5 ? 1 : -1) * 2.25,
    }

    // Update at ~30fps (33ms) for smooth but not frantic movement
    intervalRef.current = setInterval(() => {
      if (!logoRef.current) return
      
      const containerWidth = window.innerWidth
      const containerHeight = window.innerHeight
      const rect = logoRef.current.getBoundingClientRect()
      const actualWidth = rect.width
      const actualHeight = rect.height
      const pos = positionRef.current
      const vel = velocityRef.current

      let newX = pos.x + vel.x
      let newY = pos.y + vel.y
      let bounced = false

      // Check horizontal bounds
      if (newX <= 0) {
        newX = 0
        vel.x = Math.abs(vel.x)
        bounced = true
      } else if (newX + actualWidth >= containerWidth) {
        newX = containerWidth - actualWidth
        vel.x = -Math.abs(vel.x)
        bounced = true
      }

      // Check vertical bounds
      if (newY <= 0) {
        newY = 0
        vel.y = Math.abs(vel.y)
        bounced = true
      } else if (newY + actualHeight >= containerHeight) {
        newY = containerHeight - actualHeight
        vel.y = -Math.abs(vel.y)
        bounced = true
      }

      positionRef.current = { x: newX, y: newY }

      // Directly update the DOM element position (no React re-render)
      logoRef.current.style.transform = `translate(${newX}px, ${newY}px)`

      // Change color on bounce (this triggers a re-render, but only on bounces)
      if (bounced) {
        setColorIndex((prev) => (prev + 1) % COLORS.length)
      }
    }, 33)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isVisible])

  if (!isVisible) return null

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const currentColor = COLORS[colorIndex]

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden">
      {/* Bouncing BRB logo */}
      <div
        ref={logoRef}
        className="absolute font-bold font-sans"
        style={{
          left: 0,
          top: 0,
          transform: `translate(${positionRef.current.x}px, ${positionRef.current.y}px)`,
        }}
      >
        {/* BRB Text */}
        <div
          className="text-7xl font-bold"
          style={{ color: currentColor }}
        >
          BRB
        </div>

        {/* Timer if duration is set */}
        {duration && (
          <div
            className="text-2xl font-bold mt-1 text-center"
            style={{ color: currentColor }}
          >
            {formatTime(timeLeft)}
          </div>
        )}
      </div>
    </div>
  )
}
