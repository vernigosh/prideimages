"use client"

import { useState, useEffect, useLayoutEffect, useRef } from "react"

interface FlowerLeaderboardProps {
  isVisible: boolean
  onHide: () => void
}

type LeaderboardEntry = { username: string; count: number }

const MIN_VISIBLE_MS = 15000
const SCROLL_START_DELAY_MS = 2500
const SCROLL_END_HOLD_MS = 4000
const SCROLL_PX_PER_SECOND = 45

export function FlowerLeaderboard({ isVisible, onHide }: FlowerLeaderboardProps) {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([])
  const [scrollDistance, setScrollDistance] = useState(0)
  const [isScrolling, setIsScrolling] = useState(false)
  const viewportRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLOListElement>(null)

  useEffect(() => {
    const handleShowLeaderboard = (event: CustomEvent) => {
      const { userPickedTotals, testData } = event.detail ?? {}
      const dataToUse: Record<string, number> = testData || userPickedTotals || {}

      const sortedUsers = Object.entries(dataToUse)
        .map(([username, count]) => ({ username, count: Number(count) || 0 }))
        .filter((user) => user.count > 0)
        .sort((a, b) => b.count - a.count || a.username.localeCompare(b.username))

      setIsScrolling(false)
      setLeaderboardData(sortedUsers)
    }

    window.addEventListener("leaderboardData", handleShowLeaderboard as EventListener)
    return () => window.removeEventListener("leaderboardData", handleShowLeaderboard as EventListener)
  }, [])

  useLayoutEffect(() => {
    const viewport = viewportRef.current
    const list = listRef.current
    if (!viewport || !list) {
      setScrollDistance(0)
      return
    }
    setScrollDistance(Math.max(0, list.scrollHeight - viewport.clientHeight))
  }, [leaderboardData, isVisible])

  const scrollDurationMs = (scrollDistance / SCROLL_PX_PER_SECOND) * 1000

  useEffect(() => {
    if (!isVisible || scrollDistance === 0) return
    const startTimer = setTimeout(() => setIsScrolling(true), SCROLL_START_DELAY_MS)
    return () => clearTimeout(startTimer)
  }, [isVisible, scrollDistance])

  useEffect(() => {
    if (!isVisible) return
    const visibleFor =
      scrollDistance > 0
        ? Math.max(MIN_VISIBLE_MS, SCROLL_START_DELAY_MS + scrollDurationMs + SCROLL_END_HOLD_MS)
        : MIN_VISIBLE_MS
    const hideTimer = setTimeout(onHide, visibleFor)
    return () => clearTimeout(hideTimer)
  }, [isVisible, onHide, scrollDistance, scrollDurationMs])

  if (!isVisible) return null

  const totalFlowersPicked = leaderboardData.reduce((sum, user) => sum + user.count, 0)
  const hasOverflow = scrollDistance > 0

  return (
    <div className="fixed left-8 top-1/2 -translate-y-1/2 z-50 pointer-events-none">
      <div className="bg-black/70 backdrop-blur-sm rounded-lg p-8 border border-white/30 shadow-2xl w-[480px]">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-black text-white font-sans uppercase">{"TODAY'S TOP PICKERS"}</h2>
          {leaderboardData.length > 0 && (
            <p className="mt-1 text-lg font-bold text-white/70 font-sans uppercase">
              {leaderboardData.length} {leaderboardData.length === 1 ? "picker" : "pickers"}
            </p>
          )}
        </div>

        {leaderboardData.length === 0 ? (
          <div className="text-center text-2xl font-black text-white font-sans uppercase">NO FLOWERS PICKED YET!</div>
        ) : (
          <div
            ref={viewportRef}
            className="max-h-[420px] overflow-hidden"
            style={
              hasOverflow
                ? {
                    maskImage: "linear-gradient(to bottom, transparent 0, black 16px, black calc(100% - 24px), transparent 100%)",
                    WebkitMaskImage:
                      "linear-gradient(to bottom, transparent 0, black 16px, black calc(100% - 24px), transparent 100%)",
                  }
                : undefined
            }
          >
            <ol
              ref={listRef}
              className="flex flex-col gap-4 py-1"
              style={{
                transform: isScrolling ? `translateY(-${scrollDistance}px)` : "translateY(0)",
                transition: isScrolling ? `transform ${scrollDurationMs}ms linear` : "none",
              }}
            >
              {leaderboardData.map((user, index) => (
                <li key={user.username} className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-4">
                    <span className="shrink-0 text-3xl font-black text-white font-sans">{index + 1}.</span>
                    <span className="truncate text-3xl font-black text-white font-sans uppercase">{user.username}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-2xl" aria-hidden="true">
                      🌸
                    </span>
                    <span className="text-3xl font-black text-white font-sans">{user.count}</span>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}

        {leaderboardData.length > 0 && (
          <div className="mt-6 pt-6 border-t border-white/30">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-white/80 font-sans uppercase">Total Today:</span>
              <div className="flex items-center gap-3">
                <span className="text-2xl" aria-hidden="true">
                  🌸
                </span>
                <span className="text-3xl font-black text-white font-sans">{totalFlowersPicked}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default FlowerLeaderboard
