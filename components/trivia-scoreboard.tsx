"use client"

import { useState, useEffect } from "react"

interface TriviaScoreboardProps {
  isVisible: boolean
  onHide: () => void
}

export function TriviaScoreboard({ isVisible, onHide }: TriviaScoreboardProps) {
  const [scoreboardData, setScoreboardData] = useState<{ username: string; score: number }[]>([])

  useEffect(() => {
    const handleShowScoreboard = (event: CustomEvent) => {
      const { scores, testData } = event.detail

      // Use test data if provided, otherwise use real data
      const dataToUse = testData || scores || {}

      // Convert data object to sorted array of top 4
      const sortedUsers = Object.entries(dataToUse)
        .map(([username, score]) => ({ username, score: score as number }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 4) // Top 4 only

      setScoreboardData(sortedUsers)
    }

    window.addEventListener("triviaScoreboardData", handleShowScoreboard as EventListener)

    return () => {
      window.removeEventListener("triviaScoreboardData", handleShowScoreboard as EventListener)
    }
  }, [])

  useEffect(() => {
    if (!isVisible) return

    const hideTimer = setTimeout(() => {
      onHide()
    }, 15000)

    return () => {
      clearTimeout(hideTimer)
    }
  }, [isVisible, onHide])

  if (!isVisible) return null

  const totalCorrect = scoreboardData.reduce((sum, user) => sum + user.score, 0)

  return (
    <div className="fixed left-8 top-1/2 -translate-y-1/2 z-50 pointer-events-none">
      <div 
        className="backdrop-blur-sm rounded-lg p-8 border-2 border-black shadow-2xl w-[480px]"
        style={{
          background: "linear-gradient(135deg, rgba(255,229,229,0.95) 0%, rgba(255,245,229,0.95) 25%, rgba(240,255,229,0.95) 50%, rgba(229,245,255,0.95) 75%, rgba(240,229,255,0.95) 100%)",
        }}
      >
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2">
            <span className="text-3xl">🏳️‍🌈</span>
            <h2 className="text-3xl font-black text-black font-sans uppercase tracking-wider">TRIVIA CHAMPIONS</h2>
            <span className="text-3xl">🏳️‍🌈</span>
          </div>
        </div>

        <div className="space-y-4">
          {scoreboardData.length === 0 ? (
            <div className="text-center text-2xl font-black text-black font-sans uppercase">NO SCORES YET!</div>
          ) : (
            scoreboardData.map((user, index) => (
              <div key={user.username} className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-3xl font-black text-black font-sans">
                    {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}.`}
                  </span>
                  <span className="text-3xl font-black text-black font-sans uppercase">{user.username}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">✨</span>
                  <span className="text-3xl font-black text-black font-sans">{user.score}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {scoreboardData.length > 0 && (
          <div className="mt-6 pt-6 border-t-2 border-black/30">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-black/80 font-sans uppercase">Total Correct:</span>
              <div className="flex items-center space-x-3">
                <span className="text-2xl">✨</span>
                <span className="text-3xl font-black text-black font-sans">{totalCorrect}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TriviaScoreboard
