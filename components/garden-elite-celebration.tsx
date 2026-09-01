"use client"

import { useEffect, useState } from "react"
import { NotificationCard } from "@/components/notification-card"

interface GardenEliteCelebrationProps {
  username: string
  isVisible: boolean
  onHide: () => void
}

export function GardenEliteCelebration({ username, isVisible, onHide }: GardenEliteCelebrationProps) {
  const [showCelebration, setShowCelebration] = useState(false)

  useEffect(() => {
    if (isVisible) {
      setShowCelebration(true)

      const timer = setTimeout(() => {
        setShowCelebration(false)
        setTimeout(() => {
          onHide()
        }, 500)
      }, 43000) // 43 seconds display time

      return () => clearTimeout(timer)
    } else {
      setShowCelebration(false)
    }
  }, [isVisible])

  if (!isVisible) return null

  const flowers = Array.from({ length: 22 }, (_, i) => ({
    id: i,
    delay: Math.random() * 5,
    duration: 8 + Math.random() * 4,
    startX: Math.random() * 100,
  }))

  return (
    <>
      <NotificationCard
        visible={showCelebration}
        fadeMs={500}
        media={
          <img src="/images/pixelrainbow.gif" alt="Rainbow" style={{ width: "260px", height: "auto" }} />
        }
        lines={[
          { text: username.toUpperCase(), size: "display" },
          { text: "PICKED 40 FLOWERS!", size: "title" },
          { text: "GARDEN LEGEND!", size: "body", color: "#7dd3fc" },
        ]}
      />

      {/* Floating flowers stay pinned to the screen edges, framing the card. */}
      <div
        className="fixed inset-0 z-40 pointer-events-none overflow-hidden transition-opacity duration-500"
        style={{ opacity: showCelebration ? 1 : 0 }}
      >
      {/* Left side flowers */}
      {flowers.slice(0, 11).map((flower, i) => (
        <div
          key={`left-${flower.id}`}
          className="absolute text-4xl animate-float"
          style={{
            left: `${2 + (i % 2) * 5}%`,
            top: `${5 + i * 8}%`,
            animationDelay: `${flower.delay}s`,
            animationDuration: `${flower.duration}s`,
          }}
        >
          {i % 3 === 0 ? "⭐" : i % 2 === 0 ? "🌸" : "🌺"}
        </div>
      ))}
      {/* Right side flowers */}
      {flowers.slice(11).map((flower, i) => (
        <div
          key={`right-${flower.id}`}
          className="absolute text-4xl animate-float"
          style={{
            right: `${2 + (i % 2) * 5}%`,
            top: `${5 + i * 8}%`,
            animationDelay: `${flower.delay}s`,
            animationDuration: `${flower.duration}s`,
          }}
        >
          {i % 3 === 0 ? "⭐" : i % 2 === 0 ? "🌺" : "🌸"}
        </div>
      ))}
      </div>
    </>
  )
}
