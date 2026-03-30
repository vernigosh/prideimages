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

  // Loop credits when they finish scrolling
  useEffect(() => {
    if (!isVisible || !containerRef.current) return

    const contentHeight = containerRef.current.scrollHeight
    const containerHeight = 700

    // Reset to beginning when credits finish scrolling (loop)
    if (scrollPosition > contentHeight + containerHeight) {
      setScrollPosition(0)
    }
  }, [scrollPosition, isVisible])

  if (!isVisible) return null

  const hasFollowers = streamCredits.followers.length > 0
  const hasSubscribers = streamCredits.subscribers.length > 0
  const hasGiftSubs = streamCredits.giftSubs.length > 0
  const hasTippers = streamCredits.tippers.length > 0
  const hasCheerers = streamCredits.cheerers.length > 0
  const hasRaiders = streamCredits.raiders.length > 0
  const hasMerchBuyers = streamCredits.merchBuyers?.length > 0
  const hasCharityDonors = streamCredits.charityDonors?.length > 0
  const hasRedeemers = streamCredits.redeemers?.length > 0
  const hasLegends = flowerLegends.length > 0
  const hasGuardians = guardians.length > 0

  return (
    <div className="fixed left-8 top-1/2 -translate-y-1/2 z-[9998] w-[650px] h-[700px] bg-black/80 rounded-xl overflow-hidden">
      <div
        ref={containerRef}
        className="absolute inset-x-0 text-center px-8"
        style={{ transform: `translateY(${700 - scrollPosition * 0.8}px)` }}
      >
        {/* Title */}
        <div className="mb-12">
          <h1 className="text-6xl font-bold mb-4 text-white">
            STREAM CREDITS
          </h1>
          <p className="text-3xl text-white">Thank you for watching!</p>
          <p className="text-3xl text-white mt-2">Shout out to these legends for today&apos;s stream!</p>
        </div>

        {/* New Followers */}
        {hasFollowers && (
          <div className="mb-12">
            <h2 className="text-5xl font-bold text-white mb-6">New Follows</h2>
            <div className="space-y-3">
              {streamCredits.followers.map((follower, i) => (
                <p key={i} className="text-4xl text-white">
                  {follower}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Subscribers - only non-gifted subs */}
        {hasSubscribers && streamCredits.subscribers.filter(s => !s.gifted).length > 0 && (
          <div className="mb-12">
            <h2 className="text-5xl font-bold text-white mb-6">Subs</h2>
            <div className="space-y-3">
              {streamCredits.subscribers
                .filter((sub) => !sub.gifted)
                .sort((a, b) => b.months - a.months)
                .map((sub, i) => (
                  <p key={i} className="text-4xl text-white">
                    {sub.name}
                    {sub.months > 1 ? ` (${sub.months} months)` : " (New!)"}
                  </p>
                ))}
            </div>
          </div>
        )}

        {/* Sub Gifters */}
        {hasGiftSubs && (
          <div className="mb-12">
            <h2 className="text-5xl font-bold text-white mb-6">Sub Gifters</h2>
            <div className="space-y-3">
              {streamCredits.giftSubs
                .sort((a, b) => b.count - a.count)
                .map((gifter, i) => (
                  <p key={i} className="text-4xl text-white">
                    {gifter.gifter} - {gifter.count} gift {gifter.count === 1 ? "sub" : "subs"}
                  </p>
                ))}
            </div>
          </div>
        )}

        {/* Tippers */}
        {hasTippers && (
          <div className="mb-12">
            <h2 className="text-5xl font-bold text-white mb-6">Tips</h2>
            <div className="space-y-3">
              {streamCredits.tippers
                .sort((a, b) => b.amount - a.amount)
                .map((tipper, i) => (
                  <p key={i} className="text-4xl text-white">
                    {tipper.name} - ${tipper.amount.toFixed(2)}
                  </p>
                ))}
            </div>
          </div>
        )}

        {/* Bits */}
        {hasCheerers && (
          <div className="mb-12">
            <h2 className="text-5xl font-bold text-white mb-6">Bits</h2>
            <div className="space-y-3">
              {streamCredits.cheerers
                .sort((a, b) => b.bits - a.bits)
                .map((cheerer, i) => (
                  <p key={i} className="text-4xl text-white">
                    {cheerer.name} - {cheerer.bits} bits
                  </p>
                ))}
            </div>
          </div>
        )}

        {/* Raiders */}
        {hasRaiders && (
          <div className="mb-12">
            <h2 className="text-5xl font-bold text-white mb-6">Raiders</h2>
            <div className="space-y-3">
              {streamCredits.raiders.map((raider, i) => (
                <p key={i} className="text-4xl text-white">
                  {raider.name} {raider.viewers > 0 && `(${raider.viewers})`}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Merch Buyers */}
        {hasMerchBuyers && (
          <div className="mb-12">
            <h2 className="text-5xl font-bold text-white mb-6">Merch Supporters</h2>
            <div className="space-y-3">
              {streamCredits.merchBuyers
                .sort((a, b) => b.amount - a.amount)
                .map((buyer, i) => (
                  <p key={i} className="text-4xl text-white">
                    {buyer.name} - {buyer.items.join(", ")}
                  </p>
                ))}
            </div>
          </div>
        )}

        {/* Charity Donors */}
        {hasCharityDonors && (
          <div className="mb-12">
            <h2 className="text-5xl font-bold text-white mb-6">Charity Donors</h2>
            <div className="space-y-3">
              {streamCredits.charityDonors
                .sort((a, b) => b.amount - a.amount)
                .map((donor, i) => (
                  <p key={i} className="text-4xl text-white">
                    {donor.name} - ${donor.amount}
                  </p>
                ))}
            </div>
          </div>
        )}

        {/* Channel Point Redeemers */}
        {hasRedeemers && (
          <div className="mb-12">
            <h2 className="text-5xl font-bold text-white mb-6">Channel Redeemers</h2>
            <div className="space-y-3">
              {streamCredits.redeemers.map((redeemer, i) => (
                <p key={i} className="text-4xl text-white">
                  {redeemer.name} - {redeemer.redeems.length} redeem{redeemer.redeems.length > 1 ? "s" : ""}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Flowerboard - top pickers this stream */}
        {hasLegends && (
          <div className="mb-12">
            <h2 className="text-5xl font-bold text-white mb-6">Flowerboard</h2>
            <p className="text-3xl text-white mb-4">Top pickers this stream</p>
            <div className="space-y-3">
              {flowerLegends
                .sort((a, b) => b.count - a.count)
                .map((legend, i) => (
                  <p key={i} className="text-4xl text-white">
                    {legend.username} - {legend.count}
                  </p>
                ))}
            </div>
          </div>
        )}

        {/* All-Time Guild of Guardians */}
        {hasGuardians && (
          <div className="mb-12">
            <h2 className="text-5xl font-bold mb-6 text-white">
              Guild of Guardians
            </h2>
            <p className="text-3xl text-white mb-4">All-Time (50+ flowers)</p>
            <div className="space-y-3">
              {guardians
                .sort((a, b) => b.flower_count - a.flower_count)
                .map((guardian) => (
                <p key={guardian.id} className="text-4xl text-white">
                  {guardian.username} - {guardian.flower_count}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* End Credits */}
        <div className="mt-20 mb-24">
          <p className="text-4xl text-white mb-4">Thank you all for your kind support!</p>
          <p className="text-4xl text-white">See you next stream!</p>
        </div>
      </div>
    </div>
  )
}
