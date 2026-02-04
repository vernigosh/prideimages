"use client"

import { useEffect, useState, useRef } from "react"
import type { StreamCredits } from "./streamelements-service"

interface Guardian {
  id: string
  username: string
  achieved_at: string
  flower_count: number
}

interface StreamCreditsProps {
  isVisible: boolean
  onHide: () => void
  streamCredits: StreamCredits
  flowerLegends: Array<{ username: string; count: number }>
}

export function StreamCreditsComponent({
  isVisible,
  onHide,
  streamCredits,
  flowerLegends,
}: StreamCreditsProps) {
  const [guardians, setGuardians] = useState<Guardian[]>([])
  const [scrollPosition, setScrollPosition] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // Fetch all-time guardians
  useEffect(() => {
    if (isVisible) {
      fetch("/api/guardians")
        .then((res) => res.json())
        .then((data) => {
          if (data.guardians) {
            setGuardians(data.guardians)
          }
        })
        .catch((err) => console.error("Failed to fetch guardians:", err))
    }
  }, [isVisible])

  // Auto-scroll credits
  useEffect(() => {
    if (!isVisible) {
      setScrollPosition(0)
      return
    }

    const interval = setInterval(() => {
      setScrollPosition((prev) => prev + 2)
    }, 50)

    return () => clearInterval(interval)
  }, [isVisible])

  // Auto-hide after credits finish scrolling
  useEffect(() => {
    if (!isVisible || !containerRef.current) return

    const contentHeight = containerRef.current.scrollHeight
    const containerHeight = 384 // h-96 = 384px

    if (scrollPosition > contentHeight + containerHeight) {
      onHide()
    }
  }, [scrollPosition, isVisible, onHide])

  if (!isVisible) return null

  const hasFollowers = streamCredits.followers.length > 0
  const hasTippers = streamCredits.tippers.length > 0
  const hasCheerers = streamCredits.cheerers.length > 0
  const hasRaiders = streamCredits.raiders.length > 0
  const hasLegends = flowerLegends.length > 0
  const hasGuardians = guardians.length > 0

  return (
    <div className="fixed left-8 top-1/2 -translate-y-1/2 z-[9998] w-80 h-96 bg-black/50 rounded-xl overflow-hidden">
      <div
        ref={containerRef}
        className="absolute inset-x-0 text-center px-4"
        style={{ transform: `translateY(${384 - scrollPosition * 0.8}px)` }}
      >
        {/* Title */}
        <div className="mb-8">
          <h1
            className="text-2xl font-bold mb-2"
            style={{
              background: "linear-gradient(135deg, #ffd700 0%, #ffec80 50%, #ffd700 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            STREAM CREDITS
          </h1>
          <p className="text-sm text-white/60">Thank you for watching!</p>
        </div>

        {/* New Followers */}
        {hasFollowers && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-pink-400 mb-3">New Followers</h2>
            <div className="space-y-1">
              {streamCredits.followers.map((follower, i) => (
                <p key={i} className="text-sm text-white/90">
                  {follower}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Tippers */}
        {hasTippers && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-green-400 mb-3">Supporters</h2>
            <div className="space-y-1">
              {streamCredits.tippers
                .sort((a, b) => b.amount - a.amount)
                .map((tipper, i) => (
                  <p key={i} className="text-sm text-white/90">
                    {tipper.name} - ${tipper.amount.toFixed(2)}
                  </p>
                ))}
            </div>
          </div>
        )}

        {/* Cheerers */}
        {hasCheerers && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-purple-400 mb-3">Bit Cheerers</h2>
            <div className="space-y-1">
              {streamCredits.cheerers
                .sort((a, b) => b.bits - a.bits)
                .map((cheerer, i) => (
                  <p key={i} className="text-sm text-white/90">
                    {cheerer.name} - {cheerer.bits} bits
                  </p>
                ))}
            </div>
          </div>
        )}

        {/* Raiders */}
        {hasRaiders && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-orange-400 mb-3">Raiders</h2>
            <div className="space-y-1">
              {streamCredits.raiders.map((raider, i) => (
                <p key={i} className="text-sm text-white/90">
                  {raider.name} {raider.viewers > 0 && `(${raider.viewers})`}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Flower Legends (10+ flowers this stream) */}
        {hasLegends && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-lime-400 mb-3">Flower Legends</h2>
            <p className="text-xs text-white/50 mb-2">10+ flowers this stream</p>
            <div className="space-y-1">
              {flowerLegends
                .sort((a, b) => b.count - a.count)
                .map((legend, i) => (
                  <p key={i} className="text-sm text-white/90">
                    {legend.username} - {legend.count}
                  </p>
                ))}
            </div>
          </div>
        )}

        {/* All-Time Guild of Guardians */}
        {hasGuardians && (
          <div className="mb-8">
            <h2
              className="text-xl font-bold mb-3"
              style={{
                background: "linear-gradient(135deg, #ffd700 0%, #ffec80 50%, #ffd700 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Guild of Guardians
            </h2>
            <p className="text-xs text-white/50 mb-2">All-Time (50+ flowers)</p>
            <div className="space-y-1">
              {guardians.map((guardian) => (
                <p key={guardian.id} className="text-sm text-white/90">
                  {guardian.username}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* End Credits */}
        <div className="mt-12 mb-16">
          <p className="text-base text-white/80 mb-2">See you next stream!</p>
        </div>
      </div>

      {/* Skip button */}
      <button
        onClick={onHide}
        className="absolute bottom-2 right-2 px-3 py-1 bg-white/20 hover:bg-white/30 text-white text-xs rounded transition-colors"
      >
        Skip
      </button>
    </div>
  )
}
