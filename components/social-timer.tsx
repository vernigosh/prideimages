"use client"

import { useState, useEffect, useRef } from "react"
import {
  OVERLAY_FONT_DISPLAY,
  OVERLAY_FONT_STANDARD,
  OVERLAY_WEIGHT_PRIMARY,
  OVERLAY_WEIGHT_LABEL,
  OVERLAY_WEIGHT_BODY,
} from "@/lib/overlay-typography"

interface SocialTimerProps {
  isVisible: boolean
  onConnectionChange: (connected: boolean) => void
  onHide: () => void
  workTimerActive?: boolean
  darkTimerActive?: boolean
  prideTimerActive?: boolean
}

const SOCIAL_DURATION = 2 * 60

// Ring progress calculation
function getRingProps(progress: number) {
  const radius = 85
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * progress
  return { radius, circumference, strokeDashoffset }
}

export function SocialTimer({ isVisible, onConnectionChange, onHide, workTimerActive = false, darkTimerActive = false, prideTimerActive = false }: SocialTimerProps) {
  const [timeLeft, setTimeLeft] = useState(SOCIAL_DURATION)
  const [isComplete, setIsComplete] = useState(false)
  const rafRef = useRef<number | null>(null)
  const lastTickRef = useRef(0)
  const isVisibleRef = useRef(isVisible)
  const timeLeftRef = useRef(SOCIAL_DURATION)
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
      timeLeftRef.current = SOCIAL_DURATION
      setTimeLeft(SOCIAL_DURATION)
      setIsComplete(false)
      onConnectionChange(false)
      return
    }

    // Becoming visible - start fresh
    timeLeftRef.current = SOCIAL_DURATION
    setTimeLeft(SOCIAL_DURATION)
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
          hideTimeoutRef.current = setTimeout(() => {
            onHide()
          }, 60000)
          return
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

  const progress = (SOCIAL_DURATION - timeLeft) / SOCIAL_DURATION
  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  // Position based on which other timers are active:
  // - Work timer takes right side
  // - Dark timer takes left side when work or social is active
  // - Pride trivia timer takes right side with its circular progress
  // - Social goes to center when pride timer is active, right when alone or with dark only
  let positionClass = "right-8" // default when alone or with dark timer only
  if (prideTimerActive) {
    positionClass = "left-1/2 -translate-x-1/2" // center when pride timer is active (it uses right side)
  } else if (workTimerActive && darkTimerActive) {
    positionClass = "left-1/3 -translate-x-1/2" // center-left position when all 3 are active
  } else if (workTimerActive) {
    positionClass = "left-8" // left side when only work timer is also active
  }
  // When only social + dark are active: social stays right, dark moves to left

  if (isComplete) {
    return (
      <div className={`absolute ${positionClass} top-1/2 transform -translate-y-1/2 w-1/3 max-w-md`} style={workTimerActive && darkTimerActive ? { left: '33%', transform: 'translate(-50%, -50%)' } : undefined}>
        <div className="flex flex-col items-center justify-center font-bold">
          <div className="relative w-64 h-64 flex items-center justify-center">
            <div className="text-center">
              <div
                className="mb-2 text-white font-sans"
                style={{ fontSize: `${OVERLAY_FONT_STANDARD}px`, letterSpacing: 0, fontWeight: OVERLAY_WEIGHT_LABEL }}
              >
                Cheers everyone!
              </div>
              <div
                className="text-white font-sans"
                style={{ fontSize: `${OVERLAY_FONT_STANDARD}px`, letterSpacing: 0, fontWeight: OVERLAY_WEIGHT_BODY }}
              >
                Thank you for being here!
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const { radius, circumference, strokeDashoffset } = getRingProps(progress)

  return (
    <div className={`absolute ${positionClass} top-1/2 transform -translate-y-1/2`} style={workTimerActive && darkTimerActive ? { left: '33%', transform: 'translate(-50%, -50%)' } : undefined}>
      <div className="flex flex-col items-center gap-3">
        <div className="relative" style={{ width: "240px", height: "240px" }}>
          <svg className="absolute h-full w-full -rotate-90" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r={radius} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="10" />
            <circle
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke="rgba(50, 205, 50, 0.95)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: "stroke-dashoffset 0.5s ease-out" }}
            />
          </svg>
          {/* Ring interior: ONLY the countdown, pinned to the exact geometric
              center. No SOCIAL label lives inside the ring. */}
          <span
            className="absolute font-sans tabular-nums text-white"
            style={{
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              fontSize: `${OVERLAY_FONT_DISPLAY}px`,
              lineHeight: 1,
              letterSpacing: 0,
              fontWeight: OVERLAY_WEIGHT_PRIMARY,
              textShadow: "0 2px 8px rgba(0,0,0,0.6)",
            }}
          >
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </span>
        </div>
        {/* Single external label beneath the ring — no duplicate SOCIAL inside. */}
        <span
          className="font-sans uppercase text-white"
          style={{ fontSize: `${OVERLAY_FONT_STANDARD}px`, letterSpacing: 0, fontWeight: OVERLAY_WEIGHT_LABEL, textShadow: "0 2px 6px rgba(0,0,0,0.6)" }}
        >
          SOCIAL!
        </span>
      </div>
    </div>
  )
}
