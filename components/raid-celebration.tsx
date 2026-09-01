"use client"

import { useState, useEffect, useRef } from "react"
import { NotificationCard } from "@/components/notification-card"

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

  // Held in a ref so the parent passing a fresh inline arrow on every render
  // cannot re-trigger the effect below and respawn the herd mid-raid.
  const onCompleteRef = useRef(onComplete)
  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  // Only show fawns for raids with 5+ viewers
  const showFawns = (viewerCount ?? 0) >= 5

  useEffect(() => {
    if (isVisible) {
      setShowText(true)
      // Every timer for this run, so cleanup can cancel all of them. Previously
      // only the completion timer was cleared and the per-fawn hide timers leaked.
      const timers: ReturnType<typeof setTimeout>[] = []

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
          timers.push(
            setTimeout(() => {
              setVisibleFawnIds(prev => {
                const next = new Set(prev)
                next.delete(fawn.id)
                return next
              })
            }, (fawn.delay + fawn.duration) * 1000),
          )
        })

        // Auto-complete after all fawns have run off screen (last fawn: 28.5 + 2.5 = 31 seconds)
        timers.push(
          setTimeout(() => {
            onCompleteRef.current()
            setFawns([])
            setVisibleFawnIds(new Set())
            setShowText(false)
          }, 33000),
        )
      } else {
        // No fawns - just show text for 30 seconds
        timers.push(
          setTimeout(() => {
            onCompleteRef.current()
            setShowText(false)
          }, 30000),
        )
      }

      return () => timers.forEach(clearTimeout)
    }
  }, [isVisible, showFawns])

  if (!isVisible || (!showText && fawns.length === 0)) return null

  return (
    <>
      <style>{`
        @keyframes raidRunAcross {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(calc(-100vw - 270px));
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
      `}</style>
      <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
        {/* Announcement text sits in the shared notification box. The fawns keep
            running full-screen along the bottom — that animation is the celebration. */}
        {showText && (
          <NotificationCard
            visible={showText}
            zIndex={9999}
            cardAnimation="raidFadeInOut 30s ease-in-out forwards"
            lines={[
              { text: "RAID INCOMING!", size: "display" },
              ...(raiderName
                ? [
                    {
                      text: `${raiderName} ${viewerCount ? `with ${viewerCount} viewers!` : "has arrived!"}`,
                      size: "title" as const,
                      color: "#ffd2e9",
                    },
                  ]
                : []),
            ]}
          />
        )}

        {/* Running fawns - only render if still visible */}
        {fawns.filter(fawn => visibleFawnIds.has(fawn.id)).map((fawn) => (
          <div
            key={fawn.id}
            className="fixed"
            style={{
              bottom: "0px",
              right: "-270px",
              width: "270px",
              height: "270px",
              animation: `raidRunAcross ${fawn.duration}s linear ${fawn.delay}s forwards`,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/fawn-run-transparent.gif"
              alt="Running fawn"
              width={270}
              height={270}
              style={{
                imageRendering: "pixelated",
                width: "270px",
                height: "270px",
              }}
            />
          </div>
        ))}
      </div>
    </>
  )
}
