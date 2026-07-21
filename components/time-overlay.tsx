"use client"

import { useState, useEffect } from "react"
import { OVERLAY_FONT_STANDARD, OVERLAY_LINE_HEIGHT_STANDARD, OVERLAY_WEIGHT_LABEL } from "@/lib/overlay-typography"

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
      {/* Center ROME horizontally beneath the time. The outer container position,
          offsets, and sizes are unchanged — only the internal alignment differs.
          width:fit-content keeps the block sized to the widest line (the time). */}
      <div className="flex w-fit flex-col items-center text-center">
        {/* Time: display size */}
        <span
          className={`${getFontWeight()} font-sans tabular-nums`}
          style={{ fontSize: `${fontSize}px`, lineHeight: 1, letterSpacing: 0, color: textColor, textShadow }}
        >
          {formatTime(currentTime)}
        </span>
        {/* Location: standard size */}
        <span
          className="font-sans uppercase"
          style={{
            fontSize: `${OVERLAY_FONT_STANDARD}px`,
            lineHeight: OVERLAY_LINE_HEIGHT_STANDARD,
            letterSpacing: 0,
            fontWeight: OVERLAY_WEIGHT_LABEL,
            color: textColor,
            textShadow,
          }}
        >
          Rome
        </span>
      </div>
    </div>
  )
}
