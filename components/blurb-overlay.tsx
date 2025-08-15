"use client"

import { useState, useEffect, useRef } from "react"

interface Blurb {
  id: string
  text: string
  enabled: boolean
}

interface BlurbOverlayProps {
  blurbs: Blurb[]
  isEnabled: boolean
  intervalMinutes: number
  displayDurationSeconds: number
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center"
  fontSize: number
  fontFamily: string
  textColor: string
  backgroundColor: string
  shadowColor: string
  shadowSize: number
  fontWeight: "normal" | "bold" | "black"
}

export function BlurbOverlay({
  blurbs,
  isEnabled,
  intervalMinutes,
  displayDurationSeconds,
  position,
  fontSize,
  fontFamily,
  textColor,
  backgroundColor,
  shadowColor,
  shadowSize,
  fontWeight,
}: BlurbOverlayProps) {
  const [currentBlurb, setCurrentBlurb] = useState<Blurb | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Filter enabled blurbs
  const enabledBlurbs = blurbs.filter((blurb) => blurb.enabled)

  const showBlurb = (blurb: Blurb) => {
    setCurrentBlurb(blurb)

    // Small delay to ensure DOM is ready, then start animation
    setTimeout(() => {
      setIsAnimating(true)
    }, 50)

    // Hide after display duration
    timeoutRef.current = setTimeout(() => {
      setIsAnimating(false)

      // Wait for exit animation to complete before clearing
      setTimeout(() => {
        setCurrentBlurb(null)
      }, 500)
    }, displayDurationSeconds * 1000)
  }

  useEffect(() => {
    // Clear any existing timers
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    if (!isEnabled || enabledBlurbs.length === 0) {
      setIsAnimating(false)
      setCurrentBlurb(null)
      return
    }

    let currentIdx = 0

    const showNextBlurb = () => {
      if (enabledBlurbs.length === 0) return
      const nextBlurb = enabledBlurbs[currentIdx % enabledBlurbs.length]
      showBlurb(nextBlurb)
      currentIdx = (currentIdx + 1) % enabledBlurbs.length
    }

    // Show first blurb immediately
    showNextBlurb()

    // Set up interval for subsequent blurbs
    intervalRef.current = setInterval(showNextBlurb, intervalMinutes * 60 * 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [isEnabled, enabledBlurbs, intervalMinutes, displayDurationSeconds])

  useEffect(() => {
    let manualIndex = 0

    const handleManualBlurb = () => {
      if (enabledBlurbs.length === 0) return
      const nextBlurb = enabledBlurbs[manualIndex % enabledBlurbs.length]
      showBlurb(nextBlurb)
      manualIndex = (manualIndex + 1) % enabledBlurbs.length
    }

    window.addEventListener("triggerManualBlurb", handleManualBlurb)
    return () => window.removeEventListener("triggerManualBlurb", handleManualBlurb)
  }, [enabledBlurbs, displayDurationSeconds])

  const getPositionClasses = () => {
    switch (position) {
      case "top-left":
        return "top-8 left-8"
      case "top-right":
        return "top-8 right-8"
      case "bottom-left":
        return "bottom-8 left-8"
      case "bottom-right":
        return "bottom-8 right-8"
      case "center":
        return "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
      default:
        return "top-8 left-8"
    }
  }

  const getFontWeight = () => {
    switch (fontWeight) {
      case "normal":
        return "font-normal"
      case "bold":
        return "font-bold"
      case "black":
        return "font-black"
      default:
        return "font-bold"
    }
  }

  // Don't render anything if no current blurb
  if (!currentBlurb) return null

  return (
    <div className={`fixed ${getPositionClasses()} z-20 max-w-md pointer-events-none`}>
      <div
        className={`px-6 py-4 rounded-lg border-2 border-black ${getFontWeight()} text-center transition-all duration-500 ease-out transform ${
          isAnimating ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
        }`}
        style={{
          fontSize: `${fontSize}px`,
          fontFamily: fontFamily,
          color: textColor,
          backgroundColor: backgroundColor,
          textShadow: `${shadowSize}px ${shadowSize}px ${shadowSize * 2}px ${shadowColor}`,
        }}
      >
        {currentBlurb.text}
      </div>
    </div>
  )
}
