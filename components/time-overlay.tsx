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
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      ...(showSeconds && { second: "2-digit" }),
      hour12: false, // Always use 24-hour format
    }
    return date.toLocaleTimeString("en-US", options)
  }

  const getCityName = (tz: string) => {
    const cityMap: { [key: string]: string } = {
      "America/New_York": "NEW YORK",
      "America/Chicago": "CHICAGO",
      "America/Denver": "DENVER",
      "America/Los_Angeles": "LOS ANGELES",
      "America/Phoenix": "PHOENIX",
      "America/Anchorage": "ANCHORAGE",
      "Pacific/Honolulu": "HONOLULU",
      UTC: "UTC",
      "Europe/London": "LONDON",
      "Europe/Paris": "PARIS",
      "Europe/Rome": "ROME, ITALY",
      "Europe/Berlin": "BERLIN",
      "Europe/Madrid": "MADRID",
      "Europe/Amsterdam": "AMSTERDAM",
      "Europe/Stockholm": "STOCKHOLM",
      "Europe/Moscow": "MOSCOW",
      "Asia/Tokyo": "TOKYO",
      "Asia/Shanghai": "SHANGHAI",
      "Asia/Seoul": "SEOUL",
      "Asia/Mumbai": "MUMBAI",
      "Asia/Dubai": "DUBAI",
      "Australia/Sydney": "SYDNEY",
      "Australia/Melbourne": "MELBOURNE",
      "Australia/Perth": "PERTH",
      "Pacific/Auckland": "AUCKLAND",
    }
    return cityMap[tz] || tz.split("/").pop()?.replace("_", " ").toUpperCase()
  }

  const getPositionClasses = () => {
    switch (position) {
      case "top-left":
        return "top-8 -left-12"
      case "top-right":
        return "top-8 right-8"
      case "bottom-left":
        return "bottom-8 -left-12"
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
          {formatTime(currentTime)} {getCityName(timeZone)}
        </div>
      </div>
    </div>
  )
}
