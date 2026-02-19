"use client"

import { useState, useEffect, useRef } from "react"

interface WorkTimerProps {
  isVisible: boolean
  onConnectionChange: (connected: boolean) => void
  onHide: () => void
}

const WORK_DURATION = 50 * 60
const SHORT_BREAK = 10 * 60
const CYCLE_LENGTH = WORK_DURATION + SHORT_BREAK // 60 min total

// Get timer state relative to when the timer was activated
function getTimerState(activatedAt: number) {
  const elapsed = Math.floor((Date.now() - activatedAt) / 1000)
  const posInCycle = elapsed % CYCLE_LENGTH
  const cycle = Math.floor(elapsed / CYCLE_LENGTH) + 1

  let currentPhase: "work" | "break"
  let remaining: number

  if (posInCycle < WORK_DURATION) {
    currentPhase = "work"
    remaining = WORK_DURATION - posInCycle
  } else {
    currentPhase = "break"
    remaining = CYCLE_LENGTH - posInCycle
  }

  return { currentPhase, remaining, cycle }
}

function getNextBreakTime(activatedAt: number) {
  const elapsed = Math.floor((Date.now() - activatedAt) / 1000)
  const posInCycle = elapsed % CYCLE_LENGTH
  const secsUntilBreak = posInCycle < WORK_DURATION ? WORK_DURATION - posInCycle : CYCLE_LENGTH - posInCycle
  const target = new Date(Date.now() + secsUntilBreak * 1000)
  return `${String(target.getHours()).padStart(2, "0")}:${String(target.getMinutes()).padStart(2, "0")}`
}

function createPieSlicePath(percentage: number) {
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

export function WorkTimer({ isVisible, onConnectionChange, onHide }: WorkTimerProps) {
  const [phase, setPhase] = useState<"work" | "break">("work")
  const [timeLeft, setTimeLeft] = useState(WORK_DURATION)
  const [cycleCount, setCycleCount] = useState(1)
  const rafRef = useRef<number | null>(null)
  const lastTickRef = useRef(0)
  const isVisibleRef = useRef(isVisible)
  const activatedAtRef = useRef(0)

  // Keep ref in sync
  isVisibleRef.current = isVisible

  // Single effect: use requestAnimationFrame instead of setInterval
  // RAF automatically pauses when OBS hides the browser source (scene change)
  // so no state updates queue up in the background
  useEffect(() => {
    if (!isVisible) {
      // Full cleanup
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      lastTickRef.current = 0
      activatedAtRef.current = 0
      setPhase("work")
      setTimeLeft(WORK_DURATION)
      setCycleCount(1)
      onConnectionChange(false)
      return
    }

    // Becoming visible - record activation time, reset cycle to 1
    activatedAtRef.current = Date.now()
    const state = getTimerState(activatedAtRef.current)
    setPhase(state.currentPhase)
    setTimeLeft(state.remaining)
    setCycleCount(state.cycle)
    onConnectionChange(true)
    lastTickRef.current = Date.now()

    // RAF loop - only updates once per second, pauses when tab/source hidden
    const tick = () => {
      if (!isVisibleRef.current) return

      const now = Date.now()
      if (now - lastTickRef.current >= 1000) {
        lastTickRef.current = now
        const s = getTimerState(activatedAtRef.current)
        setPhase(s.currentPhase)
        setTimeLeft(s.remaining)
        setCycleCount(s.cycle)
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
      } else if (isVisibleRef.current) {
        lastTickRef.current = Date.now()
        const s = getTimerState(activatedAtRef.current)
        setPhase(s.currentPhase)
        setTimeLeft(s.remaining)
        setCycleCount(s.cycle)
        rafRef.current = requestAnimationFrame(tick)
      }
    }

    document.addEventListener("visibilitychange", handleVisibility)

    // Cleanup on re-run or unmount
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      document.removeEventListener("visibilitychange", handleVisibility)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible])

  if (!isVisible) return null

  const totalTime = phase === "work" ? WORK_DURATION : SHORT_BREAK
  const progress = (totalTime - timeLeft) / totalTime
  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  return (
    <div className="absolute right-8 top-1/2 transform -translate-y-1/2 w-1/3 max-w-md">
      <div className="flex flex-col items-center justify-center gap-4 font-bold">
        <div className="relative w-64 h-64">
          <div className="absolute inset-0">
            {(phase === "work" ? [0, 10, 20, 30, 40, 50] : [0, 2, 4, 6, 8, 10]).map((num, index) => {
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
                fill={phase === "work" ? "rgba(145, 70, 255, 0.85)" : "rgba(59, 130, 246, 0.8)"}
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
              <div>50 MIN</div>
              <div>WORK CHALLENGE</div>
            </>
          ) : (
            <>
              <div>10 MIN</div>
              <div>BREAK TIME</div>
            </>
          )}
        </div>

        <div className="text-3xl text-gray-300 drop-shadow-lg font-sans font-semibold">
          Cycle {cycleCount} &middot; Next: {getNextBreakTime(activatedAtRef.current)}
        </div>
      </div>
    </div>
  )
}
