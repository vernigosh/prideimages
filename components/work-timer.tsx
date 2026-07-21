"use client"

import { useState, useEffect, useRef } from "react"
import {
  OVERLAY_FONT_DISPLAY,
  OVERLAY_FONT_STANDARD,
  OVERLAY_WEIGHT_PRIMARY,
  OVERLAY_WEIGHT_LABEL,
  OVERLAY_WEIGHT_BODY,
} from "@/lib/overlay-typography"

export interface WorkTimerSettings {
  offsetX: number // px from the right edge
  offsetY: number // px from vertical center (positive = down)
  scale: number
  ringSize: number // ring diameter in px
  countdownFontSize: number
  stateLabelFontSize: number
  nextChangeFontSize: number
  introEnabled: boolean
  introDuration: number // ms
  focusIntroText: string
  breakIntroText: string
}

export const DEFAULT_WORK_TIMER_SETTINGS: WorkTimerSettings = {
  offsetX: 60,
  offsetY: 230, // lower-right primary slot, clear of the camera area
  scale: 1,
  ringSize: 180,
  countdownFontSize: 46,
  stateLabelFontSize: 24,
  nextChangeFontSize: 22,
  introEnabled: true,
  introDuration: 6000,
  focusIntroText: "25 MIN WORK CHALLENGE",
  breakIntroText: "5 MIN BREAK",
}

interface WorkTimerProps {
  isVisible: boolean
  onConnectionChange: (connected: boolean) => void
  onHide: () => void
  settings?: Partial<WorkTimerSettings>
  onIntroActiveChange?: (active: boolean) => void
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

// During a break, the next focus block starts at x:30 or x:00 (next hour).
function getNextFocusTime() {
  const now = new Date()
  const mins = now.getMinutes()
  const target = new Date(now)
  if (mins < 30) {
    target.setMinutes(30, 0, 0)
  } else {
    target.setHours(target.getHours() + 1)
    target.setMinutes(0, 0, 0)
  }
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

export function WorkTimer({ isVisible, onConnectionChange, onHide, settings, onIntroActiveChange }: WorkTimerProps) {
  const cfg: WorkTimerSettings = { ...DEFAULT_WORK_TIMER_SETTINGS, ...settings }
  const [phase, setPhase] = useState<"work" | "break">("work")
  const [timeLeft, setTimeLeft] = useState(WORK_DURATION)
  const [cycleCount, setCycleCount] = useState(1)
  const [showPulse, setShowPulse] = useState(false)
  const [intro, setIntro] = useState<{ text: string; phase: "work" | "break" } | null>(null)
  const rafRef = useRef<number | null>(null)
  const lastTickRef = useRef(0)
  const isVisibleRef = useRef(isVisible)
  const prevPhaseRef = useRef<"work" | "break" | null>(null)
  const introTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Keep refs in sync
  isVisibleRef.current = isVisible
  const cfgRef = useRef(cfg)
  cfgRef.current = cfg
  const onIntroActiveChangeRef = useRef(onIntroActiveChange)
  onIntroActiveChangeRef.current = onIntroActiveChange

  // Fire the temporary intro banner ONLY on a genuine wall-clock phase transition.
  const triggerIntro = (newPhase: "work" | "break") => {
    const c = cfgRef.current
    if (!c.introEnabled) return
    if (introTimerRef.current) clearTimeout(introTimerRef.current)
    setIntro({ text: newPhase === "work" ? c.focusIntroText : c.breakIntroText, phase: newPhase })
    onIntroActiveChangeRef.current?.(true)
    introTimerRef.current = setTimeout(() => {
      setIntro(null)
      onIntroActiveChangeRef.current?.(false)
    }, c.introDuration)
  }

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
      if (introTimerRef.current) {
        clearTimeout(introTimerRef.current)
        introTimerRef.current = null
      }
      setIntro(null)
      onIntroActiveChangeRef.current?.(false)
      prevPhaseRef.current = null
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
            triggerIntro("work")
          } else {
            // Break started
            window.dispatchEvent(new CustomEvent("breakStart", { detail: { cycle: s.cycle } }))
            sendChatMessage("BREAK TIME! Take 5 minutes to rest and recharge!")
            triggerIntro("break")
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

  const workColor = "rgba(145, 70, 255, 0.95)"
  const breakColor = "rgba(59, 130, 246, 0.95)"
  const ringColor = phase === "work" ? workColor : breakColor
  const stateLabel = phase === "work" ? "FOCUS TIME" : "BREAK TIME"
  const nextChange = phase === "work" ? `NEXT BREAK ${getNextBreakTime()}` : `NEXT WORK CYCLE ${getNextFocusTime()}`

  return (
    <>
      {/* Purple pulse overlay for new work cycle */}
      {showPulse && (
        <div
          className="fixed inset-0 pointer-events-none z-50"
          style={{
            background: "radial-gradient(ellipse at center, rgba(147, 51, 234, 0.3) 0%, rgba(147, 51, 234, 0.15) 50%, transparent 70%)",
            animation: "pulse 2s ease-in-out infinite",
          }}
        />
      )}

      {/* Temporary intro banner - only shown briefly on an actual phase transition.
          Single display-size line, max two lines, no subtitle. */}
      {intro && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="flex max-w-[80vw] flex-col items-center rounded-xl border border-white/10 bg-neutral-900/85 px-16 py-10 shadow-2xl"
            style={{ animation: "pulse 2.5s ease-in-out infinite" }}
          >
            <span
              className="font-sans uppercase text-white text-center text-balance"
              style={{
                fontSize: `${OVERLAY_FONT_DISPLAY}px`,
                lineHeight: 1,
                letterSpacing: 0,
                fontWeight: OVERLAY_WEIGHT_PRIMARY,
                color: intro.phase === "work" ? "#b18cff" : "#7fb0ff",
              }}
            >
              {intro.text}
            </span>
          </div>
        </div>
      )}

      {/* Persistent compact timer */}
      <div
        className="absolute right-0 top-1/2 z-10"
        style={{ transform: `translate(${-cfg.offsetX}px, calc(-50% + ${cfg.offsetY}px)) scale(${cfg.scale})` }}
      >
        <div className="flex flex-col items-center gap-[7px]">
          <div className="relative" style={{ width: `${cfg.ringSize}px`, height: `${cfg.ringSize}px` }}>
            <svg className="absolute h-full w-full -rotate-90" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r={radius} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="10" />
              <circle
                cx="100"
                cy="100"
                r={radius}
                fill="none"
                stroke={ringColor}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                style={{ transition: "stroke-dashoffset 0.5s ease-out" }}
              />
            </svg>
            {/* Ring interior: ONLY the countdown, pinned to the exact geometric
                center. No phase label or subtitle lives inside the ring. */}
            <span
              className="absolute font-sans tabular-nums text-white"
              style={{
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
                fontSize: `${cfg.countdownFontSize}px`,
                lineHeight: 1,
                letterSpacing: 0,
                fontWeight: OVERLAY_WEIGHT_PRIMARY,
                textShadow: "0 2px 8px rgba(0,0,0,0.6)",
              }}
            >
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </span>
          </div>
          {/* Timer copy: normal centered vertical layout BENEATH the ring, giving
              a predictable measured bottom edge for chat placement. */}
          <div className="flex flex-col items-center gap-[3px]">
            <span
              className="font-sans uppercase text-white"
              style={{
                fontSize: `${cfg.stateLabelFontSize}px`,
                lineHeight: 1.08,
                letterSpacing: 0,
                fontWeight: OVERLAY_WEIGHT_LABEL,
                textShadow: "0 2px 6px rgba(0,0,0,0.6)",
              }}
            >
              {stateLabel}
            </span>
            <span
              className="font-sans uppercase text-white/70"
              style={{
                fontSize: `${cfg.nextChangeFontSize}px`,
                lineHeight: 1.08,
                letterSpacing: 0,
                fontWeight: OVERLAY_WEIGHT_BODY,
                textShadow: "0 2px 6px rgba(0,0,0,0.6)",
              }}
            >
              {nextChange}
            </span>
          </div>
        </div>
      </div>
    </>
  )
}
