"use client"

import { useState, useEffect, useRef } from "react"

interface DarkTimerProps {
  isVisible: boolean
  onConnectionChange: (connected: boolean) => void
  onHide: () => void
}

const DARK_DURATION = 20 * 60

export function DarkTimer({ isVisible, onConnectionChange, onHide }: DarkTimerProps) {
  const [timeLeft, setTimeLeft] = useState(DARK_DURATION)
  const [isComplete, setIsComplete] = useState(false)
  const rafRef = useRef<number | null>(null)
  const lastTickRef = useRef(0)
  const isVisibleRef = useRef(isVisible)
  const timeLeftRef = useRef(DARK_DURATION)
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  isVisibleRef.current = isVisible

  useEffect(() => {
    if (!isVisible) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current)
        hideTimeoutRef.current = null
      }
      lastTickRef.current = 0
      timeLeftRef.current = DARK_DURATION
      setTimeLeft(DARK_DURATION)
      setIsComplete(false)
      onConnectionChange(false)
      return
    }

    // Becoming visible - start fresh
    timeLeftRef.current = DARK_DURATION
    setTimeLeft(DARK_DURATION)
    setIsComplete(false)
    onConnectionChange(true)
    lastTickRef.current = Date.now()

    const tick = () => {
      if (!isVisibleRef.current) return

      const now = Date.now()
      if (now - lastTickRef.current >= 1000) {
        lastTickRef.current = now
        timeLeftRef.current = Math.max(0, timeLeftRef.current - 1)
        setTimeLeft(timeLeftRef.current)

        if (timeLeftRef.current <= 0) {
          setIsComplete(true)
          // Auto-hide after 1 minute
          hideTimeoutRef.current = setTimeout(() => {
            onHide()
          }, 60000)
          return // Stop the RAF loop
        }
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)

    const handleVisibility = () => {
      if (document.hidden) {
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current)
          rafRef.current = null
        }
      } else if (isVisibleRef.current && timeLeftRef.current > 0) {
        lastTickRef.current = Date.now()
        rafRef.current = requestAnimationFrame(tick)
      }
    }

    document.addEventListener("visibilitychange", handleVisibility)

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current)
        hideTimeoutRef.current = null
      }
      document.removeEventListener("visibilitychange", handleVisibility)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible])

  if (!isVisible) return null

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  if (isComplete) {
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
            ACTIVE
          </div>
        </div>

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
