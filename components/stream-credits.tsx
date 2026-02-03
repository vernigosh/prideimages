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

export function StreamCreditsOverlay({
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
      setScrollPosition((prev) => prev + 1)
    }, 50)

    return () => clearInterval(interval)
  }, [isVisible])

  // Auto-hide after credits finish scrolling
  useEffect(() => {
    if (!isVisible || !containerRef.current) return

    const contentHeight = containerRef.current.scrollHeight
    const viewportHeight = window.innerHeight

    if (scrollPosition > contentHeight + viewportHeight) {
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
    <div className="fixed inset-0 z-[9998] bg-black/90 overflow-hidden">
      <div
        ref={containerRef}
        className="absolute inset-x-0 text-center"
        style={{ transform: `translateY(${100 - scrollPosition * 0.5}vh)` }}
      >
        {/* Title */}
        <div className="mb-24">
          <h1
            className="text-7xl font-bold mb-4"
            style={{
              background: "linear-gradient(135deg, #ffd700 0%, #ffec80 50%, #ffd700 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            STREAM CREDITS
          </h1>
          <p className="text-2xl text-white/60">Thank you for watching!</p>
        </div>

        {/* New Followers */}
        {hasFollowers && (
          <div className="mb-20">
            <h2 className="text-4xl font-bold text-pink-400 mb-8">New Followers</h2>
            <div className="space-y-2">
              {streamCredits.followers.map((follower, i) => (
                <p key={i} className="text-2xl text-white/90">
                  {follower}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Tippers */}
        {hasTippers && (
          <div className="mb-20">
            <h2 className="text-4xl font-bold text-green-400 mb-8">Supporters</h2>
            <div className="space-y-2">
              {streamCredits.tippers
                .sort((a, b) => b.amount - a.amount)
                .map((tipper, i) => (
                  <p key={i} className="text-2xl text-white/90">
                    {tipper.name} - ${tipper.amount.toFixed(2)}
                  </p>
                ))}
            </div>
          </div>
        )}

        {/* Cheerers */}
        {hasCheerers && (
          <div className="mb-20">
            <h2 className="text-4xl font-bold text-purple-400 mb-8">Bit Cheerers</h2>
            <div className="space-y-2">
              {streamCredits.cheerers
                .sort((a, b) => b.bits - a.bits)
                .map((cheerer, i) => (
                  <p key={i} className="text-2xl text-white/90">
                    {cheerer.name} - {cheerer.bits} bits
                  </p>
                ))}
            </div>
          </div>
        )}

        {/* Raiders */}
        {hasRaiders && (
          <div className="mb-20">
            <h2 className="text-4xl font-bold text-orange-400 mb-8">Raiders</h2>
            <div className="space-y-2">
              {streamCredits.raiders.map((raider, i) => (
                <p key={i} className="text-2xl text-white/90">
                  {raider.name} {raider.viewers > 0 && `(${raider.viewers} viewers)`}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Flower Legends (10+ flowers this stream) */}
        {hasLegends && (
          <div className="mb-20">
            <h2 className="text-4xl font-bold text-lime-400 mb-8">Flower Legends</h2>
            <p className="text-lg text-white/50 mb-6">Picked 10+ flowers this stream</p>
            <div className="space-y-2">
              {flowerLegends
                .sort((a, b) => b.count - a.count)
                .map((legend, i) => (
                  <p key={i} className="text-2xl text-white/90">
                    {legend.username} - {legend.count} flowers
                  </p>
                ))}
            </div>
          </div>
        )}

        {/* All-Time Guild of Guardians */}
        {hasGuardians && (
          <div className="mb-20">
            <h2
              className="text-5xl font-bold mb-8"
              style={{
                background: "linear-gradient(135deg, #ffd700 0%, #ffec80 50%, #ffd700 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Guild of Guardians
            </h2>
            <p className="text-lg text-white/50 mb-6">All-Time Nature's Guardians (50+ flowers)</p>
            <div className="space-y-2">
              {guardians.map((guardian, i) => (
                <p key={guardian.id} className="text-2xl text-white/90">
                  {guardian.username}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* End Credits */}
        <div className="mt-32 mb-48">
          <p className="text-3xl text-white/80 mb-4">See you next stream!</p>
          <p className="text-xl text-white/40">vernigosh</p>
        </div>
      </div>

      {/* Skip button */}
      <button
        onClick={onHide}
        className="fixed bottom-8 right-8 px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
      >
        Skip Credits
      </button>
    </div>
  )
}

export { StreamCreditsOverlay as StreamCredits }
