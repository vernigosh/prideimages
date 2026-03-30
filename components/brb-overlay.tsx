"use client"

import { useEffect, useState } from "react"

interface BrbOverlayProps {
  isVisible: boolean
  onHide: () => void
  duration?: number // Duration in minutes, undefined means no timer
}

// Ring progress calculation
function getRingProps(progress: number) {
  const radius = 85
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - progress)
  return { radius, circumference, strokeDashoffset }
}

export function BrbOverlay({ isVisible, onHide, duration }: BrbOverlayProps) {
  const [timeLeft, setTimeLeft] = useState(duration ? duration * 60 : 0)
  const [initialTime] = useState(duration ? duration * 60 : 0)
  const [pulse, setPulse] = useState(0)

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

  // Pulse animation for no-timer mode
  useEffect(() => {
    if (!isVisible) return

    const pulseInterval = setInterval(() => {
      setPulse((prev) => (prev + 1) % 360)
    }, 30)

    return () => clearInterval(pulseInterval)
  }, [isVisible])

  if (!isVisible) return null

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const progress = initialTime > 0 ? 1 - (timeLeft / initialTime) : 0
  const { radius, circumference, strokeDashoffset } = getRingProps(progress)

  // Animated scale for the BRB text
  const scale = 1 + Math.sin(pulse * 0.05) * 0.05

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[9999] pointer-events-none">
      {/* Gradient background */}
      <div 
        className="absolute inset-0"
        style={{
          background: "radial-gradient(circle at center, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.5) 30%, transparent 60%)"
        }}
      />
      
      <div className="relative flex flex-col items-center justify-center gap-4 font-bold">
        {duration ? (
          // Timer mode - show ring with countdown
          <div className="relative w-64 h-64">
            <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 200 200">
              <defs>
                <linearGradient id="brbGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ff00ff" />
                  <stop offset="50%" stopColor="#ff66ff" />
                  <stop offset="100%" stopColor="#ff00ff" />
                </linearGradient>
              </defs>
              {/* Background ring */}
              <circle
                cx="100"
                cy="100"
                r={radius}
                fill="none"
                stroke="rgba(255, 255, 255, 0.2)"
                strokeWidth="12"
              />
              {/* Progress ring */}
              <circle
                cx="100"
                cy="100"
                r={radius}
                fill="none"
                stroke="url(#brbGradient)"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                style={{ transition: "stroke-dashoffset 0.5s ease-out" }}
              />
            </svg>

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-5xl text-white drop-shadow-lg font-bold font-sans">
                {formatTime(timeLeft)}
              </div>
            </div>
          </div>
        ) : (
          // No timer mode - animated BRB text with pulsing ring
          <div className="relative w-64 h-64">
            <svg className="absolute w-full h-full" viewBox="0 0 200 200">
              <defs>
                <linearGradient id="brbPulseGradient" gradientTransform={`rotate(${pulse})`}>
                  <stop offset="0%" stopColor="#ff00ff" />
                  <stop offset="25%" stopColor="#ff66ff" />
                  <stop offset="50%" stopColor="#ffffff" />
                  <stop offset="75%" stopColor="#ff66ff" />
                  <stop offset="100%" stopColor="#ff00ff" />
                </linearGradient>
              </defs>
              {/* Animated ring */}
              <circle
                cx="100"
                cy="100"
                r={radius}
                fill="none"
                stroke="url(#brbPulseGradient)"
                strokeWidth="12"
                style={{
                  filter: `drop-shadow(0 0 ${10 + Math.sin(pulse * 0.1) * 5}px rgba(255, 0, 255, 0.5))`
                }}
              />
            </svg>

            <div 
              className="absolute inset-0 flex items-center justify-center"
              style={{ transform: `scale(${scale})` }}
            >
              <div className="text-6xl text-white drop-shadow-lg font-bold font-sans">
                BRB
              </div>
            </div>
          </div>
        )}

        {/* Text below */}
        <div 
          className="text-4xl text-white text-center drop-shadow-lg font-bold font-sans"
          style={!duration ? { 
            opacity: 0.8 + Math.sin(pulse * 0.05) * 0.2 
          } : undefined}
        >
          {duration ? "BRB" : "BE RIGHT BACK"}
        </div>
      </div>
    </div>
  )
}
