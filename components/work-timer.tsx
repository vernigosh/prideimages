"use client"

import { useState, useEffect, useRef } from "react"

interface WorkTimerProps {
  isVisible: boolean
  onConnectionChange: (connected: boolean) => void
  onHide: () => void
}

const WORK_DURATION = 25 * 60
const SHORT_BREAK = 5 * 60

// Clock-synced timer: work from x:00-x:25 and x:30-x:55, breaks at x:25-x:30 and x:55-x:00
function getClockState() {
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

  // Cycle resets each half-hour block
  const blockIndex = Math.floor(now.getMinutes() / 30)
  const cycle = now.getHours() * 2 + blockIndex + 1

  return { currentPhase, remaining, cycle }
}

function getNextBreakTime() {
  const now = new Date()
  const mins = now.getMinutes()
  // Next break starts at either x:25 or x:55
  let nextBreakMin: number
  if (mins < 25) {
    nextBreakMin = 25
  } else if (mins < 55) {
    nextBreakMin = 55
  } else {
    nextBreakMin = 25 // next hour
  }
  const target = new Date(now)
  if (nextBreakMin <= mins) {
    target.setHours(target.getHours() + 1)
  }
  target.setMinutes(nextBreakMin, 0, 0)
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
  const prevPhaseRef = useRef<"work" | "break" | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Keep ref in sync
  isVisibleRef.current = isVisible

  // Initialize audio element once and listen for !loontest command
  useEffect(() => {
    const audio = new Audio("/sounds/loon_sample.wav")
    audio.volume = 0.3
    audioRef.current = audio

    const handleLoonTest = () => {
      if (audioRef.current) {
        audioRef.current.currentTime = 0
        audioRef.current.play().catch(() => {})
      }
    }

    window.addEventListener("loonTest", handleLoonTest)

    return () => {
      window.removeEventListener("loonTest", handleLoonTest)
      audio.pause()
      audio.src = ""
    }
  }, [])

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
      setPhase("work")
      setTimeLeft(WORK_DURATION)
      setCycleCount(1)
      onConnectionChange(false)
      return
    }

    // Becoming visible - sync to clock immediately
    const state = getClockState()
    setPhase(state.currentPhase)
    setTimeLeft(state.remaining)
    setCycleCount(state.cycle)
    prevPhaseRef.current = state.currentPhase
    onConnectionChange(true)
    lastTickRef.current = Date.now()

    const playLoon = () => {
      if (audioRef.current) {
        audioRef.current.currentTime = 0
        audioRef.current.play().catch(() => {})
      }
    }

    // RAF loop - syncs to real clock every second
    const tick = () => {
      if (!isVisibleRef.current) return

      const now = Date.now()
      if (now - lastTickRef.current >= 1000) {
        lastTickRef.current = now
        const s = getClockState()

        // Play loon sound on phase transition
        if (prevPhaseRef.current !== null && s.currentPhase !== prevPhaseRef.current) {
          playLoon()
        }
        prevPhaseRef.current = s.currentPhase

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
        const s = getClockState()
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

        <div className="text-3xl text-gray-300 drop-shadow-lg font-sans font-semibold">
          Break at {getNextBreakTime()}
        </div>
      </div>
    </div>
  )
}
