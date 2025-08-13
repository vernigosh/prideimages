"use client"

import { useState, useEffect } from "react"

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
  const [isVisible, setIsVisible] = useState(false)
  const [animationPhase, setAnimationPhase] = useState<"entering" | "visible" | "exiting">("visible")

  // Filter enabled blurbs
  const enabledBlurbs = blurbs.filter((blurb) => blurb.enabled)

  useEffect(() => {
    if (!isEnabled || enabledBlurbs.length === 0) {
      setIsVisible(false)
      return
    }

    let currentIdx = 0

    const showNextBlurb = () => {
      if (enabledBlurbs.length === 0) return

      const nextBlurb = enabledBlurbs[currentIdx % enabledBlurbs.length]
      setCurrentBlurb(nextBlurb)
      setIsVisible(true)
      setAnimationPhase("entering")

      // After entering animation, set to visible
      setTimeout(() => {
        setAnimationPhase("visible")
      }, 500) // 500ms for enter animation

      // Start exit animation before hiding
      setTimeout(
        () => {
          setAnimationPhase("exiting")
        },
        (displayDurationSeconds - 0.5) * 1000,
      ) // Start exit 500ms before end

      // Hide after display duration
      setTimeout(() => {
        setIsVisible(false)
        setAnimationPhase("visible")
      }, displayDurationSeconds * 1000)

      // Move to next blurb for next time
      currentIdx = (currentIdx + 1) % enabledBlurbs.length
    }

    // Show first blurb immediately
    showNextBlurb()

    // Set up interval for subsequent blurbs
    const interval = setInterval(showNextBlurb, intervalMinutes * 60 * 1000)

    return () => clearInterval(interval)
  }, [isEnabled, enabledBlurbs, intervalMinutes, displayDurationSeconds])

  useEffect(() => {
    let manualIndex = 0

    const handleManualBlurb = () => {
      if (enabledBlurbs.length === 0) return
      const nextBlurb = enabledBlurbs[manualIndex % enabledBlurbs.length]
      setCurrentBlurb(nextBlurb)
      setIsVisible(true)
      setAnimationPhase("entering")

      setTimeout(() => {
        setAnimationPhase("visible")
      }, 500)

      setTimeout(
        () => {
          setAnimationPhase("exiting")
        },
        (displayDurationSeconds - 0.5) * 1000,
      )

      setTimeout(() => {
        setIsVisible(false)
        setAnimationPhase("visible")
      }, displayDurationSeconds * 1000)

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
        return "top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
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

  const getAnimationClasses = () => {
    switch (animationPhase) {
      case "entering":
        return "transform -translate-y-full opacity-0 transition-all duration-500 ease-out"
      case "visible":
        return "transform translate-y-0 opacity-100 transition-all duration-500 ease-out"
      case "exiting":
        return "transform -translate-y-full opacity-0 transition-all duration-500 ease-in"
      default:
        return "transform translate-y-0 opacity-100"
    }
  }

  if (!isVisible || !currentBlurb) return null

  return (
    <div className={`absolute ${getPositionClasses()} z-20 max-w-md`}>
      <div
        className={`px-6 py-4 rounded-lg border-2 border-black ${getFontWeight()} text-center ${getAnimationClasses()}`}
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
