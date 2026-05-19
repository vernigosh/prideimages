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

  // Only show fawns for raids with 5+ viewers
  const showFawns = (viewerCount ?? 0) >= 5

  useEffect(() => {
    if (isVisible) {
      setShowText(true)

      if (showFawns) {
        // Create fawns in waves with good spacing for surprise effect
        const newFawns: Fawn[] = [
          // First wave: 1 fawn (scout)
          { id: 0, delay: 0, duration: 6 },
          
          // Second wave: 2 fawns - big gap for surprise
          { id: 1, delay: 5.0, duration: 6 },
          { id: 2, delay: 5.5, duration: 6 },
          
          // Third wave: 9 fawns in sub-groups (3, then 4, then 2) with irregular spacing
          // Group of 3 - staggered, no side-by-side
          { id: 3, delay: 11.0, duration: 6 },
          { id: 4, delay: 11.5, duration: 6 },
          { id: 5, delay: 12.2, duration: 6 },
          // Group of 4 - natural staggered spacing
          { id: 6, delay: 14.5, duration: 6 },
          { id: 7, delay: 15.0, duration: 6 },
          { id: 8, delay: 15.7, duration: 6 },
          { id: 9, delay: 16.1, duration: 6 },
          // Group of 2 - good gap between them
          { id: 10, delay: 18.5, duration: 6 },
          { id: 11, delay: 19.2, duration: 6 },
          
          // Final straggler - fast fawn catching up after 3 second pause
          // Last fawn finishes at 19.2 + 6 = 25.2, so start at ~28.5
          { id: 12, delay: 28.5, duration: 2.5 }, // Much faster - zooming to catch up!
        ]
        setFawns(newFawns)
        setVisibleFawnIds(new Set(newFawns.map(f => f.id)))

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

        // Auto-complete after all fawns have run off screen (last fawn: 28.5 + 2.5 = 31 seconds)
        const timer = setTimeout(() => {
          onComplete()
          setFawns([])
          setVisibleFawnIds(new Set())
          setShowText(false)
        }, 33000)

        return () => clearTimeout(timer)
      } else {
        // No fawns - just show text for 30 seconds
        const timer = setTimeout(() => {
          onComplete()
          setShowText(false)
        }, 30000)

        return () => clearTimeout(timer)
      }
    }
  }, [isVisible, onComplete, showFawns])

  if (!isVisible || (!showText && fawns.length === 0)) return null

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
          5% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }
        
        @keyframes raidPulse {
          0%, 100% {
            transform: translateX(-50%) scale(1);
          }
          50% {
            transform: translateX(-50%) scale(1.05);
          }
        }
      `}</style>
      <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
        {/* Raid announcement text */}
        {showText && (
          <div 
            className="fixed top-1/2 left-1/2 text-center"
            style={{
              transform: "translateX(-50%) translateY(-50%)",
              animation: "raidFadeInOut 30s ease-in-out forwards, raidPulse 2s ease-in-out infinite",
              fontFamily: "Roboto, sans-serif",
            }}
          >
            <div 
              className="text-5xl font-black text-white uppercase tracking-wider"
              style={{
                textShadow: "3px 3px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000"
              }}
            >
              RAID INCOMING!
            </div>
            {raiderName && (
              <div 
                className="text-3xl font-bold mt-2"
                style={{
                  color: "#ffd2e9",
                  textShadow: "3px 3px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000"
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
