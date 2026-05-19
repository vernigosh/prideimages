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
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatTime = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      timeZone: "Europe/Rome",
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
          {formatTime(currentTime)} ROME, ITALY
        </div>
      </div>
    </div>
  )
}
