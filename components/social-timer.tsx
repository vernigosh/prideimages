"use client"

import { useState, useEffect, useRef } from "react"

interface SocialTimerProps {
  isVisible: boolean
  onConnectionChange: (connected: boolean) => void
  onHide: () => void
  workTimerActive?: boolean
  darkTimerActive?: boolean
}

const SOCIAL_DURATION = 2 * 60

// Ring progress calculation
function getRingProps(progress: number) {
  const radius = 85
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * progress
  return { radius, circumference, strokeDashoffset }
}

export function SocialTimer({ isVisible, onConnectionChange, onHide, workTimerActive = false, darkTimerActive = false }: SocialTimerProps) {
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
  // - Dark timer takes left side when work is active
  // - Social goes to center-left when both work and dark are active, otherwise left when work active, right when alone
  let positionClass = "right-8" // default when alone
  if (workTimerActive && darkTimerActive) {
    positionClass = "left-1/3 -translate-x-1/2" // center-left position when all 3 are active
  } else if (workTimerActive) {
    positionClass = "left-8" // left side when only work timer is also active
  }

  if (isComplete) {
    return (
      <div className={`absolute ${positionClass} top-1/2 transform -translate-y-1/2 w-1/3 max-w-md`} style={workTimerActive && darkTimerActive ? { left: '33%', transform: 'translate(-50%, -50%)' } : undefined}>
        <div className="flex flex-col items-center justify-center font-bold">
          <div className="relative w-64 h-64 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl text-white mb-2 drop-shadow-lg font-sans">Cheers everyone!</div>
              <div className="text-4xl text-white drop-shadow-lg font-sans">Thank you for being here!</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const { radius, circumference, strokeDashoffset } = getRingProps(progress)

  return (
    <div className={`absolute ${positionClass} top-1/2 transform -translate-y-1/2 w-1/3 max-w-md`} style={workTimerActive && darkTimerActive ? { left: '33%', transform: 'translate(-50%, -50%)' } : undefined}>
      <div className="flex flex-col items-center justify-center gap-4 font-bold">
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
              stroke="rgba(50, 205, 50, 0.9)"
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
              <div className="text-sm text-gray-300 mt-2 drop-shadow-md font-semibold font-sans">Running</div>
            </div>
          </div>
        </div>

        <div className="text-4xl text-white text-center drop-shadow-lg font-bold font-sans">SOCIAL!</div>
      </div>
    </div>
  )
}
