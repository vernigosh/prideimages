"use client"

import { useState, useEffect } from "react"

interface FlowerLeaderboardProps {
  isVisible: boolean
  onHide: () => void
}

export function FlowerLeaderboard({ isVisible, onHide }: FlowerLeaderboardProps) {
  const [leaderboardData, setLeaderboardData] = useState<{ username: string; count: number }[]>([])

  useEffect(() => {
    if (!isVisible) return

    const handleShowLeaderboard = (event: CustomEvent) => {
      const { userPickedTotals } = event.detail

      // Convert userPickedTotals object to sorted array of top 4
      const sortedUsers = Object.entries(userPickedTotals)
        .map(([username, count]) => ({ username, count: count as number }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 4) // Top 4 only

      setLeaderboardData(sortedUsers)
    }

    window.addEventListener("showLeaderboard", handleShowLeaderboard as EventListener)

    // Auto-hide after 15 seconds
    const hideTimer = setTimeout(() => {
      onHide()
    }, 15000)

    return () => {
      window.removeEventListener("showLeaderboard", handleShowLeaderboard as EventListener)
      clearTimeout(hideTimer)
    }
  }, [isVisible, onHide])

  if (!isVisible) return null

  return (
    <div className="fixed top-32 right-8 z-50 pointer-events-none">
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 shadow-2xl">
        <div className="text-center mb-4">
          <h2 className="text-3xl font-bold text-white font-sans uppercase">🏆 FLOWER CHAMPIONS 🏆</h2>
        </div>

        <div className="space-y-3">
          {leaderboardData.length === 0 ? (
            <div className="text-center text-white font-sans text-xl">NO FLOWERS PICKED YET!</div>
          ) : (
            leaderboardData.map((user, index) => (
              <div
                key={user.username}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  index === 0
                    ? "bg-yellow-500/30 border border-yellow-400/50" // Gold for 1st
                    : index === 1
                      ? "bg-gray-300/30 border border-gray-400/50" // Silver for 2nd
                      : index === 2
                        ? "bg-orange-600/30 border border-orange-500/50" // Bronze for 3rd
                        : "bg-white/20 border border-white/30" // Regular for 4th
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl font-bold text-white font-sans">
                    {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "4️⃣"}
                  </span>
                  <span className="text-xl font-bold text-white font-sans uppercase">{user.username}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">🌸</span>
                  <span className="text-2xl font-bold text-white font-sans">{user.count}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="text-center mt-4 text-sm text-white/70 font-sans">LIFETIME FLOWERS PICKED</div>
      </div>
    </div>
  )
}

export default FlowerLeaderboard
