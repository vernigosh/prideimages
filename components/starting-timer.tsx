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
      setTimeLeft(calculateTimeToTopOfHour())
    }, 1000)

    return () => clearInterval(interval)
  }, [isVisible])

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
      <div className="relative flex flex-col items-center">
        {/* Rainbow ring */}
        <div
          className="relative w-[400px] h-[400px] rounded-full p-2"
          style={{
            background: `conic-gradient(from ${rotation}deg, 
              #ff0000, 
              #ff8000, 
              #ffff00, 
              #00ff00, 
              #00ffff, 
              #0080ff, 
              #8000ff, 
              #ff0080, 
              #ff0000
            )`,
          }}
        >
          {/* Inner black circle */}
          <div className="w-full h-full rounded-full bg-black/90 flex flex-col items-center justify-center">
            {/* Countdown */}
            <div className="text-8xl font-bold text-white font-mono tracking-wider">
              {formatTime(timeLeft.minutes, timeLeft.seconds)}
            </div>
            
            {/* Text */}
            <div className="mt-4 text-2xl text-white text-center px-8">
              The stream is starting soon
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
