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
  delay: number
  duration: number
}

export function RaidCelebration({ isVisible, raiderName, viewerCount, onComplete }: RaidCelebrationProps) {
  const [fawns, setFawns] = useState<Fawn[]>([])
  const [showText, setShowText] = useState(false)
  const [visibleFawnIds, setVisibleFawnIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (isVisible) {
      // Create fawns in waves: 1 first, then 2, then 5 with irregular spacing
      // Total animation ~20 seconds
      const newFawns: Fawn[] = [
        // First wave: 1 fawn (scout)
        { id: 0, delay: 0, duration: 6 },
        // Second wave: 2 fawns - big gap for surprise
        { id: 1, delay: 5.0, duration: 6 },
        { id: 2, delay: 5.5, duration: 6 },
        // Third wave: 5 fawns - even bigger gap, irregular spacing
        { id: 3, delay: 11.0, duration: 6 },
        { id: 4, delay: 11.4, duration: 6 },
        { id: 5, delay: 12.0, duration: 6 },
        { id: 6, delay: 12.3, duration: 6 },
        { id: 7, delay: 13.0, duration: 6 },
      ]
      setFawns(newFawns)
      setVisibleFawnIds(new Set(newFawns.map(f => f.id)))
      setShowText(true)

      // Set up individual timers to hide each fawn after it runs off screen
      newFawns.forEach((fawn) => {
        setTimeout(() => {
          setVisibleFawnIds(prev => {
            const next = new Set(prev)
            next.delete(fawn.id)
            return next
          })
        }, (fawn.delay + fawn.duration) * 1000)
      })

      // Auto-complete after all fawns have run off screen
      const timer = setTimeout(() => {
        onComplete()
        setFawns([])
        setVisibleFawnIds(new Set())
        setShowText(false)
      }, 20000) // 20 seconds total

      return () => clearTimeout(timer)
    }
  }, [isVisible, onComplete])

  if (!isVisible || fawns.length === 0) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {/* Raid announcement text */}
      {showText && (
        <div 
          className="fixed top-1/4 left-1/2 -translate-x-1/2 text-center"
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

      {/* Running fawns - only render if still visible */}
      {fawns.filter(fawn => visibleFawnIds.has(fawn.id)).map((fawn) => (
        <div
          key={fawn.id}
          className="fixed"
          style={{
            bottom: "48px",
            right: "-360px",
            animation: `runAcrossScreen ${fawn.duration}s linear ${fawn.delay}s forwards`,
          }}
        >
          <Image
            src="/images/fawn-run-transparent.gif"
            alt="Running fawn"
            width={360}
            height={360}
            unoptimized
            className="pixelated"
          />
        </div>
      ))}

      <style jsx>{`
        @keyframes runAcrossScreen {
          0% {
            right: -360px;
          }
          100% {
            right: calc(100% + 360px);
          }
        }
        
        @keyframes fadeInOut {
          0% {
            opacity: 0;
            transform: translateX(-50%);
          }
          15% {
            opacity: 1;
            transform: translateX(-50%);
          }
          85% {
            opacity: 1;
            transform: translateX(-50%);
          }
          100% {
            opacity: 0;
            transform: translateX(-50%);
          }
        }
        
        .pixelated {
          image-rendering: pixelated;
        }
      `}</style>
    </div>
  )
}
