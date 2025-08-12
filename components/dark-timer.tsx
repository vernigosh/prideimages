"use client"

import { useState, useEffect, useRef } from "react"

interface DarkTimerProps {
  isVisible: boolean
  onConnectionChange: (connected: boolean) => void
  onHide: () => void
}

export function DarkTimer({ isVisible, onConnectionChange, onHide }: DarkTimerProps) {
  const [timeLeft, setTimeLeft] = useState(20 * 60) // 20 minutes for dark mode
  const [isRunning, setIsRunning] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const handleStartDarkTimer = (event: CustomEvent) => {
      console.log("Dark Timer: Received start command from", event.detail.username)
      startDarkTimer()
    }

    const handleHideDarkTimer = (event: CustomEvent) => {
      console.log("Dark Timer: Received hide command from", event.detail.username)
      hideDarkTimer()
    }

    window.addEventListener("startDarkTimer", handleStartDarkTimer as EventListener)
    window.addEventListener("hideDarkTimer", handleHideDarkTimer as EventListener)

    // Set connected status based on visibility
    onConnectionChange(isVisible)

    return () => {
      window.removeEventListener("startDarkTimer", handleStartDarkTimer as EventListener)
      window.removeEventListener("hideDarkTimer", handleHideDarkTimer as EventListener)
    }
  }, [isVisible, onConnectionChange])

  useEffect(() => {
    console.log("Dark Timer: isRunning changed to:", isRunning)
    if (isRunning) {
      console.log("Dark Timer: Starting interval")
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          console.log("Dark Timer: Countdown tick, time left:", prev - 1)
          if (prev <= 1) {
            setIsRunning(false)
            if (intervalRef.current) {
              clearInterval(intervalRef.current)
            }
            // Auto-hide after 1 minute
            setTimeout(() => {
              onHide()
            }, 60000)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      console.log("Dark Timer: Clearing interval")
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, onHide])

  // Auto-start timer when it becomes visible from a command
  useEffect(() => {
    if (isVisible && timeLeft === 20 * 60 && !isRunning) {
      console.log("Dark Timer: Auto-starting because timer just became visible")
      setTimeout(() => {
        setIsRunning(true)
      }, 200)
    }
  }, [isVisible, timeLeft, isRunning])

  const startDarkTimer = () => {
    console.log("Dark Timer: startDarkTimer called - resetting and starting")
    setTimeLeft(20 * 60)
    setTimeout(() => {
      setIsRunning(true)
      console.log("Dark Timer: isRunning set to true via setTimeout")
    }, 100)
  }

  const hideDarkTimer = () => {
    setIsRunning(false)
    setTimeLeft(20 * 60)
    onHide()
  }

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  if (!isVisible) return null

  if (timeLeft === 0) {
    return (
      <div className="absolute right-8 top-1/2 transform -translate-y-1/2 w-1/3 max-w-md">
        <div className="flex flex-col items-center justify-center font-bold">
          <div className="text-center">
            <div
              className="text-4xl mb-2 drop-shadow-lg font-bold uppercase animate-pulse"
              style={{
                fontFamily: "Orbitron, monospace",
                color: "#ffffff",
                textShadow: "0 0 20px #ff0000, 0 0 40px #ff0000",
                letterSpacing: "0.1em",
              }}
            >
              DARKNESS COMPLETE
            </div>
            <div
              className="text-2xl drop-shadow-lg font-bold uppercase"
              style={{
                fontFamily: "Orbitron, monospace",
                color: "#ff0000",
                textShadow: "0 0 10px #ff0000",
                letterSpacing: "0.05em",
              }}
            >
              RETURNING TO THE LIGHT
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="absolute right-8 top-1/2 transform -translate-y-1/2 w-1/3 max-w-md">
      <div className="flex flex-col items-center justify-center gap-6 font-bold">
        {/* Main Countdown - Large and Pulsing */}
        <div className="text-center">
          <div
            className="text-4xl drop-shadow-lg font-bold animate-pulse"
            style={{
              fontFamily: "Orbitron, monospace",
              color: "#ffffff",
              textShadow: "0 0 30px #ff0000, 0 0 60px #ff0000, 0 0 90px #ff0000",
              letterSpacing: "0.1em",
            }}
          >
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </div>
          <div
            className="text-sm mt-2 drop-shadow-md font-semibold uppercase"
            style={{
              fontFamily: "Orbitron, monospace",
              color: "#cccccc",
              letterSpacing: "0.2em",
            }}
          >
            {isRunning ? "ACTIVE" : "PAUSED"}
          </div>
        </div>

        {/* Dark Vernigosh Text */}
        <div className="text-center">
          <div
            className="text-3xl mb-2 drop-shadow-lg font-bold uppercase animate-pulse"
            style={{
              fontFamily: "Orbitron, monospace",
              color: "#ffffff",
              textShadow: "0 0 20px #ff0000, 0 0 40px #ff0000",
              letterSpacing: "0.1em",
            }}
          >
            DARK VERNIGOSH ACTIVATED
          </div>
          <div
            className="text-lg drop-shadow-lg font-semibold uppercase leading-tight"
            style={{
              fontFamily: "Orbitron, monospace",
              color: "#ff0000",
              textShadow: "0 0 15px #ff0000",
              letterSpacing: "0.05em",
            }}
          >
            EXPLORING THE SHADOWS
            <br />
            OF THE MUSIC LIBRARY
          </div>
        </div>
      </div>
    </div>
  )
}
