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
    const containerHeight = 600

    if (scrollPosition > contentHeight + containerHeight) {
      onHide()
    }
  }, [scrollPosition, isVisible, onHide])

  if (!isVisible) return null

  const hasFollowers = streamCredits.followers.length > 0
  const hasSubscribers = streamCredits.subscribers.length > 0
  const hasGiftSubs = streamCredits.giftSubs.length > 0
  const hasTippers = streamCredits.tippers.length > 0
  const hasCheerers = streamCredits.cheerers.length > 0
  const hasRaiders = streamCredits.raiders.length > 0
  const hasLegends = flowerLegends.length > 0
  const hasGuardians = guardians.length > 0

  return (
    <div className="fixed left-8 top-1/2 -translate-y-1/2 z-[9998] w-[500px] h-[600px] bg-black/50 rounded-xl overflow-hidden">
      <div
        ref={containerRef}
        className="absolute inset-x-0 text-center px-6"
        style={{ transform: `translateY(${600 - scrollPosition * 0.8}px)` }}
      >
        {/* Title */}
        <div className="mb-10">
          <h1
            className="text-5xl font-bold mb-3"
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
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-pink-400 mb-4">New Followers</h2>
            <div className="space-y-2">
              {streamCredits.followers.map((follower, i) => (
                <p key={i} className="text-2xl text-white/90">
                  {follower}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Gift Sub Bombers */}
        {hasGiftSubs && (
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-fuchsia-400 mb-4">Gift Sub Bombers</h2>
            <div className="space-y-2">
              {streamCredits.giftSubs
                .sort((a, b) => b.count - a.count)
                .map((gifter, i) => (
                  <p key={i} className="text-2xl text-white/90">
                    {gifter.gifter} - {gifter.count} gift {gifter.count === 1 ? "sub" : "subs"}
                  </p>
                ))}
            </div>
          </div>
        )}

        {/* Subscribers */}
        {hasSubscribers && (
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-blue-400 mb-4">Subscribers</h2>
            <div className="space-y-2">
              {streamCredits.subscribers
                .sort((a, b) => b.months - a.months)
                .map((sub, i) => (
                  <p key={i} className="text-2xl text-white/90">
                    {sub.name}
                    {sub.months > 1 ? ` (${sub.months} months)` : ""}
                    {sub.gifted && sub.gifter ? ` - gifted by ${sub.gifter}` : ""}
                  </p>
                ))}
            </div>
          </div>
        )}

        {/* Tippers */}
        {hasTippers && (
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-green-400 mb-4">Supporters</h2>
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
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-purple-400 mb-4">Bit Cheerers</h2>
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
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-orange-400 mb-4">Raiders</h2>
            <div className="space-y-2">
              {streamCredits.raiders.map((raider, i) => (
                <p key={i} className="text-2xl text-white/90">
                  {raider.name} {raider.viewers > 0 && `(${raider.viewers})`}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Flower Legends (10+ flowers this stream) */}
        {hasLegends && (
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-lime-400 mb-4">Flower Legends</h2>
            <p className="text-xl text-white/50 mb-3">10+ flowers this stream</p>
            <div className="space-y-2">
              {flowerLegends
                .sort((a, b) => b.count - a.count)
                .map((legend, i) => (
                  <p key={i} className="text-2xl text-white/90">
                    {legend.username} - {legend.count}
                  </p>
                ))}
            </div>
          </div>
        )}

        {/* All-Time Guild of Guardians */}
        {hasGuardians && (
          <div className="mb-10">
            <h2
              className="text-3xl font-bold mb-4"
              style={{
                background: "linear-gradient(135deg, #ffd700 0%, #ffec80 50%, #ffd700 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Guild of Guardians
            </h2>
            <p className="text-xl text-white/50 mb-3">All-Time (50+ flowers)</p>
            <div className="space-y-2">
              {guardians.map((guardian) => (
                <p key={guardian.id} className="text-2xl text-white/90">
                  {guardian.username}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* End Credits */}
        <div className="mt-16 mb-20">
          <p className="text-3xl text-white/80 mb-2">See you next stream!</p>
        </div>
      </div>

      {/* Skip button */}
      <button
        onClick={onHide}
        className="absolute bottom-3 right-3 px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-lg rounded transition-colors"
      >
        Skip
      </button>
    </div>
  )
}
