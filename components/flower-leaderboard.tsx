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

  return (
    <div className="fixed top-32 right-8 z-50 pointer-events-none">
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 shadow-2xl">
        <div className="text-center mb-3">
          <h2 className="text-2xl font-black text-white font-sans uppercase">TODAY'S TOP PICKERS</h2>
        </div>

        <div className="space-y-2">
          {leaderboardData.length === 0 ? (
            <div className="text-center text-2xl font-black text-white font-sans uppercase">NO FLOWERS PICKED YET!</div>
          ) : (
            leaderboardData.map((user, index) => (
              <div key={user.username} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-black text-white font-sans">{index + 1}.</span>
                  <span className="text-2xl font-black text-white font-sans uppercase">{user.username}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xl">🌸</span>
                  <span className="text-2xl font-black text-white font-sans">{user.count}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default FlowerLeaderboard
