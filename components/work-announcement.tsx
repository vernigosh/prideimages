"use client"

import { useState, useEffect } from "react"

export function WorkAnnouncement() {
  const [message, setMessage] = useState<string | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const showAnnouncement = (text: string) => {
      setMessage(text)
      setIsVisible(true)
      
      // Hide after 8 seconds
      setTimeout(() => {
        setIsVisible(false)
        setTimeout(() => setMessage(null), 500) // Clear after fade out
      }, 8000)
    }

    const handleWorkStart = (e: CustomEvent) => {
      showAnnouncement("FOCUS TIME! 25 minutes of productivity starts now!")
    }

    const handleBreakStart = (e: CustomEvent) => {
      showAnnouncement("BREAK TIME! Take 5 minutes to rest and recharge!")
    }

    window.addEventListener("workCycleStart", handleWorkStart as EventListener)
    window.addEventListener("breakStart", handleBreakStart as EventListener)

    return () => {
      window.removeEventListener("workCycleStart", handleWorkStart as EventListener)
      window.removeEventListener("breakStart", handleBreakStart as EventListener)
    }
  }, [])

  if (!message) return null

  return (
    <div 
      className={`fixed top-8 left-1/2 -translate-x-1/2 z-40 transition-all duration-500 ease-out ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-8"
      }`}
    >
      <div 
        className="px-8 py-4 rounded-xl font-black text-2xl text-white text-center"
        style={{
          background: "linear-gradient(135deg, rgba(147, 51, 234, 0.95) 0%, rgba(109, 40, 217, 0.95) 100%)",
          boxShadow: "0 4px 20px rgba(147, 51, 234, 0.5)",
          textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
        }}
      >
        {message}
      </div>
    </div>
  )
}
