"use client"

import { useState, useEffect, useRef } from "react"
import {
  OVERLAY_FONT_DISPLAY,
  OVERLAY_FONT_STANDARD,
  OVERLAY_WEIGHT_PRIMARY,
  OVERLAY_WEIGHT_LABEL,
  OVERLAY_WEIGHT_BODY,
} from "@/lib/overlay-typography"

interface DarkTimerProps {
  isVisible: boolean
  onConnectionChange: (connected: boolean) => void
  onHide: () => void
  workTimerActive?: boolean
  socialTimerActive?: boolean
}

const DARK_DURATION = 20 * 60

// Ring progress calculation
function getRingProps(progress: number) {
  const radius = 85
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * progress
  return { radius, circumference, strokeDashoffset }
}

export function DarkTimer({ isVisible, onConnectionChange, onHide, workTimerActive = false, socialTimerActive = false }: DarkTimerProps) {
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

  const progress = (DARK_DURATION - timeLeft) / DARK_DURATION
  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const { radius, circumference, strokeDashoffset } = getRingProps(progress)

  // Position based on which other timers are active:
  // - Work timer takes right side
  // - Dark timer takes left side when work OR social is active
  // - Social takes center-left when all 3 are active, or right when alone with dark
  let positionClass = "right-8" // default when alone
  if (workTimerActive || socialTimerActive) {
    positionClass = "left-8" // left side when work or social timer is also active
  }

  if (isComplete) {
    return (
      <div className={`absolute ${positionClass} top-1/2 transform -translate-y-1/2 w-1/3 max-w-md`}>
        <div className="flex flex-col items-center justify-center">
          <div className="text-center">
            <div
              className="mb-2 font-sans uppercase animate-pulse"
              style={{
                fontSize: `${OVERLAY_FONT_DISPLAY}px`,
                lineHeight: 1,
                letterSpacing: 0,
                fontWeight: OVERLAY_WEIGHT_PRIMARY,
                color: "#ffffff",
                textShadow: "0 0 20px #ff0000, 0 0 40px #ff0000",
              }}
            >
              DARKNESS COMPLETE
            </div>
            <div
              className="font-sans uppercase"
              style={{
                fontSize: `${OVERLAY_FONT_STANDARD}px`,
                letterSpacing: 0,
                fontWeight: OVERLAY_WEIGHT_BODY,
                color: "#ff0000",
                textShadow: "0 0 10px #ff0000",
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
    <div className={`absolute ${positionClass} top-1/2 transform -translate-y-1/2`}>
      <div className="flex flex-col items-center gap-3">
        <div className="relative" style={{ width: "240px", height: "240px" }}>
          <svg className="absolute h-full w-full -rotate-90" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r={radius} fill="none" stroke="rgba(255, 0, 0, 0.18)" strokeWidth="10" />
            <circle
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke="rgba(255, 0, 0, 0.95)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: "stroke-dashoffset 0.5s ease-out", filter: "drop-shadow(0 0 8px #ff0000)" }}
            />
          </svg>
          {/* Countdown pinned to the exact geometric center; label sits below,
              independent of the countdown's centering. */}
          <span
            className="absolute font-sans tabular-nums"
            style={{
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              fontSize: `${OVERLAY_FONT_DISPLAY}px`,
              lineHeight: 1,
              letterSpacing: 0,
              fontWeight: OVERLAY_WEIGHT_PRIMARY,
              color: "#ffffff",
              textShadow: "0 0 20px #ff0000, 0 0 40px #ff0000",
            }}
          >
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </span>
          <span
            className="absolute font-sans uppercase"
            style={{
              left: "50%",
              top: "calc(50% + 34px)",
              transform: "translateX(-50%)",
              fontSize: `${OVERLAY_FONT_STANDARD}px`,
              letterSpacing: 0,
              fontWeight: OVERLAY_WEIGHT_LABEL,
              color: "#ff6b6b",
              textShadow: "0 0 10px #ff0000",
            }}
          >
            DARK
          </span>
        </div>
        {/* Supporting text: preserve exact capitalization, no uppercase transform. */}
        <span
          className="font-sans"
          style={{ fontSize: `${OVERLAY_FONT_STANDARD}px`, letterSpacing: 0, fontWeight: OVERLAY_WEIGHT_BODY, color: "#ff3b3b", textShadow: "0 0 12px #ff0000" }}
        >
          Exploring Darker Sounds
        </span>
      </div>
    </div>
  )
}
