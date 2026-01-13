"use client"

import { useState, useEffect } from "react"

interface FlowerLeaderboardProps {
  isVisible: boolean
  onHide: () => void
}

export function FlowerLeaderboard({ isVisible, onHide }: FlowerLeaderboardProps) {
  const [leaderboardData, setLeaderboardData] = useState<{ username: string; count: number }[]>([])

  useEffect(() => {
    const handleShowLeaderboard = (event: CustomEvent) => {
      console.log("[v0] Leaderboard event received:", event.detail)
      console.log("[v0] Event type:", event.type)
      console.log("[v0] Full event object:", event)

      const { userPickedTotals, testData } = event.detail

      console.log("[v0] userPickedTotals:", userPickedTotals)
      console.log("[v0] testData:", testData)

      // Use test data if provided, otherwise use real data
      const dataToUse = testData || userPickedTotals || {}

      console.log("[v0] Data to use for leaderboard:", dataToUse)
      console.log("[v0] Object.entries result:", Object.entries(dataToUse))

      // Convert data object to sorted array of top 4
      const sortedUsers = Object.entries(dataToUse)
        .map(([username, count]) => ({ username, count: count as number }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 4) // Top 4 only

      console.log("[v0] Sorted leaderboard data:", sortedUsers)
      console.log("[v0] Setting leaderboard data to:", sortedUsers)

      setLeaderboardData(sortedUsers)
    }

    console.log("[v0] Setting up leaderboard event listener")
    window.addEventListener("leaderboardData", handleShowLeaderboard as EventListener)

    return () => {
      console.log("[v0] Removing leaderboard event listener")
      window.removeEventListener("leaderboardData", handleShowLeaderboard as EventListener)
    }
  }, [])

  useEffect(() => {
    if (!isVisible) return

    console.log("[v0] Leaderboard is visible, setting hide timer")
    const hideTimer = setTimeout(() => {
      console.log("[v0] Hiding leaderboard after 15 seconds")
      onHide()
    }, 15000)

    return () => {
      clearTimeout(hideTimer)
    }
  }, [isVisible, onHide])

  console.log("[v0] Leaderboard render - isVisible:", isVisible, "leaderboardData:", leaderboardData)

  if (!isVisible) return null

  const totalFlowersPicked = leaderboardData.reduce((sum, user) => sum + user.count, 0)

  return (
    <div className="fixed left-8 top-1/2 -translate-y-1/2 z-50 pointer-events-none">
      <div className="bg-black/70 backdrop-blur-sm rounded-lg p-6 border border-white/30 shadow-2xl w-96">
        <div className="text-center mb-4">
          <h2 className="text-3xl font-black text-white font-sans uppercase tracking-wider">TODAY'S TOP PICKERS</h2>
        </div>

        <div className="space-y-3">
          {leaderboardData.length === 0 ? (
            <div className="text-center text-2xl font-black text-white font-sans uppercase">NO FLOWERS PICKED YET!</div>
          ) : (
            leaderboardData.map((user, index) => (
              <div key={user.username} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl font-black text-white font-sans">{index + 1}.</span>
                  <span className="text-3xl font-black text-white font-sans uppercase">{user.username}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">🌸</span>
                  <span className="text-3xl font-black text-white font-sans">{user.count}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {leaderboardData.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/30">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-white/80 font-sans uppercase">Total Today:</span>
              <div className="flex items-center space-x-2">
                <span className="text-2xl">🌸</span>
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
