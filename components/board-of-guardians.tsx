"use client"

import { useEffect, useState } from "react"
import { Shield } from "lucide-react"

interface Guardian {
  id: string
  username: string
  achieved_at: string
  flower_count: number
}

interface BoardOfGuardiansProps {
  isVisible: boolean
  onHide: () => void
}

export function BoardOfGuardians({ isVisible, onHide }: BoardOfGuardiansProps) {
  const [guardians, setGuardians] = useState<Guardian[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isVisible) {
      fetchGuardians()
      // Auto-hide after 20 seconds
      const timer = setTimeout(() => {
        onHide()
      }, 20000)
      return () => clearTimeout(timer)
    }
  }, [isVisible, onHide])

  const fetchGuardians = async () => {
    try {
      const response = await fetch("/api/guardians")
      const data = await response.json()
      if (data.guardians) {
        setGuardians(data.guardians)
      }
    } catch (error) {
      console.error("Error fetching guardians:", error)
    } finally {
      setLoading(false)
    }
  }

  if (!isVisible) return null

  return (
    <div className="fixed left-8 top-1/2 -translate-y-1/2 z-50 pointer-events-none flex items-center gap-4">
      {/* Left Knight */}
      <img src="/images/pixel-knight.gif" alt="Knight" className="w-32 h-32 pointer-events-none" />
      
      <div
        className="rounded-lg p-8 w-[480px] max-h-[80vh] overflow-y-auto pointer-events-auto"
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          border: "2px solid #ffd700",
          boxShadow: "0 0 20px rgba(255, 215, 0, 0.2)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <h2
            className="text-3xl font-black text-center font-sans uppercase tracking-wider"
            style={{
              background: "linear-gradient(135deg, #ffd700 0%, #ffec80 50%, #ffd700 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Guild of Guardians
          </h2>
        </div>

        <p className="text-center text-yellow-200/80 mb-6 font-sans text-xl font-black uppercase">
          Protectors of the Gardenverse (50+)
        </p>

        {loading ? (
          <p className="text-center text-white font-sans text-2xl font-black">LOADING...</p>
        ) : guardians.length === 0 ? (
          <p className="text-center text-gray-400 font-sans text-2xl font-black uppercase">
            No guardians yet!
          </p>
        ) : (
          <div className="space-y-4">
            {guardians.map((guardian, index) => (
              <div
                key={guardian.id}
                className="flex items-center justify-between"
              >
                <div className="flex items-center space-x-4">
                  <span
                    className="text-3xl font-black font-sans"
                    style={{ color: index === 0 ? "#ffd700" : "#ffffff" }}
                  >
                    {index + 1}.
                  </span>
                  <span
                    className="text-3xl font-black font-sans uppercase"
                    style={{ color: index === 0 ? "#ffd700" : "#ffffff" }}
                  >
                    {guardian.username}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">🛡️</span>
                  <span className="text-3xl font-black text-green-400 font-sans">
                    {guardian.flower_count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-white/30">
          <p className="text-center text-2xl font-black text-white/80 font-sans uppercase">
            {guardians.length} Guardian{guardians.length !== 1 ? "s" : ""} Total
          </p>
        </div>
      </div>

      {/* Right Knight (mirrored) */}
      <img src="/images/pixel-knight.gif" alt="Knight" className="w-32 h-32 pointer-events-none" style={{ transform: "scaleX(-1)" }} />
    </div>
  )
}

export default BoardOfGuardians
