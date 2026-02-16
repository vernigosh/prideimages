"use client"

import { useState, useEffect, useRef, useCallback } from "react"

interface WorkTimerProps {
  isVisible: boolean
  onConnectionChange: (connected: boolean) => void
  onHide: () => void
}

const WORK_DURATION = 25 * 60 // 25 minutes in seconds
const SHORT_BREAK = 5 * 60 // 5 minutes in seconds

export function WorkTimer({ isVisible, onConnectionChange, onHide }: WorkTimerProps) {
  const [phase, setPhase] = useState<"work" | "break">("work")
  const [timeLeft, setTimeLeft] = useState(WORK_DURATION)
  const [cycleCount, setCycleCount] = useState(1)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isVisibleRef = useRef(isVisible)

  // Keep ref in sync so interval callback always has latest value
  useEffect(() => {
    isVisibleRef.current = isVisible
  }, [isVisible])

  // Calculate where we are in the current 30-min block based on the real clock
  const getClockState = useCallback(() => {
    const now = new Date()
    const minutesIntoBlock = now.getMinutes() % 30
    const totalSecondsIntoBlock = minutesIntoBlock * 60 + now.getSeconds()

    let currentPhase: "work" | "break"
    let remaining: number

    if (totalSecondsIntoBlock < WORK_DURATION) {
      currentPhase = "work"
      remaining = WORK_DURATION - totalSecondsIntoBlock
    } else {
      currentPhase = "break"
      const secondsIntoBreak = totalSecondsIntoBlock - WORK_DURATION
      remaining = Math.max(SHORT_BREAK - secondsIntoBreak, 0)
    }

    const totalMinutesSinceMidnight = now.getHours() * 60 + now.getMinutes()
    const cycle = Math.floor(totalMinutesSinceMidnight / 30) + 1

    return { currentPhase, remaining, cycle }
  }, [])

  // Clean up interval helper
  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  // Start the timer interval
  const startTimer = useCallback(() => {
    clearTimer()

    // Sync immediately
    const state = getClockState()
    setPhase(state.currentPhase)
    setTimeLeft(state.remaining)
    setCycleCount(state.cycle)

    // Tick every second, re-syncing to clock each time
    intervalRef.current = setInterval(() => {
      // Safety: if we're no longer visible, kill the interval
      if (!isVisibleRef.current) {
        clearTimer()
        return
      }

      const s = getClockState()
      setPhase(s.currentPhase)
      setTimeLeft(s.remaining)
      setCycleCount(s.cycle)
    }, 1000)
  }, [getClockState, clearTimer])

  // Listen for chat commands
  useEffect(() => {
    const handleStart = () => {
      if (isVisibleRef.current) {
        startTimer()
      }
    }

    const handleStop = () => {
      clearTimer()
    }

    const handleReset = () => {
      if (isVisibleRef.current) {
        startTimer()
      }
    }

    const handleHide = () => {
      clearTimer()
      onHide()
    }

    window.addEventListener("startWorkTimer", handleStart)
    window.addEventListener("stopWorkTimer", handleStop)
    window.addEventListener("resetWorkTimer", handleReset)
    window.addEventListener("hideWorkTimer", handleHide)

    return () => {
      window.removeEventListener("startWorkTimer", handleStart)
      window.removeEventListener("stopWorkTimer", handleStop)
      window.removeEventListener("resetWorkTimer", handleReset)
      window.removeEventListener("hideWorkTimer", handleHide)
    }
  }, [startTimer, clearTimer, onHide])

  // When visibility changes, start or fully stop
  useEffect(() => {
    if (isVisible) {
      onConnectionChange(true)
      startTimer()
    } else {
      // FULL CLEANUP when hidden - prevents OBS crashes
      clearTimer()
      setPhase("work")
      setTimeLeft(WORK_DURATION)
      setCycleCount(1)
      onConnectionChange(false)
    }

    // Always clean up interval on unmount
    return () => {
      clearTimer()
    }
  }, [isVisible, startTimer, clearTimer, onConnectionChange])

  // Get the next sync time label
  const getNextSyncTime = () => {
    const now = new Date()
    const minutesIntoBlock = now.getMinutes() % 30
    const nextBlockMinutes = 30 - minutesIntoBlock
    const target = new Date(now.getTime() + nextBlockMinutes * 60 * 1000)
    return `${String(target.getHours()).padStart(2, "0")}:${String(target.getMinutes()).padStart(2, "0")}`
  }

  const totalTime = phase === "work" ? WORK_DURATION : SHORT_BREAK
  const progress = (totalTime - timeLeft) / totalTime

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  const createPieSlicePath = (percentage: number) => {
    const radius = 90
    const centerX = 100
    const centerY = 100

    if (percentage <= 0) return ""
    if (percentage >= 1) {
      return `M ${centerX} ${centerY} L ${centerX} ${centerY - radius} A ${radius} ${radius} 0 1 1 ${centerX - 0.1} ${centerY - radius} Z`
    }

    const angle = percentage * 2 * Math.PI - Math.PI / 2
    const x = centerX + radius * Math.cos(angle)
    const y = centerY + radius * Math.sin(angle)
    const largeArcFlag = percentage > 0.5 ? 1 : 0

    return `M ${centerX} ${centerY} L ${centerX} ${centerY - radius} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x} ${y} Z`
  }

  if (!isVisible) return null

  return (
    <div className="absolute right-8 top-1/2 transform -translate-y-1/2 w-1/3 max-w-md">
      <div className="flex flex-col items-center justify-center gap-4 font-bold">
        <div className="relative w-64 h-64">
          <div className="absolute inset-0">
            {(phase === "work" ? [0, 5, 10, 15, 20, 25] : [0, 1, 2, 3, 4, 5]).map((num, index) => {
              const angle = (index * 360) / 6 - 90
              const radian = (angle * Math.PI) / 180
              const distance = 120
              const x = 128 + distance * Math.cos(radian)
              const y = 128 + distance * Math.sin(radian)

              return (
                <div
                  key={num}
                  className="absolute text-lg text-white drop-shadow-lg"
                  style={{
                    left: `${x}px`,
                    top: `${y}px`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  {num}
                </div>
              )
            })}
          </div>

          <div className="absolute inset-6 flex items-center justify-center">
            <svg className="absolute w-full h-full" viewBox="0 0 200 200">
              <path
                d={createPieSlicePath(1 - progress)}
                fill={phase === "work" ? "rgba(239, 68, 68, 0.8)" : "rgba(59, 130, 246, 0.8)"}
                style={{
                  transition: "d 1s ease-linear",
                }}
              />
            </svg>

            <div className="text-center z-10 relative">
              <div className="text-4xl text-white drop-shadow-lg font-bold font-sans">
                {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
              </div>
              <div className="text-sm text-gray-300 mt-1 drop-shadow-md font-semibold">
                {phase === "work" ? "Focus Time" : "Break Time"}
              </div>
            </div>
          </div>
        </div>

        <div className="text-4xl text-white text-center drop-shadow-lg font-semibold leading-tight uppercase font-sans">
          {phase === "work" ? (
            <>
              <div>25 MIN</div>
              <div>WORK CHALLENGE</div>
            </>
          ) : (
            <>
              <div>5 MIN</div>
              <div>BREAK TIME</div>
            </>
          )}
        </div>

        <div className="text-lg text-gray-300 drop-shadow-md font-sans">
          Cycle {cycleCount} &middot; Next: {getNextSyncTime()}
        </div>
      </div>
    </div>
  )
}
