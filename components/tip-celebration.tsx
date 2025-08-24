"use client"

import { useEffect, useState } from "react"

interface TipCelebrationProps {
  username: string
  amount: number
  message?: string
}

export function TipCelebration() {
  const [celebration, setCelebration] = useState<TipCelebrationProps | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleTipEvent = (event: CustomEvent) => {
      const { username, amount, message } = event.detail
      console.log("[v0] New tip celebration:", { username, amount, message })

      setCelebration({ username, amount, message })
      setIsVisible(true)

      // Hide after 45 seconds
      setTimeout(() => {
        setIsVisible(false)
        setTimeout(() => setCelebration(null), 500) // Allow fade out animation
      }, 45000)
    }

    window.addEventListener("streamelements-tip", handleTipEvent as EventListener)

    return () => {
      window.removeEventListener("streamelements-tip", handleTipEvent as EventListener)
    }
  }, [])

  if (!celebration) return null

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center pointer-events-none transition-all duration-500 ${
        isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
      }`}
    >
      {/* Background overlay with celebration colors */}
      <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 via-lime-500/20 to-pink-500/20 animate-pulse" />

      {/* Main celebration banner */}
      <div className="relative bg-gradient-to-r from-pink-500 to-lime-500 text-white px-12 py-8 rounded-2xl shadow-2xl border-4 border-white/30 animate-bounce">
        <div className="text-center space-y-4">
          {/* Thank you message */}
          <div className="text-6xl font-bold font-sans animate-pulse">THANK YOU!</div>

          {/* Username */}
          <div className="text-4xl font-bold font-sans">{celebration.username}</div>

          {/* Amount */}
          <div className="text-5xl font-bold font-sans text-yellow-300">${celebration.amount.toFixed(2)}</div>

          {/* Message if provided */}
          {celebration.message && (
            <div className="text-2xl font-bold font-sans italic max-w-2xl">"{celebration.message}"</div>
          )}

          {/* Decorative elements */}
          <div className="flex justify-center space-x-4 text-4xl animate-bounce">
            <span className="animate-pulse">🎉</span>
            <span className="animate-pulse delay-100">✨</span>
            <span className="animate-pulse delay-200">🎊</span>
            <span className="animate-pulse delay-300">✨</span>
            <span className="animate-pulse delay-400">🎉</span>
          </div>
        </div>
      </div>

      {/* Floating particles effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-4 h-4 bg-yellow-400 rounded-full animate-ping"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>
    </div>
  )
}
