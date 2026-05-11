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

// Send chat message via StreamElements bot
async function sendChatMessage(message: string) {
  try {
    await fetch("/api/send-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    })
  } catch (error) {
    console.error("[v0] Failed to send chat message:", error)
  }
}

// Singing bowl audio URL (using blob URL for v0 compatibility)
const SINGING_BOWL_URL = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/freesound_community-singing-bowl-gong-69238-RUz3Yb1v9aENqbJIqZoYGxjyZD3apI.mp3"

// Set to true to enable singing bowl audio on phase transitions
const SINGING_BOWL_ENABLED = false

// Play singing bowl gong sound for phase transitions
function playSingingBowl() {
  if (!SINGING_BOWL_ENABLED) return
  if (typeof window === "undefined") return
  try {
    const audio = new Audio(SINGING_BOWL_URL)
    audio.volume = 0.5
    audio.play().catch(() => {})
  } catch {
    // Audio playback failed silently
  }
}

// Ring progress calculation
function getRingProps(progress: number) {
  const radius = 85
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * progress
  return { radius, circumference, strokeDashoffset }
}

export function WorkTimer({ isVisible, onConnectionChange, onHide }: WorkTimerProps) {
  const [phase, setPhase] = useState<"work" | "break">("work")
  const [timeLeft, setTimeLeft] = useState(WORK_DURATION)
  const [cycleCount, setCycleCount] = useState(1)
  const [showPulse, setShowPulse] = useState(false)
  const rafRef = useRef<number | null>(null)
  const lastTickRef = useRef(0)
  const isVisibleRef = useRef(isVisible)
  const prevPhaseRef = useRef<"work" | "break" | null>(null)
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

    // RAF loop - syncs to real clock every second
    const tick = () => {
      if (!isVisibleRef.current) return

      const now = Date.now()
      if (now - lastTickRef.current >= 1000) {
        lastTickRef.current = now
        const s = getClockState()
        
        // Detect phase transitions
        if (prevPhaseRef.current !== null && s.currentPhase !== prevPhaseRef.current) {
          // Play singing bowl sound for any phase transition
          playSingingBowl()
          
          if (s.currentPhase === "work") {
            // New work cycle started
            window.dispatchEvent(new CustomEvent("workCycleStart", { detail: { cycle: s.cycle } }))
            setShowPulse(true)
            setTimeout(() => setShowPulse(false), 10000) // 10 second pulse
            sendChatMessage("FOCUS TIME! 25 minutes of productivity starts now!")
          } else {
            // Break started
            window.dispatchEvent(new CustomEvent("breakStart", { detail: { cycle: s.cycle } }))
            sendChatMessage("BREAK TIME! Take 5 minutes to rest and recharge!")
          }
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
  const { radius, circumference, strokeDashoffset } = getRingProps(progress)

  return (
    <>
      {/* Purple pulse overlay for new work cycle */}
      {showPulse && (
        <div 
          className="fixed inset-0 pointer-events-none z-50 animate-pulse"
          style={{
            background: "radial-gradient(ellipse at center, rgba(147, 51, 234, 0.3) 0%, rgba(147, 51, 234, 0.15) 50%, transparent 70%)",
            animation: "pulse 2s ease-in-out infinite",
          }}
        />
      )}
      <div className="absolute right-8 top-1/2 transform -translate-y-1/2 w-1/3 max-w-md">
      {/* Gradient background for visibility on light backgrounds */}
      <div
        className="absolute inset-0 -m-8 rounded-3xl"
        style={{
          background: "radial-gradient(ellipse at center, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.4) 50%, transparent 80%)",
        }}
      />
      <div className="flex flex-col items-center justify-center gap-4 font-bold relative z-10">
        <div className="relative w-64 h-64">
          <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 200 200">
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
              stroke={phase === "work" ? "rgba(145, 70, 255, 0.95)" : "rgba(59, 130, 246, 0.9)"}
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
                {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
              </div>
              <div className="text-sm text-gray-300 mt-2 drop-shadow-md font-semibold">
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
    </>
  )
}
