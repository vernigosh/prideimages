"use client"

import { useState, useEffect } from "react"

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
      // Create fawns in waves with good spacing for surprise effect
      const newFawns: Fawn[] = [
        // First wave: 1 fawn (scout)
        { id: 0, delay: 0, duration: 6 },
        
        // Second wave: 2 fawns - big gap for surprise
        { id: 1, delay: 5.0, duration: 6 },
        { id: 2, delay: 5.5, duration: 6 },
        
        // Third wave: 9 fawns in sub-groups (3, then 4, then 2)
        // Group of 3
        { id: 3, delay: 11.0, duration: 6 },
        { id: 4, delay: 11.3, duration: 6 },
        { id: 5, delay: 11.7, duration: 6 },
        // Group of 4
        { id: 6, delay: 14.0, duration: 6 },
        { id: 7, delay: 14.2, duration: 6 },
        { id: 8, delay: 14.5, duration: 6 },
        { id: 9, delay: 14.9, duration: 6 },
        // Group of 2
        { id: 10, delay: 17.5, duration: 6 },
        { id: 11, delay: 17.8, duration: 6 },
        
        // Final straggler - fast fawn catching up after 3 second pause
        // Last fawn finishes at 17.8 + 6 = 23.8, so start at ~27
        { id: 12, delay: 27.0, duration: 4 }, // Faster!
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

      // Auto-complete after all fawns have run off screen (last fawn: 27 + 4 = 31 seconds)
      const timer = setTimeout(() => {
        onComplete()
        setFawns([])
        setVisibleFawnIds(new Set())
        setShowText(false)
      }, 32000)

      return () => clearTimeout(timer)
    }
  }, [isVisible, onComplete])

  if (!isVisible || fawns.length === 0) return null

  return (
    <>
      <style>{`
        @keyframes raidRunAcross {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(calc(-100vw - 360px));
          }
        }
        
        @keyframes raidFadeInOut {
          0% {
            opacity: 0;
          }
          15% {
            opacity: 1;
          }
          85% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }
      `}</style>
      <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
        {/* Raid announcement text */}
        {showText && (
          <div 
            className="fixed top-1/4 left-1/2 text-center"
            style={{
              transform: "translateX(-50%)",
              animation: "raidFadeInOut 5s ease-in-out forwards"
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
              width: "360px",
              height: "360px",
              animation: `raidRunAcross ${fawn.duration}s linear ${fawn.delay}s forwards`,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/fawn-run-transparent.gif"
              alt="Running fawn"
              width={360}
              height={360}
              style={{
                imageRendering: "pixelated",
                width: "360px",
                height: "360px",
              }}
            />
          </div>
        ))}
      </div>
    </>
  )
}
