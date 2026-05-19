"use client"

import { useState, useEffect } from "react"
import Image from "next/image"

interface RaidCelebrationProps {
  isVisible: boolean
  raiderName?: string
  viewerCount?: number
  onComplete: () => void
}

interface Fawn {
  id: number
  y: number
  delay: number
  duration: number
}

export function RaidCelebration({ isVisible, raiderName, viewerCount, onComplete }: RaidCelebrationProps) {
  const [fawns, setFawns] = useState<Fawn[]>([])
  const [showText, setShowText] = useState(false)

  useEffect(() => {
    if (isVisible) {
      // Create 5 fawns with different vertical positions and timing
      const newFawns: Fawn[] = Array.from({ length: 5 }, (_, i) => ({
        id: i,
        y: 15 + i * 15, // Spread vertically from 15% to 75% of screen height
        delay: i * 0.3, // Stagger the start times
        duration: 4 + Math.random() * 1, // 4-5 seconds to cross screen
      }))
      setFawns(newFawns)
      setShowText(true)

      // Auto-complete after animation finishes
      const maxDuration = Math.max(...newFawns.map(f => (f.delay + f.duration) * 1000))
      const timer = setTimeout(() => {
        onComplete()
        setFawns([])
        setShowText(false)
      }, maxDuration + 1000) // Extra second for text fade

      return () => clearTimeout(timer)
    }
  }, [isVisible, onComplete])

  if (!isVisible || fawns.length === 0) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {/* Raid announcement text */}
      {showText && (
        <div 
          className="absolute top-1/4 left-1/2 -translate-x-1/2 text-center animate-pulse"
          style={{
            animation: "fadeInOut 5s ease-in-out forwards"
          }}
        >
          <div 
            className="text-5xl font-black text-white uppercase tracking-wider"
            style={{
              textShadow: "0 0 20px #ff6b9d, 0 0 40px #ff6b9d, 2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000"
            }}
          >
            RAID INCOMING!
          </div>
          {raiderName && (
            <div 
              className="text-3xl font-bold text-yellow-300 mt-2"
              style={{
                textShadow: "2px 2px 0 #000, -2px -2px 0 #000"
              }}
            >
              {raiderName} {viewerCount ? `with ${viewerCount} viewers!` : "has arrived!"}
            </div>
          )}
        </div>
      )}

      {/* Running fawns */}
      {fawns.map((fawn) => (
        <div
          key={fawn.id}
          className="absolute"
          style={{
            top: `${fawn.y}%`,
            right: "-150px",
            animation: `runAcrossScreen ${fawn.duration}s linear ${fawn.delay}s forwards`,
            transform: "scaleX(-1)", // Flip to face left (running direction)
          }}
        >
          <Image
            src="/images/fawn-run-transparent.gif"
            alt="Running fawn"
            width={120}
            height={120}
            unoptimized
            className="pixelated"
          />
        </div>
      ))}

      <style jsx>{`
        @keyframes runAcrossScreen {
          0% {
            right: -150px;
          }
          100% {
            right: calc(100% + 150px);
          }
        }
        
        @keyframes fadeInOut {
          0% {
            opacity: 0;
            transform: translateX(-50%) scale(0.8);
          }
          15% {
            opacity: 1;
            transform: translateX(-50%) scale(1);
          }
          85% {
            opacity: 1;
            transform: translateX(-50%) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateX(-50%) scale(0.9);
          }
        }
        
        .pixelated {
          image-rendering: pixelated;
        }
      `}</style>
    </div>
  )
}
