"use client"

import { useState, useEffect, useRef } from "react"

interface Player {
  username: string
  team: "pink" | "green"
  lastAction: number
}

interface ColorWarProps {
  isVisible: boolean
  onConnectionChange: (connected: boolean) => void
  onHide: () => void
}

export function ColorWar({ isVisible, onConnectionChange, onHide }: ColorWarProps) {
  const [players, setPlayers] = useState<Player[]>([])
  const [pinkScore, setPinkScore] = useState(50) // Territory percentage (0-100)
  const [greenScore, setGreenScore] = useState(50)
  const [battleActive, setBattleActive] = useState(false)
  const [lastBattleTime, setLastBattleTime] = useState(0)
  const [winner, setWinner] = useState<"pink" | "green" | null>(null)
  const [battleAnimation, setBattleAnimation] = useState<"pink-attack" | "green-attack" | "clash" | null>(null)
  const [gameStats, setGameStats] = useState({
    pinkAttacks: 0,
    greenAttacks: 0,
    totalBattles: 0,
  })

  const battleCooldown = 3000 // 3 seconds between battles
  const animationRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const handleJoinTeam = (event: CustomEvent) => {
      const { username, team } = event.detail
      console.log(`Color War: ${username} joining ${team} team`)

      setPlayers((prev) => {
        // Remove player from any existing team first
        const filtered = prev.filter((p) => p.username !== username)
        // Add to new team
        return [...filtered, { username, team, lastAction: Date.now() }]
      })
    }

    const handleAttack = (event: CustomEvent) => {
      const { username, team } = event.detail
      const now = Date.now()

      if (now - lastBattleTime < battleCooldown) {
        console.log("Color War: Battle on cooldown")
        return
      }

      console.log(`Color War: ${username} (${team}) attacking!`)

      // Update player's last action
      setPlayers((prev) => prev.map((p) => (p.username === username ? { ...p, lastAction: now } : p)))

      // Calculate team strengths (active players in last 30 seconds)
      const activeTime = now - 30000
      const activePink = players.filter((p) => p.team === "pink" && p.lastAction > activeTime).length
      const activeGreen = players.filter((p) => p.team === "green" && p.lastAction > activeTime).length

      // Battle calculation
      const pinkPower = activePink + Math.random() * 3 // Add some randomness
      const greenPower = activeGreen + Math.random() * 3

      let scoreChange = 0
      let animation: "pink-attack" | "green-attack" | "clash" = "clash"

      if (pinkPower > greenPower) {
        scoreChange = Math.min(10, Math.ceil((pinkPower - greenPower) * 2))
        animation = "pink-attack"
        setGameStats((prev) => ({ ...prev, pinkAttacks: prev.pinkAttacks + 1, totalBattles: prev.totalBattles + 1 }))
      } else if (greenPower > pinkPower) {
        scoreChange = -Math.min(10, Math.ceil((greenPower - pinkPower) * 2))
        animation = "green-attack"
        setGameStats((prev) => ({ ...prev, greenAttacks: prev.greenAttacks + 1, totalBattles: prev.totalBattles + 1 }))
      } else {
        scoreChange = 0
        animation = "clash"
        setGameStats((prev) => ({ ...prev, totalBattles: prev.totalBattles + 1 }))
      }

      // Apply score changes
      setPinkScore((prev) => {
        const newScore = Math.max(0, Math.min(100, prev + scoreChange))
        if (newScore <= 0) setWinner("green")
        else if (newScore >= 100) setWinner("pink")
        return newScore
      })

      setGreenScore((prev) => Math.max(0, Math.min(100, prev - scoreChange)))

      // Set animation and battle state
      setBattleAnimation(animation)
      setBattleActive(true)
      setLastBattleTime(now)

      // Clear animation after 2 seconds
      if (animationRef.current) clearTimeout(animationRef.current)
      animationRef.current = setTimeout(() => {
        setBattleAnimation(null)
        setBattleActive(false)
      }, 2000)
    }

    const handleResetWar = (event: CustomEvent) => {
      console.log("Color War: Resetting game", event.detail)
      setPlayers([])
      setPinkScore(50)
      setGreenScore(50)
      setWinner(null)
      setBattleActive(false)
      setBattleAnimation(null)
      setGameStats({ pinkAttacks: 0, greenAttacks: 0, totalBattles: 0 })
    }

    const handleHideWar = (event: CustomEvent) => {
      console.log("Color War: Hiding game", event.detail)
      onHide()
    }

    window.addEventListener("joinColorTeam", handleJoinTeam as EventListener)
    window.addEventListener("colorWarAttack", handleAttack as EventListener)
    window.addEventListener("resetColorWar", handleResetWar as EventListener)
    window.addEventListener("hideColorWar", handleHideWar as EventListener)

    // Set connected status
    onConnectionChange(isVisible)

    return () => {
      window.removeEventListener("joinColorTeam", handleJoinTeam as EventListener)
      window.removeEventListener("colorWarAttack", handleAttack as EventListener)
      window.removeEventListener("resetColorWar", handleResetWar as EventListener)
      window.removeEventListener("hideColorWar", handleHideWar as EventListener)
      if (animationRef.current) clearTimeout(animationRef.current)
    }
  }, [isVisible, onConnectionChange, onHide, players, lastBattleTime])

  if (!isVisible) return null

  const pinkTeam = players.filter((p) => p.team === "pink")
  const greenTeam = players.filter((p) => p.team === "green")
  const now = Date.now()
  const activePink = pinkTeam.filter((p) => now - p.lastAction < 30000).length
  const activeGreen = greenTeam.filter((p) => now - p.lastAction < 30000).length

  if (winner) {
    return (
      <div className="absolute inset-0 flex items-center justify-center z-30">
        <div
          className="text-center p-8 rounded-3xl border-4 border-black shadow-2xl animate-pulse"
          style={{
            backgroundColor: winner === "pink" ? "#ffb8ad" : "#32cd32",
            color: winner === "pink" ? "#000" : "#fff",
          }}
        >
          <div className="text-6xl font-black mb-4 uppercase font-sans">
            {winner === "pink" ? "🌸 PINK TEAM WINS! 🌸" : "💚 GREEN TEAM WINS! 💚"}
          </div>
          <div className="text-2xl font-bold mb-4">TOTAL DOMINATION ACHIEVED!</div>
          <div className="text-lg">
            Final Score: Pink {pinkScore}% - Green {greenScore}%
          </div>
          <div className="text-sm mt-4 opacity-75">Game will reset in 10 seconds...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center z-20">
      <div className="w-full max-w-4xl mx-8">
        {/* Main Battle Arena */}
        <div className="relative">
          {/* Territory Bar */}
          <div className="h-20 border-4 border-black rounded-2xl overflow-hidden mb-6 relative">
            {/* Pink Territory */}
            <div
              className="absolute left-0 top-0 h-full transition-all duration-1000 ease-out flex items-center justify-center"
              style={{
                width: `${pinkScore}%`,
                backgroundColor: "#ffb8ad",
                boxShadow: battleAnimation === "pink-attack" ? "0 0 30px #ffb8ad" : "none",
              }}
            >
              <span className="font-black text-black text-xl">PINK {pinkScore}%</span>
            </div>

            {/* Green Territory */}
            <div
              className="absolute right-0 top-0 h-full transition-all duration-1000 ease-out flex items-center justify-center"
              style={{
                width: `${greenScore}%`,
                backgroundColor: "#32cd32",
                boxShadow: battleAnimation === "green-attack" ? "0 0 30px #32cd32" : "none",
              }}
            >
              <span className="font-black text-white text-xl">GREEN {greenScore}%</span>
            </div>

            {/* Battle Line */}
            <div
              className="absolute top-0 h-full w-1 bg-black transition-all duration-1000"
              style={{ left: `${pinkScore}%` }}
            />

            {/* Battle Animation Effects */}
            {battleAnimation && (
              <div className="absolute inset-0 flex items-center justify-center">
                {battleAnimation === "pink-attack" && (
                  <div className="text-4xl font-black text-black animate-bounce">🌸 PINK SURGE! 🌸</div>
                )}
                {battleAnimation === "green-attack" && (
                  <div className="text-4xl font-black text-white animate-bounce">💚 GREEN CHARGE! 💚</div>
                )}
                {battleAnimation === "clash" && (
                  <div className="text-4xl font-black text-yellow-400 animate-pulse">⚔️ CLASH! ⚔️</div>
                )}
              </div>
            )}
          </div>

          {/* Team Stats */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Pink Team */}
            <div className="p-4 rounded-xl border-3 border-black" style={{ backgroundColor: "#ffb8ad" }}>
              <h3 className="text-2xl font-black text-black mb-2">🌸 PINK ARMY</h3>
              <div className="text-black font-bold">
                <div>Total Soldiers: {pinkTeam.length}</div>
                <div>Active Warriors: {activePink}</div>
                <div>Successful Attacks: {gameStats.pinkAttacks}</div>
              </div>
              {pinkTeam.length > 0 && (
                <div className="mt-2 text-xs text-black/70">
                  Latest:{" "}
                  {pinkTeam
                    .slice(-3)
                    .map((p) => p.username)
                    .join(", ")}
                </div>
              )}
            </div>

            {/* Green Team */}
            <div className="p-4 rounded-xl border-3 border-black" style={{ backgroundColor: "#32cd32" }}>
              <h3 className="text-2xl font-black text-white mb-2">💚 GREEN FORCE</h3>
              <div className="text-white font-bold">
                <div>Total Soldiers: {greenTeam.length}</div>
                <div>Active Warriors: {activeGreen}</div>
                <div>Successful Attacks: {gameStats.greenAttacks}</div>
              </div>
              {greenTeam.length > 0 && (
                <div className="mt-2 text-xs text-white/70">
                  Latest:{" "}
                  {greenTeam
                    .slice(-3)
                    .map((p) => p.username)
                    .join(", ")}
                </div>
              )}
            </div>
          </div>

          {/* Battle Status */}
          <div className="text-center p-4 bg-black text-white rounded-xl border-2 border-white">
            <h2 className="text-3xl font-black mb-2 uppercase">⚔️ COLOR WAR ACTIVE ⚔️</h2>
            <div className="text-lg font-bold mb-2">
              {battleActive ? "🔥 BATTLE IN PROGRESS! 🔥" : "💬 Waiting for commands..."}
            </div>
            <div className="text-sm opacity-75">
              Total Battles: {gameStats.totalBattles} | Next battle ready:{" "}
              {lastBattleTime + battleCooldown > Date.now()
                ? `${Math.ceil((lastBattleTime + battleCooldown - Date.now()) / 1000)}s`
                : "NOW"}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
