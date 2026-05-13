"use client"

import { useState, useEffect } from "react"

interface TimeOverlayProps {
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right"
  timeZone: string
  fontSize: number
  showSeconds: boolean
  textColor: string
  shadowColor: string
  shadowSize: number
  fontWeight: "normal" | "bold" | "black"
}

// Alternating time zones - switches every 45 seconds
const ALTERNATING_TIMEZONES = [
  { zone: "Europe/Rome", name: "ROME, ITALY" },
  { zone: "America/New_York", name: "NEW YORK" },
]
const SWITCH_INTERVAL_MS = 45 * 1000

export function TimeOverlay({
  position,
  timeZone,
  fontSize,
  showSeconds,
  textColor,
  shadowColor,
  shadowSize,
  fontWeight,
}: TimeOverlayProps) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [activeTimezoneIndex, setActiveTimezoneIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Switch between Rome and New York every 45 seconds
  useEffect(() => {
    const switchTimer = setInterval(() => {
      setActiveTimezoneIndex((prev) => (prev + 1) % ALTERNATING_TIMEZONES.length)
    }, SWITCH_INTERVAL_MS)

    return () => clearInterval(switchTimer)
  }, [])

  // Get the currently active timezone
  const activeTimezone = ALTERNATING_TIMEZONES[activeTimezoneIndex]

  const formatTime = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      timeZone: activeTimezone.zone,
      hour: "2-digit",
      minute: "2-digit",
      ...(showSeconds && { second: "2-digit" }),
      hour12: false, // Always use 24-hour format
    }
    return date.toLocaleTimeString("en-US", options)
  }

  const getPositionClasses = () => {
    switch (position) {
      case "top-left":
        return "top-8 left-8"
      case "top-right":
        return "top-8 right-32"
      case "bottom-left":
        return "bottom-8 left-8"
      case "bottom-right":
        return "bottom-8 right-8"
      default:
        return "top-8 right-8"
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

  return (
    <div className={`absolute ${getPositionClasses()} z-10`}>
      <div className="text-center">
        <div
          className={`${getFontWeight()} font-sans tracking-wider uppercase`}
          style={{
            fontSize: `${fontSize}px`,
            color: textColor,
            textShadow: shadowSize > 0 ? `${shadowSize}px ${shadowSize}px ${shadowSize * 2}px ${shadowColor}` : "none",
          }}
        >
          {formatTime(currentTime)} {activeTimezone.name}
        </div>
      </div>
    </div>
  )
}
