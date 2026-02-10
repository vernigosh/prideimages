"use client"

import { useState, useEffect, useRef, useCallback } from "react"

interface WorkTimerProps {
  isVisible: boolean
  onConnectionChange: (connected: boolean) => void
  onHide: () => void
}

const WORK_DURATION = 25 * 60 // 25 minutes in seconds
const SHORT_BREAK = 5 * 60 // 5 minutes in seconds
const CYCLE_DURATION = WORK_DURATION + SHORT_BREAK // 30 minutes total

export function WorkTimer({ isVisible, onConnectionChange, onHide }: WorkTimerProps) {
  const [phase, setPhase] = useState<"work" | "break">("work")
  const [timeLeft, setTimeLeft] = useState(WORK_DURATION)
  const [cycleCount, setCycleCount] = useState(1)
  const [isRunning, setIsRunning] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const syncedRef = useRef(false)

  // Calculate where we are in the current 30-min block based on the real clock
  const syncToClock = useCallback(() => {
    const now = new Date()
    const minutesIntoHour = now.getMinutes()
    const secondsIntoHour = now.getSeconds()

    // Total seconds into the current 30-min block
    const minutesIntoBlock = minutesIntoHour % 30
    const totalSecondsIntoBlock = minutesIntoBlock * 60 + secondsIntoHour

    if (totalSecondsIntoBlock < WORK_DURATION) {
      // We're in a work phase
      const remaining = WORK_DURATION - totalSecondsIntoBlock
      setPhase("work")
      setTimeLeft(remaining)
    } else {
      // We're in a break phase
      const secondsIntoBreak = totalSecondsIntoBlock - WORK_DURATION
      const remaining = SHORT_BREAK - secondsIntoBreak
      setPhase("break")
      setTimeLeft(Math.max(remaining, 0))
    }

    // Calculate which cycle we're on (based on how many 30-min blocks since midnight)
    const totalMinutesSinceMidnight = now.getHours() * 60 + minutesIntoHour
    const cyclesSinceMidnight = Math.floor(totalMinutesSinceMidnight / 30) + 1
    setCycleCount(cyclesSinceMidnight)

    syncedRef.current = true
  }, [])

  useEffect(() => {
    const handleStartTimer = () => {
      syncToClock()
      setIsRunning(true)
    }

    const handleStopTimer = () => {
      setIsRunning(false)
    }

    const handleResetTimer = () => {
      syncToClock()
      setIsRunning(true)
    }

    const handleHideTimer = () => {
      setIsRunning(false)
      syncedRef.current = false
      onHide()
    }

    window.addEventListener("startWorkTimer", handleStartTimer as EventListener)
    window.addEventListener("stopWorkTimer", handleStopTimer as EventListener)
    window.addEventListener("resetWorkTimer", handleResetTimer as EventListener)
    window.addEventListener("hideWorkTimer", handleHideTimer as EventListener)

    onConnectionChange(isVisible)

    return () => {
      window.removeEventListener("startWorkTimer", handleStartTimer as EventListener)
      window.removeEventListener("stopWorkTimer", handleStopTimer as EventListener)
      window.removeEventListener("resetWorkTimer", handleResetTimer as EventListener)
      window.removeEventListener("hideWorkTimer", handleHideTimer as EventListener)
    }
  }, [isVisible, onConnectionChange, onHide, syncToClock])

  // Auto-start and sync when becoming visible
  useEffect(() => {
    if (isVisible && !isRunning) {
      syncToClock()
      setTimeout(() => {
        setIsRunning(true)
      }, 200)
    }
  }, [isVisible, syncToClock])

  // Main countdown loop - re-syncs to clock every tick for accuracy
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        const now = new Date()
        const minutesIntoBlock = now.getMinutes() % 30
        const totalSecondsIntoBlock = minutesIntoBlock * 60 + now.getSeconds()

        if (totalSecondsIntoBlock < WORK_DURATION) {
          const remaining = WORK_DURATION - totalSecondsIntoBlock
          if (phase !== "work") {
            setPhase("work")
            // New cycle started
            const totalMinutesSinceMidnight = now.getHours() * 60 + now.getMinutes()
            setCycleCount(Math.floor(totalMinutesSinceMidnight / 30) + 1)
          }
          setTimeLeft(remaining)
        } else {
          const secondsIntoBreak = totalSecondsIntoBlock - WORK_DURATION
          const remaining = SHORT_BREAK - secondsIntoBreak
          if (phase !== "break") {
            setPhase("break")
          }
          setTimeLeft(Math.max(remaining, 0))
        }
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, phase])

  const totalTime = phase === "work" ? WORK_DURATION : SHORT_BREAK
  const progress = (totalTime - timeLeft) / totalTime

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  // Get the next sync time (when the current block ends)
  const getNextSyncTime = () => {
    const now = new Date()
    const minutesIntoBlock = now.getMinutes() % 30
    const nextBlockStart = 30 - minutesIntoBlock
    const nextHour = now.getHours()
    const nextMin = (now.getMinutes() + nextBlockStart) % 60
    return `${String(nextHour + (now.getMinutes() + nextBlockStart >= 60 ? 1 : 0)).padStart(2, "0")}:${String(nextMin).padStart(2, "0")}`
  }

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
                {isRunning ? (phase === "work" ? "Focus Time" : "Break Time") : "Paused"}
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
