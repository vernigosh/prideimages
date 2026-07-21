"use client"

import { useState, useEffect, useRef } from "react"
import {
  OVERLAY_FONT_STANDARD,
  OVERLAY_WEIGHT_PRIMARY,
  OVERLAY_WEIGHT_LABEL,
  OVERLAY_WEIGHT_BODY,
} from "@/lib/overlay-typography"

interface DarkTimerProps {
  isVisible: boolean
  onConnectionChange: (connected: boolean) => void
  onHide: () => void
  offsetX?: number
  offsetY?: number
  countdownFontSize?: number
}

const DARK_DURATION = 20 * 60

// Ring progress calculation
function getRingProps(progress: number) {
  const radius = 85
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * progress
  return { radius, circumference, strokeDashoffset }
}

export function DarkTimer({
  isVisible,
  onConnectionChange,
  onHide,
  offsetX = 60,
  offsetY = 230,
  countdownFontSize = 40,
}: DarkTimerProps) {
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

  // Position is shared with the work-timer rail. The parent supplies an exact
  // secondary offset when Work is active, keeping a fixed 24px block gap.
  const timerTransform = `translateY(calc(-50% + ${offsetY}px))`

  if (isComplete) {
    return (
      <div className="absolute top-1/2 z-10 w-[260px]" style={{ right: `${offsetX}px`, transform: timerTransform }}>
        <div className="flex flex-col items-center justify-center">
          <div className="text-center">
            <div
              className="mb-2 font-sans uppercase animate-pulse"
              style={{
                fontSize: "46px",
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
    <div className="absolute top-1/2 z-10 w-[260px]" style={{ right: `${offsetX}px`, transform: timerTransform }}>
      <div className="flex flex-col items-center gap-[7px]">
        <div className="relative" style={{ width: "180px", height: "180px" }}>
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
          {/* Ring interior: ONLY the countdown, pinned to the exact geometric
              center. No phase label lives inside the ring. */}
          <span
            className="absolute font-sans tabular-nums"
            style={{
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              fontSize: `${countdownFontSize}px`,
              lineHeight: 1,
              letterSpacing: 0,
              fontWeight: OVERLAY_WEIGHT_PRIMARY,
              color: "#ffffff",
              textShadow: "0 0 20px #ff0000, 0 0 40px #ff0000",
            }}
          >
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </span>
        </div>
        {/* Timer copy: normal centered vertical layout beneath the ring. */}
        <div className="flex flex-col items-center gap-[3px]">
          <span
            className="font-sans uppercase"
            style={{
              fontSize: "24px",
              lineHeight: 1.08,
              letterSpacing: 0,
              fontWeight: OVERLAY_WEIGHT_LABEL,
              color: "#ff6b6b",
              textShadow: "0 0 10px #ff0000",
            }}
          >
            DARK VERNIGOSH
          </span>
          {/* Supporting text: preserve exact capitalization, no uppercase transform. */}
          <span
            className="font-sans text-center"
            style={{ fontSize: "24px", lineHeight: 1.08, letterSpacing: 0, fontWeight: OVERLAY_WEIGHT_BODY, color: "#ff3b3b", textShadow: "0 0 12px #ff0000" }}
          >
            Exploring the darker parts of the library!
          </span>
        </div>
      </div>
    </div>
  )
}
