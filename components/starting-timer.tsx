"use client"

import { useEffect, useState } from "react"

interface StartingTimerProps {
  isVisible: boolean
  onHide: () => void
}

// Ring progress calculation - counts down over 60 minutes (one hour)
function getRingProps(progress: number) {
  const radius = 85
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - progress) // Inverted so it depletes
  return { radius, circumference, strokeDashoffset }
}

export function StartingTimer({ isVisible, onHide }: StartingTimerProps) {
  const [timeLeft, setTimeLeft] = useState({ minutes: 0, seconds: 0 })
  const [rotation, setRotation] = useState(0)

  useEffect(() => {
    if (!isVisible) return

    const calculateTimeToTopOfHour = () => {
      const now = new Date()
      const minutes = 59 - now.getMinutes()
      const seconds = 59 - now.getSeconds()
      return { minutes, seconds }
    }

    setTimeLeft(calculateTimeToTopOfHour())

    const interval = setInterval(() => {
      const time = calculateTimeToTopOfHour()
      setTimeLeft(time)
      
      // Auto-hide at top of the hour (when both minutes and seconds are 59, we just hit the top)
      if (time.minutes === 59 && time.seconds === 59) {
        onHide()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [isVisible, onHide])

  // Rainbow rotation animation
  useEffect(() => {
    if (!isVisible) return

    const rotationInterval = setInterval(() => {
      setRotation((prev) => (prev + 1) % 360)
    }, 30)

    return () => clearInterval(rotationInterval)
  }, [isVisible])

  if (!isVisible) return null

  const formatTime = (mins: number, secs: number) => {
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // Calculate progress (0 = full hour left, 1 = top of hour)
  const totalSecondsLeft = timeLeft.minutes * 60 + timeLeft.seconds
  const progress = 1 - (totalSecondsLeft / 3600) // 3600 seconds in an hour
  const { radius, circumference, strokeDashoffset } = getRingProps(progress)

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[9999] pointer-events-none">
      {/* Gradient background for visibility on light backgrounds */}
      <div 
        className="absolute inset-0"
        style={{
          background: "radial-gradient(circle at center, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.4) 30%, transparent 60%)"
        }}
      />
      
      <div className="relative flex flex-col items-center justify-center gap-4 font-bold">
        {/* Rainbow ring with timer */}
        <div className="relative w-64 h-64">
          {/* Rainbow ring using SVG */}
          <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 200 200">
            <defs>
              <linearGradient id="rainbowGradientStart" gradientTransform={`rotate(${rotation})`}>
                <stop offset="0%" stopColor="#ff0000" />
                <stop offset="14%" stopColor="#ff8000" />
                <stop offset="28%" stopColor="#ffff00" />
                <stop offset="42%" stopColor="#00ff00" />
                <stop offset="57%" stopColor="#00ffff" />
                <stop offset="71%" stopColor="#0080ff" />
                <stop offset="85%" stopColor="#8000ff" />
                <stop offset="100%" stopColor="#ff0080" />
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
            {/* Progress ring with rainbow */}
            <circle
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke="url(#rainbowGradientStart)"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: "stroke-dashoffset 0.5s ease-out" }}
            />
          </svg>

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-5xl text-white drop-shadow-lg font-bold font-sans">
                {formatTime(timeLeft.minutes, timeLeft.seconds)}
              </div>
            </div>
          </div>
        </div>

        {/* Text outside the circle */}
        <div className="text-4xl text-white text-center drop-shadow-lg font-bold font-sans">
          STARTING SOON
        </div>
      </div>
    </div>
  )
}
