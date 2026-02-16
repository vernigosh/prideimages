"use client"

import { useState, useEffect, useRef } from "react"

interface SocialTimerProps {
  isVisible: boolean
  onConnectionChange: (connected: boolean) => void
  onHide: () => void
}

const SOCIAL_DURATION = 2 * 60

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

export function SocialTimer({ isVisible, onConnectionChange, onHide }: SocialTimerProps) {
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

  if (isComplete) {
    return (
      <div className="absolute right-8 top-1/2 transform -translate-y-1/2 w-1/3 max-w-md">
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

  return (
    <div className="absolute right-8 top-1/2 transform -translate-y-1/2 w-1/3 max-w-md">
      <div className="flex flex-col items-center justify-center gap-4 font-bold">
        <div className="relative w-64 h-64">
          <div className="absolute inset-6 flex items-center justify-center">
            <svg className="absolute w-full h-full" viewBox="0 0 200 200">
              <path d={createPieSlicePath(1 - progress)} fill="rgba(50, 205, 50, 0.8)" />
            </svg>

            <div className="text-center z-10 relative">
              <div className="text-4xl text-white drop-shadow-lg font-bold font-sans">
                {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
              </div>
              <div className="text-sm text-gray-300 mt-1 drop-shadow-md font-semibold font-sans">Running</div>
            </div>
          </div>
        </div>

        <div className="text-4xl text-white text-center drop-shadow-lg font-bold font-sans">SOCIAL!</div>
      </div>
    </div>
  )
}
