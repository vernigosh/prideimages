"use client"

import { useEffect, useState } from "react"

interface StartingTimerProps {
  isVisible: boolean
  onHide: () => void
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

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[9999] pointer-events-none">
      <div className="flex flex-col items-center justify-center gap-4 font-bold">
        {/* Rainbow ring with timer */}
        <div className="relative w-64 h-64">
          {/* Rainbow ring using SVG */}
          <svg className="absolute w-full h-full" viewBox="0 0 200 200">
            <defs>
              <linearGradient id="rainbowGradient" gradientTransform={`rotate(${rotation})`}>
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
              r="85"
              fill="none"
              stroke="url(#rainbowGradient)"
              strokeWidth="12"
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
          The stream is starting soon
        </div>
      </div>
    </div>
  )
}
