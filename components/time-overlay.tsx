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
  const [currentTime, setCurrentTime] = useState<Date | null>(null)

  useEffect(() => {
    // Set initial time after mount to avoid SSR/CSR hydration mismatch.
    setCurrentTime(new Date())
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatTime = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      timeZone: timeZone || "Europe/Rome",
      hour: "2-digit",
      minute: "2-digit",
      ...(showSeconds && { second: "2-digit" }),
      hour12: false,
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

  if (!currentTime) return null

  const textShadow = shadowSize > 0 ? `${shadowSize}px ${shadowSize}px ${shadowSize * 2}px ${shadowColor}` : "none"

  return (
    <div className={`absolute ${getPositionClasses()} z-10`}>
      <div className="flex flex-col items-center leading-none">
        <span
          className={`${getFontWeight()} font-sans tabular-nums tracking-tight`}
          style={{ fontSize: `${fontSize}px`, color: textColor, textShadow }}
        >
          {formatTime(currentTime)}
        </span>
        <span
          className="font-sans font-semibold uppercase tracking-[0.35em]"
          style={{
            fontSize: `${Math.max(10, Math.round(fontSize * 0.28))}px`,
            color: textColor,
            textShadow,
            marginTop: `${Math.round(fontSize * 0.08)}px`,
            marginRight: `-0.35em`,
          }}
        >
          Rome
        </span>
      </div>
    </div>
  )
}
